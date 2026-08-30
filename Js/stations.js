/* ==========================================
   FUELGAP - STATION MANAGEMENT
========================================== */

const STATIONS_STORAGE_KEY = "fuelgap_stations";
const ORGANIZATIONS_STORAGE_KEY = "fuelgap_organizations";


document.addEventListener("DOMContentLoaded", () => {

    const currentUser = FuelGapUtils.getCurrentUser();


    /* =========================
       AUTH CHECK
    ========================= */

    if (!currentUser) {

        window.location.href = "../login.html";
        return;

    }


    /*
       Only Admin and Owner can manage stations.
    */

    if (
        currentUser.role !== "admin" &&
        currentUser.role !== "owner"
    ) {

        window.location.href = "./dashboard.html";
        return;

    }


    /*
       Wait for app.js to create
       the #pageContent container.
    */

    setTimeout(() => {

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

    /*
       Owner belongs to one organization.
    */

    return currentUser.organizationId || "";

}


/* ==========================================
   RENDER STATIONS PAGE
========================================== */

function renderStationsPage() {

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
                    STATION MANAGEMENT
                </p>

                <h1>
                    Fuel Stations
                </h1>

                <p>
                    Add and manage fuel stations
                    connected to your organization.
                </p>

            </div>


            <button
                id="openStationModal"
                class="btn btn-primary"
                type="button"
            >
                + Add Station
            </button>

        </div>



        <!-- =========================
             STATION STATISTICS
        ========================== -->

        <section class="station-stats">


            <div class="station-stat-card">

                <span>
                    Total Stations
                </span>

                <strong id="totalStations">
                    0
                </strong>

            </div>


            <div class="station-stat-card">

                <span>
                    Active Stations
                </span>

                <strong id="activeStations">
                    0
                </strong>

            </div>


            <div class="station-stat-card">

                <span>
                    Inactive Stations
                </span>

                <strong id="inactiveStations">
                    0
                </strong>

            </div>


        </section>



        <!-- =========================
             STATION TABLE
        ========================== -->

        <section class="station-section">


            <div class="section-header">

                <div>

                    <h2>
                        Your Fuel Stations
                    </h2>

                    <p>
                        Manage stations and their
                        organization assignments.
                    </p>

                </div>


                <input
                    type="search"
                    id="stationSearch"
                    placeholder="Search stations..."
                >

            </div>



            <div class="table-wrapper">

                <table class="station-table">

                    <thead>

                        <tr>

                            <th>
                                Station Name
                            </th>

                            <th>
                                Organization
                            </th>

                            <th>
                                Location
                            </th>

                            <th>
                                Phone
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
                        id="stationTableBody"
                    >

                    </tbody>

                </table>

            </div>



            <div
                id="emptyStationState"
                class="empty-state hidden"
            >

                <h3>
                    No stations yet
                </h3>

                <p>
                    Create your first fuel station
                    to begin adding pumps and staff.
                </p>

            </div>


        </section>



        <!-- =========================
             ADD STATION MODAL
        ========================== -->

        <div
            id="stationModal"
            class="modal hidden"
        >

            <div
                class="modal-overlay"
            ></div>


            <div
                class="modal-content"
            >


                <button
                    id="closeStationModal"
                    class="modal-close"
                    type="button"
                >
                    ×
                </button>


                <div class="modal-header">

                    <h2>
                        Add Fuel Station
                    </h2>

                    <p>
                        Register a fuel station
                        in the FuelGap system.
                    </p>

                </div>



                <form
                    id="stationForm"
                >


                    <!-- =====================
                         STATION NAME
                    ====================== -->

                    <div class="form-group">

                        <label>
                            Station Name
                        </label>


                        <input
                            type="text"
                            name="name"
                            placeholder="Enter station name"
                            required
                        >

                    </div>



                    <!-- =====================
                         ORGANIZATION
                    ====================== -->

                    <div
                        class="form-group"
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



                    <!-- =====================
                         LOCATION
                    ====================== -->

                    <div class="form-group">

                        <label>
                            Station Location
                        </label>


                        <input
                            type="text"
                            name="location"
                            placeholder="Example: Lekki, Lagos"
                            required
                        >

                    </div>



                    <!-- =====================
                         ADDRESS
                    ====================== -->

                    <div class="form-group">

                        <label>
                            Full Address
                        </label>


                        <textarea
                            name="address"
                            placeholder="Enter full station address"
                            required
                        ></textarea>

                    </div>



                    <!-- =====================
                         PHONE
                    ====================== -->

                    <div class="form-group">

                        <label>
                            Station Phone
                        </label>


                        <input
                            type="tel"
                            name="phone"
                            placeholder="080XXXXXXXX"
                        >

                    </div>



                    <!-- =====================
                         STATUS
                    ====================== -->

                    <div class="form-group">

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



                    <!-- MESSAGE -->

                    <div
                        id="stationMessage"
                        class="form-message hidden"
                    ></div>



                    <button
                        type="submit"
                        class="btn btn-primary"
                    >
                        Create Station
                    </button>


                </form>


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

}


/* ==========================================
   STATION MODAL
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


    const closeButton =
        document.getElementById(
            "closeStationModal"
        );


    const overlay =
        modal
            ? modal.querySelector(
                ".modal-overlay"
            )
            : null;


    if (!modal) return;


    if (openButton) {

        openButton.addEventListener(
            "click",
            () => {

                loadOrganizationsIntoSelect();

                modal.classList.remove(
                    "hidden"
                );

            }
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            () => {

                modal.classList.add(
                    "hidden"
                );

            }
        );

    }


    if (overlay) {

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


    /*
       ADMIN:
       Can choose any organization.

       OWNER:
       Automatically assigned to
       their organization.
    */

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


    /*
       ADMIN
    */

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
                form.elements[
                    "name"
                ].value.trim();


            const location =
                form.elements[
                    "location"
                ].value.trim();


            const address =
                form.elements[
                    "address"
                ].value.trim();


            const phone =
                form.elements[
                    "phone"
                ].value.trim();


            const status =
                form.elements[
                    "status"
                ].value;


            let organizationId =
                form.elements[
                    "organizationId"
                ].value;


            /*
               Owner must always use
               their own organization.
            */

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


            /* =========================
               VALIDATION
            ========================= */

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


            /*
               Prevent duplicate station names
               inside the same organization.
            */

            const existingStation =
                stations.find(

                    station =>

                        station.organizationId ===
                        organizationId &&

                        station.name
                            .toLowerCase() ===
                        name.toLowerCase()

                );


            if (
                existingStation
            ) {

                showStationMessage(

                    message,

                    "A station with this name already exists in this organization.",

                    "error"

                );

                return;

            }


            /* =========================
               CREATE STATION
            ========================= */

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

                    }

                },

                1000
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


    /*
       ADMIN sees all stations.
    */

    if (
        currentUser.role === "admin"
    ) {

        return stations;

    }


    /*
       OWNER sees only stations
       belonging to their organization.
    */

    return stations.filter(

        station =>

            station.organizationId ===
            currentUser.organizationId

    );

}


