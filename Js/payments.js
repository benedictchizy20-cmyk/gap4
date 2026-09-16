/* =========================================================
   FUELGAP - PAYMENTS MANAGEMENT
   REAL BACKEND VERSION
   SUPABASE + EXPRESS
   HTTPONLY COOKIE SESSION
   NO LOCALSTORAGE AUTHENTICATION
========================================================= */

const PaymentsState = {

    currentUser: null,

    payments: [],
    filteredPayments: [],

    stations: [],
    shifts: [],
    sales: [],

    currentFilters: {
        search: "",
        stationId: "",
        shiftId: "",
        paymentMethod: "",
        date: ""
    },

    isLoading: false,
    isSubmitting: false,
    isDeleting: false
};


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    try {

        console.log("FuelGap Payments page starting...");

        if (typeof FuelGapAPI === "undefined") {

            console.error("FuelGapAPI is not available.");

            showGlobalPaymentError(
                "FuelGap API is not available. Check your API configuration."
            );

            return;
        }


        /* =====================================================
           GET CURRENT USER
        ===================================================== */

        const userResponse =
            await FuelGapAPI.getCurrentUser();


        /*
        Support different API response formats.
        */

        PaymentsState.currentUser =
            userResponse?.data?.user ||
            userResponse?.user ||
            (
                userResponse?.data &&
                !Array.isArray(userResponse.data)
                    ? userResponse.data
                    : null
            ) ||
            userResponse ||
            null;


        console.log(
            "Payments current user:",
            PaymentsState.currentUser
        );


        /* =====================================================
           AUTH CHECK
        ===================================================== */

        if (!PaymentsState.currentUser) {

            console.warn(
                "No authenticated user found. Redirecting to login."
            );

            window.location.href = "./login.html";

            return;
        }


        /*
        IMPORTANT:

        We intentionally DO NOT use the old:

        hasPermission(
            currentUser.role,
            "payments"
        )

        check here.

        The backend protects the payment routes with
        requireAuth middleware.
        */


        /* =====================================================
           RENDER
        ===================================================== */

        renderPaymentsPage();


        /* =====================================================
           EVENTS
        ===================================================== */

        setupPaymentEvents();


        /* =====================================================
           LOAD DATA
        ===================================================== */

        await loadPaymentData();


    } catch (error) {

        console.error(
            "PAYMENTS PAGE INITIALIZATION ERROR:",
            error
        );

        showGlobalPaymentError(
            error.message ||
            "Unable to load payment management."
        );
    }

});


/* =========================================================
   LOAD PAYMENT DATA
========================================================= */

async function loadPaymentData() {

    try {

        PaymentsState.isLoading = true;

        setPaymentLoading(true);


        const [
            stationsResponse,
            shiftsResponse,
            salesResponse,
            paymentsResponse
        ] = await Promise.all([

            FuelGapAPI.getStations(),

            FuelGapAPI.getShifts(),

            FuelGapAPI.getSales(),

            FuelGapAPI.getPayments(
                getBackendPaymentFilters()
            )

        ]);


        /* =====================================================
           STATIONS
        ===================================================== */

        PaymentsState.stations =
            extractArray(
                stationsResponse,
                [
                    "stations",
                    "data"
                ]
            ).map(normalizeStation);


        /* =====================================================
           SHIFTS
        ===================================================== */

        PaymentsState.shifts =
            extractArray(
                shiftsResponse,
                [
                    "shifts",
                    "data"
                ]
            ).map(normalizeShift);


        /* =====================================================
           SALES
        ===================================================== */

        PaymentsState.sales =
            extractArray(
                salesResponse,
                [
                    "sales",
                    "data"
                ]
            ).map(normalizeSale);


        /* =====================================================
           PAYMENTS
        ===================================================== */

        PaymentsState.payments =
            extractArray(
                paymentsResponse,
                [
                    "payments",
                    "data"
                ]
            ).map(normalizePayment);


        /* =====================================================
           USER VISIBILITY
        ===================================================== */

        PaymentsState.stations =
            getVisibleStations(
                PaymentsState.stations
            );


        PaymentsState.shifts =
            getVisibleShifts(
                PaymentsState.shifts
            );


        PaymentsState.payments =
            getVisiblePayments(
                PaymentsState.payments
            );


        /* =====================================================
           FILTER
        ===================================================== */

        applyPaymentFilters();


        /* =====================================================
           FORM DATA
        ===================================================== */

        populatePaymentFilters();

        populatePaymentFormStations();

        populatePaymentFormSales();


        /* =====================================================
           RENDER
        ===================================================== */

        renderPaymentStats();

        renderPaymentsTable();


    } catch (error) {

        console.error(
            "LOAD PAYMENT DATA ERROR:",
            error
        );

        showGlobalPaymentError(
            error.message ||
            "Failed to load payment data."
        );

    } finally {

        PaymentsState.isLoading = false;

        setPaymentLoading(false);
    }

}


/* =========================================================
   EXTRACT ARRAY
========================================================= */

