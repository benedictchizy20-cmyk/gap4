/* =========================================================
   FUELGAP - APPLICATION SHELL
   PLATFORM + ORGANIZATION AWARE
   REAL BACKEND AUTHENTICATION
   HTTPONLY COOKIE SESSION
   NO LOCALSTORAGE AUTHENTICATION
========================================================= */


/* =========================================================
   APPLICATION STATE
========================================================= */

const FuelGapAppState = {

    currentUser: null,

    currentPage: null,

    isNavigating: false,

    gapsScriptLoaded: false,

    gapsScriptLoading: false,

    isSuperAdmin: false

};


/* =========================================================
   GET APPLICATION BASE PATH
========================================================= */

function getApplicationBasePath() {

    try {

        const appScript =
            Array.from(
                document.scripts
            ).find(
                script =>
                    script.src &&
                    script.src.includes("/js/app.js")
            );

        if (appScript) {

            return new URL(
                "./",
                appScript.src
            ).href;

        }

    } catch (error) {

        console.warn(
            "Could not determine app.js path:",
            error
        );

    }


    return new URL(
        "./js/",
        window.location.href
    ).href;

}


/* =========================================================
   GET USER ROLE
========================================================= */

function getUserRole(user) {

    return String(
        user?.role ||
        user?.user_role ||
        user?.userRole ||
        ""
    )
        .toLowerCase()
        .trim();

}


/* =========================================================
   CHECK SUPER ADMIN
========================================================= */

function isSuperAdmin(user) {

    return getUserRole(user) === "super_admin";

}


/* =========================================================
   INITIALIZE APPLICATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            if (
                typeof FuelGapAPI ===
                "undefined"
            ) {

                console.error(
                    "FuelGapAPI is not loaded."
                );

                window.location.href =
                    "../login.html";

                return;

            }


            /* =================================================
               GET CURRENT USER
            ================================================= */

            const response =
                await FuelGapAPI.getCurrentUser();


            /* =================================================
               VALIDATE RESPONSE
            ================================================= */

            if (
                !response ||
                !response.success ||
                !response.data ||
                !response.data.user
            ) {

                console.error(
                    "INVALID CURRENT USER RESPONSE:",
                    response
                );

                window.location.href =
                    "../login.html";

                return;

            }


            /* =================================================
               STORE USER
            ================================================= */

            FuelGapAppState.currentUser =
                response.data.user;


            FuelGapAppState.isSuperAdmin =
                isSuperAdmin(
                    FuelGapAppState.currentUser
                );


            console.log(
                "FUELGAP APPLICATION USER:",
                FuelGapAppState.currentUser
            );


            console.log(
                "FUELGAP USER ROLE:",
                getUserRole(
                    FuelGapAppState.currentUser
                )
            );


            console.log(
                "FUELGAP SUPER ADMIN:",
                FuelGapAppState.isSuperAdmin
            );


            /* =================================================
               RENDER APPLICATION
            ================================================= */

            renderApplication(
                FuelGapAppState.currentUser
            );


        } catch (error) {

            console.error(
                "APPLICATION AUTH ERROR:",
                error
            );

            window.location.href =
                "../login.html";

        }

    }
);


/* =========================================================
   RENDER APPLICATION
========================================================= */

