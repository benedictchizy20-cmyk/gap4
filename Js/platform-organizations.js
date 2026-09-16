/* =========================================================
   FUELGAP - PLATFORM ORGANIZATIONS
   SUPER ADMIN ORGANIZATION MANAGEMENT
   BACKEND CONNECTED
   COOKIE BASED AUTHENTICATION
   NO LOCALSTORAGE
   CSS INJECTED FROM JAVASCRIPT
========================================================= */


/* =========================================================
   APPLICATION STATE
========================================================= */

const PlatformOrganizationsState = {

    organizations: [],

    filteredOrganizations: [],

    selectedOrganization: null,

    searchTerm: "",

    statusFilter: "all",

    loading: false,

    initialized: false

};


/* =========================================================
   INJECT CSS
========================================================= */

(function injectPlatformOrganizationsCSS() {

    if (
        document.getElementById(
            "fuelgap-platform-organizations-css"
        )
    ) {

        return;
    }


    const style =
        document.createElement("style");


    style.id =
        "fuelgap-platform-organizations-css";


    style.textContent = `

        /* =====================================================
           PAGE
        ===================================================== */

        .platform-org-page {

            width: 100%;

            max-width: 1500px;

            margin: 0 auto;

            padding: 30px;

            box-sizing: border-box;

        }


        /* =====================================================
           PAGE HEADER
        ===================================================== */

        .platform-org-header {

            display: flex;

            justify-content: space-between;

            align-items: flex-start;

            gap: 25px;

            margin-bottom: 28px;

        }


        .platform-org-header-left {

            flex: 1;

        }


        .platform-org-eyebrow {

            display: inline-flex;

            align-items: center;

            gap: 7px;

            padding: 7px 12px;

            background: #fff8d9;

            border: 1px solid #f3d65b;

            border-radius: 999px;

            color: #8a6900;

            font-size: 12px;

            font-weight: 800;

            letter-spacing: .5px;

            text-transform: uppercase;

            margin-bottom: 12px;

        }


        .platform-org-title {

            margin: 0;

            font-size: 32px;

            line-height: 1.15;

            font-weight: 850;

            color: #111827;

            letter-spacing: -.7px;

        }


        .platform-org-subtitle {

            margin: 10px 0 0;

            max-width: 720px;

            color: #6b7280;

            font-size: 14px;

            line-height: 1.7;

        }


        /* =====================================================
           REFRESH BUTTON
        ===================================================== */

        .platform-org-refresh {

            display: inline-flex;

            align-items: center;

            justify-content: center;

            gap: 9px;

            min-width: 120px;

            padding: 12px 17px;

            border: 1px solid #e5e7eb;

            background: #ffffff;

            color: #1f2937;

            border-radius: 10px;

            font-size: 13px;

            font-weight: 750;

            cursor: pointer;

            transition:
                .2s ease;

            box-shadow:
                0 2px 8px rgba(0,0,0,.04);

        }


        .platform-org-refresh:hover {

            border-color: #e0bd27;

            background: #fffdf1;

            transform: translateY(-1px);

        }


        .platform-org-refresh:disabled {

            opacity: .55;

            cursor: not-allowed;

            transform: none;

        }


        /* =====================================================
           SUMMARY CARDS
        ===================================================== */

        .platform-org-summary {

            display: grid;

            grid-template-columns:
                repeat(4, minmax(0, 1fr));

            gap: 16px;

            margin-bottom: 25px;

        }


        .platform-org-summary-card {

            position: relative;

            background: #ffffff;

            border: 1px solid #e9eaee;

            border-radius: 15px;

            padding: 19px;

            min-height: 105px;

            box-sizing: border-box;

            box-shadow:
                0 5px 20px rgba(15,23,42,.045);

            overflow: hidden;

        }


        .platform-org-summary-card::after {

            content: "";

            position: absolute;

            width: 65px;

            height: 65px;

            right: -20px;

            top: -20px;

            background: #fff4a8;

            border-radius: 50%;

            opacity: .5;

        }


        .platform-org-summary-label {

            position: relative;

            z-index: 1;

            color: #6b7280;

            font-size: 12px;

            font-weight: 700;

            text-transform: uppercase;

            letter-spacing: .4px;

        }


        .platform-org-summary-value {

            position: relative;

            z-index: 1;

            margin-top: 8px;

            color: #111827;

            font-size: 27px;

            font-weight: 850;

        }


        /* =====================================================
           TOOLBAR
        ===================================================== */

        .platform-org-toolbar {

            display: flex;

            align-items: center;

            gap: 12px;

            flex-wrap: wrap;

            background: #ffffff;

            border: 1px solid #e9eaee;

            border-radius: 15px;

            padding: 15px;

            margin-bottom: 18px;

            box-shadow:
                0 5px 20px rgba(15,23,42,.035);

        }


        .platform-org-search-wrap {

            position: relative;

            flex: 1;

            min-width: 260px;

        }


        .platform-org-search-icon {

            position: absolute;

            left: 14px;

            top: 50%;

            transform: translateY(-50%);

            color: #9ca3af;

            pointer-events: none;

            font-size: 15px;

        }


        .platform-org-search {

            width: 100%;

            height: 44px;

            box-sizing: border-box;

            border: 1px solid #dfe3e8;

            border-radius: 10px;

            padding:
                0 14px 0 40px;

            outline: none;

            color: #111827;

            background: #ffffff;

            font-size: 13px;

            transition: .2s ease;

        }


        .platform-org-search:focus {

            border-color: #e2bf24;

            box-shadow:
                0 0 0 3px rgba(242,203,46,.15);

        }


        .platform-org-filter {

            height: 44px;

            min-width: 150px;

            border: 1px solid #dfe3e8;

            border-radius: 10px;

            background: #ffffff;

            color: #374151;

            padding: 0 13px;

            outline: none;

            font-size: 13px;

            font-weight: 650;

            cursor: pointer;

        }


        .platform-org-filter:focus {

            border-color: #e2bf24;

        }


        /* =====================================================
           TABLE CARD
        ===================================================== */

        .platform-org-table-card {

            background: #ffffff;

            border: 1px solid #e9eaee;

            border-radius: 15px;

            overflow: hidden;

            box-shadow:
                0 5px 20px rgba(15,23,42,.045);

        }


        .platform-org-table-head {

            display: flex;

            justify-content: space-between;

            align-items: center;

            gap: 15px;

            padding: 18px 20px;

            border-bottom: 1px solid #eef0f3;

        }


        .platform-org-table-title {

            margin: 0;

            color: #111827;

            font-size: 15px;

            font-weight: 800;

        }


        .platform-org-count {

            color: #6b7280;

            font-size: 12px;

            font-weight: 650;

        }


        .platform-org-table-wrapper {

            width: 100%;

            overflow-x: auto;

        }


        .platform-org-table {

            width: 100%;

            border-collapse: collapse;

            min-width: 850px;

        }


        .platform-org-table th {

            background: #fafafa;

            border-bottom: 1px solid #e9eaee;

            padding: 13px 18px;

            text-align: left;

            color: #6b7280;

            font-size: 11px;

            text-transform: uppercase;

            letter-spacing: .5px;

            font-weight: 800;

            white-space: nowrap;

        }


        .platform-org-table td {

            padding: 16px 18px;

            border-bottom: 1px solid #f0f1f3;

            color: #374151;

            font-size: 13px;

            vertical-align: middle;

        }


        .platform-org-table tbody tr {

            transition: .15s ease;

        }


        .platform-org-table tbody tr:hover {

            background: #fffdf3;

        }


        .platform-org-table tbody tr:last-child td {

            border-bottom: none;

        }


        /* =====================================================
           ORGANIZATION NAME
        ===================================================== */

        .platform-org-name-cell {

            display: flex;

            align-items: center;

            gap: 12px;

        }


        .platform-org-avatar {

            width: 42px;

            height: 42px;

            min-width: 42px;

            border-radius: 11px;

            display: flex;

            align-items: center;

            justify-content: center;

            background: #fff4a3;

            color: #705900;

            font-size: 16px;

            font-weight: 900;

            border: 1px solid #f0d65d;

        }


        .platform-org-name {

            color: #111827;

            font-weight: 800;

            font-size: 13px;

        }


        .platform-org-id {

            margin-top: 3px;

            color: #9ca3af;

            font-size: 10px;

            font-family: monospace;

        }


        /* =====================================================
           METRIC
        ===================================================== */

        .platform-org-metric {

            display: inline-flex;

            align-items: center;

            gap: 7px;

            font-weight: 750;

            color: #374151;

        }


        .platform-org-metric-icon {

            width: 26px;

            height: 26px;

            display: inline-flex;

            align-items: center;

            justify-content: center;

            border-radius: 7px;

            background: #f8f8f8;

            color: #6b7280;

            font-size: 12px;

        }


        /* =====================================================
           STATUS
        ===================================================== */

        .platform-org-status {

            display: inline-flex;

            align-items: center;

            gap: 7px;

            border-radius: 999px;

            padding: 6px 10px;

            font-size: 11px;

            font-weight: 800;

        }


        .platform-org-status-dot {

            width: 7px;

            height: 7px;

            border-radius: 50%;

        }


        .platform-org-status.active {

            background: #ecfdf3;

            color: #087443;

        }


        .platform-org-status.active
        .platform-org-status-dot {

            background: #16a34a;

        }


        .platform-org-status.inactive {

            background: #f3f4f6;

            color: #6b7280;

        }


        .platform-org-status.inactive
        .platform-org-status-dot {

            background: #9ca3af;

        }


        /* =====================================================
           ACTION
        ===================================================== */

        .platform-org-view-btn {

            display: inline-flex;

            align-items: center;

            justify-content: center;

            gap: 6px;

            padding: 8px 12px;

            border-radius: 8px;

            border: 1px solid #e4e6ea;

            background: #ffffff;

            color: #374151;

            font-size: 11px;

            font-weight: 750;

            cursor: pointer;

            transition: .2s ease;

        }


        .platform-org-view-btn:hover {

            background: #fff8d8;

            border-color: #e2bf24;

            color: #6d5700;

        }


        /* =====================================================
           EMPTY STATE
        ===================================================== */

        .platform-org-empty {

            padding: 65px 20px;

            text-align: center;

        }


        .platform-org-empty-icon {

            width: 60px;

            height: 60px;

            margin: 0 auto 15px;

            display: flex;

            align-items: center;

            justify-content: center;

            border-radius: 15px;

            background: #fff7ce;

            color: #806700;

            font-size: 25px;

        }


        .platform-org-empty h3 {

            margin: 0;

            color: #111827;

            font-size: 16px;

        }


        .platform-org-empty p {

            margin: 7px 0 0;

            color: #9ca3af;

            font-size: 13px;

        }


        /* =====================================================
           LOADING
        ===================================================== */

        .platform-org-loading {

            padding: 70px 20px;

            text-align: center;

        }


        .platform-org-spinner {

            width: 34px;

            height: 34px;

            margin: 0 auto 15px;

            border: 3px solid #f1f1f1;

            border-top-color: #e4c329;

            border-radius: 50%;

            animation:
                platformOrgSpin .8s linear infinite;

        }


        @keyframes platformOrgSpin {

            to {

                transform: rotate(360deg);

            }

        }


        .platform-org-loading p {

            margin: 0;

            color: #6b7280;

            font-size: 13px;

        }


        /* =====================================================
           ERROR
        ===================================================== */

        .platform-org-error {

            padding: 60px 20px;

            text-align: center;

        }


        .platform-org-error-icon {

            font-size: 32px;

            margin-bottom: 12px;

        }


        .platform-org-error h3 {

            margin: 0;

            color: #111827;

            font-size: 17px;

        }


        .platform-org-error p {

            margin: 8px auto 20px;

            max-width: 520px;

            color: #6b7280;

            font-size: 13px;

            line-height: 1.6;

        }


        .platform-org-retry {

            border: none;

            background: #f1cc27;

            color: #161616;

            padding: 10px 17px;

            border-radius: 9px;

            font-size: 12px;

            font-weight: 800;

            cursor: pointer;

        }


        .platform-org-retry:hover {

            background: #e5bd13;

        }


        /* =====================================================
           MODAL
        ===================================================== */

        .platform-org-modal-overlay {

            position: fixed;

            inset: 0;

            z-index: 9999;

            background:
                rgba(15,23,42,.52);

            display: none;

            align-items: center;

            justify-content: center;

            padding: 20px;

            box-sizing: border-box;

        }


        .platform-org-modal-overlay.open {

            display: flex;

        }


        .platform-org-modal {

            width: 100%;

            max-width: 720px;

            max-height: 88vh;

            overflow-y: auto;

            background: #ffffff;

            border-radius: 17px;

            box-shadow:
                0 25px 70px rgba(0,0,0,.20);

            animation:
                platformOrgModalIn .2s ease;

        }


        @keyframes platformOrgModalIn {

            from {

                opacity: 0;

                transform:
                    translateY(12px)
                    scale(.98);

            }

            to {

                opacity: 1;

                transform:
                    translateY(0)
                    scale(1);

            }

        }


        .platform-org-modal-header {

            display: flex;

            justify-content: space-between;

            align-items: center;

            gap: 15px;

            padding: 20px 22px;

            border-bottom: 1px solid #eef0f3;

        }


        .platform-org-modal-title {

            display: flex;

            align-items: center;

            gap: 12px;

        }


        .platform-org-modal-avatar {

            width: 43px;

            height: 43px;

            border-radius: 11px;

            display: flex;

            align-items: center;

            justify-content: center;

            background: #fff4a3;

            border: 1px solid #f0d65d;

            color: #705900;

            font-weight: 900;

        }


        .platform-org-modal-title h3 {

            margin: 0;

            color: #111827;

            font-size: 16px;

        }


        .platform-org-modal-title p {

            margin: 3px 0 0;

            color: #9ca3af;

            font-size: 11px;

        }


        .platform-org-modal-close {

            width: 34px;

            height: 34px;

            border: 1px solid #e5e7eb;

            background: #ffffff;

            border-radius: 8px;

            color: #6b7280;

            cursor: pointer;

            font-size: 17px;

        }


        .platform-org-modal-close:hover {

            background: #f8f8f8;

            color: #111827;

        }


        .platform-org-modal-body {

            padding: 22px;

        }


        .platform-org-detail-grid {

            display: grid;

            grid-template-columns:
                repeat(2, minmax(0, 1fr));

            gap: 13px;

        }


        .platform-org-detail {

            padding: 15px;

            border: 1px solid #eef0f3;

            border-radius: 11px;

            background: #fafafa;

        }


        .platform-org-detail-label {

            color: #9ca3af;

            font-size: 10px;

            font-weight: 800;

            text-transform: uppercase;

            letter-spacing: .4px;

            margin-bottom: 6px;

        }


        .platform-org-detail-value {

            color: #111827;

            font-size: 13px;

            font-weight: 750;

            word-break: break-word;

        }


        .platform-org-detail.full {

            grid-column: 1 / -1;

        }


        .platform-org-modal-section {

            margin-top: 22px;

        }


        .platform-org-modal-section-title {

            margin: 0 0 10px;

            color: #111827;

            font-size: 13px;

            font-weight: 850;

        }


        .platform-org-stat-row {

            display: grid;

            grid-template-columns:
                repeat(4, minmax(0, 1fr));

            gap: 10px;

        }


        .platform-org-stat {

            padding: 14px;

            border-radius: 10px;

            background: #fffbea;

            border: 1px solid #f3e4a1;

        }


        .platform-org-stat strong {

            display: block;

            color: #111827;

            font-size: 20px;

        }


        .platform-org-stat span {

            display: block;

            margin-top: 3px;

            color: #8b7b3b;

            font-size: 10px;

            font-weight: 750;

        }


        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 1050px) {

            .platform-org-summary {

                grid-template-columns:
                    repeat(2, minmax(0, 1fr));

            }

        }


        @media (max-width: 760px) {

            .platform-org-page {

                padding: 20px 15px;

            }


            .platform-org-header {

                flex-direction: column;

            }


            .platform-org-title {

                font-size: 26px;

            }


            .platform-org-summary {

                grid-template-columns: 1fr;

            }


            .platform-org-toolbar {

                align-items: stretch;

            }


            .platform-org-search-wrap {

                min-width: 100%;

            }


            .platform-org-filter {

                width: 100%;

            }


            .platform-org-detail-grid {

                grid-template-columns: 1fr;

            }


            .platform-org-detail.full {

                grid-column: auto;

            }


            .platform-org-stat-row {

                grid-template-columns:
                    repeat(2, minmax(0, 1fr));

            }

        }

    `;


    document.head.appendChild(style);

})();


