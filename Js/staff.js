/* =========================================================
   FUELGAP - PROFESSIONAL STAFF MANAGEMENT
   REAL BACKEND VERSION
   HTTPONLY COOKIE SESSION
   NO LOCALSTORAGE AUTHENTICATION

   UI:
   - Clean White + Yellow FuelGap Theme
   - Responsive Staff Table
   - Professional Cards
   - Search
   - Role Filter
   - Station Filter
   - Status Filter
   - Professional Modal
   - Station / Role Badges
   - Activate / Deactivate
   - Loading Skeleton
   - Toast Notifications
   - Mobile Responsive
========================================================= */


/* =========================================================
   STATE
========================================================= */

const StaffState = {
    staff: [],
    filteredStaff: [],
    stations: [],
    currentUser: null,

    search: "",
    roleFilter: "all",
    stationFilter: "all",
    statusFilter: "all",

    editingStaffId: null,

    isLoading: false,
    isSubmitting: false
};


/* =========================================================
   CONSTANTS
========================================================= */

const STAFF_ALLOWED_ROLES = [
    "owner",
    "admin",
    "manager",
    "attendant"
];

const STAFF_MANAGEMENT_ROLES = [
    "owner",
    "admin",
    "manager"
];


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    try {

        injectStaffStyles();

        if (typeof FuelGapAPI === "undefined") {
            showPageError(
                "FuelGap API is not available. Please check api.js."
            );
            return;
        }

        const authResponse =
            await FuelGapAPI.getCurrentUser();

        if (
            !authResponse ||
            !authResponse.success ||
            !authResponse.data ||
            !authResponse.data.user
        ) {
            window.location.href = "../login.html";
            return;
        }

        StaffState.currentUser =
            normalizeUser(authResponse.data.user);

        if (
            !STAFF_MANAGEMENT_ROLES.includes(
                StaffState.currentUser.role
            )
        ) {
            showPageError(
                "You do not have permission to manage staff."
            );
            return;
        }

        await waitForPageContent();

        renderStaffPage();

        setupStaffEvents();

        await loadStaffData();

    } catch (error) {

        console.error(
            "FuelGap Staff initialization error:",
            error
        );

        showPageError(
            error.message ||
            "Unable to load staff management."
        );
    }
});


/* =========================================================
   WAIT FOR PAGE CONTENT
========================================================= */

function waitForPageContent() {

    return new Promise((resolve) => {

        const existing =
            document.getElementById("pageContent");

        if (existing) {
            resolve();
            return;
        }

        let attempts = 0;

        const interval = setInterval(() => {

            const pageContent =
                document.getElementById("pageContent");

            attempts++;

            if (pageContent) {

                clearInterval(interval);
                resolve();

            } else if (attempts >= 50) {

                clearInterval(interval);

                showPageError(
                    "Staff page container was not found."
                );

                resolve();
            }

        }, 100);
    });
}


/* =========================================================
   RENDER PAGE
========================================================= */

function renderStaffPage() {

    const pageContent =
        document.getElementById("pageContent");

    if (!pageContent) return;

    pageContent.innerHTML = `

        <div class="fg-staff-page">

            <!-- =========================================
                 PAGE HEADER
            ========================================== -->

            <div class="fg-staff-hero">

                <div class="fg-staff-hero-left">

                    <div class="fg-staff-icon">
                        <i class="fas fa-users"></i>
                    </div>

                    <div>

                        <div class="fg-breadcrumb">
                            Administration
                            <span>/</span>
                            Staff
                        </div>

                        <h1>
                            Staff Management
                        </h1>

                        <p>
                            Manage your station team, roles,
                            access and staff assignments.
                        </p>

                    </div>

                </div>

                <button
                    type="button"
                    class="fg-btn fg-btn-primary fg-add-staff-btn"
                    id="addStaffBtn"
                >
                    <i class="fas fa-plus"></i>
                    <span>Add Staff</span>
                </button>

            </div>


            <!-- =========================================
                 STATISTICS
            ========================================== -->

            <div
                class="fg-staff-stats"
                id="staffStats"
            >

                ${renderStatCard(
                    "Total Staff",
                    "0",
                    "fas fa-users",
                    "total",
                    "All registered staff"
                )}

                ${renderStatCard(
                    "Active Staff",
                    "0",
                    "fas fa-user-check",
                    "active",
                    "Currently active"
                )}

                ${renderStatCard(
                    "Managers",
                    "0",
                    "fas fa-user-tie",
                    "manager",
                    "Management team"
                )}

                ${renderStatCard(
                    "Attendants",
                    "0",
                    "fas fa-user",
                    "attendant",
                    "Station attendants"
                )}

            </div>


            <!-- =========================================
                 MAIN SECTION
            ========================================== -->

            <section class="fg-staff-section">

                <div class="fg-section-header">

                    <div>

                        <div class="fg-section-title-row">

                            <h2>
                                Staff Directory
                            </h2>

                            <span
                                class="fg-count-badge"
                                id="staffCountBadge"
                            >
                                0
                            </span>

                        </div>

                        <p>
                            View and manage staff members
                            across your organization.
                        </p>

                    </div>

                    <button
                        type="button"
                        class="fg-icon-btn"
                        id="refreshStaffBtn"
                        title="Refresh staff"
                        aria-label="Refresh staff"
                    >
                        <i class="fas fa-sync-alt"></i>
                    </button>

                </div>


                <!-- =====================================
                     FILTER TOOLBAR
                ====================================== -->

                <div class="fg-staff-toolbar">

                    <div class="fg-search-box">

                        <i class="fas fa-search"></i>

                        <input
                            type="search"
                            id="staffSearch"
                            placeholder="Search staff by name, email or phone..."
                            autocomplete="off"
                        />

                        <button
                            type="button"
                            class="fg-search-clear"
                            id="clearStaffSearch"
                            title="Clear search"
                            aria-label="Clear search"
                        >
                            <i class="fas fa-times"></i>
                        </button>

                    </div>


                    <div class="fg-filter-group">

                        <select
                            id="staffRoleFilter"
                            class="fg-filter-select"
                        >

                            <option value="all">
                                All Roles
                            </option>

                            <option value="owner">
                                Owner
                            </option>

                            <option value="admin">
                                Admin
                            </option>

                            <option value="manager">
                                Manager
                            </option>

                            <option value="attendant">
                                Attendant
                            </option>

                        </select>


                        <select
                            id="staffStationFilter"
                            class="fg-filter-select"
                        >

                            <option value="all">
                                All Stations
                            </option>

                        </select>


                        <select
                            id="staffStatusFilter"
                            class="fg-filter-select"
                        >

                            <option value="all">
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

                </div>


                <!-- =====================================
                     TABLE
                ====================================== -->

                <div
                    class="fg-staff-table-wrapper"
                    id="staffTableWrapper"
                >

                    ${renderStaffLoading()}

                </div>

            </section>

        </div>


        <!-- =========================================
             STAFF MODAL
        ========================================== -->

        <div
            class="fg-modal-overlay"
            id="staffModal"
            aria-hidden="true"
        >

            <div
                class="fg-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="staffModalTitle"
            >

                <div class="fg-modal-header">

                    <div class="fg-modal-heading">

                        <div class="fg-modal-icon">
                            <i class="fas fa-user-plus"></i>
                        </div>

                        <div>

                            <h3 id="staffModalTitle">
                                Add New Staff
                            </h3>

                            <p id="staffModalSubtitle">
                                Create a staff account and assign
                                their station access.
                            </p>

                        </div>

                    </div>

                    <button
                        type="button"
                        class="fg-modal-close"
                        id="closeStaffModal"
                        aria-label="Close"
                    >
                        <i class="fas fa-times"></i>
                    </button>

                </div>


                <form
                    id="staffForm"
                    class="fg-staff-form"
                    novalidate
                >

                    <div class="fg-form-grid">

                        <!-- FULL NAME -->

                        <div class="fg-form-group fg-form-full">

                            <label for="staffFullName">
                                Full Name
                                <span>*</span>
                            </label>

                            <div class="fg-input-wrap">

                                <i class="fas fa-user"></i>

                                <input
                                    type="text"
                                    id="staffFullName"
                                    name="full_name"
                                    placeholder="Enter full name"
                                    required
                                    autocomplete="name"
                                />

                            </div>

                        </div>


                        <!-- EMAIL -->

                        <div class="fg-form-group">

                            <label for="staffEmail">
                                Email Address
                                <span>*</span>
                            </label>

                            <div class="fg-input-wrap">

                                <i class="fas fa-envelope"></i>

                                <input
                                    type="email"
                                    id="staffEmail"
                                    name="email"
                                    placeholder="staff@example.com"
                                    required
                                    autocomplete="email"
                                />

                            </div>

                        </div>


                        <!-- PHONE -->

                        <div class="fg-form-group">

                            <label for="staffPhone">
                                Phone Number
                            </label>

                            <div class="fg-input-wrap">

                                <i class="fas fa-phone"></i>

                                <input
                                    type="tel"
                                    id="staffPhone"
                                    name="phone"
                                    placeholder="08012345678"
                                    autocomplete="tel"
                                />

                            </div>

                        </div>


                        <!-- ROLE -->

                        <div class="fg-form-group">

                            <label for="staffRole">
                                Staff Role
                                <span>*</span>
                            </label>

                            <div class="fg-input-wrap fg-select-wrap">

                                <i class="fas fa-user-tag"></i>

                                <select
                                    id="staffRole"
                                    name="role"
                                    required
                                >

                                    <option value="">
                                        Select role
                                    </option>

                                    ${
                                        getAssignableRoles()
                                            .map(role => `
                                                <option
                                                    value="${role}"
                                                >
                                                    ${formatRole(role)}
                                                </option>
                                            `)
                                            .join("")
                                    }

                                </select>

                            </div>

                        </div>


                        <!-- STATION -->

                        <div class="fg-form-group">

                            <label for="staffStation">
                                Station
                                <span>*</span>
                            </label>

                            <div class="fg-input-wrap fg-select-wrap">

                                <i class="fas fa-gas-pump"></i>

                                <select
                                    id="staffStation"
                                    name="station_id"
                                    required
                                >

                                    <option value="">
                                        Select station
                                    </option>

                                </select>

                            </div>

                            <small>
                                Select the station this staff member
                                will manage or work at.
                            </small>

                        </div>


                        <!-- PASSWORD -->

                        <div
                            class="fg-form-group fg-form-full"
                            id="staffPasswordGroup"
                        >

                            <label for="staffPassword">
                                Temporary Password
                                <span>*</span>
                            </label>

                            <div class="fg-input-wrap">

                                <i class="fas fa-lock"></i>

                                <input
                                    type="password"
                                    id="staffPassword"
                                    name="password"
                                    placeholder="Create temporary password"
                                    autocomplete="new-password"
                                />

                                <button
                                    type="button"
                                    class="fg-password-toggle"
                                    id="toggleStaffPassword"
                                    aria-label="Show password"
                                >
                                    <i class="fas fa-eye"></i>
                                </button>

                            </div>

                            <small>
                                The staff member can use this password
                                to sign in.
                            </small>

                        </div>

                    </div>


                    <div
                        class="fg-form-message"
                        id="staffFormMessage"
                        role="alert"
                    ></div>


                    <div class="fg-modal-footer">

                        <button
                            type="button"
                            class="fg-btn fg-btn-secondary"
                            id="cancelStaffBtn"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            class="fg-btn fg-btn-primary"
                            id="saveStaffBtn"
                        >
                            <i class="fas fa-user-plus"></i>
                            <span>Create Staff</span>
                        </button>

                    </div>

                </form>

            </div>

        </div>


        <!-- =========================================
             TOAST CONTAINER
        ========================================== -->

        <div
            class="fg-toast-container"
            id="staffToastContainer"
        ></div>

    `;
}


