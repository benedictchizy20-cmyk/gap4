/* ==========================================
   FUELGAP - REPORTS
========================================== */


/* ==========================================
   STORAGE KEYS
========================================== */

const REPORTS_STATIONS_STORAGE_KEY =
    "fuelgap_stations";


const REPORTS_SHIFTS_STORAGE_KEY =
    "fuelgap_shifts";


const REPORTS_SALES_STORAGE_KEY =
    "fuelgap_sales";


const REPORTS_PAYMENTS_STORAGE_KEY =
    "fuelgap_payments";


const REPORTS_STAFF_STORAGE_KEY =
    "fuelgap_staff";


const REPORTS_READINGS_STORAGE_KEY =
    "fuelgap_meter_readings";


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
                "reports"
            )
        ) {

            window.location.href =
                "./dashboard.html";

            return;

        }


        /*
           WAIT FOR APP.JS
        */

        setTimeout(
            () => {

                renderReportsPage();

                setupReportEvents();

                renderReports();

            },
            0
        );

    }
);


/* ==========================================
   SAFE STORAGE HELPER
========================================== */

function getReportsStorageData(
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
   GET SYSTEM DATA
========================================== */

function getReportStations() {

    return getReportsStorageData(
        REPORTS_STATIONS_STORAGE_KEY
    );

}


function getReportShifts() {

    return getReportsStorageData(
        REPORTS_SHIFTS_STORAGE_KEY
    );

}


function getReportSales() {

    return getReportsStorageData(
        REPORTS_SALES_STORAGE_KEY
    );

}


function getReportPayments() {

    return getReportsStorageData(
        REPORTS_PAYMENTS_STORAGE_KEY
    );

}


function getReportStaff() {

    return getReportsStorageData(
        REPORTS_STAFF_STORAGE_KEY
    );

}


function getReportReadings() {

    return getReportsStorageData(
        REPORTS_READINGS_STORAGE_KEY
    );

}


/* ==========================================
   GET CURRENT USER
========================================== */

function getReportsCurrentUser() {

    return FuelGapUtils.getCurrentUser();

}


/* ==========================================
   GET VISIBLE STATIONS
========================================== */

function getVisibleReportStations() {

    const currentUser =
        getReportsCurrentUser();


    const stations =
        getReportStations();


    if (!currentUser) {

        return [];

    }


    /*
       ADMIN
       CAN SEE EVERYTHING
    */

    if (
        currentUser.role ===
        "admin"
    ) {

        return stations;

    }


    /*
       OWNER
       CAN SEE ALL STATIONS
       IN ORGANIZATION
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
       CAN SEE ASSIGNED STATION
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
       CAN SEE ASSIGNED STATION
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

function getVisibleReportStationIds() {

    return getVisibleReportStations()
        .map(
            station =>
                station.id
        );

}


/* ==========================================
   GET VISIBLE SALES
========================================== */

function getVisibleReportSales() {

    const stationIds =
        getVisibleReportStationIds();


    return getReportSales()
        .filter(
            sale =>
                stationIds.includes(
                    sale.stationId
                )
        );

}


/* ==========================================
   GET VISIBLE PAYMENTS
========================================== */

function getVisibleReportPayments() {

    const stationIds =
        getVisibleReportStationIds();


    return getReportPayments()
        .filter(
            payment =>
                stationIds.includes(
                    payment.stationId
                )
        );

}


/* ==========================================
   GET VISIBLE SHIFTS
========================================== */

function getVisibleReportShifts() {

    const stationIds =
        getVisibleReportStationIds();


    return getReportShifts()
        .filter(
            shift =>
                stationIds.includes(
                    shift.stationId
                )
        );

}


/* ==========================================
   RENDER REPORTS PAGE
========================================== */

function renderReportsPage() {

    const pageContent =
        document.getElementById(
            "pageContent"
        );


    if (!pageContent) {

        return;

    }


    pageContent.innerHTML = `

        <div class="reports-page">


            <!-- =================================
                 PAGE HEADER
            ================================== -->

            <div class="page-header">

                <div>

                    <p class="page-eyebrow">
                        BUSINESS INTELLIGENCE
                    </p>


                    <h1>
                        Reports
                    </h1>


                    <p>
                        Monitor sales, payments,
                        gaps and station performance.
                    </p>

                </div>


                <button
                    type="button"
                    class="btn btn-primary"
                    id="refreshReportsButton"
                >
                    Refresh Reports
                </button>

            </div>



            <!-- =================================
                 REPORT SUMMARY
            ================================== -->

            <div class="report-summary">


                <div class="report-summary-card">

                    <span>
                        Total Sales
                    </span>


                    <strong
                        id="reportTotalSales"
                    >
                        ₦0.00
                    </strong>

                </div>



                <div class="report-summary-card">

                    <span>
                        Total Payments
                    </span>


                    <strong
                        id="reportTotalPayments"
                    >
                        ₦0.00
                    </strong>

                </div>



                <div class="report-summary-card">

                    <span>
                        Total Gap
                    </span>


                    <strong
                        id="reportTotalGap"
                    >
                        ₦0.00
                    </strong>

                </div>



                <div class="report-summary-card">

                    <span>
                        Critical Shifts
                    </span>


                    <strong
                        id="reportCriticalCount"
                    >
                        0
                    </strong>

                </div>


            </div>



            <!-- =================================
                 FILTERS
            ================================== -->

            <section class="pump-section">


                <div class="section-header">

                    <div>

                        <h2>
                            Station Reports
                        </h2>


                        <p>
                            Review financial performance
                            by station and shift.
                        </p>

                    </div>

                </div>



                <div class="report-filters">


                    <!-- STATION FILTER -->

                    <select
                        id="reportStationFilter"
                    >

                        <option value="">
                            All Stations
                        </option>

                    </select>



                    <!-- SHIFT FILTER -->

                    <select
                        id="reportShiftFilter"
                    >

                        <option value="">
                            All Shifts
                        </option>

                    </select>



                    <!-- DATE FILTER -->

                    <input
                        type="date"
                        id="reportDateFilter"
                    >



                    <!-- SEARCH -->

                    <input
                        type="search"
                        id="reportSearch"
                        placeholder="Search station or shift..."
                    >


                </div>



                <!-- =================================
                     REPORT LIST
                ================================== -->

                <div
                    id="reportsContainer"
                ></div>



                <!-- EMPTY STATE -->

                <div
                    id="emptyReportsState"
                    class="empty-state hidden"
                >

                    <h3>
                        No reports found
                    </h3>


                    <p>
                        Sales and payment records
                        will appear here once available.
                    </p>

                </div>


            </section>


        </div>

    `;


    loadReportFilters();

}


/* ==========================================
   LOAD FILTERS
========================================== */

function loadReportFilters() {

    const stationSelect =
        document.getElementById(
            "reportStationFilter"
        );


    const shiftSelect =
        document.getElementById(
            "reportShiftFilter"
        );


    /*
       LOAD STATIONS
    */

    if (stationSelect) {

        getVisibleReportStations()
            .forEach(
                station => {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        station.id;


                    option.textContent =
                        station.name ||
                        "Unnamed Station";


                    stationSelect.appendChild(
                        option
                    );

                }
            );

    }


    /*
       LOAD SHIFTS
    */

    if (shiftSelect) {

        getVisibleReportShifts()
            .forEach(
                shift => {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        shift.id;


                    option.textContent =
                        shift.name ||
                        "Unnamed Shift";


                    shiftSelect.appendChild(
                        option
                    );

                }
            );

    }

}


/* ==========================================
   SETUP EVENTS
========================================== */

function setupReportEvents() {

    const refreshButton =
        document.getElementById(
            "refreshReportsButton"
        );


    const stationFilter =
        document.getElementById(
            "reportStationFilter"
        );


    const shiftFilter =
        document.getElementById(
            "reportShiftFilter"
        );


    const dateFilter =
        document.getElementById(
            "reportDateFilter"
        );


    const searchInput =
        document.getElementById(
            "reportSearch"
        );


    /*
       REFRESH
    */

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            () => {

                renderReports();

            }
        );

    }


    /*
       STATION FILTER
    */

    if (stationFilter) {

        stationFilter.addEventListener(
            "change",
            () => {

                renderReports();

            }
        );

    }


    /*
       SHIFT FILTER
    */

    if (shiftFilter) {

        shiftFilter.addEventListener(
            "change",
            () => {

                renderReports();

            }
        );

    }


    /*
       DATE FILTER
    */

    if (dateFilter) {

        dateFilter.addEventListener(
            "change",
            () => {

                renderReports();

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

                renderReports();

            }
        );

    }

}