/* =========================================================
   INITIALIZE PAGE
========================================================= */

async function initializePlatformOrganizationsPage() {

    console.log(
        "Initializing Platform Organizations page..."
    );


    const pageContent =
        document.getElementById(
            "pageContent"
        );


    if (!pageContent) {

        console.error(
            "Platform Organizations: #pageContent not found."
        );

        return;
    }


    /* =====================================================
       SUPER ADMIN CHECK
    ===================================================== */

    const user =
        FuelGapAppState?.currentUser;


    if (
        !user ||
        !window.isSuperAdmin ||
        !window.isSuperAdmin(user)
    ) {

        pageContent.innerHTML = `

            <section class="platform-org-page">

                <div class="platform-org-error">

                    <div class="platform-org-error-icon">
                        🔒
                    </div>

                    <h3>
                        Platform Access Required
                    </h3>

                    <p>
                        This section is only available to
                        FuelGap platform administrators.
                    </p>

                </div>

            </section>

        `;

        return;
    }


    /* =====================================================
       RENDER SHELL
    ===================================================== */

    renderPlatformOrganizationsShell();


    /* =====================================================
       LOAD DATA
    ===================================================== */

    await loadPlatformOrganizations();

}


/* =========================================================
   RENDER PAGE SHELL
========================================================= */

