/* ==========================================
   FUELGAP - PAYMENTS MANAGEMENT
   PRO / PREMIUM UI VERSION
========================================== */


/* ==========================================
   STORAGE KEYS
========================================== */

const PAYMENTS_STORAGE_KEY =
    "fuelgap_payments";

const PAYMENT_STATIONS_STORAGE_KEY =
    "fuelgap_stations";

const PAYMENT_SHIFTS_STORAGE_KEY =
    "fuelgap_shifts";

const PAYMENT_STAFF_STORAGE_KEY =
    "fuelgap_staff";

const PAYMENT_READINGS_STORAGE_KEY =
    "fuelgap_meter_readings";

const PAYMENT_PUMPS_STORAGE_KEY =
    "fuelgap_pumps";

const PAYMENT_NOZZLES_STORAGE_KEY =
    "fuelgap_nozzles";


/* ==========================================
   PAGE LOAD
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    const currentUser =
        FuelGapUtils.getCurrentUser();

    if (!currentUser) {
        window.location.href = "../login.html";
        return;
    }

    if (
        !hasPermission(
            currentUser.role,
            "payments"
        )
    ) {
        window.location.href = "./dashboard.html";
        return;
    }

    setTimeout(() => {

        renderPaymentsPage();
        setupPaymentEvents();
        renderPayments();

    }, 0);

});


/* ==========================================
   SAFE STORAGE
========================================== */

