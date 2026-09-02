/* ==========================================
   FUELGAP - GAPS & VARIANCE
   PREMIUM RECONCILIATION SYSTEM
========================================== */


/* ==========================================
   STORAGE KEYS
========================================== */

const GAPS_SALES_STORAGE_KEY =
    "fuelgap_sales";

const GAPS_PAYMENTS_STORAGE_KEY =
    "fuelgap_payments";

const GAPS_STATIONS_STORAGE_KEY =
    "fuelgap_stations";

const GAPS_SHIFTS_STORAGE_KEY =
    "fuelgap_shifts";

const GAPS_STAFF_STORAGE_KEY =
    "fuelgap_staff";

const GAPS_ALERTS_STORAGE_KEY =
    "fuelgap_alerts";


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


        if (
            !hasPermission(
                currentUser.role,
                "gaps"
            )
        ) {

            window.location.href =
                "./dashboard.html";

            return;

        }


        setTimeout(
            () => {

                renderGapsPage();

                setupGapEvents();

                renderGaps();

            },
            0
        );

    }
);


/* ==========================================
   SAFE STORAGE HELPER
========================================== */

function getGapStorageData(
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

function saveGapStorageData(
    storageKey,
    data
) {

    try {

        localStorage.setItem(
            storageKey,
            JSON.stringify(data)
        );

    } catch (error) {

        console.error(
            `Unable to save ${storageKey}:`,
            error
        );

    }

}


/* ==========================================
   GET SYSTEM DATA
========================================== */

function getGapSales() {

    return getGapStorageData(
        GAPS_SALES_STORAGE_KEY
    );

}


function getGapPayments() {

    return getGapStorageData(
        GAPS_PAYMENTS_STORAGE_KEY
    );

}


function getGapStations() {

    return getGapStorageData(
        GAPS_STATIONS_STORAGE_KEY
    );

}


function getGapShifts() {

    return getGapStorageData(
        GAPS_SHIFTS_STORAGE_KEY
    );

}


function getGapStaff() {

    return getGapStorageData(
        GAPS_STAFF_STORAGE_KEY
    );

}


function getGapAlerts() {

    return getGapStorageData(
        GAPS_ALERTS_STORAGE_KEY
    );

}


/* ==========================================
   GET CURRENT USER
========================================== */

function getGapCurrentUser() {

    return FuelGapUtils.getCurrentUser();

}


/* ==========================================
   GET VISIBLE STATIONS
========================================== */

function getGapVisibleStations() {

    const currentUser =
        getGapCurrentUser();


    const stations =
        getGapStations();


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
       ATTENDANT
    */

    if (
        currentUser.role ===
            "attendant" ||

        currentUser.role ===
            "staff"
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

function getGapVisibleStationIds() {

    return getGapVisibleStations()
        .map(
            station =>
                station.id
        );

}


/* ==========================================
   GET VISIBLE SALES
========================================== */

function getGapVisibleSales() {

    const stationIds =
        getGapVisibleStationIds();


    return getGapSales()
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

function getGapVisiblePayments() {

    const stationIds =
        getGapVisibleStationIds();


    return getGapPayments()
        .filter(
            payment =>
                stationIds.includes(
                    payment.stationId
                )
        );

}


/* ==========================================
   RENDER PAGE
========================================== */

function renderGapsPage() {

    const pageContent =
        document.getElementById(
            "pageContent"
        );


    if (!pageContent) {

        return;

    }


    pageContent.innerHTML = `

        <!-- =====================================
             PAGE HEADER
        ====================================== -->

        <div class="page-header">

            <div>

                <p class="page-eyebrow">
                    SALES RECONCILIATION
                </p>


                <h1>
                    Gaps & Variance
                </h1>


                <p>
                    Monitor expected sales, recorded
                    payments and financial variances
                    across your fuel stations.
                </p>

            </div>


            <button
                type="button"
                class="btn btn-primary"
                id="refreshGapsButton"
            >
                Refresh Analysis
            </button>

        </div>



        <!-- =====================================
             PREMIUM STAT CARDS
        ====================================== -->

        <section class="pump-stats">


            <!-- EXPECTED SALES -->

            <div class="pump-stat-card">

                <span>
                    Expected Sales
                </span>


                <strong
                    id="totalExpectedSales"
                >
                    ₦0.00
                </strong>


                <small
                    class="stat-subtext"
                    id="expectedSalesSubtext"
                >
                    Sales recorded across shifts
                </small>

            </div>



            <!-- PAYMENTS -->

            <div class="pump-stat-card">

                <span>
                    Payments Received
                </span>


                <strong
                    id="totalPaymentsReceived"
                >
                    ₦0.00
                </strong>


                <small
                    class="stat-subtext"
                    id="paymentsReceivedSubtext"
                >
                    No payment records yet
                </small>

            </div>



            <!-- GAP -->

            <div class="pump-stat-card">

                <span>
                    Total Gap
                </span>


                <strong
                    id="totalGapAmount"
                >
                    ₦0.00
                </strong>


                <small
                    class="stat-subtext"
                    id="totalGapSubtext"
                >
                    No financial gap detected
                </small>

            </div>



            <!-- CRITICAL -->

            <div class="pump-stat-card">

                <span>
                    Critical Variances
                </span>


                <strong
                    id="criticalVarianceCount"
                >
                    0
                </strong>


                <small
                    class="stat-subtext"
                    id="criticalVarianceSubtext"
                >
                    No critical issues detected
                </small>

            </div>


        </section>



        <!-- =====================================
             RECONCILIATION SECTION
        ====================================== -->

        <section class="pump-section">


            <div class="section-header">

                <div>

                    <h2>
                        Shift Reconciliation
                    </h2>


                    <p>
                        Compare expected fuel sales
                        against recorded payments.
                    </p>

                </div>

            </div>



            <!-- =====================================
                 FILTERS
            ====================================== -->

            <div class="sales-filters">


                <select
                    id="gapStationFilter"
                >

                    <option value="">
                        All Stations
                    </option>

                </select>



                <select
                    id="gapShiftFilter"
                >

                    <option value="">
                        All Shifts
                    </option>

                </select>



                <select
                    id="gapStatusFilter"
                >

                    <option value="">
                        All Statuses
                    </option>


                    <option value="normal">
                        Normal
                    </option>


                    <option value="variance">
                        Variance
                    </option>


                    <option value="critical">
                        Critical Gap
                    </option>


                    <option value="surplus">
                        Surplus
                    </option>

                </select>



                <input
                    type="search"
                    id="gapSearch"
                    placeholder="Search station, shift or attendant..."
                >


            </div>



            <!-- =====================================
                 RECONCILIATION TABLE
            ====================================== -->

            <div class="table-wrapper">


                <table
                    class="pump-table"
                >


                    <thead>

                        <tr>

                            <th>
                                Station
                            </th>


                            <th>
                                Shift
                            </th>


                            <th>
                                Attendant
                            </th>


                            <th>
                                Expected Sales
                            </th>


                            <th>
                                Payments
                            </th>


                            <th>
                                Difference
                            </th>


                            <th>
                                Variance
                            </th>


                            <th>
                                Status
                            </th>


                            <th>
                                Action
                            </th>

                        </tr>

                    </thead>


                    <tbody
                        id="gapsTableBody"
                    ></tbody>


                </table>


            </div>



            <!-- =====================================
                 EMPTY STATE
            ====================================== -->

            <div
                id="emptyGapsState"
                class="empty-state hidden"
            >

                <h3>
                    No reconciliation data yet
                </h3>


                <p>
                    Add sales and payment records
                    to begin analysing gaps and
                    variances.
                </p>

            </div>


        </section>



        <!-- =====================================
             GAP DETAILS MODAL
        ====================================== -->

        <div
            class="modal-overlay"
            id="gapDetailsModal"
        >

            <div
                class="modal"
            >


                <div
                    class="modal-header"
                >

                    <div>

                        <h2>
                            Gap Details
                        </h2>


                        <p>
                            Complete sales and payment
                            reconciliation information.
                        </p>

                    </div>


                    <button
                        type="button"
                        class="modal-close"
                        id="closeGapDetailsModal"
                    >
                        ×
                    </button>

                </div>



                <div
                    id="gapDetailsContent"
                ></div>



                <div
                    class="modal-actions"
                >

                    <button
                        type="button"
                        class="btn btn-outline"
                        id="closeGapDetailsButton"
                    >
                        Close
                    </button>

                </div>


            </div>


        </div>

    `;


    loadGapFilters();

}


/* ==========================================
   SETUP EVENTS
========================================== */

function setupGapEvents() {

    const refreshButton =
        document.getElementById(
            "refreshGapsButton"
        );


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            () => {

                renderGaps();

            }
        );

    }


    const stationFilter =
        document.getElementById(
            "gapStationFilter"
        );


    const shiftFilter =
        document.getElementById(
            "gapShiftFilter"
        );


    const statusFilter =
        document.getElementById(
            "gapStatusFilter"
        );


    const searchInput =
        document.getElementById(
            "gapSearch"
        );


    if (stationFilter) {

        stationFilter.addEventListener(
            "change",
            () => {

                renderGaps();

            }
        );

    }


    if (shiftFilter) {

        shiftFilter.addEventListener(
            "change",
            () => {

                renderGaps();

            }
        );

    }


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            () => {

                renderGaps();

            }
        );

    }


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            () => {

                renderGaps();

            }
        );

    }


    setupGapModalEvents();

}


