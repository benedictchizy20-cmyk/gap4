/* =========================================================
   FUELGAP - PROFESSIONAL SALES MANAGEMENT
   PREMIUM UI + EXISTING SALES LOGIC
========================================================= */

const SALES_READINGS_STORAGE_KEY = "fuelgap_meter_readings";
const SALES_STATIONS_STORAGE_KEY = "fuelgap_stations";
const SALES_PUMPS_STORAGE_KEY = "fuelgap_pumps";
const SALES_NOZZLES_STORAGE_KEY = "fuelgap_nozzles";
const SALES_SHIFTS_STORAGE_KEY = "fuelgap_shifts";
const SALES_STAFF_STORAGE_KEY = "fuelgap_staff";


/* =========================================================
   PAGE STATE
========================================================= */

const SalesState = {
    records: [],
    filteredRecords: [],
    currentSort: {
        key: "openedAt",
        direction: "desc"
    },
    currentPage: 1,
    rowsPerPage: 10
};


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const currentUser = FuelGapUtils.getCurrentUser();

    if (!currentUser) {
        window.location.href = "../login.html";
        return;
    }

    if (!hasPermission(currentUser.role, "sales")) {
        window.location.href = "./dashboard.html";
        return;
    }

    renderSalesPage();
    setupSalesEvents();
    refreshSalesData();

});


/* =========================================================
   SAFE STORAGE
========================================================= */