function extractArray(response, keys = []) {

    if (Array.isArray(response)) {

        return response;
    }


    if (
        response &&
        Array.isArray(response.data)
    ) {

        return response.data;
    }


    if (
        response &&
        response.data &&
        typeof response.data === "object"
    ) {

        for (const key of keys) {

            if (
                Array.isArray(
                    response.data[key]
                )
            ) {

                return response.data[key];
            }
        }
    }


    if (
        response &&
        typeof response === "object"
    ) {

        for (const key of keys) {

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

function normalizeStation(station) {

    return {

        ...station,

        id:
            station.id ||
            station.station_id,

        stationId:
            station.stationId ||
            station.station_id ||
            station.id,

        name:
            station.name ||
            station.station_name ||
            "Unnamed Station",

        address:
            station.address || "",

        city:
            station.city || "",

        state:
            station.state || "",

        isActive:
            station.isActive ??
            station.is_active ??
            true
    };
}


/* =========================================================
   NORMALIZE SHIFT
========================================================= */

function normalizeShift(shift) {

    return {

        ...shift,

        id:
            shift.id ||
            shift.shift_id,

        shiftId:
            shift.shiftId ||
            shift.shift_id ||
            shift.id,

        stationId:
            shift.stationId ||
            shift.station_id,

        name:
            shift.name ||
            shift.shift_name ||
            shift.name_of_shift ||
            "Shift",

        status:
            shift.status || "",

        openedAt:
            shift.openedAt ||
            shift.opened_at,

        closedAt:
            shift.closedAt ||
            shift.closed_at
    };
}


/* =========================================================
   NORMALIZE SALE
========================================================= */

function normalizeSale(sale) {

    return {

        ...sale,

        id:
            sale.id ||
            sale.sale_id,

        saleId:
            sale.saleId ||
            sale.sale_id ||
            sale.id,

        stationId:
            sale.stationId ||
            sale.station_id,

        pumpId:
            sale.pumpId ||
            sale.pump_id,

        nozzleId:
            sale.nozzleId ||
            sale.nozzle_id,

        shiftId:
            sale.shiftId ||
            sale.shift_id,

        litres:
            Number(
                sale.litres ??
                sale.liters ??
                0
            ),

        pricePerLitre:
            Number(
                sale.pricePerLitre ??
                sale.price_per_litre ??
                0
            ),

        amount:
            Number(
                sale.amount || 0
            ),

        paymentMethod:
            sale.paymentMethod ||
            sale.payment_method ||
            "",

        recordedBy:
            sale.recordedBy ||
            sale.recorded_by,

        createdAt:
            sale.createdAt ||
            sale.created_at
    };
}


/* =========================================================
   NORMALIZE PAYMENT
========================================================= */

function normalizePayment(payment) {

    return {

        ...payment,

        id:
            payment.id ||
            payment.payment_id,

        paymentId:
            payment.paymentId ||
            payment.payment_id ||
            payment.id,

        saleId:
            payment.saleId ||
            payment.sale_id,

        stationId:
            payment.stationId ||
            payment.station_id,

        shiftId:
            payment.shiftId ||
            payment.shift_id,

        recordedBy:
            payment.recordedBy ||
            payment.recorded_by,

        amount:
            Number(
                payment.amount || 0
            ),

        paymentMethod:
            payment.paymentMethod ||
            payment.payment_method ||
            "",

        reference:
            payment.reference || "",

        notes:
            payment.notes || "",

        createdAt:
            payment.createdAt ||
            payment.created_at
    };
}


/* =========================================================
   GET VISIBLE STATIONS
========================================================= */

function getVisibleStations(stations) {

    const user =
        PaymentsState.currentUser || {};


    const role =
        user.role ||
        user.user_role ||
        user.user?.role ||
        "";


    if (
        role === "owner" ||
        role === "admin"
    ) {

        return stations;
    }


    const userStationId =
        user.station_id ||
        user.stationId ||
        user.station?.id;


    if (!userStationId) {

        return stations;
    }


    return stations.filter(
        station =>
            String(
                station.stationId
            ) === String(userStationId)
    );
}


/* =========================================================
   GET VISIBLE SHIFTS
========================================================= */

function getVisibleShifts(shifts) {

    const visibleStationIds =
        new Set(
            PaymentsState.stations.map(
                station =>
                    String(
                        station.stationId
                    )
            )
        );


    return shifts.filter(shift => {

        if (!shift.stationId) {

            return true;
        }


        return visibleStationIds.has(
            String(shift.stationId)
        );

    });
}


/* =========================================================
   GET VISIBLE PAYMENTS
========================================================= */

function getVisiblePayments(payments) {

    const visibleStationIds =
        new Set(
            PaymentsState.stations.map(
                station =>
                    String(
                        station.stationId
                    )
            )
        );


    return payments.filter(payment => {

        if (!payment.stationId) {

            return true;
        }


        return visibleStationIds.has(
            String(payment.stationId)
        );

    });
}


/* =========================================================
   BACKEND PAYMENT FILTERS
========================================================= */

function getBackendPaymentFilters() {

    const filters = {};


    if (
        PaymentsState.currentFilters.stationId
    ) {

        filters.station_id =
            PaymentsState.currentFilters.stationId;
    }


    if (
        PaymentsState.currentFilters.shiftId
    ) {

        filters.shift_id =
            PaymentsState.currentFilters.shiftId;
    }


    if (
        PaymentsState.currentFilters.paymentMethod
    ) {

        filters.payment_method =
            PaymentsState.currentFilters.paymentMethod;
    }


    if (
        PaymentsState.currentFilters.date
    ) {

        filters.date =
            PaymentsState.currentFilters.date;
    }


    return filters;
}


/* =========================================================
   APPLY FILTERS
========================================================= */

function applyPaymentFilters() {

    let payments =
        [...PaymentsState.payments];


    const {
        search,
        stationId,
        shiftId,
        paymentMethod,
        date
    } =
        PaymentsState.currentFilters;


    if (stationId) {

        payments =
            payments.filter(
                payment =>
                    String(
                        payment.stationId
                    ) === String(stationId)
            );
    }


    if (shiftId) {

        payments =
            payments.filter(
                payment =>
                    String(
                        payment.shiftId
                    ) === String(shiftId)
            );
    }


    if (paymentMethod) {

        payments =
            payments.filter(
                payment =>
                    String(
                        payment.paymentMethod
                    ).toLowerCase() ===
                    String(
                        paymentMethod
                    ).toLowerCase()
            );
    }


    if (date) {

        payments =
            payments.filter(
                payment => {

                    if (!payment.createdAt) {

                        return false;
                    }


                    return (
                        formatDateInput(
                            payment.createdAt
                        ) === date
                    );

                }
            );
    }


    if (search) {

        const query =
            search.toLowerCase();


        payments =
            payments.filter(payment => {

                const sale =
                    findSale(
                        payment.saleId
                    );


                const station =
                    findStation(
                        payment.stationId
                    );


                const shift =
                    findShift(
                        payment.shiftId
                    );


                return [

                    payment.paymentId,

                    payment.saleId,

                    payment.reference,

                    payment.paymentMethod,

                    station?.name,

                    station?.city,

                    shift?.name,

                    sale?.saleId

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()
                    .includes(query);

            });
    }


    PaymentsState.filteredPayments =
        payments;
}


/* =========================================================
   RENDER PAYMENTS PAGE
========================================================= */

function renderPaymentsPage() {

    const page =
        document.getElementById(
            "pageContent"
        );


    if (!page) {

        console.error(
            "pageContent element not found."
        );

        return;
    }


    page.innerHTML = `

        <section class="payments-page">

            <div class="payments-hero">

                <div>

                    <div class="payments-eyebrow">
                        FINANCIAL CONTROL
                    </div>

                    <h1>
                        Payment Management
                    </h1>

                    <p>
                        Record, monitor and reconcile
                        payments across your fuel stations.
                    </p>

                </div>


                <div class="payments-hero-actions">

                    <button
                        type="button"
                        class="fg-btn fg-btn-secondary"
                        id="refreshPaymentsBtn"
                    >
                        ↻ Refresh
                    </button>


                    <button
                        type="button"
                        class="fg-btn fg-btn-primary"
                        id="openPaymentModalBtn"
                    >
                        + Record Payment
                    </button>

                </div>

            </div>


            <div
                id="paymentGlobalMessage"
                class="payment-global-message"
                style="display:none;"
            ></div>


            <div
                class="payment-stats"
                id="paymentStats"
            ></div>


            <div class="payment-insight">

                <div class="payment-insight-icon">
                    ₦
                </div>


                <div>

                    <strong>
                        Payment Control
                    </strong>

                    <span>
                        Every payment is linked to a sale,
                        station and shift for proper
                        reconciliation.
                    </span>

                </div>

            </div>


            <div class="payment-card">

                <div class="payment-card-header">

                    <div>

                        <h2>
                            Payment Records
                        </h2>

                        <p>
                            Search and filter recorded payments.
                        </p>

                    </div>


                    <button
                        type="button"
                        class="fg-btn fg-btn-outline"
                        id="exportPaymentsBtn"
                    >
                        Export CSV
                    </button>

                </div>


                <div class="payment-filters">

                    <div class="payment-filter-group">

                        <label>
                            Search
                        </label>

                        <input
                            type="search"
                            id="paymentSearch"
                            placeholder="Search sale, reference..."
                        >

                    </div>


                    <div class="payment-filter-group">

                        <label>
                            Station
                        </label>

                        <select id="paymentStationFilter">

                            <option value="">
                                All Stations
                            </option>

                        </select>

                    </div>


                    <div class="payment-filter-group">

                        <label>
                            Shift
                        </label>

                        <select id="paymentShiftFilter">

                            <option value="">
                                All Shifts
                            </option>

                        </select>

                    </div>


                    <div class="payment-filter-group">

                        <label>
                            Method
                        </label>

                        <select id="paymentMethodFilter">

                            <option value="">
                                All Methods
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

                            <option value="card">
                                Card
                            </option>

                            <option value="credit">
                                Credit
                            </option>

                        </select>

                    </div>


                    <div class="payment-filter-group">

                        <label>
                            Date
                        </label>

                        <input
                            type="date"
                            id="paymentDateFilter"
                        >

                    </div>


                    <div class="payment-filter-actions">

                        <button
                            type="button"
                            class="fg-btn fg-btn-light"
                            id="clearPaymentFiltersBtn"
                        >
                            Clear
                        </button>

                    </div>

                </div>


                <div
                    class="payment-table-wrapper"
                    id="paymentTableWrapper"
                >

                    <table class="payment-table">

                        <thead>

                            <tr>

                                <th>
                                    Sale
                                </th>

                                <th>
                                    Station
                                </th>

                                <th>
                                    Shift
                                </th>

                                <th>
                                    Method
                                </th>

                                <th>
                                    Amount
                                </th>

                                <th>
                                    Recorded By
                                </th>

                                <th>
                                    Date & Time
                                </th>

                                <th>
                                    Action
                                </th>

                            </tr>

                        </thead>


                        <tbody id="paymentsTableBody">
                        </tbody>

                    </table>

                </div>


                <div
                    id="paymentEmptyState"
                    class="payment-empty-state"
                    style="display:none;"
                >

                    <div class="payment-empty-icon">
                        ₦
                    </div>

                    <h3>
                        No payment records
                    </h3>

                    <p>
                        Payment records will appear here
                        after you record a payment.
                    </p>

                </div>

            </div>

        </section>


        <!-- PAYMENT MODAL -->

        <div
            class="fg-modal-overlay"
            id="paymentModal"
            style="display:none;"
        >

            <div class="fg-modal">

                <div class="fg-modal-header">

                    <div>

                        <span class="modal-eyebrow">
                            PAYMENT ENTRY
                        </span>

                        <h2>
                            Record Payment
                        </h2>

                    </div>


                    <button
                        type="button"
                        class="modal-close"
                        id="closePaymentModalBtn"
                    >
                        ×
                    </button>

                </div>


                <form
                    id="paymentForm"
                    class="payment-form"
                >

                    <div class="payment-form-grid">


                        <div class="form-group">

                            <label for="paymentStation">
                                Station
                            </label>

                            <select
                                id="paymentStation"
                                required
                            >

                                <option value="">
                                    Select station
                                </option>

                            </select>

                        </div>


                        <div class="form-group">

                            <label for="paymentShift">
                                Shift
                            </label>

                            <select
                                id="paymentShift"
                                required
                            >

                                <option value="">
                                    Select shift
                                </option>

                            </select>

                        </div>


                        <div class="form-group full-width">

                            <label for="paymentSale">
                                Sale
                            </label>

                            <select
                                id="paymentSale"
                                required
                            >

                                <option value="">
                                    Select sale
                                </option>

                            </select>

                        </div>


                        <div class="form-group">

                            <label>
                                Sale Amount
                            </label>

                            <input
                                type="text"
                                id="paymentSaleAmount"
                                readonly
                                placeholder="₦0.00"
                            >

                        </div>


                        <div class="form-group">

                            <label for="paymentAmount">
                                Payment Amount
                            </label>

                            <input
                                type="number"
                                id="paymentAmount"
                                min="0.01"
                                step="0.01"
                                required
                                placeholder="Enter amount"
                            >

                        </div>


                        <div class="form-group">

                            <label for="paymentMethod">
                                Payment Method
                            </label>

                            <select
                                id="paymentMethod"
                                required
                            >

                                <option value="">
                                    Select method
                                </option>

                                <option value="cash">
                                    Cash
                                </option>

                                <option value="pos">
                                    POS
                                </option>

                                <option value="transfer">
                                    Bank Transfer
                                </option>

                                <option value="card">
                                    Card
                                </option>

                                <option value="credit">
                                    Credit
                                </option>

                            </select>

                        </div>


                        <div class="form-group">

                            <label for="paymentReference">
                                Reference
                            </label>

                            <input
                                type="text"
                                id="paymentReference"
                                placeholder="POS / transfer reference"
                            >

                        </div>


                        <div class="form-group full-width">

                            <label for="paymentNotes">
                                Notes
                            </label>

                            <textarea
                                id="paymentNotes"
                                rows="3"
                                placeholder="Optional payment notes..."
                            ></textarea>

                        </div>


                        <div
                            id="paymentFormMessage"
                            class="payment-form-message full-width"
                            style="display:none;"
                        ></div>

                    </div>


                    <div class="payment-form-footer">

                        <button
                            type="button"
                            class="fg-btn fg-btn-light"
                            id="cancelPaymentBtn"
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            class="fg-btn fg-btn-primary"
                            id="submitPaymentBtn"
                        >
                            Record Payment
                        </button>

                    </div>

                </form>

            </div>

        </div>
    `;


    injectPaymentStyles();
}


/* =========================================================
   SETUP EVENTS
========================================================= */

function setupPaymentEvents() {

    const refreshBtn =
        document.getElementById(
            "refreshPaymentsBtn"
        );


    if (refreshBtn) {

        refreshBtn.addEventListener(
            "click",
            async () => {

                await loadPaymentData();

            }
        );
    }


    const openBtn =
        document.getElementById(
            "openPaymentModalBtn"
        );


    if (openBtn) {

        openBtn.addEventListener(
            "click",
            openPaymentModal
        );
    }


    const closeBtn =
        document.getElementById(
            "closePaymentModalBtn"
        );


    if (closeBtn) {

        closeBtn.addEventListener(
            "click",
            closePaymentModal
        );
    }


    const cancelBtn =
        document.getElementById(
            "cancelPaymentBtn"
        );


    if (cancelBtn) {

        cancelBtn.addEventListener(
            "click",
            closePaymentModal
        );
    }


    const modal =
        document.getElementById(
            "paymentModal"
        );


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    closePaymentModal();
                }

            }
        );
    }


    const form =
        document.getElementById(
            "paymentForm"
        );


    if (form) {

        form.addEventListener(
            "submit",
            handlePaymentSubmit
        );
    }


    const stationFilter =
        document.getElementById(
            "paymentStationFilter"
        );


    if (stationFilter) {

        stationFilter.addEventListener(
            "change",
            event => {

                PaymentsState.currentFilters.stationId =
                    event.target.value;

                applyPaymentFilters();

                renderPaymentsTable();

                renderPaymentStats();

            }
        );
    }


    const shiftFilter =
        document.getElementById(
            "paymentShiftFilter"
        );


    if (shiftFilter) {

        shiftFilter.addEventListener(
            "change",
            event => {

                PaymentsState.currentFilters.shiftId =
                    event.target.value;

                applyPaymentFilters();

                renderPaymentsTable();

                renderPaymentStats();

            }
        );
    }


    const methodFilter =
        document.getElementById(
            "paymentMethodFilter"
        );


    if (methodFilter) {

        methodFilter.addEventListener(
            "change",
            event => {

                PaymentsState.currentFilters.paymentMethod =
                    event.target.value;

                applyPaymentFilters();

                renderPaymentsTable();

                renderPaymentStats();

            }
        );
    }


    const dateFilter =
        document.getElementById(
            "paymentDateFilter"
        );


    if (dateFilter) {

        dateFilter.addEventListener(
            "change",
            event => {

                PaymentsState.currentFilters.date =
                    event.target.value;

                applyPaymentFilters();

                renderPaymentsTable();

                renderPaymentStats();

            }
        );
    }


    const searchInput =
        document.getElementById(
            "paymentSearch"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            event => {

                PaymentsState.currentFilters.search =
                    event.target.value.trim();

                applyPaymentFilters();

                renderPaymentsTable();

                renderPaymentStats();

            }
        );
    }


    const clearBtn =
        document.getElementById(
            "clearPaymentFiltersBtn"
        );


    if (clearBtn) {

        clearBtn.addEventListener(
            "click",
            clearPaymentFilters
        );
    }


    const exportBtn =
        document.getElementById(
            "exportPaymentsBtn"
        );


    if (exportBtn) {

        exportBtn.addEventListener(
            "click",
            exportPaymentsCSV
        );
    }


    const paymentStation =
        document.getElementById(
            "paymentStation"
        );


    if (paymentStation) {

        paymentStation.addEventListener(
            "change",
            event => {

                updatePaymentFormShifts(
                    event.target.value
                );

                updatePaymentFormSales();

            }
        );
    }


    const paymentShift =
        document.getElementById(
            "paymentShift"
        );


    if (paymentShift) {

        paymentShift.addEventListener(
            "change",
            updatePaymentFormSales
        );
    }


    const paymentSale =
        document.getElementById(
            "paymentSale"
        );


    if (paymentSale) {

        paymentSale.addEventListener(
            "change",
            updateSelectedSale
        );
    }
}


