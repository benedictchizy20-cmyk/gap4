/* =========================================================
   FUELGAP - ALERTS FRONTEND
   PRODUCTION VERSION
   SUPABASE + EXPRESS
   HTTPONLY COOKIE SESSION
   NO LOCALSTORAGE AUTH
========================================================= */

"use strict";


/* =========================================================
   ALERTS STATE
========================================================= */

const AlertsState = {

    currentUser: null,

    alerts: [],
    filteredAlerts: [],

    stations: [],

    isLoading: false,
    isProcessing: false,
    isCreating: false,

    filters: {
        station_id: "",
        severity: "",
        status: "",
        type: "",
        search: ""
    },

    autoRefreshTimer: null,

    selectedAlert: null

};


/* =========================================================
   ALERTS CSS
========================================================= */

(function injectAlertsStyles() {

    if (document.getElementById("fuelgap-alerts-styles")) {
        return;
    }

    const style = document.createElement("style");

    style.id = "fuelgap-alerts-styles";

    style.textContent = `

        .alerts-page {
            padding: 24px;
            width: 100%;
            box-sizing: border-box;
        }

        .alerts-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 24px;
        }

        .alerts-title-wrap h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 800;
            color: #171717;
        }

        .alerts-title-wrap p {
            margin: 7px 0 0;
            color: #737373;
            font-size: 14px;
        }

        .alerts-header-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }

        .alerts-btn {
            border: 0;
            border-radius: 10px;
            padding: 11px 16px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: .2s ease;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .alerts-btn:hover {
            transform: translateY(-1px);
        }

        .alerts-btn-primary {
            background: #facc15;
            color: #171717;
        }

        .alerts-btn-secondary {
            background: #f5f5f5;
            color: #262626;
            border: 1px solid #e5e5e5;
        }

        .alerts-btn-danger {
            background: #dc2626;
            color: #fff;
        }

        .alerts-btn-success {
            background: #16a34a;
            color: #fff;
        }

        .alerts-btn-warning {
            background: #f59e0b;
            color: #fff;
        }

        .alerts-btn:disabled {
            opacity: .55;
            cursor: not-allowed;
            transform: none;
        }

        .alerts-summary {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 15px;
            margin-bottom: 24px;
        }

        .alert-stat-card {
            background: #fff;
            border: 1px solid #e5e5e5;
            border-radius: 14px;
            padding: 18px;
            box-shadow: 0 3px 14px rgba(0,0,0,.04);
        }

        .alert-stat-label {
            color: #737373;
            font-size: 13px;
            margin-bottom: 7px;
        }

        .alert-stat-value {
            font-size: 27px;
            font-weight: 800;
            color: #171717;
        }

        .alert-stat-card.warning {
            border-left: 4px solid #f59e0b;
        }

        .alert-stat-card.high {
            border-left: 4px solid #ea580c;
        }

        .alert-stat-card.critical {
            border-left: 4px solid #dc2626;
        }

        .alert-stat-card.resolved {
            border-left: 4px solid #16a34a;
        }

        .alerts-filters {
            background: #fff;
            border: 1px solid #e5e5e5;
            border-radius: 14px;
            padding: 18px;
            margin-bottom: 20px;
            display: grid;
            grid-template-columns: 1.3fr 1fr 1fr 1fr 1.5fr;
            gap: 12px;
        }

        .alerts-field {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .alerts-field label {
            font-size: 12px;
            font-weight: 700;
            color: #525252;
        }

        .alerts-field input,
        .alerts-field select,
        .alerts-modal input,
        .alerts-modal select,
        .alerts-modal textarea {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #d4d4d4;
            border-radius: 9px;
            padding: 11px 12px;
            background: #fff;
            color: #171717;
            outline: none;
            font-size: 14px;
        }

        .alerts-field input:focus,
        .alerts-field select:focus,
        .alerts-modal input:focus,
        .alerts-modal select:focus,
        .alerts-modal textarea:focus {
            border-color: #eab308;
            box-shadow: 0 0 0 3px rgba(250,204,21,.15);
        }

        .alerts-table-wrap {
            background: #fff;
            border: 1px solid #e5e5e5;
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 3px 14px rgba(0,0,0,.04);
        }

        .alerts-table-scroll {
            width: 100%;
            overflow-x: auto;
        }

        .alerts-table {
            width: 100%;
            min-width: 950px;
            border-collapse: collapse;
        }

        .alerts-table th {
            background: #fafafa;
            color: #525252;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: .04em;
            padding: 14px;
            text-align: left;
            border-bottom: 1px solid #e5e5e5;
        }

        .alerts-table td {
            padding: 14px;
            border-bottom: 1px solid #f0f0f0;
            color: #262626;
            font-size: 14px;
            vertical-align: middle;
        }

        .alerts-table tbody tr:hover {
            background: #fffdf0;
        }

        .alert-title {
            font-weight: 750;
            color: #171717;
        }

        .alert-message-preview {
            margin-top: 4px;
            color: #737373;
            font-size: 12px;
            max-width: 360px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .alert-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 5px 9px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
        }

        .alert-badge-info {
            background: #e0f2fe;
            color: #0369a1;
        }

        .alert-badge-warning {
            background: #fef3c7;
            color: #92400e;
        }

        .alert-badge-high {
            background: #ffedd5;
            color: #c2410c;
        }

        .alert-badge-critical {
            background: #fee2e2;
            color: #b91c1c;
        }

        .alert-badge-new {
            background: #fef9c3;
            color: #854d0e;
        }

        .alert-badge-acknowledged {
            background: #e0e7ff;
            color: #3730a3;
        }

        .alert-badge-resolved {
            background: #dcfce7;
            color: #166534;
        }

        .alert-actions {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
        }

        .alert-action-btn {
            border: 1px solid #e5e5e5;
            background: #fff;
            border-radius: 8px;
            padding: 7px 9px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 700;
        }

        .alert-action-btn:hover {
            background: #fafafa;
        }

        .alert-action-btn.danger {
            color: #dc2626;
        }

        .alert-empty {
            text-align: center;
            padding: 55px 20px;
            color: #737373;
        }

        .alert-empty strong {
            display: block;
            color: #404040;
            font-size: 17px;
            margin-bottom: 6px;
        }

        .alert-loading {
            text-align: center;
            padding: 50px;
            color: #737373;
        }

        .alerts-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,.55);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .alerts-modal {
            width: min(680px, 100%);
            max-height: 90vh;
            overflow-y: auto;
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 25px 70px rgba(0,0,0,.2);
        }

        .alerts-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            padding: 20px 22px;
            border-bottom: 1px solid #e5e5e5;
        }

        .alerts-modal-header h2 {
            margin: 0;
            font-size: 20px;
        }

        .alerts-modal-close {
            width: 34px;
            height: 34px;
            border: 0;
            border-radius: 8px;
            background: #f5f5f5;
            cursor: pointer;
            font-size: 18px;
        }

        .alerts-modal-body {
            padding: 22px;
        }

        .alerts-form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }

        .alerts-form-full {
            grid-column: 1 / -1;
        }

        .alerts-modal textarea {
            min-height: 120px;
            resize: vertical;
        }

        .alerts-modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            padding: 18px 22px;
            border-top: 1px solid #e5e5e5;
        }

        .alert-detail-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }

        .alert-detail-item {
            background: #fafafa;
            border-radius: 10px;
            padding: 13px;
        }

        .alert-detail-label {
            color: #737373;
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 800;
            margin-bottom: 5px;
        }

        .alert-detail-value {
            color: #171717;
            font-size: 14px;
            font-weight: 650;
            word-break: break-word;
        }

        .alert-detail-message {
            background: #fafafa;
            padding: 15px;
            border-radius: 10px;
            line-height: 1.6;
            color: #404040;
            white-space: pre-wrap;
        }

        .alerts-toast-container {
            position: fixed;
            right: 20px;
            bottom: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: min(380px, calc(100vw - 40px));
        }

        .alerts-toast {
            background: #171717;
            color: #fff;
            padding: 14px 16px;
            border-radius: 10px;
            box-shadow: 0 12px 30px rgba(0,0,0,.2);
            font-size: 13px;
            line-height: 1.4;
        }

        .alerts-toast.success {
            border-left: 4px solid #22c55e;
        }

        .alerts-toast.error {
            border-left: 4px solid #ef4444;
        }

        .alerts-toast.warning {
            border-left: 4px solid #facc15;
        }

        @media (max-width: 1100px) {

            .alerts-summary {
                grid-template-columns: repeat(3, 1fr);
            }

            .alerts-filters {
                grid-template-columns: repeat(2, 1fr);
            }

        }

        @media (max-width: 700px) {

            .alerts-page {
                padding: 15px;
            }

            .alerts-header {
                flex-direction: column;
            }

            .alerts-header-actions {
                width: 100%;
            }

            .alerts-header-actions .alerts-btn {
                flex: 1;
            }

            .alerts-summary {
                grid-template-columns: repeat(2, 1fr);
            }

            .alerts-filters {
                grid-template-columns: 1fr;
            }

            .alerts-form-grid,
            .alert-detail-grid {
                grid-template-columns: 1fr;
            }

            .alerts-form-full {
                grid-column: auto;
            }

        }

        @media (max-width: 430px) {

            .alerts-summary {
                grid-template-columns: 1fr;
            }

        }

    `;

    document.head.appendChild(style);

})();


