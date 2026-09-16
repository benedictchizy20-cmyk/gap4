/* =========================================================
   FUELGAP - ORGANIZATION CONTROLLER
   SUPABASE + EXPRESS
   HTTPONLY COOKIE SESSION

   PRODUCTION FRONTEND VERSION

   FEATURES
   ---------------------------------------------------------
   - Backend connected
   - No localStorage organization data
   - Owner/Admin access
   - Organization profile
   - Edit organization
   - Refresh organization
   - Loading state
   - Error state
   - Responsive UI
   - White + Yellow FuelGap design
   - CSS injected directly from this JS file
   - Dynamic backend response normalization
   - Safe HTML rendering
   - Toast notifications
   - Copy organization ID

   BACKEND
   ---------------------------------------------------------
   GET  /api/organization
   PUT  /api/organization

   DATABASE TABLE
   ---------------------------------------------------------
   organizations
      id
      name
      email
      phone
      created_at
      updated_at
========================================================= */


/* =========================================================
   ORGANIZATION STATE
========================================================= */

const OrganizationState = {

    currentUser: null,

    organization: null,

    isLoading: false,

    isSubmitting: false,

    initialized: false,

    error: null,

    loadedAt: null

};


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    injectOrganizationStyles();

    await waitForPageContent();

    await initializeOrganization();

});


/* =========================================================
   WAIT FOR PAGE CONTENT
========================================================= */

async function waitForPageContent() {

    let attempts = 0;

    const maxAttempts = 100;

    while (
        !document.getElementById("pageContent") &&
        attempts < maxAttempts
    ) {

        await new Promise(resolve =>
            setTimeout(resolve, 100)
        );

        attempts++;

    }

}


/* =========================================================
   INITIALIZE ORGANIZATION PAGE
========================================================= */

async function initializeOrganization() {

    if (OrganizationState.initialized) {
        return;
    }

    OrganizationState.initialized = true;

    const pageContent =
        document.getElementById("pageContent");


    if (!pageContent) {

        console.error(
            "FuelGap Organization: #pageContent was not found."
        );

        return;

    }


    /* =====================================================
       CHECK API CLIENT
    ===================================================== */

    if (
        typeof FuelGapAPI === "undefined"
    ) {

        renderError(
            "FuelGap API client is not loaded. Please check api.js."
        );

        return;

    }


    /* =====================================================
       GET CURRENT USER
    ===================================================== */

    try {

        const response =
            await FuelGapAPI.getCurrentUser();


        OrganizationState.currentUser =
            normalizeCurrentUser(response);


        if (!OrganizationState.currentUser) {

            renderError(
                "Unable to identify the currently authenticated user."
            );

            return;

        }

    }
    catch (error) {

        console.error(
            "Organization user error:",
            error
        );


        OrganizationState.error =
            getErrorMessage(
                error,
                "Unable to verify your account."
            );


        renderError(
            OrganizationState.error
        );


        return;

    }


    /* =====================================================
       CHECK PERMISSION
    ===================================================== */

    const role =
        String(
            OrganizationState.currentUser?.role || ""
        )
        .trim()
        .toLowerCase();


    /*
       Organization settings should be available to:

       owner
       admin

       Manager/staff/attendant should not edit
       organization settings.
    */

    const allowedRoles = [
        "owner",
        "admin"
    ];


    if (!allowedRoles.includes(role)) {

        renderPermissionDenied();

        return;

    }


    /* =====================================================
       LOAD ORGANIZATION
    ===================================================== */

    await loadOrganization();

}


/* =========================================================
   NORMALIZE CURRENT USER
========================================================= */

function normalizeCurrentUser(response) {

    const user =
        response?.user ||
        response?.data?.user ||
        response?.data ||
        response ||
        null;


    if (
        !user ||
        typeof user !== "object"
    ) {

        return null;

    }


    return {

        id:
            user.id ||
            user.user_id ||
            user.auth_user_id ||
            null,

        fullName:
            user.fullName ||
            user.full_name ||
            user.name ||
            "",

        email:
            user.email ||
            "",

        role:
            user.role ||
            "attendant",

        organizationId:
            user.organizationId ||
            user.organization_id ||
            user.organization?.id ||
            null

    };

}


/* =========================================================
   LOAD ORGANIZATION
========================================================= */

async function loadOrganization() {

    if (OrganizationState.isLoading) {
        return;
    }


    OrganizationState.isLoading = true;

    OrganizationState.error = null;


    renderLoading();


    try {

        const response =
            await FuelGapAPI.getOrganization();


        const organization =
            normalizeOrganization(response);


        if (!organization) {

            OrganizationState.organization = null;

            renderNoOrganization();

            return;

        }


        OrganizationState.organization =
            organization;


        OrganizationState.loadedAt =
            new Date();


        renderOrganization();

    }
    catch (error) {

        console.error(
            "FuelGap Organization load error:",
            error
        );


        OrganizationState.error =
            getErrorMessage(
                error,
                "Unable to load organization."
            );


        renderError(
            OrganizationState.error
        );

    }
    finally {

        OrganizationState.isLoading = false;

    }

}


/* =========================================================
   NORMALIZE ORGANIZATION RESPONSE
========================================================= */

function normalizeOrganization(response) {

    /*
       Support possible backend response formats:

       {
           organization: {...}
       }

       {
           data: {
               organization: {...}
           }
       }

       {
           data: {...}
       }

       {
           id: ...
       }
    */

    let organization =
        response?.organization ||
        response?.data?.organization ||
        response?.data ||
        response ||
        null;


    if (
        !organization ||
        typeof organization !== "object" ||
        Array.isArray(organization)
    ) {

        return null;

    }


    return {

        id:
            organization.id ||
            organization.organization_id ||
            null,

        name:
            organization.name ||
            organization.organization_name ||
            "",

        email:
            organization.email ||
            "",

        phone:
            organization.phone ||
            organization.phone_number ||
            "",

        createdAt:
            organization.created_at ||
            organization.createdAt ||
            null,

        updatedAt:
            organization.updated_at ||
            organization.updatedAt ||
            null

    };

}


/* =========================================================
   RENDER LOADING
========================================================= */

function renderLoading() {

    const pageContent =
        document.getElementById("pageContent");


    if (!pageContent) {
        return;
    }


    pageContent.innerHTML = `

        <div class="fg-org-page">

            <div class="fg-org-loading-card">

                <div class="fg-org-spinner"></div>

                <h3>
                    Loading organization
                </h3>

                <p>
                    Fetching your organization information...
                </p>

            </div>

        </div>

    `;

}


/* =========================================================
   RENDER PERMISSION DENIED
========================================================= */

function renderPermissionDenied() {

    const pageContent =
        document.getElementById("pageContent");


    if (!pageContent) {
        return;
    }


    pageContent.innerHTML = `

        <div class="fg-org-page">

            <div class="fg-org-notice fg-org-notice-danger">

                <div class="fg-org-notice-icon">

                    <i class="fas fa-lock"></i>

                </div>

                <div>

                    <h3>
                        Access Restricted
                    </h3>

                    <p>
                        You do not have permission to manage
                        organization settings.
                    </p>

                </div>

            </div>

        </div>

    `;

}


