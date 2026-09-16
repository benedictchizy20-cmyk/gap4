/* =========================================================
   FUELGAP - SALES MANAGEMENT
   REAL BACKEND VERSION
   EXPRESS + SUPABASE
   HTTPONLY COOKIE SESSION
   NO LOCALSTORAGE AUTHENTICATION

   FEATURES
   ---------------------------------------------------------
   - View sales
   - Record new sale
   - Save sale to backend
   - Station dropdown from backend
   - Shift dropdown from backend
   - Pump dropdown from backend
   - Nozzle dropdown from backend
   - Automatic price per litre
   - Automatic amount calculation
   - Payment method
   - Search
   - Filters
   - Sorting
   - Pagination
   - CSV export
========================================================= */


/* =========================================================
   SALES STATE
========================================================= */

const SalesState = {

    currentUser: null,

    records: [],
    filteredRecords: [],

    stations: [],
    shifts: [],
    pumps: [],
    nozzles: [],

    currentSort: {
        key: "createdAt",
        direction: "desc"
    },

    currentPage: 1,
    rowsPerPage: 10,

    isLoading: false,
    isSubmitting: false

};


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            if (
                typeof FuelGapAPI ===
                "undefined"
            ) {

                throw new Error(
                    "FuelGapAPI is not available. Make sure api.js loads before sales.js."
                );

            }


            const authResponse =
                await FuelGapAPI.getCurrentUser();


            console.log(
                "Sales authentication response:",
                authResponse
            );


            const currentUser =
                authResponse?.data?.user ||
                authResponse?.user ||
                authResponse?.data ||
                null;


            if (!currentUser) {

                window.location.href =
                    "/login.html";

                return;

            }


            SalesState.currentUser =
                currentUser;


            renderSalesPage();

            setupSalesEvents();

            await refreshSalesData();


        } catch (error) {

            console.error(
                "Sales page initialization error:",
                error
            );


            showSalesError(
                error?.message ||
                "Unable to load sales page."
            );

        }

    }
);


/* =========================================================
   CHECK API
========================================================= */

function ensureFuelGapAPI() {

    if (
        typeof FuelGapAPI ===
        "undefined"
    ) {

        throw new Error(
            "FuelGapAPI is not available."
        );

    }


    const requiredMethods = [

        "getSales",
        "getStations",
        "getShifts",
        "getPumps",
        "getNozzles",
        "createSale"

    ];


    const missingMethods =
        requiredMethods.filter(
            method =>
                typeof FuelGapAPI[method] !==
                "function"
        );


    if (
        missingMethods.length
    ) {

        throw new Error(
            `Missing Sales API methods: ${missingMethods.join(", ")}`
        );

    }

}


/* =========================================================
   RENDER PAGE
========================================================= */

