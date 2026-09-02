/* ==========================================
   FUELGAP - PROFESSIONAL ALERTS
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
            getAlertsCurrentUser();


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
   SAFE STORAGE
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
   SAVE STORAGE
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
   CURRENT USER
========================================== */

function getAlertsCurrentUser() {

    if (
        typeof FuelGapUtils !==
        "undefined" &&

        typeof FuelGapUtils.getCurrentUser ===
        "function"
    ) {

        return FuelGapUtils.getCurrentUser();

    }


    return null;

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
       ADMIN
    */

    if (
        currentUser.role ===
        "admin"
    ) {

        return stations;

    }


    /*
       OWNER
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
       MANAGER
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
       ADMIN
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
   RENDER PAGE
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


            <!-- ================================
                 PAGE HEADER
            ================================= -->

            <div class="page-header alerts-header">


                <div>

                    <p class="page-eyebrow">

                        SYSTEM MONITORING

                    </p>


                    <h1>

                        Alerts Center

                    </h1>


                    <p>

                        Monitor critical fuel gaps,
                        variances and important
                        station activities.

                    </p>

                </div>


                <div class="alerts-header-actions">


                    <button
                        type="button"
                        class="btn btn-outline"
                        id="clearAlertFiltersButton"
                    >

                        Clear Filters

                    </button>


                    <button
                        type="button"
                        class="btn btn-primary"
                        id="refreshAlertsButton"
                    >

                        Refresh Alerts

                    </button>


                </div>


            </div>



            <!-- ================================
                 SUMMARY CARDS
            ================================= -->

            <div class="alert-summary">


                <!-- TOTAL -->

                <div class="alert-summary-card total-alert-card">


                    <div
                        class="alert-summary-icon"
                    >

                        🔔

                    </div>


                    <div>

                        <span>

                            Total Alerts

                        </span>


                        <strong
                            id="totalAlertsCount"
                        >

                            0

                        </strong>

                    </div>


                </div>



                <!-- UNRESOLVED -->

                <div
                    class="alert-summary-card unresolved-alert-card"
                >


                    <div
                        class="alert-summary-icon"
                    >

                        ⚠️

                    </div>


                    <div>

                        <span>

                            Requires Attention

                        </span>


                        <strong
                            id="unresolvedAlertsCount"
                        >

                            0

                        </strong>

                    </div>


                </div>



                <!-- CRITICAL -->

                <div
                    class="alert-summary-card critical-alert-card"
                >


                    <div
                        class="alert-summary-icon"
                    >

                        🚨

                    </div>


                    <div>

                        <span>

                            Critical Alerts

                        </span>


                        <strong
                            id="criticalAlertsCount"
                        >

                            0

                        </strong>

                    </div>


                </div>



                <!-- RESOLVED -->

                <div
                    class="alert-summary-card resolved-alert-card"
                >


                    <div
                        class="alert-summary-icon"
                    >

                        ✓

                    </div>


                    <div>

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


            </div>



            <!-- ================================
                 ALERT ACTIVITY
            ================================= -->

            <section
                class="pump-section alerts-section"
            >


                <div
                    class="section-header"
                >


                    <div>

                        <h2>

                            Alert Activity

                        </h2>


                        <p>

                            Review, investigate and
                            resolve station issues.

                        </p>

                    </div>


                    <div
                        class="alert-live-indicator"
                    >

                        <span
                            class="live-dot"
                        ></span>

                        Monitoring Active

                    </div>


                </div>



                <!-- ============================
                     FILTERS
                ============================= -->

                <div
                    class="alerts-filter-panel"
                >


                    <div
                        class="alert-filter-group"
                    >

                        <label>

                            Status

                        </label>


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


                    </div>



                    <div
                        class="alert-filter-group"
                    >

                        <label>

                            Alert Type

                        </label>


                        <select
                            id="alertTypeFilter"
                        >

                            <option value="">

                                All Types

                            </option>


                            <option value="critical_gap">

                                Critical Gap

                            </option>


                            <option value="variance">

                                Variance

                            </option>


                            <option value="payment">

                                Payment Issue

                            </option>


                            <option value="reading">

                                Meter Reading

                            </option>


                            <option value="system">

                                System

                            </option>


                        </select>


                    </div>



                    <div
                        class="alert-filter-group"
                    >

                        <label>

                            Severity

                        </label>


                        <select
                            id="alertSeverityFilter"
                        >

                            <option value="">

                                All Severity

                            </option>


                            <option value="critical">

                                Critical

                            </option>


                            <option value="high">

                                High

                            </option>


                            <option value="medium">

                                Medium

                            </option>


                            <option value="low">

                                Low

                            </option>


                        </select>


                    </div>



                    <div
                        class="alert-search-group"
                    >

                        <label>

                            Search

                        </label>


                        <input
                            type="search"
                            id="alertSearch"
                            placeholder="Search station, staff or alert..."
                        >


                    </div>


                </div>



                <!-- ============================
                     RESULTS BAR
                ============================= -->

                <div
                    class="alerts-results-bar"
                >


                    <p
                        id="alertsResultsText"
                    >

                        0 alerts found

                    </p>


                </div>



                <!-- ============================
                     ALERT LIST
                ============================= -->

                <div
                    id="alertsContainer"
                    class="alerts-container"
                ></div>



                <!-- ============================
                     EMPTY STATE
                ============================= -->

                <div
                    id="emptyAlertsState"
                    class="empty-state hidden"
                >


                    <div
                        class="empty-alert-icon"
                    >

                        ✓

                    </div>


                    <h3>

                        No alerts found

                    </h3>


                    <p>

                        Everything looks good.
                        No alerts currently require
                        your attention.

                    </p>


                </div>


            </section>



            <!-- ================================
                 ALERT DETAILS MODAL
            ================================= -->

            <div
                id="alertDetailsModal"
                class="alert-modal hidden"
            >


                <div
                    class="alert-modal-backdrop"
                    data-close-alert-modal
                ></div>


                <div
                    class="alert-modal-card"
                >


                    <button
                        type="button"
                        class="alert-modal-close"
                        data-close-alert-modal
                    >

                        ×

                    </button>


                    <div
                        id="alertDetailsContent"
                    ></div>


                </div>


            </div>


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


    const clearFiltersButton =
        document.getElementById(
            "clearAlertFiltersButton"
        );


    const statusFilter =
        document.getElementById(
            "alertStatusFilter"
        );


    const typeFilter =
        document.getElementById(
            "alertTypeFilter"
        );


    const severityFilter =
        document.getElementById(
            "alertSeverityFilter"
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
       CLEAR FILTERS
    */

    if (clearFiltersButton) {

        clearFiltersButton.addEventListener(
            "click",
            () => {

                clearAlertFilters();

            }
        );

    }


    /*
       FILTER EVENTS
    */

    [
        statusFilter,
        typeFilter,
        severityFilter
    ]
        .filter(Boolean)
        .forEach(
            element => {

                element.addEventListener(
                    "change",
                    () => {

                        renderAlerts();

                    }
                );

            }
        );


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


    /*
       CLOSE MODAL
    */

    document.addEventListener(
        "click",
        event => {

            if (

                event.target.matches(
                    "[data-close-alert-modal]"
                )

            ) {

                closeAlertModal();

            }

        }
    );


    /*
       ESC KEY
    */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeAlertModal();

            }

        }
    );

}