/* =========================================================
   PAYMENT FILTERS
========================================================= */

function populatePaymentFilters() {

    const stationFilter =
        document.getElementById(
            "paymentStationFilter"
        );


    if (stationFilter) {

        stationFilter.innerHTML = `

            <option value="">
                All Stations
            </option>

            ${PaymentsState.stations
                .map(
                    station => `
                        <option
                            value="${escapeHtml(
                                station.stationId
                            )}"
                        >
                            ${escapeHtml(
                                station.name
                            )}
                        </option>
                    `
                )
                .join("")}
        `;


        stationFilter.value =
            PaymentsState.currentFilters.stationId;
    }


    const shiftFilter =
        document.getElementById(
            "paymentShiftFilter"
        );


    if (shiftFilter) {

        shiftFilter.innerHTML = `

            <option value="">
                All Shifts
            </option>

            ${PaymentsState.shifts
                .map(
                    shift => `
                        <option
                            value="${escapeHtml(
                                shift.shiftId
                            )}"
                        >
                            ${escapeHtml(
                                shift.name
                            )}
                        </option>
                    `
                )
                .join("")}
        `;


        shiftFilter.value =
            PaymentsState.currentFilters.shiftId;
    }


    const methodFilter =
        document.getElementById(
            "paymentMethodFilter"
        );


    if (methodFilter) {

        methodFilter.value =
            PaymentsState.currentFilters.paymentMethod;
    }


    const dateFilter =
        document.getElementById(
            "paymentDateFilter"
        );


    if (dateFilter) {

        dateFilter.value =
            PaymentsState.currentFilters.date;
    }
}