function renderSalesPage() {

    const pageContent =
        document.getElementById(
            "pageContent"
        );


    if (!pageContent) {

        console.error(
            "pageContent element was not found."
        );

        return;

    }


    pageContent.innerHTML = `

        <section class="sales-page">


            <!-- ==========================================
                 PAGE HEADER
            =========================================== -->

            <div class="page-header">

                <div>

                    <div class="page-title-row">

                        <div class="page-title-icon">

                            <i class="fas fa-cash-register"></i>

                        </div>


                        <div>

                            <h1>
                                Sales
                            </h1>

                            <p>
                                Record and monitor fuel sales across your stations.
                            </p>

                        </div>

                    </div>

                </div>


                <div class="page-header-actions">


                    <button
                        type="button"
                        class="btn btn-secondary"
                        id="refreshSalesBtn"
                    >

                        <i class="fas fa-sync-alt"></i>

                        Refresh

                    </button>


                    <button
                        type="button"
                        class="btn btn-primary"
                        id="recordSaleBtn"
                    >

                        <i class="fas fa-plus"></i>

                        Record Sale

                    </button>


                    <button
                        type="button"
                        class="btn btn-primary"
                        id="exportSalesBtn"
                    >

                        <i class="fas fa-download"></i>

                        Export CSV

                    </button>

                </div>

            </div>


            <!-- ==========================================
                 ERROR
            =========================================== -->

            <div
                id="salesError"
                class="sales-error"
                style="display:none;"
            ></div>


            <!-- ==========================================
                 STATISTICS
            =========================================== -->

            <div class="stats-grid">


                <div class="stat-card">

                    <div class="stat-icon">

                        <i class="fas fa-money-bill-wave"></i>

                    </div>


                    <div class="stat-content">

                        <span class="stat-label">
                            Total Revenue
                        </span>


                        <strong
                            id="salesTotalRevenue"
                            class="stat-value"
                        >
                            ₦0.00
                        </strong>

                    </div>

                </div>



                <div class="stat-card">

                    <div class="stat-icon">

                        <i class="fas fa-gas-pump"></i>

                    </div>


                    <div class="stat-content">

                        <span class="stat-label">
                            Litres Sold
                        </span>


                        <strong
                            id="salesTotalLitres"
                            class="stat-value"
                        >
                            0.00 L
                        </strong>

                    </div>

                </div>



                <div class="stat-card">

                    <div class="stat-icon">

                        <i class="fas fa-receipt"></i>

                    </div>


                    <div class="stat-content">

                        <span class="stat-label">
                            Sales Records
                        </span>


                        <strong
                            id="salesRecordCount"
                            class="stat-value"
                        >
                            0
                        </strong>

                    </div>

                </div>



                <div class="stat-card">

                    <div class="stat-icon">

                        <i class="fas fa-chart-line"></i>

                    </div>


                    <div class="stat-content">

                        <span class="stat-label">
                            Average Sale
                        </span>


                        <strong
                            id="salesAverageSale"
                            class="stat-value"
                        >
                            ₦0.00
                        </strong>

                    </div>

                </div>

            </div>



            <!-- ==========================================
                 FILTERS
            =========================================== -->

            <div class="card sales-filters-card">

                <div class="card-header">

                    <div>

                        <h2>
                            Sales Records
                        </h2>

                        <p>
                            Review sales recorded from your stations.
                        </p>

                    </div>

                </div>


                <div class="filters-grid">


                    <div class="form-group">

                        <label for="salesSearch">
                            Search
                        </label>


                        <div class="input-with-icon">

                            <i class="fas fa-search"></i>


                            <input
                                type="text"
                                id="salesSearch"
                                class="form-control"
                                placeholder="Search station, pump, nozzle..."
                            >

                        </div>

                    </div>



                    <div class="form-group">

                        <label for="salesStationFilter">
                            Station
                        </label>


                        <select
                            id="salesStationFilter"
                            class="form-control"
                        >

                            <option value="">
                                All Stations
                            </option>

                        </select>

                    </div>



                    <div class="form-group">

                        <label for="salesShiftFilter">
                            Shift
                        </label>


                        <select
                            id="salesShiftFilter"
                            class="form-control"
                        >

                            <option value="">
                                All Shifts
                            </option>

                        </select>

                    </div>



                    <div class="form-group">

                        <label for="salesNozzleFilter">
                            Nozzle
                        </label>


                        <select
                            id="salesNozzleFilter"
                            class="form-control"
                        >

                            <option value="">
                                All Nozzles
                            </option>

                        </select>

                    </div>



                    <div class="form-group">

                        <label for="salesPaymentFilter">
                            Payment
                        </label>


                        <select
                            id="salesPaymentFilter"
                            class="form-control"
                        >

                            <option value="">
                                All Payments
                            </option>

                            <option value="cash">
                                Cash
                            </option>

                            <option value="pos">
                                POS
                            </option>

                            <option value="transfer">
                                Transfer
                            </option>

                            <option value="bank_transfer">
                                Bank Transfer
                            </option>

                            <option value="card">
                                Card
                            </option>

                            <option value="other">
                                Other
                            </option>

                        </select>

                    </div>



                    <div class="form-group">

                        <label for="salesDateFilter">
                            Date
                        </label>


                        <input
                            type="date"
                            id="salesDateFilter"
                            class="form-control"
                        >

                    </div>

                </div>

            </div>



            <!-- ==========================================
                 SALES TABLE
            =========================================== -->

            <div class="card">

                <div class="table-responsive">

                    <table class="data-table sales-table">

                        <thead>

                            <tr>

                                <th>Sale ID</th>

                                <th>Station</th>

                                <th>Pump</th>

                                <th>Nozzle</th>

                                <th>Shift</th>

                                <th>Litres</th>

                                <th>Price/Litre</th>

                                <th>Amount</th>

                                <th>Payment</th>

                                <th>Recorded By</th>

                                <th>Date</th>

                            </tr>

                        </thead>


                        <tbody id="salesTableBody">

                            <tr>

                                <td
                                    colspan="11"
                                    class="table-loading"
                                >

                                    <i class="fas fa-spinner fa-spin"></i>

                                    Loading sales...

                                </td>

                            </tr>

                        </tbody>

                    </table>

                </div>


                <div
                    id="salesPagination"
                    class="pagination-container"
                ></div>

            </div>


        </section>


        <!-- =================================================
             RECORD SALE MODAL
        ================================================== -->

        <div
            id="recordSaleModal"
            class="sales-modal"
            style="display:none;"
        >

            <div class="sales-modal-overlay"></div>


            <div
                class="sales-modal-dialog"
                role="dialog"
                aria-modal="true"
            >


                <div class="sales-modal-header">

                    <div>

                        <div class="sales-modal-title">

                            <div class="sales-modal-icon">

                                <i class="fas fa-cash-register"></i>

                            </div>


                            <div>

                                <h2>
                                    Record Sale
                                </h2>

                                <p>
                                    Enter the fuel sale details below.
                                </p>

                            </div>

                        </div>

                    </div>


                    <button
                        type="button"
                        class="sales-modal-close"
                        id="closeRecordSaleBtn"
                    >

                        <i class="fas fa-times"></i>

                    </button>

                </div>



                <form
                    id="recordSaleForm"
                    class="sales-form"
                >


                    <!-- ==================================
                         STATION
                    =================================== -->

                    <div class="form-group">

                        <label for="saleStation">

                            Station

                            <span class="required">
                                *
                            </span>

                        </label>


                        <select
                            id="saleStation"
                            class="form-control"
                            required
                        >

                            <option value="">
                                Select station
                            </option>

                        </select>


                        <small class="form-help">
                            Select the station where the sale occurred.
                        </small>

                    </div>



                    <!-- ==================================
                         SHIFT
                    =================================== -->

                    <div class="form-group">

                        <label for="saleShift">

                            Shift

                            <span class="required">
                                *
                            </span>

                        </label>


                        <select
                            id="saleShift"
                            class="form-control"
                            required
                        >

                            <option value="">
                                Select shift
                            </option>

                        </select>

                    </div>



                    <!-- ==================================
                         PUMP
                    =================================== -->

                    <div class="form-group">

                        <label for="salePump">

                            Pump

                            <span class="required">
                                *
                            </span>

                        </label>


                        <select
                            id="salePump"
                            class="form-control"
                            required
                        >

                            <option value="">
                                Select pump
                            </option>

                        </select>

                    </div>



                    <!-- ==================================
                         NOZZLE
                    =================================== -->

                    <div class="form-group">

                        <label for="saleNozzle">

                            Nozzle

                            <span class="required">
                                *
                            </span>

                        </label>


                        <select
                            id="saleNozzle"
                            class="form-control"
                            required
                        >

                            <option value="">
                                Select nozzle
                            </option>

                        </select>

                    </div>



                    <!-- ==================================
                         LITRES
                    =================================== -->

                    <div class="form-group">

                        <label for="saleLitres">

                            Litres Sold

                            <span class="required">
                                *
                            </span>

                        </label>


                        <input
                            type="number"
                            id="saleLitres"
                            class="form-control"
                            min="0.01"
                            step="0.01"
                            placeholder="e.g. 20.50"
                            required
                        >

                    </div>



                    <!-- ==================================
                         PRICE
                    =================================== -->

                    <div class="form-group">

                        <label for="salePricePerLitre">

                            Price Per Litre

                            <span class="required">
                                *
                            </span>

                        </label>


                        <div class="currency-input">

                            <span>
                                ₦
                            </span>


                            <input
                                type="number"
                                id="salePricePerLitre"
                                class="form-control"
                                min="0"
                                step="0.01"
                                placeholder="e.g. 950"
                                required
                            >

                        </div>


                        <small class="form-help">
                            Automatically loaded from the selected nozzle when available.
                        </small>

                    </div>



                    <!-- ==================================
                         AMOUNT
                    =================================== -->

                    <div class="form-group">

                        <label for="saleAmount">

                            Total Amount

                        </label>


                        <div class="currency-input">

                            <span>
                                ₦
                            </span>


                            <input
                                type="number"
                                id="saleAmount"
                                class="form-control"
                                readonly
                                placeholder="0.00"
                            >

                        </div>


                        <small class="form-help">
                            Automatically calculated from litres × price per litre.
                        </small>

                    </div>



                    <!-- ==================================
                         PAYMENT
                    =================================== -->

                    <div class="form-group">

                        <label for="salePaymentMethod">

                            Payment Method

                            <span class="required">
                                *
                            </span>

                        </label>


                        <select
                            id="salePaymentMethod"
                            class="form-control"
                            required
                        >

                            <option value="">
                                Select payment method
                            </option>

                            <option value="cash">
                                Cash
                            </option>

                            <option value="pos">
                                POS
                            </option>

                            <option value="transfer">
                                Transfer
                            </option>

                            <option value="bank_transfer">
                                Bank Transfer
                            </option>

                            <option value="card">
                                Card
                            </option>

                            <option value="other">
                                Other
                            </option>

                        </select>

                    </div>



                    <!-- ==================================
                         FORM ERROR
                    =================================== -->

                    <div
                        id="recordSaleError"
                        class="form-error"
                        style="display:none;"
                    ></div>



                    <!-- ==================================
                         FORM ACTIONS
                    =================================== -->

                    <div class="sales-modal-actions">

                        <button
                            type="button"
                            class="btn btn-secondary"
                            id="cancelRecordSaleBtn"
                        >

                            Cancel

                        </button>


                        <button
                            type="submit"
                            class="btn btn-primary"
                            id="saveSaleBtn"
                        >

                            <i class="fas fa-save"></i>

                            Save Sale

                        </button>

                    </div>


                </form>

            </div>

        </div>

    `;

}


/* =========================================================
   SETUP EVENTS
========================================================= */

