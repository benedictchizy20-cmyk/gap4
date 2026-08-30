/* ==========================================
   FUELGAP - SALES MANAGEMENT
========================================== */


/* ==========================================
   STORAGE KEYS
========================================== */

const SALES_READINGS_STORAGE_KEY =
    "fuelgap_meter_readings";


const SALES_STATIONS_STORAGE_KEY =
    "fuelgap_stations";


const SALES_PUMPS_STORAGE_KEY =
    "fuelgap_pumps";


const SALES_NOZZLES_STORAGE_KEY =
    "fuelgap_nozzles";


const SALES_SHIFTS_STORAGE_KEY =
    "fuelgap_shifts";


const SALES_STAFF_STORAGE_KEY =
    "fuelgap_staff";


/* ==========================================
   PAGE LOAD
========================================== */

document.addEventListener("DOMContentLoaded", () => {

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
            "sales"
        )
    ) {

        window.location.href =
            "./dashboard.html";

        return;

    }


    setTimeout(() => {

        renderSalesPage();

        setupSalesEvents();

        renderSales();

    }, 0);

});


/* ==========================================
   SAFE STORAGE HELPER
========================================== */

function getStorageData(
    storageKey
) {

    try {

        return JSON.parse(
            localStorage.getItem(
                storageKey
            )
        ) || [];

    } catch (error) {

        console.error(
            `Unable to load ${storageKey}:`,
            error
        );

        return [];

    }

}


/* ==========================================
   LOAD DATA
========================================== */

function getMeterReadings() {

    return getStorageData(
        SALES_READINGS_STORAGE_KEY
    );

}


function getStations() {

    return getStorageData(
        SALES_STATIONS_STORAGE_KEY
    );

}


function getPumps() {

    return getStorageData(
        SALES_PUMPS_STORAGE_KEY
    );

}


function getNozzles() {

    return getStorageData(
        SALES_NOZZLES_STORAGE_KEY
    );

}


function getShifts() {

    return getStorageData(
        SALES_SHIFTS_STORAGE_KEY
    );

}


function getStaff() {

    return getStorageData(
        SALES_STAFF_STORAGE_KEY
    );

}


/* ==========================================
   USER STATION ACCESS
========================================== */

