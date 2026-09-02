/* ==========================================
   FUELGAP - PROFESSIONAL SHIFT MANAGEMENT
========================================== */

const SHIFTS_STORAGE_KEY = "fuelgap_shifts";
const STAFF_STORAGE_KEY = "fuelgap_staff";
const STATIONS_STORAGE_KEY = "fuelgap_stations";


/* ==========================================
   PAGE STATE
========================================== */

const ShiftState = {
    searchTerm: ""
};


/* ==========================================
   PAGE LOAD
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    const currentUser = FuelGapUtils.getCurrentUser();

    if (!currentUser) {
        window.location.href = "../login.html";
        return;
    }

    if (!hasPermission(currentUser.role, "shifts")) {
        window.location.href = "./dashboard.html";
        return;
    }

    setTimeout(() => {

        renderShiftsPage();
        setupShiftEvents();
        renderShifts();

    }, 0);

});


/* ==========================================
   STORAGE
========================================== */

function getStorageData(key) {

    try {

        const data = localStorage.getItem(key);

        if (!data) return [];

        const parsed = JSON.parse(data);

        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch (error) {

        console.error(`Unable to load ${key}:`, error);

        return [];

    }

}


function getShifts() {
    return getStorageData(SHIFTS_STORAGE_KEY);
}


function saveShifts(shifts) {

    localStorage.setItem(
        SHIFTS_STORAGE_KEY,
        JSON.stringify(shifts)
    );

}


function getStations() {
    return getStorageData(STATIONS_STORAGE_KEY);
}


function getStaff() {
    return getStorageData(STAFF_STORAGE_KEY);
}


/* ==========================================
   USER ACCESS
========================================== */

function getVisibleStations() {

    const currentUser =
        FuelGapUtils.getCurrentUser();

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

        if (!currentUser.stationId) {
            return [];
        }

        return stations.filter(
            station =>
                station.id ===
                currentUser.stationId
        );

    }


    return [];

}


/* ==========================================
   VISIBLE SHIFTS
========================================== */

function getVisibleShifts() {

    const stations =
        getVisibleStations();

    const stationIds =
        stations.map(
            station => station.id
        );

    return getShifts().filter(
        shift =>
            stationIds.includes(
                shift.stationId
            )
    );

}


/* ==========================================
   RENDER PAGE
========================================== */

