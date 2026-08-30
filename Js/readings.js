/* ==========================================
   FUELGAP - METER READINGS
   LIVE CAMERA VERSION
========================================== */

const READINGS_STORAGE_KEY = "fuelgap_meter_readings";
const STATIONS_STORAGE_KEY = "fuelgap_stations";
const PUMPS_STORAGE_KEY = "fuelgap_pumps";
const NOZZLES_STORAGE_KEY = "fuelgap_nozzles";

let meterCameraStream = null;
let capturedMeterPhoto = null;


/* ==========================================
   INITIALIZE PAGE
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    const currentUser = FuelGapUtils.getCurrentUser();

    if (!currentUser) {
        window.location.href = "../login.html";
        return;
    }

    if (!hasPermission(currentUser.role, "readings")) {
        window.location.href = "./dashboard.html";
        return;
    }

    setTimeout(() => {

        renderReadingsPage();
        setupReadingEvents();
        renderReadings();

    }, 0);

});


/* ==========================================
   STORAGE FUNCTIONS
========================================== */

function getMeterReadings() {

    try {

        return JSON.parse(
            localStorage.getItem(READINGS_STORAGE_KEY)
        ) || [];

    } catch (error) {

        console.error(
            "Unable to load meter readings:",
            error
        );

        return [];

    }

}


function saveMeterReadings(readings) {

    localStorage.setItem(
        READINGS_STORAGE_KEY,
        JSON.stringify(readings)
    );

}


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


function getNozzles() {

    try {

        return JSON.parse(
            localStorage.getItem(NOZZLES_STORAGE_KEY)
        ) || [];

    } catch (error) {

        return [];

    }

}


/* ==========================================
   ROLE BASED STATION ACCESS
========================================== */

function getVisibleStations() {

    const currentUser = FuelGapUtils.getCurrentUser();
    const stations = getStations();

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

    if (
        currentUser.role === "manager" ||
        currentUser.role === "attendant"
    ) {

        return stations.filter(
            station =>
                station.id === currentUser.stationId
        );

    }

    return [];

}


/* ==========================================
   GET VISIBLE READINGS
========================================== */

function getVisibleReadings() {

    const stations = getVisibleStations();

    const stationIds = stations.map(
        station => station.id
    );

    return getMeterReadings().filter(
        reading =>
            stationIds.includes(reading.stationId)
    );

}


/* ==========================================
   RENDER PAGE
========================================== */