function getStorageData(storageKey) {

    try {

        const data =
            localStorage.getItem(storageKey);

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


function saveStorageData(
    storageKey,
    data
) {

    localStorage.setItem(
        storageKey,
        JSON.stringify(data)
    );

}


/* ==========================================
   DATA GETTERS
========================================== */

function getPayments() {
    return getStorageData(
        PAYMENTS_STORAGE_KEY
    );
}


function getStations() {
    return getStorageData(
        PAYMENT_STATIONS_STORAGE_KEY
    );
}


function getShifts() {
    return getStorageData(
        PAYMENT_SHIFTS_STORAGE_KEY
    );
}


function getStaff() {
    return getStorageData(
        PAYMENT_STAFF_STORAGE_KEY
    );
}


function getCurrentPaymentUser() {
    return FuelGapUtils.getCurrentUser();
}


/* ==========================================
   VISIBLE STATIONS
========================================== */

function getVisibleStations() {

    const currentUser =
        getCurrentPaymentUser();

    const stations =
        getStations();

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

    if (
        currentUser.role === "staff" ||
        currentUser.role === "attendant"
    ) {

        if (currentUser.stationId) {

            return stations.filter(
                station =>
                    station.id ===
                    currentUser.stationId
            );

        }

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

    return getShifts().filter(
        shift =>
            stationIds.includes(
                shift.stationId
            )
    );

}


function getVisibleStaff() {

    const stationIds =
        getVisibleStationIds();

    return getStaff().filter(
        staff =>
            stationIds.includes(
                staff.stationId
            )
    );

}


function getVisiblePayments() {

    const stationIds =
        getVisibleStationIds();

    return getPayments().filter(
        payment =>
            stationIds.includes(
                payment.stationId
            )
    );

}


/* ==========================================
   RENDER PAGE
========================================== */

function renderPaymentsPage() {

    const pageContent =
        document.getElementById(
            "pageContent"
        );

    if (!pageContent) {
        return;
    }

    const currentUser =
        getCurrentPaymentUser();

    const visibleStations =
        getVisibleStations();

    pageContent.innerHTML = `

        <div class="payments-page">


            <!-- ==================================
                 PAGE HERO
            =================================== -->

            <section class="payments-hero">

                <div class="payments-hero-content">

                    <div class="payments-hero-icon">
                        ${paymentIcon("wallet")}
                    </div>

                    <div>

                        <div class="payments-eyebrow">
                            PAYMENT OPERATIONS
                        </div>

                        <h1>
                            Payment Command Center
                        </h1>

                        <p>
                            Monitor money received across
                            station shifts, attendants and
                            payment channels.
                        </p>

                        <div class="payments-scope">

                            <span class="scope-dot"></span>

                            <span>
                                ${visibleStations.length}
                                station${visibleStations.length === 1 ? "" : "s"}
                                in your operational scope
                            </span>

                            ${
                                currentUser
                                    ? `
                                        <span class="scope-divider"></span>
                                        <span>
                                            ${escapeHTML(
                                                currentUser.fullName ||
                                                currentUser.name ||
                                                currentUser.role ||
                                                "User"
                                            )}
                                        </span>
                                    `
                                    : ""
                            }

                        </div>

                    </div>

                </div>


                <div class="payments-hero-actions">

                    <button
                        type="button"
                        class="payment-action-btn secondary"
                        id="refreshPaymentsButton"
                    >
                        ${paymentIcon("refresh")}
                        <span>Refresh</span>
                    </button>

                    <button
                        type="button"
                        class="payment-action-btn secondary"
                        id="exportPaymentsButton"
                    >
                        ${paymentIcon("download")}
                        <span>Export</span>
                    </button>

                    <button
                        type="button"
                        class="payment-action-btn primary"
                        id="addPaymentButton"
                    >
                        ${paymentIcon("plus")}
                        <span>Record Payment</span>
                    </button>

                </div>

            </section>


            <!-- ==================================
                 KPI CARDS
            =================================== -->

            <section class="payments-kpi-grid">


                <article class="payment-kpi-card total">

                    <div class="payment-kpi-top">

                        <div class="payment-kpi-icon">
                            ${paymentIcon("wallet")}
                        </div>

                        <span class="payment-kpi-label">
                            Total Collected
                        </span>

                    </div>

                    <strong
                        id="totalPaymentAmount"
                        class="payment-kpi-value"
                    >
                        ₦0.00
                    </strong>

                    <div class="payment-kpi-footer">
                        Across current filtered records
                    </div>

                </article>


                <article class="payment-kpi-card cash">

                    <div class="payment-kpi-top">

                        <div class="payment-kpi-icon">
                            ${paymentIcon("cash")}
                        </div>

                        <span class="payment-kpi-label">
                            Cash
                        </span>

                    </div>

                    <strong
                        id="cashPaymentAmount"
                        class="payment-kpi-value"
                    >
                        ₦0.00
                    </strong>

                    <div class="payment-kpi-footer">
                        Physical cash received
                    </div>

                </article>


                <article class="payment-kpi-card pos">

                    <div class="payment-kpi-top">

                        <div class="payment-kpi-icon">
                            ${paymentIcon("card")}
                        </div>

                        <span class="payment-kpi-label">
                            POS
                        </span>

                    </div>

                    <strong
                        id="posPaymentAmount"
                        class="payment-kpi-value"
                    >
                        ₦0.00
                    </strong>

                    <div class="payment-kpi-footer">
                        POS transactions
                    </div>

                </article>


                <article class="payment-kpi-card records">

                    <div class="payment-kpi-top">

                        <div class="payment-kpi-icon">
                            ${paymentIcon("receipt")}
                        </div>

                        <span class="payment-kpi-label">
                            Payment Records
                        </span>

                    </div>

                    <strong
                        id="paymentRecordCount"
                        class="payment-kpi-value"
                    >
                        0
                    </strong>

                    <div class="payment-kpi-footer">
                        Matching current filters
                    </div>

                </article>


            </section>


            <!-- ==================================
                 INSIGHT STRIP
            =================================== -->

            <section class="payment-insight-strip">

                <div class="payment-insight">

                    <div class="insight-icon">
                        ${paymentIcon("activity")}
                    </div>

                    <div>
                        <strong id="paymentActivityText">
                            Payment activity
                        </strong>

                        <span>
                            Live view of recorded station collections
                        </span>
                    </div>

                </div>


                <div class="payment-insight-metrics">

                    <div>
                        <span>Transfer</span>
                        <strong id="transferPaymentAmount">
                            ₦0.00
                        </strong>
                    </div>

                    <div>
                        <span>Credit</span>
                        <strong id="creditPaymentAmount">
                            ₦0.00
                        </strong>
                    </div>

                    <div>
                        <span>Other</span>
                        <strong id="otherPaymentAmount">
                            ₦0.00
                        </strong>
                    </div>

                    <div>
                        <span>Last Updated</span>
                        <strong id="paymentLastUpdated">
                            Just now
                        </strong>
                    </div>

                </div>

            </section>


            <!-- ==================================
                 RECORDS SECTION
            =================================== -->

            <section class="payments-records-card">


                <div class="payments-section-heading">

                    <div>

                        <div class="section-kicker">
                            COLLECTION LEDGER
                        </div>

                        <h2>
                            Payment Records
                        </h2>

                        <p>
                            Review every payment captured
                            across your accessible stations.
                        </p>

                    </div>


                    <div class="payment-record-count-badge">
                        <span id="filteredPaymentCount">
                            0
                        </span>
                        records
                    </div>

                </div>


                <!-- ==================================
                     FILTER TOOLBAR
                =================================== -->

                <div class="payments-toolbar">

                    <div class="payment-search-box">

                        ${paymentIcon("search")}

                        <input
                            type="search"
                            id="paymentSearch"
                            placeholder="Search station, shift, attendant..."
                            autocomplete="off"
                        >

                    </div>


                    <div class="payment-filter-group">

                        <select
                            id="paymentStationFilter"
                            aria-label="Filter by station"
                        >
                            <option value="">
                                All Stations
                            </option>
                        </select>


                        <select
                            id="paymentShiftFilter"
                            aria-label="Filter by shift"
                        >
                            <option value="">
                                All Shifts
                            </option>
                        </select>


                        <select
                            id="paymentMethodFilter"
                            aria-label="Filter by payment method"
                        >

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
                                Bank Transfer
                            </option>

                            <option value="credit">
                                Credit
                            </option>

                            <option value="other">
                                Other
                            </option>

                        </select>


                        <button
                            type="button"
                            class="payment-clear-btn"
                            id="clearPaymentFilters"
                        >
                            Clear
                        </button>

                    </div>

                </div>


                <!-- ==================================
                     TABLE
                =================================== -->

                <div class="payments-table-shell">

                    <div class="table-wrapper payments-table-wrapper">

                        <table class="payments-pro-table">

                            <thead>

                                <tr>

                                    <th>Station</th>
                                    <th>Shift</th>
                                    <th>Attendant</th>
                                    <th>Method</th>
                                    <th>Amount</th>
                                    <th>Recorded By</th>
                                    <th>Date & Time</th>
                                    <th>Action</th>

                                </tr>

                            </thead>

                            <tbody
                                id="paymentsTableBody"
                            ></tbody>

                        </table>

                    </div>


                    <div
                        id="emptyPaymentsState"
                        class="payment-empty-state hidden"
                    >

                        <div class="payment-empty-icon">
                            ${paymentIcon("receipt")}
                        </div>

                        <h3>
                            No payment records found
                        </h3>

                        <p>
                            There are no payment records
                            matching your current filters.
                        </p>

                        <button
                            type="button"
                            class="payment-empty-btn"
                            id="emptyRecordPayment"
                        >
                            ${paymentIcon("plus")}
                            Record Payment
                        </button>

                    </div>

                </div>


            </section>


            <!-- ==================================
                 PAYMENT MODAL
            =================================== -->

            <div
                class="payment-modal-overlay"
                id="paymentModal"
                aria-hidden="true"
            >

                <div
                    class="payment-modal"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="paymentModalTitle"
                >

                    <div class="payment-modal-top">

                        <div class="payment-modal-title-wrap">

                            <div class="payment-modal-icon">
                                ${paymentIcon("wallet")}
                            </div>

                            <div>

                                <span class="section-kicker">
                                    NEW COLLECTION
                                </span>

                                <h2 id="paymentModalTitle">
                                    Record Payment
                                </h2>

                                <p>
                                    Capture money received
                                    for a station shift.
                                </p>

                            </div>

                        </div>


                        <button
                            type="button"
                            class="payment-modal-close"
                            id="closePaymentModal"
                            aria-label="Close"
                        >
                            ×
                        </button>

                    </div>


                    <div class="payment-modal-divider"></div>


                    <form id="paymentForm">

                        <div
                            id="paymentMessage"
                            class="payment-message-container"
                        ></div>


                        <div class="payment-form-section">

                            <div class="payment-form-section-title">
                                Transaction Context
                            </div>


                            <div class="payment-form-grid">


                                <div class="payment-form-group">

                                    <label for="paymentStation">
                                        Station
                                    </label>

                                    <div class="payment-input-wrap">
                                        ${paymentIcon("station")}

                                        <select
                                            id="paymentStation"
                                            required
                                        >
                                            <option value="">
                                                Select Station
                                            </option>
                                        </select>

                                    </div>

                                </div>


                                <div class="payment-form-group">

                                    <label for="paymentShift">
                                        Shift
                                    </label>

                                    <div class="payment-input-wrap">
                                        ${paymentIcon("clock")}

                                        <select
                                            id="paymentShift"
                                            required
                                        >
                                            <option value="">
                                                Select Shift
                                            </option>
                                        </select>

                                    </div>

                                </div>


                                <div class="payment-form-group">

                                    <label for="paymentStaff">
                                        Attendant
                                    </label>

                                    <div class="payment-input-wrap">
                                        ${paymentIcon("user")}

                                        <select
                                            id="paymentStaff"
                                            required
                                        >
                                            <option value="">
                                                Select Attendant
                                            </option>
                                        </select>

                                    </div>

                                </div>


                                <div class="payment-form-group">

                                    <label for="paymentMethod">
                                        Payment Method
                                    </label>

                                    <div class="payment-input-wrap">
                                        ${paymentIcon("card")}

                                        <select
                                            id="paymentMethod"
                                            required
                                        >

                                            <option value="">
                                                Select Method
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

                                            <option value="credit">
                                                Credit
                                            </option>

                                            <option value="other">
                                                Other
                                            </option>

                                        </select>

                                    </div>

                                </div>


                            </div>

                        </div>


                        <div class="payment-form-section">

                            <div class="payment-form-section-title">
                                Payment Details
                            </div>


                            <div class="payment-form-grid">


                                <div class="payment-form-group">

                                    <label for="paymentAmount">
                                        Amount
                                    </label>

                                    <div class="payment-amount-wrap">

                                        <span>₦</span>

                                        <input
                                            type="number"
                                            id="paymentAmount"
                                            min="1"
                                            step="0.01"
                                            placeholder="0.00"
                                            required
                                        >

                                    </div>

                                </div>


                                <div class="payment-form-group">

                                    <label for="paymentDate">
                                        Payment Date & Time
                                    </label>

                                    <div class="payment-input-wrap">
                                        ${paymentIcon("calendar")}

                                        <input
                                            type="datetime-local"
                                            id="paymentDate"
                                            required
                                        >

                                    </div>

                                </div>


                            </div>


                            <div class="payment-form-group payment-notes-group">

                                <label for="paymentNotes">
                                    Notes
                                    <span>Optional</span>
                                </label>

                                <textarea
                                    id="paymentNotes"
                                    rows="3"
                                    placeholder="Add any useful payment details..."
                                ></textarea>

                            </div>

                        </div>


                        <div class="payment-form-security">

                            <div class="security-icon">
                                ${paymentIcon("shield")}
                            </div>

                            <div>
                                <strong>
                                    Payment audit trail
                                </strong>

                                <span>
                                    This record will include the
                                    current user and creation time.
                                </span>
                            </div>

                        </div>


                        <div class="payment-modal-actions">

                            <button
                                type="button"
                                class="payment-cancel-btn"
                                id="cancelPaymentButton"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                class="payment-submit-btn"
                            >
                                ${paymentIcon("check")}
                                Save Payment
                            </button>

                        </div>

                    </form>

                </div>

            </div>

        </div>

    `;


    const paymentDate =
        document.getElementById(
            "paymentDate"
        );

    if (paymentDate) {
        paymentDate.value =
            getCurrentDateTimeLocal();
    }

}


/* ==========================================
   SETUP EVENTS
========================================== */

function setupPaymentEvents() {

    loadPaymentFilters();
    loadPaymentFormStations();

    setupPaymentModalEvents();
    setupPaymentFormEvents();
    setupPaymentFilterEvents();
    setupPaymentUtilityEvents();

}


/* ==========================================
   MODAL EVENTS
========================================== */

function setupPaymentModalEvents() {

    const addButton =
        document.getElementById(
            "addPaymentButton"
        );

    const emptyButton =
        document.getElementById(
            "emptyRecordPayment"
        );

    const modal =
        document.getElementById(
            "paymentModal"
        );

    const closeButton =
        document.getElementById(
            "closePaymentModal"
        );

    const cancelButton =
        document.getElementById(
            "cancelPaymentButton"
        );


    if (addButton) {

        addButton.addEventListener(
            "click",
            openPaymentModal
        );

    }


    if (emptyButton) {

        emptyButton.addEventListener(
            "click",
            openPaymentModal
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closePaymentModal
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closePaymentModal
        );

    }


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


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                const paymentModal =
                    document.getElementById(
                        "paymentModal"
                    );

                if (
                    paymentModal &&
                    paymentModal.classList.contains(
                        "active"
                    )
                ) {

                    closePaymentModal();

                }

            }

        }
    );

}


