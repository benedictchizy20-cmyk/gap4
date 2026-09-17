/* =========================================================
   FUELGAP - PROFESSIONAL SHIFT MANAGEMENT
   REAL BACKEND VERSION
   SUPABASE + EXPRESS
   HTTPONLY COOKIE SESSION
   NO LOCALSTORAGE AUTHENTICATION
   NO LOCALSTORAGE SHIFT DATA

   BACKEND:
   http://localhost:7000

   FRONTEND:
   http://localhost:5500
========================================================= */


/* =========================================================
   API CONFIGURATION
========================================================= */

const FUELGAP_API_BASE_URL =
    window.FUELGAP_API_BASE_URL ||
    "https://gap-backend-ywt2.onrender.com/api";

const SHIFT_API =
    `${FUELGAP_API_BASE_URL}/shifts`;

const STATION_API =
    `${FUELGAP_API_BASE_URL}/stations`;

const STAFF_API =
    `${FUELGAP_API_BASE_URL}/staff`;


/* =========================================================
   SHIFT STATE
========================================================= */

const ShiftsState = {

    shifts: [],

    stations: [],

    staff: [],

    filteredShifts: [],

    searchTerm: "",

    loading: false,

    currentUser: null

};


/* =========================================================
   INITIALIZATION
========================================================= */

function initializeShiftPage() {

    if (window.__fuelGapShiftsInitialized) {
        return;
    }

    window.__fuelGapShiftsInitialized = true;

    initShiftsPage();

}


async function initShiftsPage() {

    try {

        /*
         * Wait for FuelGap utilities/API
         */
        await waitForFuelGapDependencies();


        /*
         * Get authenticated user
         */
        let currentUser = null;

        if (
            window.FuelGapUtils &&
            typeof FuelGapUtils.getCurrentUser === "function"
        ) {

            currentUser =
                await FuelGapUtils.getCurrentUser();

        }
        else if (
            window.FuelGapAPI &&
            typeof FuelGapAPI.getCurrentUser === "function"
        ) {

            currentUser =
                await FuelGapAPI.getCurrentUser();

        }


        /*
         * Authentication check
         */
        if (!currentUser) {

            window.location.href =
                "login.html";

            return;

        }


        ShiftsState.currentUser =
            currentUser;


        /*
         * Permission check
         */
        const role =
            getCurrentUserRole();


        const allowedRoles = [
            "owner",
            "admin",
            "manager",
            "attendant"
        ];


        if (
            !allowedRoles.includes(role)
        ) {

            window.location.href =
                "dashboard.html";

            return;

        }


        /*
         * Wait for application shell
         */
        await waitForPageContent();


        /*
         * Render only inside #pageContent.
         *
         * IMPORTANT:
         * We do NOT replace #app.
         * This keeps the sidebar and navbar.
         */
        renderShiftsPage();


        /*
         * Setup events
         */
        setupShiftEvents();


        /*
         * Load backend data
         */
        await loadShiftData();

    }
    catch (error) {

        console.error(
            "SHIFT PAGE INITIALIZATION ERROR:",
            error
        );

        showToast(
            error.message ||
            "Unable to load shift management.",
            "error"
        );

    }

}


/* =========================================================
   WAIT FOR DEPENDENCIES
========================================================= */

async function waitForFuelGapDependencies() {

    let attempts = 0;

    while (
        attempts < 100
    ) {

        if (
            (
                window.FuelGapUtils &&
                typeof FuelGapUtils.getCurrentUser === "function"
            )
            ||
            (
                window.FuelGapAPI &&
                typeof FuelGapAPI.getCurrentUser === "function"
            )
        ) {

            return true;

        }

        await sleep(50);

        attempts++;

    }

    return false;

}


/* =========================================================
   WAIT FOR PAGE CONTENT
========================================================= */

async function waitForPageContent() {

    let attempts = 0;

    while (
        attempts < 100
    ) {

        const pageContent =
            document.getElementById(
                "pageContent"
            );

        if (pageContent) {

            return pageContent;

        }

        await sleep(50);

        attempts++;

    }


    throw new Error(
        "Application page content container was not found."
    );

}


/* =========================================================
   DOM READY
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeShiftPage
    );

}
else {

    initializeShiftPage();

}


/* =========================================================
   SLEEP
========================================================= */

function sleep(
    milliseconds
) {

    return new Promise(
        resolve =>
            setTimeout(
                resolve,
                milliseconds
            )
    );

}


/* =========================================================
   API REQUEST HELPER
========================================================= */

async function shiftApiRequest(
    url,
    options = {}
) {

    try {

        const requestOptions = {

            ...options,

            credentials:
                "include",

            headers: {

                "Content-Type":
                    "application/json",

                ...(options.headers || {})

            }

        };


        const response =
            await fetch(
                url,
                requestOptions
            );


        let data = null;


        try {

            data =
                await response.json();

        }
        catch {

            data = null;

        }


        /*
         * Authentication expired
         */
        if (
            response.status === 401
        ) {

            console.warn(
                "SHIFT API: Session expired."
            );

            window.location.href =
                "login.html";

            return null;

        }


        /*
         * Forbidden
         */
        if (
            response.status === 403
        ) {

            throw new Error(
                data?.message ||
                "You do not have permission to perform this action."
            );

        }


        /*
         * Server error
         */
        if (
            !response.ok
        ) {

            throw new Error(
                data?.message ||
                `Request failed with status ${response.status}`
            );

        }


        return data;

    }
    catch (error) {

        console.error(
            "SHIFT API REQUEST ERROR:",
            error
        );

        throw error;

    }

}


/* =========================================================
   LOAD ALL SHIFT DATA
========================================================= */

async function loadShiftData() {

    ShiftsState.loading =
        true;


    setShiftLoadingState(
        true
    );


    try {

        await Promise.all([
            loadStations(),
            loadStaff(),
            loadShifts()
        ]);


        populateStationFilters();

        populateCreateShiftStations();


        renderShiftStatistics();

        renderShiftTable();

    }
    catch (error) {

        console.error(
            "LOAD SHIFT DATA ERROR:",
            error
        );

        showToast(
            error.message ||
            "Unable to load shift data.",
            "error"
        );

    }
    finally {

        ShiftsState.loading =
            false;

        setShiftLoadingState(
            false
        );

    }

}


/* =========================================================
   LOAD STATIONS
========================================================= */

async function loadStations() {

    const response =
        await shiftApiRequest(
            STATION_API
        );


    if (!response) {

        return;

    }


    /*
     * Support:
     *
     * {
     *   success: true,
     *   data: {
     *      stations: []
     *   }
     * }
     *
     * and older:
     *
     * {
     *   success: true,
     *   data: []
     * }
     */

    let stations = [];


    if (
        Array.isArray(
            response?.data?.stations
        )
    ) {

        stations =
            response.data.stations;

    }
    else if (
        Array.isArray(
            response?.data
        )
    ) {

        stations =
            response.data;

    }
    else if (
        Array.isArray(
            response?.stations
        )
    ) {

        stations =
            response.stations;

    }


    ShiftsState.stations =
        stations
            .map(normalizeStation)
            .filter(Boolean);

}


/* =========================================================
   NORMALIZE STATION
========================================================= */

