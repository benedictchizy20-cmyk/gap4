/* ==========================================
   FUELGAP - STAFF MANAGEMENT
   Works with the dynamic app.js structure
========================================== */

const STAFF_STORAGE_KEY = "fuelgap_staff";
const STATIONS_STORAGE_KEY = "fuelgap_stations";
const MOCK_USERS_STORAGE_KEY = "fuelgap_mock_users";


document.addEventListener("DOMContentLoaded", () => {

    const currentUser = FuelGapUtils.getCurrentUser();

    /* =========================
       AUTH CHECK
    ========================= */

    if (!currentUser) {

        window.location.href = "../login.html";
        return;

    }


    /* =========================
       PERMISSION CHECK
    ========================= */

    if (
        currentUser.role !== "owner" &&
        currentUser.role !== "admin"
    ) {

        window.location.href = "./dashboard.html";
        return;

    }


    /*
       app.js also listens for DOMContentLoaded.

       We wait briefly to ensure app.js has
       created #pageContent.
    */

    setTimeout(() => {

        renderStaffPage();

        setupStaffEvents();

        renderStaff();

    }, 0);

});


/* ==========================================
   GET MOCK USERS
========================================== */

function getMockUsers() {

    try {

        const savedUsers = localStorage.getItem(
            MOCK_USERS_STORAGE_KEY
        );


        if (!savedUsers) {

            return [];

        }


        return JSON.parse(
            savedUsers
        );

    } catch (error) {

        console.error(
            "Unable to load users:",
            error
        );


        return [];

    }

}


/* ==========================================
   SAVE MOCK USERS
========================================== */

function saveMockUsers(users) {

    try {

        localStorage.setItem(

            MOCK_USERS_STORAGE_KEY,

            JSON.stringify(users)

        );

    } catch (error) {

        console.error(
            "Unable to save users:",
            error
        );

    }

}


/* ==========================================
   GET STATIONS
========================================== */

function getStations() {

    try {

        return JSON.parse(

            localStorage.getItem(
                STATIONS_STORAGE_KEY
            )

        ) || [];

    } catch (error) {

        console.error(
            "Unable to load stations:",
            error
        );


        return [];

    }

}


/* ==========================================
   GET STAFF
========================================== */

function getStaff() {

    const currentUser =
        FuelGapUtils.getCurrentUser();


    try {

        const staff = JSON.parse(

            localStorage.getItem(
                STAFF_STORAGE_KEY
            )

        ) || [];


        /*
           Admin can see all staff.
        */

        if (
            currentUser.role === "admin"
        ) {

            return staff;

        }


        /*
           Owner only sees staff inside
           their organization.
        */

        return staff.filter(

            member =>

                member.organizationId ===
                currentUser.organizationId

        );

    } catch (error) {

        console.error(
            "Unable to load staff:",
            error
        );


        return [];

    }

}


/* ==========================================
   SAVE STAFF
========================================== */

function saveStaff(staff) {

    localStorage.setItem(

        STAFF_STORAGE_KEY,

        JSON.stringify(staff)

    );

}


/* ==========================================
   RENDER STAFF PAGE
========================================== */