function renderShiftsPage() {

    const pageContent =
        document.getElementById("pageContent");

    if (!pageContent) return;


    pageContent.innerHTML = `

        <div class="shifts-page">

            <!-- =================================
                 PAGE HEADER
            ================================== -->

            <header class="shifts-header">

                <div class="shifts-header-content">

                    <div class="shifts-eyebrow">

                        <span class="shifts-eyebrow-dot"></span>

                        OPERATIONS

                    </div>


                    <h1>
                        Shift Management
                    </h1>


                    <p>
                        Create, monitor and manage station
                        shifts and assigned attendants.
                    </p>

                </div>


                <div class="shifts-header-actions">

                    <button
                        type="button"
                        class="shift-btn shift-btn-primary"
                        id="openShiftModal"
                    >

                        <span class="shift-btn-icon">
                            +
                        </span>

                        Create Shift

                    </button>

                </div>

            </header>


            <!-- =================================
                 KPI CARDS
            ================================== -->

            <section class="shift-kpi-grid">

                <article class="shift-kpi-card">

                    <div class="shift-kpi-top">

                        <div class="shift-kpi-icon icon-total">
                            <svg viewBox="0 0 24 24">
                                <rect x="3" y="4" width="18" height="16" rx="3"/>
                                <path d="M7 8h10"/>
                                <path d="M7 12h6"/>
                                <path d="M7 16h4"/>
                            </svg>
                        </div>

                        <span class="shift-kpi-trend">
                            ALL
                        </span>

                    </div>


                    <div class="shift-kpi-label">
                        Total Shifts
                    </div>


                    <strong
                        id="totalShifts"
                        class="shift-kpi-value"
                    >
                        0
                    </strong>


                    <span class="shift-kpi-description">
                        Recorded station shifts
                    </span>

                </article>


                <article class="shift-kpi-card shift-kpi-active">

                    <div class="shift-kpi-top">

                        <div class="shift-kpi-icon icon-active">
                            <svg viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="8"/>
                                <path d="M12 8v4l3 2"/>
                            </svg>
                        </div>

                        <span class="shift-live-label">
                            LIVE
                        </span>

                    </div>


                    <div class="shift-kpi-label">
                        Active Shifts
                    </div>


                    <strong
                        id="openShifts"
                        class="shift-kpi-value"
                    >
                        0
                    </strong>


                    <span class="shift-kpi-description">
                        Currently operating
                    </span>

                </article>


                <article class="shift-kpi-card">

                    <div class="shift-kpi-top">

                        <div class="shift-kpi-icon icon-closed">
                            <svg viewBox="0 0 24 24">
                                <path d="M6 4h12v16H6z"/>
                                <path d="m9 12 2 2 4-4"/>
                            </svg>
                        </div>

                        <span class="shift-kpi-trend">
                            DONE
                        </span>

                    </div>


                    <div class="shift-kpi-label">
                        Closed Shifts
                    </div>


                    <strong
                        id="closedShifts"
                        class="shift-kpi-value"
                    >
                        0
                    </strong>


                    <span class="shift-kpi-description">
                        Completed operations
                    </span>

                </article>


                <article class="shift-kpi-card">

                    <div class="shift-kpi-top">

                        <div class="shift-kpi-icon icon-staff">
                            <svg viewBox="0 0 24 24">
                                <circle cx="9" cy="8" r="3"/>
                                <circle cx="17" cy="9" r="2.5"/>
                                <path d="M3 20c0-3 2.5-5 6-5s6 2 6 5"/>
                                <path d="M15 15c3 0 5 2 5 5"/>
                            </svg>
                        </div>

                        <span class="shift-kpi-trend">
                            STAFF
                        </span>

                    </div>


                    <div class="shift-kpi-label">
                        Assigned Staff
                    </div>


                    <strong
                        id="assignedStaffCount"
                        class="shift-kpi-value"
                    >
                        0
                    </strong>


                    <span class="shift-kpi-description">
                        Staff assigned to shifts
                    </span>

                </article>

            </section>


            <!-- =================================
                 SHIFT MANAGEMENT CARD
            ================================== -->

            <section class="shift-management-card">

                <div class="shift-section-header">

                    <div>

                        <div class="shift-section-title-row">

                            <div class="shift-section-title-icon">

                                <svg viewBox="0 0 24 24">
                                    <rect x="3" y="5" width="18" height="15" rx="2"/>
                                    <path d="M8 3v4"/>
                                    <path d="M16 3v4"/>
                                    <path d="M3 10h18"/>
                                </svg>

                            </div>


                            <div>

                                <h2>
                                    Station Shifts
                                </h2>

                                <p>
                                    Monitor active and completed
                                    station operations.
                                </p>

                            </div>

                        </div>

                    </div>


                    <div class="shift-record-count">

                        <span
                            class="shift-count-dot"
                        ></span>

                        <span id="shiftRecordCount">
                            0 shifts
                        </span>

                    </div>

                </div>


                <!-- =================================
                     TOOLBAR
                ================================== -->

                <div class="shift-toolbar">

                    <div class="shift-search">

                        <svg viewBox="0 0 24 24">

                            <circle
                                cx="11"
                                cy="11"
                                r="7"
                            />

                            <path
                                d="m20 20-4-4"
                            />

                        </svg>


                        <input
                            type="search"
                            id="shiftSearch"
                            placeholder="Search by shift, station or status..."
                            autocomplete="off"
                        />

                    </div>


                    <button
                        type="button"
                        class="shift-filter-button"
                        id="clearShiftSearch"
                    >
                        Clear
                    </button>

                </div>


                <!-- =================================
                     TABLE
                ================================== -->

                <div class="shift-table-container">

                    <table class="shift-table">

                        <thead>

                            <tr>

                                <th>
                                    SHIFT
                                </th>

                                <th>
                                    STATION
                                </th>

                                <th>
                                    WORKING HOURS
                                </th>

                                <th>
                                    ASSIGNED STAFF
                                </th>

                                <th>
                                    STATUS
                                </th>

                                <th>
                                    OPENED
                                </th>

                                <th class="shift-action-header">
                                    ACTION
                                </th>

                            </tr>

                        </thead>


                        <tbody
                            id="shiftTableBody"
                        ></tbody>

                    </table>

                </div>


                <!-- =================================
                     EMPTY STATE
                ================================== -->

                <div
                    id="emptyShiftState"
                    class="shift-empty-state hidden"
                >

                    <div class="shift-empty-icon">

                        <svg viewBox="0 0 24 24">
                            <rect
                                x="3"
                                y="5"
                                width="18"
                                height="15"
                                rx="2"
                            />
                            <path d="M8 3v4"/>
                            <path d="M16 3v4"/>
                            <path d="M3 10h18"/>
                            <path d="M9 15h6"/>
                        </svg>

                    </div>


                    <h3>
                        No shifts found
                    </h3>


                    <p>
                        Create a shift to start managing
                        station operations.
                    </p>


                    <button
                        type="button"
                        class="shift-btn shift-btn-primary"
                        id="emptyCreateShiftButton"
                    >
                        + Create First Shift
                    </button>

                </div>

            </section>


            <!-- =================================
                 CREATE SHIFT MODAL
            ================================== -->

            <div
                id="shiftModal"
                class="shift-modal hidden"
            >

                <div
                    class="shift-modal-overlay"
                ></div>


                <div
                    class="shift-modal-dialog"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="shiftModalTitle"
                >

                    <div class="shift-modal-top">

                        <div class="shift-modal-icon">

                            <svg viewBox="0 0 24 24">
                                <rect
                                    x="3"
                                    y="5"
                                    width="18"
                                    height="15"
                                    rx="2"
                                />
                                <path d="M8 3v4"/>
                                <path d="M16 3v4"/>
                                <path d="M3 10h18"/>
                                <path d="M12 13v4"/>
                                <path d="M10 15h4"/>
                            </svg>

                        </div>


                        <button
                            type="button"
                            id="closeShiftModal"
                            class="shift-modal-close"
                            aria-label="Close"
                        >
                            ×
                        </button>

                    </div>


                    <div class="shift-modal-header">

                        <span class="shift-modal-eyebrow">
                            NEW OPERATION
                        </span>


                        <h2 id="shiftModalTitle">
                            Create New Shift
                        </h2>


                        <p>
                            Configure the station, working
                            hours and assigned attendants.
                        </p>

                    </div>


                    <form
                        id="shiftForm"
                        class="shift-form"
                    >

                        <div class="shift-form-grid">

                            <div class="shift-form-group full">

                                <label for="shiftName">
                                    Shift Name
                                    <span>*</span>
                                </label>


                                <div class="shift-input-wrapper">

                                    <svg viewBox="0 0 24 24">
                                        <path d="M4 5h16v14H4z"/>
                                        <path d="M8 9h8"/>
                                        <path d="M8 13h5"/>
                                    </svg>


                                    <input
                                        id="shiftName"
                                        type="text"
                                        name="name"
                                        placeholder="e.g. Morning Shift"
                                        required
                                    />

                                </div>

                            </div>


                            <div class="shift-form-group full">

                                <label for="shiftStation">
                                    Station
                                    <span>*</span>
                                </label>


                                <div class="shift-input-wrapper">

                                    <svg viewBox="0 0 24 24">
                                        <path d="M4 21V5l8-3 8 3v16"/>
                                        <path d="M8 21v-5h8v5"/>
                                        <path d="M9 8h6"/>
                                    </svg>


                                    <select
                                        id="shiftStation"
                                        name="stationId"
                                        required
                                    >

                                        <option value="">
                                            Select station
                                        </option>

                                    </select>

                                </div>

                            </div>


                            <div class="shift-form-group">

                                <label for="shiftStartTime">
                                    Start Time
                                    <span>*</span>
                                </label>


                                <div class="shift-input-wrapper">

                                    <svg viewBox="0 0 24 24">
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="8"
                                        />
                                        <path d="M12 8v4l3 2"/>
                                    </svg>


                                    <input
                                        id="shiftStartTime"
                                        type="time"
                                        name="startTime"
                                        required
                                    />

                                </div>

                            </div>


                            <div class="shift-form-group">

                                <label for="shiftEndTime">
                                    End Time
                                    <span>*</span>
                                </label>


                                <div class="shift-input-wrapper">

                                    <svg viewBox="0 0 24 24">
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="8"
                                        />
                                        <path d="M12 8v4l3 2"/>
                                    </svg>


                                    <input
                                        id="shiftEndTime"
                                        type="time"
                                        name="endTime"
                                        required
                                    />

                                </div>

                            </div>


                            <div class="shift-form-group full">

                                <div class="shift-staff-label-row">

                                    <label>
                                        Assign Staff
                                        <span>*</span>
                                    </label>


                                    <span
                                        id="selectedStaffCount"
                                        class="selected-staff-count"
                                    >
                                        0 selected
                                    </span>

                                </div>


                                <div
                                    id="staffCheckboxList"
                                    class="shift-staff-list"
                                >

                                    <div class="shift-staff-placeholder">

                                        <svg viewBox="0 0 24 24">
                                            <circle
                                                cx="12"
                                                cy="8"
                                                r="3"
                                            />
                                            <path
                                                d="M5 20c0-4 3-6 7-6s7 2 7 6"
                                            />
                                        </svg>

                                        <span>
                                            Select a station first
                                        </span>

                                    </div>

                                </div>

                            </div>

                        </div>


                        <div
                            id="shiftMessage"
                            class="shift-form-message hidden"
                        ></div>


                        <div class="shift-modal-actions">

                            <button
                                type="button"
                                id="cancelShiftModal"
                                class="shift-btn shift-btn-secondary"
                            >
                                Cancel
                            </button>


                            <button
                                type="submit"
                                class="shift-btn shift-btn-primary"
                                id="createShiftSubmit"
                            >

                                <span>
                                    Create Shift
                                </span>

                            </button>

                        </div>

                    </form>

                </div>

            </div>

        </div>

    `;

}