function getStorageData(storageKey) {

    try {

        const data = localStorage.getItem(storageKey);

        if (!data) {
            return [];
        }

        const parsed = JSON.parse(data);

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


/* =========================================================
   LOAD DATA
========================================================= */

function getMeterReadings() {
    return getStorageData(SALES_READINGS_STORAGE_KEY);
}

function getStations() {
    return getStorageData(SALES_STATIONS_STORAGE_KEY);
}

function getPumps() {
    return getStorageData(SALES_PUMPS_STORAGE_KEY);
}

function getNozzles() {
    return getStorageData(SALES_NOZZLES_STORAGE_KEY);
}

function getShifts() {
    return getStorageData(SALES_SHIFTS_STORAGE_KEY);
}

function getStaff() {
    return getStorageData(SALES_STAFF_STORAGE_KEY);
}


/* =========================================================
   USER ACCESS
========================================================= */

function getVisibleStations() {

    const currentUser = FuelGapUtils.getCurrentUser();
    const stations = getStations();

    if (!currentUser) {
        return [];
    }

    if (currentUser.role === "admin") {
        return stations;
    }

    if (currentUser.role === "owner") {

        return stations.filter(
            station =>
                station.organizationId ===
                currentUser.organizationId
        );

    }

    if (currentUser.role === "manager") {

        if (currentUser.stationId) {

            return stations.filter(
                station =>
                    station.id === currentUser.stationId
            );

        }

        return stations.filter(
            station =>
                station.organizationId ===
                currentUser.organizationId
        );

    }

    if (
        currentUser.role === "staff" ||
        currentUser.role === "attendant"
    ) {

        if (!currentUser.stationId) {
            return [];
        }

        return stations.filter(
            station =>
                station.id === currentUser.stationId
        );

    }

    return [];

}


function getVisibleStationIds() {

    return getVisibleStations()
        .map(station => station.id);

}


function getVisibleShifts() {

    const stationIds =
        getVisibleStationIds();

    return getShifts()
        .filter(
            shift =>
                stationIds.includes(
                    shift.stationId
                )
        );

}


/* =========================================================
   RENDER PAGE
========================================================= */

function renderSalesPage() {

    const pageContent =
        document.getElementById("pageContent");

    if (!pageContent) {
        return;
    }

    pageContent.innerHTML = `

        <div class="sales-page">

            <!-- =================================================
                 HEADER
            ================================================== -->

            <header class="sales-page-header">

                <div class="sales-header-left">

                    <div class="sales-eyebrow">
                        <span class="sales-eyebrow-dot"></span>
                        LIVE SALES OPERATIONS
                    </div>

                    <h1>
                        Sales Command Center
                    </h1>

                    <p>
                        Monitor fuel volume, expected revenue,
                        active shifts and nozzle performance
                        across your station operations.
                    </p>

                </div>


                <div class="sales-header-actions">

                    <button
                        type="button"
                        class="sales-btn sales-btn-secondary"
                        id="exportSalesButton"
                    >
                        <span>⇩</span>
                        Export CSV
                    </button>


                    <button
                        type="button"
                        class="sales-btn sales-btn-primary"
                        id="refreshSalesButton"
                    >
                        <span id="refreshIcon">↻</span>
                        Refresh Data
                    </button>

                </div>

            </header>



            <!-- =================================================
                 KPI CARDS
            ================================================== -->

            <section class="sales-kpi-grid">

                <!-- Expected Revenue -->

                <article class="sales-kpi-card">

                    <div class="sales-kpi-top">

                        <div class="sales-kpi-icon">
                            ₦
                        </div>

                        <span class="sales-kpi-label">
                            Expected Revenue
                        </span>

                    </div>

                    <strong
                        class="sales-kpi-value"
                        id="totalSalesAmount"
                    >
                        ₦0.00
                    </strong>

                    <span class="sales-kpi-description">
                        Estimated value of fuel dispensed
                    </span>

                </article>



                <!-- Fuel Volume -->

                <article class="sales-kpi-card">

                    <div class="sales-kpi-top">

                        <div class="sales-kpi-icon">
                            ⛽
                        </div>

                        <span class="sales-kpi-label">
                            Fuel Dispensed
                        </span>

                    </div>

                    <strong
                        class="sales-kpi-value"
                        id="totalLitresSold"
                    >
                        0 L
                    </strong>

                    <span class="sales-kpi-description">
                        Total calculated litres sold
                    </span>

                </article>



                <!-- Active Shifts -->

                <article class="sales-kpi-card">

                    <div class="sales-kpi-top">

                        <div class="sales-kpi-icon">
                            ◉
                        </div>

                        <span class="sales-kpi-label">
                            Active Shifts
                        </span>

                    </div>

                    <strong
                        class="sales-kpi-value"
                        id="activeShiftCount"
                    >
                        0
                    </strong>

                    <span class="sales-kpi-description">
                        Shifts currently operating
                    </span>

                </article>



                <!-- Sales Records -->

                <article class="sales-kpi-card">

                    <div class="sales-kpi-top">

                        <div class="sales-kpi-icon">
                            ≡
                        </div>

                        <span class="sales-kpi-label">
                            Sales Records
                        </span>

                    </div>

                    <strong
                        class="sales-kpi-value"
                        id="salesRecordCount"
                    >
                        0
                    </strong>

                    <span class="sales-kpi-description">
                        Valid nozzle sales records
                    </span>

                </article>

            </section>



            <!-- =================================================
                 INSIGHT STRIP
            ================================================== -->

            <section class="sales-insight-strip">

                <div class="sales-insight-item">

                    <span class="sales-insight-label">
                        Average Price / Litre
                    </span>

                    <strong
                        class="sales-insight-value"
                        id="averagePricePerLitre"
                    >
                        ₦0.00
                    </strong>

                </div>


                <div class="sales-insight-item">

                    <span class="sales-insight-label">
                        Average Volume / Record
                    </span>

                    <strong
                        class="sales-insight-value"
                        id="averageVolumePerRecord"
                    >
                        0 L
                    </strong>

                </div>


                <div class="sales-insight-item">

                    <span class="sales-insight-label">
                        Active Stations
                    </span>

                    <strong
                        class="sales-insight-value"
                        id="activeStationCount"
                    >
                        0
                    </strong>

                </div>


                <div class="sales-insight-item">

                    <span class="sales-insight-label">
                        Last Updated
                    </span>

                    <strong
                        class="sales-insight-value"
                        id="salesLastUpdated"
                    >
                        Just now
                    </strong>

                </div>

            </section>



            <!-- =================================================
                 MAIN SALES CARD
            ================================================== -->

            <section class="sales-main-card">


                <!-- SECTION HEADER -->

                <div class="sales-section-header">

                    <div class="sales-section-title">

                        <div class="sales-section-title-icon">
                            ⛽
                        </div>

                        <div>

                            <h2>
                                Sales Records
                            </h2>

                            <p>
                                Meter-based fuel sales generated
                                from opening and closing readings.
                            </p>

                        </div>

                    </div>


                    <div
                        class="sales-record-badge"
                        id="salesRecordBadge"
                    >
                        0 Records
                    </div>

                </div>



                <!-- =================================================
                     FILTER BAR
                ================================================== -->

                <div class="sales-filter-bar">


                    <!-- Station -->

                    <div class="sales-filter-field">

                        <label for="salesStationFilter">
                            Station
                        </label>

                        <select
                            id="salesStationFilter"
                        >
                            <option value="">
                                All Stations
                            </option>
                        </select>

                    </div>



                    <!-- Shift -->

                    <div class="sales-filter-field">

                        <label for="salesShiftFilter">
                            Shift
                        </label>

                        <select
                            id="salesShiftFilter"
                        >
                            <option value="">
                                All Shifts
                            </option>
                        </select>

                    </div>



                    <!-- Nozzle -->

                    <div class="sales-filter-field">

                        <label for="salesNozzleFilter">
                            Nozzle
                        </label>

                        <select
                            id="salesNozzleFilter"
                        >
                            <option value="">
                                All Nozzles
                            </option>
                        </select>

                    </div>



                    <!-- Search -->

                    <div class="sales-filter-field search">

                        <label for="salesSearch">
                            Search
                        </label>

                        <div class="sales-search">

                            <span class="sales-search-icon">
                                ⌕
                            </span>

                            <input
                                type="search"
                                id="salesSearch"
                                placeholder="Search station, pump or nozzle..."
                            >

                        </div>

                    </div>



                    <!-- Clear -->

                    <button
                        type="button"
                        class="sales-clear-btn"
                        id="clearSalesFilters"
                    >
                        Clear
                    </button>

                </div>



                <!-- =================================================
                     TABLE
                ================================================== -->

                <div class="sales-table-container">

                    <table class="sales-table">

                        <thead>

                            <tr>

                                <th
                                    data-sort="stationName"
                                    class="sales-sortable"
                                >
                                    Station
                                    <span class="sales-sort-icon">
                                        ↕
                                    </span>
                                </th>


                                <th
                                    data-sort="shiftName"
                                    class="sales-sortable"
                                >
                                    Shift
                                    <span class="sales-sort-icon">
                                        ↕
                                    </span>
                                </th>


                                <th>
                                    Pump / Nozzle
                                </th>


                                <th>
                                    Meter
                                </th>


                                <th
                                    data-sort="litresSold"
                                    class="sales-sortable"
                                >
                                    Volume
                                    <span class="sales-sort-icon">
                                        ↕
                                    </span>
                                </th>


                                <th>
                                    Price / L
                                </th>


                                <th
                                    data-sort="expectedSales"
                                    class="sales-sortable"
                                >
                                    Expected Revenue
                                    <span class="sales-sort-icon">
                                        ↕
                                    </span>
                                </th>


                                <th>
                                    Status
                                </th>

                            </tr>

                        </thead>


                        <tbody
                            id="salesTableBody"
                        ></tbody>

                    </table>

                </div>



                <!-- =================================================
                     EMPTY STATE
                ================================================== -->

                <div
                    id="emptySalesState"
                    class="sales-empty hidden"
                >

                    <div class="sales-empty-icon">
                        ⛽
                    </div>

                    <h3>
                        No sales records found
                    </h3>

                    <p>
                        Sales records will appear automatically
                        when valid opening and closing meter
                        readings are available.
                    </p>

                    <button
                        type="button"
                        class="sales-btn sales-btn-primary"
                        id="emptyStateRefreshButton"
                    >
                        Refresh Sales
                    </button>

                </div>



                <!-- =================================================
                     PAGINATION
                ================================================== -->

                <div
                    class="sales-pagination hidden"
                    id="salesPagination"
                >

                    <div
                        class="sales-pagination-info"
                        id="paginationInfo"
                    >
                        Showing 0 records
                    </div>


                    <div class="sales-pagination-controls">

                        <button
                            type="button"
                            class="sales-page-btn"
                            id="previousPageButton"
                        >
                            ←
                        </button>


                        <div
                            class="sales-pagination-controls"
                            id="paginationPages"
                        ></div>


                        <button
                            type="button"
                            class="sales-page-btn"
                            id="nextPageButton"
                        >
                            →
                        </button>

                    </div>

                </div>

            </section>

        </div>

    `;

}


/* =========================================================
   EVENTS
========================================================= */

function setupSalesEvents() {

    setupRefreshButton();

    setupExportButton();

    loadSalesFilters();

    setupSalesFilters();

    setupClearFilters();

    setupSorting();

    setupPaginationEvents();

    setupEmptyStateButton();

}


/* =========================================================
   REFRESH
========================================================= */

function setupRefreshButton() {

    const button =
        document.getElementById(
            "refreshSalesButton"
        );

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        () => {

            button.disabled = true;

            const icon =
                document.getElementById(
                    "refreshIcon"
                );

            if (icon) {

                icon.classList.add(
                    "sales-refresh-spin"
                );

            }

            setTimeout(() => {

                refreshSalesData();

                button.disabled = false;

                if (icon) {

                    icon.classList.remove(
                        "sales-refresh-spin"
                    );

                }

            }, 350);

        }
    );

}


function refreshSalesData() {

    SalesState.records =
        buildSalesRecords();

    SalesState.currentPage = 1;

    renderSales();

    updateLastUpdated();

}


/* =========================================================
   FILTERS
========================================================= */

function loadSalesFilters() {

    loadStationFilter();

    loadShiftFilter();

    loadNozzleFilter();

}


function resetSelectOptions(select) {

    if (!select) {
        return;
    }

    while (select.options.length > 1) {
        select.remove(1);
    }

}


/* =========================================================
   STATION FILTER
========================================================= */

function loadStationFilter() {

    const select =
        document.getElementById(
            "salesStationFilter"
        );

    if (!select) {
        return;
    }

    resetSelectOptions(select);

    getVisibleStations()
        .forEach(station => {

            const option =
                document.createElement("option");

            option.value =
                station.id;

            option.textContent =
                station.name ||
                "Unnamed Station";

            select.appendChild(option);

        });

}


/* =========================================================
   SHIFT FILTER
========================================================= */

function loadShiftFilter() {

    const select =
        document.getElementById(
            "salesShiftFilter"
        );

    if (!select) {
        return;
    }

    resetSelectOptions(select);

    getVisibleShifts()
        .forEach(shift => {

            const option =
                document.createElement("option");

            option.value =
                shift.id;

            option.textContent =
                shift.name ||
                shift.shiftName ||
                "Unnamed Shift";

            select.appendChild(option);

        });

}


/* =========================================================
   NOZZLE FILTER
========================================================= */

function loadNozzleFilter() {

    const select =
        document.getElementById(
            "salesNozzleFilter"
        );

    if (!select) {
        return;
    }

    resetSelectOptions(select);

    const stationIds =
        getVisibleStationIds();

    const visiblePumpIds =
        getPumps()
            .filter(
                pump =>
                    stationIds.includes(
                        pump.stationId
                    )
            )
            .map(
                pump =>
                    pump.id
            );

    getNozzles()
        .filter(
            nozzle =>
                visiblePumpIds.includes(
                    nozzle.pumpId
                )
        )
        .forEach(nozzle => {

            const option =
                document.createElement("option");

            option.value =
                nozzle.id;

            option.textContent =
                getNozzleName(nozzle);

            select.appendChild(option);

        });

}


/* =========================================================
   FILTER EVENTS
========================================================= */

function setupSalesFilters() {

    const filterIds = [
        "salesStationFilter",
        "salesShiftFilter",
        "salesNozzleFilter"
    ];

    filterIds.forEach(id => {

        const element =
            document.getElementById(id);

        if (!element) {
            return;
        }

        element.addEventListener(
            "change",
            () => {

                SalesState.currentPage = 1;

                renderSales();

            }
        );

    });


    const searchInput =
        document.getElementById(
            "salesSearch"
        );

    if (searchInput) {

        let searchTimer;

        searchInput.addEventListener(
            "input",
            () => {

                clearTimeout(searchTimer);

                searchTimer =
                    setTimeout(() => {

                        SalesState.currentPage = 1;

                        renderSales();

                    }, 200);

            }
        );

    }

}


/* =========================================================
   CLEAR FILTERS
========================================================= */

function setupClearFilters() {

    const button =
        document.getElementById(
            "clearSalesFilters"
        );

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        () => {

            const station =
                document.getElementById(
                    "salesStationFilter"
                );

            const shift =
                document.getElementById(
                    "salesShiftFilter"
                );

            const nozzle =
                document.getElementById(
                    "salesNozzleFilter"
                );

            const search =
                document.getElementById(
                    "salesSearch"
                );

            if (station) {
                station.value = "";
            }

            if (shift) {
                shift.value = "";
            }

            if (nozzle) {
                nozzle.value = "";
            }

            if (search) {
                search.value = "";
            }

            SalesState.currentPage = 1;

            renderSales();

        }
    );

}


