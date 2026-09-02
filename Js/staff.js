/* =========================================================
   FUELGAP - STAFF MANAGEMENT
   Professional / Dynamic Version
========================================================= */


/* =========================================================
   STORAGE KEYS
========================================================= */

const STAFF_STORAGE_KEY = "fuelgap_staff";
const STATIONS_STORAGE_KEY = "fuelgap_stations";
const MOCK_USERS_STORAGE_KEY = "fuelgap_mock_users";


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initializeStaffPage();
});


function initializeStaffPage() {
    const currentUser = getCurrentStaffUser();

    if (!currentUser) {
        window.location.href = "../login.html";
        return;
    }

    /*
      Only owners and admins can manage staff.
    */
    if (
        currentUser.role !== "owner" &&
        currentUser.role !== "admin"
    ) {
        window.location.href = "./dashboard.html";
        return;
    }

    /*
      Render after the page shell has loaded.
    */
    setTimeout(() => {
        renderStaffPage();
        setupStaffEvents();
        renderStaff();
    }, 0);
}


/* =========================================================
   STORAGE HELPERS
========================================================= */

function getStorageData(key) {
    try {
        const data = localStorage.getItem(key);

        if (!data) {
            return [];
        }

        const parsed = JSON.parse(data);

        return Array.isArray(parsed) ? parsed : [];

    } catch (error) {
        console.error(`FuelGap storage error [${key}]:`, error);
        return [];
    }
}


function saveStorageData(key, data) {
    try {
        localStorage.setItem(
            key,
            JSON.stringify(data)
        );

        return true;

    } catch (error) {
        console.error(`FuelGap save error [${key}]:`, error);
        return false;
    }
}


/* =========================================================
   CURRENT USER
========================================================= */

function getCurrentStaffUser() {
    try {
        if (
            typeof FuelGapUtils !== "undefined" &&
            typeof FuelGapUtils.getCurrentUser === "function"
        ) {
            return FuelGapUtils.getCurrentUser();
        }

        console.warn(
            "FuelGapUtils.getCurrentUser() is unavailable."
        );

        return null;

    } catch (error) {
        console.error(
            "Unable to get current user:",
            error
        );

        return null;
    }
}


/* =========================================================
   MOCK USERS
========================================================= */

function getMockUsers() {
    return getStorageData(
        MOCK_USERS_STORAGE_KEY
    );
}


function saveMockUsers(users) {
    return saveStorageData(
        MOCK_USERS_STORAGE_KEY,
        users
    );
}


/* =========================================================
   STATIONS
========================================================= */

function getStations() {
    return getStorageData(
        STATIONS_STORAGE_KEY
    );
}


/* =========================================================
   STAFF
========================================================= */

function getAllStaff() {
    return getStorageData(
        STAFF_STORAGE_KEY
    );
}


function saveStaff(staff) {
    return saveStorageData(
        STAFF_STORAGE_KEY,
        staff
    );
}


/* =========================================================
   VISIBLE STAFF
========================================================= */

function getStaff() {
    const currentUser = getCurrentStaffUser();

    const staff = getAllStaff();

    if (!currentUser) {
        return [];
    }

    /*
      Admin can see everything.
    */
    if (currentUser.role === "admin") {
        return staff;
    }

    /*
      Owner can see staff belonging to
      their organization.
    */
    return staff.filter(
        member =>
            member.organizationId ===
            currentUser.organizationId
    );
}


/* =========================================================
   VISIBLE STATIONS
========================================================= */

function getVisibleStations() {
    const currentUser = getCurrentStaffUser();

    const stations = getStations();

    if (!currentUser) {
        return [];
    }

    /*
      Admin can see all stations.
    */
    if (currentUser.role === "admin") {
        return stations;
    }

    /*
      Owner can see stations in organization.
    */
    return stations.filter(
        station =>
            station.organizationId ===
            currentUser.organizationId
    );
}


/* =========================================================
   RENDER STAFF PAGE
========================================================= */

