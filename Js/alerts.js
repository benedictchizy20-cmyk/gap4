/* ==========================================
   FUELGAP - ALERTS
========================================== */


/* ==========================================
   STORAGE KEYS
========================================== */

const ALERTS_STORAGE_KEY =
    "fuelgap_alerts";


const ALERTS_STATIONS_STORAGE_KEY =
    "fuelgap_stations";


/* ==========================================
   PAGE LOAD
========================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const currentUser =
            FuelGapUtils.getCurrentUser();


        if (!currentUser) {

            window.location.href =
                "../login.html";

            return;

        }


        /*
           CHECK PERMISSION
        */

        if (
            typeof hasPermission === "function" &&
            !hasPermission(
                currentUser.role,
                "alerts"
            )
        ) {

            window.location.href =
                "./dashboard.html";

            return;

        }


        /*
           WAIT FOR APP.JS TO
           CREATE PAGE CONTENT
        */

        setTimeout(
            () => {

                renderAlertsPage();

                setupAlertEvents();

                renderAlerts();

            },
            0
        );

    }
);


/* ==========================================
   SAFE GET STORAGE DATA
========================================== */

function getAlertsStorageData(
    storageKey
) {

    try {

        const data =
            localStorage.getItem(
                storageKey
            );


        if (!data) {

            return [];

        }


        const parsed =
            JSON.parse(data);


        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch (error) {

        console.error(
            `Unable to load ${storageKey}:`,
            error
        );


        return [];

    }

}


/* ==========================================
   SAVE STORAGE DATA
========================================== */

function saveAlertsStorageData(
    storageKey,
    data
) {

    localStorage.setItem(
        storageKey,
        JSON.stringify(data)
    );

}


/* ==========================================
   GET ALERTS
========================================== */

function getAlerts() {

    return getAlertsStorageData(
        ALERTS_STORAGE_KEY
    );

}


/* ==========================================
   GET STATIONS
========================================== */

function getAlertStations() {

    return getAlertsStorageData(
        ALERTS_STATIONS_STORAGE_KEY
    );

}


/* ==========================================
   GET CURRENT USER
========================================== */

function getAlertsCurrentUser() {

    return FuelGapUtils.getCurrentUser();

}


/* ==========================================
   GET VISIBLE STATIONS
========================================== */

function getVisibleAlertStations() {

    const currentUser =
        getAlertsCurrentUser();


    const stations =
        getAlertStations();


    if (!currentUser) {

        return [];

    }


    /*
       ADMIN CAN SEE ALL
    */

    if (
        currentUser.role ===
        "admin"
    ) {

        return stations;

    }


    /*
       OWNER CAN SEE
       ORGANIZATION STATIONS
    */

    if (
        currentUser.role ===
        "owner"
    ) {

        return stations.filter(
            station =>
                station.organizationId ===
                currentUser.organizationId
        );

    }


    /*
       MANAGER CAN SEE
       ASSIGNED STATION
    */

    if (
        currentUser.role ===
        "manager"
    ) {

        if (
            currentUser.stationId
        ) {

            return stations.filter(
                station =>
                    station.id ===
                    currentUser.stationId
            );

        }


        return stations.filter(
            station =>
                station.organizationId ===
                currentUser.organizationId
        );

    }


    /*
       STAFF / ATTENDANT
       CAN ONLY SEE
       ASSIGNED STATION
    */

    if (
        currentUser.role ===
            "staff" ||

        currentUser.role ===
            "attendant"
    ) {

        if (
            currentUser.stationId
        ) {

            return stations.filter(
                station =>
                    station.id ===
                    currentUser.stationId
            );

        }

    }


    return [];

}


/* ==========================================
   GET VISIBLE STATION IDS
========================================== */

function getVisibleAlertStationIds() {

    return getVisibleAlertStations()
        .map(
            station =>
                station.id
        );

}


/* ==========================================
   GET VISIBLE ALERTS
========================================== */

function getVisibleAlerts() {

    const currentUser =
        getAlertsCurrentUser();


    const alerts =
        getAlerts();


    if (!currentUser) {

        return [];

    }


    /*
       FUELGAP ADMIN
       CAN SEE EVERYTHING
    */

    if (
        currentUser.role ===
        "admin"
    ) {

        return alerts;

    }


    const visibleStationIds =
        getVisibleAlertStationIds();


    return alerts.filter(
        alert => {

            /*
               STATION ALERT
            */

            if (
                alert.stationId &&
                visibleStationIds.includes(
                    alert.stationId
                )
            ) {

                return true;

            }


            /*
               ORGANIZATION ALERT
            */

            if (
                alert.organizationId &&
                alert.organizationId ===
                currentUser.organizationId
            ) {

                return true;

            }


            return false;

        }
    );

}


/* ==========================================
   RENDER ALERTS PAGE
========================================== */

function renderAlertsPage() {

    const pageContent =
        document.getElementById(
            "pageContent"
        );


    if (!pageContent) {

        return;

    }


    pageContent.innerHTML = `

        <div class="alerts-page">


            <!-- =================================
                 PAGE HEADER
            ================================== -->

            <div class="page-header">

                <div>

                    <p class="page-eyebrow">
                        SYSTEM MONITORING
                    </p>


                    <h1>
                        Alerts
                    </h1>


                    <p>
                        Monitor fuel gaps, variances
                        and important station activities.
                    </p>

                </div>


                <button
                    type="button"
                    class="btn btn-primary"
                    id="refreshAlertsButton"
                >
                    Refresh Alerts
                </button>

            </div>



            <!-- =================================
                 ALERT SUMMARY
            ================================== -->

            <div class="alert-summary">


                <div class="alert-summary-card">

                    <span>
                        Total Alerts
                    </span>


                    <strong
                        id="totalAlertsCount"
                    >
                        0
                    </strong>

                </div>



                <div class="alert-summary-card">

                    <span>
                        Unresolved
                    </span>


                    <strong
                        id="unresolvedAlertsCount"
                    >
                        0
                    </strong>

                </div>



                <div class="alert-summary-card">

                    <span>
                        Resolved
                    </span>


                    <strong
                        id="resolvedAlertsCount"
                    >
                        0
                    </strong>

                </div>


            </div>



            <!-- =================================
                 FILTER SECTION
            ================================== -->

            <section class="pump-section">


                <div class="section-header">

                    <div>

                        <h2>
                            Alert Activity
                        </h2>


                        <p>
                            Review and resolve important
                            fuel station alerts.
                        </p>

                    </div>

                </div>



                <!-- FILTERS -->

                <div class="sales-filters">


                    <select
                        id="alertStatusFilter"
                    >

                        <option value="">
                            All Statuses
                        </option>


                        <option value="unresolved">
                            Unresolved
                        </option>


                        <option value="resolved">
                            Resolved
                        </option>

                    </select>



                    <select
                        id="alertTypeFilter"
                    >

                        <option value="">
                            All Alert Types
                        </option>


                        <option value="critical_gap">
                            Critical Gap
                        </option>


                        <option value="variance">
                            Variance
                        </option>


                        <option value="system">
                            System
                        </option>

                    </select>



                    <input
                        type="search"
                        id="alertSearch"
                        placeholder="Search alerts..."
                    >

                </div>



                <!-- ALERT LIST -->

                <div
                    id="alertsContainer"
                ></div>



                <!-- EMPTY STATE -->

                <div
                    id="emptyAlertsState"
                    class="empty-state hidden"
                >

                    <h3>
                        No alerts found
                    </h3>


                    <p>
                        Everything looks good.
                        No alerts require attention.
                    </p>

                </div>


            </section>


        </div>

    `;

}


/* ==========================================
   SETUP EVENTS
========================================== */

function setupAlertEvents() {

    const refreshButton =
        document.getElementById(
            "refreshAlertsButton"
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


    /*
       REFRESH
    */

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            () => {

                renderAlerts();

            }
        );

    }


    /*
       STATUS FILTER
    */

    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            () => {

                renderAlerts();

            }
        );

    }


    /*
       TYPE FILTER
    */

    if (typeFilter) {

        typeFilter.addEventListener(
            "change",
            () => {

                renderAlerts();

            }
        );

    }


    /*
       SEARCH
    */

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            () => {

                renderAlerts();

            }
        );

    }

}