function normalizeStation(
    station
) {

    if (!station) {

        return null;

    }


    return {

        id:
            station.id ||
            station.station_id,

        name:
            station.name ||
            station.station_name ||
            "Unnamed Station",

        address:
            station.address ||
            "",

        city:
            station.city ||
            "",

        state:
            station.state ||
            "",

        status:
            String(
                station.status ||
                (
                    station.is_active === false
                        ? "inactive"
                        : "active"
                )
            )
                .toLowerCase()
                .trim(),

        is_active:
            station.is_active !== false

    };

}


/* =========================================================
   LOAD STAFF
========================================================= */

async function loadStaff() {

    const response =
        await shiftApiRequest(
            STAFF_API
        );


    if (!response) {

        return;

    }


    let staff = [];


    /*
     * Support common backend response shapes.
     */

    if (
        Array.isArray(
            response?.data?.staff
        )
    ) {

        staff =
            response.data.staff;

    }
    else if (
        Array.isArray(
            response?.data?.users
        )
    ) {

        staff =
            response.data.users;

    }
    else if (
        Array.isArray(
            response?.data
        )
    ) {

        staff =
            response.data;

    }
    else if (
        Array.isArray(
            response?.staff
        )
    ) {

        staff =
            response.staff;

    }


    ShiftsState.staff =
        staff
            .map(normalizeStaff)
            .filter(Boolean);

}


/* =========================================================
   NORMALIZE STAFF
========================================================= */

function normalizeStaff(
    staff
) {

    if (!staff) {

        return null;

    }


    return {

        id:
            staff.id ||
            staff.user_id ||
            staff.auth_user_id,

        full_name:
            staff.full_name ||
            staff.name ||
            "Unnamed Staff",

        email:
            staff.email ||
            "",

        phone:
            staff.phone ||
            "",

        role:
            String(
                staff.role ||
                ""
            )
                .toLowerCase()
                .trim(),

        station_id:
            staff.station_id ||
            staff.stationId ||
            null,

        is_active:
            staff.is_active !== false

    };

}


/* =========================================================
   LOAD SHIFTS
========================================================= */

async function loadShifts() {

    const response =
        await shiftApiRequest(
            SHIFT_API
        );


    if (!response) {

        return;

    }


    /*
     * IMPORTANT FIX
     *
     * Backend returns:
     *
     * {
     *   success: true,
     *   data: {
     *      shifts: [...]
     *   }
     * }
     */

    let shifts = [];


    if (
        Array.isArray(
            response?.data?.shifts
        )
    ) {

        shifts =
            response.data.shifts;

    }
    else if (
        Array.isArray(
            response?.data
        )
    ) {

        shifts =
            response.data;

    }
    else if (
        Array.isArray(
            response?.shifts
        )
    ) {

        shifts =
            response.shifts;

    }


    ShiftsState.shifts =
        shifts
            .map(normalizeShift)
            .filter(Boolean);


    applyShiftFilters();

}


/* =========================================================
   NORMALIZE SHIFT
========================================================= */

function normalizeShift(
    shift
) {

    if (!shift) {

        return null;

    }


    return {

        id:
            shift.id,

        station_id:
            shift.station_id ||
            null,

        station:
            shift.station ||
            null,

        opened_by:
            shift.opened_by ||
            null,

        closed_by:
            shift.closed_by ||
            null,

        shift_name:
            shift.shift_name ||
            "Unnamed Shift",

        shift_date:
            shift.shift_date ||
            "",

        shift_time:
            shift.shift_time ||
            shift.start_time ||
            "",

        end_shift:
            shift.end_shift ||
            shift.end_time ||
            "",

        status:
            String(
                shift.status ||
                "scheduled"
            )
                .toLowerCase()
                .trim(),

        created_at:
            shift.created_at ||
            null

    };

}


/* =========================================================
   CURRENT USER ROLE
========================================================= */

function getCurrentUserRole() {

    return String(
        ShiftsState.currentUser?.role ||
        ""
    )
        .toLowerCase()
        .trim();

}


/* =========================================================
   CURRENT USER STATION
========================================================= */

function getCurrentUserStationId() {

    return (
        ShiftsState.currentUser?.station_id ||
        ShiftsState.currentUser?.stationId ||
        null
    );

}


/* =========================================================
   CHECK CAN CREATE
========================================================= */

function canCreateShift() {

    return [
        "owner",
        "admin",
        "manager"
    ].includes(
        getCurrentUserRole()
    );

}


/* =========================================================
   CHECK CAN MANAGE
========================================================= */

function canManageShift() {

    return [
        "owner",
        "admin",
        "manager"
    ].includes(
        getCurrentUserRole()
    );

}


/* =========================================================
   GET VISIBLE STATIONS
========================================================= */

function getVisibleStations() {

    const role =
        getCurrentUserRole();


    /*
     * Owner/Admin
     */
    if (
        role === "owner" ||
        role === "admin"
    ) {

        return [
            ...ShiftsState.stations
        ];

    }


    /*
     * Manager/Attendant
     */
    const stationId =
        getCurrentUserStationId();


    if (
        role === "manager" ||
        role === "attendant"
    ) {

        if (!stationId) {

            return [];

        }


        return ShiftsState.stations.filter(
            station =>
                String(
                    station.id
                ) ===
                String(
                    stationId
                )
        );

    }


    return [];

}


/* =========================================================
   GET VISIBLE STAFF
========================================================= */

function getVisibleStaff() {

    const role =
        getCurrentUserRole();


    /*
     * Only active attendants
     */
    const attendants =
        ShiftsState.staff.filter(
            staff =>
                staff.role === "attendant" &&
                staff.is_active
        );


    /*
     * Owner/Admin
     */
    if (
        role === "owner" ||
        role === "admin"
    ) {

        return attendants;

    }


    /*
     * Manager
     */
    if (
        role === "manager"
    ) {

        const stationId =
            getCurrentUserStationId();


        if (!stationId) {

            return [];

        }


        return attendants.filter(
            staff =>
                String(
                    staff.station_id
                ) ===
                String(
                    stationId
                )
        );

    }


    return [];

}


/* =========================================================
   APPLY FILTERS
========================================================= */

function applyShiftFilters() {

    const search =
        String(
            ShiftsState.searchTerm ||
            ""
        )
            .toLowerCase()
            .trim();


    const role =
        getCurrentUserRole();


    let visibleShifts =
        [
            ...ShiftsState.shifts
        ];


    /*
     * Station restriction
     */
    if (
        role === "manager" ||
        role === "attendant"
    ) {

        const stationId =
            getCurrentUserStationId();


        if (stationId) {

            visibleShifts =
                visibleShifts.filter(
                    shift =>
                        String(
                            shift.station_id
                        ) ===
                        String(
                            stationId
                        )
                );

        }
        else {

            visibleShifts = [];

        }

    }


    /*
     * Search
     */
    if (search) {

        visibleShifts =
            visibleShifts.filter(
                shift => {

                    const station =
                        getStationName(
                            shift.station_id
                        );


                    const searchableText =
                        [
                            shift.shift_name,
                            shift.shift_date,
                            shift.shift_time,
                            shift.status,
                            station
                        ]
                            .join(" ")
                            .toLowerCase();


                    return searchableText.includes(
                        search
                    );

                }
            );

    }


    ShiftsState.filteredShifts =
        visibleShifts;

}


/* =========================================================
   RENDER SHIFT PAGE
========================================================= */