/* ==========================================
   BUILD REPORT RECORDS
========================================== */

function buildReportRecords() {

    const sales =
        getVisibleReportSales();


    const payments =
        getVisibleReportPayments();


    const stations =
        getReportStations();


    const shifts =
        getReportShifts();


    const combinations =
        {};


    /*
       ADD SALES
    */

    sales.forEach(
        sale => {

            const stationId =
                sale.stationId;


            const shiftId =
                sale.shiftId ||
                "no-shift";


            const key =
                `${stationId}_${shiftId}`;


            if (
                !combinations[key]
            ) {

                combinations[key] = {

                    stationId,

                    shiftId,

                    sales:
                        0,

                    payments:
                        0,

                    dates:
                        []

                };

            }


            const saleAmount =
                Number(
                    sale.amount ||
                    sale.totalAmount ||
                    sale.saleAmount ||
                    sale.total ||
                    0
                );


            combinations[key]
                .sales +=
                saleAmount;


            const saleDate =
                getReportRecordDate(
                    sale
                );


            if (
                saleDate
            ) {

                combinations[key]
                    .dates
                    .push(
                        saleDate
                    );

            }

        }
    );


    /*
       ADD PAYMENTS
    */

    payments.forEach(
        payment => {

            const stationId =
                payment.stationId;


            const shiftId =
                payment.shiftId ||
                "no-shift";


            const key =
                `${stationId}_${shiftId}`;


            if (
                !combinations[key]
            ) {

                combinations[key] = {

                    stationId,

                    shiftId,

                    sales:
                        0,

                    payments:
                        0,

                    dates:
                        []

                };

            }


            const paymentAmount =
                Number(
                    payment.amount ||
                    payment.totalAmount ||
                    payment.total ||
                    0
                );


            combinations[key]
                .payments +=
                paymentAmount;


            const paymentDate =
                getReportRecordDate(
                    payment
                );


            if (
                paymentDate
            ) {

                combinations[key]
                    .dates
                    .push(
                        paymentDate
                    );

            }

        }
    );


    /*
       CONVERT TO REPORT RECORDS
    */

    return Object.values(
        combinations
    )
        .map(
            item => {

                const station =
                    stations.find(
                        station =>
                            station.id ===
                            item.stationId
                    );


                const shift =
                    shifts.find(
                        shift =>
                            shift.id ===
                            item.shiftId
                    );


                /*
                   DIFFERENCE

                   POSITIVE = GAP
                   NEGATIVE = SURPLUS
                */

                const difference =
                    item.sales -
                    item.payments;


                let variancePercentage =
                    0;


                if (
                    item.sales >
                    0
                ) {

                    variancePercentage =
                        (
                            Math.abs(
                                difference
                            ) /

                            item.sales
                        ) *
                        100;

                }


                const status =
                    calculateReportStatus(
                        difference,
                        variancePercentage
                    );


                return {

                    id:
                        `${item.stationId}_${item.shiftId}`,

                    stationId:
                        item.stationId,

                    stationName:
                        station
                            ? station.name
                            : "Unknown Station",

                    shiftId:
                        item.shiftId,

                    shiftName:
                        shift
                            ? shift.name
                            : (
                                item.shiftId ===
                                "no-shift"
                                    ? "No Shift"
                                    : "Unknown Shift"
                            ),

                    sales:
                        item.sales,

                    payments:
                        item.payments,

                    difference,

                    variancePercentage,

                    status,

                    dates:
                        item.dates

                };

            }
        );

}