/* =========================================================
   RENDER NO ORGANIZATION
========================================================= */

function renderNoOrganization() {

    const pageContent =
        document.getElementById("pageContent");


    if (!pageContent) {
        return;
    }


    pageContent.innerHTML = `

        <div class="fg-org-page">

            <div class="fg-org-notice fg-org-notice-warning">

                <div class="fg-org-notice-icon">

                    <i class="fas fa-building"></i>

                </div>

                <div>

                    <h3>
                        No Organization Found
                    </h3>

                    <p>
                        Your account is not currently connected
                        to an organization.
                    </p>

                    <button
                        type="button"
                        class="fg-org-btn fg-org-btn-primary"
                        id="organizationRetryBtn"
                    >

                        <i class="fas fa-refresh"></i>

                        Try Again

                    </button>

                </div>

            </div>

        </div>

    `;


    const retryButton =
        document.getElementById(
            "organizationRetryBtn"
        );


    if (retryButton) {

        retryButton.addEventListener(
            "click",
            loadOrganization
        );

    }

}


/* =========================================================
   RENDER ERROR
========================================================= */

function renderError(message) {

    const pageContent =
        document.getElementById("pageContent");


    if (!pageContent) {
        return;
    }


    const safeMessage =
        message ||
        "An unexpected error occurred.";


    pageContent.innerHTML = `

        <div class="fg-org-page">

            <div class="fg-org-notice fg-org-notice-danger">

                <div class="fg-org-notice-icon">

                    <i class="fas fa-triangle-exclamation"></i>

                </div>

                <div>

                    <h3>
                        Unable to Load Organization
                    </h3>

                    <p>
                        ${escapeHtml(safeMessage)}
                    </p>

                    <button
                        type="button"
                        class="fg-org-btn fg-org-btn-primary"
                        id="organizationErrorRetryBtn"
                    >

                        <i class="fas fa-refresh"></i>

                        Retry

                    </button>

                </div>

            </div>

        </div>

    `;


    const retryButton =
        document.getElementById(
            "organizationErrorRetryBtn"
        );


    if (retryButton) {

        retryButton.addEventListener(
            "click",
            loadOrganization
        );

    }

}


/* =========================================================
   RENDER ORGANIZATION
========================================================= */

