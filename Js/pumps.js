/* ==========================================
   FUELGAP - PUMPS & NOZZLES MANAGEMENT
========================================== */

const PUMPS_STORAGE_KEY = "fuelgap_pumps";
const NOZZLES_STORAGE_KEY = "fuelgap_nozzles";
const STATIONS_STORAGE_KEY = "fuelgap_stations";


document.addEventListener("DOMContentLoaded", () => {

    const currentUser = FuelGapUtils.getCurrentUser();

    if (!currentUser) {
        window.location.href = "../login.html";
        return;
    }

    if (!hasPermission(currentUser.role, "pumps")) {
        window.location.href = "./dashboard.html";
        return;
    }

    setTimeout(() => {
        renderPumpsPage();
        setupPumpEvents();
        renderPumps();
    }, 0);

});


/* ==========================================
   STORAGE FUNCTIONS
========================================== */

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


function getPumps() {
    try {
        return JSON.parse(
            localStorage.getItem(PUMPS_STORAGE_KEY)
        ) || [];
    } catch (error) {
        console.error("Unable to load pumps:", error);
        return [];
    }
}


function savePumps(pumps) {
    localStorage.setItem(
        PUMPS_STORAGE_KEY,
        JSON.stringify(pumps)
    );
}


function getNozzles() {
    try {
        return JSON.parse(
            localStorage.getItem(NOZZLES_STORAGE_KEY)
        ) || [];
    } catch (error) {
        console.error("Unable to load nozzles:", error);
        return [];
    }
}


function saveNozzles(nozzles) {
    localStorage.setItem(
        NOZZLES_STORAGE_KEY,
        JSON.stringify(nozzles)
    );
}


/* ==========================================
   ACCESS CONTROL
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

        if (currentUser.organizationId) {

            return stations.filter(
                station =>
                    station.organizationId ===
                    currentUser.organizationId
            );

        }

    }

    return [];

}


function getVisiblePumps() {

    const visibleStations =
        getVisibleStations();

    const stationIds =
        visibleStations.map(
            station => station.id
        );

    return getPumps().filter(
        pump =>
            stationIds.includes(
                pump.stationId
            )
    );

}


/* ==========================================
   RENDER PAGE
========================================== */