/* =========================================================
   PAYMENT FORM STATIONS
========================================================= */

function populatePaymentFormStations() {

    const select =
        document.getElementById(
            "paymentStation"
        );


    if (!select) {
        return;
    }


    select.innerHTML = `

        <option value="">
            Select station
        </option>

        ${PaymentsState.stations
            .map(
                station => `
                    <option
                        value="${escapeHtml(
                            station.stationId
                        )}"
                    >
                        ${escapeHtml(
                            station.name
                        )}
                    </option>
                `
            )
            .join("")}
    `;
}


/* =========================================================
   PAYMENT FORM SHIFTS
========================================================= */

function updatePaymentFormShifts(
    stationId
) {

    const shiftSelect =
        document.getElementById(
            "paymentShift"
        );


    if (!shiftSelect) {
        return;
    }


    const shifts =
        PaymentsState.shifts.filter(
            shift =>
                !stationId ||
                String(
                    shift.stationId
                ) === String(stationId)
        );


    shiftSelect.innerHTML = `

        <option value="">
            Select shift
        </option>

        ${shifts
            .map(
                shift => `
                    <option
                        value="${escapeHtml(
                            shift.shiftId
                        )}"
                    >
                        ${escapeHtml(
                            shift.name
                        )}
                    </option>
                `
            )
            .join("")}
    `;
}


/* =========================================================
   PAYMENT FORM SALES
========================================================= */

function populatePaymentFormSales() {

    updatePaymentFormSales();
}


function updatePaymentFormSales() {

    const saleSelect =
        document.getElementById(
            "paymentSale"
        );


    if (!saleSelect) {
        return;
    }


    const stationId =
        document.getElementById(
            "paymentStation"
        )?.value || "";


    const shiftId =
        document.getElementById(
            "paymentShift"
        )?.value || "";


    const sales =
        PaymentsState.sales.filter(
            sale => {

                if (
                    stationId &&
                    String(
                        sale.stationId
                    ) !== String(stationId)
                ) {

                    return false;
                }


                if (
                    shiftId &&
                    String(
                        sale.shiftId
                    ) !== String(shiftId)
                ) {

                    return false;
                }


                return true;

            }
        );


    saleSelect.innerHTML = `

        <option value="">
            Select sale
        </option>

        ${sales
            .map(
                sale => `
                    <option
                        value="${escapeHtml(
                            sale.saleId
                        )}"
                    >
                        ${escapeHtml(
                            sale.saleId
                        )}
                        —
                        ${formatCurrency(
                            sale.amount
                        )}
                    </option>
                `
            )
            .join("")}
    `;


    updateSelectedSale();
}


/* =========================================================
   SELECTED SALE
========================================================= */

function updateSelectedSale() {

    const saleId =
        document.getElementById(
            "paymentSale"
        )?.value;


    const saleAmount =
        document.getElementById(
            "paymentSaleAmount"
        );


    if (!saleAmount) {
        return;
    }


    const sale =
        findSale(saleId);


    if (!sale) {

        saleAmount.value =
            "₦0.00";

        return;
    }


    saleAmount.value =
        formatCurrency(
            sale.amount
        );


    const stationSelect =
        document.getElementById(
            "paymentStation"
        );


    const shiftSelect =
        document.getElementById(
            "paymentShift"
        );


    if (stationSelect) {

        stationSelect.value =
            sale.stationId || "";

        updatePaymentFormShifts(
            sale.stationId
        );
    }


    if (shiftSelect) {

        shiftSelect.value =
            sale.shiftId || "";
    }


    const amountInput =
        document.getElementById(
            "paymentAmount"
        );


    if (
        amountInput &&
        !amountInput.value
    ) {

        amountInput.value =
            sale.amount || "";
    }
}


/* =========================================================
   OPEN MODAL
========================================================= */