/* =========================================================
   SORTING
========================================================= */

function setupSorting() {

    document
        .querySelectorAll(
            ".sales-sortable"
        )
        .forEach(column => {

            column.addEventListener(
                "click",
                () => {

                    const key =
                        column.dataset.sort;

                    if (
                        SalesState.currentSort.key ===
                        key
                    ) {

                        SalesState.currentSort.direction =
                            SalesState.currentSort.direction ===
                            "asc"
                                ? "desc"
                                : "asc";

                    } else {

                        SalesState.currentSort.key =
                            key;

                        SalesState.currentSort.direction =
                            "asc";

                    }

                    renderSales();

                }
            );

        });

}


/* =========================================================
   PAGINATION EVENTS
========================================================= */

function setupPaginationEvents() {

    const previousButton =
        document.getElementById(
            "previousPageButton"
        );

    const nextButton =
        document.getElementById(
            "nextPageButton"
        );

    if (previousButton) {

        previousButton.addEventListener(
            "click",
            () => {

                if (
                    SalesState.currentPage > 1
                ) {

                    SalesState.currentPage--;

                    renderSales();

                }

            }
        );

    }


    if (nextButton) {

        nextButton.addEventListener(
            "click",
            () => {

                const totalPages =
                    Math.ceil(
                        SalesState.filteredRecords.length /
                        SalesState.rowsPerPage
                    );

                if (
                    SalesState.currentPage <
                    totalPages
                ) {

                    SalesState.currentPage++;

                    renderSales();

                }

            }
        );

    }

}


