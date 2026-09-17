/* =========================================================
   FUELGAP - PROFESSIONAL PUMPS & NOZZLES MANAGEMENT
   REAL BACKEND VERSION
   HTTPONLY COOKIE SESSION
   NO LOCALSTORAGE AUTHENTICATION
   ACTIVATE / DEACTIVATE SUPPORT
========================================================= */

const FUELGAP_API_BASE_URL =
    window.FUELGAP_API_BASE_URL ||
    "https://gap-backend-ywt2.onrender.com/api";


/* =========================================================
   STATE
========================================================= */

const PumpsState = {
    user: null,
    stations: [],
    pumps: [],
    nozzles: [],
    loading: false,

    editingPumpId: null,
    editingNozzleId: null,

    search: "",
    status: "all",

    eventsBound: false
};


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    try {

        await initializePumpsPage();

    } catch (error) {

        console.error(
            "Pumps page initialization error:",
            error
        );

        showPageError(
            error.message ||
            "Unable to load pumps and nozzles."
        );

    }

});


/* =========================================================
   INITIALIZE PAGE
========================================================= */

async function initializePumpsPage() {

    if (typeof FuelGapAPI === "undefined") {

        showPageError(
            "FuelGap API is not available. Check that api.js is loaded."
        );

        return;
    }


    const authResponse =
        await FuelGapAPI.getCurrentUser();


    if (
        !authResponse ||
        !authResponse.success ||
        !authResponse.data ||
        !authResponse.data.user
    ) {

        window.location.href = "../login.html";

        return;
    }


    PumpsState.user =
        normalizeUser(
            authResponse.data.user
        );


    if (
        typeof hasPermission === "function" &&
        !hasPermission(
            PumpsState.user.role,
            "pumps"
        )
    ) {

        window.location.href =
            "./dashboard.html";

        return;
    }


    await waitForPageContent();


    injectPumpsStyles();

    renderPumpsPage();

    setupPumpsEvents();

    await loadPumpsData();

    renderPumpRows();

    updateMetrics();

}


/* =========================================================
   NORMALIZE USER
========================================================= */

function normalizeUser(user) {

    return {

        id:
            user.id ||
            user.user_id ||
            user.userId ||
            null,

        role:
            String(
                user.role ||
                user.user_role ||
                ""
            ).toLowerCase(),

        fullName:
            user.fullName ||
            user.full_name ||
            user.name ||
            "User",

        email:
            user.email ||
            "",

        organizationId:
            user.organizationId ||
            user.organization_id ||
            null,

        stationId:
            user.stationId ||
            user.station_id ||
            null

    };

}


/* =========================================================
   WAIT FOR PAGE CONTENT
========================================================= */

function waitForPageContent() {

    return new Promise(
        (resolve, reject) => {

            const existing =
                document.getElementById(
                    "pageContent"
                );


            if (existing) {

                resolve(existing);

                return;
            }


            let attempts = 0;


            const interval =
                setInterval(() => {

                    const pageContent =
                        document.getElementById(
                            "pageContent"
                        );


                    if (pageContent) {

                        clearInterval(
                            interval
                        );

                        resolve(
                            pageContent
                        );

                        return;
                    }


                    attempts++;


                    if (attempts >= 100) {

                        clearInterval(
                            interval
                        );

                        reject(
                            new Error(
                                "Application shell failed to load."
                            )
                        );

                    }

                }, 50);

        }
    );

}


/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(
    endpoint,
    options = {}
) {

    const config = {

        method:
            options.method ||
            "GET",

        credentials:
            "include",

        headers: {

            "Content-Type":
                "application/json",

            ...(options.headers || {})

        }

    };


    if (
        options.body !== undefined
    ) {

        config.body =
            typeof options.body === "string"
                ? options.body
                : JSON.stringify(
                    options.body
                );

    }


    const response =
        await fetch(
            `${FUELGAP_API_BASE_URL}${endpoint}`,
            config
        );


    let result = null;


    try {

        result =
            await response.json();

    } catch {

        result = null;

    }


    if (response.status === 401) {

        window.location.href =
            "../login.html";

        throw new Error(
            "Your session has expired."
        );

    }


    if (response.status === 403) {

        throw new Error(
            result?.message ||
            "You do not have permission to perform this action."
        );

    }


    if (!response.ok) {

        throw new Error(
            result?.message ||
            `Request failed with status ${response.status}.`
        );

    }


    if (
        result &&
        result.success === false
    ) {

        throw new Error(
            result.message ||
            "The server rejected the request."
        );

    }


    return result;

}


/* =========================================================
   NORMALIZE API ARRAY RESPONSE
========================================================= */

function normalizeArrayResponse(
    response,
    key
) {

    if (Array.isArray(response)) {

        return response;

    }


    if (
        response &&
        Array.isArray(response.data)
    ) {

        return response.data;

    }


    if (
        response &&
        response.data &&
        Array.isArray(
            response.data[key]
        )
    ) {

        return response.data[key];

    }


    if (
        response &&
        Array.isArray(response[key])
    ) {

        return response[key];

    }


    return [];

}


/* =========================================================
   LOAD ALL DATA
========================================================= */

async function loadPumpsData() {

    PumpsState.loading = true;


    try {

        const [
            stationsResponse,
            pumpsResponse,
            nozzlesResponse
        ] = await Promise.all([

            apiRequest("/stations"),

            apiRequest("/pumps"),

            apiRequest("/nozzles")

        ]);


        PumpsState.stations =
            normalizeArrayResponse(
                stationsResponse,
                "stations"
            )
            .map(normalizeStation);


        PumpsState.pumps =
            normalizeArrayResponse(
                pumpsResponse,
                "pumps"
            )
            .map(normalizePump);


        PumpsState.nozzles =
            normalizeArrayResponse(
                nozzlesResponse,
                "nozzles"
            )
            .map(normalizeNozzle);


    } catch (error) {

        console.error(
            "Unable to load pump data:",
            error
        );


        showPageError(
            error.message ||
            "Unable to load pumps and nozzles."
        );

    } finally {

        PumpsState.loading = false;

    }

}


/* =========================================================
   NORMALIZE STATION
========================================================= */

function normalizeStation(station) {

    return {

        id:
            station.id ||
            station.station_id ||
            null,

        name:
            station.name ||
            station.station_name ||
            "Unknown Station",

        organizationId:
            station.organization_id ||
            station.organizationId ||
            null,

        isActive:
            station.is_active !== undefined
                ? Boolean(
                    station.is_active
                )
                : station.isActive !== undefined
                    ? Boolean(
                        station.isActive
                    )
                    : true

    };

}


/* =========================================================
   NORMALIZE PUMP
========================================================= */

function normalizePump(pump) {

    return {

        id:
            pump.id ||
            pump.pump_id ||
            null,

        stationId:
            pump.station_id ||
            pump.stationId ||
            null,

        pumpNumber:
            pump.pump_number ||
            pump.pumpNumber ||
            pump.name ||
            "Pump",

        brand:
            pump.brand ||
            "Unknown",

        model:
            pump.model ||
            "",

        nozzleCount:
            Number(
                pump.nozzle_count ||
                pump.nozzleCount ||
                0
            ),

        isActive:
            pump.is_active !== undefined
                ? Boolean(
                    pump.is_active
                )
                : pump.isActive !== undefined
                    ? Boolean(
                        pump.isActive
                    )
                    : true

    };

}


/* =========================================================
   NORMALIZE NOZZLE
========================================================= */

function normalizeNozzle(nozzle) {

    return {

        id:
            nozzle.id ||
            nozzle.nozzle_id ||
            null,

        pumpId:
            nozzle.pump_id ||
            nozzle.pumpId ||
            null,

        nozzleNumber:
            nozzle.nozzle_number ||
            nozzle.nozzleNumber ||
            nozzle.name ||
            "Nozzle",

        product:
            nozzle.product ||
            "",

        pricePerLitre:
            Number(
                nozzle.price_per_litre ||
                nozzle.pricePerLitre ||
                0
            ),

        isActive:
            nozzle.is_active !== undefined
                ? Boolean(
                    nozzle.is_active
                )
                : nozzle.isActive !== undefined
                    ? Boolean(
                        nozzle.isActive
                    )
                    : true

    };

}


/* =========================================================
   ROLE PERMISSIONS
========================================================= */

function canManagePumps() {

    return [
        "admin",
        "owner",
        "manager"
    ].includes(
        PumpsState.user?.role
    );

}


function canDeactivatePumps() {

    return [
        "admin",
        "owner"
    ].includes(
        PumpsState.user?.role
    );

}


function canManageNozzles() {

    return [
        "admin",
        "owner",
        "manager"
    ].includes(
        PumpsState.user?.role
    );

}


function canDeactivateNozzles() {

    return [
        "admin",
        "owner"
    ].includes(
        PumpsState.user?.role
    );

}


/* =========================================================
   VISIBLE STATIONS
========================================================= */

function getVisibleStations() {

    const user =
        PumpsState.user;

    const stations =
        PumpsState.stations;


    if (!user) {

        return [];

    }


    if (
        user.role === "admin"
    ) {

        return stations;

    }


    if (
        user.role === "owner"
    ) {

        return stations.filter(
            station =>
                String(
                    station.organizationId
                ) ===
                String(
                    user.organizationId
                )
        );

    }


    if (
        user.role === "manager"
    ) {

        if (user.stationId) {

            return stations.filter(
                station =>
                    String(
                        station.id
                    ) ===
                    String(
                        user.stationId
                    )
            );

        }


        return stations.filter(
            station =>
                String(
                    station.organizationId
                ) ===
                String(
                    user.organizationId
                )
        );

    }


    return [];

}