function openPaymentModal() {

    const modal =
        document.getElementById(
            "paymentModal"
        );


    if (!modal) {
        return;
    }


    resetPaymentForm();


    populatePaymentFormStations();


    modal.style.display =
        "flex";


    document.body.classList.add(
        "modal-open"
    );
}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closePaymentModal() {

    const modal =
        document.getElementById(
            "paymentModal"
        );


    if (!modal) {
        return;
    }


    modal.style.display =
        "none";


    document.body.classList.remove(
        "modal-open"
    );


    resetPaymentForm();
}


/* =========================================================
   RESET FORM
========================================================= */

function resetPaymentForm() {

    const form =
        document.getElementById(
            "paymentForm"
        );


    if (form) {

        form.reset();
    }


    const saleAmount =
        document.getElementById(
            "paymentSaleAmount"
        );


    if (saleAmount) {

        saleAmount.value =
            "₦0.00";
    }


    const shiftSelect =
        document.getElementById(
            "paymentShift"
        );


    if (shiftSelect) {

        shiftSelect.innerHTML = `

            <option value="">
                Select shift
            </option>

        `;
    }


    hidePaymentFormMessage();
}


/* =========================================================
   CREATE PAYMENT
========================================================= */

async function handlePaymentSubmit(
    event
) {

    event.preventDefault();


    if (PaymentsState.isSubmitting) {
        return;
    }


    const stationId =
        document.getElementById(
            "paymentStation"
        )?.value;


    const shiftId =
        document.getElementById(
            "paymentShift"
        )?.value;


    const saleId =
        document.getElementById(
            "paymentSale"
        )?.value;


    const amount =
        Number(
            document.getElementById(
                "paymentAmount"
            )?.value
        );


    const paymentMethod =
        document.getElementById(
            "paymentMethod"
        )?.value;


    const reference =
        document.getElementById(
            "paymentReference"
        )?.value.trim();


    const notes =
        document.getElementById(
            "paymentNotes"
        )?.value.trim();


    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!stationId) {

        showPaymentFormMessage(
            "Please select a station.",
            "error"
        );

        return;
    }


    if (!shiftId) {

        showPaymentFormMessage(
            "Please select a shift.",
            "error"
        );

        return;
    }


    if (!saleId) {

        showPaymentFormMessage(
            "Please select a sale.",
            "error"
        );

        return;
    }


    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        showPaymentFormMessage(
            "Payment amount must be greater than zero.",
            "error"
        );

        return;
    }


    if (!paymentMethod) {

        showPaymentFormMessage(
            "Please select a payment method.",
            "error"
        );

        return;
    }


    const sale =
        findSale(saleId);


    if (!sale) {

        showPaymentFormMessage(
            "Selected sale could not be found.",
            "error"
        );

        return;
    }


    if (
        String(sale.stationId) !==
        String(stationId)
    ) {

        showPaymentFormMessage(
            "Selected station does not match the sale.",
            "error"
        );

        return;
    }


    if (
        String(sale.shiftId) !==
        String(shiftId)
    ) {

        showPaymentFormMessage(
            "Selected shift does not match the sale.",
            "error"
        );

        return;
    }


    /* =====================================================
       SUBMIT
    ===================================================== */

    try {

        PaymentsState.isSubmitting =
            true;


        setPaymentSubmitLoading(
            true
        );


        hidePaymentFormMessage();


        const paymentData = {

            sale_id:
                saleId,

            station_id:
                stationId,

            shift_id:
                shiftId,

            amount:
                amount,

            payment_method:
                paymentMethod,

            reference:
                reference || null,

            notes:
                notes || null
        };


        console.log(
            "Creating payment:",
            paymentData
        );


        const response =
            await FuelGapAPI.createPayment(
                paymentData
            );


        console.log(
            "Payment created:",
            response
        );


        showGlobalPaymentMessage(
            "Payment recorded successfully.",
            "success"
        );


        closePaymentModal();


        await loadPaymentData();


    } catch (error) {

        console.error(
            "CREATE PAYMENT ERROR:",
            error
        );


        showPaymentFormMessage(
            error.message ||
            "Failed to record payment.",
            "error"
        );


    } finally {

        PaymentsState.isSubmitting =
            false;


        setPaymentSubmitLoading(
            false
        );
    }
}


/* =========================================================
   DELETE PAYMENT
========================================================= */

async function deletePayment(
    paymentId
) {

    if (!paymentId) {
        return;
    }


    if (
        !confirm(
            "Are you sure you want to delete this payment?"
        )
    ) {

        return;
    }


    if (PaymentsState.isDeleting) {
        return;
    }


    try {

        PaymentsState.isDeleting =
            true;


        await FuelGapAPI.deletePayment(
            paymentId
        );


        showGlobalPaymentMessage(
            "Payment deleted successfully.",
            "success"
        );


        await loadPaymentData();


    } catch (error) {

        console.error(
            "DELETE PAYMENT ERROR:",
            error
        );


        showGlobalPaymentMessage(
            error.message ||
            "Failed to delete payment.",
            "error"
        );


    } finally {

        PaymentsState.isDeleting =
            false;
    }
}


/* =========================================================
   PAYMENT STATISTICS
========================================================= */

function renderPaymentStats() {

    const container =
        document.getElementById(
            "paymentStats"
        );


    if (!container) {
        return;
    }


    const payments =
        PaymentsState.filteredPayments;


    const totalAmount =
        payments.reduce(
            (
                total,
                payment
            ) =>
                total +
                Number(
                    payment.amount || 0
                ),
            0
        );


    const cash =
        payments
            .filter(
                payment =>
                    payment.paymentMethod ===
                    "cash"
            )
            .reduce(
                (
                    total,
                    payment
                ) =>
                    total +
                    Number(
                        payment.amount || 0
                    ),
                0
            );


    const pos =
        payments
            .filter(
                payment =>
                    payment.paymentMethod ===
                    "pos"
            )
            .reduce(
                (
                    total,
                    payment
                ) =>
                    total +
                    Number(
                        payment.amount || 0
                    ),
                0
            );


    const transfer =
        payments
            .filter(
                payment =>
                    payment.paymentMethod ===
                    "transfer"
            )
            .reduce(
                (
                    total,
                    payment
                ) =>
                    total +
                    Number(
                        payment.amount || 0
                    ),
                0
            );


    container.innerHTML = `

        <div class="payment-stat-card">

            <div class="payment-stat-icon">
                ₦
            </div>

            <div>

                <span>
                    Total Payments
                </span>

                <strong>
                    ${formatCurrency(
                        totalAmount
                    )}
                </strong>

            </div>

        </div>


        <div class="payment-stat-card">

            <div class="payment-stat-icon">
                #
            </div>

            <div>

                <span>
                    Transactions
                </span>

                <strong>
                    ${payments.length}
                </strong>

            </div>

        </div>


        <div class="payment-stat-card">

            <div class="payment-stat-icon">
                C
            </div>

            <div>

                <span>
                    Cash
                </span>

                <strong>
                    ${formatCurrency(
                        cash
                    )}
                </strong>

            </div>

        </div>


        <div class="payment-stat-card">

            <div class="payment-stat-icon">
                P
            </div>

            <div>

                <span>
                    POS
                </span>

                <strong>
                    ${formatCurrency(
                        pos
                    )}
                </strong>

            </div>

        </div>


        <div class="payment-stat-card">

            <div class="payment-stat-icon">
                T
            </div>

            <div>

                <span>
                    Transfer
                </span>

                <strong>
                    ${formatCurrency(
                        transfer
                    )}
                </strong>

            </div>

        </div>
    `;
}


