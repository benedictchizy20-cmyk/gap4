/* =========================================================
   FUELGAP - PRODUCTION DASHBOARD
   SUPABASE + EXPRESS
   HTTPONLY COOKIE SESSION
   FULLY DYNAMIC
   NO LOCALSTORAGE AUTHENTICATION

   SUPPORTS:
   - SUPER ADMIN PLATFORM DASHBOARD
   - ORGANIZATION DASHBOARD
   - LIVE BACKEND DATA
   - NESTED API RESPONSES
   - FLAT API RESPONSES
   - DYNAMIC ORGANIZATION COUNTS
   - DYNAMIC STATION / PUMP / NOZZLE COUNTS
   - DYNAMIC SALES
   - DYNAMIC PAYMENTS
   - DYNAMIC GAPS
   - DYNAMIC ALERTS
========================================================= */


/* =========================================================
   DASHBOARD STATE
========================================================= */

const DashboardState = {

    currentUser: null,

    mode: "organization",

    overview: null,

    organizations: [],

    stations: [],
    pumps: [],
    nozzles: [],
    staff: [],
    shifts: [],
    meterReadings: [],
    sales: [],
    gaps: [],
    alerts: [],

    isLoading: false,
    isRefreshing: false,

    error: null,

    loadedAt: null
};


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            await waitForDashboardContainer();

            await initializeDashboard();

        } catch (error) {

            console.error(
                "Dashboard initialization error:",
                error
            );

            showDashboardError(
                error.message ||
                "Unable to load dashboard."
            );
        }

    }
);


/* =========================================================
   WAIT FOR PAGE CONTAINER
========================================================= */

function waitForDashboardContainer(
    timeout = 10000
) {

    return new Promise(
        (resolve, reject) => {

            const start = Date.now();

            const check = () => {

                const container =
                    document.getElementById(
                        "pageContent"
                    );

                if (container) {

                    resolve(container);

                    return;
                }

                if (
                    Date.now() - start >
                    timeout
                ) {

                    reject(
                        new Error(
                            "Dashboard container #pageContent was not found."
                        )
                    );

                    return;
                }

                setTimeout(
                    check,
                    100
                );
            };

            check();
        }
    );
}


/* =========================================================
   INITIALIZE DASHBOARD
========================================================= */

async function initializeDashboard() {

    if (
        typeof FuelGapAPI ===
        "undefined"
    ) {

        throw new Error(
            "FuelGapAPI is not loaded."
        );
    }


    DashboardState.isLoading = true;

    DashboardState.error = null;


    renderDashboardLoading();


    /* -----------------------------------------------------
       GET CURRENT USER
    ----------------------------------------------------- */

    let currentUser;

    try {

        currentUser =
            await FuelGapAPI.getCurrentUser();

    } catch (error) {

        console.error(
            "Current user request failed:",
            error
        );

        window.location.href =
            "login.html";

        return;
    }


    if (
        !currentUser ||
        currentUser.success === false
    ) {

        window.location.href =
            "login.html";

        return;
    }


    DashboardState.currentUser =
        extractCurrentUser(
            currentUser
        );


    if (
        !DashboardState.currentUser
    ) {

        window.location.href =
            "login.html";

        return;
    }


    /* -----------------------------------------------------
       DETERMINE DASHBOARD MODE
    ----------------------------------------------------- */

    const role =
        String(
            DashboardState.currentUser.role ||
            ""
        ).toLowerCase();


    DashboardState.mode =
        role === "super_admin"
            ? "platform"
            : "organization";


    console.log(
        "FuelGap Dashboard Mode:",
        DashboardState.mode
    );


    /* -----------------------------------------------------
       LOAD DASHBOARD
    ----------------------------------------------------- */

    try {

        if (
            DashboardState.mode ===
            "platform"
        ) {

            await loadPlatformDashboard();

        } else {

            await loadOrganizationDashboard();

        }

    } catch (error) {

        console.error(
            "Dashboard data loading error:",
            error
        );

        DashboardState.error =
            error.message ||
            "Unable to load dashboard data.";

    } finally {

        DashboardState.isLoading = false;

        DashboardState.loadedAt =
            new Date();

        renderDashboard();

    }
}


/* =========================================================
   EXTRACT CURRENT USER
========================================================= */

function extractCurrentUser(
    response
) {

    if (!response) {
        return null;
    }


    if (
        response.user &&
        typeof response.user === "object"
    ) {

        return response.user;
    }


    if (
        response.data &&
        response.data.user &&
        typeof response.data.user === "object"
    ) {

        return response.data.user;
    }


    if (
        response.data &&
        typeof response.data === "object" &&
        response.data.id
    ) {

        return response.data;
    }


    if (
        response.id ||
        response.user_id ||
        response.auth_user_id
    ) {

        return response;
    }


    return null;
}


/* =========================================================
   LOAD PLATFORM DASHBOARD
========================================================= */

async function loadPlatformDashboard() {

    DashboardState.error = null;


    const results =
        await Promise.allSettled(
            [
                loadPlatformOverview(),
                loadPlatformOrganizations()
            ]
        );


    const failed =
        results.filter(
            result =>
                result.status ===
                "rejected"
        );


    if (failed.length) {

        console.error(
            "Platform dashboard partial failure:",
            failed
        );


        DashboardState.error =
            failed
                .map(
                    result =>
                        result.reason?.message ||
                        "Platform request failed."
                )
                .join(" ");
    }


    /*
       Make sure active organization count
       is dynamically calculated from the
       actual organization list if backend
       overview does not provide it.
    */

    if (
        DashboardState.overview &&
        (
            DashboardState.overview
                .activeOrganizations ===
            undefined ||
            DashboardState.overview
                .activeOrganizations ===
            null
        )
    ) {

        DashboardState.overview
            .activeOrganizations =
            DashboardState.organizations
                .filter(
                    organization =>
                        organizationIsActive(
                            organization
                        )
                )
                .length;
    }
}


/* =========================================================
   LOAD PLATFORM OVERVIEW
========================================================= */

async function loadPlatformOverview() {

    if (
        typeof FuelGapAPI.getPlatformOverview !==
        "function"
    ) {

        throw new Error(
            "FuelGapAPI.getPlatformOverview() is not available."
        );
    }


    const response =
        await FuelGapAPI
            .getPlatformOverview();


    console.log(
        "Platform overview response:",
        response
    );


    DashboardState.overview =
        normalizePlatformOverview(
            response
        );


    return DashboardState.overview;
}


/* =========================================================
   LOAD PLATFORM ORGANIZATIONS
========================================================= */

async function loadPlatformOrganizations() {

    if (
        typeof FuelGapAPI
            .getPlatformOrganizations !==
        "function"
    ) {

        throw new Error(
            "FuelGapAPI.getPlatformOrganizations() is not available."
        );
    }


    const response =
        await FuelGapAPI
            .getPlatformOrganizations();


    console.log(
        "Platform organizations response:",
        response
    );


    DashboardState.organizations =
        extractArray(
            response,
            [
                "organizations",
                "records",
                "data"
            ]
        );


    return DashboardState.organizations;
}


/* =========================================================
   LOAD ORGANIZATION DASHBOARD
========================================================= */

