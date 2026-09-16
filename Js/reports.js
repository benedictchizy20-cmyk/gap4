/* =========================================================
   FUELGAP - REPORTS / BUSINESS INTELLIGENCE
   SUPABASE + EXPRESS BACKEND
   HTTP-ONLY COOKIE AUTHENTICATION
   NO LOCALSTORAGE REPORT DATA

   COMPLETE FRONTEND REPORTS CONTROLLER
   CSS INCLUDED
========================================================= */


/* =========================================================
   REPORTS STATE
========================================================= */

const ReportsState = {

    currentUser: null,

    report: null,

    records: [],

    filteredRecords: [],

    stations: [],

    shifts: [],

    filters: {
        station_id: "",
        shift_id: "",
        start_date: "",
        end_date: "",
        search: ""
    },

    isLoading: false,

    lastUpdated: null

};


/* =========================================================
   INITIALIZE REPORTS PAGE
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    try {

        injectReportsStyles();

        await initializeReports();

    } catch (error) {

        console.error("FuelGap Reports initialization error:", error);

    }

});


/* =========================================================
   INITIALIZE
========================================================= */

async function initializeReports() {

    if (!window.FuelGapAPI) {

        showFatalError(
            "FuelGap API client is not available. Make sure api.js is loaded before reports.js."
        );

        return;

    }


    /* -----------------------------------------------------
       AUTHENTICATION
    ----------------------------------------------------- */

    try {

        const authResponse = await FuelGapAPI.getCurrentUser();

        ReportsState.currentUser = extractApiData(authResponse);

    } catch (error) {

        console.error("Reports authentication failed:", error);

        return;

    }


    if (!ReportsState.currentUser) {

        window.location.href = "../login.html";

        return;

    }


    /* -----------------------------------------------------
       PERMISSION CHECK
    ----------------------------------------------------- */

    const role = String(
        ReportsState.currentUser.role || ""
    ).toLowerCase();


    const allowedRoles = [
        "owner",
        "admin",
        "manager",
        "staff",
        "attendant"
    ];


    if (
        typeof window.hasPermission === "function" &&
        !window.hasPermission(role, "reports")
    ) {

        window.location.href = "./dashboard.html";

        return;

    }


    if (!allowedRoles.includes(role)) {

        showFatalError(
            "Your account does not have permission to access reports."
        );

        return;

    }


    /* -----------------------------------------------------
       RENDER PAGE
    ----------------------------------------------------- */

    renderReportsPage();

    setupReportEvents();

    await loadReports();

}


/* =========================================================
   EXTRACT API DATA
========================================================= */

function extractApiData(response) {

    if (!response) {
        return null;
    }


    if (response.data?.user) {
        return response.data.user;
    }


    if (response.data?.profile) {
        return response.data.profile;
    }


    if (response.data) {
        return response.data;
    }


    if (response.user) {
        return response.user;
    }


    return response;

}


/* =========================================================
   EXTRACT REPORT PAYLOAD
========================================================= */

function extractReportPayload(response) {

    if (!response) {
        return {};
    }


    if (
        response.data &&
        typeof response.data === "object"
    ) {

        return response.data;

    }


    return response;

}


/* =========================================================
   RENDER REPORT PAGE
========================================================= */

function renderReportsPage() {

    const pageContent =
        document.getElementById("pageContent") ||
        document.getElementById("app");


    if (!pageContent) {

        console.error(
            "FuelGap Reports: #pageContent or #app was not found."
        );

        return;

    }


    pageContent.innerHTML = `

        <section class="fg-reports-page">

            <!-- =========================================
                 PAGE HEADER
            ========================================== -->

            <div class="fg-reports-header">

                <div class="fg-reports-title">

                    <div class="fg-reports-eyebrow">
                        BUSINESS INTELLIGENCE
                    </div>

                    <h1>
                        Reports & Reconciliation
                    </h1>

                    <p>
                        Monitor sales performance, meter readings,
                        shift reconciliation and fuel variances.
                    </p>

                </div>


                <div class="fg-reports-actions">

                    <button
                        type="button"
                        id="refreshReportsBtn"
                        class="fg-report-btn fg-report-btn-primary"
                    >

                        <span class="fg-btn-icon">↻</span>

                        Refresh Reports

                    </button>

                </div>

            </div>


            <!-- =========================================
                 SUMMARY CARDS
            ========================================== -->

            <div
                class="fg-report-summary-grid"
                id="reportsSummary"
            >

                ${renderSummarySkeleton()}

            </div>


            <!-- =========================================
                 FILTER PANEL
            ========================================== -->

            <div class="fg-report-filter-panel">

                <div class="fg-filter-heading">

                    <div>

                        <span class="fg-filter-label">
                            REPORT FILTERS
                        </span>

                        <span class="fg-filter-description">
                            Narrow down your report data
                        </span>

                    </div>

                    <button
                        type="button"
                        id="clearReportFiltersBtn"
                        class="fg-clear-filter-btn"
                    >
                        Clear Filters
                    </button>

                </div>


                <div class="fg-report-filters">

                    <!-- Station -->

                    <div class="fg-report-field">

                        <label for="reportStationFilter">
                            Station
                        </label>

                        <select id="reportStationFilter">

                            <option value="">
                                All Stations
                            </option>

                        </select>

                    </div>


                    <!-- Shift -->

                    <div class="fg-report-field">

                        <label for="reportShiftFilter">
                            Shift
                        </label>

                        <select id="reportShiftFilter">

                            <option value="">
                                All Shifts
                            </option>

                        </select>

                    </div>


                    <!-- Date -->

                    <div class="fg-report-field">

                        <label for="reportDateFilter">
                            Report Date
                        </label>

                        <input
                            type="date"
                            id="reportDateFilter"
                        >

                    </div>


                    <!-- Search -->

                    <div class="fg-report-field fg-report-search-field">

                        <label for="reportSearch">
                            Search
                        </label>

                        <div class="fg-report-search-box">

                            <span class="fg-search-icon">
                                ⌕
                            </span>

                            <input
                                type="text"
                                id="reportSearch"
                                placeholder="Search station or shift..."
                                autocomplete="off"
                            >

                        </div>

                    </div>

                </div>

            </div>


            <!-- =========================================
                 LAST UPDATED
            ========================================== -->

            <div
                class="fg-report-last-updated"
                id="reportLastUpdated"
            >
                Waiting for report data...
            </div>


            <!-- =========================================
                 REPORTS CONTAINER
            ========================================== -->

            <div
                id="reportsContainer"
                class="fg-reports-container"
            >

                ${renderLoadingState()}

            </div>

        </section>

    `;

}


/* =========================================================
   LOAD REPORTS
========================================================= */