function setupSalesEvents() {


    /* =====================================================
       RECORD SALE BUTTON
    ===================================================== */

    const recordSaleBtn =
        document.getElementById(
            "recordSaleBtn"
        );


    if (recordSaleBtn) {

        recordSaleBtn.addEventListener(
            "click",
            openRecordSaleModal
        );

    }


    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    const closeBtn =
        document.getElementById(
            "closeRecordSaleBtn"
        );


    if (closeBtn) {

        closeBtn.addEventListener(
            "click",
            closeRecordSaleModal
        );

    }


    const cancelBtn =
        document.getElementById(
            "cancelRecordSaleBtn"
        );


    if (cancelBtn) {

        cancelBtn.addEventListener(
            "click",
            closeRecordSaleModal
        );

    }


    const overlay =
        document.querySelector(
            ".sales-modal-overlay"
        );


    if (overlay) {

        overlay.addEventListener(
            "click",
            closeRecordSaleModal
        );

    }


    /* =====================================================
       RECORD SALE FORM
    ===================================================== */

    const form =
        document.getElementById(
            "recordSaleForm"
        );


    if (form) {

        form.addEventListener(
            "submit",
            handleRecordSaleSubmit
        );

    }


    /* =====================================================
       SALE STATION
    ===================================================== */

    const saleStation =
        document.getElementById(
            "saleStation"
        );


    if (saleStation) {

        saleStation.addEventListener(
            "change",
            () => {

                loadSaleShiftOptions();

                loadSalePumpOptions();

                clearSaleNozzleOptions();

                calculateSaleAmount();

            }
        );

    }


    /* =====================================================
       SALE PUMP
    ===================================================== */

    const salePump =
        document.getElementById(
            "salePump"
        );


    if (salePump) {

        salePump.addEventListener(
            "change",
            () => {

                loadSaleNozzleOptions();

            }
        );

    }


    /* =====================================================
       SALE NOZZLE
    ===================================================== */

    const saleNozzle =
        document.getElementById(
            "saleNozzle"
        );


    if (saleNozzle) {

        saleNozzle.addEventListener(
            "change",
            () => {

                loadPriceFromNozzle();

                calculateSaleAmount();

            }
        );

    }


    /* =====================================================
       LITRES
    ===================================================== */

    const litresInput =
        document.getElementById(
            "saleLitres"
        );


    if (litresInput) {

        litresInput.addEventListener(
            "input",
            calculateSaleAmount
        );

    }


    /* =====================================================
       PRICE
    ===================================================== */

    const priceInput =
        document.getElementById(
            "salePricePerLitre"
        );


    if (priceInput) {

        priceInput.addEventListener(
            "input",
            calculateSaleAmount
        );

    }


    /* =====================================================
       REFRESH
    ===================================================== */

    const refreshBtn =
        document.getElementById(
            "refreshSalesBtn"
        );


    if (refreshBtn) {

        refreshBtn.addEventListener(
            "click",
            refreshSalesData
        );

    }


    /* =====================================================
       EXPORT
    ===================================================== */

    const exportBtn =
        document.getElementById(
            "exportSalesBtn"
        );


    if (exportBtn) {

        exportBtn.addEventListener(
            "click",
            exportSalesCSV
        );

    }


    /* =====================================================
       SEARCH
    ===================================================== */

    const searchInput =
        document.getElementById(
            "salesSearch"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            () => {

                SalesState.currentPage =
                    1;

                applySalesFilters();

            }
        );

    }


    /* =====================================================
       STATION FILTER
    ===================================================== */

    const stationFilter =
        document.getElementById(
            "salesStationFilter"
        );


    if (stationFilter) {

        stationFilter.addEventListener(
            "change",
            () => {

                loadShiftFilter();

                loadNozzleFilter();

                SalesState.currentPage =
                    1;

                applySalesFilters();

            }
        );

    }


    /* =====================================================
       SHIFT FILTER
    ===================================================== */

    const shiftFilter =
        document.getElementById(
            "salesShiftFilter"
        );


    if (shiftFilter) {

        shiftFilter.addEventListener(
            "change",
            () => {

                SalesState.currentPage =
                    1;

                applySalesFilters();

            }
        );

    }


    /* =====================================================
       NOZZLE FILTER
    ===================================================== */

    const nozzleFilter =
        document.getElementById(
            "salesNozzleFilter"
        );


    if (nozzleFilter) {

        nozzleFilter.addEventListener(
            "change",
            () => {

                SalesState.currentPage =
                    1;

                applySalesFilters();

            }
        );

    }


    /* =====================================================
       PAYMENT FILTER
    ===================================================== */

    const paymentFilter =
        document.getElementById(
            "salesPaymentFilter"
        );


    if (paymentFilter) {

        paymentFilter.addEventListener(
            "change",
            () => {

                SalesState.currentPage =
                    1;

                applySalesFilters();

            }
        );

    }


    /* =====================================================
       DATE FILTER
    ===================================================== */

    const dateFilter =
        document.getElementById(
            "salesDateFilter"
        );


    if (dateFilter) {

        dateFilter.addEventListener(
            "change",
            () => {

                SalesState.currentPage =
                    1;

                applySalesFilters();

            }
        );

    }


    /* =====================================================
       TABLE SORTING
    ===================================================== */

    document
        .querySelectorAll(
            ".sales-table th"
        )
        .forEach(
            (header, index) => {

                header.style.cursor =
                    "pointer";


                header.addEventListener(
                    "click",
                    () => {

                        const sortKeys = [

                            "id",
                            "stationName",
                            "pumpName",
                            "nozzleName",
                            "shiftName",
                            "liters",
                            "pricePerLitre",
                            "amount",
                            "paymentMethod",
                            "recordedByName",
                            "createdAt"

                        ];


                        const key =
                            sortKeys[index];


                        if (!key) {

                            return;

                        }


                        if (
                            SalesState
                                .currentSort
                                .key === key
                        ) {

                            SalesState
                                .currentSort
                                .direction =

                                SalesState
                                    .currentSort
                                    .direction ===
                                "asc"
                                    ? "desc"
                                    : "asc";

                        } else {

                            SalesState
                                .currentSort
                                .key = key;


                            SalesState
                                .currentSort
                                .direction =
                                "asc";

                        }


                        renderSales();

                    }
                );

            }
        );

}


/* =========================================================
   OPEN RECORD SALE MODAL
========================================================= */

function openRecordSaleModal() {

    const modal =
        document.getElementById(
            "recordSaleModal"
        );


    if (!modal) {

        return;

    }


    clearRecordSaleForm();


    loadSaleStationOptions();

    loadSaleShiftOptions();

    loadSalePumpOptions();

    clearSaleNozzleOptions();


    hideRecordSaleError();


    modal.style.display =
        "flex";


    document.body.classList.add(
        "modal-open"
    );

}


/* =========================================================
   CLOSE RECORD SALE MODAL
========================================================= */

function closeRecordSaleModal() {

    const modal =
        document.getElementById(
            "recordSaleModal"
        );


    if (!modal) {

        return;

    }


    modal.style.display =
        "none";


    document.body.classList.remove(
        "modal-open"
    );

}


/* =========================================================
   CLEAR FORM
========================================================= */

function clearRecordSaleForm() {

    const form =
        document.getElementById(
            "recordSaleForm"
        );


    if (form) {

        form.reset();

    }


    const amount =
        document.getElementById(
            "saleAmount"
        );


    if (amount) {

        amount.value =
            "";

    }


    clearSaleNozzleOptions();

    hideRecordSaleError();

}


/* =========================================================
   LOAD STATIONS INTO SALE FORM
========================================================= */