/* =========================================================
   GET VISIBLE PUMPS
========================================================= */

function getVisiblePumps() {

    const stationIds =
        getVisibleStations()
            .map(
                station =>
                    String(station.id)
            );


    return PumpsState.pumps.filter(
        pump =>
            stationIds.includes(
                String(pump.stationId)
            )
    );

}


/* =========================================================
   FIND STATION
========================================================= */

function getStationById(
    stationId
) {

    return PumpsState.stations.find(
        station =>
            String(station.id) ===
            String(stationId)
    );

}


/* =========================================================
   GET PUMP NOZZLES
========================================================= */

function getPumpNozzles(
    pumpId
) {

    return PumpsState.nozzles.filter(
        nozzle =>
            String(nozzle.pumpId) ===
            String(pumpId)
    );

}


/* =========================================================
   ICONS
========================================================= */

function pumpIcon(name) {

    const icons = {

        pump: `
            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="2"
                 stroke-linecap="round"
                 stroke-linejoin="round">
                <path d="M4 22V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v17"/>
                <path d="M4 10h11"/>
                <path d="M8 3v7"/>
                <path d="M17 7h1a3 3 0 0 1 3 3v12"/>
                <path d="M17 22v-8"/>
            </svg>
        `,

        nozzle: `
            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="2"
                 stroke-linecap="round"
                 stroke-linejoin="round">
                <path d="M6 3h9v6H6z"/>
                <path d="M9 9v5"/>
                <path d="M7 14h4"/>
                <path d="M5 14v7"/>
                <path d="M5 21h6"/>
                <path d="M15 5h2a3 3 0 0 1 3 3v6"/>
                <path d="M20 14v7"/>
            </svg>
        `,

        plus: `
            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="2.5"
                 stroke-linecap="round">
                <path d="M12 5v14"/>
                <path d="M5 12h14"/>
            </svg>
        `,

        search: `
            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="2"
                 stroke-linecap="round"
                 stroke-linejoin="round">
                <circle cx="11" cy="11" r="7"/>
                <path d="m20 20-4-4"/>
            </svg>
        `,

        filter: `
            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="2"
                 stroke-linecap="round">
                <path d="M4 6h16"/>
                <path d="M7 12h10"/>
                <path d="M10 18h4"/>
            </svg>
        `,

        close: `
            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="2.5"
                 stroke-linecap="round">
                <path d="M18 6 6 18"/>
                <path d="m6 6 12 12"/>
            </svg>
        `,

        check: `
            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="2.5"
                 stroke-linecap="round"
                 stroke-linejoin="round">
                <path d="M20 6 9 17l-5-5"/>
            </svg>
        `,

        refresh: `
            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="2"
                 stroke-linecap="round"
                 stroke-linejoin="round">
                <path d="M20 11a8.1 8.1 0 0 0-15.5-2"/>
                <path d="M4 5v4h4"/>
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2"/>
                <path d="M20 19v-4h-4"/>
            </svg>
        `,

        edit: `
            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="2"
                 stroke-linecap="round"
                 stroke-linejoin="round">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>
            </svg>
        `,

        trash: `
            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="2"
                 stroke-linecap="round"
                 stroke-linejoin="round">
                <path d="M3 6h18"/>
                <path d="M8 6V4h8v2"/>
                <path d="M19 6l-1 14H6L5 6"/>
            </svg>
        `,

        activate: `
            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="2"
                 stroke-linecap="round"
                 stroke-linejoin="round">
                <path d="M12 3v9"/>
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
            </svg>
        `,

        meter: `
            <svg viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="2"
                 stroke-linecap="round"
                 stroke-linejoin="round">
                <path d="M4 19a8 8 0 1 1 16 0"/>
                <path d="M12 11l3-3"/>
                <path d="M12 15v.01"/>
            </svg>
        `

    };


    return icons[name] || "";

}


/* =========================================================
   RENDER PAGE
========================================================= */

function renderPumpsPage() {

    const pageContent =
        document.getElementById(
            "pageContent"
        );


    if (!pageContent) {

        console.error(
            "#pageContent was not found."
        );

        return;

    }


    pageContent.innerHTML = `

        <div class="fg-pumps-page">

            <div class="fg-pumps-header">

                <div class="fg-pumps-title-group">

                    <div class="fg-pumps-page-icon">
                        ${pumpIcon("pump")}
                    </div>

                    <div>

                        <div class="fg-pumps-breadcrumb">
                            FORECOURT MANAGEMENT
                            <span>/</span>
                            EQUIPMENT
                        </div>

                        <h1>
                            Pumps & Nozzles
                        </h1>

                        <p>
                            Manage fuel dispensing pumps,
                            nozzles and equipment configuration.
                        </p>

                    </div>

                </div>


                <div class="fg-pumps-header-actions">

                    <button
                        type="button"
                        id="refreshPumps"
                        class="fg-pumps-secondary-btn"
                    >
                        ${pumpIcon("refresh")}
                        Refresh
                    </button>

                    ${
                        canManagePumps()
                            ? `
                                <button
                                    type="button"
                                    id="openPumpModal"
                                    class="fg-pumps-primary-btn"
                                >
                                    ${pumpIcon("plus")}
                                    Add Pump
                                </button>
                            `
                            : ""
                    }

                </div>

            </div>


            <section class="fg-pump-metrics">

                <div class="fg-pump-metric-card">

                    <div class="fg-pump-metric-icon">
                        ${pumpIcon("pump")}
                    </div>

                    <div>
                        <span>Total Pumps</span>
                        <strong id="totalPumps">0</strong>
                        <small>Registered equipment</small>
                    </div>

                </div>


                <div class="fg-pump-metric-card">

                    <div class="fg-pump-metric-icon">
                        ${pumpIcon("check")}
                    </div>

                    <div>
                        <span>Active Pumps</span>
                        <strong id="activePumps">0</strong>
                        <small>Currently operational</small>
                    </div>

                </div>


                <div class="fg-pump-metric-card">

                    <div class="fg-pump-metric-icon">
                        ${pumpIcon("nozzle")}
                    </div>

                    <div>
                        <span>Total Nozzles</span>
                        <strong id="totalNozzles">0</strong>
                        <small>Configured dispensing points</small>
                    </div>

                </div>


                <div class="fg-pump-metric-card">

                    <div class="fg-pump-metric-icon">
                        ${pumpIcon("meter")}
                    </div>

                    <div>
                        <span>Active Nozzles</span>
                        <strong id="activeNozzles">0</strong>
                        <small>Currently available</small>
                    </div>

                </div>

            </section>


            <section class="fg-pumps-panel">

                <div class="fg-pumps-panel-header">

                    <div>
                        <h2>
                            Pump Directory
                        </h2>

                        <p>
                            View and configure pumps
                            across your fuel stations.
                        </p>
                    </div>

                    <div class="fg-pumps-count">
                        <span id="visiblePumpCount">0</span>
                        Pumps
                    </div>

                </div>


                <div class="fg-pumps-toolbar">

                    <div class="fg-pumps-search">

                        ${pumpIcon("search")}

                        <input
                            type="search"
                            id="pumpSearch"
                            placeholder="Search pump, brand or station..."
                        >

                    </div>


                    <div class="fg-pumps-filter">

                        ${pumpIcon("filter")}

                        <select id="pumpStatusFilter">

                            <option value="all">
                                All Status
                            </option>

                            <option value="active">
                                Active
                            </option>

                            <option value="inactive">
                                Inactive
                            </option>

                        </select>

                    </div>

                </div>


                <div
                    id="pumpDirectory"
                    class="fg-pump-directory"
                ></div>


                <div
                    id="emptyPumpState"
                    class="fg-pumps-empty hidden"
                >

                    <div class="fg-pumps-empty-icon">
                        ${pumpIcon("pump")}
                    </div>

                    <h3>
                        No pumps found
                    </h3>

                    <p>
                        There are no pumps matching
                        your current search or filter.
                    </p>

                    ${
                        canManagePumps()
                            ? `
                                <button
                                    type="button"
                                    id="emptyAddPump"
                                    class="fg-pumps-primary-btn"
                                >
                                    ${pumpIcon("plus")}
                                    Add Pump
                                </button>
                            `
                            : ""
                    }

                </div>

            </section>


            <!-- PUMP MODAL -->

            <div
                id="pumpModal"
                class="fg-pumps-modal hidden"
            >

                <div class="fg-pumps-modal-overlay"></div>

                <div class="fg-pumps-modal-content">

                    <div class="fg-pumps-modal-header">

                        <div>

                            <span>
                                EQUIPMENT SETUP
                            </span>

                            <h2 id="pumpModalTitle">
                                Add Fuel Pump
                            </h2>

                            <p>
                                Register and configure
                                an existing dispensing pump.
                            </p>

                        </div>

                        <button
                            type="button"
                            id="closePumpModal"
                            class="fg-pumps-modal-close"
                        >
                            ${pumpIcon("close")}
                        </button>

                    </div>


                    <form id="pumpForm">

                        <div class="fg-pumps-form-grid">

                            <div class="fg-pumps-form-group fg-pumps-full">

                                <label>
                                    Pump Name / Number
                                </label>

                                <input
                                    type="text"
                                    name="pumpNumber"
                                    id="pumpNumber"
                                    placeholder="Example: Pump 1"
                                    required
                                >

                            </div>


                            <div class="fg-pumps-form-group fg-pumps-full">

                                <label>
                                    Fuel Station
                                </label>

                                <select
                                    name="stationId"
                                    id="pumpStation"
                                    required
                                >
                                    <option value="">
                                        Select station
                                    </option>
                                </select>

                            </div>


                            <div class="fg-pumps-form-group">

                                <label>
                                    Pump Brand
                                </label>

                                <input
                                    type="text"
                                    name="brand"
                                    id="pumpBrand"
                                    placeholder="Example: Wayne"
                                    required
                                >

                            </div>


                            <div class="fg-pumps-form-group">

                                <label>
                                    Pump Model
                                </label>

                                <input
                                    type="text"
                                    name="model"
                                    id="pumpModel"
                                    placeholder="Enter model"
                                >

                            </div>

                        </div>


                        <div
                            id="pumpMessage"
                            class="fg-pumps-message hidden"
                        ></div>


                        <div class="fg-pumps-modal-footer">

                            <button
                                type="button"
                                id="cancelPumpModal"
                                class="fg-pumps-secondary-btn"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                id="pumpSubmitButton"
                                class="fg-pumps-primary-btn"
                            >
                                ${pumpIcon("plus")}
                                Create Pump
                            </button>

                        </div>

                    </form>

                </div>

            </div>


            <!-- NOZZLE MODAL -->

            <div
                id="nozzleModal"
                class="fg-pumps-modal hidden"
            >

                <div class="fg-pumps-modal-overlay"></div>

                <div class="fg-pumps-modal-content">

                    <div class="fg-pumps-modal-header">

                        <div>

                            <span>
                                DISPENSING CONFIGURATION
                            </span>

                            <h2 id="nozzleModalTitle">
                                Add Nozzle
                            </h2>

                            <p>
                                Configure a nozzle
                                for the selected pump.
                            </p>

                        </div>

                        <button
                            type="button"
                            id="closeNozzleModal"
                            class="fg-pumps-modal-close"
                        >
                            ${pumpIcon("close")}
                        </button>

                    </div>


                    <form id="nozzleForm">

                        <input
                            type="hidden"
                            id="nozzlePumpId"
                        >


                        <div class="fg-pumps-form-grid">

                            <div class="fg-pumps-form-group">

                                <label>
                                    Nozzle Number
                                </label>

                                <input
                                    type="text"
                                    name="nozzleNumber"
                                    id="nozzleNumber"
                                    placeholder="Example: Nozzle 1"
                                    required
                                >

                            </div>


                            <div class="fg-pumps-form-group">

                                <label>
                                    Fuel Product
                                </label>

                                <select
                                    name="product"
                                    id="nozzleProduct"
                                    required
                                >

                                    <option value="">
                                        Select product
                                    </option>

                                    <option value="PMS">
                                        PMS
                                    </option>

                                    <option value="AGO">
                                        AGO / Diesel
                                    </option>

                                    <option value="DPK">
                                        DPK / Kerosene
                                    </option>

                                </select>

                            </div>


                            <div class="fg-pumps-form-group fg-pumps-full">

                                <label>
                                    Price Per Litre (₦)
                                </label>

                                <input
                                    type="number"
                                    name="pricePerLitre"
                                    id="nozzlePrice"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    required
                                >

                            </div>

                        </div>


                        <div
                            id="nozzleMessage"
                            class="fg-pumps-message hidden"
                        ></div>


                        <div class="fg-pumps-modal-footer">

                            <button
                                type="button"
                                id="cancelNozzleModal"
                                class="fg-pumps-secondary-btn"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                id="nozzleSubmitButton"
                                class="fg-pumps-primary-btn"
                            >
                                ${pumpIcon("plus")}
                                Add Nozzle
                            </button>

                        </div>

                    </form>

                </div>

            </div>

        </div>

    `;

}