/* =========================================================
   EMPTY STATE
========================================================= */

function setupEmptyStateButton() {

    const button =
        document.getElementById(
            "emptyStateRefreshButton"
        );

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        refreshSalesData
    );

}


/* =========================================================
   READING HELPERS
========================================================= */

function getReadingType(reading) {

    return (
        reading.type ||
        reading.readingType ||
        reading.readingCategory ||
        ""
    )
        .toString()
        .toLowerCase()
        .trim();

}


function getReadingValue(reading) {

    const possibleValues = [

        reading.reading,
        reading.meterReading,
        reading.value,
        reading.meterValue,
        reading.currentReading

    ];

    for (const value of possibleValues) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            continue;
        }

        const number =
            Number(value);

        if (!Number.isNaN(number)) {
            return number;
        }

    }

    return null;

}


function getReadingDate(reading) {

    const possibleDates = [

        reading.createdAt,
        reading.timestamp,
        reading.recordedAt,
        reading.date,
        reading.updatedAt

    ];

    for (const value of possibleDates) {

        if (!value) {
            continue;
        }

        const date =
            new Date(value);

        if (
            !Number.isNaN(
                date.getTime()
            )
        ) {
            return date;
        }

    }

    return null;

}


/* =========================================================
   PRODUCT HELPERS
========================================================= */

function getNozzlePrice(nozzle) {

    if (!nozzle) {
        return 0;
    }

    const possiblePrices = [

        nozzle.pricePerLitre,
        nozzle.price,
        nozzle.fuelPrice,
        nozzle.sellingPrice,
        nozzle.pricePerLiter

    ];

    for (const value of possiblePrices) {

        const price =
            Number(value);

        if (
            !Number.isNaN(price) &&
            price > 0
        ) {
            return price;
        }

    }

    return 0;

}