/* =========================================================
   STAT CARD
========================================================= */

function renderStatCard(
    title,
    value,
    icon,
    type,
    subtitle
) {

    return `

        <div class="fg-stat-card">

            <div class="fg-stat-card-top">

                <div class="fg-stat-icon ${type}">
                    <i class="${icon}"></i>
                </div>

                <div class="fg-stat-label">
                    ${title}
                </div>

            </div>

            <div
                class="fg-stat-value"
                id="stat-${type}"
            >
                ${value}
            </div>

            <div class="fg-stat-subtitle">
                ${subtitle}
            </div>

        </div>

    `;
}


/* =========================================================
   ASSIGNABLE ROLES
========================================================= */

function getAssignableRoles() {

    const currentRole =
        StaffState.currentUser?.role;

    if (currentRole === "owner") {
        return [ "manager", "attendant"];
    }

    if (currentRole === "admin") {
        return ["manager", "attendant"];
    }

    if (currentRole === "manager") {
        return ["attendant"];
    }

    return [];
}


/* =========================================================
   EVENT SETUP
========================================================= */

function setupStaffEvents() {

    const addButton =
        document.getElementById("addStaffBtn");

    if (addButton) {
        addButton.addEventListener(
            "click",
            () => openStaffModal()
        );
    }


    const refreshButton =
        document.getElementById("refreshStaffBtn");

    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            async () => {

                refreshButton.classList.add(
                    "fg-spin"
                );

                await loadStaffData();

                setTimeout(() => {
                    refreshButton.classList.remove(
                        "fg-spin"
                    );
                }, 500);
            }
        );
    }


    const search =
        document.getElementById("staffSearch");

    if (search) {

        search.addEventListener(
            "input",
            () => {

                StaffState.search =
                    search.value.trim().toLowerCase();

                updateClearSearchButton();

                applyStaffFilters();
            }
        );
    }


    const clearSearch =
        document.getElementById("clearStaffSearch");

    if (clearSearch) {

        clearSearch.addEventListener(
            "click",
            () => {

                if (search) {
                    search.value = "";
                }

                StaffState.search = "";

                updateClearSearchButton();

                applyStaffFilters();
            }
        );
    }


    const roleFilter =
        document.getElementById("staffRoleFilter");

    if (roleFilter) {

        roleFilter.addEventListener(
            "change",
            () => {

                StaffState.roleFilter =
                    roleFilter.value;

                applyStaffFilters();
            }
        );
    }


    const stationFilter =
        document.getElementById("staffStationFilter");

    if (stationFilter) {

        stationFilter.addEventListener(
            "change",
            () => {

                StaffState.stationFilter =
                    stationFilter.value;

                applyStaffFilters();
            }
        );
    }


    const statusFilter =
        document.getElementById("staffStatusFilter");

    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            () => {

                StaffState.statusFilter =
                    statusFilter.value;

                applyStaffFilters();
            }
        );
    }


    const form =
        document.getElementById("staffForm");

    if (form) {
        form.addEventListener(
            "submit",
            handleStaffSubmit
        );
    }


    const closeButton =
        document.getElementById("closeStaffModal");

    if (closeButton) {
        closeButton.addEventListener(
            "click",
            closeStaffModal
        );
    }


    const cancelButton =
        document.getElementById("cancelStaffBtn");

    if (cancelButton) {
        cancelButton.addEventListener(
            "click",
            closeStaffModal
        );
    }


    const modal =
        document.getElementById("staffModal");

    if (modal) {

        modal.addEventListener(
            "click",
            (event) => {

                if (
                    event.target === modal
                ) {
                    closeStaffModal();
                }
            }
        );
    }


    document.addEventListener(
        "keydown",
        handleStaffKeyboard
    );


    const passwordToggle =
        document.getElementById(
            "toggleStaffPassword"
        );

    if (passwordToggle) {

        passwordToggle.addEventListener(
            "click",
            togglePasswordVisibility
        );
    }

}


/* =========================================================
   LOAD STAFF DATA
========================================================= */

async function loadStaffData() {

    if (StaffState.isLoading) {
        return;
    }

    StaffState.isLoading = true;

    renderStaffLoading();

    try {

        const [
            staffResponse,
            stationResponse
        ] = await Promise.all([
            FuelGapAPI.getStaff(),
            FuelGapAPI.getStations()
        ]);


        if (
            !staffResponse ||
            !staffResponse.success
        ) {

            throw new Error(
                staffResponse?.message ||
                "Unable to load staff."
            );
        }
StaffState.staff = extractResponseArray(staffResponse)
    .map(normalizeStaff)
    .filter(staff => {
        const role = String(staff.role || "").toLowerCase().trim();
        return role !== "owner";
    });


        if (
            stationResponse &&
            stationResponse.success
        ) {

            StaffState.stations =
                normalizeStationArray(
                    extractResponseArray(
                        stationResponse
                    )
                );

        } else {

            StaffState.stations = [];
        }


        loadStationFilters();

        loadStationSelect();

        applyStaffFilters();

    } catch (error) {

        console.error(
            "Staff loading error:",
            error
        );

        showStaffTableError(
            error.message ||
            "Unable to load staff."
        );

        showStaffToast(
            error.message ||
            "Unable to load staff.",
            "error"
        );

    } finally {

        StaffState.isLoading = false;
    }
}


/* =========================================================
   LOAD STATION FILTER
========================================================= */

function loadStationFilters() {

    const select =
        document.getElementById(
            "staffStationFilter"
        );

    if (!select) return;

    const currentValue =
        StaffState.stationFilter;

    select.innerHTML = `

        <option value="all">
            All Stations
        </option>

        ${
            StaffState.stations
                .filter(station => station.is_active !== false)
                .map(station => `
                    <option value="${escapeHtml(
                        String(station.id)
                    )}">
                        ${escapeHtml(
                            station.name
                        )}
                    </option>
                `)
                .join("")
        }

    `;

    if (
        [...select.options]
            .some(
                option =>
                    option.value === currentValue
            )
    ) {
        select.value = currentValue;
    } else {
        select.value = "all";
        StaffState.stationFilter = "all";
    }
}