/* ==========================================
   EVENTS
========================================== */

function setupShiftEvents() {

    setupShiftModal();

    setupStationChange();

    setupShiftForm();

    setupShiftSearch();

    setupClearSearch();

}


/* ==========================================
   MODAL
========================================== */

function setupShiftModal() {

    const modal =
        document.getElementById("shiftModal");

    const openButton =
        document.getElementById("openShiftModal");

    const emptyButton =
        document.getElementById(
            "emptyCreateShiftButton"
        );

    const closeButton =
        document.getElementById("closeShiftModal");

    const cancelButton =
        document.getElementById("cancelShiftModal");

    if (!modal) return;


    const openModal = () => {

        resetShiftForm();

        loadStationsIntoShiftSelect();

        modal.classList.remove("hidden");

        document.body.classList.add(
            "shift-modal-open"
        );

        setTimeout(() => {

            const input =
                document.getElementById("shiftName");

            if (input) {
                input.focus();
            }

        }, 100);

    };


    const closeModal = () => {

        modal.classList.add("hidden");

        document.body.classList.remove(
            "shift-modal-open"
        );

    };


    if (openButton) {

        openButton.addEventListener(
            "click",
            openModal
        );

    }


    if (emptyButton) {

        emptyButton.addEventListener(
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
            ".shift-modal-overlay"
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
   RESET FORM
========================================== */

function resetShiftForm() {

    const form =
        document.getElementById("shiftForm");

    if (form) {
        form.reset();
    }


    const staffList =
        document.getElementById(
            "staffCheckboxList"
        );

    if (staffList) {

        staffList.innerHTML = `

            <div class="shift-staff-placeholder">

                <svg viewBox="0 0 24 24">
                    <circle
                        cx="12"
                        cy="8"
                        r="3"
                    />
                    <path
                        d="M5 20c0-4 3-6 7-6s7 2 7 6"
                    />
                </svg>

                <span>
                    Select a station first
                </span>

            </div>

        `;

    }


    updateSelectedStaffCount();


    const message =
        document.getElementById(
            "shiftMessage"
        );

    if (message) {

        message.textContent = "";

        message.className =
            "shift-form-message hidden";

    }

}


/* ==========================================
   LOAD STATIONS
========================================== */

function loadStationsIntoShiftSelect() {

    const select =
        document.getElementById(
            "shiftStation"
        );

    if (!select) return;


    const stations =
        getVisibleStations();


    select.innerHTML = `

        <option value="">
            Select station
        </option>

    `;


    stations.forEach(station => {

        const option =
            document.createElement("option");

        option.value =
            station.id;

        option.textContent =
            station.name ||
            "Unnamed Station";

        select.appendChild(option);

    });

}


/* ==========================================
   STATION CHANGE
========================================== */

function setupStationChange() {

    const stationSelect =
        document.getElementById(
            "shiftStation"
        );

    if (!stationSelect) return;


    stationSelect.addEventListener(
        "change",
        event => {

            loadStaffForStation(
                event.target.value
            );

        }
    );

}


/* ==========================================
   LOAD STAFF
========================================== */

function loadStaffForStation(stationId) {

    const container =
        document.getElementById(
            "staffCheckboxList"
        );

    if (!container) return;


    if (!stationId) {

        resetStaffPlaceholder(
            "Select a station first"
        );

        updateSelectedStaffCount();

        return;

    }


    const staff =
        getStaff().filter(
            member =>
                member.stationId ===
                stationId
        );


    if (staff.length === 0) {

        resetStaffPlaceholder(
            "No staff assigned to this station"
        );

        updateSelectedStaffCount();

        return;

    }


    container.innerHTML = "";


    staff.forEach(member => {

        const label =
            document.createElement("label");

        label.className =
            "shift-staff-item";


        const initials =
            getInitials(
                member.fullName ||
                member.name ||
                "Staff"
            );


        label.innerHTML = `

            <input
                type="checkbox"
                name="assignedStaff"
                value="${escapeHTML(member.id)}"
            >


            <span class="shift-staff-check">

                <svg viewBox="0 0 24 24">
                    <path d="m5 12 4 4L19 6"/>
                </svg>

            </span>


            <span class="shift-staff-avatar">
                ${escapeHTML(initials)}
            </span>


            <span class="shift-staff-info">

                <strong>
                    ${escapeHTML(
                        member.fullName ||
                        member.name ||
                        "Unknown Staff"
                    )}
                </strong>

                <small>
                    ${escapeHTML(
                        formatRole(
                            member.role ||
                            "Staff"
                        )
                    )}
                </small>

            </span>

        `;


        container.appendChild(label);

    });


    container
        .querySelectorAll(
            'input[name="assignedStaff"]'
        )
        .forEach(input => {

            input.addEventListener(
                "change",
                updateSelectedStaffCount
            );

        });


    updateSelectedStaffCount();

}


/* ==========================================
   STAFF PLACEHOLDER
========================================== */

function resetStaffPlaceholder(message) {

    const container =
        document.getElementById(
            "staffCheckboxList"
        );

    if (!container) return;


    container.innerHTML = `

        <div class="shift-staff-placeholder">

            <svg viewBox="0 0 24 24">
                <circle
                    cx="12"
                    cy="8"
                    r="3"
                />
                <path
                    d="M5 20c0-4 3-6 7-6s7 2 7 6"
                />
            </svg>

            <span>
                ${escapeHTML(message)}
            </span>

        </div>

    `;

}


/* ==========================================
   STAFF COUNT
========================================== */

function updateSelectedStaffCount() {

    const selected =
        document.querySelectorAll(
            '#staffCheckboxList input[name="assignedStaff"]:checked'
        ).length;


    const element =
        document.getElementById(
            "selectedStaffCount"
        );


    if (element) {

        element.textContent =
            `${selected} ${
                selected === 1
                    ? "selected"
                    : "selected"
            }`;

    }

}


/* ==========================================
   CREATE SHIFT
========================================== */

function setupShiftForm() {

    const form =
        document.getElementById(
            "shiftForm"
        );

    if (!form) return;


    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const formData =
                new FormData(form);


            const name =
                String(
                    formData.get("name") || ""
                ).trim();


            const stationId =
                formData.get("stationId");


            const startTime =
                formData.get("startTime");


            const endTime =
                formData.get("endTime");


            const assignedStaff =
                formData.getAll(
                    "assignedStaff"
                );


            const message =
                document.getElementById(
                    "shiftMessage"
                );


            if (
                !name ||
                !stationId ||
                !startTime ||
                !endTime
            ) {

                showShiftMessage(
                    message,
                    "Please complete all required fields.",
                    "error"
                );

                return;

            }


            if (
                assignedStaff.length === 0
            ) {

                showShiftMessage(
                    message,
                    "Please assign at least one staff member.",
                    "error"
                );

                return;

            }


            const currentUser =
                FuelGapUtils.getCurrentUser();


            const station =
                getStations().find(
                    item =>
                        item.id ===
                        stationId
                );


            if (!station) {

                showShiftMessage(
                    message,
                    "Selected station could not be found.",
                    "error"
                );

                return;

            }


            const shifts =
                getShifts();


            const newShift = {

                id:
                    `SHIFT-${Date.now()}-${Math.floor(
                        Math.random() * 1000
                    )}`,

                organizationId:
                    station.organizationId ||
                    null,

                stationId,

                name,

                startTime,

                endTime,

                assignedStaff,

                status:
                    "open",

                openedBy:
                    currentUser
                        ? currentUser.id
                        : null,

                openedByName:
                    currentUser
                        ? (
                            currentUser.fullName ||
                            currentUser.name ||
                            "Unknown"
                        )
                        : "Unknown",

                openedAt:
                    new Date().toISOString(),

                closedAt:
                    null

            };


            shifts.push(newShift);


            saveShifts(shifts);


            showShiftMessage(
                message,
                "Shift created successfully.",
                "success"
            );


            renderShifts();


            const submitButton =
                document.getElementById(
                    "createShiftSubmit"
                );


            if (submitButton) {

                submitButton.disabled = true;

                submitButton.innerHTML = `
                    <span>Shift Created ✓</span>
                `;

            }


            setTimeout(() => {

                const modal =
                    document.getElementById(
                        "shiftModal"
                    );

                if (modal) {

                    modal.classList.add(
                        "hidden"
                    );

                }


                document.body.classList.remove(
                    "shift-modal-open"
                );


                resetShiftForm();


                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.innerHTML = `
                        <span>Create Shift</span>
                    `;

                }

            }, 900);

        }
    );

}