function renderOrganization() {

    const pageContent =
        document.getElementById("pageContent");


    if (!pageContent) {
        return;
    }


    const organization =
        OrganizationState.organization;


    if (!organization) {

        renderNoOrganization();

        return;

    }


    const initials =
        getOrganizationInitials(
            organization.name
        );


    const role =
        capitalize(
            OrganizationState
                .currentUser
                ?.role ||
            "User"
        );


    const accountName =
        OrganizationState
            .currentUser
            ?.fullName ||
        "Not available";


    const accountEmail =
        OrganizationState
            .currentUser
            ?.email ||
        "Not available";


    const organizationStatus =
        organization.isActive === false ||
        organization.status === "inactive"
            ? "Inactive"
            : "Active";


    pageContent.innerHTML = `

        <div class="fg-org-page">

            <!-- =========================================
                 PAGE HEADER
            ========================================== -->

            <div class="fg-org-header">

                <div>

                    <div class="fg-org-breadcrumb">

                        <span>
                            Settings
                        </span>

                        <i class="fas fa-chevron-right"></i>

                        <strong>
                            Organization
                        </strong>

                    </div>

                    <h1>
                        Organization
                    </h1>

                    <p>
                        Manage your FuelGap organization profile
                        and business information.
                    </p>

                </div>


                <div class="fg-org-header-actions">

                    <button
                        type="button"
                        class="fg-org-btn fg-org-btn-secondary"
                        id="organizationRefreshBtn"
                    >

                        <i class="fas fa-refresh"></i>

                        <span>
                            Refresh
                        </span>

                    </button>


                    <button
                        type="button"
                        class="fg-org-btn fg-org-btn-primary"
                        id="organizationEditBtn"
                    >

                        <i class="fas fa-pen"></i>

                        <span>
                            Edit Organization
                        </span>

                    </button>

                </div>

            </div>


            <!-- =========================================
                 ORGANIZATION HERO
            ========================================== -->

            <div class="fg-org-hero">

                <div class="fg-org-avatar">

                    ${escapeHtml(initials)}

                </div>


                <div class="fg-org-hero-info">

                    <div class="fg-org-title-row">

                        <h2>

                            ${escapeHtml(
                                organization.name ||
                                "Unnamed Organization"
                            )}

                        </h2>


                        <span class="
                            fg-org-status
                            ${
                                organizationStatus === "Active"
                                    ? ""
                                    : "fg-org-status-inactive"
                            }
                        ">

                            <span class="fg-org-status-dot"></span>

                            ${escapeHtml(
                                organizationStatus
                            )}

                        </span>

                    </div>


                    <p class="fg-org-hero-email">

                        <i class="fas fa-envelope"></i>

                        ${escapeHtml(
                            organization.email ||
                            "No email provided"
                        )}

                    </p>


                    <p class="fg-org-hero-subtitle">

                        FuelGap Organization

                    </p>

                </div>

            </div>


            <!-- =========================================
                 STATS
            ========================================== -->

            <div class="fg-org-stats">

                <div class="fg-org-stat-card">

                    <div class="fg-org-stat-icon">

                        <i class="fas fa-building"></i>

                    </div>

                    <div>

                        <span class="fg-org-stat-label">
                            Organization
                        </span>

                        <strong>
                            ${escapeHtml(
                                organizationStatus
                            )}
                        </strong>

                    </div>

                </div>


                <div class="fg-org-stat-card">

                    <div class="fg-org-stat-icon">

                        <i class="fas fa-calendar-plus"></i>

                    </div>

                    <div>

                        <span class="fg-org-stat-label">
                            Created
                        </span>

                        <strong>
                            ${formatDate(
                                organization.createdAt
                            )}
                        </strong>

                    </div>

                </div>


                <div class="fg-org-stat-card">

                    <div class="fg-org-stat-icon">

                        <i class="fas fa-clock"></i>

                    </div>

                    <div>

                        <span class="fg-org-stat-label">
                            Last Updated
                        </span>

                        <strong>
                            ${formatDate(
                                organization.updatedAt
                            )}
                        </strong>

                    </div>

                </div>


                <div class="fg-org-stat-card">

                    <div class="fg-org-stat-icon">

                        <i class="fas fa-id-card"></i>

                    </div>

                    <div>

                        <span class="fg-org-stat-label">
                            Organization ID
                        </span>

                        <strong
                            class="fg-org-stat-id"
                            title="${escapeHtml(
                                organization.id || "-"
                            )}"
                        >

                            ${escapeHtml(
                                organization.id
                                    ? shortenId(
                                        organization.id
                                    )
                                    : "-"
                            )}

                        </strong>

                    </div>

                </div>

            </div>


            <!-- =========================================
                 MAIN GRID
            ========================================== -->

            <div class="fg-org-grid">

                <!-- =====================================
                     BUSINESS INFORMATION
                ====================================== -->

                <section class="fg-org-card">

                    <div class="fg-org-card-header">

                        <div>

                            <span class="fg-org-card-eyebrow">
                                Organization Profile
                            </span>

                            <h3>
                                Business Information
                            </h3>

                            <p>
                                Your organization details
                                used throughout FuelGap.
                            </p>

                        </div>


                        <button
                            type="button"
                            class="fg-org-icon-btn"
                            id="organizationEditIconBtn"
                            title="Edit organization"
                        >

                            <i class="fas fa-pen"></i>

                        </button>

                    </div>


                    <div class="fg-org-details">

                        <div class="fg-org-detail">

                            <div class="fg-org-detail-icon">

                                <i class="fas fa-building"></i>

                            </div>

                            <div>

                                <span>
                                    Organization Name
                                </span>

                                <strong>
                                    ${escapeHtml(
                                        organization.name ||
                                        "Not provided"
                                    )}
                                </strong>

                            </div>

                        </div>


                        <div class="fg-org-detail">

                            <div class="fg-org-detail-icon">

                                <i class="fas fa-envelope"></i>

                            </div>

                            <div>

                                <span>
                                    Email Address
                                </span>

                                <strong>
                                    ${escapeHtml(
                                        organization.email ||
                                        "Not provided"
                                    )}
                                </strong>

                            </div>

                        </div>


                        <div class="fg-org-detail">

                            <div class="fg-org-detail-icon">

                                <i class="fas fa-phone"></i>

                            </div>

                            <div>

                                <span>
                                    Phone Number
                                </span>

                                <strong>
                                    ${escapeHtml(
                                        organization.phone ||
                                        "Not provided"
                                    )}
                                </strong>

                            </div>

                        </div>

                    </div>

                </section>


                <!-- =====================================
                     ACCOUNT INFORMATION
                ====================================== -->

                <section class="fg-org-card">

                    <div class="fg-org-card-header">

                        <div>

                            <span class="fg-org-card-eyebrow">
                                System Information
                            </span>

                            <h3>
                                Account Information
                            </h3>

                            <p>
                                Organization and account
                                connection details.
                            </p>

                        </div>

                    </div>


                    <div class="fg-org-details">

                        <div class="fg-org-detail">

                            <div class="fg-org-detail-icon">

                                <i class="fas fa-user-shield"></i>

                            </div>

                            <div>

                                <span>
                                    Current Role
                                </span>

                                <strong>
                                    ${escapeHtml(role)}
                                </strong>

                            </div>

                        </div>


                        <div class="fg-org-detail">

                            <div class="fg-org-detail-icon">

                                <i class="fas fa-user"></i>

                            </div>

                            <div>

                                <span>
                                    Account Name
                                </span>

                                <strong>
                                    ${escapeHtml(
                                        accountName
                                    )}
                                </strong>

                            </div>

                        </div>


                        <div class="fg-org-detail">

                            <div class="fg-org-detail-icon">

                                <i class="fas fa-envelope"></i>

                            </div>

                            <div>

                                <span>
                                    Account Email
                                </span>

                                <strong>
                                    ${escapeHtml(
                                        accountEmail
                                    )}
                                </strong>

                            </div>

                        </div>


                        <div class="fg-org-detail">

                            <div class="fg-org-detail-icon">

                                <i class="fas fa-shield-halved"></i>

                            </div>

                            <div>

                                <span>
                                    Security
                                </span>

                                <strong class="fg-org-secure-text">

                                    <i class="fas fa-circle-check"></i>

                                    Authenticated

                                </strong>

                            </div>

                        </div>

                    </div>

                </section>

            </div>


            <!-- =========================================
                 ORGANIZATION ID CARD
            ========================================== -->

            <section class="fg-org-card fg-org-id-card">

                <div class="fg-org-id-content">

                    <div class="fg-org-id-icon">

                        <i class="fas fa-fingerprint"></i>

                    </div>


                    <div>

                        <span class="fg-org-card-eyebrow">
                            System Identifier
                        </span>

                        <h3>
                            Organization ID
                        </h3>

                        <p>
                            This unique identifier connects
                            your organization to stations,
                            staff, pumps, sales, shifts,
                            reports and other FuelGap records.
                        </p>

                    </div>

                </div>


                <div class="fg-org-id-value">

                    <code>
                        ${escapeHtml(
                            organization.id ||
                            "Not available"
                        )}
                    </code>


                    <button
                        type="button"
                        class="fg-org-copy-btn"
                        id="organizationCopyIdBtn"
                        title="Copy organization ID"
                    >

                        <i class="fas fa-copy"></i>

                    </button>

                </div>

            </section>


            <!-- =========================================
                 LAST LOADED
            ========================================== -->

            <div class="fg-org-last-loaded">

                <i class="fas fa-clock"></i>

                <span>
                    Last loaded:
                    ${formatDateTime(
                        OrganizationState.loadedAt
                    )}
                </span>

            </div>


            <!-- =========================================
                 FOOTER NOTE
            ========================================== -->

            <div class="fg-org-footer-note">

                <i class="fas fa-circle-info"></i>

                <span>
                    Organization changes are saved directly
                    to your FuelGap backend.
                </span>

            </div>

        </div>


        <!-- =============================================
             EDIT MODAL
        ============================================== -->

        <div
            class="fg-org-modal-overlay"
            id="organizationModal"
            aria-hidden="true"
        >

            <div
                class="fg-org-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="organizationModalTitle"
            >

                <div class="fg-org-modal-header">

                    <div>

                        <span class="fg-org-card-eyebrow">
                            Organization Settings
                        </span>

                        <h2 id="organizationModalTitle">
                            Edit Organization
                        </h2>

                        <p>
                            Update your organization information.
                        </p>

                    </div>


                    <button
                        type="button"
                        class="fg-org-modal-close"
                        id="organizationModalClose"
                        aria-label="Close"
                    >

                        <i class="fas fa-xmark"></i>

                    </button>

                </div>


                <form
                    id="organizationForm"
                    class="fg-org-form"
                    novalidate
                >

                    <div
                        id="organizationFormMessage"
                        class="fg-org-form-message"
                        hidden
                    ></div>


                    <div class="fg-org-form-group">

                        <label for="organizationName">

                            Organization Name

                            <span>*</span>

                        </label>


                        <div class="fg-org-input-wrapper">

                            <i class="fas fa-building"></i>

                            <input
                                type="text"
                                id="organizationName"
                                name="name"
                                placeholder="Enter organization name"
                                maxlength="150"
                                autocomplete="organization"
                                required
                            />

                        </div>

                    </div>


                    <div class="fg-org-form-group">

                        <label for="organizationEmail">

                            Email Address

                            <span>*</span>

                        </label>


                        <div class="fg-org-input-wrapper">

                            <i class="fas fa-envelope"></i>

                            <input
                                type="email"
                                id="organizationEmail"
                                name="email"
                                placeholder="organization@example.com"
                                maxlength="255"
                                autocomplete="email"
                                required
                            />

                        </div>

                    </div>


                    <div class="fg-org-form-group">

                        <label for="organizationPhone">

                            Phone Number

                        </label>


                        <div class="fg-org-input-wrapper">

                            <i class="fas fa-phone"></i>

                            <input
                                type="tel"
                                id="organizationPhone"
                                name="phone"
                                placeholder="08012345678"
                                maxlength="30"
                                autocomplete="tel"
                            />

                        </div>

                    </div>


                    <div class="fg-org-modal-actions">

                        <button
                            type="button"
                            class="fg-org-btn fg-org-btn-secondary"
                            id="organizationCancelBtn"
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            class="fg-org-btn fg-org-btn-primary"
                            id="organizationSaveBtn"
                        >

                            <span
                                id="organizationSaveSpinner"
                                class="fg-org-button-spinner"
                                hidden
                            ></span>


                            <i
                                id="organizationSaveIcon"
                                class="fas fa-check"
                            ></i>


                            <span id="organizationSaveText">
                                Save Changes
                            </span>

                        </button>

                    </div>

                </form>

            </div>

        </div>

    `;


    attachOrganizationEvents();

}