/* =========================================================
   LOAD STATION SELECT
========================================================= */

function loadStationSelect() {

    const select =
        document.getElementById(
            "staffStation"
        );

    if (!select) return;

    select.innerHTML = `

        <option value="">
            Select station
        </option>

        ${
            StaffState.stations
                .filter(
                    station =>
                        station.is_active !== false
                )
                .map(station => `
                    <option
                        value="${escapeHtml(
                            String(station.id)
                        )}"
                    >
                        ${escapeHtml(
                            station.name
                        )}
                    </option>
                `)
                .join("")
        }

    `;
}


/* =========================================================
   APPLY FILTERS
========================================================= */

function applyStaffFilters() {

    let records = [
        ...StaffState.staff
    ];


    if (StaffState.search) {

        records = records.filter(
            staff => {

                const searchable = [
                    staff.full_name,
                    staff.email,
                    staff.phone,
                    staff.role,
                    staff.station_name
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                return searchable.includes(
                    StaffState.search
                );
            }
        );
    }


    if (
        StaffState.roleFilter !== "all"
    ) {

        records = records.filter(
            staff =>
                staff.role ===
                StaffState.roleFilter
        );
    }


    if (
        StaffState.stationFilter !== "all"
    ) {

        records = records.filter(
            staff =>
                String(
                    staff.station_id || ""
                ) ===
                String(
                    StaffState.stationFilter
                )
        );
    }


    if (
        StaffState.statusFilter !== "all"
    ) {

        records = records.filter(
            staff => {

                const active =
                    staff.is_active !== false;

                return (
                    StaffState.statusFilter ===
                    "active"
                        ? active
                        : !active
                );
            }
        );
    }


    StaffState.filteredStaff =
        records;


    renderStaffTable();

    updateStaffStats();

    updateStaffCount();
}


/* =========================================================
   RENDER STAFF TABLE
========================================================= */

function renderStaffTable() {

    const wrapper =
        document.getElementById(
            "staffTableWrapper"
        );

    if (!wrapper) return;


    if (
        StaffState.isLoading
    ) {

        wrapper.innerHTML =
            renderStaffLoading();

        return;
    }


    if (
        StaffState.filteredStaff.length === 0
    ) {

        wrapper.innerHTML =
            renderEmptyStaffState();

        return;
    }


    wrapper.innerHTML = `

        <div class="fg-table-scroll">

            <table class="fg-staff-table">

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

                        <th class="fg-action-column">
                            Action
                        </th>

                    </tr>

                </thead>

                <tbody>

                    ${
                        StaffState.filteredStaff
                            .map(
                                staff =>
                                    renderStaffRow(
                                        staff
                                    )
                            )
                            .join("")
                    }

                </tbody>

            </table>

        </div>

        <div class="fg-table-footer">

            <div class="fg-results-info">

                Showing
                <strong>
                    ${StaffState.filteredStaff.length}
                </strong>
                of
                <strong>
                    ${StaffState.staff.length}
                </strong>
                staff members

            </div>

        </div>

    `;

    setupStaffActionButtons();
}


/* =========================================================
   STAFF ROW
========================================================= */

function renderStaffRow(staff) {

    const initials =
        getInitials(
            staff.full_name
        );

    const active =
        staff.is_active !== false;


    return `

        <tr>

            <!-- STAFF -->

            <td>

                <div class="fg-staff-person">

                    <div class="fg-avatar">
                        ${escapeHtml(initials)}
                    </div>

                    <div class="fg-person-info">

                        <strong>
                            ${escapeHtml(
                                staff.full_name ||
                                "Unnamed Staff"
                            )}
                        </strong>

                        <span>
                            Staff ID:
                            ${escapeHtml(
                                shortId(
                                    staff.id
                                )
                            )}
                        </span>

                    </div>

                </div>

            </td>


            <!-- CONTACT -->

            <td>

                <div class="fg-contact-info">

                    ${
                        staff.email
                            ? `
                                <span>
                                    <i class="fas fa-envelope"></i>
                                    ${escapeHtml(
                                        staff.email
                                    )}
                                </span>
                            `
                            : ""
                    }

                    ${
                        staff.phone
                            ? `
                                <span>
                                    <i class="fas fa-phone"></i>
                                    ${escapeHtml(
                                        staff.phone
                                    )}
                                </span>
                            `
                            : `
                                <span class="fg-muted">
                                    No phone number
                                </span>
                            `
                    }

                </div>

            </td>


            <!-- ROLE -->

            <td>

                <span
                    class="
                        fg-role-badge
                        ${getRoleClass(
                            staff.role
                        )}
                    "
                >

                    <i
                        class="${getRoleIcon(
                            staff.role
                        )}"
                    ></i>

                    ${escapeHtml(
                        formatRole(
                            staff.role
                        )
                    )}

                </span>

            </td>


            <!-- STATION -->

            <td>

                ${
                    staff.station_name
                        ? `
                            <span class="fg-station-badge">

                                <i class="fas fa-gas-pump"></i>

                                ${escapeHtml(
                                    staff.station_name
                                )}

                            </span>
                        `
                        : `
                            <span class="fg-unassigned-badge">
                                <i class="fas fa-minus-circle"></i>
                                Unassigned
                            </span>
                        `
                }

            </td>


            <!-- STATUS -->

            <td>

                <span
                    class="
                        fg-status-badge
                        ${
                            active
                                ? "active"
                                : "inactive"
                        }
                    "
                >

                    <span class="fg-status-dot"></span>

                    ${
                        active
                            ? "Active"
                            : "Inactive"
                    }

                </span>

            </td>


            <!-- ACTION -->

            <td class="fg-action-column">

                <div class="fg-row-actions">

                    <button
                        type="button"
                        class="
                            fg-row-action
                            ${
                                active
                                    ? "danger"
                                    : "success"
                            }
                        "
                        data-action="toggle-status"
                        data-id="${escapeHtml(
                            String(staff.id)
                        )}"
                        title="${
                            active
                                ? "Deactivate staff"
                                : "Activate staff"
                        }"
                    >

                        <i
                            class="${
                                active
                                    ? "fas fa-user-slash"
                                    : "fas fa-user-check"
                            }"
                        ></i>

                        <span>
                            ${
                                active
                                    ? "Deactivate"
                                    : "Activate"
                            }
                        </span>

                    </button>


                    <button
                        type="button"
                        class="fg-row-action edit"
                        data-action="edit"
                        data-id="${escapeHtml(
                            String(staff.id)
                        )}"
                        title="Edit staff"
                    >

                        <i class="fas fa-pen"></i>

                        <span>
                            Edit
                        </span>

                    </button>

                </div>

            </td>

        </tr>

    `;
}


/* =========================================================
   LOADING SKELETON
========================================================= */

function renderStaffLoading() {

    return `

        <div class="fg-loading-table">

            <div class="fg-skeleton-header">

                <span></span>
                <span></span>
                <span></span>
                <span></span>

            </div>

            ${Array.from(
                { length: 6 }
            )
                .map(
                    () => `
                        <div class="fg-skeleton-row">

                            <div class="fg-skeleton-person">
                                <span class="fg-skeleton-avatar"></span>
                                <span class="fg-skeleton-lines">
                                    <i></i>
                                    <i></i>
                                </span>
                            </div>

                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>

                        </div>
                    `
                )
                .join("")}

        </div>

    `;
}


/* =========================================================
   EMPTY STATE
========================================================= */

function renderEmptyStaffState() {

    const hasFilters =
        StaffState.search ||
        StaffState.roleFilter !== "all" ||
        StaffState.stationFilter !== "all" ||
        StaffState.statusFilter !== "all";


    return `

        <div class="fg-empty-state">

            <div class="fg-empty-icon">

                <i class="${
                    hasFilters
                        ? "fas fa-search"
                        : "fas fa-users"
                }"></i>

            </div>

            <h3>

                ${
                    hasFilters
                        ? "No staff found"
                        : "No staff members yet"
                }

            </h3>

            <p>

                ${
                    hasFilters
                        ? "Try changing your search or filters."
                        : "Add your first staff member to start managing your team."
                }

            </p>

            ${
                hasFilters
                    ? `
                        <button
                            type="button"
                            class="fg-btn fg-btn-secondary"
                            id="clearAllStaffFilters"
                        >
                            <i class="fas fa-filter-circle-xmark"></i>
                            Clear Filters
                        </button>
                    `
                    : `
                        <button
                            type="button"
                            class="fg-btn fg-btn-primary"
                            id="emptyAddStaffBtn"
                        >
                            <i class="fas fa-plus"></i>
                            Add Staff
                        </button>
                    `
            }

        </div>

    `;
}


/* =========================================================
   TABLE ERROR
========================================================= */

function showStaffTableError(message) {

    const wrapper =
        document.getElementById(
            "staffTableWrapper"
        );

    if (!wrapper) return;

    wrapper.innerHTML = `

        <div class="fg-error-state">

            <div class="fg-error-icon">
                <i class="fas fa-triangle-exclamation"></i>
            </div>

            <h3>
                Unable to load staff
            </h3>

            <p>
                ${escapeHtml(
                    message ||
                    "Something went wrong."
                )}
            </p>

            <button
                type="button"
                class="fg-btn fg-btn-primary"
                id="retryStaffBtn"
            >
                <i class="fas fa-refresh"></i>
                Try Again
            </button>

        </div>

    `;


    const retry =
        document.getElementById(
            "retryStaffBtn"
        );

    if (retry) {

        retry.addEventListener(
            "click",
            loadStaffData
        );
    }
}


/* =========================================================
   ACTION BUTTONS
========================================================= */

function setupStaffActionButtons() {

    const buttons =
        document.querySelectorAll(
            "[data-action]"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            async () => {

                const action =
                    button.dataset.action;

                const id =
                    button.dataset.id;

                if (!id) return;


                if (
                    action ===
                    "toggle-status"
                ) {

                    await toggleStaffStatus(
                        id,
                        button
                    );

                }


                if (
                    action === "edit"
                ) {

                    openEditStaffModal(id);

                }

            }
        );

    });


    const emptyAdd =
        document.getElementById(
            "emptyAddStaffBtn"
        );

    if (emptyAdd) {

        emptyAdd.addEventListener(
            "click",
            () => openStaffModal()
        );
    }


    const clearFilters =
        document.getElementById(
            "clearAllStaffFilters"
        );

    if (clearFilters) {

        clearFilters.addEventListener(
            "click",
            clearAllStaffFilters
        );
    }
}