function loadSaleStationOptions() {

    const select =
        document.getElementById(
            "saleStation"
        );


    if (!select) {

        return;

    }


    select.innerHTML = `

        <option value="">
            Select station
        </option>

    `;


    const stations =
        [
            ...SalesState.stations
        ];


    stations.sort(
        (a, b) =>
            String(
                a.name
            )
                .localeCompare(
                    String(
                        b.name
                    )
                )
    );


    stations.forEach(
        station => {

            if (!station.id) {

                return;

            }


            if (
                station.isActive ===
                false
            ) {

                return;

            }


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                String(
                    station.id
                );


            option.textContent =
                station.name;


            select.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   LOAD SHIFTS INTO SALE FORM
========================================================= */

function loadSaleShiftOptions() {

    const select =
        document.getElementById(
            "saleShift"
        );


    if (!select) {

        return;

    }


    const stationSelect =
        document.getElementById(
            "saleStation"
        );


    const selectedStationId =
        stationSelect?.value ||
        "";


    select.innerHTML = `

        <option value="">
            Select shift
        </option>

    `;


    let shifts =
        [
            ...SalesState.shifts
        ];


    if (
        selectedStationId
    ) {

        const stationSpecific =
            shifts.filter(
                shift =>
                    shift.stationId &&
                    String(
                        shift.stationId
                    ) ===
                    String(
                        selectedStationId
                    )
            );


        /*
         * If the backend shift records
         * contain station_id, use the
         * station-specific shifts.
         *
         * Otherwise keep all shifts
         * visible so the user can still
         * select the existing shift.
         */

        if (
            stationSpecific.length
        ) {

            shifts =
                stationSpecific;

        }

    }


    shifts.sort(
        (a, b) => {

            const dateA =
                a.shiftDate
                    ? new Date(
                        a.shiftDate
                    ).getTime()
                    : 0;


            const dateB =
                b.shiftDate
                    ? new Date(
                        b.shiftDate
                    ).getTime()
                    : 0;


            return (
                dateB -
                dateA
            );

        }
    );


    shifts.forEach(
        shift => {

            if (!shift.id) {

                return;

            }


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                String(
                    shift.id
                );


            option.textContent =
                buildShiftOptionLabel(
                    shift
                );


            select.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   LOAD PUMPS INTO SALE FORM
========================================================= */

function loadSalePumpOptions() {

    const select =
        document.getElementById(
            "salePump"
        );


    if (!select) {

        return;

    }


    const stationSelect =
        document.getElementById(
            "saleStation"
        );


    const selectedStationId =
        stationSelect?.value ||
        "";


    select.innerHTML = `

        <option value="">
            Select pump
        </option>

    `;


    let pumps =
        [
            ...SalesState.pumps
        ];


    if (
        selectedStationId
    ) {

        pumps =
            pumps.filter(
                pump =>
                    String(
                        pump.stationId
                    ) ===
                    String(
                        selectedStationId
                    )
            );

    }


    pumps.sort(
        (a, b) =>
            Number(
                a.number ||
                0
            ) -
            Number(
                b.number ||
                0
            )
    );


    pumps.forEach(
        pump => {

            if (!pump.id) {

                return;

            }


            if (
                pump.isActive ===
                false
            ) {

                return;

            }


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                String(
                    pump.id
                );


            option.textContent =
                pump.name;


            select.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   LOAD NOZZLES INTO SALE FORM
========================================================= */

function loadSaleNozzleOptions() {

    const select =
        document.getElementById(
            "saleNozzle"
        );


    if (!select) {

        return;

    }


    const pumpSelect =
        document.getElementById(
            "salePump"
        );


    const selectedPumpId =
        pumpSelect?.value ||
        "";


    select.innerHTML = `

        <option value="">
            Select nozzle
        </option>

    `;


    if (!selectedPumpId) {

        return;

    }


    let nozzles =
        SalesState.nozzles.filter(
            nozzle =>
                String(
                    nozzle.pumpId
                ) ===
                String(
                    selectedPumpId
                )
        );


    nozzles.sort(
        (a, b) =>
            Number(
                a.number ||
                0
            ) -
            Number(
                b.number ||
                0
            )
    );


    nozzles.forEach(
        nozzle => {

            if (!nozzle.id) {

                return;

            }


            if (
                nozzle.isActive ===
                false
            ) {

                return;

            }


            const option =
                document.createElement(
                    "option"
                );


            option.value =
                String(
                    nozzle.id
                );


            option.textContent =
                buildNozzleOptionLabel(
                    nozzle
                );


            select.appendChild(
                option
            );

        }
    );

}


/* =========================================================
   CLEAR NOZZLE OPTIONS
========================================================= */

function clearSaleNozzleOptions() {

    const select =
        document.getElementById(
            "saleNozzle"
        );


    if (!select) {

        return;

    }


    select.innerHTML = `

        <option value="">
            Select nozzle
        </option>

    `;


    const price =
        document.getElementById(
            "salePricePerLitre"
        );


    if (price) {

        price.value =
            "";

    }


    calculateSaleAmount();

}


/* =========================================================
   LOAD PRICE FROM NOZZLE
========================================================= */

function loadPriceFromNozzle() {

    const nozzleSelect =
        document.getElementById(
            "saleNozzle"
        );


    const priceInput =
        document.getElementById(
            "salePricePerLitre"
        );


    if (
        !nozzleSelect ||
        !priceInput
    ) {

        return;

    }


    const nozzleId =
        nozzleSelect.value;


    if (!nozzleId) {

        priceInput.value =
            "";

        return;

    }


    const nozzle =
        SalesState.nozzles.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    nozzleId
                )
        );


    if (
        nozzle &&
        Number(
            nozzle.pricePerLitre
        ) > 0
    ) {

        priceInput.value =
            Number(
                nozzle.pricePerLitre
            );

    }

}


/* =========================================================
   CALCULATE SALE AMOUNT
========================================================= */

function calculateSaleAmount() {

    const litresInput =
        document.getElementById(
            "saleLitres"
        );


    const priceInput =
        document.getElementById(
            "salePricePerLitre"
        );


    const amountInput =
        document.getElementById(
            "saleAmount"
        );


    if (
        !litresInput ||
        !priceInput ||
        !amountInput
    ) {

        return;

    }


    const litres =
        Number(
            litresInput.value
        );


    const price =
        Number(
            priceInput.value
        );


    if (
        !Number.isFinite(
            litres
        ) ||
        !Number.isFinite(
            price
        ) ||
        litres <= 0 ||
        price <= 0
    ) {

        amountInput.value =
            "";

        return;

    }


    const amount =
        litres *
        price;


    amountInput.value =
        amount.toFixed(2);

}


/* =========================================================
   SUBMIT SALE
========================================================= */

async function handleRecordSaleSubmit(
    event
) {

    event.preventDefault();


    if (
        SalesState.isSubmitting
    ) {

        return;

    }


    hideRecordSaleError();


    const stationId =
        document.getElementById(
            "saleStation"
        )?.value;


    const shiftId =
        document.getElementById(
            "saleShift"
        )?.value;


    const pumpId =
        document.getElementById(
            "salePump"
        )?.value;


    const nozzleId =
        document.getElementById(
            "saleNozzle"
        )?.value;


    const liters =
        Number(
            document.getElementById(
                "saleLitres"
            )?.value
        );


    const pricePerLitre =
        Number(
            document.getElementById(
                "salePricePerLitre"
            )?.value
        );


    const amount =
        Number(
            document.getElementById(
                "saleAmount"
            )?.value
        );


    const paymentMethod =
        document.getElementById(
            "salePaymentMethod"
        )?.value;


    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!stationId) {

        showRecordSaleError(
            "Please select a station."
        );

        return;

    }


    if (!shiftId) {

        showRecordSaleError(
            "Please select a shift."
        );

        return;

    }


    if (!pumpId) {

        showRecordSaleError(
            "Please select a pump."
        );

        return;

    }


    if (!nozzleId) {

        showRecordSaleError(
            "Please select a nozzle."
        );

        return;

    }


    if (
        !Number.isFinite(
            liters
        ) ||
        liters <= 0
    ) {

        showRecordSaleError(
            "Please enter a valid litres value."
        );

        return;

    }


    if (
        !Number.isFinite(
            pricePerLitre
        ) ||
        pricePerLitre <= 0
    ) {

        showRecordSaleError(
            "Please enter a valid price per litre."
        );

        return;

    }


    if (
        !paymentMethod
    ) {

        showRecordSaleError(
            "Please select a payment method."
        );

        return;

    }


    const calculatedAmount =
        Number(
            (
                liters *
                pricePerLitre
            ).toFixed(2)
        );


    /* =====================================================
       SUBMIT
    ===================================================== */

    try {

        SalesState.isSubmitting =
            true;


        setSaveSaleButtonLoading(
            true
        );


        /*
         * IMPORTANT
         *
         * The frontend uses "liters"
         * for compatibility.
         *
         * The backend controller converts
         * it to the database column:
         *
         * litres
         */

        const saleData = {

            station_id:
                stationId,

            pump_id:
                pumpId,

            nozzle_id:
                nozzleId,

            shift_id:
                shiftId,

            liters:
                liters,

            price_per_litre:
                pricePerLitre,

            amount:
                calculatedAmount,

            payment_method:
                paymentMethod

        };


        console.log(
            "Saving sale:",
            saleData
        );


        const response =
            await FuelGapAPI.createSale(
                saleData
            );


        console.log(
            "Sale created:",
            response
        );


        alert(
            "Sale recorded successfully."
        );


        closeRecordSaleModal();


        await refreshSalesData();


    } catch (error) {

        console.error(
            "Create sale error:",
            error
        );


        showRecordSaleError(
            error?.message ||
            "Unable to save the sale."
        );


    } finally {

        SalesState.isSubmitting =
            false;


        setSaveSaleButtonLoading(
            false
        );

    }

}


/* =========================================================
   SAVE BUTTON LOADING
========================================================= */

function setSaveSaleButtonLoading(
    loading
) {

    const button =
        document.getElementById(
            "saveSaleBtn"
        );


    if (!button) {

        return;

    }


    if (loading) {

        button.disabled =
            true;


        button.innerHTML = `

            <i class="fas fa-spinner fa-spin"></i>

            Saving...

        `;

    } else {

        button.disabled =
            false;


        button.innerHTML = `

            <i class="fas fa-save"></i>

            Save Sale

        `;

    }

}


/* =========================================================
   SHOW FORM ERROR
========================================================= */

function showRecordSaleError(
    message
) {

    const element =
        document.getElementById(
            "recordSaleError"
        );


    if (!element) {

        return;

    }


    element.innerHTML = `

        <i class="fas fa-exclamation-circle"></i>

        <span>

            ${escapeHTML(
                message
            )}

        </span>

    `;


    element.style.display =
        "flex";

}


/* =========================================================
   HIDE FORM ERROR
========================================================= */

function hideRecordSaleError() {

    const element =
        document.getElementById(
            "recordSaleError"
        );


    if (!element) {

        return;

    }


    element.style.display =
        "none";


    element.innerHTML =
        "";

}


/* =========================================================
   LOAD ALL BACKEND DATA
========================================================= */

async function refreshSalesData() {

    try {

        ensureFuelGapAPI();


        SalesState.isLoading =
            true;


        setRefreshButtonLoading(
            true
        );


        hideSalesError();


        const [

            salesResponse,

            stationsResponse,

            shiftsResponse,

            pumpsResponse,

            nozzlesResponse

        ] = await Promise.all([

            FuelGapAPI.getSales(),

            FuelGapAPI.getStations(),

            FuelGapAPI.getShifts(),

            FuelGapAPI.getPumps(),

            FuelGapAPI.getNozzles()

        ]);


        console.log(
            "Sales response:",
            salesResponse
        );


        console.log(
            "Stations response:",
            stationsResponse
        );


        console.log(
            "Shifts response:",
            shiftsResponse
        );


        console.log(
            "Pumps response:",
            pumpsResponse
        );


        console.log(
            "Nozzles response:",
            nozzlesResponse
        );


        SalesState.records =
            normalizeCollectionResponse(
                salesResponse,
                ["sales"]
            )
                .map(
                    normalizeSaleRecord
                );


        SalesState.stations =
            normalizeCollectionResponse(
                stationsResponse,
                ["stations"]
            )
                .map(
                    normalizeStation
                )
                .filter(
                    item =>
                        item.id
                );


        SalesState.shifts =
            normalizeCollectionResponse(
                shiftsResponse,
                ["shifts"]
            )
                .map(
                    normalizeShift
                )
                .filter(
                    item =>
                        item.id
                );


        SalesState.pumps =
            normalizeCollectionResponse(
                pumpsResponse,
                ["pumps"]
            )
                .map(
                    normalizePump
                )
                .filter(
                    item =>
                        item.id
                );


        SalesState.nozzles =
            normalizeCollectionResponse(
                nozzlesResponse,
                ["nozzles"]
            )
                .map(
                    normalizeNozzle
                )
                .filter(
                    item =>
                        item.id
                );


        console.log(
            "Sales configuration loaded:",
            {

                stations:
                    SalesState.stations.length,

                shifts:
                    SalesState.shifts.length,

                pumps:
                    SalesState.pumps.length,

                nozzles:
                    SalesState.nozzles.length,

                sales:
                    SalesState.records.length

            }
        );


        loadStationFilter();

        loadShiftFilter();

        loadNozzleFilter();


        applySalesFilters();


        updateSalesStatistics();


    } catch (error) {

        console.error(
            "Unable to load sales:",
            error
        );


        showSalesError(
            error?.message ||
            "Unable to load sales records."
        );


    } finally {

        SalesState.isLoading =
            false;


        setRefreshButtonLoading(
            false
        );

    }

}


/* =========================================================
   NORMALIZE COLLECTION
========================================================= */

function normalizeCollectionResponse(
    response,
    possibleKeys = []
) {

    if (
        Array.isArray(
            response
        )
    ) {

        return response;

    }


    if (
        response &&
        Array.isArray(
            response.data
        )
    ) {

        return response.data;

    }


    if (
        response &&
        response.data
    ) {

        for (
            const key of possibleKeys
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


    if (response) {

        for (
            const key of possibleKeys
        ) {

            if (
                Array.isArray(
                    response[key]
                )
            ) {

                return response[key];

            }

        }

    }


    return [];

}


/* =========================================================
   NORMALIZE STATION
========================================================= */

function normalizeStation(
    station = {}
) {

    const id =
        station.id ||
        station.station_id ||
        station.stationId ||
        "";


    const name =
        station.name ||
        station.station_name ||
        station.stationName ||
        `Station ${id || "-"}`;


    const isActive =
        station.is_active !==
        false;


    return {

        id,

        name,

        address:
            station.address ||
            "",

        city:
            station.city ||
            "",

        state:
            station.state ||
            "",

        status:
            station.status ||
            (
                isActive
                    ? "active"
                    : "inactive"
            ),

        isActive,

        raw:
            station

    };

}


/* =========================================================
   NORMALIZE SHIFT
========================================================= */

function normalizeShift(
    shift = {}
) {

    const id =
        shift.id ||
        shift.shift_id ||
        shift.shiftId ||
        "";


    const stationId =
        shift.station_id ||
        shift.stationId ||
        shift.station?.id ||
        "";


    const shiftName =
        shift.name ||
        shift.shift_name ||
        shift.shiftName ||
        shift.code ||
        "";


    const shiftDate =
        shift.shift_date ||
        shift.shiftDate ||
        shift.date ||
        "";


    const status =
        shift.status ||
        "recorded";


    let displayName =
        shiftName;


    if (!displayName) {

        if (shiftDate) {

            displayName =
                `Shift - ${formatShiftDate(
                    shiftDate
                )}`;

        } else {

            displayName =
                `Shift ${id || "-"}`;

        }

    }


    return {

        id,

        stationId,

        name:
            displayName,

        shiftDate,

        status,

        raw:
            shift

    };

}


/* =========================================================
   NORMALIZE PUMP
========================================================= */

function normalizePump(
    pump = {}
) {

    const id =
        pump.id ||
        pump.pump_id ||
        pump.pumpId ||
        "";


    const stationId =
        pump.station_id ||
        pump.stationId ||
        pump.station?.id ||
        "";


    const number =
        pump.pump_number ??
        pump.number ??
        pump.pumpNumber ??
        "";


    const name =
        pump.name ||
        (
            number !== ""
                ? `Pump ${number}`
                : `Pump ${id || "-"}`
        );


    const isActive =
        pump.is_active !==
        false;


    return {

        id,

        stationId,

        number,

        name,

        status:
            pump.status ||
            (
                isActive
                    ? "active"
                    : "inactive"
            ),

        isActive,

        raw:
            pump

    };

}


/* =========================================================
   NORMALIZE NOZZLE
========================================================= */

function normalizeNozzle(
    nozzle = {}
) {

    const id =
        nozzle.id ||
        nozzle.nozzle_id ||
        nozzle.nozzleId ||
        "";


    const pumpId =
        nozzle.pump_id ||
        nozzle.pumpId ||
        nozzle.pump?.id ||
        "";


    const stationId =
        nozzle.station_id ||
        nozzle.stationId ||
        nozzle.pump?.station_id ||
        nozzle.pump?.stationId ||
        "";


    const number =
        nozzle.nozzle_number ??
        nozzle.number ??
        nozzle.nozzleNumber ??
        "";


    const product =
        nozzle.product ||
        "";


    const name =
        nozzle.name ||
        (
            number !== ""
                ? `Nozzle ${number}`
                : `Nozzle ${id || "-"}`
        );


    const isActive =
        nozzle.is_active !==
        false;


    return {

        id,

        pumpId,

        stationId,

        number,

        name,

        product,

        pricePerLitre:
            Number(
                nozzle.price_per_litre ??
                nozzle.pricePerLitre ??
                nozzle.price ??
                0
            ),

        status:
            nozzle.status ||
            (
                isActive
                    ? "active"
                    : "inactive"
            ),

        isActive,

        raw:
            nozzle

    };

}


/* =========================================================
   NORMALIZE SALE
========================================================= */

function normalizeSaleRecord(
    sale = {}
) {

    const station =
        sale.station ||
        {};


    const pump =
        sale.pump ||
        {};


    const nozzle =
        sale.nozzle ||
        {};


    const shift =
        sale.shift ||
        {};


    const id =
        sale.id ||
        sale.sale_id ||
        sale.saleId ||
        "";


    const stationId =
        sale.station_id ||
        sale.stationId ||
        station.id ||
        station.station_id ||
        "";


    const pumpId =
        sale.pump_id ||
        sale.pumpId ||
        pump.id ||
        pump.pump_id ||
        "";


    const nozzleId =
        sale.nozzle_id ||
        sale.nozzleId ||
        nozzle.id ||
        nozzle.nozzle_id ||
        "";


    const shiftId =
        sale.shift_id ||
        sale.shiftId ||
        shift.id ||
        shift.shift_id ||
        "";


    const liters =
        Number(
            sale.liters ??
            sale.litres ??
            0
        );


    const pricePerLitre =
        Number(
            sale.price_per_litre ??
            sale.pricePerLitre ??
            sale.price ??
            0
        );


    const amount =
        Number(
            sale.amount ??
            0
        );


    const createdAt =
        sale.created_at ||
        sale.createdAt ||
        sale.recorded_at ||
        sale.recordedAt ||
        null;


    const recordedBy =
        sale.recorded_by ||
        sale.recordedBy ||
        "";


    const recordedByName =
        sale.recorded_by_name ||
        sale.recordedByName ||
        sale.user_name ||
        sale.userName ||
        "Unknown";


    const paymentMethod =
        sale.payment_method ||
        sale.paymentMethod ||
        "other";


    const stationConfig =
        SalesState.stations.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    stationId
                )
        );


    const pumpConfig =
        SalesState.pumps.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    pumpId
                )
        );


    const nozzleConfig =
        SalesState.nozzles.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    nozzleId
                )
        );


    const shiftConfig =
        SalesState.shifts.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    shiftId
                )
        );


    const stationName =
        station.name ||
        sale.station_name ||
        sale.stationName ||
        stationConfig?.name ||
        "Unknown Station";


    const pumpNumber =
        pump.pump_number ??
        pump.number ??
        pump.pumpNumber ??
        sale.pump_number ??
        pumpConfig?.number ??
        "";


    const pumpName =
        pump.name ||
        sale.pumpName ||
        (
            pumpNumber !== ""
                ? `Pump ${pumpNumber}`
                : pumpConfig?.name ||
                  `Pump ${pumpId || "-"}`
        );


    const nozzleNumber =
        nozzle.nozzle_number ??
        nozzle.number ??
        nozzle.nozzleNumber ??
        sale.nozzle_number ??
        nozzleConfig?.number ??
        "";


    const nozzleName =
        nozzle.name ||
        sale.nozzleName ||
        (
            nozzleNumber !== ""
                ? `Nozzle ${nozzleNumber}`
                : nozzleConfig?.name ||
                  `Nozzle ${nozzleId || "-"}`
        );


    const shiftName =
        shift.name ||
        shift.shift_name ||
        sale.shift_name ||
        sale.shiftName ||
        shiftConfig?.name ||
        `Shift ${shiftId || "-"}`;


    const shiftStatus =
        shift.status ||
        sale.shift_status ||
        sale.shiftStatus ||
        shiftConfig?.status ||
        "recorded";


    return {

        id,

        stationId,
        stationName,

        pumpId,
        pumpName,

        nozzleId,
        nozzleName,

        shiftId,
        shiftName,
        shiftStatus,

        recordedBy,
        recordedByName,

        liters,
        pricePerLitre,
        amount,

        paymentMethod,

        createdAt,

        raw:
            sale

    };

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


    const currentValue =
        select.value;


    select.innerHTML = `

        <option value="">
            All Stations
        </option>

    `;


    SalesState.stations
        .slice()
        .sort(
            (a, b) =>
                String(
                    a.name
                )
                    .localeCompare(
                        String(
                            b.name
                        )
                    )
        )
        .forEach(
            station => {

                if (!station.id) {

                    return;

                }


                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    String(
                        station.id
                    );


                option.textContent =
                    station.name;


                select.appendChild(
                    option
                );

            }
        );


    if (
        Array.from(
            select.options
        )
            .some(
                option =>
                    option.value ===
                    currentValue
            )
    ) {

        select.value =
            currentValue;

    }

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


    const stationFilter =
        document.getElementById(
            "salesStationFilter"
        );


    const stationId =
        stationFilter?.value ||
        "";


    const currentValue =
        select.value;


    select.innerHTML = `

        <option value="">
            All Shifts
        </option>

    `;


    let shifts =
        SalesState.shifts.slice();


    if (
        stationId
    ) {

        const filtered =
            shifts.filter(
                shift =>
                    String(
                        shift.stationId
                    ) ===
                    String(
                        stationId
                    )
            );


        if (
            filtered.length
        ) {

            shifts =
                filtered;

        }

    }


    shifts.forEach(
        shift => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                String(
                    shift.id
                );


            option.textContent =
                buildShiftOptionLabel(
                    shift
                );


            select.appendChild(
                option
            );

        }
    );


    if (
        Array.from(
            select.options
        )
            .some(
                option =>
                    option.value ===
                    currentValue
            )
    ) {

        select.value =
            currentValue;

    }

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


    const stationFilter =
        document.getElementById(
            "salesStationFilter"
        );


    const stationId =
        stationFilter?.value ||
        "";


    const currentValue =
        select.value;


    select.innerHTML = `

        <option value="">
            All Nozzles
        </option>

    `;


    let nozzles =
        SalesState.nozzles.slice();


    if (
        stationId
    ) {

        const stationPumpIds =
            new Set(
                SalesState.pumps
                    .filter(
                        pump =>
                            String(
                                pump.stationId
                            ) ===
                            String(
                                stationId
                            )
                    )
                    .map(
                        pump =>
                            String(
                                pump.id
                            )
                    )
            );


        const filtered =
            nozzles.filter(
                nozzle =>

                    String(
                        nozzle.stationId
                    ) ===
                    String(
                        stationId
                    ) ||

                    stationPumpIds.has(
                        String(
                            nozzle.pumpId
                        )
                    )
            );


        if (
            filtered.length
        ) {

            nozzles =
                filtered;

        }

    }


    nozzles.forEach(
        nozzle => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                String(
                    nozzle.id
                );


            option.textContent =
                buildNozzleOptionLabel(
                    nozzle
                );


            select.appendChild(
                option
            );

        }
    );


    if (
        Array.from(
            select.options
        )
            .some(
                option =>
                    option.value ===
                    currentValue
            )
    ) {

        select.value =
            currentValue;

    }

}