/* ==========================================
   GET FILTER VALUES
========================================== */

function getAlertFilters() {

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


    return {

        status:
            statusFilter
                ? statusFilter.value
                : "",

        type:
            typeFilter
                ? typeFilter.value
                : "",

        search:
            searchInput
                ? searchInput.value
                    .toLowerCase()
                    .trim()
                : ""

    };

}


/* ==========================================
   FILTER ALERTS
========================================== */

function filterAlerts(
    alerts,
    filters
) {

    return alerts.filter(
        alert => {

            /*
               STATUS FILTER
            */

            if (
                filters.status &&
                alert.status !==
                filters.status
            ) {

                return false;

            }


            /*
               TYPE FILTER
            */

            if (
                filters.type &&
                alert.type !==
                filters.type
            ) {

                return false;

            }


            /*
               SEARCH FILTER
            */

            if (
                filters.search
            ) {

                const searchText =
                    `
                        ${alert.title || ""}
                        ${alert.message || ""}
                        ${alert.stationName || ""}
                        ${alert.shiftName || ""}
                        ${alert.staffName || ""}
                    `
                        .toLowerCase();


                if (
                    !searchText.includes(
                        filters.search
                    )
                ) {

                    return false;

                }

            }


            return true;

        }
    );

}


/* ==========================================
   RENDER ALERTS
========================================== */

