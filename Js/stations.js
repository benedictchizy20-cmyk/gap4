/* =========================================================
   FUELGAP - PROFESSIONAL STATIONS MANAGEMENT
   BACKEND CONNECTED VERSION
   NO LOCALSTORAGE
   COOKIE BASED AUTHENTICATION
========================================================= */

let StationsState = {
    stations: [],
    filteredStations: [],
    currentUser: null,
    search: "",
    status: "all",
    isLoading: false,
    isSubmitting: false
};


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    try {

        if (typeof FuelGapAPI === "undefined") {

            console.error(
                "FuelGapAPI is not loaded."
            );

            showPageError(
                "FuelGap API is not available. Check that api.js is loaded."
            );

            return;

        }


        /*
         * IMPORTANT:
         * Authentication is now handled by the backend
         * using the HttpOnly cookie.
         *
         * DO NOT use:
         *
         * FuelGapUtils.getCurrentUser()
         *
         * as a synchronous function.
         */

        const authResponse =
            await FuelGapAPI.getCurrentUser();


        if (
            !authResponse ||
            !authResponse.success ||
            !authResponse.data ||
            !authResponse.data.user
        ) {

            console.error(
                "Invalid authentication response:",
                authResponse
            );

            window.location.href =
                "../login.html";

            return;

        }


        const user =
            authResponse.data.user;


        console.log(
            "STATIONS AUTHENTICATED USER:",
            user
        );


        StationsState.currentUser =
            normalizeUser(user);


        const allowedRoles = [
            "owner",
            "admin",
            "manager"
        ];


        if (
            !allowedRoles.includes(
                StationsState.currentUser.role
            )
        ) {

            showPageError(
                "You do not have permission to manage stations."
            );

            return;

        }


        await waitForPageContent();


        injectStationsStyles();


        renderStationsPage();


        setupStationEvents();


        await loadStations();


    } catch (error) {

        console.error(
            "Stations page initialization error:",
            error
        );


        showPageError(
            error.message ||
            "Unable to load the stations page."
        );

    }

});


/* =========================================================
   NORMALIZE USER
========================================================= */

function normalizeUser(user) {

    return {

        id:
            user.id ||
            user.user_id ||
            user.userId ||
            null,

        role:
            String(
                user.role ||
                user.user_role ||
                ""
            ).toLowerCase(),

        fullName:
            user.fullName ||
            user.full_name ||
            user.name ||
            "User",

        organizationId:
            user.organizationId ||
            user.organization_id ||
            null,

        email:
            user.email ||
            ""

    };

}


/* =========================================================
   WAIT FOR APP SHELL
========================================================= */

function waitForPageContent() {

    return new Promise(
        (resolve, reject) => {

            const existing =
                document.getElementById(
                    "pageContent"
                );


            if (existing) {

                resolve(existing);

                return;

            }


            let attempts = 0;


            const interval =
                setInterval(
                    () => {

                        const pageContent =
                            document.getElementById(
                                "pageContent"
                            );


                        if (pageContent) {

                            clearInterval(
                                interval
                            );

                            resolve(
                                pageContent
                            );

                            return;

                        }


                        attempts++;


                        if (attempts >= 100) {

                            clearInterval(
                                interval
                            );

                            reject(
                                new Error(
                                    "Application shell failed to load."
                                )
                            );

                        }

                    },
                    50
                );

        }
    );

}


/* =========================================================
   PAGE HTML
========================================================= */