function getNozzleName(nozzle) {

    if (!nozzle) {
        return "Unknown Nozzle";
    }

    return (
        nozzle.name ||
        nozzle.nozzleName ||
        nozzle.code ||
        nozzle.label ||
        `Nozzle ${nozzle.number || ""}`
    );

}


function getPumpName(pump) {

    if (!pump) {
        return "Unknown Pump";
    }

    return (
        pump.name ||
        pump.pumpName ||
        pump.code ||
        `Pump ${pump.number || ""}`
    );

}


/* =========================================================
   SHIFT DATES
========================================================= */

function getShiftOpenDate(shift) {

    const possibleDates = [

        shift.openedAt,
        shift.startDate,
        shift.createdAt

    ];

    for (const value of possibleDates) {

        if (!value) {
            continue;
        }

        const date =
            new Date(value);

        if (
            !Number.isNaN(
                date.getTime()
            )
        ) {
            return date;
        }

    }

    return null;

}


function getShiftCloseDate(shift) {

    const possibleDates = [

        shift.closedAt,
        shift.endDate,
        shift.updatedAt

    ];

    for (const value of possibleDates) {

        if (!value) {
            continue;
        }

        const date =
            new Date(value);

        if (
            !Number.isNaN(
                date.getTime()
            )
        ) {
            return date;
        }

    }

    return new Date();

}


/* =========================================================
   SHIFT READINGS
========================================================= */

function getReadingsForShift(
    shift,
    readings
) {

    const directShiftReadings =
        readings.filter(
            reading =>
                reading.shiftId ===
                shift.id
        );

    if (
        directShiftReadings.length > 0
    ) {

        return directShiftReadings;

    }


    const shiftOpenDate =
        getShiftOpenDate(shift);

    const shiftCloseDate =
        getShiftCloseDate(shift);


    return readings.filter(reading => {

        if (
            reading.stationId !==
            shift.stationId
        ) {
            return false;
        }


        const readingDate =
            getReadingDate(reading);

        if (!readingDate) {
            return false;
        }


        if (
            shiftOpenDate &&
            readingDate < shiftOpenDate
        ) {
            return false;
        }


        if (
            shiftCloseDate &&
            readingDate > shiftCloseDate
        ) {
            return false;
        }


        return true;

    });

}


/* =========================================================
   BUILD SALES RECORDS
========================================================= */

function buildSalesRecords() {

    const readings =
        getMeterReadings();

    const shifts =
        getVisibleShifts();

    const stations =
        getStations();

    const pumps =
        getPumps();

    const nozzles =
        getNozzles();

    const salesRecords = [];


    shifts.forEach(shift => {

        const shiftReadings =
            getReadingsForShift(
                shift,
                readings
            );


        const nozzleGroups = {};


        shiftReadings.forEach(reading => {

            const nozzleId =
                reading.nozzleId;

            if (!nozzleId) {
                return;
            }

            if (!nozzleGroups[nozzleId]) {
                nozzleGroups[nozzleId] = [];
            }

            nozzleGroups[nozzleId]
                .push(reading);

        });


        Object.keys(nozzleGroups)
            .forEach(nozzleId => {

                const nozzle =
                    nozzles.find(
                        item =>
                            item.id === nozzleId
                    );


                const pump =
                    pumps.find(
                        item =>
                            item.id ===
                            (
                                nozzle
                                    ? nozzle.pumpId
                                    : null
                            )
                    );


                const station =
                    stations.find(
                        item =>
                            item.id ===
                            shift.stationId
                    );


                const nozzleReadings =
                    nozzleGroups[nozzleId]
                        .map(reading => ({

                            ...reading,

                            _date:
                                getReadingDate(
                                    reading
                                ),

                            _value:
                                getReadingValue(
                                    reading
                                ),

                            _type:
                                getReadingType(
                                    reading
                                )

                        }))
                        .filter(
                            reading =>
                                reading._date &&
                                reading._value !== null
                        )
                        .sort(
                            (a, b) =>
                                a._date -
                                b._date
                        );


                if (
                    nozzleReadings.length < 2
                ) {
                    return;
                }


                let openingReading =
                    nozzleReadings.find(
                        reading =>
                            [
                                "opening",
                                "open",
                                "opening_reading"
                            ].includes(
                                reading._type
                            )
                    );


                let closingReading =
                    [...nozzleReadings]
                        .reverse()
                        .find(
                            reading =>
                                [
                                    "closing",
                                    "close",
                                    "closing_reading"
                                ].includes(
                                    reading._type
                                )
                        );


                if (!openingReading) {
                    openingReading =
                        nozzleReadings[0];
                }


                if (!closingReading) {
                    closingReading =
                        nozzleReadings[
                            nozzleReadings.length - 1
                        ];
                }


                if (
                    !openingReading ||
                    !closingReading
                ) {
                    return;
                }


                if (
                    closingReading._value <
                    openingReading._value
                ) {
                    return;
                }


                const litresSold =
                    closingReading._value -
                    openingReading._value;


                if (litresSold <= 0) {
                    return;
                }


                const pricePerLitre =
                    getNozzlePrice(nozzle);


                const expectedSales =
                    litresSold *
                    pricePerLitre;


                salesRecords.push({

                    id:
                        `${shift.id}-${nozzleId}`,

                    shiftId:
                        shift.id,

                    shiftName:
                        shift.name ||
                        shift.shiftName ||
                        "Unnamed Shift",

                    stationId:
                        shift.stationId,

                    stationName:
                        station
                            ? station.name
                            : "Unknown Station",

                    pumpId:
                        pump
                            ? pump.id
                            : null,

                    pumpName:
                        getPumpName(pump),

                    nozzleId,

                    nozzleName:
                        getNozzleName(nozzle),

                    openingReading:
                        openingReading._value,

                    closingReading:
                        closingReading._value,

                    litresSold,

                    pricePerLitre,

                    expectedSales,

                    shiftStatus:
                        (
                            shift.status ||
                            "closed"
                        )
                            .toLowerCase(),

                    openedAt:
                        shift.openedAt,

                    closedAt:
                        shift.closedAt

                });

            });

    });


    return salesRecords;

}