async function loadOrganizationDashboard() {

    const requests = [];


    /* -----------------------------------------------------
       STATIONS
    ----------------------------------------------------- */

    if (
        typeof FuelGapAPI.getStations ===
        "function"
    ) {

        requests.push(
            safeLoad(
                "stations",
                () =>
                    FuelGapAPI.getStations()
            )
        );
    }


    /* -----------------------------------------------------
       PUMPS
    ----------------------------------------------------- */

    if (
        typeof FuelGapAPI.getPumps ===
        "function"
    ) {

        requests.push(
            safeLoad(
                "pumps",
                () =>
                    FuelGapAPI.getPumps()
            )
        );
    }


    /* -----------------------------------------------------
       NOZZLES
    ----------------------------------------------------- */

    if (
        typeof FuelGapAPI.getNozzles ===
        "function"
    ) {

        requests.push(
            safeLoad(
                "nozzles",
                () =>
                    FuelGapAPI.getNozzles()
            )
        );
    }


    /* -----------------------------------------------------
       STAFF
    ----------------------------------------------------- */

    if (
        typeof FuelGapAPI.getStaff ===
        "function"
    ) {

        requests.push(
            safeLoad(
                "staff",
                () =>
                    FuelGapAPI.getStaff()
            )
        );
    }


    /* -----------------------------------------------------
       SHIFTS
    ----------------------------------------------------- */

    if (
        typeof FuelGapAPI.getShifts ===
        "function"
    ) {

        requests.push(
            safeLoad(
                "shifts",
                () =>
                    FuelGapAPI.getShifts()
            )
        );
    }


    /* -----------------------------------------------------
       SALES
    ----------------------------------------------------- */

    if (
        typeof FuelGapAPI.getSales ===
        "function"
    ) {

        requests.push(
            safeLoad(
                "sales",
                () =>
                    FuelGapAPI.getSales()
            )
        );
    }


    /* -----------------------------------------------------
       GAPS
    ----------------------------------------------------- */

    if (
        typeof FuelGapAPI.getGaps ===
        "function"
    ) {

        requests.push(
            safeLoad(
                "gaps",
                () =>
                    FuelGapAPI.getGaps()
            )
        );
    }


    /* -----------------------------------------------------
       ALERTS
    ----------------------------------------------------- */

    if (
        typeof FuelGapAPI.getAlerts ===
        "function"
    ) {

        requests.push(
            safeLoad(
                "alerts",
                () =>
                    FuelGapAPI.getAlerts()
            )
        );
    }


    /* -----------------------------------------------------
       METER READINGS
    ----------------------------------------------------- */

    requests.push(
        safeLoad(
            "meterReadings",
            () =>
                FuelGapAPI.request(
                    "/meter-readings"
                )
        )
    );


    await Promise.all(
        requests
    );


    console.log(
        "Organization dashboard data:",
        {
            stations:
                DashboardState.stations.length,

            pumps:
                DashboardState.pumps.length,

            nozzles:
                DashboardState.nozzles.length,

            staff:
                DashboardState.staff.length,

            shifts:
                DashboardState.shifts.length,

            sales:
                DashboardState.sales.length,

            gaps:
                DashboardState.gaps.length,

            alerts:
                DashboardState.alerts.length,

            meterReadings:
                DashboardState
                    .meterReadings
                    .length
        }
    );
}


/* =========================================================
   SAFE LOADER
========================================================= */

async function safeLoad(
    property,
    loader
) {

    try {

        const response =
            await loader();


        DashboardState[property] =
            extractArray(
                response,
                [
                    property,
                    "records",
                    "items",
                    "data"
                ]
            );


    } catch (error) {

        console.error(
            `Failed to load ${property}:`,
            error
        );


        DashboardState[property] =
            [];


        /*
           We intentionally don't stop
           the entire dashboard when one
           module fails.
        */
    }
}


/* =========================================================
   NORMALIZE PLATFORM OVERVIEW
========================================================= */

function normalizePlatformOverview(
    response
) {

    const source =
        extractObject(
            response,
            [
                "overview",
                "platform",
                "data"
            ]
        );


    if (!source) {

        return {
            totalOrganizations: 0,
            activeOrganizations: 0,

            totalUsers: 0,
            activeUsers: 0,

            totalStations: 0,
            activeStations: 0,

            totalPumps: 0,
            totalNozzles: 0,

            totalShifts: 0,
            activeShifts: 0,

            totalTransactions: 0,
            todayTransactions: 0,

            totalSales: 0,
            todaySales: 0,

            totalPayments: 0,

            totalGaps: 0,
            openGaps: 0,

            totalAlerts: 0,
            activeAlerts: 0
        };
    }


    const organizations =
        source.organizations ||
        {};

    const users =
        source.users ||
        {};

    const stations =
        source.stations ||
        {};

    const pumps =
        source.pumps ||
        {};

    const nozzles =
        source.nozzles ||
        {};

    const shifts =
        source.shifts ||
        {};

    const sales =
        source.sales ||
        {};

    const payments =
        source.payments ||
        {};

    const gaps =
        source.gaps ||
        {};

    const alerts =
        source.alerts ||
        {};


    return {

        /* -------------------------------------------------
           ORGANIZATIONS
        ------------------------------------------------- */

        totalOrganizations:
            numberValue(
                source.totalOrganizations,
                organizations.total,
                organizations.count,
                0
            ),

        activeOrganizations:
            nullableNumberValue(
                source.activeOrganizations,
                organizations.active,
                organizations.active_count,
                null
            ),


        /* -------------------------------------------------
           USERS
        ------------------------------------------------- */

        totalUsers:
            numberValue(
                source.totalUsers,
                users.total,
                users.count,
                0
            ),

        activeUsers:
            numberValue(
                source.activeUsers,
                users.active,
                users.active_count,
                0
            ),


        /* -------------------------------------------------
           STATIONS
        ------------------------------------------------- */

        totalStations:
            numberValue(
                source.totalStations,
                stations.total,
                stations.count,
                0
            ),

        activeStations:
            numberValue(
                source.activeStations,
                stations.active,
                stations.active_count,
                0
            ),


        /* -------------------------------------------------
           PUMPS
        ------------------------------------------------- */

        totalPumps:
            numberValue(
                source.totalPumps,
                pumps.total,
                pumps.count,
                0
            ),


        /* -------------------------------------------------
           NOZZLES
        ------------------------------------------------- */

        totalNozzles:
            numberValue(
                source.totalNozzles,
                nozzles.total,
                nozzles.count,
                0
            ),


        /* -------------------------------------------------
           SHIFTS
        ------------------------------------------------- */

        totalShifts:
            numberValue(
                source.totalShifts,
                shifts.total,
                shifts.count,
                0
            ),

        activeShifts:
            numberValue(
                source.activeShifts,
                shifts.active,
                shifts.open,
                shifts.active_count,
                0
            ),


        /* -------------------------------------------------
           SALES / TRANSACTIONS
        ------------------------------------------------- */

        totalTransactions:
            numberValue(
                source.totalTransactions,
                sales.total,
                sales.count,
                sales.totalTransactions,
                0
            ),

        todayTransactions:
            numberValue(
                source.todayTransactions,
                sales.todayTransactions,
                sales.today_count,
                0
            ),

        totalSales:
            numberValue(
                source.totalSales,
                sales.totalAmount,
                sales.total_amount,
                sales.amount,
                0
            ),

        todaySales:
            numberValue(
                source.todaySales,
                sales.todayAmount,
                sales.today_amount,
                0
            ),


        /* -------------------------------------------------
           PAYMENTS
        ------------------------------------------------- */

        totalPayments:
            numberValue(
                source.totalPayments,
                payments.total,
                payments.count,
                0
            ),


        /* -------------------------------------------------
           GAPS
        ------------------------------------------------- */

        totalGaps:
            numberValue(
                source.totalGaps,
                gaps.total,
                gaps.count,
                0
            ),

        openGaps:
            numberValue(
                source.openGaps,
                gaps.open,
                gaps.active,
                gaps.pending,
                gaps.total,
                0
            ),


        /* -------------------------------------------------
           ALERTS
        ------------------------------------------------- */

        totalAlerts:
            numberValue(
                source.totalAlerts,
                alerts.total,
                alerts.count,
                0
            ),

        activeAlerts:
            numberValue(
                source.activeAlerts,
                alerts.active,
                alerts.open,
                alerts.unresolved,
                0
            )
    };
}