async function loadReports() {

    if (ReportsState.isLoading) {
        return;
    }


    ReportsState.isLoading = true;

    setRefreshButtonLoading(true);

    showLoadingState();


    try {

        const filters = buildBackendFilters();


        console.log(
            "FuelGap Reports Filters:",
            filters
        );


        const response =
            await FuelGapAPI.getReports(filters);


        const payload =
            extractReportPayload(response);


        ReportsState.report = payload;


        normalizeReportData(payload);


        loadReportFilters();


        buildReportRecords();


        applyClientFilters();


        updateReportSummary();


        renderReportRecords();


        ReportsState.lastUpdated = new Date();


        updateLastUpdated();


    } catch (error) {

        console.error(
            "FuelGap Reports load error:",
            error
        );


        showReportError(
            error?.message ||
            "Unable to load reports from the FuelGap server."
        );

    } finally {

        ReportsState.isLoading = false;

        setRefreshButtonLoading(false);

    }

}


/* =========================================================
   BUILD BACKEND FILTERS
========================================================= */

function buildBackendFilters() {

    const filters = {};


    if (ReportsState.filters.station_id) {

        filters.station_id =
            ReportsState.filters.station_id;

    }


    if (ReportsState.filters.shift_id) {

        filters.shift_id =
            ReportsState.filters.shift_id;

    }


    if (ReportsState.filters.start_date) {

        filters.start_date =
            ReportsState.filters.start_date;

    }


    if (ReportsState.filters.end_date) {

        filters.end_date =
            ReportsState.filters.end_date;

    }


    return filters;

}


/* =========================================================
   NORMALIZE REPORT DATA
========================================================= */

function normalizeReportData(payload) {

    ReportsState.stations =
        Array.isArray(payload.station_summary)
            ? payload.station_summary
            : [];


    const sales =
        Array.isArray(payload.sales)
            ? payload.sales
            : [];


    const gaps =
        Array.isArray(payload.gaps)
            ? payload.gaps
            : [];


    const meterReadings =
        Array.isArray(payload.meter_readings)
            ? payload.meter_readings
            : [];


    const shiftsMap = new Map();


    [
        ...sales,
        ...gaps,
        ...meterReadings
    ].forEach(record => {

        const shiftId =
            record.shift_id ||
            record.shiftId;


        if (!shiftId) {
            return;
        }


        const shiftName =
            record.shift_name ||
            record.shiftName ||
            `Shift ${String(shiftId).slice(0, 8)}`;


        if (!shiftsMap.has(shiftId)) {

            shiftsMap.set(
                shiftId,
                {
                    id: shiftId,
                    name: shiftName,
                    shift_name: shiftName,
                    station_id:
                        record.station_id ||
                        record.stationId ||
                        "",
                    shift_date:
                        record.shift_date ||
                        record.shiftDate ||
                        record.created_at ||
                        ""
                }
            );

        }

    });


    ReportsState.shifts =
        Array.from(shiftsMap.values());

}


/* =========================================================
   LOAD FILTER OPTIONS
========================================================= */

function loadReportFilters() {

    const stationSelect =
        document.getElementById(
            "reportStationFilter"
        );


    const shiftSelect =
        document.getElementById(
            "reportShiftFilter"
        );


    if (stationSelect) {

        const currentValue =
            ReportsState.filters.station_id;


        stationSelect.innerHTML = `

            <option value="">
                All Stations
            </option>

        `;


        ReportsState.stations
            .forEach(station => {

                const stationId =
                    station.station_id ||
                    station.id;


                const stationName =
                    station.station_name ||
                    station.name ||
                    "Unnamed Station";


                if (!stationId) {
                    return;
                }


                const option =
                    document.createElement("option");


                option.value = stationId;

                option.textContent =
                    stationName;


                stationSelect.appendChild(option);

            });


        stationSelect.value =
            currentValue || "";

    }


    if (shiftSelect) {

        const currentValue =
            ReportsState.filters.shift_id;


        shiftSelect.innerHTML = `

            <option value="">
                All Shifts
            </option>

        `;


        ReportsState.shifts
            .sort((a, b) => {

                return String(
                    b.shift_date || ""
                ).localeCompare(
                    String(a.shift_date || "")
                );

            })
            .forEach(shift => {

                const option =
                    document.createElement("option");


                option.value =
                    shift.id;


                const dateText =
                    formatDate(
                        shift.shift_date
                    );


                option.textContent =
                    dateText &&
                    dateText !== "—"
                        ? `${shift.name} • ${dateText}`
                        : shift.name;


                shiftSelect.appendChild(option);

            });


        shiftSelect.value =
            currentValue || "";

    }

}


/* =========================================================
   SETUP EVENTS
========================================================= */

function setupReportEvents() {

    document.addEventListener(
        "click",
        handleReportsClick
    );


    const stationSelect =
        document.getElementById(
            "reportStationFilter"
        );


    if (stationSelect) {

        stationSelect.addEventListener(
            "change",
            async event => {

                ReportsState.filters.station_id =
                    event.target.value;


                /*
                 * Reset shift if the selected shift
                 * does not belong to the selected station.
                 */

                const selectedShift =
                    ReportsState.shifts.find(
                        shift =>
                            String(shift.id) ===
                            String(
                                ReportsState.filters.shift_id
                            )
                    );


                if (
                    selectedShift &&
                    ReportsState.filters.station_id &&
                    String(
                        selectedShift.station_id
                    ) !==
                    String(
                        ReportsState.filters.station_id
                    )
                ) {

                    ReportsState.filters.shift_id = "";

                }


                loadReportFilters();

                await loadReports();

            }
        );

    }


    const shiftSelect =
        document.getElementById(
            "reportShiftFilter"
        );


    if (shiftSelect) {

        shiftSelect.addEventListener(
            "change",
            async event => {

                ReportsState.filters.shift_id =
                    event.target.value;


                await loadReports();

            }
        );

    }


    const dateInput =
        document.getElementById(
            "reportDateFilter"
        );


    if (dateInput) {

        dateInput.addEventListener(
            "change",
            async event => {

                const selectedDate =
                    event.target.value;


                ReportsState.filters.start_date =
                    selectedDate;


                ReportsState.filters.end_date =
                    selectedDate;


                await loadReports();

            }
        );

    }


    const searchInput =
        document.getElementById(
            "reportSearch"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            event => {

                ReportsState.filters.search =
                    event.target.value
                        .trim()
                        .toLowerCase();


                applyClientFilters();

                updateReportSummary();

                renderReportRecords();

            }
        );

    }


    const clearButton =
        document.getElementById(
            "clearReportFiltersBtn"
        );


    if (clearButton) {

        clearButton.addEventListener(
            "click",
            async () => {

                ReportsState.filters = {

                    station_id: "",

                    shift_id: "",

                    start_date: "",

                    end_date: "",

                    search: ""

                };


                const stationSelect =
                    document.getElementById(
                        "reportStationFilter"
                    );


                const shiftSelect =
                    document.getElementById(
                        "reportShiftFilter"
                    );


                const dateInput =
                    document.getElementById(
                        "reportDateFilter"
                    );


                const searchInput =
                    document.getElementById(
                        "reportSearch"
                    );


                if (stationSelect) {
                    stationSelect.value = "";
                }


                if (shiftSelect) {
                    shiftSelect.value = "";
                }


                if (dateInput) {
                    dateInput.value = "";
                }


                if (searchInput) {
                    searchInput.value = "";
                }


                await loadReports();

            }
        );

    }

}


/* =========================================================
   HANDLE REPORT CLICKS
========================================================= */