function renderShiftsPage() {

    /*
     * IMPORTANT:
     *
     * Use #pageContent.
     *
     * NEVER replace #app.
     *
     * This preserves:
     * - sidebar
     * - navbar
     * - user menu
     * - application shell
     */

    const pageContent =
        document.getElementById(
            "pageContent"
        );


    if (!pageContent) {

        console.error(
            "Shift page #pageContent element not found."
        );

        return;

    }


    const canCreate =
        canCreateShift();


    pageContent.innerHTML = `

        <style>

            .fuelgap-shifts-page {
                width: 100%;
                max-width: 100%;
            }


            .fuelgap-shifts-page *,
            .fuelgap-shifts-page *::before,
            .fuelgap-shifts-page *::after {
                box-sizing: border-box;
            }


            .shift-page-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 20px;
                margin-bottom: 24px;
            }


            .shift-page-title {
                display: flex;
                align-items: center;
                gap: 14px;
            }


            .shift-page-icon {
                width: 50px;
                height: 50px;
                border-radius: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #fff7cc;
                color: #d99b00;
                font-size: 24px;
                font-weight: 800;
                flex-shrink: 0;
            }


            .shift-page-title h1 {
                margin: 0 0 5px;
                font-size: 27px;
                font-weight: 800;
                color: #151515;
            }


            .shift-page-title p {
                margin: 0;
                color: #777;
                font-size: 14px;
            }


            .shift-btn {
                border: none;
                border-radius: 10px;
                min-height: 42px;
                padding: 0 16px;
                font-weight: 700;
                cursor: pointer;
                transition: .2s ease;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 7px;
                font-size: 14px;
            }


            .shift-btn:disabled {
                opacity: .6;
                cursor: not-allowed;
            }


            .shift-btn-primary {
                background: #f5c400;
                color: #151515;
                box-shadow: 0 5px 15px rgba(245,196,0,.18);
            }


            .shift-btn-primary:hover {
                background: #e8b900;
                transform: translateY(-1px);
            }


            .shift-btn-secondary {
                background: #f5f5f5;
                color: #333;
                border: 1px solid #e4e4e4;
            }


            .shift-btn-secondary:hover {
                background: #ededed;
            }


            .shift-btn-success {
                background: #16834b;
                color: white;
            }


            .shift-btn-danger {
                background: #c93636;
                color: white;
            }


            .shift-btn-warning {
                background: #f5c400;
                color: #151515;
            }


            .shift-btn-sm {
                min-height: 34px;
                padding: 0 11px;
                font-size: 12px;
                border-radius: 8px;
            }


            .shift-stats {
                display: grid;
                grid-template-columns: repeat(4, minmax(0, 1fr));
                gap: 16px;
                margin-bottom: 22px;
            }


            .shift-stat-card {
                background: white;
                border: 1px solid #ececec;
                border-radius: 15px;
                padding: 19px;
                display: flex;
                align-items: center;
                gap: 14px;
                box-shadow: 0 5px 20px rgba(0,0,0,.035);
            }


            .shift-stat-icon {
                width: 45px;
                height: 45px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #fff8d7;
                color: #c59600;
                font-weight: 900;
                font-size: 18px;
            }


            .shift-stat-card span {
                display: block;
                color: #777;
                font-size: 12px;
                margin-bottom: 4px;
            }


            .shift-stat-card strong {
                display: block;
                color: #161616;
                font-size: 23px;
                font-weight: 800;
            }


            .shift-card {
                background: white;
                border: 1px solid #eaeaea;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 5px 22px rgba(0,0,0,.035);
            }


            .shift-card-header {
                padding: 19px 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 15px;
                border-bottom: 1px solid #eeeeee;
            }


            .shift-card-header h2 {
                margin: 0 0 4px;
                font-size: 18px;
                color: #191919;
            }


            .shift-card-header p {
                margin: 0;
                color: #777;
                font-size: 13px;
            }


            .shift-filters {
                display: grid;
                grid-template-columns: minmax(220px, 1fr) 170px 200px;
                gap: 12px;
                padding: 17px 20px;
                border-bottom: 1px solid #eeeeee;
                background: #fff;
            }


            .shift-search {
                position: relative;
            }


            .shift-search-icon {
                position: absolute;
                left: 13px;
                top: 50%;
                transform: translateY(-50%);
                color: #999;
                pointer-events: none;
            }


            .shift-form-control {
                width: 100%;
                height: 42px;
                border: 1px solid #dddddd;
                border-radius: 9px;
                padding: 0 12px;
                background: white;
                color: #222;
                font-family: inherit;
                outline: none;
                transition: .2s ease;
            }


            .shift-search .shift-form-control {
                padding-left: 38px;
            }


            .shift-form-control:focus {
                border-color: #e4b600;
                box-shadow: 0 0 0 3px rgba(245,196,0,.12);
            }


            .shift-table-wrapper {
                width: 100%;
                overflow-x: auto;
                position: relative;
            }


            .shift-table-wrapper.loading {
                opacity: .55;
                pointer-events: none;
            }


            .shift-table {
                width: 100%;
                min-width: 850px;
                border-collapse: collapse;
            }


            .shift-table th {
                text-align: left;
                padding: 13px 18px;
                background: #fafafa;
                border-bottom: 1px solid #e9e9e9;
                color: #777;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: .04em;
                white-space: nowrap;
            }


            .shift-table td {
                padding: 15px 18px;
                border-bottom: 1px solid #f0f0f0;
                font-size: 13px;
                color: #444;
                vertical-align: middle;
            }


            .shift-table tbody tr:hover {
                background: #fffdf2;
            }


            .shift-primary {
                font-weight: 750;
                color: #171717;
            }


            .shift-secondary {
                display: block;
                color: #999;
                font-size: 11px;
                margin-top: 3px;
            }


            .shift-actions {
                display: flex;
                align-items: center;
                flex-wrap: wrap;
                gap: 6px;
            }


            .shift-status {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 5px 9px;
                border-radius: 999px;
                font-size: 11px;
                font-weight: 750;
                text-transform: capitalize;
            }


            .shift-status::before {
                content: "";
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: currentColor;
            }


            .shift-status-scheduled {
                background: #fff6d4;
                color: #a47a00;
            }


            .shift-status-open {
                background: #e7f7ef;
                color: #16834b;
            }


            .shift-status-closed {
                background: #eeeeee;
                color: #666;
            }


            .shift-status-cancelled {
                background: #fdeaea;
                color: #c93636;
            }


            .shift-empty {
                text-align: center;
                padding: 55px 20px !important;
            }


            .shift-empty-icon {
                width: 55px;
                height: 55px;
                margin: 0 auto 12px;
                border-radius: 50%;
                background: #fff7d5;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #c59600;
                font-size: 22px;
                font-weight: 900;
            }


            .shift-empty h3 {
                margin: 0 0 6px;
                font-size: 16px;
                color: #222;
            }


            .shift-empty p {
                margin: 0;
                color: #999;
                font-size: 13px;
            }


            .shift-modal-overlay {
                position: fixed;
                inset: 0;
                z-index: 9999;
                background: rgba(0,0,0,.48);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }


            .shift-modal-overlay.hidden {
                display: none;
            }


            .shift-modal {
                width: min(620px, 100%);
                max-height: 90vh;
                overflow-y: auto;
                background: white;
                border-radius: 17px;
                box-shadow: 0 25px 70px rgba(0,0,0,.2);
            }


            .shift-modal-header {
                padding: 20px;
                border-bottom: 1px solid #eeeeee;
                display: flex;
                justify-content: space-between;
                gap: 15px;
                align-items: flex-start;
            }


            .shift-modal-header h2 {
                margin: 0 0 5px;
                font-size: 19px;
            }


            .shift-modal-header p {
                margin: 0;
                font-size: 12px;
                color: #888;
            }


            .shift-modal-close {
                width: 34px;
                height: 34px;
                border: none;
                border-radius: 8px;
                background: #f4f4f4;
                color: #555;
                font-size: 22px;
                cursor: pointer;
                line-height: 1;
            }


            .shift-modal-body {
                padding: 20px;
            }


            .shift-form-group {
                margin-bottom: 16px;
            }


            .shift-form-group label {
                display: block;
                margin-bottom: 7px;
                font-size: 12px;
                font-weight: 700;
                color: #333;
            }


            .shift-form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 13px;
            }


            .shift-attendants {
                border: 1px solid #e2e2e2;
                border-radius: 10px;
                padding: 10px;
                max-height: 180px;
                overflow-y: auto;
            }


            .shift-checkbox {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px;
                border-radius: 8px;
                cursor: pointer;
            }


            .shift-checkbox:hover {
                background: #fffbea;
            }


            .shift-checkbox input {
                width: 16px;
                height: 16px;
                accent-color: #f5c400;
                flex-shrink: 0;
            }


            .shift-checkbox strong {
                display: block;
                font-size: 13px;
                color: #222;
            }


            .shift-checkbox small {
                display: block;
                margin-top: 2px;
                color: #999;
                font-size: 11px;
            }


            .shift-muted {
                color: #999;
                font-size: 12px;
                margin: 7px;
            }


            .shift-form-message {
                padding: 10px 12px;
                border-radius: 8px;
                margin-bottom: 15px;
                font-size: 12px;
                line-height: 1.5;
            }


            .shift-form-message.hidden {
                display: none;
            }


            .shift-form-message.error {
                background: #fff0f0;
                color: #b72e2e;
                border: 1px solid #ffd4d4;
            }


            .shift-form-message.success {
                background: #effbf4;
                color: #147441;
                border: 1px solid #d2f0df;
            }


            .shift-modal-footer {
                padding-top: 4px;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }


            .shift-toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 9px;
                width: min(360px, calc(100vw - 40px));
            }


            .shift-toast {
                background: #202020;
                color: white;
                border-radius: 10px;
                padding: 13px 15px;
                font-size: 13px;
                box-shadow: 0 10px 30px rgba(0,0,0,.18);
                animation: shiftToastIn .25s ease;
            }


            .shift-toast-success {
                border-left: 4px solid #16834b;
            }


            .shift-toast-error {
                border-left: 4px solid #c93636;
            }


            @keyframes shiftToastIn {

                from {
                    opacity: 0;
                    transform: translateY(-8px);
                }

                to {
                    opacity: 1;
                    transform: translateY(0);
                }

            }


            @media (max-width: 1000px) {

                .shift-stats {
                    grid-template-columns: repeat(2, 1fr);
                }

                .shift-filters {
                    grid-template-columns: 1fr 1fr;
                }

                .shift-search {
                    grid-column: 1 / -1;
                }

            }


            @media (max-width: 700px) {

                .shift-page-header {
                    align-items: flex-start;
                    flex-direction: column;
                }

                .shift-page-title h1 {
                    font-size: 22px;
                }

                .shift-stats {
                    grid-template-columns: 1fr;
                }

                .shift-filters {
                    grid-template-columns: 1fr;
                }

                .shift-search {
                    grid-column: auto;
                }

                .shift-card-header {
                    align-items: flex-start;
                    flex-direction: column;
                }

                .shift-form-row {
                    grid-template-columns: 1fr;
                }

                .shift-modal-overlay {
                    padding: 10px;
                }

                .shift-modal {
                    max-height: 95vh;
                }

            }

        </style>


        <section class="fuelgap-shifts-page">

            <!-- PAGE HEADER -->

            <div class="shift-page-header">

                <div class="shift-page-title">

                    <div class="shift-page-icon">
                        ↔
                    </div>

                    <div>

                        <h1>
                            Shift Management
                        </h1>

                        <p>
                            Create, monitor and manage fuel station shifts.
                        </p>

                    </div>

                </div>


                ${
                    canCreate
                        ? `
                            <button
                                type="button"
                                class="shift-btn shift-btn-primary"
                                id="createShiftBtn"
                            >
                                <span>+</span>
                                Create Shift
                            </button>
                        `
                        : ""
                }

            </div>


            <!-- STATISTICS -->

            <section
                class="shift-stats"
                id="shiftStats"
            >

                <div class="shift-stat-card">

                    <div class="shift-stat-icon">
                        ↔
                    </div>

                    <div>

                        <span>
                            Total Shifts
                        </span>

                        <strong>
                            0
                        </strong>

                    </div>

                </div>


                <div class="shift-stat-card">

                    <div class="shift-stat-icon">
                        ●
                    </div>

                    <div>

                        <span>
                            Open
                        </span>

                        <strong>
                            0
                        </strong>

                    </div>

                </div>


                <div class="shift-stat-card">

                    <div class="shift-stat-icon">
                        ✓
                    </div>

                    <div>

                        <span>
                            Closed
                        </span>

                        <strong>
                            0
                        </strong>

                    </div>

                </div>


                <div class="shift-stat-card">

                    <div class="shift-stat-icon">
                        !
                    </div>

                    <div>

                        <span>
                            Cancelled
                        </span>

                        <strong>
                            0
                        </strong>

                    </div>

                </div>

            </section>


            <!-- SHIFT RECORDS -->

            <section class="shift-card">

                <div class="shift-card-header">

                    <div>

                        <h2>
                            Shift Records
                        </h2>

                        <p>
                            View and manage your station shifts.
                        </p>

                    </div>


                    <button
                        type="button"
                        class="shift-btn shift-btn-secondary"
                        id="refreshShiftsBtn"
                    >
                        ↻
                        Refresh
                    </button>

                </div>


                <!-- FILTERS -->

                <div class="shift-filters">

                    <div class="shift-search">

                        <span class="shift-search-icon">
                            🔍
                        </span>

                        <input
                            type="search"
                            id="shiftSearch"
                            class="shift-form-control"
                            placeholder="Search shifts..."
                            autocomplete="off"
                        >

                    </div>


                    <select
                        id="shiftStatusFilter"
                        class="shift-form-control"
                    >

                        <option value="">
                            All Statuses
                        </option>

                        <option value="scheduled">
                            Scheduled
                        </option>

                        <option value="open">
                            Open
                        </option>

                        <option value="closed">
                            Closed
                        </option>

                        <option value="cancelled">
                            Cancelled
                        </option>

                    </select>


                    <select
                        id="shiftStationFilter"
                        class="shift-form-control"
                    >

                        <option value="">
                            All Stations
                        </option>

                    </select>

                </div>


                <!-- TABLE -->

                <div
                    class="shift-table-wrapper"
                    id="shiftTableContainer"
                >

                    <table class="shift-table">

                        <thead>

                            <tr>

                                <th>
                                    Shift
                                </th>

                                <th>
                                    Station
                                </th>

                                <th>
                                    Date
                                </th>

                                <th>
                                    Start
                                </th>

                                <th>
                                    End
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Actions
                                </th>

                            </tr>

                        </thead>


                        <tbody
                            id="shiftTableBody"
                        >

                            <tr>

                                <td
                                    colspan="7"
                                    class="shift-empty"
                                >
                                    Loading shifts...
                                </td>

                            </tr>

                        </tbody>

                    </table>

                </div>

            </section>


            ${
                canCreate
                    ? `

                        <!-- CREATE SHIFT MODAL -->

                        <div
                            class="shift-modal-overlay hidden"
                            id="shiftModal"
                        >

                            <div
                                class="shift-modal"
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="shiftModalTitle"
                            >

                                <div class="shift-modal-header">

                                    <div>

                                        <h2 id="shiftModalTitle">
                                            Create Shift
                                        </h2>

                                        <p>
                                            Set up a new station shift and assign attendants.
                                        </p>

                                    </div>


                                    <button
                                        type="button"
                                        class="shift-modal-close"
                                        id="closeShiftModal"
                                        aria-label="Close"
                                    >
                                        ×
                                    </button>

                                </div>


                                <div class="shift-modal-body">

                                    <form
                                        id="createShiftForm"
                                    >

                                        <div class="shift-form-group">

                                            <label for="shiftName">
                                                Shift Name
                                            </label>

                                            <input
                                                type="text"
                                                id="shiftName"
                                                class="shift-form-control"
                                                placeholder="e.g. Morning Shift"
                                                required
                                            >

                                        </div>


                                        <div class="shift-form-group">

                                            <label for="shiftStation">
                                                Station
                                            </label>

                                            <select
                                                id="shiftStation"
                                                class="shift-form-control"
                                                required
                                            >

                                                <option value="">
                                                    Select station
                                                </option>

                                            </select>

                                        </div>


                                        <div class="shift-form-row">

                                            <div class="shift-form-group">

                                                <label for="shiftDate">
                                                    Shift Date
                                                </label>

                                                <input
                                                    type="date"
                                                    id="shiftDate"
                                                    class="shift-form-control"
                                                    required
                                                >

                                            </div>


                                            <div class="shift-form-group">

                                                <label for="shiftStartTime">
                                                    Start Time
                                                </label>

                                                <input
                                                    type="time"
                                                    id="shiftStartTime"
                                                    class="shift-form-control"
                                                    required
                                                >

                                            </div>

                                        </div>


                                        <div class="shift-form-group">

                                            <label for="shiftEndTime">
                                                Expected End Time
                                            </label>

                                            <input
                                                type="time"
                                                id="shiftEndTime"
                                                class="shift-form-control"
                                            >

                                        </div>


                                        <div class="shift-form-group">

                                            <label>
                                                Assign Attendants
                                            </label>

                                            <div
                                                id="shiftAttendants"
                                                class="shift-attendants"
                                            >

                                                <p class="shift-muted">
                                                    Select a station first.
                                                </p>

                                            </div>

                                        </div>


                                        <div
                                            id="shiftFormMessage"
                                            class="shift-form-message hidden"
                                        ></div>


                                        <div class="shift-modal-footer">

                                            <button
                                                type="button"
                                                class="shift-btn shift-btn-secondary"
                                                id="cancelShiftModal"
                                            >
                                                Cancel
                                            </button>


                                            <button
                                                type="submit"
                                                class="shift-btn shift-btn-primary"
                                                id="saveShiftBtn"
                                            >
                                                Create Shift
                                            </button>

                                        </div>

                                    </form>

                                </div>

                            </div>

                        </div>

                    `
                    : ""
            }

        </section>

    `;


    /*
     * Populate initial controls
     */
    populateStationFilters();

    populateCreateShiftStations();

    setDefaultShiftDate();

}