/* ==========================================
   OPEN MODAL
========================================== */

function openPaymentModal() {

    const modal =
        document.getElementById(
            "paymentModal"
        );

    if (!modal) {
        return;
    }

    clearPaymentMessage();

    modal.classList.add("active");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";

    const station =
        document.getElementById(
            "paymentStation"
        );

    if (station) {
        setTimeout(
            () => station.focus(),
            100
        );
    }

}


/* ==========================================
   CLOSE MODAL
========================================== */

function closePaymentModal() {

    const modal =
        document.getElementById(
            "paymentModal"
        );

    if (!modal) {
        return;
    }

    modal.classList.remove("active");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow =
        "";

    const form =
        document.getElementById(
            "paymentForm"
        );

    if (form) {
        form.reset();
    }

    loadFormShifts("");
    loadFormStaff("");

    const paymentDate =
        document.getElementById(
            "paymentDate"
        );

    if (paymentDate) {

        paymentDate.value =
            getCurrentDateTimeLocal();

    }

    clearPaymentMessage();

}


/* ==========================================
   LOAD FILTERS
========================================== */

function loadPaymentFilters() {

    loadPaymentStationFilter();
    loadPaymentShiftFilter();

}


function loadPaymentStationFilter() {

    const select =
        document.getElementById(
            "paymentStationFilter"
        );

    if (!select) {
        return;
    }

    select.innerHTML = `
        <option value="">
            All Stations
        </option>
    `;

    getVisibleStations().forEach(
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

            select.appendChild(
                option
            );

        }
    );

}