/* =========================================================
   TOGGLE STAFF STATUS
========================================================= */

async function toggleStaffStatus(
    staffId,
    button
) {

    const staff =
        StaffState.staff.find(
            item =>
                String(item.id) ===
                String(staffId)
        );

    if (!staff) return;


    const currentlyActive =
        staff.is_active !== false;

    const nextStatus =
        !currentlyActive;


    const actionText =
        nextStatus
            ? "activate"
            : "deactivate";


    const confirmed =
        window.confirm(
            `Are you sure you want to ${actionText} ${staff.full_name}?`
        );


    if (!confirmed) {
        return;
    }


    if (button) {
        button.disabled = true;
        button.classList.add(
            "fg-action-loading"
        );
    }


    try {

        const response =
            await FuelGapAPI.updateStaff(
                staffId,
                {
                    is_active: nextStatus
                }
            );


        if (
            !response ||
            !response.success
        ) {

            throw new Error(
                response?.message ||
                `Unable to ${actionText} staff.`
            );
        }


        staff.is_active =
            nextStatus;


        applyStaffFilters();


        showStaffToast(
            `${staff.full_name} has been ${
                nextStatus
                    ? "activated"
                    : "deactivated"
            }.`,
            "success"
        );

    } catch (error) {

        console.error(
            "Toggle staff status error:",
            error
        );

        showStaffToast(
            error.message ||
            `Unable to ${actionText} staff.`,
            "error"
        );

    } finally {

        if (button) {

            button.disabled = false;

            button.classList.remove(
                "fg-action-loading"
            );
        }
    }
}


/* =========================================================
   OPEN ADD MODAL
========================================================= */

function openStaffModal() {

    StaffState.editingStaffId = null;

    const modal =
        document.getElementById(
            "staffModal"
        );

    const form =
        document.getElementById(
            "staffForm"
        );

    const title =
        document.getElementById(
            "staffModalTitle"
        );

    const subtitle =
        document.getElementById(
            "staffModalSubtitle"
        );

    const saveButton =
        document.getElementById(
            "saveStaffBtn"
        );

    const passwordGroup =
        document.getElementById(
            "staffPasswordGroup"
        );

    if (!modal || !form) return;


    form.reset();


    if (title) {
        title.textContent =
            "Add New Staff";
    }


    if (subtitle) {
        subtitle.textContent =
            "Create a staff account and assign their station access.";
    }


    if (saveButton) {

        saveButton.innerHTML = `
            <i class="fas fa-user-plus"></i>
            <span>Create Staff</span>
        `;
    }


    if (passwordGroup) {
        passwordGroup.style.display = "";
    }


    loadStationSelect();


    clearStaffFormMessage();


    modal.classList.add(
        "open"
    );

    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "fg-modal-open"
    );


    setTimeout(() => {

        const nameInput =
            document.getElementById(
                "staffFullName"
            );

        if (nameInput) {
            nameInput.focus();
        }

    }, 100);
}


/* =========================================================
   OPEN EDIT MODAL
========================================================= */

function openEditStaffModal(
    staffId
) {

    const staff =
        StaffState.staff.find(
            item =>
                String(item.id) ===
                String(staffId)
        );

    if (!staff) {
        showStaffToast(
            "Staff member not found.",
            "error"
        );
        return;
    }


    StaffState.editingStaffId =
        staffId;


    const modal =
        document.getElementById(
            "staffModal"
        );

    const title =
        document.getElementById(
            "staffModalTitle"
        );

    const subtitle =
        document.getElementById(
            "staffModalSubtitle"
        );

    const form =
        document.getElementById(
            "staffForm"
        );

    const saveButton =
        document.getElementById(
            "saveStaffBtn"
        );

    const passwordGroup =
        document.getElementById(
            "staffPasswordGroup"
        );


    if (!modal || !form) return;


    loadStationSelect();


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

    const password =
        document.getElementById(
            "staffPassword"
        );


    if (fullName) {
        fullName.value =
            staff.full_name || "";
    }


    if (email) {
        email.value =
            staff.email || "";
    }


    if (phone) {
        phone.value =
            staff.phone || "";
    }


    if (role) {
        role.value =
            staff.role || "";
    }


    if (station) {
        station.value =
            staff.station_id || "";
    }


    if (password) {
        password.value = "";
    }


    if (passwordGroup) {
        passwordGroup.style.display =
            "none";
    }


    if (title) {
        title.textContent =
            "Edit Staff";
    }


    if (subtitle) {
        subtitle.textContent =
            "Update staff information and station assignment.";
    }


    if (saveButton) {

        saveButton.innerHTML = `
            <i class="fas fa-save"></i>
            <span>Save Changes</span>
        `;
    }


    clearStaffFormMessage();


    modal.classList.add(
        "open"
    );

    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "fg-modal-open"
    );


    setTimeout(() => {

        if (fullName) {
            fullName.focus();
        }

    }, 100);
}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeStaffModal() {

    const modal =
        document.getElementById(
            "staffModal"
        );

    if (!modal) return;


    if (StaffState.isSubmitting) {
        return;
    }


    modal.classList.remove(
        "open"
    );

    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "fg-modal-open"
    );


    StaffState.editingStaffId =
        null;


    const form =
        document.getElementById(
            "staffForm"
        );

    if (form) {
        form.reset();
    }


    clearStaffFormMessage();
}


/* =========================================================
   SUBMIT STAFF
========================================================= */

async function handleStaffSubmit(
    event
) {

    event.preventDefault();


    if (StaffState.isSubmitting) {
        return;
    }


    const fullName =
        document.getElementById(
            "staffFullName"
        )?.value.trim();

    const email =
        document.getElementById(
            "staffEmail"
        )?.value.trim();

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


    if (!fullName) {

        showStaffFormMessage(
            "Please enter the staff member's full name.",
            "error"
        );

        return;
    }


    if (!email) {

        showStaffFormMessage(
            "Please enter an email address.",
            "error"
        );

        return;
    }


    if (!isValidEmail(email)) {

        showStaffFormMessage(
            "Please enter a valid email address.",
            "error"
        );

        return;
    }


    if (!role) {

        showStaffFormMessage(
            "Please select a staff role.",
            "error"
        );

        return;
    }


    if (
        !getAssignableRoles()
            .includes(role)
    ) {

        showStaffFormMessage(
            "You do not have permission to assign this role.",
            "error"
        );

        return;
    }


    if (!stationId) {

        showStaffFormMessage(
            "Please assign the staff member to a station.",
            "error"
        );

        return;
    }


    const editing =
        Boolean(
            StaffState.editingStaffId
        );


    if (
        !editing &&
        (!password || password.length < 6)
    ) {

        showStaffFormMessage(
            "Temporary password must be at least 6 characters.",
            "error"
        );

        return;
    }


    StaffState.isSubmitting =
        true;


    setStaffSubmitLoading(
        true
    );


    try {

        let response;


        if (editing) {

            const payload = {
                full_name: fullName,
                email,
                phone,
                role,
                station_id: stationId
            };


            response =
                await FuelGapAPI.updateStaff(
                    StaffState.editingStaffId,
                    payload
                );

        } else {

            const payload = {
                full_name: fullName,
                email,
                phone,
                role,
                station_id: stationId,
                password
            };


            response =
                await FuelGapAPI.createStaff(
                    payload
                );
        }


        if (
            !response ||
            !response.success
        ) {

            throw new Error(
                response?.message ||
                (
                    editing
                        ? "Unable to update staff."
                        : "Unable to create staff."
                )
            );
        }


        const updatedStaff =
            normalizeStaff(
                response.data?.staff ||
                response.staff ||
                response.data
            );


        if (editing) {

            const index =
                StaffState.staff.findIndex(
                    item =>
                        String(item.id) ===
                        String(
                            StaffState.editingStaffId
                        )
                );


            if (index !== -1) {

                if (
                    updatedStaff &&
                    updatedStaff.id
                ) {

                    StaffState.staff[index] =
                        updatedStaff;

                } else {

                    StaffState.staff[index] = {
                        ...StaffState.staff[index],
                        full_name: fullName,
                        email,
                        phone,
                        role,
                        station_id: stationId,
                        station_name:
                            getStationName(
                                stationId
                            )
                    };
                }
            }


            showStaffToast(
                "Staff information updated successfully.",
                "success"
            );

        } else {

            if (
                updatedStaff &&
                updatedStaff.id
            ) {

                StaffState.staff.unshift(
                    updatedStaff
                );

            } else {

                await loadStaffData();
            }


            showStaffToast(
                "Staff account created successfully.",
                "success"
            );
        }


        closeStaffModal();

        applyStaffFilters();

    } catch (error) {

        console.error(
            "Staff submit error:",
            error
        );

        showStaffFormMessage(
            error.message ||
            "Something went wrong.",
            "error"
        );

    } finally {

        StaffState.isSubmitting =
            false;

        setStaffSubmitLoading(
            false
        );
    }
}