/* =========================================================
   SETUP EVENTS
========================================================= */

function setupShiftEvents() {

    const createShiftBtn =
        document.getElementById(
            "createShiftBtn"
        );


    if (createShiftBtn) {

        createShiftBtn.addEventListener(
            "click",
            openShiftModal
        );

    }


    const closeModalButton =
        document.getElementById(
            "closeShiftModal"
        );


    if (closeModalButton) {

        closeModalButton.addEventListener(
            "click",
            closeShiftModalWindow
        );

    }


    const cancelModalButton =
        document.getElementById(
            "cancelShiftModal"
        );


    if (cancelModalButton) {

        cancelModalButton.addEventListener(
            "click",
            closeShiftModalWindow
        );

    }


    const modal =
        document.getElementById(
            "shiftModal"
        );


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    closeShiftModalWindow();

                }

            }
        );

    }


    const form =
        document.getElementById(
            "createShiftForm"
        );


    if (form) {

        form.addEventListener(
            "submit",
            handleCreateShift
        );

    }


    const stationSelect =
        document.getElementById(
            "shiftStation"
        );


    if (stationSelect) {

        stationSelect.addEventListener(
            "change",
            handleStationChange
        );

    }


    const search =
        document.getElementById(
            "shiftSearch"
        );


    if (search) {

        search.addEventListener(
            "input",
            event => {

                ShiftsState.searchTerm =
                    event.target.value;

                renderShiftTable();

            }
        );

    }


    const statusFilter =
        document.getElementById(
            "shiftStatusFilter"
        );


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            renderShiftTable
        );

    }


    const stationFilter =
        document.getElementById(
            "shiftStationFilter"
        );


    if (stationFilter) {

        stationFilter.addEventListener(
            "change",
            renderShiftTable
        );

    }


    const refresh =
        document.getElementById(
            "refreshShiftsBtn"
        );


    if (refresh) {

        refresh.addEventListener(
            "click",
            async () => {

                refresh.disabled =
                    true;

                refresh.textContent =
                    "Refreshing...";


                try {

                    await loadShiftData();

                    showToast(
                        "Shift data refreshed.",
                        "success"
                    );

                }
                catch (error) {

                    console.error(
                        "REFRESH ERROR:",
                        error
                    );

                }
                finally {

                    refresh.disabled =
                        false;

                    refresh.innerHTML =
                        "↻ Refresh";

                }

            }
        );

    }


    /*
     * Event delegation for shift actions
     */
    document.addEventListener(
        "click",
        handleShiftActionClick
    );


    /*
     * Escape closes modal
     */
    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeShiftModalWindow();

            }

        }
    );

}


