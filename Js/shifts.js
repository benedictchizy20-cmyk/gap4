/* ==========================================
   FUELGAP - SHIFT MANAGEMENT
========================================== */

const SHIFTS_STORAGE_KEY = "fuelgap_shifts";

const STAFF_STORAGE_KEY = "fuelgap_staff";

const STATIONS_STORAGE_KEY = "fuelgap_stations";


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

function getShifts() {

    try {

        return JSON.parse(
            localStorage.getItem(SHIFTS_STORAGE_KEY)
        ) || [];

    } catch (error) {

        console.error("Unable to load shifts:", error);

        return [];

    }

}


function saveShifts(shifts) {

    localStorage.setItem(
        SHIFTS_STORAGE_KEY,
        JSON.stringify(shifts)
    );

}


function getStations() {

    try {

        return JSON.parse(
            localStorage.getItem(STATIONS_STORAGE_KEY)
        ) || [];

    } catch (error) {

        console.error("Unable to load stations:", error);

        return [];

    }

}


function getStaff() {

    try {

        return JSON.parse(
            localStorage.getItem(STAFF_STORAGE_KEY)
        ) || [];

    } catch (error) {

        console.error("Unable to load staff:", error);

        return [];

    }

}


/* ==========================================
   USER STATION ACCESS
========================================== */