function renderStationsPage() {

    const pageContent =
        document.getElementById(
            "pageContent"
        );


    if (!pageContent) {

        console.error(
            "#pageContent was not found."
        );

        return;

    }


    pageContent.innerHTML = `

        <section class="stations-page">

            <div class="stations-header">

                <div class="stations-header-left">

                    <div class="stations-breadcrumb">

                        <span>
                            Operations
                        </span>

                        <span class="breadcrumb-separator">
                            /
                        </span>

                        <strong>
                            Stations
                        </strong>

                    </div>


                    <h1>
                        Fuel Stations
                    </h1>


                    <p>
                        Manage your fuel stations,
                        locations and operational status.
                    </p>

                </div>


                <div class="stations-header-actions">

                    <button
                        type="button"
                        id="refreshStationsButton"
                        class="fg-secondary-btn"
                    >

                        <span class="button-icon">
                            ↻
                        </span>

                        <span>
                            Refresh
                        </span>

                    </button>


                    <button
                        type="button"
                        id="openStationModal"
                        class="fg-primary-btn"
                    >

                        <span class="button-icon">
                            +
                        </span>

                        <span>
                            Create Station
                        </span>

                    </button>

                </div>

            </div>


            <div
                id="stationAlert"
                class="station-alert hidden"
            ></div>


            <div class="station-stats-grid">

                <div class="station-stat-card">

                    <div class="station-stat-icon">
                        ⛽
                    </div>

                    <div class="station-stat-content">

                        <span class="station-stat-label">
                            Total Stations
                        </span>

                        <strong
                            id="totalStationsCount"
                            class="station-stat-value"
                        >
                            0
                        </strong>

                    </div>

                </div>


                <div class="station-stat-card">

                    <div class="station-stat-icon active">
                        ✓
                    </div>

                    <div class="station-stat-content">

                        <span class="station-stat-label">
                            Active
                        </span>

                        <strong
                            id="activeStationsCount"
                            class="station-stat-value"
                        >
                            0
                        </strong>

                    </div>

                </div>


                <div class="station-stat-card">

                    <div class="station-stat-icon inactive">
                        ○
                    </div>

                    <div class="station-stat-content">

                        <span class="station-stat-label">
                            Inactive
                        </span>

                        <strong
                            id="inactiveStationsCount"
                            class="station-stat-value"
                        >
                            0
                        </strong>

                    </div>

                </div>


                <div class="station-stat-card">

                    <div class="station-stat-icon">
                        ◉
                    </div>

                    <div class="station-stat-content">

                        <span class="station-stat-label">
                            Visible
                        </span>

                        <strong
                            id="visibleStationsCount"
                            class="station-stat-value"
                        >
                            0
                        </strong>

                    </div>

                </div>

            </div>


            <div class="stations-filter-card">

                <div class="station-search-wrapper">

                    <span class="station-search-icon">
                        ⌕
                    </span>

                    <input
                        type="search"
                        id="stationSearch"
                        class="station-search-input"
                        placeholder="Search station name, city or address..."
                        autocomplete="off"
                    >

                </div>


                <div class="station-filter-wrapper">

                    <label
                        for="stationStatusFilter"
                        class="station-filter-label"
                    >
                        Status
                    </label>

                    <select
                        id="stationStatusFilter"
                        class="station-filter-select"
                    >

                        <option value="all">
                            All Stations
                        </option>

                        <option value="active">
                            Active
                        </option>

                        <option value="inactive">
                            Inactive
                        </option>

                    </select>

                </div>


                <button
                    type="button"
                    id="clearStationFilters"
                    class="fg-clear-btn"
                >
                    Clear
                </button>

            </div>


            <div class="stations-directory-card">

                <div class="stations-directory-header">

                    <div>

                        <h2>
                            Station Directory
                        </h2>

                        <p>
                            Your registered fuel stations
                        </p>

                    </div>


                    <div
                        id="stationResultCount"
                        class="station-result-count"
                    >
                        0 stations
                    </div>

                </div>


                <div
                    id="stationsTableContainer"
                    class="stations-table-container"
                >

                    <div class="stations-loading">

                        <div class="station-spinner"></div>

                        <span>
                            Loading stations...
                        </span>

                    </div>

                </div>

            </div>

        </section>


        <div
            id="stationModal"
            class="fg-modal hidden"
            aria-hidden="true"
        >

            <div
                class="fg-modal-overlay"
                data-close-station-modal
            ></div>


            <div
                class="fg-modal-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="stationModalTitle"
            >

                <div class="fg-modal-header">

                    <div>

                        <span class="fg-modal-eyebrow">
                            FUELGAP
                        </span>

                        <h2 id="stationModalTitle">
                            Create Station
                        </h2>

                        <p id="stationModalDescription">
                            Add a fuel station to your organization.
                        </p>

                    </div>


                    <button
                        type="button"
                        class="fg-modal-close"
                        id="closeStationModal"
                        aria-label="Close"
                    >
                        ×
                    </button>

                </div>


                <form
                    id="stationForm"
                    class="station-form"
                >

                    <input
                        type="hidden"
                        id="stationId"
                    >


                    <div class="station-form-group">

                        <label for="stationName">
                            Station Name
                            <span>*</span>
                        </label>

                        <input
                            type="text"
                            id="stationName"
                            name="name"
                            placeholder="e.g. FuelGap Airport Station"
                            maxlength="120"
                            required
                        >

                    </div>


                    <div class="station-form-group">

                        <label for="stationAddress">
                            Address
                        </label>

                        <input
                            type="text"
                            id="stationAddress"
                            name="address"
                            placeholder="e.g. Airport Road"
                            maxlength="255"
                        >

                    </div>


                    <div class="station-form-row">

                        <div class="station-form-group">

                            <label for="stationCity">
                                City
                            </label>

                            <input
                                type="text"
                                id="stationCity"
                                name="city"
                                placeholder="e.g. Port Harcourt"
                                maxlength="100"
                            >

                        </div>


                        <div class="station-form-group">

                            <label for="stationState">
                                State
                            </label>

                            <input
                                type="text"
                                id="stationState"
                                name="state"
                                placeholder="e.g. Rivers"
                                maxlength="100"
                            >

                        </div>

                    </div>


                    <div class="station-form-group">

                        <label for="stationStatus">
                            Status
                        </label>

                        <select
                            id="stationStatus"
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


                    <div
                        id="stationFormError"
                        class="station-form-error hidden"
                    ></div>


                    <div class="fg-modal-footer">

                        <button
                            type="button"
                            id="cancelStationButton"
                            class="fg-secondary-btn"
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            id="saveStationButton"
                            class="fg-primary-btn"
                        >

                            <span>
                                Create Station
                            </span>

                        </button>

                    </div>

                </form>

            </div>

        </div>

    `;

}


/* =========================================================
   EVENTS
========================================================= */

function setupStationEvents() {

    const openButton =
        document.getElementById(
            "openStationModal"
        );


    const closeButton =
        document.getElementById(
            "closeStationModal"
        );


    const cancelButton =
        document.getElementById(
            "cancelStationButton"
        );


    const modal =
        document.getElementById(
            "stationModal"
        );


    const form =
        document.getElementById(
            "stationForm"
        );


    const refreshButton =
        document.getElementById(
            "refreshStationsButton"
        );


    const searchInput =
        document.getElementById(
            "stationSearch"
        );


    const statusFilter =
        document.getElementById(
            "stationStatusFilter"
        );


    const clearButton =
        document.getElementById(
            "clearStationFilters"
        );


    if (openButton) {

        openButton.addEventListener(
            "click",
            () => {

                openStationModal();

            }
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeStationModal
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeStationModal
        );

    }


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target.matches(
                        "[data-close-station-modal]"
                    )
                ) {

                    closeStationModal();

                }

            }
        );

    }


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                modal &&
                !modal.classList.contains(
                    "hidden"
                )
            ) {

                closeStationModal();

            }

        }
    );


    if (form) {

        form.addEventListener(
            "submit",
            handleStationSubmit
        );

    }


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            async () => {

                await loadStations();

            }
        );

    }


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            event => {

                StationsState.search =
                    event.target.value.trim();

                applyStationFilters();

            }
        );

    }


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            event => {

                StationsState.status =
                    event.target.value;

                applyStationFilters();

            }
        );

    }


    if (clearButton) {

        clearButton.addEventListener(
            "click",
            () => {

                if (searchInput) {

                    searchInput.value =
                        "";

                }


                if (statusFilter) {

                    statusFilter.value =
                        "all";

                }


                StationsState.search =
                    "";

                StationsState.status =
                    "all";


                applyStationFilters();

            }
        );

    }

}