/* =========================================================
   SETUP EVENTS
========================================================= */

function setupPumpsEvents() {

    if (PumpsState.eventsBound) {

        return;

    }


    PumpsState.eventsBound = true;


    const pageContent =
        document.getElementById(
            "pageContent"
        );


    if (!pageContent) {

        return;

    }


    /* -----------------------------------------
       DELEGATED CLICK EVENTS
    ----------------------------------------- */

    pageContent.addEventListener(
        "click",
        async event => {

            const button =
                event.target.closest(
                    "button"
                );


            if (!button) {

                return;

            }


            if (
                button.id ===
                "openPumpModal" ||
                button.id ===
                "emptyAddPump"
            ) {

                openPumpModal();

                return;

            }


            if (
                button.id ===
                "refreshPumps"
            ) {

                await refreshPumps();

                return;

            }


            if (
                button.id ===
                "closePumpModal" ||
                button.id ===
                "cancelPumpModal"
            ) {

                closePumpModal();

                return;

            }


            if (
                button.id ===
                "closeNozzleModal" ||
                button.id ===
                "cancelNozzleModal"
            ) {

                closeNozzleModal();

                return;

            }


            if (
                button.classList.contains(
                    "add-nozzle-button"
                )
            ) {

                const pumpId =
                    button.dataset.id;

                openNozzleModal(
                    pumpId
                );

                return;

            }


            if (
                button.classList.contains(
                    "edit-pump-button"
                )
            ) {

                const pumpId =
                    button.dataset.id;

                openEditPumpModal(
                    pumpId
                );

                return;

            }


            if (
                button.classList.contains(
                    "deactivate-pump-button"
                )
            ) {

                const pumpId =
                    button.dataset.id;

                await deactivatePump(
                    pumpId
                );

                return;

            }


            if (
                button.classList.contains(
                    "activate-pump-button"
                )
            ) {

                const pumpId =
                    button.dataset.id;

                await activatePump(
                    pumpId
                );

                return;

            }


            if (
                button.classList.contains(
                    "edit-nozzle-button"
                )
            ) {

                const nozzleId =
                    button.dataset.id;

                openEditNozzleModal(
                    nozzleId
                );

                return;

            }


            if (
                button.classList.contains(
                    "deactivate-nozzle-button"
                )
            ) {

                const nozzleId =
                    button.dataset.id;

                await deactivateNozzle(
                    nozzleId
                );

                return;

            }


            if (
                button.classList.contains(
                    "activate-nozzle-button"
                )
            ) {

                const nozzleId =
                    button.dataset.id;

                await activateNozzle(
                    nozzleId
                );

                return;

            }

        }
    );


    /* -----------------------------------------
       SEARCH
    ----------------------------------------- */

    pageContent.addEventListener(
        "input",
        event => {

            if (
                event.target.id ===
                "pumpSearch"
            ) {

                PumpsState.search =
                    event.target.value
                        .trim()
                        .toLowerCase();

                renderPumpRows();

            }

        }
    );


    /* -----------------------------------------
       STATUS FILTER
    ----------------------------------------- */

    pageContent.addEventListener(
        "change",
        event => {

            if (
                event.target.id ===
                "pumpStatusFilter"
            ) {

                PumpsState.status =
                    event.target.value;

                renderPumpRows();

            }

        }
    );


    /* -----------------------------------------
       PUMP FORM
    ----------------------------------------- */

    const pumpForm =
        document.getElementById(
            "pumpForm"
        );


    pumpForm?.addEventListener(
        "submit",
        handlePumpSubmit
    );


    /* -----------------------------------------
       NOZZLE FORM
    ----------------------------------------- */

    const nozzleForm =
        document.getElementById(
            "nozzleForm"
        );


    nozzleForm?.addEventListener(
        "submit",
        handleNozzleSubmit
    );


    /* -----------------------------------------
       MODAL OVERLAYS
    ----------------------------------------- */

    pageContent
        .querySelectorAll(
            ".fg-pumps-modal-overlay"
        )
        .forEach(
            overlay => {

                overlay.addEventListener(
                    "click",
                    () => {

                        closePumpModal();

                        closeNozzleModal();

                    }
                );

            }
        );

}


/* =========================================================
   OPEN PUMP MODAL
========================================================= */

function openPumpModal() {

    if (!canManagePumps()) {

        showToast(
            "You do not have permission to manage pumps.",
            "error"
        );

        return;

    }


    PumpsState.editingPumpId =
        null;


    const form =
        document.getElementById(
            "pumpForm"
        );


    form?.reset();


    loadStationsIntoPumpSelect();


    const title =
        document.getElementById(
            "pumpModalTitle"
        );


    if (title) {

        title.textContent =
            "Add Fuel Pump";

    }


    const submitButton =
        document.getElementById(
            "pumpSubmitButton"
        );


    if (submitButton) {

        submitButton.innerHTML =
            `${pumpIcon("plus")} Create Pump`;

    }


    clearMessage(
        "pumpMessage"
    );


    document
        .getElementById("pumpModal")
        ?.classList.remove(
            "hidden"
        );


    document.body.style.overflow =
        "hidden";

}


/* =========================================================
   OPEN EDIT PUMP
========================================================= */