/* =========================================================
   SHIFT LABEL
========================================================= */

function buildShiftOptionLabel(
    shift
) {

    let label =
        shift.name ||
        `Shift ${shift.id || "-"}`;


    if (
        shift.shiftDate
    ) {

        label +=
            ` • ${formatShiftDate(
                shift.shiftDate
            )}`;

    }


    if (
        shift.status
    ) {

        label +=
            ` • ${formatShiftStatus(
                shift.status
            )}`;

    }


    return label;

}


/* =========================================================
   NOZZLE LABEL
========================================================= */

function buildNozzleOptionLabel(
    nozzle
) {

    let label =
        nozzle.name ||
        `Nozzle ${nozzle.id || "-"}`;


    if (
        nozzle.product
    ) {

        label +=
            ` • ${String(
                nozzle.product
            ).toUpperCase()}`;

    }


    const pump =
        SalesState.pumps.find(
            item =>
                String(
                    item.id
                ) ===
                String(
                    nozzle.pumpId
                )
        );


    if (pump) {

        label +=
            ` • ${pump.name}`;

    }


    return label;

}


/* =========================================================
   APPLY FILTERS
========================================================= */

function applySalesFilters() {

    const search =
        (
            document.getElementById(
                "salesSearch"
            )?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const stationId =
        document.getElementById(
            "salesStationFilter"
        )?.value ||
        "";


    const shiftId =
        document.getElementById(
            "salesShiftFilter"
        )?.value ||
        "";


    const nozzleId =
        document.getElementById(
            "salesNozzleFilter"
        )?.value ||
        "";


    const paymentMethod =
        document.getElementById(
            "salesPaymentFilter"
        )?.value ||
        "";


    const selectedDate =
        document.getElementById(
            "salesDateFilter"
        )?.value ||
        "";


    SalesState.filteredRecords =
        SalesState.records.filter(
            sale => {

                if (search) {

                    const searchable = [

                        sale.id,
                        sale.stationName,
                        sale.pumpName,
                        sale.nozzleName,
                        sale.shiftName,
                        sale.recordedByName,
                        sale.paymentMethod,
                        sale.liters,
                        sale.amount

                    ]
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


                if (
                    stationId &&
                    String(
                        sale.stationId
                    ) !==
                    String(
                        stationId
                    )
                ) {

                    return false;

                }


                if (
                    shiftId &&
                    String(
                        sale.shiftId
                    ) !==
                    String(
                        shiftId
                    )
                ) {

                    return false;

                }


                if (
                    nozzleId &&
                    String(
                        sale.nozzleId
                    ) !==
                    String(
                        nozzleId
                    )
                ) {

                    return false;

                }


                if (
                    paymentMethod &&
                    String(
                        sale.paymentMethod
                    )
                        .toLowerCase() !==
                    String(
                        paymentMethod
                    )
                        .toLowerCase()
                ) {

                    return false;

                }


                if (
                    selectedDate
                ) {

                    if (
                        !sale.createdAt
                    ) {

                        return false;

                    }


                    if (
                        formatDateForInput(
                            sale.createdAt
                        ) !==
                        selectedDate
                    ) {

                        return false;

                    }

                }


                return true;

            }
        );


    renderSales();

    updateSalesStatistics();

}


/* =========================================================
   SORT
========================================================= */

function sortSales(
    records
) {

    const {
        key,
        direction
    } =
        SalesState.currentSort;


    const multiplier =
        direction ===
        "asc"
            ? 1
            : -1;


    return [
        ...records
    ].sort(
        (
            a,
            b
        ) => {

            let valueA =
                a[key];


            let valueB =
                b[key];


            if (
                key ===
                "createdAt"
            ) {

                valueA =
                    valueA
                        ? new Date(
                            valueA
                        ).getTime()
                        : 0;


                valueB =
                    valueB
                        ? new Date(
                            valueB
                        ).getTime()
                        : 0;

            }


            if (
                typeof valueA ===
                "number" &&
                typeof valueB ===
                "number"
            ) {

                return (
                    valueA -
                    valueB
                ) *
                multiplier;

            }


            return String(
                valueA ??
                ""
            )
                .localeCompare(
                    String(
                        valueB ??
                        ""
                    )
                ) *
                multiplier;

        }
    );

}


/* =========================================================
   RENDER SALES TABLE
========================================================= */

function renderSales() {

    const tbody =
        document.getElementById(
            "salesTableBody"
        );


    if (!tbody) {

        return;

    }


    const sorted =
        sortSales(
            SalesState.filteredRecords
        );


    const totalRecords =
        sorted.length;


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                totalRecords /
                SalesState.rowsPerPage
            )
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
            SalesState.currentPage -
            1
        ) *
        SalesState.rowsPerPage;


    const pageRecords =
        sorted.slice(
            startIndex,
            startIndex +
            SalesState.rowsPerPage
        );


    if (
        !pageRecords.length
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="11"
                    class="empty-state"
                >

                    <div class="empty-state-content">

                        <div class="empty-state-icon">

                            <i class="fas fa-receipt"></i>

                        </div>


                        <h3>
                            No sales found
                        </h3>


                        <p>
                            There are no sales records matching your current filters.
                        </p>

                    </div>

                </td>

            </tr>

        `;


        renderPagination(
            totalRecords
        );


        return;

    }


    tbody.innerHTML =
        pageRecords
            .map(
                renderSaleRow
            )
            .join("");


    renderPagination(
        totalRecords
    );

}


/* =========================================================
   SALE ROW
========================================================= */

function renderSaleRow(
    sale
) {

    return `

        <tr>


            <td>

                <span class="record-id">

                    ${escapeHTML(
                        String(
                            sale.id ||
                            "-"
                        )
                    )}

                </span>

            </td>


            <td>

                ${escapeHTML(
                    sale.stationName
                )}

            </td>


            <td>

                ${escapeHTML(
                    sale.pumpName
                )}

            </td>


            <td>

                ${escapeHTML(
                    sale.nozzleName
                )}

            </td>


            <td>

                ${escapeHTML(
                    sale.shiftName
                )}

            </td>


            <td>

                <strong>

                    ${formatLitres(
                        sale.liters
                    )}

                </strong>

            </td>


            <td>

                ${formatCurrency(
                    sale.pricePerLitre
                )}

            </td>


            <td>

                <strong>

                    ${formatCurrency(
                        sale.amount
                    )}

                </strong>

            </td>


            <td>

                <span class="payment-badge">

                    ${escapeHTML(
                        formatPaymentMethod(
                            sale.paymentMethod
                        )
                    )}

                </span>

            </td>


            <td>

                ${escapeHTML(
                    sale.recordedByName ||
                    "Unknown"
                )}

            </td>


            <td>

                ${formatDateTime(
                    sale.createdAt
                )}

            </td>


        </tr>

    `;

}


/* =========================================================
   PAGINATION
========================================================= */

function renderPagination(
    totalRecords
) {

    const container =
        document.getElementById(
            "salesPagination"
        );


    if (!container) {

        return;

    }


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                totalRecords /
                SalesState.rowsPerPage
            )
        );


    if (
        totalRecords ===
        0
    ) {

        container.innerHTML =
            "";

        return;

    }


    let html = `

        <div class="pagination-info">

            Showing

            <strong>

                ${
                    (
                        (
                            SalesState.currentPage -
                            1
                        ) *
                        SalesState.rowsPerPage
                    ) + 1
                }

            </strong>

            -

            <strong>

                ${
                    Math.min(
                        SalesState.currentPage *
                        SalesState.rowsPerPage,
                        totalRecords
                    )
                }

            </strong>

            of

            <strong>
                ${totalRecords}
            </strong>

        </div>


        <div class="pagination-buttons">


            <button
                type="button"
                class="pagination-btn"
                data-page="prev"
                ${
                    SalesState.currentPage <=
                    1
                        ? "disabled"
                        : ""
                }
            >

                <i class="fas fa-chevron-left"></i>

            </button>

    `;


    const totalVisible =
        5;


    let start =
        Math.max(
            1,
            SalesState.currentPage -
            2
        );


    let end =
        Math.min(
            totalPages,
            start +
            totalVisible -
            1
        );


    if (
        end -
        start +
        1 <
        totalVisible
    ) {

        start =
            Math.max(
                1,
                end -
                totalVisible +
                1
            );

    }


    for (
        let page =
            start;
        page <=
            end;
        page++
    ) {

        html += `

            <button
                type="button"
                class="pagination-btn ${
                    page ===
                    SalesState.currentPage
                        ? "active"
                        : ""
                }"
                data-page="${page}"
            >

                ${page}

            </button>

        `;

    }


    html += `

            <button
                type="button"
                class="pagination-btn"
                data-page="next"
                ${
                    SalesState.currentPage >=
                    totalPages
                        ? "disabled"
                        : ""
                }
            >

                <i class="fas fa-chevron-right"></i>

            </button>


        </div>

    `;


    container.innerHTML =
        html;


    container
        .querySelectorAll(
            ".pagination-btn"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const page =
                            button.dataset.page;


                        if (
                            page ===
                            "prev"
                        ) {

                            SalesState.currentPage =
                                Math.max(
                                    1,
                                    SalesState.currentPage -
                                    1
                                );

                        } else if (
                            page ===
                            "next"
                        ) {

                            SalesState.currentPage =
                                Math.min(
                                    totalPages,
                                    SalesState.currentPage +
                                    1
                                );

                        } else {

                            SalesState.currentPage =
                                Number(
                                    page
                                );

                        }


                        renderSales();

                    }
                );

            }
        );

}


/* =========================================================
   STATISTICS
========================================================= */

function updateSalesStatistics() {

    const records =
        SalesState.filteredRecords;


    const totalRevenue =
        records.reduce(
            (
                total,
                sale
            ) =>
                total +
                Number(
                    sale.amount ||
                    0
                ),
            0
        );


    const totalLitres =
        records.reduce(
            (
                total,
                sale
            ) =>
                total +
                Number(
                    sale.liters ||
                    0
                ),
            0
        );


    const recordCount =
        records.length;


    const averageSale =
        recordCount
            ? totalRevenue /
              recordCount
            : 0;


    document.getElementById(
        "salesTotalRevenue"
    ).textContent =
        formatCurrency(
            totalRevenue
        );


    document.getElementById(
        "salesTotalLitres"
    ).textContent =
        formatLitres(
            totalLitres
        );


    document.getElementById(
        "salesRecordCount"
    ).textContent =
        recordCount.toLocaleString();


    document.getElementById(
        "salesAverageSale"
    ).textContent =
        formatCurrency(
            averageSale
        );

}


/* =========================================================
   PAYMENT METHOD
========================================================= */

function formatPaymentMethod(
    paymentMethod
) {

    const value =
        String(
            paymentMethod ||
            "other"
        )
            .toLowerCase();


    const labels = {

        cash:
            "Cash",

        pos:
            "POS",

        transfer:
            "Transfer",

        bank_transfer:
            "Bank Transfer",

        card:
            "Card",

        other:
            "Other"

    };


    return (
        labels[value] ||
        value
            .replaceAll(
                "_",
                " "
            )
            .replace(
                /\b\w/g,
                char =>
                    char.toUpperCase()
            )
    );

}


/* =========================================================
   REFRESH BUTTON
========================================================= */

function setRefreshButtonLoading(
    loading
) {

    const button =
        document.getElementById(
            "refreshSalesBtn"
        );


    if (!button) {

        return;

    }


    if (loading) {

        button.disabled =
            true;


        button.innerHTML = `

            <i class="fas fa-spinner fa-spin"></i>

            Loading...

        `;

    } else {

        button.disabled =
            false;


        button.innerHTML = `

            <i class="fas fa-sync-alt"></i>

            Refresh

        `;

    }

}


/* =========================================================
   ERROR
========================================================= */

function showSalesError(
    message
) {

    const element =
        document.getElementById(
            "salesError"
        );


    if (!element) {

        return;

    }


    element.innerHTML = `

        <i class="fas fa-exclamation-triangle"></i>

        <span>

            ${escapeHTML(
                message
            )}

        </span>

    `;


    element.style.display =
        "block";

}


/* =========================================================
   HIDE ERROR
========================================================= */

function hideSalesError() {

    const element =
        document.getElementById(
            "salesError"
        );


    if (!element) {

        return;

    }


    element.style.display =
        "none";


    element.innerHTML =
        "";

}


/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(
    value
) {

    const number =
        Number(
            value ||
            0
        );


    return (
        "₦" +
        number.toLocaleString(
            "en-NG",
            {
                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    2
            }
        )
    );

}


/* =========================================================
   LITRES
========================================================= */

function formatLitres(
    value
) {

    const number =
        Number(
            value ||
            0
        );


    return (
        number.toLocaleString(
            "en-NG",
            {
                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    2
            }
        ) +
        " L"
    );

}


/* =========================================================
   DATE TIME
========================================================= */

function formatDateTime(
    value
) {

    if (!value) {

        return "-";

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

        return "-";

    }


    return date.toLocaleString(
        "en-NG",
        {
            year:
                "numeric",

            month:
                "short",

            day:
                "2-digit",

            hour:
                "2-digit",

            minute:
                "2-digit"
        }
    );

}


/* =========================================================
   SHIFT DATE
========================================================= */

function formatShiftDate(
    value
) {

    if (!value) {

        return "";

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

        return String(
            value
        );

    }


    return date.toLocaleDateString(
        "en-NG",
        {
            year:
                "numeric",

            month:
                "short",

            day:
                "2-digit"
        }
    );

}


/* =========================================================
   SHIFT STATUS
========================================================= */

function formatShiftStatus(
    status
) {

    return String(
        status ||
        "recorded"
    )
        .replaceAll(
            "_",
            " "
        )
        .replace(
            /\b\w/g,
            char =>
                char.toUpperCase()
        );

}


/* =========================================================
   DATE FOR INPUT
========================================================= */

function formatDateForInput(
    value
) {

    if (!value) {

        return "";

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

        return "";

    }


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() +
            1
        )
            .padStart(
                2,
                "0"
            );


    const day =
        String(
            date.getDate()
        )
            .padStart(
                2,
                "0"
            );


    return (
        `${year}-${month}-${day}`
    );

}


/* =========================================================
   CSV EXPORT
========================================================= */

function exportSalesCSV() {

    const records =
        SalesState.filteredRecords;


    if (
        !records.length
    ) {

        alert(
            "There are no sales records to export."
        );

        return;

    }


    const headers = [

        "Sale ID",
        "Station",
        "Pump",
        "Nozzle",
        "Shift",
        "Litres",
        "Price Per Litre",
        "Amount",
        "Payment Method",
        "Recorded By",
        "Created At"

    ];


    const rows =
        records.map(
            sale => [

                sale.id,

                sale.stationName,

                sale.pumpName,

                sale.nozzleName,

                sale.shiftName,

                sale.liters,

                sale.pricePerLitre,

                sale.amount,

                formatPaymentMethod(
                    sale.paymentMethod
                ),

                sale.recordedByName,

                sale.createdAt

            ]
        );


    const csv = [

        headers,

        ...rows

    ]
        .map(
            row =>
                row
                    .map(
                        value =>
                            `"${String(
                                value ??
                                ""
                            )
                                .replaceAll(
                                    '"',
                                    '""'
                                )}"`
                    )
                    .join(",")
        )
        .join("\n");


    const blob =
        new Blob(
            [csv],
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
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        `fuelgap-sales-${getTodayDate()}.csv`;


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
   TODAY
========================================================= */

function getTodayDate() {

    const date =
        new Date();


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() +
            1
        )
            .padStart(
                2,
                "0"
            );


    const day =
        String(
            date.getDate()
        )
            .padStart(
                2,
                "0"
            );


    return (
        `${year}-${month}-${day}`
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {

    return String(
        value ??
        ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}