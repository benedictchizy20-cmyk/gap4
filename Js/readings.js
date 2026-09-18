/* =========================================================
   FUELGAP - METER READINGS
   NEW CLASSIC FRONTEND VERSION
   ---------------------------------------------------------
   FEATURES
   - White + Yellow FuelGap UI
   - CSS embedded in JavaScript
   - Backend connected
   - Cookie authentication
   - Optional camera evidence
   - Upload existing evidence
   - Historical reading date/time
   - Opening / Periodic / Closing / Correction
   - Station -> Pump -> Nozzle
   - Search and filters
   - Reading statistics
   - Evidence roll
   - No localStorage authentication
   - Plain JavaScript
========================================================= */

(function () {

    "use strict";

    console.log("FuelGap readings.js loaded successfully - New Classic Version.");


    /* =========================================================
       STATE
    ========================================================= */

    const State = {

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

        filters: {
            station: "",
            type: "",
            search: ""
        }

    };


    /* =========================================================
       HELPERS
    ========================================================= */

    function $(id) {
        return document.getElementById(id);
    }


    function escapeHTML(value) {

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


    function showToast(message, type) {

        type = type || "info";

        let container = $("fuelgapReadingToastContainer");

        if (!container) {

            container = document.createElement("div");

            container.id = "fuelgapReadingToastContainer";

            document.body.appendChild(container);
        }


        const toast = document.createElement("div");

        toast.className = "fg-reading-toast fg-toast-" + type;

        toast.innerHTML = `
            <div class="fg-toast-icon">
                ${type === "success" ? "✓" : type === "error" ? "!" : "i"}
            </div>

            <div class="fg-toast-message">
                ${escapeHTML(message)}
            </div>
        `;

        container.appendChild(toast);


        setTimeout(function () {

            toast.classList.add("fg-toast-hide");

            setTimeout(function () {

                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }

            }, 300);

        }, 3500);
    }


    function formatNumber(value) {

        const number = Number(value);

        if (!Number.isFinite(number)) {
            return "0";
        }

        return number.toLocaleString("en-NG", {
            maximumFractionDigits: 2
        });
    }


    function formatDateTime(value) {

        if (!value) {
            return "—";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleString("en-NG", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    }


    function formatDateOnly(value) {

        if (!value) {
            return "—";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "—";
        }

        return date.toLocaleDateString("en-NG", {
            year: "numeric",
            month: "short",
            day: "2-digit"
        });
    }


    function getTodayStart() {

        const date = new Date();

        return new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );
    }


    function isHistorical(value) {

        if (!value) {
            return false;
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return false;
        }

        return date < getTodayStart();
    }


    function toDateTimeLocalValue(date) {

        const d = date instanceof Date
            ? date
            : new Date(date);

        if (Number.isNaN(d.getTime())) {
            return "";
        }


        const pad = function (number) {
            return String(number).padStart(2, "0");
        };


        return (
            d.getFullYear() +
            "-" +
            pad(d.getMonth() + 1) +
            "-" +
            pad(d.getDate()) +
            "T" +
            pad(d.getHours()) +
            ":" +
            pad(d.getMinutes())
        );
    }


    function getReadingDate(reading) {

        return (
            reading.captured_at ||
            reading.created_at ||
            null
        );
    }


    function getName(item, fallback) {

        if (!item) {
            return fallback || "Unknown";
        }

        return (
            item.name ||
            item.station_name ||
            item.pump_name ||
            item.nozzle_name ||
            item.shift_name ||
            fallback ||
            "Unknown"
        );
    }


    function getResponseData(response, keys) {

        if (!response) {
            return [];
        }

        if (Array.isArray(response)) {
            return response;
        }

        if (response.data) {

            if (Array.isArray(response.data)) {
                return response.data;
            }

            for (const key of keys || []) {

                if (Array.isArray(response.data[key])) {
                    return response.data[key];
                }
            }
        }

        for (const key of keys || []) {

            if (Array.isArray(response[key])) {
                return response[key];
            }
        }

        return [];
    }


    /* =========================================================
       NORMALIZERS
    ========================================================= */

    function normalizeStation(item) {

        return {
            id: item.id,
            name: item.name || item.station_name || "Unnamed Station",
            address: item.address || "",
            city: item.city || "",
            state: item.state || "",
            status: item.status || item.station_status || "active",
            is_active: item.is_active !== false
        };
    }


    function normalizePump(item) {

        return {
            id: item.id,
            station_id: item.station_id,
            pump_number:
                item.pump_number ||
                item.number ||
                item.pump_no ||
                "—",

            brand:
                item.brand ||
                "Unknown",

            model:
                item.model ||
                "",

            status:
                item.status ||
                "active",

            is_active:
                item.is_active !== false
        };
    }


    function normalizeNozzle(item) {

        return {
            id: item.id,
            pump_id: item.pump_id,

            nozzle_number:
                item.nozzle_number ||
                item.number ||
                item.nozzle_no ||
                "—",

            fuel_type:
                item.fuel_type ||
                item.product ||
                item.product_type ||
                item.type ||
                "OTHER",

            price_per_litre:
                item.price_per_litre ??
                item.price ??
                0,

            status:
                item.status ||
                "active",

            is_active:
                item.is_active !== false
        };
    }


    function normalizeShift(item) {

        return {
            id: item.id,

            station_id:
                item.station_id ||
                item.station?.id ||
                null,

            shift_name:
                item.shift_name ||
                item.name ||
                item.shift ||
                "Unnamed Shift",

            shift_date:
                item.shift_date ||
                item.date ||
                null,

            start_time:
                item.start_time ||
                null,

            end_shift:
                item.end_shift ||
                item.end_time ||
                null,

            status:
                String(item.status || "open").toLowerCase(),

            created_at:
                item.created_at ||
                null
        };
    }


    function normalizeReading(item) {

        return {

            id: item.id,

            station_id:
                item.station_id ||
                item.station?.id ||
                null,

            pump_id:
                item.pump_id ||
                item.pump?.id ||
                null,

            nozzle_id:
                item.nozzle_id ||
                item.nozzle?.id ||
                null,

            shift_id:
                item.shift_id ||
                item.shift?.id ||
                null,

            recorded_by:
                item.recorded_by ||
                item.user_id ||
                item.created_by ||
                null,

            reading_type:
                String(
                    item.reading_type ||
                    item.type ||
                    ""
                ).toLowerCase(),

            reading:
                Number(item.reading ?? item.meter_reading ?? 0),

            photo_url:
                item.photo_url ||
                item.photo ||
                null,

            captured_at:
                item.captured_at ||
                item.reading_date ||
                item.recorded_at ||
                null,

            created_at:
                item.created_at ||
                null
        };
    }


    /* =========================================================
       INJECT CSS
    ========================================================= */

    function injectStyles() {

        if ($("fuelgap-readings-inline-style")) {
            return;
        }


        const style = document.createElement("style");

        style.id = "fuelgap-readings-inline-style";


        style.textContent = `

        /* =====================================================
           FUELGAP METER READINGS
        ===================================================== */

        :root {

            --fg-yellow: #f5c400;
            --fg-yellow-dark: #d9aa00;

            --fg-black: #111111;
            --fg-white: #ffffff;

            --fg-bg: #f7f7f7;
            --fg-border: #e8e8e8;

            --fg-text: #1a1a1a;
            --fg-muted: #777777;

            --fg-success: #16803c;
            --fg-success-bg: #edf8f1;

            --fg-danger: #c62828;
            --fg-danger-bg: #fff1f1;

            --fg-warning: #8a6800;
            --fg-warning-bg: #fff9df;

            --fg-shadow:
                0 8px 30px rgba(0,0,0,0.06);

            --fg-radius: 16px;
        }


        .fg-reading-page {

            width: 100%;
            min-height: 100vh;

            padding: 26px;

            background: var(--fg-bg);

            color: var(--fg-text);

            box-sizing: border-box;
        }


        .fg-reading-container {

            max-width: 1500px;

            margin: 0 auto;
        }


        /* HEADER */

        .fg-reading-header {

            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 20px;

            margin-bottom: 24px;
        }


        .fg-reading-header-left {

            display: flex;

            align-items: center;

            gap: 15px;
        }


        .fg-reading-title-icon {

            width: 52px;
            height: 52px;

            display: flex;

            align-items: center;
            justify-content: center;

            background: var(--fg-yellow);

            color: var(--fg-black);

            border-radius: 14px;

            font-size: 24px;

            font-weight: 900;

            box-shadow:
                0 6px 18px rgba(245,196,0,0.25);
        }


        .fg-reading-kicker {

            font-size: 11px;

            letter-spacing: 1.5px;

            font-weight: 800;

            color: var(--fg-muted);

            margin-bottom: 4px;
        }


        .fg-reading-title {

            margin: 0;

            font-size: 28px;

            font-weight: 850;

            color: var(--fg-black);
        }


        .fg-reading-subtitle {

            margin: 5px 0 0;

            color: var(--fg-muted);

            font-size: 14px;
        }


        .fg-primary-btn {

            border: 0;

            background: var(--fg-yellow);

            color: var(--fg-black);

            padding: 13px 19px;

            border-radius: 11px;

            font-weight: 800;

            cursor: pointer;

            display: inline-flex;

            align-items: center;

            justify-content: center;

            gap: 9px;

            transition: .2s ease;

            box-shadow:
                0 5px 16px rgba(245,196,0,0.18);
        }


        .fg-primary-btn:hover {

            background: var(--fg-yellow-dark);

            transform: translateY(-1px);
        }


        .fg-primary-btn:disabled {

            opacity: .55;

            cursor: not-allowed;

            transform: none;
        }


        .fg-secondary-btn {

            border: 1px solid var(--fg-border);

            background: var(--fg-white);

            color: var(--fg-black);

            padding: 12px 16px;

            border-radius: 11px;

            font-weight: 750;

            cursor: pointer;

            display: inline-flex;

            align-items: center;

            justify-content: center;

            gap: 8px;
        }


        .fg-secondary-btn:hover {

            border-color: var(--fg-yellow);

            background: #fffdf2;
        }


        .fg-danger-btn {

            border: 1px solid #f0cccc;

            background: var(--fg-danger-bg);

            color: var(--fg-danger);

            padding: 10px 14px;

            border-radius: 10px;

            font-weight: 750;

            cursor: pointer;
        }


        /* STATS */

        .fg-reading-stats {

            display: grid;

            grid-template-columns:
                repeat(4, minmax(0, 1fr));

            gap: 16px;

            margin-bottom: 22px;
        }


        .fg-reading-stat {

            background: var(--fg-white);

            border: 1px solid var(--fg-border);

            border-radius: var(--fg-radius);

            padding: 20px;

            box-shadow: var(--fg-shadow);

            position: relative;

            overflow: hidden;
        }


        .fg-reading-stat::after {

            content: "";

            position: absolute;

            width: 70px;
            height: 70px;

            border-radius: 50%;

            background: rgba(245,196,0,.08);

            right: -20px;
            bottom: -25px;
        }


        .fg-reading-stat-top {

            display: flex;

            align-items: center;

            justify-content: space-between;
        }


        .fg-reading-stat-icon {

            width: 42px;
            height: 42px;

            border-radius: 12px;

            background: #fff8d9;

            color: var(--fg-black);

            display: flex;

            align-items: center;

            justify-content: center;

            font-size: 18px;

            font-weight: 900;
        }


        .fg-reading-stat-label {

            margin-top: 15px;

            color: var(--fg-muted);

            font-size: 12px;

            font-weight: 750;

            text-transform: uppercase;

            letter-spacing: .7px;
        }


        .fg-reading-stat-value {

            margin-top: 4px;

            font-size: 28px;

            font-weight: 900;

            color: var(--fg-black);
        }


        /* MAIN CARD */

        .fg-reading-card {

            background: var(--fg-white);

            border: 1px solid var(--fg-border);

            border-radius: var(--fg-radius);

            box-shadow: var(--fg-shadow);

            overflow: hidden;

            margin-bottom: 22px;
        }


        .fg-reading-card-header {

            padding: 18px 20px;

            border-bottom: 1px solid var(--fg-border);

            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 15px;

            flex-wrap: wrap;
        }


        .fg-reading-card-title {

            font-size: 16px;

            font-weight: 850;

            color: var(--fg-black);
        }


        .fg-reading-card-description {

            margin-top: 4px;

            color: var(--fg-muted);

            font-size: 12px;
        }


        /* FILTERS */

        .fg-reading-filters {

            display: grid;

            grid-template-columns:
                1fr 1fr 1.5fr;

            gap: 12px;

            padding: 16px 20px;

            background: #fcfcfc;

            border-bottom: 1px solid var(--fg-border);
        }


        .fg-reading-field {

            display: flex;

            flex-direction: column;

            gap: 7px;
        }


        .fg-reading-field label {

            font-size: 11px;

            color: var(--fg-muted);

            font-weight: 800;

            text-transform: uppercase;

            letter-spacing: .5px;
        }


        .fg-reading-field input,
        .fg-reading-field select {

            width: 100%;

            min-height: 44px;

            box-sizing: border-box;

            border: 1px solid #dddddd;

            background: var(--fg-white);

            color: var(--fg-black);

            border-radius: 10px;

            padding: 10px 12px;

            outline: none;

            font-size: 13px;
        }


        .fg-reading-field input:focus,
        .fg-reading-field select:focus {

            border-color: var(--fg-yellow-dark);

            box-shadow:
                0 0 0 3px rgba(245,196,0,.12);
        }


        /* TABLE */

        .fg-reading-table-wrap {

            width: 100%;

            overflow-x: auto;
        }


        .fg-reading-table {

            width: 100%;

            border-collapse: collapse;

            min-width: 950px;
        }


        .fg-reading-table th {

            background: #fafafa;

            color: var(--fg-muted);

            text-align: left;

            padding: 13px 16px;

            font-size: 10px;

            text-transform: uppercase;

            letter-spacing: .7px;

            font-weight: 850;

            border-bottom: 1px solid var(--fg-border);

            white-space: nowrap;
        }


        .fg-reading-table td {

            padding: 15px 16px;

            border-bottom: 1px solid #f0f0f0;

            font-size: 13px;

            vertical-align: middle;
        }


        .fg-reading-table tbody tr:hover {

            background: #fffdf3;
        }


        .fg-station-name {

            font-weight: 800;

            color: var(--fg-black);
        }


        .fg-secondary-text {

            color: var(--fg-muted);

            font-size: 11px;

            margin-top: 3px;
        }


        .fg-reading-number {

            font-size: 15px;

            font-weight: 900;
        }


        .fg-reading-type {

            display: inline-flex;

            align-items: center;

            gap: 5px;

            border-radius: 999px;

            padding: 6px 10px;

            font-size: 10px;

            font-weight: 850;

            text-transform: uppercase;
        }


        .fg-type-opening {

            background: #fff8d9;

            color: #725a00;
        }


        .fg-type-periodic {

            background: #f4f4f4;

            color: #444;
        }


        .fg-type-closing {

            background: #eeeeee;

            color: #222;
        }


        .fg-type-correction {

            background: #fff1d0;

            color: #765300;
        }


        .fg-evidence-status {

            display: inline-flex;

            align-items: center;

            gap: 6px;

            font-size: 11px;

            font-weight: 800;
        }


        .fg-evidence-yes {

            color: var(--fg-success);
        }


        .fg-evidence-no {

            color: var(--fg-muted);
        }


        .fg-history-badge {

            display: inline-flex;

            margin-top: 5px;

            padding: 4px 7px;

            border-radius: 5px;

            background: var(--fg-warning-bg);

            color: var(--fg-warning);

            font-size: 9px;

            font-weight: 850;

            text-transform: uppercase;
        }


        .fg-empty-state {

            text-align: center;

            padding: 55px 20px;

            color: var(--fg-muted);
        }


        .fg-empty-icon {

            width: 58px;
            height: 58px;

            margin: 0 auto 12px;

            display: flex;

            align-items: center;

            justify-content: center;

            border-radius: 16px;

            background: #fff8d9;

            color: var(--fg-black);

            font-size: 25px;

            font-weight: 900;
        }


        .fg-empty-title {

            color: var(--fg-black);

            font-weight: 850;

            margin-bottom: 5px;
        }


        /* EVIDENCE ROLL */

        .fg-evidence-grid {

            display: grid;

            grid-template-columns:
                repeat(4, minmax(0, 1fr));

            gap: 14px;

            padding: 20px;
        }


        .fg-evidence-item {

            border: 1px solid var(--fg-border);

            border-radius: 14px;

            overflow: hidden;

            background: var(--fg-white);
        }


        .fg-evidence-image {

            width: 100%;

            height: 150px;

            object-fit: cover;

            display: block;

            background: #eeeeee;
        }


        .fg-evidence-info {

            padding: 12px;
        }


        .fg-evidence-info strong {

            font-size: 12px;

            display: block;

            margin-bottom: 5px;
        }


        .fg-evidence-info span {

            font-size: 10px;

            color: var(--fg-muted);

            display: block;

            margin-top: 3px;
        }


        /* MODAL */

        .fg-reading-modal {

            position: fixed;

            inset: 0;

            background: rgba(0,0,0,.55);

            display: flex;

            align-items: center;

            justify-content: center;

            padding: 20px;

            z-index: 99999;

            opacity: 0;

            pointer-events: none;

            transition: opacity .2s ease;
        }


        .fg-reading-modal.active {

            opacity: 1;

            pointer-events: auto;
        }


        .fg-reading-modal-box {

            width: 100%;

            max-width: 720px;

            max-height: 92vh;

            overflow-y: auto;

            background: var(--fg-white);

            border-radius: 18px;

            box-shadow:
                0 30px 80px rgba(0,0,0,.25);

            transform: translateY(15px);

            transition: transform .2s ease;
        }


        .fg-reading-modal.active
        .fg-reading-modal-box {

            transform: translateY(0);
        }


        .fg-modal-header {

            padding: 19px 21px;

            border-bottom: 1px solid var(--fg-border);

            display: flex;

            align-items: center;

            justify-content: space-between;
        }


        .fg-modal-title {

            font-size: 18px;

            font-weight: 900;

            color: var(--fg-black);
        }


        .fg-modal-close {

            width: 35px;
            height: 35px;

            border: 0;

            background: #f4f4f4;

            border-radius: 9px;

            cursor: pointer;

            font-size: 18px;

            font-weight: 800;
        }


        .fg-modal-body {

            padding: 20px;
        }


        .fg-form-grid {

            display: grid;

            grid-template-columns:
                1fr 1fr;

            gap: 15px;
        }


        .fg-full-width {

            grid-column: 1 / -1;
        }


        .fg-form-help {

            color: var(--fg-muted);

            font-size: 11px;

            line-height: 1.5;
        }


        /* DATE NOTICE */

        .fg-history-notice {

            display: none;

            margin-top: 10px;

            padding: 10px 12px;

            border-radius: 9px;

            background: var(--fg-warning-bg);

            border: 1px solid #f1df9a;

            color: var(--fg-warning);

            font-size: 11px;

            font-weight: 700;
        }


        .fg-history-notice.show {

            display: block;
        }


        /* CAMERA */

        .fg-evidence-box {

            border: 1px solid var(--fg-border);

            border-radius: 14px;

            padding: 15px;

            background: #fcfcfc;
        }


        .fg-evidence-header {

            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 12px;

            margin-bottom: 12px;
        }


        .fg-evidence-title {

            font-weight: 850;

            font-size: 13px;

            color: var(--fg-black);
        }


        .fg-evidence-optional {

            background: #fff8d9;

            color: #765d00;

            padding: 5px 8px;

            border-radius: 999px;

            font-size: 9px;

            font-weight: 850;

            text-transform: uppercase;
        }


        .fg-evidence-description {

            font-size: 11px;

            color: var(--fg-muted);

            line-height: 1.5;

            margin-bottom: 13px;
        }


        .fg-camera-preview {

            width: 100%;

            max-height: 290px;

            object-fit: cover;

            border-radius: 11px;

            background: #111;

            display: none;
        }


        .fg-camera-preview.show {

            display: block;
        }


        .fg-camera-video {

            width: 100%;

            max-height: 290px;

            object-fit: cover;

            border-radius: 11px;

            background: #111;

            display: none;
        }


        .fg-camera-video.show {

            display: block;
        }


        .fg-evidence-status-box {

            display: flex;

            align-items: center;

            gap: 8px;

            margin-top: 10px;

            padding: 10px 12px;

            border-radius: 9px;

            background: #f5f5f5;

            color: var(--fg-muted);

            font-size: 11px;

            font-weight: 650;
        }


        .fg-evidence-actions {

            display: flex;

            flex-wrap: wrap;

            gap: 8px;

            margin-top: 12px;
        }


        .fg-evidence-actions button {

            border: 1px solid var(--fg-border);

            background: var(--fg-white);

            color: var(--fg-black);

            padding: 9px 12px;

            border-radius: 9px;

            cursor: pointer;

            font-size: 11px;

            font-weight: 800;
        }


        .fg-evidence-actions button:hover {

            border-color: var(--fg-yellow-dark);

            background: #fffdf2;
        }


        .fg-evidence-actions .camera-main-btn {

            background: var(--fg-yellow);

            border-color: var(--fg-yellow);

        }


        .fg-hidden-file {

            display: none !important;
        }


        /* MODAL FOOTER */

        .fg-modal-footer {

            padding: 16px 20px;

            border-top: 1px solid var(--fg-border);

            display: flex;

            justify-content: flex-end;

            gap: 9px;
        }


        /* LOADING */

        .fg-reading-loading {

            display: flex;

            align-items: center;

            justify-content: center;

            min-height: 300px;

            flex-direction: column;

            gap: 12px;

            color: var(--fg-muted);
        }


        .fg-spinner {

            width: 32px;
            height: 32px;

            border: 3px solid #eeeeee;

            border-top-color: var(--fg-yellow);

            border-radius: 50%;

            animation: fgSpin .8s linear infinite;
        }


        @keyframes fgSpin {

            to {
                transform: rotate(360deg);
            }

        }


        /* TOAST */

        #fuelgapReadingToastContainer {

            position: fixed;

            top: 20px;

            right: 20px;

            z-index: 100000;

            display: flex;

            flex-direction: column;

            gap: 10px;
        }


        .fg-reading-toast {

            min-width: 270px;

            max-width: 380px;

            background: var(--fg-white);

            border: 1px solid var(--fg-border);

            border-left: 4px solid var(--fg-yellow);

            box-shadow: 0 15px 40px rgba(0,0,0,.13);

            border-radius: 10px;

            padding: 13px 15px;

            display: flex;

            align-items: center;

            gap: 10px;

            animation: fgToastIn .25s ease;
        }


        .fg-toast-icon {

            width: 27px;
            height: 27px;

            display: flex;

            align-items: center;

            justify-content: center;

            border-radius: 50%;

            background: #fff8d9;

            font-weight: 900;
        }


        .fg-toast-message {

            font-size: 12px;

            font-weight: 700;

            line-height: 1.4;
        }


        .fg-toast-success {

            border-left-color: var(--fg-success);
        }


        .fg-toast-success .fg-toast-icon {

            background: var(--fg-success-bg);

            color: var(--fg-success);
        }


        .fg-toast-error {

            border-left-color: var(--fg-danger);
        }


        .fg-toast-error .fg-toast-icon {

            background: var(--fg-danger-bg);

            color: var(--fg-danger);
        }


        .fg-toast-hide {

            opacity: 0;

            transform: translateX(30px);

            transition: .3s ease;
        }


        @keyframes fgToastIn {

            from {
                opacity: 0;
                transform: translateX(30px);
            }

            to {
                opacity: 1;
                transform: translateX(0);
            }

        }


        /* RESPONSIVE */

        @media (max-width: 1100px) {

            .fg-reading-stats {

                grid-template-columns:
                    repeat(2, minmax(0, 1fr));
            }


            .fg-evidence-grid {

                grid-template-columns:
                    repeat(2, minmax(0, 1fr));
            }

        }


        @media (max-width: 800px) {

            .fg-reading-page {

                padding: 16px;
            }


            .fg-reading-header {

                align-items: flex-start;

                flex-direction: column;
            }


            .fg-reading-filters {

                grid-template-columns: 1fr;
            }


            .fg-form-grid {

                grid-template-columns: 1fr;
            }


            .fg-full-width {

                grid-column: auto;
            }

        }


        @media (max-width: 560px) {

            .fg-reading-stats {

                grid-template-columns: 1fr;
            }


            .fg-evidence-grid {

                grid-template-columns: 1fr;
            }


            .fg-reading-title {

                font-size: 23px;
            }


            .fg-modal-footer {

                flex-direction: column-reverse;
            }


            .fg-modal-footer button {

                width: 100%;
            }

        }

        `;


        document.head.appendChild(style);
    }


    /* =========================================================
       FIND PAGE CONTAINER
    ========================================================= */

    function getPageContainer() {

        return (
            $("pageContent") ||
            $("app") ||
            document.querySelector(".page-content") ||
            document.querySelector("main") ||
            document.body
        );
    }


    /* =========================================================
       RENDER PAGE SHELL
    ========================================================= */

    function renderPage() {

        const container = getPageContainer();

        if (!container) {
            console.error("FuelGap: Page container not found.");
            return false;
        }


        container.innerHTML = `

            <div class="fg-reading-page">

                <div class="fg-reading-container">

                    <div class="fg-reading-header">

                        <div class="fg-reading-header-left">

                            <div class="fg-reading-title-icon">
                                ⛽
                            </div>

                            <div>

                                <div class="fg-reading-kicker">
                                    FORECOURT MONITORING
                                </div>

                                <h1 class="fg-reading-title">
                                    Meter Readings
                                </h1>

                                <p class="fg-reading-subtitle">
                                    Capture and monitor pump meter readings across your fuel stations.
                                </p>

                            </div>

                        </div>


                        <button
                            type="button"
                            class="fg-primary-btn"
                            id="openMeterReadingModal"
                        >
                            <span>＋</span>
                            Add Meter Reading
                        </button>

                    </div>


                    <!-- STATS -->

                    <div class="fg-reading-stats">

                        <div class="fg-reading-stat">

                            <div class="fg-reading-stat-top">

                                <div class="fg-reading-stat-icon">
                                    #
                                </div>

                            </div>

                            <div class="fg-reading-stat-label">
                                Total Readings
                            </div>

                            <div
                                class="fg-reading-stat-value"
                                id="statTotalReadings"
                            >
                                0
                            </div>

                        </div>


                        <div class="fg-reading-stat">

                            <div class="fg-reading-stat-top">

                                <div class="fg-reading-stat-icon">
                                    ◷
                                </div>

                            </div>

                            <div class="fg-reading-stat-label">
                                Today's Readings
                            </div>

                            <div
                                class="fg-reading-stat-value"
                                id="statTodayReadings"
                            >
                                0
                            </div>

                        </div>


                        <div class="fg-reading-stat">

                            <div class="fg-reading-stat-top">

                                <div class="fg-reading-stat-icon">
                                    O
                                </div>

                            </div>

                            <div class="fg-reading-stat-label">
                                Opening Readings
                            </div>

                            <div
                                class="fg-reading-stat-value"
                                id="statOpeningReadings"
                            >
                                0
                            </div>

                        </div>


                        <div class="fg-reading-stat">

                            <div class="fg-reading-stat-top">

                                <div class="fg-reading-stat-icon">
                                    ✓
                                </div>

                            </div>

                            <div class="fg-reading-stat-label">
                                Evidence Captured
                            </div>

                            <div
                                class="fg-reading-stat-value"
                                id="statEvidenceReadings"
                            >
                                0
                            </div>

                        </div>

                    </div>


                    <!-- READINGS -->

                    <div class="fg-reading-card">

                        <div class="fg-reading-card-header">

                            <div>

                                <div class="fg-reading-card-title">
                                    Meter Reading Records
                                </div>

                                <div class="fg-reading-card-description">
                                    Review current and historical forecourt readings.
                                </div>

                            </div>

                        </div>


                        <div class="fg-reading-filters">

                            <div class="fg-reading-field">

                                <label>
                                    Station
                                </label>

                                <select id="readingFilterStation">

                                    <option value="">
                                        All Stations
                                    </option>

                                </select>

                            </div>


                            <div class="fg-reading-field">

                                <label>
                                    Reading Type
                                </label>

                                <select id="readingFilterType">

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


                            <div class="fg-reading-field">

                                <label>
                                    Search
                                </label>

                                <input
                                    type="search"
                                    id="readingSearch"
                                    placeholder="Search station, pump, nozzle or reading..."
                                >

                            </div>

                        </div>


                        <div
                            class="fg-reading-table-wrap"
                            id="readingsTableContainer"
                        >

                            <div class="fg-reading-loading">

                                <div class="fg-spinner"></div>

                                <div>
                                    Loading meter readings...
                                </div>

                            </div>

                        </div>

                    </div>


                    <!-- EVIDENCE ROLL -->

                    <div class="fg-reading-card">

                        <div class="fg-reading-card-header">

                            <div>

                                <div class="fg-reading-card-title">
                                    Evidence Roll
                                </div>

                                <div class="fg-reading-card-description">
                                    Recent readings that include captured evidence.
                                </div>

                            </div>

                        </div>


                        <div id="evidenceRollContainer">

                            <div class="fg-empty-state">

                                <div class="fg-empty-icon">
                                    ◉
                                </div>

                                <div class="fg-empty-title">
                                    No evidence available
                                </div>

                                <div>
                                    Camera evidence is optional for meter readings.
                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>


            <!-- MODAL -->

            <div
                class="fg-reading-modal"
                id="meterReadingModal"
            >

                <div class="fg-reading-modal-box">

                    <div class="fg-modal-header">

                        <div class="fg-modal-title">
                            Add Meter Reading
                        </div>

                        <button
                            type="button"
                            class="fg-modal-close"
                            id="closeMeterReadingModal"
                        >
                            ×
                        </button>

                    </div>


                    <form id="meterReadingForm">

                        <div class="fg-modal-body">

                            <div class="fg-form-grid">

                                <!-- STATION -->

                                <div class="fg-reading-field">

                                    <label for="meterStation">
                                        Station *
                                    </label>

                                    <select
                                        id="meterStation"
                                        required
                                    >

                                        <option value="">
                                            Select station
                                        </option>

                                    </select>

                                </div>


                                <!-- PUMP -->

                                <div class="fg-reading-field">

                                    <label for="meterPump">
                                        Pump *
                                    </label>

                                    <select
                                        id="meterPump"
                                        required
                                        disabled
                                    >

                                        <option value="">
                                            Select station first
                                        </option>

                                    </select>

                                </div>


                                <!-- NOZZLE -->

                                <div class="fg-reading-field">

                                    <label for="meterNozzle">
                                        Nozzle *
                                    </label>

                                    <select
                                        id="meterNozzle"
                                        required
                                        disabled
                                    >

                                        <option value="">
                                            Select pump first
                                        </option>

                                    </select>

                                </div>


                                <!-- TYPE -->

                                <div class="fg-reading-field">

                                    <label for="meterReadingType">
                                        Reading Type *
                                    </label>

                                    <select
                                        id="meterReadingType"
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


                                <!-- DATE -->

                                <div class="fg-reading-field full-width">

                                    <label for="meterReadingDate">
                                        Reading Date & Time *
                                    </label>

                                    <input
                                        type="datetime-local"
                                        id="meterReadingDate"
                                        required
                                    >

                                    <div
                                        class="fg-history-notice"
                                        id="historyNotice"
                                    >
                                        Historical reading selected. This reading will be saved using the selected date and time.
                                    </div>

                                </div>


                                <!-- SHIFT -->

                                <div class="fg-reading-field full-width">

                                    <label for="meterShift">
                                        Shift
                                    </label>

                                    <select id="meterShift">

                                        <option value="">
                                            Select shift
                                        </option>

                                    </select>

                                    <div class="fg-form-help">
                                        Current normal readings normally use an open shift. Historical readings can use the applicable closed shift when supported by the backend.
                                    </div>

                                </div>


                                <!-- READING -->

                                <div class="fg-reading-field full-width">

                                    <label for="meterReading">
                                        Meter Reading *
                                    </label>

                                    <input
                                        type="number"
                                        id="meterReading"
                                        min="0"
                                        step="0.01"
                                        placeholder="Enter meter reading"
                                        required
                                    >

                                    <div class="fg-form-help">
                                        Enter the exact cumulative meter value shown on the pump.
                                    </div>

                                </div>


                                <!-- EVIDENCE -->

                                <div class="fg-evidence-box fg-full-width">

                                    <div class="fg-evidence-header">

                                        <div class="fg-evidence-title">
                                            Evidence
                                        </div>

                                        <div class="fg-evidence-optional">
                                            Optional
                                        </div>

                                    </div>


                                    <div class="fg-evidence-description">
                                        You can submit this reading without evidence. If evidence is available, take a live photo or upload an existing image.
                                    </div>


                                    <video
                                        id="meterCameraVideo"
                                        class="fg-camera-video"
                                        autoplay
                                        playsinline
                                    ></video>


                                    <img
                                        id="meterPhotoPreview"
                                        class="fg-camera-preview"
                                        alt="Meter reading evidence preview"
                                    >


                                    <div
                                        class="fg-evidence-status-box"
                                        id="meterEvidenceStatus"
                                    >
                                        <span>○</span>
                                        <span>
                                            No evidence attached — you can still save this reading.
                                        </span>
                                    </div>


                                    <div class="fg-evidence-actions">

                                        <button
                                            type="button"
                                            class="camera-main-btn"
                                            id="startMeterCamera"
                                        >
                                            ◉ Start Camera
                                        </button>


                                        <button
                                            type="button"
                                            id="captureMeterPhoto"
                                            disabled
                                        >
                                            ◎ Capture
                                        </button>


                                        <button
                                            type="button"
                                            id="retakeMeterPhoto"
                                        >
                                            ↻ Retake
                                        </button>


                                        <button
                                            type="button"
                                            id="uploadMeterPhoto"
                                        >
                                            ↑ Upload Image
                                        </button>


                                        <button
                                            type="button"
                                            id="removeMeterPhoto"
                                        >
                                            × Remove Evidence
                                        </button>

                                    </div>


                                    <input
                                        type="file"
                                        id="meterEvidenceFile"
                                        class="fg-hidden-file"
                                        accept="image/*"
                                    >

                                </div>

                            </div>

                        </div>


                        <div class="fg-modal-footer">

                            <button
                                type="button"
                                class="fg-secondary-btn"
                                id="cancelMeterReading"
                            >
                                Cancel
                            </button>


                            <button
                                type="submit"
                                class="fg-primary-btn"
                                id="saveMeterReading"
                            >
                                ✓ Save Reading
                            </button>

                        </div>

                    </form>

                </div>

            </div>

        `;


        return true;
    }


    /* =========================================================
       LOAD STATIONS
    ========================================================= */

    async function loadStations() {

        try {

            if (
                !window.FuelGapAPI ||
                typeof FuelGapAPI.getStations !== "function"
            ) {
                throw new Error("FuelGapAPI.getStations is not available.");
            }


            const response = await FuelGapAPI.getStations();


            const data = getResponseData(
                response,
                ["stations", "data"]
            );


            State.stations = data
                .map(normalizeStation)
                .filter(function (station) {

                    return station.id;
                });


            populateStationLists();


        } catch (error) {

            console.error(
                "FuelGap meter readings - station load error:",
                error
            );

            showToast(
                "Unable to load stations.",
                "error"
            );
        }
    }


    /* =========================================================
       LOAD PUMPS
    ========================================================= */

    async function loadPumps() {

        try {

            const response =
                await FuelGapAPI.request("/pumps");


            const data = getResponseData(
                response,
                ["pumps", "data"]
            );


            State.pumps = data
                .map(normalizePump)
                .filter(function (pump) {

                    return pump.id;
                });


        } catch (error) {

            console.error(
                "FuelGap meter readings - pump load error:",
                error
            );

            State.pumps = [];

            showToast(
                "Unable to load pumps.",
                "error"
            );
        }
    }


    /* =========================================================
       LOAD NOZZLES
    ========================================================= */

    async function loadNozzles() {

        try {

            const response =
                await FuelGapAPI.request("/nozzles");


            const data = getResponseData(
                response,
                ["nozzles", "data"]
            );


            State.nozzles = data
                .map(normalizeNozzle)
                .filter(function (nozzle) {

                    return nozzle.id;
                });


        } catch (error) {

            console.error(
                "FuelGap meter readings - nozzle load error:",
                error
            );

            State.nozzles = [];

            showToast(
                "Unable to load nozzles.",
                "error"
            );
        }
    }


    /* =========================================================
       LOAD SHIFTS
    ========================================================= */

    async function loadShifts() {

        try {

            const response =
                await FuelGapAPI.request("/shifts");


            const data = getResponseData(
                response,
                ["shifts", "data"]
            );


            State.shifts = data
                .map(normalizeShift)
                .filter(function (shift) {

                    return shift.id;
                });


        } catch (error) {

            console.error(
                "FuelGap meter readings - shift load error:",
                error
            );

            State.shifts = [];

            showToast(
                "Unable to load shifts.",
                "error"
            );
        }
    }


    /* =========================================================
       LOAD READINGS
    ========================================================= */

    async function loadReadings() {

        const table =
            $("readingsTableContainer");


        if (table) {

            table.innerHTML = `

                <div class="fg-reading-loading">

                    <div class="fg-spinner"></div>

                    <div>
                        Loading meter readings...
                    </div>

                </div>

            `;
        }


        try {

            const response =
                await FuelGapAPI.request("/meter-readings");


            const data = getResponseData(
                response,
                ["readings", "meter_readings", "data"]
            );


            State.readings = data
                .map(normalizeReading)
                .filter(function (reading) {

                    return reading.id;
                });


            updateStats();

            renderReadings();

            renderEvidenceRoll();


        } catch (error) {

            console.error(
                "FuelGap meter readings - reading load error:",
                error
            );


            State.readings = [];

            updateStats();

            if (table) {

                table.innerHTML = `

                    <div class="fg-empty-state">

                        <div class="fg-empty-icon">
                            !
                        </div>

                        <div class="fg-empty-title">
                            Unable to load readings
                        </div>

                        <div>
                            Check your backend connection and try again.
                        </div>

                    </div>

                `;
            }


            showToast(
                "Unable to load meter readings.",
                "error"
            );
        }
    }


    /* =========================================================
       POPULATE STATION FILTERS
    ========================================================= */

    function populateStationLists() {

        const stationFilter =
            $("readingFilterStation");

        const stationSelect =
            $("meterStation");


        if (stationFilter) {

            stationFilter.innerHTML = `

                <option value="">
                    All Stations
                </option>

            `;


            State.stations.forEach(function (station) {

                stationFilter.insertAdjacentHTML(
                    "beforeend",
                    `
                    <option value="${escapeHTML(station.id)}">
                        ${escapeHTML(station.name)}
                    </option>
                    `
                );

            });
        }


        if (stationSelect) {

            stationSelect.innerHTML = `

                <option value="">
                    Select station
                </option>

            `;


            State.stations.forEach(function (station) {

                stationSelect.insertAdjacentHTML(
                    "beforeend",
                    `
                    <option value="${escapeHTML(station.id)}">
                        ${escapeHTML(station.name)}
                    </option>
                    `
                );

            });
        }
    }


    /* =========================================================
       POPULATE PUMPS
    ========================================================= */

    function populatePumps(stationId) {

        const select =
            $("meterPump");


        if (!select) {
            return;
        }


        select.innerHTML = `

            <option value="">
                Select pump
            </option>

        `;


        select.disabled = true;


        if (!stationId) {

            select.innerHTML = `

                <option value="">
                    Select station first
                </option>

            `;

            return;
        }


        const pumps =
            State.pumps.filter(function (pump) {

                return (
                    String(pump.station_id) ===
                    String(stationId)
                );

            });


        if (!pumps.length) {

            select.innerHTML = `

                <option value="">
                    No pumps found
                </option>

            `;

            return;
        }


        pumps.forEach(function (pump) {

            select.insertAdjacentHTML(
                "beforeend",
                `
                <option value="${escapeHTML(pump.id)}">

                    Pump #${escapeHTML(pump.pump_number)}

                    ${pump.brand
                        ? " — " + escapeHTML(pump.brand)
                        : ""
                    }

                    ${pump.model
                        ? " " + escapeHTML(pump.model)
                        : ""
                    }

                </option>
                `
            );

        });


        select.disabled = false;
    }


    /* =========================================================
       POPULATE NOZZLES
    ========================================================= */

    function populateNozzles(pumpId) {

        const select =
            $("meterNozzle");


        if (!select) {
            return;
        }


        select.innerHTML = `

            <option value="">
                Select nozzle
            </option>

        `;


        select.disabled = true;


        if (!pumpId) {

            select.innerHTML = `

                <option value="">
                    Select pump first
                </option>

            `;

            return;
        }


        const nozzles =
            State.nozzles.filter(function (nozzle) {

                return (
                    String(nozzle.pump_id) ===
                    String(pumpId)
                );

            });


        if (!nozzles.length) {

            select.innerHTML = `

                <option value="">
                    No nozzles found
                </option>

            `;

            return;
        }


        nozzles.forEach(function (nozzle) {

            select.insertAdjacentHTML(
                "beforeend",
                `
                <option value="${escapeHTML(nozzle.id)}">

                    Nozzle #${escapeHTML(nozzle.nozzle_number)}

                    — ${escapeHTML(nozzle.fuel_type)}

                    ${
                        Number(nozzle.price_per_litre) > 0
                            ? " — $" + formatNumber(nozzle.price_per_litre)
                            : ""
                    }

                </option>
                `
            );

        });


        select.disabled = false;
    }


    /* =========================================================
       POPULATE SHIFTS
    ========================================================= */

    function populateShifts() {

        const select =
            $("meterShift");

        if (!select) {
            return;
        }


        const stationId =
            $("meterStation")
                ? $("meterStation").value
                : "";


        const type =
            $("meterReadingType")
                ? $("meterReadingType").value
                : "";


        const dateInput =
            $("meterReadingDate")
                ? $("meterReadingDate").value
                : "";


        const historical =
            isHistorical(
                dateInput
                    ? new Date(dateInput)
                    : new Date()
            );


        select.innerHTML = `

            <option value="">
                Select shift
            </option>

        `;


        let shifts =
            State.shifts.slice();


        if (stationId) {

            shifts =
                shifts.filter(function (shift) {

                    return (
                        String(shift.station_id) ===
                        String(stationId)
                    );

                });
        }


        /*
           Match shift date when possible.
        */

        if (dateInput) {

            const selectedDate =
                new Date(dateInput);


            if (!Number.isNaN(selectedDate.getTime())) {

                const selectedDay =
                    selectedDate
                        .toISOString()
                        .slice(0, 10);


                const datedShifts =
                    shifts.filter(function (shift) {

                        if (!shift.shift_date) {
                            return false;
                        }

                        return String(
                            shift.shift_date
                        ).slice(0, 10) === selectedDay;

                    });


                if (datedShifts.length) {

                    shifts = datedShifts;
                }
            }
        }


        /*
           Current normal readings:
           Prefer open shifts.

           Historical:
           Closed shifts are allowed.

           Correction:
           Open and closed shifts are allowed.
        */

        if (!historical && type !== "correction") {

            const openShifts =
                shifts.filter(function (shift) {

                    return shift.status === "open";

                });


            if (openShifts.length) {

                shifts = openShifts;
            }
        }


        if (!shifts.length) {

            select.innerHTML = `

                <option value="">
                    No matching shifts found
                </option>

            `;

            return;
        }


        shifts.sort(function (a, b) {

            const aOpen =
                a.status === "open" ? 0 : 1;

            const bOpen =
                b.status === "open" ? 0 : 1;

            return aOpen - bOpen;
        });


        shifts.forEach(function (shift) {

            const status =
                shift.status === "open"
                    ? "OPEN"
                    : "CLOSED";


            const dateText =
                shift.shift_date
                    ? " — " + formatDateOnly(shift.shift_date)
                    : "";


            select.insertAdjacentHTML(
                "beforeend",
                `
                <option value="${escapeHTML(shift.id)}">

                    ${escapeHTML(shift.shift_name)}

                    — ${status}

                    ${dateText}

                </option>
                `
            );

        });
    }


    /* =========================================================
       UPDATE HISTORY NOTICE
    ========================================================= */

    function updateHistoryNotice() {

        const input =
            $("meterReadingDate");

        const notice =
            $("historyNotice");


        if (!input || !notice) {
            return;
        }


        if (!input.value) {

            notice.classList.remove("show");

            return;
        }


        if (isHistorical(new Date(input.value))) {

            notice.classList.add("show");

        } else {

            notice.classList.remove("show");
        }


        populateShifts();
    }


    /* =========================================================
       FILTER READINGS
    ========================================================= */

    function getFilteredReadings() {

        const station =
            State.filters.station;


        const type =
            State.filters.type;


        const search =
            State.filters.search
                .trim()
                .toLowerCase();


        return State.readings.filter(function (reading) {

            if (
                station &&
                String(reading.station_id) !==
                String(station)
            ) {

                return false;
            }


            if (
                type &&
                reading.reading_type !== type
            ) {

                return false;
            }


            if (search) {

                const stationObj =
                    State.stations.find(function (item) {

                        return String(item.id) ===
                            String(reading.station_id);

                    });


                const pumpObj =
                    State.pumps.find(function (item) {

                        return String(item.id) ===
                            String(reading.pump_id);

                    });


                const nozzleObj =
                    State.nozzles.find(function (item) {

                        return String(item.id) ===
                            String(reading.nozzle_id);

                    });


                const shiftObj =
                    State.shifts.find(function (item) {

                        return String(item.id) ===
                            String(reading.shift_id);

                    });


                const haystack = [

                    stationObj?.name || "",

                    pumpObj?.pump_number || "",

                    pumpObj?.brand || "",

                    pumpObj?.model || "",

                    nozzleObj?.nozzle_number || "",

                    nozzleObj?.fuel_type || "",

                    shiftObj?.shift_name || "",

                    reading.reading_type || "",

                    reading.reading || "",

                    formatDateTime(
                        getReadingDate(reading)
                    )

                ]
                    .join(" ")
                    .toLowerCase();


                if (!haystack.includes(search)) {

                    return false;
                }
            }


            return true;

        });
    }


    /* =========================================================
       RENDER READINGS TABLE
    ========================================================= */

    function renderReadings() {

        const container =
            $("readingsTableContainer");


        if (!container) {
            return;
        }


        const readings =
            getFilteredReadings();


        if (!readings.length) {

            container.innerHTML = `

                <div class="fg-empty-state">

                    <div class="fg-empty-icon">
                        ◫
                    </div>

                    <div class="fg-empty-title">
                        No meter readings found
                    </div>

                    <div>
                        Add a reading or change your filters.
                    </div>

                </div>

            `;

            return;
        }


        const rows =
            readings
                .slice()
                .sort(function (a, b) {

                    const dateA =
                        new Date(
                            getReadingDate(a) || 0
                        ).getTime();

                    const dateB =
                        new Date(
                            getReadingDate(b) || 0
                        ).getTime();

                    return dateB - dateA;

                })
                .map(function (reading) {

                    return renderReadingRow(reading);

                })
                .join("");


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

                    ${rows}

                </tbody>

            </table>

        `;
    }


    /* =========================================================
       RENDER READING ROW
    ========================================================= */

    function renderReadingRow(reading) {

        const station =
            State.stations.find(function (item) {

                return String(item.id) ===
                    String(reading.station_id);

            });


        const pump =
            State.pumps.find(function (item) {

                return String(item.id) ===
                    String(reading.pump_id);

            });


        const nozzle =
            State.nozzles.find(function (item) {

                return String(item.id) ===
                    String(reading.nozzle_id);

            });


        const shift =
            State.shifts.find(function (item) {

                return String(item.id) ===
                    String(reading.shift_id);

            });


        const date =
            getReadingDate(reading);


        const historical =
            isHistorical(date);


        const type =
            reading.reading_type ||
            "unknown";


        const typeClass =
            "fg-type-" + type;


        const evidence =
            Boolean(reading.photo_url);


        return `

            <tr>

                <td>

                    <div class="fg-station-name">

                        ${escapeHTML(
                            station?.name ||
                            "Unknown Station"
                        )}

                    </div>

                    ${
                        station?.city
                            ? `
                                <div class="fg-secondary-text">
                                    ${escapeHTML(station.city)}
                                </div>
                            `
                            : ""
                    }

                </td>


                <td>

                    <strong>
                        Pump #${escapeHTML(
                            pump?.pump_number || "—"
                        )}
                    </strong>

                    ${
                        pump?.brand
                            ? `
                                <div class="fg-secondary-text">
                                    ${escapeHTML(pump.brand)}
                                </div>
                            `
                            : ""
                    }

                </td>


                <td>

                    <strong>
                        Nozzle #${escapeHTML(
                            nozzle?.nozzle_number || "—"
                        )}
                    </strong>

                    ${
                        nozzle?.fuel_type
                            ? `
                                <div class="fg-secondary-text">
                                    ${escapeHTML(
                                        nozzle.fuel_type
                                    )}
                                </div>
                            `
                            : ""
                    }

                </td>


                <td>

                    ${
                        shift
                            ? `
                                <strong>
                                    ${escapeHTML(
                                        shift.shift_name
                                    )}
                                </strong>

                                <div class="fg-secondary-text">
                                    ${escapeHTML(
                                        String(
                                            shift.status
                                        ).toUpperCase()
                                    )}
                                </div>
                            `
                            : `
                                <span class="fg-secondary-text">
                                    No shift
                                </span>
                            `
                    }

                </td>


                <td>

                    <span
                        class="fg-reading-type ${typeClass}"
                    >

                        ${escapeHTML(type)}

                    </span>

                </td>


                <td>

                    <span class="fg-reading-number">
                        ${formatNumber(
                            reading.reading
                        )}
                    </span>

                </td>


                <td>

                    ${
                        evidence
                            ? `
                                <span class="fg-evidence-status fg-evidence-yes">
                                    ✓ Captured
                                </span>
                            `
                            : `
                                <span class="fg-evidence-status fg-evidence-no">
                                    ○ Not provided
                                </span>
                            `
                    }

                </td>


                <td>

                    <div>
                        ${escapeHTML(
                            formatDateTime(date)
                        )}
                    </div>

                    ${
                        historical
                            ? `
                                <div class="fg-history-badge">
                                    Historical
                                </div>
                            `
                            : ""
                    }

                </td>

            </tr>

        `;
    }


    /* =========================================================
       UPDATE STATS
    ========================================================= */

    function updateStats() {

        const total =
            State.readings.length;


        const todayStart =
            getTodayStart();


        const todayCount =
            State.readings.filter(function (reading) {

                const date =
                    new Date(
                        getReadingDate(reading) || 0
                    );


                return (
                    !Number.isNaN(date.getTime()) &&
                    date >= todayStart
                );

            }).length;


        const opening =
            State.readings.filter(function (reading) {

                return reading.reading_type === "opening";

            }).length;


        const evidence =
            State.readings.filter(function (reading) {

                return Boolean(reading.photo_url);

            }).length;


        if ($("statTotalReadings")) {

            $("statTotalReadings").textContent =
                formatNumber(total);
        }


        if ($("statTodayReadings")) {

            $("statTodayReadings").textContent =
                formatNumber(todayCount);
        }


        if ($("statOpeningReadings")) {

            $("statOpeningReadings").textContent =
                formatNumber(opening);
        }


        if ($("statEvidenceReadings")) {

            $("statEvidenceReadings").textContent =
                formatNumber(evidence);
        }
    }


    /* =========================================================
       EVIDENCE ROLL
    ========================================================= */

    function renderEvidenceRoll() {

        const container =
            $("evidenceRollContainer");


        if (!container) {
            return;
        }


        const evidenceReadings =
            State.readings
                .filter(function (reading) {

                    return Boolean(reading.photo_url);

                })
                .sort(function (a, b) {

                    return new Date(
                        getReadingDate(b) || 0
                    ) -
                    new Date(
                        getReadingDate(a) || 0
                    );

                })
                .slice(0, 8);


        if (!evidenceReadings.length) {

            container.innerHTML = `

                <div class="fg-empty-state">

                    <div class="fg-empty-icon">
                        ◉
                    </div>

                    <div class="fg-empty-title">
                        No evidence available
                    </div>

                    <div>
                        Camera evidence is optional for meter readings.
                    </div>

                </div>

            `;

            return;
        }


        const items =
            evidenceReadings
                .map(function (reading) {

                    const station =
                        State.stations.find(function (item) {

                            return String(item.id) ===
                                String(reading.station_id);

                        });


                    const pump =
                        State.pumps.find(function (item) {

                            return String(item.id) ===
                                String(reading.pump_id);

                        });


                    const nozzle =
                        State.nozzles.find(function (item) {

                            return String(item.id) ===
                                String(reading.nozzle_id);

                        });


                    return `

                        <div class="fg-evidence-item">

                            <img
                                class="fg-evidence-image"
                                src="${escapeHTML(
                                    reading.photo_url
                                )}"
                                alt="Meter reading evidence"
                                loading="lazy"
                                onerror="this.style.display='none';"
                            >


                            <div class="fg-evidence-info">

                                <strong>
                                    ${escapeHTML(
                                        station?.name ||
                                        "Unknown Station"
                                    )}
                                </strong>

                                <span>
                                    Pump #${escapeHTML(
                                        pump?.pump_number ||
                                        "—"
                                    )}
                                    ·
                                    Nozzle #${escapeHTML(
                                        nozzle?.nozzle_number ||
                                        "—"
                                    )}
                                </span>

                                <span>
                                    ${escapeHTML(
                                        formatDateTime(
                                            getReadingDate(
                                                reading
                                            )
                                        )
                                    )}
                                </span>

                            </div>

                        </div>

                    `;

                })
                .join("");


        container.innerHTML = `

            <div class="fg-evidence-grid">

                ${items}

            </div>

        `;
    }


    /* =========================================================
       MODAL
    ========================================================= */

    function openModal() {

        const modal =
            $("meterReadingModal");


        if (!modal) {
            return;
        }


        modal.classList.add("active");


        setDefaultReadingDate();


        setTimeout(function () {

            const station =
                $("meterStation");

            if (station) {
                station.focus();
            }

        }, 100);
    }


    function closeModal() {

        stopCamera();

        resetEvidence();


        const modal =
            $("meterReadingModal");


        if (modal) {

            modal.classList.remove("active");
        }


        const form =
            $("meterReadingForm");


        if (form) {

            form.reset();
        }


        resetFormSelects();

        setDefaultReadingDate();

        updateHistoryNotice();

        populateShifts();
    }


    function resetFormSelects() {

        const pump =
            $("meterPump");

        const nozzle =
            $("meterNozzle");


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


        const shift =
            $("meterShift");


        if (shift) {

            shift.innerHTML = `

                <option value="">
                    Select shift
                </option>

            `;
        }
    }


    function setDefaultReadingDate() {

        const input =
            $("meterReadingDate");


        if (!input) {
            return;
        }


        if (!input.value) {

            input.value =
                toDateTimeLocalValue(
                    new Date()
                );
        }
    }


    /* =========================================================
       CAMERA
    ========================================================= */

    async function startCamera() {

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


            State.cameraStream = stream;


            const video =
                $("meterCameraVideo");


            if (!video) {
                return;
            }


            video.srcObject = stream;

            video.classList.add("show");


            const capture =
                $("captureMeterPhoto");


            if (capture) {
                capture.disabled = false;
            }


            updateEvidenceStatus(
                "Camera active — position the meter clearly, then capture.",
                "camera"
            );


        } catch (error) {

            console.error(
                "FuelGap camera error:",
                error
            );


            showToast(
                "Unable to access the camera. Please allow camera permission or upload an image instead.",
                "error"
            );
        }
    }


    /* =========================================================
       CAPTURE PHOTO
    ========================================================= */

    function capturePhoto() {

        const video =
            $("meterCameraVideo");


        if (
            !video ||
            !State.cameraStream
        ) {

            showToast(
                "Start the camera first.",
                "error"
            );

            return;
        }


        if (
            !video.videoWidth ||
            !video.videoHeight
        ) {

            showToast(
                "Camera is not ready yet.",
                "error"
            );

            return;
        }


        const canvas =
            document.createElement("canvas");


        const maxDimension =
            1280;


        let width =
            video.videoWidth;


        let height =
            video.videoHeight;


        if (width > maxDimension) {

            const ratio =
                maxDimension / width;

            width =
                Math.round(width * ratio);

            height =
                Math.round(height * ratio);
        }


        if (height > maxDimension) {

            const ratio =
                maxDimension / height;

            width =
                Math.round(width * ratio);

            height =
                Math.round(height * ratio);
        }


        canvas.width = width;

        canvas.height = height;


        const context =
            canvas.getContext("2d");


        context.drawImage(
            video,
            0,
            0,
            width,
            height
        );


        State.currentPhoto =
            canvas.toDataURL(
                "image/jpeg",
                0.76
            );


        showPhotoPreview(
            State.currentPhoto
        );


        stopCamera();


        updateEvidenceStatus(
            "Live camera evidence attached.",
            "success"
        );


        showToast(
            "Evidence captured successfully.",
            "success"
        );
    }


    /* =========================================================
       FILE UPLOAD
    ========================================================= */

    function chooseEvidenceFile() {

        const input =
            $("meterEvidenceFile");


        if (input) {
            input.click();
        }
    }


    function handleEvidenceFile(event) {

        const file =
            event.target.files &&
            event.target.files[0];


        if (!file) {
            return;
        }


        if (!file.type.startsWith("image/")) {

            showToast(
                "Please select an image file.",
                "error"
            );

            event.target.value = "";

            return;
        }


        compressImage(
            file,
            function (dataUrl) {

                State.currentPhoto =
                    dataUrl;


                showPhotoPreview(
                    dataUrl
                );


                stopCamera();


                updateEvidenceStatus(
                    "Uploaded image attached as evidence.",
                    "success"
                );


                showToast(
                    "Evidence image attached.",
                    "success"
                );

            }
        );


        event.target.value = "";
    }


    /* =========================================================
       COMPRESS IMAGE
    ========================================================= */

    function compressImage(file, callback) {

        const reader =
            new FileReader();


        reader.onload = function () {

            const image =
                new Image();


            image.onload = function () {

                const maxDimension =
                    1280;


                let width =
                    image.width;


                let height =
                    image.height;


                if (width > maxDimension) {

                    const ratio =
                        maxDimension / width;

                    width =
                        Math.round(width * ratio);

                    height =
                        Math.round(height * ratio);
                }


                if (height > maxDimension) {

                    const ratio =
                        maxDimension / height;

                    width =
                        Math.round(width * ratio);

                    height =
                        Math.round(height * ratio);
                }


                const canvas =
                    document.createElement("canvas");


                canvas.width =
                    width;

                canvas.height =
                    height;


                const context =
                    canvas.getContext("2d");


                context.drawImage(
                    image,
                    0,
                    0,
                    width,
                    height
                );


                const dataUrl =
                    canvas.toDataURL(
                        "image/jpeg",
                        0.76
                    );


                callback(dataUrl);
            };


            image.onerror = function () {

                showToast(
                    "Unable to process this image.",
                    "error"
                );
            };


            image.src =
                reader.result;
        };


        reader.onerror = function () {

            showToast(
                "Unable to read the selected image.",
                "error"
            );
        };


        reader.readAsDataURL(file);
    }


    /* =========================================================
       SHOW PHOTO
    ========================================================= */

    function showPhotoPreview(dataUrl) {

        const preview =
            $("meterPhotoPreview");


        if (!preview) {
            return;
        }


        preview.src =
            dataUrl;


        preview.classList.add("show");
    }


    /* =========================================================
       RESET EVIDENCE
    ========================================================= */

    function resetEvidence() {

        State.currentPhoto =
            null;


        const preview =
            $("meterPhotoPreview");


        if (preview) {

            preview.src = "";

            preview.classList.remove("show");
        }


        const file =
            $("meterEvidenceFile");


        if (file) {
            file.value = "";
        }


        updateEvidenceStatus(
            "No evidence attached — you can still save this reading.",
            "none"
        );
    }


    function removeEvidence() {

        resetEvidence();

        showToast(
            "Evidence removed. You can still save this reading.",
            "info"
        );
    }


    function retakePhoto() {

        resetEvidence();

        startCamera();
    }


    /* =========================================================
       CAMERA STOP
    ========================================================= */

    function stopCamera() {

        if (State.cameraStream) {

            State.cameraStream
                .getTracks()
                .forEach(function (track) {

                    track.stop();

                });

            State.cameraStream =
                null;
        }


        const video =
            $("meterCameraVideo");


        if (video) {

            video.srcObject =
                null;

            video.classList.remove("show");
        }


        const capture =
            $("captureMeterPhoto");


        if (capture) {

            capture.disabled =
                true;
        }
    }


    /* =========================================================
       EVIDENCE STATUS
    ========================================================= */

    function updateEvidenceStatus(
        message,
        type
    ) {

        const status =
            $("meterEvidenceStatus");


        if (!status) {
            return;
        }


        let icon = "○";


        if (type === "success") {
            icon = "✓";
        }

        if (type === "camera") {
            icon = "◉";
        }


        status.innerHTML = `

            <span>
                ${icon}
            </span>

            <span>
                ${escapeHTML(message)}
            </span>

        `;
    }


    /* =========================================================
       FORM VALIDATION
    ========================================================= */

    function validateForm() {

        const stationId =
            $("meterStation")?.value;


        const pumpId =
            $("meterPump")?.value;


        const nozzleId =
            $("meterNozzle")?.value;


        const readingType =
            $("meterReadingType")?.value;


        const readingDate =
            $("meterReadingDate")?.value;


        const readingValue =
            $("meterReading")?.value;


        if (!stationId) {

            showToast(
                "Please select a station.",
                "error"
            );

            return false;
        }


        if (!pumpId) {

            showToast(
                "Please select a pump.",
                "error"
            );

            return false;
        }


        if (!nozzleId) {

            showToast(
                "Please select a nozzle.",
                "error"
            );

            return false;
        }


        if (!readingType) {

            showToast(
                "Please select the reading type.",
                "error"
            );

            return false;
        }


        if (!readingDate) {

            showToast(
                "Please select the reading date and time.",
                "error"
            );

            return false;
        }


        const parsedDate =
            new Date(readingDate);


        if (
            Number.isNaN(
                parsedDate.getTime()
            )
        ) {

            showToast(
                "The reading date and time is invalid.",
                "error"
            );

            return false;
        }


        const numericReading =
            Number(readingValue);


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

            return false;
        }


        return true;
    }


    /* =========================================================
       SUBMIT READING
    ========================================================= */

    async function submitReading(event) {

        event.preventDefault();


        if (State.isSubmitting) {
            return;
        }


        if (!validateForm()) {
            return;
        }


        const stationId =
            $("meterStation").value;


        const pumpId =
            $("meterPump").value;


        const nozzleId =
            $("meterNozzle").value;


        const shiftId =
            $("meterShift").value ||
            null;


        const readingType =
            $("meterReadingType").value;


        const readingValue =
            Number(
                $("meterReading").value
            );


        const dateValue =
            $("meterReadingDate").value;


        const capturedAt =
            new Date(
                dateValue
            );


        if (
            Number.isNaN(
                capturedAt.getTime()
            )
        ) {

            showToast(
                "Invalid reading date and time.",
                "error"
            );

            return;
        }


        /*
           IMPORTANT:
           Evidence is optional.

           photo_url will be null when
           the user does not provide evidence.
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
                readingValue,

            photo_url:
                State.currentPhoto ||
                null,

            captured_at:
                capturedAt.toISOString()

        };


        State.isSubmitting =
            true;


        const saveButton =
            $("saveMeterReading");


        if (saveButton) {

            saveButton.disabled =
                true;

            saveButton.innerHTML = `
                <span>Saving...</span>
            `;
        }


        try {

            console.log(
                "FUELGAP METER READING PAYLOAD:",
                {
                    ...payload,
                    photo_url:
                        payload.photo_url
                            ? "[IMAGE ATTACHED]"
                            : null
                }
            );


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
                "FUELGAP METER READING RESPONSE:",
                response
            );


            showToast(
                State.currentPhoto
                    ? "Meter reading saved with evidence."
                    : "Meter reading saved successfully without evidence.",
                "success"
            );


            closeModal();


            await loadReadings();


        } catch (error) {

            console.error(
                "FUELGAP METER READING SAVE ERROR:",
                error
            );


            let message =
                "Unable to save meter reading.";


            if (error?.message) {
                message = error.message;
            }


            showToast(
                message,
                "error"
            );


        } finally {

            State.isSubmitting =
                false;


            if (saveButton) {

                saveButton.disabled =
                    false;

                saveButton.innerHTML = `
                    <span>✓</span>
                    Save Reading
                `;
            }
        }
    }


    /* =========================================================
       EVENT BINDINGS
    ========================================================= */

    function bindEvents() {

        const openButton =
            $("openMeterReadingModal");


        const closeButton =
            $("closeMeterReadingModal");


        const cancelButton =
            $("cancelMeterReading");


        const form =
            $("meterReadingForm");


        if (openButton) {

            openButton.addEventListener(
                "click",
                openModal
            );
        }


        if (closeButton) {

            closeButton.addEventListener(
                "click",
                closeModal
            );
        }


        if (cancelButton) {

            cancelButton.addEventListener(
                "click",
                closeModal
            );
        }


        if (form) {

            form.addEventListener(
                "submit",
                submitReading
            );
        }


        /* STATION */

        const station =
            $("meterStation");


        if (station) {

            station.addEventListener(
                "change",
                function () {

                    populatePumps(
                        station.value
                    );

                    populateNozzles("");

                    populateShifts();
                }
            );
        }


        /* PUMP */

        const pump =
            $("meterPump");


        if (pump) {

            pump.addEventListener(
                "change",
                function () {

                    populateNozzles(
                        pump.value
                    );
                }
            );
        }


        /* TYPE */

        const type =
            $("meterReadingType");


        if (type) {

            type.addEventListener(
                "change",
                function () {

                    populateShifts();
                }
            );
        }


        /* DATE */

        const date =
            $("meterReadingDate");


        if (date) {

            date.addEventListener(
                "change",
                updateHistoryNotice
            );

            date.addEventListener(
                "input",
                updateHistoryNotice
            );
        }


        /* FILTER STATION */

        const filterStation =
            $("readingFilterStation");


        if (filterStation) {

            filterStation.addEventListener(
                "change",
                function () {

                    State.filters.station =
                        filterStation.value;

                    renderReadings();
                }
            );
        }


        /* FILTER TYPE */

        const filterType =
            $("readingFilterType");


        if (filterType) {

            filterType.addEventListener(
                "change",
                function () {

                    State.filters.type =
                        filterType.value;

                    renderReadings();
                }
            );
        }


        /* SEARCH */

        const search =
            $("readingSearch");


        if (search) {

            search.addEventListener(
                "input",
                function () {

                    State.filters.search =
                        search.value;

                    renderReadings();
                }
            );
        }


        /* CAMERA */

        const startCameraButton =
            $("startMeterCamera");


        if (startCameraButton) {

            startCameraButton.addEventListener(
                "click",
                startCamera
            );
        }


        const captureButton =
            $("captureMeterPhoto");


        if (captureButton) {

            captureButton.addEventListener(
                "click",
                capturePhoto
            );
        }


        const retakeButton =
            $("retakeMeterPhoto");


        if (retakeButton) {

            retakeButton.addEventListener(
                "click",
                retakePhoto
            );
        }


        const uploadButton =
            $("uploadMeterPhoto");


        if (uploadButton) {

            uploadButton.addEventListener(
                "click",
                chooseEvidenceFile
            );
        }


        const fileInput =
            $("meterEvidenceFile");


        if (fileInput) {

            fileInput.addEventListener(
                "change",
                handleEvidenceFile
            );
        }


        const removeButton =
            $("removeMeterPhoto");


        if (removeButton) {

            removeButton.addEventListener(
                "click",
                removeEvidence
            );
        }


        /* MODAL BACKDROP */

        const modal =
            $("meterReadingModal");


        if (modal) {

            modal.addEventListener(
                "click",
                function (event) {

                    if (
                        event.target ===
                        modal
                    ) {

                        closeModal();
                    }
                }
            );
        }


        /* ESCAPE */

        document.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Escape" &&
                    modal &&
                    modal.classList.contains("active")
                ) {

                    closeModal();
                }

            }
        );
    }


    /* =========================================================
       INITIALIZE
    ========================================================= */

    async function init() {

        if (State.isLoading) {
            return;
        }


        State.isLoading =
            true;


        try {

            injectStyles();


            const rendered =
                renderPage();


            if (!rendered) {

                console.error(
                    "FuelGap: Unable to render Meter Readings page."
                );

                return;
            }


            bindEvents();


            State.currentUser =
                window.FuelGapUtils &&
                typeof FuelGapUtils.getCurrentUser ===
                "function"

                    ? FuelGapUtils.getCurrentUser()

                    : null;


            console.log(
                "FUELGAP METER READINGS USER:",
                State.currentUser
            );


            setDefaultReadingDate();


            /*
               Load backend data.

               These are intentionally done separately so that
               one failed endpoint does not stop the entire page.
            */

            await loadStations();

            await loadPumps();

            await loadNozzles();

            await loadShifts();

            await loadReadings();


            updateHistoryNotice();


            console.log(
                "FuelGap Meter Readings initialized successfully."
            );


        } catch (error) {

            console.error(
                "FUELGAP METER READINGS INITIALIZATION ERROR:",
                error
            );


            showToast(
                "Meter Readings page could not finish loading.",
                "error"
            );


        } finally {

            State.isLoading =
                false;
        }
    }


    /* =========================================================
       IMPORTANT INITIALIZATION FIX
       ---------------------------------------------------------
       Works whether this JS loads before or after DOMContentLoaded.
    ========================================================= */

    function boot() {

        /*
           app.js normally creates #pageContent dynamically.
           Give app.js a short opportunity to create it.
        */

        let attempts = 0;

        const maxAttempts = 60;


        function tryInit() {

            const container =
                getPageContainer();


            /*
               Do not render directly into body while app.js
               is still building the application shell.
            */

            if (
                !container ||
                (
                    !$("pageContent") &&
                    !$("app")
                )
            ) {

                attempts++;


                if (attempts < maxAttempts) {

                    setTimeout(
                        tryInit,
                        100
                    );

                    return;
                }


                console.error(
                    "FuelGap: Could not find application page container."
                );

                return;
            }


            init();
        }


        tryInit();
    }


    /*
       Critical blank-page fix:
       If the script loads after DOMContentLoaded,
       the normal DOMContentLoaded listener would never fire.
    */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            boot
        );

    } else {

        boot();
    }


})();