function renderAlerts() {

    const alerts =
        getVisibleAlerts();


    const filters =
        getAlertFilters();


    const filteredAlerts =
        filterAlerts(
            alerts,
            filters
        );


    const container =
        document.getElementById(
            "alertsContainer"
        );


    const emptyState =
        document.getElementById(
            "emptyAlertsState"
        );


    if (!container) {

        return;

    }


    /*
       CLEAR OLD ALERTS
    */

    container.innerHTML =
        "";


    /*
       SORT ALERTS

       UNRESOLVED FIRST
       THEN NEWEST FIRST
    */

    filteredAlerts.sort(
        (
            a,
            b
        ) => {

            if (
                a.status ===
                    "unresolved" &&

                b.status ===
                    "resolved"
            ) {

                return -1;

            }


            if (
                a.status ===
                    "resolved" &&

                b.status ===
                    "unresolved"
            ) {

                return 1;

            }


            return (
                new Date(
                    b.createdAt
                ) -

                new Date(
                    a.createdAt
                )
            );

        }
    );


    /*
       EMPTY STATE
    */

    if (
        filteredAlerts.length ===
        0
    ) {

        if (emptyState) {

            emptyState.classList.remove(
                "hidden"
            );

        }

    } else {

        if (emptyState) {

            emptyState.classList.add(
                "hidden"
            );

        }


        /*
           CREATE ALERT CARDS
        */

        filteredAlerts.forEach(
            alert => {

                const alertItem =
                    document.createElement(
                        "div"
                    );


                const alertStatus =
                    alert.status ||
                    "unresolved";


                alertItem.className =
                    `
                        alert-item
                        alert-status-${alertStatus}
                    `;


                alertItem.innerHTML = `

                    <div
                        class="alert-item-header"
                    >


                        <div>

                            <h3>

                                ${escapeAlertHTML(
                                    alert.title ||
                                    "System Alert"
                                )}

                            </h3>


                            <p>

                                ${escapeAlertHTML(
                                    alert.message ||
                                    "No alert message available."
                                )}

                            </p>

                        </div>


                        <div>

                            ${renderAlertStatus(
                                alertStatus
                            )}

                        </div>


                    </div>



                    <div
                        class="alert-meta"
                    >


                        <span>

                            Station:

                            <strong>

                                ${escapeAlertHTML(
                                    alert.stationName ||
                                    "System"
                                )}

                            </strong>

                        </span>



                        <span>

                            Shift:

                            <strong>

                                ${escapeAlertHTML(
                                    alert.shiftName ||
                                    "N/A"
                                )}

                            </strong>

                        </span>



                        <span>

                            Staff:

                            <strong>

                                ${escapeAlertHTML(
                                    alert.staffName ||
                                    "N/A"
                                )}

                            </strong>

                        </span>



                        <span>

                            Amount:

                            <strong>

                                ${formatAlertCurrency(
                                    alert.amount
                                )}

                            </strong>

                        </span>



                        <span>

                            Created:

                            <strong>

                                ${formatAlertDate(
                                    alert.createdAt
                                )}

                            </strong>

                        </span>


                    </div>



                    <div
                        class="alert-actions"
                    >


                        ${renderAlertActions(
                            alert
                        )}


                    </div>

                `;


                container.appendChild(
                    alertItem
                );

            }
        );


        /*
           SETUP ACTION BUTTONS
        */

        setupAlertActionButtons();

    }


    /*
       UPDATE SUMMARY
    */

    updateAlertSummary(
        alerts
    );

}


/* ==========================================
   RENDER ALERT STATUS
========================================== */

function renderAlertStatus(
    status
) {

    if (
        status ===
        "resolved"
    ) {

        return `

            <span
                class="status-badge status-online"
            >
                Resolved
            </span>

        `;

    }


    return `

        <span
            class="status-badge"
        >
            Unresolved
        </span>

    `;

}


/* ==========================================
   RENDER ALERT ACTIONS
========================================== */

function renderAlertActions(
    alert
) {

    /*
       RESOLVED ALERT
    */

    if (
        alert.status ===
        "resolved"
    ) {

        return `

            <button
                type="button"
                class="btn btn-outline btn-small"
                data-view-alert="${alert.id}"
            >
                View Details
            </button>

        `;

    }


    /*
       UNRESOLVED ALERT
    */

    return `

        <button
            type="button"
            class="btn btn-primary btn-small"
            data-resolve-alert="${alert.id}"
        >
            Mark Resolved
        </button>


        <button
            type="button"
            class="btn btn-outline btn-small"
            data-view-alert="${alert.id}"
        >
            View Details
        </button>

    `;

}


/* ==========================================
   SETUP ACTION BUTTONS
========================================== */