/* =========================================================
   CURRENT USER
   IMPORTANT:
   SUPPORTS MULTIPLE API RESPONSE SHAPES
========================================================= */

async function getAlertsCurrentUser() {

    try {

        if (
            window.FuelGapAPI &&
            typeof FuelGapAPI.getCurrentUser === "function"
        ) {

            const response =
                await FuelGapAPI.getCurrentUser();

            console.log(
                "FUELGAP ALERTS - AUTH/ME RESPONSE:",
                response
            );


            /*
                Supported responses:

                {
                    user: {...}
                }

                {
                    data: {
                        user: {...}
                    }
                }

                {
                    data: {
                        data: {
                            user: {...}
                        }
                    }
                }

                {
                    data: {...}
                }

                {
                    role: "owner"
                }
            */

            const user =
                response?.user ||
                response?.data?.user ||
                response?.data?.data?.user ||
                response?.data?.data ||
                response?.data ||
                response;


            console.log(
                "FUELGAP ALERTS - CURRENT USER:",
                user
            );

            console.log(
                "FUELGAP ALERTS - CURRENT ROLE:",
                user?.role
            );


            if (user) {
                return user;
            }

        }

    } catch (error) {

        console.warn(
            "FuelGapAPI.getCurrentUser failed:",
            error
        );

    }


    /* =====================================================
       FALLBACK TO UTILS
    ===================================================== */

    try {

        if (
            window.FuelGapUtils &&
            typeof FuelGapUtils.getCurrentUser === "function"
        ) {

            const user =
                FuelGapUtils.getCurrentUser();


            console.log(
                "FUELGAP ALERTS - UTILS CURRENT USER:",
                user
            );


            if (user) {
                return user;
            }

        }

    } catch (error) {

        console.warn(
            "FuelGapUtils.getCurrentUser failed:",
            error
        );

    }


    return null;

}


/* =========================================================
   ROLE CHECK
========================================================= */

function canManageAlerts() {

    const user =
        AlertsState.currentUser;


    const role =
        user?.role ||
        user?.user?.role ||
        user?.data?.role ||
        user?.data?.user?.role ||
        "";


    const normalizedRole =
        String(role)
            .trim()
            .toLowerCase();


    console.log(
        "FUELGAP ALERTS - ROLE CHECK:",
        {
            user,
            role,
            normalizedRole
        }
    );


    return [
        "owner",
        "admin",
        "manager"
    ].includes(
        normalizedRole
    );

}