function renderPumpsPage() {

    const pageContent =
        document.getElementById(
            "pageContent"
        );

    if (!pageContent) {
        console.error("pageContent was not found.");
        return;
    }

    pageContent.innerHTML = `

        <div class="page-header">

            <div>

                <p class="page-eyebrow">
                    FORECOURT MANAGEMENT
                </p>

                <h1>
                    Pumps & Nozzles
                </h1>

                <p>
                    Register and manage fuel pumps
                    and their dispensing nozzles.
                </p>

            </div>

            <button
                type="button"
                class="btn btn-primary"
                id="openPumpModal"
            >
                + Add Pump
            </button>

        </div>


        <section class="pump-stats">

            <div class="pump-stat-card">
                <span>Total Pumps</span>
                <strong id="totalPumps">0</strong>
            </div>

            <div class="pump-stat-card">
                <span>Active Pumps</span>
                <strong id="activePumps">0</strong>
            </div>

            <div class="pump-stat-card">
                <span>Total Nozzles</span>
                <strong id="totalNozzles">0</strong>
            </div>

        </section>


        <section class="pump-section">

            <div class="section-header">

                <div>

                    <h2>
                        Registered Pumps
                    </h2>

                    <p>
                        Pumps connected to
                        your available stations.
                    </p>

                </div>

                <input
                    type="search"
                    id="pumpSearch"
                    placeholder="Search pumps..."
                >

            </div>


            <div class="table-wrapper">

                <table class="pump-table">

                    <thead>

                        <tr>
                            <th>Pump</th>
                            <th>Station</th>
                            <th>Brand</th>
                            <th>Model</th>
                            <th>Nozzles</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>

                    </thead>

                    <tbody id="pumpTableBody"></tbody>

                </table>

            </div>


            <div
                id="emptyPumpState"
                class="empty-state hidden"
            >

                <h3>No pumps registered</h3>

                <p>
                    Add a pump to begin
                    configuring fuel nozzles.
                </p>

            </div>

        </section>


        <!-- ADD PUMP MODAL -->

        <div
            id="pumpModal"
            class="modal hidden"
        >

            <div class="modal-overlay"></div>

            <div class="modal-content">

                <button
                    type="button"
                    id="closePumpModal"
                    class="modal-close"
                >
                    ×
                </button>

                <div class="modal-header">

                    <h2>Add Fuel Pump</h2>

                    <p>
                        Register an existing
                        fuel dispensing pump.
                    </p>

                </div>


                <form id="pumpForm">

                    <div class="form-group">

                        <label>
                            Pump Name / Number
                        </label>

                        <input
                            type="text"
                            name="name"
                            placeholder="Example: Pump 1"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Fuel Station
                        </label>

                        <select
                            name="stationId"
                            id="pumpStation"
                            required
                        >

                            <option value="">
                                Select station
                            </option>

                        </select>

                    </div>


                    <div class="form-group">

                        <label>
                            Pump Brand
                        </label>

                        <input
                            type="text"
                            name="brand"
                            placeholder="Example: China, Wayne, Gilbarco"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Pump Model
                        </label>

                        <input
                            type="text"
                            name="model"
                            placeholder="Enter pump model"
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Pump Type
                        </label>

                        <select
                            name="pumpType"
                            required
                        >

                            <option value="">
                                Select pump type
                            </option>

                            <option value="mechanical">
                                Mechanical / Old Pump
                            </option>

                            <option value="digital">
                                Digital Pump
                            </option>

                        </select>

                    </div>


                    <div class="form-group">

                        <label>
                            Number of Nozzles
                        </label>

                        <input
                            type="number"
                            name="nozzleCount"
                            min="1"
                            max="20"
                            value="1"
                            required
                        >

                    </div>


                    <div
                        id="pumpMessage"
                        class="form-message hidden"
                    ></div>


                    <button
                        type="submit"
                        class="btn btn-primary"
                    >
                        Create Pump
                    </button>

                </form>

            </div>

        </div>


        <!-- ADD NOZZLE MODAL -->

        <div
            id="nozzleModal"
            class="modal hidden"
        >

            <div class="modal-overlay"></div>

            <div class="modal-content">

                <button
                    type="button"
                    id="closeNozzleModal"
                    class="modal-close"
                >
                    ×
                </button>


                <div class="modal-header">

                    <h2>Add Nozzle</h2>

                    <p>
                        Configure a dispensing
                        nozzle for this pump.
                    </p>

                </div>


                <form id="nozzleForm">

                    <input
                        type="hidden"
                        id="nozzlePumpId"
                        name="pumpId"
                    >


                    <div class="form-group">

                        <label>
                            Nozzle Name / Number
                        </label>

                        <input
                            type="text"
                            name="name"
                            placeholder="Example: Nozzle 1"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Fuel Product
                        </label>

                        <select
                            name="product"
                            required
                        >

                            <option value="">
                                Select product
                            </option>

                            <option value="PMS">
                                PMS
                            </option>

                            <option value="AGO">
                                AGO / Diesel
                            </option>

                            <option value="DPK">
                                DPK / Kerosene
                            </option>

                        </select>

                    </div>


                    <div class="form-group">

                        <label>
                            Current Meter Reading
                        </label>

                        <input
                            type="number"
                            name="currentMeterReading"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            required
                        >

                    </div>


                    <div
                        id="nozzleMessage"
                        class="form-message hidden"
                    ></div>


                    <button
                        type="submit"
                        class="btn btn-primary"
                    >
                        Add Nozzle
                    </button>

                </form>

            </div>

        </div>

    `;

}


/* ==========================================
   SETUP EVENTS
========================================== */

function setupPumpEvents() {

    setupPumpModal();

    setupPumpForm();

    setupPumpSearch();

    setupNozzleModal();

    setupNozzleForm();

}


/* ==========================================
   PUMP MODAL
========================================== */

