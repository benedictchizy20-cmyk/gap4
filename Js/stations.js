/* ==========================================
   FUELGAP - PROFESSIONAL STATION MANAGEMENT
========================================== */

const STATIONS_STORAGE_KEY = "fuelgap_stations";
const ORGANIZATIONS_STORAGE_KEY = "fuelgap_organizations";


/* ==========================================
   PAGE INITIALIZATION
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    const currentUser = FuelGapUtils.getCurrentUser();


    /* =========================
       AUTH CHECK
    ========================== */

    if (!currentUser) {

        window.location.href = "../login.html";
        return;

    }


    /* =========================
       ROLE ACCESS
    ========================== */

    if (
        currentUser.role !== "admin" &&
        currentUser.role !== "owner"
    ) {

        window.location.href = "./dashboard.html";
        return;

    }


    /* =========================
       WAIT FOR PAGE CONTAINER
    ========================== */

    setTimeout(() => {

        injectStationsStyles();

        renderStationsPage();

        setupStationEvents();

        renderStations();

    }, 0);

});


/* ==========================================
   GET ORGANIZATIONS
========================================== */

function getOrganizations() {

    try {

        return JSON.parse(
            localStorage.getItem(
                ORGANIZATIONS_STORAGE_KEY
            )
        ) || [];

    } catch (error) {

        console.error(
            "Unable to load organizations:",
            error
        );

        return [];

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
   SAVE STATIONS
========================================== */

function saveStations(stations) {

    localStorage.setItem(
        STATIONS_STORAGE_KEY,
        JSON.stringify(stations)
    );

}


/* ==========================================
   GET USER ORGANIZATION
========================================== */

function getUserOrganizationId(currentUser) {

    return currentUser.organizationId || "";

}


/* ==========================================
   ICONS
========================================== */

function stationIcon(name) {

    const icons = {

        station: `
            <svg viewBox="0 0 24 24" fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round">

                <path d="M3 22V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"></path>
                <path d="M3 10h10"></path>
                <path d="M7 4v6"></path>
                <path d="M17 7h1a3 3 0 0 1 3 3v12"></path>
                <path d="M17 22v-8"></path>

            </svg>
        `,

        plus: `
            <svg viewBox="0 0 24 24" fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round">

                <path d="M12 5v14"></path>
                <path d="M5 12h14"></path>

            </svg>
        `,

        search: `
            <svg viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2">

                <circle cx="11"
                    cy="11"
                    r="7"></circle>

                <path d="m20 20-4-4"></path>

            </svg>
        `,

        location: `
            <svg viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2">

                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"></path>

                <circle cx="12"
                    cy="10"
                    r="3"></circle>

            </svg>
        `,

        building: `
            <svg viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2">

                <rect x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="2"></rect>

                <path d="M9 21V9h6v12"></path>
                <path d="M7 7h.01"></path>
                <path d="M17 7h.01"></path>

            </svg>
        `,

        phone: `
            <svg viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2">

                <path d="M22 16.92v3a2 2 0 0 1-2.18 2
                19.79 19.79 0 0 1-8.63-3.07
                19.5 19.5 0 0 1-6-6
                19.79 19.79 0 0 1-3.07-8.67
                A2 2 0 0 1 4.11 2h3
                a2 2 0 0 1 2 1.72
                c.12.9.33 1.78.62 2.63
                a2 2 0 0 1-.45 2.11
                L8 9.73a16 16 0 0 0 6 6
                l1.27-1.27a2 2 0 0 1 2.11-.45
                c.85.29 1.73.5 2.63.62
                A2 2 0 0 1 22 16.92z"></path>

            </svg>
        `,

        active: `
            <svg viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5">

                <path d="M20 6 9 17l-5-5"></path>

            </svg>
        `,

        inactive: `
            <svg viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5">

                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>

            </svg>
        `,

        dots: `
            <svg viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2">

                <circle cx="5" cy="12" r="1"></circle>
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="19" cy="12" r="1"></circle>

            </svg>
        `,

        close: `
            <svg viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5">

                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>

            </svg>
        `,

        filter: `
            <svg viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2">

                <path d="M4 6h16"></path>
                <path d="M7 12h10"></path>
                <path d="M10 18h4"></path>

            </svg>
        `

    };


    return icons[name] || "";

}


/* ==========================================
   RENDER PROFESSIONAL PAGE
========================================== */

function renderStationsPage() {

    const pageContent =
        document.getElementById("pageContent");


    if (!pageContent) {

        console.error(
            "pageContent was not found."
        );

        return;

    }


    pageContent.innerHTML = `

        <div class="fg-stations-page">


            <!-- =========================
                 PAGE HEADER
            ========================== -->

            <div class="fg-page-header">

                <div class="fg-header-content">

                    <div class="fg-header-icon">

                        ${stationIcon("station")}

                    </div>


                    <div>

                        <div class="fg-breadcrumb">

                            Operations

                            <span>/</span>

                            Station Management

                        </div>


                        <h1>
                            Fuel Stations
                        </h1>


                        <p>
                            Manage and monitor all fuel stations
                            connected to your organization.
                        </p>

                    </div>

                </div>


                <button
                    id="openStationModal"
                    class="fg-primary-btn"
                    type="button"
                >

                    ${stationIcon("plus")}

                    <span>
                        Add Station
                    </span>

                </button>

            </div>



            <!-- =========================
                 STATION METRICS
            ========================== -->

            <section class="fg-station-metrics">


                <div class="fg-metric-card">

                    <div class="fg-metric-icon fg-icon-dark">

                        ${stationIcon("station")}

                    </div>


                    <div class="fg-metric-content">

                        <span>
                            Total Stations
                        </span>

                        <strong
                            id="totalStations"
                        >
                            0
                        </strong>

                        <small>
                            All registered stations
                        </small>

                    </div>

                </div>



                <div class="fg-metric-card">

                    <div class="fg-metric-icon fg-icon-success">

                        ${stationIcon("active")}

                    </div>


                    <div class="fg-metric-content">

                        <span>
                            Active Stations
                        </span>

                        <strong
                            id="activeStations"
                        >
                            0
                        </strong>

                        <small>
                            Currently operational
                        </small>

                    </div>

                </div>



                <div class="fg-metric-card">

                    <div class="fg-metric-icon fg-icon-muted">

                        ${stationIcon("inactive")}

                    </div>


                    <div class="fg-metric-content">

                        <span>
                            Inactive Stations
                        </span>

                        <strong
                            id="inactiveStations"
                        >
                            0
                        </strong>

                        <small>
                            Temporarily unavailable
                        </small>

                    </div>

                </div>



                <div class="fg-metric-card">

                    <div class="fg-metric-icon fg-icon-yellow">

                        %
                    </div>


                    <div class="fg-metric-content">

                        <span>
                            Operational Rate
                        </span>

                        <strong
                            id="operationalRate"
                        >
                            0%
                        </strong>

                        <small>
                            Active station performance
                        </small>

                    </div>

                </div>


            </section>



            <!-- =========================
                 STATION MANAGEMENT PANEL
            ========================== -->

            <section class="fg-station-panel">


                <div class="fg-panel-header">


                    <div>

                        <h2>
                            Station Directory
                        </h2>

                        <p>
                            View, search and manage your
                            fuel station network.
                        </p>

                    </div>


                    <div class="fg-station-count">

                        <span
                            id="visibleStationCount"
                        >
                            0
                        </span>

                        Stations

                    </div>


                </div>



                <!-- =====================
                     TOOLBAR
                ====================== -->

                <div class="fg-toolbar">


                    <div class="fg-search-box">

                        ${stationIcon("search")}

                        <input
                            type="search"
                            id="stationSearch"
                            placeholder="Search by station name or location..."
                        >

                    </div>



                    <div class="fg-filter-box">

                        ${stationIcon("filter")}

                        <select
                            id="stationStatusFilter"
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


                </div>



                <!-- =====================
                     TABLE
                ====================== -->

                <div class="fg-table-wrapper">

                    <table class="fg-station-table">


                        <thead>

                            <tr>

                                <th>
                                    Station
                                </th>

                                <th>
                                    Organization
                                </th>

                                <th>
                                    Location
                                </th>

                                <th>
                                    Contact
                                </th>

                                <th>
                                    Status
                                </th>

                                <th
                                    class="fg-action-column"
                                >
                                    Actions
                                </th>

                            </tr>

                        </thead>



                        <tbody
                            id="stationTableBody"
                        >
                        </tbody>


                    </table>


                </div>



                <!-- =====================
                     EMPTY STATE
                ====================== -->

                <div
                    id="emptyStationState"
                    class="fg-empty-state hidden"
                >


                    <div class="fg-empty-icon">

                        ${stationIcon("station")}

                    </div>


                    <h3>
                        No fuel stations found
                    </h3>


                    <p>
                        Start building your fuel station
                        network by adding your first station.
                    </p>


                    <button
                        id="emptyAddStation"
                        class="fg-primary-btn"
                        type="button"
                    >

                        ${stationIcon("plus")}

                        Add Your First Station

                    </button>


                </div>


            </section>



            <!-- =========================
                 STATION MODAL
            ========================== -->

            <div
                id="stationModal"
                class="fg-modal hidden"
            >


                <div
                    class="fg-modal-overlay"
                ></div>



                <div
                    class="fg-modal-content"
                >


                    <div class="fg-modal-header">


                        <div>

                            <div class="fg-modal-eyebrow">

                                STATION SETUP

                            </div>


                            <h2>
                                Add Fuel Station
                            </h2>


                            <p>
                                Enter the station information
                                to register it in FuelGap.
                            </p>

                        </div>



                        <button
                            id="closeStationModal"
                            class="fg-modal-close"
                            type="button"
                        >

                            ${stationIcon("close")}

                        </button>


                    </div>



                    <form
                        id="stationForm"
                    >


                        <div class="fg-form-grid">


                            <!-- STATION NAME -->

                            <div class="fg-form-group fg-full">

                                <label>
                                    Station Name
                                </label>


                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Example: FuelGap Lekki Station"
                                    required
                                >

                            </div>



                            <!-- ORGANIZATION -->

                            <div
                                class="fg-form-group"
                                id="organizationField"
                            >

                                <label>
                                    Organization
                                </label>


                                <select
                                    name="organizationId"
                                    id="stationOrganization"
                                    required
                                >

                                    <option value="">
                                        Select organization
                                    </option>

                                </select>

                            </div>



                            <!-- STATUS -->

                            <div class="fg-form-group">

                                <label>
                                    Station Status
                                </label>


                                <select
                                    name="status"
                                >

                                    <option value="active">
                                        Active
                                    </option>

                                    <option value="inactive">
                                        Inactive
                                    </option>

                                </select>

                            </div>



                            <!-- LOCATION -->

                            <div class="fg-form-group">

                                <label>
                                    City / Area
                                </label>


                                <input
                                    type="text"
                                    name="location"
                                    placeholder="Example: Lekki, Lagos"
                                    required
                                >

                            </div>



                            <!-- PHONE -->

                            <div class="fg-form-group">

                                <label>
                                    Station Phone
                                </label>


                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="080XXXXXXXX"
                                >

                            </div>



                            <!-- ADDRESS -->

                            <div class="fg-form-group fg-full">

                                <label>
                                    Full Address
                                </label>


                                <textarea
                                    name="address"
                                    placeholder="Enter the complete station address"
                                    required
                                ></textarea>

                            </div>


                        </div>



                        <div
                            id="stationMessage"
                            class="fg-form-message hidden"
                        ></div>



                        <div class="fg-modal-footer">


                            <button
                                id="cancelStationModal"
                                class="fg-secondary-btn"
                                type="button"
                            >

                                Cancel

                            </button>



                            <button
                                type="submit"
                                class="fg-primary-btn"
                            >

                                ${stationIcon("plus")}

                                Create Station

                            </button>


                        </div>


                    </form>


                </div>


            </div>


        </div>

    `;

}


/* ==========================================
   SETUP EVENTS
========================================== */

function setupStationEvents() {

    setupStationModal();

    setupStationForm();

    setupStationSearch();

    setupStationStatusFilter();

}


/* ==========================================
   MODAL
========================================== */

function setupStationModal() {

    const modal =
        document.getElementById(
            "stationModal"
        );


    const openButton =
        document.getElementById(
            "openStationModal"
        );


    const emptyAddButton =
        document.getElementById(
            "emptyAddStation"
        );


    const closeButton =
        document.getElementById(
            "closeStationModal"
        );


    const cancelButton =
        document.getElementById(
            "cancelStationModal"
        );


    if (!modal) return;


    const openModal = () => {

        loadOrganizationsIntoSelect();

        modal.classList.remove("hidden");

        document.body.style.overflow = "hidden";

    };


    const closeModal = () => {

        modal.classList.add("hidden");

        document.body.style.overflow = "";

    };


    if (openButton) {

        openButton.addEventListener(
            "click",
            openModal
        );

    }


    if (emptyAddButton) {

        emptyAddButton.addEventListener(
            "click",
            openModal
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeModal
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeModal
        );

    }


    const overlay =
        modal.querySelector(
            ".fg-modal-overlay"
        );


    if (overlay) {

        overlay.addEventListener(
            "click",
            closeModal
        );

    }


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                !modal.classList.contains("hidden")
            ) {

                closeModal();

            }

        }
    );

}