function openEditPumpModal(
    pumpId
) {

    if (!canManagePumps()) {

        showToast(
            "You do not have permission to edit pumps.",
            "error"
        );

        return;

    }


    const pump =
        PumpsState.pumps.find(
            item =>
                String(item.id) ===
                String(pumpId)
        );


    if (!pump) {

        showToast(
            "Pump could not be found.",
            "error"
        );

        return;

    }


    PumpsState.editingPumpId =
        pump.id;


    loadStationsIntoPumpSelect();


    document.getElementById(
        "pumpNumber"
    ).value =
        pump.pumpNumber || "";


    document.getElementById(
        "pumpStation"
    ).value =
        pump.stationId || "";


    document.getElementById(
        "pumpBrand"
    ).value =
        pump.brand || "";


    document.getElementById(
        "pumpModel"
    ).value =
        pump.model || "";


    document.getElementById(
        "pumpModalTitle"
    ).textContent =
        "Edit Fuel Pump";


    document.getElementById(
        "pumpSubmitButton"
    ).innerHTML =
        `${pumpIcon("edit")} Update Pump`;


    clearMessage(
        "pumpMessage"
    );


    document
        .getElementById("pumpModal")
        ?.classList.remove(
            "hidden"
        );


    document.body.style.overflow =
        "hidden";

}


/* =========================================================
   CLOSE PUMP MODAL
========================================================= */

function closePumpModal() {

    document
        .getElementById("pumpModal")
        ?.classList.add(
            "hidden"
        );


    PumpsState.editingPumpId =
        null;


    document.body.style.overflow =
        "";

}


/* =========================================================
   OPEN NOZZLE MODAL
========================================================= */

function openNozzleModal(
    pumpId
) {

    if (!canManageNozzles()) {

        showToast(
            "You do not have permission to manage nozzles.",
            "error"
        );

        return;

    }


    const pump =
        PumpsState.pumps.find(
            item =>
                String(item.id) ===
                String(pumpId)
        );


    if (!pump) {

        showToast(
            "Pump could not be found.",
            "error"
        );

        return;

    }


    if (!pump.isActive) {

        showToast(
            "You cannot add a nozzle to an inactive pump.",
            "error"
        );

        return;

    }


    PumpsState.editingNozzleId =
        null;


    document
        .getElementById("nozzleForm")
        ?.reset();


    document.getElementById(
        "nozzlePumpId"
    ).value =
        pump.id;


    document.getElementById(
        "nozzleModalTitle"
    ).textContent =
        "Add Nozzle";


    document.getElementById(
        "nozzleSubmitButton"
    ).innerHTML =
        `${pumpIcon("plus")} Add Nozzle`;


    clearMessage(
        "nozzleMessage"
    );


    document
        .getElementById("nozzleModal")
        ?.classList.remove(
            "hidden"
        );


    document.body.style.overflow =
        "hidden";

}


/* =========================================================
   OPEN EDIT NOZZLE MODAL
========================================================= */

function openEditNozzleModal(
    nozzleId
) {

    if (!canManageNozzles()) {

        showToast(
            "You do not have permission to edit nozzles.",
            "error"
        );

        return;

    }


    const nozzle =
        PumpsState.nozzles.find(
            item =>
                String(item.id) ===
                String(nozzleId)
        );


    if (!nozzle) {

        showToast(
            "Nozzle could not be found.",
            "error"
        );

        return;

    }


    PumpsState.editingNozzleId =
        nozzle.id;


    document.getElementById(
        "nozzlePumpId"
    ).value =
        nozzle.pumpId;


    document.getElementById(
        "nozzleNumber"
    ).value =
        nozzle.nozzleNumber || "";


    document.getElementById(
        "nozzleProduct"
    ).value =
        nozzle.product || "";


    document.getElementById(
        "nozzlePrice"
    ).value =
        nozzle.pricePerLitre || "";


    document.getElementById(
        "nozzleModalTitle"
    ).textContent =
        "Edit Nozzle";


    document.getElementById(
        "nozzleSubmitButton"
    ).innerHTML =
        `${pumpIcon("edit")} Update Nozzle`;


    clearMessage(
        "nozzleMessage"
    );


    document
        .getElementById("nozzleModal")
        ?.classList.remove(
            "hidden"
        );


    document.body.style.overflow =
        "hidden";

}


/* =========================================================
   CLOSE NOZZLE MODAL
========================================================= */

function closeNozzleModal() {

    document
        .getElementById("nozzleModal")
        ?.classList.add(
            "hidden"
        );


    PumpsState.editingNozzleId =
        null;


    document.body.style.overflow =
        "";

}


/* =========================================================
   LOAD STATIONS INTO SELECT
========================================================= */