function renderStaffPage() {

    const pageContent =
        document.getElementById(
            "pageContent"
        );


    if (!pageContent) {

        console.error(
            "pageContent was not found."
        );

        return;

    }


    pageContent.innerHTML = `

        <!-- =========================
             PAGE HEADER
        ========================== -->

        <div class="page-header">

            <div>

                <p class="page-eyebrow">
                    TEAM MANAGEMENT
                </p>

                <h1>
                    Staff Management
                </h1>

                <p>
                    Create and manage Managers
                    and Attendants for your
                    fuel stations.
                </p>

            </div>


            <button
                id="openStaffModal"
                class="btn btn-primary"
                type="button"
            >
                + Add Staff
            </button>

        </div>



        <!-- =========================
             STAFF STATISTICS
        ========================== -->

        <section class="staff-stats">


            <div class="staff-stat-card">

                <span>
                    Total Staff
                </span>

                <strong id="totalStaff">
                    0
                </strong>

            </div>


            <div class="staff-stat-card">

                <span>
                    Managers
                </span>

                <strong id="totalManagers">
                    0
                </strong>

            </div>


            <div class="staff-stat-card">

                <span>
                    Attendants
                </span>

                <strong id="totalAttendants">
                    0
                </strong>

            </div>


        </section>



        <!-- =========================
             STAFF TABLE
        ========================== -->

        <section class="staff-section">


            <div class="section-header">

                <div>

                    <h2>
                        Your Staff
                    </h2>

                    <p>
                        Manage your station
                        employees and access.
                    </p>

                </div>


                <input
                    type="search"
                    id="staffSearch"
                    placeholder="Search staff..."
                >

            </div>



            <div class="table-wrapper">

                <table class="staff-table">

                    <thead>

                        <tr>

                            <th>
                                Name
                            </th>

                            <th>
                                Email
                            </th>

                            <th>
                                Phone
                            </th>

                            <th>
                                Role
                            </th>

                            <th>
                                Station
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
                        id="staffTableBody"
                    >

                    </tbody>

                </table>

            </div>



            <div
                id="emptyStaffState"
                class="empty-state hidden"
            >

                <h3>
                    No staff yet
                </h3>

                <p>
                    Click Add Staff to create
                    your first Manager or
                    Attendant.
                </p>

            </div>


        </section>



        <!-- =========================
             ADD STAFF MODAL
        ========================== -->

        <div
            id="staffModal"
            class="modal hidden"
        >

            <div
                class="modal-overlay"
            ></div>


            <div
                class="modal-content"
            >


                <button
                    id="closeStaffModal"
                    class="modal-close"
                    type="button"
                >
                    ×
                </button>



                <div
                    class="modal-header"
                >

                    <h2>
                        Add Staff Member
                    </h2>

                    <p>
                        Create a staff account
                        and assign the staff
                        member to a station.
                    </p>

                </div>



                <form
                    id="staffForm"
                >


                    <div
                        class="form-group"
                    >

                        <label
                            for="staffFullName"
                        >
                            Full Name
                        </label>


                        <input

                            type="text"

                            id="staffFullName"

                            name="fullName"

                            placeholder="Enter full name"

                            required

                        >

                    </div>



                    <div
                        class="form-group"
                    >

                        <label
                            for="staffEmail"
                        >
                            Email Address
                        </label>


                        <input

                            type="email"

                            id="staffEmail"

                            name="email"

                            placeholder="staff@email.com"

                            required

                        >

                    </div>



                    <div
                        class="form-group"
                    >

                        <label
                            for="staffPhone"
                        >
                            Phone Number
                        </label>


                        <input

                            type="tel"

                            id="staffPhone"

                            name="phone"

                            placeholder="080XXXXXXXX"

                        >

                    </div>



                    <div
                        class="form-group"
                    >

                        <label
                            for="staffRole"
                        >
                            Role
                        </label>


                        <select

                            id="staffRole"

                            name="role"

                            required

                        >

                            <option value="">
                                Select role
                            </option>

                            <option value="manager">
                                Manager
                            </option>

                            <option value="attendant">
                                Attendant
                            </option>

                        </select>

                    </div>



                    <div
                        class="form-group"
                    >

                        <label
                            for="staffStation"
                        >
                            Assign Fuel Station
                        </label>


                        <select

                            id="staffStation"

                            name="stationId"

                            required

                        >

                            <option value="">
                                Select station
                            </option>

                        </select>

                    </div>



                    <div
                        class="form-group"
                    >

                        <label
                            for="staffPassword"
                        >
                            Temporary Password
                        </label>


                        <input

                            type="password"

                            id="staffPassword"

                            name="password"

                            placeholder="Minimum 8 characters"

                            required

                        >

                    </div>



                    <div

                        id="staffMessage"

                        class="form-message hidden"

                    ></div>



                    <button

                        type="submit"

                        class="btn btn-primary"

                    >

                        Create Staff Account

                    </button>


                </form>


            </div>


        </div>

    `;

}


