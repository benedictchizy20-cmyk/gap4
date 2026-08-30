/* ==========================================
   FUELGAP - PAYMENTS MANAGEMENT
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
                "payments"
            )
        ) {

            window.location.href =
                "./dashboard.html";

            return;

        }


        setTimeout(
            () => {

                renderPaymentsPage();

                setupPaymentEvents();

                renderPayments();

            },
            0
        );

    }
);


/* ==========================================
   SAFE STORAGE HELPER
========================================== */

function getStorageData(
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
   GET DATA
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


/* ==========================================
   GET CURRENT USER
========================================== */

function getCurrentPaymentUser() {

    return FuelGapUtils.getCurrentUser();

}


/* ==========================================
   GET USER'S VISIBLE STATIONS
========================================== */

function getVisibleStations() {

    const currentUser =
        getCurrentPaymentUser();


    const stations =
        getStations();


    if (!currentUser) {

        return [];

    }


    /*
       ADMIN
       CAN SEE ALL STATIONS
    */

    if (
        currentUser.role ===
        "admin"
    ) {

        return stations;

    }


    /*
       OWNER
       CAN SEE ORGANIZATION STATIONS
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
       CAN ONLY SEE ASSIGNED STATION
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
   GET VISIBLE STAFF
========================================== */

function getVisibleStaff() {

    const stationIds =
        getVisibleStationIds();


    return getStaff()
        .filter(
            staff =>
                stationIds.includes(
                    staff.stationId
                )
        );

}


/* ==========================================
   RENDER PAYMENTS PAGE
========================================== */

function renderPaymentsPage() {

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
                    PAYMENT MANAGEMENT
                </p>


                <h1>
                    Payments
                </h1>


                <p>
                    Record and monitor payments
                    received during fuel sales.
                </p>

            </div>


            <button
                type="button"
                class="btn btn-primary"
                id="addPaymentButton"
            >
                + Record Payment
            </button>

        </div>



        <!-- =====================================
             PAYMENT STATS
        ====================================== -->

        <section class="pump-stats">


            <div class="pump-stat-card">

                <span>
                    Total Payments
                </span>

                <strong
                    id="totalPaymentAmount"
                >
                    ₦0.00
                </strong>

            </div>



            <div class="pump-stat-card">

                <span>
                    Cash
                </span>

                <strong
                    id="cashPaymentAmount"
                >
                    ₦0.00
                </strong>

            </div>



            <div class="pump-stat-card">

                <span>
                    POS
                </span>

                <strong
                    id="posPaymentAmount"
                >
                    ₦0.00
                </strong>

            </div>



            <div class="pump-stat-card">

                <span>
                    Payment Records
                </span>

                <strong
                    id="paymentRecordCount"
                >
                    0
                </strong>

            </div>


        </section>



        <!-- =====================================
             PAYMENT FILTERS
        ====================================== -->

        <section class="pump-section">


            <div class="section-header">

                <div>

                    <h2>
                        Payment Records
                    </h2>


                    <p>
                        Payments recorded for
                        station shifts and attendants.
                    </p>

                </div>

            </div>



            <div class="sales-filters">


                <select
                    id="paymentStationFilter"
                >

                    <option value="">
                        All Stations
                    </option>

                </select>



                <select
                    id="paymentShiftFilter"
                >

                    <option value="">
                        All Shifts
                    </option>

                </select>



                <select
                    id="paymentMethodFilter"
                >

                    <option value="">
                        All Payment Methods
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



                <input
                    type="search"
                    id="paymentSearch"
                    placeholder="Search station, shift or attendant..."
                >


            </div>



            <!-- =====================================
                 PAYMENTS TABLE
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


                    <tbody
                        id="paymentsTableBody"
                    ></tbody>


                </table>


            </div>



            <!-- =====================================
                 EMPTY STATE
            ====================================== -->

            <div
                id="emptyPaymentsState"
                class="empty-state hidden"
            >

                <h3>
                    No payment records yet
                </h3>


                <p>
                    Record payments received
                    from fuel sales.
                </p>

            </div>


        </section>



        <!-- =====================================
             PAYMENT MODAL
        ====================================== -->

        <div
            class="modal-overlay"
            id="paymentModal"
        >

            <div
                class="modal"
            >


                <div
                    class="modal-header"
                >

                    <div>

                        <h2>
                            Record Payment
                        </h2>


                        <p>
                            Add money received
                            for a station shift.
                        </p>

                    </div>


                    <button
                        type="button"
                        class="modal-close"
                        id="closePaymentModal"
                    >
                        ×
                    </button>


                </div>



                <form
                    id="paymentForm"
                >


                    <div
                        id="paymentMessage"
                    ></div>



                    <div
                        class="form-grid"
                    >


                        <!-- STATION -->

                        <div
                            class="form-group"
                        >

                            <label
                                for="paymentStation"
                            >
                                Station
                            </label>


                            <select
                                id="paymentStation"
                                required
                            >

                                <option value="">
                                    Select Station
                                </option>

                            </select>

                        </div>



                        <!-- SHIFT -->

                        <div
                            class="form-group"
                        >

                            <label
                                for="paymentShift"
                            >
                                Shift
                            </label>


                            <select
                                id="paymentShift"
                                required
                            >

                                <option value="">
                                    Select Shift
                                </option>

                            </select>

                        </div>



                        <!-- ATTENDANT -->

                        <div
                            class="form-group"
                        >

                            <label
                                for="paymentStaff"
                            >
                                Attendant
                            </label>


                            <select
                                id="paymentStaff"
                                required
                            >

                                <option value="">
                                    Select Attendant
                                </option>

                            </select>

                        </div>



                        <!-- PAYMENT METHOD -->

                        <div
                            class="form-group"
                        >

                            <label
                                for="paymentMethod"
                            >
                                Payment Method
                            </label>


                            <select
                                id="paymentMethod"
                                required
                            >

                                <option value="">
                                    Select Method
                                </option>


                                <option
                                    value="cash"
                                >
                                    Cash
                                </option>


                                <option
                                    value="pos"
                                >
                                    POS
                                </option>


                                <option
                                    value="transfer"
                                >
                                    Bank Transfer
                                </option>


                                <option
                                    value="credit"
                                >
                                    Credit
                                </option>


                                <option
                                    value="other"
                                >
                                    Other
                                </option>


                            </select>

                        </div>



                        <!-- AMOUNT -->

                        <div
                            class="form-group"
                        >

                            <label
                                for="paymentAmount"
                            >
                                Amount (₦)
                            </label>


                            <input
                                type="number"
                                id="paymentAmount"
                                min="1"
                                step="0.01"
                                placeholder="Enter amount"
                                required
                            >

                        </div>



                        <!-- PAYMENT DATE -->

                        <div
                            class="form-group"
                        >

                            <label
                                for="paymentDate"
                            >
                                Payment Date & Time
                            </label>


                            <input
                                type="datetime-local"
                                id="paymentDate"
                                required
                            >

                        </div>


                    </div>



                    <!-- NOTES -->

                    <div
                        class="form-group"
                    >

                        <label
                            for="paymentNotes"
                        >
                            Notes
                            (Optional)
                        </label>


                        <textarea
                            id="paymentNotes"
                            rows="3"
                            placeholder="Add payment notes..."
                        ></textarea>

                    </div>



                    <!-- MODAL ACTIONS -->

                    <div
                        class="modal-actions"
                    >


                        <button
                            type="button"
                            class="btn btn-outline"
                            id="cancelPaymentButton"
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            class="btn btn-primary"
                        >
                            Save Payment
                        </button>


                    </div>


                </form>


            </div>


        </div>

    `;


    /*
       SET DEFAULT DATE & TIME
    */

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
   SETUP PAYMENT EVENTS
========================================== */

function setupPaymentEvents() {

    loadPaymentFilters();

    loadPaymentFormStations();

    setupPaymentModalEvents();

    setupPaymentFormEvents();

    setupPaymentFilterEvents();

}


/* ==========================================
   PAYMENT MODAL EVENTS
========================================== */

function setupPaymentModalEvents() {

    const addPaymentButton =
        document.getElementById(
            "addPaymentButton"
        );


    const paymentModal =
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


    if (addPaymentButton) {

        addPaymentButton.addEventListener(
            "click",
            () => {

                openPaymentModal();

            }
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            () => {

                closePaymentModal();

            }
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            () => {

                closePaymentModal();

            }
        );

    }


    if (paymentModal) {

        paymentModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    paymentModal
                ) {

                    closePaymentModal();

                }

            }
        );

    }

}


/* ==========================================
   OPEN PAYMENT MODAL
========================================== */

function openPaymentModal() {

    const modal =
        document.getElementById(
            "paymentModal"
        );


    if (!modal) {

        return;

    }


    modal.classList.add(
        "active"
    );


    document.body.style.overflow =
        "hidden";

}


/* ==========================================
   CLOSE PAYMENT MODAL
========================================== */

function closePaymentModal() {

    const modal =
        document.getElementById(
            "paymentModal"
        );


    if (!modal) {

        return;

    }


    modal.classList.remove(
        "active"
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
   LOAD PAYMENT FILTERS
========================================== */

function loadPaymentFilters() {

    loadPaymentStationFilter();

    loadPaymentShiftFilter();

}


/* ==========================================
   LOAD STATION FILTER
========================================== */

function loadPaymentStationFilter() {

    const select =
        document.getElementById(
            "paymentStationFilter"
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
                station.name ||
                "Unnamed Station";


            select.appendChild(
                option
            );

        }
    );

}


/* ==========================================
   LOAD SHIFT FILTER
========================================== */

function loadPaymentShiftFilter() {

    const select =
        document.getElementById(
            "paymentShiftFilter"
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
                station.name ||
                "Unnamed Station";


            select.appendChild(
                option
            );

        }
    );

}


/* ==========================================
   SETUP FORM EVENTS
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
   LOAD SHIFTS FOR FORM
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
        getShifts()
            .filter(
                shift =>
                    shift.stationId ===
                    stationId
            );


    shifts.forEach(
        shift => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                shift.id;


            const status =
                (
                    shift.status ||
                    "unknown"
                )
                    .toUpperCase();


            option.textContent =
                `${shift.name} (${status})`;


            select.appendChild(
                option
            );

        }
    );

}


/* ==========================================
   LOAD STAFF FOR FORM
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
        getStaff()
            .filter(
                staff =>
                    staff.stationId ===
                    stationId
            );


    staffMembers.forEach(
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
   HANDLE PAYMENT SUBMIT
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
        ).value
            .trim();


    /*
       VALIDATION
    */

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
        Number.isNaN(
            amount
        ) ||

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


    /*
       MAKE SURE SHIFT
       BELONGS TO STATION
    */

    if (
        !shift ||

        shift.stationId !==
        stationId
    ) {

        showPaymentMessage(
            "The selected shift does not belong to this station.",
            "error"
        );

        return;

    }


    /*
       MAKE SURE STAFF
       BELONGS TO STATION
    */

    if (
        !staff ||

        staff.stationId !==
        stationId
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
                Math.random() *
                1000
            )}`,

        organizationId:
            station
                ? station.organizationId
                : null,

        stationId,

        stationName:
            station
                ? station.name
                : "Unknown Station",

        shiftId,

        shiftName:
            shift
                ? shift.name
                : "Unknown Shift",

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
                    currentUser.name
                )
                : "Unknown",

        createdAt:
            new Date()
                .toISOString()

    };


    /*
       SAVE PAYMENT
    */

    const payments =
        getPayments();


    payments.push(
        payment
    );


    saveStorageData(
        PAYMENTS_STORAGE_KEY,
        payments
    );


    /*
       SUCCESS
    */

    showPaymentMessage(
        "Payment recorded successfully.",
        "success"
    );


    /*
       REFRESH TABLE
    */

    renderPayments();


    /*
       CLOSE MODAL
    */

    setTimeout(
        () => {

            closePaymentModal();

        },
        700
    );

}