function handleReportsClick(event) {

    const refreshButton =
        event.target.closest(
            "#refreshReportsBtn"
        );


    if (refreshButton) {

        loadReports();

        return;

    }


    const retryButton =
        event.target.closest(
            "#retryReportsBtn"
        );


    if (retryButton) {

        loadReports();

        return;

    }


    const detailsButton =
        event.target.closest(
            "[data-report-details]"
        );


    if (detailsButton) {

        const recordId =
            detailsButton.dataset.reportDetails;


        showReportDetails(recordId);

    }

}


/* =========================================================
   BUILD REPORT RECORDS
========================================================= */

function buildReportRecords() {

    const payload =
        ReportsState.report || {};


    const sales =
        Array.isArray(payload.sales)
            ? payload.sales
            : [];


    const gaps =
        Array.isArray(payload.gaps)
            ? payload.gaps
            : [];


    const stationSummary =
        Array.isArray(payload.station_summary)
            ? payload.station_summary
            : [];


    const stationMap = new Map();


    ReportsState.stations.forEach(
        station => {

            const id =
                station.station_id ||
                station.id;


            if (id) {

                stationMap.set(
                    String(id),
                    station
                );

            }

        }
    );


    stationSummary.forEach(
        station => {

            const id =
                station.station_id ||
                station.id;


            if (id) {

                stationMap.set(
                    String(id),
                    station
                );

            }

        }
    );


    const recordsMap = new Map();


    /* -----------------------------------------------------
       ADD SALES
    ----------------------------------------------------- */

    sales.forEach(sale => {

        const stationId =
            sale.station_id ||
            sale.stationId ||
            "";


        const shiftId =
            sale.shift_id ||
            sale.shiftId ||
            "NO_SHIFT";


        const key =
            `${stationId}_${shiftId}`;


        if (!recordsMap.has(key)) {

            recordsMap.set(
                key,
                createEmptyReportRecord(
                    stationId,
                    shiftId,
                    stationMap
                )
            );

        }


        const record =
            recordsMap.get(key);


        record.totalSales +=
            safeNumber(
                sale.amount ||
                sale.total_amount ||
                sale.totalAmount
            );


        record.totalLitres +=
            safeNumber(
                sale.litres
            );


        record.transactions += 1;


        record.lastDate =
            getLatestDate(
                record.lastDate,
                sale.created_at ||
                sale.createdAt
            );


        if (
            sale.station_name ||
            sale.stationName
        ) {

            record.stationName =
                sale.station_name ||
                sale.stationName;

        }


        if (
            sale.shift_name ||
            sale.shiftName
        ) {

            record.shiftName =
                sale.shift_name ||
                sale.shiftName;

        }

    });


    /* -----------------------------------------------------
       ADD GAPS
    ----------------------------------------------------- */

    gaps.forEach(gap => {

        const stationId =
            gap.station_id ||
            gap.stationId ||
            "";


        const shiftId =
            gap.shift_id ||
            gap.shiftId ||
            "NO_SHIFT";


        const key =
            `${stationId}_${shiftId}`;


        if (!recordsMap.has(key)) {

            recordsMap.set(
                key,
                createEmptyReportRecord(
                    stationId,
                    shiftId,
                    stationMap
                )
            );

        }


        const record =
            recordsMap.get(key);


        record.gapRows += 1;


        record.totalExpectedSales +=
            safeNumber(
                gap.expected_sales ||
                gap.expectedSales
            );


        record.totalActualSales +=
            safeNumber(
                gap.actual_sales ||
                gap.actualSales
            );


        record.totalGap +=
            safeNumber(
                gap.gap_amount ||
                gap.gapAmount
            );


        record.lastDate =
            getLatestDate(
                record.lastDate,
                gap.created_at ||
                gap.createdAt
            );


        const gapStatus =
            String(
                gap.status || ""
            ).toLowerCase();


        record.status =
            getHighestStatus(
                record.status,
                gapStatus
            );


        if (
            gap.station_name ||
            gap.stationName
        ) {

            record.stationName =
                gap.station_name ||
                gap.stationName;

        }


        if (
            gap.shift_name ||
            gap.shiftName
        ) {

            record.shiftName =
                gap.shift_name ||
                gap.shiftName;

        }

    });


    /* -----------------------------------------------------
       FINALIZE RECORDS
    ----------------------------------------------------- */

    const records =
        Array.from(
            recordsMap.values()
        );


    records.forEach(record => {

        /*
         * If no gap rows exist for this shift,
         * actual sales are treated as sales for
         * display/reconciliation purposes.
         */

        if (record.gapRows === 0) {

            record.totalActualSales =
                record.totalSales;

            record.totalExpectedSales =
                record.totalSales;

            record.totalGap = 0;

            record.status = "normal";

        }


        /*
         * Backend gap amount is authoritative when
         * gap records exist.
         */

        record.difference =
            record.totalGap;


        if (
            record.totalExpectedSales > 0
        ) {

            record.variancePercentage =
                Math.abs(
                    record.totalGap
                ) /
                record.totalExpectedSales *
                100;

        } else {

            record.variancePercentage = 0;

        }


        if (
            record.status === "normal" &&
            record.totalGap !== 0
        ) {

            record.status =
                calculateStatus(
                    record.totalGap,
                    record.totalExpectedSales
                );

        }


        record.status =
            normalizeStatus(
                record.status
            );


        record.id =
            `${record.stationId}_${record.shiftId}`;

    });


    /*
     * Include station-level information if a station
     * has a report but no sales/gap rows.
     */

    stationSummary.forEach(station => {

        const stationId =
            station.station_id ||
            station.id;


        if (!stationId) {
            return;
        }


        const existing =
            records.some(
                record =>
                    String(
                        record.stationId
                    ) ===
                    String(stationId)
            );


        /*
         * Do not create a fake shift report.
         * Station summary remains available through
         * the filters and totals.
         */

        if (!existing) {
            return;
        }

    });


    ReportsState.records =
        records.sort(
            sortReports
        );

}


/* =========================================================
   CREATE EMPTY REPORT RECORD
========================================================= */

function createEmptyReportRecord(
    stationId,
    shiftId,
    stationMap
) {

    const station =
        stationMap.get(
            String(stationId)
        );


    const stationName =
        station?.station_name ||
        station?.name ||
        "Unknown Station";


    return {

        id: "",

        stationId,

        stationName,

        city:
            station?.city || "",

        state:
            station?.state || "",

        shiftId:
            shiftId === "NO_SHIFT"
                ? ""
                : shiftId,

        shiftName:
            "Shift",

        totalSales: 0,

        totalActualSales: 0,

        totalExpectedSales: 0,

        totalGap: 0,

        totalLitres: 0,

        transactions: 0,

        gapRows: 0,

        difference: 0,

        variancePercentage: 0,

        status: "normal",

        lastDate: ""

    };

}


/* =========================================================
   APPLY CLIENT FILTERS
========================================================= */