/* ==========================================
   LOAD FILTERS
========================================== */

function loadGapFilters() {

    const stationSelect =
        document.getElementById(
            "gapStationFilter"
        );


    const shiftSelect =
        document.getElementById(
            "gapShiftFilter"
        );


    if (stationSelect) {

        getGapVisibleStations()
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


    if (shiftSelect) {

        const visibleStationIds =
            getGapVisibleStationIds();


        getGapShifts()
            .filter(
                shift =>
                    visibleStationIds.includes(
                        shift.stationId
                    )
            )
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
   BUILD GAP RECORDS
========================================== */

function buildGapRecords() {

    const sales =
        getGapVisibleSales();


    const payments =
        getGapVisiblePayments();


    const shifts =
        getGapShifts();


    const staff =
        getGapStaff();


    const stations =
        getGapStations();


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
                "NO_SHIFT";


            const key =
                `${stationId}_${shiftId}`;


            if (!combinations[key]) {

                combinations[key] = {

                    stationId,

                    shiftId,

                    staffId:
                        sale.staffId ||
                        null,

                    expectedSales:
                        0,

                    payments:
                        0

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
                .expectedSales +=
                saleAmount;


            if (sale.staffId) {

                combinations[key]
                    .staffId =
                    sale.staffId;

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
                "NO_SHIFT";


            const key =
                `${stationId}_${shiftId}`;


            if (!combinations[key]) {

                combinations[key] = {

                    stationId,

                    shiftId,

                    staffId:
                        payment.staffId ||
                        null,

                    expectedSales:
                        0,

                    payments:
                        0

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


            if (payment.staffId) {

                combinations[key]
                    .staffId =
                    payment.staffId;

            }

        }
    );


    /*
       CONVERT TO RECORDS
    */

    const records =
        Object.values(
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


                    const staffMember =
                        staff.find(
                            member =>
                                member.id ===
                                item.staffId
                        );


                    /*
                       POSITIVE = GAP
                       NEGATIVE = SURPLUS
                    */

                    const difference =
                        item.expectedSales -
                        item.payments;


                    let variancePercentage =
                        0;


                    if (
                        item.expectedSales > 0
                    ) {

                        variancePercentage =
                            (
                                Math.abs(
                                    difference
                                ) /
                                item.expectedSales
                            ) *
                            100;

                    }


                    const status =
                        calculateGapStatus(
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
                            item.shiftId ===
                            "NO_SHIFT"

                                ? "No Shift"

                                : shift
                                    ? shift.name
                                    : "Unknown Shift",

                        staffId:
                            item.staffId,

                        staffName:
                            staffMember
                                ? (
                                    staffMember.fullName ||
                                    staffMember.name ||
                                    "Unknown Staff"
                                )
                                : "Not Assigned",

                        expectedSales:
                            item.expectedSales,

                        payments:
                            item.payments,

                        difference,

                        variancePercentage,

                        status

                    };

                }
            );


    /*
       CREATE CRITICAL ALERTS
    */

    records.forEach(
        record => {

            if (
                record.status ===
                "critical"
            ) {

                createCriticalGapAlert(
                    record
                );

            }

        }
    );


    return records;

}


/* ==========================================
   CALCULATE STATUS
========================================== */

function calculateGapStatus(
    difference,
    variancePercentage
) {

    /*
       PAYMENT HIGHER THAN SALES
    */

    if (
        difference < 0
    ) {

        return "surplus";

    }


    /*
       PERFECT RECONCILIATION
    */

    if (
        difference === 0
    ) {

        return "normal";

    }


    /*
       SMALL GAP
    */

    if (
        variancePercentage <= 2
    ) {

        return "variance";

    }


    /*
       CRITICAL GAP
    */

    return "critical";

}


/* ==========================================
   CREATE CRITICAL ALERT
========================================== */

function createCriticalGapAlert(
    record
) {

    const alerts =
        getGapAlerts();


    const existingAlert =
        alerts.find(
            alert =>

                alert.type ===
                    "critical_gap" &&

                alert.stationId ===
                    record.stationId &&

                alert.shiftId ===
                    record.shiftId &&

                alert.status ===
                    "unresolved"
        );


    if (existingAlert) {

        return;

    }


    const alert = {

        id:
            `ALERT-${Date.now()}-${Math.floor(
                Math.random() *
                100000
            )}`,

        type:
            "critical_gap",

        title:
            "Critical Fuel Gap Detected",

        message:
            `A critical gap of ${formatGapCurrency(
                record.difference
            )} was detected at ${record.stationName} during ${record.shiftName}.`,

        stationId:
            record.stationId,

        stationName:
            record.stationName,

        shiftId:
            record.shiftId,

        shiftName:
            record.shiftName,

        staffId:
            record.staffId,

        staffName:
            record.staffName,

        amount:
            record.difference,

        variancePercentage:
            record.variancePercentage,

        status:
            "unresolved",

        createdAt:
            new Date()
                .toISOString()

    };


    alerts.push(
        alert
    );


    saveGapStorageData(
        GAPS_ALERTS_STORAGE_KEY,
        alerts
    );

}


/* ==========================================
   GET FILTER VALUES
========================================== */

function getGapFilters() {

    const stationFilter =
        document.getElementById(
            "gapStationFilter"
        );


    const shiftFilter =
        document.getElementById(
            "gapShiftFilter"
        );


    const statusFilter =
        document.getElementById(
            "gapStatusFilter"
        );


    const searchInput =
        document.getElementById(
            "gapSearch"
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

        status:
            statusFilter
                ? statusFilter.value
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
   FILTER RECORDS
========================================== */

function filterGapRecords(
    records,
    filters
) {

    return records.filter(
        record => {

            if (
                filters.stationId &&
                record.stationId !==
                filters.stationId
            ) {

                return false;

            }


            if (
                filters.shiftId &&
                record.shiftId !==
                filters.shiftId
            ) {

                return false;

            }


            if (
                filters.status &&
                record.status !==
                filters.status
            ) {

                return false;

            }


            if (
                filters.search
            ) {

                const searchText =
                    `
                        ${record.stationName}
                        ${record.shiftName}
                        ${record.staffName}
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
   RENDER GAPS
========================================== */

function renderGaps() {

    const records =
        buildGapRecords();


    const filters =
        getGapFilters();


    const filteredRecords =
        filterGapRecords(
            records,
            filters
        );


    const tableBody =
        document.getElementById(
            "gapsTableBody"
        );


    const emptyState =
        document.getElementById(
            "emptyGapsState"
        );


    if (!tableBody) {

        return;

    }


    tableBody.innerHTML =
        "";


    if (
        filteredRecords.length === 0
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


        filteredRecords
            .sort(
                (a, b) =>

                    Math.abs(
                        b.difference
                    ) -

                    Math.abs(
                        a.difference
                    )
            )
            .forEach(
                record => {

                    const row =
                        document.createElement(
                            "tr"
                        );


                    row.innerHTML = `

                        <td>
                            ${escapeGapHTML(
                                record.stationName
                            )}
                        </td>


                        <td>
                            <strong>
                                ${escapeGapHTML(
                                    record.shiftName
                                )}
                            </strong>
                        </td>


                        <td>
                            ${escapeGapHTML(
                                record.staffName
                            )}
                        </td>


                        <td>
                            ${formatGapCurrency(
                                record.expectedSales
                            )}
                        </td>


                        <td>
                            ${formatGapCurrency(
                                record.payments
                            )}
                        </td>


                        <td>
                            <strong>
                                ${formatGapDifference(
                                    record.difference
                                )}
                            </strong>
                        </td>


                        <td>
                            ${record.variancePercentage
                                .toFixed(2)}%
                        </td>


                        <td>

                            ${renderGapStatus(
                                record.status
                            )}

                        </td>


                        <td>

                            <button
                                type="button"
                                class="btn btn-outline btn-small"
                                data-gap-details="${record.id}"
                            >
                                View
                            </button>

                        </td>

                    `;


                    tableBody.appendChild(
                        row
                    );

                }
            );


        setupGapDetailButtons(
            records
        );

    }


    /*
       UPDATE PREMIUM CARDS
    */

    updateGapStats(
        records
    );

}


/* ==========================================
   STATUS BADGE
========================================== */

function renderGapStatus(
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
            class="status-badge gap-status-${status}"
        >

            ${labels[status]}

        </span>

    `;

}


/* ==========================================
   DETAILS BUTTONS
========================================== */

function setupGapDetailButtons(
    records
) {

    const buttons =
        document.querySelectorAll(
            "[data-gap-details]"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const recordId =
                        button.getAttribute(
                            "data-gap-details"
                        );


                    const record =
                        records.find(
                            item =>
                                item.id ===
                                recordId
                        );


                    if (record) {

                        openGapDetails(
                            record
                        );

                    }

                }
            );

        }
    );

}


/* ==========================================
   MODAL EVENTS
========================================== */

function setupGapModalEvents() {

    const modal =
        document.getElementById(
            "gapDetailsModal"
        );


    const closeButton =
        document.getElementById(
            "closeGapDetailsModal"
        );


    const closeBottomButton =
        document.getElementById(
            "closeGapDetailsButton"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeGapDetails
        );

    }


    if (closeBottomButton) {

        closeBottomButton.addEventListener(
            "click",
            closeGapDetails
        );

    }


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {

                    closeGapDetails();

                }

            }
        );

    }

}


/* ==========================================
   OPEN DETAILS
========================================== */

function openGapDetails(
    record
) {

    const modal =
        document.getElementById(
            "gapDetailsModal"
        );


    const content =
        document.getElementById(
            "gapDetailsContent"
        );


    if (
        !modal ||
        !content
    ) {

        return;

    }


    content.innerHTML = `

        <div
            class="gap-details-grid"
        >


            <div class="gap-detail-item">

                <span>
                    Station
                </span>

                <strong>
                    ${escapeGapHTML(
                        record.stationName
                    )}
                </strong>

            </div>



            <div class="gap-detail-item">

                <span>
                    Shift
                </span>

                <strong>
                    ${escapeGapHTML(
                        record.shiftName
                    )}
                </strong>

            </div>



            <div class="gap-detail-item">

                <span>
                    Attendant
                </span>

                <strong>
                    ${escapeGapHTML(
                        record.staffName
                    )}
                </strong>

            </div>



            <div class="gap-detail-item">

                <span>
                    Expected Sales
                </span>

                <strong>
                    ${formatGapCurrency(
                        record.expectedSales
                    )}
                </strong>

            </div>



            <div class="gap-detail-item">

                <span>
                    Payments Received
                </span>

                <strong>
                    ${formatGapCurrency(
                        record.payments
                    )}
                </strong>

            </div>



            <div class="gap-detail-item">

                <span>
                    Difference
                </span>

                <strong>
                    ${formatGapDifference(
                        record.difference
                    )}
                </strong>

            </div>



            <div class="gap-detail-item">

                <span>
                    Variance
                </span>

                <strong>
                    ${record.variancePercentage
                        .toFixed(2)}%
                </strong>

            </div>



            <div class="gap-detail-item">

                <span>
                    Status
                </span>

                <strong>

                    ${renderGapStatus(
                        record.status
                    )}

                </strong>

            </div>


        </div>


        <div
            class="gap-explanation"
        >

            <h3>
                Reconciliation Result
            </h3>


            <p>

                ${getGapExplanation(
                    record
                )}

            </p>

        </div>

    `;


    modal.classList.add(
        "active"
    );


    document.body.style.overflow =
        "hidden";

}


/* ==========================================
   CLOSE DETAILS
========================================== */

function closeGapDetails() {

    const modal =
        document.getElementById(
            "gapDetailsModal"
        );


    if (modal) {

        modal.classList.remove(
            "active"
        );

    }


    document.body.style.overflow =
        "";

}


/* ==========================================
   GAP EXPLANATION
========================================== */

function getGapExplanation(
    record
) {

    if (
        record.status ===
        "normal"
    ) {

        return `
            Sales and payments are fully reconciled.
            No financial gap was detected for this shift.
        `;

    }


    if (
        record.status ===
        "variance"
    ) {

        return `
            A small difference was detected between
            expected fuel sales and recorded payments.
            The shift should be reviewed for possible
            missing or delayed payment records.
        `;

    }


    if (
        record.status ===
        "critical"
    ) {

        return `
            A significant financial difference was detected.
            This shift requires immediate investigation by
            the station manager or organization owner.
        `;

    }


    if (
        record.status ===
        "surplus"
    ) {

        return `
            Payments received are higher than the expected
            sales recorded for this shift. Review both sales
            and payment records to identify the source of
            the surplus.
        `;

    }


    return "";

}


/* ==========================================
   UPDATE PREMIUM STAT CARDS
========================================== */

function updateGapStats(
    records
) {

    const expectedSales =
        records.reduce(
            (
                total,
                record
            ) =>
                total +
                record.expectedSales,
            0
        );


    const payments =
        records.reduce(
            (
                total,
                record
            ) =>
                total +
                record.payments,
            0
        );


    /*
       ONLY POSITIVE
       DIFFERENCES COUNT AS GAP
    */

    const totalGap =
        records.reduce(
            (
                total,
                record
            ) => {

                if (
                    record.difference > 0
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


    const totalSurplus =
        records.reduce(
            (
                total,
                record
            ) => {

                if (
                    record.difference < 0
                ) {

                    return (
                        total +
                        Math.abs(
                            record.difference
                        )
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


    /*
       CALCULATE PAYMENT
       RECONCILIATION RATE
    */

    let paymentRate =
        0;


    if (
        expectedSales > 0
    ) {

        paymentRate =
            (
                payments /
                expectedSales
            ) *
            100;

    }


    /*
       GET CARD ELEMENTS
    */

    const expectedElement =
        document.getElementById(
            "totalExpectedSales"
        );


    const paymentsElement =
        document.getElementById(
            "totalPaymentsReceived"
        );


    const gapElement =
        document.getElementById(
            "totalGapAmount"
        );


    const criticalElement =
        document.getElementById(
            "criticalVarianceCount"
        );


    /*
       GET SUBTEXT ELEMENTS
    */

    const expectedSubtext =
        document.getElementById(
            "expectedSalesSubtext"
        );


    const paymentsSubtext =
        document.getElementById(
            "paymentsReceivedSubtext"
        );


    const gapSubtext =
        document.getElementById(
            "totalGapSubtext"
        );


    const criticalSubtext =
        document.getElementById(
            "criticalVarianceSubtext"
        );


    /*
       UPDATE VALUES
    */

    if (expectedElement) {

        expectedElement.textContent =
            formatGapCurrency(
                expectedSales
            );

    }


    if (paymentsElement) {

        paymentsElement.textContent =
            formatGapCurrency(
                payments
            );

    }


    if (gapElement) {

        gapElement.textContent =
            formatGapCurrency(
                totalGap
            );

    }


    if (criticalElement) {

        criticalElement.textContent =
            criticalCount;

    }


    /*
       EXPECTED SALES SUBTEXT
    */

    if (expectedSubtext) {

        expectedSubtext.textContent =
            `${records.length} shift${
                records.length === 1
                    ? ""
                    : "s"
            } analysed`;

    }


    /*
       PAYMENT SUBTEXT
    */

    if (paymentsSubtext) {

        if (
            expectedSales === 0
        ) {

            paymentsSubtext.textContent =
                "No expected sales recorded";

        } else {

            paymentsSubtext.textContent =
                `${paymentRate.toFixed(
                    1
                )}% reconciliation rate`;

        }

    }


    /*
       GAP SUBTEXT
    */

    if (gapSubtext) {

        if (
            totalGap === 0 &&
            totalSurplus === 0
        ) {

            gapSubtext.textContent =
                "Fully reconciled";

        } else if (
            totalGap === 0 &&
            totalSurplus > 0
        ) {

            gapSubtext.textContent =
                `Surplus: ${formatGapCurrency(
                    totalSurplus
                )}`;

        } else {

            const gapPercentage =
                expectedSales > 0

                    ? (
                        totalGap /
                        expectedSales
                    ) * 100

                    : 0;


            gapSubtext.textContent =
                `${gapPercentage.toFixed(
                    2
                )}% of expected sales`;

        }

    }


    /*
       CRITICAL SUBTEXT
    */

    if (criticalSubtext) {

        if (
            criticalCount === 0
        ) {

            criticalSubtext.textContent =
                "No critical issues detected";

        } else {

            criticalSubtext.textContent =
                `${criticalCount} shift${
                    criticalCount === 1
                        ? " requires"
                        : "s require"
                } attention`;

        }

    }

}


/* ==========================================
   FORMAT CURRENCY
========================================== */

function formatGapCurrency(
    amount
) {

    const value =
        Number(amount) || 0;


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
   FORMAT DIFFERENCE
========================================== */

function formatGapDifference(
    amount
) {

    const value =
        Number(amount) || 0;


    if (
        value > 0
    ) {

        return formatGapCurrency(
            value
        );

    }


    if (
        value < 0
    ) {

        return `+${formatGapCurrency(
            Math.abs(value)
        )}`;

    }


    return formatGapCurrency(
        0
    );

}


/* ==========================================
   ESCAPE HTML
========================================== */

function escapeGapHTML(
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