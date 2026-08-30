/* ==========================================
   FUELGAP - ORGANIZATION MANAGEMENT
========================================== */

const ORGANIZATIONS_STORAGE_KEY =
    "fuelgap_organizations";


document.addEventListener(
    "DOMContentLoaded",
    () => {

        const currentUser =
            FuelGapUtils.getCurrentUser();


        /* =========================
           AUTH CHECK
        ========================= */

        if (!currentUser) {

            window.location.href =
                "../login.html";

            return;

        }


        /* =========================
           ADMIN CHECK
        ========================= */

        if (
            currentUser.role !== "admin"
        ) {

            window.location.href =
                "./dashboard.html";

            return;

        }


        /*
           Wait for app.js to create
           #pageContent.
        */

        setTimeout(
            () => {

                renderOrganizationsPage();

                setupOrganizationEvents();

                renderOrganizations();

            },
            0
        );

    }
);


/* ==========================================
   GET ORGANIZATIONS
========================================== */

function getOrganizations() {

    try {

        const organizations =
            JSON.parse(

                localStorage.getItem(
                    ORGANIZATIONS_STORAGE_KEY
                )

            );


        return organizations || [];

    } catch (error) {

        console.error(
            "Unable to load organizations:",
            error
        );

        return [];

    }

}


/* ==========================================
   SAVE ORGANIZATIONS
========================================== */

function saveOrganizations(
    organizations
) {

    localStorage.setItem(

        ORGANIZATIONS_STORAGE_KEY,

        JSON.stringify(
            organizations
        )

    );

}


/* ==========================================
   RENDER PAGE
========================================== */