/* =========================================================
   GET FILTERS
========================================================= */

function getSalesFilters() {

    const stationFilter =
        document.getElementById(
            "salesStationFilter"
        );

    const shiftFilter =
        document.getElementById(
            "salesShiftFilter"
        );

    const nozzleFilter =
        document.getElementById(
            "salesNozzleFilter"
        );

    const searchInput =
        document.getElementById(
            "salesSearch"
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

        nozzleId:
            nozzleFilter
                ? nozzleFilter.value
                : "",

        search:
            searchInput
                ? searchInput.value
                    .toLowerCase()
                    .trim()
                : ""

    };

}


/* =========================================================
   FILTER RECORDS
========================================================= */

function filterSalesRecords(
    records,
    filters
) {

    return records.filter(record => {

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
            filters.nozzleId &&
            record.nozzleId !==
            filters.nozzleId
        ) {
            return false;
        }


        if (filters.search) {

            const searchableText =
                `
                    ${record.stationName}
                    ${record.shiftName}
                    ${record.pumpName}
                    ${record.nozzleName}
                `
                    .toLowerCase();


            if (
                !searchableText.includes(
                    filters.search
                )
            ) {
                return false;
            }

        }


        return true;

    });

}


/* =========================================================
   SORT RECORDS
========================================================= */

function sortSalesRecords(records) {

    const {
        key,
        direction
    } = SalesState.currentSort;


    return [...records]
        .sort((a, b) => {

            let valueA =
                a[key];

            let valueB =
                b[key];


            if (
                typeof valueA === "string"
            ) {

                valueA =
                    valueA.toLowerCase();

            }


            if (
                typeof valueB === "string"
            ) {

                valueB =
                    valueB.toLowerCase();

            }


            if (
                valueA === undefined ||
                valueA === null
            ) {
                valueA = "";
            }


            if (
                valueB === undefined ||
                valueB === null
            ) {
                valueB = "";
            }


            if (valueA < valueB) {
                return direction === "asc"
                    ? -1
                    : 1;
            }


            if (valueA > valueB) {
                return direction === "asc"
                    ? 1
                    : -1;
            }


            return 0;

        });

}


/* =========================================================
   RENDER SALES
========================================================= */