/* ==========================================
   SETUP STAFF EVENTS
========================================== */

function setupStaffEvents() {

    setupStaffModal();

    setupStaffForm();

    setupStaffSearch();

}


/* ==========================================
   STAFF MODAL
========================================== */

function setupStaffModal() {

    const modal =
        document.getElementById(
            "staffModal"
        );


    const openButton =
        document.getElementById(
            "openStaffModal"
        );


    const closeButton =
        document.getElementById(
            "closeStaffModal"
        );


    const overlay =
        modal
            ? modal.querySelector(
                ".modal-overlay"
            )
            : null;


    if (
        !modal
    ) {

        return;

    }


    if (
        openButton
    ) {

        openButton.addEventListener(

            "click",

            () => {

                loadStationsIntoSelect();

                modal.classList.remove(
                    "hidden"
                );

            }

        );

    }


    if (
        closeButton
    ) {

        closeButton.addEventListener(

            "click",

            () => {

                modal.classList.add(
                    "hidden"
                );

            }

        );

    }


    if (
        overlay
    ) {

        overlay.addEventListener(

            "click",

            () => {

                modal.classList.add(
                    "hidden"
                );

            }

        );

    }

}


/* ==========================================
   LOAD STATIONS INTO SELECT
========================================== */

function loadStationsIntoSelect() {

    const currentUser =
        FuelGapUtils.getCurrentUser();


    const stationSelect =
        document.getElementById(
            "staffStation"
        );


    if (
        !stationSelect
    ) {

        return;

    }


    const stations =
        getStations();


    /*
       Admin can select any station.
       Owner only sees their own stations.
    */

    const availableStations =

        currentUser.role === "admin"

            ? stations

            : stations.filter(

                station =>

                    station.organizationId ===
                    currentUser.organizationId

            );


    stationSelect.innerHTML = `

        <option value="">
            Select station
        </option>

    `;


    availableStations.forEach(

        station => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                station.id;


            option.textContent =
                station.name;


            stationSelect.appendChild(
                option
            );

        }

    );


    /*
       Show helpful message when
       the owner has no stations.
    */

    if (
        availableStations.length === 0
    ) {

        stationSelect.innerHTML = `

            <option value="">
                No stations available
            </option>

        `;

    }

}


/* ==========================================
   CREATE STAFF
========================================== */

function setupStaffForm() {

    const form =
        document.getElementById("staffForm");


    if (!form) {

        console.error(
            "Staff form was not found."
        );

        return;

    }


    /*
       Remove any previous handler.
    */

    form.onsubmit = null;


    form.addEventListener(
        "submit",
        handleStaffSubmit
    );

}