/* ==========================================
   CLEAR FILTERS
========================================== */

function clearAlertFilters() {

    const filters = [

        "alertStatusFilter",

        "alertTypeFilter",

        "alertSeverityFilter",

        "alertSearch"

    ];


    filters.forEach(
        id => {

            const element =
                document.getElementById(
                    id
                );


            if (element) {

                element.value =
                    "";

            }

        }
    );


    renderAlerts();

}


/* ==========================================
   GET FILTERS
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


    const severityFilter =
        document.getElementById(
            "alertSeverityFilter"
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


        severity:
            severityFilter
                ? severityFilter.value
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

            const status =
                alert.status ||
                "unresolved";


            const severity =
                getAlertSeverity(
                    alert
                );


            /*
               STATUS
            */

            if (

                filters.status &&

                status !==
                filters.status

            ) {

                return false;

            }


            /*
               TYPE
            */

            if (

                filters.type &&

                alert.type !==
                filters.type

            ) {

                return false;

            }


            /*
               SEVERITY
            */

            if (

                filters.severity &&

                severity !==
                filters.severity

            ) {

                return false;

            }


            /*
               SEARCH
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

                        ${alert.type || ""}

                        ${severity}

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
   GET ALERT SEVERITY
========================================== */

function getAlertSeverity(
    alert
) {

    if (
        alert.severity
    ) {

        return String(
            alert.severity
        )
            .toLowerCase();

    }


    if (

        alert.type ===
        "critical_gap"

    ) {

        return "critical";

    }


    const variance =
        Math.abs(
            Number(
                alert.variancePercentage
            ) || 0
        );


    if (
        variance >= 10
    ) {

        return "critical";

    }


    if (
        variance >= 5
    ) {

        return "high";

    }


    if (
        variance >= 2
    ) {

        return "medium";

    }


    return "low";

}


