/* =========================================================
   FUELGAP - METER READINGS
   REAL BACKEND VERSION
   SUPABASE + EXPRESS
   HTTPONLY COOKIE SESSION
   SHIFT-AWARE METER READINGS
========================================================= */

(function () {

    "use strict";

    /* =====================================================
       STATE
    ===================================================== */

    const MeterReadingsState = {

        stations: [],
        pumps: [],
        nozzles: [],
        shifts: [],
        readings: [],

        currentUser: null,

        currentPhoto: null,
        cameraStream: null,

        isLoading: false,
        isSubmitting: false

    };


    /* =====================================================
       DOM READY
    ===================================================== */

    document.addEventListener("DOMContentLoaded", async function () {

        try {

            if (!window.FuelGapAPI) {
                console.error("FuelGapAPI is not available.");
                return;
            }

            if (!window.FuelGapUtils) {
                console.error("FuelGapUtils is not available.");
                return;
            }

            MeterReadingsState.currentUser =
                FuelGapUtils.getCurrentUser();

            if (!MeterReadingsState.currentUser) {

                console.warn("No authenticated user found.");

                return;
            }

            await waitForPageContent();

            renderMeterReadingsPage();

            await loadMeterReadingData();

            setupMeterReadingEvents();

        } catch (error) {

            console.error(
                "Meter readings initialization error:",
                error
            );

            showToast(
                error.message ||
                "Unable to initialize meter readings.",
                "error"
            );
        }

    });


    /* =====================================================
       WAIT FOR PAGE CONTENT
    ===================================================== */

    async function waitForPageContent() {

        let attempts = 0;

        while (!document.getElementById("pageContent") && attempts < 100) {

            await new Promise(resolve =>
                setTimeout(resolve, 100)
            );

            attempts++;
        }

    }


    /* =====================================================
       RENDER PAGE
    ===================================================== */

    function renderMeterReadingsPage() {

        const container =
            document.getElementById("pageContent");

        if (!container) {
            return;
        }

        container.innerHTML = `

            <div class="page-container meter-readings-page">

                <!-- =========================================
                     PAGE HEADER
                ========================================== -->

                <div class="page-header">

                    <div>

                        <div class="page-eyebrow">
                            FORECOURT MONITORING
                        </div>

                        <h1>
                            Meter Readings
                        </h1>

                        <p>
                            Capture and validate fuel pump meter readings
                            with live camera evidence.
                        </p>

                    </div>

                    <div class="page-actions">

                        <button
                            type="button"
                            class="btn btn-secondary"
                            id="refreshMeterReadingsBtn"
                        >
                            ↻ Refresh
                        </button>

                        <button
                            type="button"
                            class="btn btn-primary"
                            id="openMeterReadingModalBtn"
                        >
                            + Add Reading
                        </button>

                    </div>

                </div>


                <!-- =========================================
                     STATS
                ========================================== -->

                <div class="stats-grid">

                    <div class="stat-card">

                        <div class="stat-icon">
                            MR
                        </div>

                        <div class="stat-content">

                            <span>
                                Total Readings
                            </span>

                            <strong id="totalReadingsStat">
                                0
                            </strong>

                        </div>

                    </div>


                    <div class="stat-card">

                        <div class="stat-icon">
                            TD
                        </div>

                        <div class="stat-content">

                            <span>
                                Today's Readings
                            </span>

                            <strong id="todayReadingsStat">
                                0
                            </strong>

                        </div>

                    </div>


                    <div class="stat-card">

                        <div class="stat-icon">
                            OP
                        </div>

                        <div class="stat-content">

                            <span>
                                Opening Readings
                            </span>

                            <strong id="openingReadingsStat">
                                0
                            </strong>

                        </div>

                    </div>


                    <div class="stat-card">

                        <div class="stat-icon">
                            EV
                        </div>

                        <div class="stat-content">

                            <span>
                                Evidence Captured
                            </span>

                            <strong id="evidenceReadingsStat">
                                0
                            </strong>

                        </div>

                    </div>

                </div>


                <!-- =========================================
                     EVIDENCE ROLL
                ========================================== -->

                <section class="content-card evidence-section">

                    <div class="content-card-header">

                        <div>

                            <h2>
                                Evidence Roll
                            </h2>

                            <p>
                                Latest meter-reading evidence captured
                                from the forecourt.
                            </p>

                        </div>

                    </div>

                    <div
                        id="meterEvidenceRoll"
                        class="evidence-roll"
                    >

                        <div class="empty-state">
                            No evidence captured yet.
                        </div>

                    </div>

                </section>


                <!-- =========================================
                     FILTERS
                ========================================== -->

                <section class="content-card">

                    <div class="content-card-header">

                        <div>

                            <h2>
                                Reading Records
                            </h2>

                            <p>
                                Monitor opening, periodic, closing
                                and correction readings.
                            </p>

                        </div>

                    </div>


                    <div class="filters-grid">

                        <div class="form-group">

                            <label for="meterStationFilter">
                                Station
                            </label>

                            <select id="meterStationFilter">

                                <option value="">
                                    All Stations
                                </option>

                            </select>

                        </div>


                        <div class="form-group">

                            <label for="meterTypeFilter">
                                Reading Type
                            </label>

                            <select id="meterTypeFilter">

                                <option value="">
                                    All Types
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


                        <div class="form-group">

                            <label for="meterSearch">
                                Search
                            </label>

                            <input
                                type="text"
                                id="meterSearch"
                                placeholder="Search pump, nozzle or reading..."
                            >

                        </div>

                    </div>


                    <!-- =====================================
                         TABLE
                    ====================================== -->

                    <div class="table-responsive">

                        <table class="data-table">

                            <thead>

                                <tr>

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
                                        Shift
                                    </th>

                                    <th>
                                        Type
                                    </th>

                                    <th>
                                        Reading
                                    </th>

                                    <th>
                                        Evidence
                                    </th>

                                    <th>
                                        Recorded
                                    </th>

                                </tr>

                            </thead>

                            <tbody id="meterReadingsTableBody">

                                <tr>

                                    <td
                                        colspan="8"
                                        class="table-empty"
                                    >
                                        Loading readings...
                                    </td>

                                </tr>

                            </tbody>

                        </table>

                    </div>

                </section>

            </div>


            <!-- =================================================
                 ADD METER READING MODAL
            ================================================== -->

            <div
                class="modal-overlay"
                id="meterReadingModal"
                style="display:none;"
            >

                <div class="modal-container">

                    <div class="modal-header">

                        <div>

                            <span class="modal-eyebrow">
                                FORECOURT CONTROL
                            </span>

                            <h2>
                                Record Meter Reading
                            </h2>

                            <p>
                                Capture the current pump meter
                                and live camera evidence.
                            </p>

                        </div>

                        <button
                            type="button"
                            class="modal-close"
                            id="closeMeterReadingModalBtn"
                        >
                            ×
                        </button>

                    </div>


                    <form
                        id="meterReadingForm"
                        class="modal-form"
                    >

                        <!-- =====================================
                             STATION
                        ====================================== -->

                        <div class="form-group">

                            <label for="readingStation">
                                Station
                                <span class="required">*</span>
                            </label>

                            <select
                                id="readingStation"
                                required
                            >

                                <option value="">
                                    Select station
                                </option>

                            </select>

                        </div>


                        <!-- =====================================
                             PUMP
                        ====================================== -->

                        <div class="form-group">

                            <label for="readingPump">
                                Pump
                                <span class="required">*</span>
                            </label>

                            <select
                                id="readingPump"
                                required
                                disabled
                            >

                                <option value="">
                                    Select station first
                                </option>

                            </select>

                        </div>


                        <!-- =====================================
                             NOZZLE
                        ====================================== -->

                        <div class="form-group">

                            <label for="readingNozzle">
                                Nozzle
                                <span class="required">*</span>
                            </label>

                            <select
                                id="readingNozzle"
                                required
                                disabled
                            >

                                <option value="">
                                    Select pump first
                                </option>

                            </select>

                        </div>


                        <!-- =====================================
                             SHIFT
                        ====================================== -->

                        <div class="form-group">

                            <label for="readingShift">
                                Shift
                                <span class="required">*</span>
                            </label>

                            <select
                                id="readingShift"
                                required
                                disabled
                            >

                                <option value="">
                                    Select station first
                                </option>

                            </select>

                            <small
                                id="readingShiftHelp"
                                class="form-help"
                            >
                                Select an open shift for this meter reading.
                            </small>

                        </div>


                        <!-- =====================================
                             READING TYPE
                        ====================================== -->

                        <div class="form-group">

                            <label for="readingType">
                                Reading Type
                                <span class="required">*</span>
                            </label>

                            <select
                                id="readingType"
                                required
                            >

                                <option value="opening">
                                    Opening Meter Reading
                                </option>

                                <option value="periodic">
                                    Periodic Meter Reading
                                </option>

                                <option value="closing">
                                    Closing Meter Reading
                                </option>

                                <option value="correction">
                                    Correction
                                </option>

                            </select>

                            <small class="form-help">

                                Closing readings must be recorded
                                while the shift is still open.

                            </small>

                        </div>


                        <!-- =====================================
                             METER VALUE
                        ====================================== -->

                        <div class="form-group">

                            <label for="meterReadingValue">
                                Meter Reading
                                <span class="required">*</span>
                            </label>

                            <input
                                type="number"
                                id="meterReadingValue"
                                min="0"
                                step="0.01"
                                placeholder="Enter current meter reading"
                                required
                            >

                        </div>


                        <!-- =====================================
                             CAMERA EVIDENCE
                        ====================================== -->

                        <div class="camera-section">

                            <div class="camera-section-header">

                                <div>

                                    <h3>
                                        Live Camera Evidence
                                    </h3>

                                    <p>
                                        Capture a fresh photo of the
                                        physical pump meter.
                                    </p>

                                </div>

                                <span class="camera-badge">
                                    LIVE SNAP
                                </span>

                            </div>


                            <div
                                class="camera-preview"
                                id="cameraPreviewContainer"
                            >

                                <div
                                    class="camera-placeholder"
                                    id="cameraPlaceholder"
                                >

                                    <div class="camera-placeholder-icon">
                                        📷
                                    </div>

                                    <strong>
                                        Camera Ready
                                    </strong>

                                    <span>
                                        Start camera to capture evidence.
                                    </span>

                                </div>


                                <video
                                    id="meterCamera"
                                    autoplay
                                    playsinline
                                    muted
                                    style="display:none;"
                                ></video>


                                <img
                                    id="meterPhotoPreview"
                                    alt="Meter evidence preview"
                                    style="display:none;"
                                >

                                <canvas
                                    id="meterPhotoCanvas"
                                    style="display:none;"
                                ></canvas>

                            </div>


                            <div class="camera-actions">

                                <button
                                    type="button"
                                    class="btn btn-secondary"
                                    id="startCameraBtn"
                                >
                                    Start Camera
                                </button>

                                <button
                                    type="button"
                                    class="btn btn-primary"
                                    id="capturePhotoBtn"
                                    disabled
                                >
                                    Capture
                                </button>

                                <button
                                    type="button"
                                    class="btn btn-secondary"
                                    id="retakePhotoBtn"
                                    disabled
                                >
                                    Retake
                                </button>

                            </div>


                            <div
                                class="camera-status"
                                id="cameraStatus"
                            >
                                Evidence photo required.
                            </div>

                        </div>


                        <!-- =====================================
                             FORM ACTIONS
                        ====================================== -->

                        <div class="modal-footer">

                            <button
                                type="button"
                                class="btn btn-secondary"
                                id="cancelMeterReadingBtn"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                class="btn btn-primary"
                                id="saveMeterReadingBtn"
                            >
                                Save Meter Reading
                            </button>

                        </div>

                    </form>

                </div>

            </div>


            <!-- =================================================
                 TOAST
            ================================================== -->

            <div
                id="meterReadingToast"
                class="fg-toast"
            ></div>

        `;

    }


    /* =====================================================
       LOAD ALL DATA
    ===================================================== */

    async function loadMeterReadingData() {

        MeterReadingsState.isLoading = true;

        try {

            await loadStations();

            await Promise.allSettled([
                loadPumps(),
                loadNozzles(),
                loadShifts(),
                loadMeterReadings()
            ]);

            populateStationDropdowns();

            updateStats();

            renderEvidenceRoll();

            renderReadingsTable();

        } catch (error) {

            console.error(
                "Meter reading data load error:",
                error
            );

            showToast(
                error.message ||
                "Unable to load meter readings.",
                "error"
            );

        } finally {

            MeterReadingsState.isLoading = false;

        }

    }


    /* =====================================================
       LOAD STATIONS
    ===================================================== */

    async function loadStations() {

        try {

            const response =
                await FuelGapAPI.getStations();

            MeterReadingsState.stations =
                normalizeArrayResponse(response);

        } catch (error) {

            console.error(
                "Failed to load stations:",
                error
            );

            MeterReadingsState.stations = [];

            throw error;
        }

    }


    /* =====================================================
       LOAD PUMPS
    ===================================================== */

    async function loadPumps() {

        try {

            const response =
                await FuelGapAPI.request("/pumps");

            MeterReadingsState.pumps =
                normalizeArrayResponse(response);

        } catch (error) {

            console.error(
                "Failed to load pumps:",
                error
            );

            MeterReadingsState.pumps = [];

        }

    }


    /* =====================================================
       LOAD NOZZLES
    ===================================================== */

    async function loadNozzles() {

        try {

            const response =
                await FuelGapAPI.request("/nozzles");

            MeterReadingsState.nozzles =
                normalizeArrayResponse(response);

        } catch (error) {

            console.error(
                "Failed to load nozzles:",
                error
            );

            MeterReadingsState.nozzles = [];

        }

    }


    /* =====================================================
       LOAD SHIFTS
    ===================================================== */

    async function loadShifts() {

        try {

            const response =
                await FuelGapAPI.request("/shifts");

            MeterReadingsState.shifts =
                normalizeArrayResponse(response)
                .map(normalizeShift);

            console.log(
                "FuelGap meter reading shifts:",
                MeterReadingsState.shifts
            );

        } catch (error) {

            console.error(
                "Failed to load shifts:",
                error
            );

            MeterReadingsState.shifts = [];

        }

    }


    /* =====================================================
       LOAD METER READINGS
    ===================================================== */

    async function loadMeterReadings() {

        try {

            const response =
                await FuelGapAPI.request("/meter-readings");

            MeterReadingsState.readings =
                normalizeArrayResponse(response)
                .map(normalizeReading);

        } catch (error) {

            console.error(
                "Failed to load meter readings:",
                error
            );

            MeterReadingsState.readings = [];

        }

    }


    /* =====================================================
       NORMALIZE API ARRAY RESPONSE
    ===================================================== */

    function normalizeArrayResponse(response) {

        if (Array.isArray(response)) {
            return response;
        }

        if (Array.isArray(response?.data)) {
            return response.data;
        }

        if (Array.isArray(response?.data?.stations)) {
            return response.data.stations;
        }

        if (Array.isArray(response?.data?.pumps)) {
            return response.data.pumps;
        }

        if (Array.isArray(response?.data?.nozzles)) {
            return response.data.nozzles;
        }

        if (Array.isArray(response?.data?.shifts)) {
            return response.data.shifts;
        }

        if (Array.isArray(response?.data?.readings)) {
            return response.data.readings;
        }

        if (Array.isArray(response?.stations)) {
            return response.stations;
        }

        if (Array.isArray(response?.pumps)) {
            return response.pumps;
        }

        if (Array.isArray(response?.nozzles)) {
            return response.nozzles;
        }

        if (Array.isArray(response?.shifts)) {
            return response.shifts;
        }

        if (Array.isArray(response?.readings)) {
            return response.readings;
        }

        return [];

    }


    /* =====================================================
       NORMALIZE SHIFT
    ===================================================== */

    function normalizeShift(shift) {

        return {

            id:
                shift?.id ||
                shift?.shift_id ||
                "",

            station_id:
                shift?.station_id ||
                shift?.stationId ||
                "",

            shift_name:
                shift?.shift_name ||
                shift?.shiftName ||
                "Unnamed Shift",

            shift_date:
                shift?.shift_date ||
                shift?.shiftDate ||
                "",

            start_time:
                shift?.start_time ||
                shift?.startTime ||
                "",

            end_shift:
                shift?.end_shift ||
                shift?.endShift ||
                null,

            status:
                String(
                    shift?.status ||
                    "scheduled"
                )
                .toLowerCase()
                .trim(),

            created_at:
                shift?.created_at ||
                shift?.createdAt ||
                null

        };

    }


    /* =====================================================
       NORMALIZE READING
    ===================================================== */

    function normalizeReading(reading) {

        return {

            id:
                reading?.id ||
                reading?.reading_id ||
                "",

            station_id:
                reading?.station_id ||
                reading?.stationId ||
                "",

            pump_id:
                reading?.pump_id ||
                reading?.pumpId ||
                "",

            nozzle_id:
                reading?.nozzle_id ||
                reading?.nozzleId ||
                "",

            shift_id:
                reading?.shift_id ||
                reading?.shiftId ||
                "",

            recorded_by:
                reading?.recorded_by ||
                reading?.recordedBy ||
                "",

            reading_type:
                reading?.reading_type ||
                reading?.readingType ||
                "",

            reading:
                Number(
                    reading?.reading ?? 0
                ),

            photo_url:
                reading?.photo_url ||
                reading?.photoUrl ||
                null,

            captured_at:
                reading?.captured_at ||
                reading?.capturedAt ||
                null,

            created_at:
                reading?.created_at ||
                reading?.createdAt ||
                null

        };

    }


    /* =====================================================
       SETUP EVENTS
    ===================================================== */

    function setupMeterReadingEvents() {

        const refreshBtn =
            document.getElementById(
                "refreshMeterReadingsBtn"
            );

        const openBtn =
            document.getElementById(
                "openMeterReadingModalBtn"
            );

        const closeBtn =
            document.getElementById(
                "closeMeterReadingModalBtn"
            );

        const cancelBtn =
            document.getElementById(
                "cancelMeterReadingBtn"
            );

        const stationSelect =
            document.getElementById(
                "readingStation"
            );

        const pumpSelect =
            document.getElementById(
                "readingPump"
            );

        const readingType =
            document.getElementById(
                "readingType"
            );

        const form =
            document.getElementById(
                "meterReadingForm"
            );

        const startCameraBtn =
            document.getElementById(
                "startCameraBtn"
            );

        const capturePhotoBtn =
            document.getElementById(
                "capturePhotoBtn"
            );

        const retakePhotoBtn =
            document.getElementById(
                "retakePhotoBtn"
            );

        const stationFilter =
            document.getElementById(
                "meterStationFilter"
            );

        const typeFilter =
            document.getElementById(
                "meterTypeFilter"
            );

        const searchInput =
            document.getElementById(
                "meterSearch"
            );


        if (refreshBtn) {

            refreshBtn.addEventListener(
                "click",
                async function () {

                    await loadMeterReadingData();

                    showToast(
                        "Meter readings refreshed.",
                        "success"
                    );

                }
            );

        }


        if (openBtn) {

            openBtn.addEventListener(
                "click",
                openMeterReadingModal
            );

        }


        if (closeBtn) {

            closeBtn.addEventListener(
                "click",
                closeMeterReadingModal
            );

        }


        if (cancelBtn) {

            cancelBtn.addEventListener(
                "click",
                closeMeterReadingModal
            );

        }


        if (stationSelect) {

            stationSelect.addEventListener(
                "change",
                handleStationChange
            );

        }


        if (pumpSelect) {

            pumpSelect.addEventListener(
                "change",
                handlePumpChange
            );

        }


        if (readingType) {

            readingType.addEventListener(
                "change",
                handleReadingTypeChange
            );

        }


        if (form) {

            form.addEventListener(
                "submit",
                submitMeterReading
            );

        }


        if (startCameraBtn) {

            startCameraBtn.addEventListener(
                "click",
                startCamera
            );

        }


        if (capturePhotoBtn) {

            capturePhotoBtn.addEventListener(
                "click",
                capturePhoto
            );

        }


        if (retakePhotoBtn) {

            retakePhotoBtn.addEventListener(
                "click",
                retakePhoto
            );

        }


        if (stationFilter) {

            stationFilter.addEventListener(
                "change",
                renderReadingsTable
            );

        }


        if (typeFilter) {

            typeFilter.addEventListener(
                "change",
                renderReadingsTable
            );

        }


        if (searchInput) {

            searchInput.addEventListener(
                "input",
                renderReadingsTable
            );

        }


        const modal =
            document.getElementById(
                "meterReadingModal"
            );

        if (modal) {

            modal.addEventListener(
                "click",
                function (event) {

                    if (event.target === modal) {

                        closeMeterReadingModal();

                    }

                }
            );

        }

    }


    /* =====================================================
       POPULATE STATION DROPDOWNS
    ===================================================== */

    function populateStationDropdowns() {

        const stationSelect =
            document.getElementById(
                "readingStation"
            );

        const stationFilter =
            document.getElementById(
                "meterStationFilter"
            );


        if (stationSelect) {

            stationSelect.innerHTML = `
                <option value="">
                    Select station
                </option>
            `;

            MeterReadingsState.stations
                .forEach(function (station) {

                    const option =
                        document.createElement("option");

                    option.value =
                        station.id ||
                        station.station_id ||
                        "";

                    option.textContent =
                        station.name ||
                        station.station_name ||
                        "Unnamed Station";

                    stationSelect.appendChild(option);

                });

        }


        if (stationFilter) {

            stationFilter.innerHTML = `
                <option value="">
                    All Stations
                </option>
            `;

            MeterReadingsState.stations
                .forEach(function (station) {

                    const option =
                        document.createElement("option");

                    option.value =
                        station.id ||
                        station.station_id ||
                        "";

                    option.textContent =
                        station.name ||
                        station.station_name ||
                        "Unnamed Station";

                    stationFilter.appendChild(option);

                });

        }

    }


    /* =====================================================
       STATION CHANGE
    ===================================================== */

    function handleStationChange(event) {

        const stationId =
            event.target.value;

        const pumpSelect =
            document.getElementById(
                "readingPump"
            );

        const nozzleSelect =
            document.getElementById(
                "readingNozzle"
            );

        if (!pumpSelect || !nozzleSelect) {
            return;
        }


        pumpSelect.innerHTML = `
            <option value="">
                Select pump
            </option>
        `;

        nozzleSelect.innerHTML = `
            <option value="">
                Select pump first
            </option>
        `;


        pumpSelect.disabled = true;
        nozzleSelect.disabled = true;


        populateShiftDropdown(stationId);


        if (!stationId) {

            return;
        }


        const stationPumps =
            MeterReadingsState.pumps
                .filter(function (pump) {

                    return String(
                        pump.station_id ||
                        pump.stationId ||
                        ""
                    ) === String(stationId);

                });


        if (stationPumps.length === 0) {

            pumpSelect.innerHTML = `
                <option value="">
                    No pumps found for this station
                </option>
            `;

            return;
        }


        stationPumps.forEach(function (pump) {

            const option =
                document.createElement("option");

            option.value =
                pump.id ||
                pump.pump_id ||
                "";

            const pumpNumber =
                pump.pump_number ||
                pump.pumpNumber ||
                pump.number ||
                pump.name ||
                "Pump";

            const brand =
                pump.brand
                    ? ` - ${pump.brand}`
                    : "";

            option.textContent =
                `${pumpNumber}${brand}`;

            pumpSelect.appendChild(option);

        });


        pumpSelect.disabled = false;

    }


    /* =====================================================
       POPULATE SHIFT DROPDOWN
    ===================================================== */

    function populateShiftDropdown(stationId) {

        const shiftSelect =
            document.getElementById(
                "readingShift"
            );

        const shiftHelp =
            document.getElementById(
                "readingShiftHelp"
            );

        if (!shiftSelect) {
            return;
        }


        shiftSelect.innerHTML = `
            <option value="">
                Select shift
            </option>
        `;

        shiftSelect.disabled = true;


        if (!stationId) {

            if (shiftHelp) {

                shiftHelp.textContent =
                    "Select a station first.";

            }

            return;
        }


        const readingType =
            document.getElementById(
                "readingType"
            )?.value || "opening";


        const stationShifts =
            MeterReadingsState.shifts
                .filter(function (shift) {

                    return String(
                        shift.station_id || ""
                    ) === String(stationId);

                });


        /*
         * Normal meter readings require
         * an OPEN shift in the backend.
         *
         * Correction readings can be
         * associated with a closed shift.
         */

        let availableShifts;


        if (readingType === "correction") {

            availableShifts =
                stationShifts.filter(function (shift) {

                    return [
                        "open",
                        "closed"
                    ].includes(
                        String(shift.status).toLowerCase()
                    );

                });

        } else {

            availableShifts =
                stationShifts.filter(function (shift) {

                    return String(
                        shift.status
                    ).toLowerCase() === "open";

                });

        }


        if (availableShifts.length === 0) {

            if (readingType === "correction") {

                shiftSelect.innerHTML = `
                    <option value="">
                        No open or closed shifts available
                    </option>
                `;

                if (shiftHelp) {

                    shiftHelp.textContent =
                        "No usable shifts are available for this station.";

                }

            } else {

                shiftSelect.innerHTML = `
                    <option value="">
                        No open shift available
                    </option>
                `;

                if (shiftHelp) {

                    shiftHelp.textContent =
                        "The station must have an open shift before recording this reading.";

                }

            }

            return;
        }


        availableShifts.forEach(function (shift) {

            const option =
                document.createElement("option");

            option.value =
                shift.id;


            const shiftName =
                shift.shift_name ||
                "Unnamed Shift";

            const date =
                formatDateOnly(
                    shift.shift_date
                );

            const status =
                String(
                    shift.status ||
                    ""
                ).toUpperCase();


            option.textContent =
                `${shiftName} • ${date} • ${status}`;


            shiftSelect.appendChild(option);

        });


        shiftSelect.disabled = false;


        if (availableShifts.length === 1) {

            shiftSelect.value =
                availableShifts[0].id;

        }


        if (shiftHelp) {

            if (readingType === "correction") {

                shiftHelp.textContent =
                    "Select the shift this correction belongs to.";

            } else {

                shiftHelp.textContent =
                    "Only open shifts are available for this reading.";

            }

        }

    }


    /* =====================================================
       PUMP CHANGE
    ===================================================== */

    function handlePumpChange(event) {

        const pumpId =
            event.target.value;

        const nozzleSelect =
            document.getElementById(
                "readingNozzle"
            );


        if (!nozzleSelect) {
            return;
        }


        nozzleSelect.innerHTML = `
            <option value="">
                Select nozzle
            </option>
        `;

        nozzleSelect.disabled = true;


        if (!pumpId) {
            return;
        }


        const pumpNozzles =
            MeterReadingsState.nozzles
                .filter(function (nozzle) {

                    return String(
                        nozzle.pump_id ||
                        nozzle.pumpId ||
                        ""
                    ) === String(pumpId);

                });


        if (pumpNozzles.length === 0) {

            nozzleSelect.innerHTML = `
                <option value="">
                    No nozzles found for this pump
                </option>
            `;

            return;
        }


        pumpNozzles.forEach(function (nozzle) {

            const option =
                document.createElement("option");

            option.value =
                nozzle.id ||
                nozzle.nozzle_id ||
                "";


            const number =
                nozzle.nozzle_number ||
                nozzle.nozzleNumber ||
                nozzle.number ||
                "Nozzle";


            const product =
                nozzle.product
                    ? ` - ${String(
                        nozzle.product
                    ).toUpperCase()}`
                    : "";


            option.textContent =
                `${number}${product}`;


            nozzleSelect.appendChild(option);

        });


        nozzleSelect.disabled = false;

    }


    /* =====================================================
       READING TYPE CHANGE
    ===================================================== */

    function handleReadingTypeChange() {

        const stationSelect =
            document.getElementById(
                "readingStation"
            );

        const stationId =
            stationSelect?.value || "";


        populateShiftDropdown(stationId);

    }


    /* =====================================================
       OPEN MODAL
    ===================================================== */

    function openMeterReadingModal() {

        const modal =
            document.getElementById(
                "meterReadingModal"
            );

        if (!modal) {
            return;
        }


        resetMeterReadingForm();


        populateStationDropdowns();


        modal.style.display = "flex";


        document.body.classList.add(
            "modal-open"
        );

    }


    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    function closeMeterReadingModal() {

        stopCamera();


        const modal =
            document.getElementById(
                "meterReadingModal"
            );


        if (modal) {

            modal.style.display = "none";

        }


        document.body.classList.remove(
            "modal-open"
        );


        resetMeterReadingForm();

    }


    /* =====================================================
       RESET FORM
    ===================================================== */

    function resetMeterReadingForm() {

        const form =
            document.getElementById(
                "meterReadingForm"
            );

        if (form) {

            form.reset();

        }


        MeterReadingsState.currentPhoto =
            null;


        const pumpSelect =
            document.getElementById(
                "readingPump"
            );

        const nozzleSelect =
            document.getElementById(
                "readingNozzle"
            );

        const shiftSelect =
            document.getElementById(
                "readingShift"
            );


        if (pumpSelect) {

            pumpSelect.innerHTML = `
                <option value="">
                    Select station first
                </option>
            `;

            pumpSelect.disabled = true;

        }


        if (nozzleSelect) {

            nozzleSelect.innerHTML = `
                <option value="">
                    Select pump first
                </option>
            `;

            nozzleSelect.disabled = true;

        }


        if (shiftSelect) {

            shiftSelect.innerHTML = `
                <option value="">
                    Select station first
                </option>
            `;

            shiftSelect.disabled = true;

        }


        resetCameraUI();

    }


    /* =====================================================
       START CAMERA
    ===================================================== */

    async function startCamera() {

        try {

            if (!navigator.mediaDevices ||
                !navigator.mediaDevices.getUserMedia) {

                throw new Error(
                    "Camera access is not supported by this browser."
                );

            }


            stopCamera();


            const stream =
                await navigator.mediaDevices.getUserMedia({

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

                });


            MeterReadingsState.cameraStream =
                stream;


            const video =
                document.getElementById(
                    "meterCamera"
                );

            const placeholder =
                document.getElementById(
                    "cameraPlaceholder"
                );

            const preview =
                document.getElementById(
                    "meterPhotoPreview"
                );

            const captureBtn =
                document.getElementById(
                    "capturePhotoBtn"
                );


            if (video) {

                video.srcObject =
                    stream;

                video.style.display =
                    "block";

            }


            if (placeholder) {

                placeholder.style.display =
                    "none";

            }


            if (preview) {

                preview.style.display =
                    "none";

            }


            if (captureBtn) {

                captureBtn.disabled =
                    false;

            }


            setCameraStatus(
                "Camera active. Position the pump meter clearly and capture.",
                "active"
            );

        } catch (error) {

            console.error(
                "Camera error:",
                error
            );

            showToast(
                "Unable to access camera. Please allow camera permission.",
                "error"
            );

            setCameraStatus(
                "Camera access failed. Please allow camera permission.",
                "error"
            );

        }

    }


    /* =====================================================
       CAPTURE PHOTO
    ===================================================== */

    function capturePhoto() {

        const video =
            document.getElementById(
                "meterCamera"
            );

        const canvas =
            document.getElementById(
                "meterPhotoCanvas"
            );

        const preview =
            document.getElementById(
                "meterPhotoPreview"
            );

        const retakeBtn =
            document.getElementById(
                "retakePhotoBtn"
            );

        const captureBtn =
            document.getElementById(
                "capturePhotoBtn"
            );


        if (!video || !canvas) {

            showToast(
                "Camera is not ready.",
                "error"
            );

            return;
        }


        if (
            !video.videoWidth ||
            !video.videoHeight
        ) {

            showToast(
                "Camera image is not ready yet. Try again.",
                "error"
            );

            return;
        }


        canvas.width =
            video.videoWidth;

        canvas.height =
            video.videoHeight;


        const context =
            canvas.getContext("2d");


        context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );


        const photoData =
            canvas.toDataURL(
                "image/jpeg",
                0.82
            );


        MeterReadingsState.currentPhoto =
            photoData;


        if (preview) {

            preview.src =
                photoData;

            preview.style.display =
                "block";

        }


        video.style.display =
            "none";


        if (captureBtn) {

            captureBtn.disabled =
                true;

        }


        if (retakeBtn) {

            retakeBtn.disabled =
                false;

        }


        stopCamera(false);


        setCameraStatus(
            "Evidence captured successfully.",
            "success"
        );

    }


    /* =====================================================
       RETAKE PHOTO
    ===================================================== */

    async function retakePhoto() {

        MeterReadingsState.currentPhoto =
            null;


        const preview =
            document.getElementById(
                "meterPhotoPreview"
            );

        const retakeBtn =
            document.getElementById(
                "retakePhotoBtn"
            );


        if (preview) {

            preview.src = "";

            preview.style.display =
                "none";

        }


        if (retakeBtn) {

            retakeBtn.disabled =
                true;

        }


        await startCamera();

    }


    /* =====================================================
       STOP CAMERA
    ===================================================== */

    function stopCamera(clearUI = true) {

        if (
            MeterReadingsState.cameraStream
        ) {

            MeterReadingsState.cameraStream
                .getTracks()
                .forEach(function (track) {

                    track.stop();

                });

            MeterReadingsState.cameraStream =
                null;

        }


        if (clearUI) {

            const video =
                document.getElementById(
                    "meterCamera"
                );

            if (video) {

                video.srcObject =
                    null;

                video.style.display =
                    "none";

            }

        }

    }


    /* =====================================================
       RESET CAMERA UI
    ===================================================== */

    function resetCameraUI() {

        stopCamera();


        const video =
            document.getElementById(
                "meterCamera"
            );

        const placeholder =
            document.getElementById(
                "cameraPlaceholder"
            );

        const preview =
            document.getElementById(
                "meterPhotoPreview"
            );

        const captureBtn =
            document.getElementById(
                "capturePhotoBtn"
            );

        const retakeBtn =
            document.getElementById(
                "retakePhotoBtn"
            );


        if (video) {

            video.style.display =
                "none";

            video.srcObject =
                null;

        }


        if (placeholder) {

            placeholder.style.display =
                "flex";

        }


        if (preview) {

            preview.src = "";

            preview.style.display =
                "none";

        }


        if (captureBtn) {

            captureBtn.disabled =
                true;

        }


        if (retakeBtn) {

            retakeBtn.disabled =
                true;

        }


        setCameraStatus(
            "Evidence photo required.",
            ""
        );

    }


    /* =====================================================
       SET CAMERA STATUS
    ===================================================== */

    function setCameraStatus(
        message,
        type
    ) {

        const status =
            document.getElementById(
                "cameraStatus"
            );


        if (!status) {
            return;
        }


        status.textContent =
            message;


        status.className =
            "camera-status";


        if (type) {

            status.classList.add(
                `camera-status-${type}`
            );

        }

    }


    /* =====================================================
       SUBMIT METER READING
    ===================================================== */

    async function submitMeterReading(event) {

        event.preventDefault();


        if (MeterReadingsState.isSubmitting) {
            return;
        }


        const stationId =
            document.getElementById(
                "readingStation"
            )?.value;


        const pumpId =
            document.getElementById(
                "readingPump"
            )?.value;


        const nozzleId =
            document.getElementById(
                "readingNozzle"
            )?.value;


        const shiftId =
            document.getElementById(
                "readingShift"
            )?.value;


        const readingType =
            document.getElementById(
                "readingType"
            )?.value;


        const readingInput =
            document.getElementById(
                "meterReadingValue"
            );


        const numericReading =
            Number(
                readingInput?.value
            );


        /* ================================================
           VALIDATION
        ================================================= */

        if (!stationId) {

            showToast(
                "Please select a station.",
                "error"
            );

            return;
        }


        if (!pumpId) {

            showToast(
                "Please select a pump.",
                "error"
            );

            return;
        }


        if (!nozzleId) {

            showToast(
                "Please select a nozzle.",
                "error"
            );

            return;
        }


        if (!shiftId) {

            showToast(
                "Please select a shift.",
                "error"
            );

            return;
        }


        if (!readingType) {

            showToast(
                "Please select a reading type.",
                "error"
            );

            return;
        }


        if (
            !Number.isFinite(
                numericReading
            ) ||
            numericReading < 0
        ) {

            showToast(
                "Please enter a valid meter reading.",
                "error"
            );

            return;
        }


        if (
            !MeterReadingsState.currentPhoto
        ) {

            showToast(
                "Please capture live camera evidence before saving.",
                "error"
            );

            return;
        }


        /* ================================================
           CHECK SHIFT LOCALLY
        ================================================= */

        const selectedShift =
            MeterReadingsState.shifts
                .find(function (shift) {

                    return String(
                        shift.id
                    ) === String(
                        shiftId
                    );

                });


        if (!selectedShift) {

            showToast(
                "Selected shift could not be found.",
                "error"
            );

            return;
        }


        if (
            readingType !== "correction" &&
            String(
                selectedShift.status
            ).toLowerCase() !== "open"
        ) {

            showToast(
                "The selected shift is not open. Please select an open shift.",
                "error"
            );

            return;
        }


        /* ================================================
           PAYLOAD
        ================================================= */

        const payload = {

            station_id:
                stationId,

            pump_id:
                pumpId,

            nozzle_id:
                nozzleId,

            shift_id:
                shiftId,

            reading_type:
                readingType,

            reading:
                numericReading,

            photo_url:
                MeterReadingsState.currentPhoto

        };


        console.log(
            "SUBMITTING METER READING:",
            payload
        );


        /* ================================================
           SUBMIT
        ================================================= */

        MeterReadingsState.isSubmitting =
            true;


        const saveButton =
            document.getElementById(
                "saveMeterReadingBtn"
            );


        if (saveButton) {

            saveButton.disabled =
                true;

            saveButton.textContent =
                "Saving...";

        }


        try {

            const response =
                await FuelGapAPI.request(
                    "/meter-readings",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


            console.log(
                "METER READING SAVED:",
                response
            );


            showToast(
                "Meter reading saved successfully.",
                "success"
            );


            closeMeterReadingModal();


            await loadMeterReadingData();


        } catch (error) {

            console.error(
                "Meter reading save error:",
                error
            );


            showToast(
                error.message ||
                "Unable to save meter reading.",
                "error"
            );


        } finally {

            MeterReadingsState.isSubmitting =
                false;


            if (saveButton) {

                saveButton.disabled =
                    false;

                saveButton.textContent =
                    "Save Meter Reading";

            }

        }

    }


    /* =====================================================
       UPDATE STATS
    ===================================================== */

    function updateStats() {

        const readings =
            MeterReadingsState.readings;


        const today =
            new Date();


        const todayKey =
            today.toISOString()
                .slice(0, 10);


        const todayReadings =
            readings.filter(function (reading) {

                const date =
                    reading.captured_at ||
                    reading.created_at;


                if (!date) {
                    return false;
                }


                return String(date)
                    .slice(0, 10) === todayKey;

            });


        const openingReadings =
            readings.filter(function (reading) {

                return reading.reading_type ===
                    "opening";

            });


        const evidenceReadings =
            readings.filter(function (reading) {

                return Boolean(
                    reading.photo_url
                );

            });


        const totalEl =
            document.getElementById(
                "totalReadingsStat"
            );


        const todayEl =
            document.getElementById(
                "todayReadingsStat"
            );


        const openingEl =
            document.getElementById(
                "openingReadingsStat"
            );


        const evidenceEl =
            document.getElementById(
                "evidenceReadingsStat"
            );


        if (totalEl) {

            totalEl.textContent =
                readings.length;

        }


        if (todayEl) {

            todayEl.textContent =
                todayReadings.length;

        }


        if (openingEl) {

            openingEl.textContent =
                openingReadings.length;

        }


        if (evidenceEl) {

            evidenceEl.textContent =
                evidenceReadings.length;

        }

    }


    /* =====================================================
       RENDER EVIDENCE ROLL
    ===================================================== */

    function renderEvidenceRoll() {

        const container =
            document.getElementById(
                "meterEvidenceRoll"
            );


        if (!container) {
            return;
        }


        const evidence =
            MeterReadingsState.readings
                .filter(function (reading) {

                    return Boolean(
                        reading.photo_url
                    );

                })
                .sort(function (a, b) {

                    return new Date(
                        b.captured_at ||
                        b.created_at ||
                        0
                    ) -
                    new Date(
                        a.captured_at ||
                        a.created_at ||
                        0
                    );

                })
                .slice(0, 8);


        if (evidence.length === 0) {

            container.innerHTML = `
                <div class="empty-state">
                    No evidence captured yet.
                </div>
            `;

            return;
        }


        container.innerHTML =
            evidence.map(function (reading) {

                const station =
                    getStationName(
                        reading.station_id
                    );


                const pump =
                    getPumpName(
                        reading.pump_id
                    );


                const nozzle =
                    getNozzleName(
                        reading.nozzle_id
                    );


                const type =
                    formatReadingType(
                        reading.reading_type
                    );


                return `

                    <div class="evidence-card">

                        <div class="evidence-image-wrapper">

                            <img
                                src="${escapeAttribute(
                                    reading.photo_url
                                )}"
                                alt="Meter evidence"
                                class="evidence-image"
                            >

                        </div>

                        <div class="evidence-info">

                            <strong>
                                ${escapeHtml(station)}
                            </strong>

                            <span>
                                ${escapeHtml(pump)}
                                •
                                ${escapeHtml(nozzle)}
                            </span>

                            <span>
                                ${escapeHtml(type)}
                                •
                                ${formatNumber(
                                    reading.reading
                                )}
                            </span>

                        </div>

                    </div>

                `;

            }).join("");

    }


    /* =====================================================
       RENDER TABLE
    ===================================================== */

    function renderReadingsTable() {

        const tbody =
            document.getElementById(
                "meterReadingsTableBody"
            );


        if (!tbody) {
            return;
        }


        const stationFilter =
            document.getElementById(
                "meterStationFilter"
            )?.value || "";


        const typeFilter =
            document.getElementById(
                "meterTypeFilter"
            )?.value || "";


        const search =
            (
                document.getElementById(
                    "meterSearch"
                )?.value || ""
            )
            .toLowerCase()
            .trim();


        let readings =
            [...MeterReadingsState.readings];


        if (stationFilter) {

            readings =
                readings.filter(function (reading) {

                    return String(
                        reading.station_id
                    ) === String(
                        stationFilter
                    );

                });

        }


        if (typeFilter) {

            readings =
                readings.filter(function (reading) {

                    return String(
                        reading.reading_type
                    ).toLowerCase() ===
                    String(typeFilter).toLowerCase();

                });

        }


        if (search) {

            readings =
                readings.filter(function (reading) {

                    const searchable = [

                        getStationName(
                            reading.station_id
                        ),

                        getPumpName(
                            reading.pump_id
                        ),

                        getNozzleName(
                            reading.nozzle_id
                        ),

                        getShiftName(
                            reading.shift_id
                        ),

                        reading.reading_type,

                        reading.reading

                    ]
                    .join(" ")
                    .toLowerCase();


                    return searchable.includes(
                        search
                    );

                });

        }


        readings.sort(function (a, b) {

            return new Date(
                b.captured_at ||
                b.created_at ||
                0
            ) -
            new Date(
                a.captured_at ||
                a.created_at ||
                0
            );

        });


        if (readings.length === 0) {

            tbody.innerHTML = `
                <tr>

                    <td
                        colspan="8"
                        class="table-empty"
                    >
                        No meter readings found.
                    </td>

                </tr>
            `;

            return;
        }


        tbody.innerHTML =
            readings.map(function (reading) {

                const station =
                    getStationName(
                        reading.station_id
                    );


                const pump =
                    getPumpName(
                        reading.pump_id
                    );


                const nozzle =
                    getNozzleName(
                        reading.nozzle_id
                    );


                const shift =
                    getShiftName(
                        reading.shift_id
                    );


                const type =
                    formatReadingType(
                        reading.reading_type
                    );


                const evidence =
                    reading.photo_url
                        ? `
                            <span class="status-badge status-success">
                                Captured
                            </span>
                        `
                        : `
                            <span class="status-badge status-warning">
                                Missing
                            </span>
                        `;


                return `

                    <tr>

                        <td>
                            <strong>
                                ${escapeHtml(station)}
                            </strong>
                        </td>

                        <td>
                            ${escapeHtml(pump)}
                        </td>

                        <td>
                            ${escapeHtml(nozzle)}
                        </td>

                        <td>
                            ${escapeHtml(shift)}
                        </td>

                        <td>
                            <span
                                class="reading-type-badge reading-${escapeAttribute(
                                    reading.reading_type
                                )}"
                            >
                                ${escapeHtml(type)}
                            </span>
                        </td>

                        <td>
                            <strong>
                                ${formatNumber(
                                    reading.reading
                                )}
                            </strong>
                        </td>

                        <td>
                            ${evidence}
                        </td>

                        <td>
                            ${formatDateTime(
                                reading.captured_at ||
                                reading.created_at
                            )}
                        </td>

                    </tr>

                `;

            }).join("");

    }


    /* =====================================================
       GET STATION NAME
    ===================================================== */

    function getStationName(stationId) {

        const station =
            MeterReadingsState.stations
                .find(function (item) {

                    return String(
                        item.id ||
                        item.station_id ||
                        ""
                    ) === String(
                        stationId || ""
                    );

                });


        if (!station) {

            return "Unknown Station";

        }


        return (
            station.name ||
            station.station_name ||
            "Unnamed Station"
        );

    }


    /* =====================================================
       GET PUMP NAME
    ===================================================== */

    function getPumpName(pumpId) {

        const pump =
            MeterReadingsState.pumps
                .find(function (item) {

                    return String(
                        item.id ||
                        item.pump_id ||
                        ""
                    ) === String(
                        pumpId || ""
                    );

                });


        if (!pump) {

            return "Unknown Pump";

        }


        const number =
            pump.pump_number ||
            pump.pumpNumber ||
            pump.number ||
            pump.name ||
            "Pump";


        return String(number);

    }


    /* =====================================================
       GET NOZZLE NAME
    ===================================================== */

    function getNozzleName(nozzleId) {

        const nozzle =
            MeterReadingsState.nozzles
                .find(function (item) {

                    return String(
                        item.id ||
                        item.nozzle_id ||
                        ""
                    ) === String(
                        nozzleId || ""
                    );

                });


        if (!nozzle) {

            return "Unknown Nozzle";

        }


        const number =
            nozzle.nozzle_number ||
            nozzle.nozzleNumber ||
            nozzle.number ||
            "Nozzle";


        const product =
            nozzle.product
                ? ` (${String(
                    nozzle.product
                ).toUpperCase()})`
                : "";


        return `${number}${product}`;

    }


    /* =====================================================
       GET SHIFT NAME
    ===================================================== */

    function getShiftName(shiftId) {

        if (!shiftId) {

            return "No Shift";

        }


        const shift =
            MeterReadingsState.shifts
                .find(function (item) {

                    return String(
                        item.id
                    ) === String(
                        shiftId
                    );

                });


        if (!shift) {

            return "Unknown Shift";

        }


        return (
            shift.shift_name ||
            "Unnamed Shift"
        );

    }


    /* =====================================================
       FORMAT READING TYPE
    ===================================================== */

    function formatReadingType(type) {

        const labels = {

            opening:
                "Opening",

            periodic:
                "Periodic",

            closing:
                "Closing",

            correction:
                "Correction"

        };


        return labels[
            String(type || "").toLowerCase()
        ] || "Unknown";

    }


    /* =====================================================
       FORMAT NUMBER
    ===================================================== */

    function formatNumber(value) {

        const number =
            Number(value);


        if (!Number.isFinite(number)) {

            return "0";

        }


        return number.toLocaleString(
            "en-NG",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        );

    }


    /* =====================================================
       FORMAT DATE ONLY
    ===================================================== */

    function formatDateOnly(value) {

        if (!value) {
            return "N/A";
        }


        const date =
            new Date(value);


        if (Number.isNaN(
            date.getTime()
        )) {

            return String(value);

        }


        return date.toLocaleDateString(
            "en-NG",
            {
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        );

    }


    /* =====================================================
       FORMAT DATE TIME
    ===================================================== */

    function formatDateTime(value) {

        if (!value) {
            return "N/A";
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return String(value);

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
       ESCAPE HTML
    ===================================================== */

    function escapeHtml(value) {

        return String(
            value ?? ""
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


    /* =====================================================
       ESCAPE ATTRIBUTE
    ===================================================== */

    function escapeAttribute(value) {

        return escapeHtml(value);

    }


    /* =====================================================
       TOAST
    ===================================================== */

    function showToast(
        message,
        type = "info"
    ) {

        const toast =
            document.getElementById(
                "meterReadingToast"
            );


        if (!toast) {

            console.log(
                `[${type}]`,
                message
            );

            return;
        }


        toast.textContent =
            message;


        toast.className =
            "fg-toast";


        toast.classList.add(
            `fg-toast-${type}`
        );


        toast.classList.add(
            "show"
        );


        clearTimeout(
            showToast.timeout
        );


        showToast.timeout =
            setTimeout(
                function () {

                    toast.classList.remove(
                        "show"
                    );

                },
                4000
            );

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.MeterReadingsState =
        MeterReadingsState;


    window.initializeMeterReadingsPage =
        async function () {

            await loadMeterReadingData();

        };


    window.MeterReadingsPage = {

        init:
            async function () {

                await loadMeterReadingData();

            },

        refresh:
            async function () {

                await loadMeterReadingData();

            },

        openModal:
            openMeterReadingModal,

        closeModal:
            closeMeterReadingModal,

        load:
            loadMeterReadingData

    };


})();