/* =========================================================
   PAYMENT TABLE
========================================================= */

function renderPaymentsTable() {

    const tbody =
        document.getElementById(
            "paymentsTableBody"
        );


    const emptyState =
        document.getElementById(
            "paymentEmptyState"
        );


    const tableWrapper =
        document.getElementById(
            "paymentTableWrapper"
        );


    if (!tbody) {
        return;
    }


    const payments =
        PaymentsState.filteredPayments;


    if (!payments.length) {

        tbody.innerHTML = "";


        if (emptyState) {

            emptyState.style.display =
                "block";
        }


        if (tableWrapper) {

            tableWrapper.style.display =
                "none";
        }


        return;
    }


    if (emptyState) {

        emptyState.style.display =
            "none";
    }


    if (tableWrapper) {

        tableWrapper.style.display =
            "block";
    }


    tbody.innerHTML =
        payments
            .map(
                payment =>
                    renderPaymentRow(
                        payment
                    )
            )
            .join("");


    tbody
        .querySelectorAll(
            "[data-delete-payment]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deletePayment(
                        button.dataset
                            .deletePayment
                    );

                }
            );

        });
}


/* =========================================================
   PAYMENT TABLE ROW
========================================================= */

function renderPaymentRow(
    payment
) {

    const sale =
        findSale(
            payment.saleId
        );


    const station =
        findStation(
            payment.stationId
        );


    const shift =
        findShift(
            payment.shiftId
        );


    return `

        <tr>

            <td>

                <div class="payment-sale-cell">

                    <strong>
                        ${escapeHtml(
                            payment.saleId ||
                            "N/A"
                        )}
                    </strong>

                    ${
                        sale
                            ? `
                                <small>
                                    ${formatNumber(
                                        sale.litres
                                    )}
                                    L
                                </small>
                            `
                            : ""
                    }

                </div>

            </td>


            <td>

                <div class="payment-station-cell">

                    <strong>
                        ${escapeHtml(
                            station?.name ||
                            "Unknown Station"
                        )}
                    </strong>

                    ${
                        station?.city
                            ? `
                                <small>
                                    ${escapeHtml(
                                        station.city
                                    )}
                                </small>
                            `
                            : ""
                    }

                </div>

            </td>


            <td>

                <span class="payment-shift-badge">

                    ${escapeHtml(
                        shift?.name ||
                        "Unknown Shift"
                    )}

                </span>

            </td>


            <td>

                <span
                    class="
                        payment-method-badge
                        method-${escapeHtml(
                            payment.paymentMethod
                        )}
                    "
                >

                    ${paymentIcon(
                        payment.paymentMethod
                    )}

                    ${escapeHtml(
                        formatPaymentMethod(
                            payment.paymentMethod
                        )
                    )}

                </span>

            </td>


            <td>

                <strong class="payment-amount">

                    ${formatCurrency(
                        payment.amount
                    )}

                </strong>

            </td>


            <td>

                <span class="payment-recorded-by">

                    ${escapeHtml(
                        getRecordedByName(
                            payment.recordedBy
                        )
                    )}

                </span>

            </td>


            <td>

                <div class="payment-date-cell">

                    <strong>
                        ${formatDate(
                            payment.createdAt
                        )}
                    </strong>

                    <small>
                        ${formatTime(
                            payment.createdAt
                        )}
                    </small>

                </div>

            </td>


            <td>

                <button
                    type="button"
                    class="payment-delete-btn"
                    data-delete-payment="${escapeHtml(
                        payment.paymentId
                    )}"
                >
                    Delete
                </button>

            </td>

        </tr>
    `;
}


/* =========================================================
   FIND STATION
========================================================= */

function findStation(
    stationId
) {

    if (!stationId) {
        return null;
    }


    return PaymentsState.stations.find(
        station =>
            String(
                station.stationId
            ) === String(stationId)
    ) || null;
}


/* =========================================================
   FIND SHIFT
========================================================= */

function findShift(
    shiftId
) {

    if (!shiftId) {
        return null;
    }


    return PaymentsState.shifts.find(
        shift =>
            String(
                shift.shiftId
            ) === String(shiftId)
    ) || null;
}


/* =========================================================
   FIND SALE
========================================================= */

function findSale(
    saleId
) {

    if (!saleId) {
        return null;
    }


    return PaymentsState.sales.find(
        sale =>
            String(
                sale.saleId
            ) === String(saleId)
    ) || null;
}


/* =========================================================
   RECORDED BY
========================================================= */

function getRecordedByName(
    recordedBy
) {

    if (!recordedBy) {

        return "User";
    }


    const user =
        PaymentsState.currentUser || {};


    const currentUserId =
        user.id ||
        user.user_id;


    if (
        currentUserId &&
        String(
            currentUserId
        ) === String(recordedBy)
    ) {

        return (
            user.full_name ||
            user.fullName ||
            user.name ||
            user.email ||
            "Current User"
        );
    }


    return "User";
}


/* =========================================================
   CLEAR FILTERS
========================================================= */

function clearPaymentFilters() {

    PaymentsState.currentFilters = {

        search: "",

        stationId: "",

        shiftId: "",

        paymentMethod: "",

        date: ""
    };


    const search =
        document.getElementById(
            "paymentSearch"
        );


    const station =
        document.getElementById(
            "paymentStationFilter"
        );


    const shift =
        document.getElementById(
            "paymentShiftFilter"
        );


    const method =
        document.getElementById(
            "paymentMethodFilter"
        );


    const date =
        document.getElementById(
            "paymentDateFilter"
        );


    if (search) {
        search.value = "";
    }


    if (station) {
        station.value = "";
    }


    if (shift) {
        shift.value = "";
    }


    if (method) {
        method.value = "";
    }


    if (date) {
        date.value = "";
    }


    applyPaymentFilters();

    renderPaymentStats();

    renderPaymentsTable();
}


/* =========================================================
   EXPORT CSV
========================================================= */

function exportPaymentsCSV() {

    const payments =
        PaymentsState.filteredPayments;


    if (!payments.length) {

        showGlobalPaymentMessage(
            "There are no payment records to export.",
            "error"
        );

        return;
    }


    const headers = [

        "Payment ID",

        "Sale ID",

        "Station",

        "Shift",

        "Payment Method",

        "Amount",

        "Recorded By",

        "Reference",

        "Notes",

        "Created At"
    ];


    const rows =
        payments.map(
            payment => {

                const station =
                    findStation(
                        payment.stationId
                    );


                const shift =
                    findShift(
                        payment.shiftId
                    );


                return [

                    payment.paymentId,

                    payment.saleId,

                    station?.name ||
                    "",

                    shift?.name ||
                    "",

                    payment.paymentMethod,

                    payment.amount,

                    getRecordedByName(
                        payment.recordedBy
                    ),

                    payment.reference,

                    payment.notes,

                    payment.createdAt

                ];
            }
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
                                value ?? ""
                            )
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


    link.href = url;


    link.download =
        `fuelgap-payments-${formatDateInput(
            new Date()
        )}.csv`;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );
}


/* =========================================================
   LOADING
========================================================= */

function setPaymentLoading(
    loading
) {

    const wrapper =
        document.getElementById(
            "paymentTableWrapper"
        );


    if (!wrapper) {
        return;
    }


    if (loading) {

        wrapper.classList.add(
            "payment-loading"
        );

    } else {

        wrapper.classList.remove(
            "payment-loading"
        );
    }
}