function renderReadingsPage() {

    const pageContent =
        document.getElementById("pageContent");

    if (!pageContent) return;

    pageContent.innerHTML = `

        <div class="page-header">

            <div>

                <p class="page-eyebrow">
                    FORECOURT MONITORING
                </p>

                <h1>
                    Meter Readings
                </h1>

                <p>
                    Record, verify and monitor
                    fuel pump meter readings.
                </p>

            </div>

            <button
                type="button"
                class="btn btn-primary"
                id="openReadingModal"
            >
                + Record Reading
            </button>

        </div>


        <!-- STATISTICS -->

        <section class="reading-stats">

            <div class="reading-stat-card">

                <span>
                    Total Readings
                </span>

                <strong id="totalReadings">
                    0
                </strong>

            </div>


            <div class="reading-stat-card">

                <span>
                    Today's Readings
                </span>

                <strong id="todayReadings">
                    0
                </strong>

            </div>


            <div class="reading-stat-card">

                <span>
                    Opening Readings
                </span>

                <strong id="openingReadings">
                    0
                </strong>

            </div>


            <div class="reading-stat-card">

                <span>
                    Closing Readings
                </span>

                <strong id="closingReadings">
                    0
                </strong>

            </div>

        </section>


        <!-- READING TABLE -->

        <section class="reading-section">

            <div class="section-header">

                <div>

                    <h2>
                        Reading History
                    </h2>

                    <p>
                        Monitor all recorded
                        meter readings.
                    </p>

                </div>

                <input
                    type="search"
                    id="readingSearch"
                    placeholder="Search readings..."
                >

            </div>


            <div class="table-wrapper">

                <table class="reading-table">

                    <thead>

                        <tr>

                            <th>Date</th>
                            <th>Station</th>
                            <th>Pump</th>
                            <th>Nozzle</th>
                            <th>Type</th>
                            <th>Reading</th>
                            <th>Recorded By</th>
                            <th>Snap</th>

                        </tr>

                    </thead>

                    <tbody id="readingTableBody"></tbody>

                </table>

            </div>


            <div
                id="emptyReadingState"
                class="empty-state hidden"
            >

                <h3>
                    No meter readings yet
                </h3>

                <p>
                    Record your first meter
                    reading to begin monitoring.
                </p>

            </div>

        </section>


        <!-- RECORD READING MODAL -->

        <div
            id="readingModal"
            class="modal hidden"
        >

            <div class="modal-overlay"></div>

            <div class="modal-content">

                <button
                    type="button"
                    id="closeReadingModal"
                    class="modal-close"
                >
                    ×
                </button>


                <div class="modal-header">

                    <h2>
                        Record Meter Reading
                    </h2>

                    <p>
                        Enter the meter reading
                        and capture live evidence.
                    </p>

                </div>


                <form id="readingForm">


                    <!-- STATION -->

                    <div class="form-group">

                        <label>
                            Fuel Station
                        </label>

                        <select
                            name="stationId"
                            id="readingStation"
                            required
                        >

                            <option value="">
                                Select station
                            </option>

                        </select>

                    </div>


                    <!-- PUMP -->

                    <div class="form-group">

                        <label>
                            Pump
                        </label>

                        <select
                            name="pumpId"
                            id="readingPump"
                            required
                            disabled
                        >

                            <option value="">
                                Select pump
                            </option>

                        </select>

                    </div>


                    <!-- NOZZLE -->

                    <div class="form-group">

                        <label>
                            Nozzle
                        </label>

                        <select
                            name="nozzleId"
                            id="readingNozzle"
                            required
                            disabled
                        >

                            <option value="">
                                Select nozzle
                            </option>

                        </select>

                    </div>


                    <!-- READING TYPE -->

                    <div class="form-group">

                        <label>
                            Reading Type
                        </label>

                        <select
                            name="readingType"
                            required
                        >

                            <option value="">
                                Select reading type
                            </option>

                            <option value="opening">
                                Opening Reading
                            </option>

                            <option value="periodic">
                                Periodic Reading
                            </option>

                            <option value="closing">
                                Closing Reading
                            </option>

                            <option value="correction">
                                Correction Reading
                            </option>

                        </select>

                    </div>


                    <!-- METER READING -->

                    <div class="form-group">

                        <label>
                            Meter Reading
                        </label>

                        <input
                            type="number"
                            name="meterReading"
                            min="0"
                            step="0.01"
                            placeholder="Example: 125000.00"
                            required
                        >

                    </div>


                    <!-- LIVE CAMERA -->

                    <div class="form-group">

                        <label>
                            📸 Live Meter Snap
                        </label>


                        <div
                            id="cameraContainer"
                            class="camera-container"
                        >

                            <video
                                id="meterCamera"
                                autoplay
                                playsinline
                                muted
                            ></video>

                            <canvas
                                id="meterCanvas"
                                class="hidden"
                            ></canvas>

                        </div>


                        <div class="camera-actions">

                            <button
                                type="button"
                                id="startCamera"
                                class="btn btn-secondary"
                            >
                                📷 Open Camera
                            </button>


                            <button
                                type="button"
                                id="captureMeterPhoto"
                                class="btn btn-primary"
                                disabled
                            >
                                📸 Capture Live Snap
                            </button>

                        </div>


                        <small>
                            You must capture a live photo
                            of the meter. Existing photos
                            cannot be uploaded.
                        </small>

                    </div>


                    <!-- PHOTO PREVIEW -->

                    <div
                        id="meterPhotoPreview"
                        class="photo-preview hidden"
                    >

                        <img
                            id="meterPreviewImage"
                            alt="Live meter evidence"
                        >

                    </div>


                    <!-- NOTES -->

                    <div class="form-group">

                        <label>
                            Notes
                        </label>

                        <textarea
                            name="notes"
                            placeholder="Optional notes..."
                        ></textarea>

                    </div>


                    <div
                        id="readingMessage"
                        class="form-message hidden"
                    ></div>


                    <button
                        type="submit"
                        class="btn btn-primary"
                    >
                        Save Meter Reading
                    </button>

                </form>

            </div>

        </div>


        <!-- PHOTO VIEW MODAL -->

        <div
            id="photoModal"
            class="modal hidden"
        >

            <div class="modal-overlay"></div>

            <div
                class="modal-content photo-modal-content"
            >

                <button
                    type="button"
                    id="closePhotoModal"
                    class="modal-close"
                >
                    ×
                </button>

                <img
                    id="fullMeterPhoto"
                    alt="Meter evidence"
                >

            </div>

        </div>

    `;

}