/* ==========================================
   GET RECORD DATE
========================================== */

function getReportRecordDate(
    record
) {

    const possibleDates = [

        record.date,

        record.createdAt,

        record.timestamp,

        record.saleDate,

        record.paymentDate

    ];


    for (
        const date of
        possibleDates
    ) {

        if (!date) {

            continue;

        }


        const parsedDate =
            new Date(
                date
            );


        if (
            !Number.isNaN(
                parsedDate.getTime()
            )
        ) {

            return parsedDate;

        }

    }


    return null;

}


/* ==========================================
   CALCULATE REPORT STATUS
========================================== */

function calculateReportStatus(
    difference,
    variancePercentage
) {

    /*
       SURPLUS
    */

    if (
        difference < 0
    ) {

        return "surplus";

    }


    /*
       NORMAL
    */

    if (
        difference === 0
    ) {

        return "normal";

    }


    /*
       SMALL VARIANCE
    */

    if (
        variancePercentage <=
        2
    ) {

        return "variance";

    }


    /*
       CRITICAL
    */

    return "critical";

}


/* ==========================================
   GET FILTER VALUES
========================================== */

function getReportFilters() {

    const stationFilter =
        document.getElementById(
            "reportStationFilter"
        );


    const shiftFilter =
        document.getElementById(
            "reportShiftFilter"
        );


    const dateFilter =
        document.getElementById(
            "reportDateFilter"
        );


    const searchInput =
        document.getElementById(
            "reportSearch"
        );


    return {

        stationId:
            stationFilter
                ? stationFilter.value
                : "",

        shiftId:
            shiftFilter
                ? shiftFilter.value
                : "",

        date:
            dateFilter
                ? dateFilter.value
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
   FILTER REPORT RECORDS
========================================== */

function filterReportRecords(
    records,
    filters
) {

    return records.filter(
        record => {

            /*
               STATION FILTER
            */

            if (
                filters.stationId &&

                record.stationId !==
                filters.stationId
            ) {

                return false;

            }


            /*
               SHIFT FILTER
            */

            if (
                filters.shiftId &&

                record.shiftId !==
                filters.shiftId
            ) {

                return false;

            }


            /*
               DATE FILTER
            */

            if (
                filters.date
            ) {

                const hasMatchingDate =
                    record.dates.some(
                        date => {

                            return (
                                formatReportDateValue(
                                    date
                                ) ===
                                filters.date
                            );

                        }
                    );


                if (
                    !hasMatchingDate
                ) {

                    return false;

                }

            }


            /*
               SEARCH FILTER
            */

            if (
                filters.search
            ) {

                const searchText =
                    `
                        ${record.stationName}
                        ${record.shiftName}
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
   FORMAT DATE VALUE
========================================== */

function formatReportDateValue(
    date
) {

    if (
        !(date instanceof Date)
    ) {

        date =
            new Date(
                date
            );

    }


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return (
        `${year}-${month}-${day}`
    );

}


/* ==========================================
   RENDER REPORTS
========================================== */

function renderReports() {

    const records =
        buildReportRecords();


    const filters =
        getReportFilters();


    const filteredRecords =
        filterReportRecords(
            records,
            filters
        );


    const container =
        document.getElementById(
            "reportsContainer"
        );


    const emptyState =
        document.getElementById(
            "emptyReportsState"
        );


    if (!container) {

        return;

    }


    container.innerHTML =
        "";


    /*
       SORT CRITICAL FIRST
    */

    filteredRecords.sort(
        (
            a,
            b
        ) => {

            const priority = {

                critical: 1,

                variance: 2,

                surplus: 3,

                normal: 4

            };


            return (
                priority[
                    a.status
                ] -

                priority[
                    b.status
                ]
            );

        }
    );


    /*
       EMPTY STATE
    */

    if (
        filteredRecords.length ===
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
           CREATE REPORT CARDS
        */

        filteredRecords.forEach(
            record => {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    `
                        report-card
                        report-status-${record.status}
                    `;


                card.innerHTML = `

                    <div
                        class="report-card-header"
                    >

                        <div>

                            <h3>

                                ${escapeReportHTML(
                                    record.stationName
                                )}

                            </h3>


                            <p>

                                Shift:

                                ${escapeReportHTML(
                                    record.shiftName
                                )}

                            </p>

                        </div>


                        <div>

                            ${renderReportStatus(
                                record.status
                            )}

                        </div>


                    </div>



                    <div
                        class="report-details-grid"
                    >


                        <div
                            class="report-detail"
                        >

                            <span>
                                Total Sales
                            </span>


                            <strong>

                                ${formatReportCurrency(
                                    record.sales
                                )}

                            </strong>

                        </div>



                        <div
                            class="report-detail"
                        >

                            <span>
                                Payments
                            </span>


                            <strong>

                                ${formatReportCurrency(
                                    record.payments
                                )}

                            </strong>

                        </div>



                        <div
                            class="report-detail"
                        >

                            <span>
                                Difference
                            </span>


                            <strong>

                                ${formatReportCurrency(
                                    record.difference
                                )}

                            </strong>

                        </div>



                        <div
                            class="report-detail"
                        >

                            <span>
                                Variance
                            </span>


                            <strong>

                                ${record
                                    .variancePercentage
                                    .toFixed(
                                        2
                                    )}%

                            </strong>

                        </div>


                    </div>



                    <div
                        class="report-actions"
                    >

                        <button
                            type="button"
                            class="btn btn-outline btn-small"
                            data-report-details="${record.id}"
                        >
                            View Details
                        </button>

                    </div>

                `;


                container.appendChild(
                    card
                );

            }
        );


        setupReportDetailButtons(
            filteredRecords
        );

    }


    /*
       UPDATE SUMMARY

       USE FILTERED DATA
       SO SUMMARY MATCHES
       THE SELECTED REPORT
    */

    updateReportSummary(
        filteredRecords
    );

}


/* ==========================================
   RENDER STATUS
========================================== */

function renderReportStatus(
    status
) {

    const labels = {

        normal:
            "Normal",

        variance:
            "Variance",

        critical:
            "Critical Gap",

        surplus:
            "Surplus"

    };


    return `

        <span
            class="status-badge"
        >

            ${labels[
                status
            ] || "Unknown"}

        </span>

    `;

}


/* ==========================================
   SETUP DETAIL BUTTONS
========================================== */

function setupReportDetailButtons(
    records
) {

    const buttons =
        document.querySelectorAll(
            "[data-report-details]"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const reportId =
                        button.getAttribute(
                            "data-report-details"
                        );


                    const record =
                        records.find(
                            item =>
                                item.id ===
                                reportId
                        );


                    if (
                        record
                    ) {

                        showReportDetails(
                            record
                        );

                    }

                }
            );

        }
    );

}


/* ==========================================
   SHOW REPORT DETAILS
========================================== */

function showReportDetails(
    record
) {

    const details = `

REPORT DETAILS

Station:
${record.stationName}

Shift:
${record.shiftName}

Total Sales:
${formatReportCurrency(
    record.sales
)}

Total Payments:
${formatReportCurrency(
    record.payments
)}

Difference:
${formatReportCurrency(
    record.difference
)}

Variance:
${record.variancePercentage.toFixed(
    2
)}%

Status:
${record.status.toUpperCase()}

    `;


    window.alert(
        details
    );

}


/* ==========================================
   UPDATE REPORT SUMMARY
========================================== */

function updateReportSummary(
    records
) {

    const totalSales =
        records.reduce(
            (
                total,
                record
            ) => {

                return (
                    total +
                    record.sales
                );

            },
            0
        );


    const totalPayments =
        records.reduce(
            (
                total,
                record
            ) => {

                return (
                    total +
                    record.payments
                );

            },
            0
        );


    /*
       ONLY POSITIVE
       DIFFERENCES ARE GAPS
    */

    const totalGap =
        records.reduce(
            (
                total,
                record
            ) => {

                if (
                    record.difference >
                    0
                ) {

                    return (
                        total +
                        record.difference
                    );

                }


                return total;

            },
            0
        );


    const criticalCount =
        records.filter(
            record =>
                record.status ===
                "critical"
        ).length;


    const salesElement =
        document.getElementById(
            "reportTotalSales"
        );


    const paymentsElement =
        document.getElementById(
            "reportTotalPayments"
        );


    const gapElement =
        document.getElementById(
            "reportTotalGap"
        );


    const criticalElement =
        document.getElementById(
            "reportCriticalCount"
        );


    if (salesElement) {

        salesElement.textContent =
            formatReportCurrency(
                totalSales
            );

    }


    if (paymentsElement) {

        paymentsElement.textContent =
            formatReportCurrency(
                totalPayments
            );

    }


    if (gapElement) {

        gapElement.textContent =
            formatReportCurrency(
                totalGap
            );

    }


    if (criticalElement) {

        criticalElement.textContent =
            criticalCount;

    }

}


/* ==========================================
   FORMAT CURRENCY
========================================== */

function formatReportCurrency(
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
   ESCAPE HTML
========================================== */

function escapeReportHTML(
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