function getVisibleStations() {

    const currentUser =
        FuelGapUtils.getCurrentUser();


    const stations =
        getStations();


    if (!currentUser) {

        return [];

    }


    /*
       ADMIN CAN SEE EVERYTHING
    */

    if (
        currentUser.role ===
        "admin"
    ) {

        return stations;

    }


    /*
       OWNER CAN SEE ORGANIZATION STATIONS
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
       MANAGER CAN SEE ASSIGNED STATION
       OR ORGANIZATION STATIONS
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
   GET VISIBLE STATION IDs
========================================== */

function getVisibleStationIds() {

    return getVisibleStations()
        .map(
            station =>
                station.id
        );

}


/* ==========================================
   GET VISIBLE SHIFTS
========================================== */

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


/* ==========================================
   RENDER SALES PAGE
========================================== */

function renderSalesPage() {

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
                    SALES MANAGEMENT
                </p>


                <h1>
                    Sales
                </h1>


                <p>
                    Automatically calculated
                    from meter readings.
                </p>

            </div>


            <button
                type="button"
                class="btn btn-primary"
                id="refreshSalesButton"
            >
                ↻ Refresh Sales
            </button>

        </div>



        <!-- =====================================
             SALES STATISTICS
        ====================================== -->

        <section class="pump-stats">


            <div class="pump-stat-card">

                <span>
                    Total Sales
                </span>

                <strong
                    id="totalSalesAmount"
                >
                    ₦0.00
                </strong>

            </div>



            <div class="pump-stat-card">

                <span>
                    Total Litres Sold
                </span>

                <strong
                    id="totalLitresSold"
                >
                    0 L
                </strong>

            </div>



            <div class="pump-stat-card">

                <span>
                    Active Shifts
                </span>

                <strong
                    id="activeShiftCount"
                >
                    0
                </strong>

            </div>



            <div class="pump-stat-card">

                <span>
                    Sales Records
                </span>

                <strong
                    id="salesRecordCount"
                >
                    0
                </strong>

            </div>


        </section>



        <!-- =====================================
             FILTERS
        ====================================== -->

        <section class="pump-section">

            <div class="section-header">

                <div>

                    <h2>
                        Sales Records
                    </h2>


                    <p>
                        Sales generated from
                        opening and closing
                        meter readings.
                    </p>

                </div>

            </div>



            <div class="sales-filters">


                <select
                    id="salesStationFilter"
                >

                    <option value="">
                        All Stations
                    </option>

                </select>



                <select
                    id="salesShiftFilter"
                >

                    <option value="">
                        All Shifts
                    </option>

                </select>



                <select
                    id="salesNozzleFilter"
                >

                    <option value="">
                        All Nozzles
                    </option>

                </select>



                <input
                    type="search"
                    id="salesSearch"
                    placeholder="Search station, pump or nozzle..."
                >


            </div>



            <!-- =====================================
                 SALES TABLE
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
                                Pump
                            </th>

                            <th>
                                Nozzle
                            </th>

                            <th>
                                Opening
                            </th>

                            <th>
                                Closing
                            </th>

                            <th>
                                Litres Sold
                            </th>

                            <th>
                                Price/Litre
                            </th>

                            <th>
                                Expected Sales
                            </th>

                        </tr>

                    </thead>



                    <tbody
                        id="salesTableBody"
                    ></tbody>


                </table>


            </div>



            <!-- =====================================
                 EMPTY STATE
            ====================================== -->

            <div
                id="emptySalesState"
                class="empty-state hidden"
            >

                <h3>
                    No completed sales records yet
                </h3>


                <p>
                    Sales will appear automatically
                    when valid meter readings are
                    available for a nozzle.
                </p>

            </div>


        </section>


    `;

}


/* ==========================================
   SETUP EVENTS
========================================== */

function setupSalesEvents() {

    setupRefreshButton();

    loadSalesFilters();

    setupSalesFilters();

}


/* ==========================================
   REFRESH BUTTON
========================================== */

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

            renderSales();

        }
    );

}


/* ==========================================
   LOAD FILTER OPTIONS
========================================== */

function loadSalesFilters() {

    loadStationFilter();

    loadShiftFilter();

    loadNozzleFilter();

}


/* ==========================================
   STATION FILTER
========================================== */

function loadStationFilter() {

    const select =
        document.getElementById(
            "salesStationFilter"
        );


    if (!select) {

        return;

    }


    const stations =
        getVisibleStations();


    stations.forEach(
        station => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                station.id;


            option.textContent =
                station.name;


            select.appendChild(
                option
            );

        }
    );

}


/* ==========================================
   SHIFT FILTER
========================================== */

function loadShiftFilter() {

    const select =
        document.getElementById(
            "salesShiftFilter"
        );


    if (!select) {

        return;

    }


    const shifts =
        getVisibleShifts();


    shifts.forEach(
        shift => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                shift.id;


            option.textContent =
                shift.name;


            select.appendChild(
                option
            );

        }
    );

}


/* ==========================================
   NOZZLE FILTER
========================================== */

function loadNozzleFilter() {

    const select =
        document.getElementById(
            "salesNozzleFilter"
        );


    if (!select) {

        return;

    }


    const stationIds =
        getVisibleStationIds();


    const pumps =
        getPumps();


    const visiblePumpIds =
        pumps
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


    const nozzles =
        getNozzles()
            .filter(
                nozzle =>
                    visiblePumpIds.includes(
                        nozzle.pumpId
                    )
            );


    nozzles.forEach(
        nozzle => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                nozzle.id;


            option.textContent =
                nozzle.name ||
                nozzle.nozzleName ||
                nozzle.code ||
                "Unnamed Nozzle";


            select.appendChild(
                option
            );

        }
    );

}


/* ==========================================
   FILTER EVENTS
========================================== */

function setupSalesFilters() {

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


    if (stationFilter) {

        stationFilter.addEventListener(
            "change",
            () => {

                renderSales();

            }
        );

    }


    if (shiftFilter) {

        shiftFilter.addEventListener(
            "change",
            () => {

                renderSales();

            }
        );

    }


    if (nozzleFilter) {

        nozzleFilter.addEventListener(
            "change",
            () => {

                renderSales();

            }
        );

    }


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            () => {

                renderSales();

            }
        );

    }

}


/* ==========================================
   GET READING TYPE
========================================== */

function getReadingType(
    reading
) {

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


/* ==========================================
   GET READING VALUE
========================================== */

function getReadingValue(
    reading
) {

    const possibleValues = [

        reading.reading,

        reading.meterReading,

        reading.value,

        reading.meterValue,

        reading.currentReading

    ];


    for (
        const value
        of possibleValues
    ) {

        const number =
            Number(value);


        if (
            !Number.isNaN(
                number
            )
        ) {

            return number;

        }

    }


    return null;

}


/* ==========================================
   GET READING DATE
========================================== */

function getReadingDate(
    reading
) {

    const possibleDates = [

        reading.createdAt,

        reading.timestamp,

        reading.recordedAt,

        reading.date,

        reading.updatedAt

    ];


    for (
        const value
        of possibleDates
    ) {

        if (value) {

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

    }


    return null;

}


/* ==========================================
   GET NOZZLE PRICE
========================================== */

function getNozzlePrice(
    nozzle
) {

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


    for (
        const value
        of possiblePrices
    ) {

        const price =
            Number(value);


        if (
            !Number.isNaN(
                price
            ) &&

            price > 0
        ) {

            return price;

        }

    }


    return 0;

}


/* ==========================================
   GET NOZZLE NAME
========================================== */

function getNozzleName(
    nozzle
) {

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


/* ==========================================
   GET PUMP NAME
========================================== */

function getPumpName(
    pump
) {

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


/* ==========================================
   GET SHIFT READINGS
========================================== */

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


    /*
       IF READINGS ARE ALREADY
       CONNECTED TO A SHIFT
    */

    if (
        directShiftReadings.length > 0
    ) {

        return directShiftReadings;

    }


    /*
       FALLBACK:
       USE STATION AND TIME RANGE
    */

    const shiftOpenDate =
        getShiftOpenDate(
            shift
        );


    const shiftCloseDate =
        getShiftCloseDate(
            shift
        );


    return readings.filter(
        reading => {

            if (
                reading.stationId !==
                shift.stationId
            ) {

                return false;

            }


            const readingDate =
                getReadingDate(
                    reading
                );


            if (
                !readingDate
            ) {

                return false;

            }


            if (
                shiftOpenDate &&
                readingDate <
                shiftOpenDate
            ) {

                return false;

            }


            if (
                shiftCloseDate &&
                readingDate >
                shiftCloseDate
            ) {

                return false;

            }


            return true;

        }
    );

}


/* ==========================================
   SHIFT OPEN DATE
========================================== */

function getShiftOpenDate(
    shift
) {

    if (
        shift.openedAt
    ) {

        const date =
            new Date(
                shift.openedAt
            );


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


/* ==========================================
   SHIFT CLOSE DATE
========================================== */

function getShiftCloseDate(
    shift
) {

    if (
        shift.closedAt
    ) {

        const date =
            new Date(
                shift.closedAt
            );


        if (
            !Number.isNaN(
                date.getTime()
            )
        ) {

            return date;

        }

    }


    /*
       OPEN SHIFTS HAVE
       CURRENT TIME AS END
    */

    return new Date();

}


/* ==========================================
   BUILD SALES RECORDS
========================================== */

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


    const salesRecords =
        [];


    shifts.forEach(
        shift => {

            const shiftReadings =
                getReadingsForShift(
                    shift,
                    readings
                );


            /*
               GROUP READINGS BY NOZZLE
            */

            const nozzleGroups =
                {};


            shiftReadings.forEach(
                reading => {

                    const nozzleId =
                        reading.nozzleId;


                    if (
                        !nozzleId
                    ) {

                        return;

                    }


                    if (
                        !nozzleGroups[
                            nozzleId
                        ]
                    ) {

                        nozzleGroups[
                            nozzleId
                        ] =
                            [];

                    }


                    nozzleGroups[
                        nozzleId
                    ].push(
                        reading
                    );

                }
            );


            /*
               CALCULATE SALES
               FOR EACH NOZZLE
            */

            Object.keys(
                nozzleGroups
            ).forEach(
                nozzleId => {

                    const nozzle =
                        nozzles.find(
                            item =>
                                item.id ===
                                nozzleId
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
                        nozzleGroups[
                            nozzleId
                        ]
                            .map(
                                reading => {

                                    return {

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

                                    };

                                }
                            )
                            .filter(
                                reading =>
                                    reading._date &&
                                    reading._value !==
                                    null
                            )
                            .sort(
                                (a, b) =>
                                    a._date -
                                    b._date
                            );


                    if (
                        nozzleReadings.length <
                        2
                    ) {

                        return;

                    }


                    /*
                       LOOK FOR EXPLICIT
                       OPENING READING
                    */

                    let openingReading =
                        nozzleReadings.find(
                            reading =>
                                reading._type ===
                                    "opening" ||

                                reading._type ===
                                    "open" ||

                                reading._type ===
                                    "opening_reading"
                        );


                    /*
                       LOOK FOR EXPLICIT
                       CLOSING READING
                    */

                    let closingReading =
                        [
                            ...nozzleReadings
                        ]
                            .reverse()
                            .find(
                                reading =>
                                    reading._type ===
                                        "closing" ||

                                    reading._type ===
                                        "close" ||

                                    reading._type ===
                                        "closing_reading"
                            );


                    /*
                       FALLBACK TO
                       FIRST AND LAST
                       READING
                    */

                    if (
                        !openingReading
                    ) {

                        openingReading =
                            nozzleReadings[
                                0
                            ];

                    }


                    if (
                        !closingReading
                    ) {

                        closingReading =
                            nozzleReadings[
                                nozzleReadings.length -
                                1
                            ];

                    }


                    /*
                       INVALID READING
                    */

                    if (
                        closingReading
                            ._value <

                        openingReading
                            ._value
                    ) {

                        return;

                    }


                    const litresSold =
                        closingReading
                            ._value -

                        openingReading
                            ._value;


                    /*
                       DO NOT CREATE
                       ZERO SALES
                    */

                    if (
                        litresSold <=
                        0
                    ) {

                        return;

                    }


                    const pricePerLitre =
                        getNozzlePrice(
                            nozzle
                        );


                    const expectedSales =
                        litresSold *
                        pricePerLitre;


                    salesRecords.push({

                        id:
                            `${shift.id}-${nozzleId}`,

                        shiftId:
                            shift.id,

                        shiftName:
                            shift.name,

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
                            getPumpName(
                                pump
                            ),

                        nozzleId,

                        nozzleName:
                            getNozzleName(
                                nozzle
                            ),

                        openingReading:
                            openingReading
                                ._value,

                        closingReading:
                            closingReading
                                ._value,

                        litresSold,

                        pricePerLitre,

                        expectedSales,

                        shiftStatus:
                            shift.status,

                        openedAt:
                            shift.openedAt,

                        closedAt:
                            shift.closedAt

                    });

                }
            );

        }
    );


    return salesRecords;

}


/* ==========================================
   GET CURRENT FILTERS
========================================== */

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


/* ==========================================
   FILTER SALES RECORDS
========================================== */

function filterSalesRecords(
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
                filters.nozzleId &&

                record.nozzleId !==
                filters.nozzleId
            ) {

                return false;

            }


            if (
                filters.search
            ) {

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

        }
    );

}


/* ==========================================
   RENDER SALES
========================================== */

function renderSales() {

    const records =
        buildSalesRecords();


    const filters =
        getSalesFilters();


    const filteredRecords =
        filterSalesRecords(
            records,
            filters
        );


    const tableBody =
        document.getElementById(
            "salesTableBody"
        );


    const emptyState =
        document.getElementById(
            "emptySalesState"
        );


    if (!tableBody) {

        return;

    }


    tableBody.innerHTML =
        "";


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


        filteredRecords.forEach(
            record => {

                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>
                        ${record.stationName}
                    </td>


                    <td>
                        <strong>
                            ${record.shiftName}
                        </strong>
                    </td>


                    <td>
                        ${record.pumpName}
                    </td>


                    <td>
                        ${record.nozzleName}
                    </td>


                    <td>
                        ${formatReading(
                            record.openingReading
                        )}
                    </td>


                    <td>
                        ${formatReading(
                            record.closingReading
                        )}
                    </td>


                    <td>
                        <strong>
                            ${formatLitres(
                                record.litresSold
                            )}
                        </strong>
                    </td>


                    <td>
                        ${formatCurrency(
                            record.pricePerLitre
                        )}
                    </td>


                    <td>
                        <strong>
                            ${formatCurrency(
                                record.expectedSales
                            )}
                        </strong>
                    </td>

                `;


                tableBody.appendChild(
                    row
                );

            }
        );

    }


    updateSalesStats(
        filteredRecords,
        records
    );

}