function renderPlatformOrganizationsShell() {

    const pageContent =
        document.getElementById(
            "pageContent"
        );


    pageContent.innerHTML = `

        <section class="platform-org-page">

            <!-- =============================================
                 HEADER
            ============================================== -->

            <div class="platform-org-header">

                <div class="platform-org-header-left">

                    <div class="platform-org-eyebrow">

                        <span>●</span>

                        Platform Management

                    </div>


                    <h1 class="platform-org-title">

                        Organizations

                    </h1>


                    <p class="platform-org-subtitle">

                        Manage and monitor every organization
                        registered on the FuelGap platform from
                        one central workspace.

                    </p>

                </div>


                <button
                    type="button"
                    class="platform-org-refresh"
                    id="platformOrgRefresh"
                >

                    ↻

                    Refresh

                </button>

            </div>


            <!-- =============================================
                 SUMMARY
            ============================================== -->

            <div
                class="platform-org-summary"
                id="platformOrgSummary"
            >

                ${renderSummarySkeleton()}

            </div>


            <!-- =============================================
                 TOOLBAR
            ============================================== -->

            <div class="platform-org-toolbar">

                <div class="platform-org-search-wrap">

                    <span
                        class="platform-org-search-icon"
                    >
                        🔎
                    </span>


                    <input
                        type="search"
                        id="platformOrgSearch"
                        class="platform-org-search"
                        placeholder="Search organizations by name or email..."
                        autocomplete="off"
                    >

                </div>


                <select
                    id="platformOrgStatusFilter"
                    class="platform-org-filter"
                >

                    <option value="all">
                        All Organizations
                    </option>

                    <option value="active">
                        Active
                    </option>

                    <option value="inactive">
                        Inactive
                    </option>

                </select>

            </div>


            <!-- =============================================
                 TABLE
            ============================================== -->

            <div class="platform-org-table-card">

                <div class="platform-org-table-head">

                    <h2 class="platform-org-table-title">

                        Registered Organizations

                    </h2>


                    <span
                        class="platform-org-count"
                        id="platformOrgCount"
                    >
                        Loading...
                    </span>

                </div>


                <div
                    id="platformOrgTableContent"
                >

                    <div class="platform-org-loading">

                        <div
                            class="platform-org-spinner"
                        ></div>

                        <p>
                            Loading organizations...
                        </p>

                    </div>

                </div>

            </div>

        </section>


        <!-- =============================================
             ORGANIZATION DETAILS MODAL
        ============================================== -->

        <div
            class="platform-org-modal-overlay"
            id="platformOrgModalOverlay"
        >

            <div
                class="platform-org-modal"
                role="dialog"
                aria-modal="true"
            >

                <div
                    class="platform-org-modal-header"
                    id="platformOrgModalHeader"
                >

                </div>


                <div
                    class="platform-org-modal-body"
                    id="platformOrgModalBody"
                >

                </div>

            </div>

        </div>

    `;


    setupPlatformOrganizationsEvents();

}


