/* =========================================================
   FUELGAP - PLATFORM SUPER ADMIN DASHBOARD
   SUPABASE + EXPRESS
   HTTPONLY COOKIE SESSION

   PRODUCTION FRONTEND
   - REAL BACKEND DATA
   - NO LOCALSTORAGE DATA
   - COOKIE AUTHENTICATION
   - PLATFORM ORGANIZATIONS
   - PLATFORM OVERVIEW
   - RESPONSIVE WHITE + YELLOW UI
========================================================= */


/* =========================================================
   SUPER ADMIN STATE
========================================================= */

const SuperAdminState = {

    currentUser: null,

    overview: null,

    organizations: [],

    isLoading: false,

    lastUpdated: null

};


/* =========================================================
   CSS
========================================================= */

(function injectSuperAdminCSS() {

    if (
        document.getElementById(
            "fuelgap-super-admin-css"
        )
    ) {
        return;
    }

    const style =
        document.createElement("style");

    style.id =
        "fuelgap-super-admin-css";

    style.textContent = `

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html {
            scroll-behavior: smooth;
        }

        body {
            font-family:
                Inter,
                Arial,
                sans-serif;

            background: #f7f8fa;

            color: #151515;

            min-height: 100vh;
        }

        button,
        input {
            font-family: inherit;
        }

        button {
            cursor: pointer;
        }


        /* =================================================
           NAVBAR
        ================================================= */

        .sa-navbar {

            height: 70px;

            background: #ffffff;

            border-bottom:
                1px solid #e8e8e8;

            display: flex;

            align-items: center;

            justify-content:
                space-between;

            padding:
                0 28px;

            position: sticky;

            top: 0;

            z-index: 1000;
        }


        .sa-brand {

            display: flex;

            align-items: center;

            gap: 10px;

            text-decoration: none;

            color: #111111;
        }


        .sa-brand-icon {

            width: 40px;

            height: 40px;

            background: #f5c400;

            color: #111111;

            border-radius: 10px;

            display: flex;

            align-items: center;

            justify-content: center;

            font-size: 20px;

            font-weight: 800;
        }


        .sa-brand-text {

            font-size: 20px;

            font-weight: 800;
        }


        .sa-brand-text span {

            color: #f5c400;
        }


        .sa-platform-badge {

            display: flex;

            align-items: center;

            gap: 7px;

            background: #fff8d7;

            color: #735d00;

            border:
                1px solid #f0d96c;

            padding:
                7px 11px;

            border-radius: 20px;

            font-size: 10px;

            font-weight: 800;

            letter-spacing: .4px;
        }


        .sa-navbar-left {

            display: flex;

            align-items: center;

            gap: 28px;
        }


        .sa-navbar-right {

            display: flex;

            align-items: center;

            gap: 18px;
        }


        .sa-system-status {

            display: flex;

            align-items: center;

            gap: 7px;

            font-size: 11px;

            color: #27824b;

            font-weight: 700;
        }


        .sa-status-dot {

            width: 8px;

            height: 8px;

            border-radius: 50%;

            background: #23a455;
        }


        .sa-profile {

            display: flex;

            align-items: center;

            gap: 9px;
        }


        .sa-avatar {

            width: 38px;

            height: 38px;

            border-radius: 50%;

            background: #171717;

            color: #f5c400;

            display: flex;

            align-items: center;

            justify-content: center;

            font-size: 12px;

            font-weight: 800;
        }


        .sa-profile-info {

            display: flex;

            flex-direction: column;

            gap: 2px;
        }


        .sa-profile-name {

            font-size: 12px;

            font-weight: 800;
        }


        .sa-profile-role {

            font-size: 9px;

            color: #888888;

            text-transform: uppercase;

            letter-spacing: .5px;
        }


        .sa-logout {

            width: 36px;

            height: 36px;

            border:
                1px solid #dddddd;

            background: #ffffff;

            border-radius: 8px;

            display: flex;

            align-items: center;

            justify-content: center;

            color: #555555;

            transition: .2s;
        }


        .sa-logout:hover {

            background: #fff6cd;

            border-color: #f5c400;

            color: #111111;
        }


        /* =================================================
           PAGE
        ================================================= */

        .sa-container {

            width: 100%;

            max-width: 1600px;

            margin: 0 auto;

            padding: 30px;
        }


        /* =================================================
           HEADER
        ================================================= */

        .sa-page-header {

            display: flex;

            justify-content:
                space-between;

            align-items:
                flex-start;

            gap: 20px;

            margin-bottom: 25px;
        }


        .sa-title h1 {

            font-size: 27px;

            font-weight: 800;

            letter-spacing:
                -.8px;

            margin-bottom: 6px;
        }


        .sa-title p {

            font-size: 12px;

            color: #777777;
        }


        .sa-actions {

            display: flex;

            gap: 9px;
        }


        .sa-btn {

            min-height: 40px;

            padding:
                0 15px;

            border-radius: 8px;

            font-size: 11px;

            font-weight: 800;

            display: inline-flex;

            align-items: center;

            justify-content: center;

            gap: 7px;

            transition: .2s;
        }


        .sa-btn-primary {

            background: #f5c400;

            color: #111111;

            border:
                1px solid #f5c400;
        }


        .sa-btn-primary:hover {

            background: #ddb200;

            border-color: #ddb200;
        }


        .sa-btn-secondary {

            background: #ffffff;

            color: #333333;

            border:
                1px solid #dddddd;
        }


        .sa-btn-secondary:hover {

            background: #fafafa;

            border-color: #cfcfcf;
        }


        /* =================================================
           LOADING
        ================================================= */

        .sa-loading {

            height: 3px;

            width: 100%;

            background: #eeeeee;

            border-radius: 10px;

            overflow: hidden;

            display: none;

            margin-bottom: 18px;
        }


        .sa-loading.active {

            display: block;
        }


        .sa-loading::after {

            content: "";

            display: block;

            width: 30%;

            height: 100%;

            background: #f5c400;

            animation:
                saLoading 1s infinite;
        }


        @keyframes saLoading {

            0% {
                transform:
                    translateX(-120%);
            }

            100% {
                transform:
                    translateX(430%);
            }

        }


        /* =================================================
           ERROR
        ================================================= */

        .sa-error {

            display: none;

            background: #fff0f0;

            border:
                1px solid #efc1c1;

            color: #a32626;

            padding:
                12px 15px;

            border-radius: 9px;

            margin-bottom: 18px;

            font-size: 11px;
        }


        .sa-error.show {

            display: flex;

            align-items: center;

            gap: 8px;
        }


        /* =================================================
           STATS
        ================================================= */

        .sa-stats {

            display: grid;

            grid-template-columns:
                repeat(4, minmax(0, 1fr));

            gap: 16px;

            margin-bottom: 20px;
        }


        .sa-stat {

            background: #ffffff;

            border:
                1px solid #e7e7e7;

            border-radius: 13px;

            padding: 18px;

            min-height: 132px;

            position: relative;

            overflow: hidden;

            transition: .2s;
        }


        .sa-stat:hover {

            transform:
                translateY(-2px);

            box-shadow:
                0 7px 22px
                rgba(0,0,0,.05);
        }


        .sa-stat::after {

            content: "";

            position: absolute;

            width: 80px;

            height: 80px;

            right: -30px;

            bottom: -30px;

            border-radius: 50%;

            background:
                #fff8d8;
        }


        .sa-stat-top {

            display: flex;

            align-items: center;

            justify-content:
                space-between;

            margin-bottom: 13px;
        }


        .sa-stat-label {

            color: #777777;

            font-size: 10px;

            font-weight: 700;

            text-transform:
                uppercase;

            letter-spacing: .3px;
        }


        .sa-stat-icon {

            width: 37px;

            height: 37px;

            background:
                #fff7d1;

            color: #b28a00;

            border-radius: 9px;

            display: flex;

            align-items: center;

            justify-content: center;

            font-size: 14px;
        }


        .sa-stat-value {

            font-size: 25px;

            font-weight: 800;

            letter-spacing:
                -.7px;

            position: relative;

            z-index: 2;
        }


        .sa-stat-description {

            color: #999999;

            font-size: 9px;

            margin-top: 5px;

            position: relative;

            z-index: 2;
        }


        /* =================================================
           CONTENT GRID
        ================================================= */

        .sa-content-grid {

            display: grid;

            grid-template-columns:
                minmax(0, 1.6fr)
                minmax(290px, .75fr);

            gap: 18px;
        }


        .sa-panel {

            background: #ffffff;

            border:
                1px solid #e7e7e7;

            border-radius: 13px;

            overflow: hidden;
        }


        .sa-panel-header {

            min-height: 62px;

            padding:
                0 18px;

            border-bottom:
                1px solid #eeeeee;

            display: flex;

            align-items: center;

            justify-content:
                space-between;
        }


        .sa-panel-title h2 {

            font-size: 14px;

            font-weight: 800;

            margin-bottom: 3px;
        }


        .sa-panel-title p {

            font-size: 10px;

            color: #999999;
        }


        .sa-link-btn {

            border: none;

            background: transparent;

            color: #a17d00;

            font-size: 10px;

            font-weight: 800;
        }


        .sa-link-btn:hover {

            text-decoration:
                underline;
        }


        /* =================================================
           ORGANIZATION TABLE
        ================================================= */

        .sa-table-wrap {

            width: 100%;

            overflow-x: auto;
        }


        .sa-table {

            width: 100%;

            min-width: 650px;

            border-collapse:
                collapse;
        }


        .sa-table th {

            text-align: left;

            padding:
                12px 18px;

            background: #fafafa;

            color: #888888;

            font-size: 9px;

            font-weight: 800;

            text-transform:
                uppercase;

            letter-spacing: .5px;

            border-bottom:
                1px solid #eeeeee;
        }


        .sa-table td {

            padding:
                14px 18px;

            border-bottom:
                1px solid #f0f0f0;

            font-size: 11px;
        }


        .sa-table tr:last-child td {

            border-bottom: none;
        }


        .sa-org-name {

            font-weight: 800;

            font-size: 11px;
        }


        .sa-org-email {

            color: #999999;

            font-size: 9px;

            margin-top: 3px;
        }


        .sa-org-phone {

            color: #999999;

            font-size: 9px;

            margin-top: 3px;
        }


        .sa-number {

            font-weight: 800;
        }


        .sa-number-sub {

            display: block;

            color: #999999;

            font-size: 8px;

            margin-top: 2px;
        }


        .sa-status {

            display: inline-flex;

            align-items: center;

            gap: 5px;

            padding:
                5px 8px;

            border-radius: 20px;

            font-size: 9px;

            font-weight: 800;
        }


        .sa-status.active {

            background: #eaf8ef;

            color: #217340;
        }


        .sa-status.inactive {

            background: #f2f2f2;

            color: #777777;
        }


        .sa-status-dot-small {

            width: 6px;

            height: 6px;

            border-radius: 50%;

            background: currentColor;
        }


        .sa-view {

            border:
                1px solid #dddddd;

            background: #ffffff;

            color: #444444;

            border-radius: 7px;

            padding:
                6px 9px;

            font-size: 9px;

            font-weight: 800;

            transition: .2s;
        }


        .sa-view:hover {

            background: #fff9df;

            border-color: #f5c400;

            color: #111111;
        }


        /* =================================================
           EMPTY
        ================================================= */

        .sa-empty {

            text-align: center;

            padding: 40px 20px;

            color: #999999;
        }


        .sa-empty i {

            display: block;

            font-size: 27px;

            color: #cccccc;

            margin-bottom: 10px;
        }


        .sa-empty p {

            font-size: 10px;
        }


        /* =================================================
           OVERVIEW LIST
        ================================================= */

        .sa-overview-list {

            padding:
                5px 18px 14px;
        }


        .sa-overview-item {

            min-height: 55px;

            display: flex;

            align-items: center;

            justify-content:
                space-between;

            border-bottom:
                1px solid #f0f0f0;
        }


        .sa-overview-item:last-child {

            border-bottom: none;
        }


        .sa-overview-left {

            display: flex;

            align-items: center;

            gap: 9px;
        }


        .sa-overview-icon {

            width: 32px;

            height: 32px;

            border-radius: 8px;

            background: #fff8d8;

            color: #b08a00;

            display: flex;

            align-items: center;

            justify-content: center;

            font-size: 12px;
        }


        .sa-overview-name {

            font-size: 10px;

            font-weight: 800;
        }


        .sa-overview-desc {

            color: #999999;

            font-size: 8px;

            margin-top: 2px;
        }


        .sa-overview-value {

            font-size: 12px;

            font-weight: 800;
        }


        /* =================================================
           QUICK ACTIONS
        ================================================= */

        .sa-quick-actions {

            padding: 16px 18px 18px;

            display: grid;

            grid-template-columns:
                1fr 1fr;

            gap: 9px;
        }


        .sa-quick {

            min-height: 75px;

            background: #ffffff;

            border:
                1px solid #eeeeee;

            border-radius: 9px;

            text-align: left;

            padding: 11px;

            transition: .2s;
        }


        .sa-quick:hover {

            border-color: #f5c400;

            background: #fffdf2;
        }


        .sa-quick i {

            display: block;

            color: #b08a00;

            margin-bottom: 8px;

            font-size: 14px;
        }


        .sa-quick strong {

            display: block;

            font-size: 10px;
        }


        .sa-quick span {

            display: block;

            color: #999999;

            font-size: 8px;

            margin-top: 3px;
        }


        /* =================================================
           FOOTER
        ================================================= */

        .sa-footer {

            margin-top: 25px;

            padding:
                17px 0;

            border-top:
                1px solid #e7e7e7;

            display: flex;

            justify-content:
                space-between;

            color: #999999;

            font-size: 9px;
        }


        /* =================================================
           RESPONSIVE
        ================================================= */

        @media (max-width: 1150px) {

            .sa-stats {

                grid-template-columns:
                    repeat(2, 1fr);
            }

            .sa-content-grid {

                grid-template-columns: 1fr;
            }

        }


        @media (max-width: 700px) {

            .sa-navbar {

                padding:
                    0 15px;
            }


            .sa-platform-badge,
            .sa-system-status,
            .sa-profile-info {

                display: none;
            }


            .sa-navbar-left {

                gap: 0;
            }


            .sa-navbar-right {

                gap: 8px;
            }


            .sa-container {

                padding:
                    22px 14px;
            }


            .sa-page-header {

                flex-direction: column;
            }


            .sa-actions {

                width: 100%;
            }


            .sa-actions .sa-btn {

                flex: 1;
            }


            .sa-stats {

                grid-template-columns: 1fr;
            }


            .sa-title h1 {

                font-size: 23px;
            }


            .sa-footer {

                flex-direction: column;

                gap: 6px;
            }

        }

    `;

    document.head.appendChild(style);

})();