/* ==========================================
   GET ALERT ICON
========================================== */

function getAlertIcon(
    type
) {

    const icons = {

        critical_gap:
            "🚨",

        variance:
            "📊",

        payment:
            "💳",

        reading:
            "⛽",

        system:
            "⚙️"

    };


    return (
        icons[type] ||
        "🔔"
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


    const resultsText =
        document.getElementById(
            "alertsResultsText"
        );


    if (!container) {

        return;

    }


    /*
       SORT

       UNRESOLVED FIRST
       CRITICAL FIRST
       NEWEST FIRST
    */

    filteredAlerts.sort(
        (
            a,
            b
        ) => {

            const statusA =
                a.status ||
                "unresolved";


            const statusB =
                b.status ||
                "unresolved";


            if (

                statusA ===
                "unresolved" &&

                statusB ===
                "resolved"

            ) {

                return -1;

            }


            if (

                statusA ===
                "resolved" &&

                statusB ===
                "unresolved"

            ) {

                return 1;

            }


            const severityRank = {

                critical: 4,

                high: 3,

                medium: 2,

                low: 1

            };


            const severityA =
                severityRank[
                    getAlertSeverity(a)
                ] || 0;


            const severityB =
                severityRank[
                    getAlertSeverity(b)
                ] || 0;


            if (
                severityA !==
                severityB
            ) {

                return (
                    severityB -
                    severityA
                );

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
       CLEAR
    */

    container.innerHTML =
        "";


    /*
       RESULTS TEXT
    */

    if (resultsText) {

        resultsText.textContent =
            `${filteredAlerts.length} alert${
                filteredAlerts.length === 1
                    ? ""
                    : "s"
            } found`;

    }


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


        filteredAlerts.forEach(
            alert => {

                const severity =
                    getAlertSeverity(
                        alert
                    );


                const status =
                    alert.status ||
                    "unresolved";


                const alertItem =
                    document.createElement(
                        "article"
                    );


                alertItem.className =
                    `
                        alert-item
                        alert-status-${status}
                        alert-severity-${severity}
                    `;


                alertItem.innerHTML = `

                    <div
                        class="alert-item-main"
                    >


                        <div
                            class="alert-type-icon"
                        >

                            ${getAlertIcon(
                                alert.type
                            )}

                        </div>


                        <div
                            class="alert-content"
                        >


                            <div
                                class="alert-item-top"
                            >


                                <div>

                                    <div
                                        class="alert-badge-row"
                                    >

                                        ${renderAlertSeverity(
                                            severity
                                        )}


                                        ${renderAlertStatus(
                                            status
                                        )}

                                    </div>


                                    <h3>

                                        ${escapeAlertHTML(
                                            alert.title ||
                                            "System Alert"
                                        )}

                                    </h3>

                                </div>


                                <span
                                    class="alert-time"
                                >

                                    ${formatAlertRelativeDate(
                                        alert.createdAt
                                    )}

                                </span>


                            </div>


                            <p
                                class="alert-message"
                            >

                                ${escapeAlertHTML(
                                    alert.message ||
                                    "No alert message available."
                                )}

                            </p>



                            <div
                                class="alert-info-grid"
                            >


                                <div
                                    class="alert-info-card"
                                >

                                    <span>

                                        Station

                                    </span>


                                    <strong>

                                        ${escapeAlertHTML(
                                            alert.stationName ||
                                            "System"
                                        )}

                                    </strong>

                                </div>



                                <div
                                    class="alert-info-card"
                                >

                                    <span>

                                        Shift

                                    </span>


                                    <strong>

                                        ${escapeAlertHTML(
                                            alert.shiftName ||
                                            "N/A"
                                        )}

                                    </strong>

                                </div>



                                <div
                                    class="alert-info-card"
                                >

                                    <span>

                                        Staff

                                    </span>


                                    <strong>

                                        ${escapeAlertHTML(
                                            alert.staffName ||
                                            "N/A"
                                        )}

                                    </strong>

                                </div>



                                <div
                                    class="alert-info-card"
                                >

                                    <span>

                                        Financial Impact

                                    </span>


                                    <strong>

                                        ${formatAlertCurrency(
                                            alert.amount
                                        )}

                                    </strong>

                                </div>


                            </div>



                            <div
                                class="alert-actions"
                            >

                                ${renderAlertActions(
                                    alert
                                )}

                            </div>


                        </div>


                    </div>

                `;


                container.appendChild(
                    alertItem
                );

            }
        );


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
   RENDER SEVERITY
========================================== */

function renderAlertSeverity(
    severity
) {

    const labels = {

        critical:
            "Critical",

        high:
            "High Priority",

        medium:
            "Medium",

        low:
            "Low"

    };


    return `

        <span
            class="
                alert-severity-badge
                severity-${severity}
            "
        >

            ${labels[severity] ||
            "Alert"}

        </span>

    `;

}


/* ==========================================
   RENDER STATUS
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
                class="
                    status-badge
                    status-online
                "
            >

                Resolved

            </span>

        `;

    }


    return `

        <span
            class="
                status-badge
                status-pending
            "
        >

            Open

        </span>

    `;

}


/* ==========================================
   RENDER ACTIONS
========================================== */

function renderAlertActions(
    alert
) {

    const alertId =
        escapeAlertAttribute(
            alert.id
        );


    if (

        alert.status ===
        "resolved"

    ) {

        return `

            <button
                type="button"
                class="
                    btn
                    btn-outline
                    btn-small
                "
                data-view-alert="${alertId}"
            >

                View Details

            </button>

        `;

    }


    return `

        <button
            type="button"
            class="
                btn
                btn-primary
                btn-small
            "
            data-resolve-alert="${alertId}"
        >

            ✓ Mark Resolved

        </button>


        <button
            type="button"
            class="
                btn
                btn-outline
                btn-small
            "
            data-view-alert="${alertId}"
        >

            View Details

        </button>

    `;

}


/* ==========================================
   SETUP ACTION BUTTONS
========================================== */

function setupAlertActionButtons() {

    const resolveButtons =
        document.querySelectorAll(
            "[data-resolve-alert]"
        );


    resolveButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    resolveAlert(
                        button.getAttribute(
                            "data-resolve-alert"
                        )
                    );

                }
            );

        }
    );


    const viewButtons =
        document.querySelectorAll(
            "[data-view-alert]"
        );


    viewButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    viewAlertDetails(
                        button.getAttribute(
                            "data-view-alert"
                        )
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


    const confirmed =
        window.confirm(
            "Mark this alert as resolved?"
        );


    if (!confirmed) {

        return;

    }


    const alerts =
        getAlerts();


    const alertIndex =
        alerts.findIndex(
            alert =>
                String(alert.id) ===
                String(alertId)
        );


    if (
        alertIndex ===
        -1
    ) {

        return;

    }


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


    saveAlertsStorageData(
        ALERTS_STORAGE_KEY,
        alerts
    );


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
                String(item.id) ===
                String(alertId)
        );


    if (!alert) {

        return;

    }


    const modal =
        document.getElementById(
            "alertDetailsModal"
        );


    const content =
        document.getElementById(
            "alertDetailsContent"
        );


    if (
        !modal ||
        !content
    ) {

        return;

    }


    const severity =
        getAlertSeverity(
            alert
        );


    const status =
        alert.status ||
        "unresolved";


    content.innerHTML = `

        <div
            class="alert-modal-header"
        >


            <div
                class="alert-modal-icon"
            >

                ${getAlertIcon(
                    alert.type
                )}

            </div>


            <div>

                <div
                    class="alert-badge-row"
                >

                    ${renderAlertSeverity(
                        severity
                    )}

                    ${renderAlertStatus(
                        status
                    )}

                </div>


                <h2>

                    ${escapeAlertHTML(
                        alert.title ||
                        "System Alert"
                    )}

                </h2>

            </div>


        </div>



        <div
            class="alert-modal-message"
        >

            ${escapeAlertHTML(
                alert.message ||
                "No message available."
            )}

        </div>



        <div
            class="alert-details-grid"
        >


            <div
                class="alert-detail-card"
            >

                <span>

                    Station

                </span>


                <strong>

                    ${escapeAlertHTML(
                        alert.stationName ||
                        "System"
                    )}

                </strong>

            </div>



            <div
                class="alert-detail-card"
            >

                <span>

                    Shift

                </span>


                <strong>

                    ${escapeAlertHTML(
                        alert.shiftName ||
                        "N/A"
                    )}

                </strong>

            </div>



            <div
                class="alert-detail-card"
            >

                <span>

                    Staff

                </span>


                <strong>

                    ${escapeAlertHTML(
                        alert.staffName ||
                        "N/A"
                    )}

                </strong>

            </div>



            <div
                class="alert-detail-card"
            >

                <span>

                    Amount

                </span>


                <strong>

                    ${formatAlertCurrency(
                        alert.amount
                    )}

                </strong>

            </div>



            <div
                class="alert-detail-card"
            >

                <span>

                    Variance

                </span>


                <strong>

                    ${Number(
                        alert.variancePercentage || 0
                    ).toFixed(2)}%

                </strong>

            </div>



            <div
                class="alert-detail-card"
            >

                <span>

                    Created

                </span>


                <strong>

                    ${formatAlertDate(
                        alert.createdAt
                    )}

                </strong>

            </div>


            ${alert.resolvedAt
                ? `

                    <div
                        class="alert-detail-card"
                    >

                        <span>

                            Resolved

                        </span>


                        <strong>

                            ${formatAlertDate(
                                alert.resolvedAt
                            )}

                        </strong>

                    </div>

                `
                : ""
            }


        </div>



        <div
            class="alert-modal-footer"
        >


            ${status !== "resolved"
                ? `

                    <button
                        type="button"
                        class="
                            btn
                            btn-primary
                        "
                        data-modal-resolve="${escapeAlertAttribute(
                            alert.id
                        )}"
                    >

                        ✓ Mark Resolved

                    </button>

                `
                : ""
            }


            <button
                type="button"
                class="
                    btn
                    btn-outline
                "
                data-close-alert-modal
            >

                Close

            </button>


        </div>

    `;


    modal.classList.remove(
        "hidden"
    );


    const resolveButton =
        content.querySelector(
            "[data-modal-resolve]"
        );


    if (resolveButton) {

        resolveButton.addEventListener(
            "click",
            () => {

                const id =
                    resolveButton.getAttribute(
                        "data-modal-resolve"
                    );


                closeAlertModal();

                resolveAlert(
                    id
                );

            }
        );

    }

}