/* =========================================================
   SUBMIT BUTTON LOADING
========================================================= */

function setStaffSubmitLoading(
    loading
) {

    const button =
        document.getElementById(
            "saveStaffBtn"
        );

    if (!button) return;


    button.disabled =
        loading;


    if (loading) {

        button.innerHTML = `
            <span class="fg-button-spinner"></span>
            <span>
                ${
                    StaffState.editingStaffId
                        ? "Saving..."
                        : "Creating..."
                }
            </span>
        `;

    } else {

        button.innerHTML = `
            <i class="${
                StaffState.editingStaffId
                    ? "fas fa-save"
                    : "fas fa-user-plus"
            }"></i>

            <span>
                ${
                    StaffState.editingStaffId
                        ? "Save Changes"
                        : "Create Staff"
                }
            </span>
        `;
    }
}


/* =========================================================
   PASSWORD VISIBILITY
========================================================= */

function togglePasswordVisibility() {

    const input =
        document.getElementById(
            "staffPassword"
        );

    const button =
        document.getElementById(
            "toggleStaffPassword"
        );

    if (!input || !button) return;


    const icon =
        button.querySelector("i");


    if (
        input.type === "password"
    ) {

        input.type = "text";

        if (icon) {
            icon.className =
                "fas fa-eye-slash";
        }

        button.setAttribute(
            "aria-label",
            "Hide password"
        );

    } else {

        input.type = "password";

        if (icon) {
            icon.className =
                "fas fa-eye";
        }

        button.setAttribute(
            "aria-label",
            "Show password"
        );
    }
}


/* =========================================================
   CLEAR FILTERS
========================================================= */

function clearAllStaffFilters() {

    StaffState.search = "";
    StaffState.roleFilter = "all";
    StaffState.stationFilter = "all";
    StaffState.statusFilter = "all";


    const search =
        document.getElementById(
            "staffSearch"
        );

    const role =
        document.getElementById(
            "staffRoleFilter"
        );

    const station =
        document.getElementById(
            "staffStationFilter"
        );

    const status =
        document.getElementById(
            "staffStatusFilter"
        );


    if (search) {
        search.value = "";
    }

    if (role) {
        role.value = "all";
    }

    if (station) {
        station.value = "all";
    }

    if (status) {
        status.value = "all";
    }


    updateClearSearchButton();

    applyStaffFilters();
}


/* =========================================================
   CLEAR SEARCH BUTTON
========================================================= */

function updateClearSearchButton() {

    const button =
        document.getElementById(
            "clearStaffSearch"
        );

    if (!button) return;


    button.classList.toggle(
        "visible",
        Boolean(StaffState.search)
    );
}


/* =========================================================
   STATS
========================================================= */

function updateStaffStats() {

    const total =
        StaffState.staff.length;


    const active =
        StaffState.staff.filter(
            staff =>
                staff.is_active !== false
        ).length;


    const managers =
        StaffState.staff.filter(
            staff =>
                staff.role === "manager"
        ).length;


    const attendants =
        StaffState.staff.filter(
            staff =>
                staff.role === "attendant"
        ).length;


    setText(
        "stat-total",
        total
    );

    setText(
        "stat-active",
        active
    );

    setText(
        "stat-manager",
        managers
    );

    setText(
        "stat-attendant",
        attendants
    );
}


/* =========================================================
   COUNT BADGE
========================================================= */

function updateStaffCount() {

    const badge =
        document.getElementById(
            "staffCountBadge"
        );

    if (!badge) return;


    badge.textContent =
        StaffState.filteredStaff.length;
}


/* =========================================================
   FORM MESSAGES
========================================================= */

function showStaffFormMessage(
    message,
    type = "error"
) {

    const element =
        document.getElementById(
            "staffFormMessage"
        );

    if (!element) return;


    element.className =
        `fg-form-message ${type}`;


    element.innerHTML = `

        <i class="${
            type === "success"
                ? "fas fa-circle-check"
                : "fas fa-circle-exclamation"
        }"></i>

        <span>
            ${escapeHtml(message)}
        </span>

    `;
}


function clearStaffFormMessage() {

    const element =
        document.getElementById(
            "staffFormMessage"
        );

    if (!element) return;


    element.className =
        "fg-form-message";

    element.innerHTML = "";
}


/* =========================================================
   TOAST
========================================================= */

function showStaffToast(
    message,
    type = "success"
) {

    const container =
        document.getElementById(
            "staffToastContainer"
        );

    if (!container) return;


    const toast =
        document.createElement("div");

    toast.className =
        `fg-toast ${type}`;


    toast.innerHTML = `

        <div class="fg-toast-icon">

            <i class="${
                type === "success"
                    ? "fas fa-check"
                    : type === "error"
                        ? "fas fa-exclamation"
                        : "fas fa-info"
            }"></i>

        </div>

        <div class="fg-toast-content">

            <strong>
                ${
                    type === "success"
                        ? "Success"
                        : type === "error"
                            ? "Error"
                            : "Notice"
                }
            </strong>

            <span>
                ${escapeHtml(message)}
            </span>

        </div>

        <button
            type="button"
            class="fg-toast-close"
        >
            <i class="fas fa-times"></i>
        </button>

    `;


    container.appendChild(
        toast
    );


    requestAnimationFrame(() => {

        toast.classList.add(
            "show"
        );

    });


    const close =
        toast.querySelector(
            ".fg-toast-close"
        );


    if (close) {

        close.addEventListener(
            "click",
            () => removeToast(toast)
        );
    }


    setTimeout(() => {

        removeToast(toast);

    }, 4500);
}


function removeToast(toast) {

    if (!toast) return;

    toast.classList.remove(
        "show"
    );

    setTimeout(() => {

        toast.remove();

    }, 300);
}


/* =========================================================
   KEYBOARD
========================================================= */

function handleStaffKeyboard(
    event
) {

    if (
        event.key === "Escape" &&
        document
            .getElementById("staffModal")
            ?.classList.contains("open")
    ) {

        closeStaffModal();
    }
}


/* =========================================================
   NORMALIZE USER
========================================================= */

function normalizeUser(user) {

    return {
        ...user,

        id:
            user.id ||
            user.user_id ||
            user.auth_user_id,

        full_name:
            user.full_name ||
            user.name ||
            "",

        email:
            user.email ||
            "",

        role:
            String(
                user.role ||
                "attendant"
            ).toLowerCase()
    };
}


/* =========================================================
   NORMALIZE STAFF ARRAY
========================================================= */

function normalizeStaffArray(
    records
) {

    if (!Array.isArray(records)) {
        return [];
    }

    return records
        .map(normalizeStaff)
        .filter(Boolean);
}


/* =========================================================
   NORMALIZE STAFF
========================================================= */

function normalizeStaff(
    staff
) {

    if (!staff || typeof staff !== "object") {
        return null;
    }


    const station =
        staff.stations ||
        staff.station ||
        null;


    return {

        ...staff,

        id:
            staff.id ||
            staff.user_id ||
            staff.auth_user_id,

        full_name:
            staff.full_name ||
            staff.name ||
            "Unnamed Staff",

        email:
            staff.email ||
            "",

        phone:
            staff.phone ||
            "",

        role:
            String(
                staff.role ||
                "attendant"
            ).toLowerCase(),

        is_active:
            staff.is_active !== false,

        station_id:
            staff.station_id ||
            station?.id ||
            null,

        station_name:
            staff.station_name ||
            station?.name ||
            null
    };
}


/* =========================================================
   NORMALIZE STATION
========================================================= */