/* ==========================================
   RENDER SHIFTS
========================================== */

function renderShifts(searchTerm = null) {

    const shifts =
        getVisibleShifts();

    const stations =
        getStations();

    const staff =
        getStaff();


    const tableBody =
        document.getElementById(
            "shiftTableBody"
        );

    const emptyState =
        document.getElementById(
            "emptyShiftState"
        );


    if (!tableBody) return;


    if (searchTerm !== null) {

        ShiftState.searchTerm =
            searchTerm;

    }


    const search =
        ShiftState.searchTerm
            .toLowerCase()
            .trim();


    const filteredShifts =
        shifts.filter(shift => {

            const station =
                stations.find(
                    item =>
                        item.id ===
                        shift.stationId
                );


            const shiftName =
                shift.name ||
                shift.shiftName ||
                "";


            const stationName =
                station
                    ? station.name || ""
                    : "";


            const status =
                shift.status ||
                "";


            const searchable =
                `
                    ${shiftName}
                    ${stationName}
                    ${status}
                    ${shift.startTime || ""}
                    ${shift.endTime || ""}
                `
                    .toLowerCase();


            return searchable.includes(
                search
            );

        });


    tableBody.innerHTML = "";


    if (
        filteredShifts.length === 0
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


        filteredShifts
            .sort(
                (a, b) =>
                    new Date(
                        b.openedAt || 0
                    ) -
                    new Date(
                        a.openedAt || 0
                    )
            )
            .forEach(
                shift => {

                    const station =
                        stations.find(
                            item =>
                                item.id ===
                                shift.stationId
                        );


                    const assignedStaff =
                        Array.isArray(
                            shift.assignedStaff
                        )
                            ? shift.assignedStaff
                            : [];


                    const assignedMembers =
                        assignedStaff
                            .map(
                                staffId =>
                                    staff.find(
                                        member =>
                                            member.id ===
                                            staffId
                                    )
                            )
                            .filter(Boolean);


                    const row =
                        document.createElement(
                            "tr"
                        );


                    row.innerHTML = `

                        <!-- SHIFT -->

                        <td>

                            <div class="shift-name-cell">

                                <div class="shift-name-icon">

                                    <svg viewBox="0 0 24 24">
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="8"
                                        />
                                        <path
                                            d="M12 8v4l3 2"
                                        />
                                    </svg>

                                </div>


                                <div>

                                    <strong>
                                        ${escapeHTML(
                                            shift.name ||
                                            shift.shiftName ||
                                            "Unnamed Shift"
                                        )}
                                    </strong>

                                    <small>
                                        ${escapeHTML(
                                            shift.id || ""
                                        )}
                                    </small>

                                </div>

                            </div>

                        </td>


                        <!-- STATION -->

                        <td>

                            <div class="shift-station-cell">

                                <span class="station-marker">

                                    <svg viewBox="0 0 24 24">
                                        <path
                                            d="M4 21V5l8-3 8 3v16"
                                        />
                                        <path
                                            d="M8 21v-5h8v5"
                                        />
                                        <path
                                            d="M9 8h6"
                                        />
                                    </svg>

                                </span>


                                <span>

                                    ${escapeHTML(
                                        station
                                            ? station.name
                                            : "Unknown Station"
                                    )}

                                </span>

                            </div>

                        </td>


                        <!-- TIME -->

                        <td>

                            <div class="shift-time-cell">

                                <strong>
                                    ${escapeHTML(
                                        shift.startTime ||
                                        "--:--"
                                    )}
                                    <span>→</span>
                                    ${escapeHTML(
                                        shift.endTime ||
                                        "--:--"
                                    )}
                                </strong>

                                <small>
                                    Shift hours
                                </small>

                            </div>

                        </td>


                        <!-- STAFF -->

                        <td>

                            <div class="shift-staff-summary">

                                <div class="shift-avatar-stack">

                                    ${renderStaffAvatars(
                                        assignedMembers
                                    )}

                                </div>


                                <span class="staff-total">

                                    ${
                                        assignedMembers.length
                                    }

                                    ${
                                        assignedMembers.length === 1
                                            ? "staff"
                                            : "staff"
                                    }

                                </span>

                            </div>

                        </td>


                        <!-- STATUS -->

                        <td>

                            ${getShiftStatusBadge(
                                shift.status
                            )}

                        </td>


                        <!-- OPENED -->

                        <td>

                            <div class="shift-opened-cell">

                                <strong>
                                    ${formatShiftDateShort(
                                        shift.openedAt
                                    )}
                                </strong>

                                <small>
                                    ${formatShiftTime(
                                        shift.openedAt
                                    )}
                                </small>

                            </div>

                        </td>


                        <!-- ACTION -->

                        <td class="shift-action-cell">

                            ${
                                shift.status === "open"

                                ? `

                                    <button
                                        type="button"
                                        class="shift-close-button close-shift-btn"
                                        data-id="${escapeHTML(
                                            shift.id
                                        )}"
                                    >

                                        <svg viewBox="0 0 24 24">
                                            <path
                                                d="M6 4h12v16H6z"
                                            />
                                            <path
                                                d="m9 12 2 2 4-4"
                                            />
                                        </svg>

                                        Close Shift

                                    </button>

                                `

                                : `

                                    <span class="shift-completed">

                                        <svg viewBox="0 0 24 24">
                                            <path
                                                d="m5 12 4 4L19 6"
                                            />
                                        </svg>

                                        Completed

                                    </span>

                                `
                            }

                        </td>

                    `;


                    tableBody.appendChild(row);

                }
            );

    }


    updateShiftStats(shifts);

    setupCloseShiftButtons();

}