/* =========================================================
   TOAST
========================================================= */

function showAlertsToast(
    message,
    type = "success"
) {

    let container =
        document.getElementById(
            "alertsToastContainer"
        );


    if (!container) {

        container =
            document.createElement("div");

        container.id =
            "alertsToastContainer";

        container.className =
            "alerts-toast-container";

        document.body.appendChild(
            container
        );

    }


    const toast =
        document.createElement("div");

    toast.className =
        `alerts-toast ${type}`;


    toast.textContent =
        message;


    container.appendChild(
        toast
    );


    setTimeout(() => {

        toast.style.opacity = "0";
        toast.style.transform = "translateY(10px)";
        toast.style.transition = ".25s ease";


        setTimeout(() => {

            toast.remove();

        }, 250);

    }, 3500);

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeAlertHtml(value) {

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


/* =========================================================
   FORMAT DATE
========================================================= */

function formatAlertDate(value) {

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
        return "—";
    }


    return date.toLocaleString(
        "en-NG",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );

}


/* =========================================================
   FORMAT NUMBER
========================================================= */

function formatAlertNumber(value) {

    const number =
        Number(value);


    if (
        Number.isNaN(number)
    ) {
        return "0";
    }


    return number.toLocaleString(
        "en-NG"
    );

}


/* =========================================================
   GET API DATA ARRAY
========================================================= */

function extractAlertsArray(response) {

    if (
        Array.isArray(response)
    ) {
        return response;
    }


    if (
        Array.isArray(response?.data)
    ) {
        return response.data;
    }


    if (
        Array.isArray(response?.data?.alerts)
    ) {
        return response.data.alerts;
    }


    if (
        Array.isArray(response?.alerts)
    ) {
        return response.alerts;
    }


    return [];

}


/* =========================================================
   LOAD STATIONS
========================================================= */

async function loadAlertStations() {

    try {

        if (
            !window.FuelGapAPI ||
            typeof FuelGapAPI.getStations !== "function"
        ) {

            console.warn(
                "FuelGapAPI.getStations is unavailable."
            );

            return;

        }


        const response =
            await FuelGapAPI.getStations();


        const stations =
            extractAlertsArray(
                response
            );


        AlertsState.stations =
            stations || [];


        console.log(
            "FUELGAP ALERTS - STATIONS:",
            AlertsState.stations
        );


    } catch (error) {

        console.error(
            "Failed to load alert stations:",
            error
        );


        AlertsState.stations = [];

    }

}


/* =========================================================
   POPULATE STATION FILTER
========================================================= */

function populateAlertStationFilter() {

    const select =
        document.getElementById(
            "alertStationFilter"
        );


    if (!select) {
        return;
    }


    const currentValue =
        AlertsState.filters.station_id;


    select.innerHTML =
        `<option value="">All stations</option>`;


    AlertsState.stations.forEach(
        station => {

            const id =
                station.id ||
                station.station_id;


            const name =
                station.name ||
                station.station_name ||
                `Station ${id}`;


            if (!id) {
                return;
            }


            const option =
                document.createElement("option");


            option.value =
                id;


            option.textContent =
                name;


            select.appendChild(
                option
            );

        }
    );


    select.value =
        currentValue;

}


/* =========================================================
   LOAD ALERTS
========================================================= */

async function loadAlerts() {

    if (AlertsState.isLoading) {
        return;
    }


    AlertsState.isLoading =
        true;


    renderAlertsLoading();


    try {

        const filters = {};


        if (
            AlertsState.filters.station_id
        ) {
            filters.station_id =
                AlertsState.filters.station_id;
        }


        if (
            AlertsState.filters.severity
        ) {
            filters.severity =
                AlertsState.filters.severity;
        }


        if (
            AlertsState.filters.status
        ) {
            filters.status =
                AlertsState.filters.status;
        }


        if (
            AlertsState.filters.type
        ) {
            filters.type =
                AlertsState.filters.type;
        }


        filters.limit = 500;


        const response =
            await FuelGapAPI.getAlerts(
                filters
            );


        AlertsState.alerts =
            extractAlertsArray(
                response
            );


        console.log(
            "FUELGAP ALERTS - LOADED:",
            AlertsState.alerts
        );


        applyAlertFilters();


    } catch (error) {

        console.error(
            "FUELGAP ALERTS - LOAD ERROR:",
            error
        );


        renderAlertsError(
            error.message ||
            "Unable to load alerts."
        );

    } finally {

        AlertsState.isLoading =
            false;

    }

}


/* =========================================================
   APPLY FILTERS
========================================================= */

function applyAlertFilters() {

    const search =
        String(
            AlertsState.filters.search ||
            ""
        )
            .trim()
            .toLowerCase();


    AlertsState.filteredAlerts =
        AlertsState.alerts.filter(
            alert => {

                if (
                    AlertsState.filters.station_id &&
                    String(
                        alert.station_id ||
                        ""
                    ) !== String(
                        AlertsState.filters.station_id
                    )
                ) {

                    return false;

                }


                if (
                    AlertsState.filters.severity &&
                    String(
                        alert.severity ||
                        ""
                    ).toLowerCase() !==
                    String(
                        AlertsState.filters.severity
                    ).toLowerCase()
                ) {

                    return false;

                }


                if (
                    AlertsState.filters.status &&
                    String(
                        alert.status ||
                        ""
                    ).toLowerCase() !==
                    String(
                        AlertsState.filters.status
                    ).toLowerCase()
                ) {

                    return false;

                }


                if (
                    AlertsState.filters.type &&
                    String(
                        alert.type ||
                        ""
                    ).toLowerCase() !==
                    String(
                        AlertsState.filters.type
                    ).toLowerCase()
                ) {

                    return false;

                }


                if (search) {

                    const searchable =
                        [
                            alert.title,
                            alert.message,
                            alert.type,
                            alert.severity,
                            alert.status,
                            alert.station?.name,
                            alert.pump?.pump_number,
                            alert.nozzle?.nozzle_number
                        ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase();


                    if (
                        !searchable.includes(
                            search
                        )
                    ) {

                        return false;

                    }

                }


                return true;

            }
        );


    renderAlertsPage();

}


/* =========================================================
   SUMMARY
========================================================= */

function getAlertSummary() {

    const alerts =
        AlertsState.alerts;


    return {

        total:
            alerts.length,

        newCount:
            alerts.filter(
                alert =>
                    alert.status === "new"
            ).length,

        acknowledged:
            alerts.filter(
                alert =>
                    alert.status === "acknowledged"
            ).length,

        resolved:
            alerts.filter(
                alert =>
                    alert.status === "resolved"
            ).length,

        critical:
            alerts.filter(
                alert =>
                    alert.severity === "critical"
            ).length,

        high:
            alerts.filter(
                alert =>
                    alert.severity === "high"
            ).length,

        warning:
            alerts.filter(
                alert =>
                    alert.severity === "warning"
            ).length

    };

}


/* =========================================================
   RENDER PAGE
========================================================= */

function renderAlertsPage() {

    const container =
        document.getElementById(
            "pageContent"
        );


    if (!container) {

        console.warn(
            "FuelGap Alerts: #pageContent not found."
        );

        return;

    }


    const summary =
        getAlertSummary();


    container.innerHTML = `

        <div class="alerts-page">

            <div class="alerts-header">

                <div class="alerts-title-wrap">

                    <h1>
                        Alerts & Notifications
                    </h1>

                    <p>
                        Monitor fuel gaps, variances and operational exceptions.
                    </p>

                </div>


                <div class="alerts-header-actions">

                    <button
                        class="alerts-btn alerts-btn-secondary"
                        type="button"
                        id="refreshAlertsBtn"
                    >
                        ↻ Refresh
                    </button>


                    ${
                        canManageAlerts()
                            ? `
                                <button
                                    class="alerts-btn alerts-btn-primary"
                                    type="button"
                                    id="createAlertBtn"
                                >
                                    + Create Alert
                                </button>
                            `
                            : ""
                    }

                </div>

            </div>


            <div class="alerts-summary">

                <div class="alert-stat-card">

                    <div class="alert-stat-label">
                        Total Alerts
                    </div>

                    <div class="alert-stat-value">
                        ${formatAlertNumber(summary.total)}
                    </div>

                </div>


                <div class="alert-stat-card warning">

                    <div class="alert-stat-label">
                        New
                    </div>

                    <div class="alert-stat-value">
                        ${formatAlertNumber(summary.newCount)}
                    </div>

                </div>


                <div class="alert-stat-card high">

                    <div class="alert-stat-label">
                        High
                    </div>

                    <div class="alert-stat-value">
                        ${formatAlertNumber(summary.high)}
                    </div>

                </div>


                <div class="alert-stat-card critical">

                    <div class="alert-stat-label">
                        Critical
                    </div>

                    <div class="alert-stat-value">
                        ${formatAlertNumber(summary.critical)}
                    </div>

                </div>


                <div class="alert-stat-card resolved">

                    <div class="alert-stat-label">
                        Resolved
                    </div>

                    <div class="alert-stat-value">
                        ${formatAlertNumber(summary.resolved)}
                    </div>

                </div>

            </div>


            <div class="alerts-filters">

                <div class="alerts-field">

                    <label>
                        Station
                    </label>

                    <select id="alertStationFilter">
                        <option value="">
                            All stations
                        </option>
                    </select>

                </div>


                <div class="alerts-field">

                    <label>
                        Severity
                    </label>

                    <select id="alertSeverityFilter">

                        <option value="">
                            All severity
                        </option>

                        <option value="info">
                            Info
                        </option>

                        <option value="warning">
                            Warning
                        </option>

                        <option value="high">
                            High
                        </option>

                        <option value="critical">
                            Critical
                        </option>

                    </select>

                </div>


                <div class="alerts-field">

                    <label>
                        Status
                    </label>

                    <select id="alertStatusFilter">

                        <option value="">
                            All status
                        </option>

                        <option value="new">
                            New
                        </option>

                        <option value="acknowledged">
                            Acknowledged
                        </option>

                        <option value="resolved">
                            Resolved
                        </option>

                    </select>

                </div>


                <div class="alerts-field">

                    <label>
                        Type
                    </label>

                    <select id="alertTypeFilter">

                        <option value="">
                            All types
                        </option>

                        <option value="gap_variance">
                            Gap Variance
                        </option>

                        <option value="system">
                            System
                        </option>

                        <option value="operational">
                            Operational
                        </option>

                        <option value="payment">
                            Payment
                        </option>

                        <option value="meter">
                            Meter
                        </option>

                    </select>

                </div>


                <div class="alerts-field">

                    <label>
                        Search
                    </label>

                    <input
                        type="search"
                        id="alertSearch"
                        placeholder="Search alerts..."
                        value="${escapeAlertHtml(
                            AlertsState.filters.search
                        )}"
                    >

                </div>

            </div>


            <div
                class="alerts-table-wrap"
                id="alertsTableContainer"
            >

                ${renderAlertTable()}

            </div>

        </div>

    `;


    populateAlertStationFilter();


    const stationFilter =
        document.getElementById(
            "alertStationFilter"
        );

    const severityFilter =
        document.getElementById(
            "alertSeverityFilter"
        );

    const statusFilter =
        document.getElementById(
            "alertStatusFilter"
        );

    const typeFilter =
        document.getElementById(
            "alertTypeFilter"
        );

    const searchInput =
        document.getElementById(
            "alertSearch"
        );

    const refreshButton =
        document.getElementById(
            "refreshAlertsBtn"
        );

    const createButton =
        document.getElementById(
            "createAlertBtn"
        );


    if (stationFilter) {

        stationFilter.value =
            AlertsState.filters.station_id;


        stationFilter.addEventListener(
            "change",
            event => {

                AlertsState.filters.station_id =
                    event.target.value;

                loadAlerts();

            }
        );

    }


    if (severityFilter) {

        severityFilter.value =
            AlertsState.filters.severity;


        severityFilter.addEventListener(
            "change",
            event => {

                AlertsState.filters.severity =
                    event.target.value;

                loadAlerts();

            }
        );

    }


    if (statusFilter) {

        statusFilter.value =
            AlertsState.filters.status;


        statusFilter.addEventListener(
            "change",
            event => {

                AlertsState.filters.status =
                    event.target.value;

                loadAlerts();

            }
        );

    }


    if (typeFilter) {

        typeFilter.value =
            AlertsState.filters.type;


        typeFilter.addEventListener(
            "change",
            event => {

                AlertsState.filters.type =
                    event.target.value;

                loadAlerts();

            }
        );

    }


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            event => {

                AlertsState.filters.search =
                    event.target.value;

                applyAlertFilters();

            }
        );

    }


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            () => {

                loadAlerts();

            }
        );

    }


    if (createButton) {

        createButton.addEventListener(
            "click",
            openCreateAlertModal
        );

    }


    attachAlertTableEvents();

}