function renderApplication(user) {

    const app =
        document.getElementById(
            "app"
        );


    if (!app) {

        console.error(
            "Application container #app not found."
        );

        return;

    }


    const userName =
        getUserDisplayName(user);


    const superAdmin =
        isSuperAdmin(user);


    /* =====================================================
       NAVBAR
    ===================================================== */

    app.innerHTML = `

        <header class="app-navbar">

            <div class="app-navbar-left">

                <button
                    class="app-menu-button"
                    id="menuButton"
                    type="button"
                    aria-label="Toggle menu"
                >
                    ☰
                </button>


                <a
                    href="./dashboard.html"
                    class="logo"
                    data-page="dashboard"
                >

                    <span class="logo-mark">
                        F
                    </span>

                    <span>
                        Fuel<span class="text-yellow">
                            Gap
                        </span>
                    </span>

                </a>

            </div>


            <div class="app-navbar-right">

                <span class="status-badge status-online">
                    ● System Online
                </span>


                ${
                    superAdmin
                        ? `
                            <span class="platform-badge">
                                PLATFORM OWNER
                            </span>
                          `
                        : ""
                }


                <span class="app-user-name">
                    ${escapeHTML(userName)}
                </span>


                <button
                    class="btn btn-outline"
                    id="logoutButton"
                    type="button"
                >
                    Logout
                </button>

            </div>

        </header>


        <div class="app-layout">

            <aside
                class="sidebar"
                id="sidebar"
            >

                ${renderSidebar(user)}

            </aside>


            <main class="app-main">

                <div id="pageContent"></div>

            </main>

        </div>

    `;


    /* =====================================================
       SETUP EVENTS
    ===================================================== */

    setupAppEvents();


    /* =====================================================
       ACTIVE PAGE
    ===================================================== */

    setActiveSidebarLink(
        getCurrentPageName()
    );


    /* =====================================================
       APPLICATION SHELL READY EVENT
       
       IMPORTANT:
       readings.js waits for this event before trying
       to render the Meter Readings page.
    ===================================================== */

    document.dispatchEvent(
        new CustomEvent(
            "fuelgap:app-ready"
        )
    );


    console.log(
        "FuelGap application shell is ready."
    );

}


/* =========================================================
   USER DISPLAY NAME
========================================================= */

function getUserDisplayName(user) {

    if (!user) {

        return "User";

    }


    return (

        user.full_name ||

        user.fullName ||

        user.name ||

        user.first_name ||

        user.firstName ||

        user.email ||

        "User"

    );

}


/* =========================================================
   PLATFORM NAVIGATION
========================================================= */

function getPlatformNavigation() {

    return [

        {
            id: "dashboard",
            label: "Platform Overview",
            icon: "▣",
            url: "./dashboard.html"
        },

        {
            id: "organizations",
            label: "Organizations",
            icon: "◉",
            url: "./platform-organizations.html"
        },

        {
            id: "activity",
            label: "Platform Activity",
            icon: "◷",
            url: "./platform-activity.html"
        },

        {
            id: "users",
            label: "Platform Users",
            icon: "♙",
            url: "./platform-users.html"
        },

        {
            id: "alerts",
            label: "Platform Alerts",
            icon: "!",
            url: "./platform-alerts.html"
        },

        {
            id: "reports",
            label: "Platform Reports",
            icon: "▥",
            url: "./platform-reports.html"
        },

        {
            id: "audit",
            label: "Audit Logs",
            icon: "◌",
            url: "./audit-logs.html"
        }

    ];

}


/* =========================================================
   ORGANIZATION NAVIGATION
========================================================= */

function getOrganizationNavigation() {

    return [

        {
            id: "dashboard",
            label: "Overview",
            icon: "▣",
            url: "./dashboard.html"
        },

        {
            id: "organizations",
            label: "Organization",
            icon: "◉",
            url: "./organizations.html"
        },

        {
            id: "stations",
            label: "Stations",
            icon: "⌂",
            url: "./stations.html"
        },

        {
            id: "pumps",
            label: "Pumps & Nozzles",
            icon: "⛽",
            url: "./pumps.html"
        },

        {
            id: "readings",
            label: "Meter Readings",
            icon: "▤",
            url: "./readings.html"
        },

        {
            id: "shifts",
            label: "Shifts",
            icon: "◷",
            url: "./shifts.html"
        },

        {
            id: "sales",
            label: "Sales",
            icon: "₦",
            url: "./sales.html"
        },

        {
            id: "payments",
            label: "Payments",
            icon: "₦",
            url: "./payments.html"
        },

        {
            id: "gaps",
            label: "Gaps & Variance",
            icon: "△",
            url: "./gaps.html"
        },

        {
            id: "alerts",
            label: "Alerts",
            icon: "!",
            url: "./alerts.html"
        },

        {
            id: "reports",
            label: "Reports",
            icon: "▥",
            url: "./reports.html"
        },

        {
            id: "staff",
            label: "Staff",
            icon: "♙",
            url: "./staff.html"
        },

        {
            id: "audit",
            label: "Audit Logs",
            icon: "◌",
            url: "./audit-logs.html"
        }

    ];

}