/* =========================================================
   RENDER DASHBOARD
========================================================= */

function renderDashboard() {

    const container =
        document.getElementById(
            "pageContent"
        );


    if (!container) {

        return;
    }


    if (
        DashboardState.error &&
        !DashboardState.overview &&
        DashboardState.mode ===
        "platform"
    ) {

        renderPlatformError(
            DashboardState.error
        );

        return;
    }


    if (
        DashboardState.mode ===
        "platform"
    ) {

        renderPlatformDashboard();

    } else {

        renderOrganizationDashboard();
    }
}


/* =========================================================
   LOADING UI
========================================================= */

function renderDashboardLoading() {

    const container =
        document.getElementById(
            "pageContent"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="fg-dashboard-loading">

            <div class="fg-loading-spinner"></div>

            <h2>
                Loading FuelGap Dashboard
            </h2>

            <p>
                Connecting to your live system...
            </p>

        </div>

    `;


    renderPlatformStyles();
}


/* =========================================================
   PLATFORM DASHBOARD
========================================================= */

function renderPlatformDashboard() {

    const container =
        document.getElementById(
            "pageContent"
        );


    if (!container) {
        return;
    }


    const overview =
        DashboardState.overview ||
        normalizePlatformOverview(
            {}
        );


    const organizations =
        DashboardState.organizations ||
        [];


    /*
       Dynamically calculate active
       organizations if backend overview
       does not provide it.
    */

    if (
        overview.activeOrganizations ===
            null ||
        overview.activeOrganizations ===
            undefined
    ) {

        overview.activeOrganizations =
            organizations.filter(
                organization =>
                    organizationIsActive(
                        organization
                    )
            ).length;
    }


    const userName =
        getUserDisplayName();


    container.innerHTML = `

        <section class="fg-dashboard">

            ${renderDashboardHeader(
                "Platform Dashboard",
                `Welcome back, ${escapeHtml(userName)}.`
            )}


            ${
                DashboardState.error
                    ? renderDashboardWarning(
                        DashboardState.error
                    )
                    : ""
            }


            <!-- =========================================
                 PLATFORM STATISTICS
            ========================================== -->

            <div class="fg-stat-grid">

                ${platformStatCard(
                    "Organizations",
                    overview.totalOrganizations,
                    "Registered companies",
                    "building"
                )}

                ${platformStatCard(
                    "Active Organizations",
                    overview.activeOrganizations,
                    "Currently active",
                    "activity"
                )}

                ${platformStatCard(
                    "Users",
                    overview.totalUsers,
                    "Platform users",
                    "users"
                )}

                ${platformStatCard(
                    "Stations",
                    overview.totalStations,
                    `${overview.activeStations} active`,
                    "station"
                )}

                ${platformStatCard(
                    "Pumps",
                    overview.totalPumps,
                    "Configured pumps",
                    "pump"
                )}

                ${platformStatCard(
                    "Nozzles",
                    overview.totalNozzles,
                    "Configured nozzles",
                    "nozzle"
                )}

                ${platformStatCard(
                    "Sales",
                    formatNaira(
                        overview.totalSales
                    ),
                    `${formatNaira(
                        overview.todaySales
                    )} today`,
                    "sales"
                )}

                ${platformStatCard(
                    "Payments",
                    overview.totalPayments,
                    "Recorded payments",
                    "payment"
                )}

                ${platformStatCard(
                    "Active Alerts",
                    overview.activeAlerts,
                    `${overview.totalAlerts} total alerts`,
                    "alert"
                )}

            </div>


            <!-- =========================================
                 ORGANIZATION TABLE
            ========================================== -->

            <section class="fg-dashboard-card">

                <div class="fg-card-header">

                    <div>

                        <span class="fg-card-eyebrow">
                            PLATFORM
                        </span>

                        <h2>
                            Organizations
                        </h2>

                        <p>
                            Live organizations registered
                            on FuelGap.
                        </p>

                    </div>

                    <button
                        type="button"
                        class="fg-btn fg-btn-secondary"
                        id="refreshDashboardBtn"
                    >
                        <span class="fg-btn-icon">
                            ↻
                        </span>

                        Refresh
                    </button>

                </div>


                <div class="fg-table-wrapper">

                    <table class="fg-data-table">

                        <thead>

                            <tr>

                                <th>
                                    Organization
                                </th>

                                <th>
                                    Contact
                                </th>

                                <th>
                                    Users
                                </th>

                                <th>
                                    Stations
                                </th>

                                <th>
                                    Status
                                </th>

                                <th>
                                    Created
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            ${
                                organizations.length
                                    ? organizations
                                        .map(
                                            renderOrganizationRow
                                        )
                                        .join("")
                                    : `
                                        <tr>

                                            <td
                                                colspan="6"
                                                class="fg-empty-cell"
                                            >
                                                No organizations found.
                                            </td>

                                        </tr>
                                    `
                            }

                        </tbody>

                    </table>

                </div>

            </section>


            <!-- =========================================
                 PLATFORM HEALTH
            ========================================== -->

            <section class="fg-dashboard-bottom-grid">

                <div class="fg-dashboard-card">

                    <div class="fg-card-header">

                        <div>

                            <span class="fg-card-eyebrow">
                                SYSTEM
                            </span>

                            <h2>
                                Platform Health
                            </h2>

                        </div>

                        <span class="fg-health-badge">
                            <span></span>
                            Operational
                        </span>

                    </div>


                    <div class="fg-health-list">

                        ${healthItem(
                            "Authentication",
                            "Operational"
                        )}

                        ${healthItem(
                            "Database",
                            "Connected"
                        )}

                        ${healthItem(
                            "API",
                            "Operational"
                        )}

                        ${healthItem(
                            "Session",
                            "Secure"
                        )}

                    </div>

                </div>


                <div class="fg-dashboard-card">

                    <div class="fg-card-header">

                        <div>

                            <span class="fg-card-eyebrow">
                                QUICK ACTIONS
                            </span>

                            <h2>
                                Platform Management
                            </h2>

                        </div>

                    </div>


                    <div class="fg-quick-actions">

                        ${quickAction(
                            "Organizations",
                            "Manage registered organizations",
                            "organizations"
                        )}

                        ${quickAction(
                            "Users",
                            "Review platform users",
                            "users"
                        )}

                        ${quickAction(
                            "Stations",
                            "Monitor fuel stations",
                            "stations"
                        )}

                        ${quickAction(
                            "Alerts",
                            "Review system alerts",
                            "alerts"
                        )}

                    </div>

                </div>

            </section>


            <div class="fg-dashboard-footer">

                <span>
                    FuelGap Platform
                </span>

                <span>
                    ${formatLastUpdated()}
                </span>

            </div>

        </section>

    `;


    bindDashboardEvents();

    renderPlatformStyles();
}


/* =========================================================
   ORGANIZATION DASHBOARD
========================================================= */

function renderOrganizationDashboard() {

    const container =
        document.getElementById(
            "pageContent"
        );


    if (!container) {
        return;
    }


    const metrics =
        calculateOrganizationMetrics();


    const userName =
        getUserDisplayName();


    const organizationName =
        getOrganizationName();


    container.innerHTML = `

        <section class="fg-dashboard">

            ${renderDashboardHeader(
                "Dashboard",
                `Welcome back, ${escapeHtml(userName)}.`
            )}


            ${
                DashboardState.error
                    ? renderDashboardWarning(
                        DashboardState.error
                    )
                    : ""
            }


            <div class="fg-organization-banner">

                <div>

                    <span class="fg-card-eyebrow">
                        ORGANIZATION
                    </span>

                    <h2>
                        ${escapeHtml(
                            organizationName
                        )}
                    </h2>

                    <p>
                        Monitor your stations,
                        pumps, staff, sales and
                        reconciliation in real time.
                    </p>

                </div>

                <div class="fg-live-indicator">

                    <span></span>

                    Live System

                </div>

            </div>


            <!-- =========================================
                 ORGANIZATION STATISTICS
            ========================================== -->

            <div class="fg-stat-grid">

                ${platformStatCard(
                    "Stations",
                    metrics.totalStations,
                    `${metrics.activeStations} active`,
                    "station"
                )}

                ${platformStatCard(
                    "Pumps",
                    metrics.totalPumps,
                    "Configured pumps",
                    "pump"
                )}

                ${platformStatCard(
                    "Nozzles",
                    metrics.totalNozzles,
                    "Configured nozzles",
                    "nozzle"
                )}

                ${platformStatCard(
                    "Staff",
                    metrics.totalStaff,
                    `${metrics.activeStaff} active`,
                    "users"
                )}

                ${platformStatCard(
                    "Shifts",
                    metrics.totalShifts,
                    `${metrics.openShifts} open`,
                    "shift"
                )}

                ${platformStatCard(
                    "Sales",
                    formatNaira(
                        metrics.totalSales
                    ),
                    `${formatNaira(
                        metrics.todaySales
                    )} today`,
                    "sales"
                )}

                ${platformStatCard(
                    "Gaps",
                    metrics.totalGaps,
                    `${metrics.openGaps} unresolved`,
                    "gap"
                )}

                ${platformStatCard(
                    "Alerts",
                    metrics.totalAlerts,
                    `${metrics.activeAlerts} active`,
                    "alert"
                )}

            </div>


            <!-- =========================================
                 OPERATIONAL SUMMARY
            ========================================== -->

            <section class="fg-dashboard-bottom-grid">

                <div class="fg-dashboard-card">

                    <div class="fg-card-header">

                        <div>

                            <span class="fg-card-eyebrow">
                                OPERATIONS
                            </span>

                            <h2>
                                Operational Summary
                            </h2>

                        </div>

                    </div>


                    <div class="fg-health-list">

                        ${healthItem(
                            "Stations",
                            `${metrics.activeStations} active`
                        )}

                        ${healthItem(
                            "Open Shifts",
                            metrics.openShifts
                        )}

                        ${healthItem(
                            "Today's Sales",
                            formatNaira(
                                metrics.todaySales
                            )
                        )}

                        ${healthItem(
                            "Unresolved Gaps",
                            metrics.openGaps
                        )}

                        ${healthItem(
                            "Active Alerts",
                            metrics.activeAlerts
                        )}

                    </div>

                </div>


                <div class="fg-dashboard-card">

                    <div class="fg-card-header">

                        <div>

                            <span class="fg-card-eyebrow">
                                RECENT ACTIVITY
                            </span>

                            <h2>
                                Latest Sales
                            </h2>

                        </div>

                    </div>


                    ${renderRecentSales(
                        DashboardState.sales
                    )}

                </div>

            </section>


            <div class="fg-dashboard-footer">

                <span>
                    ${escapeHtml(
                        organizationName
                    )}
                </span>

                <span>
                    ${formatLastUpdated()}
                </span>

            </div>

        </section>

    `;


    bindDashboardEvents();

    renderOrganizationStyles();
}


/* =========================================================
   ORGANIZATION METRICS
========================================================= */

function calculateOrganizationMetrics() {

    const stations =
        DashboardState.stations ||
        [];

    const pumps =
        DashboardState.pumps ||
        [];

    const nozzles =
        DashboardState.nozzles ||
        [];

    const staff =
        DashboardState.staff ||
        [];

    const shifts =
        DashboardState.shifts ||
        [];

    const sales =
        DashboardState.sales ||
        [];

    const gaps =
        DashboardState.gaps ||
        [];

    const alerts =
        DashboardState.alerts ||
        [];


    const activeStations =
        stations.filter(
            item =>
                item.is_active !== false &&
                String(
                    item.status ||
                    "active"
                ).toLowerCase() !==
                    "inactive"
        ).length;


    const activeStaff =
        staff.filter(
            item =>
                item.is_active !== false &&
                String(
                    item.status ||
                    "active"
                ).toLowerCase() !==
                    "inactive"
        ).length;


    const openShifts =
        shifts.filter(
            shift =>
                isOpenShift(
                    shift
                )
        ).length;


    const totalSales =
        sales.reduce(
            (
                total,
                sale
            ) =>
                total +
                numberValue(
                    sale.amount,
                    sale.total_amount,
                    sale.totalAmount,
                    0
                ),
            0
        );


    const todaySales =
        sales
            .filter(
                sale =>
                    isToday(
                        sale.created_at ||
                        sale.createdAt ||
                        sale.recorded_at
                    )
            )
            .reduce(
                (
                    total,
                    sale
                ) =>
                    total +
                    numberValue(
                        sale.amount,
                        sale.total_amount,
                        sale.totalAmount,
                        0
                    ),
                0
            );


    const openGaps =
        gaps.filter(
            gap =>
                !isResolvedGap(
                    gap
                )
        ).length;


    const activeAlerts =
        alerts.filter(
            alert =>
                !isResolvedAlert(
                    alert
                )
        ).length;


    return {

        totalStations:
            stations.length,

        activeStations,

        totalPumps:
            pumps.length,

        totalNozzles:
            nozzles.length,

        totalStaff:
            staff.length,

        activeStaff,

        totalShifts:
            shifts.length,

        openShifts,

        totalSales,

        todaySales,

        totalGaps:
            gaps.length,

        openGaps,

        totalAlerts:
            alerts.length,

        activeAlerts
    };
}


/* =========================================================
   RENDER DASHBOARD HEADER
========================================================= */

function renderDashboardHeader(
    title,
    subtitle
) {

    return `

        <div class="fg-dashboard-header">

            <div>

                <span class="fg-dashboard-label">
                    FUELGAP
                </span>

                <h1>
                    ${escapeHtml(title)}
                </h1>

                <p>
                    ${subtitle}
                </p>

            </div>


            <div class="fg-dashboard-header-right">

                <div class="fg-system-status">

                    <span></span>

                    System Online

                </div>


                <button
                    type="button"
                    class="fg-btn fg-btn-secondary"
                    id="refreshDashboardBtn"
                >
                    ↻ Refresh
                </button>

            </div>

        </div>

    `;
}


/* =========================================================
   PLATFORM STAT CARD
========================================================= */

function platformStatCard(
    title,
    value,
    description,
    icon
) {

    return `

        <div class="fg-stat-card">

            <div class="fg-stat-top">

                <div class="fg-stat-icon fg-icon-${escapeHtml(
                    icon
                )}">

                    ${getIcon(
                        icon
                    )}

                </div>

            </div>


            <div class="fg-stat-value">

                ${escapeHtml(
                    String(value)
                )}

            </div>


            <div class="fg-stat-title">

                ${escapeHtml(
                    title
                )}

            </div>


            <div class="fg-stat-description">

                ${escapeHtml(
                    String(description)
                )}

            </div>

        </div>

    `;
}


/* =========================================================
   ORGANIZATION TABLE ROW
========================================================= */

function renderOrganizationRow(
    organization
) {

    const users =
        numberValue(
            organization.users?.total,
            organization.user_count,
            organization.users_count,
            organization.total_users,
            0
        );


    const activeUsers =
        numberValue(
            organization.users?.active,
            organization.active_users,
            0
        );


    const stations =
        numberValue(
            organization.stations?.total,
            organization.station_count,
            organization.stations_count,
            organization.total_stations,
            0
        );


    const activeStations =
        numberValue(
            organization.stations?.active,
            organization.active_stations,
            0
        );


    const active =
        organizationIsActive(
            organization
        );


    return `

        <tr>

            <td>

                <div class="fg-org-name">

                    <div class="fg-org-avatar">

                        ${escapeHtml(
                            getInitials(
                                organization.name ||
                                "Organization"
                            )
                        )}

                    </div>


                    <div>

                        <strong>
                            ${escapeHtml(
                                organization.name ||
                                "Unnamed Organization"
                            )}
                        </strong>

                        <small>
                            ${escapeHtml(
                                organization.id ||
                                ""
                            )}
                        </small>

                    </div>

                </div>

            </td>


            <td>

                <div class="fg-contact-cell">

                    ${
                        organization.email
                            ? `
                                <span>
                                    ${escapeHtml(
                                        organization.email
                                    )}
                                </span>
                              `
                            : ""
                    }

                    ${
                        organization.phone
                            ? `
                                <small>
                                    ${escapeHtml(
                                        organization.phone
                                    )}
                                </small>
                              `
                            : ""
                    }

                </div>

            </td>


            <td>

                <strong>
                    ${users}
                </strong>

                ${
                    activeUsers
                        ? `
                            <small class="fg-table-subtext">
                                ${activeUsers} active
                            </small>
                          `
                        : ""
                }

            </td>


            <td>

                <strong>
                    ${stations}
                </strong>

                ${
                    activeStations
                        ? `
                            <small class="fg-table-subtext">
                                ${activeStations} active
                            </small>
                          `
                        : ""
                }

            </td>


            <td>

                <span class="
                    fg-status-badge
                    ${
                        active
                            ? "fg-status-active"
                            : "fg-status-inactive"
                    }
                ">

                    <span></span>

                    ${
                        active
                            ? "Active"
                            : "Inactive"
                    }

                </span>

            </td>


            <td>

                ${formatDate(
                    organization.created_at ||
                    organization.createdAt
                )}

            </td>

        </tr>

    `;
}


/* =========================================================
   HEALTH ITEM
========================================================= */

function healthItem(
    label,
    value
) {

    const stringValue =
        String(
            value
        );


    const healthy =
        [
            "Operational",
            "Connected",
            "Secure"
        ].includes(
            stringValue
        );


    return `

        <div class="fg-health-item">

            <div>

                <span class="fg-health-dot ${
                    healthy
                        ? "healthy"
                        : ""
                }"></span>

                <strong>
                    ${escapeHtml(
                        label
                    )}
                </strong>

            </div>


            <span>

                ${escapeHtml(
                    stringValue
                )}

            </span>

        </div>

    `;
}


/* =========================================================
   QUICK ACTION
========================================================= */

function quickAction(
    title,
    description,
    target
) {

    return `

        <button
            type="button"
            class="fg-quick-action"
            data-dashboard-target="${escapeHtml(
                target
            )}"
        >

            <div class="fg-quick-icon">

                ${getIcon(
                    target
                )}

            </div>


            <div>

                <strong>
                    ${escapeHtml(
                        title
                    )}
                </strong>

                <span>
                    ${escapeHtml(
                        description
                    )}
                </span>

            </div>


            <span class="fg-quick-arrow">
                →
            </span>

        </button>

    `;
}


/* =========================================================
   RECENT SALES
========================================================= */

function renderRecentSales(
    sales
) {

    if (
        !Array.isArray(sales) ||
        sales.length === 0
    ) {

        return `

            <div class="fg-empty-state">

                <div class="fg-empty-icon">
                    ₦
                </div>

                <strong>
                    No sales yet
                </strong>

                <p>
                    Sales transactions will
                    appear here automatically.
                </p>

            </div>

        `;
    }


    const recent =
        [...sales]
            .sort(
                (
                    a,
                    b
                ) =>
                    new Date(
                        b.created_at ||
                        b.createdAt ||
                        0
                    ) -
                    new Date(
                        a.created_at ||
                        a.createdAt ||
                        0
                    )
            )
            .slice(
                0,
                5
            );


    return `

        <div class="fg-recent-sales">

            ${recent
                .map(
                    sale => {

                        const amount =
                            numberValue(
                                sale.amount,
                                sale.total_amount,
                                sale.totalAmount,
                                0
                            );


                        return `

                            <div class="fg-sale-item">

                                <div class="fg-sale-icon">
                                    ₦
                                </div>


                                <div class="fg-sale-info">

                                    <strong>
                                        ${
                                            escapeHtml(
                                                sale.payment_method ||
                                                sale.paymentMethod ||
                                                "Sale"
                                            )
                                        }
                                    </strong>

                                    <small>
                                        ${
                                            formatDateTime(
                                                sale.created_at ||
                                                sale.createdAt
                                            )
                                        }
                                    </small>

                                </div>


                                <strong class="fg-sale-amount">

                                    ${formatNaira(
                                        amount
                                    )}

                                </strong>

                            </div>

                        `;
                    }
                )
                .join("")}

        </div>

    `;
}


/* =========================================================
   DASHBOARD WARNING
========================================================= */

function renderDashboardWarning(
    message
) {

    return `

        <div class="fg-dashboard-warning">

            <strong>
                Dashboard notice
            </strong>

            <span>
                ${escapeHtml(
                    message
                )}
            </span>

        </div>

    `;
}


/* =========================================================
   PLATFORM ERROR
========================================================= */

function renderPlatformError(
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

        <section class="fg-dashboard">

            <div class="fg-dashboard-error">

                <div class="fg-error-icon">
                    !
                </div>

                <h2>
                    Unable to load dashboard
                </h2>

                <p>
                    ${escapeHtml(
                        message
                    )}
                </p>

                <button
                    type="button"
                    class="fg-btn fg-btn-primary"
                    id="refreshDashboardBtn"
                >
                    Try Again
                </button>

            </div>

        </section>

    `;


    bindDashboardEvents();

    renderPlatformStyles();
}