/* =========================================================
   ATTACH EVENTS
========================================================= */

function attachOrganizationEvents() {

    /* =====================================================
       REFRESH
    ===================================================== */

    const refreshButton =
        document.getElementById(
            "organizationRefreshBtn"
        );


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            async () => {

                if (OrganizationState.isLoading) {
                    return;
                }


                await loadOrganization();

            }
        );

    }


    /* =====================================================
       EDIT BUTTONS
    ===================================================== */

    const editButton =
        document.getElementById(
            "organizationEditBtn"
        );


    const editIconButton =
        document.getElementById(
            "organizationEditIconBtn"
        );


    if (editButton) {

        editButton.addEventListener(
            "click",
            openOrganizationModal
        );

    }


    if (editIconButton) {

        editIconButton.addEventListener(
            "click",
            openOrganizationModal
        );

    }


    /* =====================================================
       COPY ID
    ===================================================== */

    const copyIdButton =
        document.getElementById(
            "organizationCopyIdBtn"
        );


    if (copyIdButton) {

        copyIdButton.addEventListener(
            "click",
            copyOrganizationId
        );

    }


    /* =====================================================
       MODAL
    ===================================================== */

    const modalClose =
        document.getElementById(
            "organizationModalClose"
        );


    const cancelButton =
        document.getElementById(
            "organizationCancelBtn"
        );


    if (modalClose) {

        modalClose.addEventListener(
            "click",
            closeOrganizationModal
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeOrganizationModal
        );

    }


    const modal =
        document.getElementById(
            "organizationModal"
        );


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    closeOrganizationModal();

                }

            }
        );

    }


    /* =====================================================
       FORM
    ===================================================== */

    const form =
        document.getElementById(
            "organizationForm"
        );


    if (form) {

        form.addEventListener(
            "submit",
            handleOrganizationSubmit
        );

    }


    /* =====================================================
       ESCAPE KEY
    ===================================================== */

    document.addEventListener(
        "keydown",
        handleOrganizationEscape
    );

}


/* =========================================================
   OPEN MODAL
========================================================= */

function openOrganizationModal() {

    const organization =
        OrganizationState.organization;


    if (!organization) {
        return;
    }


    const modal =
        document.getElementById(
            "organizationModal"
        );


    const nameInput =
        document.getElementById(
            "organizationName"
        );


    const emailInput =
        document.getElementById(
            "organizationEmail"
        );


    const phoneInput =
        document.getElementById(
            "organizationPhone"
        );


    const formMessage =
        document.getElementById(
            "organizationFormMessage"
        );


    if (!modal) {
        return;
    }


    if (nameInput) {

        nameInput.value =
            organization.name || "";

    }


    if (emailInput) {

        emailInput.value =
            organization.email || "";

    }


    if (phoneInput) {

        phoneInput.value =
            organization.phone || "";

    }


    if (formMessage) {

        formMessage.hidden = true;

        formMessage.innerHTML = "";

        formMessage.className =
            "fg-org-form-message";

    }


    modal.classList.add(
        "is-open"
    );


    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.classList.add(
        "fg-org-modal-open"
    );


    setTimeout(() => {

        if (nameInput) {

            nameInput.focus();

        }

    }, 100);

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeOrganizationModal() {

    const modal =
        document.getElementById(
            "organizationModal"
        );


    if (!modal) {
        return;
    }


    if (OrganizationState.isSubmitting) {
        return;
    }


    modal.classList.remove(
        "is-open"
    );


    modal.setAttribute(
        "aria-hidden",
        "true"
    );


    document.body.classList.remove(
        "fg-org-modal-open"
    );

}


/* =========================================================
   ESCAPE KEY
========================================================= */

function handleOrganizationEscape(event) {

    if (event.key !== "Escape") {
        return;
    }


    const modal =
        document.getElementById(
            "organizationModal"
        );


    if (
        modal &&
        modal.classList.contains("is-open")
    ) {

        closeOrganizationModal();

    }

}


/* =========================================================
   SUBMIT ORGANIZATION
========================================================= */

async function handleOrganizationSubmit(event) {

    event.preventDefault();


    if (OrganizationState.isSubmitting) {
        return;
    }


    const nameInput =
        document.getElementById(
            "organizationName"
        );


    const emailInput =
        document.getElementById(
            "organizationEmail"
        );


    const phoneInput =
        document.getElementById(
            "organizationPhone"
        );


    const name =
        nameInput?.value.trim() || "";


    const email =
        emailInput?.value.trim() || "";


    const phone =
        phoneInput?.value.trim() || "";


    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!name) {

        showFormMessage(
            "Please enter the organization name.",
            "error"
        );

        nameInput?.focus();

        return;

    }


    if (name.length < 2) {

        showFormMessage(
            "Organization name must contain at least 2 characters.",
            "error"
        );

        nameInput?.focus();

        return;

    }


    if (!email) {

        showFormMessage(
            "Please enter the organization email address.",
            "error"
        );

        emailInput?.focus();

        return;

    }


    if (!isValidEmail(email)) {

        showFormMessage(
            "Please enter a valid email address.",
            "error"
        );

        emailInput?.focus();

        return;

    }


    /* =====================================================
       SUBMIT
    ===================================================== */

    OrganizationState.isSubmitting = true;

    setOrganizationSaveLoading(true);


    try {

        const response =
            await FuelGapAPI.updateOrganization({

                name,

                email,

                phone

            });


        const updatedOrganization =
            normalizeOrganization(response);


        if (updatedOrganization) {

            OrganizationState.organization =
                updatedOrganization;

        }
        else {

            OrganizationState.organization = {

                ...OrganizationState.organization,

                name,

                email,

                phone,

                updatedAt:
                    new Date().toISOString()

            };

        }


        OrganizationState.loadedAt =
            new Date();


        closeOrganizationModal();


        renderOrganization();


        showToast(
            "Organization updated successfully.",
            "success"
        );


    }
    catch (error) {

        console.error(
            "FuelGap Organization update error:",
            error
        );


        showFormMessage(
            getErrorMessage(
                error,
                "Unable to update organization."
            ),
            "error"
        );

    }
    finally {

        OrganizationState.isSubmitting = false;

        setOrganizationSaveLoading(false);

    }

}