/* ==========================================
   EVENTS
========================================== */

function setupReadingEvents() {

    setupReadingModal();

    setupStationSelection();

    setupPumpSelection();

    setupReadingForm();

    setupPhotoPreview();

    setupReadingSearch();

    setupPhotoModal();

}


/* ==========================================
   READING MODAL
========================================== */

function setupReadingModal() {

    const modal =
        document.getElementById("readingModal");

    const openButton =
        document.getElementById("openReadingModal");

    const closeButton =
        document.getElementById("closeReadingModal");


    if (openButton) {

        openButton.addEventListener(
            "click",
            () => {

                loadVisibleStations();

                modal.classList.remove("hidden");

            }
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            () => {

                stopMeterCamera();

                modal.classList.add("hidden");

            }
        );

    }

}


/* ==========================================
   LOAD STATIONS
========================================== */

function loadVisibleStations() {

    const select =
        document.getElementById("readingStation");

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
            station.name;

        select.appendChild(option);

    });

}


/* ==========================================
   STATION CHANGE
========================================== */

function setupStationSelection() {

    const stationSelect =
        document.getElementById("readingStation");

    if (!stationSelect) return;


    stationSelect.addEventListener(
        "change",
        event => {

            loadPumps(
                event.target.value
            );

        }
    );

}


/* ==========================================
   LOAD PUMPS
========================================== */

function loadPumps(stationId) {

    const select =
        document.getElementById("readingPump");

    const nozzleSelect =
        document.getElementById("readingNozzle");


    select.innerHTML = `
        <option value="">
            Select pump
        </option>
    `;


    nozzleSelect.innerHTML = `
        <option value="">
            Select nozzle
        </option>
    `;


    nozzleSelect.disabled = true;


    if (!stationId) {

        select.disabled = true;

        return;

    }


    const pumps =
        getPumps().filter(
            pump =>
                pump.stationId === stationId
        );


    pumps.forEach(pump => {

        const option =
            document.createElement("option");

        option.value =
            pump.id;

        option.textContent =
            pump.name;

        select.appendChild(option);

    });


    select.disabled = false;

}


/* ==========================================
   PUMP CHANGE
========================================== */

function setupPumpSelection() {

    const pumpSelect =
        document.getElementById("readingPump");

    if (!pumpSelect) return;


    pumpSelect.addEventListener(
        "change",
        event => {

            loadNozzles(
                event.target.value
            );

        }
    );

}


/* ==========================================
   LOAD NOZZLES
========================================== */

function loadNozzles(pumpId) {

    const select =
        document.getElementById("readingNozzle");


    select.innerHTML = `
        <option value="">
            Select nozzle
        </option>
    `;


    if (!pumpId) {

        select.disabled = true;

        return;

    }


    const nozzles =
        getNozzles().filter(
            nozzle =>
                nozzle.pumpId === pumpId
        );


    nozzles.forEach(nozzle => {

        const option =
            document.createElement("option");

        option.value =
            nozzle.id;

        option.textContent =
            `${nozzle.name} - ${nozzle.product}`;

        select.appendChild(option);

    });


    select.disabled = false;

}


/* ==========================================
   LIVE CAMERA
========================================== */