function renderOrganizationsPage() {

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
                    PLATFORM MANAGEMENT
                </p>

                <h1>
                    Organizations
                </h1>

                <p>
                    Manage fuel companies and
                    organizations using FuelGap.
                </p>

            </div>


            <button
                id="openOrganizationModal"
                class="btn btn-primary"
                type="button"
            >
                + Add Organization
            </button>

        </div>



        <!-- =========================
             ORGANIZATION STATS
        ========================== -->

        <section class="organization-stats">


            <div class="organization-stat-card">

                <span>
                    Total Organizations
                </span>

                <strong
                    id="totalOrganizations"
                >
                    0
                </strong>

            </div>


            <div class="organization-stat-card">

                <span>
                    Active Organizations
                </span>

                <strong
                    id="activeOrganizations"
                >
                    0
                </strong>

            </div>


            <div class="organization-stat-card">

                <span>
                    Inactive Organizations
                </span>

                <strong
                    id="inactiveOrganizations"
                >
                    0
                </strong>

            </div>


        </section>



        <!-- =========================
             ORGANIZATION LIST
        ========================== -->

        <section
            class="organization-section"
        >


            <div class="section-header">

                <div>

                    <h2>
                        All Organizations
                    </h2>

                    <p>
                        Companies registered
                        on the FuelGap platform.
                    </p>

                </div>


                <input

                    type="search"

                    id="organizationSearch"

                    placeholder="Search organizations..."

                >

            </div>



            <div
                class="table-wrapper"
            >

                <table
                    class="organization-table"
                >

                    <thead>

                        <tr>

                            <th>
                                Organization
                            </th>

                            <th>
                                Email
                            </th>

                            <th>
                                Phone
                            </th>

                            <th>
                                Address
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
                        id="organizationTableBody"
                    >

                    </tbody>

                </table>

            </div>



            <div

                id="emptyOrganizationState"

                class="empty-state hidden"

            >

                <h3>
                    No organizations yet
                </h3>

                <p>
                    Create the first organization
                    to begin managing fuel stations.
                </p>

            </div>


        </section>



        <!-- =========================
             ADD ORGANIZATION MODAL
        ========================== -->

        <div

            id="organizationModal"

            class="modal hidden"

        >

            <div
                class="modal-overlay"
            ></div>


            <div
                class="modal-content"
            >


                <button

                    id="closeOrganizationModal"

                    class="modal-close"

                    type="button"

                >
                    ×
                </button>


                <div
                    class="modal-header"
                >

                    <h2>
                        Add Organization
                    </h2>

                    <p>
                        Register a fuel company
                        on the FuelGap platform.
                    </p>

                </div>



                <form
                    id="organizationForm"
                >


                    <!-- Organization Name -->

                    <div
                        class="form-group"
                    >

                        <label>
                            Organization Name
                        </label>


                        <input

                            type="text"

                            name="name"

                            placeholder="Enter organization name"

                            required

                        >

                    </div>



                    <!-- Email -->

                    <div
                        class="form-group"
                    >

                        <label>
                            Company Email
                        </label>


                        <input

                            type="email"

                            name="email"

                            placeholder="company@email.com"

                            required

                        >

                    </div>



                    <!-- Phone -->

                    <div
                        class="form-group"
                    >

                        <label>
                            Phone Number
                        </label>


                        <input

                            type="tel"

                            name="phone"

                            placeholder="080XXXXXXXX"

                            required

                        >

                    </div>



                    <!-- Address -->

                    <div
                        class="form-group"
                    >

                        <label>
                            Company Address
                        </label>


                        <textarea

                            name="address"

                            placeholder="Enter company address"

                            required

                        ></textarea>

                    </div>



                    <!-- Status -->

                    <div
                        class="form-group"
                    >

                        <label>
                            Status
                        </label>


                        <select
                            name="status"
                        >

                            <option
                                value="active"
                            >
                                Active
                            </option>

                            <option
                                value="inactive"
                            >
                                Inactive
                            </option>

                        </select>

                    </div>



                    <!-- Message -->

                    <div

                        id="organizationMessage"

                        class="
                            form-message
                            hidden
                        "

                    ></div>



                    <!-- Submit -->

                    <button

                        type="submit"

                        class="
                            btn
                            btn-primary
                        "

                    >

                        Create Organization

                    </button>


                </form>


            </div>


        </div>

    `;

}


/* ==========================================
   SETUP EVENTS
========================================== */

function setupOrganizationEvents() {

    setupOrganizationModal();

    setupOrganizationForm();

    setupOrganizationSearch();

}


/* ==========================================
   MODAL
========================================== */

function setupOrganizationModal() {

    const modal =
        document.getElementById(
            "organizationModal"
        );


    const openButton =
        document.getElementById(
            "openOrganizationModal"
        );


    const closeButton =
        document.getElementById(
            "closeOrganizationModal"
        );


    const overlay =
        modal
            ? modal.querySelector(
                ".modal-overlay"
            )
            : null;


    if (!modal) {

        return;

    }


    openButton.addEventListener(
        "click",
        () => {

            modal.classList.remove(
                "hidden"
            );

        }
    );


    closeButton.addEventListener(
        "click",
        () => {

            modal.classList.add(
                "hidden"
            );

        }
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
   CREATE ORGANIZATION
========================================== */

function setupOrganizationForm() {

    const form =
        document.getElementById(
            "organizationForm"
        );


    if (!form) {

        return;

    }


    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const name =
                form.elements[
                    "name"
                ].value.trim();


            const email =
                form.elements[
                    "email"
                ].value
                    .trim()
                    .toLowerCase();


            const phone =
                form.elements[
                    "phone"
                ].value.trim();


            const address =
                form.elements[
                    "address"
                ].value.trim();


            const status =
                form.elements[
                    "status"
                ].value;


            const message =
                document.getElementById(
                    "organizationMessage"
                );


            /* Validation */

            if (

                !name ||

                !email ||

                !phone ||

                !address

            ) {

                showOrganizationMessage(

                    message,

                    "Please complete all required fields.",

                    "error"

                );

                return;

            }


            const organizations =
                getOrganizations();


            /* Check duplicate email */

            const existingOrganization =
                organizations.find(

                    organization =>

                        organization.email ===
                        email

                );


            if (
                existingOrganization
            ) {

                showOrganizationMessage(

                    message,

                    "An organization with this email already exists.",

                    "error"

                );

                return;

            }


            /* Create organization */

            const newOrganization = {

                id:
                    `ORG-${Date.now()}`,

                name,

                email,

                phone,

                address,

                status,

                createdAt:
                    new Date()
                        .toISOString()

            };


            organizations.push(
                newOrganization
            );


            saveOrganizations(
                organizations
            );


            showOrganizationMessage(

                message,

                "Organization created successfully.",

                "success"

            );


            form.reset();


            renderOrganizations();


            setTimeout(
                () => {

                    document
                        .getElementById(
                            "organizationModal"
                        )
                        .classList.add(
                            "hidden"
                        );

                },
                1000
            );

        }
    );

}


/* ==========================================
   RENDER ORGANIZATIONS
========================================== */

function renderOrganizations(
    searchTerm = ""
) {

    const organizations =
        getOrganizations();


    const tableBody =
        document.getElementById(
            "organizationTableBody"
        );


    const emptyState =
        document.getElementById(
            "emptyOrganizationState"
        );


    if (!tableBody) {

        return;

    }


    const search =
        searchTerm
            .toLowerCase()
            .trim();


    const filteredOrganizations =
        organizations.filter(

            organization =>

                organization.name
                    .toLowerCase()
                    .includes(
                        search
                    ) ||

                organization.email
                    .toLowerCase()
                    .includes(
                        search
                    )

        );


    tableBody.innerHTML =
        "";


    if (
        filteredOrganizations.length === 0
    ) {

        emptyState.classList.remove(
            "hidden"
        );

    } else {

        emptyState.classList.add(
            "hidden"
        );


        filteredOrganizations.forEach(

            organization => {

                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `

                    <td>
                        ${organization.name}
                    </td>

                    <td>
                        ${organization.email}
                    </td>

                    <td>
                        ${organization.phone}
                    </td>

                    <td>
                        ${organization.address}
                    </td>

                    <td>

                        <span
                            class="
                                status-badge
                                ${organization.status}
                            "
                        >

                            ${capitalize(
                                organization.status
                            )}

                        </span>

                    </td>

                    <td>

                        <button

                            type="button"

                            class="
                                delete-organization-btn
                            "

                            data-id="
                                ${organization.id}
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


    updateOrganizationStats(
        organizations
    );


    setupDeleteOrganizationButtons();

}