function handleStaffSubmit(event) {

    event.preventDefault();


    console.log(
        "CREATE STAFF BUTTON CLICKED"
    );


    const form =
        event.currentTarget;


    const message =
        document.getElementById(
            "staffMessage"
        );


    try {

        const fullName =
            form.elements[
                "fullName"
            ].value.trim();


        const email =
            form.elements[
                "email"
            ].value
                .trim()
                .toLowerCase();


        const phone =
            form.elements[
                "phone"
            ].value.trim();


        const role =
            form.elements[
                "role"
            ].value;


        const stationId =
            form.elements[
                "stationId"
            ].value;


        const password =
            form.elements[
                "password"
            ].value;


        /* =========================
           VALIDATION
        ========================= */

        if (
            !fullName ||
            !email ||
            !role ||
            !stationId ||
            !password
        ) {

            showStaffMessage(

                message,

                "Please complete all required fields.",

                "error"

            );

            return;

        }


        if (
            password.length < 8
        ) {

            showStaffMessage(

                message,

                "Password must contain at least 8 characters.",

                "error"

            );

            return;

        }


        /* =========================
           GET STATIONS
        ========================= */

        const stations =
            getStations();


        const selectedStation =
            stations.find(

                station =>

                    station.id ===
                    stationId

            );


        if (!selectedStation) {

            showStaffMessage(

                message,

                "Selected station could not be found.",

                "error"

            );

            return;

        }


        /*
           Get organization directly
           from the selected station.
        */

        const organizationId =
            selectedStation.organizationId;


        if (!organizationId) {

            showStaffMessage(

                message,

                "This station is not connected to an organization.",

                "error"

            );

            return;

        }


        /* =========================
           GET EXISTING USERS
        ========================= */

        const users =
            getMockUsers();


        const existingUser =
            users.find(

                user =>

                    user.email &&
                    user.email
                        .toLowerCase() ===
                    email

            );


        if (existingUser) {

            showStaffMessage(

                message,

                "A user with this email already exists.",

                "error"

            );

            return;

        }


        /* =========================
           CREATE USER
        ========================= */

        const userId =
            `USR-${Date.now()}`;


        const newStaff = {

            id:
                userId,

            fullName,

            email,

            phone,

            password,

            role,

            organizationId,

            stationId,

            status:
                "active",

            createdAt:
                new Date()
                    .toISOString()

        };


        /* =========================
           SAVE LOGIN ACCOUNT
        ========================= */

        users.push(
            newStaff
        );


        saveMockUsers(
            users
        );


        /* =========================
           GET ALL STAFF
        ========================= */

        let allStaff =
            [];


        try {

            allStaff =
                JSON.parse(

                    localStorage.getItem(
                        STAFF_STORAGE_KEY
                    )

                ) || [];

        } catch (error) {

            console.error(
                "Unable to load staff:",
                error
            );

        }


        /* =========================
           SAVE STAFF PROFILE
        ========================= */

        allStaff.push(
            newStaff
        );


        saveStaff(
            allStaff
        );


        console.log(
            "STAFF CREATED:",
            newStaff
        );


        /* =========================
           SUCCESS MESSAGE
        ========================= */

        showStaffMessage(

            message,

            role === "manager"

                ? "Manager account created successfully."

                : "Attendant account created successfully.",

            "success"

        );


        /* =========================
           UPDATE STAFF TABLE
        ========================= */

        renderStaff();


        /* =========================
           RESET FORM
        ========================= */

        form.reset();


        /* =========================
           CLOSE MODAL
        ========================= */

        setTimeout(

            () => {

                const modal =
                    document.getElementById(
                        "staffModal"
                    );


                if (modal) {

                    modal.classList.add(
                        "hidden"
                    );

                }

            },

            1200

        );

    } catch (error) {

        console.error(
            "Staff creation error:",
            error
        );


        showStaffMessage(

            message,

            error.message ||
            "Unable to create staff account.",

            "error"

        );

    }

}
function showStaffMessage(
    element,
    message,
    type
) {

    if (!element) {

        alert(message);

        return;

    }


    element.textContent =
        message;


    element.className =
        `form-message ${type}`;


    element.classList.remove(
        "hidden"
    );

}


/* ==========================================
   RENDER STAFF
========================================== */