function setupPhotoPreview() {

    const video =
        document.getElementById("meterCamera");

    const canvas =
        document.getElementById("meterCanvas");

    const preview =
        document.getElementById("meterPhotoPreview");

    const previewImage =
        document.getElementById("meterPreviewImage");

    const startButton =
        document.getElementById("startCamera");

    const captureButton =
        document.getElementById("captureMeterPhoto");


    if (
        !video ||
        !canvas ||
        !preview ||
        !previewImage ||
        !startButton ||
        !captureButton
    ) {

        return;

    }


    /* =========================
       OPEN LIVE CAMERA
    ========================== */

    startButton.addEventListener(
        "click",
        async () => {

            try {

                if (
                    !navigator.mediaDevices ||
                    !navigator.mediaDevices.getUserMedia
                ) {

                    alert(
                        "Your browser does not support live camera access."
                    );

                    return;

                }


                stopMeterCamera();


                meterCameraStream =
                    await navigator.mediaDevices
                        .getUserMedia({

                            video: {

                                facingMode: {
                                    ideal: "environment"
                                },

                                width: {
                                    ideal: 1920
                                },

                                height: {
                                    ideal: 1080
                                }

                            },

                            audio: false

                        });


                video.srcObject =
                    meterCameraStream;


                await video.play();


                captureButton.disabled =
                    false;


                startButton.textContent =
                    "🔄 Camera Active";


                capturedMeterPhoto =
                    null;


                preview.classList.add(
                    "hidden"
                );


            } catch (error) {

                console.error(
                    "Camera error:",
                    error
                );


                if (
                    error.name ===
                    "NotAllowedError"
                ) {

                    alert(
                        "Camera permission was denied. Please allow camera access in your browser."
                    );

                } else if (
                    error.name ===
                    "NotFoundError"
                ) {

                    alert(
                        "No camera was found on this device."
                    );

                } else {

                    alert(
                        "Unable to access the camera. Please check your camera permission."
                    );

                }

            }

        }
    );


    /* =========================
       CAPTURE LIVE PHOTO
    ========================== */

    captureButton.addEventListener(
        "click",
        () => {

            if (!meterCameraStream) {

                alert(
                    "Please open the camera first."
                );

                return;

            }


            if (video.readyState < 2) {

                alert(
                    "Camera is not ready yet. Please wait a moment."
                );

                return;

            }


            const width =
                video.videoWidth;

            const height =
                video.videoHeight;


            if (!width || !height) {

                alert(
                    "Unable to capture the camera image. Please try again."
                );

                return;

            }


            canvas.width =
                width;

            canvas.height =
                height;


            const context =
                canvas.getContext("2d");


            context.drawImage(
                video,
                0,
                0,
                width,
                height
            );


            capturedMeterPhoto =
                canvas.toDataURL(
                    "image/jpeg",
                    0.9
                );


            previewImage.src =
                capturedMeterPhoto;


            preview.classList.remove(
                "hidden"
            );


            captureButton.textContent =
                "✓ Snap Captured";


            captureButton.disabled =
                true;


            startButton.textContent =
                "🔄 Retake Photo";


            stopMeterCamera();

        }
    );

}


/* ==========================================
   STOP CAMERA
========================================== */

function stopMeterCamera() {

    if (meterCameraStream) {

        meterCameraStream
            .getTracks()
            .forEach(track => {

                track.stop();

            });

        meterCameraStream = null;

    }


    const video =
        document.getElementById("meterCamera");


    if (video) {

        video.srcObject = null;

    }


    const captureButton =
        document.getElementById("captureMeterPhoto");


    if (captureButton) {

        captureButton.disabled = true;

    }

}


/* ==========================================
   CREATE READING
========================================== */

