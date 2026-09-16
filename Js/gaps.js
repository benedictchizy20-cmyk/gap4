/* =========================================================
   FUELGAP - GAPS & VARIANCE
   COMPLETE BACKEND CONNECTED VERSION
   INLINE CSS
   NO LOCALSTORAGE
========================================================= */

(function () {

    "use strict";

    /* =====================================================
       STATE
    ===================================================== */

    const GapsState = {

        currentUser: null,

        stations: [],
        pumps: [],
        nozzles: [],
        shifts: [],
        gaps: [],

        filteredGaps: [],

        selectedStation: "",
        selectedPump: "",
        selectedNozzle: "",
        selectedShift: "",

        search: "",
        status: "",

        isLoading: false,
        isSubmitting: false,
        initialized: false
    };


    /* =====================================================
       INLINE CSS
    ===================================================== */

    function injectGapsStyles() {

        if (document.getElementById("fuelgap-gaps-inline-css")) {
            return;
        }

        const style = document.createElement("style");

        style.id = "fuelgap-gaps-inline-css";

        style.textContent = `

        /* ================================================
           GAPS PAGE
        ================================================ */

        .fg-gaps-page {
            width: 100%;
            min-height: 100%;
            background: #f7f8fa;
            color: #171717;
            font-family:
                Inter,
                Arial,
                Helvetica,
                sans-serif;
        }

        .fg-gaps-page *,
        .fg-gaps-page *::before,
        .fg-gaps-page *::after {
            box-sizing: border-box;
        }

        .fg-gaps-container {
            width: 100%;
            max-width: 1500px;
            margin: 0 auto;
            padding: 24px;
        }

        .fg-gaps-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 24px;
        }

        .fg-gaps-title-wrap h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 800;
            color: #171717;
        }

        .fg-gaps-title-wrap p {
            margin: 7px 0 0;
            color: #737373;
            font-size: 14px;
        }

        .fg-gaps-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }

        .fg-btn {
            border: 1px solid #e5e5e5;
            background: #ffffff;
            color: #222222;
            border-radius: 9px;
            padding: 11px 16px;
            min-height: 42px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: .2s ease;
        }

        .fg-btn:hover {
            border-color: #f2c300;
            transform: translateY(-1px);
        }

        .fg-btn:disabled {
            opacity: .6;
            cursor: not-allowed;
            transform: none;
        }

        .fg-btn-primary {
            background: #f5c400;
            border-color: #f5c400;
            color: #111111;
        }

        .fg-btn-primary:hover {
            background: #eab900;
            border-color: #eab900;
        }

        /* ================================================
           STAT CARDS
        ================================================ */

        .fg-gaps-stats {
            display: grid;
            grid-template-columns:
                repeat(4, minmax(0, 1fr));
            gap: 16px;
            margin-bottom: 22px;
        }

        .fg-stat-card {
            background: #ffffff;
            border: 1px solid #e8e8e8;
            border-radius: 14px;
            padding: 18px;
            box-shadow:
                0 3px 12px rgba(0,0,0,.04);
        }

        .fg-stat-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
        }

        .fg-stat-label {
            color: #737373;
            font-size: 13px;
            font-weight: 600;
        }

        .fg-stat-icon {
            width: 34px;
            height: 34px;
            display: grid;
            place-items: center;
            border-radius: 9px;
            background: #fff8d6;
            color: #8a6b00;
            font-weight: 800;
        }

        .fg-stat-value {
            margin-top: 9px;
            font-size: 25px;
            font-weight: 800;
            color: #171717;
        }

        .fg-stat-sub {
            margin-top: 4px;
            font-size: 12px;
            color: #8a8a8a;
        }

        /* ================================================
           CARDS
        ================================================ */

        .fg-gaps-card {
            background: #ffffff;
            border: 1px solid #e8e8e8;
            border-radius: 14px;
            box-shadow:
                0 3px 12px rgba(0,0,0,.04);
            overflow: hidden;
        }

        /* ================================================
           FILTER HEADER
        ================================================ */

        .fg-filter-header {
            padding: 18px 20px;
            border-bottom: 1px solid #eeeeee;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
        }

        .fg-filter-header h2 {
            margin: 0;
            font-size: 16px;
            font-weight: 800;
        }

        .fg-filter-body {
            padding: 18px 20px;
        }

        .fg-filter-grid {
            display: grid;
            grid-template-columns:
                repeat(5, minmax(0, 1fr));
            gap: 12px;
        }

        /* ================================================
           FORM FIELDS
        ================================================ */

        .fg-field {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .fg-field label {
            font-size: 12px;
            color: #626262;
            font-weight: 700;
        }

        .fg-input,
        .fg-select {
            width: 100%;
            height: 42px;
            border: 1px solid #dcdcdc;
            border-radius: 8px;
            background: #ffffff;
            padding: 0 12px;
            outline: none;
            color: #202020;
            font-size: 13px;
            transition: .2s ease;
        }

        .fg-input:focus,
        .fg-select:focus {
            border-color: #f0c000;
            box-shadow:
                0 0 0 3px rgba(245,196,0,.12);
        }

        .fg-select:disabled {
            background: #f5f5f5;
            color: #999999;
            cursor: not-allowed;
        }

        /* ================================================
           TABLE
        ================================================ */

        .fg-table-wrap {
            overflow-x: auto;
        }

        .fg-table {
            width: 100%;
            min-width: 1050px;
            border-collapse: collapse;
        }

        .fg-table th {
            background: #fafafa;
            color: #737373;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: .04em;
            font-weight: 800;
            padding: 14px 16px;
            text-align: left;
            border-bottom: 1px solid #eeeeee;
            white-space: nowrap;
        }

        .fg-table td {
            padding: 14px 16px;
            border-bottom: 1px solid #f0f0f0;
            font-size: 13px;
            color: #303030;
            white-space: nowrap;
        }

        .fg-table tbody tr:hover {
            background: #fffdf0;
        }

        .fg-empty {
            text-align: center;
            padding: 50px 20px;
            color: #858585;
        }

        .fg-empty strong {
            display: block;
            color: #404040;
            margin-bottom: 5px;
            font-size: 15px;
        }

        /* ================================================
           BADGES
        ================================================ */

        .fg-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border-radius: 999px;
            padding: 5px 9px;
            font-size: 11px;
            font-weight: 800;
        }

        .fg-badge-normal {
            background: #eaf8ef;
            color: #177245;
        }

        .fg-badge-warning {
            background: #fff7db;
            color: #896900;
        }

        .fg-badge-critical {
            background: #ffecec;
            color: #b42318;
        }

        .fg-number-positive {
            color: #177245;
            font-weight: 800;
        }

        .fg-number-negative {
            color: #b42318;
            font-weight: 800;
        }

        .fg-number-zero {
            color: #555555;
            font-weight: 800;
        }

        /* ================================================
           MODAL
        ================================================ */

        .fg-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,.48);
            display: none;
            align-items: center;
            justify-content: center;
            padding: 20px;
            z-index: 99999;
        }

        .fg-modal-overlay.active {
            display: flex;
        }

        .fg-modal {
            width: 100%;
            max-width: 620px;
            max-height: 92vh;
            overflow-y: auto;
            background: #ffffff;
            border-radius: 16px;
            box-shadow:
                0 20px 60px rgba(0,0,0,.2);
        }

        .fg-modal-header {
            padding: 20px;
            border-bottom: 1px solid #eeeeee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .fg-modal-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 800;
        }

        .fg-modal-close {
            border: 0;
            background: #f3f3f3;
            width: 34px;
            height: 34px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 20px;
        }

        .fg-modal-body {
            padding: 20px;
        }

        .fg-form-grid {
            display: grid;
            grid-template-columns:
                repeat(2, minmax(0, 1fr));
            gap: 15px;
        }

        .fg-full {
            grid-column: 1 / -1;
        }

        .fg-modal-footer {
            padding: 16px 20px;
            border-top: 1px solid #eeeeee;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }

        .fg-help {
            margin-top: 6px;
            color: #888888;
            font-size: 11px;
        }

        /* ================================================
           LOADING
        ================================================ */

        .fg-loading {
            padding: 60px 20px;
            text-align: center;
            color: #777777;
        }

        .fg-spinner {
            width: 30px;
            height: 30px;
            border: 3px solid #eeeeee;
            border-top-color: #f5c400;
            border-radius: 50%;
            animation: fgSpin .8s linear infinite;
            margin: 0 auto 12px;
        }

        @keyframes fgSpin {
            to {
                transform: rotate(360deg);
            }
        }

        /* ================================================
           ALERT
        ================================================ */

        .fg-alert {
            margin-bottom: 18px;
            padding: 13px 15px;
            border-radius: 9px;
            font-size: 13px;
            display: none;
        }

        .fg-alert.show {
            display: block;
        }

        .fg-alert-error {
            background: #fff1f1;
            border: 1px solid #ffd2d2;
            color: #a51d1d;
        }

        .fg-alert-success {
            background: #ecfdf3;
            border: 1px solid #c9efd9;
            color: #176b3a;
        }

        /* ================================================
           RESPONSIVE
        ================================================ */

        @media (max-width: 1100px) {

            .fg-gaps-stats {
                grid-template-columns:
                    repeat(2, minmax(0, 1fr));
            }

            .fg-filter-grid {
                grid-template-columns:
                    repeat(2, minmax(0, 1fr));
            }
        }

        @media (max-width: 700px) {

            .fg-gaps-container {
                padding: 15px;
            }

            .fg-gaps-header {
                flex-direction: column;
            }

            .fg-gaps-actions {
                width: 100%;
            }

            .fg-btn {
                flex: 1;
            }

            .fg-gaps-stats {
                grid-template-columns: 1fr;
            }

            .fg-filter-grid {
                grid-template-columns: 1fr;
            }

            .fg-form-grid {
                grid-template-columns: 1fr;
            }

            .fg-full {
                grid-column: auto;
            }

            .fg-modal {
                max-height: 95vh;
            }
        }

        `;

        document.head.appendChild(style);
    }


    /* =====================================================
       HELPERS
    ===================================================== */

    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function number(value) {

        const n = Number(value);

        return Number.isFinite(n) ? n : 0;
    }


    function formatNumber(value) {

        return number(value).toLocaleString(
            "en-NG",
            {
                maximumFractionDigits: 2
            }
        );
    }


    function formatMoney(value) {

        return "₦" + number(value).toLocaleString(
            "en-NG",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
    }


    function formatDate(value) {

        if (!value) return "—";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return escapeHTML(value);
        }

        return date.toLocaleString(
            "en-NG",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );
    }


    function getId(item, type) {

        if (!item) return "";

        return String(
            item.id ||
            item[`${type}_id`] ||
            item[`${type}Id`] ||
            ""
        );
    }


    function extractData(response, keys = []) {

        if (!response) return [];

        if (Array.isArray(response)) {
            return response;
        }

        for (const key of keys) {

            if (Array.isArray(response[key])) {
                return response[key];
            }
        }

        if (response.data) {

            if (Array.isArray(response.data)) {
                return response.data;
            }

            for (const key of keys) {

                if (
                    response.data &&
                    Array.isArray(response.data[key])
                ) {
                    return response.data[key];
                }
            }
        }

        return [];
    }


    function getCurrentUser() {

        if (
            window.FuelGapUtils &&
            typeof FuelGapUtils.getCurrentUser === "function"
        ) {
            return FuelGapUtils.getCurrentUser();
        }

        return window.currentUser || null;
    }


    /* =====================================================
       BACKEND LOADERS
    ===================================================== */

    async function loadStations() {

        if (
            !window.FuelGapAPI ||
            typeof FuelGapAPI.getStations !== "function"
        ) {
            throw new Error(
                "FuelGapAPI.getStations() is unavailable."
            );
        }

        const response =
            await FuelGapAPI.getStations();

        GapsState.stations =
            extractData(
                response,
                ["stations", "data", "records"]
            );

        console.log(
            "Gaps Stations:",
            GapsState.stations
        );
    }


    async function loadPumps() {

        if (
            !window.FuelGapAPI ||
            typeof FuelGapAPI.getPumps !== "function"
        ) {
            throw new Error(
                "FuelGapAPI.getPumps() is unavailable."
            );
        }

        const response =
            await FuelGapAPI.getPumps();

        GapsState.pumps =
            extractData(
                response,
                ["pumps", "data", "records"]
            );

        console.log(
            "Gaps Pumps:",
            GapsState.pumps
        );
    }


    async function loadNozzles() {

        if (
            !window.FuelGapAPI ||
            typeof FuelGapAPI.getNozzles !== "function"
        ) {
            throw new Error(
                "FuelGapAPI.getNozzles() is unavailable."
            );
        }

        const response =
            await FuelGapAPI.getNozzles();

        GapsState.nozzles =
            extractData(
                response,
                ["nozzles", "data", "records"]
            );

        console.log(
            "Gaps Nozzles:",
            GapsState.nozzles
        );
    }


    async function loadShifts() {

        if (
            !window.FuelGapAPI ||
            typeof FuelGapAPI.getShifts !== "function"
        ) {
            throw new Error(
                "FuelGapAPI.getShifts() is unavailable."
            );
        }

        const response =
            await FuelGapAPI.getShifts();

        GapsState.shifts =
            extractData(
                response,
                ["shifts", "data", "records"]
            );

        console.log(
            "Gaps Shifts:",
            GapsState.shifts
        );
    }


    async function loadGaps() {

        if (
            !window.FuelGapAPI ||
            typeof FuelGapAPI.getGaps !== "function"
        ) {
            throw new Error(
                "FuelGapAPI.getGaps() is unavailable."
            );
        }

        const response =
            await FuelGapAPI.getGaps();

        GapsState.gaps =
            extractData(
                response,
                ["gaps", "records", "data"]
            );

        console.log(
            "Gaps Records:",
            GapsState.gaps
        );
    }


    async function loadAllData() {

        GapsState.isLoading = true;

        try {

            await Promise.all([
                loadStations(),
                loadPumps(),
                loadNozzles(),
                loadShifts(),
                loadGaps()
            ]);

            populateAllSelects();
            applyFilters();

        } finally {

            GapsState.isLoading = false;
        }
    }


    /* =====================================================
       RELATION HELPERS
    ===================================================== */

    function getPumpsForStation(stationId) {

        if (!stationId) return [];

        return GapsState.pumps.filter(pump => {

            const id = String(
                pump.station_id ||
                pump.stationId ||
                pump.station?.id ||
                ""
            );

            return id === String(stationId);
        });
    }


    function getNozzlesForPump(pumpId) {

        if (!pumpId) return [];

        return GapsState.nozzles.filter(nozzle => {

            const id = String(
                nozzle.pump_id ||
                nozzle.pumpId ||
                nozzle.pump?.id ||
                ""
            );

            return id === String(pumpId);
        });
    }


    function getShiftsForStation(stationId) {

        if (!stationId) return [];

        return GapsState.shifts.filter(shift => {

            const id = String(
                shift.station_id ||
                shift.stationId ||
                shift.station?.id ||
                ""
            );

            return id === String(stationId);
        });
    }


    /* =====================================================
       OPTION BUILDERS
    ===================================================== */

    function stationOptions(selected = "") {

        let html =
            `<option value="">All stations</option>`;

        GapsState.stations.forEach(station => {

            const id =
                getId(station, "station");

            const name =
                station.name ||
                station.station_name ||
                station.stationName ||
                `Station ${id}`;

            html += `
                <option
                    value="${escapeHTML(id)}"
                    ${String(id) === String(selected)
                        ? "selected"
                        : ""}
                >
                    ${escapeHTML(name)}
                </option>
            `;
        });

        return html;
    }


    function pumpOptions(stationId, selected = "") {

        if (!stationId) {

            return `
                <option value="">
                    Select station first
                </option>
            `;
        }

        const pumps =
            getPumpsForStation(stationId);

        if (!pumps.length) {

            return `
                <option value="">
                    No pumps available
                </option>
            `;
        }

        let html =
            `<option value="">All pumps</option>`;

        pumps.forEach(pump => {

            const id =
                getId(pump, "pump");

            const pumpNumber =
                pump.pump_number ||
                pump.pumpNumber ||
                pump.number ||
                id;

            const brand =
                pump.brand || "";

            const model =
                pump.model || "";

            const details =
                [brand, model]
                    .filter(Boolean)
                    .join(" ");

            const label =
                details
                    ? `Pump ${pumpNumber} - ${details}`
                    : `Pump ${pumpNumber}`;

            html += `
                <option
                    value="${escapeHTML(id)}"
                    ${String(id) === String(selected)
                        ? "selected"
                        : ""}
                >
                    ${escapeHTML(label)}
                </option>
            `;
        });

        return html;
    }


    function nozzleOptions(pumpId, selected = "") {

        if (!pumpId) {

            return `
                <option value="">
                    Select pump first
                </option>
            `;
        }

        const nozzles =
            getNozzlesForPump(pumpId);

        if (!nozzles.length) {

            return `
                <option value="">
                    No nozzles available
                </option>
            `;
        }

        let html =
            `<option value="">All nozzles</option>`;

        nozzles.forEach(nozzle => {

            const id =
                getId(nozzle, "nozzle");

            const nozzleNumber =
                nozzle.nozzle_number ||
                nozzle.nozzleNumber ||
                nozzle.number ||
                id;

            const product =
                nozzle.product ||
                nozzle.product_name ||
                nozzle.productName ||
                "";

            const price =
                nozzle.price_per_litre ||
                nozzle.pricePerLitre ||
                nozzle.price ||
                "";

            let label =
                `Nozzle ${nozzleNumber}`;

            if (product) {
                label += ` - ${product}`;
            }

            if (price) {
                label +=
                    ` - ₦${formatNumber(price)}/L`;
            }

            html += `
                <option
                    value="${escapeHTML(id)}"
                    ${String(id) === String(selected)
                        ? "selected"
                        : ""}
                >
                    ${escapeHTML(label)}
                </option>
            `;
        });

        return html;
    }


    function shiftOptions(stationId, selected = "") {

        if (!stationId) {

            return `
                <option value="">
                    Select station first
                </option>
            `;
        }

        const shifts =
            getShiftsForStation(stationId);

        if (!shifts.length) {

            return `
                <option value="">
                    No shifts available
                </option>
            `;
        }

        let html =
            `<option value="">All shifts</option>`;

        shifts.forEach(shift => {

            const id =
                getId(shift, "shift");

            const name =
                shift.name ||
                shift.shift_name ||
                shift.shiftName ||
                "";

            const date =
                shift.shift_date ||
                shift.shiftDate ||
                shift.date ||
                "";

            let label =
                name || `Shift ${id}`;

            if (date) {
                label += ` - ${date}`;
            }

            html += `
                <option
                    value="${escapeHTML(id)}"
                    ${String(id) === String(selected)
                        ? "selected"
                        : ""}
                >
                    ${escapeHTML(label)}
                </option>
            `;
        });

        return html;
    }


    /* =====================================================
       POPULATE ALL SELECTS
    ===================================================== */

    function populateAllSelects() {

        const station =
            document.getElementById(
                "gapsStationFilter"
            );

        const pump =
            document.getElementById(
                "gapsPumpFilter"
            );

        const nozzle =
            document.getElementById(
                "gapsNozzleFilter"
            );

        const shift =
            document.getElementById(
                "gapsShiftFilter"
            );


        if (station) {

            station.innerHTML =
                stationOptions(
                    GapsState.selectedStation
                );

            station.value =
                GapsState.selectedStation;
        }


        if (pump) {

            pump.innerHTML =
                pumpOptions(
                    GapsState.selectedStation,
                    GapsState.selectedPump
                );

            pump.value =
                GapsState.selectedPump;

            pump.disabled =
                !GapsState.selectedStation;
        }


        if (nozzle) {

            nozzle.innerHTML =
                nozzleOptions(
                    GapsState.selectedPump,
                    GapsState.selectedNozzle
                );

            nozzle.value =
                GapsState.selectedNozzle;

            nozzle.disabled =
                !GapsState.selectedPump;
        }


        if (shift) {

            shift.innerHTML =
                shiftOptions(
                    GapsState.selectedStation,
                    GapsState.selectedShift
                );

            shift.value =
                GapsState.selectedShift;

            shift.disabled =
                !GapsState.selectedStation;
        }


        populateModalSelects();
    }


    function populateModalSelects() {

        const station =
            document.getElementById(
                "gapFormStation"
            );

        const pump =
            document.getElementById(
                "gapFormPump"
            );

        const nozzle =
            document.getElementById(
                "gapFormNozzle"
            );

        const shift =
            document.getElementById(
                "gapFormShift"
            );


        if (station) {

            station.innerHTML = `
                <option value="">
                    Select station
                </option>
            `;

            GapsState.stations.forEach(item => {

                const id =
                    getId(item, "station");

                const name =
                    item.name ||
                    item.station_name ||
                    item.stationName ||
                    `Station ${id}`;

                station.innerHTML += `
                    <option value="${escapeHTML(id)}">
                        ${escapeHTML(name)}
                    </option>
                `;
            });
        }


        if (pump) {

            pump.innerHTML = `
                <option value="">
                    Select station first
                </option>
            `;

            pump.disabled = true;
        }


        if (nozzle) {

            nozzle.innerHTML = `
                <option value="">
                    Select pump first
                </option>
            `;

            nozzle.disabled = true;
        }


        if (shift) {

            shift.innerHTML = `
                <option value="">
                    Select station first
                </option>
            `;

            shift.disabled = true;
        }
    }


    /* =====================================================
       FILTER EVENTS
    ===================================================== */

    function setupFilterEvents() {

        const station =
            document.getElementById(
                "gapsStationFilter"
            );

        const pump =
            document.getElementById(
                "gapsPumpFilter"
            );

        const nozzle =
            document.getElementById(
                "gapsNozzleFilter"
            );

        const shift =
            document.getElementById(
                "gapsShiftFilter"
            );

        const status =
            document.getElementById(
                "gapsStatusFilter"
            );

        const search =
            document.getElementById(
                "gapsSearch"
            );


        if (station) {

            station.onchange = function () {

                GapsState.selectedStation =
                    this.value;

                GapsState.selectedPump = "";
                GapsState.selectedNozzle = "";
                GapsState.selectedShift = "";

                populateAllSelects();

                applyFilters();
            };
        }


        if (pump) {

            pump.onchange = function () {

                GapsState.selectedPump =
                    this.value;

                GapsState.selectedNozzle = "";

                populateAllSelects();

                applyFilters();
            };
        }


        if (nozzle) {

            nozzle.onchange = function () {

                GapsState.selectedNozzle =
                    this.value;

                applyFilters();
            };
        }


        if (shift) {

            shift.onchange = function () {

                GapsState.selectedShift =
                    this.value;

                applyFilters();
            };
        }


        if (status) {

            status.onchange = function () {

                GapsState.status =
                    this.value;

                applyFilters();
            };
        }


        if (search) {

            search.oninput = function () {

                GapsState.search =
                    this.value
                        .trim()
                        .toLowerCase();

                applyFilters();
            };
        }
    }


    /* =====================================================
       FILTER RECORDS
    ===================================================== */

    function applyFilters() {

        let records =
            [...GapsState.gaps];


        if (GapsState.selectedStation) {

            records =
                records.filter(record =>
                    String(
                        record.station_id ||
                        record.stationId ||
                        ""
                    ) ===
                    String(
                        GapsState.selectedStation
                    )
                );
        }


        if (GapsState.selectedPump) {

            records =
                records.filter(record =>
                    String(
                        record.pump_id ||
                        record.pumpId ||
                        ""
                    ) ===
                    String(
                        GapsState.selectedPump
                    )
                );
        }


        if (GapsState.selectedNozzle) {

            records =
                records.filter(record =>
                    String(
                        record.nozzle_id ||
                        record.nozzleId ||
                        ""
                    ) ===
                    String(
                        GapsState.selectedNozzle
                    )
                );
        }


        if (GapsState.selectedShift) {

            records =
                records.filter(record =>
                    String(
                        record.shift_id ||
                        record.shiftId ||
                        ""
                    ) ===
                    String(
                        GapsState.selectedShift
                    )
                );
        }


        if (GapsState.status) {

            records =
                records.filter(record =>
                    String(
                        record.status || ""
                    ).toLowerCase() ===
                    GapsState.status
                        .toLowerCase()
                );
        }


        if (GapsState.search) {

            records =
                records.filter(record => {

                    const text =
                        JSON.stringify(record)
                            .toLowerCase();

                    return text.includes(
                        GapsState.search
                    );
                });
        }


        GapsState.filteredGaps =
            records;

        renderStats();
        renderTable();
    }


    /* =====================================================
       DISPLAY HELPERS
    ===================================================== */

    function stationName(id) {

        const station =
            GapsState.stations.find(
                item =>
                    String(
                        getId(item, "station")
                    ) === String(id)
            );

        return station
            ? (
                station.name ||
                station.station_name ||
                `Station ${id}`
            )
            : "Unknown station";
    }


    function pumpName(id) {

        const pump =
            GapsState.pumps.find(
                item =>
                    String(
                        getId(item, "pump")
                    ) === String(id)
            );

        if (!pump) {
            return "Unknown pump";
        }

        const number =
            pump.pump_number ||
            pump.pumpNumber ||
            pump.number ||
            id;

        return `Pump ${number}`;
    }


    function nozzleName(id) {

        const nozzle =
            GapsState.nozzles.find(
                item =>
                    String(
                        getId(item, "nozzle")
                    ) === String(id)
            );

        if (!nozzle) {
            return "Unknown nozzle";
        }

        const number =
            nozzle.nozzle_number ||
            nozzle.nozzleNumber ||
            nozzle.number ||
            id;

        const product =
            nozzle.product ||
            nozzle.product_name ||
            "";

        return product
            ? `Nozzle ${number} - ${product}`
            : `Nozzle ${number}`;
    }


    function shiftName(id) {

        const shift =
            GapsState.shifts.find(
                item =>
                    String(
                        getId(item, "shift")
                    ) === String(id)
            );

        if (!shift) {
            return "Unknown shift";
        }

        return (
            shift.name ||
            shift.shift_name ||
            shift.shiftName ||
            `Shift ${id}`
        );
    }


    function getStatus(record) {

        const expected =
            number(
                record.expected_litres
            );

        const actual =
            number(
                record.actual_litres
            );

        const variance =
            record.variance_litres !== undefined
                ? number(
                    record.variance_litres
                )
                : actual - expected;

        const stored =
            String(
                record.status || ""
            ).toLowerCase();


        if (
            stored === "normal" ||
            stored === "warning" ||
            stored === "critical"
        ) {
            return stored;
        }


        const absolute =
            Math.abs(variance);


        if (absolute <= 0.01) {
            return "normal";
        }


        if (absolute <= 5) {
            return "warning";
        }


        return "critical";
    }


    function statusBadge(status) {

        const label =
            status.charAt(0).toUpperCase() +
            status.slice(1);

        return `
            <span class="
                fg-badge
                fg-badge-${escapeHTML(status)}
            ">
                ${escapeHTML(label)}
            </span>
        `;
    }


    /* =====================================================
       STATS
    ===================================================== */

    function renderStats() {

        const records =
            GapsState.filteredGaps;

        const total =
            records.length;

        const normal =
            records.filter(
                r => getStatus(r) === "normal"
            ).length;

        const warning =
            records.filter(
                r => getStatus(r) === "warning"
            ).length;

        const critical =
            records.filter(
                r => getStatus(r) === "critical"
            ).length;


        const totalVariance =
            records.reduce(
                (sum, record) => {

                    const expected =
                        number(
                            record.expected_litres
                        );

                    const actual =
                        number(
                            record.actual_litres
                        );

                    const variance =
                        record.variance_litres !== undefined
                            ? number(
                                record.variance_litres
                            )
                            : actual - expected;

                    return sum + variance;

                },
                0
            );


        const totalEl =
            document.getElementById(
                "gapsTotal"
            );

        const normalEl =
            document.getElementById(
                "gapsNormal"
            );

        const warningEl =
            document.getElementById(
                "gapsWarning"
            );

        const criticalEl =
            document.getElementById(
                "gapsCritical"
            );

        const varianceEl =
            document.getElementById(
                "gapsVariance"
            );


        if (totalEl) {
            totalEl.textContent =
                formatNumber(total);
        }

        if (normalEl) {
            normalEl.textContent =
                formatNumber(normal);
        }

        if (warningEl) {
            warningEl.textContent =
                formatNumber(warning);
        }

        if (criticalEl) {
            criticalEl.textContent =
                formatNumber(critical);
        }

        if (varianceEl) {

            varianceEl.textContent =
                formatNumber(
                    totalVariance
                ) + " L";
        }
    }


    /* =====================================================
       TABLE
    ===================================================== */

    function renderTable() {

        const body =
            document.getElementById(
                "gapsTableBody"
            );

        if (!body) return;


        if (!GapsState.filteredGaps.length) {

            body.innerHTML = `
                <tr>

                    <td colspan="10">

                        <div class="fg-empty">

                            <strong>
                                No gap records found
                            </strong>

                            Try changing your filters
                            or record a new gap.

                        </div>

                    </td>

                </tr>
            `;

            return;
        }


        body.innerHTML =
            GapsState.filteredGaps
                .map(record => {

                    const expected =
                        number(
                            record.expected_litres
                        );

                    const actual =
                        number(
                            record.actual_litres
                        );

                    const variance =
                        record.variance_litres !== undefined
                            ? number(
                                record.variance_litres
                            )
                            : actual - expected;

                    const status =
                        getStatus(record);


                    const varianceClass =
                        variance > 0
                            ? "fg-number-positive"
                            : variance < 0
                                ? "fg-number-negative"
                                : "fg-number-zero";


                    const stationId =
                        record.station_id ||
                        record.stationId;

                    const pumpId =
                        record.pump_id ||
                        record.pumpId;

                    const nozzleId =
                        record.nozzle_id ||
                        record.nozzleId;

                    const shiftId =
                        record.shift_id ||
                        record.shiftId;


                    return `
                        <tr>

                            <td>
                                ${escapeHTML(
                                    stationName(
                                        stationId
                                    )
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    pumpName(
                                        pumpId
                                    )
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    nozzleName(
                                        nozzleId
                                    )
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    shiftName(
                                        shiftId
                                    )
                                )}
                            </td>

                            <td>
                                ${formatNumber(
                                    expected
                                )} L
                            </td>

                            <td>
                                ${formatNumber(
                                    actual
                                )} L
                            </td>

                            <td>

                                <span
                                    class="${varianceClass}"
                                >
                                    ${variance > 0 ? "+" : ""}
                                    ${formatNumber(
                                        variance
                                    )} L
                                </span>

                            </td>

                            <td>
                                ${statusBadge(status)}
                            </td>

                            <td>
                                ${formatDate(
                                    record.created_at ||
                                    record.createdAt ||
                                    record.recorded_at ||
                                    record.recordedAt
                                )}
                            </td>

                            <td>
                                ${escapeHTML(
                                    record.recorded_by_name ||
                                    record.recordedByName ||
                                    record.recorded_by ||
                                    "—"
                                )}
                            </td>

                        </tr>
                    `;

                })
                .join("");
    }


    /* =====================================================
       PAGE HTML
    ===================================================== */

    function renderPage() {

        const container =
            document.getElementById(
                "pageContent"
            );

        if (!container) {

            console.error(
                "FuelGap: #pageContent not found."
            );

            return;
        }


        container.innerHTML = `

            <div class="fg-gaps-page">

                <div class="fg-gaps-container">

                    <div
                        id="gapsAlert"
                        class="fg-alert"
                    ></div>


                    <!-- HEADER -->

                    <div class="fg-gaps-header">

                        <div
                            class="fg-gaps-title-wrap"
                        >

                            <h1>
                                Gaps & Variance
                            </h1>

                            <p>
                                Monitor fuel movement,
                                meter differences and
                                station variances.
                            </p>

                        </div>


                        <div class="fg-gaps-actions">

                            <button
                                class="fg-btn"
                                id="gapsRefreshBtn"
                                type="button"
                            >
                                ↻ Refresh
                            </button>

                            <button
                                class="fg-btn fg-btn-primary"
                                id="gapsRecordBtn"
                                type="button"
                            >
                                + Record Gap
                            </button>

                        </div>

                    </div>


                    <!-- STATISTICS -->

                    <div class="fg-gaps-stats">

                        <div class="fg-stat-card">

                            <div class="fg-stat-top">

                                <span class="fg-stat-label">
                                    Total Records
                                </span>

                                <span class="fg-stat-icon">
                                    #
                                </span>

                            </div>

                            <div
                                class="fg-stat-value"
                                id="gapsTotal"
                            >
                                0
                            </div>

                            <div class="fg-stat-sub">
                                Filtered records
                            </div>

                        </div>


                        <div class="fg-stat-card">

                            <div class="fg-stat-top">

                                <span class="fg-stat-label">
                                    Normal
                                </span>

                                <span class="fg-stat-icon">
                                    ✓
                                </span>

                            </div>

                            <div
                                class="fg-stat-value"
                                id="gapsNormal"
                            >
                                0
                            </div>

                            <div class="fg-stat-sub">
                                Within expected range
                            </div>

                        </div>


                        <div class="fg-stat-card">

                            <div class="fg-stat-top">

                                <span class="fg-stat-label">
                                    Warnings
                                </span>

                                <span class="fg-stat-icon">
                                    !
                                </span>

                            </div>

                            <div
                                class="fg-stat-value"
                                id="gapsWarning"
                            >
                                0
                            </div>

                            <div class="fg-stat-sub">
                                Requires attention
                            </div>

                        </div>


                        <div class="fg-stat-card">

                            <div class="fg-stat-top">

                                <span class="fg-stat-label">
                                    Critical
                                </span>

                                <span class="fg-stat-icon">
                                    !
                                </span>

                            </div>

                            <div
                                class="fg-stat-value"
                                id="gapsCritical"
                            >
                                0
                            </div>

                            <div class="fg-stat-sub">
                                Significant variance
                            </div>

                        </div>

                    </div>


                    <!-- FILTERS -->

                    <div class="fg-gaps-card">

                        <div class="fg-filter-header">

                            <h2>
                                Filters
                            </h2>

                            <span
                                style="
                                    font-size:12px;
                                    color:#888;
                                "
                            >
                                Total variance:

                                <strong
                                    id="gapsVariance"
                                >
                                    0 L
                                </strong>

                            </span>

                        </div>


                        <div class="fg-filter-body">

                            <div class="fg-filter-grid">

                                <div class="fg-field">

                                    <label>
                                        Station
                                    </label>

                                    <select
                                        id="gapsStationFilter"
                                        class="fg-select"
                                    >
                                        <option>
                                            Loading...
                                        </option>
                                    </select>

                                </div>


                                <div class="fg-field">

                                    <label>
                                        Pump
                                    </label>

                                    <select
                                        id="gapsPumpFilter"
                                        class="fg-select"
                                        disabled
                                    >
                                        <option>
                                            Select station first
                                        </option>
                                    </select>

                                </div>


                                <div class="fg-field">

                                    <label>
                                        Nozzle
                                    </label>

                                    <select
                                        id="gapsNozzleFilter"
                                        class="fg-select"
                                        disabled
                                    >
                                        <option>
                                            Select pump first
                                        </option>
                                    </select>

                                </div>


                                <div class="fg-field">

                                    <label>
                                        Shift
                                    </label>

                                    <select
                                        id="gapsShiftFilter"
                                        class="fg-select"
                                        disabled
                                    >
                                        <option>
                                            Select station first
                                        </option>
                                    </select>

                                </div>


                                <div class="fg-field">

                                    <label>
                                        Status
                                    </label>

                                    <select
                                        id="gapsStatusFilter"
                                        class="fg-select"
                                    >

                                        <option value="">
                                            All statuses
                                        </option>

                                        <option value="normal">
                                            Normal
                                        </option>

                                        <option value="warning">
                                            Warning
                                        </option>

                                        <option value="critical">
                                            Critical
                                        </option>

                                    </select>

                                </div>

                            </div>


                            <div
                                class="fg-field"
                                style="
                                    margin-top:14px;
                                    max-width:450px;
                                "
                            >

                                <label>
                                    Search
                                </label>

                                <input
                                    id="gapsSearch"
                                    class="fg-input"
                                    type="search"
                                    placeholder="Search gaps..."
                                >

                            </div>

                        </div>

                    </div>


                    <!-- GAP TABLE -->

                    <div
                        class="fg-gaps-card"
                        style="margin-top:20px;"
                    >

                        <div class="fg-filter-header">

                            <h2>
                                Gap Records
                            </h2>

                        </div>


                        <div class="fg-table-wrap">

                            <table class="fg-table">

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
                                            Expected
                                        </th>

                                        <th>
                                            Actual
                                        </th>

                                        <th>
                                            Variance
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Recorded
                                        </th>

                                        <th>
                                            Recorded By
                                        </th>

                                    </tr>

                                </thead>


                                <tbody
                                    id="gapsTableBody"
                                >

                                    <tr>

                                        <td colspan="10">

                                            <div
                                                class="fg-loading"
                                            >

                                                <div
                                                    class="fg-spinner"
                                                ></div>

                                                Loading gap records...

                                            </div>

                                        </td>

                                    </tr>

                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>


                <!-- =================================================
                     RECORD GAP MODAL
                ================================================== -->

                <div
                    class="fg-modal-overlay"
                    id="gapsModal"
                >

                    <div class="fg-modal">

                        <div class="fg-modal-header">

                            <h3>
                                Record Fuel Gap
                            </h3>

                            <button
                                class="fg-modal-close"
                                id="gapsModalClose"
                                type="button"
                            >
                                ×
                            </button>

                        </div>


                        <form
                            id="gapForm"
                        >

                            <div class="fg-modal-body">

                                <div class="fg-form-grid">


                                    <!-- STATION -->

                                    <div class="fg-field">

                                        <label>
                                            Station *
                                        </label>

                                        <select
                                            id="gapFormStation"
                                            class="fg-select"
                                            required
                                        >

                                            <option value="">
                                                Select station
                                            </option>

                                        </select>

                                    </div>


                                    <!-- PUMP -->

                                    <div class="fg-field">

                                        <label>
                                            Pump *
                                        </label>

                                        <select
                                            id="gapFormPump"
                                            class="fg-select"
                                            required
                                            disabled
                                        >

                                            <option value="">
                                                Select station first
                                            </option>

                                        </select>

                                    </div>


                                    <!-- NOZZLE -->

                                    <div class="fg-field">

                                        <label>
                                            Nozzle *
                                        </label>

                                        <select
                                            id="gapFormNozzle"
                                            class="fg-select"
                                            required
                                            disabled
                                        >

                                            <option value="">
                                                Select pump first
                                            </option>

                                        </select>

                                    </div>


                                    <!-- SHIFT -->

                                    <div class="fg-field">

                                        <label>
                                            Shift *
                                        </label>

                                        <select
                                            id="gapFormShift"
                                            class="fg-select"
                                            required
                                            disabled
                                        >

                                            <option value="">
                                                Select station first
                                            </option>

                                        </select>

                                    </div>


                                    <!-- EXPECTED -->

                                    <div class="fg-field">

                                        <label>
                                            Expected Litres *
                                        </label>

                                        <input
                                            id="gapExpected"
                                            class="fg-input"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            required
                                        >

                                        <div class="fg-help">
                                            Expected fuel volume.
                                        </div>

                                    </div>


                                    <!-- ACTUAL -->

                                    <div class="fg-field">

                                        <label>
                                            Actual Litres *
                                        </label>

                                        <input
                                            id="gapActual"
                                            class="fg-input"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            required
                                        >

                                        <div class="fg-help">
                                            Actual measured volume.
                                        </div>

                                    </div>


                                    <!-- PREVIEW -->

                                    <div class="fg-field fg-full">

                                        <div
                                            id="gapPreview"
                                            style="
                                                padding:14px;
                                                background:#fafafa;
                                                border:1px solid #eee;
                                                border-radius:9px;
                                                font-size:13px;
                                            "
                                        >
                                            Variance will be calculated
                                            automatically.
                                        </div>

                                    </div>

                                </div>

                            </div>


                            <div class="fg-modal-footer">

                                <button
                                    type="button"
                                    class="fg-btn"
                                    id="gapsCancelBtn"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    class="fg-btn fg-btn-primary"
                                    id="gapsSubmitBtn"
                                >
                                    Save Gap
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            </div>
        `;


        setupFilterEvents();
        setupModalEvents();
    }


    /* =====================================================
       MODAL
    ===================================================== */

    function openModal() {

        const modal =
            document.getElementById(
                "gapsModal"
            );

        if (!modal) return;

        resetGapForm();

        modal.classList.add("active");
    }


    function closeModal() {

        const modal =
            document.getElementById(
                "gapsModal"
            );

        if (modal) {

            modal.classList.remove(
                "active"
            );
        }
    }


    function resetGapForm() {

        const form =
            document.getElementById(
                "gapForm"
            );

        if (form) {
            form.reset();
        }


        const pump =
            document.getElementById(
                "gapFormPump"
            );

        const nozzle =
            document.getElementById(
                "gapFormNozzle"
            );

        const shift =
            document.getElementById(
                "gapFormShift"
            );


        if (pump) {

            pump.innerHTML = `
                <option value="">
                    Select station first
                </option>
            `;

            pump.disabled = true;
        }


        if (nozzle) {

            nozzle.innerHTML = `
                <option value="">
                    Select pump first
                </option>
            `;

            nozzle.disabled = true;
        }


        if (shift) {

            shift.innerHTML = `
                <option value="">
                    Select station first
                </option>
            `;

            shift.disabled = true;
        }


        updateVariancePreview();
    }


    function setupModalEvents() {

        const open =
            document.getElementById(
                "gapsRecordBtn"
            );

        const close =
            document.getElementById(
                "gapsModalClose"
            );

        const cancel =
            document.getElementById(
                "gapsCancelBtn"
            );

        const modal =
            document.getElementById(
                "gapsModal"
            );

        const form =
            document.getElementById(
                "gapForm"
            );

        const station =
            document.getElementById(
                "gapFormStation"
            );

        const pump =
            document.getElementById(
                "gapFormPump"
            );

        const nozzle =
            document.getElementById(
                "gapFormNozzle"
            );

        const expected =
            document.getElementById(
                "gapExpected"
            );

        const actual =
            document.getElementById(
                "gapActual"
            );


        if (open) {
            open.onclick = openModal;
        }


        if (close) {
            close.onclick = closeModal;
        }


        if (cancel) {
            cancel.onclick = closeModal;
        }


        if (modal) {

            modal.onclick = function (event) {

                if (event.target === modal) {
                    closeModal();
                }

            };
        }


        /* ==============================================
           MODAL STATION
        ============================================== */

        if (station) {

            station.onchange = function () {

                const stationId =
                    this.value;


                if (pump) {

                    pump.innerHTML =
                        pumpOptions(
                            stationId
                        );

                    pump.disabled =
                        !stationId;
                }


                if (nozzle) {

                    nozzle.innerHTML = `
                        <option value="">
                            Select pump first
                        </option>
                    `;

                    nozzle.disabled = true;
                }


                const shift =
                    document.getElementById(
                        "gapFormShift"
                    );


                if (shift) {

                    shift.innerHTML =
                        shiftOptions(
                            stationId
                        );

                    shift.disabled =
                        !stationId;
                }

            };
        }


        /* ==============================================
           MODAL PUMP
        ============================================== */

        if (pump) {

            pump.onchange = function () {

                const pumpId =
                    this.value;


                if (nozzle) {

                    nozzle.innerHTML =
                        nozzleOptions(
                            pumpId
                        );

                    nozzle.disabled =
                        !pumpId;
                }

            };
        }


        if (expected) {

            expected.oninput =
                updateVariancePreview;
        }


        if (actual) {

            actual.oninput =
                updateVariancePreview;
        }


        if (form) {

            form.onsubmit =
                submitGap;
        }
    }


    /* =====================================================
       VARIANCE PREVIEW
    ===================================================== */

    function updateVariancePreview() {

        const expected =
            number(
                document.getElementById(
                    "gapExpected"
                )?.value
            );


        const actual =
            number(
                document.getElementById(
                    "gapActual"
                )?.value
            );


        const variance =
            actual - expected;


        const status =
            Math.abs(variance) <= 0.01
                ? "normal"
                : Math.abs(variance) <= 5
                    ? "warning"
                    : "critical";


        const preview =
            document.getElementById(
                "gapPreview"
            );


        if (!preview) return;


        preview.innerHTML = `

            <strong>
                Variance:
            </strong>

            <span
                style="
                    margin-left:8px;
                    font-weight:800;
                "
            >
                ${variance > 0 ? "+" : ""}
                ${formatNumber(variance)}
                L
            </span>

            <span
                style="
                    margin-left:15px;
                "
            >
                ${statusBadge(status)}
            </span>

        `;
    }


    /* =====================================================
       SUBMIT GAP
    ===================================================== */

    async function submitGap(event) {

        event.preventDefault();


        if (GapsState.isSubmitting) {
            return;
        }


        const stationId =
            document.getElementById(
                "gapFormStation"
            )?.value;


        const pumpId =
            document.getElementById(
                "gapFormPump"
            )?.value;


        const nozzleId =
            document.getElementById(
                "gapFormNozzle"
            )?.value;


        const shiftId =
            document.getElementById(
                "gapFormShift"
            )?.value;


        const expected =
            number(
                document.getElementById(
                    "gapExpected"
                )?.value
            );


        const actual =
            number(
                document.getElementById(
                    "gapActual"
                )?.value
            );


        if (
            !stationId ||
            !pumpId ||
            !nozzleId ||
            !shiftId
        ) {

            showAlert(
                "Please select station, pump, nozzle and shift.",
                "error"
            );

            return;
        }


        if (
            expected < 0 ||
            actual < 0
        ) {

            showAlert(
                "Litres cannot be negative.",
                "error"
            );

            return;
        }


        const variance =
            actual - expected;


        const status =
            Math.abs(variance) <= 0.01
                ? "normal"
                : Math.abs(variance) <= 5
                    ? "warning"
                    : "critical";


        const payload = {

            station_id:
                stationId,

            pump_id:
                pumpId,

            nozzle_id:
                nozzleId,

            shift_id:
                shiftId,

            expected_litres:
                expected,

            actual_litres:
                actual,

            variance_litres:
                variance,

            status:
                status
        };


        const button =
            document.getElementById(
                "gapsSubmitBtn"
            );


        try {

            GapsState.isSubmitting =
                true;


            if (button) {

                button.disabled = true;

                button.textContent =
                    "Saving...";
            }


            if (
                !window.FuelGapAPI ||
                typeof FuelGapAPI.createGap !==
                    "function"
            ) {

                throw new Error(
                    "FuelGapAPI.createGap() is unavailable."
                );
            }


            await FuelGapAPI.createGap(
                payload
            );


            closeModal();


            showAlert(
                "Gap record saved successfully.",
                "success"
            );


            await loadAllData();


        } catch (error) {

            console.error(
                "Create gap error:",
                error
            );


            showAlert(
                error.message ||
                "Unable to save gap record.",
                "error"
            );


        } finally {

            GapsState.isSubmitting =
                false;


            if (button) {

                button.disabled = false;

                button.textContent =
                    "Save Gap";
            }

        }
    }


    /* =====================================================
       ALERT
    ===================================================== */

    function showAlert(
        message,
        type = "error"
    ) {

        const alert =
            document.getElementById(
                "gapsAlert"
            );


        if (!alert) return;


        alert.className =
            `fg-alert show fg-alert-${type}`;


        alert.textContent =
            message;


        setTimeout(() => {

            alert.classList.remove(
                "show"
            );

        }, 4000);
    }


    /* =====================================================
       REFRESH
    ===================================================== */

    async function refreshPage() {

        try {

            const button =
                document.getElementById(
                    "gapsRefreshBtn"
                );


            if (button) {

                button.disabled = true;

                button.textContent =
                    "Refreshing...";
            }


            await loadAllData();


            showAlert(
                "Gaps data refreshed successfully.",
                "success"
            );


        } catch (error) {

            console.error(
                "Gaps refresh error:",
                error
            );


            showAlert(
                error.message ||
                "Unable to refresh gaps.",
                "error"
            );


        } finally {

            const button =
                document.getElementById(
                    "gapsRefreshBtn"
                );


            if (button) {

                button.disabled = false;

                button.textContent =
                    "↻ Refresh";
            }

        }
    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    async function initGapsPage() {

        console.log(
            "OPENING GAPS PAGE..."
        );


        const page =
            document.getElementById(
                "pageContent"
            );


        if (!page) {

            console.error(
                "Gaps pageContent not found."
            );

            return false;
        }


        injectGapsStyles();


        GapsState.currentUser =
            getCurrentUser();


        console.log(
            "Gaps current user:",
            GapsState.currentUser
        );


        renderPage();


        const refresh =
            document.getElementById(
                "gapsRefreshBtn"
            );


        if (refresh) {

            refresh.onclick =
                refreshPage;
        }


        try {

            await loadAllData();


            GapsState.initialized =
                true;


            console.log(
                "GAPS PAGE READY"
            );


            return true;


        } catch (error) {

            console.error(
                "Gaps page load error:",
                error
            );


            const body =
                document.getElementById(
                    "gapsTableBody"
                );


            if (body) {

                body.innerHTML = `

                    <tr>

                        <td colspan="10">

                            <div class="fg-empty">

                                <strong>
                                    Unable to load Gaps
                                </strong>

                                ${escapeHTML(
                                    error.message ||
                                    "Backend data could not be loaded."
                                )}

                                <br><br>

                                <button
                                    class="
                                        fg-btn
                                        fg-btn-primary
                                    "
                                    onclick="
                                        window.initializeGapsPage()
                                    "
                                >
                                    Try Again
                                </button>

                            </div>

                        </td>

                    </tr>

                `;
            }


            return false;
        }
    }


    /* =====================================================
       GLOBAL EXPORTS
    ===================================================== */

    window.GapsState =
        GapsState;


    window.initializeGapsPage =
        initGapsPage;


    window.GapsPage = {

        init:
            initGapsPage,

        refresh:
            refreshPage,

        load:
            loadAllData

    };


    console.log(
        "FuelGap gaps.js loaded successfully."
    );

})();