/* ==========================================
   RENDER STATIONS
========================================== */

function renderStations(
    searchTerm = ""
) {

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


    if (!tableBody) return;


    const search =
        searchTerm
            .toLowerCase()
            .trim();


    const filteredStations =
        stations.filter(

            station => {

                const name =
                    (station.name || "")
                        .toLowerCase();


                const location =
                    (station.location || "")
                        .toLowerCase();


                return (

                    name.includes(search) ||

                    location.includes(search)

                );

            }

        );


    tableBody.innerHTML =
        "";


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
                        : "Unknown";


                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>
                        ${station.name}
                    </td>


                    <td>
                        ${organizationName}
                    </td>


                    <td>
                        ${station.location}
                    </td>


                    <td>
                        ${station.phone || "-"}
                    </td>


                    <td>

                        <span
                            class="
                                status-badge
                                ${station.status}
                            "
                        >

                            ${capitalize(
                                station.status
                            )}

                        </span>

                    </td>


                    <td>

                        <button
                            type="button"
                            class="
                                delete-station-btn
                            "
                            data-id="
                                ${station.id}
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


    updateStationStats(
        stations
    );


    setupDeleteStationButtons();

}


/* ==========================================
   STATION STATISTICS
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

}


/* ==========================================
   DELETE STATION BUTTONS
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
   STATION SEARCH
========================================== */

function setupStationSearch() {

    const searchInput =
        document.getElementById(
            "stationSearch"
        );


    if (!searchInput) return;


    searchInput.addEventListener(
        "input",
        event => {

            renderStations(
                event.target.value
            );

        }
    );

}


/* ==========================================
   SHOW MESSAGE
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
        `form-message ${type}`;

}


/* ==========================================
   CAPITALIZE
========================================== */

function capitalize(value) {

    if (!value) {

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