/* ==========================================
   PAYMENT FILTER EVENTS
========================================== */

function setupPaymentFilterEvents() {

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


    if (stationFilter) {

        stationFilter.addEventListener(
            "change",
            () => {

                renderPayments();

            }
        );

    }


    if (shiftFilter) {

        shiftFilter.addEventListener(
            "change",
            () => {

                renderPayments();

            }
        );

    }


    if (methodFilter) {

        methodFilter.addEventListener(
            "change",
            () => {

                renderPayments();

            }
        );

    }


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            () => {

                renderPayments();

            }
        );

    }

}


/* ==========================================
   GET PAYMENT FILTERS
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


            if (
                filters.search
            ) {

                const searchText =
                    `
                        ${payment.stationName}
                        ${payment.shiftName}
                        ${payment.staffName}
                        ${payment.method}
                        ${payment.recordedByName}
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
   GET VISIBLE PAYMENTS
========================================== */

function getVisiblePayments() {

    const visibleStationIds =
        getVisibleStationIds();


    return getPayments()
        .filter(
            payment =>
                visibleStationIds.includes(
                    payment.stationId
                )
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


    tableBody.innerHTML =
        "";


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


        filteredPayments
            .sort(
                (
                    a,
                    b
                ) => {

                    return (
                        new Date(
                            b.paymentDate
                        ) -

                        new Date(
                            a.paymentDate
                        )
                    );

                }
            )
            .forEach(
                payment => {

                    const row =
                        document.createElement(
                            "tr"
                        );


                    row.innerHTML = `

                        <td>
                            ${escapeHTML(
                                payment.stationName
                            )}
                        </td>


                        <td>
                            <strong>
                                ${escapeHTML(
                                    payment.shiftName
                                )}
                            </strong>
                        </td>


                        <td>
                            ${escapeHTML(
                                payment.staffName
                            )}
                        </td>


                        <td>
                            ${formatPaymentMethod(
                                payment.method
                            )}
                        </td>


                        <td>
                            <strong>
                                ${formatCurrency(
                                    payment.amount
                                )}
                            </strong>
                        </td>


                        <td>
                            ${escapeHTML(
                                payment.recordedByName
                            )}
                        </td>


                        <td>
                            ${formatDateTime(
                                payment.paymentDate
                            )}
                        </td>


                        <td>

                            <button
                                type="button"
                                class="btn btn-outline btn-small"
                                data-delete-payment="${payment.id}"
                            >
                                Delete
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

}


/* ==========================================
   DELETE BUTTON EVENTS
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

                    const paymentId =
                        button.getAttribute(
                            "data-delete-payment"
                        );


                    deletePayment(
                        paymentId
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

    const confirmed =
        window.confirm(
            "Are you sure you want to delete this payment record?"
        );


    if (!confirmed) {

        return;

    }


    const payments =
        getPayments();


    const updatedPayments =
        payments.filter(
            payment =>
                payment.id !==
                paymentId
        );


    saveStorageData(
        PAYMENTS_STORAGE_KEY,
        updatedPayments
    );


    renderPayments();

}


/* ==========================================
   UPDATE PAYMENT STATS
========================================== */

function updatePaymentStats(
    payments
) {

    const totalPayments =
        payments.reduce(
            (
                total,
                payment
            ) => {

                return (
                    total +
                    Number(
                        payment.amount
                    )
                );

            },
            0
        );


    const totalCash =
        payments
            .filter(
                payment =>
                    payment.method ===
                    "cash"
            )
            .reduce(
                (
                    total,
                    payment
                ) => {

                    return (
                        total +
                        Number(
                            payment.amount
                        )
                    );

                },
                0
            );


    const totalPOS =
        payments
            .filter(
                payment =>
                    payment.method ===
                    "pos"
            )
            .reduce(
                (
                    total,
                    payment
                ) => {

                    return (
                        total +
                        Number(
                            payment.amount
                        )
                    );

                },
                0
            );


    const totalPaymentElement =
        document.getElementById(
            "totalPaymentAmount"
        );


    const cashElement =
        document.getElementById(
            "cashPaymentAmount"
        );


    const posElement =
        document.getElementById(
            "posPaymentAmount"
        );


    const recordCountElement =
        document.getElementById(
            "paymentRecordCount"
        );


    if (
        totalPaymentElement
    ) {

        totalPaymentElement.textContent =
            formatCurrency(
                totalPayments
            );

    }


    if (
        cashElement
    ) {

        cashElement.textContent =
            formatCurrency(
                totalCash
            );

    }


    if (
        posElement
    ) {

        posElement.textContent =
            formatCurrency(
                totalPOS
            );

    }


    if (
        recordCountElement
    ) {

        recordCountElement.textContent =
            payments.length;

    }

}


/* ==========================================
   PAYMENT MESSAGE
========================================== */

function showPaymentMessage(
    message,
    type
) {

    const messageElement =
        document.getElementById(
            "paymentMessage"
        );


    if (!messageElement) {

        return;

    }


    messageElement.innerHTML = `

        <div class="
            form-message
            ${type}
        ">

            ${escapeHTML(
                message
            )}

        </div>

    `;

}


/* ==========================================
   CLEAR PAYMENT MESSAGE
========================================== */

function clearPaymentMessage() {

    const messageElement =
        document.getElementById(
            "paymentMessage"
        );


    if (messageElement) {

        messageElement.innerHTML =
            "";

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
   FORMAT PAYMENT METHOD
========================================== */

function formatPaymentMethod(
    method
) {

    const methods = {

        cash:
            "Cash",

        pos:
            "POS",

        transfer:
            "Bank Transfer",

        credit:
            "Credit",

        other:
            "Other"

    };


    return (
        methods[
            method
        ] ||

        method ||

        "Unknown"
    );

}


/* ==========================================
   FORMAT DATE & TIME
========================================== */

function formatDateTime(
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


    return date.toLocaleString(
        "en-NG",
        {

            year:
                "numeric",

            month:
                "short",

            day:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"

        }
    );

}


/* ==========================================
   GET CURRENT DATETIME FOR INPUT
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
   ESCAPE HTML
========================================== */

function escapeHTML(
    value
) {

    if (
        value ===
            null ||

        value ===
            undefined
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