function setupPumpModal() {

    const modal =
        document.getElementById(
            "pumpModal"
        );

    const openButton =
        document.getElementById(
            "openPumpModal"
        );

    const closeButton =
        document.getElementById(
            "closePumpModal"
        );

    if (!modal) return;


    if (openButton) {

        openButton.addEventListener(
            "click",
            () => {

                loadStationsIntoPumpSelect();

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


    const overlay =
        modal.querySelector(
            ".modal-overlay"
        );

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
   LOAD STATIONS
========================================== */

function loadStationsIntoPumpSelect() {

    const select =
        document.getElementById(
            "pumpStation"
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
                document.createElement(
                    "option"
                );

            option.value =
                station.id;

            option.textContent =
                station.name;

            select.appendChild(
                option
            );

        }
    );

}


/* ==========================================
   CREATE PUMP
========================================== */

function setupPumpForm() {

    const form =
        document.getElementById(
            "pumpForm"
        );

    if (!form) return;


    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const name =
                form.elements["name"]
                    .value
                    .trim();

            const stationId =
                form.elements["stationId"]
                    .value;

            const brand =
                form.elements["brand"]
                    .value
                    .trim();

            const model =
                form.elements["model"]
                    .value
                    .trim();

            const pumpType =
                form.elements["pumpType"]
                    .value;

            const nozzleCount =
                Number(
                    form.elements["nozzleCount"]
                        .value
                );

            const message =
                document.getElementById(
                    "pumpMessage"
                );


            if (
                !name ||
                !stationId ||
                !brand ||
                !pumpType ||
                nozzleCount < 1
            ) {

                showPumpMessage(
                    message,
                    "Please complete all required fields.",
                    "error"
                );

                return;

            }


            const pumps =
                getPumps();


            const existingPump =
                pumps.find(
                    pump =>
                        pump.stationId ===
                        stationId &&
                        pump.name
                            .toLowerCase() ===
                        name.toLowerCase()
                );


            if (existingPump) {

                showPumpMessage(
                    message,
                    "This pump already exists in the selected station.",
                    "error"
                );

                return;

            }


            const station =
                getStations().find(
                    item =>
                        item.id ===
                        stationId
                );


            const newPump = {

                id:
                    `PUMP-${Date.now()}-${Math.floor(
                        Math.random() * 1000
                    )}`,

                organizationId:
                    station
                        ? station.organizationId
                        : null,

                name,

                stationId,

                brand,

                model,

                pumpType,

                nozzleCount,

                status: "active",

                createdAt:
                    new Date()
                        .toISOString()

            };


            pumps.push(
                newPump
            );

            savePumps(
                pumps
            );


            showPumpMessage(
                message,
                "Pump created successfully. You can now add nozzles.",
                "success"
            );


            renderPumps();


            setTimeout(
                () => {

                    form.reset();

                    document
                        .getElementById(
                            "pumpModal"
                        )
                        .classList.add(
                            "hidden"
                        );

                },
                700
            );

        }
    );

}


/* ==========================================
   NOZZLE MODAL
========================================== */

function setupNozzleModal() {

    const modal =
        document.getElementById(
            "nozzleModal"
        );

    const closeButton =
        document.getElementById(
            "closeNozzleModal"
        );

    if (!modal) return;


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


    const overlay =
        modal.querySelector(
            ".modal-overlay"
        );

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
   OPEN NOZZLE MODAL
========================================== */

function openNozzleModal(pumpId) {

    const modal =
        document.getElementById(
            "nozzleModal"
        );

    const pumpInput =
        document.getElementById(
            "nozzlePumpId"
        );

    const form =
        document.getElementById(
            "nozzleForm"
        );

    const message =
        document.getElementById(
            "nozzleMessage"
        );


    if (!modal || !pumpInput) {

        console.error(
            "Nozzle modal or pump ID input was not found."
        );

        return;

    }


    if (form) {

        form.reset();

    }


    /* IMPORTANT:
       Set pump ID AFTER form.reset()
    */

    pumpInput.value =
        pumpId;


    if (message) {

        message.textContent =
            "";

        message.className =
            "form-message hidden";

    }


    modal.classList.remove(
        "hidden"
    );

}


/* ==========================================
   CREATE NOZZLE
========================================== */

function setupNozzleForm() {

    const form =
        document.getElementById(
            "nozzleForm"
        );

    if (!form) {

        console.error(
            "Nozzle form was not found."
        );

        return;

    }


    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const pumpInput =
                document.getElementById(
                    "nozzlePumpId"
                );

            const nameInput =
                form.querySelector(
                    '[name="name"]'
                );

            const productInput =
                form.querySelector(
                    '[name="product"]'
                );

            const meterInput =
                form.querySelector(
                    '[name="currentMeterReading"]'
                );

            const message =
                document.getElementById(
                    "nozzleMessage"
                );


            const pumpId =
                pumpInput
                    ? pumpInput.value.trim()
                    : "";

            const name =
                nameInput
                    ? nameInput.value.trim()
                    : "";

            const product =
                productInput
                    ? productInput.value
                    : "";

            const meterValue =
                meterInput
                    ? meterInput.value.trim()
                    : "";

            const currentMeterReading =
                Number(meterValue);


            /* VALIDATION */

            if (!pumpId) {

                showPumpMessage(
                    message,
                    "Pump was not selected. Close this window and click + Nozzle again.",
                    "error"
                );

                return;

            }


            if (!name) {

                showPumpMessage(
                    message,
                    "Please enter the nozzle name or number.",
                    "error"
                );

                return;

            }


            if (!product) {

                showPumpMessage(
                    message,
                    "Please select the fuel product.",
                    "error"
                );

                return;

            }


            if (
                meterValue === "" ||
                Number.isNaN(
                    currentMeterReading
                ) ||
                currentMeterReading < 0
            ) {

                showPumpMessage(
                    message,
                    "Please enter a valid current meter reading.",
                    "error"
                );

                return;

            }


            /* FIND PUMP */

            const pumps =
                getPumps();

            const pump =
                pumps.find(
                    item =>
                        item.id ===
                        pumpId
                );


            if (!pump) {

                showPumpMessage(
                    message,
                    "The selected pump could not be found.",
                    "error"
                );

                return;

            }


            /* GET NOZZLES */

            const nozzles =
                getNozzles();


            /* CHECK DUPLICATE */

            const existingNozzle =
                nozzles.find(
                    nozzle =>
                        nozzle.pumpId ===
                        pumpId &&
                        nozzle.name
                            .toLowerCase() ===
                        name.toLowerCase()
                );


            if (existingNozzle) {

                showPumpMessage(
                    message,
                    "This nozzle already exists on this pump.",
                    "error"
                );

                return;

            }


            /* CHECK NOZZLE LIMIT */

            const pumpNozzles =
                nozzles.filter(
                    nozzle =>
                        nozzle.pumpId ===
                        pumpId
                );


            if (
                pump.nozzleCount &&
                pumpNozzles.length >=
                Number(pump.nozzleCount)
            ) {

                showPumpMessage(
                    message,
                    `This pump has reached its configured nozzle limit of ${pump.nozzleCount}.`,
                    "error"
                );

                return;

            }


            /* CREATE NOZZLE */

            const newNozzle = {

                id:
                    `NOZ-${Date.now()}-${Math.floor(
                        Math.random() * 1000
                    )}`,

                organizationId:
                    pump.organizationId ||
                    null,

                stationId:
                    pump.stationId,

                pumpId,

                name,

                product,

                currentMeterReading,

                status: "active",

                createdAt:
                    new Date()
                        .toISOString()

            };


            /* SAVE */

            nozzles.push(
                newNozzle
            );

            saveNozzles(
                nozzles
            );


            console.log(
                "Nozzle saved:",
                newNozzle
            );


            showPumpMessage(
                message,
                "Nozzle added successfully.",
                "success"
            );


            renderPumps();


            setTimeout(
                () => {

                    form.reset();

                    const modal =
                        document.getElementById(
                            "nozzleModal"
                        );

                    if (modal) {

                        modal.classList.add(
                            "hidden"
                        );

                    }

                },
                700
            );

        }
    );

}