/* ==========================================
   LOAD ORGANIZATIONS
========================================== */

function loadOrganizationsIntoSelect() {

    const currentUser =
        FuelGapUtils.getCurrentUser();


    const organizationSelect =
        document.getElementById(
            "stationOrganization"
        );


    const organizationField =
        document.getElementById(
            "organizationField"
        );


    if (!organizationSelect) return;


    const organizations =
        getOrganizations();


    if (
        currentUser.role === "owner"
    ) {

        const organizationId =
            getUserOrganizationId(
                currentUser
            );


        organizationSelect.innerHTML =
            `<option value="${organizationId}">
                Your Organization
            </option>`;


        organizationSelect.value =
            organizationId;


        if (organizationField) {

            organizationField.style.display =
                "none";

        }


        return;

    }


    if (organizationField) {

        organizationField.style.display =
            "block";

    }


    organizationSelect.innerHTML =
        `
            <option value="">
                Select organization
            </option>
        `;


    organizations.forEach(
        organization => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                organization.id;


            option.textContent =
                organization.name;


            organizationSelect.appendChild(
                option
            );

        }
    );

}


/* ==========================================
   CREATE STATION
========================================== */

function setupStationForm() {

    const form =
        document.getElementById(
            "stationForm"
        );


    if (!form) return;


    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const currentUser =
                FuelGapUtils.getCurrentUser();


            const name =
                form.elements["name"]
                    .value
                    .trim();


            const location =
                form.elements["location"]
                    .value
                    .trim();


            const address =
                form.elements["address"]
                    .value
                    .trim();


            const phone =
                form.elements["phone"]
                    .value
                    .trim();


            const status =
                form.elements["status"]
                    .value;


            let organizationId =
                form.elements["organizationId"]
                    .value;


            if (
                currentUser.role === "owner"
            ) {

                organizationId =
                    currentUser.organizationId;

            }


            const message =
                document.getElementById(
                    "stationMessage"
                );


            /* VALIDATION */

            if (
                !name ||
                !location ||
                !address ||
                !organizationId
            ) {

                showStationMessage(
                    message,
                    "Please complete all required fields.",
                    "error"
                );

                return;

            }


            const stations =
                getStations();


            /* DUPLICATE CHECK */

            const existingStation =
                stations.find(
                    station =>
                        station.organizationId ===
                        organizationId &&

                        station.name
                            .toLowerCase() ===
                        name.toLowerCase()
                );


            if (existingStation) {

                showStationMessage(
                    message,
                    "A station with this name already exists in this organization.",
                    "error"
                );

                return;

            }


            /* CREATE */

            const newStation = {

                id:
                    `STN-${Date.now()}`,

                name,

                organizationId,

                location,

                address,

                phone,

                status,

                createdAt:
                    new Date()
                        .toISOString()

            };


            stations.push(
                newStation
            );


            saveStations(
                stations
            );


            showStationMessage(
                message,
                "Fuel station created successfully.",
                "success"
            );


            form.reset();


            renderStations();


            setTimeout(
                () => {

                    const modal =
                        document.getElementById(
                            "stationModal"
                        );


                    if (modal) {

                        modal.classList.add(
                            "hidden"
                        );

                        document.body.style.overflow =
                            "";

                    }

                },
                800
            );

        }
    );

}