/* =========================================================
   OPEN MODAL
========================================================= */

function openStationModal(
    station = null
) {

    const modal =
        document.getElementById(
            "stationModal"
        );


    if (!modal) {

        console.error(
            "Station modal not found."
        );

        return;

    }


    resetStationForm();


    if (station) {

        document.getElementById(
            "stationModalTitle"
        ).textContent =
            "Edit Station";


        document.getElementById(
            "stationModalDescription"
        ).textContent =
            "Update your fuel station information.";


        document.getElementById(
            "saveStationButton"
        ).innerHTML =
            "<span>Save Changes</span>";


        document.getElementById(
            "stationId"
        ).value =
            station.id || "";


        document.getElementById(
            "stationName"
        ).value =
            station.name || "";


        document.getElementById(
            "stationAddress"
        ).value =
            station.address || "";


        document.getElementById(
            "stationCity"
        ).value =
            station.city || "";


        document.getElementById(
            "stationState"
        ).value =
            station.state || "";


        document.getElementById(
            "stationStatus"
        ).value =
            station.is_active === false
                ? "inactive"
                : "active";

    }


    modal.classList.remove(
        "hidden"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.style.overflow =
        "hidden";


    setTimeout(
        () => {

            const nameInput =
                document.getElementById(
                    "stationName"
                );


            if (nameInput) {

                nameInput.focus();

            }

        },
        100
    );

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeStationModal() {

    const modal =
        document.getElementById(
            "stationModal"
        );


    if (!modal) return;


    modal.classList.add(
        "hidden"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.style.overflow =
        "";


    resetStationForm();

}


/* =========================================================
   RESET FORM
========================================================= */

function resetStationForm() {

    const form =
        document.getElementById(
            "stationForm"
        );


    if (form) {

        form.reset();

    }


    const stationId =
        document.getElementById(
            "stationId"
        );


    if (stationId) {

        stationId.value =
            "";

    }


    const status =
        document.getElementById(
            "stationStatus"
        );


    if (status) {

        status.value =
            "active";

    }


    const title =
        document.getElementById(
            "stationModalTitle"
        );


    if (title) {

        title.textContent =
            "Create Station";

    }


    const description =
        document.getElementById(
            "stationModalDescription"
        );


    if (description) {

        description.textContent =
            "Add a fuel station to your organization.";

    }


    const saveButton =
        document.getElementById(
            "saveStationButton"
        );


    if (saveButton) {

        saveButton.disabled =
            false;

        saveButton.innerHTML =
            "<span>Create Station</span>";

    }


    hideFormError();

}


/* =========================================================
   LOAD STATIONS
========================================================= */

async function loadStations() {

    if (
        StationsState.isLoading
    ) {

        return;

    }


    StationsState.isLoading =
        true;


    setRefreshLoading(
        true
    );


    renderLoadingState();


    try {

        const response =
            await FuelGapAPI.getStations();


        console.log(
            "Stations API response:",
            response
        );


        const stations =
            extractResponseArray(
                response,
                "stations"
            );


        StationsState.stations =
            stations.map(
                normalizeStation
            );


        applyStationFilters();


        hideAlert();


    } catch (error) {

        console.error(
            "Failed to load stations:",
            error
        );


        StationsState.stations =
            [];

        StationsState.filteredStations =
            [];


        renderStationsTable();


        showAlert(
            error.message ||
            "Unable to load stations.",
            "error"
        );


    } finally {

        StationsState.isLoading =
            false;


        setRefreshLoading(
            false
        );

    }

}


/* =========================================================
   NORMALIZE STATION
========================================================= */

function normalizeStation(
    station
) {

    return {

        id:
            station.id ||
            station.station_id ||
            null,

        organizationId:
            station.organizationId ||
            station.organization_id ||
            null,

        name:
            station.name ||
            "Unnamed Station",

        address:
            station.address ||
            "",

        city:
            station.city ||
            "",

        state:
            station.state ||
            "",

        is_active:
            station.is_active !== false,

        created_at:
            station.created_at ||
            station.createdAt ||
            null,

        updated_at:
            station.updated_at ||
            station.updatedAt ||
            null

    };

}


/* =========================================================
   RESPONSE ARRAY HELPER
========================================================= */

function extractResponseArray(
    response,
    preferredKey
) {

    if (
        Array.isArray(response)
    ) {

        return response;

    }


    if (
        response &&
        Array.isArray(
            response[preferredKey]
        )
    ) {

        return response[
            preferredKey
        ];

    }


    if (
        response &&
        response.data &&
        Array.isArray(
            response.data[
                preferredKey
            ]
        )
    ) {

        return response.data[
            preferredKey
        ];

    }


    if (
        response &&
        response.data &&
        Array.isArray(
            response.data
        )
    ) {

        return response.data;

    }


    return [];

}


/* =========================================================
   APPLY FILTERS
========================================================= */

function applyStationFilters() {

    const search =
        StationsState.search
            .toLowerCase()
            .trim();


    const status =
        StationsState.status;


    StationsState.filteredStations =
        StationsState.stations.filter(
            station => {

                const searchableText = [

                    station.name,

                    station.address,

                    station.city,

                    station.state

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                const matchesSearch =
                    !search ||
                    searchableText.includes(
                        search
                    );


                const stationStatus =
                    station.is_active
                        ? "active"
                        : "inactive";


                const matchesStatus =
                    status === "all" ||
                    status === stationStatus;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    updateStationStats();


    renderStationsTable();

}


/* =========================================================
   UPDATE STATS
========================================================= */

function updateStationStats() {

    const stations =
        StationsState.stations;


    const total =
        stations.length;


    const active =
        stations.filter(
            station =>
                station.is_active
        ).length;


    const inactive =
        total - active;


    const visible =
        StationsState
            .filteredStations
            .length;


    setText(
        "totalStationsCount",
        total
    );


    setText(
        "activeStationsCount",
        active
    );


    setText(
        "inactiveStationsCount",
        inactive
    );


    setText(
        "visibleStationsCount",
        visible
    );


    setText(
        "stationResultCount",
        `${visible} ${
            visible === 1
                ? "station"
                : "stations"
        }`
    );

}


/* =========================================================
   RENDER TABLE
========================================================= */

function renderStationsTable() {

    const container =
        document.getElementById(
            "stationsTableContainer"
        );


    if (!container) return;


    const stations =
        StationsState.filteredStations;


    if (
        StationsState.isLoading &&
        StationsState.stations.length === 0
    ) {

        renderLoadingState();

        return;

    }


    if (!stations.length) {

        container.innerHTML = `

            <div class="stations-empty-state">

                <div class="stations-empty-icon">
                    ⛽
                </div>


                <h3>

                    ${
                        StationsState
                            .stations
                            .length
                            ? "No stations found"
                            : "No stations yet"
                    }

                </h3>


                <p>

                    ${
                        StationsState
                            .stations
                            .length
                            ? "Try changing your search or filters."
                            : "Create your first fuel station to get started."
                    }

                </p>


                ${
                    StationsState
                        .stations
                        .length

                        ? `

                            <button
                                type="button"
                                class="fg-secondary-btn"
                                id="emptyClearFilters"
                            >
                                Clear Filters
                            </button>

                        `

                        : `

                            <button
                                type="button"
                                class="fg-primary-btn"
                                id="emptyCreateStation"
                            >

                                <span>
                                    +
                                </span>

                                Create Station

                            </button>

                        `
                }

            </div>

        `;


        const emptyCreate =
            document.getElementById(
                "emptyCreateStation"
            );


        if (emptyCreate) {

            emptyCreate.addEventListener(
                "click",
                openStationModal
            );

        }


        const emptyClear =
            document.getElementById(
                "emptyClearFilters"
            );


        if (emptyClear) {

            emptyClear.addEventListener(
                "click",
                () => {

                    const searchInput =
                        document.getElementById(
                            "stationSearch"
                        );


                    const statusFilter =
                        document.getElementById(
                            "stationStatusFilter"
                        );


                    if (searchInput) {

                        searchInput.value =
                            "";

                    }


                    if (statusFilter) {

                        statusFilter.value =
                            "all";

                    }


                    StationsState.search =
                        "";

                    StationsState.status =
                        "all";


                    applyStationFilters();

                }
            );

        }


        return;

    }


    container.innerHTML = `

        <div class="stations-table-scroll">

            <table class="stations-table">

                <thead>

                    <tr>

                        <th>
                            Station
                        </th>

                        <th>
                            Location
                        </th>

                        <th>
                            Status
                        </th>

                        <th>
                            Created
                        </th>

                        <th>
                            Actions
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${
                        stations
                            .map(
                                station =>
                                    renderStationRow(
                                        station
                                    )
                            )
                            .join("")
                    }

                </tbody>

            </table>

        </div>

    `;


    setupStationRowEvents();

}


/* =========================================================
   RENDER ROW
========================================================= */

function renderStationRow(
    station
) {

    const location =
        [
            station.city,
            station.state
        ]
            .filter(Boolean)
            .join(", ");


    const status =
        station.is_active
            ? "active"
            : "inactive";


    const statusLabel =
        station.is_active
            ? "Active"
            : "Inactive";


    return `

        <tr
            data-station-id="${escapeHtml(
                station.id
            )}"
        >

            <td>

                <div class="station-name-cell">

                    <div class="station-table-icon">
                        ⛽
                    </div>


                    <div>

                        <strong>
                            ${escapeHtml(
                                station.name
                            )}
                        </strong>


                        <span>

                            ${
                                station.id
                                    ? formatStationId(
                                        station.id
                                    )
                                    : "Station"
                            }

                        </span>

                    </div>

                </div>

            </td>


            <td>

                <div class="station-location-cell">

                    <strong>

                        ${escapeHtml(
                            location ||
                            "Location not provided"
                        )}

                    </strong>


                    <span>

                        ${escapeHtml(
                            station.address ||
                            "No address"
                        )}

                    </span>

                </div>

            </td>


            <td>

                <span
                    class="station-status-badge ${status}"
                >

                    <span class="status-dot"></span>

                    ${statusLabel}

                </span>

            </td>


            <td>

                <span class="station-created-date">

                    ${formatDate(
                        station.created_at
                    )}

                </span>

            </td>


            <td>

                <div class="station-actions">

                    <button
                        type="button"
                        class="station-action-btn edit"
                        data-action="edit"
                        data-id="${escapeHtml(
                            station.id
                        )}"
                        title="Edit station"
                    >
                        Edit
                    </button>


                    <button
                        type="button"
                        class="station-action-btn delete"
                        data-action="delete"
                        data-id="${escapeHtml(
                            station.id
                        )}"
                        title="Delete station"
                    >
                        Delete
                    </button>

                </div>

            </td>

        </tr>

    `;

}


/* =========================================================
   ROW EVENTS
========================================================= */

function setupStationRowEvents() {

    const buttons =
        document.querySelectorAll(
            ".station-action-btn"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                async event => {

                    const action =
                        event.currentTarget
                            .dataset
                            .action;


                    const id =
                        event.currentTarget
                            .dataset
                            .id;


                    if (!id) {

                        return;

                    }


                    const station =
                        StationsState
                            .stations
                            .find(
                                item =>
                                    String(
                                        item.id
                                    ) ===
                                    String(
                                        id
                                    )
                            );


                    if (!station) {

                        return;

                    }


                    if (
                        action ===
                        "edit"
                    ) {

                        openStationModal(
                            station
                        );

                    }


                    if (
                        action ===
                        "delete"
                    ) {

                        await deleteStation(
                            station
                        );

                    }

                }
            );

        }
    );

}


/* =========================================================
   CREATE / UPDATE STATION
========================================================= */

async function handleStationSubmit(
    event
) {

    event.preventDefault();


    if (
        StationsState.isSubmitting
    ) {

        return;

    }


    const stationId =
        document.getElementById(
            "stationId"
        )?.value.trim();


    const name =
        document.getElementById(
            "stationName"
        )?.value.trim();


    const address =
        document.getElementById(
            "stationAddress"
        )?.value.trim();


    const city =
        document.getElementById(
            "stationCity"
        )?.value.trim();


    const state =
        document.getElementById(
            "stationState"
        )?.value.trim();


    const status =
        document.getElementById(
            "stationStatus"
        )?.value ||
        "active";


    if (!name) {

        showFormError(
            "Station name is required."
        );


        document.getElementById(
            "stationName"
        )?.focus();


        return;

    }


    if (
        name.length < 2
    ) {

        showFormError(
            "Station name must be at least 2 characters."
        );

        return;

    }


    hideFormError();


    const payload = {

        name,

        address:
            address ||
            null,

        city:
            city ||
            null,

        state:
            state ||
            null,

        is_active:
            status === "active"

    };


    StationsState.isSubmitting =
        true;


    setSubmitLoading(
        true
    );


    try {

        let response;


        if (stationId) {

            response =
                await FuelGapAPI.updateStation(
                    stationId,
                    payload
                );


            console.log(
                "Station update response:",
                response
            );


            showAlert(
                "Station updated successfully.",
                "success"
            );

        } else {

            response =
                await FuelGapAPI.createStation(
                    payload
                );


            console.log(
                "Station create response:",
                response
            );


            showAlert(
                "Station created successfully.",
                "success"
            );

        }


        closeStationModal();


        await loadStations();


    } catch (error) {

        console.error(
            "Station save error:",
            error
        );


        showFormError(
            error.message ||
            "Unable to save station."
        );


    } finally {

        StationsState.isSubmitting =
            false;


        setSubmitLoading(
            false
        );

    }

}


/* =========================================================
   DELETE STATION
========================================================= */

async function deleteStation(
    station
) {

    if (
        !station ||
        !station.id
    ) {

        return;

    }


    const confirmed =
        window.confirm(
            `Are you sure you want to delete "${station.name}"?\n\nThis action cannot be undone.`
        );


    if (!confirmed) {

        return;

    }


    try {

        await FuelGapAPI.deleteStation(
            station.id
        );


        showAlert(
            "Station deleted successfully.",
            "success"
        );


        await loadStations();


    } catch (error) {

        console.error(
            "Delete station error:",
            error
        );


        showAlert(
            error.message ||
            "Unable to delete station.",
            "error"
        );

    }

}


/* =========================================================
   LOADING STATE
========================================================= */

function renderLoadingState() {

    const container =
        document.getElementById(
            "stationsTableContainer"
        );


    if (!container) return;


    container.innerHTML = `

        <div class="stations-loading">

            <div class="station-spinner"></div>

            <span>
                Loading stations...
            </span>

        </div>

    `;

}


/* =========================================================
   SUBMIT BUTTON LOADING
========================================================= */

function setSubmitLoading(
    isLoading
) {

    const button =
        document.getElementById(
            "saveStationButton"
        );


    if (!button) return;


    button.disabled =
        isLoading;


    if (isLoading) {

        button.innerHTML = `

            <span class="button-spinner"></span>

            <span>
                Saving...
            </span>

        `;

    } else {

        const stationId =
            document.getElementById(
                "stationId"
            )?.value.trim();


        button.innerHTML =
            stationId
                ? "<span>Save Changes</span>"
                : "<span>Create Station</span>";

    }

}


/* =========================================================
   REFRESH BUTTON LOADING
========================================================= */

function setRefreshLoading(
    isLoading
) {

    const button =
        document.getElementById(
            "refreshStationsButton"
        );


    if (!button) return;


    button.disabled =
        isLoading;


    if (isLoading) {

        button.innerHTML = `

            <span class="button-spinner"></span>

            <span>
                Loading...
            </span>

        `;

    } else {

        button.innerHTML = `

            <span class="button-icon">
                ↻
            </span>

            <span>
                Refresh
            </span>

        `;

    }

}


/* =========================================================
   ALERT
========================================================= */

function showAlert(
    message,
    type = "success"
) {

    const alert =
        document.getElementById(
            "stationAlert"
        );


    if (!alert) return;


    alert.className =
        `station-alert ${type}`;


    alert.innerHTML = `

        <span class="station-alert-icon">

            ${
                type === "success"
                    ? "✓"
                    : "!"
            }

        </span>


        <span>
            ${escapeHtml(message)}
        </span>


        <button
            type="button"
            class="station-alert-close"
            id="closeStationAlert"
        >
            ×
        </button>

    `;


    const close =
        document.getElementById(
            "closeStationAlert"
        );


    if (close) {

        close.addEventListener(
            "click",
            hideAlert
        );

    }


    setTimeout(
        hideAlert,
        6000
    );

}


/* =========================================================
   HIDE ALERT
========================================================= */

function hideAlert() {

    const alert =
        document.getElementById(
            "stationAlert"
        );


    if (!alert) return;


    alert.classList.add(
        "hidden"
    );

}


/* =========================================================
   FORM ERROR
========================================================= */

function showFormError(
    message
) {

    const error =
        document.getElementById(
            "stationFormError"
        );


    if (!error) return;


    error.textContent =
        message;


    error.classList.remove(
        "hidden"
    );

}


/* =========================================================
   HIDE FORM ERROR
========================================================= */

function hideFormError() {

    const error =
        document.getElementById(
            "stationFormError"
        );


    if (!error) return;


    error.textContent =
        "";


    error.classList.add(
        "hidden"
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


    if (!pageContent) {

        console.error(
            message
        );

        return;

    }


    pageContent.innerHTML = `

        <section class="stations-page">

            <div class="stations-error-state">

                <div class="stations-error-icon">
                    !
                </div>


                <h2>
                    Unable to load Stations
                </h2>


                <p>
                    ${escapeHtml(message)}
                </p>


                <button
                    type="button"
                    class="fg-primary-btn"
                    onclick="window.location.reload()"
                >
                    Reload Page
                </button>

            </div>

        </section>

    `;

}


/* =========================================================
   TEXT HELPER
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
            value;

    }

}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(
    dateValue
) {

    if (!dateValue) {

        return "—";

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
   STATION ID FORMAT
========================================================= */

function formatStationId(
    id
) {

    if (!id) {

        return "Station";

    }


    const stringId =
        String(id);


    if (
        stringId.length > 12 &&
        stringId.includes("-")
    ) {

        return `STN-${stringId
            .replaceAll("-", "")
            .substring(0, 8)
            .toUpperCase()}`;

    }


    return stringId.length > 16
        ? stringId.substring(
            0,
            16
        )
        : stringId;

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
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


/* =========================================================
   PROFESSIONAL STYLES
========================================================= */

function injectStationsStyles() {

    if (
        document.getElementById(
            "fuelgapStationsRuntimeStyles"
        )
    ) {

        return;

    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "fuelgapStationsRuntimeStyles";


    style.textContent = `

        .stations-page {
            width: 100%;
            max-width: 1500px;
            margin: 0 auto;
            padding: 10px 0 50px;
        }


        .stations-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 30px;
            margin-bottom: 28px;
        }


        .stations-header-left {
            min-width: 0;
        }


        .stations-breadcrumb {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 10px;
            color: #8b8b8b;
            font-size: 13px;
        }


        .stations-breadcrumb strong {
            color: #555;
        }


        .breadcrumb-separator {
            color: #c7c7c7;
        }


        .stations-header h1 {
            margin: 0;
            font-size: 32px;
            line-height: 1.2;
            color: #151515;
            font-weight: 800;
            letter-spacing: -0.7px;
        }


        .stations-header p {
            margin: 8px 0 0;
            color: #777;
            font-size: 14px;
        }


        .stations-header-actions {
            display: flex;
            gap: 10px;
            align-items: center;
        }


        .fg-primary-btn,
        .fg-secondary-btn,
        .fg-clear-btn {
            min-height: 44px;
            border-radius: 10px;
            padding: 0 17px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-family: inherit;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition:
                transform .18s ease,
                box-shadow .18s ease,
                background .18s ease,
                border-color .18s ease;
        }


        .fg-primary-btn {
            border: 1px solid #f2c400;
            background: #f5c400;
            color: #161616;
            box-shadow:
                0 4px 14px rgba(245,196,0,.20);
        }


        .fg-primary-btn:hover {
            background: #e9b900;
            border-color: #e9b900;
            transform: translateY(-1px);
            box-shadow:
                0 7px 18px rgba(245,196,0,.25);
        }


        .fg-primary-btn:disabled {
            opacity: .65;
            cursor: not-allowed;
            transform: none;
        }


        .fg-secondary-btn {
            background: #fff;
            color: #303030;
            border: 1px solid #dedede;
        }


        .fg-secondary-btn:hover {
            background: #fafafa;
            border-color: #cfcfcf;
            transform: translateY(-1px);
        }


        .fg-secondary-btn:disabled {
            opacity: .65;
            cursor: not-allowed;
        }


        .fg-clear-btn {
            min-height: 40px;
            border: 0;
            background: transparent;
            color: #777;
        }


        .fg-clear-btn:hover {
            color: #151515;
            background: #f7f7f7;
        }


        .button-icon {
            font-size: 18px;
            line-height: 1;
        }


        .button-spinner,
        .station-spinner {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 2px solid rgba(0,0,0,.16);
            border-top-color: #171717;
            animation: fgSpin .7s linear infinite;
        }


        .station-spinner {
            width: 30px;
            height: 30px;
            border-width: 3px;
        }


        @keyframes fgSpin {

            to {
                transform: rotate(360deg);
            }

        }


        .station-alert {
            display: flex;
            align-items: center;
            gap: 10px;
            min-height: 48px;
            padding: 10px 14px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-size: 14px;
            font-weight: 600;
        }


        .station-alert.hidden {
            display: none;
        }


        .station-alert.success {
            background: #f0f8ed;
            border: 1px solid #cce4c5;
            color: #326427;
        }


        .station-alert.error {
            background: #fff1f0;
            border: 1px solid #f0c5c2;
            color: #a32920;
        }


        .station-alert-icon {
            width: 25px;
            height: 25px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            background: rgba(0,0,0,.06);
        }


        .station-alert-close {
            margin-left: auto;
            border: 0;
            background: transparent;
            color: currentColor;
            font-size: 20px;
            cursor: pointer;
        }


        .station-stats-grid {
            display: grid;
            grid-template-columns:
                repeat(4, minmax(0, 1fr));
            gap: 16px;
            margin-bottom: 22px;
        }


        .station-stat-card {
            background: #fff;
            border: 1px solid #e9e9e9;
            border-radius: 14px;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
            box-shadow:
                0 4px 16px rgba(0,0,0,.035);
        }


        .station-stat-icon {
            width: 45px;
            height: 45px;
            border-radius: 12px;
            background: #fff7cc;
            color: #8d7000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            flex-shrink: 0;
        }


        .station-stat-icon.active {
            background: #edf8e9;
            color: #4d7d3d;
        }


        .station-stat-icon.inactive {
            background: #f2f2f2;
            color: #777;
        }


        .station-stat-content {
            min-width: 0;
        }


        .station-stat-label {
            display: block;
            color: #818181;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 4px;
        }


        .station-stat-value {
            display: block;
            color: #171717;
            font-size: 24px;
            line-height: 1;
        }


        .stations-filter-card {
            background: #fff;
            border: 1px solid #e9e9e9;
            border-radius: 14px;
            padding: 14px;
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 22px;
            box-shadow:
                0 4px 16px rgba(0,0,0,.025);
        }


        .station-search-wrapper {
            position: relative;
            flex: 1;
            min-width: 220px;
        }


        .station-search-icon {
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            color: #8b8b8b;
            font-size: 20px;
        }


        .station-search-input {
            width: 100%;
            height: 42px;
            border: 1px solid #dedede;
            border-radius: 9px;
            padding: 0 14px 0 42px;
            outline: none;
            font-family: inherit;
            font-size: 14px;
            background: #fff;
            color: #222;
        }


        .station-search-input:focus {
            border-color: #e6bc00;
            box-shadow:
                0 0 0 3px rgba(245,196,0,.13);
        }


        .station-filter-wrapper {
            display: flex;
            align-items: center;
            gap: 8px;
        }


        .station-filter-label {
            color: #777;
            font-size: 13px;
            font-weight: 600;
        }


        .station-filter-select {
            height: 42px;
            border: 1px solid #dedede;
            border-radius: 9px;
            padding: 0 32px 0 12px;
            background: #fff;
            color: #222;
            outline: none;
            font-family: inherit;
            cursor: pointer;
        }


        .stations-directory-card {
            background: #fff;
            border: 1px solid #e9e9e9;
            border-radius: 14px;
            overflow: hidden;
            box-shadow:
                0 4px 18px rgba(0,0,0,.035);
        }


        .stations-directory-header {
            min-height: 78px;
            padding: 18px 20px;
            border-bottom: 1px solid #ededed;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
        }


        .stations-directory-header h2 {
            margin: 0;
            font-size: 17px;
            color: #1a1a1a;
        }


        .stations-directory-header p {
            margin: 5px 0 0;
            color: #888;
            font-size: 12px;
        }


        .station-result-count {
            color: #777;
            font-size: 13px;
            font-weight: 600;
        }


        .stations-table-container {
            width: 100%;
        }


        .stations-table-scroll {
            width: 100%;
            overflow-x: auto;
        }


        .stations-table {
            width: 100%;
            border-collapse: collapse;
            min-width: 820px;
        }


        .stations-table th {
            background: #fafafa;
            color: #777;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: .5px;
            text-align: left;
            padding: 14px 18px;
            border-bottom: 1px solid #e9e9e9;
            white-space: nowrap;
        }


        .stations-table td {
            padding: 17px 18px;
            border-bottom: 1px solid #f0f0f0;
            vertical-align: middle;
        }


        .stations-table tbody tr {
            transition: background .15s ease;
        }


        .stations-table tbody tr:hover {
            background: #fffdf2;
        }


        .stations-table tbody tr:last-child td {
            border-bottom: 0;
        }


        .station-name-cell {
            display: flex;
            align-items: center;
            gap: 12px;
        }


        .station-table-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff6c9;
            color: #7d6400;
            font-size: 18px;
            flex-shrink: 0;
        }


        .station-name-cell strong {
            display: block;
            color: #202020;
            font-size: 14px;
            margin-bottom: 4px;
        }


        .station-name-cell span {
            display: block;
            color: #999;
            font-size: 11px;
        }


        .station-location-cell strong {
            display: block;
            color: #333;
            font-size: 13px;
            margin-bottom: 4px;
        }


        .station-location-cell span {
            display: block;
            color: #999;
            font-size: 12px;
            max-width: 240px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }


        .station-status-badge {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 7px 10px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 800;
        }


        .station-status-badge.active {
            background: #edf8e9;
            color: #427236;
        }


        .station-status-badge.inactive {
            background: #f1f1f1;
            color: #777;
        }


        .status-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: currentColor;
        }


        .station-created-date {
            color: #777;
            font-size: 12px;
            white-space: nowrap;
        }


        .station-actions {
            display: flex;
            align-items: center;
            gap: 7px;
        }


        .station-action-btn {
            min-height: 34px;
            padding: 0 10px;
            border-radius: 8px;
            border: 1px solid #dedede;
            background: #fff;
            color: #555;
            font-family: inherit;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
        }


        .station-action-btn:hover {
            background: #fafafa;
        }


        .station-action-btn.delete {
            color: #a52c24;
            border-color: #efcfcc;
        }


        .station-action-btn.delete:hover {
            background: #fff2f1;
        }


        .stations-loading {
            min-height: 260px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 13px;
            color: #888;
            font-size: 13px;
        }


        .stations-empty-state {
            min-height: 300px;
            padding: 40px 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
        }


        .stations-empty-icon {
            width: 62px;
            height: 62px;
            border-radius: 18px;
            background: #fff6c9;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 26px;
            margin-bottom: 15px;
        }


        .stations-empty-state h3 {
            margin: 0;
            color: #242424;
            font-size: 17px;
        }


        .stations-empty-state p {
            max-width: 400px;
            margin: 7px 0 18px;
            color: #888;
            font-size: 13px;
        }


        .stations-error-state {
            background: #fff;
            border: 1px solid #e8e8e8;
            border-radius: 14px;
            min-height: 380px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 40px;
        }


        .stations-error-icon {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: #fff0ef;
            color: #b22d25;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 25px;
            font-weight: 800;
            margin-bottom: 16px;
        }


        .stations-error-state h2 {
            margin: 0;
            color: #222;
        }


        .stations-error-state p {
            max-width: 520px;
            color: #777;
            font-size: 13px;
            line-height: 1.6;
            margin: 10px 0 20px;
        }


        .fg-modal {
            position: fixed;
            inset: 0;
            z-index: 99999;
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
            background: rgba(15,15,15,.55);
            backdrop-filter: blur(3px);
        }


        .fg-modal-dialog {
            position: relative;
            z-index: 2;
            width: min(560px, 100%);
            max-height: calc(100vh - 40px);
            overflow-y: auto;
            background: #fff;
            border-radius: 16px;
            box-shadow:
                0 25px 80px rgba(0,0,0,.25);
            animation: fgModalIn .18s ease-out;
        }


        @keyframes fgModalIn {

            from {
                opacity: 0;
                transform:
                    translateY(10px)
                    scale(.985);
            }

            to {
                opacity: 1;
                transform:
                    translateY(0)
                    scale(1);
            }

        }


        .fg-modal-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;
            padding: 24px 24px 18px;
            border-bottom: 1px solid #ededed;
        }


        .fg-modal-eyebrow {
            display: block;
            color: #a88600;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 1px;
            margin-bottom: 7px;
        }


        .fg-modal-header h2 {
            margin: 0;
            color: #181818;
            font-size: 21px;
        }


        .fg-modal-header p {
            margin: 6px 0 0;
            color: #888;
            font-size: 12px;
        }


        .fg-modal-close {
            width: 35px;
            height: 35px;
            border: 1px solid #e3e3e3;
            border-radius: 9px;
            background: #fff;
            color: #555;
            font-size: 22px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }


        .fg-modal-close:hover {
            background: #f7f7f7;
        }


        .station-form {
            padding: 22px 24px 24px;
        }


        .station-form-group {
            margin-bottom: 17px;
        }


        .station-form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
        }


        .station-form-group label {
            display: block;
            margin-bottom: 7px;
            color: #444;
            font-size: 12px;
            font-weight: 800;
        }


        .station-form-group label span {
            color: #c79e00;
        }


        .station-form-group input,
        .station-form-group select {
            width: 100%;
            height: 44px;
            box-sizing: border-box;
            border: 1px solid #dcdcdc;
            border-radius: 9px;
            padding: 0 12px;
            background: #fff;
            color: #222;
            outline: none;
            font-family: inherit;
            font-size: 13px;
        }


        .station-form-group input:focus,
        .station-form-group select:focus {
            border-color: #e4ba00;
            box-shadow:
                0 0 0 3px rgba(245,196,0,.13);
        }


        .station-form-error {
            padding: 11px 12px;
            border-radius: 8px;
            background: #fff1f0;
            border: 1px solid #efc7c4;
            color: #a32920;
            font-size: 12px;
            margin-bottom: 16px;
        }


        .station-form-error.hidden {
            display: none;
        }


        .fg-modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 9px;
            padding-top: 7px;
        }


        @media (max-width: 1000px) {

            .station-stats-grid {
                grid-template-columns:
                    repeat(2, minmax(0, 1fr));
            }

        }


        @media (max-width: 760px) {

            .stations-header {
                align-items: stretch;
                flex-direction: column;
                gap: 17px;
            }


            .stations-header h1 {
                font-size: 27px;
            }


            .stations-header-actions {
                width: 100%;
            }


            .stations-header-actions button {
                flex: 1;
            }


            .stations-filter-card {
                align-items: stretch;
                flex-direction: column;
            }


            .station-search-wrapper {
                width: 100%;
            }


            .station-filter-wrapper {
                width: 100%;
            }


            .station-filter-select {
                flex: 1;
            }


            .fg-clear-btn {
                width: 100%;
            }

        }


        @media (max-width: 560px) {

            .station-stats-grid {
                grid-template-columns: 1fr;
            }


            .station-form-row {
                grid-template-columns: 1fr;
                gap: 0;
            }


            .fg-modal {
                padding: 10px;
            }


            .fg-modal-dialog {
                max-height:
                    calc(100vh - 20px);
            }


            .fg-modal-header {
                padding: 19px;
            }


            .station-form {
                padding: 18px 19px 20px;
            }


            .fg-modal-footer {
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


/* =========================================================
   GLOBAL DEBUG HELPERS
========================================================= */

window.FuelGapStations = {

    reload:
        loadStations,

    openCreateModal:
        () => {

            openStationModal();

        },

    getState:
        () => {

            return StationsState;

        }

};