function setupReadingForm() {

    const form =
        document.getElementById("readingForm");

    if (!form) return;


    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const currentUser =
                FuelGapUtils.getCurrentUser();


            const stationId =
                form.elements["stationId"].value;

            const pumpId =
                form.elements["pumpId"].value;

            const nozzleId =
                form.elements["nozzleId"].value;

            const readingType =
                form.elements["readingType"].value;

            const meterReading =
                Number(
                    form.elements["meterReading"].value
                );

            const notes =
                form.elements["notes"]
                    .value
                    .trim();


            const message =
                document.getElementById(
                    "readingMessage"
                );


            /* =========================
               VALIDATE FORM
            ========================== */

            if (
                !stationId ||
                !pumpId ||
                !nozzleId ||
                !readingType ||
                Number.isNaN(meterReading)
            ) {

                showReadingMessage(
                    message,
                    "Please complete all required fields.",
                    "error"
                );

                return;

            }


            /* =========================
               LIVE SNAP REQUIRED
            ========================== */

            if (!capturedMeterPhoto) {

                showReadingMessage(
                    message,
                    "Please capture a live photo of the meter before saving.",
                    "error"
                );

                return;

            }


            const station =
                getStations().find(
                    item =>
                        item.id === stationId
                );


            /* =========================
               CREATE READING
            ========================== */

            const newReading = {

                id:
                    `READ-${Date.now()}`,

                organizationId:
                    station
                        ? station.organizationId
                        : null,

                stationId,

                pumpId,

                nozzleId,

                readingType,

                meterReading,

                photo:
                    capturedMeterPhoto,

                notes,

                recordedBy:
                    currentUser.id,

                recordedByName:
                    currentUser.fullName,

                recordedAt:
                    new Date().toISOString()

            };


            const readings =
                getMeterReadings();


            readings.push(
                newReading
            );


            saveMeterReadings(
                readings
            );


            showReadingMessage(
                message,
                "Meter reading saved successfully.",
                "success"
            );


            /* =========================
               RESET
            ========================== */

            form.reset();

            capturedMeterPhoto = null;

            stopMeterCamera();


            const preview =
                document.getElementById(
                    "meterPhotoPreview"
                );


            if (preview) {

                preview.classList.add(
                    "hidden"
                );

            }


            const previewImage =
                document.getElementById(
                    "meterPreviewImage"
                );


            if (previewImage) {

                previewImage.src = "";

            }


            const startCamera =
                document.getElementById(
                    "startCamera"
                );


            if (startCamera) {

                startCamera.textContent =
                    "📷 Open Camera";

            }


            const captureButton =
                document.getElementById(
                    "captureMeterPhoto"
                );


            if (captureButton) {

                captureButton.textContent =
                    "📸 Capture Live Snap";

                captureButton.disabled =
                    true;

            }


            renderReadings();


            setTimeout(() => {

                const modal =
                    document.getElementById(
                        "readingModal"
                    );

                if (modal) {

                    modal.classList.add(
                        "hidden"
                    );

                }

            }, 800);

        }
    );

}


/* ==========================================
   RENDER READINGS
========================================== */