/* ==========================================
   GET VISIBLE STATIONS
========================================== */

function getVisibleStations() {

    const currentUser =
        FuelGapUtils.getCurrentUser();


    const stations =
        getStations();


    if (
        currentUser.role === "admin"
    ) {

        return stations;

    }


    return stations.filter(
        station =>
            station.organizationId ===
            currentUser.organizationId
    );

}


/* ==========================================
   RENDER STATIONS
========================================== */

function renderStations() {

    const stations =
        getVisibleStations();


    const organizations =
        getOrganizations();


    const tableBody =
        document.getElementById(
            "stationTableBody"
        );


    const emptyState =
        document.getElementById(
            "emptyStationState"
        );


    const searchInput =
        document.getElementById(
            "stationSearch"
        );


    const statusFilter =
        document.getElementById(
            "stationStatusFilter"
        );


    const visibleCount =
        document.getElementById(
            "visibleStationCount"
        );


    if (!tableBody) return;


    const search =
        searchInput
            ? searchInput.value
                .toLowerCase()
                .trim()
            : "";


    const status =
        statusFilter
            ? statusFilter.value
            : "";


    const filteredStations =
        stations.filter(
            station => {

                const stationName =
                    (station.name || "")
                        .toLowerCase();


                const stationLocation =
                    (station.location || "")
                        .toLowerCase();


                const matchesSearch =
                    stationName.includes(search) ||
                    stationLocation.includes(search);


                const matchesStatus =
                    !status ||
                    station.status === status;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    tableBody.innerHTML = "";


    if (visibleCount) {

        visibleCount.textContent =
            filteredStations.length;

    }


    if (
        filteredStations.length === 0
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


        filteredStations.forEach(
            station => {

                const organization =
                    organizations.find(
                        item =>
                            item.id ===
                            station.organizationId
                    );


                const organizationName =
                    organization
                        ? organization.name
                        : "Unknown Organization";


                const initials =
                    getStationInitials(
                        station.name
                    );


                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <!-- STATION -->

                    <td>

                        <div class="fg-station-cell">

                            <div class="fg-station-avatar">

                                ${initials}

                            </div>


                            <div>

                                <strong>

                                    ${escapeHtml(
                                        station.name
                                    )}

                                </strong>


                                <span>

                                    ID:
                                    ${station.id}

                                </span>

                            </div>

                        </div>

                    </td>



                    <!-- ORGANIZATION -->

                    <td>

                        <div class="fg-table-info">

                            <span class="fg-table-icon">

                                ${stationIcon("building")}

                            </span>


                            <span>

                                ${escapeHtml(
                                    organizationName
                                )}

                            </span>

                        </div>

                    </td>



                    <!-- LOCATION -->

                    <td>

                        <div class="fg-table-info">

                            <span class="fg-table-icon">

                                ${stationIcon("location")}

                            </span>


                            <span>

                                ${escapeHtml(
                                    station.location
                                )}

                            </span>

                        </div>

                    </td>



                    <!-- PHONE -->

                    <td>

                        <div class="fg-table-info">

                            <span class="fg-table-icon">

                                ${stationIcon("phone")}

                            </span>


                            <span>

                                ${escapeHtml(
                                    station.phone || "Not provided"
                                )}

                            </span>

                        </div>

                    </td>



                    <!-- STATUS -->

                    <td>

                        <span
                            class="
                                fg-status
                                ${station.status === "active"
                                    ? "fg-status-active"
                                    : "fg-status-inactive"}
                            "
                        >

                            <span></span>

                            ${capitalize(
                                station.status
                            )}

                        </span>

                    </td>



                    <!-- ACTIONS -->

                    <td class="fg-action-column">

                        <button
                            type="button"
                            class="fg-action-btn delete-station-btn"
                            data-id="${station.id}"
                            title="Remove station"
                        >

                            ${stationIcon("dots")}

                        </button>

                    </td>

                `;


                tableBody.appendChild(
                    row
                );

            }
        );

    }


    updateStationStats(
        stations
    );


    setupDeleteStationButtons();

}


/* ==========================================
   STATION INITIALS
========================================== */

function getStationInitials(name) {

    if (!name) return "FS";


    return name
        .split(" ")
        .slice(0, 2)
        .map(
            word =>
                word.charAt(0)
                    .toUpperCase()
        )
        .join("");

}


/* ==========================================
   UPDATE STATISTICS
========================================== */

function updateStationStats(
    stations
) {

    const total =
        stations.length;


    const active =
        stations.filter(
            station =>
                station.status ===
                "active"
        ).length;


    const inactive =
        stations.filter(
            station =>
                station.status ===
                "inactive"
        ).length;


    const operationalRate =
        total > 0
            ? Math.round(
                (active / total) * 100
            )
            : 0;


    const totalElement =
        document.getElementById(
            "totalStations"
        );


    const activeElement =
        document.getElementById(
            "activeStations"
        );


    const inactiveElement =
        document.getElementById(
            "inactiveStations"
        );


    const operationalRateElement =
        document.getElementById(
            "operationalRate"
        );


    if (totalElement) {

        totalElement.textContent =
            total;

    }


    if (activeElement) {

        activeElement.textContent =
            active;

    }


    if (inactiveElement) {

        inactiveElement.textContent =
            inactive;

    }


    if (operationalRateElement) {

        operationalRateElement.textContent =
            `${operationalRate}%`;

    }

}


/* ==========================================
   DELETE BUTTONS
========================================== */

function setupDeleteStationButtons() {

    const buttons =
        document.querySelectorAll(
            ".delete-station-btn"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    removeStation(
                        button.dataset.id
                    );

                }
            );

        }
    );

}


/* ==========================================
   REMOVE STATION
========================================== */

function removeStation(
    stationId
) {

    const confirmed =
        confirm(
            "Are you sure you want to remove this fuel station?"
        );


    if (!confirmed) return;


    let stations =
        getStations();


    stations =
        stations.filter(
            station =>
                station.id !==
                stationId
        );


    saveStations(
        stations
    );


    renderStations();

}


/* ==========================================
   SEARCH
========================================== */

function setupStationSearch() {

    const searchInput =
        document.getElementById(
            "stationSearch"
        );


    if (!searchInput) return;


    searchInput.addEventListener(
        "input",
        () => {

            renderStations();

        }
    );

}


/* ==========================================
   STATUS FILTER
========================================== */

function setupStationStatusFilter() {

    const filter =
        document.getElementById(
            "stationStatusFilter"
        );


    if (!filter) return;


    filter.addEventListener(
        "change",
        () => {

            renderStations();

        }
    );

}


/* ==========================================
   FORM MESSAGE
========================================== */

function showStationMessage(
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
        `fg-form-message ${type}`;

}


/* ==========================================
   CAPITALIZE
========================================== */

function capitalize(value) {

    if (!value) {

        return "";

    }


    return (
        value.charAt(0)
            .toUpperCase() +

        value.slice(1)
    );

}


/* ==========================================
   ESCAPE HTML
========================================== */

function escapeHtml(value) {

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


/* ==========================================
   PROFESSIONAL STATIONS STYLES
========================================== */

function injectStationsStyles() {

    if (
        document.getElementById(
            "fuelgapStationsProfessionalStyles"
        )
    ) {

        return;

    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "fuelgapStationsProfessionalStyles";


    style.textContent = `

        /* ================================
           ROOT PAGE
        ================================= */

        .fg-stations-page {
            width: 100%;
            padding: 8px 0 40px;
            color: #1d1d1f;
        }


        /* ================================
           PAGE HEADER
        ================================= */

        .fg-page-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 24px;
            margin-bottom: 28px;
        }


        .fg-header-content {
            display: flex;
            align-items: center;
            gap: 16px;
        }


        .fg-header-icon {
            width: 52px;
            height: 52px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 14px;
            background: #111827;
            color: #f5c518;
            box-shadow: 0 8px 20px rgba(17, 24, 39, 0.15);
        }


        .fg-header-icon svg {
            width: 25px;
            height: 25px;
        }


        .fg-breadcrumb {
            font-size: 12px;
            font-weight: 700;
            color: #8b8f98;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.7px;
        }


        .fg-breadcrumb span {
            margin: 0 7px;
            color: #c4c7cc;
        }


        .fg-page-header h1 {
            margin: 0;
            font-size: 28px;
            line-height: 1.2;
            font-weight: 750;
            letter-spacing: -0.7px;
            color: #111827;
        }


        .fg-page-header p {
            margin: 7px 0 0;
            font-size: 14px;
            color: #737782;
        }


        /* ================================
           BUTTONS
        ================================= */

        .fg-primary-btn {
            border: none;
            min-height: 44px;
            padding: 0 18px;
            border-radius: 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 9px;
            background: #f5c518;
            color: #111827;
            font-size: 14px;
            font-weight: 750;
            cursor: pointer;
            transition: 0.2s ease;
            box-shadow: 0 7px 18px rgba(245, 197, 24, 0.2);
        }


        .fg-primary-btn:hover {
            transform: translateY(-1px);
            background: #ffcf2e;
            box-shadow: 0 10px 22px rgba(245, 197, 24, 0.3);
        }


        .fg-primary-btn svg {
            width: 18px;
            height: 18px;
        }


        .fg-secondary-btn {
            min-height: 44px;
            padding: 0 18px;
            border-radius: 10px;
            border: 1px solid #e4e6ea;
            background: #ffffff;
            color: #4b5059;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
        }


        .fg-secondary-btn:hover {
            background: #f8f9fa;
        }


        /* ================================
           METRICS
        ================================= */

        .fg-station-metrics {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 18px;
            margin-bottom: 24px;
        }


        .fg-metric-card {
            background: #ffffff;
            border: 1px solid #eceef1;
            border-radius: 16px;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
            transition: 0.25s ease;
            box-shadow: 0 4px 16px rgba(15, 23, 42, 0.03);
        }


        .fg-metric-card:hover {
            transform: translateY(-3px);
            border-color: #e0e3e7;
            box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
        }


        .fg-metric-icon {
            width: 48px;
            height: 48px;
            flex-shrink: 0;
            border-radius: 13px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: 800;
        }


        .fg-metric-icon svg {
            width: 22px;
            height: 22px;
        }


        .fg-icon-dark {
            background: #111827;
            color: #ffffff;
        }


        .fg-icon-success {
            background: #eaf8ef;
            color: #169c4d;
        }


        .fg-icon-muted {
            background: #f2f3f5;
            color: #737782;
        }


        .fg-icon-yellow {
            background: #fff6cc;
            color: #b77900;
        }


        .fg-metric-content {
            min-width: 0;
        }


        .fg-metric-content span {
            display: block;
            font-size: 12px;
            color: #818692;
            margin-bottom: 5px;
            font-weight: 600;
        }


        .fg-metric-content strong {
            display: block;
            font-size: 25px;
            line-height: 1;
            color: #111827;
            letter-spacing: -0.7px;
        }


        .fg-metric-content small {
            display: block;
            margin-top: 7px;
            font-size: 11px;
            color: #a1a5ad;
        }


        /* ================================
           MAIN PANEL
        ================================= */

        .fg-station-panel {
            background: #ffffff;
            border: 1px solid #e9ebee;
            border-radius: 18px;
            overflow: hidden;
            box-shadow: 0 8px 30px rgba(15, 23, 42, 0.04);
        }


        .fg-panel-header {
            padding: 23px 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #eef0f2;
        }


        .fg-panel-header h2 {
            margin: 0;
            font-size: 18px;
            color: #17191d;
        }


        .fg-panel-header p {
            margin: 5px 0 0;
            font-size: 13px;
            color: #858993;
        }


        .fg-station-count {
            font-size: 13px;
            color: #777c86;
            font-weight: 600;
        }


        .fg-station-count span {
            display: inline-flex;
            min-width: 27px;
            height: 27px;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            background: #fff6cc;
            color: #8d6800;
            margin-right: 5px;
            font-weight: 800;
        }


        /* ================================
           TOOLBAR
        ================================= */

        .fg-toolbar {
            padding: 18px 24px;
            display: flex;
            gap: 12px;
            border-bottom: 1px solid #eef0f2;
            background: #fcfcfd;
        }


        .fg-search-box {
            flex: 1;
            min-height: 44px;
            border: 1px solid #e3e6ea;
            background: #ffffff;
            border-radius: 10px;
            display: flex;
            align-items: center;
            padding: 0 13px;
            gap: 10px;
        }


        .fg-search-box:focus-within {
            border-color: #f5c518;
            box-shadow: 0 0 0 4px rgba(245, 197, 24, 0.12);
        }


        .fg-search-box svg {
            width: 18px;
            color: #9ba0aa;
        }


        .fg-search-box input {
            width: 100%;
            border: none;
            outline: none;
            font-size: 13px;
            color: #252932;
            background: transparent;
        }


        .fg-filter-box {
            min-width: 155px;
            min-height: 44px;
            border: 1px solid #e3e6ea;
            background: #ffffff;
            border-radius: 10px;
            display: flex;
            align-items: center;
            gap: 9px;
            padding: 0 12px;
        }


        .fg-filter-box svg {
            width: 17px;
            color: #8d929c;
        }


        .fg-filter-box select {
            border: none;
            outline: none;
            width: 100%;
            background: transparent;
            color: #515660;
            font-size: 13px;
            cursor: pointer;
        }


        /* ================================
           TABLE
        ================================= */

        .fg-table-wrapper {
            width: 100%;
            overflow-x: auto;
        }


        .fg-station-table {
            width: 100%;
            border-collapse: collapse;
            min-width: 900px;
        }


        .fg-station-table thead {
            background: #fafbfc;
        }


        .fg-station-table th {
            padding: 14px 24px;
            text-align: left;
            font-size: 11px;
            font-weight: 750;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #8c919b;
            border-bottom: 1px solid #eceef1;
        }


        .fg-station-table td {
            padding: 17px 24px;
            border-bottom: 1px solid #f0f1f3;
            color: #525761;
            font-size: 13px;
            vertical-align: middle;
        }


        .fg-station-table tbody tr {
            transition: 0.18s ease;
        }


        .fg-station-table tbody tr:hover {
            background: #fffcf0;
        }


        .fg-station-table tbody tr:last-child td {
            border-bottom: none;
        }


        /* ================================
           STATION CELL
        ================================= */

        .fg-station-cell {
            display: flex;
            align-items: center;
            gap: 12px;
        }


        .fg-station-avatar {
            width: 40px;
            height: 40px;
            border-radius: 11px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            background: #111827;
            color: #f5c518;
            font-size: 12px;
            font-weight: 800;
        }


        .fg-station-cell strong {
            display: block;
            color: #1b1e24;
            font-size: 13px;
            margin-bottom: 4px;
        }


        .fg-station-cell span {
            font-size: 10px;
            color: #9ca1aa;
        }


        .fg-table-info {
            display: flex;
            align-items: center;
            gap: 8px;
            max-width: 220px;
        }


        .fg-table-info span:last-child {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }


        .fg-table-icon {
            display: flex;
            color: #a1a5ae;
        }


        .fg-table-icon svg {
            width: 16px;
            height: 16px;
        }


        /* ================================
           STATUS
        ================================= */

        .fg-status {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 6px 10px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 750;
        }


        .fg-status span {
            width: 6px;
            height: 6px;
            border-radius: 50%;
        }


        .fg-status-active {
            background: #eaf8ef;
            color: #15803d;
        }


        .fg-status-active span {
            background: #22c55e;
        }


        .fg-status-inactive {
            background: #f1f2f4;
            color: #777c86;
        }


        .fg-status-inactive span {
            background: #9ca3af;
        }


        /* ================================
           ACTIONS
        ================================= */

        .fg-action-column {
            text-align: right !important;
        }


        .fg-action-btn {
            width: 36px;
            height: 36px;
            border: 1px solid #e5e7eb;
            background: #ffffff;
            border-radius: 9px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #777c86;
            transition: 0.2s ease;
        }


        .fg-action-btn:hover {
            background: #fff4f4;
            border-color: #fecaca;
            color: #dc2626;
        }


        .fg-action-btn svg {
            width: 18px;
        }


        /* ================================
           EMPTY STATE
        ================================= */

        .fg-empty-state {
            text-align: center;
            padding: 65px 20px;
        }


        .fg-empty-icon {
            width: 72px;
            height: 72px;
            margin: 0 auto 18px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff6cc;
            color: #b77900;
        }


        .fg-empty-icon svg {
            width: 32px;
            height: 32px;
        }


        .fg-empty-state h3 {
            margin: 0;
            color: #1d2026;
            font-size: 18px;
        }


        .fg-empty-state p {
            max-width: 390px;
            margin: 9px auto 20px;
            font-size: 13px;
            line-height: 1.6;
            color: #858993;
        }


        /* ================================
           MODAL
        ================================= */

        .fg-modal {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }


        .fg-modal.hidden {
            display: none;
        }


        .fg-modal-overlay {
            position: absolute;
            inset: 0;
            background: rgba(17, 24, 39, 0.58);
            backdrop-filter: blur(4px);
        }


        .fg-modal-content {
            position: relative;
            width: 100%;
            max-width: 720px;
            max-height: calc(100vh - 40px);
            overflow-y: auto;
            background: #ffffff;
            border-radius: 20px;
            box-shadow: 0 30px 90px rgba(0, 0, 0, 0.25);
            animation: fgModalEnter 0.25s ease;
        }


        @keyframes fgModalEnter {

            from {
                opacity: 0;
                transform: translateY(15px) scale(0.98);
            }

            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }

        }


        .fg-modal-header {
            padding: 28px 30px 22px;
            display: flex;
            justify-content: space-between;
            gap: 20px;
            border-bottom: 1px solid #eef0f2;
        }


        .fg-modal-eyebrow {
            font-size: 10px;
            font-weight: 800;
            color: #b77900;
            letter-spacing: 1px;
            margin-bottom: 7px;
        }


        .fg-modal-header h2 {
            margin: 0;
            font-size: 22px;
            color: #17191d;
        }


        .fg-modal-header p {
            margin: 7px 0 0;
            font-size: 13px;
            color: #858993;
        }


        .fg-modal-close {
            width: 38px;
            height: 38px;
            border: none;
            background: #f5f6f7;
            border-radius: 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #5f6470;
        }


        .fg-modal-close:hover {
            background: #eceef1;
        }


        .fg-modal-close svg {
            width: 19px;
        }


        /* ================================
           FORM
        ================================= */

        #stationForm {
            padding: 26px 30px 0;
        }


        .fg-form-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 18px;
        }


        .fg-form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }


        .fg-form-group label {
            font-size: 12px;
            font-weight: 750;
            color: #363a42;
        }


        .fg-form-group input,
        .fg-form-group select,
        .fg-form-group textarea {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #e0e3e7;
            background: #ffffff;
            border-radius: 10px;
            outline: none;
            padding: 12px 13px;
            font-family: inherit;
            font-size: 13px;
            color: #242832;
            transition: 0.2s ease;
        }


        .fg-form-group input:focus,
        .fg-form-group select:focus,
        .fg-form-group textarea:focus {
            border-color: #f5c518;
            box-shadow: 0 0 0 4px rgba(245, 197, 24, 0.12);
        }


        .fg-form-group textarea {
            resize: vertical;
            min-height: 100px;
        }


        .fg-full {
            grid-column: 1 / -1;
        }


        .fg-form-message {
            margin-top: 18px;
            padding: 11px 13px;
            border-radius: 9px;
            font-size: 12px;
            font-weight: 600;
        }


        .fg-form-message.hidden {
            display: none;
        }


        .fg-form-message.success {
            display: block;
            background: #eaf8ef;
            color: #15803d;
        }


        .fg-form-message.error {
            display: block;
            background: #fff1f1;
            color: #dc2626;
        }


        .fg-modal-footer {
            margin: 26px -30px 0;
            padding: 18px 30px;
            border-top: 1px solid #eef0f2;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            background: #fcfcfd;
        }


        /* ================================
           UTILITY
        ================================= */

        .hidden {
            display: none !important;
        }


        /* ================================
           RESPONSIVE
        ================================= */

        @media (max-width: 1100px) {

            .fg-station-metrics {
                grid-template-columns: repeat(2, 1fr);
            }

        }


        @media (max-width: 700px) {

            .fg-page-header {
                flex-direction: column;
                align-items: stretch;
            }


            .fg-page-header > .fg-primary-btn {
                width: 100%;
            }


            .fg-station-metrics {
                grid-template-columns: 1fr;
            }


            .fg-panel-header {
                padding: 20px;
            }


            .fg-toolbar {
                flex-direction: column;
                padding: 15px;
            }


            .fg-filter-box {
                width: 100%;
                box-sizing: border-box;
            }


            .fg-header-icon {
                width: 45px;
                height: 45px;
            }


            .fg-page-header h1 {
                font-size: 23px;
            }


            .fg-modal {
                padding: 10px;
            }


            .fg-modal-content {
                border-radius: 16px;
            }


            .fg-modal-header {
                padding: 22px 20px;
            }


            #stationForm {
                padding: 20px 20px 0;
            }


            .fg-form-grid {
                grid-template-columns: 1fr;
            }


            .fg-full {
                grid-column: auto;
            }


            .fg-modal-footer {
                margin: 22px -20px 0;
                padding: 15px 20px;
                flex-direction: column-reverse;
            }


            .fg-modal-footer button {
                width: 100%;
            }

        }

    `;


    document.head.appendChild(
        style
    );

}