/* =========================================================
   RENDER SIDEBAR
========================================================= */

function renderSidebar(user) {

    const superAdmin =
        isSuperAdmin(user);


    const navigation =
        superAdmin
            ? getPlatformNavigation()
            : getOrganizationNavigation();


    const role =
        getUserRole(user);


    console.log(
        "SIDEBAR ROLE:",
        role
    );


    let visibleItems =
        navigation;


    if (!superAdmin) {

        visibleItems =
            navigation.filter(
                item => {

                    try {

                        if (
                            typeof hasPermission !==
                            "function"
                        ) {

                            return true;

                        }


                        return hasPermission(
                            role,
                            item.id
                        );

                    } catch (error) {

                        console.error(
                            "PERMISSION ERROR:",
                            item.id,
                            error
                        );

                        return false;

                    }

                }
            );

    }


    const sectionTitle =
        superAdmin
            ? "FuelGap Platform"
            : "Main Menu";


    let html = `

        <div class="sidebar-section-title">

            ${escapeHTML(sectionTitle)}

        </div>

    `;


    visibleItems.forEach(
        item => {

            html += `

                <a
                    href="${item.url}"
                    class="sidebar-link"
                    data-page="${item.id}"
                >

                    <span class="sidebar-link-icon">
                        ${item.icon}
                    </span>

                    <span class="sidebar-link-label">
                        ${escapeHTML(item.label)}
                    </span>

                </a>

            `;

        }
    );


    if (
        visibleItems.length === 0
    ) {

        html += `

            <div class="sidebar-empty">

                <span>
                    No menu items available
                </span>

            </div>

        `;

    }


    return html;

}


/* =========================================================
   APPLICATION EVENTS
========================================================= */

function setupAppEvents() {

    const menuButton =
        document.getElementById(
            "menuButton"
        );


    const sidebar =
        document.getElementById(
            "sidebar"
        );


    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    /* =====================================================
       MOBILE MENU
    ===================================================== */

    if (
        menuButton &&
        sidebar
    ) {

        menuButton.addEventListener(
            "click",
            () => {

                sidebar.classList.toggle(
                    "open"
                );

            }
        );

    }


    /* =====================================================
       SIDEBAR NAVIGATION
    ===================================================== */

    if (sidebar) {

        const sidebarLinks =
            sidebar.querySelectorAll(
                ".sidebar-link"
            );


        sidebarLinks.forEach(
            link => {

                link.addEventListener(
                    "click",
                    async event => {

                        const page =
                            link.dataset.page;


                        /* =================================
                           GAPS
                        ================================= */

                        if (
                            page === "gaps"
                        ) {

                            event.preventDefault();

                            await openGapsPage();

                        }


                        sidebar.classList.remove(
                            "open"
                        );

                    }
                );

            }
        );

    }


    /* =====================================================
       LOGO
    ===================================================== */

    const logo =
        document.querySelector(
            ".app-navbar .logo"
        );


    if (logo) {

        logo.addEventListener(
            "click",
            () => {

                setActiveSidebarLink(
                    "dashboard"
                );

            }
        );

    }


    /* =====================================================
       LOGOUT
    ===================================================== */

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async () => {

                try {

                    logoutButton.disabled =
                        true;


                    logoutButton.textContent =
                        "Logging out...";


                    await FuelGapAPI.logout();

                } catch (error) {

                    console.error(
                        "LOGOUT ERROR:",
                        error
                    );

                } finally {

                    window.location.href =
                        "../login.html";

                }

            }
        );

    }

}