/* ==========================================
   UPDATE SALES STATS
========================================== */

function updateSalesStats(
    filteredRecords,
    allRecords
) {

    const totalSales =
        filteredRecords.reduce(
            (
                total,
                record
            ) => {

                return (
                    total +
                    record.expectedSales
                );

            },
            0
        );


    const totalLitres =
        filteredRecords.reduce(
            (
                total,
                record
            ) => {

                return (
                    total +
                    record.litresSold
                );

            },
            0
        );


    const activeShifts =
        getVisibleShifts()
            .filter(
                shift =>
                    shift.status ===
                    "open"
            )
            .length;


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


    if (
        totalSalesElement
    ) {

        totalSalesElement.textContent =
            formatCurrency(
                totalSales
            );

    }


    if (
        totalLitresElement
    ) {

        totalLitresElement.textContent =
            formatLitres(
                totalLitres
            );

    }


    if (
        activeShiftElement
    ) {

        activeShiftElement.textContent =
            activeShifts;

    }


    if (
        recordCountElement
    ) {

        recordCountElement.textContent =
            filteredRecords.length;

    }

}


/* ==========================================
   FORMAT CURRENCY
========================================== */

function formatCurrency(
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
   FORMAT LITRES
========================================== */

function formatLitres(
    litres
) {

    const value =
        Number(litres) ||
        0;


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


/* ==========================================
   FORMAT METER READING
========================================== */

function formatReading(
    reading
) {

    const value =
        Number(reading) ||
        0;


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