function applyClientFilters() {

    const search =
        ReportsState.filters.search;


    ReportsState.filteredRecords =
        ReportsState.records.filter(
            record => {

                if (!search) {
                    return true;
                }


                const searchableText =
                    [

                        record.stationName,

                        record.city,

                        record.state,

                        record.shiftName,

                        record.status,

                        record.shiftId

                    ]
                    .join(" ")
                    .toLowerCase();


                return searchableText.includes(
                    search
                );

            }
        );


    ReportsState.filteredRecords.sort(
        sortReports
    );

}


/* =========================================================
   SORT REPORTS
========================================================= */

function sortReports(a, b) {

    const priority = {

        critical: 1,

        variance: 2,

        surplus: 3,

        normal: 4

    };


    const statusDifference =
        (priority[a.status] || 99) -
        (priority[b.status] || 99);


    if (statusDifference !== 0) {

        return statusDifference;

    }


    return String(
        b.lastDate || ""
    ).localeCompare(
        String(a.lastDate || "")
    );

}


/* =========================================================
   RENDER REPORT RECORDS
========================================================= */

function renderReportRecords() {

    const container =
        document.getElementById(
            "reportsContainer"
        );


    if (!container) {
        return;
    }


    const records =
        ReportsState.filteredRecords;


    if (!records.length) {

        container.innerHTML =
            renderEmptyState();

        return;

    }


    container.innerHTML = `

        <div class="fg-report-results-header">

            <div>

                <span class="fg-results-title">
                    Reconciliation Reports
                </span>

                <span class="fg-results-count">
                    ${records.length}
                    ${records.length === 1 ? "report" : "reports"}
                </span>

            </div>

        </div>


        <div class="fg-report-cards">

            ${records
                .map(
                    record =>
                        renderReportCard(record)
                )
                .join("")}

        </div>

    `;

}


/* =========================================================
   RENDER REPORT CARD
========================================================= */

function renderReportCard(record) {

    const status =
        normalizeStatus(
            record.status
        );


    const statusInfo =
        getStatusInfo(status);


    const safeId =
        escapeHtml(
            record.id
        );


    return `

        <article
            class="fg-report-card fg-status-${status}"
        >

            <div class="fg-report-card-top">

                <div class="fg-report-card-location">

                    <div class="fg-report-station-icon">
                        ⛽
                    </div>

                    <div>

                        <h3>
                            ${escapeHtml(
                                record.stationName
                            )}
                        </h3>

                        <p>
                            ${escapeHtml(
                                record.city || ""
                            )}
                            ${
                                record.city &&
                                record.state
                                    ? ", "
                                    : ""
                            }
                            ${escapeHtml(
                                record.state || ""
                            )}
                        </p>

                    </div>

                </div>


                <span
                    class="fg-report-status fg-status-badge-${status}"
                >

                    <span class="fg-status-dot"></span>

                    ${statusInfo.label}

                </span>

            </div>


            <div class="fg-report-card-shift">

                <span>
                    SHIFT
                </span>

                <strong>
                    ${escapeHtml(
                        record.shiftName ||
                        "No Shift"
                    )}
                </strong>

                ${
                    record.lastDate
                        ? `
                            <small>
                                ${formatDate(
                                    record.lastDate
                                )}
                            </small>
                        `
                        : ""
                }

            </div>


            <div class="fg-report-metrics">

                <div class="fg-report-metric">

                    <span>
                        Total Sales
                    </span>

                    <strong>
                        ${formatCurrency(
                            record.totalSales
                        )}
                    </strong>

                </div>


                <div class="fg-report-metric">

                    <span>
                        Actual Sales
                    </span>

                    <strong>
                        ${formatCurrency(
                            record.totalActualSales
                        )}
                    </strong>

                </div>


                <div class="fg-report-metric">

                    <span>
                        Gap
                    </span>

                    <strong
                        class="${getGapValueClass(
                            record.totalGap
                        )}"
                    >
                        ${formatCurrency(
                            record.totalGap
                        )}
                    </strong>

                </div>


                <div class="fg-report-metric">

                    <span>
                        Variance
                    </span>

                    <strong>
                        ${formatPercentage(
                            record.variancePercentage
                        )}
                    </strong>

                </div>

            </div>


            <div class="fg-report-card-footer">

                <div class="fg-report-extra">

                    <span>
                        ${formatLitres(
                            record.totalLitres
                        )} L sold
                    </span>

                    <span>
                        ${record.transactions}
                        ${
                            record.transactions === 1
                                ? "transaction"
                                : "transactions"
                        }
                    </span>

                </div>


                <button
                    type="button"
                    class="fg-report-details-btn"
                    data-report-details="${safeId}"
                >
                    View Details
                    <span>→</span>
                </button>

            </div>

        </article>

    `;

}


/* =========================================================
   SHOW REPORT DETAILS
========================================================= */

function showReportDetails(recordId) {

    const record =
        ReportsState.records.find(
            item =>
                String(item.id) ===
                String(recordId)
        );


    if (!record) {

        alert(
            "Report details could not be found."
        );

        return;

    }


    const status =
        getStatusInfo(
            normalizeStatus(
                record.status
            )
        );


    const message = [

        "FUELGAP REPORT DETAILS",

        "",

        `Station: ${record.stationName}`,

        `Location: ${
            record.city || "—"
        }${
            record.state
                ? `, ${record.state}`
                : ""
        }`,

        `Shift: ${
            record.shiftName || "—"
        }`,

        `Date: ${
            formatDate(
                record.lastDate
            )
        }`,

        "",

        `Total Sales: ${
            formatCurrency(
                record.totalSales
            )
        }`,

        `Expected Sales: ${
            formatCurrency(
                record.totalExpectedSales
            )
        }`,

        `Actual Sales: ${
            formatCurrency(
                record.totalActualSales
            )
        }`,

        `Gap: ${
            formatCurrency(
                record.totalGap
            )
        }`,

        `Variance: ${
            formatPercentage(
                record.variancePercentage
            )
        }`,

        "",

        `Litres Sold: ${
            formatLitres(
                record.totalLitres
            )
        } L`,

        `Transactions: ${
            record.transactions
        }`,

        `Gap Records: ${
            record.gapRows
        }`,

        `Status: ${
            status.label
        }`

    ].join("\n");


    alert(message);

}


/* =========================================================
   UPDATE SUMMARY
========================================================= */