function renderStaffPage() {
    const pageContent =
        document.getElementById("pageContent");

    if (!pageContent) {
        console.error(
            "FuelGap Staff: #pageContent was not found."
        );
        return;
    }

    pageContent.innerHTML = `
        <section class="staff-page">

            <!-- =========================================
                 PAGE HEADER
            ========================================== -->

            <div class="page-header">

                <div class="page-header-content">

                    <div>
                        <div class="page-eyebrow">
                            PEOPLE & ACCESS
                        </div>

                        <h1>
                            Staff Management
                        </h1>

                        <p>
                            Manage staff accounts, roles,
                            station access and account status.
                        </p>
                    </div>

                    <div class="page-header-actions">

                        <button
                            type="button"
                            id="openStaffModal"
                            class="btn btn-primary"
                        >
                            <span class="btn-icon">+</span>
                            <span>Add Staff</span>
                        </button>

                    </div>

                </div>

            </div>


            <!-- =========================================
                 STAFF STATISTICS
            ========================================== -->

            <div class="stats-grid">

                <div class="stat-card">

                    <div class="stat-card-icon">
                        <span>👥</span>
                    </div>

                    <div class="stat-card-content">
                        <span class="stat-label">
                            Total Staff
                        </span>

                        <strong
                            id="totalStaff"
                            class="stat-value"
                        >
                            0
                        </strong>
                    </div>

                </div>


                <div class="stat-card">

                    <div class="stat-card-icon manager">
                        <span>◉</span>
                    </div>

                    <div class="stat-card-content">
                        <span class="stat-label">
                            Managers
                        </span>

                        <strong
                            id="totalManagers"
                            class="stat-value"
                        >
                            0
                        </strong>
                    </div>

                </div>


                <div class="stat-card">

                    <div class="stat-card-icon attendant">
                        <span>●</span>
                    </div>

                    <div class="stat-card-content">
                        <span class="stat-label">
                            Attendants
                        </span>

                        <strong
                            id="totalAttendants"
                            class="stat-value"
                        >
                            0
                        </strong>
                    </div>

                </div>


                <div class="stat-card">

                    <div class="stat-card-icon active">
                        <span>✓</span>
                    </div>

                    <div class="stat-card-content">
                        <span class="stat-label">
                            Active Staff
                        </span>

                        <strong
                            id="activeStaff"
                            class="stat-value"
                        >
                            0
                        </strong>
                    </div>

                </div>

            </div>


            <!-- =========================================
                 STAFF TABLE CARD
            ========================================== -->

            <div class="content-card staff-card">

                <div class="content-card-header">

                    <div>
                        <h2>
                            Staff Directory
                        </h2>

                        <p>
                            View and manage all staff members
                            in your organization.
                        </p>
                    </div>

                </div>


                <!-- =====================================
                     FILTERS
                ====================================== -->

                <div class="staff-filters">

                    <div class="filter-group">

                        <label for="staffStationFilter">
                            Station
                        </label>

                        <select
                            id="staffStationFilter"
                            class="form-control"
                        >
                            <option value="">
                                All Stations
                            </option>
                        </select>

                    </div>


                    <div class="filter-group">

                        <label for="staffRoleFilter">
                            Role
                        </label>

                        <select
                            id="staffRoleFilter"
                            class="form-control"
                        >
                            <option value="">
                                All Roles
                            </option>

                            <option value="manager">
                                Manager
                            </option>

                            <option value="attendant">
                                Attendant
                            </option>
                        </select>

                    </div>


                    <div class="filter-group">

                        <label for="staffStatusFilter">
                            Status
                        </label>

                        <select
                            id="staffStatusFilter"
                            class="form-control"
                        >
                            <option value="">
                                All Status
                            </option>

                            <option value="active">
                                Active
                            </option>

                            <option value="inactive">
                                Inactive
                            </option>
                        </select>

                    </div>


                    <div class="filter-group search-filter">

                        <label for="staffSearch">
                            Search
                        </label>

                        <div class="search-box">

                            <span class="search-icon">
                                ⌕
                            </span>

                            <input
                                type="search"
                                id="staffSearch"
                                class="form-control"
                                placeholder="Search staff..."
                                autocomplete="off"
                            />

                        </div>

                    </div>

                </div>


                <!-- =====================================
                     TABLE
                ====================================== -->

                <div class="table-container">

                    <table class="data-table">

                        <thead>

                            <tr>

                                <th>
                                    Staff Member
                                </th>

                                <th>
                                    Contact
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
                                    Created
                                </th>

                                <th class="actions-column">
                                    Actions
                                </th>

                            </tr>

                        </thead>

                        <tbody id="staffTableBody">
                        </tbody>

                    </table>

                </div>


                <!-- =====================================
                     EMPTY STATE
                ====================================== -->

                <div
                    id="emptyStaffState"
                    class="empty-state hidden"
                >

                    <div class="empty-state-icon">
                        👥
                    </div>

                    <h3>
                        No staff members found
                    </h3>

                    <p>
                        No staff members match your current
                        filters.
                    </p>

                    <button
                        type="button"
                        class="btn btn-primary"
                        id="emptyAddStaffButton"
                    >
                        Add Staff Member
                    </button>

                </div>

            </div>

        </section>


        <!-- =============================================
             STAFF MODAL
        ============================================== -->

        <div
            id="staffModal"
            class="modal hidden"
            aria-hidden="true"
        >

            <div
                class="modal-overlay"
                data-staff-modal-overlay
            ></div>

            <div
                class="modal-content"
                role="dialog"
                aria-modal="true"
                aria-labelledby="staffModalTitle"
            >

                <button
                    type="button"
                    id="closeStaffModal"
                    class="modal-close"
                    aria-label="Close modal"
                >
                    ×
                </button>


                <div class="modal-header">

                    <div class="modal-header-icon">
                        👤
                    </div>

                    <div>

                        <h2 id="staffModalTitle">
                            Add Staff Member
                        </h2>

                        <p id="staffModalDescription">
                            Create a staff account and assign
                            access to a station.
                        </p>

                    </div>

                </div>


                <form
                    id="staffForm"
                    autocomplete="off"
                >

                    <input
                        type="hidden"
                        id="editingStaffId"
                    />


                    <div
                        id="staffMessage"
                        class="form-message hidden"
                        role="alert"
                    ></div>


                    <div class="form-grid">

                        <!-- FULL NAME -->

                        <div class="form-group">

                            <label for="staffFullName">
                                Full Name
                                <span>*</span>
                            </label>

                            <input
                                type="text"
                                id="staffFullName"
                                class="form-control"
                                placeholder="e.g. John Okoro"
                                autocomplete="name"
                            />

                        </div>


                        <!-- EMAIL -->

                        <div class="form-group">

                            <label for="staffEmail">
                                Email Address
                                <span>*</span>
                            </label>

                            <input
                                type="email"
                                id="staffEmail"
                                class="form-control"
                                placeholder="staff@example.com"
                                autocomplete="email"
                            />

                        </div>


                        <!-- PHONE -->

                        <div class="form-group">

                            <label for="staffPhone">
                                Phone Number
                            </label>

                            <input
                                type="tel"
                                id="staffPhone"
                                class="form-control"
                                placeholder="08012345678"
                                autocomplete="tel"
                            />

                        </div>


                        <!-- ROLE -->

                        <div class="form-group">

                            <label for="staffRole">
                                Role
                                <span>*</span>
                            </label>

                            <select
                                id="staffRole"
                                class="form-control"
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


                        <!-- STATION -->

                        <div class="form-group form-group-full">

                            <label for="staffStation">
                                Assigned Station
                                <span>*</span>
                            </label>

                            <select
                                id="staffStation"
                                class="form-control"
                            >

                                <option value="">
                                    Select station
                                </option>

                            </select>

                            <small class="form-help">
                                The staff member will only be able
                                to operate within this station.
                            </small>

                        </div>


                        <!-- PASSWORD -->

                        <div
                            class="form-group form-group-full"
                            id="staffPasswordGroup"
                        >

                            <label for="staffPassword">
                                Password
                                <span id="passwordRequiredMark">
                                    *
                                </span>
                            </label>

                            <input
                                type="password"
                                id="staffPassword"
                                class="form-control"
                                placeholder="Minimum 8 characters"
                                autocomplete="new-password"
                            />

                            <small class="form-help">
                                Use at least 8 characters.
                            </small>

                        </div>

                    </div>


                    <!-- MODAL ACTIONS -->

                    <div class="modal-actions">

                        <button
                            type="button"
                            id="cancelStaffButton"
                            class="btn btn-secondary"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            id="saveStaffButton"
                            class="btn btn-primary"
                        >
                            Create Staff Account
                        </button>

                    </div>

                </form>

            </div>

        </div>
    `;
}