function loadPaymentShiftFilter() {

    const select =
        document.getElementById(
            "paymentShiftFilter"
        );

    if (!select) {
        return;
    }

    select.innerHTML = `
        <option value="">
            All Shifts
        </option>
    `;

    getVisibleShifts().forEach(
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

            select.appendChild(
                option
            );

        }
    );

}


/* ==========================================
   LOAD FORM STATIONS
========================================== */

function loadPaymentFormStations() {

    const select =
        document.getElementById(
            "paymentStation"
        );

    if (!select) {
        return;
    }

    select.innerHTML = `
        <option value="">
            Select Station
        </option>
    `;

    getVisibleStations().forEach(
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

            select.appendChild(
                option
            );

        }
    );

}


/* ==========================================
   FORM EVENTS
========================================== */

function setupPaymentFormEvents() {

    const form =
        document.getElementById(
            "paymentForm"
        );

    const stationSelect =
        document.getElementById(
            "paymentStation"
        );


    if (stationSelect) {

        stationSelect.addEventListener(
            "change",
            event => {

                const stationId =
                    event.target.value;

                loadFormShifts(
                    stationId
                );

                loadFormStaff(
                    stationId
                );

            }
        );

    }


    if (form) {

        form.addEventListener(
            "submit",
            handlePaymentSubmit
        );

    }

}


/* ==========================================
   LOAD FORM SHIFTS
========================================== */

function loadFormShifts(
    stationId
) {

    const select =
        document.getElementById(
            "paymentShift"
        );

    if (!select) {
        return;
    }

    select.innerHTML = `
        <option value="">
            Select Shift
        </option>
    `;

    if (!stationId) {
        return;
    }

    const shifts =
        getVisibleShifts()
            .filter(
                shift =>
                    shift.stationId ===
                    stationId
            );

    shifts
        .sort(
            (a, b) => {

                if (
                    a.status === "open" &&
                    b.status !== "open"
                ) {
                    return -1;
                }

                if (
                    a.status !== "open" &&
                    b.status === "open"
                ) {
                    return 1;
                }

                return (
                    String(a.name || "")
                        .localeCompare(
                            String(b.name || "")
                        )
                );

            }
        )
        .forEach(
            shift => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    shift.id;

                const status =
                    String(
                        shift.status ||
                        "unknown"
                    ).toUpperCase();

                option.textContent =
                    `${shift.name || "Unnamed Shift"} • ${status}`;

                select.appendChild(
                    option
                );

            }
        );

}


/* ==========================================
   LOAD FORM STAFF
========================================== */

function loadFormStaff(
    stationId
) {

    const select =
        document.getElementById(
            "paymentStaff"
        );

    if (!select) {
        return;
    }

    select.innerHTML = `
        <option value="">
            Select Attendant
        </option>
    `;

    if (!stationId) {
        return;
    }

    const staffMembers =
        getVisibleStaff()
            .filter(
                staff =>
                    staff.stationId ===
                    stationId
            );

    staffMembers
        .sort(
            (a, b) =>
                String(
                    a.fullName ||
                    a.name ||
                    ""
                ).localeCompare(
                    String(
                        b.fullName ||
                        b.name ||
                        ""
                    )
                )
        )
        .forEach(
            staff => {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    staff.id;

                option.textContent =
                    staff.fullName ||
                    staff.name ||
                    "Unnamed Staff";

                select.appendChild(
                    option
                );

            }
        );

}