/* ==========================================
   CLOSE MODAL
========================================== */

function closeAlertModal() {

    const modal =
        document.getElementById(
            "alertDetailsModal"
        );


    if (modal) {

        modal.classList.add(
            "hidden"
        );

    }

}


/* ==========================================
   UPDATE SUMMARY
========================================== */

function updateAlertSummary(
    alerts
) {

    const total =
        alerts.length;


    const unresolved =
        alerts.filter(
            alert =>

                (alert.status ||
                    "unresolved") !==
                "resolved"
        )
            .length;


    const resolved =
        alerts.filter(
            alert =>
                alert.status ===
                "resolved"
        )
            .length;


    const critical =
        alerts.filter(
            alert =>

                (alert.status ||
                    "unresolved") !==
                "resolved" &&

                getAlertSeverity(
                    alert
                ) ===
                "critical"
        )
            .length;


    updateAlertSummaryElement(
        "totalAlertsCount",
        total
    );


    updateAlertSummaryElement(
        "unresolvedAlertsCount",
        unresolved
    );


    updateAlertSummaryElement(
        "criticalAlertsCount",
        critical
    );


    updateAlertSummaryElement(
        "resolvedAlertsCount",
        resolved
    );

}


/* ==========================================
   UPDATE SUMMARY ELEMENT
========================================== */