/* ==========================================
   STAFF AVATARS
========================================== */

function renderStaffAvatars(members) {

    const maxVisible = 3;

    const visible =
        members.slice(
            0,
            maxVisible
        );


    let html =
        visible
            .map(member => `

                <span
                    class="shift-avatar"
                    title="${escapeHTML(
                        member.fullName ||
                        member.name ||
                        "Staff"
                    )}"
                >
                    ${escapeHTML(
                        getInitials(
                            member.fullName ||
                            member.name ||
                            "Staff"
                        )
                    )}
                </span>

            `)
            .join("");


    if (members.length > maxVisible) {

        html += `

            <span class="shift-avatar shift-avatar-more">

                +${members.length - maxVisible}

            </span>

        `;

    }


    return html || `

        <span class="shift-avatar shift-avatar-empty">
            —
        </span>

    `;

}


/* ==========================================
   STATUS BADGE
========================================== */

function getShiftStatusBadge(status) {

    const normalized =
        String(
            status || "closed"
        )
            .toLowerCase()
            .trim();


    const isOpen =
        normalized === "open" ||
        normalized === "active";


    return `

        <span
            class="
                shift-status-badge
                ${
                    isOpen
                        ? "shift-status-open"
                        : "shift-status-closed"
                }
            "
        >

            <span class="shift-status-dot"></span>

            ${
                isOpen
                    ? "Active"
                    : "Closed"
            }

        </span>

    `;

}