/* =========================================================
   SUMMARY SKELETON
========================================================= */

function renderSummarySkeleton() {

    return `

        <div class="platform-org-summary-card">

            <div class="platform-org-summary-label">
                Organizations
            </div>

            <div class="platform-org-summary-value">
                —
            </div>

        </div>


        <div class="platform-org-summary-card">

            <div class="platform-org-summary-label">
                Active
            </div>

            <div class="platform-org-summary-value">
                —
            </div>

        </div>


        <div class="platform-org-summary-card">

            <div class="platform-org-summary-label">
                Users
            </div>

            <div class="platform-org-summary-value">
                —
            </div>

        </div>


        <div class="platform-org-summary-card">

            <div class="platform-org-summary-label">
                Stations
            </div>

            <div class="platform-org-summary-value">
                —
            </div>

        </div>

    `;
}


/* =========================================================
   SETUP EVENTS
========================================================= */

function setupPlatformOrganizationsEvents() {

    const refreshButton =
        document.getElementById(
            "platformOrgRefresh"
        );


    const searchInput =
        document.getElementById(
            "platformOrgSearch"
        );


    const statusFilter =
        document.getElementById(
            "platformOrgStatusFilter"
        );


    const modalOverlay =
        document.getElementById(
            "platformOrgModalOverlay"
        );


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            async () => {

                await loadPlatformOrganizations();

            }
        );

    }


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            event => {

                PlatformOrganizationsState.searchTerm =
                    event.target.value
                        .trim()
                        .toLowerCase();


                applyPlatformOrganizationFilters();

            }
        );

    }


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            event => {

                PlatformOrganizationsState.statusFilter =
                    event.target.value;


                applyPlatformOrganizationFilters();

            }
        );

    }


    if (modalOverlay) {

        modalOverlay.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modalOverlay
                ) {

                    closeOrganizationModal();

                }

            }
        );

    }


    document.addEventListener(
        "keydown",
        handleOrganizationKeyboard
    );


    PlatformOrganizationsState.initialized =
        true;

}