/* =========================================================
   EVENT SETUP
========================================================= */

function setupStaffEvents() {

    /*
      IMPORTANT:
      We intentionally use event delegation here.

      This means the events continue working even if
      #pageContent is replaced dynamically by app.js.
    */

    if (window.__fuelgapStaffEventsReady) {
        return;
    }

    window.__fuelgapStaffEventsReady = true;


    /* =============================================
       CLICK EVENTS
    ============================================== */

    document.addEventListener("click", event => {

        /*
          ADD STAFF
        */

        const addButton =
            event.target.closest(
                "#openStaffModal, #emptyAddStaffButton"
            );

        if (addButton) {
            event.preventDefault();
            openStaffModal();
            return;
        }


        /*
          CLOSE BUTTON
        */

        const closeButton =
            event.target.closest(
                "#closeStaffModal"
            );

        if (closeButton) {
            event.preventDefault();
            closeStaffModal();
            return;
        }


        /*
          CANCEL BUTTON
        */

        const cancelButton =
            event.target.closest(
                "#cancelStaffButton"
            );

        if (cancelButton) {
            event.preventDefault();
            closeStaffModal();
            return;
        }


        /*
          MODAL OVERLAY
        */

        const overlay =
            event.target.closest(
                "[data-staff-modal-overlay]"
            );

        if (
            overlay &&
            event.target === overlay
        ) {
            closeStaffModal();
            return;
        }


        /*
          EDIT STAFF
        */

        const editButton =
            event.target.closest(
                "[data-action='edit-staff']"
            );

        if (editButton) {

            const staffId =
                editButton.dataset.staffId;

            if (staffId) {
                editStaff(staffId);
            }

            return;
        }


        /*
          TOGGLE STATUS
        */

        const toggleButton =
            event.target.closest(
                "[data-action='toggle-staff']"
            );

        if (toggleButton) {

            const staffId =
                toggleButton.dataset.staffId;

            if (staffId) {
                toggleStaffStatus(staffId);
            }

            return;
        }


        /*
          REMOVE STAFF
        */

        const removeButton =
            event.target.closest(
                "[data-action='remove-staff']"
            );

        if (removeButton) {

            const staffId =
                removeButton.dataset.staffId;

            if (staffId) {
                removeStaff(staffId);
            }

            return;
        }

    });


    /* =============================================
       FORM SUBMIT
    ============================================== */

    document.addEventListener("submit", event => {

        if (
            event.target &&
            event.target.id === "staffForm"
        ) {
            event.preventDefault();

            handleStaffSubmit(event);
        }

    });


    /* =============================================
       FILTER EVENTS
    ============================================== */

    document.addEventListener("change", event => {

        const target = event.target;

        if (!target) {
            return;
        }

        if (
            target.id === "staffStationFilter" ||
            target.id === "staffRoleFilter" ||
            target.id === "staffStatusFilter"
        ) {
            renderStaff();
        }

    });


    /* =============================================
       SEARCH
    ============================================== */

    document.addEventListener("input", event => {

        const target = event.target;

        if (!target) {
            return;
        }

        if (
            target.id === "staffSearch"
        ) {
            renderStaff();
        }

    });


    /* =============================================
       ESCAPE KEY
    ============================================== */

    document.addEventListener("keydown", event => {

        if (
            event.key === "Escape" ||
            event.key === "Esc"
        ) {
            const modal =
                document.getElementById("staffModal");

            if (
                modal &&
                !modal.classList.contains("hidden")
            ) {
                closeStaffModal();
            }
        }

    });


    /*
      Populate station filters immediately.
    */

    loadStationFilters();
}