function renderStaff(
    searchTerm = ""
) {

    const staff =
        getStaff();


    const stations =
        getStations();


    const tableBody =
        document.getElementById(
            "staffTableBody"
        );


    const emptyState =
        document.getElementById(
            "emptyStaffState"
        );


    if (
        !tableBody
    ) {

        return;

    }


    const search =
        searchTerm
            .toLowerCase()
            .trim();


    const filteredStaff =
        staff.filter(

            member => {

                const name =
                    (
                        member.fullName ||
                        ""
                    )
                        .toLowerCase();


                const email =
                    (
                        member.email ||
                        ""
                    )
                        .toLowerCase();


                return (

                    name.includes(
                        search
                    ) ||

                    email.includes(
                        search
                    )

                );

            }

        );


    tableBody.innerHTML =
        "";


    if (
        filteredStaff.length === 0
    ) {

        if (
            emptyState
        ) {

            emptyState.classList.remove(
                "hidden"
            );

        }

    } else {

        if (
            emptyState
        ) {

            emptyState.classList.add(
                "hidden"
            );

        }


        filteredStaff.forEach(

            member => {

                const station =
                    stations.find(

                        item =>

                            item.id ===
                            member.stationId

                    );


                const stationName =
                    station

                        ? station.name

                        : "Not assigned";


                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>
                        ${member.fullName || "-"}
                    </td>


                    <td>
                        ${member.email || "-"}
                    </td>


                    <td>
                        ${member.phone || "-"}
                    </td>


                    <td>

                        <span
                            class="
                                role-badge
                                ${member.role}
                            "
                        >

                            ${capitalize(
                                member.role
                            )}

                        </span>

                    </td>


                    <td>
                        ${stationName}
                    </td>


                    <td>

                        <span
                            class="
                                status-badge
                            "
                        >

                            ${capitalize(
                                member.status
                            )}

                        </span>

                    </td>


                    <td>

                        <button

                            type="button"

                            class="
                                delete-staff-btn
                            "

                            data-id="
                                ${member.id}
                            "

                        >

                            Remove

                        </button>

                    </td>

                `;


                tableBody.appendChild(
                    row
                );

            }

        );

    }


    updateStaffStats(
        staff
    );


    setupDeleteButtons();

}


/* ==========================================
   STAFF STATISTICS
========================================== */

function updateStaffStats(
    staff
) {

    const total =
        staff.length;


    const managers =
        staff.filter(

            member =>

                member.role ===
                "manager"

        ).length;


    const attendants =
        staff.filter(

            member =>

                member.role ===
                "attendant"

        ).length;


    const totalElement =
        document.getElementById(
            "totalStaff"
        );


    const managersElement =
        document.getElementById(
            "totalManagers"
        );


    const attendantsElement =
        document.getElementById(
            "totalAttendants"
        );


    if (
        totalElement
    ) {

        totalElement.textContent =
            total;

    }


    if (
        managersElement
    ) {

        managersElement.textContent =
            managers;

    }


    if (
        attendantsElement
    ) {

        attendantsElement.textContent =
            attendants;

    }

}


/* ==========================================
   DELETE BUTTONS
========================================== */

function setupDeleteButtons() {

    const buttons =
        document.querySelectorAll(
            ".delete-staff-btn"
        );


    buttons.forEach(

        button => {

            button.addEventListener(

                "click",

                () => {

                    const staffId =
                        button.dataset.id;


                    removeStaff(
                        staffId
                    );

                }

            );

        }

    );

}


/* ==========================================
   REMOVE STAFF
========================================== */

function removeStaff(
    staffId
) {

    const confirmed =
        confirm(

            "Are you sure you want to remove this staff member?"

        );


    if (
        !confirmed
    ) {

        return;

    }


    let allStaff = [];


    try {

        allStaff =
            JSON.parse(

                localStorage.getItem(
                    STAFF_STORAGE_KEY
                )

            ) || [];

    } catch (
        error
    ) {

        console.error(
            "Unable to load staff:",
            error
        );

    }


    /*
       Remove from staff list.
    */

    allStaff =
        allStaff.filter(

            member =>

                member.id !==
                staffId

        );


    saveStaff(
        allStaff
    );


    /*
       Remove login account.
    */

    let users =
        getMockUsers();


    users =
        users.filter(

            user =>

                user.id !==
                staffId

        );


    saveMockUsers(
        users
    );


    renderStaff();

}


/* ==========================================
   STAFF SEARCH
========================================== */

function setupStaffSearch() {

    const searchInput =
        document.getElementById(
            "staffSearch"
        );


    if (
        !searchInput
    ) {

        return;

    }


    searchInput.addEventListener(

        "input",

        event => {

            renderStaff(
                event.target.value
            );

        }

    );

}


/* ==========================================
   CAPITALIZE
========================================== */

function capitalize(
    value
) {

    if (
        !value
    ) {

        return "";

    }


    return (

        value
            .charAt(0)
            .toUpperCase() +

        value
            .slice(1)

    );

}