/* =========================================================
   KEYBOARD
========================================================= */

function handleOrganizationKeyboard(event) {

    if (
        event.key === "Escape"
    ) {

        closeOrganizationModal();

    }

}


/* =========================================================
   LOAD ORGANIZATIONS
========================================================= */

async function loadPlatformOrganizations() {

    const tableContent =
        document.getElementById(
            "platformOrgTableContent"
        );


    const refreshButton =
        document.getElementById(
            "platformOrgRefresh"
        );


    if (!tableContent) {

        return;
    }


    PlatformOrganizationsState.loading =
        true;


    if (refreshButton) {

        refreshButton.disabled =
            true;

        refreshButton.innerHTML =
            "↻ Loading...";

    }


    tableContent.innerHTML = `

        <div class="platform-org-loading">

            <div class="platform-org-spinner"></div>

            <p>
                Loading organizations...
            </p>

        </div>

    `;


    try {

        const response =
            await FuelGapAPI.getPlatformOrganizations();


        console.log(
            "PLATFORM ORGANIZATIONS RESPONSE:",
            response
        );


        const organizations =
            extractOrganizationsFromResponse(
                response
            );


        PlatformOrganizationsState.organizations =
            organizations;


        updatePlatformSummary(
            organizations
        );


        applyPlatformOrganizationFilters();


    } catch (error) {

        console.error(
            "PLATFORM ORGANIZATIONS LOAD ERROR:",
            error
        );


        tableContent.innerHTML = `

            <div class="platform-org-error">

                <div class="platform-org-error-icon">
                    ⚠️
                </div>


                <h3>
                    Unable to load organizations
                </h3>


                <p>
                    ${escapeHTML(
                        error.message ||
                        "An unexpected error occurred while loading organizations."
                    )}
                </p>


                <button
                    type="button"
                    class="platform-org-retry"
                    id="platformOrgRetry"
                >
                    Try Again
                </button>

            </div>

        `;


        const retryButton =
            document.getElementById(
                "platformOrgRetry"
            );


        if (retryButton) {

            retryButton.addEventListener(
                "click",
                loadPlatformOrganizations
            );

        }


    } finally {

        PlatformOrganizationsState.loading =
            false;


        if (refreshButton) {

            refreshButton.disabled =
                false;

            refreshButton.innerHTML =
                "↻ Refresh";

        }

    }

}


/* =========================================================
   EXTRACT ORGANIZATIONS
========================================================= */

function extractOrganizationsFromResponse(
    response
) {

    if (!response) {

        return [];

    }


    if (
        Array.isArray(response)
    ) {

        return response;

    }


    if (
        Array.isArray(response.organizations)
    ) {

        return response.organizations;

    }


    if (
        Array.isArray(response.data)
    ) {

        return response.data;

    }


    if (
        response.data &&
        Array.isArray(response.data.organizations)
    ) {

        return response.data.organizations;

    }


    if (
        response.data &&
        response.data.data &&
        Array.isArray(
            response.data.data.organizations
        )
    ) {

        return response.data.data.organizations;

    }


    return [];

}


/* =========================================================
   SUMMARY
========================================================= */

function updatePlatformSummary(
    organizations
) {

    const summary =
        document.getElementById(
            "platformOrgSummary"
        );


    if (!summary) {

        return;
    }


    const total =
        organizations.length;


    const active =
        organizations.filter(
            organization =>
                isOrganizationActive(
                    organization
                )
        ).length;


    const users =
        organizations.reduce(
            (
                totalUsers,
                organization
            ) => {

                return totalUsers +
                    getOrganizationUserCount(
                        organization
                    );

            },
            0
        );


    const stations =
        organizations.reduce(
            (
                totalStations,
                organization
            ) => {

                return totalStations +
                    getOrganizationStationCount(
                        organization
                    );

            },
            0
        );


    summary.innerHTML = `

        <div class="platform-org-summary-card">

            <div class="platform-org-summary-label">
                Organizations
            </div>

            <div class="platform-org-summary-value">
                ${formatNumber(total)}
            </div>

        </div>


        <div class="platform-org-summary-card">

            <div class="platform-org-summary-label">
                Active Organizations
            </div>

            <div class="platform-org-summary-value">
                ${formatNumber(active)}
            </div>

        </div>


        <div class="platform-org-summary-card">

            <div class="platform-org-summary-label">
                Platform Users
            </div>

            <div class="platform-org-summary-value">
                ${formatNumber(users)}
            </div>

        </div>


        <div class="platform-org-summary-card">

            <div class="platform-org-summary-label">
                Total Stations
            </div>

            <div class="platform-org-summary-value">
                ${formatNumber(stations)}
            </div>

        </div>

    `;

}


/* =========================================================
   FILTER
========================================================= */