function renderSales() {

    const filters =
        getSalesFilters();


    const filteredRecords =
        filterSalesRecords(
            SalesState.records,
            filters
        );


    const sortedRecords =
        sortSalesRecords(
            filteredRecords
        );


    SalesState.filteredRecords =
        sortedRecords;


    const tableBody =
        document.getElementById(
            "salesTableBody"
        );

    const emptyState =
        document.getElementById(
            "emptySalesState"
        );

    const pagination =
        document.getElementById(
            "salesPagination"
        );


    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = "";


    if (
        sortedRecords.length === 0
    ) {

        if (emptyState) {
            emptyState.classList.remove(
                "hidden"
            );
        }

        if (pagination) {
            pagination.classList.add(
                "hidden"
            );
        }

    } else {

        if (emptyState) {
            emptyState.classList.add(
                "hidden"
            );
        }


        const totalPages =
            Math.ceil(
                sortedRecords.length /
                SalesState.rowsPerPage
            );


        if (
            SalesState.currentPage >
            totalPages
        ) {

            SalesState.currentPage =
                totalPages;

        }


        const startIndex =
            (
                SalesState.currentPage - 1
            ) *
            SalesState.rowsPerPage;


        const endIndex =
            startIndex +
            SalesState.rowsPerPage;


        const pageRecords =
            sortedRecords.slice(
                startIndex,
                endIndex
            );


        pageRecords.forEach(record => {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>

                    <div class="sales-station">

                        <div class="sales-station-avatar">
                            ${getStationInitials(
                                record.stationName
                            )}
                        </div>

                        <div class="sales-station-info">

                            <strong class="sales-station-name">
                                ${escapeHTML(
                                    record.stationName
                                )}
                            </strong>

                            <span class="sales-station-subtitle">
                                Station operation
                            </span>

                        </div>

                    </div>

                </td>


                <td>

                    <span class="sales-shift">
                        ${escapeHTML(
                            record.shiftName
                        )}
                    </span>

                </td>


                <td>

                    <div class="sales-pump">

                        <strong class="sales-pump-name">
                            ${escapeHTML(
                                record.pumpName
                            )}
                        </strong>

                        <span class="sales-nozzle-name">
                            ${escapeHTML(
                                record.nozzleName
                            )}
                        </span>

                    </div>

                </td>


                <td>

                    <div class="sales-meter">

                        <span>
                            ${formatReading(
                                record.openingReading
                            )}
                        </span>

                        <span class="sales-meter-arrow">
                            →
                        </span>

                        <span>
                            ${formatReading(
                                record.closingReading
                            )}
                        </span>

                    </div>

                </td>


                <td>

                    <strong class="sales-volume">
                        ${formatLitresNumber(
                            record.litresSold
                        )}
                    </strong>

                    <span class="sales-volume-unit">
                        L
                    </span>

                </td>


                <td>

                    <span class="sales-money">
                        ${formatCurrency(
                            record.pricePerLitre
                        )}
                    </span>

                </td>


                <td>

                    <strong class="sales-money-primary">
                        ${formatCurrency(
                            record.expectedSales
                        )}
                    </strong>

                </td>


                <td>

                    ${getShiftStatusBadge(
                        record.shiftStatus
                    )}

                </td>

            `;


            tableBody.appendChild(row);

        });


        renderPagination();

    }


    updateSalesStats(
        filteredRecords
    );


    updateSalesRecordBadge(
        filteredRecords.length
    );

}


/* =========================================================
   STATUS BADGE
========================================================= */

function getShiftStatusBadge(status) {

    const normalizedStatus =
        (
            status ||
            ""
        )
            .toLowerCase();


    const isOpen =
        normalizedStatus === "open" ||
        normalizedStatus === "active";


    return `

        <span
            class="sales-status ${
                isOpen
                    ? "sales-status-active"
                    : "sales-status-closed"
            }"
        >

            <span class="sales-status-dot"></span>

            ${
                isOpen
                    ? "Active"
                    : "Closed"
            }

        </span>

    `;

}


/* =========================================================
   RECORD BADGE
========================================================= */

function updateSalesRecordBadge(count) {

    const badge =
        document.getElementById(
            "salesRecordBadge"
        );

    if (!badge) {
        return;
    }

    badge.textContent =
        `${count} ${
            count === 1
                ? "Record"
                : "Records"
        }`;

}


/* =========================================================
   PAGINATION
========================================================= */

function renderPagination() {

    const pagination =
        document.getElementById(
            "salesPagination"
        );

    const pagesContainer =
        document.getElementById(
            "paginationPages"
        );

    const info =
        document.getElementById(
            "paginationInfo"
        );

    const previousButton =
        document.getElementById(
            "previousPageButton"
        );

    const nextButton =
        document.getElementById(
            "nextPageButton"
        );


    if (
        !pagination ||
        !pagesContainer
    ) {
        return;
    }


    const totalRecords =
        SalesState.filteredRecords.length;

    const totalPages =
        Math.ceil(
            totalRecords /
            SalesState.rowsPerPage
        );


    if (totalPages <= 1) {

        pagination.classList.add(
            "hidden"
        );

        return;

    }


    pagination.classList.remove(
        "hidden"
    );


    const startRecord =
        (
            (
                SalesState.currentPage - 1
            ) *
            SalesState.rowsPerPage
        ) + 1;


    const endRecord =
        Math.min(
            SalesState.currentPage *
            SalesState.rowsPerPage,
            totalRecords
        );


    if (info) {

        info.textContent =
            `Showing ${startRecord}-${endRecord} of ${totalRecords} records`;

    }


    if (previousButton) {

        previousButton.disabled =
            SalesState.currentPage === 1;

    }


    if (nextButton) {

        nextButton.disabled =
            SalesState.currentPage ===
            totalPages;

    }


    pagesContainer.innerHTML = "";


    for (
        let page = 1;
        page <= totalPages;
        page++
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.type = "button";

        button.className =
            "sales-page-btn";


        if (
            page ===
            SalesState.currentPage
        ) {

            button.classList.add(
                "active"
            );

        }


        button.textContent =
            page;


        button.addEventListener(
            "click",
            () => {

                SalesState.currentPage =
                    page;

                renderSales();

            }
        );


        pagesContainer.appendChild(
            button
        );

    }

}


/* =========================================================
   UPDATE STATS
========================================================= */

function updateSalesStats(records) {

    const totalSales =
        records.reduce(
            (
                total,
                record
            ) =>
                total +
                (
                    Number(
                        record.expectedSales
                    ) || 0
                ),
            0
        );


    const totalLitres =
        records.reduce(
            (
                total,
                record
            ) =>
                total +
                (
                    Number(
                        record.litresSold
                    ) || 0
                ),
            0
        );


    const weightedAveragePrice =
        totalLitres > 0
            ? totalSales / totalLitres
            : 0;


    const averageVolume =
        records.length > 0
            ? totalLitres / records.length
            : 0;


    const activeShifts =
        getVisibleShifts()
            .filter(
                shift =>
                    [
                        "open",
                        "active"
                    ].includes(
                        (
                            shift.status ||
                            ""
                        )
                            .toLowerCase()
                    )
            )
            .length;


    const activeStationIds =
        new Set(
            getVisibleShifts()
                .filter(
                    shift =>
                        [
                            "open",
                            "active"
                        ].includes(
                            (
                                shift.status ||
                                ""
                            )
                                .toLowerCase()
                        )
                )
                .map(
                    shift =>
                        shift.stationId
                )
        );


    const totalSalesElement =
        document.getElementById(
            "totalSalesAmount"
        );

    const totalLitresElement =
        document.getElementById(
            "totalLitresSold"
        );

    const activeShiftElement =
        document.getElementById(
            "activeShiftCount"
        );

    const recordCountElement =
        document.getElementById(
            "salesRecordCount"
        );

    const averagePriceElement =
        document.getElementById(
            "averagePricePerLitre"
        );

    const averageVolumeElement =
        document.getElementById(
            "averageVolumePerRecord"
        );

    const activeStationElement =
        document.getElementById(
            "activeStationCount"
        );


    if (totalSalesElement) {

        totalSalesElement.textContent =
            formatCurrency(
                totalSales
            );

    }


    if (totalLitresElement) {

        totalLitresElement.textContent =
            formatLitres(
                totalLitres
            );

    }


    if (activeShiftElement) {

        activeShiftElement.textContent =
            activeShifts;

    }


    if (recordCountElement) {

        recordCountElement.textContent =
            records.length;

    }


    if (averagePriceElement) {

        averagePriceElement.textContent =
            formatCurrency(
                weightedAveragePrice
            );

    }


    if (averageVolumeElement) {

        averageVolumeElement.textContent =
            formatLitres(
                averageVolume
            );

    }


    if (activeStationElement) {

        activeStationElement.textContent =
            activeStationIds.size;

    }

}


/* =========================================================
   LAST UPDATED
========================================================= */

function updateLastUpdated() {

    const element =
        document.getElementById(
            "salesLastUpdated"
        );

    if (!element) {
        return;
    }

    const now =
        new Date();

    element.textContent =
        now.toLocaleTimeString(
            "en-NG",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

}


/* =========================================================
   EXPORT SALES
========================================================= */

function setupExportButton() {

    const button =
        document.getElementById(
            "exportSalesButton"
        );

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        exportSalesToCSV
    );

}


function exportSalesToCSV() {

    const records =
        SalesState.filteredRecords;

    if (!records.length) {

        alert(
            "There are no sales records to export."
        );

        return;

    }


    const headers = [

        "Station",
        "Shift",
        "Pump",
        "Nozzle",
        "Opening Reading",
        "Closing Reading",
        "Litres Sold",
        "Price Per Litre",
        "Expected Sales",
        "Status"

    ];


    const rows =
        records.map(record => [

            record.stationName,
            record.shiftName,
            record.pumpName,
            record.nozzleName,
            record.openingReading,
            record.closingReading,
            record.litresSold,
            record.pricePerLitre,
            record.expectedSales,
            record.shiftStatus

        ]);


    const csvContent =
        [
            headers,
            ...rows
        ]
            .map(row =>
                row
                    .map(value =>
                        `"${String(value)
                            .replace(
                                /"/g,
                                '""'
                            )}"`
                    )
                    .join(",")
            )
            .join("\n");


    const blob =
        new Blob(
            [csvContent],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        `fuelgap-sales-${
            new Date()
                .toISOString()
                .split("T")[0]
        }.csv`;


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    URL.revokeObjectURL(
        url
    );

}