function loadStationsIntoPumpSelect() {

    const select =
        document.getElementById(
            "pumpStation"
        );


    if (!select) {

        return;

    }


    select.innerHTML =
        `<option value="">
            Select station
        </option>`;


    getVisibleStations()
        .filter(
            station =>
                station.isActive !== false
        )
        .forEach(
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
   HANDLE PUMP SUBMIT
========================================================= */

async function handlePumpSubmit(
    event
) {

    event.preventDefault();


    if (!canManagePumps()) {

        showToast(
            "You do not have permission to manage pumps.",
            "error"
        );

        return;

    }


    const form =
        event.target;


    const pumpNumber =
        form.pumpNumber.value.trim();


    const stationId =
        form.stationId.value;


    const brand =
        form.brand.value.trim();


    const model =
        form.model.value.trim();


    const message =
        document.getElementById(
            "pumpMessage"
        );


    if (
        !pumpNumber ||
        !stationId ||
        !brand
    ) {

        showMessage(
            message,
            "Please complete all required fields.",
            "error"
        );

        return;

    }


    const submitButton =
        document.getElementById(
            "pumpSubmitButton"
        );


    setButtonLoading(
        submitButton,
        true,
        PumpsState.editingPumpId
            ? "Updating..."
            : "Creating..."
    );


    try {

        const payload = {

            station_id:
                stationId,

            pump_number:
                pumpNumber,

            brand:
                brand,

            model:
                model

        };


        if (
            PumpsState.editingPumpId
        ) {

            await apiRequest(
                `/pumps/${encodeURIComponent(
                    PumpsState.editingPumpId
                )}`,
                {

                    method:
                        "PATCH",

                    body:
                        payload

                }
            );


            showToast(
                "Pump updated successfully.",
                "success"
            );

        } else {

            await apiRequest(
                "/pumps",
                {

                    method:
                        "POST",

                    body:
                        payload

                }
            );


            showToast(
                "Pump created successfully.",
                "success"
            );

        }


        closePumpModal();


        await loadPumpsData();


        renderPumpRows();

        updateMetrics();


    } catch (error) {

        console.error(
            "Pump save error:",
            error
        );


        showMessage(
            message,
            error.message ||
            "Unable to save pump.",
            "error"
        );

    } finally {

        setButtonLoading(
            submitButton,
            false,
            PumpsState.editingPumpId
                ? "Update Pump"
                : "Create Pump"
        );

    }

}


/* =========================================================
   HANDLE NOZZLE SUBMIT
========================================================= */

async function handleNozzleSubmit(
    event
) {

    event.preventDefault();


    if (!canManageNozzles()) {

        showToast(
            "You do not have permission to manage nozzles.",
            "error"
        );

        return;

    }


    const form =
        event.target;


    const pumpId =
        document.getElementById(
            "nozzlePumpId"
        ).value;


    const nozzleNumber =
        form.nozzleNumber.value.trim();


    const product =
        form.product.value;


    const pricePerLitre =
        Number(
            form.pricePerLitre.value
        );


    const message =
        document.getElementById(
            "nozzleMessage"
        );


    if (
        !pumpId ||
        !nozzleNumber ||
        !product ||
        Number.isNaN(
            pricePerLitre
        ) ||
        pricePerLitre < 0
    ) {

        showMessage(
            message,
            "Please complete all required nozzle fields.",
            "error"
        );

        return;

    }


    const pump =
        PumpsState.pumps.find(
            item =>
                String(item.id) ===
                String(pumpId)
        );


    if (!pump) {

        showMessage(
            message,
            "The selected pump could not be found.",
            "error"
        );

        return;

    }


    if (
        !PumpsState.editingNozzleId &&
        !pump.isActive
    ) {

        showMessage(
            message,
            "Cannot add a nozzle to an inactive pump.",
            "error"
        );

        return;

    }


    const submitButton =
        document.getElementById(
            "nozzleSubmitButton"
        );


    setButtonLoading(
        submitButton,
        true,
        PumpsState.editingNozzleId
            ? "Updating..."
            : "Adding..."
    );


    try {

        const payload = {

            pump_id:
                pumpId,

            nozzle_number:
                nozzleNumber,

            product:
                product,

            price_per_litre:
                pricePerLitre

        };


        if (
            PumpsState.editingNozzleId
        ) {

            await apiRequest(
                `/nozzles/${encodeURIComponent(
                    PumpsState.editingNozzleId
                )}`,
                {

                    method:
                        "PATCH",

                    body:
                        payload

                }
            );


            showToast(
                "Nozzle updated successfully.",
                "success"
            );

        } else {

            await apiRequest(
                "/nozzles",
                {

                    method:
                        "POST",

                    body:
                        payload

                }
            );


            showToast(
                "Nozzle added successfully.",
                "success"
            );

        }


        closeNozzleModal();


        await loadPumpsData();


        renderPumpRows();

        updateMetrics();


    } catch (error) {

        console.error(
            "Nozzle save error:",
            error
        );


        showMessage(
            message,
            error.message ||
            "Unable to save nozzle.",
            "error"
        );

    } finally {

        setButtonLoading(
            submitButton,
            false,
            PumpsState.editingNozzleId
                ? "Update Nozzle"
                : "Add Nozzle"
        );

    }

}


/* =========================================================
   DEACTIVATE PUMP
========================================================= */

async function deactivatePump(
    pumpId
) {

    if (!canDeactivatePumps()) {

        showToast(
            "Only an owner or administrator can deactivate a pump.",
            "error"
        );

        return;

    }


    const pump =
        PumpsState.pumps.find(
            item =>
                String(item.id) ===
                String(pumpId)
        );


    if (!pump) {

        showToast(
            "Pump could not be found.",
            "error"
        );

        return;

    }


    if (!pump.isActive) {

        showToast(
            "This pump is already inactive.",
            "error"
        );

        return;

    }


    const confirmed =
        window.confirm(
            `Deactivate ${pump.pumpNumber}?`
        );


    if (!confirmed) {

        return;

    }


    try {

        await apiRequest(
            `/pumps/${encodeURIComponent(
                pumpId
            )}`,
            {

                method:
                    "DELETE"

            }
        );


        showToast(
            "Pump deactivated successfully.",
            "success"
        );


        await loadPumpsData();


        renderPumpRows();

        updateMetrics();


    } catch (error) {

        console.error(
            "Deactivate pump error:",
            error
        );


        showToast(
            error.message ||
            "Unable to deactivate pump.",
            "error"
        );

    }

}


/* =========================================================
   ACTIVATE PUMP
========================================================= */

async function activatePump(
    pumpId
) {

    if (!canManagePumps()) {

        showToast(
            "You do not have permission to activate pumps.",
            "error"
        );

        return;

    }


    const pump =
        PumpsState.pumps.find(
            item =>
                String(item.id) ===
                String(pumpId)
        );


    if (!pump) {

        showToast(
            "Pump could not be found.",
            "error"
        );

        return;

    }


    if (pump.isActive) {

        showToast(
            "This pump is already active.",
            "error"
        );

        return;

    }


    const confirmed =
        window.confirm(
            `Activate ${pump.pumpNumber}?`
        );


    if (!confirmed) {

        return;

    }


    try {

        await apiRequest(
            `/pumps/${encodeURIComponent(
                pumpId
            )}`,
            {

                method:
                    "PATCH",

                body: {

                    is_active:
                        true

                }

            }
        );


        showToast(
            "Pump activated successfully.",
            "success"
        );


        await loadPumpsData();


        renderPumpRows();

        updateMetrics();


    } catch (error) {

        console.error(
            "Activate pump error:",
            error
        );


        showToast(
            error.message ||
            "Unable to activate pump.",
            "error"
        );

    }

}


/* =========================================================
   DEACTIVATE NOZZLE
========================================================= */

async function deactivateNozzle(
    nozzleId
) {

    if (!canDeactivateNozzles()) {

        showToast(
            "Only an owner or administrator can deactivate a nozzle.",
            "error"
        );

        return;

    }


    const nozzle =
        PumpsState.nozzles.find(
            item =>
                String(item.id) ===
                String(nozzleId)
        );


    if (!nozzle) {

        showToast(
            "Nozzle could not be found.",
            "error"
        );

        return;

    }


    if (!nozzle.isActive) {

        showToast(
            "This nozzle is already inactive.",
            "error"
        );

        return;

    }


    const confirmed =
        window.confirm(
            `Deactivate ${nozzle.nozzleNumber}?`
        );


    if (!confirmed) {

        return;

    }


    try {

        await apiRequest(
            `/nozzles/${encodeURIComponent(
                nozzleId
            )}`,
            {

                method:
                    "DELETE"

            }
        );


        showToast(
            "Nozzle deactivated successfully.",
            "success"
        );


        await loadPumpsData();


        renderPumpRows();

        updateMetrics();


    } catch (error) {

        console.error(
            "Deactivate nozzle error:",
            error
        );


        showToast(
            error.message ||
            "Unable to deactivate nozzle.",
            "error"
        );

    }

}


/* =========================================================
   ACTIVATE NOZZLE
========================================================= */

async function activateNozzle(
    nozzleId
) {

    if (!canManageNozzles()) {

        showToast(
            "You do not have permission to activate nozzles.",
            "error"
        );

        return;

    }


    const nozzle =
        PumpsState.nozzles.find(
            item =>
                String(item.id) ===
                String(nozzleId)
        );


    if (!nozzle) {

        showToast(
            "Nozzle could not be found.",
            "error"
        );

        return;

    }


    if (nozzle.isActive) {

        showToast(
            "This nozzle is already active.",
            "error"
        );

        return;

    }


    const pump =
        PumpsState.pumps.find(
            item =>
                String(item.id) ===
                String(nozzle.pumpId)
        );


    if (
        pump &&
        !pump.isActive
    ) {

        showToast(
            "Activate the pump before activating its nozzle.",
            "error"
        );

        return;

    }


    const confirmed =
        window.confirm(
            `Activate ${nozzle.nozzleNumber}?`
        );


    if (!confirmed) {

        return;

    }


    try {

        await apiRequest(
            `/nozzles/${encodeURIComponent(
                nozzleId
            )}`,
            {

                method:
                    "PATCH",

                body: {

                    is_active:
                        true

                }

            }
        );


        showToast(
            "Nozzle activated successfully.",
            "success"
        );


        await loadPumpsData();


        renderPumpRows();

        updateMetrics();


    } catch (error) {

        console.error(
            "Activate nozzle error:",
            error
        );


        showToast(
            error.message ||
            "Unable to activate nozzle.",
            "error"
        );

    }

}


/* =========================================================
   RENDER PUMP DIRECTORY
========================================================= */

function renderPumpRows() {

    const directory =
        document.getElementById(
            "pumpDirectory"
        );


    const emptyState =
        document.getElementById(
            "emptyPumpState"
        );


    if (!directory) {

        return;

    }


    let pumps =
        getVisiblePumps();


    /* -----------------------------------------
       SEARCH
    ----------------------------------------- */

    if (PumpsState.search) {

        const search =
            PumpsState.search;


        pumps =
            pumps.filter(
                pump => {

                    const station =
                        getStationById(
                            pump.stationId
                        );


                    const stationName =
                        station?.name ||
                        "";


                    return (

                        String(
                            pump.pumpNumber
                        )
                        .toLowerCase()
                        .includes(
                            search
                        )

                        ||

                        String(
                            pump.brand
                        )
                        .toLowerCase()
                        .includes(
                            search
                        )

                        ||

                        String(
                            pump.model
                        )
                        .toLowerCase()
                        .includes(
                            search
                        )

                        ||

                        stationName
                            .toLowerCase()
                            .includes(
                                search
                            )

                    );

                }
            );

    }


    /* -----------------------------------------
       STATUS
    ----------------------------------------- */

    if (
        PumpsState.status ===
        "active"
    ) {

        pumps =
            pumps.filter(
                pump =>
                    pump.isActive
            );

    }


    if (
        PumpsState.status ===
        "inactive"
    ) {

        pumps =
            pumps.filter(
                pump =>
                    !pump.isActive
            );

    }


    directory.innerHTML =
        "";


    const count =
        document.getElementById(
            "visiblePumpCount"
        );


    if (count) {

        count.textContent =
            pumps.length;

    }


    if (!pumps.length) {

        emptyState?.classList.remove(
            "hidden"
        );

        return;

    }


    emptyState?.classList.add(
        "hidden"
    );


    pumps.forEach(
        pump => {

            directory.appendChild(
                createPumpCard(
                    pump
                )
            );

        }
    );

}


/* =========================================================
   CREATE PUMP CARD
========================================================= */

function createPumpCard(
    pump
) {

    const station =
        getStationById(
            pump.stationId
        );


    const nozzles =
        getPumpNozzles(
            pump.id
        );


    const card =
        document.createElement(
            "article"
        );


    card.className =
        `fg-pump-card ${
            pump.isActive
                ? "is-active"
                : "is-inactive"
        }`;


    const activeNozzles =
        nozzles.filter(
            nozzle =>
                nozzle.isActive
        ).length;


    const pumpStatus =
        pump.isActive
            ? "Active"
            : "Inactive";


    let nozzleHTML =
        "";


    if (nozzles.length) {

        nozzleHTML =
            nozzles
                .map(
                    nozzle =>
                        renderNozzleCard(
                            nozzle
                        )
                )
                .join("");

    } else {

        nozzleHTML = `

            <div class="fg-nozzle-empty">

                <div>
                    ${pumpIcon("nozzle")}
                </div>

                <span>
                    No nozzles configured
                </span>

            </div>

        `;

    }


    let actionsHTML =
        "";


    if (canManageNozzles() &&
        pump.isActive) {

        actionsHTML += `

            <button
                type="button"
                class="fg-pump-action fg-pump-action-primary add-nozzle-button"
                data-id="${escapeHtml(
                    pump.id
                )}"
            >
                ${pumpIcon("plus")}
                Add Nozzle
            </button>

        `;

    }


    if (canManagePumps()) {

        actionsHTML += `

            <button
                type="button"
                class="fg-pump-action edit-pump-button"
                data-id="${escapeHtml(
                    pump.id
                )}"
            >
                ${pumpIcon("edit")}
                Edit
            </button>

        `;

    }


    if (
        pump.isActive &&
        canDeactivatePumps()
    ) {

        actionsHTML += `

            <button
                type="button"
                class="fg-pump-action fg-pump-action-danger deactivate-pump-button"
                data-id="${escapeHtml(
                    pump.id
                )}"
            >
                ${pumpIcon("trash")}
                Deactivate
            </button>

        `;

    }


    if (
        !pump.isActive &&
        canManagePumps()
    ) {

        actionsHTML += `

            <button
                type="button"
                class="fg-pump-action fg-pump-action-activate activate-pump-button"
                data-id="${escapeHtml(
                    pump.id
                )}"
            >
                ${pumpIcon("activate")}
                Activate
            </button>

        `;

    }


    card.innerHTML = `

        <div class="fg-pump-card-header">

            <div class="fg-pump-card-title">

                <div class="fg-pump-card-icon">
                    ${pumpIcon("pump")}
                </div>

                <div>

                    <h3>
                        ${escapeHtml(
                            pump.pumpNumber
                        )}
                    </h3>

                    <p>
                        ${escapeHtml(
                            station?.name ||
                            "Unknown Station"
                        )}
                    </p>

                </div>

            </div>


            <span
                class="fg-pump-status ${
                    pump.isActive
                        ? "active"
                        : "inactive"
                }"
            >

                <span></span>

                ${pumpStatus}

            </span>

        </div>


        <div class="fg-pump-equipment">

            <div>

                <span>
                    Brand
                </span>

                <strong>
                    ${escapeHtml(
                        pump.brand ||
                        "-"
                    )}
                </strong>

            </div>


            <div>

                <span>
                    Model
                </span>

                <strong>
                    ${escapeHtml(
                        pump.model ||
                        "-"
                    )}
                </strong>

            </div>


            <div>

                <span>
                    Nozzles
                </span>

                <strong>
                    ${activeNozzles}/${nozzles.length}
                </strong>

            </div>

        </div>


        <div class="fg-pump-nozzles-section">

            <div class="fg-pump-nozzles-header">

                <div>

                    <h4>
                        Nozzles
                    </h4>

                    <span>
                        ${nozzles.length}
                        configured
                    </span>

                </div>

            </div>


            <div class="fg-pump-nozzles">

                ${nozzleHTML}

            </div>

        </div>


        ${
            actionsHTML
                ? `
                    <div class="fg-pump-card-actions">

                        ${actionsHTML}

                    </div>
                `
                : ""
        }

    `;


    return card;

}


/* =========================================================
   RENDER NOZZLE
========================================================= */

function renderNozzleCard(
    nozzle
) {

    const productClass =
        String(
            nozzle.product || ""
        )
        .toLowerCase();


    let actions =
        "";


    if (canManageNozzles()) {

        actions += `

            <button
                type="button"
                class="fg-nozzle-action edit-nozzle-button"
                data-id="${escapeHtml(
                    nozzle.id
                )}"
                title="Edit nozzle"
            >
                ${pumpIcon("edit")}
            </button>

        `;

    }


    if (
        nozzle.isActive &&
        canDeactivateNozzles()
    ) {

        actions += `

            <button
                type="button"
                class="fg-nozzle-action fg-nozzle-danger deactivate-nozzle-button"
                data-id="${escapeHtml(
                    nozzle.id
                )}"
                title="Deactivate nozzle"
            >
                ${pumpIcon("trash")}
            </button>

        `;

    }


    if (
        !nozzle.isActive &&
        canManageNozzles()
    ) {

        actions += `

            <button
                type="button"
                class="fg-nozzle-action fg-nozzle-activate activate-nozzle-button"
                data-id="${escapeHtml(
                    nozzle.id
                )}"
                title="Activate nozzle"
            >
                ${pumpIcon("activate")}
            </button>

        `;

    }


    return `

        <div
            class="fg-nozzle-card ${
                nozzle.isActive
                    ? "is-active"
                    : "is-inactive"
            }"
        >

            <div class="fg-nozzle-icon">

                ${pumpIcon("nozzle")}

            </div>


            <div class="fg-nozzle-info">

                <strong>

                    ${escapeHtml(
                        nozzle.nozzleNumber
                    )}

                </strong>

                <span
                    class="fg-product-badge ${productClass}"
                >

                    ${escapeHtml(
                        nozzle.product ||
                        "-"
                    )}

                </span>


                <small>

                    ₦${formatNumber(
                        nozzle.pricePerLitre
                    )}/L

                </small>

            </div>


            <span
                class="fg-nozzle-status ${
                    nozzle.isActive
                        ? "active"
                        : "inactive"
                }"
            >

                ${
                    nozzle.isActive
                        ? "Active"
                        : "Inactive"
                }

            </span>


            ${
                actions
                    ? `
                        <div class="fg-nozzle-actions">

                            ${actions}

                        </div>
                    `
                    : ""
            }

        </div>

    `;

}


/* =========================================================
   UPDATE METRICS
========================================================= */

function updateMetrics() {

    const pumps =
        getVisiblePumps();


    const pumpIds =
        pumps.map(
            pump =>
                String(pump.id)
        );


    const nozzles =
        PumpsState.nozzles.filter(
            nozzle =>
                pumpIds.includes(
                    String(
                        nozzle.pumpId
                    )
                )
        );


    const activePumps =
        pumps.filter(
            pump =>
                pump.isActive
        );


    const activeNozzles =
        nozzles.filter(
            nozzle =>
                nozzle.isActive
        );


    const totalPumpsElement =
        document.getElementById(
            "totalPumps"
        );


    const activePumpsElement =
        document.getElementById(
            "activePumps"
        );


    const totalNozzlesElement =
        document.getElementById(
            "totalNozzles"
        );


    const activeNozzlesElement =
        document.getElementById(
            "activeNozzles"
        );


    if (totalPumpsElement) {

        totalPumpsElement.textContent =
            pumps.length;

    }


    if (activePumpsElement) {

        activePumpsElement.textContent =
            activePumps.length;

    }


    if (totalNozzlesElement) {

        totalNozzlesElement.textContent =
            nozzles.length;

    }


    if (activeNozzlesElement) {

        activeNozzlesElement.textContent =
            activeNozzles.length;

    }

}


/* =========================================================
   REFRESH
========================================================= */

async function refreshPumps() {

    const button =
        document.getElementById(
            "refreshPumps"
        );


    setButtonLoading(
        button,
        true,
        "Refreshing..."
    );


    try {

        await loadPumpsData();


        renderPumpRows();

        updateMetrics();


        showToast(
            "Pump data refreshed.",
            "success"
        );


    } catch (error) {

        showToast(
            error.message ||
            "Unable to refresh pump data.",
            "error"
        );

    } finally {

        setButtonLoading(
            button,
            false,
            "Refresh"
        );

    }

}


/* =========================================================
   MESSAGES
========================================================= */

function showMessage(
    element,
    message,
    type = "error"
) {

    if (!element) {

        return;

    }


    element.textContent =
        message;


    element.classList.remove(
        "hidden",
        "success",
        "error"
    );


    element.classList.add(
        type
    );

}


function clearMessage(
    id
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;

    }


    element.textContent =
        "";


    element.classList.add(
        "hidden"
    );


    element.classList.remove(
        "success",
        "error"
    );

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "success"
) {

    let container =
        document.getElementById(
            "fuelgapToastContainer"
        );


    if (!container) {

        container =
            document.createElement(
                "div"
            );


        container.id =
            "fuelgapToastContainer";


        container.className =
            "fuelgap-toast-container";


        document.body.appendChild(
            container
        );

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `fuelgap-toast ${type}`;


    toast.innerHTML = `

        <div class="fuelgap-toast-icon">

            ${
                type === "error"
                    ? "!"
                    : "✓"
            }

        </div>

        <span>
            ${escapeHtml(
                message
            )}
        </span>

    `;


    container.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.classList.add(
                "hide"
            );


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
   BUTTON LOADING
========================================================= */

function setButtonLoading(
    button,
    loading,
    text
) {

    if (!button) {

        return;

    }


    if (loading) {

        button.disabled =
            true;


        button.dataset.originalHtml =
            button.innerHTML;


        button.innerHTML = `

            <span class="fg-button-spinner"></span>

            ${escapeHtml(
                text
            )}

        `;

    } else {

        button.disabled =
            false;


        if (
            button.dataset.originalHtml
        ) {

            button.innerHTML =
                button.dataset.originalHtml;

            delete button.dataset
                .originalHtml;

        }

    }

}


/* =========================================================
   FORMAT NUMBER
========================================================= */

function formatNumber(
    value
) {

    const number =
        Number(value);


    if (
        Number.isNaN(number)
    ) {

        return "0.00";

    }


    return number.toLocaleString(
        "en-NG",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
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


    return String(value)
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
   PAGE ERROR
========================================================= */

function showPageError(
    message
) {

    const pageContent =
        document.getElementById(
            "pageContent"
        );


    if (!pageContent) {

        console.error(
            message
        );

        return;

    }


    pageContent.innerHTML = `

        <div
            style="
                padding:40px;
                text-align:center;
                background:#fff;
                border-radius:18px;
                border:1px solid #eee;
                margin:20px;
            "
        >

            <div
                style="
                    width:60px;
                    height:60px;
                    margin:0 auto 20px;
                    border-radius:50%;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    background:#fff4f4;
                    color:#dc2626;
                    font-size:26px;
                    font-weight:700;
                "
            >
                !
            </div>

            <h2>
                Unable to Load Pumps
            </h2>

            <p
                style="
                    color:#666;
                    margin:10px 0 20px;
                "
            >
                ${escapeHtml(
                    message
                )}
            </p>

            <button
                type="button"
                onclick="window.location.reload()"
                class="fg-pumps-primary-btn"
            >
                Try Again
            </button>

        </div>

    `;

}


/* =========================================================
   DYNAMIC STYLES
========================================================= */

function injectPumpsStyles() {

    if (
        document.getElementById(
            "fuelgapPumpsStyles"
        )
    ) {

        return;

    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "fuelgapPumpsStyles";


    style.textContent = `

        .fg-pumps-page {
            width:100%;
            max-width:1500px;
            margin:0 auto;
            padding:24px;
            color:#171717;
        }

        .fg-pumps-header {
            display:flex;
            align-items:center;
            justify-content:space-between;
            gap:20px;
            margin-bottom:28px;
        }

        .fg-pumps-title-group {
            display:flex;
            align-items:center;
            gap:16px;
        }

        .fg-pumps-page-icon {
            width:56px;
            height:56px;
            flex:0 0 56px;
            display:flex;
            align-items:center;
            justify-content:center;
            border-radius:16px;
            background:#facc15;
            color:#171717;
        }

        .fg-pumps-page-icon svg {
            width:28px;
            height:28px;
        }

        .fg-pumps-breadcrumb {
            font-size:11px;
            font-weight:800;
            letter-spacing:.12em;
            color:#8a8a8a;
            margin-bottom:5px;
        }

        .fg-pumps-breadcrumb span {
            margin:0 5px;
        }

        .fg-pumps-header h1 {
            margin:0;
            font-size:30px;
            line-height:1.15;
        }

        .fg-pumps-header p {
            margin:6px 0 0;
            color:#777;
            font-size:14px;
        }

        .fg-pumps-header-actions {
            display:flex;
            align-items:center;
            gap:10px;
        }

        .fg-pumps-primary-btn,
        .fg-pumps-secondary-btn {
            min-height:44px;
            border-radius:10px;
            padding:0 17px;
            border:1px solid transparent;
            display:inline-flex;
            align-items:center;
            justify-content:center;
            gap:8px;
            font-weight:800;
            cursor:pointer;
            transition:.2s ease;
        }

        .fg-pumps-primary-btn {
            background:#facc15;
            color:#171717;
            border-color:#facc15;
        }

        .fg-pumps-primary-btn:hover {
            background:#eab308;
            border-color:#eab308;
        }

        .fg-pumps-secondary-btn {
            background:#fff;
            color:#333;
            border-color:#e5e5e5;
        }

        .fg-pumps-secondary-btn:hover {
            background:#fafafa;
            border-color:#d4d4d4;
        }

        .fg-pumps-primary-btn svg,
        .fg-pumps-secondary-btn svg {
            width:17px;
            height:17px;
        }

        .fg-pump-metrics {
            display:grid;
            grid-template-columns:repeat(4,1fr);
            gap:16px;
            margin-bottom:22px;
        }

        .fg-pump-metric-card {
            background:#fff;
            border:1px solid #e9e9e9;
            border-radius:16px;
            padding:18px;
            display:flex;
            align-items:center;
            gap:14px;
            box-shadow:0 4px 18px rgba(0,0,0,.035);
        }

        .fg-pump-metric-icon {
            width:46px;
            height:46px;
            border-radius:13px;
            display:flex;
            align-items:center;
            justify-content:center;
            background:#fff7cc;
            color:#171717;
        }

        .fg-pump-metric-icon svg {
            width:22px;
            height:22px;
        }

        .fg-pump-metric-card span,
        .fg-pump-metric-card small {
            display:block;
        }

        .fg-pump-metric-card span {
            color:#777;
            font-size:12px;
            font-weight:700;
        }

        .fg-pump-metric-card strong {
            display:block;
            font-size:25px;
            margin:3px 0;
        }

        .fg-pump-metric-card small {
            color:#999;
            font-size:11px;
        }

        .fg-pumps-panel {
            background:#fff;
            border:1px solid #e9e9e9;
            border-radius:18px;
            box-shadow:0 4px 22px rgba(0,0,0,.035);
            overflow:hidden;
        }

        .fg-pumps-panel-header {
            padding:22px 24px;
            display:flex;
            align-items:center;
            justify-content:space-between;
            border-bottom:1px solid #eee;
        }

        .fg-pumps-panel-header h2 {
            margin:0;
            font-size:19px;
        }

        .fg-pumps-panel-header p {
            margin:5px 0 0;
            color:#858585;
            font-size:13px;
        }

        .fg-pumps-count {
            padding:8px 12px;
            background:#fafafa;
            border:1px solid #eee;
            border-radius:9px;
            color:#777;
            font-size:12px;
            font-weight:700;
        }

        .fg-pumps-count span {
            color:#171717;
            font-size:16px;
            margin-right:4px;
        }

        .fg-pumps-toolbar {
            display:flex;
            gap:12px;
            padding:18px 24px;
            border-bottom:1px solid #eee;
        }

        .fg-pumps-search {
            flex:1;
            min-height:44px;
            display:flex;
            align-items:center;
            gap:9px;
            border:1px solid #e5e5e5;
            border-radius:10px;
            padding:0 13px;
            background:#fff;
        }

        .fg-pumps-search svg,
        .fg-pumps-filter svg {
            width:18px;
            height:18px;
            color:#888;
            flex:0 0 auto;
        }

        .fg-pumps-search input {
            width:100%;
            border:0;
            outline:0;
            background:transparent;
            font-size:14px;
        }

        .fg-pumps-filter {
            width:180px;
            min-height:44px;
            display:flex;
            align-items:center;
            gap:8px;
            border:1px solid #e5e5e5;
            border-radius:10px;
            padding:0 12px;
        }

        .fg-pumps-filter select {
            width:100%;
            border:0;
            outline:0;
            background:transparent;
            font-size:13px;
            cursor:pointer;
        }

        .fg-pump-directory {
            padding:20px 24px 24px;
            display:grid;
            grid-template-columns:repeat(2,minmax(0,1fr));
            gap:16px;
        }

        .fg-pump-card {
            border:1px solid #e7e7e7;
            border-radius:16px;
            background:#fff;
            overflow:hidden;
            transition:.2s ease;
        }

        .fg-pump-card:hover {
            box-shadow:0 8px 28px rgba(0,0,0,.06);
            transform:translateY(-1px);
        }

        .fg-pump-card.is-inactive {
            opacity:.88;
            background:#fcfcfc;
        }

        .fg-pump-card-header {
            display:flex;
            justify-content:space-between;
            gap:15px;
            padding:18px;
        }

        .fg-pump-card-title {
            display:flex;
            gap:12px;
            align-items:center;
        }

        .fg-pump-card-icon {
            width:44px;
            height:44px;
            border-radius:12px;
            display:flex;
            align-items:center;
            justify-content:center;
            background:#fef3c7;
        }

        .fg-pump-card-icon svg {
            width:21px;
            height:21px;
        }

        .fg-pump-card-title h3 {
            margin:0;
            font-size:16px;
        }

        .fg-pump-card-title p {
            margin:4px 0 0;
            color:#858585;
            font-size:12px;
        }

        .fg-pump-status,
        .fg-nozzle-status {
            height:27px;
            display:inline-flex;
            align-items:center;
            gap:6px;
            padding:0 9px;
            border-radius:999px;
            font-size:10px;
            font-weight:800;
            white-space:nowrap;
        }

        .fg-pump-status span {
            width:6px;
            height:6px;
            border-radius:50%;
            background:currentColor;
        }

        .fg-pump-status.active,
        .fg-nozzle-status.active {
            background:#ecfdf3;
            color:#15803d;
        }

        .fg-pump-status.inactive,
        .fg-nozzle-status.inactive {
            background:#f4f4f5;
            color:#71717a;
        }

        .fg-pump-equipment {
            display:grid;
            grid-template-columns:repeat(3,1fr);
            border-top:1px solid #eee;
            border-bottom:1px solid #eee;
        }

        .fg-pump-equipment > div {
            padding:13px 16px;
            border-right:1px solid #eee;
        }

        .fg-pump-equipment > div:last-child {
            border-right:0;
        }

        .fg-pump-equipment span {
            display:block;
            color:#999;
            font-size:10px;
            font-weight:700;
            margin-bottom:4px;
        }

        .fg-pump-equipment strong {
            font-size:12px;
        }

        .fg-pump-nozzles-section {
            padding:15px 18px;
        }

        .fg-pump-nozzles-header {
            display:flex;
            justify-content:space-between;
            margin-bottom:10px;
        }

        .fg-pump-nozzles-header h4 {
            margin:0;
            font-size:12px;
        }

        .fg-pump-nozzles-header span {
            color:#999;
            font-size:10px;
        }

        .fg-pump-nozzles {
            display:flex;
            flex-direction:column;
            gap:8px;
        }

        .fg-nozzle-card {
            min-height:58px;
            border:1px solid #ededed;
            border-radius:11px;
            padding:9px 10px;
            display:flex;
            align-items:center;
            gap:9px;
            background:#fff;
        }

        .fg-nozzle-card.is-inactive {
            background:#fafafa;
        }

        .fg-nozzle-icon {
            width:34px;
            height:34px;
            flex:0 0 34px;
            border-radius:9px;
            background:#f7f7f7;
            display:flex;
            align-items:center;
            justify-content:center;
        }

        .fg-nozzle-icon svg {
            width:17px;
            height:17px;
        }

        .fg-nozzle-info {
            min-width:0;
            flex:1;
        }

        .fg-nozzle-info strong {
            display:block;
            font-size:12px;
        }

        .fg-nozzle-info small {
            display:block;
            color:#777;
            margin-top:3px;
            font-size:10px;
        }

        .fg-product-badge {
            display:inline-block;
            margin-top:3px;
            padding:2px 6px;
            border-radius:5px;
            background:#fff7cc;
            color:#713f12;
            font-size:9px;
            font-weight:800;
        }

        .fg-nozzle-actions {
            display:flex;
            gap:4px;
        }

        .fg-nozzle-action {
            width:30px;
            height:30px;
            border:1px solid #e8e8e8;
            border-radius:7px;
            background:#fff;
            display:flex;
            align-items:center;
            justify-content:center;
            cursor:pointer;
        }

        .fg-nozzle-action svg {
            width:14px;
            height:14px;
        }

        .fg-nozzle-danger {
            color:#dc2626;
        }

        .fg-nozzle-activate {
            color:#15803d;
        }

        .fg-pump-card-actions {
            display:flex;
            gap:7px;
            flex-wrap:wrap;
            padding:13px 18px 18px;
            border-top:1px solid #eee;
        }

        .fg-pump-action {
            min-height:34px;
            padding:0 10px;
            display:inline-flex;
            align-items:center;
            justify-content:center;
            gap:6px;
            border:1px solid #e5e5e5;
            border-radius:8px;
            background:#fff;
            color:#444;
            font-size:11px;
            font-weight:800;
            cursor:pointer;
        }

        .fg-pump-action svg {
            width:14px;
            height:14px;
        }

        .fg-pump-action-primary {
            background:#facc15;
            border-color:#facc15;
            color:#171717;
        }

        .fg-pump-action-danger {
            color:#dc2626;
        }

        .fg-pump-action-activate {
            background:#ecfdf3;
            border-color:#bbf7d0;
            color:#15803d;
        }

        .fg-nozzle-empty {
            min-height:52px;
            border:1px dashed #ddd;
            border-radius:10px;
            display:flex;
            align-items:center;
            justify-content:center;
            gap:8px;
            color:#999;
            font-size:11px;
        }

        .fg-nozzle-empty svg {
            width:17px;
            height:17px;
        }

        .fg-pumps-empty {
            padding:60px 20px;
            text-align:center;
        }

        .fg-pumps-empty.hidden {
            display:none;
        }

        .fg-pumps-empty-icon {
            width:60px;
            height:60px;
            margin:0 auto 15px;
            border-radius:18px;
            display:flex;
            align-items:center;
            justify-content:center;
            background:#fff7cc;
        }

        .fg-pumps-empty-icon svg {
            width:28px;
            height:28px;
        }

        .fg-pumps-empty h3 {
            margin:0;
        }

        .fg-pumps-empty p {
            max-width:420px;
            margin:7px auto 18px;
            color:#888;
            font-size:13px;
        }

        .fg-pumps-modal {
            position:fixed;
            inset:0;
            z-index:9999;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:20px;
        }

        .fg-pumps-modal.hidden {
            display:none;
        }

        .fg-pumps-modal-overlay {
            position:absolute;
            inset:0;
            background:rgba(0,0,0,.5);
        }

        .fg-pumps-modal-content {
            position:relative;
            width:100%;
            max-width:560px;
            max-height:90vh;
            overflow:auto;
            background:#fff;
            border-radius:18px;
            box-shadow:0 25px 70px rgba(0,0,0,.2);
        }

        .fg-pumps-modal-header {
            padding:22px;
            display:flex;
            justify-content:space-between;
            gap:20px;
            border-bottom:1px solid #eee;
        }

        .fg-pumps-modal-header > div {
            flex:1;
        }

        .fg-pumps-modal-header span {
            color:#999;
            font-size:10px;
            font-weight:800;
            letter-spacing:.1em;
        }

        .fg-pumps-modal-header h2 {
            margin:5px 0 5px;
            font-size:20px;
        }

        .fg-pumps-modal-header p {
            margin:0;
            color:#888;
            font-size:12px;
        }

        .fg-pumps-modal-close {
            width:36px;
            height:36px;
            border:1px solid #eee;
            border-radius:9px;
            background:#fff;
            cursor:pointer;
            display:flex;
            align-items:center;
            justify-content:center;
        }

        .fg-pumps-modal-close svg {
            width:17px;
            height:17px;
        }

        .fg-pumps-form-grid {
            padding:22px;
            display:grid;
            grid-template-columns:repeat(2,1fr);
            gap:15px;
        }

        .fg-pumps-form-group {
            display:flex;
            flex-direction:column;
            gap:7px;
        }

        .fg-pumps-full {
            grid-column:1/-1;
        }

        .fg-pumps-form-group label {
            font-size:11px;
            font-weight:800;
            color:#555;
        }

        .fg-pumps-form-group input,
        .fg-pumps-form-group select {
            width:100%;
            min-height:44px;
            padding:0 12px;
            border:1px solid #ddd;
            border-radius:9px;
            outline:0;
            font-size:13px;
            background:#fff;
            box-sizing:border-box;
        }

        .fg-pumps-form-group input:focus,
        .fg-pumps-form-group select:focus {
            border-color:#eab308;
            box-shadow:0 0 0 3px rgba(250,204,21,.15);
        }

        .fg-pumps-message {
            margin:0 22px;
            padding:10px 12px;
            border-radius:8px;
            font-size:12px;
        }

        .fg-pumps-message.hidden {
            display:none;
        }

        .fg-pumps-message.error {
            background:#fff1f2;
            color:#be123c;
        }

        .fg-pumps-message.success {
            background:#ecfdf5;
            color:#047857;
        }

        .fg-pumps-modal-footer {
            padding:18px 22px;
            border-top:1px solid #eee;
            display:flex;
            justify-content:flex-end;
            gap:9px;
        }

        .fg-button-spinner {
            width:14px;
            height:14px;
            border:2px solid currentColor;
            border-right-color:transparent;
            border-radius:50%;
            animation:fgSpin .7s linear infinite;
        }

        @keyframes fgSpin {
            to {
                transform:rotate(360deg);
            }
        }

        .fuelgap-toast-container {
            position:fixed;
            top:20px;
            right:20px;
            z-index:10000;
            display:flex;
            flex-direction:column;
            gap:8px;
        }

        .fuelgap-toast {
            min-width:270px;
            max-width:380px;
            padding:12px 14px;
            background:#fff;
            border:1px solid #e5e5e5;
            border-radius:10px;
            box-shadow:0 12px 35px rgba(0,0,0,.12);
            display:flex;
            align-items:center;
            gap:9px;
            font-size:12px;
            font-weight:700;
            animation:fgToastIn .25s ease;
        }

        .fuelgap-toast.error {
            border-left:4px solid #dc2626;
        }

        .fuelgap-toast.success {
            border-left:4px solid #16a34a;
        }

        .fuelgap-toast-icon {
            width:23px;
            height:23px;
            border-radius:50%;
            display:flex;
            align-items:center;
            justify-content:center;
            background:#facc15;
            color:#171717;
            font-size:12px;
            font-weight:900;
            flex:0 0 23px;
        }

        .fuelgap-toast.hide {
            opacity:0;
            transform:translateX(20px);
            transition:.3s ease;
        }

        @keyframes fgToastIn {
            from {
                opacity:0;
                transform:translateX(20px);
            }
            to {
                opacity:1;
                transform:translateX(0);
            }
        }

        @media (max-width:1100px) {

            .fg-pump-metrics {
                grid-template-columns:repeat(2,1fr);
            }

            .fg-pump-directory {
                grid-template-columns:1fr;
            }

        }

        @media (max-width:700px) {

            .fg-pumps-page {
                padding:15px;
            }

            .fg-pumps-header {
                align-items:flex-start;
                flex-direction:column;
            }

            .fg-pumps-header-actions {
                width:100%;
            }

            .fg-pumps-header-actions button {
                flex:1;
            }

            .fg-pump-metrics {
                grid-template-columns:1fr;
            }

            .fg-pumps-toolbar {
                flex-direction:column;
            }

            .fg-pumps-filter {
                width:auto;
            }

            .fg-pumps-panel-header {
                align-items:flex-start;
                gap:12px;
                flex-direction:column;
            }

            .fg-pump-card-header {
                flex-direction:column;
            }

            .fg-pump-equipment {
                grid-template-columns:1fr;
            }

            .fg-pump-equipment > div {
                border-right:0;
                border-bottom:1px solid #eee;
            }

            .fg-pump-equipment > div:last-child {
                border-bottom:0;
            }

            .fg-pumps-form-grid {
                grid-template-columns:1fr;
            }

            .fg-pumps-full {
                grid-column:auto;
            }

            .fg-pumps-modal {
                padding:10px;
            }

            .fg-pumps-modal-content {
                max-height:95vh;
            }

            .fuelgap-toast-container {
                left:12px;
                right:12px;
                top:12px;
            }

            .fuelgap-toast {
                min-width:0;
            }

        }

    `;


    document.head.appendChild(
        style
    );

}