function applyPlatformOrganizationFilters() {

    const organizations =
        PlatformOrganizationsState.organizations;


    const search =
        PlatformOrganizationsState.searchTerm;


    const status =
        PlatformOrganizationsState.statusFilter;


    PlatformOrganizationsState.filteredOrganizations =
        organizations.filter(
            organization => {

                const name =
                    String(
                        organization.name ||
                        organization.organization_name ||
                        ""
                    )
                        .toLowerCase();


                const email =
                    String(
                        organization.email ||
                        ""
                    )
                        .toLowerCase();


                const matchesSearch =
                    !search ||
                    name.includes(search) ||
                    email.includes(search);


                const active =
                    isOrganizationActive(
                        organization
                    );


                const matchesStatus =
                    status === "all" ||
                    (
                        status === "active" &&
                        active
                    ) ||
                    (
                        status === "inactive" &&
                        !active
                    );


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    renderOrganizationsTable(
        PlatformOrganizationsState.filteredOrganizations
    );

}


/* =========================================================
   RENDER TABLE
========================================================= */

function renderOrganizationsTable(
    organizations
) {

    const tableContent =
        document.getElementById(
            "platformOrgTableContent"
        );


    const count =
        document.getElementById(
            "platformOrgCount"
        );


    if (!tableContent) {

        return;
    }


    if (count) {

        count.textContent =
            `${formatNumber(
                organizations.length
            )} organization${
                organizations.length === 1
                    ? ""
                    : "s"
            }`;

    }


    if (!organizations.length) {

        tableContent.innerHTML = `

            <div class="platform-org-empty">

                <div class="platform-org-empty-icon">
                    ◉
                </div>


                <h3>
                    No organizations found
                </h3>


                <p>
                    Try changing your search or
                    status filter.
                </p>

            </div>

        `;

        return;
    }


    let rows = "";


    organizations.forEach(
        organization => {

            const id =
                organization.id ||
                organization.organization_id ||
                "";


            const name =
                organization.name ||
                organization.organization_name ||
                "Unnamed Organization";


            const email =
                organization.email ||
                "—";


            const users =
                getOrganizationUserCount(
                    organization
                );


            const stations =
                getOrganizationStationCount(
                    organization
                );


            const active =
                isOrganizationActive(
                    organization
                );


            rows += `

                <tr>

                    <td>

                        <div
                            class="platform-org-name-cell"
                        >

                            <div
                                class="platform-org-avatar"
                            >
                                ${getOrganizationInitial(
                                    name
                                )}
                            </div>


                            <div>

                                <div
                                    class="platform-org-name"
                                >
                                    ${escapeHTML(name)}
                                </div>


                                <div
                                    class="platform-org-id"
                                >
                                    ${escapeHTML(
                                        id
                                    )}
                                </div>

                            </div>

                        </div>

                    </td>


                    <td>

                        ${escapeHTML(email)}

                    </td>


                    <td>

                        <span
                            class="platform-org-metric"
                        >

                            <span
                                class="platform-org-metric-icon"
                            >
                                ♙
                            </span>

                            ${formatNumber(users)}

                        </span>

                    </td>


                    <td>

                        <span
                            class="platform-org-metric"
                        >

                            <span
                                class="platform-org-metric-icon"
                            >
                                ⌂
                            </span>

                            ${formatNumber(stations)}

                        </span>

                    </td>


                    <td>

                        <span
                            class="platform-org-status ${
                                active
                                    ? "active"
                                    : "inactive"
                            }"
                        >

                            <span
                                class="platform-org-status-dot"
                            ></span>

                            ${
                                active
                                    ? "Active"
                                    : "Inactive"
                            }

                        </span>

                    </td>


                    <td>

                        <button
                            type="button"
                            class="platform-org-view-btn"
                            data-organization-id="${escapeHTML(
                                id
                            )}"
                        >

                            View Details

                            <span>→</span>

                        </button>

                    </td>

                </tr>

            `;

        }
    );


    tableContent.innerHTML = `

        <div class="platform-org-table-wrapper">

            <table
                class="platform-org-table"
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
                            Users
                        </th>

                        <th>
                            Stations
                        </th>

                        <th>
                            Status
                        </th>

                        <th>
                            Action
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${rows}

                </tbody>

            </table>

        </div>

    `;


    const buttons =
        tableContent.querySelectorAll(
            ".platform-org-view-btn"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const organizationId =
                        button.dataset.organizationId;


                    openOrganizationDetails(
                        organizationId
                    );

                }
            );

        }
    );

}


/* =========================================================
   OPEN ORGANIZATION DETAILS
========================================================= */