function setupAlertActionButtons() {

    /*
       RESOLVE BUTTONS
    */

    const resolveButtons =
        document.querySelectorAll(
            "[data-resolve-alert]"
        );


    resolveButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const alertId =
                        button.getAttribute(
                            "data-resolve-alert"
                        );


                    resolveAlert(
                        alertId
                    );

                }
            );

        }
    );


    /*
       VIEW BUTTONS
    */

    const viewButtons =
        document.querySelectorAll(
            "[data-view-alert]"
        );


    viewButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const alertId =
                        button.getAttribute(
                            "data-view-alert"
                        );


                    viewAlertDetails(
                        alertId
                    );

                }
            );

        }
    );

}


/* ==========================================
   RESOLVE ALERT
========================================== */

function resolveAlert(
    alertId
) {

    const currentUser =
        getAlertsCurrentUser();


    if (!currentUser) {

        return;

    }


    /*
       CONFIRM ACTION
    */

    const confirmed =
        window.confirm(
            "Are you sure you want to mark this alert as resolved?"
        );


    if (!confirmed) {

        return;

    }


    const alerts =
        getAlerts();


    const alertIndex =
        alerts.findIndex(
            alert =>
                alert.id ===
                alertId
        );


    if (
        alertIndex ===
        -1
    ) {

        return;

    }


    /*
       UPDATE ALERT
    */

    alerts[
        alertIndex
    ].status =
        "resolved";


    alerts[
        alertIndex
    ].resolvedAt =
        new Date()
            .toISOString();


    alerts[
        alertIndex
    ].resolvedBy =
        currentUser.id ||
        currentUser.email ||
        "Unknown User";


    /*
       SAVE
    */

    saveAlertsStorageData(
        ALERTS_STORAGE_KEY,
        alerts
    );


    /*
       REFRESH PAGE
    */

    renderAlerts();

}


/* ==========================================
   VIEW ALERT DETAILS
========================================== */

function viewAlertDetails(
    alertId
) {

    const alerts =
        getVisibleAlerts();


    const alert =
        alerts.find(
            item =>
                item.id ===
                alertId
        );


    if (!alert) {

        return;

    }


    const details = `

ALERT DETAILS

Title:
${alert.title || "System Alert"}

Status:
${alert.status || "unresolved"}

Station:
${alert.stationName || "System"}

Shift:
${alert.shiftName || "N/A"}

Staff:
${alert.staffName || "N/A"}

Amount:
${formatAlertCurrency(
    alert.amount
)}

Variance:
${Number(
    alert.variancePercentage || 0
).toFixed(2)}%

Created:
${formatAlertDate(
    alert.createdAt
)}

${alert.resolvedAt
    ? `Resolved:
${formatAlertDate(
    alert.resolvedAt
)}`
    : ""
}

Message:
${alert.message || "No message available."}

    `;


    window.alert(
        details
    );

}


/* ==========================================
   UPDATE ALERT SUMMARY
========================================== */

function updateAlertSummary(
    alerts
) {

    const total =
        alerts.length;


    const unresolved =
        alerts.filter(
            alert =>
                alert.status !==
                "resolved"
        ).length;


    const resolved =
        alerts.filter(
            alert =>
                alert.status ===
                "resolved"
        ).length;


    const totalElement =
        document.getElementById(
            "totalAlertsCount"
        );


    const unresolvedElement =
        document.getElementById(
            "unresolvedAlertsCount"
        );


    const resolvedElement =
        document.getElementById(
            "resolvedAlertsCount"
        );


    if (
        totalElement
    ) {

        totalElement.textContent =
            total;

    }


    if (
        unresolvedElement
    ) {

        unresolvedElement.textContent =
            unresolved;

    }


    if (
        resolvedElement
    ) {

        resolvedElement.textContent =
            resolved;

    }

}


/* ==========================================
   FORMAT CURRENCY
========================================== */

function formatAlertCurrency(
    amount
) {

    const value =
        Number(
            amount
        ) || 0;


    return value.toLocaleString(
        "en-NG",
        {

            style:
                "currency",

            currency:
                "NGN",

            minimumFractionDigits:
                2,

            maximumFractionDigits:
                2

        }
    );

}


/* ==========================================
   FORMAT DATE
========================================== */

function formatAlertDate(
    date
) {

    if (!date) {

        return "N/A";

    }


    const parsedDate =
        new Date(
            date
        );


    if (
        Number.isNaN(
            parsedDate.getTime()
        )
    ) {

        return "N/A";

    }


    return parsedDate.toLocaleString(
        "en-NG",
        {

            dateStyle:
                "medium",

            timeStyle:
                "short"

        }
    );

}


/* ==========================================
   ESCAPE HTML
========================================== */

function escapeAlertHTML(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(
            value
        );


    return div.innerHTML;

}