/* =========================================================
   REFRESH
========================================================= */

async function refreshDashboard() {

    if (
        DashboardState.isRefreshing
    ) {

        return;
    }


    DashboardState.isRefreshing =
        true;


    DashboardState.error =
        null;


    const buttons =
        document.querySelectorAll(
            "#refreshDashboardBtn"
        );


    buttons.forEach(
        button => {

            button.disabled = true;

            button.dataset.originalText =
                button.innerHTML;

            button.innerHTML =
                "↻ Refreshing...";

        }
    );


    try {

        if (
            DashboardState.mode ===
            "platform"
        ) {

            await loadPlatformDashboard();

        } else {

            await loadOrganizationDashboard();

        }


        DashboardState.loadedAt =
            new Date();


        renderDashboard();


    } catch (error) {

        console.error(
            "Dashboard refresh failed:",
            error
        );


        DashboardState.error =
            error.message ||
            "Dashboard refresh failed.";


        renderDashboard();


    } finally {

        DashboardState.isRefreshing =
            false;


        /*
           Buttons are recreated by renderDashboard(),
           so no need to manually restore them here.
        */
    }
}


/* =========================================================
   BIND DASHBOARD EVENTS
========================================================= */

function bindDashboardEvents() {

    const refreshButtons =
        document.querySelectorAll(
            "#refreshDashboardBtn"
        );


    refreshButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                refreshDashboard
            );

        }
    );


    const quickActions =
        document.querySelectorAll(
            "[data-dashboard-target]"
        );


    quickActions.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const target =
                        button.dataset
                            .dashboardTarget;


                    handleDashboardNavigation(
                        target
                    );

                }
            );

        }
    );
}