function normalizeStation(
    station
) {

    if (
        !station ||
        typeof station !== "object"
    ) {
        return null;
    }


    return {

        ...station,

        id:
            station.id ||
            station.station_id,

        name:
            station.name ||
            station.station_name ||
            "Unnamed Station",

        is_active:
            station.is_active !== false
    };
}


/* =========================================================
   NORMALIZE STATION ARRAY
========================================================= */

function normalizeStationArray(
    records
) {

    if (!Array.isArray(records)) {
        return [];
    }

    return records
        .map(normalizeStation)
        .filter(
            station =>
                station &&
                station.id
        );
}


/* =========================================================
   EXTRACT RESPONSE ARRAY
========================================================= */

function extractResponseArray(
    response
) {

    if (!response) {
        return [];
    }


    if (Array.isArray(response)) {
        return response;
    }


    if (
        Array.isArray(
            response.data
        )
    ) {
        return response.data;
    }


    if (
        response.data &&
        Array.isArray(
            response.data.staff
        )
    ) {
        return response.data.staff;
    }


    if (
        response.data &&
        Array.isArray(
            response.data.stations
        )
    ) {
        return response.data.stations;
    }


    if (
        Array.isArray(
            response.staff
        )
    ) {
        return response.staff;
    }


    if (
        Array.isArray(
            response.stations
        )
    ) {
        return response.stations;
    }


    return [];
}


/* =========================================================
   HELPERS
========================================================= */

function getStationName(
    stationId
) {

    const station =
        StaffState.stations.find(
            item =>
                String(item.id) ===
                String(stationId)
        );

    return station?.name || null;
}


function formatRole(
    role
) {

    if (!role) {
        return "Unknown";
    }

    return String(role)
        .charAt(0)
        .toUpperCase() +
        String(role)
            .slice(1)
            .toLowerCase();
}


function getRoleClass(
    role
) {

    switch (
        String(role).toLowerCase()
    ) {

        case "owner":
            return "owner";

        case "admin":
            return "admin";

        case "manager":
            return "manager";

        case "attendant":
            return "attendant";

        default:
            return "default";
    }
}


function getRoleIcon(
    role
) {

    switch (
        String(role).toLowerCase()
    ) {

        case "owner":
            return "fas fa-crown";

        case "admin":
            return "fas fa-shield-halved";

        case "manager":
            return "fas fa-user-tie";

        case "attendant":
            return "fas fa-user";

        default:
            return "fas fa-user";
    }
}


function getInitials(
    name
) {

    if (!name) {
        return "U";
    }


    const words =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (words.length === 1) {

        return words[0]
            .slice(0, 2)
            .toUpperCase();
    }


    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();
}


function shortId(
    id
) {

    if (!id) {
        return "---";
    }

    const value =
        String(id);

    if (value.length <= 10) {
        return value;
    }

    return (
        value.slice(0, 6) +
        "..." +
        value.slice(-4)
    );
}


function isValidEmail(
    email
) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);
}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            String(value);
    }
}


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
   PAGE ERROR
========================================================= */

function showPageError(
    message
) {

    const pageContent =
        document.getElementById(
            "pageContent"
        );


    if (!pageContent) return;


    pageContent.innerHTML = `

        <div class="fg-page-error">

            <div class="fg-page-error-icon">
                <i class="fas fa-triangle-exclamation"></i>
            </div>

            <h2>
                Something went wrong
            </h2>

            <p>
                ${escapeHtml(message)}
            </p>

            <button
                type="button"
                class="fg-btn fg-btn-primary"
                onclick="location.reload()"
            >
                <i class="fas fa-refresh"></i>
                Reload Page
            </button>

        </div>

    `;
}


/* =========================================================
   PROFESSIONAL STAFF STYLES
========================================================= */