/* =========================================================
   HELPERS
========================================================= */

function saEscapeHTML(value) {

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


function saFormatNumber(value) {

    const number =
        Number(value) || 0;

    return number.toLocaleString(
        "en-NG"
    );
}


function saFormatCurrency(value) {

    const number =
        Number(value) || 0;

    return "₦" +
        number.toLocaleString(
            "en-NG",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        );
}


function saInitials(name) {

    if (!name) {
        return "SA";
    }

    const parts =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (!parts.length) {
        return "SA";
    }

    if (parts.length === 1) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();
}


function saFormatDate(value) {

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
   API RESPONSE HELPER
========================================================= */

function saExtractData(response) {

    if (!response) {
        return null;
    }

    if (
        response.data !== undefined
    ) {
        return response.data;
    }

    return response;
}


/* =========================================================
   FIND NESTED VALUE
========================================================= */

function saValue(
    object,
    ...keys
) {

    if (!object) {
        return 0;
    }

    for (
        const key of keys
    ) {

        if (
            object[key] !==
            undefined &&
            object[key] !== null
        ) {

            return object[key];
        }
    }

    return 0;
}


/* =========================================================
   NORMALIZE ORGANIZATION
========================================================= */

function saNormalizeOrganization(
    organization
) {

    if (!organization) {
        return null;
    }


    const users =
        organization.users;


    const stations =
        organization.stations;


    const userTotal =
        typeof users === "object" &&
        users !== null
            ? Number(
                users.total
            ) || 0
            : Number(
                organization.user_count ||
                organization.users_count ||
                organization.userCount ||
                users
            ) || 0;


    const activeUsers =
        typeof users === "object" &&
        users !== null
            ? Number(
                users.active
            ) || 0
            : Number(
                organization.active_user_count ||
                organization.active_users_count ||
                organization.activeUserCount
            ) || 0;


    const stationTotal =
        typeof stations === "object" &&
        stations !== null
            ? Number(
                stations.total
            ) || 0
            : Number(
                organization.station_count ||
                organization.stations_count ||
                organization.stationCount ||
                stations
            ) || 0;


    const activeStations =
        typeof stations === "object" &&
        stations !== null
            ? Number(
                stations.active
            ) || 0
            : Number(
                organization.active_station_count ||
                organization.active_stations_count ||
                organization.activeStationCount
            ) || 0;


    let isActive =
        organization.is_active;


    if (
        isActive ===
        undefined ||
        isActive ===
        null
    ) {

        if (
            organization.status !==
            undefined
        ) {

            isActive =
                String(
                    organization.status
                ).toLowerCase() !==
                "inactive";

        } else {

            /*
               Current organizations table
               does not return is_active.

               Until backend exposes
               organization status, treat
               the organization as active.
            */

            isActive = true;
        }
    }


    return {

        id:
            organization.id ||
            organization.organization_id ||
            "",

        name:
            organization.name ||
            organization.organization_name ||
            "Unnamed Organization",

        email:
            organization.email ||
            "",

        phone:
            organization.phone ||
            "",

        created_at:
            organization.created_at ||
            organization.createdAt ||
            null,

        updated_at:
            organization.updated_at ||
            organization.updatedAt ||
            null,

        is_active:
            Boolean(isActive),

        users: {
            total: userTotal,
            active: activeUsers
        },

        stations: {
            total: stationTotal,
            active: activeStations
        }

    };
}


/* =========================================================
   NORMALIZE ALL ORGANIZATIONS
========================================================= */

function saNormalizeOrganizations(
    data
) {

    let list = [];


    if (Array.isArray(data)) {

        list = data;

    } else if (
        Array.isArray(
            data?.organizations
        )
    ) {

        list =
            data.organizations;

    } else if (
        Array.isArray(
            data?.data
        )
    ) {

        list =
            data.data;
    }


    return list
        .map(
            saNormalizeOrganization
        )
        .filter(Boolean);
}


/* =========================================================
   RENDER APPLICATION
========================================================= */

function renderSuperAdmin() {

    const app =
        document.getElementById(
            "app"
        );

    if (!app) {
        return;
    }


    app.innerHTML = `

        <header class="sa-navbar">

            <div class="sa-navbar-left">

                <a
                    href="super-admin.html"
                    class="sa-brand"
                >

                    <div class="sa-brand-icon">
                        F
                    </div>

                    <div class="sa-brand-text">
                        Fuel<span>Gap</span>
                    </div>

                </a>


                <div class="sa-platform-badge">

                    <i class="fa-solid fa-shield-halved"></i>

                    PLATFORM ADMIN

                </div>

            </div>


            <div class="sa-navbar-right">

                <div class="sa-system-status">

                    <span class="sa-status-dot"></span>

                    System Online

                </div>


                <div class="sa-profile">

                    <div
                        class="sa-avatar"
                        id="saAvatar"
                    >
                        SA
                    </div>


                    <div class="sa-profile-info">

                        <div
                            class="sa-profile-name"
                            id="saProfileName"
                        >
                            Super Admin
                        </div>

                        <div class="sa-profile-role">
                            Software Owner
                        </div>

                    </div>

                </div>


                <button
                    type="button"
                    class="sa-logout"
                    id="saLogout"
                    title="Logout"
                >

                    <i class="fa-solid fa-right-from-bracket"></i>

                </button>

            </div>

        </header>


        <main class="sa-container">


            <section class="sa-page-header">

                <div class="sa-title">

                    <h1>
                        Platform Dashboard
                    </h1>

                    <p>
                        Monitor organizations, users,
                        stations and activity across
                        the entire FuelGap platform.
                    </p>

                </div>


                <div class="sa-actions">

                    <button
                        type="button"
                        class="sa-btn sa-btn-secondary"
                        id="saRefresh"
                    >

                        <i class="fa-solid fa-rotate"></i>

                        Refresh

                    </button>


                    <button
                        type="button"
                        class="sa-btn sa-btn-primary"
                        id="saOrganizations"
                    >

                        <i class="fa-solid fa-building"></i>

                        Organizations

                    </button>

                </div>

            </section>


            <div
                class="sa-loading"
                id="saLoading"
            ></div>


            <div
                class="sa-error"
                id="saError"
            >

                <i class="fa-solid fa-circle-exclamation"></i>

                <span id="saErrorMessage">
                    Unable to load platform data.
                </span>

            </div>


            <section class="sa-stats">


                <div class="sa-stat">

                    <div class="sa-stat-top">

                        <div class="sa-stat-label">
                            Total Organizations
                        </div>

                        <div class="sa-stat-icon">
                            <i class="fa-solid fa-building"></i>
                        </div>

                    </div>

                    <div
                        class="sa-stat-value"
                        id="statOrganizations"
                    >
                        0
                    </div>

                    <div class="sa-stat-description">
                        Organizations using FuelGap
                    </div>

                </div>


                <div class="sa-stat">

                    <div class="sa-stat-top">

                        <div class="sa-stat-label">
                            Active Organizations
                        </div>

                        <div class="sa-stat-icon">
                            <i class="fa-solid fa-building-circle-check"></i>
                        </div>

                    </div>

                    <div
                        class="sa-stat-value"
                        id="statActiveOrganizations"
                    >
                        0
                    </div>

                    <div class="sa-stat-description">
                        Currently operational
                    </div>

                </div>


                <div class="sa-stat">

                    <div class="sa-stat-top">

                        <div class="sa-stat-label">
                            Total Users
                        </div>

                        <div class="sa-stat-icon">
                            <i class="fa-solid fa-users"></i>
                        </div>

                    </div>

                    <div
                        class="sa-stat-value"
                        id="statUsers"
                    >
                        0
                    </div>

                    <div class="sa-stat-description">
                        Registered platform users
                    </div>

                </div>


                <div class="sa-stat">

                    <div class="sa-stat-top">

                        <div class="sa-stat-label">
                            Total Stations
                        </div>

                        <div class="sa-stat-icon">
                            <i class="fa-solid fa-gas-pump"></i>
                        </div>

                    </div>

                    <div
                        class="sa-stat-value"
                        id="statStations"
                    >
                        0
                    </div>

                    <div class="sa-stat-description">
                        Registered fuel stations
                    </div>

                </div>


                <div class="sa-stat">

                    <div class="sa-stat-top">

                        <div class="sa-stat-label">
                            Total Sales
                        </div>

                        <div class="sa-stat-icon">
                            <i class="fa-solid fa-naira-sign"></i>
                        </div>

                    </div>

                    <div
                        class="sa-stat-value"
                        id="statSales"
                    >
                        ₦0
                    </div>

                    <div class="sa-stat-description">
                        All recorded sales
                    </div>

                </div>


                <div class="sa-stat">

                    <div class="sa-stat-top">

                        <div class="sa-stat-label">
                            Today's Sales
                        </div>

                        <div class="sa-stat-icon">
                            <i class="fa-solid fa-chart-line"></i>
                        </div>

                    </div>

                    <div
                        class="sa-stat-value"
                        id="statTodaySales"
                    >
                        ₦0
                    </div>

                    <div class="sa-stat-description">
                        Sales recorded today
                    </div>

                </div>


                <div class="sa-stat">

                    <div class="sa-stat-top">

                        <div class="sa-stat-label">
                            Total Shifts
                        </div>

                        <div class="sa-stat-icon">
                            <i class="fa-solid fa-clock"></i>
                        </div>

                    </div>

                    <div
                        class="sa-stat-value"
                        id="statShifts"
                    >
                        0
                    </div>

                    <div class="sa-stat-description">
                        Operational shifts
                    </div>

                </div>


                <div class="sa-stat">

                    <div class="sa-stat-top">

                        <div class="sa-stat-label">
                            Active Alerts
                        </div>

                        <div class="sa-stat-icon">
                            <i class="fa-solid fa-bell"></i>
                        </div>

                    </div>

                    <div
                        class="sa-stat-value"
                        id="statAlerts"
                    >
                        0
                    </div>

                    <div class="sa-stat-description">
                        Alerts requiring attention
                    </div>

                </div>


            </section>


            <section class="sa-content-grid">


                <div class="sa-panel">

                    <div class="sa-panel-header">

                        <div class="sa-panel-title">

                            <h2>
                                Organizations
                            </h2>

                            <p>
                                Real organizations registered on FuelGap
                            </p>

                        </div>


                        <button
                            type="button"
                            class="sa-link-btn"
                            id="saViewAllOrganizations"
                        >
                            View all
                        </button>

                    </div>


                    <div class="sa-table-wrap">

                        <table class="sa-table">

                            <thead>

                                <tr>

                                    <th>
                                        Organization
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


                            <tbody
                                id="saOrganizationsTable"
                            >

                                <tr>

                                    <td colspan="5">

                                        <div class="sa-empty">

                                            <i class="fa-solid fa-spinner fa-spin"></i>

                                            <p>
                                                Loading organizations...
                                            </p>

                                        </div>

                                    </td>

                                </tr>

                            </tbody>

                        </table>

                    </div>

                </div>


                <div>


                    <div class="sa-panel">

                        <div class="sa-panel-header">

                            <div class="sa-panel-title">

                                <h2>
                                    Platform Overview
                                </h2>

                                <p>
                                    Current platform activity
                                </p>

                            </div>

                        </div>


                        <div class="sa-overview-list">


                            <div class="sa-overview-item">

                                <div class="sa-overview-left">

                                    <div class="sa-overview-icon">
                                        <i class="fa-solid fa-users"></i>
                                    </div>

                                    <div>

                                        <div class="sa-overview-name">
                                            Active Users
                                        </div>

                                        <div class="sa-overview-desc">
                                            Enabled accounts
                                        </div>

                                    </div>

                                </div>


                                <div
                                    class="sa-overview-value"
                                    id="overviewActiveUsers"
                                >
                                    0
                                </div>

                            </div>


                            <div class="sa-overview-item">

                                <div class="sa-overview-left">

                                    <div class="sa-overview-icon">
                                        <i class="fa-solid fa-gas-pump"></i>
                                    </div>

                                    <div>

                                        <div class="sa-overview-name">
                                            Active Stations
                                        </div>

                                        <div class="sa-overview-desc">
                                            Operational stations
                                        </div>

                                    </div>

                                </div>


                                <div
                                    class="sa-overview-value"
                                    id="overviewActiveStations"
                                >
                                    0
                                </div>

                            </div>


                            <div class="sa-overview-item">

                                <div class="sa-overview-left">

                                    <div class="sa-overview-icon">
                                        <i class="fa-solid fa-gears"></i>
                                    </div>

                                    <div>

                                        <div class="sa-overview-name">
                                            Pumps
                                        </div>

                                        <div class="sa-overview-desc">
                                            Registered pumps
                                        </div>

                                    </div>

                                </div>


                                <div
                                    class="sa-overview-value"
                                    id="overviewPumps"
                                >
                                    0
                                </div>

                            </div>


                            <div class="sa-overview-item">

                                <div class="sa-overview-left">

                                    <div class="sa-overview-icon">
                                        <i class="fa-solid fa-droplet"></i>
                                    </div>

                                    <div>

                                        <div class="sa-overview-name">
                                            Nozzles
                                        </div>

                                        <div class="sa-overview-desc">
                                            Configured nozzles
                                        </div>

                                    </div>

                                </div>


                                <div
                                    class="sa-overview-value"
                                    id="overviewNozzles"
                                >
                                    0
                                </div>

                            </div>


                            <div class="sa-overview-item">

                                <div class="sa-overview-left">

                                    <div class="sa-overview-icon">
                                        <i class="fa-solid fa-money-bill-transfer"></i>
                                    </div>

                                    <div>

                                        <div class="sa-overview-name">
                                            Payments
                                        </div>

                                        <div class="sa-overview-desc">
                                            Recorded transactions
                                        </div>

                                    </div>

                                </div>


                                <div
                                    class="sa-overview-value"
                                    id="overviewPayments"
                                >
                                    0
                                </div>

                            </div>


                            <div class="sa-overview-item">

                                <div class="sa-overview-left">

                                    <div class="sa-overview-icon">
                                        <i class="fa-solid fa-triangle-exclamation"></i>
                                    </div>

                                    <div>

                                        <div class="sa-overview-name">
                                            Gaps
                                        </div>

                                        <div class="sa-overview-desc">
                                            Reconciliation records
                                        </div>

                                    </div>

                                </div>


                                <div
                                    class="sa-overview-value"
                                    id="overviewGaps"
                                >
                                    0
                                </div>

                            </div>

                        </div>

                    </div>


                    <div
                        class="sa-panel"
                        style="margin-top:18px;"
                    >

                        <div class="sa-panel-header">

                            <div class="sa-panel-title">

                                <h2>
                                    Quick Access
                                </h2>

                                <p>
                                    Platform management
                                </p>

                            </div>

                        </div>


                        <div class="sa-quick-actions">


                            <button
                                type="button"
                                class="sa-quick"
                                id="quickOrganizations"
                            >

                                <i class="fa-solid fa-building"></i>

                                <strong>
                                    Organizations
                                </strong>

                                <span>
                                    View all organizations
                                </span>

                            </button>


                            <button
                                type="button"
                                class="sa-quick"
                                id="quickUsers"
                            >

                                <i class="fa-solid fa-users"></i>

                                <strong>
                                    Users
                                </strong>

                                <span>
                                    Platform users
                                </span>

                            </button>


                            <button
                                type="button"
                                class="sa-quick"
                                id="quickActivity"
                            >

                                <i class="fa-solid fa-chart-simple"></i>

                                <strong>
                                    Activity
                                </strong>

                                <span>
                                    Platform activity
                                </span>

                            </button>


                            <button
                                type="button"
                                class="sa-quick"
                                id="quickAlerts"
                            >

                                <i class="fa-solid fa-bell"></i>

                                <strong>
                                    Alerts
                                </strong>

                                <span>
                                    Active alerts
                                </span>

                            </button>

                        </div>

                    </div>

                </div>

            </section>


            <footer class="sa-footer">

                <span>
                    FuelGap Platform Administration
                </span>

                <span id="saLastUpdated">
                    Last updated: --
                </span>

            </footer>

        </main>
    `;
}


/* =========================================================
   LOADING
========================================================= */

function setSuperAdminLoading(
    loading
) {

    SuperAdminState.isLoading =
        loading;

    const element =
        document.getElementById(
            "saLoading"
        );

    if (!element) {
        return;
    }

    element.classList.toggle(
        "active",
        loading
    );
}


/* =========================================================
   ERROR
========================================================= */

function showSuperAdminError(
    message
) {

    const box =
        document.getElementById(
            "saError"
        );

    const text =
        document.getElementById(
            "saErrorMessage"
        );

    if (!box || !text) {
        return;
    }

    text.textContent =
        message ||
        "Unable to load platform data.";

    box.classList.add("show");
}


function hideSuperAdminError() {

    const box =
        document.getElementById(
            "saError"
        );

    if (box) {

        box.classList.remove(
            "show"
        );
    }
}


/* =========================================================
   LOAD CURRENT USER
========================================================= */

async function loadSuperAdminUser() {

    try {

        if (
            typeof FuelGapAPI ===
            "undefined"
        ) {

            throw new Error(
                "FuelGapAPI is not available."
            );
        }


        if (
            typeof FuelGapAPI.getCurrentUser !==
            "function"
        ) {

            throw new Error(
                "getCurrentUser() is not available."
            );
        }


        const response =
            await FuelGapAPI
                .getCurrentUser();


        const data =
            saExtractData(
                response
            );


        /*
           Some auth APIs return:

           {
               user: {...}
           }

           Others return:

           {...}
        */

        SuperAdminState.currentUser =
            data?.user ||
            data?.currentUser ||
            data ||
            null;


    } catch (error) {

        console.warn(
            "SUPER ADMIN USER LOAD:",
            error
        );

    }

}


/* =========================================================
   RENDER USER
========================================================= */

function renderSuperAdminUser() {

    const user =
        SuperAdminState.currentUser;

    if (!user) {
        return;
    }


    const name =
        user.full_name ||
        user.fullName ||
        user.name ||
        user.email ||
        "Super Admin";


    const profileName =
        document.getElementById(
            "saProfileName"
        );

    const avatar =
        document.getElementById(
            "saAvatar"
        );


    if (profileName) {

        profileName.textContent =
            name;
    }


    if (avatar) {

        avatar.textContent =
            saInitials(
                name
            );
    }

}


/* =========================================================
   LOAD PLATFORM OVERVIEW
========================================================= */

async function loadPlatformOverview() {

    try {

        if (
            typeof FuelGapAPI ===
            "undefined"
        ) {

            throw new Error(
                "FuelGapAPI is not available. Check api.js."
            );
        }


        if (
            typeof FuelGapAPI.getPlatformOverview ===
            "function"
        ) {

            const response =
                await FuelGapAPI
                    .getPlatformOverview();


            SuperAdminState.overview =
                saExtractData(
                    response
                );


            return;
        }


        const response =
            await fetch(
                "http://localhost:7000/api/platform/overview",
                {
                    method: "GET",

                    credentials: "include",

                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to load platform overview."
            );
        }


        SuperAdminState.overview =
            saExtractData(
                result
            );


    } catch (error) {

        console.error(
            "PLATFORM OVERVIEW ERROR:",
            error
        );

        throw error;
    }
}


/* =========================================================
   LOAD PLATFORM ORGANIZATIONS
========================================================= */

async function loadPlatformOrganizations() {

    try {

        if (
            typeof FuelGapAPI ===
            "undefined"
        ) {

            throw new Error(
                "FuelGapAPI is not available."
            );
        }


        if (
            typeof FuelGapAPI.getPlatformOrganizations ===
            "function"
        ) {

            const response =
                await FuelGapAPI
                    .getPlatformOrganizations();


            const data =
                saExtractData(
                    response
                );


            SuperAdminState.organizations =
                saNormalizeOrganizations(
                    data
                );


            return;
        }


        const response =
            await fetch(
                "http://localhost:7000/api/platform/organizations",
                {
                    method: "GET",

                    credentials: "include",

                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to load organizations."
            );
        }


        const data =
            saExtractData(
                result
            );


        SuperAdminState.organizations =
            saNormalizeOrganizations(
                data
            );


    } catch (error) {

        console.error(
            "PLATFORM ORGANIZATIONS ERROR:",
            error
        );

        throw error;
    }
}


/* =========================================================
   RENDER PLATFORM OVERVIEW
========================================================= */

function renderPlatformOverview() {

    const data =
        SuperAdminState.overview ||
        {};


    /*
       EXACT BACKEND STRUCTURE:

       {
           organizations: {
               total: 5
           },

           users: {
               total: 8,
               active: 8
           },

           stations: {
               total: 5,
               active: 5
           },

           pumps: {
               total: 2
           },

           nozzles: {
               total: 3
           },

           shifts: {
               total: 1
           },

           sales: {
               total: 0,
               totalAmount: 0,
               todayAmount: 0
           },

           payments: {
               total: 0
           },

           gaps: {
               total: 0
           },

           alerts: {
               total: 0,
               active: 0
           }
       }
    */


    const organizations =
        data.organizations ||
        {};


    const users =
        data.users ||
        {};


    const stations =
        data.stations ||
        {};


    const pumps =
        data.pumps ||
        {};


    const nozzles =
        data.nozzles ||
        {};


    const shifts =
        data.shifts ||
        {};


    const sales =
        data.sales ||
        {};


    const payments =
        data.payments ||
        {};


    const gaps =
        data.gaps ||
        {};


    const alerts =
        data.alerts ||
        {};


    const totalOrganizations =
        Number(
            organizations.total
        ) || 0;


    const activeOrganizations =
        SuperAdminState
            .organizations
            .filter(
                organization =>
                    organization.is_active
            )
            .length;


    const totalUsers =
        Number(
            users.total
        ) || 0;


    const activeUsers =
        Number(
            users.active
        ) || 0;


    const totalStations =
        Number(
            stations.total
        ) || 0;


    const activeStations =
        Number(
            stations.active
        ) || 0;


    const totalPumps =
        Number(
            pumps.total
        ) || 0;


    const totalNozzles =
        Number(
            nozzles.total
        ) || 0;


    const totalShifts =
        Number(
            shifts.total
        ) || 0;


    const totalPayments =
        Number(
            payments.total
        ) || 0;


    const totalGaps =
        Number(
            gaps.total
        ) || 0;


    const activeAlerts =
        Number(
            alerts.active
        ) || 0;


    const totalSalesAmount =
        Number(
            sales.totalAmount
        ) || 0;


    const todaySalesAmount =
        Number(
            sales.todayAmount
        ) || 0;


    const statOrganizations =
        document.getElementById(
            "statOrganizations"
        );


    const statActiveOrganizations =
        document.getElementById(
            "statActiveOrganizations"
        );


    const statUsers =
        document.getElementById(
            "statUsers"
        );


    const statStations =
        document.getElementById(
            "statStations"
        );


    const statSales =
        document.getElementById(
            "statSales"
        );


    const statTodaySales =
        document.getElementById(
            "statTodaySales"
        );


    const statShifts =
        document.getElementById(
            "statShifts"
        );


    const statAlerts =
        document.getElementById(
            "statAlerts"
        );


    if (statOrganizations) {

        statOrganizations.textContent =
            saFormatNumber(
                totalOrganizations
            );
    }


    if (statActiveOrganizations) {

        statActiveOrganizations.textContent =
            saFormatNumber(
                activeOrganizations
            );
    }


    if (statUsers) {

        statUsers.textContent =
            saFormatNumber(
                totalUsers
            );
    }


    if (statStations) {

        statStations.textContent =
            saFormatNumber(
                totalStations
            );
    }


    if (statSales) {

        statSales.textContent =
            saFormatCurrency(
                totalSalesAmount
            );
    }


    if (statTodaySales) {

        statTodaySales.textContent =
            saFormatCurrency(
                todaySalesAmount
            );
    }


    if (statShifts) {

        statShifts.textContent =
            saFormatNumber(
                totalShifts
            );
    }


    if (statAlerts) {

        statAlerts.textContent =
            saFormatNumber(
                activeAlerts
            );
    }


    const overviewActiveUsers =
        document.getElementById(
            "overviewActiveUsers"
        );


    const overviewActiveStations =
        document.getElementById(
            "overviewActiveStations"
        );


    const overviewPumps =
        document.getElementById(
            "overviewPumps"
        );


    const overviewNozzles =
        document.getElementById(
            "overviewNozzles"
        );


    const overviewPayments =
        document.getElementById(
            "overviewPayments"
        );


    const overviewGaps =
        document.getElementById(
            "overviewGaps"
        );


    if (overviewActiveUsers) {

        overviewActiveUsers.textContent =
            saFormatNumber(
                activeUsers
            );
    }


    if (overviewActiveStations) {

        overviewActiveStations.textContent =
            saFormatNumber(
                activeStations
            );
    }


    if (overviewPumps) {

        overviewPumps.textContent =
            saFormatNumber(
                totalPumps
            );
    }


    if (overviewNozzles) {

        overviewNozzles.textContent =
            saFormatNumber(
                totalNozzles
            );
    }


    if (overviewPayments) {

        overviewPayments.textContent =
            saFormatNumber(
                totalPayments
            );
    }


    if (overviewGaps) {

        overviewGaps.textContent =
            saFormatNumber(
                totalGaps
            );
    }

}


/* =========================================================
   RENDER ORGANIZATIONS
========================================================= */

function renderOrganizations() {

    const tbody =
        document.getElementById(
            "saOrganizationsTable"
        );


    if (!tbody) {
        return;
    }


    const organizations =
        SuperAdminState.organizations ||
        [];


    if (!organizations.length) {

        tbody.innerHTML = `

            <tr>

                <td colspan="5">

                    <div class="sa-empty">

                        <i class="fa-solid fa-building"></i>

                        <p>
                            No organizations found.
                        </p>

                    </div>

                </td>

            </tr>

        `;

        return;
    }


    /*
       Dashboard preview:
       Show first 8 organizations.
    */

    const visible =
        organizations.slice(
            0,
            8
        );


    tbody.innerHTML =
        visible.map(
            organization => {

                const id =
                    organization.id;


                const name =
                    organization.name ||
                    "Unnamed Organization";


                const email =
                    organization.email ||
                    "";


                const phone =
                    organization.phone ||
                    "";


                const totalUsers =
                    organization.users?.total ||
                    0;


                const activeUsers =
                    organization.users?.active ||
                    0;


                const totalStations =
                    organization.stations?.total ||
                    0;


                const activeStations =
                    organization.stations?.active ||
                    0;


                const isActive =
                    Boolean(
                        organization.is_active
                    );


                return `

                    <tr>

                        <td>

                            <div class="sa-org-name">
                                ${saEscapeHTML(name)}
                            </div>

                            ${
                                email
                                    ? `
                                        <div class="sa-org-email">
                                            ${saEscapeHTML(email)}
                                        </div>
                                      `
                                    : ""
                            }

                            ${
                                phone
                                    ? `
                                        <div class="sa-org-phone">
                                            ${saEscapeHTML(phone)}
                                        </div>
                                      `
                                    : ""
                            }

                        </td>


                        <td>

                            <span class="sa-number">
                                ${saFormatNumber(totalUsers)}
                            </span>

                            <span class="sa-number-sub">
                                ${saFormatNumber(activeUsers)}
                                active
                            </span>

                        </td>


                        <td>

                            <span class="sa-number">
                                ${saFormatNumber(totalStations)}
                            </span>

                            <span class="sa-number-sub">
                                ${saFormatNumber(activeStations)}
                                active
                            </span>

                        </td>


                        <td>

                            <span
                                class="sa-status ${
                                    isActive
                                        ? "active"
                                        : "inactive"
                                }"
                            >

                                <span
                                    class="sa-status-dot-small"
                                ></span>

                                ${
                                    isActive
                                        ? "Active"
                                        : "Inactive"
                                }

                            </span>

                        </td>


                        <td>

                            <button
                                type="button"
                                class="sa-view"
                                data-organization-id="${saEscapeHTML(id)}"
                            >

                                View

                            </button>

                        </td>

                    </tr>

                `;

            }
        )
        .join("");


    tbody
        .querySelectorAll(
            "[data-organization-id]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset
                                .organizationId;


                        openOrganization(
                            id
                        );

                    }
                );

            }
        );

}