function updateAlertSummaryElement(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


/* ==========================================
   FORMAT CURRENCY
========================================== */

function formatAlertCurrency(
    amount
) {

    const value =
        Number(amount) ||
        0;


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
        new Date(date);


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
   FORMAT RELATIVE DATE
========================================== */

function formatAlertRelativeDate(
    date
) {

    if (!date) {

        return "Unknown time";

    }


    const created =
        new Date(date);


    const now =
        new Date();


    const difference =
        now -
        created;


    const seconds =
        Math.floor(
            difference / 1000
        );


    const minutes =
        Math.floor(
            seconds / 60
        );


    const hours =
        Math.floor(
            minutes / 60
        );


    const days =
        Math.floor(
            hours / 24
        );


    if (
        seconds < 60
    ) {

        return "Just now";

    }


    if (
        minutes < 60
    ) {

        return `${minutes}m ago`;

    }


    if (
        hours < 24
    ) {

        return `${hours}h ago`;

    }


    if (
        days < 7
    ) {

        return `${days}d ago`;

    }


    return formatAlertDate(
        date
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
        String(value);


    return div.innerHTML;

}


/* ==========================================
   ESCAPE ATTRIBUTE
========================================== */

function escapeAlertAttribute(
    value
) {

    return escapeAlertHTML(
        value
    )
        .replace(
            /"/g,
            "&quot;"
        );

}