/* =========================================================
   OPEN STAFF MODAL
========================================================= */

function openStaffModal(staffMember = null) {

    const modal =
        document.getElementById("staffModal");

    const form =
        document.getElementById("staffForm");

    if (!modal || !form) {

        console.error(
            "FuelGap Staff: Staff modal/form not found."
        );

        return;
    }


    /*
      Reset form first.
    */

    form.reset();

    clearStaffMessage();


    /*
      Load stations.
    */

    loadStationsIntoSelect();


    const editingId =
        document.getElementById(
            "editingStaffId"
        );

    const title =
        document.getElementById(
            "staffModalTitle"
        );

    const description =
        document.getElementById(
            "staffModalDescription"
        );

    const saveButton =
        document.getElementById(
            "saveStaffButton"
        );

    const passwordInput =
        document.getElementById(
            "staffPassword"
        );


    /* =============================================
       EDIT MODE
    ============================================== */

    if (staffMember) {

        if (editingId) {
            editingId.value =
                staffMember.id || "";
        }


        const fullName =
            document.getElementById(
                "staffFullName"
            );

        const email =
            document.getElementById(
                "staffEmail"
            );

        const phone =
            document.getElementById(
                "staffPhone"
            );

        const role =
            document.getElementById(
                "staffRole"
            );

        const station =
            document.getElementById(
                "staffStation"
            );


        if (fullName) {
            fullName.value =
                staffMember.fullName || "";
        }

        if (email) {
            email.value =
                staffMember.email || "";
        }

        if (phone) {
            phone.value =
                staffMember.phone || "";
        }

        if (role) {
            role.value =
                staffMember.role || "";
        }

        if (station) {
            station.value =
                staffMember.stationId || "";
        }


        if (passwordInput) {
            passwordInput.required = false;
            passwordInput.value = "";
            passwordInput.placeholder =
                "Leave blank to keep current password";
        }


        if (title) {
            title.textContent =
                "Edit Staff Member";
        }


        if (description) {
            description.textContent =
                "Update staff details, role or station access.";
        }


        if (saveButton) {
            saveButton.textContent =
                "Save Changes";
        }

    }


    /* =============================================
       CREATE MODE
    ============================================== */

    else {

        if (editingId) {
            editingId.value = "";
        }


        if (passwordInput) {
            passwordInput.required = true;
            passwordInput.value = "";
            passwordInput.placeholder =
                "Minimum 8 characters";
        }


        if (title) {
            title.textContent =
                "Add Staff Member";
        }


        if (description) {
            description.textContent =
                "Create a staff account and assign access to a station.";
        }


        if (saveButton) {
            saveButton.textContent =
                "Create Staff Account";
        }

    }


    /*
      SHOW MODAL
    */

    modal.classList.remove("hidden");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    /*
      Prevent page scrolling.
    */

    document.body.style.overflow =
        "hidden";


    /*
      Focus first field.
    */

    setTimeout(() => {

        const fullName =
            document.getElementById(
                "staffFullName"
            );

        if (fullName) {
            fullName.focus();
        }

    }, 100);

}


/* =========================================================
   CLOSE STAFF MODAL
========================================================= */