/* =========================================================
   LOAD GAPS SCRIPT
========================================================= */

async function loadGapsScript() {

    if (
        typeof window.initializeGapsPage ===
        "function"
    ) {

        FuelGapAppState.gapsScriptLoaded =
            true;

        return true;

    }


    if (
        FuelGapAppState.gapsScriptLoading
    ) {

        return new Promise(
            resolve => {

                const checkInterval =
                    setInterval(
                        () => {

                            if (
                                typeof window.initializeGapsPage ===
                                "function"
                            ) {

                                clearInterval(
                                    checkInterval
                                );


                                FuelGapAppState.gapsScriptLoaded =
                                    true;


                                FuelGapAppState.gapsScriptLoading =
                                    false;


                                resolve(true);

                            }

                        },
                        50
                    );


                setTimeout(
                    () => {

                        clearInterval(
                            checkInterval
                        );


                        if (
                            typeof window.initializeGapsPage !==
                            "function"
                        ) {

                            FuelGapAppState.gapsScriptLoading =
                                false;


                            resolve(false);

                        }

                    },
                    10000
                );

            }
        );

    }


    FuelGapAppState.gapsScriptLoading =
        true;


    return new Promise(
        (resolve, reject) => {

            try {

                const jsBasePath =
                    getApplicationBasePath();


                const gapsScriptURL =
                    new URL(
                        "gaps.js",
                        jsBasePath
                    );


                gapsScriptURL.searchParams.set(
                    "v",
                    Date.now().toString()
                );


                const oldScript =
                    document.querySelector(
                        'script[data-fuelgap-gaps-script="true"]'
                    );


                if (oldScript) {

                    oldScript.remove();

                }


                const script =
                    document.createElement(
                        "script"
                    );


                script.src =
                    gapsScriptURL.href;


                script.async =
                    false;


                script.defer =
                    false;


                script.dataset.fuelgapGapsScript =
                    "true";


                script.onload =
                    () => {

                        setTimeout(
                            () => {

                                if (
                                    typeof window.initializeGapsPage ===
                                    "function"
                                ) {

                                    FuelGapAppState.gapsScriptLoaded =
                                        true;


                                    FuelGapAppState.gapsScriptLoading =
                                        false;


                                    resolve(true);

                                    return;

                                }


                                FuelGapAppState.gapsScriptLoaded =
                                    false;


                                FuelGapAppState.gapsScriptLoading =
                                    false;


                                reject(
                                    new Error(
                                        "gaps.js loaded but initializeGapsPage() is not available."
                                    )
                                );

                            },
                            50
                        );

                    };


                script.onerror =
                    () => {

                        FuelGapAppState.gapsScriptLoaded =
                            false;


                        FuelGapAppState.gapsScriptLoading =
                            false;


                        reject(
                            new Error(
                                "Could not load gaps.js. Check the file path."
                            )
                        );

                    };


                document.head.appendChild(
                    script
                );


            } catch (error) {

                FuelGapAppState.gapsScriptLoading =
                    false;

                reject(error);

            }

        }
    );

}


/* =========================================================
   OPEN GAPS PAGE
========================================================= */

