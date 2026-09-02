/* ==========================================
   FUELGAP - PROFESSIONAL PUMPS & NOZZLES
========================================== */

const PUMPS_STORAGE_KEY = "fuelgap_pumps";
const NOZZLES_STORAGE_KEY = "fuelgap_nozzles";
const STATIONS_STORAGE_KEY = "fuelgap_stations";


/* ==========================================
   INITIALIZATION
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    const currentUser = FuelGapUtils.getCurrentUser();

    if (!currentUser) {
        window.location.href = "../login.html";
        return;
    }

    if (
        typeof hasPermission === "function" &&
        !hasPermission(currentUser.role, "pumps")
    ) {
        window.location.href = "./dashboard.html";
        return;
    }

    injectPumpsStyles();
    renderPumpsPage();
    setupPumpEvents();
    renderPumps();

});


/* ==========================================
   STORAGE
========================================== */

function getStations() {
    try {
        return JSON.parse(
            localStorage.getItem(STATIONS_STORAGE_KEY)
        ) || [];
    } catch (error) {
        return [];
    }
}


function getPumps() {
    try {
        return JSON.parse(
            localStorage.getItem(PUMPS_STORAGE_KEY)
        ) || [];
    } catch (error) {
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
   ROLE BASED VISIBILITY
========================================== */

function getVisibleStations() {

    const currentUser = FuelGapUtils.getCurrentUser();
    const stations = getStations();

    if (!currentUser) return [];

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
                    station.id === currentUser.stationId
            );
        }

        return stations.filter(
            station =>
                station.organizationId ===
                currentUser.organizationId
        );
    }

    return [];

}


function getVisiblePumps() {

    const stationIds = getVisibleStations().map(
        station => station.id
    );

    return getPumps().filter(
        pump => stationIds.includes(pump.stationId)
    );

}


/* ==========================================
   ICONS
========================================== */

function pumpIcon(name) {

    const icons = {

        pump: `
            <svg viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round">
                <path d="M4 22V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v17"/>
                <path d="M4 10h11"/>
                <path d="M8 3v7"/>
                <path d="M17 7h1a3 3 0 0 1 3 3v12"/>
                <path d="M17 22v-8"/>
            </svg>
        `,

        nozzle: `
            <svg viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2">
                <path d="M6 3h9v6H6z"/>
                <path d="M9 9v5"/>
                <path d="M7 14h4"/>
                <path d="M5 14v7"/>
                <path d="M5 21h6"/>
                <path d="M15 5h2a3 3 0 0 1 3 3v6"/>
                <path d="M20 14v7"/>
            </svg>
        `,

        plus: `
            <svg viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2.5"
                stroke-linecap="round">
                <path d="M12 5v14"/>
                <path d="M5 12h14"/>
            </svg>
        `,

        search: `
            <svg viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="7"/>
                <path d="m20 20-4-4"/>
            </svg>
        `,

        station: `
            <svg viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2">
                <path d="M3 21V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16"/>
                <path d="M7 7h.01"/>
                <path d="M11 7h.01"/>
                <path d="M15 7h.01"/>
                <path d="M7 11h.01"/>
                <path d="M11 11h.01"/>
                <path d="M15 11h.01"/>
                <path d="M9 21v-5h6v5"/>
            </svg>
        `,

        check: `
            <svg viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2.5">
                <path d="M20 6 9 17l-5-5"/>
            </svg>
        `,

        meter: `
            <svg viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2">
                <path d="M4 19a8 8 0 1 1 16 0"/>
                <path d="M12 11l3-3"/>
                <path d="M12 15v.01"/>
            </svg>
        `,

        filter: `
            <svg viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2">
                <path d="M4 6h16"/>
                <path d="M7 12h10"/>
                <path d="M10 18h4"/>
            </svg>
        `,

        close: `
            <svg viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2.5">
                <path d="M18 6 6 18"/>
                <path d="m6 6 12 12"/>
            </svg>
        `,

        trash: `
            <svg viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2">
                <path d="M3 6h18"/>
                <path d="M8 6V4h8v2"/>
                <path d="M19 6l-1 14H6L5 6"/>
            </svg>
        `

    };

    return icons[name] || "";

}


/* ==========================================
   RENDER PAGE
========================================== */