/* =========================================================
   HELPERS
========================================================= */

function getStationInitials(name) {

    const value =
        String(
            name || "Station"
        )
            .trim();

    const words =
        value.split(/\s+/);

    if (words.length === 1) {

        return value
            .substring(0, 2)
            .toUpperCase();

    }

    return (
        words[0][0] +
        words[1][0]
    )
        .toUpperCase();

}


function escapeHTML(value) {

    const text =
        String(
            value ?? ""
        );

    const div =
        document.createElement("div");

    div.textContent =
        text;

    return div.innerHTML;

}


/* =========================================================
   FORMATTERS
========================================================= */

function formatCurrency(amount) {

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


function formatLitres(litres) {

    const value =
        Number(litres) || 0;


    return `${value.toLocaleString(
        "en-NG",
        {

            minimumFractionDigits:
                2,

            maximumFractionDigits:
                2

        }
    )} L`;

}


function formatLitresNumber(litres) {

    const value =
        Number(litres) || 0;


    return value.toLocaleString(
        "en-NG",
        {

            minimumFractionDigits:
                2,

            maximumFractionDigits:
                2

        }
    );

}


function formatReading(reading) {

    const value =
        Number(reading) || 0;


    return value.toLocaleString(
        "en-NG",
        {

            minimumFractionDigits:
                2,

            maximumFractionDigits:
                2

        }
    );

}