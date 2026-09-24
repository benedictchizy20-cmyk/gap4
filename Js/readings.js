/* =========================================================
   FUELGAP - METER READINGS V5
   =========================================================
   APPLICATION SHELL:
   - Uses app.js navbar
   - Uses app.js sidebar
   - Uses app.js authentication
   - Uses app.js #pageContent
   - HttpOnly cookie authentication
   - No localStorage authentication

   FEATURES:
   - Opening readings
   - Periodic readings
   - Closing readings
   - Correction readings
   - Historical records
   - Current/live readings
   - LIVE CAMERA evidence for current readings
   - Existing image upload for historical readings
   - Historical readings may have no image
   - Station -> Pump -> Nozzle dependency
   - Shift selection
   - Search
   - Filters
   - Delete
   - Responsive UI
   - White + Yellow FuelGap design
========================================================= */

(function () {

    "use strict";

    console.log("FuelGap readings.js V5 loaded successfully.");

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

        initialized: false,

        cameraStream: null,

        cameraReady: false,

        cameraSnapshot: null,

        evidenceFile: null,

        evidenceMode: "current"

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

            .replace(/&/g, "&amp;")

            .replace(/</g, "&lt;")

            .replace(/>/g, "&gt;")

            .replace(/"/g, "&quot;")

            .replace(/'/g, "&#039;");

    }


    /* =====================================================
       API REQUEST
    ===================================================== */

    async function apiRequest(endpoint, options = {}) {

        const url =
            endpoint.startsWith("http")
                ? endpoint
                : `${API_BASE_URL}${endpoint}`;

        const requestOptions = {

            credentials: "include",

            ...options,

            headers: {

                ...(options.body instanceof FormData
                    ? {}
                    : {
                        "Content-Type":
                            "application/json"
                    }),

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

            if (
                window.FuelGapAppState &&
                window.FuelGapAppState.currentUser
            ) {

                state.currentUser =
                    window.FuelGapAppState.currentUser;

                return state.currentUser;

            }

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
       NORMALIZE ARRAY
       Handles different backend response structures
    ===================================================== */

    function normalizeArray(result) {

        if (Array.isArray(result)) {

            return result;

        }

        const possibleArrays = [

            result?.data,

            result?.items,

            result?.data?.items,

            result?.data?.stations,

            result?.data?.pumps,

            result?.data?.nozzles,

            result?.data?.shifts,

            result?.stations,

            result?.pumps,

            result?.nozzles,

            result?.shifts,

            result?.readings,

            result?.data?.readings

        ];

        for (
            const candidate
            of possibleArrays
        ) {

            if (Array.isArray(candidate)) {

                return candidate;

            }

        }

        return [];

    }


    /* =====================================================
       LOAD READINGS
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

        populateStationSelect();

        populatePumpSelect();

        populateNozzleSelect();

        populateShiftSelect();

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

            console.log(
                "FuelGap stations loaded:",
                state.stations.length,
                state.stations
            );

            populateStationSelect();

        } catch (error) {

            console.warn(
                "FuelGap stations could not be loaded:",
                error.message
            );

            state.stations = [];

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

            console.log(
                "FuelGap pumps loaded:",
                state.pumps.length,
                state.pumps
            );

            populatePumpSelect();

        } catch (error) {

            console.warn(
                "FuelGap pumps could not be loaded:",
                error.message
            );

            state.pumps = [];

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

            console.log(
                "FuelGap nozzles loaded:",
                state.nozzles.length,
                state.nozzles
            );

            populateNozzleSelect();

        } catch (error) {

            console.warn(
                "FuelGap nozzles could not be loaded:",
                error.message
            );

            state.nozzles = [];

        }

    }


    /* =====================================================
       LOAD SHIFTS
    ===================================================== */
       async function loadShifts() {

    try {

        console.log("FUELGAP - LOADING SHIFTS...");

        const result =
            await apiRequest("/shifts");

       console.log(
    "FUELGAP - RAW SHIFTS RESPONSE JSON:",
    JSON.stringify(result, null, 2)
      );


        /* =================================================
           HANDLE DIFFERENT API RESPONSE FORMATS
        ================================================= */

        let shifts = [];

        if (Array.isArray(result)) {

            shifts = result;

        } else if (
            result &&
            Array.isArray(result.data)
        ) {

            shifts = result.data;

        } else if (
            result &&
            result.data &&
            Array.isArray(result.data.data)
        ) {

            shifts = result.data.data;

        } else if (
            result &&
            Array.isArray(result.shifts)
        ) {

            shifts = result.shifts;

        } else if (
            result &&
            result.data &&
            Array.isArray(result.data.shifts)
        ) {

            shifts = result.data.shifts;

        }


        state.shifts = shifts;


        console.log(
            "FUELGAP - EXTRACTED SHIFTS:",
            state.shifts
        );


        populateShiftSelect();


    } catch (error) {

        console.error(
            "FuelGap shifts could not be loaded:",
            error
        );

        state.shifts = [];

        populateShiftSelect();

    }

}


    /* =====================================================
       PAGE HTML
    ===================================================== */

    function renderPage() {

        const container =
            getElement("pageContent");

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


            <!-- =================================================
                 READING MODAL
            ================================================== -->

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


                            <!-- STATION -->

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


                            <!-- PUMP -->

                            <div class="fg-form-group">

                                <label>
                                    Pump
                                    <span>*</span>
                                </label>

                                <select
                                    id="fgPump"
                                    required
                                    disabled
                                >

                                    <option value="">
                                        Select station first
                                    </option>

                                </select>

                            </div>


                            <!-- NOZZLE -->

                            <div class="fg-form-group">

                                <label>
                                    Nozzle
                                    <span>*</span>
                                </label>

                                <select
                                    id="fgNozzle"
                                    required
                                    disabled
                                >

                                    <option value="">
                                        Select pump first
                                    </option>

                                </select>

                            </div>


                            <!-- READING TYPE -->

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


                            <!-- METER -->

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


                            <!-- SHIFT -->

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


                            <!-- RECORD MODE -->

                            <div class="fg-form-group fg-full">

                                <label>
                                    Record Type
                                    <span>*</span>
                                </label>

                                <div class="fg-evidence-mode-grid">

                                    <label
                                        class="fg-mode-card active"
                                        id="fgCurrentModeCard"
                                    >

                                        <input
                                            type="radio"
                                            name="fgRecordMode"
                                            value="current"
                                            id="fgRecordModeCurrent"
                                            checked
                                        >

                                        <span class="fg-mode-icon">
                                            ●
                                        </span>

                                        <span>

                                            <strong>
                                                Current Reading
                                            </strong>

                                            <small>
                                                Requires a live camera snapshot.
                                            </small>

                                        </span>

                                    </label>


                                    <label
                                        class="fg-mode-card"
                                        id="fgHistoricalModeCard"
                                    >

                                        <input
                                            type="radio"
                                            name="fgRecordMode"
                                            value="historical"
                                            id="fgRecordModeHistorical"
                                        >

                                        <span class="fg-mode-icon">
                                            ◷
                                        </span>

                                        <span>

                                            <strong>
                                                Historical Record
                                            </strong>

                                            <small>
                                                Image optional. Existing photo allowed.
                                            </small>

                                        </span>

                                    </label>

                                </div>

                            </div>


                            <!-- CAPTURED DATE -->

                            <div class="fg-form-group fg-full">

                                <label>
                                    Captured Date & Time
                                </label>

                                <input
                                    type="datetime-local"
                                    id="fgCapturedAt"
                                >

                                <small id="fgCapturedAtHelp">
                                    Current readings use the current time.
                                </small>

                            </div>


                            <!-- =================================================
                                 EVIDENCE ROOM
                            ================================================== -->

                            <div
                                class="fg-form-group fg-full"
                            >

                                <div class="fg-evidence-room">

                                    <div class="fg-evidence-header">

                                        <div>

                                            <span class="fg-evidence-kicker">
                                                EVIDENCE ROOM
                                            </span>

                                            <h3>
                                                Reading Evidence
                                            </h3>

                                            <p id="fgEvidenceDescription">
                                                A live camera snapshot is required
                                                for current readings.
                                            </p>

                                        </div>

                                        <div
                                            class="fg-evidence-status"
                                            id="fgEvidenceStatus"
                                        >
                                            CAMERA REQUIRED
                                        </div>

                                    </div>


                                    <!-- CAMERA -->

                                    <div
                                        class="fg-camera-area"
                                        id="fgCameraArea"
                                    >

                                        <div
                                            class="fg-camera-preview"
                                            id="fgCameraPreview"
                                        >

                                            <video
                                                id="fgCameraVideo"
                                                autoplay
                                                muted
                                                playsinline
                                            ></video>

                                            <div
                                                class="fg-camera-placeholder"
                                                id="fgCameraPlaceholder"
                                            >

                                                <div class="fg-camera-symbol">
                                                    ◉
                                                </div>

                                                <strong>
                                                    Live camera is required
                                                </strong>

                                                <span>
                                                    Allow camera access to capture
                                                    current meter evidence.
                                                </span>

                                            </div>

                                        </div>


                                        <div class="fg-camera-actions">

                                            <button
                                                type="button"
                                                class="fg-btn fg-btn-secondary"
                                                id="fgStartCameraBtn"
                                            >
                                                Start Camera
                                            </button>


                                            <button
                                                type="button"
                                                class="fg-btn fg-btn-primary"
                                                id="fgCaptureBtn"
                                                disabled
                                            >
                                                Take Live Snapshot
                                            </button>


                                            <button
                                                type="button"
                                                class="fg-btn fg-btn-secondary"
                                                id="fgRetakeBtn"
                                                style="display:none;"
                                            >
                                                Retake
                                            </button>

                                        </div>

                                    </div>


                                    <!-- CAPTURED SNAPSHOT -->

                                    <div
                                        class="fg-snapshot-area"
                                        id="fgSnapshotArea"
                                        style="display:none;"
                                    >

                                        <div class="fg-snapshot-title">
                                            ✓ Live Snapshot Captured
                                        </div>

                                        <img
                                            id="fgSnapshotImage"
                                            alt="Live meter evidence snapshot"
                                        >

                                        <div
                                            class="fg-snapshot-meta"
                                            id="fgSnapshotMeta"
                                        ></div>

                                    </div>


                                    <!-- HISTORICAL UPLOAD -->

                                    <div
                                        class="fg-historical-upload"
                                        id="fgHistoricalUpload"
                                        style="display:none;"
                                    >

                                        <div class="fg-upload-info">

                                            <strong>
                                                Existing Evidence
                                            </strong>

                                            <span>
                                                You may leave this empty or
                                                upload an existing historical
                                                meter photograph.
                                            </span>

                                        </div>


                                        <input
                                            type="file"
                                            id="fgEvidenceFile"
                                            accept="image/*"
                                        >


                                        <div
                                            class="fg-upload-preview"
                                            id="fgUploadPreview"
                                            style="display:none;"
                                        >

                                            <img
                                                id="fgUploadPreviewImage"
                                                alt="Historical evidence preview"
                                            >

                                            <div>

                                                <strong id="fgUploadFileName">
                                                    Image selected
                                                </strong>

                                                <button
                                                    type="button"
                                                    class="fg-remove-upload"
                                                    id="fgRemoveUpload"
                                                >
                                                    Remove
                                                </button>

                                            </div>

                                        </div>

                                    </div>


                                    <canvas
                                        id="fgEvidenceCanvas"
                                        style="display:none;"
                                    ></canvas>

                                </div>

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
            font-family: Inter, Arial, Helvetica, sans-serif;
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
            margin: 5px 0;
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
            transition: .2s ease;
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
            opacity: .55;
            cursor: not-allowed;
            transform: none;
        }

        .fg-stat-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
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
            box-shadow: 0 2px 10px rgba(0,0,0,.025);
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
            box-shadow: 0 3px 15px rgba(0,0,0,.025);
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
            min-width: 900px;
        }

        .fg-readings-table th {
            padding: 13px 15px;
            text-align: left;
            background: #fafaf7;
            color: #888;
            font-size: 9px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .7px;
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
            animation: fgSpin .8s linear infinite;
        }

        @keyframes fgSpin {
            to {
                transform: rotate(360deg);
            }
        }

        .fg-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,.48);
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
            width: min(760px, 100%);
            max-height: 92vh;
            overflow-y: auto;
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 20px 70px rgba(0,0,0,.2);
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
            grid-template-columns: repeat(2, minmax(0, 1fr));
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
            box-shadow: 0 0 0 3px #fff7c7;
        }

        .fg-form-group small {
            color: #999;
            font-size: 9px;
        }

        /* =================================================
           EVIDENCE MODE
        ================================================= */

        .fg-evidence-mode-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
        }

        .fg-mode-card {
            border: 1px solid #deded7;
            border-radius: 11px;
            padding: 13px;
            display: flex;
            align-items: flex-start;
            gap: 10px;
            cursor: pointer;
            background: #fff;
            transition: .2s ease;
        }

        .fg-mode-card:hover {
            border-color: #d4b300;
            background: #fffdf0;
        }

        .fg-mode-card.active {
            border-color: #e0bd00;
            background: #fff9d9;
            box-shadow: 0 0 0 2px #fff3a7;
        }

        .fg-mode-card input {
            width: auto;
            height: auto;
            margin-top: 3px;
            accent-color: #ffd400;
        }

        .fg-mode-icon {
            width: 30px;
            height: 30px;
            border-radius: 8px;
            background: #fff1a6;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
        }

        .fg-mode-card strong {
            display: block;
            font-size: 11px;
            margin-bottom: 4px;
        }

        .fg-mode-card small {
            display: block;
            line-height: 1.4;
        }

        /* =================================================
           EVIDENCE ROOM
        ================================================= */

        .fg-evidence-room {
            border: 1px solid #e5e3d8;
            border-radius: 14px;
            background: #fafaf7;
            padding: 16px;
        }

        .fg-evidence-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 14px;
        }

        .fg-evidence-kicker {
            color: #b18d00;
            font-size: 9px;
            font-weight: 900;
            letter-spacing: 1.4px;
        }

        .fg-evidence-header h3 {
            margin: 3px 0 4px;
            font-size: 16px;
        }

        .fg-evidence-header p {
            margin: 0;
            color: #888;
            font-size: 10px;
            line-height: 1.5;
        }

        .fg-evidence-status {
            background: #fff1a6;
            color: #735c00;
            border-radius: 100px;
            padding: 7px 10px;
            font-size: 8px;
            font-weight: 900;
            white-space: nowrap;
        }

        .fg-camera-area {
            background: #111;
            border-radius: 12px;
            overflow: hidden;
        }

        .fg-camera-preview {
            position: relative;
            width: 100%;
            min-height: 270px;
            background: #151515;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        .fg-camera-preview video {
            width: 100%;
            height: 100%;
            min-height: 270px;
            max-height: 420px;
            object-fit: cover;
            display: none;
        }

        .fg-camera-preview.camera-active video {
            display: block;
        }

        .fg-camera-placeholder {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: #fff;
            padding: 35px;
            text-align: center;
        }

        .fg-camera-placeholder strong {
            font-size: 13px;
        }

        .fg-camera-placeholder span {
            color: #aaa;
            font-size: 10px;
            max-width: 280px;
            line-height: 1.5;
        }

        .fg-camera-symbol {
            width: 55px;
            height: 55px;
            border-radius: 50%;
            background: #ffd400;
            color: #111;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 23px;
            font-weight: 900;
            margin-bottom: 4px;
        }

        .fg-camera-actions {
            display: flex;
            gap: 9px;
            padding: 12px;
            flex-wrap: wrap;
        }

        .fg-camera-actions .fg-btn {
            flex: 1;
            min-width: 130px;
        }

        .fg-snapshot-area {
            margin-top: 12px;
            border: 1px solid #d9e7dc;
            background: #f2faf4;
            border-radius: 11px;
            padding: 12px;
        }

        .fg-snapshot-title {
            color: #217044;
            font-size: 10px;
            font-weight: 900;
            margin-bottom: 8px;
        }

        .fg-snapshot-area img {
            width: 100%;
            max-height: 300px;
            object-fit: contain;
            border-radius: 8px;
            background: #111;
        }

        .fg-snapshot-meta {
            color: #777;
            font-size: 9px;
            margin-top: 7px;
        }

        .fg-historical-upload {
            margin-top: 12px;
            border: 1px dashed #d7d4c7;
            border-radius: 11px;
            padding: 14px;
            background: #fff;
        }

        .fg-upload-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-bottom: 10px;
        }

        .fg-upload-info strong {
            font-size: 11px;
        }

        .fg-upload-info span {
            color: #888;
            font-size: 9px;
        }

        .fg-historical-upload input[type="file"] {
            width: 100%;
            height: auto;
            padding: 10px;
            border: 1px solid #deded7;
            background: #fafaf7;
        }

        .fg-upload-preview {
            margin-top: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .fg-upload-preview img {
            width: 75px;
            height: 75px;
            object-fit: cover;
            border-radius: 8px;
            border: 1px solid #ddd;
        }

        .fg-upload-preview strong {
            display: block;
            font-size: 10px;
            margin-bottom: 6px;
        }

        .fg-remove-upload {
            border: 0;
            background: none;
            color: #a00000;
            padding: 0;
            cursor: pointer;
            font-size: 9px;
            font-weight: 800;
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
            transition: .25s ease;
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
                grid-template-columns: repeat(2, minmax(0, 1fr));
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

            .fg-evidence-mode-grid {
                grid-template-columns: 1fr;
            }

            .fg-evidence-header {
                flex-direction: column;
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
       INJECT CSS
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
            document.createElement("style");

        style.id =
            "fuelgap-readings-page-css";

        style.textContent =
            PAGE_CSS;

        document.head.appendChild(style);

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

                        <th>Reading</th>
                        <th>Station</th>
                        <th>Pump</th>
                        <th>Nozzle</th>
                        <th>Type</th>
                        <th>Evidence</th>
                        <th>Captured</th>
                        <th>Action</th>

                    </tr>

                </thead>

                <tbody>

                    ${
                        filtered
                            .map(renderReadingRow)
                            .join("")
                    }

                </tbody>

            </table>

        `;

    }


    /* =====================================================
       READING ROW
    ===================================================== */

    function renderReadingRow(reading) {

    const station =
        findStation(reading.station_id);

    const pump =
        findPump(reading.pump_id);

    const nozzle =
        findNozzle(reading.nozzle_id);


    const type =
        String(
            reading.reading_type || ""
        ).toLowerCase();


    /*
     * =========================================================
     * EVIDENCE
     * =========================================================
     *
     * Backend stores the uploaded/captured image URL in:
     *
     * reading.photo_url
     *
     * This can now be either:
     *
     * 1. Supabase Storage public URL
     * 2. Existing data:image/... Base64 URL
     *
     * Evidence is optional.
     */

    const photoUrl =
        reading.photo_url ||
        reading.image_url ||
        reading.evidence_url ||
        "";


    const evidenceType =
        String(
            reading.evidence_type || ""
        ).toLowerCase();


    let evidenceLabel = "None";


    if (photoUrl) {

        if (
            evidenceType ===
            "live_camera"
        ) {

            evidenceLabel = "Live Camera";

        } else if (
            evidenceType ===
            "historical_upload"
        ) {

            evidenceLabel =
                "Historical Upload";

        } else {

            evidenceLabel =
                "Image";

        }

    }


    /*
     * =========================================================
     * EVIDENCE DISPLAY
     * =========================================================
     */

    let evidenceHTML = `
        <div class="fg-no-evidence">
            No image
        </div>
    `;


    if (photoUrl) {

        const safePhotoUrl =
            escapeHTML(
                String(photoUrl)
            );


        evidenceHTML = `
            <div class="fg-evidence-wrapper">

                <a
                    href="${safePhotoUrl}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="fg-evidence-link"
                    title="Open evidence image"
                >

                    <img
                        src="${safePhotoUrl}"
                        alt="Meter reading evidence"
                        class="fg-evidence-image"
                        loading="lazy"
                        onerror="
                            this.style.display='none';
                            this.parentElement
                                .nextElementSibling
                                ?.classList
                                .remove('fg-hidden');
                        "
                    >

                </a>


                <div
                    class="fg-evidence-error fg-hidden"
                >
                    Image unavailable
                </div>

            </div>
        `;

    }


    return `

        <tr>

            <!-- READING -->

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


            <!-- STATION -->

            <td>

                ${escapeHTML(
                    station?.name ||
                    station?.station_name ||
                    reading.station_id ||
                    "Unknown station"
                )}

            </td>


            <!-- PUMP -->

            <td>

                ${
                    pump

                        ? `

                            #${escapeHTML(
                                pump.pump_number ||
                                pump.number ||
                                pump.id
                            )}

                            ${
                                pump.brand
                                    ? ` - ${escapeHTML(
                                        pump.brand
                                    )}`
                                    : ""
                            }

                        `

                        : escapeHTML(
                            reading.pump_id ||
                            "Unknown pump"
                        )
                }

            </td>


            <!-- NOZZLE -->

            <td>

                ${
                    nozzle

                        ? `

                            #${escapeHTML(
                                nozzle.nozzle_number ||
                                nozzle.number ||
                                nozzle.id
                            )}

                            ${
                                nozzle.product
                                    ? ` - ${escapeHTML(
                                        nozzle.product
                                    )}`
                                    : nozzle.fuel_type
                                        ? ` - ${escapeHTML(
                                            nozzle.fuel_type
                                        )}`
                                        : ""
                            }

                        `

                        : escapeHTML(
                            reading.nozzle_id ||
                            "Unknown nozzle"
                        )
                }

            </td>


            <!-- READING TYPE -->

            <td>

                <span
                    class="
                        fg-type-badge
                        fg-type-${escapeHTML(type)}
                    "
                >

                    ${escapeHTML(
                        type || "unknown"
                    )}

                </span>

            </td>


            <!-- EVIDENCE -->

            <td>

                <div class="fg-evidence-cell">

                    ${evidenceHTML}

                    <div class="fg-evidence-label">

                        ${escapeHTML(
                            evidenceLabel
                        )}

                    </div>

                </div>

            </td>


            <!-- CAPTURED DATE -->

            <td>

                ${formatDate(
                    reading.captured_at
                )}

            </td>


            <!-- ACTION -->

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
                    ).toLowerCase();

                if (
                    state.readingType &&
                    type !== state.readingType
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

                    reading.evidence_type,

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

                return searchable.includes(search);

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
                ).toLowerCase() === type
        ).length;

    }


    /* =====================================================
       CREATE READING
    ===================================================== */

   async function createReading(event) {

    event.preventDefault();

    if (state.saving) {
        return;
    }


    /* =========================================================
       GET FORM VALUES
       ========================================================= */

    const stationId =
        getElement("fgStation")?.value;

    const pumpId =
        getElement("fgPump")?.value;

    const nozzleId =
        getElement("fgNozzle")?.value;

    const readingType =
        getElement("fgReadingType")?.value;

    const readingValue =
        getElement("fgReadingValue")?.value;

    const shiftId =
        getElement("fgShift")?.value;

    const capturedAtInput =
        getElement("fgCapturedAt")?.value;

    const recordMode =
        document.querySelector(
            'input[name="fgRecordMode"]:checked'
        )?.value || "current";


    /* =========================================================
       REQUIRED FIELD VALIDATION
       ========================================================= */

    if (
        !stationId ||
        !pumpId ||
        !nozzleId ||
        !readingType ||
        readingValue === "" ||
        !shiftId
    ) {

        showFormMessage(
            "Please complete all required fields, including the shift.",
            "error"
        );

        return;
    }


    /* =========================================================
       VALIDATE READING
       ========================================================= */

    const numericReading =
        Number(readingValue);

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


    /* =========================================================
       CAPTURE DATE/TIME
       ========================================================= */

    let capturedAt;

    if (
        recordMode === "current"
    ) {

        capturedAt =
            new Date().toISOString();

    } else {

        capturedAt =
            capturedAtInput
                ? new Date(
                    capturedAtInput
                ).toISOString()
                : new Date().toISOString();

    }


    /* =========================================================
       EVIDENCE
       
       Evidence is OPTIONAL.
       
       Current:
       - Camera image if available
       - No image is also allowed
       
       Historical:
       - Uploaded image if available
       - No image is also allowed
       ========================================================= */

    let evidenceType = "none";

    let evidenceData = null;


    /* =========================================================
       CURRENT READING CAMERA EVIDENCE
       ========================================================= */

    if (
        recordMode === "current" &&
        state.cameraSnapshot
    ) {

        evidenceType =
            "live_camera";

        evidenceData =
            state.cameraSnapshot;

    }


    /* =========================================================
       HISTORICAL UPLOAD EVIDENCE
       ========================================================= */

    else if (
        recordMode !== "current" &&
        state.evidenceFile
    ) {

        evidenceType =
            "historical_upload";

        evidenceData =
            await fileToDataURL(
                state.evidenceFile
            );

    }


    /* =========================================================
       IMPORTANT
       
       Your current backend stores photo_url.
       
       Until we add Supabase Storage upload handling,
       send the evidence data through photo_url so the
       backend actually receives the image.
       
       If there is no evidence, photo_url remains null.
       ========================================================= */

    const photoUrl =
        evidenceData || null;


    /* =========================================================
       BUILD PAYLOAD
       ========================================================= */

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

        /*
         * SHIFT IS NOW REQUIRED
         */
        shift_id:
            shiftId,

        captured_at:
            capturedAt,

        record_mode:
            recordMode,

        evidence_type:
            evidenceType,

        /*
         * Keep this too because it is useful
         * for the frontend/debugging.
         */
        evidence_data:
            evidenceData,

        /*
         * IMPORTANT:
         * Do NOT send null when an image exists.
         */
        photo_url:
            photoUrl

    };


    /* =========================================================
       SAVE
       ========================================================= */

    state.saving = true;


    const saveButton =
        getElement("fgSaveReading");


    if (saveButton) {

        saveButton.disabled = true;

        saveButton.textContent =
            "Saving...";

    }


    try {

        console.log(
            "FUELGAP CREATING METER READING:",
            payload
        );


        const result =
            await apiRequest(
                "/meter-readings",
                {

                    method: "POST",

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


        showToast(
            "Meter reading saved successfully."
        );


        /*
         * Clear evidence state after successful save.
         */
        state.cameraSnapshot = null;

        state.evidenceFile = null;


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

        state.saving = false;


        if (saveButton) {

            saveButton.disabled = false;

            saveButton.textContent =
                "Save Reading";

        }

    }

}


    /* =====================================================
       FILE -> DATA URL
    ===================================================== */

    function fileToDataURL(file) {

        return new Promise(
            (resolve, reject) => {

                const reader =
                    new FileReader();

                reader.onload =
                    () => resolve(
                        reader.result
                    );

                reader.onerror =
                    () => reject(
                        new Error(
                            "Unable to read selected image."
                        )
                    );

                reader.readAsDataURL(file);

            }
        );

    }


    /* =====================================================
       DELETE
    ===================================================== */

    async function deleteReading(id) {

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

        state.deleting = true;

        try {

            await apiRequest(
                `/meter-readings/${encodeURIComponent(id)}`,
                {
                    method: "DELETE"
                }
            );

            state.readings =
                state.readings.filter(
                    item =>
                        String(item.id) !==
                        String(id)
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

            state.deleting = false;

        }

    }


    /* =====================================================
       MODAL
    ===================================================== */

    function openModal() {

        const modal =
            getElement("fgReadingModal");

        if (!modal) {

            return;

        }

        resetForm();

        modal.classList.add("open");

    }


    async function closeModal() {

        const modal =
            getElement("fgReadingModal");

        if (!modal) {

            return;

        }

        await stopCamera();

        modal.classList.remove("open");

        resetForm();

    }


    /* =====================================================
       RESET FORM
    ===================================================== */

    function resetForm() {

        const form =
            getElement("fgReadingForm");

        if (form) {

            form.reset();

        }

        state.cameraSnapshot = null;

        state.evidenceFile = null;

        state.cameraReady = false;

        state.evidenceMode = "current";

        clearFormMessage();

        populateStationSelect();

        populatePumpSelect();

        populateNozzleSelect();

        populateShiftSelect();

        setRecordMode("current");

        resetCameraUI();

        resetUploadUI();

        setCurrentDateTime();

    }


    /* =====================================================
       CURRENT DATE/TIME
    ===================================================== */

    function setCurrentDateTime() {

        const captured =
            getElement("fgCapturedAt");

        if (!captured) {

            return;

        }

        const now =
            new Date();

        const local =
            new Date(
                now.getTime() -
                now.getTimezoneOffset() *
                60000
            )
                .toISOString()
                .slice(0, 16);

        captured.value =
            local;

    }


    /* =====================================================
       STATION SELECT
    ===================================================== */

    function populateStationSelect() {

        const ids = [
            "fgStation",
            "fgStationFilter"
        ];

        ids.forEach(id => {

            const select =
                getElement(id);

            if (!select) {

                return;

            }

            const current =
                select.value;

            const isFilter =
                id === "fgStationFilter";

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

            state.stations.forEach(station => {

                const stationId =
                    station.id ||
                    station.station_id;

                if (!stationId) {

                    return;

                }

                const option =
                    document.createElement("option");

                option.value =
                    stationId;

                option.textContent =
                    station.name ||
                    station.station_name ||
                    station.title ||
                    `Station ${stationId}`;

                select.appendChild(option);

            });

            if (current) {

                select.value = current;

            }

        });

    }


    /* =====================================================
       PUMP SELECT
    ===================================================== */

    function populatePumpSelect() {

        const select =
            getElement("fgPump");

        if (!select) {

            return;

        }

        const stationId =
            getElement("fgStation")?.value;

        select.innerHTML = "";

        const firstOption =
            document.createElement("option");

        firstOption.value = "";

        if (!stationId) {

            firstOption.textContent =
                "Select station first";

            select.disabled = true;

        } else {

            firstOption.textContent =
                "Select pump";

            select.disabled = false;

        }

        select.appendChild(firstOption);


        if (!stationId) {

            return;

        }


        const pumps =
            state.pumps.filter(pump => {

                const pumpStationId =
                    pump.station_id ||
                    pump.stationId ||
                    pump.station?.id;

                return String(
                    pumpStationId
                ) === String(
                    stationId
                );

            });


        console.log(
            "FuelGap pumps for station:",
            stationId,
            pumps
        );


        pumps.forEach(pump => {

            const pumpId =
                pump.id ||
                pump.pump_id;

            if (!pumpId) {

                return;

            }

            const option =
                document.createElement("option");

            option.value =
                pumpId;

            option.textContent =
                `Pump #${
                    pump.pump_number ||
                    pump.number ||
                    pump.pump_no ||
                    pumpId
                }${
                    pump.brand
                        ? ` - ${pump.brand}`
                        : ""
                }`;

            select.appendChild(option);

        });

    }


    /* =====================================================
       NOZZLE SELECT
    ===================================================== */

    function populateNozzleSelect() {

        const select =
            getElement("fgNozzle");

        if (!select) {

            return;

        }

        const pumpId =
            getElement("fgPump")?.value;

        select.innerHTML = "";

        const firstOption =
            document.createElement("option");

        firstOption.value = "";

        if (!pumpId) {

            firstOption.textContent =
                "Select pump first";

            select.disabled = true;

        } else {

            firstOption.textContent =
                "Select nozzle";

            select.disabled = false;

        }

        select.appendChild(firstOption);


        if (!pumpId) {

            return;

        }


        const nozzles =
            state.nozzles.filter(nozzle => {

                const nozzlePumpId =
                    nozzle.pump_id ||
                    nozzle.pumpId ||
                    nozzle.pump?.id;

                return String(
                    nozzlePumpId
                ) === String(
                    pumpId
                );

            });


        console.log(
            "FuelGap nozzles for pump:",
            pumpId,
            nozzles
        );


        nozzles.forEach(nozzle => {

            const nozzleId =
                nozzle.id ||
                nozzle.nozzle_id;

            if (!nozzleId) {

                return;

            }

            const option =
                document.createElement("option");

            option.value =
                nozzleId;

            option.textContent =
                `Nozzle #${
                    nozzle.nozzle_number ||
                    nozzle.number ||
                    nozzle.nozzle_no ||
                    nozzleId
                }${
                    nozzle.fuel_type
                        ? ` - ${nozzle.fuel_type}`
                        : ""
                }`;

            select.appendChild(option);

        });

    }


    /* =====================================================
       SHIFT SELECT
    ===================================================== */

function populateShiftSelect() {

    const select =
        getElement("fgShift");

    if (!select) {
        console.warn(
            "FUELGAP: Shift dropdown #fgShift not found"
        );
        return;
    }

    const stationId =
        getElement("fgStation")?.value;

    console.log(
        "FUELGAP: Selected station for shifts:",
        stationId
    );

    console.log(
        "FUELGAP: Current application user:",
        state.currentUser
    );

    console.log(
        "FUELGAP: All loaded shifts:",
        state.shifts
    );


    /* =================================================
       RESET DROPDOWN
    ================================================= */

    select.innerHTML = "";

    const defaultOption =
        document.createElement("option");

    defaultOption.value = "";

    defaultOption.textContent =
        stationId
            ? "Select a shift"
            : "Select station first";

    select.appendChild(defaultOption);


    /* =================================================
       NO SHIFTS
    ================================================= */

    if (
        !Array.isArray(state.shifts) ||
        state.shifts.length === 0
    ) {

        console.warn(
            "FUELGAP: No shifts available"
        );

        return;
    }


    /* =================================================
       GET CURRENT USER
    ================================================= */

    const user =
        state.currentUser || {};

    const currentUserIds =
        [
            user.id,
            user.user_id,
            user.userId,
            user.profile_id,
            user.profileId,
            user.auth_user_id,
            user.authUserId
        ]
        .filter(Boolean)
        .map(id => String(id));


    console.log(
        "FUELGAP: Current user IDs available:",
        currentUserIds
    );


    if (
        currentUserIds.length === 0
    ) {

        console.warn(
            "FUELGAP: Could not determine current application user ID."
        );

        return;
    }


    /* =================================================
       FILTER SHIFTS
       
       RULE:
       
       1. Same station
       2. Created/opened by current user
       3. OPEN or CLOSED are both allowed
    ================================================= */

    const userStationShifts =
        state.shifts.filter(
            shift => {

                const shiftStationId =
                    shift.station_id ??
                    shift.stationId ??
                    shift.station?.id ??
                    shift.stations?.id;

                const openedBy =
                    shift.opened_by ??
                    shift.openedBy ??
                    shift.user_id ??
                    shift.userId;


                const sameStation =
                    !stationId ||
                    String(
                        shiftStationId
                    ) === String(
                        stationId
                    );


                const sameUser =
                    openedBy &&
                    currentUserIds.includes(
                        String(openedBy)
                    );


                console.log(
                    "FUELGAP: Checking shift ownership:",
                    {
                        shiftId:
                            shift.id ??
                            shift.shift_id,

                        openedBy,

                        currentUserIds,

                        sameUser,

                        sameStation,

                        status:
                            shift.status,

                        createdAt:
                            shift.created_at
                    }
                );


                return (
                    sameStation &&
                    sameUser
                );

            }
        );


    console.log(
        "FUELGAP: Shifts belonging to current user:",
        userStationShifts
    );


    /* =================================================
       FIND NEWEST SHIFT
       
       IMPORTANT:
       
       Use created_at.
       
       NOT shift_date.
       NOT start_time.
       
       A CLOSED shift remains visible until
       this same user creates a newer shift.
    ================================================= */

    const latestShift =
        [...userStationShifts]
            .sort(
                (a, b) => {

                    const dateA =
                        new Date(
                            a.created_at ||
                            a.createdAt ||
                            0
                        ).getTime();

                    const dateB =
                        new Date(
                            b.created_at ||
                            b.createdAt ||
                            0
                        ).getTime();

                    return dateB - dateA;

                }
            )[0];


    if (!latestShift) {

        console.warn(
            "FUELGAP: No shift found for current user and selected station."
        );

        return;
    }


    console.log(
        "FUELGAP: Latest shift for current user:",
        latestShift
    );


    /* =================================================
       GET SHIFT ID
    ================================================= */

    const shiftId =
        latestShift.id ??
        latestShift.shift_id;


    if (!shiftId) {

        console.warn(
            "FUELGAP: Latest shift has no ID:",
            latestShift
        );

        return;
    }


    /* =================================================
       CREATE OPTION
    ================================================= */

    const option =
        document.createElement("option");

    option.value =
        String(shiftId);


    /* =================================================
       SHIFT NAME
    ================================================= */

    const shiftName =
        latestShift.shift_name ??
        latestShift.name ??
        latestShift.title ??
        `Shift ${String(
            shiftId
        ).slice(0, 8)}`;


    /* =================================================
       SHIFT STATUS
       
       CLOSED IS ALLOWED.
    ================================================= */

    const status =
        latestShift.status
            ? String(
                latestShift.status
            ).trim().toLowerCase()
            : "";


    const statusText =
        status
            ? ` — ${status.toUpperCase()}`
            : "";


    option.textContent =
        `${shiftName}${statusText}`;


    /* =================================================
       STORE SHIFT INFORMATION
    ================================================= */

    option.dataset.shiftId =
        String(shiftId);

    option.dataset.stationId =
        String(
            latestShift.station_id ??
            latestShift.stationId ??
            latestShift.station?.id ??
            latestShift.stations?.id ??
            ""
        );

    option.dataset.status =
        status;

    option.dataset.openedBy =
        String(
            latestShift.opened_by ??
            latestShift.openedBy ??
            ""
        );

    option.dataset.createdAt =
        String(
            latestShift.created_at ??
            latestShift.createdAt ??
            ""
        );


    /* =================================================
       ADD ONLY LATEST SHIFT
    ================================================= */

    select.appendChild(
        option
    );


    /* =================================================
       FINAL CHECK
    ================================================= */

    console.log(
        "FUELGAP: Final shift dropdown options:",
        Array.from(
            select.options
        ).map(option => ({
            text:
                option.textContent,

            value:
                option.value,

            status:
                option.dataset.status,

            openedBy:
                option.dataset.openedBy,

            createdAt:
                option.dataset.createdAt
        }))
    );

}


    /* =====================================================
       RECORD MODE
    ===================================================== */

    function setRecordMode(mode) {

        state.evidenceMode =
            mode;

        const currentCard =
            getElement(
                "fgCurrentModeCard"
            );

        const historicalCard =
            getElement(
                "fgHistoricalModeCard"
            );

        const cameraArea =
            getElement(
                "fgCameraArea"
            );

        const historicalUpload =
            getElement(
                "fgHistoricalUpload"
            );

        const status =
            getElement(
                "fgEvidenceStatus"
            );

        const description =
            getElement(
                "fgEvidenceDescription"
            );

        const capturedHelp =
            getElement(
                "fgCapturedAtHelp"
            );


        currentCard?.classList.toggle(
            "active",
            mode === "current"
        );

        historicalCard?.classList.toggle(
            "active",
            mode === "historical"
        );


        if (
            mode === "current"
        ) {

            if (cameraArea) {

                cameraArea.style.display =
                    "block";

            }

            if (historicalUpload) {

                historicalUpload.style.display =
                    "none";

            }

            if (status) {

                status.textContent =
                    "CAMERA REQUIRED";

            }

            if (description) {

                description.textContent =
                    "A live camera snapshot is required for current readings.";

            }

            if (capturedHelp) {

                capturedHelp.textContent =
                    "Current readings automatically use the current date and time.";

            }

        } else {

            if (cameraArea) {

                cameraArea.style.display =
                    "none";

            }

            if (historicalUpload) {

                historicalUpload.style.display =
                    "block";

            }

            if (status) {

                status.textContent =
                    "IMAGE OPTIONAL";

            }

            if (description) {

                description.textContent =
                    "Historical records may have no image or may include an existing photograph.";

            }

            if (capturedHelp) {

                capturedHelp.textContent =
                    "Choose the original date and time of the historical meter reading.";

            }

            stopCamera();

        }

    }


    /* =====================================================
       CAMERA
    ===================================================== */

    async function startCamera() {

        const video =
            getElement(
                "fgCameraVideo"
            );

        const preview =
            getElement(
                "fgCameraPreview"
            );

        const placeholder =
            getElement(
                "fgCameraPlaceholder"
            );

        const captureButton =
            getElement(
                "fgCaptureBtn"
            );

        if (!video) {

            return;

        }


        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {

            showFormMessage(
                "Your browser does not support live camera access.",
                "error"
            );

            return;

        }


        try {

            await stopCamera();

            state.cameraStream =
                await navigator.mediaDevices.getUserMedia(
                    {
                        video: {
                            facingMode: {
                                ideal: "environment"
                            },
                            width: {
                                ideal: 1280
                            },
                            height: {
                                ideal: 720
                            }
                        },
                        audio: false
                    }
                );


            video.srcObject =
                state.cameraStream;

            await video.play();

            state.cameraReady =
                true;

            preview?.classList.add(
                "camera-active"
            );

            if (placeholder) {

                placeholder.style.display =
                    "none";

            }

            if (captureButton) {

                captureButton.disabled =
                    false;

            }

            showToast(
                "Live camera is ready."
            );

        } catch (error) {

            console.error(
                "FuelGap camera error:",
                error
            );

            state.cameraReady =
                false;

            showFormMessage(
                "Camera access was not granted. Please allow camera access and try again.",
                "error"
            );

        }

    }


    /* =====================================================
       CAPTURE CAMERA SNAPSHOT
    ===================================================== */

    function captureSnapshot() {

        const video =
            getElement(
                "fgCameraVideo"
            );

        const canvas =
            getElement(
                "fgEvidenceCanvas"
            );

        const image =
            getElement(
                "fgSnapshotImage"
            );

        const snapshotArea =
            getElement(
                "fgSnapshotArea"
            );

        const captureButton =
            getElement(
                "fgCaptureBtn"
            );

        const retakeButton =
            getElement(
                "fgRetakeBtn"
            );

        if (
            !video ||
            !canvas ||
            !state.cameraReady
        ) {

            showFormMessage(
                "Start the live camera before taking a snapshot.",
                "error"
            );

            return;

        }


        if (
            video.videoWidth <= 0 ||
            video.videoHeight <= 0
        ) {

            showFormMessage(
                "The camera is not ready yet. Please try again.",
                "error"
            );

            return;

        }


        canvas.width =
            video.videoWidth;

        canvas.height =
            video.videoHeight;


        const context =
            canvas.getContext(
                "2d"
            );


        context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );


        state.cameraSnapshot =
            canvas.toDataURL(
                "image/jpeg",
                0.88
            );


        if (image) {

            image.src =
                state.cameraSnapshot;

        }

        if (snapshotArea) {

            snapshotArea.style.display =
                "block";

        }

        if (captureButton) {

            captureButton.disabled =
                true;

        }

        if (retakeButton) {

            retakeButton.style.display =
                "inline-block";

        }


        const meta =
            getElement(
                "fgSnapshotMeta"
            );

        if (meta) {

            meta.textContent =
                `Captured live at ${new Date().toLocaleString(
                    "en-NG"
                )}`;

        }


        showFormMessage(
            "Live snapshot captured successfully.",
            "success"
        );

        stopCamera();

    }


    /* =====================================================
       STOP CAMERA
    ===================================================== */

    async function stopCamera() {

        if (state.cameraStream) {

            state.cameraStream
                .getTracks()
                .forEach(track => {

                    track.stop();

                });

            state.cameraStream =
                null;

        }

        state.cameraReady =
            false;

        const video =
            getElement(
                "fgCameraVideo"
            );

        if (video) {

            video.srcObject =
                null;

        }

    }


    /* =====================================================
       RESET CAMERA UI
    ===================================================== */

    function resetCameraUI() {

        const preview =
            getElement(
                "fgCameraPreview"
            );

        const placeholder =
            getElement(
                "fgCameraPlaceholder"
            );

        const snapshotArea =
            getElement(
                "fgSnapshotArea"
            );

        const captureButton =
            getElement(
                "fgCaptureBtn"
            );

        const retakeButton =
            getElement(
                "fgRetakeBtn"
            );

        const image =
            getElement(
                "fgSnapshotImage"
            );


        preview?.classList.remove(
            "camera-active"
        );


        if (placeholder) {

            placeholder.style.display =
                "flex";

        }


        if (snapshotArea) {

            snapshotArea.style.display =
                "none";

        }


        if (captureButton) {

            captureButton.disabled =
                true;

        }


        if (retakeButton) {

            retakeButton.style.display =
                "none";

        }


        if (image) {

            image.removeAttribute(
                "src"
            );

        }

    }


    /* =====================================================
       HISTORICAL FILE UPLOAD
    ===================================================== */

    function handleEvidenceFile(event) {

        const file =
            event.target.files?.[0];

        if (!file) {

            return;

        }


        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            showFormMessage(
                "Please select an image file.",
                "error"
            );

            event.target.value =
                "";

            return;

        }


        state.evidenceFile =
            file;


        const preview =
            getElement(
                "fgUploadPreview"
            );

        const image =
            getElement(
                "fgUploadPreviewImage"
            );

        const name =
            getElement(
                "fgUploadFileName"
            );


        const reader =
            new FileReader();


        reader.onload =
            () => {

                if (image) {

                    image.src =
                        reader.result;

                }

                if (name) {

                    name.textContent =
                        file.name;

                }

                if (preview) {

                    preview.style.display =
                        "flex";

                }

            };


        reader.readAsDataURL(
            file
        );

    }


    /* =====================================================
       RESET UPLOAD
    ===================================================== */

    function resetUploadUI() {

        const input =
            getElement(
                "fgEvidenceFile"
            );

        const preview =
            getElement(
                "fgUploadPreview"
            );

        const image =
            getElement(
                "fgUploadPreviewImage"
            );

        if (input) {

            input.value =
                "";

        }

        if (preview) {

            preview.style.display =
                "none";

        }

        if (image) {

            image.removeAttribute(
                "src"
            );

        }

    }


    /* =====================================================
       REMOVE UPLOAD
    ===================================================== */

    function removeUpload() {

        state.evidenceFile =
            null;

        resetUploadUI();

    }


    /* =====================================================
       EVENT LISTENERS
    ===================================================== */

    function bindEvents() {

        getElement(
            "fgRefreshBtn"
        )?.addEventListener(
            "click",
            async () => {

                await loadSupportingData();

                await loadReadings();

            }
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


        document.querySelectorAll(
            'input[name="fgRecordMode"]'
        ).forEach(
            radio => {

                radio.addEventListener(
                    "change",
                    event => {

                        setRecordMode(
                            event.target.value
                        );

                    }
                );

            }
        );


        getElement(
            "fgStartCameraBtn"
        )?.addEventListener(
            "click",
            startCamera
        );


        getElement(
            "fgCaptureBtn"
        )?.addEventListener(
            "click",
            captureSnapshot
        );


        getElement(
            "fgRetakeBtn"
        )?.addEventListener(
            "click",
            async () => {

                state.cameraSnapshot =
                    null;

                resetCameraUI();

                await startCamera();

            }
        );


        getElement(
            "fgEvidenceFile"
        )?.addEventListener(
            "change",
            handleEvidenceFile
        );


        getElement(
            "fgRemoveUpload"
        )?.addEventListener(
            "click",
            removeUpload
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

                deleteReading(id);

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
                    event.target === modal
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

    function showTableError(message) {

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
                    ${escapeHTML(message)}
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

    function showToast(message) {

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

    function findStation(id) {

        return state.stations.find(
            item =>
                String(
                    item.id ||
                    item.station_id
                ) ===
                String(id)
        );

    }


    function findPump(id) {

        return state.pumps.find(
            item =>
                String(
                    item.id ||
                    item.pump_id
                ) ===
                String(id)
        );

    }


    function findNozzle(id) {

        return state.nozzles.find(
            item =>
                String(
                    item.id ||
                    item.nozzle_id
                ) ===
                String(id)
        );

    }


    function findShift(id) {

        return state.shifts.find(
            item =>
                String(
                    item.id ||
                    item.shift_id
                ) ===
                String(id)
        );

    }


    /* =====================================================
       FORMATTING
    ===================================================== */

    function formatNumber(value) {

        const number =
            Number(value);

        if (
            !Number.isFinite(number)
        ) {

            return escapeHTML(value);

        }

        return number.toLocaleString(
            "en-NG",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        );

    }


    function formatDate(value) {

        if (!value) {

            return "—";

        }

        const date =
            new Date(value);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return escapeHTML(value);

        }

        return date.toLocaleString(
            "en-NG",
            {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
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
            getElement(id);

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

        if (
            window.FuelGapAppState &&
            window.FuelGapAppState.currentUser &&
            getElement("pageContent")
        ) {

            init();

            return;

        }

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

        closeModal,

        startCamera,

        captureSnapshot

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