function closeStaffModal() {

    const modal =
        document.getElementById(
            "staffModal"
        );

    const form =
        document.getElementById(
            "staffForm"
        );


    if (modal) {

        modal.classList.add("hidden");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    if (form) {
        form.reset();
    }


    document.body.style.overflow = "";

    clearStaffMessage();
}


/* =========================================================
   LOAD STATIONS INTO MODAL
========================================================= */

function loadStationsIntoSelect(
    selectedStationId = ""
) {

    const select =
        document.getElementById(
            "staffStation"
        );

    if (!select) {
        return;
    }


    const stations =
        getVisibleStations();


    select.innerHTML = `
        <option value="">
            Select station
        </option>
    `;


    if (!stations.length) {

        select.innerHTML += `
            <option value="" disabled>
                No stations available
            </option>
        `;

        return;
    }


    stations.forEach(station => {

        const option =
            document.createElement("option");

        option.value =
            station.id || station._id || "";

        option.textContent =
            station.name ||
            station.stationName ||
            "Unnamed Station";


        if (
            selectedStationId &&
            option.value === selectedStationId
        ) {
            option.selected = true;
        }


        select.appendChild(option);

    });

}


/* =========================================================
   LOAD STATION FILTER
========================================================= */

function loadStationFilters() {

    const select =
        document.getElementById(
            "staffStationFilter"
        );

    if (!select) {
        return;
    }


    const stations =
        getVisibleStations();


    select.innerHTML = `
        <option value="">
            All Stations
        </option>
    `;


    stations.forEach(station => {

        const option =
            document.createElement("option");

        option.value =
            station.id ||
            station._id ||
            "";

        option.textContent =
            station.name ||
            station.stationName ||
            "Unnamed Station";


        select.appendChild(option);

    });

}


/* =========================================================
   HANDLE STAFF FORM
========================================================= */

function handleStaffSubmit(event) {

    const form =
        event.target;


    const currentUser =
        getCurrentStaffUser();


    if (!currentUser) {
        showStaffMessage(
            "Your session has expired. Please log in again.",
            "error"
        );

        return;
    }


    const editingId =
        document.getElementById(
            "editingStaffId"
        )?.value.trim();


    const fullName =
        document.getElementById(
            "staffFullName"
        )?.value.trim();


    const email =
        document.getElementById(
            "staffEmail"
        )?.value.trim().toLowerCase();


    const phone =
        document.getElementById(
            "staffPhone"
        )?.value.trim();


    const role =
        document.getElementById(
            "staffRole"
        )?.value;


    const stationId =
        document.getElementById(
            "staffStation"
        )?.value;


    const password =
        document.getElementById(
            "staffPassword"
        )?.value;


    /* =============================================
       VALIDATION
    ============================================== */

    if (!fullName) {

        showStaffMessage(
            "Please enter the staff member's full name.",
            "error"
        );

        return;
    }


    if (!email) {

        showStaffMessage(
            "Please enter an email address.",
            "error"
        );

        return;
    }


    if (!isValidEmail(email)) {

        showStaffMessage(
            "Please enter a valid email address.",
            "error"
        );

        return;
    }


    if (!role) {

        showStaffMessage(
            "Please select a staff role.",
            "error"
        );

        return;
    }


    if (
        role !== "manager" &&
        role !== "attendant"
    ) {

        showStaffMessage(
            "Invalid staff role selected.",
            "error"
        );

        return;
    }


    if (!stationId) {

        showStaffMessage(
            "Please assign the staff member to a station.",
            "error"
        );

        return;
    }


    if (!editingId && !password) {

        showStaffMessage(
            "Please create a password for this staff account.",
            "error"
        );

        return;
    }


    if (
        password &&
        password.length < 8
    ) {

        showStaffMessage(
            "Password must contain at least 8 characters.",
            "error"
        );

        return;
    }


    /* =============================================
       FIND STATION
    ============================================== */

    const stations =
        getVisibleStations();


    const station =
        stations.find(
            item =>
                String(
                    item.id ||
                    item._id
                ) === String(stationId)
        );


    if (!station) {

        showStaffMessage(
            "The selected station is not available.",
            "error"
        );

        return;
    }


    /*
      Organization safety check.
    */

    if (
        currentUser.role !== "admin" &&
        station.organizationId !==
            currentUser.organizationId
    ) {

        showStaffMessage(
            "You do not have access to this station.",
            "error"
        );

        return;
    }


    /* =============================================
       LOAD DATA
    ============================================== */

    const staff =
        getAllStaff();

    const mockUsers =
        getMockUsers();


    /* =============================================
       DUPLICATE EMAIL CHECK
    ============================================== */

    const duplicateStaff =
        staff.find(member => {

            const sameEmail =
                String(member.email || "")
                    .toLowerCase()
                    .trim() === email;

            const differentPerson =
                String(member.id) !==
                String(editingId);

            return (
                sameEmail &&
                differentPerson
            );

        });


    if (duplicateStaff) {

        showStaffMessage(
            "A staff member with this email already exists.",
            "error"
        );

        return;
    }


    const duplicateUser =
        mockUsers.find(user => {

            const sameEmail =
                String(user.email || "")
                    .toLowerCase()
                    .trim() === email;

            /*
              Ignore the current user when editing.
            */

            const differentUser =
                !editingId ||
                String(
                    user.staffId ||
                    user.id
                ) !== String(editingId);

            return (
                sameEmail &&
                differentUser
            );

        });


    if (duplicateUser) {

        showStaffMessage(
            "This email is already linked to another account.",
            "error"
        );

        return;
    }


    /* =============================================
       EDIT STAFF
    ============================================== */

    if (editingId) {

        const staffIndex =
            staff.findIndex(
                member =>
                    String(member.id) ===
                    String(editingId)
            );


        if (staffIndex === -1) {

            showStaffMessage(
                "Staff member could not be found.",
                "error"
            );

            return;
        }


        const existingStaff =
            staff[staffIndex];


        /*
          Update staff record.
        */

        staff[staffIndex] = {
            ...existingStaff,

            fullName,

            email,

            phone,

            role,

            stationId,

            stationName:
                station.name ||
                station.stationName ||
                "Unnamed Station",

            updatedAt:
                new Date().toISOString()
        };


        /*
          Update mock login account.
        */

        const userIndex =
            mockUsers.findIndex(
                user =>
                    String(
                        user.staffId ||
                        user.id
                    ) === String(editingId)
            );


        if (userIndex !== -1) {

            mockUsers[userIndex] = {
                ...mockUsers[userIndex],

                name: fullName,

                fullName,

                email,

                phone,

                role,

                stationId,

                organizationId:
                    existingStaff.organizationId ||
                    currentUser.organizationId,

                updatedAt:
                    new Date().toISOString()
            };


            /*
              Update password only when
              a new password was provided.
            */

            if (password) {

                mockUsers[userIndex].password =
                    password;

            }

        }


        saveStaff(staff);

        saveMockUsers(mockUsers);


        showStaffMessage(
            "Staff member updated successfully.",
            "success"
        );


        renderStaff();


        setTimeout(() => {
            closeStaffModal();
        }, 700);


        return;
    }


    /* =============================================
       CREATE STAFF
    ============================================== */

    const staffId =
        `STF-${Date.now()}-${Math.floor(
            Math.random() * 1000
        )}`;


    const userId =
        `USR-${Date.now()}-${Math.floor(
            Math.random() * 1000
        )}`;


    const organizationId =
        currentUser.role === "admin"
            ? (
                station.organizationId ||
                currentUser.organizationId ||
                ""
            )
            : currentUser.organizationId;


    const now =
        new Date().toISOString();


    const newStaff = {

        id: staffId,

        fullName,

        email,

        phone,

        role,

        stationId,

        stationName:
            station.name ||
            station.stationName ||
            "Unnamed Station",

        organizationId,

        status: "active",

        createdAt: now,

        updatedAt: now

    };


    const newMockUser = {

        id: userId,

        staffId,

        name: fullName,

        fullName,

        email,

        phone,

        password,

        role,

        stationId,

        organizationId,

        status: "active",

        emailVerified: true,

        createdAt: now,

        updatedAt: now

    };


    staff.push(newStaff);

    mockUsers.push(newMockUser);


    const staffSaved =
        saveStaff(staff);

    const usersSaved =
        saveMockUsers(mockUsers);


    if (
        !staffSaved ||
        !usersSaved
    ) {

        showStaffMessage(
            "Unable to save staff account. Please try again.",
            "error"
        );

        return;
    }


    showStaffMessage(
        "Staff account created successfully.",
        "success"
    );


    renderStaff();


    setTimeout(() => {
        closeStaffModal();
    }, 700);

}


/* =========================================================
   VALIDATE EMAIL
========================================================= */

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}