function updateReportSummary() {

    const container =
        document.getElementById(
            "reportsSummary"
        );


    if (!container) {
        return;
    }


    const records =
        ReportsState.filteredRecords;


    let totalSales = 0;

    let totalActualSales = 0;

    let totalGap = 0;

    let criticalCount = 0;


    records.forEach(record => {

        totalSales +=
            safeNumber(
                record.totalSales
            );


        totalActualSales +=
            safeNumber(
                record.totalActualSales
            );


        /*
         * Display positive exposure only.
         */

        if (
            safeNumber(
                record.totalGap
            ) > 0
        ) {

            totalGap +=
                safeNumber(
                    record.totalGap
                );

        }


        if (
            record.status === "critical"
        ) {

            criticalCount++;

        }

    });


    container.innerHTML = `

        <!-- TOTAL SALES -->

        <div class="fg-summary-card">

            <div class="fg-summary-icon fg-summary-sales">
                ₦
            </div>

            <div class="fg-summary-content">

                <span>
                    Total Sales
                </span>

                <strong>
                    ${formatCurrency(
                        totalSales
                    )}
                </strong>

                <small>
                    ${records.length}
                    ${
                        records.length === 1
                            ? "report"
                            : "reports"
                    }
                </small>

            </div>

        </div>


        <!-- ACTUAL SALES -->

        <div class="fg-summary-card">

            <div class="fg-summary-icon fg-summary-actual">
                ✓
            </div>

            <div class="fg-summary-content">

                <span>
                    Actual Sales
                </span>

                <strong>
                    ${formatCurrency(
                        totalActualSales
                    )}
                </strong>

                <small>
                    Reconciled sales
                </small>

            </div>

        </div>


        <!-- GAP -->

        <div class="fg-summary-card">

            <div class="fg-summary-icon fg-summary-gap">
                !
            </div>

            <div class="fg-summary-content">

                <span>
                    Total Gap
                </span>

                <strong>
                    ${formatCurrency(
                        totalGap
                    )}
                </strong>

                <small>
                    Reconciliation exposure
                </small>

            </div>

        </div>


        <!-- CRITICAL -->

        <div class="fg-summary-card">

            <div class="fg-summary-icon fg-summary-critical">
                !
            </div>

            <div class="fg-summary-content">

                <span>
                    Critical Reports
                </span>

                <strong>
                    ${criticalCount}
                </strong>

                <small>
                    Requires attention
                </small>

            </div>

        </div>

    `;

}


/* =========================================================
   LOADING STATE
========================================================= */

function showLoadingState() {

    const container =
        document.getElementById(
            "reportsContainer"
        );


    if (container) {

        container.innerHTML =
            renderLoadingState();

    }


    const summary =
        document.getElementById(
            "reportsSummary"
        );


    if (summary) {

        summary.innerHTML =
            renderSummarySkeleton();

    }

}


/* =========================================================
   LOADING HTML
========================================================= */

function renderLoadingState() {

    return `

        <div class="fg-report-loading">

            <div class="fg-loading-spinner"></div>

            <h3>
                Loading Reports
            </h3>

            <p>
                Fetching the latest sales and reconciliation data...
            </p>

        </div>

    `;

}


/* =========================================================
   SUMMARY SKELETON
========================================================= */

function renderSummarySkeleton() {

    return `

        <div class="fg-summary-card fg-summary-skeleton">
            <div class="fg-skeleton-icon"></div>
            <div class="fg-skeleton-lines">
                <span></span>
                <strong></strong>
                <small></small>
            </div>
        </div>

        <div class="fg-summary-card fg-summary-skeleton">
            <div class="fg-skeleton-icon"></div>
            <div class="fg-skeleton-lines">
                <span></span>
                <strong></strong>
                <small></small>
            </div>
        </div>

        <div class="fg-summary-card fg-summary-skeleton">
            <div class="fg-skeleton-icon"></div>
            <div class="fg-skeleton-lines">
                <span></span>
                <strong></strong>
                <small></small>
            </div>
        </div>

        <div class="fg-summary-card fg-summary-skeleton">
            <div class="fg-skeleton-icon"></div>
            <div class="fg-skeleton-lines">
                <span></span>
                <strong></strong>
                <small></small>
            </div>
        </div>

    `;

}


/* =========================================================
   EMPTY STATE
========================================================= */

function renderEmptyState() {

    return `

        <div class="fg-report-empty">

            <div class="fg-empty-icon">
                ▤
            </div>

            <h3>
                No Reports Found
            </h3>

            <p>
                There are no report records matching
                your current filters.
            </p>

            <button
                type="button"
                class="fg-report-btn fg-report-btn-secondary"
                id="clearEmptyFiltersBtn"
            >
                Clear Filters
            </button>

        </div>

    `;

}


/* =========================================================
   ERROR STATE
========================================================= */