/* =========================================================
   DASHBOARD NAVIGATION
========================================================= */

function handleDashboardNavigation(
    target
) {

    const routes = {

        organizations:
            "organization.html",

        users:
            "staff.html",

        stations:
            "stations.html",

        alerts:
            "alerts.html"

    };


    const route =
        routes[target];


    if (!route) {

        console.warn(
            "No dashboard route configured for:",
            target
        );

        return;
    }


    window.location.href =
        route;
}


/* =========================================================
   ORGANIZATION STATUS
========================================================= */

function organizationIsActive(
    organization
) {

    if (!organization) {
        return false;
    }


    if (
        organization.is_active !==
        undefined
    ) {

        return Boolean(
            organization.is_active
        );
    }


    if (
        organization.active !==
        undefined
    ) {

        return Boolean(
            organization.active
        );
    }


    const status =
        String(
            organization.status ||
            "active"
        ).toLowerCase();


    return (
        status !== "inactive" &&
        status !== "disabled" &&
        status !== "suspended"
    );
}


/* =========================================================
   SHIFT STATUS
========================================================= */

function isOpenShift(
    shift
) {

    const status =
        String(
            shift.status ||
            shift.shift_status ||
            ""
        ).toLowerCase();


    if (
        [
            "open",
            "active",
            "running"
        ].includes(
            status
        )
    ) {

        return true;
    }


    if (
        [
            "closed",
            "completed",
            "cancelled"
        ].includes(
            status
        )
    ) {

        return false;
    }


    if (
        shift.is_open !==
        undefined
    ) {

        return Boolean(
            shift.is_open
        );
    }


    if (
        shift.closed_at ||
        shift.closedAt
    ) {

        return false;
    }


    return false;
}