/* =========================================================
   SET SAVE BUTTON LOADING
========================================================= */

function setOrganizationSaveLoading(isLoading) {

    const saveButton =
        document.getElementById(
            "organizationSaveBtn"
        );


    const spinner =
        document.getElementById(
            "organizationSaveSpinner"
        );


    const icon =
        document.getElementById(
            "organizationSaveIcon"
        );


    const text =
        document.getElementById(
            "organizationSaveText"
        );


    if (saveButton) {

        saveButton.disabled =
            isLoading;

    }


    if (spinner) {

        spinner.hidden =
            !isLoading;

    }


    if (icon) {

        icon.hidden =
            isLoading;

    }


    if (text) {

        text.textContent =
            isLoading
                ? "Saving..."
                : "Save Changes";

    }

}


/* =========================================================
   SHOW FORM MESSAGE
========================================================= */

function showFormMessage(
    message,
    type = "error"
) {

    const element =
        document.getElementById(
            "organizationFormMessage"
        );


    if (!element) {
        return;
    }


    element.hidden = false;


    element.className =
        `fg-org-form-message ${type}`;


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


/* =========================================================
   COPY ORGANIZATION ID
========================================================= */

async function copyOrganizationId() {

    const id =
        OrganizationState.organization?.id;


    if (!id) {

        showToast(
            "Organization ID is not available.",
            "error"
        );

        return;

    }


    try {

        if (
            navigator.clipboard &&
            typeof navigator.clipboard.writeText === "function"
        ) {

            await navigator.clipboard.writeText(
                String(id)
            );

        }
        else {

            const textarea =
                document.createElement("textarea");

            textarea.value =
                String(id);

            textarea.style.position =
                "fixed";

            textarea.style.opacity =
                "0";

            document.body.appendChild(
                textarea
            );

            textarea.select();

            document.execCommand(
                "copy"
            );

            textarea.remove();

        }


        showToast(
            "Organization ID copied.",
            "success"
        );

    }
    catch (error) {

        console.error(
            "Copy organization ID error:",
            error
        );


        showToast(
            "Unable to copy organization ID.",
            "error"
        );

    }

}


/* =========================================================
   SHOW TOAST
========================================================= */

function showToast(
    message,
    type = "success"
) {

    let container =
        document.getElementById(
            "fgOrganizationToastContainer"
        );


    if (!container) {

        container =
            document.createElement("div");


        container.id =
            "fgOrganizationToastContainer";


        container.className =
            "fg-org-toast-container";


        document.body.appendChild(
            container
        );

    }


    const toast =
        document.createElement("div");


    toast.className =
        `fg-org-toast ${type}`;


    toast.innerHTML = `

        <div class="fg-org-toast-icon">

            <i class="${
                type === "success"
                    ? "fas fa-circle-check"
                    : "fas fa-circle-exclamation"
            }"></i>

        </div>


        <div class="fg-org-toast-content">

            <strong>

                ${
                    type === "success"
                        ? "Success"
                        : "Error"
                }

            </strong>

            <span>

                ${escapeHtml(message)}

            </span>

        </div>


        <button
            type="button"
            class="fg-org-toast-close"
            aria-label="Close notification"
        >

            <i class="fas fa-xmark"></i>

        </button>

    `;


    container.appendChild(
        toast
    );


    const closeButton =
        toast.querySelector(
            ".fg-org-toast-close"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            () => {

                removeToast(toast);

            }
        );

    }


    requestAnimationFrame(() => {

        toast.classList.add(
            "show"
        );

    });


    setTimeout(() => {

        removeToast(toast);

    }, 4500);

}


/* =========================================================
   REMOVE TOAST
========================================================= */