/* ==========================================
   HANDLE SUBMIT
========================================== */

function handlePaymentSubmit(
    event
) {

    event.preventDefault();


    const stationId =
        document.getElementById(
            "paymentStation"
        ).value;

    const shiftId =
        document.getElementById(
            "paymentShift"
        ).value;

    const staffId =
        document.getElementById(
            "paymentStaff"
        ).value;

    const method =
        document.getElementById(
            "paymentMethod"
        ).value;

    const amount =
        Number(
            document.getElementById(
                "paymentAmount"
            ).value
        );

    const paymentDate =
        document.getElementById(
            "paymentDate"
        ).value;

    const notes =
        document.getElementById(
            "paymentNotes"
        ).value.trim();


    if (
        !stationId ||
        !shiftId ||
        !staffId ||
        !method ||
        !paymentDate
    ) {

        showPaymentMessage(
            "Please complete all required fields.",
            "error"
        );

        return;

    }


    if (
        Number.isNaN(amount) ||
        amount <= 0
    ) {

        showPaymentMessage(
            "Please enter a valid payment amount.",
            "error"
        );

        return;

    }


    const stations =
        getStations();

    const shifts =
        getShifts();

    const staffMembers =
        getStaff();


    const station =
        stations.find(
            item =>
                item.id ===
                stationId
        );

    const shift =
        shifts.find(
            item =>
                item.id ===
                shiftId
        );

    const staff =
        staffMembers.find(
            item =>
                item.id ===
                staffId
        );


    if (!station) {

        showPaymentMessage(
            "The selected station could not be found.",
            "error"
        );

        return;

    }


    if (
        !shift ||
        shift.stationId !== stationId
    ) {

        showPaymentMessage(
            "The selected shift does not belong to this station.",
            "error"
        );

        return;

    }


    if (
        !staff ||
        staff.stationId !== stationId
    ) {

        showPaymentMessage(
            "The selected attendant does not belong to this station.",
            "error"
        );

        return;

    }


    const currentUser =
        getCurrentPaymentUser();


    const payment = {

        id:
            `PAY-${Date.now()}-${Math.floor(
                Math.random() * 1000
            )}`,

        organizationId:
            station.organizationId ||
            null,

        stationId,

        stationName:
            station.name ||
            "Unknown Station",

        shiftId,

        shiftName:
            shift.name ||
            "Unknown Shift",

        staffId,

        staffName:
            staff.fullName ||
            staff.name ||
            "Unknown Attendant",

        method,

        amount,

        paymentDate:
            new Date(
                paymentDate
            ).toISOString(),

        notes,

        recordedBy:
            currentUser
                ? currentUser.id
                : null,

        recordedByName:
            currentUser
                ? (
                    currentUser.fullName ||
                    currentUser.name ||
                    currentUser.role ||
                    "Unknown"
                )
                : "Unknown",

        createdAt:
            new Date().toISOString()

    };


    const payments =
        getPayments();

    payments.push(payment);

    saveStorageData(
        PAYMENTS_STORAGE_KEY,
        payments
    );


    showPaymentMessage(
        "Payment recorded successfully.",
        "success"
    );


    renderPayments();


    setTimeout(
        () => {

            closePaymentModal();

        },
        700
    );

}


/* ==========================================
   FILTER EVENTS
========================================== */

function setupPaymentFilterEvents() {

    const filters = [

        "paymentStationFilter",
        "paymentShiftFilter",
        "paymentMethodFilter",
        "paymentSearch"

    ];


    filters.forEach(
        id => {

            const element =
                document.getElementById(
                    id
                );

            if (!element) {
                return;
            }

            element.addEventListener(
                element.tagName === "INPUT"
                    ? "input"
                    : "change",
                () => {

                    renderPayments();

                }
            );

        }
    );


    const clearButton =
        document.getElementById(
            "clearPaymentFilters"
        );

    if (clearButton) {

        clearButton.addEventListener(
            "click",
            clearPaymentFilters
        );

    }

}


/* ==========================================
   CLEAR FILTERS
========================================== */

function clearPaymentFilters() {

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

    const search =
        document.getElementById(
            "paymentSearch"
        );


    if (station) {
        station.value = "";
    }

    if (shift) {
        shift.value = "";
    }

    if (method) {
        method.value = "";
    }

    if (search) {
        search.value = "";
    }

    renderPayments();

}


/* ==========================================
   UTILITY EVENTS
========================================== */

function setupPaymentUtilityEvents() {

    const refreshButton =
        document.getElementById(
            "refreshPaymentsButton"
        );

    const exportButton =
        document.getElementById(
            "exportPaymentsButton"
        );


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            () => {

                refreshPaymentData();

            }
        );

    }


    if (exportButton) {

        exportButton.addEventListener(
            "click",
            exportPaymentsToCSV
        );

    }

}


/* ==========================================
   REFRESH
========================================== */

function refreshPaymentData() {

    const button =
        document.getElementById(
            "refreshPaymentsButton"
        );

    if (button) {

        button.classList.add(
            "is-refreshing"
        );

    }


    loadPaymentFilters();
    loadPaymentFormStations();
    renderPayments();


    const updated =
        document.getElementById(
            "paymentLastUpdated"
        );

    if (updated) {
        updated.textContent =
            "Just now";
    }


    setTimeout(
        () => {

            if (button) {

                button.classList.remove(
                    "is-refreshing"
                );

            }

        },
        500
    );

}


