/* =========================================================
   FUELGAP - API CLIENT
   COOKIE BASED AUTHENTICATION
   NO LOCALSTORAGE AUTHENTICATION
   LOCALHOST BACKEND
   PLATFORM + ORGANIZATION API
========================================================= */

const FuelGapAPI = {

    /* =====================================================
       GENERIC REQUEST
    ===================================================== */

    async request(endpoint, options = {}) {

        const headers = {
            "Content-Type": "application/json",
            ...(options.headers || {})
        };

        let response;

        try {

            response = await fetch(
                `${FUELGAP_CONFIG.API_BASE_URL}${endpoint}`,
                {
                    ...options,
                    headers,
                    credentials: "include"
                }
            );

        } catch (error) {

            console.error(
                "FuelGap API connection error:",
                error
            );

            throw new Error(
                "Unable to connect to FuelGap server. Make sure the backend is running."
            );
        }


        /* =================================================
           READ RESPONSE
        ================================================= */

        let data = null;

        try {

            const contentType =
                response.headers.get("content-type");

            if (
                contentType &&
                contentType.includes("application/json")
            ) {

                data = await response.json();

            } else {

                const text =
                    await response.text();

                if (text) {

                    data = {
                        message: text
                    };

                }

            }

        } catch (error) {

            console.error(
                "Response parsing error:",
                error
            );

            throw new Error(
                "The server returned an invalid response."
            );
        }


        /* =================================================
           401 AUTHENTICATION ERROR
        ================================================= */

        if (response.status === 401) {

            console.warn(
                "FuelGap API returned 401:",
                endpoint,
                data
            );

            /*
             * Only redirect when the actual authentication
             * session is invalid.
             */

            if (
                endpoint === "/auth/me" ||
                endpoint === "/auth/login"
            ) {

                const currentPath =
                    window.location.pathname;

                if (
                    !currentPath.includes("login.html") &&
                    !currentPath.includes("register.html")
                ) {

                    window.location.href =
                        "/login.html";
                }

            }

            throw new Error(
                data?.message ||
                "Authentication required."
            );
        }


        /* =================================================
           403 PERMISSION ERROR
        ================================================= */

        if (response.status === 403) {

            console.warn(
                "FuelGap permission denied:",
                endpoint,
                data
            );

            throw new Error(
                data?.message ||
                "You do not have permission to perform this action."
            );
        }


        /* =================================================
           400 BAD REQUEST
        ================================================= */

        if (response.status === 400) {

            throw new Error(
                data?.message ||
                "The request contains invalid data."
            );
        }


        /* =================================================
           404 NOT FOUND
        ================================================= */

        if (response.status === 404) {

            throw new Error(
                data?.message ||
                "The requested resource was not found."
            );
        }


        /* =================================================
           409 CONFLICT
        ================================================= */

        if (response.status === 409) {

            throw new Error(
                data?.message ||
                "This operation conflicts with existing data."
            );
        }


        /* =================================================
           422 VALIDATION
        ================================================= */

        if (response.status === 422) {

            throw new Error(
                data?.message ||
                "The submitted data is invalid."
            );
        }


        /* =================================================
           500 SERVER ERROR
        ================================================= */

        if (response.status >= 500) {

            console.error(
                "FuelGap server error:",
                {
                    endpoint,
                    status: response.status,
                    data
                }
            );

            throw new Error(
                data?.message ||
                "FuelGap server error. Please check the backend console."
            );
        }


        /* =================================================
           OTHER ERROR
        ================================================= */

        if (!response.ok) {

            throw new Error(
                data?.message ||
                "Request failed."
            );
        }


        return data;
    },


    /* =====================================================
       AUTHENTICATION
    ===================================================== */

    async register(userData) {

        return this.request(
            "/auth/register",
            {
                method: "POST",
                body: JSON.stringify(userData)
            }
        );
    },


    async login(credentials) {

        return this.request(
            "/auth/login",
            {
                method: "POST",
                body: JSON.stringify(credentials)
            }
        );
    },


    async getCurrentUser() {

        return this.request(
            "/auth/me",
            {
                method: "GET"
            }
        );
    },


    async logout() {

        try {

            return await this.request(
                "/auth/logout",
                {
                    method: "POST"
                }
            );

        } catch (error) {

            console.warn(
                "Logout request:",
                error.message
            );

            return {
                success: false,
                message: error.message
            };
        }
    },


    /* =====================================================
       NORMAL DASHBOARD
    ===================================================== */

    async getDashboard() {

        return this.request(
            "/dashboard"
        );
    },


    /* =====================================================
       PLATFORM / SUPER ADMIN
    ===================================================== */

    async getPlatformOverview() {

        return this.request(
            "/platform/overview",
            {
                method: "GET"
            }
        );
    },


    async getPlatformOrganizations() {

        return this.request(
            "/platform/organizations",
            {
                method: "GET"
            }
        );
    },


    async getPlatformOrganization(id) {

        return this.request(
            `/platform/organizations/${encodeURIComponent(id)}`,
            {
                method: "GET"
            }
        );
    },


    /* =====================================================
       STATIONS
    ===================================================== */

    async getStations() {

        return this.request(
            "/stations"
        );
    },


    async getStation(id) {

        return this.request(
            `/stations/${id}`
        );
    },


    async createStation(stationData) {

        return this.request(
            "/stations",
            {
                method: "POST",
                body: JSON.stringify(stationData)
            }
        );
    },


    async updateStation(
        id,
        stationData
    ) {

        return this.request(
            `/stations/${id}`,
            {
                method: "PATCH",
                body: JSON.stringify(stationData)
            }
        );
    },


    async deleteStation(id) {

        return this.request(
            `/stations/${id}`,
            {
                method: "DELETE"
            }
        );
    },


    /* =====================================================
       PUMPS
    ===================================================== */

    async getPumps(stationId = "") {

        const query =
            stationId
                ? `?station_id=${encodeURIComponent(stationId)}`
                : "";

        return this.request(
            `/pumps${query}`
        );
    },


    async getPump(id) {

        return this.request(
            `/pumps/${id}`
        );
    },


    async createPump(pumpData) {

        return this.request(
            "/pumps",
            {
                method: "POST",
                body: JSON.stringify(pumpData)
            }
        );
    },


    async updatePump(
        id,
        pumpData
    ) {

        return this.request(
            `/pumps/${id}`,
            {
                method: "PATCH",
                body: JSON.stringify(pumpData)
            }
        );
    },


    async deletePump(id) {

        return this.request(
            `/pumps/${id}`,
            {
                method: "DELETE"
            }
        );
    },


    /* =====================================================
       NOZZLES
    ===================================================== */

    async getNozzles(pumpId = "") {

        const query =
            pumpId
                ? `?pump_id=${encodeURIComponent(pumpId)}`
                : "";

        return this.request(
            `/nozzles${query}`
        );
    },


    async getNozzle(id) {

        return this.request(
            `/nozzles/${id}`
        );
    },


    async createNozzle(nozzleData) {

        return this.request(
            "/nozzles",
            {
                method: "POST",
                body: JSON.stringify(nozzleData)
            }
        );
    },


    async updateNozzle(
        id,
        nozzleData
    ) {

        return this.request(
            `/nozzles/${id}`,
            {
                method: "PATCH",
                body: JSON.stringify(nozzleData)
            }
        );
    },


    async deleteNozzle(id) {

        return this.request(
            `/nozzles/${id}`,
            {
                method: "DELETE"
            }
        );
    },


    /* =====================================================
       STAFF
    ===================================================== */

    async getStaff() {

        return this.request(
            "/staff"
        );
    },


    async getStaffById(id) {

        return this.request(
            `/staff/${id}`
        );
    },


    async createStaff(staffData) {

        return this.request(
            "/staff",
            {
                method: "POST",
                body: JSON.stringify(staffData)
            }
        );
    },


    async createStaffLogin(
        id,
        password
    ) {

        return this.request(
            `/staff/${id}/create-login`,
            {
                method: "POST",
                body: JSON.stringify({
                    password
                })
            }
        );
    },


    async updateStaff(
        id,
        staffData
    ) {

        return this.request(
            `/staff/${id}`,
            {
                method: "PATCH",
                body: JSON.stringify(staffData)
            }
        );
    },


    async deleteStaff(id) {

        return this.request(
            `/staff/${id}`,
            {
                method: "DELETE"
            }
        );
    },


    /* =====================================================
       SHIFTS
    ===================================================== */

    async getShifts(filters = {}) {

        const params =
            new URLSearchParams();

        if (filters.station_id) {

            params.append(
                "station_id",
                filters.station_id
            );
        }

        if (filters.status) {

            params.append(
                "status",
                filters.status
            );
        }

        if (filters.shift_date) {

            params.append(
                "shift_date",
                filters.shift_date
            );
        }

        const query =
            params.toString()
                ? `?${params.toString()}`
                : "";

        return this.request(
            `/shifts${query}`
        );
    },


    async getShift(id) {

        return this.request(
            `/shifts/${id}`
        );
    },


    async createShift(shiftData) {

        return this.request(
            "/shifts",
            {
                method: "POST",
                body: JSON.stringify(shiftData)
            }
        );
    },


    async closeShift(id) {

        return this.request(
            `/shifts/${id}/close`,
            {
                method: "PATCH"
            }
        );
    },


    async cancelShift(id) {

        return this.request(
            `/shifts/${id}/cancel`,
            {
                method: "PATCH"
            }
        );
    },


    /* =====================================================
       SALES
    ===================================================== */

    async getSales(filters = {}) {

        const params =
            new URLSearchParams();

        if (filters.station_id) {

            params.append(
                "station_id",
                filters.station_id
            );
        }

        if (filters.shift_id) {

            params.append(
                "shift_id",
                filters.shift_id
            );
        }

        if (filters.payment_method) {

            params.append(
                "payment_method",
                filters.payment_method
            );
        }

        if (filters.date) {

            params.append(
                "date",
                filters.date
            );
        }

        const query =
            params.toString()
                ? `?${params.toString()}`
                : "";

        return this.request(
            `/sales${query}`,
            {
                method: "GET"
            }
        );
    },


    async getSale(id) {

        return this.request(
            `/sales/${id}`,
            {
                method: "GET"
            }
        );
    },


    async createSale(saleData) {

        return this.request(
            "/sales",
            {
                method: "POST",
                body: JSON.stringify(saleData)
            }
        );
    },


    async deleteSale(id) {

        return this.request(
            `/sales/${id}`,
            {
                method: "DELETE"
            }
        );
    },


    /* =====================================================
       PAYMENTS
    ===================================================== */

    async getPayments(filters = {}) {

        const params =
            new URLSearchParams();

        if (filters.station_id) {

            params.append(
                "station_id",
                filters.station_id
            );
        }

        if (filters.shift_id) {

            params.append(
                "shift_id",
                filters.shift_id
            );
        }

        if (filters.sale_id) {

            params.append(
                "sale_id",
                filters.sale_id
            );
        }

        if (filters.payment_method) {

            params.append(
                "payment_method",
                filters.payment_method
            );
        }

        if (filters.date) {

            params.append(
                "date",
                filters.date
            );
        }

        const query =
            params.toString()
                ? `?${params.toString()}`
                : "";

        return this.request(
            `/payments${query}`,
            {
                method: "GET"
            }
        );
    },


    async getPayment(id) {

        return this.request(
            `/payments/${id}`,
            {
                method: "GET"
            }
        );
    },


    async createPayment(paymentData) {

        return this.request(
            "/payments",
            {
                method: "POST",
                body: JSON.stringify(paymentData)
            }
        );
    },


    async deletePayment(id) {

        return this.request(
            `/payments/${id}`,
            {
                method: "DELETE"
            }
        );
    },


    /* =====================================================
       GAPS / RECONCILIATION
    ===================================================== */

    async getGaps(filters = {}) {

        const params =
            new URLSearchParams();

        if (filters.station_id) {

            params.append(
                "station_id",
                filters.station_id
            );
        }

        if (filters.pump_id) {

            params.append(
                "pump_id",
                filters.pump_id
            );
        }

        if (filters.nozzle_id) {

            params.append(
                "nozzle_id",
                filters.nozzle_id
            );
        }

        if (filters.shift_id) {

            params.append(
                "shift_id",
                filters.shift_id
            );
        }

        if (filters.status) {

            params.append(
                "status",
                filters.status
            );
        }

        if (filters.date) {

            params.append(
                "date",
                filters.date
            );
        }

        const query =
            params.toString()
                ? `?${params.toString()}`
                : "";

        return this.request(
            `/gaps${query}`,
            {
                method: "GET"
            }
        );
    },


    async getGap(id) {

        return this.request(
            `/gaps/${id}`,
            {
                method: "GET"
            }
        );
    },


    async createGap(gapData) {

        return this.request(
            "/gaps",
            {
                method: "POST",
                body: JSON.stringify(gapData)
            }
        );
    },


    async deleteGap(id) {

        return this.request(
            `/gaps/${id}`,
            {
                method: "DELETE"
            }
        );
    }

};


/* =========================================================
   GLOBAL EXPORT
========================================================= */

window.FuelGapAPI = FuelGapAPI;

console.log(
    "FuelGap api.js loaded successfully."
);