async function openOrganizationDetails(
    organizationId
) {

    if (!organizationId) {

        return;
    }


    const overlay =
        document.getElementById(
            "platformOrgModalOverlay"
        );


    const header =
        document.getElementById(
            "platformOrgModalHeader"
        );


    const body =
        document.getElementById(
            "platformOrgModalBody"
        );


    if (!overlay || !header || !body) {

        return;
    }


    const organization =
        PlatformOrganizationsState.organizations.find(
            item =>
                String(
                    item.id ||
                    item.organization_id
                ) ===
                String(organizationId)
        );


    header.innerHTML = `

        <div class="platform-org-modal-title">

            <div class="platform-org-modal-avatar">

                ${getOrganizationInitial(
                    organization?.name ||
                    "O"
                )}

            </div>


            <div>

                <h3>
                    ${
                        escapeHTML(
                            organization?.name ||
                            "Organization Details"
                        )
                    }
                </h3>

                <p>
                    Organization information
                </p>

            </div>

        </div>


        <button
            type="button"
            class="platform-org-modal-close"
            id="platformOrgModalClose"
            aria-label="Close"
        >
            ×
        </button>

    `;


    body.innerHTML = `

        <div class="platform-org-loading">

            <div class="platform-org-spinner"></div>

            <p>
                Loading organization details...
            </p>

        </div>

    `;


    overlay.classList.add(
        "open"
    );


    const closeButton =
        document.getElementById(
            "platformOrgModalClose"
        );


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeOrganizationModal
        );

    }


    try {

        const response =
            await FuelGapAPI.getPlatformOrganization(
                organizationId
            );


        console.log(
            "PLATFORM ORGANIZATION DETAILS:",
            response
        );


        const details =
            extractOrganizationDetails(
                response
            );


        PlatformOrganizationsState.selectedOrganization =
            details;


        renderOrganizationDetails(
            details ||
            organization
        );


    } catch (error) {

        console.error(
            "ORGANIZATION DETAILS ERROR:",
            error
        );


        /*
         * If the details endpoint is not yet returning
         * a result, still show the organization data
         * already received from the platform list.
         */

        if (organization) {

            renderOrganizationDetails(
                organization
            );

        } else {

            body.innerHTML = `

                <div class="platform-org-error">

                    <div class="platform-org-error-icon">
                        ⚠️
                    </div>

                    <h3>
                        Unable to load details
                    </h3>

                    <p>
                        ${escapeHTML(
                            error.message ||
                            "Unable to load organization."
                        )}
                    </p>

                </div>

            `;

        }

    }

}


/* =========================================================
   EXTRACT DETAILS
========================================================= */

function extractOrganizationDetails(
    response
) {

    if (!response) {

        return null;

    }


    if (
        response.organization
    ) {

        return response.organization;

    }


    if (
        response.data &&
        response.data.organization
    ) {

        return response.data.organization;

    }


    if (
        response.data &&
        !Array.isArray(response.data)
    ) {

        return response.data;

    }


    return null;

}


/* =========================================================
   RENDER DETAILS
========================================================= */