/* =========================================================
   GAP STATUS
========================================================= */

function isResolvedGap(
    gap
) {

    const status =
        String(
            gap.status ||
            gap.gap_status ||
            ""
        ).toLowerCase();


    return [
        "resolved",
        "closed",
        "normal",
        "settled"
    ].includes(
        status
    );
}


/* =========================================================
   ALERT STATUS
========================================================= */

function isResolvedAlert(
    alert
) {

    const status =
        String(
            alert.status ||
            alert.alert_status ||
            ""
        ).toLowerCase();


    return [
        "resolved",
        "closed",
        "dismissed",
        "inactive"
    ].includes(
        status
    );
}


/* =========================================================
   IS TODAY
========================================================= */

function isToday(
    dateValue
) {

    if (!dateValue) {
        return false;
    }


    const date =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return false;
    }


    const today =
        new Date();


    return (
        date.getFullYear() ===
            today.getFullYear() &&

        date.getMonth() ===
            today.getMonth() &&

        date.getDate() ===
            today.getDate()
    );
}


/* =========================================================
   GET USER DISPLAY NAME
========================================================= */

function getUserDisplayName() {

    const user =
        DashboardState.currentUser;


    return (
        user?.full_name ||
        user?.fullName ||
        user?.name ||
        user?.email ||
        "User"
    );
}


/* =========================================================
   GET ORGANIZATION NAME
========================================================= */

function getOrganizationName() {

    const user =
        DashboardState.currentUser;


    return (
        user?.organization_name ||
        user?.organizationName ||
        user?.organization?.name ||
        "FuelGap Organization"
    );
}


/* =========================================================
   EXTRACT OBJECT
========================================================= */

function extractObject(
    response,
    keys = []
) {

    if (!response) {
        return null;
    }


    for (
        const key of keys
    ) {

        if (
            response[key] &&
            typeof response[key] ===
                "object" &&
            !Array.isArray(
                response[key]
            )
        ) {

            return response[key];
        }
    }


    if (
        response.data &&
        typeof response.data ===
            "object" &&
        !Array.isArray(
            response.data
        )
    ) {

        return response.data;
    }


    return (
        typeof response ===
            "object" &&
        !Array.isArray(
            response
        )
            ? response
            : null
    );
}


/* =========================================================
   EXTRACT ARRAY
========================================================= */

function extractArray(
    response,
    keys = []
) {

    if (!response) {
        return [];
    }


    if (
        Array.isArray(
            response
        )
    ) {

        return response;
    }


    for (
        const key of keys
    ) {

        if (
            Array.isArray(
                response[key]
            )
        ) {

            return response[key];
        }
    }


    if (
        response.data &&
        Array.isArray(
            response.data
        )
    ) {

        return response.data;
    }


    if (
        response.data &&
        typeof response.data ===
            "object"
    ) {

        for (
            const key of keys
        ) {

            if (
                Array.isArray(
                    response.data[key]
                )
            ) {

                return response.data[key];
            }
        }
    }


    return [];
}


/* =========================================================
   NUMBER VALUE
========================================================= */

function numberValue(
    ...values
) {

    for (
        const value of values
    ) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            continue;
        }


        const number =
            Number(
                value
            );


        if (
            Number.isFinite(
                number
            )
        ) {

            return number;
        }
    }


    return 0;
}


/* =========================================================
   NULLABLE NUMBER
========================================================= */

function nullableNumberValue(
    ...values
) {

    for (
        const value of values
    ) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            continue;
        }


        const number =
            Number(
                value
            );


        if (
            Number.isFinite(
                number
            )
        ) {

            return number;
        }
    }


    return null;
}


/* =========================================================
   FORMAT NAIRA
========================================================= */

function formatNaira(
    value
) {

    return new Intl.NumberFormat(
        "en-NG",
        {
            style: "currency",
            currency: "NGN",
            maximumFractionDigits: 2
        }
    ).format(
        numberValue(
            value
        )
    );
}


/* =========================================================
   FORMAT DATE
========================================================= */

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

        return "—";
    }


    return new Intl.DateTimeFormat(
        "en-NG",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    ).format(
        date
    );
}


/* =========================================================
   FORMAT DATE TIME
========================================================= */

function formatDateTime(
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

        return "—";
    }


    return new Intl.DateTimeFormat(
        "en-NG",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(
        date
    );
}


/* =========================================================
   LAST UPDATED
========================================================= */

function formatLastUpdated() {

    if (
        !DashboardState.loadedAt
    ) {

        return "Not updated yet";
    }


    return `Last updated ${formatDateTime(
        DashboardState.loadedAt
    )}`;
}


