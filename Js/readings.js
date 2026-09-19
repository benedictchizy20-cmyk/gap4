/* =========================================================
   FUELGAP - METER READINGS V4
   =========================================================
   APPLICATION SHELL:
   - Uses app.js navbar
   - Uses app.js sidebar
   - Uses app.js authentication
   - Uses app.js #pageContent
   - HttpOnly cookie authentication
   - No localStorage authentication

   BACKEND:
   GET    /api/meter-readings
   POST   /api/meter-readings
   DELETE /api/meter-readings/:id

   FEATURES:
   - Opening readings
   - Periodic readings
   - Closing readings
   - Correction readings
   - Historical captured_at
   - Optional photo evidence
   - Station / pump / nozzle selection
   - Shift selection
   - Search
   - Filters
   - Delete
   - Responsive UI
   - White + Yellow FuelGap design
========================================================= */

(function () {

    "use strict";

    console.log(
        "FuelGap readings.js V4 loaded successfully."
    );


    /* =====================================================
       CONFIGURATION
    ===================================================== */

    const API_BASE_URL =
        (
            window.FuelGapAPI &&
            window.FuelGapAPI.BASE_URL
        )
            ? window.FuelGapAPI.BASE_URL
            : "https://gap-backend-ywt2.onrender.com/api";


    /* =====================================================
       STATE
    ===================================================== */

    const state = {

        readings: [],

        stations: [],

        pumps: [],

        nozzles: [],

        shifts: [],

        currentUser: null,

        loading: false,

        saving: false,

        deleting: false,

        search: "",

        readingType: "",

        stationId: "",

        initialized: false

    };


    /* =====================================================
       ELEMENT
    ===================================================== */

    function getElement(id) {

        return document.getElementById(id);

    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHTML(value) {

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


    /* =====================================================
       API REQUEST
    ===================================================== */

    async function apiRequest(
        endpoint,
        options = {}
    ) {

        const url =
            endpoint.startsWith("http")
                ? endpoint
                : `${API_BASE_URL}${endpoint}`;


        const requestOptions = {

            credentials: "include",

            ...options,

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


        let result = null;


        try {

            result =
                await response.json();

        } catch {

            result = null;

        }


        if (!response.ok) {

            const message =
                result?.message ||
                result?.error ||
                `Server returned HTTP ${response.status}`;


            throw new Error(message);

        }


        return result;

    }


    /* =====================================================
       CURRENT USER
    ===================================================== */

    async function loadCurrentUser() {

        try {

            /*
             * First use the application state.
             */

            if (
                window.FuelGapAppState &&
                window.FuelGapAppState.currentUser
            ) {

                state.currentUser =
                    window.FuelGapAppState.currentUser;

                return state.currentUser;

            }


            /*
             * Otherwise use FuelGapUtils.
             */

            if (
                window.FuelGapUtils &&
                typeof window.FuelGapUtils.getCurrentUser ===
                "function"
            ) {

                const user =
                    await window.FuelGapUtils.getCurrentUser();


                state.currentUser =
                    user || null;


                return state.currentUser;

            }


            /*
             * Final fallback.
             */

            const result =
                await apiRequest(
                    "/auth/me"
                );


            state.currentUser =
                result?.data?.user ||
                result?.user ||
                result?.data ||
                null;


            return state.currentUser;

        } catch (error) {

            console.error(
                "FuelGap meter readings user error:",
                error
            );


            return null;

        }

    }


    /* =====================================================
       LOAD METER READINGS
    ===================================================== */

    async function loadReadings() {

        state.loading = true;


        showLoading();


        try {

            const result =
                await apiRequest(
                    "/meter-readings"
                );


            state.readings =
                normalizeArray(result);


            console.log(
                "FuelGap meter readings loaded:",
                state.readings.length
            );


            renderReadings();

        } catch (error) {

            console.error(
                "FuelGap meter readings load error:",
                error
            );


            showTableError(
                error.message ||
                "Unable to load meter readings."
            );

        } finally {

            state.loading = false;

        }

    }


    /* =====================================================
       LOAD SUPPORTING DATA
    ===================================================== */

    async function loadSupportingData() {

        await Promise.allSettled([

            loadStations(),

            loadPumps(),

            loadNozzles(),

            loadShifts()

        ]);

    }


    /* =====================================================
       LOAD STATIONS
    ===================================================== */

    async function loadStations() {

        try {

            const result =
                await apiRequest(
                    "/stations"
                );


            state.stations =
                normalizeArray(result);


            populateStationSelect();

        } catch (error) {

            console.warn(
                "FuelGap stations could not be loaded:",
                error.message
            );

        }

    }


    /* =====================================================
       LOAD PUMPS
    ===================================================== */

    async function loadPumps() {

        try {

            const result =
                await apiRequest(
                    "/pumps"
                );


            state.pumps =
                normalizeArray(result);


            populatePumpSelect();

        } catch (error) {

            console.warn(
                "FuelGap pumps could not be loaded:",
                error.message
            );

        }

    }


    /* =====================================================
       LOAD NOZZLES
    ===================================================== */

    async function loadNozzles() {

        try {

            const result =
                await apiRequest(
                    "/nozzles"
                );


            state.nozzles =
                normalizeArray(result);


            populateNozzleSelect();

        } catch (error) {

            console.warn(
                "FuelGap nozzles could not be loaded:",
                error.message
            );

        }

    }


    /* =====================================================
       LOAD SHIFTS
    ===================================================== */

    async function loadShifts() {

        try {

            const result =
                await apiRequest(
                    "/shifts"
                );


            state.shifts =
                normalizeArray(result);


            populateShiftSelect();

        } catch (error) {

            console.warn(
                "FuelGap shifts could not be loaded:",
                error.message
            );

        }

    }


    /* =====================================================
       NORMALIZE ARRAY
    ===================================================== */

    function normalizeArray(result) {

        if (
            Array.isArray(result)
        ) {

            return result;

        }


        if (
            Array.isArray(result?.data)
        ) {

            return result.data;

        }


        if (
            Array.isArray(result?.data?.items)
        ) {

            return result.data.items;

        }


        if (
            Array.isArray(result?.items)
        ) {

            return result.items;

        }


        return [];

    }


    /* =====================================================
       PAGE HTML
    ===================================================== */

    function renderPage() {

        const container =
            getElement(
                "pageContent"
            );


        if (!container) {

            console.error(
                "FuelGap: #pageContent was not found."
            );

            return false;

        }


        container.innerHTML = `

            <div class="fg-readings-page">

                <header class="fg-reading-header">

                    <div>

                        <div class="fg-page-kicker">
                            FORECOURT MONITORING
                        </div>

                        <h1>
                            Meter Readings
                        </h1>

                        <p>
                            Capture and monitor pump meter readings
                            across your fuel stations.
                        </p>

                    </div>


                    <div class="fg-header-actions">

                        <button
                            type="button"
                            class="fg-btn fg-btn-secondary"
                            id="fgRefreshBtn"
                        >
                            ↻ Refresh
                        </button>


                        <button
                            type="button"
                            class="fg-btn fg-btn-primary"
                            id="fgNewReadingBtn"
                        >
                            + New Reading
                        </button>

                    </div>

                </header>


                <section class="fg-stat-grid">

                    <div class="fg-stat-card">

                        <div class="fg-stat-icon">
                            ▥
                        </div>

                        <div>

                            <span>
                                Total Readings
                            </span>

                            <strong id="fgTotalReadings">
                                0
                            </strong>

                        </div>

                    </div>


                    <div class="fg-stat-card">

                        <div class="fg-stat-icon">
                            ◷
                        </div>

                        <div>

                            <span>
                                Opening
                            </span>

                            <strong id="fgOpeningReadings">
                                0
                            </strong>

                        </div>

                    </div>


                    <div class="fg-stat-card">

                        <div class="fg-stat-icon">
                            ◉
                        </div>

                        <div>

                            <span>
                                Periodic
                            </span>

                            <strong id="fgPeriodicReadings">
                                0
                            </strong>

                        </div>

                    </div>


                    <div class="fg-stat-card">

                        <div class="fg-stat-icon">
                            ✓
                        </div>

                        <div>

                            <span>
                                Closing
                            </span>

                            <strong id="fgClosingReadings">
                                0
                            </strong>

                        </div>

                    </div>

                </section>


                <section class="fg-content-card">

                    <div class="fg-toolbar">

                        <div class="fg-search">

                            <span>
                                ⌕
                            </span>

                            <input
                                type="search"
                                id="fgReadingSearch"
                                placeholder="Search readings..."
                            >

                        </div>


                        <select
                            id="fgTypeFilter"
                            class="fg-select"
                        >

                            <option value="">
                                All Reading Types
                            </option>

                            <option value="opening">
                                Opening
                            </option>

                            <option value="periodic">
                                Periodic
                            </option>

                            <option value="closing">
                                Closing
                            </option>

                            <option value="correction">
                                Correction
                            </option>

                        </select>


                        <select
                            id="fgStationFilter"
                            class="fg-select"
                        >

                            <option value="">
                                All Stations
                            </option>

                        </select>

                    </div>


                    <div
                        class="fg-table-wrapper"
                        id="fgReadingsTableArea"
                    >

                        <div class="fg-table-loading">

                            <div class="fg-spinner"></div>

                            <p>
                                Loading meter readings...
                            </p>

                        </div>

                    </div>

                </section>

            </div>


            <div
                class="fg-modal-overlay"
                id="fgReadingModal"
            >

                <div class="fg-modal">

                    <div class="fg-modal-header">

                        <div>

                            <span class="fg-page-kicker">
                                FORECOURT
                            </span>

                            <h2>
                                New Meter Reading
                            </h2>

                        </div>


                        <button
                            type="button"
                            class="fg-modal-close"
                            id="fgCloseModal"
                        >
                            ×
                        </button>

                    </div>


                    <form id="fgReadingForm">

                        <div class="fg-form-grid">


                            <div class="fg-form-group">

                                <label>
                                    Station
                                    <span>*</span>
                                </label>

                                <select
                                    id="fgStation"
                                    required
                                >

                                    <option value="">
                                        Select station
                                    </option>

                                </select>

                            </div>


                            <div class="fg-form-group">

                                <label>
                                    Pump
                                    <span>*</span>
                                </label>

                                <select
                                    id="fgPump"
                                    required
                                >

                                    <option value="">
                                        Select pump
                                    </option>

                                </select>

                            </div>


                            <div class="fg-form-group">

                                <label>
                                    Nozzle
                                    <span>*</span>
                                </label>

                                <select
                                    id="fgNozzle"
                                    required
                                >

                                    <option value="">
                                        Select nozzle
                                    </option>

                                </select>

                            </div>


                            <div class="fg-form-group">

                                <label>
                                    Reading Type
                                    <span>*</span>
                                </label>

                                <select
                                    id="fgReadingType"
                                    required
                                >

                                    <option value="">
                                        Select reading type
                                    </option>

                                    <option value="opening">
                                        Opening
                                    </option>

                                    <option value="periodic">
                                        Periodic
                                    </option>

                                    <option value="closing">
                                        Closing
                                    </option>

                                    <option value="correction">
                                        Correction
                                    </option>

                                </select>

                            </div>


                            <div class="fg-form-group">

                                <label>
                                    Meter Reading
                                    <span>*</span>
                                </label>

                                <input
                                    type="number"
                                    id="fgReadingValue"
                                    min="0"
                                    step="0.01"
                                    placeholder="Enter meter reading"
                                    required
                                >

                            </div>


                            <div class="fg-form-group">

                                <label>
                                    Shift
                                </label>

                                <select
                                    id="fgShift"
                                >

                                    <option value="">
                                        No shift selected
                                    </option>

                                </select>

                            </div>


                            <div class="fg-form-group fg-full">

                                <label>
                                    Captured Date & Time
                                </label>

                                <input
                                    type="datetime-local"
                                    id="fgCapturedAt"
                                >

                                <small>
                                    Leave as current time or select a
                                    historical date/time.
                                </small>

                            </div>


                            <div class="fg-form-group fg-full">

                                <label>
                                    Evidence Photo URL
                                </label>

                                <input
                                    type="url"
                                    id="fgPhotoUrl"
                                    placeholder="Optional photo URL"
                                >

                                <small>
                                    Evidence is optional.
                                </small>

                            </div>

                        </div>


                        <div
                            class="fg-form-message"
                            id="fgFormMessage"
                        ></div>


                        <div class="fg-modal-footer">

                            <button
                                type="button"
                                class="fg-btn fg-btn-secondary"
                                id="fgCancelReading"
                            >
                                Cancel
                            </button>


                            <button
                                type="submit"
                                class="fg-btn fg-btn-primary"
                                id="fgSaveReading"
                            >
                                Save Reading
                            </button>

                        </div>

                    </form>

                </div>

            </div>


            <div
                class="fg-toast"
                id="fgToast"
            ></div>

        `;


        return true;

    }


    /* =====================================================
       CSS
    ===================================================== */

    const PAGE_CSS = `

        .fg-readings-page {

            width: 100%;

            min-height: calc(100vh - 80px);

            color: #171717;

            font-family:
                Inter,
                Arial,
                Helvetica,
                sans-serif;

        }


        .fg-reading-header {

            display: flex;

            align-items: flex-start;

            justify-content: space-between;

            gap: 20px;

            margin-bottom: 28px;

        }


        .fg-page-kicker {

            color: #b18d00;

            font-size: 10px;

            font-weight: 900;

            letter-spacing: 1.5px;

            text-transform: uppercase;

        }


        .fg-reading-header h1 {

            margin: 5px 0 5px;

            font-size: 32px;

            line-height: 1.1;

            letter-spacing: -1.2px;

        }


        .fg-reading-header p {

            margin: 0;

            color: #777;

            font-size: 13px;

        }


        .fg-header-actions {

            display: flex;

            gap: 10px;

            flex-wrap: wrap;

        }


        .fg-btn {

            border: 0;

            border-radius: 9px;

            padding: 11px 17px;

            font-size: 12px;

            font-weight: 800;

            cursor: pointer;

            transition: 0.2s ease;

        }


        .fg-btn-primary {

            background: #ffd400;

            color: #111;

        }


        .fg-btn-primary:hover {

            background: #efc600;

            transform: translateY(-1px);

        }


        .fg-btn-secondary {

            background: #fff;

            border: 1px solid #deded7;

            color: #333;

        }


        .fg-btn-secondary:hover {

            background: #f8f8f5;

        }


        .fg-btn:disabled {

            opacity: 0.55;

            cursor: not-allowed;

            transform: none;

        }


        .fg-stat-grid {

            display: grid;

            grid-template-columns:
                repeat(4, minmax(0, 1fr));

            gap: 15px;

            margin-bottom: 20px;

        }


        .fg-stat-card {

            background: #fff;

            border: 1px solid #e9e9e3;

            border-radius: 13px;

            padding: 17px;

            display: flex;

            align-items: center;

            gap: 13px;

            box-shadow:
                0 2px 10px rgba(0,0,0,0.025);

        }


        .fg-stat-icon {

            width: 42px;

            height: 42px;

            border-radius: 11px;

            background: #fff7c9;

            display: flex;

            align-items: center;

            justify-content: center;

            font-weight: 900;

            font-size: 17px;

        }


        .fg-stat-card span {

            display: block;

            color: #888;

            font-size: 10px;

            font-weight: 700;

            margin-bottom: 4px;

        }


        .fg-stat-card strong {

            display: block;

            font-size: 22px;

            font-weight: 900;

        }


        .fg-content-card {

            background: #fff;

            border: 1px solid #e8e8e2;

            border-radius: 14px;

            overflow: hidden;

            box-shadow:
                0 3px 15px rgba(0,0,0,0.025);

        }


        .fg-toolbar {

            padding: 16px;

            display: flex;

            align-items: center;

            gap: 10px;

            border-bottom: 1px solid #eeeeea;

            flex-wrap: wrap;

        }


        .fg-search {

            flex: 1;

            min-width: 220px;

            height: 40px;

            display: flex;

            align-items: center;

            gap: 8px;

            padding: 0 12px;

            border: 1px solid #dddcd5;

            border-radius: 9px;

            background: #fff;

        }


        .fg-search span {

            color: #999;

            font-size: 17px;

        }


        .fg-search input {

            width: 100%;

            border: 0;

            outline: none;

            font-size: 12px;

        }


        .fg-select {

            height: 40px;

            padding: 0 11px;

            border: 1px solid #dddcd5;

            border-radius: 9px;

            background: #fff;

            font-size: 11px;

            outline: none;

            min-width: 160px;

        }


        .fg-table-wrapper {

            width: 100%;

            overflow-x: auto;

        }


        .fg-readings-table {

            width: 100%;

            border-collapse: collapse;

            min-width: 850px;

        }


        .fg-readings-table th {

            padding: 13px 15px;

            text-align: left;

            background: #fafaf7;

            color: #888;

            font-size: 9px;

            font-weight: 900;

            text-transform: uppercase;

            letter-spacing: 0.7px;

            border-bottom: 1px solid #eeeeea;

        }


        .fg-readings-table td {

            padding: 14px 15px;

            border-bottom: 1px solid #f0f0ec;

            font-size: 11px;

            vertical-align: middle;

        }


        .fg-readings-table tbody tr:hover {

            background: #fffdf0;

        }


        .fg-reading-number {

            font-weight: 900;

            font-size: 13px;

        }


        .fg-reading-meta {

            color: #999;

            font-size: 9px;

            margin-top: 3px;

        }


        .fg-type-badge {

            display: inline-flex;

            padding: 5px 8px;

            border-radius: 100px;

            font-size: 9px;

            font-weight: 900;

            text-transform: uppercase;

        }


        .fg-type-opening {

            background: #fff2b2;

            color: #806500;

        }


        .fg-type-periodic {

            background: #fff8d8;

            color: #786700;

        }


        .fg-type-closing {

            background: #eaf7ee;

            color: #217044;

        }


        .fg-type-correction {

            background: #f0f0f0;

            color: #555;

        }


        .fg-action-delete {

            border: 1px solid #eee;

            background: #fff;

            color: #777;

            border-radius: 7px;

            padding: 6px 9px;

            cursor: pointer;

            font-size: 10px;

        }


        .fg-action-delete:hover {

            background: #fff0f0;

            color: #b00000;

            border-color: #f2caca;

        }


        .fg-table-loading,
        .fg-table-empty,
        .fg-table-error {

            min-height: 260px;

            display: flex;

            flex-direction: column;

            align-items: center;

            justify-content: center;

            padding: 30px;

            text-align: center;

        }


        .fg-table-empty strong,
        .fg-table-error strong {

            font-size: 15px;

            margin-bottom: 7px;

        }


        .fg-table-empty p,
        .fg-table-error p {

            margin: 0;

            color: #888;

            font-size: 11px;

        }


        .fg-table-error {

            background: #fffafa;

        }


        .fg-table-error strong {

            color: #a10000;

        }


        .fg-spinner {

            width: 28px;

            height: 28px;

            border: 3px solid #eee;

            border-top-color: #ffd400;

            border-radius: 50%;

            animation:
                fgSpin 0.8s linear infinite;

        }


        @keyframes fgSpin {

            to {
                transform: rotate(360deg);
            }

        }


        .fg-modal-overlay {

            position: fixed;

            inset: 0;

            background:
                rgba(0,0,0,0.48);

            display: none;

            align-items: center;

            justify-content: center;

            padding: 20px;

            z-index: 1000;

        }


        .fg-modal-overlay.open {

            display: flex;

        }


        .fg-modal {

            width: min(700px, 100%);

            max-height: 90vh;

            overflow-y: auto;

            background: #fff;

            border-radius: 16px;

            box-shadow:
                0 20px 70px rgba(0,0,0,0.2);

        }


        .fg-modal-header {

            padding: 22px;

            display: flex;

            align-items: flex-start;

            justify-content: space-between;

            border-bottom: 1px solid #eeeeea;

        }


        .fg-modal-header h2 {

            margin: 4px 0 0;

            font-size: 21px;

        }


        .fg-modal-close {

            border: 0;

            background: #f5f5f1;

            width: 32px;

            height: 32px;

            border-radius: 8px;

            font-size: 20px;

            cursor: pointer;

        }


        #fgReadingForm {

            padding: 22px;

        }


        .fg-form-grid {

            display: grid;

            grid-template-columns:
                repeat(2, minmax(0, 1fr));

            gap: 17px;

        }


        .fg-form-group {

            display: flex;

            flex-direction: column;

            gap: 7px;

        }


        .fg-form-group.fg-full {

            grid-column: 1 / -1;

        }


        .fg-form-group label {

            font-size: 10px;

            font-weight: 900;

            color: #444;

        }


        .fg-form-group label span {

            color: #c49d00;

        }


        .fg-form-group input,
        .fg-form-group select {

            height: 42px;

            padding: 0 12px;

            border: 1px solid #deded7;

            border-radius: 9px;

            outline: none;

            font-size: 12px;

            background: #fff;

        }


        .fg-form-group input:focus,
        .fg-form-group select:focus {

            border-color: #e4bf00;

            box-shadow:
                0 0 0 3px #fff7c7;

        }


        .fg-form-group small {

            color: #999;

            font-size: 9px;

        }


        .fg-modal-footer {

            margin-top: 22px;

            display: flex;

            justify-content: flex-end;

            gap: 9px;

            padding-top: 18px;

            border-top: 1px solid #eeeeea;

        }


        .fg-form-message {

            display: none;

            margin-top: 17px;

            padding: 11px;

            border-radius: 8px;

            font-size: 10px;

        }


        .fg-form-message.show {

            display: block;

        }


        .fg-form-message.error {

            background: #fff0f0;

            color: #9d0000;

        }


        .fg-form-message.success {

            background: #eefaf2;

            color: #23703c;

        }


        .fg-toast {

            position: fixed;

            right: 22px;

            bottom: 22px;

            background: #111;

            color: #fff;

            padding: 12px 16px;

            border-radius: 9px;

            font-size: 11px;

            font-weight: 700;

            opacity: 0;

            pointer-events: none;

            transform: translateY(10px);

            transition: 0.25s ease;

            z-index: 1200;

        }


        .fg-toast.show {

            opacity: 1;

            transform: translateY(0);

        }


        @media (max-width: 1000px) {

            .fg-reading-header {

                flex-direction: column;

            }


            .fg-stat-grid {

                grid-template-columns:
                    repeat(2, minmax(0, 1fr));

            }

        }


        @media (max-width: 760px) {

            .fg-reading-header h1 {

                font-size: 27px;

            }


            .fg-stat-grid {

                grid-template-columns: 1fr 1fr;

            }


            .fg-form-grid {

                grid-template-columns: 1fr;

            }


            .fg-form-group.fg-full {

                grid-column: auto;

            }

        }


        @media (max-width: 480px) {

            .fg-stat-grid {

                grid-template-columns: 1fr;

            }


            .fg-header-actions {

                width: 100%;

            }


            .fg-header-actions .fg-btn {

                flex: 1;

            }

        }

    `;


    /* =====================================================
       INJECT PAGE CSS
    ===================================================== */

    function injectPageCSS() {

        if (
            document.getElementById(
                "fuelgap-readings-page-css"
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "fuelgap-readings-page-css";


        style.textContent =
            PAGE_CSS;


        document.head.appendChild(
            style
        );

    }


    /* =====================================================
       RENDER READINGS
    ===================================================== */

    function renderReadings() {

        const area =
            getElement(
                "fgReadingsTableArea"
            );


        if (!area) {

            return;

        }


        updateStats();


        const filtered =
            getFilteredReadings();


        if (!filtered.length) {

            area.innerHTML = `

                <div class="fg-table-empty">

                    <strong>
                        No meter readings found
                    </strong>

                    <p>
                        Create your first meter reading
                        using the New Reading button.
                    </p>

                </div>

            `;

            return;

        }


        area.innerHTML = `

            <table class="fg-readings-table">

                <thead>

                    <tr>

                        <th>
                            Reading
                        </th>

                        <th>
                            Station
                        </th>

                        <th>
                            Pump
                        </th>

                        <th>
                            Nozzle
                        </th>

                        <th>
                            Type
                        </th>

                        <th>
                            Shift
                        </th>

                        <th>
                            Captured
                        </th>

                        <th>
                            Action
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        filtered
                            .map(
                                renderReadingRow
                            )
                            .join("")
                    }

                </tbody>

            </table>

        `;

    }


    /* =====================================================
       READING ROW
    ===================================================== */

    function renderReadingRow(
        reading
    ) {

        const station =
            findStation(
                reading.station_id
            );


        const pump =
            findPump(
                reading.pump_id
            );


        const nozzle =
            findNozzle(
                reading.nozzle_id
            );


        const shift =
            findShift(
                reading.shift_id
            );


        const type =
            String(
                reading.reading_type || ""
            )
                .toLowerCase();


        return `

            <tr>

                <td>

                    <div class="fg-reading-number">

                        ${formatNumber(
                            reading.reading
                        )}

                    </div>


                    <div class="fg-reading-meta">

                        ID:
                        ${escapeHTML(
                            String(
                                reading.id || ""
                            ).slice(0, 8)
                        )}

                    </div>

                </td>


                <td>

                    ${escapeHTML(
                        station?.name ||
                        station?.station_name ||
                        reading.station_id ||
                        "Unknown station"
                    )}

                </td>


                <td>

                    ${
                        pump
                            ? `#${escapeHTML(
                                pump.pump_number ||
                                pump.id
                            )}
                            ${
                                pump.brand
                                    ? ` - ${escapeHTML(
                                        pump.brand
                                    )}`
                                    : ""
                            }`
                            : escapeHTML(
                                reading.pump_id ||
                                "Unknown pump"
                            )
                    }

                </td>


                <td>

                    ${
                        nozzle
                            ? `#${escapeHTML(
                                nozzle.nozzle_number ||
                                nozzle.id
                            )}
                            ${
                                nozzle.fuel_type
                                    ? ` - ${escapeHTML(
                                        nozzle.fuel_type
                                    )}`
                                    : ""
                            }`
                            : escapeHTML(
                                reading.nozzle_id ||
                                "Unknown nozzle"
                            )
                    }

                </td>


                <td>

                    <span
                        class="
                            fg-type-badge
                            fg-type-${escapeHTML(
                                type
                            )}
                        "
                    >

                        ${escapeHTML(
                            type || "unknown"
                        )}

                    </span>

                </td>


                <td>

                    ${
                        shift
                            ? escapeHTML(
                                shift.shift_name ||
                                shift.name ||
                                shift.id
                            )
                            : reading.shift_id
                                ? escapeHTML(
                                    String(
                                        reading.shift_id
                                    ).slice(0, 8)
                                )
                                : "—"
                    }

                </td>


                <td>

                    ${formatDate(
                        reading.captured_at
                    )}

                </td>


                <td>

                    <button
                        type="button"
                        class="fg-action-delete"
                        data-delete-reading="${escapeHTML(
                            reading.id
                        )}"
                    >
                        Delete
                    </button>

                </td>

            </tr>

        `;

    }


    /* =====================================================
       FILTER
    ===================================================== */

    function getFilteredReadings() {

        const search =
            state.search
                .trim()
                .toLowerCase();


        return state.readings.filter(
            reading => {

                const type =
                    String(
                        reading.reading_type || ""
                    )
                        .toLowerCase();


                if (
                    state.readingType &&
                    type !==
                    state.readingType
                ) {

                    return false;

                }


                if (
                    state.stationId &&
                    String(
                        reading.station_id
                    ) !==
                    String(
                        state.stationId
                    )
                ) {

                    return false;

                }


                if (!search) {

                    return true;

                }


                const searchable = [

                    reading.reading,

                    reading.reading_type,

                    reading.station_id,

                    reading.pump_id,

                    reading.nozzle_id,

                    reading.shift_id,

                    reading.captured_at,

                    findStation(
                        reading.station_id
                    )?.name,

                    findStation(
                        reading.station_id
                    )?.station_name,

                    findPump(
                        reading.pump_id
                    )?.pump_number,

                    findNozzle(
                        reading.nozzle_id
                    )?.fuel_type

                ]

                    .filter(Boolean)

                    .join(" ")

                    .toLowerCase();


                return searchable.includes(
                    search
                );

            }
        );

    }


    /* =====================================================
       STATS
    ===================================================== */

    function updateStats() {

        setText(
            "fgTotalReadings",
            state.readings.length
        );


        setText(
            "fgOpeningReadings",
            countType("opening")
        );


        setText(
            "fgPeriodicReadings",
            countType("periodic")
        );


        setText(
            "fgClosingReadings",
            countType("closing")
        );

    }


    function countType(type) {

        return state.readings.filter(
            item =>
                String(
                    item.reading_type || ""
                )
                    .toLowerCase() ===
                type
        ).length;

    }


    /* =====================================================
       CREATE READING
    ===================================================== */

    async function createReading(
        event
    ) {

        event.preventDefault();


        if (state.saving) {

            return;

        }


        const stationId =
            getElement(
                "fgStation"
            )?.value;


        const pumpId =
            getElement(
                "fgPump"
            )?.value;


        const nozzleId =
            getElement(
                "fgNozzle"
            )?.value;


        const readingType =
            getElement(
                "fgReadingType"
            )?.value;


        const readingValue =
            getElement(
                "fgReadingValue"
            )?.value;


        const shiftId =
            getElement(
                "fgShift"
            )?.value;


        const capturedAt =
            getElement(
                "fgCapturedAt"
            )?.value;


        const photoUrl =
            getElement(
                "fgPhotoUrl"
            )?.value.trim();


        if (
            !stationId ||
            !pumpId ||
            !nozzleId ||
            !readingType ||
            readingValue === ""
        ) {

            showFormMessage(
                "Please complete all required fields.",
                "error"
            );


            return;

        }


        const numericReading =
            Number(
                readingValue
            );


        if (
            !Number.isFinite(
                numericReading
            ) ||
            numericReading < 0
        ) {

            showFormMessage(
                "Enter a valid meter reading.",
                "error"
            );


            return;

        }


        const payload = {

            station_id:
                stationId,

            pump_id:
                pumpId,

            nozzle_id:
                nozzleId,

            reading_type:
                readingType,

            reading:
                numericReading,

            shift_id:
                shiftId ||
                null,

            photo_url:
                photoUrl ||
                null,

            captured_at:
                capturedAt
                    ? new Date(
                        capturedAt
                    ).toISOString()
                    : new Date().toISOString()

        };


        state.saving = true;


        const saveButton =
            getElement(
                "fgSaveReading"
            );


        if (saveButton) {

            saveButton.disabled =
                true;


            saveButton.textContent =
                "Saving...";

        }


        try {

            const result =
                await apiRequest(
                    "/meter-readings",
                    {

                        method:
                            "POST",

                        body:
                            JSON.stringify(
                                payload
                            )

                    }
                );


            console.log(
                "Meter reading created:",
                result
            );


            showFormMessage(
                "Meter reading saved successfully.",
                "success"
            );


            showToast(
                "Meter reading saved successfully."
            );


            closeModal();


            await loadReadings();

        } catch (error) {

            console.error(
                "Create meter reading error:",
                error
            );


            showFormMessage(
                error.message ||
                "Failed to save meter reading.",
                "error"
            );

        } finally {

            state.saving =
                false;


            if (saveButton) {

                saveButton.disabled =
                    false;


                saveButton.textContent =
                    "Save Reading";

            }

        }

    }


    /* =====================================================
       DELETE
    ===================================================== */

    async function deleteReading(
        id
    ) {

        if (
            !id ||
            state.deleting
        ) {

            return;

        }


        const confirmed =
            window.confirm(
                "Are you sure you want to delete this meter reading?"
            );


        if (!confirmed) {

            return;

        }


        state.deleting =
            true;


        try {

            await apiRequest(
                `/meter-readings/${encodeURIComponent(
                    id
                )}`,
                {

                    method:
                        "DELETE"

                }
            );


            state.readings =
                state.readings.filter(
                    item =>
                        String(
                            item.id
                        ) !==
                        String(
                            id
                        )
                );


            renderReadings();


            showToast(
                "Meter reading deleted."
            );

        } catch (error) {

            console.error(
                "Delete meter reading error:",
                error
            );


            showToast(
                error.message ||
                "Unable to delete meter reading."
            );

        } finally {

            state.deleting =
                false;

        }

    }


    /* =====================================================
       MODAL
    ===================================================== */

    function openModal() {

        const modal =
            getElement(
                "fgReadingModal"
            );


        if (!modal) {

            return;

        }


        resetForm();


        modal.classList.add(
            "open"
        );

    }


    function closeModal() {

        const modal =
            getElement(
                "fgReadingModal"
            );


        if (!modal) {

            return;

        }


        modal.classList.remove(
            "open"
        );


        resetForm();

    }


    function resetForm() {

        const form =
            getElement(
                "fgReadingForm"
            );


        if (form) {

            form.reset();

        }


        clearFormMessage();


        populateStationSelect();

        populatePumpSelect();

        populateNozzleSelect();

        populateShiftSelect();


        const captured =
            getElement(
                "fgCapturedAt"
            );


        if (captured) {

            const now =
                new Date();


            const local =
                new Date(
                    now.getTime() -
                    now.getTimezoneOffset() *
                    60000
                )
                    .toISOString()
                    .slice(
                        0,
                        16
                    );


            captured.value =
                local;

        }

    }


    /* =====================================================
       SELECT HELPERS
    ===================================================== */

    function populateStationSelect() {

        const ids = [

            "fgStation",

            "fgStationFilter"

        ];


        ids.forEach(
            id => {

                const select =
                    getElement(
                        id
                    );


                if (!select) {

                    return;

                }


                const current =
                    select.value;


                const isFilter =
                    id ===
                    "fgStationFilter";


                select.innerHTML =
                    isFilter

                        ? `
                            <option value="">
                                All Stations
                            </option>
                        `

                        : `
                            <option value="">
                                Select station
                            </option>
                        `;


                state.stations.forEach(
                    station => {

                        const option =
                            document.createElement(
                                "option"
                            );


                        option.value =
                            station.id;


                        option.textContent =
                            station.name ||
                            station.station_name ||
                            station.id;


                        select.appendChild(
                            option
                        );

                    }
                );


                if (current) {

                    select.value =
                        current;

                }

            }
        );

    }


    function populatePumpSelect() {

        const select =
            getElement(
                "fgPump"
            );


        if (!select) {

            return;

        }


        const stationId =
            getElement(
                "fgStation"
            )?.value;


        select.innerHTML = `

            <option value="">
                Select pump
            </option>

        `;


        state.pumps

            .filter(
                pump => {

                    if (!stationId) {

                        return true;

                    }


                    return String(
                        pump.station_id
                    ) ===
                    String(
                        stationId
                    );

                }
            )

            .forEach(
                pump => {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        pump.id;


                    option.textContent =
                        `Pump #${
                            pump.pump_number ||
                            pump.id
                        }${
                            pump.brand
                                ? ` - ${pump.brand}`
                                : ""
                        }`;


                    select.appendChild(
                        option
                    );

                }
            );

    }


    function populateNozzleSelect() {

        const select =
            getElement(
                "fgNozzle"
            );


        if (!select) {

            return;

        }


        const pumpId =
            getElement(
                "fgPump"
            )?.value;


        select.innerHTML = `

            <option value="">
                Select nozzle
            </option>

        `;


        state.nozzles

            .filter(
                nozzle => {

                    if (!pumpId) {

                        return true;

                    }


                    return String(
                        nozzle.pump_id
                    ) ===
                    String(
                        pumpId
                    );

                }
            )

            .forEach(
                nozzle => {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        nozzle.id;


                    option.textContent =
                        `Nozzle #${
                            nozzle.nozzle_number ||
                            nozzle.id
                        }${
                            nozzle.fuel_type
                                ? ` - ${nozzle.fuel_type}`
                                : ""
                        }`;


                    select.appendChild(
                        option
                    );

                }
            );

    }


    function populateShiftSelect() {

        const select =
            getElement(
                "fgShift"
            );


        if (!select) {

            return;

        }


        const stationId =
            getElement(
                "fgStation"
            )?.value;


        select.innerHTML = `

            <option value="">
                No shift selected
            </option>

        `;


        state.shifts

            .filter(
                shift => {

                    if (!stationId) {

                        return true;

                    }


                    return String(
                        shift.station_id
                    ) ===
                    String(
                        stationId
                    );

                }
            )

            .forEach(
                shift => {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        shift.id;


                    option.textContent =
                        shift.shift_name ||
                        shift.name ||
                        `Shift ${String(
                            shift.id
                        ).slice(
                            0,
                            8
                        )}`;


                    select.appendChild(
                        option
                    );

                }
            );

    }


    /* =====================================================
       EVENT LISTENERS
    ===================================================== */

    function bindEvents() {

        getElement(
            "fgRefreshBtn"
        )?.addEventListener(
            "click",
            loadReadings
        );


        getElement(
            "fgNewReadingBtn"
        )?.addEventListener(
            "click",
            openModal
        );


        getElement(
            "fgCloseModal"
        )?.addEventListener(
            "click",
            closeModal
        );


        getElement(
            "fgCancelReading"
        )?.addEventListener(
            "click",
            closeModal
        );


        getElement(
            "fgReadingForm"
        )?.addEventListener(
            "submit",
            createReading
        );


        getElement(
            "fgReadingSearch"
        )?.addEventListener(
            "input",
            event => {

                state.search =
                    event.target.value;


                renderReadings();

            }
        );


        getElement(
            "fgTypeFilter"
        )?.addEventListener(
            "change",
            event => {

                state.readingType =
                    event.target.value;


                renderReadings();

            }
        );


        getElement(
            "fgStationFilter"
        )?.addEventListener(
            "change",
            event => {

                state.stationId =
                    event.target.value;


                renderReadings();

            }
        );


        getElement(
            "fgStation"
        )?.addEventListener(
            "change",
            () => {

                populatePumpSelect();

                populateNozzleSelect();

                populateShiftSelect();

            }
        );


        getElement(
            "fgPump"
        )?.addEventListener(
            "change",
            () => {

                populateNozzleSelect();

            }
        );


        document.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-delete-reading]"
                    );


                if (!button) {

                    return;

                }


                const id =
                    button.getAttribute(
                        "data-delete-reading"
                    );


                deleteReading(
                    id
                );

            }
        );


        const modal =
            getElement(
                "fgReadingModal"
            );


        modal?.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {

                    closeModal();

                }

            }
        );

    }


    /* =====================================================
       LOADING STATE
    ===================================================== */

    function showLoading() {

        const area =
            getElement(
                "fgReadingsTableArea"
            );


        if (!area) {

            return;

        }


        area.innerHTML = `

            <div class="fg-table-loading">

                <div class="fg-spinner"></div>

                <p>
                    Loading meter readings...
                </p>

            </div>

        `;

    }


    /* =====================================================
       ERROR STATE
    ===================================================== */

    function showTableError(
        message
    ) {

        const area =
            getElement(
                "fgReadingsTableArea"
            );


        if (!area) {

            return;

        }


        area.innerHTML = `

            <div class="fg-table-error">

                <strong>
                    Could not load meter readings
                </strong>

                <p>
                    ${escapeHTML(
                        message
                    )}
                </p>


                <button
                    type="button"
                    class="fg-btn fg-btn-primary"
                    style="margin-top:15px;"
                    id="fgRetryReadings"
                >
                    Try Again
                </button>

            </div>

        `;


        getElement(
            "fgRetryReadings"
        )?.addEventListener(
            "click",
            loadReadings
        );

    }


    /* =====================================================
       FORM MESSAGE
    ===================================================== */

    function showFormMessage(
        message,
        type
    ) {

        const element =
            getElement(
                "fgFormMessage"
            );


        if (!element) {

            return;

        }


        element.textContent =
            message;


        element.className =
            `fg-form-message show ${type}`;

    }


    function clearFormMessage() {

        const element =
            getElement(
                "fgFormMessage"
            );


        if (!element) {

            return;

        }


        element.textContent =
            "";


        element.className =
            "fg-form-message";

    }


    /* =====================================================
       TOAST
    ===================================================== */

    let toastTimer = null;


    function showToast(
        message
    ) {

        const toast =
            getElement(
                "fgToast"
            );


        if (!toast) {

            return;

        }


        toast.textContent =
            message;


        toast.classList.add(
            "show"
        );


        clearTimeout(
            toastTimer
        );


        toastTimer =
            setTimeout(
                () => {

                    toast.classList.remove(
                        "show"
                    );

                },
                3000
            );

    }


    /* =====================================================
       LOOKUPS
    ===================================================== */

    function findStation(
        id
    ) {

        return state.stations.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    id
                )
        );

    }


    function findPump(
        id
    ) {

        return state.pumps.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    id
                )
        );

    }


    function findNozzle(
        id
    ) {

        return state.nozzles.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    id
                )
        );

    }


    function findShift(
        id
    ) {

        return state.shifts.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    id
                )
        );

    }


    /* =====================================================
       FORMATTING
    ===================================================== */

    function formatNumber(
        value
    ) {

        const number =
            Number(
                value
            );


        if (
            !Number.isFinite(
                number
            )
        ) {

            return escapeHTML(
                value
            );

        }


        return number.toLocaleString(
            "en-NG",
            {
                minimumFractionDigits:
                    0,

                maximumFractionDigits:
                    2
            }
        );

    }


    function formatDate(
        value
    ) {

        if (!value) {

            return "—";

        }


        const date =
            new Date(
                value
            );


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return escapeHTML(
                value
            );

        }


        return date.toLocaleString(
            "en-NG",
            {
                year:
                    "numeric",

                month:
                    "short",

                day:
                    "numeric",

                hour:
                    "2-digit",

                minute:
                    "2-digit"
            }
        );

    }


    /* =====================================================
       SET TEXT
    ===================================================== */

    function setText(
        id,
        value
    ) {

        const element =
            getElement(
                id
            );


        if (element) {

            element.textContent =
                value;

        }

    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    async function init() {

        if (
            state.initialized
        ) {

            return;

        }


        console.log(
            "FuelGap Meter Readings initializing..."
        );


        /*
         * app.js must finish first.
         */

        const pageContent =
            getElement(
                "pageContent"
            );


        if (!pageContent) {

            console.error(
                "FuelGap: #pageContent is not ready."
            );

            return;

        }


        injectPageCSS();


        /*
         * Render only the page content.
         * app.js owns the navbar/sidebar.
         */

        const rendered =
            renderPage();


        if (!rendered) {

            console.error(
                "FuelGap Meter Readings could not render."
            );

            return;

        }


        state.initialized =
            true;


        bindEvents();


        await loadCurrentUser();


        await Promise.allSettled([

            loadSupportingData(),

            loadReadings()

        ]);


        /*
         * Make sure Meter Readings remains
         * the active sidebar item.
         */

        if (
            typeof window.setActiveSidebarLink ===
            "function"
        ) {

            window.setActiveSidebarLink(
                "readings"
            );

        }


        console.log(
            "FuelGap Meter Readings initialized successfully."
        );

    }


    /* =====================================================
       WAIT FOR APPLICATION SHELL
    ===================================================== */

    function startWhenAppReady() {

        /*
         * If app.js has already completed
         * before this script starts.
         */

        if (
            window.FuelGapAppState &&
            window.FuelGapAppState.currentUser &&
            getElement("pageContent")
        ) {

            init();

            return;

        }


        /*
         * Normal path:
         * Wait for app.js.
         */

        document.addEventListener(
            "fuelgap:app-ready",
            () => {

                init();

            },
            {
                once: true
            }
        );

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.FuelGapMeterReadings = {

        init,

        loadReadings,

        openModal,

        closeModal

    };


    /* =====================================================
       AUTO START
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            startWhenAppReady,
            {
                once: true
            }
        );

    } else {

        startWhenAppReady();

    }

})();