/* ==========================================
   CLOSE SHIFT BUTTONS
========================================== */

function setupCloseShiftButtons() {

    const buttons =
        document.querySelectorAll(
            ".close-shift-btn"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                closeShift(
                    button.dataset.id
                );

            }
        );

    });

}


/* ==========================================
   CLOSE SHIFT
========================================== */

function closeShift(shiftId) {

    const shifts =
        getShifts();


    const shift =
        shifts.find(
            item =>
                item.id ===
                shiftId
        );


    if (!shift) {
        return;
    }


    const shiftName =
        shift.name ||
        shift.shiftName ||
        "this shift";


    const confirmed =
        confirm(
            `Close "${shiftName}"?\n\nThis will mark the shift as completed.`
        );


    if (!confirmed) {
        return;
    }


    shift.status =
        "closed";


    shift.closedAt =
        new Date().toISOString();


    saveShifts(shifts);


    renderShifts();

}


/* ==========================================
   SEARCH
========================================== */

function setupShiftSearch() {

    const searchInput =
        document.getElementById(
            "shiftSearch"
        );


    if (!searchInput) return;


    searchInput.addEventListener(
        "input",
        event => {

            renderShifts(
                event.target.value
            );

        }
    );

}


/* ==========================================
   CLEAR SEARCH
========================================== */