/* ==========================================
   RENDER PUMPS
========================================== */

function renderPumps(searchTerm = "") {

    const pumps =
        getVisiblePumps();

    const stations =
        getStations();

    const nozzles =
        getNozzles();

    const tableBody =
        document.getElementById(
            "pumpTableBody"
        );

    const emptyState =
        document.getElementById(
            "emptyPumpState"
        );

    if (!tableBody) return;


    const search =
        searchTerm
            .toLowerCase()
            .trim();


    const filteredPumps =
        pumps.filter(
            pump =>
                (pump.name || "")
                    .toLowerCase()
                    .includes(search) ||

                (pump.brand || "")
                    .toLowerCase()
                    .includes(search)
        );


    tableBody.innerHTML = "";


    if (
        filteredPumps.length === 0
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


        filteredPumps.forEach(
            pump => {

                const station =
                    stations.find(
                        item =>
                            item.id ===
                            pump.stationId
                    );


                const pumpNozzles =
                    nozzles.filter(
                        nozzle =>
                            nozzle.pumpId ===
                            pump.id
                    );


                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>${pump.name}</td>

                    <td>
                        ${
                            station
                                ? station.name
                                : "Unknown"
                        }
                    </td>

                    <td>${pump.brand}</td>

                    <td>
                        ${pump.model || "-"}
                    </td>

                    <td>
                        ${pumpNozzles.length}
                        /
                        ${pump.nozzleCount}
                    </td>

                    <td>
                        <span
                            class="status-badge ${pump.status}"
                        >
                            ${capitalize(pump.status)}
                        </span>
                    </td>

                    <td>

                        <button
                            type="button"
                            class="add-nozzle-btn"
                            data-id="${pump.id}"
                        >
                            + Nozzle
                        </button>

                        <button
                            type="button"
                            class="delete-pump-btn"
                            data-id="${pump.id}"
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


    updatePumpStats(
        pumps,
        nozzles
    );


    setupPumpActionButtons();

}


/* ==========================================
   PUMP STATISTICS
========================================== */

function updatePumpStats(
    pumps,
    nozzles
) {

    const totalPumps =
        pumps.length;


    const activePumps =
        pumps.filter(
            pump =>
                pump.status ===
                "active"
        ).length;


    const pumpIds =
        pumps.map(
            pump =>
                pump.id
        );


    const visibleNozzles =
        nozzles.filter(
            nozzle =>
                pumpIds.includes(
                    nozzle.pumpId
                )
        );


    const totalPumpsElement =
        document.getElementById(
            "totalPumps"
        );

    const activePumpsElement =
        document.getElementById(
            "activePumps"
        );

    const totalNozzlesElement =
        document.getElementById(
            "totalNozzles"
        );


    if (totalPumpsElement) {

        totalPumpsElement.textContent =
            totalPumps;

    }


    if (activePumpsElement) {

        activePumpsElement.textContent =
            activePumps;

    }


    if (totalNozzlesElement) {

        totalNozzlesElement.textContent =
            visibleNozzles.length;

    }

}


/* ==========================================
   PUMP ACTION BUTTONS
========================================== */

function setupPumpActionButtons() {

    const nozzleButtons =
        document.querySelectorAll(
            ".add-nozzle-btn"
        );

    const deleteButtons =
        document.querySelectorAll(
            ".delete-pump-btn"
        );


    nozzleButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    openNozzleModal(
                        button.dataset.id
                    );

                }
            );

        }
    );


    deleteButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    removePump(
                        button.dataset.id
                    );

                }
            );

        }
    );

}


/* ==========================================
   REMOVE PUMP
========================================== */

function removePump(pumpId) {

    const confirmed =
        confirm(
            "Removing this pump will also remove all its nozzles. Continue?"
        );

    if (!confirmed) return;


    let pumps =
        getPumps();

    let nozzles =
        getNozzles();


    pumps =
        pumps.filter(
            pump =>
                pump.id !==
                pumpId
        );


    nozzles =
        nozzles.filter(
            nozzle =>
                nozzle.pumpId !==
                pumpId
        );


    savePumps(
        pumps
    );

    saveNozzles(
        nozzles
    );


    renderPumps();

}


/* ==========================================
   SEARCH
========================================== */

function setupPumpSearch() {

    const searchInput =
        document.getElementById(
            "pumpSearch"
        );

    if (!searchInput) return;


    searchInput.addEventListener(
        "input",
        event => {

            renderPumps(
                event.target.value
            );

        }
    );

}


/* ==========================================
   MESSAGE
========================================== */

function showPumpMessage(
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
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );

}