function renderPumpsPage() {

    const pageContent =
        document.getElementById("pageContent");

    if (!pageContent) return;

    pageContent.innerHTML = `

        <div class="fg-pumps-page">

            <div class="fg-pumps-header">

                <div class="fg-pumps-title-group">

                    <div class="fg-pumps-page-icon">
                        ${pumpIcon("pump")}
                    </div>

                    <div>

                        <div class="fg-pumps-breadcrumb">
                            FORECOURT MANAGEMENT
                            <span>/</span>
                            EQUIPMENT
                        </div>

                        <h1>Pumps & Nozzles</h1>

                        <p>
                            Manage fuel dispensing pumps,
                            nozzles and equipment configuration.
                        </p>

                    </div>

                </div>

                <button
                    id="openPumpModal"
                    class="fg-pumps-primary-btn"
                >
                    ${pumpIcon("plus")}
                    Add Pump
                </button>

            </div>


            <section class="fg-pump-metrics">

                <div class="fg-pump-metric-card">

                    <div class="fg-pump-metric-icon fg-pump-icon-dark">
                        ${pumpIcon("pump")}
                    </div>

                    <div>
                        <span>Total Pumps</span>
                        <strong id="totalPumps">0</strong>
                        <small>Registered equipment</small>
                    </div>

                </div>


                <div class="fg-pump-metric-card">

                    <div class="fg-pump-metric-icon fg-pump-icon-green">
                        ${pumpIcon("check")}
                    </div>

                    <div>
                        <span>Active Pumps</span>
                        <strong id="activePumps">0</strong>
                        <small>Currently operational</small>
                    </div>

                </div>


                <div class="fg-pump-metric-card">

                    <div class="fg-pump-metric-icon fg-pump-icon-yellow">
                        ${pumpIcon("nozzle")}
                    </div>

                    <div>
                        <span>Total Nozzles</span>
                        <strong id="totalNozzles">0</strong>
                        <small>Configured dispensing points</small>
                    </div>

                </div>


                <div class="fg-pump-metric-card">

                    <div class="fg-pump-metric-icon fg-pump-icon-gray">
                        ${pumpIcon("meter")}
                    </div>

                    <div>
                        <span>Nozzle Capacity</span>
                        <strong id="nozzleCapacity">0%</strong>
                        <small>Configured capacity usage</small>
                    </div>

                </div>

            </section>


            <section class="fg-pumps-panel">

                <div class="fg-pumps-panel-header">

                    <div>
                        <h2>Pump Directory</h2>

                        <p>
                            View and configure pumps
                            across your fuel stations.
                        </p>
                    </div>

                    <div class="fg-pumps-count">
                        <span id="visiblePumpCount">0</span>
                        Pumps
                    </div>

                </div>


                <div class="fg-pumps-toolbar">

                    <div class="fg-pumps-search">

                        ${pumpIcon("search")}

                        <input
                            type="search"
                            id="pumpSearch"
                            placeholder="Search pump, brand or station..."
                        >

                    </div>


                    <div class="fg-pumps-filter">

                        ${pumpIcon("filter")}

                        <select id="pumpStatusFilter">
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>

                    </div>

                </div>


                <div class="fg-pumps-table-wrapper">

                    <table class="fg-pumps-table">

                        <thead>

                            <tr>
                                <th>Pump</th>
                                <th>Station</th>
                                <th>Equipment</th>
                                <th>Nozzles</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>

                        </thead>

                        <tbody id="pumpTableBody"></tbody>

                    </table>

                </div>


                <div
                    id="emptyPumpState"
                    class="fg-pumps-empty hidden"
                >

                    <div class="fg-pumps-empty-icon">
                        ${pumpIcon("pump")}
                    </div>

                    <h3>No pumps found</h3>

                    <p>
                        Start configuring your forecourt
                        by registering your first fuel pump.
                    </p>

                    <button
                        id="emptyAddPump"
                        class="fg-pumps-primary-btn"
                    >
                        ${pumpIcon("plus")}
                        Add First Pump
                    </button>

                </div>

            </section>


            <!-- ADD PUMP MODAL -->

            <div
                id="pumpModal"
                class="fg-pumps-modal hidden"
            >

                <div class="fg-pumps-modal-overlay"></div>

                <div class="fg-pumps-modal-content">

                    <div class="fg-pumps-modal-header">

                        <div>

                            <span>EQUIPMENT SETUP</span>

                            <h2>Add Fuel Pump</h2>

                            <p>
                                Register an existing dispensing
                                pump and configure its capacity.
                            </p>

                        </div>

                        <button
                            id="closePumpModal"
                            class="fg-pumps-modal-close"
                        >
                            ${pumpIcon("close")}
                        </button>

                    </div>


                    <form id="pumpForm">

                        <div class="fg-pumps-form-grid">

                            <div class="fg-pumps-form-group fg-pumps-full">

                                <label>Pump Name / Number</label>

                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Example: Pump 1"
                                    required
                                >

                            </div>


                            <div class="fg-pumps-form-group fg-pumps-full">

                                <label>Fuel Station</label>

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


                            <div class="fg-pumps-form-group">

                                <label>Pump Brand</label>

                                <input
                                    type="text"
                                    name="brand"
                                    placeholder="Example: Wayne"
                                    required
                                >

                            </div>


                            <div class="fg-pumps-form-group">

                                <label>Pump Model</label>

                                <input
                                    type="text"
                                    name="model"
                                    placeholder="Enter model"
                                >

                            </div>


                            <div class="fg-pumps-form-group">

                                <label>Number of Nozzles</label>

                                <input
                                    type="number"
                                    name="nozzleCount"
                                    min="1"
                                    max="20"
                                    value="1"
                                    required
                                >

                            </div>

                        </div>


                        <div
                            id="pumpMessage"
                            class="fg-pumps-message hidden"
                        ></div>


                        <div class="fg-pumps-modal-footer">

                            <button
                                type="button"
                                id="cancelPumpModal"
                                class="fg-pumps-secondary-btn"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                class="fg-pumps-primary-btn"
                            >
                                ${pumpIcon("plus")}
                                Create Pump
                            </button>

                        </div>

                    </form>

                </div>

            </div>


            <!-- ADD NOZZLE MODAL -->

            <div
                id="nozzleModal"
                class="fg-pumps-modal hidden"
            >

                <div class="fg-pumps-modal-overlay"></div>

                <div class="fg-pumps-modal-content">

                    <div class="fg-pumps-modal-header">

                        <div>

                            <span>DISPENSING CONFIGURATION</span>

                            <h2>Add Nozzle</h2>

                            <p>
                                Configure a nozzle for the selected pump.
                            </p>

                        </div>

                        <button
                            id="closeNozzleModal"
                            class="fg-pumps-modal-close"
                        >
                            ${pumpIcon("close")}
                        </button>

                    </div>


                    <form id="nozzleForm">

                        <input
                            type="hidden"
                            id="nozzlePumpId"
                        >


                        <div class="fg-pumps-form-grid">

                            <div class="fg-pumps-form-group">

                                <label>Nozzle Name / Number</label>

                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Example: Nozzle 1"
                                    required
                                >

                            </div>


                            <div class="fg-pumps-form-group">

                                <label>Fuel Product</label>

                                <select
                                    name="product"
                                    required
                                >
                                    <option value="">
                                        Select product
                                    </option>
                                    <option value="PMS">PMS</option>
                                    <option value="AGO">AGO / Diesel</option>
                                    <option value="DPK">DPK / Kerosene</option>
                                </select>

                            </div>


                            <div class="fg-pumps-form-group fg-pumps-full">

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

                        </div>


                        <div
                            id="nozzleMessage"
                            class="fg-pumps-message hidden"
                        ></div>


                        <div class="fg-pumps-modal-footer">

                            <button
                                type="button"
                                id="cancelNozzleModal"
                                class="fg-pumps-secondary-btn"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                class="fg-pumps-primary-btn"
                            >
                                ${pumpIcon("plus")}
                                Add Nozzle
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

function setupPumpEvents() {

    document
        .getElementById("openPumpModal")
        ?.addEventListener(
            "click",
            openPumpModal
        );

    document
        .getElementById("emptyAddPump")
        ?.addEventListener(
            "click",
            openPumpModal
        );

    document
        .getElementById("closePumpModal")
        ?.addEventListener(
            "click",
            closePumpModal
        );

    document
        .getElementById("cancelPumpModal")
        ?.addEventListener(
            "click",
            closePumpModal
        );

    document
        .getElementById("closeNozzleModal")
        ?.addEventListener(
            "click",
            closeNozzleModal
        );

    document
        .getElementById("cancelNozzleModal")
        ?.addEventListener(
            "click",
            closeNozzleModal
        );

    document
        .querySelectorAll(
            ".fg-pumps-modal-overlay"
        )
        .forEach(
            overlay =>
                overlay.addEventListener(
                    "click",
                    () => {
                        closePumpModal();
                        closeNozzleModal();
                    }
                )
        );

    document
        .getElementById("pumpSearch")
        ?.addEventListener(
            "input",
            renderPumps
        );

    document
        .getElementById("pumpStatusFilter")
        ?.addEventListener(
            "change",
            renderPumps
        );

    setupPumpForm();
    setupNozzleForm();

}


/* ==========================================
   MODALS
========================================== */

function openPumpModal() {

    loadStationsIntoPumpSelect();

    document
        .getElementById("pumpModal")
        ?.classList.remove("hidden");

    document.body.style.overflow = "hidden";

}


function closePumpModal() {

    document
        .getElementById("pumpModal")
        ?.classList.add("hidden");

    document.body.style.overflow = "";

}


function openNozzleModal(pumpId) {

    const form =
        document.getElementById("nozzleForm");

    form?.reset();

    document.getElementById(
        "nozzlePumpId"
    ).value = pumpId;

    document
        .getElementById("nozzleModal")
        ?.classList.remove("hidden");

    document.body.style.overflow = "hidden";

}


function closeNozzleModal() {

    document
        .getElementById("nozzleModal")
        ?.classList.add("hidden");

    document.body.style.overflow = "";

}


/* ==========================================
   LOAD STATIONS
========================================== */

function loadStationsIntoPumpSelect() {

    const select =
        document.getElementById("pumpStation");

    if (!select) return;

    select.innerHTML =
        `<option value="">Select station</option>`;

    getVisibleStations().forEach(
        station => {

            const option =
                document.createElement("option");

            option.value = station.id;
            option.textContent = station.name;

            select.appendChild(option);

        }
    );

}


/* ==========================================
   CREATE PUMP
========================================== */

function setupPumpForm() {

    const form =
        document.getElementById("pumpForm");

    if (!form) return;

    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const name =
                form.elements.name.value.trim();

            const stationId =
                form.elements.stationId.value;

            const brand =
                form.elements.brand.value.trim();

            const model =
                form.elements.model.value.trim();

            const nozzleCount =
                Number(
                    form.elements.nozzleCount.value
                );

            const message =
                document.getElementById("pumpMessage");

            if (
                !name ||
                !stationId ||
                !brand ||
                nozzleCount < 1
            ) {
                showPumpMessage(
                    message,
                    "Please complete all required fields.",
                    "error"
                );
                return;
            }

            const pumps = getPumps();

            const duplicate =
                pumps.find(
                    pump =>
                        pump.stationId === stationId &&
                        pump.name
                            .toLowerCase() ===
                        name.toLowerCase()
                );

            if (duplicate) {
                showPumpMessage(
                    message,
                    "This pump already exists in this station.",
                    "error"
                );
                return;
            }

            const station =
                getStations().find(
                    item => item.id === stationId
                );

            pumps.push({
                id: `PUMP-${Date.now()}`,
                organizationId:
                    station?.organizationId || null,
                name,
                stationId,
                brand,
                model,
                nozzleCount,
                status: "active",
                createdAt:
                    new Date().toISOString()
            });

            savePumps(pumps);

            form.reset();

            closePumpModal();

            renderPumps();

        }
    );

}


/* ==========================================
   CREATE NOZZLE
========================================== */

function setupNozzleForm() {

    const form =
        document.getElementById("nozzleForm");

    if (!form) return;

    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const pumpId =
                document.getElementById(
                    "nozzlePumpId"
                ).value;

            const name =
                form.elements.name.value.trim();

            const product =
                form.elements.product.value;

            const currentMeterReading =
                Number(
                    form.elements
                        .currentMeterReading
                        .value
                );

            const pumps = getPumps();

            const pump =
                pumps.find(
                    item => item.id === pumpId
                );

            if (!pump) return;

            const nozzles =
                getNozzles();

            const pumpNozzles =
                nozzles.filter(
                    nozzle =>
                        nozzle.pumpId === pumpId
                );

            if (
                pumpNozzles.length >=
                Number(pump.nozzleCount)
            ) {
                alert(
                    `This pump has reached its nozzle limit of ${pump.nozzleCount}.`
                );
                return;
            }

            nozzles.push({
                id: `NOZ-${Date.now()}`,
                organizationId:
                    pump.organizationId,
                stationId:
                    pump.stationId,
                pumpId,
                name,
                product,
                currentMeterReading,
                status: "active",
                createdAt:
                    new Date().toISOString()
            });

            saveNozzles(nozzles);

            form.reset();

            closeNozzleModal();

            renderPumps();

        }
    );

}


/* ==========================================
   RENDER PUMPS
========================================== */

function renderPumps() {

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
        document
            .getElementById("pumpSearch")
            ?.value
            .toLowerCase()
            .trim() || "";

    const status =
        document
            .getElementById(
                "pumpStatusFilter"
            )
            ?.value || "";

    const filteredPumps =
        pumps.filter(
            pump => {

                const station =
                    stations.find(
                        item =>
                            item.id ===
                            pump.stationId
                    );

                const searchText = `
                    ${pump.name}
                    ${pump.brand}
                    ${pump.model}
                    ${station?.name || ""}
                `.toLowerCase();

                return (
                    searchText.includes(search) &&
                    (
                        !status ||
                        pump.status === status
                    )
                );

            }
        );

    tableBody.innerHTML = "";

    document.getElementById(
        "visiblePumpCount"
    ).textContent =
        filteredPumps.length;

    if (!filteredPumps.length) {

        emptyState?.classList.remove(
            "hidden"
        );

    } else {

        emptyState?.classList.add(
            "hidden"
        );

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

                const capacity =
                    Number(
                        pump.nozzleCount
                    ) || 0;

                const percentage =
                    capacity
                        ? Math.round(
                            (
                                pumpNozzles.length /
                                capacity
                            ) * 100
                        )
                        : 0;

                const row =
                    document.createElement("tr");

                row.innerHTML = `

                    <td>

                        <div class="fg-pump-identity">

                            <div class="fg-pump-avatar">
                                ${getPumpInitials(pump.name)}
                            </div>

                            <div>
                                <strong>
                                    ${escapePumpHtml(pump.name)}
                                </strong>

                                <span>
                                    ${escapePumpHtml(pump.id)}
                                </span>
                            </div>

                        </div>

                    </td>


                    <td>

                        <div class="fg-pump-station">

                            <span>
                                ${pumpIcon("station")}
                            </span>

                            <div>
                                ${escapePumpHtml(
                                    station?.name ||
                                    "Unknown Station"
                                )}
                            </div>

                        </div>

                    </td>


                    <td>

                        <div class="fg-pump-equipment">

                            <strong>
                                ${escapePumpHtml(
                                    pump.brand
                                )}
                            </strong>

                            <span>
                                ${escapePumpHtml(
                                    pump.model ||
                                    "Model not specified"
                                )}
                            </span>

                        </div>

                    </td>


                    <td>

                        <div class="fg-nozzle-capacity">

                            <strong>
                                ${pumpNozzles.length}
                                /
                                ${capacity}
                            </strong>

                            <small>
                                Configured
                            </small>

                            <div class="fg-capacity-track">

                                <span
                                    style="
                                        width:
                                        ${Math.min(
                                            percentage,
                                            100
                                        )}%
                                    "
                                ></span>

                            </div>

                        </div>

                    </td>


                    <td>

                        <span
                            class="
                                fg-pump-status
                                ${
                                    pump.status === "active"
                                        ? "fg-pump-active"
                                        : "fg-pump-inactive"
                                }
                            "
                        >

                            <i></i>

                            ${capitalize(pump.status)}

                        </span>

                    </td>


                    <td>

                        <div class="fg-pump-actions">

                            <button
                                class="
                                    fg-add-nozzle-btn
                                    add-nozzle-btn
                                "
                                data-id="${pump.id}"
                            >
                                ${pumpIcon("nozzle")}
                                Nozzle
                            </button>


                            <button
                                class="
                                    fg-delete-pump-btn
                                    delete-pump-btn
                                "
                                data-id="${pump.id}"
                            >
                                ${pumpIcon("trash")}
                            </button>

                        </div>

                    </td>

                `;

                tableBody.appendChild(row);

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
   ACTION BUTTONS
========================================== */

function setupPumpActionButtons() {

    document
        .querySelectorAll(
            ".add-nozzle-btn"
        )
        .forEach(
            button => {

                button.onclick = () =>
                    openNozzleModal(
                        button.dataset.id
                    );

            }
        );


    document
        .querySelectorAll(
            ".delete-pump-btn"
        )
        .forEach(
            button => {

                button.onclick = () =>
                    removePump(
                        button.dataset.id
                    );

            }
        );

}


/* ==========================================
   DELETE PUMP
========================================== */

function removePump(pumpId) {

    if (
        !confirm(
            "Removing this pump will also remove all its nozzles. Continue?"
        )
    ) {
        return;
    }

    savePumps(
        getPumps().filter(
            pump =>
                pump.id !== pumpId
        )
    );

    saveNozzles(
        getNozzles().filter(
            nozzle =>
                nozzle.pumpId !== pumpId
        )
    );

    renderPumps();

}


/* ==========================================
   STATISTICS
========================================== */

function updatePumpStats(
    pumps,
    nozzles
) {

    const pumpIds =
        pumps.map(
            pump => pump.id
        );

    const visibleNozzles =
        nozzles.filter(
            nozzle =>
                pumpIds.includes(
                    nozzle.pumpId
                )
        );

    const totalCapacity =
        pumps.reduce(
            (total, pump) =>
                total +
                Number(
                    pump.nozzleCount || 0
                ),
            0
        );

    const capacityRate =
        totalCapacity
            ? Math.round(
                (
                    visibleNozzles.length /
                    totalCapacity
                ) * 100
            )
            : 0;

    document.getElementById(
        "totalPumps"
    ).textContent =
        pumps.length;

    document.getElementById(
        "activePumps"
    ).textContent =
        pumps.filter(
            pump =>
                pump.status === "active"
        ).length;

    document.getElementById(
        "totalNozzles"
    ).textContent =
        visibleNozzles.length;

    document.getElementById(
        "nozzleCapacity"
    ).textContent =
        `${capacityRate}%`;

}


/* ==========================================
   HELPERS
========================================== */

function getPumpInitials(name) {

    if (!name) return "FP";

    return name
        .split(" ")
        .slice(0, 2)
        .map(
            word =>
                word
                    .charAt(0)
                    .toUpperCase()
        )
        .join("");

}


function capitalize(value) {

    if (!value) return "";

    return (
        value.charAt(0)
            .toUpperCase() +
        value.slice(1)
    );

}


function escapePumpHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function showPumpMessage(
    element,
    message,
    type
) {

    if (!element) {
        alert(message);
        return;
    }

    element.textContent = message;

    element.className =
        `fg-pumps-message ${type}`;

}


/* ==========================================
   PROFESSIONAL UI STYLES
========================================== */

function injectPumpsStyles() {

    if (
        document.getElementById(
            "fuelgapProfessionalPumpsStyles"
        )
    ) {
        return;
    }

    const style =
        document.createElement("style");

    style.id =
        "fuelgapProfessionalPumpsStyles";

    style.textContent = `

        .fg-pumps-page {
            width: 100%;
            padding: 8px 0 40px;
            color: #17191d;
        }

        .fg-pumps-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 24px;
            margin-bottom: 28px;
        }

        .fg-pumps-title-group {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .fg-pumps-page-icon {
            width: 54px;
            height: 54px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 15px;
            background: #111827;
            color: #f5c518;
        }

        .fg-pumps-page-icon svg {
            width: 25px;
            height: 25px;
        }

        .fg-pumps-breadcrumb {
            margin-bottom: 6px;
            color: #8b909a;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 1px;
        }

        .fg-pumps-breadcrumb span {
            margin: 0 7px;
        }

        .fg-pumps-header h1 {
            margin: 0;
            color: #111827;
            font-size: 28px;
            font-weight: 800;
        }

        .fg-pumps-header p {
            margin: 7px 0 0;
            color: #777c86;
            font-size: 14px;
        }

        .fg-pumps-primary-btn {
            min-height: 44px;
            border: none;
            padding: 0 18px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 9px;
            border-radius: 10px;
            background: #f5c518;
            color: #111827;
            font-size: 13px;
            font-weight: 800;
            cursor: pointer;
        }

        .fg-pumps-primary-btn svg {
            width: 18px;
            height: 18px;
        }

        .fg-pumps-secondary-btn {
            min-height: 44px;
            padding: 0 18px;
            border-radius: 10px;
            border: 1px solid #e2e5e9;
            background: #fff;
            color: #555b65;
            cursor: pointer;
        }

        .fg-pump-metrics {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 18px;
            margin-bottom: 24px;
        }

        .fg-pump-metric-card {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 20px;
            border: 1px solid #ebedf0;
            border-radius: 16px;
            background: #fff;
        }

        .fg-pump-metric-icon {
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 13px;
        }

        .fg-pump-metric-icon svg {
            width: 22px;
            height: 22px;
        }

        .fg-pump-icon-dark {
            background: #111827;
            color: #fff;
        }

        .fg-pump-icon-green {
            background: #eaf8ef;
            color: #169c4d;
        }

        .fg-pump-icon-yellow {
            background: #fff6cc;
            color: #b77900;
        }

        .fg-pump-icon-gray {
            background: #f1f3f5;
            color: #69707b;
        }

        .fg-pump-metric-card span {
            display: block;
            color: #858a94;
            font-size: 12px;
        }

        .fg-pump-metric-card strong {
            display: block;
            margin-top: 5px;
            font-size: 25px;
            color: #111827;
        }

        .fg-pump-metric-card small {
            display: block;
            margin-top: 7px;
            color: #a0a5ae;
            font-size: 10px;
        }

        .fg-pumps-panel {
            overflow: hidden;
            border: 1px solid #e9ebee;
            border-radius: 18px;
            background: #fff;
        }

        .fg-pumps-panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 23px 24px;
            border-bottom: 1px solid #eef0f2;
        }

        .fg-pumps-panel-header h2 {
            margin: 0;
            font-size: 18px;
        }

        .fg-pumps-panel-header p {
            margin: 5px 0 0;
            color: #858a94;
            font-size: 13px;
        }

        .fg-pumps-count {
            color: #777c86;
            font-size: 12px;
        }

        .fg-pumps-count span {
            display: inline-flex;
            width: 28px;
            height: 28px;
            align-items: center;
            justify-content: center;
            margin-right: 5px;
            border-radius: 8px;
            background: #fff6cc;
            color: #8d6800;
            font-weight: 800;
        }

        .fg-pumps-toolbar {
            display: flex;
            gap: 12px;
            padding: 17px 24px;
            border-bottom: 1px solid #eef0f2;
            background: #fcfcfd;
        }

        .fg-pumps-search {
            flex: 1;
            min-height: 44px;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 0 13px;
            border: 1px solid #e1e4e8;
            border-radius: 10px;
            background: #fff;
        }

        .fg-pumps-search input {
            width: 100%;
            border: none;
            outline: none;
            font-size: 13px;
        }

        .fg-pumps-search svg,
        .fg-pumps-filter svg {
            width: 18px;
            color: #9ca1aa;
        }

        .fg-pumps-filter {
            min-width: 150px;
            min-height: 44px;
            display: flex;
            align-items: center;
            gap: 9px;
            padding: 0 12px;
            border: 1px solid #e1e4e8;
            border-radius: 10px;
            background: #fff;
        }

        .fg-pumps-filter select {
            width: 100%;
            border: none;
            outline: none;
            background: transparent;
        }

        .fg-pumps-table-wrapper {
            width: 100%;
            overflow-x: auto;
        }

        .fg-pumps-table {
            width: 100%;
            min-width: 900px;
            border-collapse: collapse;
        }

        .fg-pumps-table th {
            padding: 14px 24px;
            text-align: left;
            background: #fafbfc;
            border-bottom: 1px solid #eceef1;
            color: #8c919b;
            font-size: 10px;
            letter-spacing: 0.7px;
            text-transform: uppercase;
        }

        .fg-pumps-table td {
            padding: 17px 24px;
            border-bottom: 1px solid #f0f1f3;
            font-size: 13px;
        }

        .fg-pumps-table tbody tr:hover {
            background: #fffcf0;
        }

        .fg-pump-identity {
            display: flex;
            align-items: center;
            gap: 11px;
        }

        .fg-pump-avatar {
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 11px;
            background: #111827;
            color: #f5c518;
            font-size: 12px;
            font-weight: 800;
        }

        .fg-pump-identity strong {
            display: block;
            color: #1d2026;
        }

        .fg-pump-identity span {
            display: block;
            margin-top: 4px;
            color: #a1a5ad;
            font-size: 10px;
        }

        .fg-pump-station {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .fg-pump-station svg {
            width: 16px;
            color: #9aa0a9;
        }

        .fg-pump-equipment strong {
            display: block;
            color: #343840;
        }

        .fg-pump-equipment span {
            display: block;
            margin-top: 4px;
            color: #9ba0a9;
            font-size: 11px;
        }

        .fg-nozzle-capacity strong {
            color: #20242a;
        }

        .fg-nozzle-capacity small {
            display: block;
            margin-top: 3px;
            color: #9ba0a9;
            font-size: 10px;
        }

        .fg-capacity-track {
            width: 80px;
            height: 4px;
            margin-top: 7px;
            overflow: hidden;
            border-radius: 999px;
            background: #edf0f2;
        }

        .fg-capacity-track span {
            display: block;
            height: 100%;
            background: #f5c518;
        }

        .fg-pump-status {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 6px 10px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: 800;
        }

        .fg-pump-status i {
            width: 6px;
            height: 6px;
            border-radius: 50%;
        }

        .fg-pump-active {
            background: #eaf8ef;
            color: #15803d;
        }

        .fg-pump-active i {
            background: #22c55e;
        }

        .fg-pump-inactive {
            background: #f1f2f4;
            color: #747982;
        }

        .fg-pump-inactive i {
            background: #9ca3af;
        }

        .fg-pump-actions {
            display: flex;
            align-items: center;
            gap: 7px;
        }

        .fg-add-nozzle-btn {
            min-height: 34px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 0 10px;
            border: 1px solid #f0d467;
            border-radius: 8px;
            background: #fff9df;
            color: #8d6800;
            font-size: 11px;
            font-weight: 750;
            cursor: pointer;
        }

        .fg-add-nozzle-btn svg {
            width: 15px;
        }

        .fg-delete-pump-btn {
            width: 34px;
            height: 34px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: #fff;
            color: #8a9099;
            cursor: pointer;
        }

        .fg-delete-pump-btn svg {
            width: 16px;
        }

        .fg-pumps-empty {
            padding: 65px 20px;
            text-align: center;
        }

        .fg-pumps-empty-icon {
            width: 72px;
            height: 72px;
            margin: 0 auto 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 20px;
            background: #fff6cc;
            color: #b77900;
        }

        .fg-pumps-empty-icon svg {
            width: 32px;
        }

        .fg-pumps-empty h3 {
            margin: 0;
            font-size: 18px;
        }

        .fg-pumps-empty p {
            max-width: 400px;
            margin: 9px auto 20px;
            color: #858a94;
            font-size: 13px;
        }

        .fg-pumps-modal {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .fg-pumps-modal.hidden,
        .hidden {
            display: none !important;
        }

        .fg-pumps-modal-overlay {
            position: absolute;
            inset: 0;
            background: rgba(17, 24, 39, 0.58);
        }

        .fg-pumps-modal-content {
            position: relative;
            width: 100%;
            max-width: 680px;
            max-height: calc(100vh - 40px);
            overflow-y: auto;
            border-radius: 20px;
            background: #fff;
            box-shadow: 0 30px 90px rgba(0,0,0,.25);
        }

        .fg-pumps-modal-header {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            padding: 27px 30px 22px;
            border-bottom: 1px solid #eef0f2;
        }

        .fg-pumps-modal-header span {
            display: block;
            margin-bottom: 7px;
            color: #b77900;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 1px;
        }

        .fg-pumps-modal-header h2 {
            margin: 0;
            font-size: 22px;
        }

        .fg-pumps-modal-header p {
            margin: 7px 0 0;
            color: #858a94;
            font-size: 13px;
        }

        .fg-pumps-modal-close {
            width: 38px;
            height: 38px;
            border: none;
            border-radius: 10px;
            background: #f4f5f6;
            cursor: pointer;
        }

        .fg-pumps-modal-close svg {
            width: 18px;
        }

        #pumpForm,
        #nozzleForm {
            padding: 26px 30px 0;
        }

        .fg-pumps-form-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 18px;
        }

        .fg-pumps-form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .fg-pumps-full {
            grid-column: 1 / -1;
        }

        .fg-pumps-form-group label {
            font-size: 12px;
            font-weight: 750;
        }

        .fg-pumps-form-group input,
        .fg-pumps-form-group select {
            width: 100%;
            box-sizing: border-box;
            min-height: 44px;
            padding: 0 13px;
            border: 1px solid #e0e3e7;
            border-radius: 10px;
            outline: none;
            font-size: 13px;
        }

        .fg-pumps-form-group input:focus,
        .fg-pumps-form-group select:focus {
            border-color: #f5c518;
        }

        .fg-pumps-modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin: 26px -30px 0;
            padding: 18px 30px;
            border-top: 1px solid #eef0f2;
            background: #fcfcfd;
        }

        @media (max-width: 1100px) {

            .fg-pump-metrics {
                grid-template-columns: repeat(2, 1fr);
            }

        }

        @media (max-width: 700px) {

            .fg-pumps-header {
                flex-direction: column;
                align-items: stretch;
            }

            .fg-pumps-header >
            .fg-pumps-primary-btn {
                width: 100%;
            }

            .fg-pump-metrics {
                grid-template-columns: 1fr;
            }

            .fg-pumps-toolbar {
                flex-direction: column;
                padding: 15px;
            }

            .fg-pumps-filter {
                width: 100%;
                box-sizing: border-box;
            }

            .fg-pumps-form-grid {
                grid-template-columns: 1fr;
            }

            .fg-pumps-full {
                grid-column: auto;
            }

            .fg-pumps-modal-header,
            #pumpForm,
            #nozzleForm {
                padding-left: 20px;
                padding-right: 20px;
            }

            .fg-pumps-modal-footer {
                margin-left: -20px;
                margin-right: -20px;
                padding: 15px 20px;
                flex-direction: column-reverse;
            }

            .fg-pumps-modal-footer button {
                width: 100%;
            }

        }

    `;

    document.head.appendChild(style);

}