function injectStaffStyles() {

    if (
        document.getElementById(
            "fuelgapStaffStyles"
        )
    ) {
        return;
    }


    const style =
        document.createElement("style");

    style.id =
        "fuelgapStaffStyles";


    style.textContent = `

/* =========================================================
   FUELGAP STAFF PAGE
========================================================= */

.fg-staff-page {
    width: 100%;
    max-width: 1500px;
    margin: 0 auto;
    padding: 30px;
    color: #171717;
}


/* =========================================================
   HERO
========================================================= */

.fg-staff-hero {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding: 28px 30px;
    margin-bottom: 24px;
    background: #ffffff;
    border: 1px solid #eeeeee;
    border-radius: 20px;
    box-shadow: 0 8px 30px rgba(0,0,0,.045);
}

.fg-staff-hero-left {
    display: flex;
    align-items: center;
    gap: 18px;
}

.fg-staff-icon {
    width: 58px;
    height: 58px;
    flex: 0 0 58px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 16px;
    background: #fff8d6;
    color: #d59f00;
    font-size: 22px;
}

.fg-breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 5px;
    color: #8a8a8a;
    font-size: 12px;
    font-weight: 600;
}

.fg-breadcrumb span {
    color: #c7c7c7;
}

.fg-staff-hero h1 {
    margin: 0;
    font-size: 27px;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -.4px;
}

.fg-staff-hero p {
    margin: 7px 0 0;
    color: #777777;
    font-size: 14px;
}


/* =========================================================
   BUTTONS
========================================================= */

.fg-btn {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 9px;
    border: 0;
    border-radius: 11px;
    padding: 0 17px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: .2s ease;
}

.fg-btn:disabled {
    opacity: .6;
    cursor: not-allowed;
}

.fg-btn-primary {
    background: #f4c400;
    color: #171717;
    box-shadow: 0 5px 14px rgba(244,196,0,.22);
}

.fg-btn-primary:hover:not(:disabled) {
    background: #e9b900;
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(244,196,0,.28);
}

.fg-btn-secondary {
    background: #ffffff;
    color: #333333;
    border: 1px solid #dedede;
}

.fg-btn-secondary:hover:not(:disabled) {
    background: #fafafa;
    border-color: #cfcfcf;
}


/* =========================================================
   STAT CARDS
========================================================= */

.fg-staff-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 17px;
    margin-bottom: 24px;
}

.fg-stat-card {
    padding: 21px;
    background: #ffffff;
    border: 1px solid #eeeeee;
    border-radius: 17px;
    box-shadow: 0 6px 24px rgba(0,0,0,.035);
    transition: .2s ease;
}

.fg-stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(0,0,0,.06);
}

.fg-stat-card-top {
    display: flex;
    align-items: center;
    gap: 11px;
}

.fg-stat-icon {
    width: 39px;
    height: 39px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 11px;
    font-size: 15px;
}

.fg-stat-icon.total {
    background: #fff8d6;
    color: #c99b00;
}

.fg-stat-icon.active {
    background: #edf9f1;
    color: #259a50;
}

.fg-stat-icon.manager {
    background: #f0f3ff;
    color: #5367b8;
}

.fg-stat-icon.attendant {
    background: #fff1eb;
    color: #d56b3b;
}

.fg-stat-label {
    color: #777777;
    font-size: 12px;
    font-weight: 700;
}

.fg-stat-value {
    margin-top: 14px;
    font-size: 28px;
    line-height: 1;
    font-weight: 800;
    letter-spacing: -.6px;
}

.fg-stat-subtitle {
    margin-top: 8px;
    color: #9a9a9a;
    font-size: 11px;
}


/* =========================================================
   SECTION
========================================================= */

.fg-staff-section {
    background: #ffffff;
    border: 1px solid #eeeeee;
    border-radius: 20px;
    box-shadow: 0 8px 30px rgba(0,0,0,.04);
    overflow: hidden;
}

.fg-section-header {
    min-height: 92px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 21px 25px;
    border-bottom: 1px solid #eeeeee;
}

.fg-section-title-row {
    display: flex;
    align-items: center;
    gap: 10px;
}

.fg-section-title-row h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 800;
}

.fg-section-header p {
    margin: 5px 0 0;
    color: #858585;
    font-size: 12px;
}

.fg-count-badge {
    min-width: 25px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 8px;
    border-radius: 20px;
    background: #fff5bf;
    color: #9d7900;
    font-size: 11px;
    font-weight: 800;
}

.fg-icon-btn {
    width: 39px;
    height: 39px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid #e5e5e5;
    border-radius: 10px;
    background: #ffffff;
    color: #686868;
    cursor: pointer;
    transition: .2s ease;
}

.fg-icon-btn:hover {
    border-color: #e0b800;
    color: #c09300;
    background: #fffbed;
}

.fg-spin i {
    animation: fgRotate .7s linear infinite;
}

@keyframes fgRotate {
    to {
        transform: rotate(360deg);
    }
}


/* =========================================================
   TOOLBAR
========================================================= */

.fg-staff-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
    padding: 17px 25px;
    background: #fcfcfc;
    border-bottom: 1px solid #eeeeee;
}

.fg-search-box {
    position: relative;
    width: min(440px, 100%);
}

.fg-search-box > i {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #a2a2a2;
    font-size: 13px;
    pointer-events: none;
}

.fg-search-box input {
    width: 100%;
    height: 43px;
    padding: 0 40px 0 38px;
    border: 1px solid #dedede;
    border-radius: 11px;
    outline: none;
    background: #ffffff;
    color: #222222;
    font-family: inherit;
    font-size: 12px;
    transition: .2s ease;
}

.fg-search-box input:focus {
    border-color: #e0b800;
    box-shadow: 0 0 0 3px rgba(244,196,0,.12);
}

.fg-search-clear {
    position: absolute;
    right: 8px;
    top: 50%;
    width: 27px;
    height: 27px;
    transform: translateY(-50%);
    display: none;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 8px;
    background: #f2f2f2;
    color: #777777;
    cursor: pointer;
}

.fg-search-clear.visible {
    display: flex;
}

.fg-filter-group {
    display: flex;
    gap: 9px;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.fg-filter-select {
    min-width: 135px;
    height: 43px;
    padding: 0 31px 0 12px;
    border: 1px solid #dedede;
    border-radius: 11px;
    background: #ffffff;
    color: #444444;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    outline: none;
    cursor: pointer;
}

.fg-filter-select:focus {
    border-color: #e0b800;
    box-shadow: 0 0 0 3px rgba(244,196,0,.1);
}


/* =========================================================
   TABLE
========================================================= */

.fg-staff-table-wrapper {
    width: 100%;
}

.fg-table-scroll {
    width: 100%;
    overflow-x: auto;
}

.fg-staff-table {
    width: 100%;
    min-width: 980px;
    border-collapse: collapse;
}

.fg-staff-table thead th {
    height: 47px;
    padding: 0 20px;
    background: #fafafa;
    border-bottom: 1px solid #eeeeee;
    color: #8a8a8a;
    text-align: left;
    white-space: nowrap;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .6px;
}

.fg-staff-table tbody td {
    padding: 17px 20px;
    border-bottom: 1px solid #f0f0f0;
    vertical-align: middle;
}

.fg-staff-table tbody tr {
    transition: .18s ease;
}

.fg-staff-table tbody tr:hover {
    background: #fffdf3;
}

.fg-staff-table tbody tr:last-child td {
    border-bottom: 0;
}


/* =========================================================
   STAFF PERSON
========================================================= */

.fg-staff-person {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 190px;
}

.fg-avatar {
    width: 40px;
    height: 40px;
    flex: 0 0 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: #fff4b8;
    color: #856600;
    font-size: 12px;
    font-weight: 800;
}

.fg-person-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
}

.fg-person-info strong {
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #222222;
    font-size: 13px;
    font-weight: 750;
}

.fg-person-info span {
    color: #a0a0a0;
    font-size: 10px;
}


/* =========================================================
   CONTACT
========================================================= */

.fg-contact-info {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.fg-contact-info span {
    display: flex;
    align-items: center;
    gap: 7px;
    max-width: 225px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #555555;
    font-size: 11px;
}

.fg-contact-info i {
    width: 12px;
    color: #aaa;
    font-size: 9px;
}

.fg-muted {
    color: #aaa !important;
}


/* =========================================================
   ROLE BADGES
========================================================= */

.fg-role-badge,
.fg-station-badge,
.fg-unassigned-badge,
.fg-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    white-space: nowrap;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 750;
}

.fg-role-badge {
    padding: 7px 10px;
}

.fg-role-badge.owner {
    background: #fff2c7;
    color: #8b6900;
}

.fg-role-badge.admin {
    background: #f0f2ff;
    color: #5263a9;
}

.fg-role-badge.manager {
    background: #fff1e8;
    color: #c15e2d;
}

.fg-role-badge.attendant {
    background: #edf8f0;
    color: #32804c;
}

.fg-role-badge.default {
    background: #f3f3f3;
    color: #666666;
}


/* =========================================================
   STATION BADGE
========================================================= */

.fg-station-badge {
    max-width: 175px;
    padding: 7px 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    background: #fff9df;
    color: #846900;
}

.fg-station-badge i {
    color: #d2a500;
}

.fg-unassigned-badge {
    padding: 7px 10px;
    background: #f5f5f5;
    color: #999999;
}


/* =========================================================
   STATUS
========================================================= */

.fg-status-badge {
    padding: 7px 10px;
}

.fg-status-badge.active {
    background: #edf9f1;
    color: #278149;
}

.fg-status-badge.inactive {
    background: #f7eeee;
    color: #a05d5d;
}

.fg-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
}


/* =========================================================
   ACTIONS
========================================================= */

.fg-action-column {
    text-align: right !important;
}

.fg-row-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
}

.fg-row-action {
    min-height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 0 9px;
    border: 1px solid #e4e4e4;
    border-radius: 9px;
    background: #ffffff;
    color: #666666;
    font-family: inherit;
    font-size: 10px;
    font-weight: 700;
    cursor: pointer;
    transition: .18s ease;
}

.fg-row-action:hover {
    background: #fafafa;
    border-color: #cfcfcf;
}

.fg-row-action.edit:hover {
    border-color: #e0b800;
    color: #a27c00;
    background: #fffbed;
}

.fg-row-action.danger:hover {
    border-color: #e1b4b4;
    color: #a04d4d;
    background: #fff5f5;
}

.fg-row-action.success:hover {
    border-color: #a8d8b8;
    color: #2c7c47;
    background: #f2fbf5;
}

.fg-row-action:disabled {
    opacity: .5;
    cursor: wait;
}

.fg-action-loading i {
    animation: fgRotate .7s linear infinite;
}


/* =========================================================
   TABLE FOOTER
========================================================= */

.fg-table-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 50px;
    padding: 0 20px;
    border-top: 1px solid #eeeeee;
    background: #fcfcfc;
}

.fg-results-info {
    color: #969696;
    font-size: 11px;
}

.fg-results-info strong {
    color: #555555;
}


/* =========================================================
   EMPTY / ERROR
========================================================= */

.fg-empty-state,
.fg-error-state {
    min-height: 340px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
}

.fg-empty-icon,
.fg-error-icon {
    width: 65px;
    height: 65px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    border-radius: 18px;
    font-size: 22px;
}

.fg-empty-icon {
    background: #fff8d6;
    color: #d1a000;
}

.fg-error-icon {
    background: #fff0f0;
    color: #b35b5b;
}

.fg-empty-state h3,
.fg-error-state h3 {
    margin: 0;
    color: #2a2a2a;
    font-size: 16px;
    font-weight: 800;
}

.fg-empty-state p,
.fg-error-state p {
    max-width: 430px;
    margin: 7px 0 18px;
    color: #929292;
    font-size: 12px;
    line-height: 1.6;
}


/* =========================================================
   LOADING SKELETON
========================================================= */

.fg-loading-table {
    padding: 0;
}

.fg-skeleton-header,
.fg-skeleton-row {
    display: grid;
    grid-template-columns: 2fr 1.6fr 1fr 1.3fr .8fr;
    gap: 20px;
    align-items: center;
    padding: 15px 20px;
}

.fg-skeleton-header {
    background: #fafafa;
    border-bottom: 1px solid #eeeeee;
}

.fg-skeleton-header span,
.fg-skeleton-row > span {
    height: 10px;
    border-radius: 6px;
    background: linear-gradient(
        90deg,
        #eeeeee,
        #f7f7f7,
        #eeeeee
    );
    background-size: 200% 100%;
    animation: fgSkeleton 1.4s infinite;
}

.fg-skeleton-header span {
    width: 70px;
}

.fg-skeleton-row {
    min-height: 74px;
    border-bottom: 1px solid #f1f1f1;
}

.fg-skeleton-person {
    display: flex;
    align-items: center;
    gap: 12px;
}

.fg-skeleton-avatar {
    width: 40px;
    height: 40px;
    flex: 0 0 40px;
    border-radius: 12px;
    background: #eeeeee;
    animation: fgSkeleton 1.4s infinite;
}

.fg-skeleton-lines {
    display: flex;
    flex-direction: column;
    gap: 7px;
}

.fg-skeleton-lines i {
    display: block;
    width: 120px;
    height: 9px;
    border-radius: 5px;
    background: #eeeeee;
    animation: fgSkeleton 1.4s infinite;
}

.fg-skeleton-lines i:last-child {
    width: 75px;
}

@keyframes fgSkeleton {
    0% {
        background-position: 200% 0;
    }

    100% {
        background-position: -200% 0;
    }
}


/* =========================================================
   MODAL
========================================================= */

.fg-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(20,20,20,.55);
    backdrop-filter: blur(4px);
    opacity: 0;
    visibility: hidden;
    transition: .2s ease;
}

.fg-modal-overlay.open {
    opacity: 1;
    visibility: visible;
}

.fg-modal {
    width: min(680px, 100%);
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 25px 80px rgba(0,0,0,.22);
    transform: translateY(15px) scale(.98);
    transition: .22s ease;
}

.fg-modal-overlay.open .fg-modal {
    transform: translateY(0) scale(1);
}

.fg-modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    padding: 23px 25px;
    border-bottom: 1px solid #eeeeee;
}

.fg-modal-heading {
    display: flex;
    align-items: center;
    gap: 13px;
}

.fg-modal-icon {
    width: 43px;
    height: 43px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 43px;
    border-radius: 12px;
    background: #fff5c3;
    color: #b88c00;
}

.fg-modal-header h3 {
    margin: 0;
    color: #202020;
    font-size: 17px;
    font-weight: 800;
}

.fg-modal-header p {
    margin: 5px 0 0;
    color: #8e8e8e;
    font-size: 11px;
    line-height: 1.45;
}

.fg-modal-close {
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 9px;
    background: #f5f5f5;
    color: #777777;
    cursor: pointer;
    transition: .18s ease;
}

.fg-modal-close:hover {
    background: #fff0f0;
    color: #ad5a5a;
}


/* =========================================================
   FORM
========================================================= */

.fg-staff-form {
    padding: 24px 25px 25px;
}

.fg-form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
}

.fg-form-group {
    min-width: 0;
}

.fg-form-full {
    grid-column: 1 / -1;
}

.fg-form-group label {
    display: block;
    margin-bottom: 7px;
    color: #4a4a4a;
    font-size: 11px;
    font-weight: 800;
}

.fg-form-group label span {
    color: #d29e00;
}

.fg-form-group small {
    display: block;
    margin-top: 6px;
    color: #9b9b9b;
    font-size: 10px;
    line-height: 1.5;
}

.fg-input-wrap {
    position: relative;
}

.fg-input-wrap > i {
    position: absolute;
    left: 13px;
    top: 50%;
    z-index: 1;
    transform: translateY(-50%);
    color: #a5a5a5;
    font-size: 11px;
    pointer-events: none;
}

.fg-input-wrap input,
.fg-input-wrap select {
    width: 100%;
    height: 44px;
    padding: 0 13px 0 36px;
    border: 1px solid #dddddd;
    border-radius: 10px;
    background: #ffffff;
    color: #272727;
    outline: none;
    font-family: inherit;
    font-size: 12px;
    transition: .2s ease;
}

.fg-input-wrap input:focus,
.fg-input-wrap select:focus {
    border-color: #e0b800;
    box-shadow: 0 0 0 3px rgba(244,196,0,.1);
}

.fg-select-wrap select {
    cursor: pointer;
    appearance: auto;
}

.fg-password-toggle {
    position: absolute;
    right: 7px;
    top: 50%;
    width: 31px;
    height: 31px;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 8px;
    background: #f7f7f7;
    color: #777777;
    cursor: pointer;
}

.fg-password-toggle:hover {
    background: #fff8d6;
    color: #a27d00;
}

.fg-form-message {
    min-height: 0;
    margin-top: 17px;
}

.fg-form-message:not(:empty) {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 11px 12px;
    border-radius: 9px;
    font-size: 11px;
    line-height: 1.4;
}

.fg-form-message.error {
    background: #fff2f2;
    color: #a25555;
}

.fg-form-message.success {
    background: #eefaf1;
    color: #2c7b47;
}

.fg-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 22px;
    padding-top: 20px;
    border-top: 1px solid #eeeeee;
}

.fg-button-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(0,0,0,.18);
    border-top-color: #222222;
    border-radius: 50%;
    animation: fgRotate .7s linear infinite;
}


/* =========================================================
   TOAST
========================================================= */

.fg-toast-container {
    position: fixed;
    right: 22px;
    bottom: 22px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: min(370px, calc(100vw - 30px));
}

.fg-toast {
    display: flex;
    align-items: center;
    gap: 11px;
    padding: 12px 13px;
    background: #ffffff;
    border: 1px solid #e7e7e7;
    border-radius: 13px;
    box-shadow: 0 15px 35px rgba(0,0,0,.12);
    opacity: 0;
    transform: translateX(20px);
    transition: .25s ease;
}

.fg-toast.show {
    opacity: 1;
    transform: translateX(0);
}

.fg-toast-icon {
    width: 32px;
    height: 32px;
    flex: 0 0 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9px;
    background: #fff4b5;
    color: #aa8100;
    font-size: 12px;
}

.fg-toast.error .fg-toast-icon {
    background: #fff0f0;
    color: #a95656;
}

.fg-toast-content {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.fg-toast-content strong {
    color: #2c2c2c;
    font-size: 11px;
    font-weight: 800;
}

.fg-toast-content span {
    color: #858585;
    font-size: 10px;
    line-height: 1.4;
}

.fg-toast-close {
    width: 25px;
    height: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 0;
    background: transparent;
    color: #999999;
    cursor: pointer;
}


/* =========================================================
   PAGE ERROR
========================================================= */

.fg-page-error {
    min-height: 500px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 30px;
}

.fg-page-error-icon {
    width: 70px;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 17px;
    border-radius: 20px;
    background: #fff1f1;
    color: #b25a5a;
    font-size: 24px;
}

.fg-page-error h2 {
    margin: 0;
    font-size: 20px;
}

.fg-page-error p {
    max-width: 450px;
    margin: 8px 0 18px;
    color: #888888;
    font-size: 12px;
}


/* =========================================================
   RESPONSIVE
========================================================= */

@media (max-width: 1100px) {

    .fg-staff-stats {
        grid-template-columns:
            repeat(2, minmax(0, 1fr));
    }

    .fg-staff-toolbar {
        align-items: stretch;
        flex-direction: column;
    }

    .fg-search-box {
        width: 100%;
    }

    .fg-filter-group {
        justify-content: flex-start;
    }

}


@media (max-width: 760px) {

    .fg-staff-page {
        padding: 17px;
    }

    .fg-staff-hero {
        align-items: flex-start;
        flex-direction: column;
        padding: 21px;
    }

    .fg-staff-hero-left {
        align-items: flex-start;
    }

    .fg-staff-hero h1 {
        font-size: 22px;
    }

    .fg-add-staff-btn {
        width: 100%;
    }

    .fg-staff-stats {
        grid-template-columns: 1fr 1fr;
        gap: 10px;
    }

    .fg-stat-card {
        padding: 16px;
    }

    .fg-stat-value {
        font-size: 24px;
    }

    .fg-section-header {
        padding: 18px;
    }

    .fg-staff-toolbar {
        padding: 15px;
    }

    .fg-filter-group {
        display: grid;
        grid-template-columns:
            repeat(3, minmax(0, 1fr));
    }

    .fg-filter-select {
        width: 100%;
        min-width: 0;
    }

    .fg-modal-overlay {
        align-items: flex-end;
        padding: 0;
    }

    .fg-modal {
        width: 100%;
        max-height: 92vh;
        border-radius: 20px 20px 0 0;
    }

    .fg-form-grid {
        grid-template-columns: 1fr;
    }

    .fg-form-full {
        grid-column: auto;
    }

    .fg-staff-form {
        padding: 20px;
    }

    .fg-modal-header {
        padding: 20px;
    }

}


@media (max-width: 520px) {

    .fg-staff-hero-left {
        gap: 12px;
    }

    .fg-staff-icon {
        width: 46px;
        height: 46px;
        flex-basis: 46px;
        border-radius: 13px;
        font-size: 17px;
    }

    .fg-staff-hero p {
        font-size: 11px;
    }

    .fg-staff-stats {
        grid-template-columns: 1fr 1fr;
    }

    .fg-stat-card-top {
        gap: 7px;
    }

    .fg-stat-icon {
        width: 32px;
        height: 32px;
        font-size: 12px;
    }

    .fg-stat-label {
        font-size: 10px;
    }

    .fg-stat-value {
        margin-top: 11px;
        font-size: 22px;
    }

    .fg-stat-subtitle {
        font-size: 9px;
    }

    .fg-filter-group {
        grid-template-columns: 1fr;
    }

    .fg-section-title-row h2 {
        font-size: 16px;
    }

    .fg-row-action span {
        display: none;
    }

    .fg-row-action {
        width: 34px;
        padding: 0;
    }

    .fg-toast-container {
        right: 15px;
        bottom: 15px;
        width: calc(100vw - 30px);
    }

}


/* =========================================================
   MODAL BODY LOCK
========================================================= */

body.fg-modal-open {
    overflow: hidden;
}

    `;


    document.head.appendChild(
        style
    );
}


/* =========================================================
   GLOBAL ACCESS
========================================================= */

window.FuelGapStaff = {

    state: StaffState,

    reload: loadStaffData,

    refreshStations: async () => {

        if (
            typeof FuelGapAPI ===
            "undefined"
        ) {
            return;
        }

        try {

            const response =
                await FuelGapAPI.getStations();

            if (
                response &&
                response.success
            ) {

                StaffState.stations =
                    normalizeStationArray(
                        extractResponseArray(
                            response
                        )
                    );

                loadStationFilters();
                loadStationSelect();
            }

        } catch (error) {

            console.error(
                "Unable to refresh stations:",
                error
            );
        }
    }

};