/* =========================================================
   RENDER LOADING
========================================================= */

function renderAlertsLoading() {

    const container =
        document.getElementById(
            "pageContent"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="alerts-page">

            <div class="alert-loading">

                Loading alerts...

            </div>

        </div>

    `;

}


/* =========================================================
   RENDER ERROR
========================================================= */

function renderAlertsError(
    message
) {

    const container =
        document.getElementById(
            "pageContent"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="alerts-page">

            <div class="alert-empty">

                <strong>
                    Unable to load alerts
                </strong>

                <div>
                    ${escapeAlertHtml(message)}
                </div>

                <br>

                <button
                    class="alerts-btn alerts-btn-primary"
                    type="button"
                    onclick="window.FuelGapAlerts?.loadAlerts?.()"
                >
                    Try Again
                </button>

            </div>

        </div>

    `;

}


/* =========================================================
   RENDER ALERT TABLE
========================================================= */

function renderAlertTable() {

    if (
        !AlertsState.filteredAlerts.length
    ) {

        return `

            <div class="alert-empty">

                <strong>
                    No alerts found
                </strong>

                <div>
                    There are currently no alerts matching your filters.
                </div>

            </div>

        `;

    }


    return `

        <div class="alerts-table-scroll">

            <table class="alerts-table">

                <thead>

                    <tr>

                        <th>
                            Alert
                        </th>

                        <th>
                            Station
                        </th>

                        <th>
                            Severity
                        </th>

                        <th>
                            Status
                        </th>

                        <th>
                            Created
                        </th>

                        <th>
                            Actions
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${AlertsState.filteredAlerts
                        .map(
                            alert =>
                                renderAlertRow(
                                    alert
                                )
                        )
                        .join("")}

                </tbody>

            </table>

        </div>

    `;

}


/* =========================================================
   RENDER ALERT ROW
========================================================= */

function renderAlertRow(
    alert
) {

    const stationName =
        alert.station?.name ||
        alert.station_name ||
        getStationName(
            alert.station_id
        ) ||
        "All stations";


    const severity =
        String(
            alert.severity ||
            "warning"
        ).toLowerCase();


    const status =
        String(
            alert.status ||
            "new"
        ).toLowerCase();


    return `

        <tr>

            <td>

                <div class="alert-title">

                    ${escapeAlertHtml(
                        alert.title ||
                        "Untitled Alert"
                    )}

                </div>

                <div class="alert-message-preview">

                    ${escapeAlertHtml(
                        alert.message ||
                        ""
                    )}

                </div>

            </td>


            <td>

                ${escapeAlertHtml(
                    stationName
                )}

            </td>


            <td>

                <span
                    class="alert-badge alert-badge-${escapeAlertHtml(
                        severity
                    )}"
                >
                    ${escapeAlertHtml(
                        severity
                    )}
                </span>

            </td>


            <td>

                <span
                    class="alert-badge alert-badge-${escapeAlertHtml(
                        status
                    )}"
                >
                    ${escapeAlertHtml(
                        status
                    )}
                </span>

            </td>


            <td>

                ${escapeAlertHtml(
                    formatAlertDate(
                        alert.created_at
                    )
                )}

            </td>


            <td>

                <div class="alert-actions">

                    <button
                        class="alert-action-btn"
                        type="button"
                        data-alert-action="view"
                        data-alert-id="${escapeAlertHtml(
                            alert.id
                        )}"
                    >
                        View
                    </button>


                    ${
                        status !== "resolved"
                            ? `
                                <button
                                    class="alert-action-btn"
                                    type="button"
                                    data-alert-action="acknowledge"
                                    data-alert-id="${escapeAlertHtml(
                                        alert.id
                                    )}"
                                >
                                    Acknowledge
                                </button>
                            `
                            : ""
                    }


                    ${
                        status !== "resolved"
                            ? `
                                <button
                                    class="alert-action-btn"
                                    type="button"
                                    data-alert-action="resolve"
                                    data-alert-id="${escapeAlertHtml(
                                        alert.id
                                    )}"
                                >
                                    Resolve
                                </button>
                            `
                            : ""
                    }


                    ${
                        canManageAlerts()
                            ? `
                                <button
                                    class="alert-action-btn danger"
                                    type="button"
                                    data-alert-action="delete"
                                    data-alert-id="${escapeAlertHtml(
                                        alert.id
                                    )}"
                                >
                                    Delete
                                </button>
                            `
                            : ""
                    }

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

    if (!stationId) {
        return "";
    }


    const station =
        AlertsState.stations.find(
            item =>
                String(
                    item.id ||
                    item.station_id
                ) ===
                String(
                    stationId
                )
        );


    return (
        station?.name ||
        station?.station_name ||
        ""
    );

}


/* =========================================================
   TABLE EVENTS
========================================================= */

function attachAlertTableEvents() {

    document
        .querySelectorAll(
            "[data-alert-action]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    async () => {

                        const action =
                            button.dataset.alertAction;

                        const alertId =
                            button.dataset.alertId;


                        if (!alertId) {
                            return;
                        }


                        if (
                            action === "view"
                        ) {

                            openAlertDetailsModal(
                                alertId
                            );

                            return;

                        }


                        if (
                            action === "acknowledge"
                        ) {

                            await acknowledgeAlert(
                                alertId
                            );

                            return;

                        }


                        if (
                            action === "resolve"
                        ) {

                            await resolveAlert(
                                alertId
                            );

                            return;

                        }


                        if (
                            action === "delete"
                        ) {

                            await deleteAlert(
                                alertId
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   OPEN DETAILS MODAL
========================================================= */

function openAlertDetailsModal(
    alertId
) {

    const alert =
        AlertsState.alerts.find(
            item =>
                String(item.id) ===
                String(alertId)
        );


    if (!alert) {

        showAlertsToast(
            "Alert could not be found.",
            "error"
        );

        return;

    }


    AlertsState.selectedAlert =
        alert;


    const stationName =
        alert.station?.name ||
        alert.station_name ||
        getStationName(
            alert.station_id
        ) ||
        "All stations";


    const modal =
        document.createElement("div");


    modal.className =
        "alerts-modal-overlay";


    modal.id =
        "alertDetailsModal";


    modal.innerHTML = `

        <div class="alerts-modal">

            <div class="alerts-modal-header">

                <h2>
                    Alert Details
                </h2>

                <button
                    class="alerts-modal-close"
                    type="button"
                    id="closeAlertDetails"
                >
                    ×
                </button>

            </div>


            <div class="alerts-modal-body">

                <div class="alert-detail-grid">

                    <div class="alert-detail-item">

                        <div class="alert-detail-label">
                            Title
                        </div>

                        <div class="alert-detail-value">
                            ${escapeAlertHtml(
                                alert.title
                            )}
                        </div>

                    </div>


                    <div class="alert-detail-item">

                        <div class="alert-detail-label">
                            Type
                        </div>

                        <div class="alert-detail-value">
                            ${escapeAlertHtml(
                                alert.type
                            )}
                        </div>

                    </div>


                    <div class="alert-detail-item">

                        <div class="alert-detail-label">
                            Station
                        </div>

                        <div class="alert-detail-value">
                            ${escapeAlertHtml(
                                stationName
                            )}
                        </div>

                    </div>


                    <div class="alert-detail-item">

                        <div class="alert-detail-label">
                            Severity
                        </div>

                        <div class="alert-detail-value">

                            <span
                                class="alert-badge alert-badge-${escapeAlertHtml(
                                    alert.severity
                                )}"
                            >
                                ${escapeAlertHtml(
                                    alert.severity
                                )}
                            </span>

                        </div>

                    </div>


                    <div class="alert-detail-item">

                        <div class="alert-detail-label">
                            Status
                        </div>

                        <div class="alert-detail-value">

                            <span
                                class="alert-badge alert-badge-${escapeAlertHtml(
                                    alert.status
                                )}"
                            >
                                ${escapeAlertHtml(
                                    alert.status
                                )}
                            </span>

                        </div>

                    </div>


                    <div class="alert-detail-item">

                        <div class="alert-detail-label">
                            Created
                        </div>

                        <div class="alert-detail-value">
                            ${escapeAlertHtml(
                                formatAlertDate(
                                    alert.created_at
                                )
                            )}
                        </div>

                    </div>

                </div>


                <div style="height:15px;"></div>


                <div class="alert-detail-label">
                    Message
                </div>

                <div class="alert-detail-message">

                    ${escapeAlertHtml(
                        alert.message
                    )}

                </div>

            </div>


            <div class="alerts-modal-footer">

                ${
                    alert.status !== "resolved"
                        ? `
                            <button
                                class="alerts-btn alerts-btn-warning"
                                type="button"
                                id="modalAcknowledgeAlert"
                            >
                                Acknowledge
                            </button>

                            <button
                                class="alerts-btn alerts-btn-success"
                                type="button"
                                id="modalResolveAlert"
                            >
                                Resolve
                            </button>
                        `
                        : ""
                }


                <button
                    class="alerts-btn alerts-btn-secondary"
                    type="button"
                    id="modalCloseAlert"
                >
                    Close
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    const close =
        () => {

            modal.remove();

            AlertsState.selectedAlert =
                null;

        };


    document
        .getElementById(
            "closeAlertDetails"
        )
        ?.addEventListener(
            "click",
            close
        );


    document
        .getElementById(
            "modalCloseAlert"
        )
        ?.addEventListener(
            "click",
            close
        );


    document
        .getElementById(
            "modalAcknowledgeAlert"
        )
        ?.addEventListener(
            "click",
            async () => {

                await acknowledgeAlert(
                    alert.id
                );

                close();

            }
        );


    document
        .getElementById(
            "modalResolveAlert"
        )
        ?.addEventListener(
            "click",
            async () => {

                await resolveAlert(
                    alert.id
                );

                close();

            }
        );


    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                close();

            }

        }
    );

}