/* =========================================================
   STAFF FILTERS
========================================================= */

function getStaffFilters() {

    return {

        station:
            document.getElementById(
                "staffStationFilter"
            )?.value || "",

        role:
            document.getElementById(
                "staffRoleFilter"
            )?.value || "",

        status:
            document.getElementById(
                "staffStatusFilter"
            )?.value || "",

        search:
            document.getElementById(
                "staffSearch"
            )?.value
                .trim()
                .toLowerCase() || ""

    };

}


/* =========================================================
   FILTER STAFF
========================================================= */

function filterStaff(staff) {

    const filters =
        getStaffFilters();


    return staff.filter(member => {

        /* =========================================
           STATION
        ========================================== */

        if (
            filters.station &&
            String(member.stationId) !==
                String(filters.station)
        ) {
            return false;
        }


        /* =========================================
           ROLE
        ========================================== */

        if (
            filters.role &&
            String(member.role) !==
                String(filters.role)
        ) {
            return false;
        }


        /* =========================================
           STATUS
        ========================================== */

        const memberStatus =
            member.status ||
            "active";


        if (
            filters.status &&
            memberStatus !==
                filters.status
        ) {
            return false;
        }


        /* =========================================
           SEARCH
        ========================================== */

        if (filters.search) {

            const searchableText = [

                member.fullName,

                member.email,

                member.phone,

                member.role,

                member.stationName

            ]
                .filter(Boolean)
                .join(" ")
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
   RENDER STAFF
========================================================= */

function renderStaff() {

    const tableBody =
        document.getElementById(
            "staffTableBody"
        );

    const emptyState =
        document.getElementById(
            "emptyStaffState"
        );


    if (!tableBody) {
        return;
    }


    let staff =
        getStaff();


    staff =
        filterStaff(staff);


    /*
      Sort newest first.
    */

    staff.sort(
        (a, b) =>
            new Date(
                b.createdAt || 0
            ) -
            new Date(
                a.createdAt || 0
            )
    );


    tableBody.innerHTML = "";


    /* =============================================
       EMPTY STATE
    ============================================== */

    if (!staff.length) {

        if (emptyState) {
            emptyState.classList.remove(
                "hidden"
            );
        }

        updateStaffStats();

        return;
    }


    if (emptyState) {
        emptyState.classList.add(
            "hidden"
        );
    }


    const stations =
        getVisibleStations();


    /* =============================================
       BUILD TABLE
    ============================================== */

    staff.forEach(member => {

        const row =
            document.createElement("tr");


        const station =
            stations.find(
                item =>
                    String(
                        item.id ||
                        item._id
                    ) ===
                    String(member.stationId)
            );


        const stationName =
            member.stationName ||
            station?.name ||
            station?.stationName ||
            "Unassigned";


        const status =
            member.status ||
            "active";


        const role =
            member.role ||
            "attendant";


        const isActive =
            status === "active";


        const initials =
            getStaffInitials(
                member.fullName
            );


        row.innerHTML = `

            <!-- STAFF MEMBER -->

            <td>

                <div class="staff-person">

                    <div class="staff-avatar">
                        ${escapeHTML(initials)}
                    </div>

                    <div class="staff-person-info">

                        <strong>
                            ${escapeHTML(
                                member.fullName ||
                                "Unnamed Staff"
                            )}
                        </strong>

                        <span>
                            ID:
                            ${escapeHTML(
                                member.id ||
                                "N/A"
                            )}
                        </span>

                    </div>

                </div>

            </td>


            <!-- CONTACT -->

            <td>

                <div class="contact-info">

                    <span>
                        ${escapeHTML(
                            member.email ||
                            "No email"
                        )}
                    </span>

                    ${
                        member.phone
                            ? `
                                <small>
                                    ${escapeHTML(
                                        member.phone
                                    )}
                                </small>
                              `
                            : ""
                    }

                </div>

            </td>


            <!-- ROLE -->

            <td>

                <span
                    class="role-badge ${escapeHTML(
                        role
                    )}"
                >
                    ${escapeHTML(
                        capitalize(role)
                    )}
                </span>

            </td>


            <!-- STATION -->

            <td>

                <div class="station-cell">

                    <span class="station-dot"></span>

                    <span>
                        ${escapeHTML(
                            stationName
                        )}
                    </span>

                </div>

            </td>


            <!-- STATUS -->

            <td>

                <span
                    class="status-badge ${
                        isActive
                            ? "active"
                            : "inactive"
                    }"
                >

                    <span class="status-dot"></span>

                    ${
                        isActive
                            ? "Active"
                            : "Inactive"
                    }

                </span>

            </td>


            <!-- CREATED -->

            <td>

                <span class="date-text">
                    ${formatStaffDate(
                        member.createdAt
                    )}
                </span>

            </td>


            <!-- ACTIONS -->

            <td>

                <div class="table-actions">

                    <button
                        type="button"
                        class="action-button edit"
                        data-action="edit-staff"
                        data-staff-id="${escapeHTML(
                            member.id
                        )}"
                        title="Edit staff"
                        aria-label="Edit staff"
                    >
                        ✎
                    </button>


                    <button
                        type="button"
                        class="action-button ${
                            isActive
                                ? "warning"
                                : "success"
                        }"
                        data-action="toggle-staff"
                        data-staff-id="${escapeHTML(
                            member.id
                        )}"
                        title="${
                            isActive
                                ? "Deactivate staff"
                                : "Activate staff"
                        }"
                        aria-label="${
                            isActive
                                ? "Deactivate staff"
                                : "Activate staff"
                        }"
                    >
                        ${
                            isActive
                                ? "⏸"
                                : "▶"
                        }
                    </button>


                    <button
                        type="button"
                        class="action-button danger"
                        data-action="remove-staff"
                        data-staff-id="${escapeHTML(
                            member.id
                        )}"
                        title="Remove staff"
                        aria-label="Remove staff"
                    >
                        🗑
                    </button>

                </div>

            </td>

        `;


        tableBody.appendChild(row);

    });


    updateStaffStats();

}


/* =========================================================
   GET STAFF INITIALS
========================================================= */

function getStaffInitials(name) {

    if (!name) {
        return "ST";
    }


    const parts =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (parts.length === 1) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();

}


/* =========================================================
   EDIT STAFF
========================================================= */

function editStaff(staffId) {

    const staff =
        getAllStaff();


    const member =
        staff.find(
            item =>
                String(item.id) ===
                String(staffId)
        );


    if (!member) {

        showStaffMessage(
            "Staff member could not be found.",
            "error"
        );

        return;
    }


    openStaffModal(member);

}


/* =========================================================
   TOGGLE STAFF STATUS
========================================================= */

function toggleStaffStatus(staffId) {

    const staff =
        getAllStaff();


    const mockUsers =
        getMockUsers();


    const index =
        staff.findIndex(
            member =>
                String(member.id) ===
                String(staffId)
        );


    if (index === -1) {
        return;
    }


    const currentStatus =
        staff[index].status ||
        "active";


    const newStatus =
        currentStatus === "active"
            ? "inactive"
            : "active";


    const actionText =
        newStatus === "active"
            ? "activate"
            : "deactivate";


    const confirmed =
        window.confirm(
            `Are you sure you want to ${actionText} this staff member?`
        );


    if (!confirmed) {
        return;
    }


    staff[index].status =
        newStatus;


    staff[index].updatedAt =
        new Date().toISOString();


    /*
      Keep mock login account in sync.
    */

    const userIndex =
        mockUsers.findIndex(
            user =>
                String(
                    user.staffId ||
                    user.id
                ) ===
                String(staffId)
        );


    if (userIndex !== -1) {

        mockUsers[userIndex].status =
            newStatus;

        mockUsers[userIndex].updatedAt =
            new Date().toISOString();

    }


    saveStaff(staff);

    saveMockUsers(mockUsers);


    renderStaff();

}


/* =========================================================
   REMOVE STAFF
========================================================= */

function removeStaff(staffId) {

    const staff =
        getAllStaff();


    const mockUsers =
        getMockUsers();


    const member =
        staff.find(
            item =>
                String(item.id) ===
                String(staffId)
        );


    if (!member) {
        return;
    }


    const confirmed =
        window.confirm(
            `Remove ${member.fullName || "this staff member"}?\n\nThis action will remove the staff record and login account.`
        );


    if (!confirmed) {
        return;
    }


    const updatedStaff =
        staff.filter(
            item =>
                String(item.id) !==
                String(staffId)
        );


    const updatedUsers =
        mockUsers.filter(
            user =>
                String(
                    user.staffId ||
                    user.id
                ) !==
                String(staffId)
        );


    saveStaff(updatedStaff);

    saveMockUsers(updatedUsers);


    renderStaff();

}


/* =========================================================
   UPDATE STAFF STATISTICS
========================================================= */

function updateStaffStats() {

    const staff =
        getStaff();


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


    const active =
        staff.filter(
            member =>
                (member.status || "active") ===
                "active"
        ).length;


    setText(
        "totalStaff",
        total
    );


    setText(
        "totalManagers",
        managers
    );


    setText(
        "totalAttendants",
        attendants
    );


    setText(
        "activeStaff",
        active
    );

}


/* =========================================================
   SAFE TEXT UPDATE
========================================================= */

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {
        element.textContent =
            String(value);
    }

}


/* =========================================================
   STAFF MESSAGE
========================================================= */

function showStaffMessage(
    message,
    type = "error"
) {

    const element =
        document.getElementById(
            "staffMessage"
        );


    if (!element) {
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


/* =========================================================
   CLEAR STAFF MESSAGE
========================================================= */

function clearStaffMessage() {

    const element =
        document.getElementById(
            "staffMessage"
        );


    if (!element) {
        return;
    }


    element.textContent = "";

    element.className =
        "form-message hidden";

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatStaffDate(date) {

    if (!date) {
        return "—";
    }


    const parsedDate =
        new Date(date);


    if (
        Number.isNaN(
            parsedDate.getTime()
        )
    ) {
        return "—";
    }


    return parsedDate.toLocaleDateString(
        "en-NG",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================================
   CAPITALIZE
========================================================= */

function capitalize(value) {

    if (!value) {
        return "";
    }


    return String(value)
        .charAt(0)
        .toUpperCase() +
        String(value)
            .slice(1)
            .toLowerCase();

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }


    return String(value)
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
   OPTIONAL GLOBAL API
   Useful if app.js needs to refresh the page.
========================================================= */

window.FuelGapStaff = {

    refresh: function () {

        renderStaffPage();

        /*
          No need to call setupStaffEvents()
          again because event delegation is
          registered only once.
        */

        loadStationFilters();

        renderStaff();

    },

    openModal: function () {
        openStaffModal();
    },

    closeModal: function () {
        closeStaffModal();
    },

    getStaff: function () {
        return getStaff();
    },

    getVisibleStations: function () {
        return getVisibleStations();
    }

};