/* ==========================================
   GET FILTERS
========================================== */

function getPaymentFilters() {

    const stationFilter =
        document.getElementById(
            "paymentStationFilter"
        );

    const shiftFilter =
        document.getElementById(
            "paymentShiftFilter"
        );

    const methodFilter =
        document.getElementById(
            "paymentMethodFilter"
        );

    const searchInput =
        document.getElementById(
            "paymentSearch"
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

        method:
            methodFilter
                ? methodFilter.value
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
   FILTER PAYMENTS
========================================== */

function filterPayments(
    payments,
    filters
) {

    return payments.filter(
        payment => {

            if (
                filters.stationId &&
                payment.stationId !==
                filters.stationId
            ) {
                return false;
            }


            if (
                filters.shiftId &&
                payment.shiftId !==
                filters.shiftId
            ) {
                return false;
            }


            if (
                filters.method &&
                payment.method !==
                filters.method
            ) {
                return false;
            }


            if (filters.search) {

                const searchText =
                    `
                    ${payment.stationName || ""}
                    ${payment.shiftName || ""}
                    ${payment.staffName || ""}
                    ${payment.method || ""}
                    ${payment.recordedByName || ""}
                    ${payment.notes || ""}
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
   RENDER PAYMENTS
========================================== */

function renderPayments() {

    const payments =
        getVisiblePayments();

    const filters =
        getPaymentFilters();

    const filteredPayments =
        filterPayments(
            payments,
            filters
        );


    const tableBody =
        document.getElementById(
            "paymentsTableBody"
        );

    const emptyState =
        document.getElementById(
            "emptyPaymentsState"
        );


    if (!tableBody) {
        return;
    }


    tableBody.innerHTML = "";


    filteredPayments.sort(
        (a, b) =>
            new Date(
                b.paymentDate ||
                b.createdAt ||
                0
            ) -
            new Date(
                a.paymentDate ||
                a.createdAt ||
                0
            )
    );


    if (
        filteredPayments.length ===
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


        filteredPayments.forEach(
            payment => {

                const row =
                    document.createElement(
                        "tr"
                    );


                const staffInitial =
                    getInitials(
                        payment.staffName ||
                        "Unknown"
                    );

                const stationInitial =
                    getInitials(
                        payment.stationName ||
                        "Station"
                    );


                row.innerHTML = `

                    <td data-label="Station">

                        <div class="payment-station-cell">

                            <div class="station-avatar">
                                ${escapeHTML(
                                    stationInitial
                                )}
                            </div>

                            <div>

                                <strong>
                                    ${escapeHTML(
                                        payment.stationName ||
                                        "Unknown Station"
                                    )}
                                </strong>

                                <span>
                                    Station
                                </span>

                            </div>

                        </div>

                    </td>


                    <td data-label="Shift">

                        <div class="payment-shift-cell">

                            <span class="shift-status-mini
                                ${
                                    getShiftForPayment(
                                        payment.shiftId
                                    )?.status === "open"
                                        ? "open"
                                        : "closed"
                                }
                            "></span>

                            <div>

                                <strong>
                                    ${escapeHTML(
                                        payment.shiftName ||
                                        "Unknown Shift"
                                    )}
                                </strong>

                                <span>
                                    ${getShiftForPayment(
                                        payment.shiftId
                                    )?.status === "open"
                                        ? "Active shift"
                                        : "Completed shift"
                                    }
                                </span>

                            </div>

                        </div>

                    </td>


                    <td data-label="Attendant">

                        <div class="payment-person-cell">

                            <div class="person-avatar">
                                ${escapeHTML(
                                    staffInitial
                                )}
                            </div>

                            <div>

                                <strong>
                                    ${escapeHTML(
                                        payment.staffName ||
                                        "Unknown Attendant"
                                    )}
                                </strong>

                                <span>
                                    Attendant
                                </span>

                            </div>

                        </div>

                    </td>


                    <td data-label="Method">

                        ${formatPaymentMethodBadge(
                            payment.method
                        )}

                    </td>


                    <td data-label="Amount">

                        <div class="payment-amount-cell">

                            <strong>
                                ${formatCurrency(
                                    payment.amount
                                )}
                            </strong>

                        </div>

                    </td>


                    <td data-label="Recorded By">

                        <div class="payment-recorder">

                            <span>
                                ${escapeHTML(
                                    payment.recordedByName ||
                                    "Unknown"
                                )}
                            </span>

                            <small>
                                Audit record
                            </small>

                        </div>

                    </td>


                    <td data-label="Date & Time">

                        <div class="payment-date-cell">

                            <strong>
                                ${formatPaymentDate(
                                    payment.paymentDate
                                )}
                            </strong>

                            <span>
                                ${formatPaymentTime(
                                    payment.paymentDate
                                )}
                            </span>

                        </div>

                    </td>


                    <td data-label="Action">

                        <button
                            type="button"
                            class="payment-delete-btn"
                            data-delete-payment="${escapeHTML(
                                payment.id
                            )}"
                            title="Delete payment"
                        >
                            ${paymentIcon("trash")}
                            <span>Delete</span>
                        </button>

                    </td>

                `;


                tableBody.appendChild(
                    row
                );

            }
        );


        setupPaymentDeleteButtons();

    }


    updatePaymentStats(
        filteredPayments
    );


    const count =
        document.getElementById(
            "filteredPaymentCount"
        );

    if (count) {
        count.textContent =
            filteredPayments.length;
    }


    const lastUpdated =
        document.getElementById(
            "paymentLastUpdated"
        );

    if (lastUpdated) {
        lastUpdated.textContent =
            "Just now";
    }


    const activityText =
        document.getElementById(
            "paymentActivityText"
        );

    if (activityText) {

        activityText.textContent =
            filteredPayments.length
                ? `${filteredPayments.length} payment ${
                    filteredPayments.length === 1
                        ? "record"
                        : "records"
                  } currently visible`
                : "No payment activity matches your filters";

    }

}


/* ==========================================
   GET SHIFT FOR PAYMENT
========================================== */

function getShiftForPayment(
    shiftId
) {

    return getShifts().find(
        shift =>
            shift.id ===
            shiftId
    );

}


/* ==========================================
   DELETE BUTTONS
========================================== */

function setupPaymentDeleteButtons() {

    const buttons =
        document.querySelectorAll(
            "[data-delete-payment]"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    deletePayment(
                        button.getAttribute(
                            "data-delete-payment"
                        )
                    );

                }
            );

        }
    );

}


/* ==========================================
   DELETE PAYMENT
========================================== */

function deletePayment(
    paymentId
) {

    const payment =
        getPayments().find(
            item =>
                item.id ===
                paymentId
        );


    if (!payment) {
        return;
    }


    const confirmed =
        window.confirm(
            `Delete payment record of ${formatCurrency(
                payment.amount
            )} from ${payment.staffName || "Unknown Attendant"}?`
        );


    if (!confirmed) {
        return;
    }


    const payments =
        getPayments();


    const updatedPayments =
        payments.filter(
            item =>
                item.id !==
                paymentId
        );


    saveStorageData(
        PAYMENTS_STORAGE_KEY,
        updatedPayments
    );


    renderPayments();

}


/* ==========================================
   PAYMENT STATS
========================================== */

function updatePaymentStats(
    payments
) {

    const total =
        getPaymentTotal(
            payments
        );

    const cash =
        getPaymentTotal(
            payments.filter(
                payment =>
                    payment.method ===
                    "cash"
            )
        );

    const pos =
        getPaymentTotal(
            payments.filter(
                payment =>
                    payment.method ===
                    "pos"
            )
        );

    const transfer =
        getPaymentTotal(
            payments.filter(
                payment =>
                    payment.method ===
                    "transfer"
            )
        );

    const credit =
        getPaymentTotal(
            payments.filter(
                payment =>
                    payment.method ===
                    "credit"
            )
        );

    const other =
        getPaymentTotal(
            payments.filter(
                payment =>
                    payment.method ===
                    "other"
            )
        );


    setElementText(
        "totalPaymentAmount",
        formatCurrency(total)
    );

    setElementText(
        "cashPaymentAmount",
        formatCurrency(cash)
    );

    setElementText(
        "posPaymentAmount",
        formatCurrency(pos)
    );

    setElementText(
        "transferPaymentAmount",
        formatCurrency(transfer)
    );

    setElementText(
        "creditPaymentAmount",
        formatCurrency(credit)
    );

    setElementText(
        "otherPaymentAmount",
        formatCurrency(other)
    );

    setElementText(
        "paymentRecordCount",
        payments.length
    );

}


/* ==========================================
   PAYMENT TOTAL
========================================== */

function getPaymentTotal(
    payments
) {

    return payments.reduce(
        (
            total,
            payment
        ) => {

            return (
                total +
                (
                    Number(
                        payment.amount
                    ) || 0
                )
            );

        },
        0
    );

}


/* ==========================================
   PAYMENT MESSAGE
========================================== */

function showPaymentMessage(
    message,
    type
) {

    const element =
        document.getElementById(
            "paymentMessage"
        );

    if (!element) {
        return;
    }


    element.innerHTML = `

        <div class="
            payment-form-message
            ${type}
        ">

            <span class="message-icon">
                ${
                    type === "success"
                        ? paymentIcon("check")
                        : paymentIcon("alert")
                }
            </span>

            <span>
                ${escapeHTML(
                    message
                )}
            </span>

        </div>

    `;

}


function clearPaymentMessage() {

    const element =
        document.getElementById(
            "paymentMessage"
        );

    if (element) {
        element.innerHTML = "";
    }

}


/* ==========================================
   PAYMENT METHOD BADGE
========================================== */

function formatPaymentMethodBadge(
    method
) {

    const methods = {

        cash: {
            label: "Cash",
            icon: "cash",
            className: "cash"
        },

        pos: {
            label: "POS",
            icon: "card",
            className: "pos"
        },

        transfer: {
            label: "Transfer",
            icon: "transfer",
            className: "transfer"
        },

        credit: {
            label: "Credit",
            icon: "credit",
            className: "credit"
        },

        other: {
            label: "Other",
            icon: "wallet",
            className: "other"
        }

    };


    const item =
        methods[method] ||
        {
            label: method || "Unknown",
            icon: "wallet",
            className: "other"
        };


    return `

        <span class="
            payment-method-badge
            ${item.className}
        ">

            ${paymentIcon(
                item.icon
            )}

            <span>
                ${escapeHTML(
                    item.label
                )}
            </span>

        </span>

    `;

}


/* ==========================================
   CURRENCY
========================================== */

function formatCurrency(
    amount
) {

    const value =
        Number(amount) || 0;


    return value.toLocaleString(
        "en-NG",
        {

            style: "currency",

            currency: "NGN",

            minimumFractionDigits: 2,

            maximumFractionDigits: 2

        }
    );

}


/* ==========================================
   DATE
========================================== */

function formatPaymentDate(
    dateValue
) {

    if (!dateValue) {
        return "-";
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
        return "-";
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


/* ==========================================
   TIME
========================================== */

function formatPaymentTime(
    dateValue
) {

    if (!dateValue) {
        return "-";
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
        return "-";
    }


    return date.toLocaleTimeString(
        "en-NG",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


/* ==========================================
   CURRENT DATETIME
========================================== */

function getCurrentDateTimeLocal() {

    const now =
        new Date();

    const timezoneOffset =
        now.getTimezoneOffset() *
        60000;

    const localDate =
        new Date(
            now.getTime() -
            timezoneOffset
        );

    return localDate
        .toISOString()
        .slice(
            0,
            16
        );

}


/* ==========================================
   EXPORT CSV
========================================== */

function exportPaymentsToCSV() {

    const payments =
        filterPayments(
            getVisiblePayments(),
            getPaymentFilters()
        );


    if (!payments.length) {

        alert(
            "There are no payment records to export."
        );

        return;

    }


    const headers = [

        "Payment ID",
        "Station",
        "Shift",
        "Attendant",
        "Payment Method",
        "Amount",
        "Recorded By",
        "Payment Date",
        "Notes"

    ];


    const rows =
        payments.map(
            payment => [

                payment.id || "",

                payment.stationName || "",

                payment.shiftName || "",

                payment.staffName || "",

                formatPaymentMethod(
                    payment.method
                ),

                Number(
                    payment.amount
                ) || 0,

                payment.recordedByName || "",

                payment.paymentDate || "",

                payment.notes || ""

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
                                value
                            ).replace(
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

    link.href =
        url;

    link.download =
        `fuelgap-payments-${new Date()
            .toISOString()
            .slice(0, 10)}.csv`;

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


/* ==========================================
   INITIALS
========================================== */

function getInitials(
    value
) {

    const text =
        String(
            value || ""
        ).trim();


    if (!text) {
        return "?";
    }


    const parts =
        text.split(
            /\s+/
        );


    if (parts.length === 1) {

        return parts[0]
            .substring(
                0,
                2
            )
            .toUpperCase();

    }


    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();

}


/* ==========================================
   SET ELEMENT TEXT
========================================== */

function setElementText(
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
   ESCAPE HTML
========================================== */

function escapeHTML(
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


/* ==========================================
   PAYMENT ICONS
========================================== */

function paymentIcon(
    name
) {

    const icons = {

        wallet: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="5" width="18" height="15" rx="3"></rect>
                <path d="M16 9h5v6h-5a3 3 0 1 1 0-6Z"></path>
                <path d="M16 12h.01"></path>
            </svg>
        `,

        cash: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="6" width="18" height="12" rx="2"></rect>
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M6 10h.01M18 14h.01"></path>
            </svg>
        `,

        card: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                <path d="M3 10h18"></path>
                <path d="M7 15h4"></path>
            </svg>
        `,

        transfer: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 7h12"></path>
                <path d="m15 3 4 4-4 4"></path>
                <path d="M17 17H5"></path>
                <path d="m9 13-4 4 4 4"></path>
            </svg>
        `,

        credit: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"></path>
                <path d="M2 10h20"></path>
            </svg>
        `,

        receipt: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"></path>
                <path d="M9 8h6M9 12h6M9 16h3"></path>
            </svg>
        `,

        activity: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 12h4l2-7 4 14 2-7h6"></path>
            </svg>
        `,

        search: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="11" cy="11" r="7"></circle>
                <path d="m20 20-4-4"></path>
            </svg>
        `,

        plus: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 5v14M5 12h14"></path>
            </svg>
        `,

        refresh: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 11a8 8 0 0 0-14.9-3L3 11"></path>
                <path d="M3 5v6h6"></path>
                <path d="M4 13a8 8 0 0 0 14.9 3L21 13"></path>
                <path d="M21 19v-6h-6"></path>
            </svg>
        `,

        download: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3v12"></path>
                <path d="m7 10 5 5 5-5"></path>
                <path d="M5 21h14"></path>
            </svg>
        `,

        trash: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 7h16"></path>
                <path d="M10 11v6M14 11v6"></path>
                <path d="M6 7l1 14h10l1-14"></path>
                <path d="M9 7V4h6v3"></path>
            </svg>
        `,

        check: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m5 12 4 4L19 6"></path>
            </svg>
        `,

        alert: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3 2.5 20h19L12 3Z"></path>
                <path d="M12 9v5"></path>
                <path d="M12 17h.01"></path>
            </svg>
        `,

        shield: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z"></path>
                <path d="m9 12 2 2 4-4"></path>
            </svg>
        `,

        station: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16"></path>
                <path d="M5 7h11"></path>
                <path d="M9 11h3"></path>
                <path d="M16 8h2a2 2 0 0 1 2 2v8"></path>
                <path d="M20 18h1"></path>
            </svg>
        `,

        clock: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M12 7v5l3 2"></path>
            </svg>
        `,

        user: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="8" r="4"></circle>
                <path d="M4 21c.8-4 3.4-6 8-6s7.2 2 8 6"></path>
            </svg>
        `,

        calendar: `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="3" y="5" width="18" height="16" rx="2"></rect>
                <path d="M16 3v4M8 3v4M3 10h18"></path>
            </svg>
        `

    };


    return icons[name] || icons.wallet;

}


/* ==========================================
   LEGACY METHOD FORMAT
========================================== */

function formatPaymentMethod(
    method
) {

    const methods = {

        cash: "Cash",

        pos: "POS",

        transfer: "Bank Transfer",

        credit: "Credit",

        other: "Other"

    };


    return (
        methods[method] ||
        method ||
        "Unknown"
    );

}