function renderReadings(searchTerm = "") {

    const readings =
        getVisibleReadings();

    const stations =
        getStations();

    const pumps =
        getPumps();

    const nozzles =
        getNozzles();

    const tableBody =
        document.getElementById(
            "readingTableBody"
        );

    const emptyState =
        document.getElementById(
            "emptyReadingState"
        );


    if (!tableBody) return;


    const search =
        searchTerm
            .toLowerCase()
            .trim();


    const filteredReadings =
        readings.filter(reading => {

            const station =
                stations.find(
                    item =>
                        item.id ===
                        reading.stationId
                );

            const pump =
                pumps.find(
                    item =>
                        item.id ===
                        reading.pumpId
                );

            const nozzle =
                nozzles.find(
                    item =>
                        item.id ===
                        reading.nozzleId
                );


            return (

                (station?.name || "")
                    .toLowerCase()
                    .includes(search)

                ||

                (pump?.name || "")
                    .toLowerCase()
                    .includes(search)

                ||

                (nozzle?.name || "")
                    .toLowerCase()
                    .includes(search)

                ||

                (reading.readingType || "")
                    .toLowerCase()
                    .includes(search)

                ||

                (reading.recordedByName || "")
                    .toLowerCase()
                    .includes(search)

            );

        });


    tableBody.innerHTML = "";


    if (filteredReadings.length === 0) {

        emptyState.classList.remove(
            "hidden"
        );

    } else {

        emptyState.classList.add(
            "hidden"
        );


        filteredReadings
            .sort(
                (a, b) =>
                    new Date(b.recordedAt) -
                    new Date(a.recordedAt)
            )
            .forEach(reading => {

                const station =
                    stations.find(
                        item =>
                            item.id ===
                            reading.stationId
                    );

                const pump =
                    pumps.find(
                        item =>
                            item.id ===
                            reading.pumpId
                    );

                const nozzle =
                    nozzles.find(
                        item =>
                            item.id ===
                            reading.nozzleId
                    );


                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>
                        ${formatDate(
                            reading.recordedAt
                        )}
                    </td>

                    <td>
                        ${
                            station
                                ? station.name
                                : "-"
                        }
                    </td>

                    <td>
                        ${
                            pump
                                ? pump.name
                                : "-"
                        }
                    </td>

                    <td>
                        ${
                            nozzle
                                ? nozzle.name
                                : "-"
                        }
                    </td>

                    <td>
                        ${capitalize(
                            reading.readingType
                        )}
                    </td>

                    <td>
                        ${Number(
                            reading.meterReading
                        ).toLocaleString()}
                    </td>

                    <td>
                        ${
                            reading.recordedByName ||
                            "-"
                        }
                    </td>

                    <td>

                        ${
                            reading.photo
                                ? `
                                    <button
                                        type="button"
                                        class="view-meter-photo"
                                        data-id="${reading.id}"
                                    >
                                        📸 View
                                    </button>
                                `
                                : "-"
                        }

                    </td>

                `;


                tableBody.appendChild(row);

            });

    }


    updateReadingStats(readings);

    setupViewPhotoButtons();

}


/* ==========================================
   READING STATS
========================================== */

function updateReadingStats(readings) {

    const today =
        new Date().toDateString();


    const todayCount =
        readings.filter(
            reading =>
                new Date(
                    reading.recordedAt
                )
                    .toDateString() === today
        ).length;


    const opening =
        readings.filter(
            reading =>
                reading.readingType ===
                "opening"
        ).length;


    const closing =
        readings.filter(
            reading =>
                reading.readingType ===
                "closing"
        ).length;


    const totalElement =
        document.getElementById(
            "totalReadings"
        );

    const todayElement =
        document.getElementById(
            "todayReadings"
        );

    const openingElement =
        document.getElementById(
            "openingReadings"
        );

    const closingElement =
        document.getElementById(
            "closingReadings"
        );


    if (totalElement) {

        totalElement.textContent =
            readings.length;

    }


    if (todayElement) {

        todayElement.textContent =
            todayCount;

    }


    if (openingElement) {

        openingElement.textContent =
            opening;

    }


    if (closingElement) {

        closingElement.textContent =
            closing;

    }

}


/* ==========================================
   SEARCH
========================================== */

function setupReadingSearch() {

    const searchInput =
        document.getElementById(
            "readingSearch"
        );


    if (!searchInput) return;


    searchInput.addEventListener(
        "input",
        event => {

            renderReadings(
                event.target.value
            );

        }
    );

}


/* ==========================================
   PHOTO MODAL
========================================== */

function setupPhotoModal() {

    const modal =
        document.getElementById(
            "photoModal"
        );

    const closeButton =
        document.getElementById(
            "closePhotoModal"
        );


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

}


/* ==========================================
   VIEW PHOTO
========================================== */

function setupViewPhotoButtons() {

    const buttons =
        document.querySelectorAll(
            ".view-meter-photo"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const readingId =
                    button.dataset.id;


                const reading =
                    getMeterReadings()
                        .find(
                            item =>
                                item.id ===
                                readingId
                        );


                if (
                    !reading ||
                    !reading.photo
                ) {

                    return;

                }


                const fullPhoto =
                    document.getElementById(
                        "fullMeterPhoto"
                    );

                const photoModal =
                    document.getElementById(
                        "photoModal"
                    );


                if (
                    fullPhoto &&
                    photoModal
                ) {

                    fullPhoto.src =
                        reading.photo;

                    photoModal.classList.remove(
                        "hidden"
                    );

                }

            }
        );

    });

}


/* ==========================================
   MESSAGE
========================================== */

function showReadingMessage(
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
   DATE FORMAT
========================================== */

function formatDate(date) {

    return new Date(
        date
    ).toLocaleString();

}


/* ==========================================
   CAPITALIZE
========================================== */

function capitalize(value) {

    if (!value) return "";

    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );

}