function removeToast(toast) {

    if (!toast) {
        return;
    }


    toast.classList.remove(
        "show"
    );


    setTimeout(() => {

        if (toast && toast.parentNode) {

            toast.remove();

        }

    }, 250);

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(dateValue) {

    if (!dateValue) {
        return "—";
    }


    const date =
        new Date(dateValue);


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
   FORMAT DATE + TIME
========================================================= */

function formatDateTime(dateValue) {

    if (!dateValue) {
        return "—";
    }


    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    return date.toLocaleString(
        "en-NG",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


/* =========================================================
   GET ORGANIZATION INITIALS
========================================================= */

function getOrganizationInitials(name) {

    if (!name) {
        return "FG";
    }


    const words =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (words.length === 1) {

        return words[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        words[0].charAt(0) +
        words[1].charAt(0)
    ).toUpperCase();

}


/* =========================================================
   SHORTEN ID
========================================================= */

function shortenId(id) {

    const value =
        String(id || "");


    if (value.length <= 20) {
        return value;
    }


    return (
        value.substring(0, 10) +
        "..." +
        value.substring(value.length - 8)
    );

}


/* =========================================================
   VALIDATE EMAIL
========================================================= */

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(
            String(email).trim()
        );

}


/* =========================================================
   CAPITALIZE
========================================================= */

function capitalize(value) {

    if (!value) {
        return "";
    }


    const text =
        String(value);


    return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
    );

}


/* =========================================================
   GET ERROR MESSAGE
========================================================= */

function getErrorMessage(
    error,
    fallback = "Something went wrong."
) {

    if (!error) {
        return fallback;
    }


    if (
        typeof error === "string"
    ) {

        return error;

    }


    return (
        error.message ||
        error.error ||
        error.details ||
        fallback
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

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


/* =========================================================
   INJECT ORGANIZATION CSS
========================================================= */

function injectOrganizationStyles() {

    if (
        document.getElementById(
            "fuelgapOrganizationStyles"
        )
    ) {

        return;
    }


    const style =
        document.createElement("style");


    style.id =
        "fuelgapOrganizationStyles";


    style.textContent = `

        /* =====================================================
           ORGANIZATION PAGE
        ===================================================== */

        .fg-org-page {

            width: 100%;

            max-width: 1500px;

            margin: 0 auto;

            padding: 28px;

            box-sizing: border-box;

            color: #111827;

        }


        /* =====================================================
           HEADER
        ===================================================== */

        .fg-org-header {

            display: flex;

            align-items: flex-end;

            justify-content: space-between;

            gap: 24px;

            margin-bottom: 24px;

        }


        .fg-org-breadcrumb {

            display: flex;

            align-items: center;

            gap: 8px;

            margin-bottom: 8px;

            font-size: 12px;

            color: #9ca3af;

        }


        .fg-org-breadcrumb i {

            font-size: 9px;

        }


        .fg-org-breadcrumb strong {

            color: #6b7280;

            font-weight: 600;

        }


        .fg-org-header h1 {

            margin: 0;

            font-size: 30px;

            line-height: 1.2;

            font-weight: 800;

            letter-spacing: -.6px;

            color: #111827;

        }


        .fg-org-header p {

            margin: 8px 0 0;

            color: #6b7280;

            font-size: 14px;

            line-height: 1.6;

        }


        .fg-org-header-actions {

            display: flex;

            align-items: center;

            gap: 10px;

            flex-shrink: 0;

        }


        /* =====================================================
           BUTTONS
        ===================================================== */

        .fg-org-btn {

            min-height: 42px;

            border: 1px solid transparent;

            border-radius: 10px;

            padding: 0 16px;

            display: inline-flex;

            align-items: center;

            justify-content: center;

            gap: 8px;

            font-family: inherit;

            font-size: 13px;

            font-weight: 700;

            cursor: pointer;

            transition:
                background .2s ease,
                border-color .2s ease,
                box-shadow .2s ease,
                transform .2s ease;

        }


        .fg-org-btn:hover {

            transform: translateY(-1px);

        }


        .fg-org-btn:disabled {

            opacity: .65;

            cursor: not-allowed;

            transform: none;

        }


        .fg-org-btn-primary {

            background: #facc15;

            border-color: #facc15;

            color: #111827;

            box-shadow:
                0 4px 12px
                rgba(250, 204, 21, .18);

        }


        .fg-org-btn-primary:hover {

            background: #eab308;

            border-color: #eab308;

        }


        .fg-org-btn-secondary {

            background: #ffffff;

            border-color: #e5e7eb;

            color: #374151;

        }


        .fg-org-btn-secondary:hover {

            background: #f9fafb;

            border-color: #d1d5db;

        }


        /* =====================================================
           HERO
        ===================================================== */

        .fg-org-hero {

            display: flex;

            align-items: center;

            gap: 20px;

            padding: 26px;

            background:
                linear-gradient(
                    135deg,
                    #ffffff 0%,
                    #fffdf0 100%
                );

            border: 1px solid #f0f0f0;

            border-radius: 16px;

            box-shadow:
                0 8px 30px
                rgba(17, 24, 39, .05);

            margin-bottom: 20px;

        }


        .fg-org-avatar {

            width: 72px;

            height: 72px;

            min-width: 72px;

            border-radius: 18px;

            display: flex;

            align-items: center;

            justify-content: center;

            background: #facc15;

            color: #111827;

            font-size: 22px;

            font-weight: 900;

            box-shadow:
                0 8px 20px
                rgba(250, 204, 21, .25);

        }


        .fg-org-hero-info {

            min-width: 0;

            flex: 1;

        }


        .fg-org-title-row {

            display: flex;

            align-items: center;

            flex-wrap: wrap;

            gap: 12px;

        }


        .fg-org-title-row h2 {

            margin: 0;

            font-size: 23px;

            font-weight: 800;

            color: #111827;

            word-break: break-word;

        }


        .fg-org-status {

            display: inline-flex;

            align-items: center;

            gap: 7px;

            padding: 5px 10px;

            border-radius: 999px;

            background: #fef9c3;

            color: #854d0e;

            font-size: 11px;

            font-weight: 800;

        }


        .fg-org-status-inactive {

            background: #fee2e2;

            color: #991b1b;

        }


        .fg-org-status-dot {

            width: 7px;

            height: 7px;

            border-radius: 50%;

            background: #65a30d;

            box-shadow:
                0 0 0 3px
                rgba(101, 163, 13, .12);

        }


        .fg-org-status-inactive
        .fg-org-status-dot {

            background: #dc2626;

            box-shadow:
                0 0 0 3px
                rgba(220, 38, 38, .12);

        }


        .fg-org-hero-email {

            display: flex;

            align-items: center;

            gap: 8px;

            margin: 8px 0 0;

            color: #4b5563;

            font-size: 13px;

        }


        .fg-org-hero-email i {

            color: #ca8a04;

        }


        .fg-org-hero-subtitle {

            margin: 5px 0 0;

            color: #9ca3af;

            font-size: 12px;

        }


        /* =====================================================
           STATS
        ===================================================== */

        .fg-org-stats {

            display: grid;

            grid-template-columns:
                repeat(4, minmax(0, 1fr));

            gap: 16px;

            margin-bottom: 20px;

        }


        .fg-org-stat-card {

            display: flex;

            align-items: center;

            gap: 14px;

            min-width: 0;

            padding: 18px;

            background: #ffffff;

            border: 1px solid #eeeeee;

            border-radius: 14px;

            box-shadow:
                0 4px 18px
                rgba(17, 24, 39, .035);

        }


        .fg-org-stat-icon {

            width: 42px;

            height: 42px;

            min-width: 42px;

            border-radius: 11px;

            display: flex;

            align-items: center;

            justify-content: center;

            background: #fef9c3;

            color: #ca8a04;

            font-size: 15px;

        }


        .fg-org-stat-label {

            display: block;

            margin-bottom: 4px;

            color: #9ca3af;

            font-size: 11px;

            font-weight: 600;

        }


        .fg-org-stat-card strong {

            display: block;

            color: #111827;

            font-size: 14px;

            font-weight: 800;

            overflow: hidden;

            text-overflow: ellipsis;

            white-space: nowrap;

        }


        .fg-org-stat-id {

            font-family:
                ui-monospace,
                SFMono-Regular,
                Menlo,
                Monaco,
                Consolas,
                monospace;

        }


        /* =====================================================
           MAIN GRID
        ===================================================== */

        .fg-org-grid {

            display: grid;

            grid-template-columns:
                repeat(2, minmax(0, 1fr));

            gap: 20px;

            margin-bottom: 20px;

        }


        .fg-org-card {

            background: #ffffff;

            border: 1px solid #eeeeee;

            border-radius: 16px;

            box-shadow:
                0 6px 24px
                rgba(17, 24, 39, .035);

            overflow: hidden;

        }


        .fg-org-card-header {

            display: flex;

            align-items: flex-start;

            justify-content: space-between;

            gap: 16px;

            padding: 22px 22px 18px;

            border-bottom: 1px solid #f1f1f1;

        }


        .fg-org-card-eyebrow {

            display: block;

            margin-bottom: 5px;

            color: #ca8a04;

            font-size: 10px;

            font-weight: 800;

            letter-spacing: .8px;

            text-transform: uppercase;

        }


        .fg-org-card-header h3 {

            margin: 0;

            color: #111827;

            font-size: 17px;

            font-weight: 800;

        }


        .fg-org-card-header p {

            margin: 6px 0 0;

            color: #9ca3af;

            font-size: 12px;

            line-height: 1.5;

        }


        .fg-org-icon-btn {

            width: 36px;

            height: 36px;

            min-width: 36px;

            border: 1px solid #e5e7eb;

            border-radius: 9px;

            background: #ffffff;

            color: #6b7280;

            display: flex;

            align-items: center;

            justify-content: center;

            cursor: pointer;

            transition: .2s ease;

        }


        .fg-org-icon-btn:hover {

            background: #fef9c3;

            border-color: #fde68a;

            color: #ca8a04;

        }


        /* =====================================================
           DETAILS
        ===================================================== */

        .fg-org-details {

            padding: 4px 22px 8px;

        }


        .fg-org-detail {

            display: flex;

            align-items: center;

            gap: 14px;

            padding: 16px 0;

            border-bottom: 1px solid #f3f4f6;

        }


        .fg-org-detail:last-child {

            border-bottom: none;

        }


        .fg-org-detail-icon {

            width: 38px;

            height: 38px;

            min-width: 38px;

            border-radius: 10px;

            background: #fffbeb;

            color: #ca8a04;

            display: flex;

            align-items: center;

            justify-content: center;

            font-size: 13px;

        }


        .fg-org-detail div:last-child {

            min-width: 0;

        }


        .fg-org-detail span {

            display: block;

            margin-bottom: 4px;

            color: #9ca3af;

            font-size: 11px;

            font-weight: 600;

        }


        .fg-org-detail strong {

            display: block;

            color: #1f2937;

            font-size: 13px;

            font-weight: 700;

            word-break: break-word;

        }


        .fg-org-secure-text {

            display: flex !important;

            align-items: center;

            gap: 6px;

            color: #15803d !important;

        }


        /* =====================================================
           ORGANIZATION ID
        ===================================================== */

        .fg-org-id-card {

            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 24px;

            padding: 22px;

            margin-bottom: 12px;

        }


        .fg-org-id-content {

            display: flex;

            align-items: flex-start;

            gap: 14px;

            min-width: 0;

        }


        .fg-org-id-icon {

            width: 42px;

            height: 42px;

            min-width: 42px;

            border-radius: 11px;

            background: #fef9c3;

            color: #ca8a04;

            display: flex;

            align-items: center;

            justify-content: center;

        }


        .fg-org-id-content h3 {

            margin: 0;

            font-size: 16px;

            font-weight: 800;

        }


        .fg-org-id-content p {

            max-width: 720px;

            margin: 6px 0 0;

            color: #9ca3af;

            font-size: 12px;

            line-height: 1.6;

        }


        .fg-org-id-value {

            display: flex;

            align-items: center;

            gap: 8px;

            padding: 8px;

            background: #f9fafb;

            border: 1px solid #e5e7eb;

            border-radius: 10px;

            max-width: 420px;

        }


        .fg-org-id-value code {

            padding: 0 5px;

            color: #374151;

            font-family:
                ui-monospace,
                SFMono-Regular,
                Menlo,
                Monaco,
                Consolas,
                monospace;

            font-size: 11px;

            word-break: break-all;

        }


        .fg-org-copy-btn {

            width: 32px;

            height: 32px;

            min-width: 32px;

            border: 0;

            border-radius: 7px;

            background: #facc15;

            color: #111827;

            cursor: pointer;

        }


        .fg-org-copy-btn:hover {

            background: #eab308;

        }


        /* =====================================================
           LAST LOADED
        ===================================================== */

        .fg-org-last-loaded {

            display: flex;

            align-items: center;

            gap: 7px;

            margin-bottom: 8px;

            color: #9ca3af;

            font-size: 11px;

        }


        .fg-org-last-loaded i {

            color: #ca8a04;

        }


        /* =====================================================
           FOOTER NOTE
        ===================================================== */

        .fg-org-footer-note {

            display: flex;

            align-items: center;

            gap: 8px;

            color: #9ca3af;

            font-size: 11px;

            padding: 4px 2px;

        }


        .fg-org-footer-note i {

            color: #ca8a04;

        }


        /* =====================================================
           LOADING
        ===================================================== */

        .fg-org-loading-card {

            min-height: 320px;

            background: #ffffff;

            border: 1px solid #eeeeee;

            border-radius: 16px;

            display: flex;

            flex-direction: column;

            align-items: center;

            justify-content: center;

            text-align: center;

            box-shadow:
                0 6px 24px
                rgba(17, 24, 39, .035);

        }


        .fg-org-spinner {

            width: 38px;

            height: 38px;

            border: 3px solid #fef3c7;

            border-top-color: #eab308;

            border-radius: 50%;

            animation:
                fgOrgSpin .8s linear infinite;

            margin-bottom: 16px;

        }


        @keyframes fgOrgSpin {

            to {
                transform: rotate(360deg);
            }

        }


        .fg-org-loading-card h3 {

            margin: 0;

            font-size: 16px;

        }


        .fg-org-loading-card p {

            margin: 6px 0 0;

            color: #9ca3af;

            font-size: 12px;

        }


        /* =====================================================
           NOTICE
        ===================================================== */

        .fg-org-notice {

            display: flex;

            align-items: flex-start;

            gap: 16px;

            padding: 22px;

            background: #ffffff;

            border-radius: 14px;

            border: 1px solid #e5e7eb;

        }


        .fg-org-notice-warning {

            border-color: #fde68a;

            background: #fffdf0;

        }


        .fg-org-notice-danger {

            border-color: #fecaca;

            background: #fffafa;

        }


        .fg-org-notice-icon {

            width: 42px;

            height: 42px;

            min-width: 42px;

            border-radius: 11px;

            display: flex;

            align-items: center;

            justify-content: center;

            background: #fef3c7;

            color: #b45309;

        }


        .fg-org-notice-danger
        .fg-org-notice-icon {

            background: #fee2e2;

            color: #dc2626;

        }


        .fg-org-notice h3 {

            margin: 0;

            font-size: 16px;

            font-weight: 800;

        }


        .fg-org-notice p {

            margin: 6px 0 14px;

            color: #6b7280;

            font-size: 13px;

            line-height: 1.6;

        }


        /* =====================================================
           MODAL
        ===================================================== */

        body.fg-org-modal-open {

            overflow: hidden;

        }


        .fg-org-modal-overlay {

            position: fixed;

            inset: 0;

            z-index: 9999;

            display: flex;

            align-items: center;

            justify-content: center;

            padding: 20px;

            background:
                rgba(17, 24, 39, .58);

            backdrop-filter: blur(4px);

            opacity: 0;

            visibility: hidden;

            pointer-events: none;

            transition:
                opacity .2s ease,
                visibility .2s ease;

        }


        .fg-org-modal-overlay.is-open {

            opacity: 1;

            visibility: visible;

            pointer-events: auto;

        }


        .fg-org-modal {

            width: 100%;

            max-width: 520px;

            max-height:
                calc(100vh - 40px);

            overflow-y: auto;

            background: #ffffff;

            border-radius: 18px;

            box-shadow:
                0 30px 80px
                rgba(0, 0, 0, .18);

            transform:
                translateY(14px)
                scale(.98);

            transition:
                transform .2s ease;

        }


        .fg-org-modal-overlay.is-open
        .fg-org-modal {

            transform:
                translateY(0)
                scale(1);

        }


        .fg-org-modal-header {

            display: flex;

            align-items: flex-start;

            justify-content: space-between;

            gap: 16px;

            padding: 24px;

            border-bottom: 1px solid #f1f1f1;

        }


        .fg-org-modal-header h2 {

            margin: 0;

            font-size: 20px;

            font-weight: 800;

            color: #111827;

        }


        .fg-org-modal-header p {

            margin: 6px 0 0;

            color: #9ca3af;

            font-size: 12px;

        }


        .fg-org-modal-close {

            width: 36px;

            height: 36px;

            min-width: 36px;

            border: 1px solid #e5e7eb;

            border-radius: 9px;

            background: #ffffff;

            color: #6b7280;

            cursor: pointer;

        }


        .fg-org-modal-close:hover {

            background: #f9fafb;

            color: #111827;

        }


        /* =====================================================
           FORM
        ===================================================== */

        .fg-org-form {

            padding: 24px;

        }


        .fg-org-form-group {

            margin-bottom: 18px;

        }


        .fg-org-form-group label {

            display: block;

            margin-bottom: 7px;

            color: #374151;

            font-size: 12px;

            font-weight: 700;

        }


        .fg-org-form-group label span {

            color: #dc2626;

        }


        .fg-org-input-wrapper {

            position: relative;

        }


        .fg-org-input-wrapper > i {

            position: absolute;

            left: 14px;

            top: 50%;

            transform: translateY(-50%);

            color: #9ca3af;

            font-size: 13px;

            pointer-events: none;

        }


        .fg-org-input-wrapper input {

            width: 100%;

            height: 44px;

            box-sizing: border-box;

            padding:
                0 13px 0 40px;

            border: 1px solid #e5e7eb;

            border-radius: 10px;

            background: #ffffff;

            color: #111827;

            outline: none;

            font-family: inherit;

            font-size: 13px;

            transition:
                border-color .2s ease,
                box-shadow .2s ease;

        }


        .fg-org-input-wrapper input::placeholder {

            color: #b0b4bb;

        }


        .fg-org-input-wrapper input:focus {

            border-color: #facc15;

            box-shadow:
                0 0 0 3px
                rgba(250, 204, 21, .14);

        }


        .fg-org-form-message {

            display: flex;

            align-items: flex-start;

            gap: 8px;

            padding: 11px 12px;

            margin-bottom: 16px;

            border-radius: 9px;

            font-size: 12px;

            line-height: 1.5;

        }


        .fg-org-form-message.error {

            background: #fef2f2;

            border: 1px solid #fecaca;

            color: #b91c1c;

        }


        .fg-org-form-message.success {

            background: #f0fdf4;

            border: 1px solid #bbf7d0;

            color: #15803d;

        }


        .fg-org-modal-actions {

            display: flex;

            align-items: center;

            justify-content: flex-end;

            gap: 10px;

            padding-top: 8px;

        }


        .fg-org-button-spinner {

            width: 14px;

            height: 14px;

            border: 2px solid
                rgba(17, 24, 39, .2);

            border-top-color: #111827;

            border-radius: 50%;

            animation:
                fgOrgSpin .7s linear infinite;

        }


        /* =====================================================
           TOAST
        ===================================================== */

        .fg-org-toast-container {

            position: fixed;

            right: 22px;

            bottom: 22px;

            z-index: 10000;

            display: flex;

            flex-direction: column;

            gap: 10px;

            width: min(
                370px,
                calc(100vw - 32px)
            );

        }


        .fg-org-toast {

            display: flex;

            align-items: flex-start;

            gap: 10px;

            padding: 13px;

            background: #ffffff;

            border: 1px solid #e5e7eb;

            border-radius: 12px;

            box-shadow:
                0 15px 40px
                rgba(17, 24, 39, .12);

            transform:
                translateX(30px);

            opacity: 0;

            transition:
                transform .25s ease,
                opacity .25s ease;

        }


        .fg-org-toast.show {

            transform:
                translateX(0);

            opacity: 1;

        }


        .fg-org-toast-icon {

            width: 30px;

            height: 30px;

            min-width: 30px;

            border-radius: 8px;

            display: flex;

            align-items: center;

            justify-content: center;

            background: #fef9c3;

            color: #ca8a04;

        }


        .fg-org-toast.error
        .fg-org-toast-icon {

            background: #fee2e2;

            color: #dc2626;

        }


        .fg-org-toast-content {

            flex: 1;

            min-width: 0;

        }


        .fg-org-toast-content strong {

            display: block;

            margin-bottom: 2px;

            color: #111827;

            font-size: 12px;

            font-weight: 800;

        }


        .fg-org-toast-content span {

            display: block;

            color: #6b7280;

            font-size: 11px;

            line-height: 1.5;

        }


        .fg-org-toast-close {

            border: 0;

            background: transparent;

            color: #9ca3af;

            cursor: pointer;

            padding: 2px;

        }


        .fg-org-toast-close:hover {

            color: #374151;

        }


        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 1100px) {

            .fg-org-stats {

                grid-template-columns:
                    repeat(2, minmax(0, 1fr));

            }

        }


        @media (max-width: 900px) {

            .fg-org-grid {

                grid-template-columns: 1fr;

            }


            .fg-org-header {

                align-items: flex-start;

                flex-direction: column;

            }


            .fg-org-header-actions {

                width: 100%;

            }


            .fg-org-header-actions
            .fg-org-btn {

                flex: 1;

            }


            .fg-org-id-card {

                flex-direction: column;

                align-items: stretch;

            }


            .fg-org-id-value {

                max-width: none;

            }

        }


        @media (max-width: 650px) {

            .fg-org-page {

                padding: 18px 14px;

            }


            .fg-org-header h1 {

                font-size: 25px;

            }


            .fg-org-header-actions {

                flex-direction: column;

            }


            .fg-org-header-actions
            .fg-org-btn {

                width: 100%;

            }


            .fg-org-hero {

                padding: 20px;

            }


            .fg-org-avatar {

                width: 58px;

                height: 58px;

                min-width: 58px;

                border-radius: 15px;

                font-size: 18px;

            }


            .fg-org-title-row h2 {

                font-size: 19px;

            }


            .fg-org-stats {

                grid-template-columns: 1fr;

            }


            .fg-org-card-header {

                padding: 18px;

            }


            .fg-org-details {

                padding:
                    2px 18px 6px;

            }


            .fg-org-id-card {

                padding: 18px;

            }


            .fg-org-id-content p {

                font-size: 11px;

            }


            .fg-org-modal-overlay {

                padding: 12px;

            }


            .fg-org-modal {

                max-height:
                    calc(100vh - 24px);

                border-radius: 15px;

            }


            .fg-org-modal-header,
            .fg-org-form {

                padding: 18px;

            }


            .fg-org-modal-actions {

                flex-direction: column-reverse;

            }


            .fg-org-modal-actions
            .fg-org-btn {

                width: 100%;

            }


            .fg-org-toast-container {

                right: 14px;

                bottom: 14px;

                width:
                    calc(100vw - 28px);

            }

        }


        @media (max-width: 420px) {

            .fg-org-hero {

                flex-direction: column;

                align-items: flex-start;

            }


            .fg-org-detail {

                align-items: flex-start;

            }


            .fg-org-detail-icon {

                width: 34px;

                height: 34px;

                min-width: 34px;

            }

        }

    `;


    document.head.appendChild(
        style
    );

}


/* =========================================================
   GLOBAL EXPORT
========================================================= */

window.FuelGapOrganization = {

    load: loadOrganization,

    openEdit: openOrganizationModal,

    closeEdit: closeOrganizationModal,

    getState: () => OrganizationState

};


console.log(
    "FuelGap Organization controller loaded successfully."
);