/* =========================================================
   OPEN CREATE ALERT MODAL
========================================================= */

function openCreateAlertModal() {

    console.log(
        "FUELGAP ALERTS - OPEN CREATE MODAL"
    );


    if (!canManageAlerts()) {

        showAlertsToast(
            "Only owner, admin or manager can create alerts.",
            "error"
        );

        return;

    }


    const modal =
        document.createElement("div");


    modal.className =
        "alerts-modal-overlay";


    modal.id =
        "createAlertModal";


    modal.innerHTML = `

        <div class="alerts-modal">

            <div class="alerts-modal-header">

                <h2>
                    Create Alert
                </h2>

                <button
                    class="alerts-modal-close"
                    type="button"
                    id="closeCreateAlertModal"
                >
                    ×
                </button>

            </div>


            <div class="alerts-modal-body">

                <form id="createAlertForm">

                    <div class="alerts-form-grid">

                        <div class="alerts-field alerts-form-full">

                            <label>
                                Alert Title
                            </label>

                            <input
                                type="text"
                                id="createAlertTitle"
                                required
                                maxlength="255"
                                placeholder="Enter alert title"
                            >

                        </div>


                        <div class="alerts-field">

                            <label>
                                Type
                            </label>

                            <select
                                id="createAlertType"
                            >

                                <option value="gap_variance">
                                    Gap Variance
                                </option>

                                <option value="operational">
                                    Operational
                                </option>

                                <option value="payment">
                                    Payment
                                </option>

                                <option value="meter">
                                    Meter
                                </option>

                                <option value="system">
                                    System
                                </option>

                            </select>

                        </div>


                        <div class="alerts-field">

                            <label>
                                Severity
                            </label>

                            <select
                                id="createAlertSeverity"
                            >

                                <option value="info">
                                    Info
                                </option>

                                <option value="warning" selected>
                                    Warning
                                </option>

                                <option value="high">
                                    High
                                </option>

                                <option value="critical">
                                    Critical
                                </option>

                            </select>

                        </div>


                        <div class="alerts-field alerts-form-full">

                            <label>
                                Station
                            </label>

                            <select
                                id="createAlertStation"
                            >

                                <option value="">
                                    No specific station
                                </option>

                                ${AlertsState.stations
                                    .map(
                                        station => {

                                            const id =
                                                station.id ||
                                                station.station_id;

                                            const name =
                                                station.name ||
                                                station.station_name ||
                                                `Station ${id}`;

                                            return `

                                                <option
                                                    value="${escapeAlertHtml(
                                                        id
                                                    )}"
                                                >
                                                    ${escapeAlertHtml(
                                                        name
                                                    )}
                                                </option>

                                            `;

                                        }
                                    )
                                    .join("")}

                            </select>

                        </div>


                        <div class="alerts-field alerts-form-full">

                            <label>
                                Message
                            </label>

                            <textarea
                                id="createAlertMessage"
                                required
                                placeholder="Describe the alert and required action..."
                            ></textarea>

                        </div>

                    </div>

                </form>

            </div>


            <div class="alerts-modal-footer">

                <button
                    class="alerts-btn alerts-btn-secondary"
                    type="button"
                    id="cancelCreateAlert"
                >
                    Cancel
                </button>


                <button
                    class="alerts-btn alerts-btn-primary"
                    type="button"
                    id="submitCreateAlert"
                >
                    Create Alert
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    const closeModal =
        () => {

            modal.remove();

        };


    document
        .getElementById(
            "closeCreateAlertModal"
        )
        ?.addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById(
            "cancelCreateAlert"
        )
        ?.addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById(
            "submitCreateAlert"
        )
        ?.addEventListener(
            "click",
            submitCreateAlert
        );


    modal.addEventListener(
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


/* =========================================================
   SUBMIT CREATE ALERT
========================================================= */

async function submitCreateAlert() {

    if (
        AlertsState.isCreating
    ) {
        return;
    }


    if (!canManageAlerts()) {

        showAlertsToast(
            "You do not have permission to create alerts.",
            "error"
        );

        return;

    }


    const title =
        document
            .getElementById(
                "createAlertTitle"
            )
            ?.value
            .trim();


    const type =
        document
            .getElementById(
                "createAlertType"
            )
            ?.value ||
        "gap_variance";


    const severity =
        document
            .getElementById(
                "createAlertSeverity"
            )
            ?.value ||
        "warning";


    const station_id =
        document
            .getElementById(
                "createAlertStation"
            )
            ?.value ||
        "";


    const message =
        document
            .getElementById(
                "createAlertMessage"
            )
            ?.value
            .trim();


    if (!title) {

        showAlertsToast(
            "Please enter an alert title.",
            "error"
        );

        return;

    }


    if (!message) {

        showAlertsToast(
            "Please enter an alert message.",
            "error"
        );

        return;

    }


    const submitButton =
        document.getElementById(
            "submitCreateAlert"
        );


    AlertsState.isCreating =
        true;


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.textContent =
            "Creating...";

    }


    try {

        const payload = {

            type,

            severity,

            title,

            message,

            status: "new"

        };


        if (station_id) {

            payload.station_id =
                station_id;

        }


        console.log(
            "FUELGAP ALERTS - CREATE PAYLOAD:",
            payload
        );


        const response =
            await FuelGapAPI.createAlert(
                payload
            );


        console.log(
            "FUELGAP ALERTS - CREATE RESPONSE:",
            response
        );


        showAlertsToast(
            "Alert created successfully.",
            "success"
        );


        document
            .getElementById(
                "createAlertModal"
            )
            ?.remove();


        await loadAlerts();


    } catch (error) {

        console.error(
            "FUELGAP ALERTS - CREATE ERROR:",
            error
        );


        showAlertsToast(
            error.message ||
            "Unable to create alert.",
            "error"
        );


    } finally {

        AlertsState.isCreating =
            false;


        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                "Create Alert";

        }

    }

}


/* =========================================================
   ACKNOWLEDGE ALERT
========================================================= */

async function acknowledgeAlert(
    alertId
) {

    if (
        AlertsState.isProcessing
    ) {
        return;
    }


    if (!alertId) {
        return;
    }


    AlertsState.isProcessing =
        true;


    try {

        await FuelGapAPI.acknowledgeAlert(
            alertId
        );


        showAlertsToast(
            "Alert acknowledged successfully.",
            "success"
        );


        await loadAlerts();


    } catch (error) {

        console.error(
            "FUELGAP ALERTS - ACKNOWLEDGE ERROR:",
            error
        );


        showAlertsToast(
            error.message ||
            "Unable to acknowledge alert.",
            "error"
        );


    } finally {

        AlertsState.isProcessing =
            false;

    }

}


/* =========================================================
   RESOLVE ALERT
========================================================= */

async function resolveAlert(
    alertId
) {

    if (
        AlertsState.isProcessing
    ) {
        return;
    }


    if (!alertId) {
        return;
    }


    AlertsState.isProcessing =
        true;


    try {

        await FuelGapAPI.resolveAlert(
            alertId
        );


        showAlertsToast(
            "Alert resolved successfully.",
            "success"
        );


        await loadAlerts();


    } catch (error) {

        console.error(
            "FUELGAP ALERTS - RESOLVE ERROR:",
            error
        );


        showAlertsToast(
            error.message ||
            "Unable to resolve alert.",
            "error"
        );


    } finally {

        AlertsState.isProcessing =
            false;

    }

}


/* =========================================================
   DELETE ALERT
========================================================= */

async function deleteAlert(
    alertId
) {

    if (
        AlertsState.isProcessing
    ) {
        return;
    }


    if (!canManageAlerts()) {

        showAlertsToast(
            "You do not have permission to delete alerts.",
            "error"
        );

        return;

    }


    if (!alertId) {
        return;
    }


    const confirmed =
        window.confirm(
            "Are you sure you want to permanently delete this alert?"
        );


    if (!confirmed) {
        return;
    }


    AlertsState.isProcessing =
        true;


    try {

        await FuelGapAPI.deleteAlert(
            alertId
        );


        showAlertsToast(
            "Alert deleted successfully.",
            "success"
        );


        await loadAlerts();


    } catch (error) {

        console.error(
            "FUELGAP ALERTS - DELETE ERROR:",
            error
        );


        showAlertsToast(
            error.message ||
            "Unable to delete alert.",
            "error"
        );


    } finally {

        AlertsState.isProcessing =
            false;

    }

}


/* =========================================================
   AUTO REFRESH
========================================================= */

function startAlertsAutoRefresh() {

    stopAlertsAutoRefresh();


    AlertsState.autoRefreshTimer =
        setInterval(
            async () => {

                try {

                    await loadAlerts();

                } catch (error) {

                    console.warn(
                        "Alerts auto-refresh failed:",
                        error
                    );

                }

            },
            30000
        );

}


/* =========================================================
   STOP AUTO REFRESH
========================================================= */

function stopAlertsAutoRefresh() {

    if (
        AlertsState.autoRefreshTimer
    ) {

        clearInterval(
            AlertsState.autoRefreshTimer
        );


        AlertsState.autoRefreshTimer =
            null;

    }

}


/* =========================================================
   INITIALIZE ALERTS
========================================================= */

async function initializeAlerts() {

    try {

        console.log(
            "=============================================="
        );

        console.log(
            "FUELGAP ALERTS - INITIALIZING"
        );

        console.log(
            "=============================================="
        );


        /* =================================================
           GET CURRENT USER
        ================================================= */

        AlertsState.currentUser =
            await getAlertsCurrentUser();


        console.log(
            "FUELGAP ALERTS - INITIALIZED USER:",
            AlertsState.currentUser
        );


        console.log(
            "FUELGAP ALERTS - CAN MANAGE:",
            canManageAlerts()
        );


        if (
            !AlertsState.currentUser
        ) {

            console.warn(
                "FuelGap Alerts: current user not available."
            );

        }


        /* =================================================
           INITIAL RENDER
        ================================================= */

        renderAlertsPage();


        /* =================================================
           LOAD STATIONS
        ================================================= */

        await loadAlertStations();


        populateAlertStationFilter();


        /* =================================================
           LOAD ALERTS
        ================================================= */

        await loadAlerts();


        /* =================================================
           AUTO REFRESH
        ================================================= */

        startAlertsAutoRefresh();


        console.log(
            "FUELGAP ALERTS - INITIALIZATION COMPLETE"
        );


    } catch (error) {

        console.error(
            "FuelGap Alerts initialization error:",
            error
        );


        renderAlertsError(
            error.message ||
            "Unable to initialize alerts."
        );

    }

}


/* =========================================================
   PAGE CLEANUP
========================================================= */

function destroyAlerts() {

    stopAlertsAutoRefresh();


    AlertsState.alerts = [];

    AlertsState.filteredAlerts = [];

    AlertsState.stations = [];

    AlertsState.selectedAlert = null;

}


/* =========================================================
   GLOBAL EXPORT
========================================================= */

window.FuelGapAlerts = {

    initialize:
        initializeAlerts,

    destroy:
        destroyAlerts,

    loadAlerts:
        loadAlerts,

    loadStations:
        loadAlertStations,

    createAlert:
        openCreateAlertModal,

    acknowledgeAlert:
        acknowledgeAlert,

    resolveAlert:
        resolveAlert,

    deleteAlert:
        deleteAlert,

    canManageAlerts:
        canManageAlerts

};


/* =========================================================
   AUTO INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /*
            The dashboard/page loader may insert
            #pageContent after DOMContentLoaded.

            We therefore wait briefly before checking.
        */

        const start =
            () => {

                if (
                    document.getElementById(
                        "pageContent"
                    )
                ) {

                    initializeAlerts();

                } else {

                    setTimeout(
                        start,
                        250
                    );

                }

            };


        start();

    }
);