function showReportError(message) {

    const container =
        document.getElementById(
            "reportsContainer"
        );


    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="fg-report-error">

            <div class="fg-error-icon">
                !
            </div>

            <h3>
                Unable to Load Reports
            </h3>

            <p>
                ${escapeHtml(
                    message
                )}
            </p>

            <button
                type="button"
                class="fg-report-btn fg-report-btn-primary"
                id="retryReportsBtn"
            >
                Try Again
            </button>

        </div>

    `;

}


/* =========================================================
   FATAL ERROR
========================================================= */

function showFatalError(message) {

    const pageContent =
        document.getElementById(
            "pageContent"
        ) ||
        document.getElementById(
            "app"
        );


    if (!pageContent) {

        console.error(message);

        return;

    }


    pageContent.innerHTML = `

        <section class="fg-reports-page">

            <div class="fg-report-error">

                <div class="fg-error-icon">
                    !
                </div>

                <h3>
                    Reports Unavailable
                </h3>

                <p>
                    ${escapeHtml(message)}
                </p>

            </div>

        </section>

    `;

}


/* =========================================================
   REFRESH BUTTON
========================================================= */

function setRefreshButtonLoading(isLoading) {

    const button =
        document.getElementById(
            "refreshReportsBtn"
        );


    if (!button) {
        return;
    }


    button.disabled =
        isLoading;


    if (isLoading) {

        button.innerHTML = `

            <span class="fg-loading-spinner fg-button-spinner"></span>

            Loading...

        `;

    } else {

        button.innerHTML = `

            <span class="fg-btn-icon">
                ↻
            </span>

            Refresh Reports

        `;

    }

}


/* =========================================================
   LAST UPDATED
========================================================= */

function updateLastUpdated() {

    const element =
        document.getElementById(
            "reportLastUpdated"
        );


    if (!element) {
        return;
    }


    if (!ReportsState.lastUpdated) {

        element.textContent =
            "Waiting for report data...";

        return;

    }


    element.textContent =
        `Last updated ${formatDateTime(
            ReportsState.lastUpdated
        )}`;

}


/* =========================================================
   STATUS HELPERS
========================================================= */

function calculateStatus(
    gap,
    expected
) {

    const numericGap =
        safeNumber(gap);


    const numericExpected =
        safeNumber(expected);


    if (numericGap < 0) {
        return "surplus";
    }


    if (numericGap === 0) {
        return "normal";
    }


    if (numericExpected <= 0) {
        return "critical";
    }


    const variance =
        Math.abs(
            numericGap
        ) /
        numericExpected *
        100;


    if (variance <= 2) {
        return "variance";
    }


    return "critical";

}


/* =========================================================
   NORMALIZE STATUS
========================================================= */

function normalizeStatus(status) {

    const value =
        String(
            status || "normal"
        )
        .toLowerCase()
        .trim();


    if (
        value === "critical" ||
        value === "danger"
    ) {

        return "critical";

    }


    if (
        value === "variance" ||
        value === "warning"
    ) {

        return "variance";

    }


    if (
        value === "surplus" ||
        value === "overage" ||
        value === "over"
    ) {

        return "surplus";

    }


    return "normal";

}


/* =========================================================
   STATUS PRIORITY
========================================================= */

function getHighestStatus(
    current,
    next
) {

    const priority = {

        critical: 4,

        variance: 3,

        surplus: 2,

        normal: 1

    };


    const currentStatus =
        normalizeStatus(current);


    const nextStatus =
        normalizeStatus(next);


    if (
        (priority[nextStatus] || 1) >
        (priority[currentStatus] || 1)
    ) {

        return nextStatus;

    }


    return currentStatus;

}


/* =========================================================
   STATUS INFORMATION
========================================================= */

function getStatusInfo(status) {

    switch (
        normalizeStatus(status)
    ) {

        case "critical":

            return {
                label: "Critical",
                icon: "!"
            };


        case "variance":

            return {
                label: "Variance",
                icon: "!"
            };


        case "surplus":

            return {
                label: "Surplus",
                icon: "↑"
            };


        default:

            return {
                label: "Normal",
                icon: "✓"
            };

    }

}


/* =========================================================
   GAP VALUE CLASS
========================================================= */

function getGapValueClass(gap) {

    const value =
        safeNumber(gap);


    if (value < 0) {
        return "fg-gap-negative";
    }


    if (value > 0) {
        return "fg-gap-positive";
    }


    return "fg-gap-zero";

}


/* =========================================================
   NUMBER HELPERS
========================================================= */

function safeNumber(value) {

    const number =
        Number(value);


    return Number.isFinite(number)
        ? number
        : 0;

}


/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(value) {

    const number =
        safeNumber(value);


    return new Intl.NumberFormat(
        "en-NG",
        {
            style: "currency",
            currency: "NGN",
            maximumFractionDigits: 2
        }
    ).format(number);

}


/* =========================================================
   LITRES
========================================================= */

function formatLitres(value) {

    return new Intl.NumberFormat(
        "en-NG",
        {
            maximumFractionDigits: 2
        }
    ).format(
        safeNumber(value)
    );

}


/* =========================================================
   PERCENTAGE
========================================================= */

function formatPercentage(value) {

    return `${safeNumber(value).toFixed(2)}%`;

}


/* =========================================================
   DATE
========================================================= */

function formatDate(value) {

    if (!value) {
        return "—";
    }


    const date =
        new Date(value);


    if (Number.isNaN(
        date.getTime()
    )) {

        return "—";

    }


    return new Intl.DateTimeFormat(
        "en-NG",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    ).format(date);

}


/* =========================================================
   DATE + TIME
========================================================= */

function formatDateTime(value) {

    const date =
        new Date(value);


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
    ).format(date);

}


/* =========================================================
   LATEST DATE
========================================================= */

function getLatestDate(
    current,
    next
) {

    if (!current) {
        return next || "";
    }


    if (!next) {
        return current;
    }


    const currentTime =
        new Date(current).getTime();


    const nextTime =
        new Date(next).getTime();


    if (
        Number.isNaN(currentTime)
    ) {

        return next;

    }


    if (
        Number.isNaN(nextTime)
    ) {

        return current;

    }


    return nextTime > currentTime
        ? next
        : current;

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value === null ||
        value === undefined
            ? ""
            : String(value);


    return div.innerHTML;

}


/* =========================================================
   INJECT COMPLETE REPORTS CSS
========================================================= */

function injectReportsStyles() {

    if (
        document.getElementById(
            "fuelgapReportsStyles"
        )
    ) {

        return;

    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "fuelgapReportsStyles";


    style.textContent = `

/* =========================================================
   FUELGAP REPORTS PAGE
========================================================= */

.fg-reports-page {

    width: 100%;

    max-width: 1600px;

    margin: 0 auto;

    padding: 28px;

    box-sizing: border-box;

    color: #1f2937;

}


/* =========================================================
   HEADER
========================================================= */

.fg-reports-header {

    display: flex;

    align-items: flex-start;

    justify-content: space-between;

    gap: 24px;

    margin-bottom: 28px;

}


.fg-reports-eyebrow {

    display: inline-flex;

    align-items: center;

    gap: 8px;

    font-size: 11px;

    font-weight: 800;

    letter-spacing: 1.5px;

    color: #a16207;

    margin-bottom: 8px;

}


.fg-reports-title h1 {

    margin: 0;

    font-size: 30px;

    line-height: 1.2;

    font-weight: 800;

    color: #111827;

}


.fg-reports-title p {

    margin: 8px 0 0;

    color: #6b7280;

    font-size: 14px;

    line-height: 1.6;

}


.fg-reports-actions {

    flex-shrink: 0;

}


/* =========================================================
   BUTTONS
========================================================= */

.fg-report-btn {

    min-height: 44px;

    border: 0;

    border-radius: 10px;

    padding: 0 17px;

    display: inline-flex;

    align-items: center;

    justify-content: center;

    gap: 8px;

    font-size: 13px;

    font-weight: 700;

    cursor: pointer;

    transition:
        transform .18s ease,
        box-shadow .18s ease,
        opacity .18s ease;

}


.fg-report-btn:hover {

    transform: translateY(-1px);

}


.fg-report-btn:disabled {

    cursor: not-allowed;

    opacity: .65;

    transform: none;

}


.fg-report-btn-primary {

    background: #facc15;

    color: #111827;

    box-shadow:
        0 5px 16px rgba(0,0,0,.08);

}


.fg-report-btn-primary:hover {

    box-shadow:
        0 8px 20px rgba(0,0,0,.12);

}


.fg-report-btn-secondary {

    background: #f3f4f6;

    color: #374151;

}


.fg-btn-icon {

    font-size: 18px;

    line-height: 1;

}


/* =========================================================
   SUMMARY GRID
========================================================= */

.fg-report-summary-grid {

    display: grid;

    grid-template-columns:
        repeat(4, minmax(0, 1fr));

    gap: 16px;

    margin-bottom: 22px;

}


.fg-summary-card {

    min-width: 0;

    background: #ffffff;

    border: 1px solid #e5e7eb;

    border-radius: 14px;

    padding: 20px;

    display: flex;

    align-items: center;

    gap: 15px;

    box-shadow:
        0 4px 15px rgba(0,0,0,.04);

}


.fg-summary-icon {

    width: 48px;

    height: 48px;

    min-width: 48px;

    border-radius: 12px;

    display: flex;

    align-items: center;

    justify-content: center;

    font-size: 20px;

    font-weight: 900;

}


.fg-summary-sales {

    background: #fef3c7;

    color: #a16207;

}


.fg-summary-actual {

    background: #ecfdf5;

    color: #047857;

}


.fg-summary-gap {

    background: #fff7ed;

    color: #c2410c;

}


.fg-summary-critical {

    background: #fef2f2;

    color: #dc2626;

}


.fg-summary-content {

    min-width: 0;

}


.fg-summary-content span {

    display: block;

    font-size: 12px;

    color: #6b7280;

    margin-bottom: 4px;

    font-weight: 600;

}


.fg-summary-content strong {

    display: block;

    font-size: 20px;

    line-height: 1.3;

    color: #111827;

    font-weight: 800;

    white-space: nowrap;

    overflow: hidden;

    text-overflow: ellipsis;

}


.fg-summary-content small {

    display: block;

    margin-top: 4px;

    color: #9ca3af;

    font-size: 11px;

}


/* =========================================================
   FILTER PANEL
========================================================= */

.fg-report-filter-panel {

    background: #ffffff;

    border: 1px solid #e5e7eb;

    border-radius: 14px;

    padding: 20px;

    margin-bottom: 12px;

    box-shadow:
        0 4px 15px rgba(0,0,0,.035);

}


.fg-filter-heading {

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 16px;

    margin-bottom: 18px;

}


.fg-filter-label {

    display: block;

    font-size: 11px;

    font-weight: 800;

    letter-spacing: 1.2px;

    color: #374151;

}


.fg-filter-description {

    display: block;

    margin-top: 3px;

    font-size: 12px;

    color: #9ca3af;

}


.fg-clear-filter-btn {

    border: 0;

    background: transparent;

    color: #a16207;

    font-size: 12px;

    font-weight: 700;

    cursor: pointer;

    padding: 7px 8px;

    border-radius: 7px;

}


.fg-clear-filter-btn:hover {

    background: #fef9c3;

}


.fg-report-filters {

    display: grid;

    grid-template-columns:
        repeat(4, minmax(0, 1fr));

    gap: 14px;

}


.fg-report-field {

    min-width: 0;

}


.fg-report-field label {

    display: block;

    font-size: 12px;

    font-weight: 700;

    color: #374151;

    margin-bottom: 7px;

}


.fg-report-field select,

.fg-report-field input {

    width: 100%;

    height: 43px;

    box-sizing: border-box;

    border: 1px solid #d1d5db;

    border-radius: 9px;

    background: #ffffff;

    color: #111827;

    padding: 0 12px;

    font-size: 13px;

    outline: none;

    transition:
        border-color .18s ease,
        box-shadow .18s ease;

}


.fg-report-field select:focus,

.fg-report-field input:focus {

    border-color: #eab308;

    box-shadow:
        0 0 0 3px rgba(234,179,8,.12);

}


.fg-report-search-box {

    position: relative;

}


.fg-report-search-box input {

    padding-left: 37px;

}


.fg-search-icon {

    position: absolute;

    left: 12px;

    top: 50%;

    transform: translateY(-50%);

    color: #9ca3af;

    font-size: 20px;

    pointer-events: none;

}


/* =========================================================
   LAST UPDATED
========================================================= */

.fg-report-last-updated {

    text-align: right;

    color: #9ca3af;

    font-size: 11px;

    margin: 10px 2px 18px;

}


/* =========================================================
   RESULTS HEADER
========================================================= */

.fg-report-results-header {

    display: flex;

    align-items: center;

    justify-content: space-between;

    margin-bottom: 12px;

}


.fg-results-title {

    font-size: 16px;

    font-weight: 800;

    color: #111827;

}


.fg-results-count {

    display: inline-flex;

    margin-left: 8px;

    padding: 4px 8px;

    border-radius: 20px;

    background: #fef9c3;

    color: #854d0e;

    font-size: 10px;

    font-weight: 800;

}


/* =========================================================
   REPORT CARDS
========================================================= */

.fg-report-cards {

    display: grid;

    grid-template-columns:
        repeat(2, minmax(0, 1fr));

    gap: 16px;

}


.fg-report-card {

    background: #ffffff;

    border: 1px solid #e5e7eb;

    border-radius: 14px;

    overflow: hidden;

    box-shadow:
        0 4px 15px rgba(0,0,0,.04);

    transition:
        transform .18s ease,
        box-shadow .18s ease,
        border-color .18s ease;

}


.fg-report-card:hover {

    transform: translateY(-2px);

    box-shadow:
        0 10px 28px rgba(0,0,0,.08);

}


.fg-status-critical {

    border-left: 4px solid #dc2626;

}


.fg-status-variance {

    border-left: 4px solid #f59e0b;

}


.fg-status-surplus {

    border-left: 4px solid #2563eb;

}


.fg-status-normal {

    border-left: 4px solid #16a34a;

}


.fg-report-card-top {

    padding: 18px 18px 14px;

    display: flex;

    align-items: flex-start;

    justify-content: space-between;

    gap: 14px;

}


.fg-report-card-location {

    display: flex;

    align-items: center;

    gap: 11px;

    min-width: 0;

}


.fg-report-station-icon {

    width: 40px;

    height: 40px;

    min-width: 40px;

    border-radius: 10px;

    background: #fef9c3;

    color: #a16207;

    display: flex;

    align-items: center;

    justify-content: center;

    font-size: 17px;

}


.fg-report-card-location h3 {

    margin: 0;

    font-size: 15px;

    font-weight: 800;

    color: #111827;

    overflow: hidden;

    text-overflow: ellipsis;

    white-space: nowrap;

}


.fg-report-card-location p {

    margin: 4px 0 0;

    font-size: 11px;

    color: #9ca3af;

}


.fg-report-status {

    display: inline-flex;

    align-items: center;

    gap: 6px;

    flex-shrink: 0;

    padding: 6px 9px;

    border-radius: 999px;

    font-size: 10px;

    font-weight: 800;

}


.fg-status-badge-critical {

    background: #fef2f2;

    color: #b91c1c;

}


.fg-status-badge-variance {

    background: #fffbeb;

    color: #b45309;

}


.fg-status-badge-surplus {

    background: #eff6ff;

    color: #1d4ed8;

}


.fg-status-badge-normal {

    background: #f0fdf4;

    color: #15803d;

}


.fg-status-dot {

    width: 6px;

    height: 6px;

    border-radius: 50%;

    background: currentColor;

}


/* =========================================================
   SHIFT
========================================================= */

.fg-report-card-shift {

    padding: 0 18px 15px;

    border-bottom: 1px solid #f1f5f9;

}


.fg-report-card-shift span {

    display: block;

    font-size: 9px;

    letter-spacing: 1px;

    font-weight: 800;

    color: #9ca3af;

    margin-bottom: 4px;

}


.fg-report-card-shift strong {

    font-size: 13px;

    font-weight: 700;

    color: #374151;

}


.fg-report-card-shift small {

    color: #9ca3af;

    font-size: 11px;

    margin-left: 8px;

}


/* =========================================================
   METRICS
========================================================= */

.fg-report-metrics {

    display: grid;

    grid-template-columns:
        repeat(4, minmax(0, 1fr));

    padding: 17px 18px;

    gap: 12px;

}


.fg-report-metric {

    min-width: 0;

}


.fg-report-metric span {

    display: block;

    font-size: 10px;

    color: #9ca3af;

    margin-bottom: 5px;

}


.fg-report-metric strong {

    display: block;

    font-size: 13px;

    color: #111827;

    font-weight: 800;

    white-space: nowrap;

    overflow: hidden;

    text-overflow: ellipsis;

}


.fg-gap-positive {

    color: #dc2626 !important;

}


.fg-gap-negative {

    color: #2563eb !important;

}


.fg-gap-zero {

    color: #16a34a !important;

}


/* =========================================================
   CARD FOOTER
========================================================= */

.fg-report-card-footer {

    border-top: 1px solid #f1f5f9;

    padding: 12px 18px;

    display: flex;

    align-items: center;

    justify-content: space-between;

    gap: 12px;

}


.fg-report-extra {

    display: flex;

    align-items: center;

    gap: 10px;

    flex-wrap: wrap;

}


.fg-report-extra span {

    font-size: 10px;

    color: #6b7280;

    background: #f9fafb;

    padding: 5px 7px;

    border-radius: 6px;

}


.fg-report-details-btn {

    border: 0;

    background: transparent;

    color: #a16207;

    font-size: 11px;

    font-weight: 800;

    cursor: pointer;

    display: inline-flex;

    align-items: center;

    gap: 5px;

    white-space: nowrap;

}


.fg-report-details-btn span {

    font-size: 15px;

    transition:
        transform .18s ease;

}


.fg-report-details-btn:hover span {

    transform: translateX(3px);

}


/* =========================================================
   LOADING
========================================================= */

.fg-report-loading {

    min-height: 280px;

    background: #ffffff;

    border: 1px solid #e5e7eb;

    border-radius: 14px;

    display: flex;

    flex-direction: column;

    align-items: center;

    justify-content: center;

    text-align: center;

    padding: 30px;

}


.fg-loading-spinner {

    width: 22px;

    height: 22px;

    border: 3px solid #fde68a;

    border-top-color: #eab308;

    border-radius: 50%;

    animation:
        fgReportsSpin .8s linear infinite;

}


.fg-report-loading .fg-loading-spinner {

    width: 34px;

    height: 34px;

    border-width: 4px;

    margin-bottom: 16px;

}


.fg-button-spinner {

    width: 14px;

    height: 14px;

    border-width: 2px;

}


@keyframes fgReportsSpin {

    to {
        transform: rotate(360deg);
    }

}


.fg-report-loading h3 {

    margin: 0;

    color: #111827;

    font-size: 15px;

}


.fg-report-loading p {

    margin: 6px 0 0;

    color: #9ca3af;

    font-size: 12px;

}


/* =========================================================
   EMPTY
========================================================= */

.fg-report-empty {

    min-height: 280px;

    background: #ffffff;

    border: 1px solid #e5e7eb;

    border-radius: 14px;

    display: flex;

    flex-direction: column;

    align-items: center;

    justify-content: center;

    text-align: center;

    padding: 30px;

}


.fg-empty-icon {

    width: 58px;

    height: 58px;

    border-radius: 14px;

    display: flex;

    align-items: center;

    justify-content: center;

    background: #fef9c3;

    color: #a16207;

    font-size: 25px;

    margin-bottom: 14px;

}


.fg-report-empty h3 {

    margin: 0;

    font-size: 16px;

    color: #111827;

}


.fg-report-empty p {

    max-width: 420px;

    margin: 7px 0 17px;

    font-size: 12px;

    line-height: 1.6;

    color: #9ca3af;

}


/* =========================================================
   ERROR
========================================================= */

.fg-report-error {

    min-height: 280px;

    background: #ffffff;

    border: 1px solid #fecaca;

    border-radius: 14px;

    display: flex;

    flex-direction: column;

    align-items: center;

    justify-content: center;

    text-align: center;

    padding: 30px;

}


.fg-error-icon {

    width: 56px;

    height: 56px;

    border-radius: 50%;

    display: flex;

    align-items: center;

    justify-content: center;

    background: #fef2f2;

    color: #dc2626;

    font-size: 25px;

    font-weight: 900;

    margin-bottom: 14px;

}


.fg-report-error h3 {

    margin: 0;

    color: #111827;

    font-size: 16px;

}


.fg-report-error p {

    max-width: 550px;

    margin: 8px 0 18px;

    color: #6b7280;

    font-size: 12px;

    line-height: 1.6;

}


/* =========================================================
   SKELETON
========================================================= */

.fg-summary-skeleton {

    overflow: hidden;

}


.fg-skeleton-icon {

    width: 48px;

    height: 48px;

    min-width: 48px;

    border-radius: 12px;

    background:
        linear-gradient(
            90deg,
            #f3f4f6,
            #e5e7eb,
            #f3f4f6
        );

    background-size: 200% 100%;

    animation:
        fgSkeleton 1.3s infinite;

}


.fg-skeleton-lines {

    flex: 1;

}


.fg-skeleton-lines span,

.fg-skeleton-lines strong,

.fg-skeleton-lines small {

    display: block;

    border-radius: 5px;

    background:
        linear-gradient(
            90deg,
            #f3f4f6,
            #e5e7eb,
            #f3f4f6
        );

    background-size: 200% 100%;

    animation:
        fgSkeleton 1.3s infinite;

}


.fg-skeleton-lines span {

    width: 70px;

    height: 10px;

    margin-bottom: 7px;

}


.fg-skeleton-lines strong {

    width: 130px;

    height: 19px;

    margin-bottom: 6px;

}


.fg-skeleton-lines small {

    width: 90px;

    height: 8px;

}


@keyframes fgSkeleton {

    0% {
        background-position: 200% 0;
    }

    100% {
        background-position: -200% 0;
    }

}


/* =========================================================
   RESPONSIVE
========================================================= */

@media (max-width: 1200px) {

    .fg-report-summary-grid {

        grid-template-columns:
            repeat(2, minmax(0, 1fr));

    }


    .fg-report-filters {

        grid-template-columns:
            repeat(2, minmax(0, 1fr));

    }


    .fg-report-cards {

        grid-template-columns:
            1fr;

    }

}


@media (max-width: 700px) {

    .fg-reports-page {

        padding: 18px 14px;

    }


    .fg-reports-header {

        flex-direction: column;

        align-items: stretch;

    }


    .fg-reports-title h1 {

        font-size: 24px;

    }


    .fg-reports-actions {

        width: 100%;

    }


    .fg-reports-actions .fg-report-btn {

        width: 100%;

    }


    .fg-report-summary-grid {

        grid-template-columns: 1fr;

    }


    .fg-report-filters {

        grid-template-columns: 1fr;

    }


    .fg-filter-heading {

        align-items: flex-start;

    }


    .fg-report-metrics {

        grid-template-columns:
            repeat(2, minmax(0, 1fr));

    }


    .fg-report-card-top {

        flex-direction: column;

    }


    .fg-report-status {

        align-self: flex-start;

    }


    .fg-report-card-footer {

        align-items: flex-start;

        flex-direction: column;

    }


    .fg-report-details-btn {

        width: 100%;

        justify-content: center;

        background: #fef9c3;

        padding: 9px;

        border-radius: 8px;

    }

}


@media (max-width: 420px) {

    .fg-reports-page {

        padding: 14px 10px;

    }


    .fg-report-filter-panel {

        padding: 15px;

    }


    .fg-summary-card {

        padding: 15px;

    }


    .fg-report-card-top,

    .fg-report-card-shift,

    .fg-report-metrics,

    .fg-report-card-footer {

        padding-left: 14px;

        padding-right: 14px;

    }

}

    `;


    document.head.appendChild(style);

}


/* =========================================================
   EXPORT GLOBAL REPORT STATE
========================================================= */

window.FuelGapReports = {

    reload: loadReports,

    getState: () => ReportsState

};


/* =========================================================
   END OF REPORTS.JS
========================================================= */