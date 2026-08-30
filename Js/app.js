document.addEventListener("DOMContentLoaded", () => {

    const user = FuelGapUtils.getCurrentUser();

    if (!user) {
        window.location.href = "../login.html";
        return;
    }

    renderApplication(user);

});


function renderApplication(user) {

    const app = document.getElementById("app");

    if (!app) return;

    app.innerHTML = `

        <header class="app-navbar">

            <div class="app-navbar-left">

                <button
                    class="app-menu-button"
                    id="menuButton"
                >
                    ☰
                </button>

                <a
                    href="./dashboard.html"
                    class="logo"
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

                <span>
                    ${user.fullName}
                </span>

                <button
                    class="btn btn-outline"
                    id="logoutButton"
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


    setupAppEvents();

}


function renderSidebar(user) {

    const navigation = [

        {
            id: "dashboard",
            label: "Overview",
            icon: "▣",
            url: "./dashboard.html"
        },

        {
            id: "organizations",
            label: "Organizations",
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


    const visibleItems = navigation.filter(
        item => hasPermission(user.role, item.id)
    );


    let html = `
        <div class="sidebar-section-title">
            Main Menu
        </div>
    `;


    visibleItems.forEach(item => {

        html += `

            <a
                href="${item.url}"
                class="sidebar-link"
                data-page="${item.id}"
            >

                <span>
                    ${item.icon}
                </span>

                <span>
                    ${item.label}
                </span>

            </a>

        `;

    });


    return html;
}


function setupAppEvents() {

    const menuButton =
        document.getElementById("menuButton");

    const sidebar =
        document.getElementById("sidebar");

    const logoutButton =
        document.getElementById("logoutButton");


    if (menuButton) {

        menuButton.addEventListener(
            "click",
            () => {

                sidebar.classList.toggle("open");

            }
        );

    }


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            () => {

                FuelGapUtils.logout();

            }
        );

    }

}