async function openGapsPage() {

    try {

        if (
            FuelGapAppState.isNavigating
        ) {

            return;

        }


        FuelGapAppState.isNavigating =
            true;


        FuelGapAppState.currentPage =
            "gaps";


        const pageContent =
            document.getElementById(
                "pageContent"
            );


        if (!pageContent) {

            throw new Error(
                "#pageContent was not found."
            );

        }


        setActiveSidebarLink(
            "gaps"
        );


        pageContent.innerHTML = `

            <div class="page-loading">

                <div class="page-loading-spinner"></div>

                <p>
                    Loading Gaps & Variance...
                </p>

            </div>

        `;


        await loadGapsScript();


        if (
            typeof window.initializeGapsPage !==
            "function"
        ) {

            throw new Error(
                "initializeGapsPage() is not available."
            );

        }


        await window.initializeGapsPage();


    } catch (error) {

        console.error(
            "OPEN GAPS PAGE ERROR:",
            error
        );


        const pageContent =
            document.getElementById(
                "pageContent"
            );


        if (pageContent) {

            pageContent.innerHTML = `

                <section class="page-error">

                    <div class="page-error-icon">
                        ⚠
                    </div>

                    <h2>
                        Unable to load Gaps
                    </h2>

                    <p>
                        ${escapeHTML(
                            error.message ||
                            "An unexpected error occurred."
                        )}
                    </p>


                    <div
                        style="
                            margin-top:20px;
                            display:flex;
                            gap:10px;
                            justify-content:center;
                            flex-wrap:wrap;
                        "
                    >

                        <button
                            type="button"
                            class="btn btn-primary"
                            onclick="window.openGapsPage()"
                        >
                            Try Again
                        </button>


                        <button
                            type="button"
                            class="btn btn-outline"
                            onclick="window.location.reload()"
                        >
                            Reload Page
                        </button>

                    </div>

                </section>

            `;

        }

    } finally {

        FuelGapAppState.isNavigating =
            false;

    }

}


/* =========================================================
   ACTIVE SIDEBAR LINK
========================================================= */

function setActiveSidebarLink(
    pageName
) {

    const sidebar =
        document.getElementById(
            "sidebar"
        );


    if (!sidebar) {

        return;

    }


    const links =
        sidebar.querySelectorAll(
            ".sidebar-link"
        );


    links.forEach(
        link => {

            link.classList.toggle(
                "active",
                link.dataset.page ===
                pageName
            );

        }
    );

}


/* =========================================================
   DETECT CURRENT PAGE
========================================================= */

function getCurrentPageName() {

    const path =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    if (
        path === "dashboard.html" ||
        path === ""
    ) {

        return "dashboard";

    }


    if (
        path.includes("platform-organization") ||
        path.includes("organization")
    ) {

        return "organizations";

    }


    if (
        path.includes("platform-activity") ||
        path.includes("activity")
    ) {

        return "activity";

    }


    if (
        path.includes("platform-user") ||
        path.includes("user")
    ) {

        return "users";

    }


    if (
        path.includes("platform-alert") ||
        path.includes("alert")
    ) {

        return "alerts";

    }


    if (
        path.includes("platform-report") ||
        path.includes("report")
    ) {

        return "reports";

    }


    if (
        path.includes("station")
    ) {

        return "stations";

    }


    if (
        path.includes("pump")
    ) {

        return "pumps";

    }


    if (
        path.includes("reading")
    ) {

        return "readings";

    }


    if (
        path.includes("shift")
    ) {

        return "shifts";

    }


    if (
        path.includes("sales")
    ) {

        return "sales";

    }


    if (
        path.includes("payment")
    ) {

        return "payments";

    }


    if (
        path.includes("gap")
    ) {

        return "gaps";

    }


    if (
        path.includes("staff")
    ) {

        return "staff";

    }


    if (
        path.includes("audit")
    ) {

        return "audit";

    }


    return "dashboard";

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHTML(value) {

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
   GLOBAL EXPORTS
========================================================= */

window.FuelGapAppState =
    FuelGapAppState;


window.openGapsPage =
    openGapsPage;


window.loadGapsScript =
    loadGapsScript;


window.setActiveSidebarLink =
    setActiveSidebarLink;


window.getCurrentPageName =
    getCurrentPageName;


window.escapeHTML =
    escapeHTML;


window.isSuperAdmin =
    isSuperAdmin;


window.getUserRole =
    getUserRole;


console.log(
    "FuelGap app.js loaded successfully."
);