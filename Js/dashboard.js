document.addEventListener("DOMContentLoaded", () => {

    const user = FuelGapUtils.getCurrentUser();

    if (!user) return;

    renderDashboard(user);

});


function renderDashboard(user) {

    const content =
        document.getElementById("pageContent");

    if (!content) return;


    const dashboardData =
        getDashboardData(user);


    content.innerHTML = `

        <div class="page-header">

            <div>

                <h1 class="page-title">
                    ${getGreeting()}, ${user.fullName}
                </h1>

                <p class="page-subtitle">
                    Here's what's happening across
                    your FuelGap operations.
                </p>

            </div>

        </div>


        <section class="stats-grid">

            ${renderStatCard(
                "Today's Sales",
                formatNaira(dashboardData.todaySales),
                "↗ " + dashboardData.salesChange + "% today",
                "positive",
                "₦"
            )}

            ${renderStatCard(
                "Active Stations",
                dashboardData.activeStations,
                dashboardData.totalStations +
                " total stations",
                "positive",
                "⌂"
            )}

            ${renderStatCard(
                "Today's Volume",
                dashboardData.volume + " L",
                "Fuel dispensed today",
                "positive",
                "◉"
            )}

            ${renderStatCard(
                "Open Gaps",
                dashboardData.openGaps,
                dashboardData.criticalGaps +
                " require attention",
                dashboardData.criticalGaps > 0
                    ? "negative"
                    : "positive",
                "△"
            )}

        </section>


        <section class="dashboard-grid">


            <div class="dashboard-card">

                <div class="card-header">

                    <div class="card-title">
                        Station Activity
                    </div>

                    <a
                        href="./stations.html"
                        class="card-link"
                    >
                        View all
                    </a>

                </div>


                <div class="station-list">

                    ${dashboardData.stations
                        .map(renderStation)
                        .join("")}

                </div>

            </div>


            <div class="dashboard-card">

                <div class="card-header">

                    <div class="card-title">
                        Recent Alerts
                    </div>

                    <a
                        href="./alerts.html"
                        class="card-link"
                    >
                        View all
                    </a>

                </div>


                ${dashboardData.alerts
                    .map(renderAlert)
                    .join("")}

            </div>


        </section>

    `;
}


function renderStatCard(
    label,
    value,
    change,
    changeClass,
    icon
) {

    return `

        <article class="stat-card">

            <div class="stat-top">

                <span class="stat-label">
                    ${label}
                </span>

                <span class="stat-icon">
                    ${icon}
                </span>

            </div>

            <div class="stat-value">
                ${value}
            </div>

            <div class="stat-change ${changeClass}">
                ${change}
            </div>

        </article>

    `;
}


function renderStation(station) {

    return `

        <div class="station-row">

            <div class="station-info">

                <div class="station-icon">
                    ⛽
                </div>

                <div>

                    <div class="station-name">
                        ${station.name}
                    </div>

                    <div class="station-location">
                        ${station.location}
                    </div>

                </div>

            </div>


            <span
                class="status-badge ${
                    station.status === "online"
                        ? "status-online"
                        : "status-warning"
                }"
            >
                ${
                    station.status === "online"
                        ? "Online"
                        : "Attention"
                }
            </span>

        </div>

    `;
}


function renderAlert(alert) {

    return `

        <div class="station-row">

            <div>

                <div class="station-name">
                    ${alert.title}
                </div>

                <div class="station-location">
                    ${alert.description}
                </div>

            </div>

            <span
                class="status-badge ${
                    alert.level === "critical"
                        ? "status-danger"
                        : "status-warning"
                }"
            >
                ${alert.level}
            </span>

        </div>

    `;
}


/*
    Temporary frontend data.

    Later this function will receive
    data from the Express API.
*/

function getDashboardData(user) {

    return {

        todaySales: 8450000,

        salesChange: 12.4,

        activeStations:
            user.role === "admin"
                ? 18
                : 3,

        totalStations:
            user.role === "admin"
                ? 21
                : 4,

        volume: 28450,

        openGaps:
            user.role === "attendant"
                ? 1
                : 7,

        criticalGaps:
            user.role === "attendant"
                ? 0
                : 2,

        stations: [

            {
                name: "FuelGap Central Station",
                location: "Port Harcourt",
                status: "online"
            },

            {
                name: "Airport Road Station",
                location: "Port Harcourt",
                status: "online"
            },

            {
                name: "Riverside Station",
                location: "Rivers State",
                status: "warning"
            }

        ],

        alerts: [

            {
                title: "Meter variance detected",
                description:
                    "Station reading requires review",
                level: "critical"
            },

            {
                title: "Closing reading pending",
                description:
                    "Station has not submitted closing reading",
                level: "warning"
            }

        ]

    };

}


function getGreeting() {

    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";

    if (hour < 18) return "Good afternoon";

    return "Good evening";
}


function formatNaira(value) {

    return new Intl.NumberFormat(
        "en-NG",
        {
            style: "currency",
            currency: "NGN",
            maximumFractionDigits: 0
        }
    ).format(value);

}