function renderOrganizationDetails(
    organization
) {

    const body =
        document.getElementById(
            "platformOrgModalBody"
        );


    if (!body) {

        return;
    }


    if (!organization) {

        body.innerHTML = `

            <div class="platform-org-empty">

                <div class="platform-org-empty-icon">
                    ?
                </div>

                <h3>
                    Organization not found
                </h3>

            </div>

        `;

        return;
    }


    const id =
        organization.id ||
        organization.organization_id ||
        "—";


    const name =
        organization.name ||
        organization.organization_name ||
        "Unnamed Organization";


    const email =
        organization.email ||
        "—";


    const phone =
        organization.phone ||
        "Not provided";


    const createdAt =
        organization.created_at ||
        organization.createdAt;


    const updatedAt =
        organization.updated_at ||
        organization.updatedAt;


    const users =
        getOrganizationUserCount(
            organization
        );


    const stations =
        getOrganizationStationCount(
            organization
        );


    const active =
        isOrganizationActive(
            organization
        );


    body.innerHTML = `

        <div class="platform-org-detail-grid">

            <div class="platform-org-detail">

                <div class="platform-org-detail-label">
                    Organization Name
                </div>

                <div class="platform-org-detail-value">
                    ${escapeHTML(name)}
                </div>

            </div>


            <div class="platform-org-detail">

                <div class="platform-org-detail-label">
                    Status
                </div>

                <div class="platform-org-detail-value">

                    <span
                        class="platform-org-status ${
                            active
                                ? "active"
                                : "inactive"
                        }"
                    >

                        <span
                            class="platform-org-status-dot"
                        ></span>

                        ${
                            active
                                ? "Active"
                                : "Inactive"
                        }

                    </span>

                </div>

            </div>


            <div class="platform-org-detail">

                <div class="platform-org-detail-label">
                    Email
                </div>

                <div class="platform-org-detail-value">
                    ${escapeHTML(email)}
                </div>

            </div>


            <div class="platform-org-detail">

                <div class="platform-org-detail-label">
                    Phone
                </div>

                <div class="platform-org-detail-value">
                    ${escapeHTML(phone)}
                </div>

            </div>


            <div
                class="platform-org-detail full"
            >

                <div class="platform-org-detail-label">
                    Organization ID
                </div>

                <div class="platform-org-detail-value">
                    ${escapeHTML(id)}
                </div>

            </div>

        </div>


        <div class="platform-org-modal-section">

            <h4
                class="platform-org-modal-section-title"
            >
                Platform Usage
            </h4>


            <div class="platform-org-stat-row">

                <div class="platform-org-stat">

                    <strong>
                        ${formatNumber(users)}
                    </strong>

                    <span>
                        Users
                    </span>

                </div>


                <div class="platform-org-stat">

                    <strong>
                        ${formatNumber(stations)}
                    </strong>

                    <span>
                        Stations
                    </span>

                </div>


                <div class="platform-org-stat">

                    <strong>
                        ${formatNumber(
                            getOrganizationPumpCount(
                                organization
                            )
                        )}
                    </strong>

                    <span>
                        Pumps
                    </span>

                </div>


                <div class="platform-org-stat">

                    <strong>
                        ${formatNumber(
                            getOrganizationNozzleCount(
                                organization
                            )
                        )}
                    </strong>

                    <span>
                        Nozzles
                    </span>

                </div>

            </div>

        </div>


        <div class="platform-org-modal-section">

            <h4
                class="platform-org-modal-section-title"
            >
                Account Timeline
            </h4>


            <div class="platform-org-detail-grid">

                <div class="platform-org-detail">

                    <div class="platform-org-detail-label">
                        Created
                    </div>

                    <div class="platform-org-detail-value">

                        ${
                            formatDate(
                                createdAt
                            )
                        }

                    </div>

                </div>


                <div class="platform-org-detail">

                    <div class="platform-org-detail-label">
                        Last Updated
                    </div>

                    <div class="platform-org-detail-value">

                        ${
                            formatDate(
                                updatedAt
                            )
                        }

                    </div>

                </div>

            </div>

        </div>

    `;

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeOrganizationModal() {

    const overlay =
        document.getElementById(
            "platformOrgModalOverlay"
        );


    if (overlay) {

        overlay.classList.remove(
            "open"
        );

    }

}


/* =========================================================
   ACTIVE ORGANIZATION
========================================================= */

function isOrganizationActive(
    organization
) {

    if (!organization) {

        return false;

    }


    if (
        typeof organization.is_active ===
        "boolean"
    ) {

        return organization.is_active;

    }


    if (
        typeof organization.active ===
        "boolean"
    ) {

        return organization.active;

    }


    if (
        organization.status
    ) {

        return String(
            organization.status
        )
            .toLowerCase() === "active";

    }


    /*
     * Current backend organization records
     * do not currently expose is_active.
     *
     * Existing organizations are therefore
     * treated as active until an explicit
     * status field is returned.
     */

    return true;

}


/* =========================================================
   USER COUNT
========================================================= */

function getOrganizationUserCount(
    organization
) {

    if (!organization) {

        return 0;

    }


    if (
        typeof organization.user_count ===
        "number"
    ) {

        return organization.user_count;

    }


    if (
        typeof organization.users_count ===
        "number"
    ) {

        return organization.users_count;

    }


    if (
        organization.users &&
        typeof organization.users.total ===
        "number"
    ) {

        return organization.users.total;

    }


    if (
        Array.isArray(
            organization.users
        )
    ) {

        return organization.users.length;

    }


    return 0;

}


/* =========================================================
   STATION COUNT
========================================================= */

function getOrganizationStationCount(
    organization
) {

    if (!organization) {

        return 0;

    }


    if (
        typeof organization.station_count ===
        "number"
    ) {

        return organization.station_count;

    }


    if (
        typeof organization.stations_count ===
        "number"
    ) {

        return organization.stations_count;

    }


    if (
        organization.stations &&
        typeof organization.stations.total ===
        "number"
    ) {

        return organization.stations.total;

    }


    if (
        Array.isArray(
            organization.stations
        )
    ) {

        return organization.stations.length;

    }


    return 0;

}


/* =========================================================
   PUMP COUNT
========================================================= */

function getOrganizationPumpCount(
    organization
) {

    if (!organization) {

        return 0;

    }


    if (
        typeof organization.pump_count ===
        "number"
    ) {

        return organization.pump_count;

    }


    if (
        typeof organization.pumps_count ===
        "number"
    ) {

        return organization.pumps_count;

    }


    if (
        organization.pumps &&
        typeof organization.pumps.total ===
        "number"
    ) {

        return organization.pumps.total;

    }


    if (
        Array.isArray(
            organization.pumps
        )
    ) {

        return organization.pumps.length;

    }


    return 0;

}


/* =========================================================
   NOZZLE COUNT
========================================================= */

function getOrganizationNozzleCount(
    organization
) {

    if (!organization) {

        return 0;

    }


    if (
        typeof organization.nozzle_count ===
        "number"
    ) {

        return organization.nozzle_count;

    }


    if (
        typeof organization.nozzles_count ===
        "number"
    ) {

        return organization.nozzles_count;

    }


    if (
        organization.nozzles &&
        typeof organization.nozzles.total ===
        "number"
    ) {

        return organization.nozzles.total;

    }


    if (
        Array.isArray(
            organization.nozzles
        )
    ) {

        return organization.nozzles.length;

    }


    return 0;

}


/* =========================================================
   ORGANIZATION INITIAL
========================================================= */

function getOrganizationInitial(
    name
) {

    const value =
        String(
            name ||
            "O"
        )
            .trim();


    if (!value) {

        return "O";

    }


    return value
        .charAt(0)
        .toUpperCase();

}


/* =========================================================
   NUMBER FORMAT
========================================================= */

function formatNumber(
    value
) {

    const number =
        Number(value) || 0;


    return number.toLocaleString(
        "en-NG"
    );

}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(
    value
) {

    if (!value) {

        return "—";

    }


    const date =
        new Date(value);


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
            dateStyle: "medium",
            timeStyle: "short"
        }
    );

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(
    value
) {

    if (
        typeof window.escapeHTML ===
        "function"
    ) {

        return window.escapeHTML(
            value
        );

    }


    return String(
        value ?? ""
    )

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
   GLOBAL EXPORT
========================================================= */

window.initializePlatformOrganizationsPage =
    initializePlatformOrganizationsPage;

window.closeOrganizationModal =
    closeOrganizationModal;


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        /*
         * app.js also runs on DOMContentLoaded.
         *
         * Give app.js a moment to authenticate,
         * build #pageContent and render the shell.
         */

        setTimeout(
            async () => {

                const currentPage =
                    window.getCurrentPageName
                        ? window.getCurrentPageName()
                        : "";


                if (
                    currentPage !==
                    "organizations"
                ) {

                    return;

                }


                try {

                    await initializePlatformOrganizationsPage();

                } catch (error) {

                    console.error(
                        "PLATFORM ORGANIZATIONS INITIALIZATION ERROR:",
                        error
                    );

                }

            },
            100
        );

    }
);


console.log(
    "FuelGap platform-organizations.js loaded successfully."
);