/* =========================================================
   ORGANIZATION NAVIGATION
========================================================= */

function openOrganization(
    organizationId
) {

    if (!organizationId) {
        return;
    }


    window.location.href =
        `platform-organization.html?id=${encodeURIComponent(
            organizationId
        )}`;
}


/* =========================================================
   ORGANIZATIONS PAGE
========================================================= */

function openOrganizationsPage() {

    window.location.href =
        "platform-organizations.html";
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutSuperAdmin() {

    try {

        if (
            typeof FuelGapAPI !==
            "undefined" &&
            typeof FuelGapAPI.logout ===
            "function"
        ) {

            await FuelGapAPI.logout();

        } else {

            await fetch(
                "http://localhost:7000/api/auth/logout",
                {
                    method: "POST",

                    credentials: "include"
                }
            );

        }

    } catch (error) {

        console.warn(
            "LOGOUT ERROR:",
            error
        );

    } finally {

        window.location.href =
            "login.html";
    }
}


/* =========================================================
   LOAD EVERYTHING
========================================================= */

async function loadSuperAdminDashboard() {

    if (
        SuperAdminState.isLoading
    ) {
        return;
    }


    setSuperAdminLoading(
        true
    );


    hideSuperAdminError();


    try {

        await Promise.all([

            loadSuperAdminUser(),

            loadPlatformOverview(),

            loadPlatformOrganizations()

        ]);


        renderSuperAdminUser();

        renderPlatformOverview();

        renderOrganizations();


        SuperAdminState.lastUpdated =
            new Date();


        const updated =
            document.getElementById(
                "saLastUpdated"
            );


        if (updated) {

            updated.textContent =
                "Last updated: " +
                SuperAdminState
                    .lastUpdated
                    .toLocaleTimeString(
                        "en-NG",
                        {
                            hour: "2-digit",
                            minute: "2-digit"
                        }
                    );
        }


    } catch (error) {

        console.error(
            "SUPER ADMIN DASHBOARD ERROR:",
            error
        );


        showSuperAdminError(
            error.message ||
            "Unable to load platform dashboard."
        );

    } finally {

        setSuperAdminLoading(
            false
        );
    }
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function initializeSuperAdminEvents() {

    const refresh =
        document.getElementById(
            "saRefresh"
        );


    if (refresh) {

        refresh.addEventListener(
            "click",
            loadSuperAdminDashboard
        );
    }


    const organizations =
        document.getElementById(
            "saOrganizations"
        );


    if (organizations) {

        organizations.addEventListener(
            "click",
            openOrganizationsPage
        );
    }


    const viewAll =
        document.getElementById(
            "saViewAllOrganizations"
        );


    if (viewAll) {

        viewAll.addEventListener(
            "click",
            openOrganizationsPage
        );
    }


    const quickOrganizations =
        document.getElementById(
            "quickOrganizations"
        );


    if (quickOrganizations) {

        quickOrganizations.addEventListener(
            "click",
            openOrganizationsPage
        );
    }


    const quickUsers =
        document.getElementById(
            "quickUsers"
        );


    if (quickUsers) {

        quickUsers.addEventListener(
            "click",
            () => {

                alert(
                    "Platform Users page will be connected next."
                );

            }
        );
    }


    const quickActivity =
        document.getElementById(
            "quickActivity"
        );


    if (quickActivity) {

        quickActivity.addEventListener(
            "click",
            () => {

                alert(
                    "Platform Activity will be connected next."
                );

            }
        );
    }


    const quickAlerts =
        document.getElementById(
            "quickAlerts"
        );


    if (quickAlerts) {

        quickAlerts.addEventListener(
            "click",
            () => {

                alert(
                    "Platform Alerts will be connected next."
                );

            }
        );
    }


    const logout =
        document.getElementById(
            "saLogout"
        );


    if (logout) {

        logout.addEventListener(
            "click",
            logoutSuperAdmin
        );
    }

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        renderSuperAdmin();

        initializeSuperAdminEvents();

        await loadSuperAdminDashboard();

    }
);


/* =========================================================
   GLOBAL
========================================================= */

window.SuperAdminState =
    SuperAdminState;


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.FuelGapSuperAdmin = {

    refresh:
        loadSuperAdminDashboard,

    loadOrganizations:
        loadPlatformOrganizations,

    loadOverview:
        loadPlatformOverview,

    openOrganizations:
        openOrganizationsPage,

    openOrganization:
        openOrganization,

    getState:
        () => SuperAdminState

};