/* ==========================================
   ORGANIZATION STATISTICS
========================================== */

function updateOrganizationStats(
    organizations
) {

    const total =
        organizations.length;


    const active =
        organizations.filter(

            organization =>

                organization.status ===
                "active"

        ).length;


    const inactive =
        organizations.filter(

            organization =>

                organization.status ===
                "inactive"

        ).length;


    document.getElementById(
        "totalOrganizations"
    ).textContent =
        total;


    document.getElementById(
        "activeOrganizations"
    ).textContent =
        active;


    document.getElementById(
        "inactiveOrganizations"
    ).textContent =
        inactive;

}


/* ==========================================
   DELETE ORGANIZATION BUTTONS
========================================== */

function setupDeleteOrganizationButtons() {

    const buttons =
        document.querySelectorAll(
            ".delete-organization-btn"
        );


    buttons.forEach(

        button => {

            button.addEventListener(
                "click",
                () => {

                    removeOrganization(
                        button.dataset.id
                    );

                }
            );

        }

    );

}


/* ==========================================
   REMOVE ORGANIZATION
========================================== */

function removeOrganization(
    organizationId
) {

    const confirmed =
        confirm(

            "Are you sure you want to remove this organization?"

        );


    if (!confirmed) {

        return;

    }


    let organizations =
        getOrganizations();


    organizations =
        organizations.filter(

            organization =>

                organization.id !==
                organizationId

        );


    saveOrganizations(
        organizations
    );


    renderOrganizations();

}


/* ==========================================
   SEARCH
========================================== */

function setupOrganizationSearch() {

    const searchInput =
        document.getElementById(
            "organizationSearch"
        );


    if (!searchInput) {

        return;

    }


    searchInput.addEventListener(
        "input",
        event => {

            renderOrganizations(
                event.target.value
            );

        }
    );

}


/* ==========================================
   SHOW MESSAGE
========================================== */

function showOrganizationMessage(
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

function capitalize(
    value
) {

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