function getVisibleStations() {

    const currentUser = FuelGapUtils.getCurrentUser();

    const stations = getStations();


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


/* ==========================================
   VISIBLE SHIFTS
========================================== */

function getVisibleShifts() {

    const visibleStations =
        getVisibleStations();

    const stationIds =
        visibleStations.map(
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


    if (!pageContent) {

        return;

    }


    pageContent.innerHTML = `

        <div class="page-header">

            <div>

                <p class="page-eyebrow">
                    SHIFT MANAGEMENT
                </p>

                <h1>
                    Shifts
                </h1>

                <p>
                    Create shifts, assign attendants
                    and manage station operations.
                </p>

            </div>


            <button
                type="button"
                class="btn btn-primary"
                id="openShiftModal"
            >
                + Create Shift
            </button>

        </div>


        <!-- SHIFT STATS -->

        <section class="pump-stats">

            <div class="pump-stat-card">

                <span>
                    Total Shifts
                </span>

                <strong id="totalShifts">
                    0
                </strong>

            </div>


            <div class="pump-stat-card">

                <span>
                    Open Shifts
                </span>

                <strong id="openShifts">
                    0
                </strong>

            </div>


            <div class="pump-stat-card">

                <span>
                    Closed Shifts
                </span>

                <strong id="closedShifts">
                    0
                </strong>

            </div>

        </section>


        <!-- SHIFT LIST -->

        <section class="pump-section">

            <div class="section-header">

                <div>

                    <h2>
                        Station Shifts
                    </h2>

                    <p>
                        Manage all active and completed shifts.
                    </p>

                </div>


                <input
                    type="search"
                    id="shiftSearch"
                    placeholder="Search shifts..."
                >

            </div>


            <div class="table-wrapper">

                <table class="pump-table">

                    <thead>

                        <tr>

                            <th>Shift</th>

                            <th>Station</th>

                            <th>Time</th>

                            <th>Staff</th>

                            <th>Status</th>

                            <th>Opened</th>

                            <th>Actions</th>

                        </tr>

                    </thead>


                    <tbody
                        id="shiftTableBody"
                    ></tbody>

                </table>

            </div>


            <div
                id="emptyShiftState"
                class="empty-state hidden"
            >

                <h3>
                    No shifts created yet
                </h3>

                <p>
                    Create your first shift
                    and assign staff.
                </p>

            </div>

        </section>


        <!-- CREATE SHIFT MODAL -->

        <div
            id="shiftModal"
            class="modal hidden"
        >

            <div class="modal-overlay"></div>


            <div class="modal-content">

                <button
                    type="button"
                    id="closeShiftModal"
                    class="modal-close"
                >
                    ×
                </button>


                <div class="modal-header">

                    <h2>
                        Create New Shift
                    </h2>

                    <p>
                        Configure the station,
                        working hours and staff.
                    </p>

                </div>


                <form id="shiftForm">


                    <div class="form-group">

                        <label>
                            Shift Name
                        </label>

                        <input
                            type="text"
                            name="name"
                            placeholder="Example: Morning Shift"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Station
                        </label>

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


                    <div class="form-group">

                        <label>
                            Start Time
                        </label>

                        <input
                            type="time"
                            name="startTime"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            End Time
                        </label>

                        <input
                            type="time"
                            name="endTime"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Assign Staff
                        </label>

                        <div
                            id="staffCheckboxList"
                            class="staff-checkbox-list"
                        >

                            Select a station first

                        </div>

                    </div>


                    <div
                        id="shiftMessage"
                        class="form-message hidden"
                    ></div>


                    <button
                        type="submit"
                        class="btn btn-primary"
                    >
                        Create Shift
                    </button>

                </form>

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

}


/* ==========================================
   SHIFT MODAL
========================================== */

function setupShiftModal() {

    const modal =
        document.getElementById("shiftModal");

    const openButton =
        document.getElementById("openShiftModal");

    const closeButton =
        document.getElementById("closeShiftModal");


    if (!modal) return;


    if (openButton) {

        openButton.addEventListener(
            "click",
            () => {

                resetShiftForm();

                loadStationsIntoShiftSelect();

                modal.classList.remove("hidden");

            }
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            () => {

                modal.classList.add("hidden");

            }
        );

    }


    const overlay =
        modal.querySelector(".modal-overlay");


    if (overlay) {

        overlay.addEventListener(
            "click",
            () => {

                modal.classList.add("hidden");

            }
        );

    }

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

        staffList.innerHTML =
            "Select a station first";

    }


    const message =
        document.getElementById(
            "shiftMessage"
        );


    if (message) {

        message.textContent = "";

        message.className =
            "form-message hidden";

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


    stations.forEach(
        station => {

            const option =
                document.createElement("option");


            option.value =
                station.id;


            option.textContent =
                station.name;


            select.appendChild(option);

        }
    );

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

function loadStaffForStation(
    stationId
) {

    const container =
        document.getElementById(
            "staffCheckboxList"
        );


    if (!container) return;


    if (!stationId) {

        container.innerHTML =
            "Select a station first";

        return;

    }


    const staff =
        getStaff().filter(
            member =>
                member.stationId ===
                stationId
        );


    if (
        staff.length === 0
    ) {

        container.innerHTML = `
            <p>
                No staff assigned
                to this station.
            </p>
        `;

        return;

    }


    container.innerHTML =
        "";


    staff.forEach(
        member => {

            const label =
                document.createElement(
                    "label"
                );


            label.className =
                "staff-checkbox-item";


            label.innerHTML = `

                <input
                    type="checkbox"
                    name="assignedStaff"
                    value="${member.id}"
                >

                <span>

                    ${member.fullName}

                    <small>
                        ${member.role || "Staff"}
                    </small>

                </span>

            `;


            container.appendChild(
                label
            );

        }
    );

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
                formData.get("name")
                    .trim();


            const stationId =
                formData.get(
                    "stationId"
                );


            const startTime =
                formData.get(
                    "startTime"
                );


            const endTime =
                formData.get(
                    "endTime"
                );


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
                assignedStaff.length ===
                0
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


            const shifts =
                getShifts();


            const newShift = {

                id:
                    `SHIFT-${Date.now()}-${Math.floor(
                        Math.random() * 1000
                    )}`,

                organizationId:
                    station
                        ? station.organizationId
                        : null,

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
                        ? currentUser.fullName
                        : "Unknown",

                openedAt:
                    new Date()
                        .toISOString(),

                closedAt:
                    null

            };


            shifts.push(
                newShift
            );


            saveShifts(
                shifts
            );


            showShiftMessage(
                message,
                "Shift created successfully.",
                "success"
            );


            renderShifts();


            setTimeout(
                () => {

                    const modal =
                        document.getElementById(
                            "shiftModal"
                        );


                    if (modal) {

                        modal.classList.add(
                            "hidden"
                        );

                    }


                    resetShiftForm();

                },
                800
            );

        }
    );

}


/* ==========================================
   RENDER SHIFTS
========================================== */

function renderShifts(
    searchTerm = ""
) {

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


    const search =
        searchTerm
            .toLowerCase()
            .trim();


    const filteredShifts =
        shifts.filter(
            shift => {

                const station =
                    stations.find(
                        item =>
                            item.id ===
                            shift.stationId
                    );


                return (

                    shift.name
                        .toLowerCase()
                        .includes(search)

                    ||

                    (
                        station
                            ? station.name
                            : ""
                    )
                        .toLowerCase()
                        .includes(search)

                    ||

                    shift.status
                        .toLowerCase()
                        .includes(search)

                );

            }
        );


    tableBody.innerHTML =
        "";


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
                        b.openedAt
                    ) -
                    new Date(
                        a.openedAt
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


                    const assignedStaffNames =
                        shift.assignedStaff
                            .map(
                                staffId => {

                                    const member =
                                        staff.find(
                                            item =>
                                                item.id ===
                                                staffId
                                        );


                                    return member
                                        ? member.fullName
                                        : "Unknown";

                                }
                            )
                            .join(", ");


                    const row =
                        document.createElement(
                            "tr"
                        );


                    row.innerHTML = `

                        <td>
                            <strong>
                                ${shift.name}
                            </strong>
                        </td>


                        <td>
                            ${
                                station
                                    ? station.name
                                    : "Unknown"
                            }
                        </td>


                        <td>
                            ${shift.startTime}
                            -
                            ${shift.endTime}
                        </td>


                        <td>
                            ${assignedStaffNames}
                        </td>


                        <td>

                            <span
                                class="status-badge ${
                                    shift.status ===
                                    "open"
                                        ? "status-online"
                                        : ""
                                }"
                            >

                                ${
                                    capitalize(
                                        shift.status
                                    )
                                }

                            </span>

                        </td>


                        <td>
                            ${formatShiftDate(
                                shift.openedAt
                            )}
                        </td>


                        <td>

                            ${
                                shift.status ===
                                "open"

                                ? `

                                    <button
                                        type="button"
                                        class="btn btn-outline close-shift-btn"
                                        data-id="${shift.id}"
                                    >
                                        Close Shift
                                    </button>

                                `

                                : `

                                    <span>
                                        Completed
                                    </span>

                                `
                            }

                        </td>

                    `;


                    tableBody.appendChild(
                        row
                    );

                }
            );

    }


    updateShiftStats(
        shifts
    );


    setupCloseShiftButtons();

}


/* ==========================================
   CLOSE SHIFT BUTTONS
========================================== */

function setupCloseShiftButtons() {

    const buttons =
        document.querySelectorAll(
            ".close-shift-btn"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    closeShift(
                        button.dataset.id
                    );

                }
            );

        }
    );

}


/* ==========================================
   CLOSE SHIFT
========================================== */

function closeShift(
    shiftId
) {

    const confirmed =
        confirm(
            "Are you sure you want to close this shift?"
        );


    if (!confirmed) {

        return;

    }


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


    shift.status =
        "closed";


    shift.closedAt =
        new Date()
            .toISOString();


    saveShifts(
        shifts
    );


    renderShifts();

}


/* ==========================================
   SHIFT SEARCH
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
   UPDATE STATS
========================================== */

function updateShiftStats(
    shifts
) {

    const total =
        shifts.length;


    const open =
        shifts.filter(
            shift =>
                shift.status ===
                "open"
        ).length;


    const closed =
        shifts.filter(
            shift =>
                shift.status ===
                "closed"
        ).length;


    const totalElement =
        document.getElementById(
            "totalShifts"
        );


    const openElement =
        document.getElementById(
            "openShifts"
        );


    const closedElement =
        document.getElementById(
            "closedShifts"
        );


    if (totalElement) {

        totalElement.textContent =
            total;

    }


    if (openElement) {

        openElement.textContent =
            open;

    }


    if (closedElement) {

        closedElement.textContent =
            closed;

    }

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
        `form-message ${type}`;

}


/* ==========================================
   FORMAT DATE
========================================== */

function formatShiftDate(
    value
) {

    if (!value) {

        return "-";

    }


    return new Date(
        value
    ).toLocaleString(
        "en-NG",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );

}


/* ==========================================
   CAPITALIZE
========================================== */

function capitalize(
    value
) {

    if (!value) {

        return "";

    }


    return (
        value.charAt(0)
            .toUpperCase() +

        value.slice(1)
    );

}