/* =========================================================
   FUELGAP - METER READINGS
   COMPLETE UPDATED VERSION
   ---------------------------------------------------------
   FEATURES:
   - Evidence is OPTIONAL
   - Live camera evidence
   - Upload existing image evidence
   - No evidence required
   - Historical reading date/time
   - Station -> Pump -> Nozzle -> Shift
   - Opening / Periodic / Closing / Correction
   - Backend connected
   - Cookie authentication
   - White + Yellow FuelGap UI
   - CSS INCLUDED INSIDE THIS JS FILE
========================================================= */

(function () {

    "use strict";

    /* =====================================================
       GLOBAL STATE
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
        isSubmitting: false,

        selectedEvidenceType: null

    };


    /* =====================================================
       ELEMENT HELPER
    ===================================================== */

    function getElement(id) {
        return document.getElementById(id);
    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHtml(value) {

        if (value === null || value === undefined) {
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
       FORMAT DATE
    ===================================================== */

    function formatDate(value) {

        if (!value) {
            return "—";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleString([], {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    }


    /* =====================================================
       FORMAT NUMBER
    ===================================================== */

    function formatNumber(value) {

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return "0";
        }

        return number.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }


    /* =====================================================
       NORMALIZE ARRAY
    ===================================================== */

    function normalizeArray(response, possibleKeys) {

        if (Array.isArray(response)) {
            return response;
        }

        if (!response || typeof response !== "object") {
            return [];
        }

        for (const key of possibleKeys) {

            if (Array.isArray(response[key])) {
                return response[key];
            }
        }

        if (response.data && Array.isArray(response.data)) {
            return response.data;
        }

        if (
            response.data &&
            typeof response.data === "object"
        ) {

            for (const key of possibleKeys) {

                if (Array.isArray(response.data[key])) {
                    return response.data[key];
                }
            }
        }

        return [];
    }


    /* =====================================================
       NORMALIZE STATION
    ===================================================== */

    function normalizeStation(item) {

        return {
            id: item.id || item.station_id,
            name:
                item.name ||
                item.station_name ||
                item.station ||
                "Unnamed Station",

            address:
                item.address ||
                item.location ||
                "",

            city:
                item.city ||
                "",

            state:
                item.state ||
                "",

            status:
                item.status ||
                "active"
        };
    }


    /* =====================================================
       NORMALIZE PUMP
    ===================================================== */

    function normalizePump(item) {

        return {
            id: item.id || item.pump_id,

            station_id:
                item.station_id ||
                item.stationId,

            pump_number:
                item.pump_number ||
                item.number ||
                item.pump_no ||
                item.name ||
                "Pump",

            brand:
                item.brand ||
                "",

            model:
                item.model ||
                "",

            status:
                item.status ||
                "active"
        };
    }


    /* =====================================================
       NORMALIZE NOZZLE
    ===================================================== */

    function normalizeNozzle(item) {

        return {
            id: item.id || item.nozzle_id,

            pump_id:
                item.pump_id ||
                item.pumpId,

            station_id:
                item.station_id ||
                item.stationId,

            nozzle_number:
                item.nozzle_number ||
                item.number ||
                item.nozzle_no ||
                item.name ||
                "Nozzle",

            fuel_type:
                item.fuel_type ||
                item.product ||
                item.fuel ||
                item.type ||
                "OTHER",

            price_per_litre:
                item.price_per_litre ||
                item.price ||
                0,

            status:
                item.status ||
                "active"
        };
    }


    /* =====================================================
       NORMALIZE SHIFT
    ===================================================== */

    function normalizeShift(item) {

        return {

            id:
                item.id ||
                item.shift_id,

            station_id:
                item.station_id ||
                item.stationId,

            shift_name:
                item.shift_name ||
                item.name ||
                item.shift ||
                "Shift",

            shift_date:
                item.shift_date ||
                item.date ||
                "",

            start_time:
                item.start_time ||
                "",

            end_shift:
                item.end_shift ||
                item.end_time ||
                "",

            status:
                String(item.status || "open").toLowerCase(),

            created_at:
                item.created_at ||
                ""
        };
    }


    /* =====================================================
       NORMALIZE READING
    ===================================================== */

    function normalizeReading(item) {

        return {

            id:
                item.id ||
                item.reading_id,

            station_id:
                item.station_id ||
                item.stationId,

            pump_id:
                item.pump_id ||
                item.pumpId,

            nozzle_id:
                item.nozzle_id ||
                item.nozzleId,

            shift_id:
                item.shift_id ||
                item.shiftId,

            recorded_by:
                item.recorded_by ||
                item.user_id ||
                item.created_by,

            reading_type:
                item.reading_type ||
                item.type ||
                "periodic",

            reading:
                item.reading ??
                item.meter_reading ??
                item.meter_value ??
                0,

            photo_url:
                item.photo_url ||
                item.photo ||
                item.evidence_url ||
                null,

            captured_at:
                item.captured_at ||
                item.recorded_at ||
                item.reading_date ||
                item.created_at ||
                null,

            created_at:
                item.created_at ||
                null
        };
    }


    /* =====================================================
       FIND STATION
    ===================================================== */

    function getStation(stationId) {

        return MeterReadingsState.stations.find(
            station => String(station.id) === String(stationId)
        );
    }


    /* =====================================================
       FIND PUMP
    ===================================================== */

    function getPump(pumpId) {

        return MeterReadingsState.pumps.find(
            pump => String(pump.id) === String(pumpId)
        );
    }


    /* =====================================================
       FIND NOZZLE
    ===================================================== */

    function getNozzle(nozzleId) {

        return MeterReadingsState.nozzles.find(
            nozzle => String(nozzle.id) === String(nozzleId)
        );
    }


    /* =====================================================
       FIND SHIFT
    ===================================================== */

    function getShift(shiftId) {

        return MeterReadingsState.shifts.find(
            shift => String(shift.id) === String(shiftId)
        );
    }


    /* =====================================================
       INJECT CSS
    ===================================================== */

    function injectStyles() {

        if (document.getElementById("fuelgap-readings-styles")) {
            return;
        }

        const style = document.createElement("style");

        style.id = "fuelgap-readings-styles";

        style.textContent = `

        /* =================================================
           FUELGAP READINGS CSS
        ================================================= */

        :root {
            --fg-yellow: #f4c400;
            --fg-yellow-dark: #d9a900;
            --fg-yellow-light: #fff8d6;

            --fg-black: #111111;
            --fg-dark: #181818;
            --fg-gray: #6f6f6f;
            --fg-light-gray: #f5f5f5;
            --fg-border: #e8e8e8;

            --fg-white: #ffffff;

            --fg-success: #16803c;
            --fg-success-bg: #eaf8ef;

            --fg-danger: #c62828;
            --fg-danger-bg: #fff0f0;

            --fg-warning: #9a6b00;
            --fg-warning-bg: #fff8dc;

            --fg-shadow:
                0 12px 35px rgba(0, 0, 0, 0.07);

            --fg-radius: 18px;
        }


        /* =================================================
           PAGE
        ================================================= */

        .fg-readings-page {
            width: 100%;
            padding: 24px;
            box-sizing: border-box;
        }


        /* =================================================
           HEADER
        ================================================= */

        .fg-readings-header {

            display: flex;
            justify-content: space-between;
            align-items: flex-end;

            gap: 20px;

            margin-bottom: 24px;
        }


        .fg-readings-eyebrow {

            font-size: 12px;
            font-weight: 800;

            letter-spacing: 1.5px;

            color: var(--fg-yellow-dark);

            text-transform: uppercase;

            margin-bottom: 7px;
        }


        .fg-readings-title {

            margin: 0;

            color: var(--fg-black);

            font-size: 30px;

            font-weight: 900;

            letter-spacing: -0.8px;
        }


        .fg-readings-subtitle {

            margin: 7px 0 0;

            color: var(--fg-gray);

            font-size: 14px;

            line-height: 1.6;
        }


        .fg-add-reading-btn {

            border: 0;

            background: var(--fg-yellow);

            color: var(--fg-black);

            min-height: 48px;

            padding: 0 20px;

            border-radius: 12px;

            font-weight: 800;

            cursor: pointer;

            display: inline-flex;

            align-items: center;

            justify-content: center;

            gap: 9px;

            transition: 0.2s ease;

            box-shadow:
                0 8px 18px rgba(244, 196, 0, 0.22);
        }


        .fg-add-reading-btn:hover {

            transform: translateY(-2px);

            background: #ffd21a;
        }


        /* =================================================
           STATS
        ================================================= */

        .fg-reading-stats {

            display: grid;

            grid-template-columns:
                repeat(4, minmax(0, 1fr));

            gap: 16px;

            margin-bottom: 22px;
        }


        .fg-reading-stat {

            background: var(--fg-white);

            border:
                1px solid var(--fg-border);

            border-radius: var(--fg-radius);

            padding: 20px;

            box-shadow: var(--fg-shadow);

            position: relative;

            overflow: hidden;
        }


        .fg-reading-stat::before {

            content: "";

            position: absolute;

            left: 0;
            top: 0;

            width: 4px;
            height: 100%;

            background: var(--fg-yellow);
        }


        .fg-stat-icon {

            width: 40px;
            height: 40px;

            border-radius: 11px;

            background: var(--fg-yellow-light);

            display: flex;

            align-items: center;

            justify-content: center;

            font-size: 19px;

            margin-bottom: 14px;
        }


        .fg-stat-label {

            color: var(--fg-gray);

            font-size: 12px;

            font-weight: 700;

            text-transform: uppercase;

            letter-spacing: 0.6px;
        }


        .fg-stat-value {

            color: var(--fg-black);

            font-size: 27px;

            font-weight: 900;

            margin-top: 5px;
        }


        /* =================================================
           EVIDENCE INFORMATION
        ================================================= */

        .fg-evidence-info {

            display: flex;

            align-items: center;

            gap: 14px;

            padding: 16px 18px;

            margin-bottom: 20px;

            border-radius: 14px;

            background: var(--fg-yellow-light);

            border:
                1px solid rgba(244, 196, 0, 0.35);
        }


        .fg-evidence-info-icon {

            width: 42px;
            height: 42px;

            flex-shrink: 0;

            border-radius: 12px;

            background: var(--fg-yellow);

            display: flex;

            align-items: center;

            justify-content: center;

            font-size: 19px;
        }


        .fg-evidence-info strong {

            display: block;

            color: var(--fg-black);

            font-size: 14px;

            margin-bottom: 3px;
        }


        .fg-evidence-info span {

            color: #6e5a00;

            font-size: 13px;

            line-height: 1.5;
        }


        /* =================================================
           CARD
        ================================================= */

        .fg-reading-card {

            background: var(--fg-white);

            border:
                1px solid var(--fg-border);

            border-radius: var(--fg-radius);

            box-shadow: var(--fg-shadow);

            overflow: hidden;
        }


        /* =================================================
           FILTER BAR
        ================================================= */

        .fg-reading-filter {

            display: grid;

            grid-template-columns:
                minmax(190px, 1fr)
                minmax(180px, 1fr)
                minmax(200px, 1.4fr);

            gap: 12px;

            padding: 18px;

            border-bottom:
                1px solid var(--fg-border);

            background: #fff;
        }


        .fg-filter-group {

            position: relative;
        }


        .fg-filter-group input,
        .fg-filter-group select {

            width: 100%;

            height: 44px;

            box-sizing: border-box;

            border:
                1px solid #dddddd;

            border-radius: 10px;

            background: #ffffff;

            padding: 0 13px;

            color: var(--fg-black);

            font-size: 13px;

            outline: none;

            transition: 0.2s ease;
        }


        .fg-filter-group input:focus,
        .fg-filter-group select:focus {

            border-color: var(--fg-yellow);

            box-shadow:
                0 0 0 3px rgba(244, 196, 0, 0.12);
        }


        /* =================================================
           TABLE
        ================================================= */

        .fg-reading-table-wrap {

            width: 100%;

            overflow-x: auto;
        }


        .fg-reading-table {

            width: 100%;

            border-collapse: collapse;

            min-width: 850px;
        }


        .fg-reading-table th {

            text-align: left;

            padding: 15px 18px;

            font-size: 11px;

            text-transform: uppercase;

            letter-spacing: 0.6px;

            color: #777777;

            background: #fafafa;

            border-bottom:
                1px solid var(--fg-border);

            white-space: nowrap;
        }


        .fg-reading-table td {

            padding: 16px 18px;

            border-bottom:
                1px solid #eeeeee;

            color: var(--fg-black);

            font-size: 13px;

            vertical-align: middle;
        }


        .fg-reading-table tr:last-child td {

            border-bottom: 0;
        }


        .fg-reading-table tbody tr {

            transition: 0.15s ease;
        }


        .fg-reading-table tbody tr:hover {

            background: #fffdf1;
        }


        .fg-primary-text {

            font-weight: 800;

            color: var(--fg-black);
        }


        .fg-secondary-text {

            display: block;

            color: #888888;

            font-size: 11px;

            margin-top: 3px;
        }


        /* =================================================
           BADGES
        ================================================= */

        .fg-reading-badge {

            display: inline-flex;

            align-items: center;

            justify-content: center;

            min-height: 27px;

            padding: 0 9px;

            border-radius: 999px;

            font-size: 10px;

            font-weight: 900;

            text-transform: uppercase;

            letter-spacing: 0.3px;
        }


        .fg-reading-badge.opening {

            background: #fff5c7;

            color: #7a5b00;
        }


        .fg-reading-badge.periodic {

            background: #f4f4f4;

            color: #444444;
        }


        .fg-reading-badge.closing {

            background: #eeeeee;

            color: #222222;
        }


        .fg-reading-badge.correction {

            background: #fff0d0;

            color: #805b00;
        }


        .fg-evidence-status {

            display: inline-flex;

            align-items: center;

            gap: 6px;

            font-size: 11px;

            font-weight: 800;
        }


        .fg-evidence-status.has-evidence {

            color: var(--fg-success);
        }


        .fg-evidence-status.no-evidence {

            color: #888888;
        }


        .fg-evidence-dot {

            width: 7px;
            height: 7px;

            border-radius: 50%;

            background: currentColor;
        }


        /* =================================================
           EMPTY STATE
        ================================================= */

        .fg-reading-empty {

            padding: 65px 25px;

            text-align: center;
        }


        .fg-reading-empty-icon {

            width: 65px;
            height: 65px;

            margin: 0 auto 15px;

            border-radius: 18px;

            background: var(--fg-yellow-light);

            display: flex;

            align-items: center;

            justify-content: center;

            font-size: 28px;
        }


        .fg-reading-empty h3 {

            margin: 0;

            font-size: 17px;

            color: var(--fg-black);
        }


        .fg-reading-empty p {

            margin: 7px auto 0;

            max-width: 440px;

            color: #888888;

            font-size: 13px;

            line-height: 1.6;
        }


        /* =================================================
           MODAL
        ================================================= */

        .fg-reading-modal {

            position: fixed;

            inset: 0;

            z-index: 99999;

            display: none;

            align-items: center;

            justify-content: center;

            padding: 20px;

            background:
                rgba(0, 0, 0, 0.65);

            box-sizing: border-box;
        }


        .fg-reading-modal.active {

            display: flex;
        }


        .fg-reading-modal-content {

            width: min(760px, 100%);

            max-height: 92vh;

            overflow-y: auto;

            background: #ffffff;

            border-radius: 22px;

            box-shadow:
                0 30px 80px rgba(0, 0, 0, 0.28);
        }


        .fg-modal-header {

            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 15px;

            padding: 21px 23px;

            border-bottom:
                1px solid var(--fg-border);
        }


        .fg-modal-header h2 {

            margin: 0;

            font-size: 19px;

            color: var(--fg-black);

            font-weight: 900;
        }


        .fg-modal-header p {

            margin: 4px 0 0;

            color: #888888;

            font-size: 12px;
        }


        .fg-modal-close {

            width: 38px;
            height: 38px;

            border: 0;

            border-radius: 10px;

            background: #f5f5f5;

            color: #333333;

            font-size: 20px;

            cursor: pointer;
        }


        .fg-modal-close:hover {

            background: var(--fg-yellow);
        }


        .fg-modal-body {

            padding: 23px;
        }


        /* =================================================
           FORM GRID
        ================================================= */

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


        .fg-form-group.full {

            grid-column: 1 / -1;
        }


        .fg-form-label {

            font-size: 12px;

            color: #333333;

            font-weight: 800;
        }


        .fg-required {

            color: #d99f00;
        }


        .fg-form-control {

            width: 100%;

            height: 46px;

            box-sizing: border-box;

            border:
                1px solid #dddddd;

            border-radius: 11px;

            background: #ffffff;

            padding: 0 13px;

            outline: none;

            color: #111111;

            font-size: 13px;

            transition: 0.2s ease;
        }


        .fg-form-control:focus {

            border-color: var(--fg-yellow);

            box-shadow:
                0 0 0 3px rgba(244, 196, 0, 0.12);
        }


        .fg-form-control:disabled {

            background: #f6f6f6;

            color: #999999;

            cursor: not-allowed;
        }


        /* =================================================
           HISTORICAL INFO
        ================================================= */

        .fg-history-note {

            margin-top: 5px;

            padding: 11px 13px;

            background: #fafafa;

            border-radius: 10px;

            border-left:
                3px solid var(--fg-yellow);

            color: #777777;

            font-size: 11px;

            line-height: 1.55;
        }


        /* =================================================
           EVIDENCE SECTION
        ================================================= */

        .fg-evidence-section {

            margin-top: 22px;

            border:
                1px solid var(--fg-border);

            border-radius: 16px;

            overflow: hidden;

            background: #ffffff;
        }


        .fg-evidence-header {

            padding: 17px 18px;

            background: #fafafa;

            border-bottom:
                1px solid var(--fg-border);
        }


        .fg-evidence-header-row {

            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 10px;
        }


        .fg-evidence-title {

            font-size: 14px;

            font-weight: 900;

            color: var(--fg-black);
        }


        .fg-optional-badge {

            display: inline-flex;

            align-items: center;

            padding: 5px 9px;

            border-radius: 999px;

            background: #eeeeee;

            color: #666666;

            font-size: 10px;

            font-weight: 800;

            text-transform: uppercase;
        }


        .fg-evidence-description {

            margin: 6px 0 0;

            color: #888888;

            font-size: 12px;

            line-height: 1.5;
        }


        .fg-evidence-body {

            padding: 18px;
        }


        .fg-evidence-actions {

            display: flex;

            flex-wrap: wrap;

            gap: 9px;

            margin-bottom: 15px;
        }


        .fg-evidence-btn {

            min-height: 42px;

            padding: 0 14px;

            border-radius: 10px;

            border:
                1px solid #dddddd;

            background: #ffffff;

            color: #222222;

            font-size: 12px;

            font-weight: 800;

            cursor: pointer;

            display: inline-flex;

            align-items: center;

            justify-content: center;

            gap: 7px;

            transition: 0.2s ease;
        }


        .fg-evidence-btn:hover {

            border-color: var(--fg-yellow);

            background: #fffdf0;
        }


        .fg-evidence-btn.primary {

            background: var(--fg-yellow);

            border-color: var(--fg-yellow);

            color: #111111;
        }


        .fg-evidence-btn.primary:hover {

            background: #ffd21a;
        }


        .fg-evidence-btn.danger {

            color: #a62626;

            border-color: #f0d0d0;

            background: #fff7f7;
        }


        .fg-camera-box {

            display: none;

            position: relative;

            background: #111111;

            border-radius: 14px;

            overflow: hidden;

            margin-bottom: 14px;

            aspect-ratio: 16 / 9;
        }


        .fg-camera-box.active {

            display: block;
        }


        .fg-camera-video {

            width: 100%;

            height: 100%;

            display: block;

            object-fit: cover;
        }


        .fg-camera-status {

            position: absolute;

            left: 12px;

            top: 12px;

            padding: 7px 10px;

            background:
                rgba(0, 0, 0, 0.65);

            color: #ffffff;

            border-radius: 8px;

            font-size: 10px;

            font-weight: 800;
        }


        .fg-photo-preview-box {

            display: none;

            margin-bottom: 14px;

            border-radius: 14px;

            overflow: hidden;

            background: #f5f5f5;

            border:
                1px solid var(--fg-border);
        }


        .fg-photo-preview-box.active {

            display: block;
        }


        .fg-photo-preview {

            display: block;

            width: 100%;

            max-height: 310px;

            object-fit: contain;

            background: #111111;
        }


        .fg-evidence-status-box {

            display: flex;

            align-items: center;

            gap: 9px;

            padding: 11px 13px;

            border-radius: 10px;

            background: #f7f7f7;

            color: #777777;

            font-size: 11px;

            line-height: 1.45;
        }


        .fg-evidence-status-box.attached {

            background: var(--fg-success-bg);

            color: var(--fg-success);
        }


        .fg-evidence-status-box.optional {

            background: #fafafa;

            color: #777777;
        }


        .fg-evidence-status-icon {

            font-size: 15px;

            flex-shrink: 0;
        }


        /* =================================================
           MODAL FOOTER
        ================================================= */

        .fg-modal-footer {

            display: flex;

            justify-content: flex-end;

            gap: 10px;

            padding: 18px 23px;

            border-top:
                1px solid var(--fg-border);
        }


        .fg-modal-btn {

            min-height: 45px;

            padding: 0 18px;

            border-radius: 11px;

            font-size: 12px;

            font-weight: 900;

            cursor: pointer;

            border: 0;
        }


        .fg-modal-btn.cancel {

            background: #f2f2f2;

            color: #333333;
        }


        .fg-modal-btn.save {

            background: var(--fg-yellow);

            color: #111111;

            min-width: 155px;
        }


        .fg-modal-btn.save:hover {

            background: #ffd21a;
        }


        .fg-modal-btn:disabled {

            opacity: 0.55;

            cursor: not-allowed;

            transform: none;
        }


        /* =================================================
           TOAST
        ================================================= */

        .fg-reading-toast {

            position: fixed;

            right: 22px;

            bottom: 22px;

            z-index: 100000;

            min-width: 280px;

            max-width: 390px;

            padding: 14px 16px;

            border-radius: 13px;

            background: #171717;

            color: #ffffff;

            box-shadow:
                0 15px 40px rgba(0,0,0,0.2);

            display: flex;

            align-items: center;

            gap: 10px;

            font-size: 12px;

            font-weight: 700;

            opacity: 0;

            transform: translateY(15px);

            pointer-events: none;

            transition: 0.25s ease;
        }


        .fg-reading-toast.show {

            opacity: 1;

            transform: translateY(0);
        }


        .fg-reading-toast.success {

            border-left:
                4px solid var(--fg-yellow);
        }


        .fg-reading-toast.error {

            border-left:
                4px solid #e33b3b;
        }


        /* =================================================
           LOADING
        ================================================= */

        .fg-loading {

            display: flex;

            align-items: center;

            justify-content: center;

            gap: 10px;

            padding: 50px;

            color: #777777;

            font-size: 13px;
        }


        .fg-spinner {

            width: 19px;
            height: 19px;

            border:
                2px solid #eeeeee;

            border-top-color:
                var(--fg-yellow);

            border-radius: 50%;

            animation:
                fgSpin 0.7s linear infinite;
        }


        @keyframes fgSpin {

            to {
                transform: rotate(360deg);
            }
        }


        /* =================================================
           RESPONSIVE
        ================================================= */

        @media (max-width: 1000px) {

            .fg-reading-stats {

                grid-template-columns:
                    repeat(2, minmax(0, 1fr));
            }

            .fg-reading-filter {

                grid-template-columns:
                    1fr 1fr;
            }

            .fg-filter-group:last-child {

                grid-column: 1 / -1;
            }
        }


        @media (max-width: 700px) {

            .fg-readings-page {

                padding: 15px;
            }

            .fg-readings-header {

                flex-direction: column;

                align-items: stretch;
            }

            .fg-readings-title {

                font-size: 24px;
            }

            .fg-add-reading-btn {

                width: 100%;
            }

            .fg-reading-stats {

                grid-template-columns: 1fr 1fr;

                gap: 10px;
            }

            .fg-reading-stat {

                padding: 15px;
            }

            .fg-stat-value {

                font-size: 22px;
            }

            .fg-reading-filter {

                grid-template-columns: 1fr;

                padding: 13px;
            }

            .fg-filter-group:last-child {

                grid-column: auto;
            }

            .fg-form-grid {

                grid-template-columns: 1fr;
            }

            .fg-form-group.full {

                grid-column: auto;
            }

            .fg-modal-body {

                padding: 17px;
            }

            .fg-modal-header {

                padding: 17px;
            }

            .fg-modal-footer {

                padding: 15px 17px;

                flex-direction: column-reverse;
            }

            .fg-modal-btn {

                width: 100%;
            }

            .fg-evidence-actions {

                flex-direction: column;
            }

            .fg-evidence-btn {

                width: 100%;
            }

            .fg-evidence-info {

                align-items: flex-start;
            }

            .fg-reading-modal {

                padding: 8px;
            }

            .fg-reading-modal-content {

                max-height: 96vh;

                border-radius: 17px;
            }
        }


        @media (max-width: 460px) {

            .fg-reading-stats {

                grid-template-columns: 1fr;
            }

            .fg-reading-stat {

                display: flex;

                align-items: center;

                gap: 13px;
            }

            .fg-stat-icon {

                margin: 0;
            }

            .fg-stat-value {

                margin-top: 2px;
            }
        }

        `;

        document.head.appendChild(style);
    }


    /* =====================================================
       TOAST
    ===================================================== */

    function showToast(message, type) {

        let toast = getElement("fgReadingToast");

        if (!toast) {

            toast = document.createElement("div");

            toast.id = "fgReadingToast";

            toast.className =
                "fg-reading-toast";

            document.body.appendChild(toast);
        }

        toast.className =
            "fg-reading-toast " +
            (type || "success");

        toast.innerHTML = `

            <span>
                ${type === "error" ? "⚠" : "✓"}
            </span>

            <span>
                ${escapeHtml(message)}
            </span>

        `;

        requestAnimationFrame(() => {

            toast.classList.add("show");

        });

        clearTimeout(
            toast._timer
        );

        toast._timer = setTimeout(() => {

            toast.classList.remove("show");

        }, 3500);
    }


    /* =====================================================
       GET DEFAULT DATETIME LOCAL
    ===================================================== */

    function getLocalDateTimeValue() {

        const now = new Date();

        const offset =
            now.getTimezoneOffset();

        const localDate =
            new Date(
                now.getTime() -
                offset * 60000
            );

        return localDate
            .toISOString()
            .slice(0, 16);
    }


    /* =====================================================
       RENDER PAGE
    ===================================================== */

    function renderPage() {

        const container =
            getElement("pageContent");

        if (!container) {
            return;
        }

        container.innerHTML = `

            <div class="fg-readings-page">

                <!-- HEADER -->

                <div class="fg-readings-header">

                    <div>

                        <div class="fg-readings-eyebrow">
                            FORECOURT MONITORING
                        </div>

                        <h1 class="fg-readings-title">
                            Meter Readings
                        </h1>

                        <p class="fg-readings-subtitle">
                            Record pump meter readings,
                            monitor forecourt activity,
                            and keep historical records.
                        </p>

                    </div>

                    <button
                        type="button"
                        class="fg-add-reading-btn"
                        id="openMeterReadingModal"
                    >
                        <span>＋</span>
                        <span>Add Meter Reading</span>
                    </button>

                </div>


                <!-- STATS -->

                <div
                    class="fg-reading-stats"
                    id="readingStats"
                >

                    ${renderStatSkeleton(
                        "📋",
                        "Total Readings"
                    )}

                    ${renderStatSkeleton(
                        "📅",
                        "Today's Readings"
                    )}

                    ${renderStatSkeleton(
                        "◷",
                        "Opening Readings"
                    )}

                    ${renderStatSkeleton(
                        "📷",
                        "Evidence Captured"
                    )}

                </div>


                <!-- OPTIONAL EVIDENCE NOTICE -->

                <div class="fg-evidence-info">

                    <div class="fg-evidence-info-icon">
                        📷
                    </div>

                    <div>

                        <strong>
                            Evidence is optional
                        </strong>

                        <span>
                            You can submit a meter reading
                            without a photo. When evidence is
                            available, you can take a live camera
                            photo or upload an existing image.
                        </span>

                    </div>

                </div>


                <!-- MAIN CARD -->

                <div class="fg-reading-card">

                    <!-- FILTERS -->

                    <div class="fg-reading-filter">

                        <div class="fg-filter-group">

                            <select
                                id="readingStationFilter"
                            >

                                <option value="">
                                    All Stations
                                </option>

                            </select>

                        </div>


                        <div class="fg-filter-group">

                            <select
                                id="readingTypeFilter"
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

                        </div>


                        <div class="fg-filter-group">

                            <input
                                type="search"
                                id="readingSearch"
                                placeholder="Search station, pump, nozzle..."
                            >

                        </div>

                    </div>


                    <!-- TABLE -->

                    <div
                        class="fg-reading-table-wrap"
                        id="readingsTableContainer"
                    >

                        <div class="fg-loading">

                            <div class="fg-spinner"></div>

                            <span>
                                Loading meter readings...
                            </span>

                        </div>

                    </div>

                </div>

            </div>


            <!-- MODAL -->

            <div
                class="fg-reading-modal"
                id="meterReadingModal"
            >

                <div class="fg-reading-modal-content">

                    <div class="fg-modal-header">

                        <div>

                            <h2>
                                Add Meter Reading
                            </h2>

                            <p>
                                Record a pump meter reading.
                            </p>

                        </div>

                        <button
                            type="button"
                            class="fg-modal-close"
                            id="closeMeterReadingModal"
                        >
                            ×
                        </button>

                    </div>


                    <div class="fg-modal-body">

                        <form
                            id="meterReadingForm"
                            autocomplete="off"
                        >

                            <div class="fg-form-grid">


                                <!-- STATION -->

                                <div class="fg-form-group">

                                    <label
                                        class="fg-form-label"
                                        for="meterStation"
                                    >
                                        Station
                                        <span class="fg-required">
                                            *
                                        </span>
                                    </label>

                                    <select
                                        id="meterStation"
                                        class="fg-form-control"
                                        required
                                    >

                                        <option value="">
                                            Select station
                                        </option>

                                    </select>

                                </div>


                                <!-- PUMP -->

                                <div class="fg-form-group">

                                    <label
                                        class="fg-form-label"
                                        for="meterPump"
                                    >
                                        Pump
                                        <span class="fg-required">
                                            *
                                        </span>
                                    </label>

                                    <select
                                        id="meterPump"
                                        class="fg-form-control"
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

                                    <label
                                        class="fg-form-label"
                                        for="meterNozzle"
                                    >
                                        Nozzle
                                        <span class="fg-required">
                                            *
                                        </span>
                                    </label>

                                    <select
                                        id="meterNozzle"
                                        class="fg-form-control"
                                        required
                                        disabled
                                    >

                                        <option value="">
                                            Select pump first
                                        </option>

                                    </select>

                                </div>


                                <!-- SHIFT -->

                                <div class="fg-form-group">

                                    <label
                                        class="fg-form-label"
                                        for="meterShift"
                                    >
                                        Shift
                                        <span class="fg-required">
                                            *
                                        </span>
                                    </label>

                                    <select
                                        id="meterShift"
                                        class="fg-form-control"
                                        required
                                        disabled
                                    >

                                        <option value="">
                                            Select station first
                                        </option>

                                    </select>

                                </div>


                                <!-- READING TYPE -->

                                <div class="fg-form-group">

                                    <label
                                        class="fg-form-label"
                                        for="meterReadingType"
                                    >
                                        Reading Type
                                        <span class="fg-required">
                                            *
                                        </span>
                                    </label>

                                    <select
                                        id="meterReadingType"
                                        class="fg-form-control"
                                        required
                                    >

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


                                <!-- READING -->

                                <div class="fg-form-group">

                                    <label
                                        class="fg-form-label"
                                        for="meterReading"
                                    >
                                        Meter Reading
                                        <span class="fg-required">
                                            *
                                        </span>
                                    </label>

                                    <input
                                        type="number"
                                        id="meterReading"
                                        class="fg-form-control"
                                        min="0"
                                        step="0.01"
                                        placeholder="Enter meter reading"
                                        required
                                    >

                                </div>


                                <!-- DATE -->

                                <div class="fg-form-group full">

                                    <label
                                        class="fg-form-label"
                                        for="meterReadingDate"
                                    >
                                        Reading Date & Time
                                        <span class="fg-required">
                                            *
                                        </span>
                                    </label>

                                    <input
                                        type="datetime-local"
                                        id="meterReadingDate"
                                        class="fg-form-control"
                                        required
                                    >

                                    <div class="fg-history-note">

                                        <strong>
                                            Historical records:
                                        </strong>

                                        If this is an old meter
                                        reading, select the original
                                        date and time. This allows
                                        previous records to be entered
                                        for historical gap checking.

                                    </div>

                                </div>


                            </div>


                            <!-- EVIDENCE -->

                            <div class="fg-evidence-section">

                                <div class="fg-evidence-header">

                                    <div class="fg-evidence-header-row">

                                        <div class="fg-evidence-title">
                                            Meter Evidence
                                        </div>

                                        <span
                                            class="fg-optional-badge"
                                        >
                                            Optional
                                        </span>

                                    </div>

                                    <p class="fg-evidence-description">

                                        Evidence is not required.
                                        You can save this reading
                                        without a photo. If you want
                                        evidence, use the camera or
                                        upload an existing image.

                                    </p>

                                </div>


                                <div class="fg-evidence-body">


                                    <!-- CAMERA -->

                                    <div
                                        class="fg-camera-box"
                                        id="meterCameraBox"
                                    >

                                        <video
                                            id="meterCameraVideo"
                                            class="fg-camera-video"
                                            autoplay
                                            playsinline
                                            muted
                                        ></video>

                                        <div
                                            class="fg-camera-status"
                                            id="meterCameraStatus"
                                        >
                                            Camera active
                                        </div>

                                    </div>


                                    <!-- PREVIEW -->

                                    <div
                                        class="fg-photo-preview-box"
                                        id="meterPhotoPreviewBox"
                                    >

                                        <img
                                            id="meterPhotoPreview"
                                            class="fg-photo-preview"
                                            alt="Meter evidence preview"
                                        >

                                    </div>


                                    <!-- ACTIONS -->

                                    <div class="fg-evidence-actions">


                                        <button
                                            type="button"
                                            class="fg-evidence-btn primary"
                                            id="startMeterCamera"
                                        >
                                            📷
                                            Start Camera
                                        </button>


                                        <button
                                            type="button"
                                            class="fg-evidence-btn"
                                            id="captureMeterPhoto"
                                            disabled
                                        >
                                            ◎
                                            Capture
                                        </button>


                                        <button
                                            type="button"
                                            class="fg-evidence-btn"
                                            id="retakeMeterPhoto"
                                            style="display:none;"
                                        >
                                            ↻
                                            Retake
                                        </button>


                                        <button
                                            type="button"
                                            class="fg-evidence-btn"
                                            id="uploadMeterPhoto"
                                        >
                                            ⬆
                                            Upload Image
                                        </button>


                                        <button
                                            type="button"
                                            class="fg-evidence-btn danger"
                                            id="removeMeterPhoto"
                                            style="display:none;"
                                        >
                                            ×
                                            Remove Evidence
                                        </button>


                                    </div>


                                    <!-- FILE INPUT -->

                                    <input
                                        type="file"
                                        id="meterEvidenceFile"
                                        accept="image/*"
                                        style="display:none;"
                                    >


                                    <!-- STATUS -->

                                    <div
                                        class="fg-evidence-status-box optional"
                                        id="meterEvidenceStatus"
                                    >

                                        <span
                                            class="fg-evidence-status-icon"
                                        >
                                            ○
                                        </span>

                                        <span>
                                            No evidence attached.
                                            You can still save this
                                            meter reading.
                                        </span>

                                    </div>


                                </div>

                            </div>

                        </form>

                    </div>


                    <!-- FOOTER -->

                    <div class="fg-modal-footer">

                        <button
                            type="button"
                            class="fg-modal-btn cancel"
                            id="cancelMeterReading"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            class="fg-modal-btn save"
                            id="saveMeterReading"
                        >
                            Save Meter Reading
                        </button>

                    </div>

                </div>

            </div>

        `;

        populateStationFilters();

        bindPageEvents();

        loadAllData();
    }


    /* =====================================================
       STAT SKELETON
    ===================================================== */

    function renderStatSkeleton(icon, label) {

        return `

            <div class="fg-reading-stat">

                <div class="fg-stat-icon">
                    ${icon}
                </div>

                <div>

                    <div class="fg-stat-label">
                        ${label}
                    </div>

                    <div class="fg-stat-value">
                        0
                    </div>

                </div>

            </div>

        `;
    }


    /* =====================================================
       POPULATE STATION FILTERS
    ===================================================== */

    function populateStationFilters() {

        const filter =
            getElement("readingStationFilter");

        const formStation =
            getElement("meterStation");

        if (!filter) {
            return;
        }

        const options =
            MeterReadingsState.stations
                .map(station => `

                    <option value="${escapeHtml(station.id)}">
                        ${escapeHtml(station.name)}
                    </option>

                `)
                .join("");

        filter.innerHTML = `

            <option value="">
                All Stations
            </option>

            ${options}

        `;

        if (formStation) {

            formStation.innerHTML = `

                <option value="">
                    Select station
                </option>

                ${options}

            `;
        }
    }


    /* =====================================================
       BIND PAGE EVENTS
    ===================================================== */

    function bindPageEvents() {

        const openButton =
            getElement("openMeterReadingModal");

        const closeButton =
            getElement("closeMeterReadingModal");

        const cancelButton =
            getElement("cancelMeterReading");

        const form =
            getElement("meterReadingForm");

        const station =
            getElement("meterStation");

        const pump =
            getElement("meterPump");

        const readingType =
            getElement("meterReadingType");

        const startCamera =
            getElement("startMeterCamera");

        const capture =
            getElement("captureMeterPhoto");

        const retake =
            getElement("retakeMeterPhoto");

        const upload =
            getElement("uploadMeterPhoto");

        const remove =
            getElement("removeMeterPhoto");

        const file =
            getElement("meterEvidenceFile");

        const save =
            getElement("saveMeterReading");


        if (openButton) {

            openButton.addEventListener(
                "click",
                openMeterReadingModal
            );
        }


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                closeMeterReadingModal
            );
        }


        if (cancelButton) {

            cancelButton.addEventListener(
                "click",
                closeMeterReadingModal
            );
        }


        if (form) {

            form.addEventListener(
                "submit",
                function (event) {

                    event.preventDefault();

                    submitMeterReading();

                }
            );
        }


        if (station) {

            station.addEventListener(
                "change",
                handleStationChange
            );
        }


        if (pump) {

            pump.addEventListener(
                "change",
                handlePumpChange
            );
        }


        if (readingType) {

            readingType.addEventListener(
                "change",
                updateShiftOptions
            );
        }


        if (startCamera) {

            startCamera.addEventListener(
                "click",
                startCameraCapture
            );
        }


        if (capture) {

            capture.addEventListener(
                "click",
                capturePhoto
            );
        }


        if (retake) {

            retake.addEventListener(
                "click",
                retakePhoto
            );
        }


        if (upload) {

            upload.addEventListener(
                "click",
                function () {

                    if (file) {
                        file.click();
                    }

                }
            );
        }


        if (remove) {

            remove.addEventListener(
                "click",
                removeEvidence
            );
        }


        if (file) {

            file.addEventListener(
                "change",
                handleFileUpload
            );
        }


        if (save) {

            save.addEventListener(
                "click",
                function () {

                    submitMeterReading();

                }
            );
        }


        const stationFilter =
            getElement("readingStationFilter");

        const typeFilter =
            getElement("readingTypeFilter");

        const search =
            getElement("readingSearch");


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


        if (search) {

            search.addEventListener(
                "input",
                renderReadingsTable
            );
        }


        const modal =
            getElement("meterReadingModal");

        if (modal) {

            modal.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target === modal
                    ) {

                        closeMeterReadingModal();

                    }

                }
            );
        }


        document.addEventListener(
            "keydown",
            handleEscapeKey
        );
    }


    /* =====================================================
       ESCAPE KEY
    ===================================================== */

    function handleEscapeKey(event) {

        if (event.key !== "Escape") {
            return;
        }

        const modal =
            getElement("meterReadingModal");

        if (
            modal &&
            modal.classList.contains("active")
        ) {

            closeMeterReadingModal();

        }
    }


    /* =====================================================
       LOAD ALL DATA
    ===================================================== */

    async function loadAllData() {

        MeterReadingsState.isLoading = true;

        try {

            await Promise.all([
                loadStations(),
                loadPumps(),
                loadNozzles(),
                loadShifts(),
                loadReadings()
            ]);

            populateStationFilters();

            renderStats();

            renderReadingsTable();

        } catch (error) {

            console.error(
                "FUELGAP READINGS LOAD ERROR:",
                error
            );

            showToast(
                "Unable to load meter readings.",
                "error"
            );

            renderReadingsTable();

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

            const data =
                normalizeArray(
                    response,
                    [
                        "stations",
                        "data"
                    ]
                );

            MeterReadingsState.stations =
                data.map(normalizeStation);

        } catch (error) {

            console.error(
                "FUELGAP STATIONS ERROR:",
                error
            );

            MeterReadingsState.stations = [];
        }
    }


    /* =====================================================
       LOAD PUMPS
    ===================================================== */

    async function loadPumps() {

        try {

            const response =
                await FuelGapAPI.request(
                    "/pumps"
                );

            const data =
                normalizeArray(
                    response,
                    [
                        "pumps",
                        "data"
                    ]
                );

            MeterReadingsState.pumps =
                data.map(normalizePump);

        } catch (error) {

            console.error(
                "FUELGAP PUMPS ERROR:",
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
                await FuelGapAPI.request(
                    "/nozzles"
                );

            const data =
                normalizeArray(
                    response,
                    [
                        "nozzles",
                        "data"
                    ]
                );

            MeterReadingsState.nozzles =
                data.map(normalizeNozzle);

        } catch (error) {

            console.error(
                "FUELGAP NOZZLES ERROR:",
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
                await FuelGapAPI.request(
                    "/shifts"
                );

            const data =
                normalizeArray(
                    response,
                    [
                        "shifts",
                        "data"
                    ]
                );

            MeterReadingsState.shifts =
                data.map(normalizeShift);

        } catch (error) {

            console.error(
                "FUELGAP SHIFTS ERROR:",
                error
            );

            MeterReadingsState.shifts = [];
        }
    }


    /* =====================================================
       LOAD READINGS
    ===================================================== */

    async function loadReadings() {

        try {

            const response =
                await FuelGapAPI.request(
                    "/meter-readings"
                );

            const data =
                normalizeArray(
                    response,
                    [
                        "readings",
                        "meter_readings",
                        "meterReadings",
                        "data"
                    ]
                );

            MeterReadingsState.readings =
                data.map(normalizeReading);

        } catch (error) {

            console.error(
                "FUELGAP METER READINGS ERROR:",
                error
            );

            MeterReadingsState.readings = [];
        }
    }


    /* =====================================================
       HANDLE STATION CHANGE
    ===================================================== */

    function handleStationChange() {

        const stationId =
            getElement("meterStation").value;

        const pump =
            getElement("meterPump");

        const nozzle =
            getElement("meterNozzle");

        const shift =
            getElement("meterShift");


        pump.innerHTML = `
            <option value="">
                Select pump
            </option>
        `;

        nozzle.innerHTML = `
            <option value="">
                Select pump first
            </option>
        `;

        shift.innerHTML = `
            <option value="">
                Select shift
            </option>
        `;


        pump.disabled = true;
        nozzle.disabled = true;
        shift.disabled = true;


        if (!stationId) {
            return;
        }


        const pumps =
            MeterReadingsState.pumps.filter(
                item =>
                    String(item.station_id) ===
                    String(stationId)
            );


        if (pumps.length) {

            pump.innerHTML = `

                <option value="">
                    Select pump
                </option>

                ${pumps.map(item => `

                    <option value="${escapeHtml(item.id)}">

                        Pump ${escapeHtml(item.pump_number)}

                        ${
                            item.brand
                                ? ` — ${escapeHtml(item.brand)}`
                                : ""
                        }

                    </option>

                `).join("")}

            `;

            pump.disabled = false;

        }


        updateShiftOptions();
    }


    /* =====================================================
       HANDLE PUMP CHANGE
    ===================================================== */

    function handlePumpChange() {

        const pumpId =
            getElement("meterPump").value;

        const nozzle =
            getElement("meterNozzle");

        nozzle.innerHTML = `
            <option value="">
                Select nozzle
            </option>
        `;

        nozzle.disabled = true;


        if (!pumpId) {
            return;
        }


        const nozzles =
            MeterReadingsState.nozzles.filter(
                item =>
                    String(item.pump_id) ===
                    String(pumpId)
            );


        if (!nozzles.length) {

            nozzle.innerHTML = `
                <option value="">
                    No nozzles configured
                </option>
            `;

            return;
        }


        nozzle.innerHTML = `

            <option value="">
                Select nozzle
            </option>

            ${nozzles.map(item => `

                <option value="${escapeHtml(item.id)}">

                    Nozzle
                    ${escapeHtml(item.nozzle_number)}

                    —
                    ${escapeHtml(item.fuel_type)}

                </option>

            `).join("")}

        `;

        nozzle.disabled = false;
    }


    /* =====================================================
       UPDATE SHIFT OPTIONS
    ===================================================== */

    function updateShiftOptions() {

        const stationId =
            getElement("meterStation")?.value;

        const readingType =
            getElement("meterReadingType")?.value;

        const shift =
            getElement("meterShift");


        if (!shift) {
            return;
        }


        shift.innerHTML = `
            <option value="">
                Select shift
            </option>
        `;

        shift.disabled = true;


        if (!stationId) {
            return;
        }


        let shifts =
            MeterReadingsState.shifts.filter(
                item =>
                    String(item.station_id) ===
                    String(stationId)
            );


        /*
         * Correction readings can be linked to
         * closed or open shifts.
         *
         * Other readings prioritize open shifts.
         */

        if (
            readingType &&
            readingType !== "correction"
        ) {

            const openShifts =
                shifts.filter(
                    item =>
                        item.status === "open" ||
                        item.status === "active"
                );

            if (openShifts.length) {
                shifts = openShifts;
            }
        }


        if (!shifts.length) {

            shift.innerHTML = `

                <option value="">
                    No compatible shifts found
                </option>

            `;

            return;
        }


        shift.innerHTML = `

            <option value="">
                Select shift
            </option>

            ${shifts.map(item => `

                <option value="${escapeHtml(item.id)}">

                    ${escapeHtml(item.shift_name)}

                    ${
                        item.shift_date
                            ? ` — ${escapeHtml(item.shift_date)}`
                            : ""
                    }

                    ${
                        item.status
                            ? ` (${escapeHtml(item.status)})`
                            : ""
                    }

                </option>

            `).join("")}

        `;

        shift.disabled = false;
    }


    /* =====================================================
       OPEN MODAL
    ===================================================== */

    function openMeterReadingModal() {

        const modal =
            getElement("meterReadingModal");

        if (!modal) {
            return;
        }


        resetMeterReadingForm();


        modal.classList.add("active");

        document.body.style.overflow =
            "hidden";
    }


    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    function closeMeterReadingModal() {

        stopCamera();

        const modal =
            getElement("meterReadingModal");

        if (modal) {

            modal.classList.remove(
                "active"
            );
        }

        document.body.style.overflow =
            "";


        resetMeterReadingForm();
    }


    /* =====================================================
       RESET FORM
    ===================================================== */

    function resetMeterReadingForm() {

        const form =
            getElement("meterReadingForm");

        if (form) {
            form.reset();
        }


        const pump =
            getElement("meterPump");

        const nozzle =
            getElement("meterNozzle");

        const shift =
            getElement("meterShift");

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


        const date =
            getElement("meterReadingDate");

        if (date) {

            date.value =
                getLocalDateTimeValue();
        }


        MeterReadingsState.currentPhoto =
            null;

        MeterReadingsState.selectedEvidenceType =
            null;


        resetEvidenceUI();
    }


    /* =====================================================
       RESET EVIDENCE UI
    ===================================================== */

    function resetEvidenceUI() {

        stopCamera();


        const cameraBox =
            getElement("meterCameraBox");

        const previewBox =
            getElement("meterPhotoPreviewBox");

        const preview =
            getElement("meterPhotoPreview");

        const capture =
            getElement("captureMeterPhoto");

        const retake =
            getElement("retakeMeterPhoto");

        const remove =
            getElement("removeMeterPhoto");

        const status =
            getElement("meterEvidenceStatus");

        const file =
            getElement("meterEvidenceFile");


        if (cameraBox) {

            cameraBox.classList.remove(
                "active"
            );
        }


        if (previewBox) {

            previewBox.classList.remove(
                "active"
            );
        }


        if (preview) {

            preview.removeAttribute(
                "src"
            );
        }


        if (capture) {

            capture.disabled = true;
        }


        if (retake) {

            retake.style.display =
                "none";
        }


        if (remove) {

            remove.style.display =
                "none";
        }


        if (file) {

            file.value = "";
        }


        if (status) {

            status.className =
                "fg-evidence-status-box optional";

            status.innerHTML = `

                <span
                    class="fg-evidence-status-icon"
                >
                    ○
                </span>

                <span>
                    No evidence attached.
                    You can still save this
                    meter reading.
                </span>

            `;
        }
    }


    /* =====================================================
       START CAMERA
    ===================================================== */

    async function startCameraCapture() {

        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {

            showToast(
                "Camera access is not supported by this browser.",
                "error"
            );

            return;
        }


        try {

            stopCamera();


            const video =
                getElement("meterCameraVideo");

            const cameraBox =
                getElement("meterCameraBox");

            const capture =
                getElement("captureMeterPhoto");

            const status =
                getElement("meterCameraStatus");


            MeterReadingsState.cameraStream =
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


            video.srcObject =
                MeterReadingsState.cameraStream;


            cameraBox.classList.add(
                "active"
            );


            capture.disabled = false;


            if (status) {

                status.textContent =
                    "Camera active";
            }


            showToast(
                "Camera started. Position the meter and capture the reading.",
                "success"
            );

        } catch (error) {

            console.error(
                "FUELGAP CAMERA ERROR:",
                error
            );

            showToast(
                "Unable to access the camera. Check your browser permission.",
                "error"
            );
        }
    }


    /* =====================================================
       CAPTURE PHOTO
    ===================================================== */

    function capturePhoto() {

        const video =
            getElement("meterCameraVideo");

        if (
            !video ||
            !video.srcObject
        ) {

            showToast(
                "Please start the camera first.",
                "error"
            );

            return;
        }


        if (
            video.readyState <
            HTMLMediaElement.HAVE_CURRENT_DATA
        ) {

            showToast(
                "Camera is not ready yet.",
                "error"
            );

            return;
        }


        const canvas =
            document.createElement("canvas");


        const width =
            video.videoWidth ||
            1280;

        const height =
            video.videoHeight ||
            720;


        canvas.width =
            width;

        canvas.height =
            height;


        const context =
            canvas.getContext("2d");


        context.drawImage(
            video,
            0,
            0,
            width,
            height
        );


        MeterReadingsState.currentPhoto =
            canvas.toDataURL(
                "image/jpeg",
                0.82
            );


        MeterReadingsState.selectedEvidenceType =
            "camera";


        stopCamera();


        showEvidencePreview(
            MeterReadingsState.currentPhoto,
            "Live camera evidence captured."
        );


        const retake =
            getElement("retakeMeterPhoto");

        if (retake) {

            retake.style.display =
                "inline-flex";
        }


        showToast(
            "Evidence photo captured.",
            "success"
        );
    }


    /* =====================================================
       RETAKE PHOTO
    ===================================================== */

    function retakePhoto() {

        MeterReadingsState.currentPhoto =
            null;

        MeterReadingsState.selectedEvidenceType =
            null;


        const previewBox =
            getElement("meterPhotoPreviewBox");

        const remove =
            getElement("removeMeterPhoto");

        const retake =
            getElement("retakeMeterPhoto");


        if (previewBox) {

            previewBox.classList.remove(
                "active"
            );
        }


        if (remove) {

            remove.style.display =
                "none";
        }


        if (retake) {

            retake.style.display =
                "none";
        }


        startCameraCapture();
    }


    /* =====================================================
       HANDLE FILE UPLOAD
    ===================================================== */

    function handleFileUpload(event) {

        const file =
            event.target.files &&
            event.target.files[0];


        if (!file) {
            return;
        }


        if (
            !file.type ||
            !file.type.startsWith("image/")
        ) {

            showToast(
                "Please select an image file.",
                "error"
            );

            event.target.value = "";

            return;
        }


        /*
         * Keep uploads reasonably sized.
         *
         * 8MB maximum before conversion.
         */

        if (file.size > 8 * 1024 * 1024) {

            showToast(
                "Image is too large. Please choose an image below 8MB.",
                "error"
            );

            event.target.value = "";

            return;
        }


        const reader =
            new FileReader();


        reader.onload = function (loadEvent) {

            const result =
                loadEvent.target.result;


            MeterReadingsState.currentPhoto =
                result;

            MeterReadingsState.selectedEvidenceType =
                "upload";


            stopCamera();


            showEvidencePreview(
                result,
                "Uploaded evidence image ready."
            );


            showToast(
                "Evidence image uploaded.",
                "success"
            );
        };


        reader.onerror = function () {

            showToast(
                "Unable to read the selected image.",
                "error"
            );

        };


        reader.readAsDataURL(file);
    }


    /* =====================================================
       SHOW EVIDENCE PREVIEW
    ===================================================== */

    function showEvidencePreview(
        imageData,
        message
    ) {

        const previewBox =
            getElement("meterPhotoPreviewBox");

        const preview =
            getElement("meterPhotoPreview");

        const status =
            getElement("meterEvidenceStatus");

        const remove =
            getElement("removeMeterPhoto");

        const cameraBox =
            getElement("meterCameraBox");


        if (cameraBox) {

            cameraBox.classList.remove(
                "active"
            );
        }


        if (preview) {

            preview.src =
                imageData;
        }


        if (previewBox) {

            previewBox.classList.add(
                "active"
            );
        }


        if (remove) {

            remove.style.display =
                "inline-flex";
        }


        if (status) {

            status.className =
                "fg-evidence-status-box attached";

            status.innerHTML = `

                <span
                    class="fg-evidence-status-icon"
                >
                    ✓
                </span>

                <span>
                    ${escapeHtml(message)}
                </span>

            `;
        }
    }


    /* =====================================================
       REMOVE EVIDENCE
    ===================================================== */

    function removeEvidence() {

        MeterReadingsState.currentPhoto =
            null;

        MeterReadingsState.selectedEvidenceType =
            null;


        resetEvidenceUI();


        showToast(
            "Evidence removed. You can still save the reading.",
            "success"
        );
    }


    /* =====================================================
       STOP CAMERA
    ===================================================== */

    function stopCamera() {

        if (
            MeterReadingsState.cameraStream
        ) {

            MeterReadingsState
                .cameraStream
                .getTracks()
                .forEach(
                    track => track.stop()
                );

            MeterReadingsState.cameraStream =
                null;
        }


        const video =
            getElement("meterCameraVideo");

        if (video) {

            video.srcObject =
                null;
        }


        const capture =
            getElement("captureMeterPhoto");

        if (capture) {

            capture.disabled =
                true;
        }
    }


    /* =====================================================
       SUBMIT METER READING
    ===================================================== */

    async function submitMeterReading() {

        if (
            MeterReadingsState.isSubmitting
        ) {
            return;
        }


        const stationId =
            getElement("meterStation")?.value;

        const pumpId =
            getElement("meterPump")?.value;

        const nozzleId =
            getElement("meterNozzle")?.value;

        const shiftId =
            getElement("meterShift")?.value;

        const readingType =
            getElement("meterReadingType")?.value;

        const readingValue =
            getElement("meterReading")?.value;

        const readingDate =
            getElement("meterReadingDate")?.value;


        /* =================================================
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


        const numericReading =
            Number(readingValue);


        if (
            readingValue === "" ||
            !Number.isFinite(numericReading) ||
            numericReading < 0
        ) {

            showToast(
                "Please enter a valid meter reading.",
                "error"
            );

            return;
        }


        if (!readingDate) {

            showToast(
                "Please select the reading date and time.",
                "error"
            );

            return;
        }


        /* =================================================
           IMPORTANT:
           PHOTO IS OPTIONAL.
        ================================================= */

        MeterReadingsState.isSubmitting =
            true;


        const saveButton =
            getElement("saveMeterReading");


        if (saveButton) {

            saveButton.disabled =
                true;

            saveButton.textContent =
                "Saving...";
        }


        /*
         * IMPORTANT BACKEND PAYLOAD
         *
         * photo_url is explicitly sent as null when
         * there is no evidence.
         *
         * captured_at is included for historical
         * reading support.
         */

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
                MeterReadingsState.currentPhoto ||
                null,

            captured_at:
                new Date(
                    readingDate
                ).toISOString()

        };


        console.log(
            "FUELGAP METER READING PAYLOAD:",
            payload
        );


        try {

            await FuelGapAPI.request(
                "/meter-readings",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    credentials:
                        "include",

                    body:
                        JSON.stringify(payload)
                }
            );


            showToast(
                MeterReadingsState.currentPhoto
                    ? "Meter reading and evidence saved successfully."
                    : "Meter reading saved successfully without evidence.",
                "success"
            );


            closeMeterReadingModal();


            await loadReadings();


            renderStats();

            renderReadingsTable();

        } catch (error) {

            console.error(
                "FUELGAP METER READING SAVE ERROR:",
                error
            );


            let message =
                "Unable to save meter reading.";


            if (
                error &&
                error.message
            ) {

                message =
                    error.message;
            }


            showToast(
                message,
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
       RENDER STATS
    ===================================================== */

    function renderStats() {

        const container =
            getElement("readingStats");

        if (!container) {
            return;
        }


        const readings =
            MeterReadingsState.readings;


        const today =
            new Date();


        const todayString =
            today.toDateString();


        const todayCount =
            readings.filter(
                item => {

                    if (!item.captured_at) {
                        return false;
                    }

                    const date =
                        new Date(
                            item.captured_at
                        );

                    return (
                        !Number.isNaN(
                            date.getTime()
                        ) &&
                        date.toDateString() ===
                            todayString
                    );
                }
            ).length;


        const openingCount =
            readings.filter(
                item =>
                    String(
                        item.reading_type
                    ).toLowerCase() ===
                    "opening"
            ).length;


        const evidenceCount =
            readings.filter(
                item =>
                    Boolean(
                        item.photo_url
                    )
            ).length;


        container.innerHTML = `

            ${renderStat(
                "📋",
                "Total Readings",
                readings.length
            )}

            ${renderStat(
                "📅",
                "Today's Readings",
                todayCount
            )}

            ${renderStat(
                "◷",
                "Opening Readings",
                openingCount
            )}

            ${renderStat(
                "📷",
                "Evidence Captured",
                evidenceCount
            )}

        `;
    }


    /* =====================================================
       RENDER STAT
    ===================================================== */

    function renderStat(
        icon,
        label,
        value
    ) {

        return `

            <div class="fg-reading-stat">

                <div class="fg-stat-icon">
                    ${icon}
                </div>

                <div>

                    <div class="fg-stat-label">
                        ${escapeHtml(label)}
                    </div>

                    <div class="fg-stat-value">
                        ${formatNumber(value)}
                    </div>

                </div>

            </div>

        `;
    }


    /* =====================================================
       RENDER TABLE
    ===================================================== */

    function renderReadingsTable() {

        const container =
            getElement(
                "readingsTableContainer"
            );

        if (!container) {
            return;
        }


        const stationFilter =
            getElement(
                "readingStationFilter"
            )?.value || "";


        const typeFilter =
            getElement(
                "readingTypeFilter"
            )?.value || "";


        const search =
            (
                getElement(
                    "readingSearch"
                )?.value || ""
            )
            .trim()
            .toLowerCase();


        let readings =
            [...MeterReadingsState.readings];


        if (stationFilter) {

            readings =
                readings.filter(
                    item =>
                        String(
                            item.station_id
                        ) ===
                        String(stationFilter)
                );
        }


        if (typeFilter) {

            readings =
                readings.filter(
                    item =>
                        String(
                            item.reading_type
                        ).toLowerCase() ===
                        String(typeFilter).toLowerCase()
                );
        }


        if (search) {

            readings =
                readings.filter(
                    item => {

                        const station =
                            getStation(
                                item.station_id
                            );

                        const pump =
                            getPump(
                                item.pump_id
                            );

                        const nozzle =
                            getNozzle(
                                item.nozzle_id
                            );

                        const shift =
                            getShift(
                                item.shift_id
                            );


                        const text = [

                            station?.name,

                            pump?.pump_number,

                            pump?.brand,

                            nozzle?.nozzle_number,

                            nozzle?.fuel_type,

                            shift?.shift_name,

                            item.reading_type,

                            item.reading

                        ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                        return text.includes(
                            search
                        );
                    }
                );
        }


        readings.sort(
            (a, b) => {

                const aDate =
                    new Date(
                        a.captured_at ||
                        a.created_at ||
                        0
                    ).getTime();

                const bDate =
                    new Date(
                        b.captured_at ||
                        b.created_at ||
                        0
                    ).getTime();

                return bDate - aDate;
            }
        );


        if (!readings.length) {

            container.innerHTML = `

                <div class="fg-reading-empty">

                    <div class="fg-reading-empty-icon">
                        📊
                    </div>

                    <h3>
                        No meter readings found
                    </h3>

                    <p>
                        ${
                            MeterReadingsState.readings.length
                                ? "Try changing your filters or search."
                                : "Add your first meter reading to begin monitoring the forecourt."
                        }
                    </p>

                </div>

            `;

            return;
        }


        container.innerHTML = `

            <table class="fg-reading-table">

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

                <tbody>

                    ${readings.map(
                        renderReadingRow
                    ).join("")}

                </tbody>

            </table>

        `;
    }


    /* =====================================================
       RENDER READING ROW
    ===================================================== */

    function renderReadingRow(item) {

        const station =
            getStation(
                item.station_id
            );

        const pump =
            getPump(
                item.pump_id
            );

        const nozzle =
            getNozzle(
                item.nozzle_id
            );

        const shift =
            getShift(
                item.shift_id
            );


        const type =
            String(
                item.reading_type ||
                "periodic"
            ).toLowerCase();


        const evidence =
            Boolean(
                item.photo_url
            );


        return `

            <tr>

                <td>

                    <span class="fg-primary-text">

                        ${escapeHtml(
                            station?.name ||
                            "Unknown Station"
                        )}

                    </span>

                    ${
                        station?.city
                            ? `
                                <span class="fg-secondary-text">
                                    ${escapeHtml(station.city)}
                                </span>
                              `
                            : ""
                    }

                </td>


                <td>

                    <span class="fg-primary-text">

                        ${
                            pump
                                ? `Pump ${escapeHtml(pump.pump_number)}`
                                : "Unknown Pump"
                        }

                    </span>

                    ${
                        pump?.brand
                            ? `
                                <span class="fg-secondary-text">
                                    ${escapeHtml(pump.brand)}
                                </span>
                              `
                            : ""
                    }

                </td>


                <td>

                    <span class="fg-primary-text">

                        ${
                            nozzle
                                ? `Nozzle ${escapeHtml(nozzle.nozzle_number)}`
                                : "Unknown"
                        }

                    </span>

                    ${
                        nozzle?.fuel_type
                            ? `
                                <span class="fg-secondary-text">
                                    ${escapeHtml(nozzle.fuel_type)}
                                </span>
                              `
                            : ""
                    }

                </td>


                <td>

                    ${
                        shift
                            ? escapeHtml(
                                shift.shift_name
                            )
                            : "—"
                    }

                </td>


                <td>

                    <span
                        class="
                            fg-reading-badge
                            ${escapeHtml(type)}
                        "
                    >
                        ${escapeHtml(type)}
                    </span>

                </td>


                <td>

                    <span class="fg-primary-text">

                        ${formatNumber(
                            item.reading
                        )}

                    </span>

                </td>


                <td>

                    ${
                        evidence

                            ? `

                                <span
                                    class="
                                        fg-evidence-status
                                        has-evidence
                                    "
                                >

                                    <span
                                        class="fg-evidence-dot"
                                    ></span>

                                    Captured

                                </span>

                              `

                            : `

                                <span
                                    class="
                                        fg-evidence-status
                                        no-evidence
                                    "
                                >

                                    <span
                                        class="fg-evidence-dot"
                                    ></span>

                                    Not provided

                                </span>

                              `
                    }

                </td>


                <td>

                    <span class="fg-primary-text">

                        ${formatDate(
                            item.captured_at ||
                            item.created_at
                        )}

                    </span>

                </td>

            </tr>

        `;
    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    function initializeMeterReadings() {

        injectStyles();

        if (
            typeof FuelGapAPI ===
            "undefined"
        ) {

            console.error(
                "FuelGapAPI is not available."
            );

            return;
        }


        renderPage();
    }


    /* =====================================================
       WAIT FOR DOM
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeMeterReadings
        );

    } else {

        initializeMeterReadings();

    }


    /* =====================================================
       CLEANUP
    ===================================================== */

    window.addEventListener(
        "beforeunload",
        function () {

            stopCamera();

        }
    );


    console.log(
        "FuelGap readings.js loaded successfully - Optional Evidence Version."
    );


})();