/* =========================================================
   INITIALS
========================================================= */

function getInitials(
    name
) {

    const parts =
        String(
            name ||
            ""
        )
            .trim()
            .split(
                /\s+/
            )
            .filter(
                Boolean
            );


    if (!parts.length) {
        return "FG";
    }


    if (
        parts.length === 1
    ) {

        return parts[0]
            .substring(
                0,
                2
            )
            .toUpperCase();
    }


    return (
        parts[0][0] +
        parts[1][0]
    ).toUpperCase();
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

    return String(
        value ??
        ""
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


/* =========================================================
   ICONS
========================================================= */

function getIcon(
    icon
) {

    const icons = {

        building: "▦",

        activity: "◉",

        users: "♙",

        station: "⌂",

        pump: "▥",

        nozzle: "◈",

        sales: "₦",

        payment: "₦",

        alert: "!",

        shift: "◷",

        gap: "△",

        organizations: "▦",

        stations: "⌂",

        alerts: "!"

    };


    return icons[icon] ||
        "•";
}


/* =========================================================
   PLATFORM CSS
========================================================= */

function renderPlatformStyles() {

    if (
        document.getElementById(
            "fuelgapDashboardStyles"
        )
    ) {

        return;
    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "fuelgapDashboardStyles";


    style.textContent = `

        * {
            box-sizing: border-box;
        }


        .fg-dashboard {
            width: 100%;
            max-width: 1600px;
            margin: 0 auto;
            padding: 28px;
            color: #151515;
        }


        .fg-dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 24px;
            margin-bottom: 28px;
        }


        .fg-dashboard-label {
            display: inline-block;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 1.8px;
            color: #c99800;
            margin-bottom: 6px;
        }


        .fg-dashboard-header h1 {
            margin: 0;
            font-size: 32px;
            line-height: 1.1;
            font-weight: 800;
            color: #151515;
        }


        .fg-dashboard-header p {
            margin: 8px 0 0;
            color: #707070;
            font-size: 14px;
        }


        .fg-dashboard-header-right {
            display: flex;
            align-items: center;
            gap: 12px;
        }


        .fg-system-status {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 14px;
            border: 1px solid #e9e9e9;
            border-radius: 999px;
            background: #fff;
            font-size: 12px;
            font-weight: 700;
            color: #505050;
        }


        .fg-system-status span,
        .fg-health-badge span,
        .fg-live-indicator span {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #e0ad00;
            display: inline-block;
            box-shadow: 0 0 0 4px rgba(224, 173, 0, .10);
        }


        .fg-btn {
            border: none;
            border-radius: 10px;
            padding: 11px 16px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 700;
            transition: .2s ease;
        }


        .fg-btn:disabled {
            opacity: .65;
            cursor: not-allowed;
        }


        .fg-btn-primary {
            background: #f2c400;
            color: #111;
        }


        .fg-btn-primary:hover {
            background: #ddb300;
            transform: translateY(-1px);
        }


        .fg-btn-secondary {
            background: #fff;
            color: #222;
            border: 1px solid #dedede;
        }


        .fg-btn-secondary:hover {
            border-color: #c9a500;
            background: #fffdf0;
        }


        .fg-stat-grid {
            display: grid;
            grid-template-columns:
                repeat(
                    4,
                    minmax(
                        0,
                        1fr
                    )
                );
            gap: 16px;
            margin-bottom: 24px;
        }


        .fg-stat-card {
            background: #fff;
            border: 1px solid #e9e9e9;
            border-radius: 16px;
            padding: 20px;
            min-height: 150px;
            box-shadow:
                0 5px 20px
                rgba(0,0,0,.035);
        }


        .fg-stat-top {
            display: flex;
            justify-content: space-between;
            margin-bottom: 14px;
        }


        .fg-stat-icon {
            width: 42px;
            height: 42px;
            border-radius: 11px;
            background: #fff8d9;
            color: #a77c00;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            font-weight: 800;
        }


        .fg-stat-value {
            font-size: 25px;
            font-weight: 850;
            color: #171717;
            line-height: 1.1;
            margin-bottom: 7px;
            word-break: break-word;
        }


        .fg-stat-title {
            font-size: 13px;
            font-weight: 800;
            color: #333;
        }


        .fg-stat-description {
            margin-top: 5px;
            font-size: 11px;
            color: #888;
        }


        .fg-dashboard-card {
            background: #fff;
            border: 1px solid #e9e9e9;
            border-radius: 16px;
            box-shadow:
                0 5px 20px
                rgba(0,0,0,.035);
            overflow: hidden;
            margin-bottom: 24px;
        }


        .fg-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 22px 24px;
            border-bottom: 1px solid #eeeeee;
        }


        .fg-card-eyebrow {
            display: block;
            color: #ba8c00;
            font-size: 10px;
            font-weight: 850;
            letter-spacing: 1.5px;
            margin-bottom: 6px;
        }


        .fg-card-header h2 {
            margin: 0;
            font-size: 19px;
            font-weight: 800;
        }


        .fg-card-header p {
            margin: 6px 0 0;
            color: #808080;
            font-size: 12px;
        }


        .fg-table-wrapper {
            width: 100%;
            overflow-x: auto;
        }


        .fg-data-table {
            width: 100%;
            min-width: 850px;
            border-collapse: collapse;
        }


        .fg-data-table th {
            padding: 13px 18px;
            text-align: left;
            background: #fafafa;
            color: #777;
            font-size: 10px;
            font-weight: 850;
            text-transform: uppercase;
            letter-spacing: .8px;
            border-bottom: 1px solid #eeeeee;
        }


        .fg-data-table td {
            padding: 15px 18px;
            border-bottom: 1px solid #f0f0f0;
            font-size: 13px;
            vertical-align: middle;
        }


        .fg-data-table tbody tr:hover {
            background: #fffdf3;
        }


        .fg-org-name {
            display: flex;
            align-items: center;
            gap: 11px;
        }


        .fg-org-avatar {
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: #fff2ad;
            color: #8c6900;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 850;
            flex-shrink: 0;
        }


        .fg-org-name strong {
            display: block;
            font-size: 13px;
        }


        .fg-org-name small {
            display: block;
            margin-top: 3px;
            color: #aaa;
            font-size: 10px;
        }


        .fg-contact-cell span {
            display: block;
            color: #333;
        }


        .fg-contact-cell small {
            display: block;
            margin-top: 4px;
            color: #999;
        }


        .fg-table-subtext {
            display: block;
            color: #999;
            font-size: 10px;
            margin-top: 3px;
        }


        .fg-status-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 9px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: 800;
        }


        .fg-status-badge span {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: currentColor;
        }


        .fg-status-active {
            color: #6d5a00;
            background: #fff7c9;
        }


        .fg-status-inactive {
            color: #777;
            background: #f1f1f1;
        }


        .fg-empty-cell {
            text-align: center !important;
            padding: 40px !important;
            color: #999;
        }


        .fg-dashboard-bottom-grid {
            display: grid;
            grid-template-columns:
                repeat(
                    2,
                    minmax(
                        0,
                        1fr
                    )
                );
            gap: 24px;
        }


        .fg-dashboard-bottom-grid
        .fg-dashboard-card {
            margin-bottom: 0;
        }


        .fg-health-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 11px;
            border-radius: 999px;
            background: #fff8d8;
            color: #816400;
            font-size: 11px;
            font-weight: 800;
        }


        .fg-health-list {
            padding: 8px 24px 18px;
        }


        .fg-health-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 15px;
            padding: 14px 0;
            border-bottom: 1px solid #f0f0f0;
        }


        .fg-health-item:last-child {
            border-bottom: none;
        }


        .fg-health-item > div {
            display: flex;
            align-items: center;
            gap: 9px;
        }


        .fg-health-item strong {
            font-size: 13px;
        }


        .fg-health-item > span:last-child {
            font-size: 12px;
            color: #777;
            font-weight: 700;
        }


        .fg-health-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #aaa;
        }


        .fg-health-dot.healthy {
            background: #d5a900;
        }


        .fg-quick-actions {
            padding: 8px 18px 18px;
            display: grid;
            gap: 8px;
        }


        .fg-quick-action {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 13px;
            border: 1px solid #eeeeee;
            background: #fff;
            border-radius: 11px;
            cursor: pointer;
            text-align: left;
            transition: .2s ease;
        }


        .fg-quick-action:hover {
            background: #fffdf1;
            border-color: #ead36a;
            transform: translateY(-1px);
        }


        .fg-quick-icon {
            width: 36px;
            height: 36px;
            border-radius: 9px;
            background: #fff8d9;
            color: #9b7600;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            flex-shrink: 0;
        }


        .fg-quick-action > div:nth-child(2) {
            flex: 1;
        }


        .fg-quick-action strong {
            display: block;
            color: #222;
            font-size: 12px;
        }


        .fg-quick-action span {
            display: block;
            color: #999;
            font-size: 10px;
            margin-top: 3px;
        }


        .fg-quick-arrow {
            font-size: 18px !important;
            color: #bbb !important;
            margin: 0 !important;
        }


        .fg-dashboard-footer {
            display: flex;
            justify-content: space-between;
            gap: 15px;
            padding: 20px 2px 5px;
            color: #999;
            font-size: 11px;
        }


        .fg-dashboard-warning {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 13px 16px;
            margin-bottom: 20px;
            border-radius: 11px;
            background: #fff8d8;
            border: 1px solid #f0dc76;
            color: #6f5b00;
            font-size: 12px;
        }


        .fg-dashboard-warning strong {
            font-weight: 850;
        }


        .fg-dashboard-error {
            max-width: 520px;
            margin: 80px auto;
            text-align: center;
            padding: 40px;
            background: #fff;
            border: 1px solid #e9e9e9;
            border-radius: 18px;
            box-shadow:
                0 8px 30px
                rgba(0,0,0,.05);
        }


        .fg-error-icon {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            margin: 0 auto 18px;
            background: #fff0bd;
            color: #9a7600;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 22px;
        }


        .fg-dashboard-error h2 {
            margin: 0 0 10px;
        }


        .fg-dashboard-error p {
            margin: 0 0 20px;
            color: #777;
            font-size: 13px;
            line-height: 1.6;
        }


        .fg-dashboard-loading {
            min-height: 60vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 30px;
        }


        .fg-loading-spinner {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            border: 4px solid #f1e7ad;
            border-top-color: #d5a900;
            animation: fgSpin .8s linear infinite;
            margin-bottom: 18px;
        }


        @keyframes fgSpin {
            to {
                transform: rotate(360deg);
            }
        }


        .fg-dashboard-loading h2 {
            margin: 0 0 8px;
            font-size: 20px;
        }


        .fg-dashboard-loading p {
            margin: 0;
            color: #999;
            font-size: 13px;
        }


        .fg-organization-banner {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            padding: 22px 24px;
            margin-bottom: 24px;
            border-radius: 16px;
            background: linear-gradient(
                135deg,
                #fffbea,
                #fff
            );
            border: 1px solid #eee3a9;
        }


        .fg-organization-banner h2 {
            margin: 0;
            font-size: 21px;
        }


        .fg-organization-banner p {
            margin: 7px 0 0;
            color: #777;
            font-size: 12px;
        }


        .fg-live-indicator {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 9px 12px;
            border-radius: 999px;
            background: #fff;
            border: 1px solid #eee;
            font-size: 11px;
            font-weight: 800;
            white-space: nowrap;
        }


        .fg-empty-state {
            padding: 35px 24px;
            text-align: center;
            color: #999;
        }


        .fg-empty-icon {
            width: 44px;
            height: 44px;
            margin: 0 auto 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            background: #fff8d9;
            color: #9c7700;
            font-weight: 900;
        }


        .fg-empty-state strong {
            display: block;
            color: #444;
            font-size: 13px;
        }


        .fg-empty-state p {
            margin: 5px 0 0;
            font-size: 11px;
        }


        .fg-recent-sales {
            padding: 8px 20px 16px;
        }


        .fg-sale-item {
            display: flex;
            align-items: center;
            gap: 11px;
            padding: 12px 3px;
            border-bottom: 1px solid #f0f0f0;
        }


        .fg-sale-item:last-child {
            border-bottom: none;
        }


        .fg-sale-icon {
            width: 34px;
            height: 34px;
            border-radius: 9px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff8d9;
            color: #987300;
            font-weight: 900;
        }


        .fg-sale-info {
            flex: 1;
        }


        .fg-sale-info strong {
            display: block;
            font-size: 12px;
        }


        .fg-sale-info small {
            display: block;
            margin-top: 3px;
            color: #999;
            font-size: 10px;
        }


        .fg-sale-amount {
            font-size: 12px;
            color: #333;
        }


        @media (
            max-width: 1100px
        ) {

            .fg-stat-grid {
                grid-template-columns:
                    repeat(
                        2,
                        minmax(
                            0,
                            1fr
                        )
                    );
            }

        }


        @media (
            max-width: 800px
        ) {

            .fg-dashboard {
                padding: 18px;
            }


            .fg-dashboard-header {
                align-items: flex-start;
                flex-direction: column;
            }


            .fg-dashboard-header-right {
                width: 100%;
                justify-content: space-between;
            }


            .fg-dashboard-bottom-grid {
                grid-template-columns: 1fr;
            }


            .fg-organization-banner {
                align-items: flex-start;
                flex-direction: column;
            }

        }


        @media (
            max-width: 560px
        ) {

            .fg-stat-grid {
                grid-template-columns: 1fr;
            }


            .fg-dashboard-header h1 {
                font-size: 26px;
            }


            .fg-dashboard-header-right {
                align-items: stretch;
                flex-direction: column;
            }


            .fg-system-status,
            .fg-dashboard-header-right
            .fg-btn {
                justify-content: center;
                width: 100%;
            }


            .fg-card-header {
                align-items: flex-start;
                flex-direction: column;
            }


            .fg-dashboard-footer {
                flex-direction: column;
            }

        }

    `;


    document.head.appendChild(
        style
    );
}


/* =========================================================
   ORGANIZATION STYLES
========================================================= */

function renderOrganizationStyles() {

    renderPlatformStyles();
}


/* =========================================================
   EXPORTS
========================================================= */

window.DashboardState =
    DashboardState;

window.initializeDashboard =
    initializeDashboard;

window.renderDashboard =
    renderDashboard;

window.loadPlatformDashboard =
    loadPlatformDashboard;

window.loadPlatformOverview =
    loadPlatformOverview;

window.loadPlatformOrganizations =
    loadPlatformOrganizations;

window.loadOrganizationDashboard =
    loadOrganizationDashboard;

window.refreshDashboard =
    refreshDashboard;


/* =========================================================
   DEBUG LOG
========================================================= */

console.log(
    "FuelGap dynamic dashboard.js loaded successfully."
);