function setupClearSearch() {

    const button =
        document.getElementById(
            "clearShiftSearch"
        );


    if (!button) return;


    button.addEventListener(
        "click",
        () => {

            const input =
                document.getElementById(
                    "shiftSearch"
                );


            if (input) {
                input.value = "";
            }


            ShiftState.searchTerm = "";


            renderShifts();

        }
    );

}


/* ==========================================
   UPDATE STATS
========================================== */

function updateShiftStats(shifts) {

    const total =
        shifts.length;


    const open =
        shifts.filter(
            shift =>
                [
                    "open",
                    "active"
                ].includes(
                    String(
                        shift.status || ""
                    ).toLowerCase()
                )
        ).length;


    const closed =
        shifts.filter(
            shift =>
                String(
                    shift.status || ""
                ).toLowerCase() ===
                "closed"
        ).length;


    const assignedStaff =
        new Set(
            shifts.flatMap(
                shift =>
                    Array.isArray(
                        shift.assignedStaff
                    )
                        ? shift.assignedStaff
                        : []
            )
        ).size;


    setText(
        "totalShifts",
        total
    );


    setText(
        "openShifts",
        open
    );


    setText(
        "closedShifts",
        closed
    );


    setText(
        "assignedStaffCount",
        assignedStaff
    );


    setText(
        "shiftRecordCount",
        `${total} ${
            total === 1
                ? "shift"
                : "shifts"
        }`
    );

}


/* ==========================================
   SHOW MESSAGE
========================================== */

function showShiftMessage(
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
        `shift-form-message ${type}`;

}


/* ==========================================
   DATE FORMAT
========================================== */

function formatShiftDateShort(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


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


function formatShiftTime(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


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
   ROLE
========================================== */

function formatRole(role) {

    if (!role) {
        return "Staff";
    }


    return String(role)
        .replace(/[_-]/g, " ")
        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );

}


/* ==========================================
   INITIALS
========================================== */

function getInitials(name) {

    const words =
        String(name || "Staff")
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (words.length === 1) {

        return words[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();

}


/* ==========================================
   SAFE TEXT
========================================== */

function escapeHTML(value) {

    const text =
        String(
            value ?? ""
        );


    const div =
        document.createElement("div");


    div.textContent =
        text;


    return div.innerHTML;

}


/* ==========================================
   SET TEXT
========================================== */

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}