/* =========================================================
   SHIFT ACTION CLICK
========================================================= */

async function handleShiftActionClick(
    event
) {

    const button =
        event.target.closest(
            "[data-shift-action]"
        );


    if (!button) {

        return;

    }


    const action =
        button.dataset.shiftAction;


    const shiftId =
        button.dataset.shiftId;


    if (
        !action ||
        !shiftId
    ) {

        return;

    }


    if (
        action === "open"
    ) {

        await openExistingShift(
            shiftId
        );

        return;

    }


    if (
        action === "close"
    ) {

        await closeExistingShift(
            shiftId
        );

        return;

    }


    if (
        action === "cancel"
    ) {

        await cancelExistingShift(
            shiftId
        );

        return;

    }


    if (
        action === "attendants"
    ) {

        await viewShiftAttendants(
            shiftId
        );

    }

}


/* =========================================================
   OPEN CREATE SHIFT MODAL
========================================================= */

function openShiftModal() {

    const modal =
        document.getElementById(
            "shiftModal"
        );


    if (!modal) {

        return;

    }


    const form =
        document.getElementById(
            "createShiftForm"
        );


    if (form) {

        form.reset();

    }


    const message =
        document.getElementById(
            "shiftFormMessage"
        );


    hideFormMessage(
        message
    );


    populateCreateShiftStations();

    setDefaultShiftDate();


    const stationSelect =
        document.getElementById(
            "shiftStation"
        );


    /*
     * If only one station is available,
     * automatically select it.
     */

    if (
        stationSelect &&
        stationSelect.options.length === 2
    ) {

        stationSelect.selectedIndex =
            1;

        handleStationChange();

    }
    else {

        const attendants =
            document.getElementById(
                "shiftAttendants"
            );

        if (attendants) {

            attendants.innerHTML = `
                <p class="shift-muted">
                    Select a station first.
                </p>
            `;

        }

    }


    modal.classList.remove(
        "hidden"
    );

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeShiftModalWindow() {

    const modal =
        document.getElementById(
            "shiftModal"
        );


    if (!modal) {

        return;

    }


    modal.classList.add(
        "hidden"
    );

}


/* =========================================================
   POPULATE STATION FILTER
========================================================= */

function populateStationFilters() {

    const select =
        document.getElementById(
            "shiftStationFilter"
        );


    if (!select) {

        return;

    }


    const stations =
        getVisibleStations();


    select.innerHTML = `
        <option value="">
            All Stations
        </option>
    `;


    stations.forEach(
        station => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                station.id;


            option.textContent =
                station.name;


            select.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   POPULATE CREATE SHIFT STATIONS
========================================================= */

function populateCreateShiftStations() {

    const select =
        document.getElementById(
            "shiftStation"
        );


    if (!select) {

        return;

    }


    const stations =
        getVisibleStations();


    select.innerHTML = `
        <option value="">
            Select station
        </option>
    `;


    stations.forEach(
        station => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                station.id;


            option.textContent =
                station.name;


            select.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   HANDLE STATION CHANGE
========================================================= */

function handleStationChange() {

    const stationSelect =
        document.getElementById(
            "shiftStation"
        );


    const attendantsContainer =
        document.getElementById(
            "shiftAttendants"
        );


    if (
        !stationSelect ||
        !attendantsContainer
    ) {

        return;

    }


    const stationId =
        stationSelect.value;


    if (!stationId) {

        attendantsContainer.innerHTML = `
            <p class="shift-muted">
                Select a station first.
            </p>
        `;

        return;

    }


    const attendants =
        getVisibleStaff().filter(
            staff =>
                String(
                    staff.station_id
                ) ===
                String(
                    stationId
                )
        );


    if (!attendants.length) {

        attendantsContainer.innerHTML = `
            <p class="shift-muted">
                No active attendants are assigned to this station.
            </p>
        `;

        return;

    }


    attendantsContainer.innerHTML =
        attendants
            .map(
                staff => `

                    <label class="shift-checkbox">

                        <input
                            type="checkbox"
                            name="shift_attendants"
                            value="${escapeHtml(
                                staff.id
                            )}"
                        >

                        <span>

                            <strong>
                                ${escapeHtml(
                                    staff.full_name
                                )}
                            </strong>

                            ${
                                staff.email
                                    ? `
                                        <small>
                                            ${escapeHtml(
                                                staff.email
                                            )}
                                        </small>
                                    `
                                    : ""
                            }

                        </span>

                    </label>

                `
            )
            .join("");

}


/* =========================================================
   DEFAULT SHIFT DATE
========================================================= */

function setDefaultShiftDate() {

    const input =
        document.getElementById(
            "shiftDate"
        );


    if (!input) {

        return;

    }


    const today =
        new Date();


    const year =
        today.getFullYear();


    const month =
        String(
            today.getMonth() + 1
        )
            .padStart(
                2,
                "0"
            );


    const day =
        String(
            today.getDate()
        )
            .padStart(
                2,
                "0"
            );


    input.value =
        `${year}-${month}-${day}`;

}


/* =========================================================
   CREATE SHIFT
========================================================= */

async function handleCreateShift(
    event
) {

    event.preventDefault();


    const form =
        event.currentTarget;


    const nameInput =
        document.getElementById(
            "shiftName"
        );


    const stationInput =
        document.getElementById(
            "shiftStation"
        );


    const dateInput =
        document.getElementById(
            "shiftDate"
        );


    const startInput =
        document.getElementById(
            "shiftStartTime"
        );


    const saveButton =
        document.getElementById(
            "saveShiftBtn"
        );


    const message =
        document.getElementById(
            "shiftFormMessage"
        );


    const shiftName =
        nameInput?.value.trim();


    const stationId =
        stationInput?.value;


    const shiftDate =
        dateInput?.value;


    const startTime =
        startInput?.value;


    /*
     * Validation
     */

    if (!shiftName) {

        showFormMessage(
            message,
            "Please enter a shift name.",
            "error"
        );

        return;

    }


    if (!stationId) {

        showFormMessage(
            message,
            "Please select a station.",
            "error"
        );

        return;

    }


    if (!shiftDate) {

        showFormMessage(
            message,
            "Please select a shift date.",
            "error"
        );

        return;

    }


    if (!startTime) {

        showFormMessage(
            message,
            "Please select a start time.",
            "error"
        );

        return;

    }


    /*
     * Check station permission
     */

    const allowedStation =
        getVisibleStations().some(
            station =>
                String(
                    station.id
                ) ===
                String(
                    stationId
                )
        );


    if (!allowedStation) {

        showFormMessage(
            message,
            "You do not have permission to create a shift for this station.",
            "error"
        );

        return;

    }


    /*
     * Selected attendants
     */

    const selectedAttendants =
        Array.from(
            document.querySelectorAll(
                'input[name="shift_attendants"]:checked'
            )
        )
            .map(
                checkbox =>
                    checkbox.value
            )
            .filter(Boolean);


    /*
     * Loading
     */

    if (saveButton) {

        saveButton.disabled =
            true;

        saveButton.textContent =
            "Creating...";

    }


    hideFormMessage(
        message
    );


    try {

        /*
         * Backend createShift expects:
         *
         * station_id
         * shift_name
         * shift_date
         * start_time
         */

        const payload = {

            station_id:
                stationId,

            shift_name:
                shiftName,

            shift_date:
                shiftDate,

            start_time:
                startTime

        };


        const response =
            await shiftApiRequest(
                SHIFT_API,
                {

                    method:
                        "POST",

                    body:
                        JSON.stringify(
                            payload
                        )

                }
            );


        if (!response) {

            return;

        }


        if (
            !response.success
        ) {

            throw new Error(
                response.message ||
                "Unable to create shift."
            );

        }


        /*
         * Get newly created shift
         */

        const createdShift =
            response?.data?.shift ||
            response?.shift ||
            null;


        const createdShiftId =
            createdShift?.id ||
            response?.data?.id ||
            response?.id ||
            null;


        /*
         * Assign attendants AFTER shift creation.
         *
         * This uses the new:
         *
         * POST /api/shifts/:id/attendants
         */

        if (
            createdShiftId &&
            selectedAttendants.length
        ) {

            try {

                const attendantResponse =
                    await shiftApiRequest(
                        `${SHIFT_API}/${encodeURIComponent(
                            createdShiftId
                        )}/attendants`,
                        {

                            method:
                                "POST",

                            body:
                                JSON.stringify({

                                    attendant_ids:
                                        selectedAttendants

                                })

                        }
                    );


                if (
                    !attendantResponse?.success
                ) {

                    throw new Error(
                        attendantResponse?.message ||
                        "Shift was created, but attendants could not be assigned."
                    );

                }

            }
            catch (
                attendantError
            ) {

                console.error(
                    "ATTENDANT ASSIGNMENT ERROR:",
                    attendantError
                );


                showToast(
                    "Shift created, but attendants could not be assigned.",
                    "error"
                );

            }

        }


        /*
         * Success
         */

        showToast(
            "Shift created successfully.",
            "success"
        );


        form.reset();


        setDefaultShiftDate();


        closeShiftModalWindow();


        await loadShiftData();

    }
    catch (error) {

        console.error(
            "CREATE SHIFT ERROR:",
            error
        );


        showFormMessage(
            message,
            error.message ||
            "Unable to create shift.",
            "error"
        );

    }
    finally {

        if (saveButton) {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Create Shift";

        }

    }

}


/* =========================================================
   OPEN EXISTING SHIFT
========================================================= */

async function openExistingShift(
    shiftId
) {

    if (!shiftId) {

        return;

    }


    const confirmed =
        window.confirm(
            "Are you sure you want to open this shift?"
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await shiftApiRequest(
                `${SHIFT_API}/${encodeURIComponent(
                    shiftId
                )}/open`,
                {

                    method:
                        "PATCH"

                }
            );


        if (!response) {

            return;

        }


        if (
            !response.success
        ) {

            throw new Error(
                response.message ||
                "Unable to open shift."
            );

        }


        showToast(
            "Shift opened successfully.",
            "success"
        );


        await loadShiftData();

    }
    catch (error) {

        console.error(
            "OPEN SHIFT ERROR:",
            error
        );


        showToast(
            error.message ||
            "Unable to open shift.",
            "error"
        );

    }

}


/* =========================================================
   CLOSE EXISTING SHIFT
========================================================= */

async function closeExistingShift(
    shiftId
) {

    if (!shiftId) {

        return;

    }


    const confirmed =
        window.confirm(
            "Are you sure you want to close this shift?"
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await shiftApiRequest(
                `${SHIFT_API}/${encodeURIComponent(
                    shiftId
                )}/close`,
                {

                    method:
                        "PATCH"

                }
            );


        if (!response) {

            return;

        }


        if (
            !response.success
        ) {

            throw new Error(
                response.message ||
                "Unable to close shift."
            );

        }


        showToast(
            "Shift closed successfully.",
            "success"
        );


        await loadShiftData();

    }
    catch (error) {

        console.error(
            "CLOSE SHIFT ERROR:",
            error
        );


        showToast(
            error.message ||
            "Unable to close shift.",
            "error"
        );

    }

}


/* =========================================================
   CANCEL EXISTING SHIFT
========================================================= */

async function cancelExistingShift(
    shiftId
) {

    if (!shiftId) {

        return;

    }


    const confirmed =
        window.confirm(
            "Are you sure you want to cancel this shift?"
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await shiftApiRequest(
                `${SHIFT_API}/${encodeURIComponent(
                    shiftId
                )}/cancel`,
                {

                    method:
                        "PATCH"

                }
            );


        if (!response) {

            return;

        }


        if (
            !response.success
        ) {

            throw new Error(
                response.message ||
                "Unable to cancel shift."
            );

        }


        showToast(
            "Shift cancelled successfully.",
            "success"
        );


        await loadShiftData();

    }
    catch (error) {

        console.error(
            "CANCEL SHIFT ERROR:",
            error
        );


        showToast(
            error.message ||
            "Unable to cancel shift.",
            "error"
        );

    }

}


/* =========================================================
   VIEW SHIFT ATTENDANTS
========================================================= */

async function viewShiftAttendants(
    shiftId
) {

    if (!shiftId) {

        return;

    }


    try {

        const response =
            await shiftApiRequest(
                `${SHIFT_API}/${encodeURIComponent(
                    shiftId
                )}/attendants`
            );


        if (!response?.success) {

            throw new Error(
                response?.message ||
                "Unable to load shift attendants."
            );

        }


        const attendants =
            response?.data?.attendants ||
            [];


        if (!attendants.length) {

            showToast(
                "No attendants are assigned to this shift.",
                "success"
            );

            return;

        }


        const names =
            attendants
                .map(
                    attendant =>
                        attendant.full_name ||
                        attendant.name ||
                        attendant.email ||
                        "Unnamed Attendant"
                )
                .join("\n");


        window.alert(
            `Assigned Attendants:\n\n${names}`
        );

    }
    catch (error) {

        console.error(
            "VIEW ATTENDANTS ERROR:",
            error
        );


        showToast(
            error.message ||
            "Unable to load shift attendants.",
            "error"
        );

    }

}


/* =========================================================
   RENDER STATISTICS
========================================================= */

function renderShiftStatistics() {

    const container =
        document.getElementById(
            "shiftStats"
        );


    if (!container) {

        return;

    }


    const shifts =
        getVisibleShiftRecords();


    const total =
        shifts.length;


    const scheduled =
        shifts.filter(
            shift =>
                shift.status ===
                "scheduled"
        ).length;


    const open =
        shifts.filter(
            shift =>
                shift.status ===
                "open"
        ).length;


    const closed =
        shifts.filter(
            shift =>
                shift.status ===
                "closed"
        ).length;


    const cancelled =
        shifts.filter(
            shift =>
                shift.status ===
                "cancelled"
        ).length;


    const cards =
        container.querySelectorAll(
            ".shift-stat-card strong"
        );


    /*
     * Total
     */
    if (cards[0]) {

        cards[0].textContent =
            total;

    }


    /*
     * Open
     */
    if (cards[1]) {

        cards[1].textContent =
            open;

    }


    /*
     * Closed
     */
    if (cards[2]) {

        cards[2].textContent =
            closed;

    }


    /*
     * Cancelled
     */
    if (cards[3]) {

        cards[3].textContent =
            cancelled;

    }

}


/* =========================================================
   GET VISIBLE SHIFT RECORDS
========================================================= */

function getVisibleShiftRecords() {

    const role =
        getCurrentUserRole();


    let shifts =
        [
            ...ShiftsState.shifts
        ];


    if (
        role === "manager" ||
        role === "attendant"
    ) {

        const stationId =
            getCurrentUserStationId();


        if (!stationId) {

            return [];

        }


        shifts =
            shifts.filter(
                shift =>
                    String(
                        shift.station_id
                    ) ===
                    String(
                        stationId
                    )
            );

    }


    return shifts;

}


/* =========================================================
   RENDER SHIFT TABLE
========================================================= */

function renderShiftTable() {

    applyShiftFilters();


    const tbody =
        document.getElementById(
            "shiftTableBody"
        );


    if (!tbody) {

        return;

    }


    let shifts =
        [
            ...ShiftsState.filteredShifts
        ];


    /*
     * Status filter
     */

    const statusFilter =
        document.getElementById(
            "shiftStatusFilter"
        )?.value ||
        "";


    if (statusFilter) {

        shifts =
            shifts.filter(
                shift =>
                    shift.status ===
                    statusFilter
            );

    }


    /*
     * Station filter
     */

    const stationFilter =
        document.getElementById(
            "shiftStationFilter"
        )?.value ||
        "";


    if (stationFilter) {

        shifts =
            shifts.filter(
                shift =>
                    String(
                        shift.station_id
                    ) ===
                    String(
                        stationFilter
                    )
            );

    }


    /*
     * Empty
     */

    if (!shifts.length) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="shift-empty"
                >

                    <div class="shift-empty-icon">
                        ↔
                    </div>

                    <h3>
                        No shifts found
                    </h3>

                    <p>
                        There are no shift records matching your filters.
                    </p>

                </td>

            </tr>

        `;

        return;

    }


    /*
     * Latest first
     */

    shifts.sort(
        (a, b) => {

            const dateA =
                `${a.shift_date || ""} ${
                    a.shift_time || ""
                }`;


            const dateB =
                `${b.shift_date || ""} ${
                    b.shift_time || ""
                }`;


            return dateB.localeCompare(
                dateA
            );

        }
    );


    tbody.innerHTML =
        shifts
            .map(
                renderShiftRow
            )
            .join("");

}


/* =========================================================
   RENDER SHIFT ROW
========================================================= */

function renderShiftRow(
    shift
) {

    const stationName =
        getStationName(
            shift.station_id
        );


    const status =
        normalizeStatus(
            shift.status
        );


    const role =
        getCurrentUserRole();


    const canManage =
        [
            "owner",
            "admin",
            "manager"
        ].includes(
            role
        );


    let actions =
        `
            <span class="shift-secondary">
                —
            </span>
        `;


    /*
     * Scheduled:
     * Open + Cancel
     */

    if (
        canManage &&
        status === "scheduled"
    ) {

        actions = `

            <button
                type="button"
                class="shift-btn shift-btn-sm shift-btn-success"
                data-shift-action="open"
                data-shift-id="${escapeHtml(
                    shift.id
                )}"
            >
                Open
            </button>


            <button
                type="button"
                class="shift-btn shift-btn-sm shift-btn-danger"
                data-shift-action="cancel"
                data-shift-id="${escapeHtml(
                    shift.id
                )}"
            >
                Cancel
            </button>

        `;

    }


    /*
     * Open:
     * Close + View Attendants
     */

    else if (
        canManage &&
        status === "open"
    ) {

        actions = `

            <button
                type="button"
                class="shift-btn shift-btn-sm shift-btn-success"
                data-shift-action="close"
                data-shift-id="${escapeHtml(
                    shift.id
                )}"
            >
                Close
            </button>


            <button
                type="button"
                class="shift-btn shift-btn-sm shift-btn-secondary"
                data-shift-action="attendants"
                data-shift-id="${escapeHtml(
                    shift.id
                )}"
            >
                Attendants
            </button>

        `;

    }


    /*
     * Closed / Cancelled
     */

    else if (
        status === "closed" ||
        status === "cancelled"
    ) {

        actions = `

            <button
                type="button"
                class="shift-btn shift-btn-sm shift-btn-secondary"
                data-shift-action="attendants"
                data-shift-id="${escapeHtml(
                    shift.id
                )}"
            >
                Attendants
            </button>

        `;

    }


    return `

        <tr>

            <td>

                <div class="shift-primary">

                    ${escapeHtml(
                        shift.shift_name
                    )}

                </div>

                <span class="shift-secondary">

                    ${escapeHtml(
                        String(
                            shift.id || ""
                        ).slice(0, 18)
                    )}

                </span>

            </td>


            <td>

                ${escapeHtml(
                    stationName
                )}

            </td>


            <td>

                ${escapeHtml(
                    formatDate(
                        shift.shift_date
                    )
                )}

            </td>


            <td>

                ${escapeHtml(
                    formatTime(
                        shift.shift_time
                    )
                )}

            </td>


            <td>

                ${escapeHtml(
                    formatTime(
                        shift.end_shift
                    )
                )}

            </td>


            <td>

                <span
                    class="shift-status shift-status-${escapeHtml(
                        status
                    )}"
                >

                    ${escapeHtml(
                        capitalizeFirst(
                            status
                        )
                    )}

                </span>

            </td>


            <td>

                <div class="shift-actions">

                    ${actions}

                </div>

            </td>

        </tr>

    `;

}


/* =========================================================
   GET STATION NAME
========================================================= */

function getStationName(
    stationId
) {

    const station =
        ShiftsState.stations.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    stationId
                )
        );


    return (
        station?.name ||
        "Unknown Station"
    );

}


/* =========================================================
   NORMALIZE STATUS
========================================================= */

function normalizeStatus(
    status
) {

    return String(
        status ||
        "scheduled"
    )
        .toLowerCase()
        .trim();

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
    value
) {

    if (!value) {

        return "—";

    }


    const date =
        new Date(
            `${value}T00:00:00`
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;

    }


    return date.toLocaleDateString(
        "en-NG",
        {

            year:
                "numeric",

            month:
                "short",

            day:
                "numeric"

        }
    );

}


/* =========================================================
   FORMAT TIME
========================================================= */

function formatTime(
    value
) {

    if (!value) {

        return "—";

    }


    const parts =
        String(
            value
        ).split(":");


    if (
        parts.length < 2
    ) {

        return value;

    }


    let hour =
        Number(
            parts[0]
        );


    const minute =
        parts[1];


    if (
        Number.isNaN(
            hour
        )
    ) {

        return value;

    }


    const period =
        hour >= 12
            ? "PM"
            : "AM";


    hour =
        hour % 12 ||
        12;


    return `${hour}:${minute} ${period}`;

}


/* =========================================================
   CAPITALIZE
========================================================= */

function capitalizeFirst(
    value
) {

    if (!value) {

        return "";

    }


    return (
        value.charAt(0)
            .toUpperCase() +
        value.slice(1)
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(
        value
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   SHOW FORM MESSAGE
========================================================= */

function showFormMessage(
    element,
    message,
    type = "error"
) {

    if (!element) {

        return;

    }


    element.textContent =
        message;


    element.className =
        `shift-form-message ${type}`;

}


/* =========================================================
   HIDE FORM MESSAGE
========================================================= */

function hideFormMessage(
    element
) {

    if (!element) {

        return;

    }


    element.textContent =
        "";


    element.className =
        "shift-form-message hidden";

}


/* =========================================================
   SET LOADING STATE
========================================================= */

function setShiftLoadingState(
    loading
) {

    const container =
        document.getElementById(
            "shiftTableContainer"
        );


    if (!container) {

        return;

    }


    if (loading) {

        container.classList.add(
            "loading"
        );

    }
    else {

        container.classList.remove(
            "loading"
        );

    }

}


/* =========================================================
   SHOW TOAST
========================================================= */

function showToast(
    message,
    type = "success"
) {

    let container =
        document.getElementById(
            "fuelgapShiftToastContainer"
        );


    if (!container) {

        container =
            document.createElement(
                "div"
            );


        container.id =
            "fuelgapShiftToastContainer";


        container.className =
            "shift-toast-container";


        document.body.appendChild(
            container
        );

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `shift-toast shift-toast-${type}`;


    toast.textContent =
        message;


    container.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.style.opacity =
                "0";

            toast.style.transform =
                "translateY(-8px)";

            toast.style.transition =
                ".25s ease";


            setTimeout(
                () => {

                    toast.remove();

                },
                300
            );

        },
        3500
    );

}


/* =========================================================
   GLOBAL EXPORT
========================================================= */

window.FuelGapShifts = {

    reload:
        loadShiftData,

    refresh:
        loadShiftData,

    getState:
        () =>
            ShiftsState,

    create:
        handleCreateShift,

    open:
        openExistingShift,

    close:
        closeExistingShift,

    cancel:
        cancelExistingShift,

    getAttendants:
        viewShiftAttendants

};