/* =========================================================
   SUBMIT BUTTON LOADING
========================================================= */

function setPaymentSubmitLoading(
    loading
) {

    const button =
        document.getElementById(
            "submitPaymentBtn"
        );


    if (!button) {
        return;
    }


    button.disabled =
        loading;


    button.textContent =
        loading
            ? "Recording..."
            : "Record Payment";
}


/* =========================================================
   FORM MESSAGE
========================================================= */

function showPaymentFormMessage(
    message,
    type = "error"
) {

    const element =
        document.getElementById(
            "paymentFormMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        `payment-form-message ${type}`;


    element.style.display =
        "block";
}


function hidePaymentFormMessage() {

    const element =
        document.getElementById(
            "paymentFormMessage"
        );


    if (!element) {
        return;
    }


    element.style.display =
        "none";
}


/* =========================================================
   GLOBAL MESSAGE
========================================================= */

function showGlobalPaymentMessage(
    message,
    type = "success"
) {

    const element =
        document.getElementById(
            "paymentGlobalMessage"
        );


    if (!element) {

        console.log(message);

        return;
    }


    element.textContent =
        message;


    element.className =
        `payment-global-message ${type}`;


    element.style.display =
        "block";


    setTimeout(
        () => {

            element.style.display =
                "none";

        },
        4000
    );
}


/* =========================================================
   GLOBAL ERROR
========================================================= */

function showGlobalPaymentError(
    message
) {

    const element =
        document.getElementById(
            "paymentGlobalMessage"
        );


    if (!element) {

        console.error(
            message
        );

        return;
    }


    element.textContent =
        message;


    element.className =
        "payment-global-message error";


    element.style.display =
        "block";
}


/* =========================================================
   PAYMENT METHOD
========================================================= */

function formatPaymentMethod(
    method
) {

    const methods = {

        cash: "Cash",

        pos: "POS",

        transfer: "Transfer",

        card: "Card",

        credit: "Credit"
    };


    return (
        methods[
            String(method)
                .toLowerCase()
        ] ||
        method ||
        "Unknown"
    );
}


/* =========================================================
   PAYMENT ICON
========================================================= */

function paymentIcon(
    method
) {

    const icons = {

        cash: "₦",

        pos: "P",

        transfer: "T",

        card: "C",

        credit: "CR"
    };


    return `
        <span class="payment-method-icon">
            ${
                icons[
                    String(method)
                        .toLowerCase()
                ] || "₦"
            }
        </span>
    `;
}


/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(
    amount
) {

    const numeric =
        Number(amount || 0);


    return new Intl.NumberFormat(
        "en-NG",
        {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ).format(
        numeric
    );
}


/* =========================================================
   NUMBER
========================================================= */

function formatNumber(
    value
) {

    return new Intl.NumberFormat(
        "en-NG",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ).format(
        Number(value || 0)
    );
}


/* =========================================================
   DATE
========================================================= */

function formatDate(
    value
) {

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


    return date.toLocaleDateString(
        "en-NG",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


/* =========================================================
   TIME
========================================================= */

function formatTime(
    value
) {

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


    return date.toLocaleTimeString(
        "en-NG",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/* =========================================================
   DATE INPUT
========================================================= */

function formatDateInput(
    value
) {

    const date =
        value instanceof Date
            ? value
            : new Date(value);


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


    return `${year}-${month}-${day}`;
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
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
   PAYMENT CSS
========================================================= */

function injectPaymentStyles() {

    if (
        document.getElementById(
            "fuelgapPaymentStyles"
        )
    ) {

        return;
    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "fuelgapPaymentStyles";


    style.textContent = `

        .payments-page {
            width: 100%;
            max-width: 1600px;
            margin: 0 auto;
            padding: 24px;
        }


        .payments-hero {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 24px;
            margin-bottom: 24px;
            padding: 28px;
            border-radius: 20px;
            background: linear-gradient(
                135deg,
                #ffffff,
                #fffbea
            );
            border: 1px solid #f0e6b0;
            box-shadow:
                0 10px 30px
                rgba(0,0,0,.06);
        }


        .payments-eyebrow {
            color: #9a7900;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 1.4px;
            margin-bottom: 8px;
        }


        .payments-hero h1 {
            margin: 0;
            font-size: 30px;
            font-weight: 800;
            color: #171717;
        }


        .payments-hero p {
            margin: 8px 0 0;
            color: #6d6d6d;
        }


        .payments-hero-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }


        .fg-btn {
            border: 0;
            border-radius: 10px;
            padding: 11px 16px;
            font-size: 13px;
            font-weight: 750;
            cursor: pointer;
            transition: .2s ease;
        }


        .fg-btn:hover {
            transform: translateY(-1px);
        }


        .fg-btn:disabled {
            opacity: .6;
            cursor: not-allowed;
            transform: none;
        }


        .fg-btn-primary {
            background: #f2c500;
            color: #171717;
        }


        .fg-btn-secondary {
            background: #171717;
            color: #ffffff;
        }


        .fg-btn-outline {
            background: #ffffff;
            color: #171717;
            border: 1px solid #dedede;
        }


        .fg-btn-light {
            background: #f5f5f5;
            color: #333333;
        }


        .payment-global-message {
            padding: 13px 16px;
            border-radius: 10px;
            margin-bottom: 18px;
            font-size: 14px;
            font-weight: 650;
        }


        .payment-global-message.success {
            background: #edf9ef;
            color: #217a36;
            border: 1px solid #c8e9ce;
        }


        .payment-global-message.error {
            background: #fff0f0;
            color: #a42828;
            border: 1px solid #efc7c7;
        }


        .payment-stats {
            display: grid;
            grid-template-columns:
                repeat(5, minmax(0, 1fr));
            gap: 16px;
            margin-bottom: 18px;
        }


        .payment-stat-card {
            display: flex;
            align-items: center;
            gap: 13px;
            padding: 20px;
            background: #ffffff;
            border: 1px solid #ececec;
            border-radius: 16px;
            box-shadow:
                0 7px 20px
                rgba(0,0,0,.045);
        }


        .payment-stat-icon {
            width: 42px;
            height: 42px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            border-radius: 12px;
            background: #fff5bf;
            color: #8c7000;
            font-weight: 900;
        }


        .payment-stat-card span {
            display: block;
            color: #777777;
            font-size: 12px;
            margin-bottom: 4px;
        }


        .payment-stat-card strong {
            display: block;
            color: #181818;
            font-size: 18px;
            font-weight: 800;
        }


        .payment-insight {
            display: flex;
            align-items: center;
            gap: 14px;
            margin-bottom: 18px;
            padding: 15px 18px;
            background: #fffbea;
            border: 1px solid #f2e7a9;
            border-radius: 14px;
        }


        .payment-insight-icon {
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f2c500;
            color: #171717;
            border-radius: 10px;
            font-weight: 900;
        }


        .payment-insight strong,
        .payment-insight span {
            display: block;
        }


        .payment-insight strong {
            font-size: 13px;
            color: #222;
        }


        .payment-insight span {
            margin-top: 3px;
            color: #777;
            font-size: 12px;
        }


        .payment-card {
            background: #ffffff;
            border: 1px solid #ececec;
            border-radius: 18px;
            overflow: hidden;
            box-shadow:
                0 8px 28px
                rgba(0,0,0,.045);
        }


        .payment-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 22px;
            border-bottom: 1px solid #eeeeee;
        }


        .payment-card-header h2 {
            margin: 0;
            font-size: 19px;
            color: #171717;
        }


        .payment-card-header p {
            margin: 5px 0 0;
            color: #777777;
            font-size: 13px;
        }


        .payment-filters {
            display: grid;
            grid-template-columns:
                1.5fr
                1fr
                1fr
                1fr
                1fr
                auto;
            gap: 12px;
            padding: 18px 22px;
            background: #fafafa;
            border-bottom: 1px solid #eeeeee;
        }


        .payment-filter-group label,
        .form-group label {
            display: block;
            margin-bottom: 7px;
            font-size: 12px;
            font-weight: 750;
            color: #404040;
        }


        .payment-filter-group input,
        .payment-filter-group select,
        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #dcdcdc;
            border-radius: 9px;
            background: #ffffff;
            padding: 11px 12px;
            color: #222222;
            outline: none;
            font: inherit;
        }


        .payment-filter-group input:focus,
        .payment-filter-group select:focus,
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            border-color: #d4ae00;
            box-shadow:
                0 0 0 3px
                rgba(242,197,0,.13);
        }


        .payment-filter-actions {
            display: flex;
            align-items: end;
        }


        .payment-table-wrapper {
            overflow-x: auto;
        }


        .payment-table {
            width: 100%;
            border-collapse: collapse;
            min-width: 1000px;
        }


        .payment-table th {
            padding: 13px 16px;
            text-align: left;
            background: #fafafa;
            border-bottom: 1px solid #e8e8e8;
            color: #666666;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: .6px;
        }


        .payment-table td {
            padding: 15px 16px;
            border-bottom: 1px solid #eeeeee;
            color: #333333;
            font-size: 13px;
            vertical-align: middle;
        }


        .payment-table tbody tr:hover {
            background: #fffdf1;
        }


        .payment-sale-cell strong,
        .payment-station-cell strong,
        .payment-date-cell strong {
            display: block;
        }


        .payment-sale-cell small,
        .payment-station-cell small,
        .payment-date-cell small {
            display: block;
            margin-top: 3px;
            color: #8a8a8a;
            font-size: 11px;
        }


        .payment-shift-badge {
            display: inline-flex;
            padding: 5px 8px;
            border-radius: 7px;
            background: #f4f4f4;
            color: #555;
            font-size: 11px;
            font-weight: 700;
        }


        .payment-method-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 9px;
            border-radius: 8px;
            background: #f7f7f7;
            font-size: 11px;
            font-weight: 750;
        }


        .payment-method-icon {
            font-weight: 900;
        }


        .method-cash {
            background: #eef9ef;
            color: #27743a;
        }


        .method-pos {
            background: #eef5ff;
            color: #285e9c;
        }


        .method-transfer {
            background: #fff7df;
            color: #806000;
        }


        .method-card {
            background: #f3efff;
            color: #6346a2;
        }


        .method-credit {
            background: #fff0f0;
            color: #9a3030;
        }


        .payment-amount {
            color: #1d1d1d;
            font-weight: 800;
        }


        .payment-recorded-by {
            color: #555;
            font-size: 12px;
        }


        .payment-delete-btn {
            border: 0;
            background: transparent;
            color: #b02a2a;
            font-size: 12px;
            font-weight: 750;
            cursor: pointer;
            padding: 7px;
        }


        .payment-delete-btn:hover {
            text-decoration: underline;
        }


        .payment-empty-state {
            text-align: center;
            padding: 70px 20px;
        }


        .payment-empty-icon {
            width: 54px;
            height: 54px;
            margin: 0 auto 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 15px;
            background: #fff5bf;
            color: #8d7100;
            font-size: 22px;
            font-weight: 900;
        }


        .payment-empty-state h3 {
            margin: 0 0 7px;
            color: #222;
        }


        .payment-empty-state p {
            margin: 0;
            color: #888;
            font-size: 13px;
        }


        .fg-modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(0,0,0,.58);
        }


        .fg-modal {
            width: 100%;
            max-width: 760px;
            max-height: 92vh;
            overflow-y: auto;
            background: #ffffff;
            border-radius: 18px;
            box-shadow:
                0 30px 80px
                rgba(0,0,0,.25);
        }


        .fg-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 22px;
            border-bottom: 1px solid #eeeeee;
        }


        .modal-eyebrow {
            display: block;
            margin-bottom: 6px;
            color: #a17f00;
            font-size: 10px;
            font-weight: 850;
            letter-spacing: 1.2px;
        }


        .fg-modal-header h2 {
            margin: 0;
            font-size: 21px;
        }


        .modal-close {
            width: 34px;
            height: 34px;
            border: 0;
            border-radius: 9px;
            background: #f5f5f5;
            color: #444;
            font-size: 22px;
            cursor: pointer;
        }


        .payment-form {
            padding: 22px;
        }


        .payment-form-grid {
            display: grid;
            grid-template-columns:
                repeat(2, minmax(0, 1fr));
            gap: 16px;
        }


        .full-width {
            grid-column: 1 / -1;
        }


        .payment-form-footer {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            padding-top: 20px;
            margin-top: 8px;
            border-top: 1px solid #eeeeee;
        }


        .payment-form-message {
            padding: 11px 13px;
            border-radius: 9px;
            font-size: 13px;
            font-weight: 650;
        }


        .payment-form-message.error {
            background: #fff0f0;
            color: #9d2929;
            border: 1px solid #ecc8c8;
        }


        .payment-form-message.success {
            background: #edf9ef;
            color: #28753a;
            border: 1px solid #c9e9cf;
        }


        .payment-loading {
            opacity: .6;
            pointer-events: none;
        }


        body.modal-open {
            overflow: hidden;
        }


        @media (max-width: 1200px) {

            .payment-stats {
                grid-template-columns:
                    repeat(3, minmax(0, 1fr));
            }


            .payment-filters {
                grid-template-columns:
                    repeat(3, minmax(0, 1fr));
            }

        }


        @media (max-width: 800px) {

            .payments-page {
                padding: 15px;
            }


            .payments-hero {
                flex-direction: column;
                align-items: flex-start;
            }


            .payment-stats {
                grid-template-columns:
                    repeat(2, minmax(0, 1fr));
            }


            .payment-filters {
                grid-template-columns:
                    1fr 1fr;
            }


            .payment-form-grid {
                grid-template-columns: 1fr;
            }


            .full-width {
                grid-column: auto;
            }

        }


        @media (max-width: 520px) {

            .payment-stats {
                grid-template-columns: 1fr;
            }


            .payment-filters {
                grid-template-columns: 1fr;
            }


            .payments-hero h1 {
                font-size: 24px;
            }


            .payments-hero-actions {
                width: 100%;
            }


            .payments-hero-actions .fg-btn {
                flex: 1;
            }


            .payment-card-header {
                flex-direction: column;
                align-items: flex-start;
            }


            .payment-form-footer {
                flex-direction: column-reverse;
            }


            .payment-form-footer .fg-btn {
                width: 100%;
            }

        }

    `;


    document.head.appendChild(
        style
    );
}


/* =========================================================
   GLOBAL DELETE FUNCTION
========================================================= */

window.deletePayment =
    deletePayment;