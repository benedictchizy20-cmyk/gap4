/* =========================================================
   FUELGAP - API CLIENT
========================================================= */

const FuelGapAPI = {

    /* =====================================================
       GENERIC REQUEST
    ===================================================== */

    async request(endpoint, options = {}) {

        const token = localStorage.getItem(
            FUELGAP_CONFIG.storageKeys.token
        );

        const headers = {
            "Content-Type": "application/json",
            ...(options.headers || {})
        };

        /* Attach Supabase access token */
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        let response;

        try {

            response = await fetch(
                `${FUELGAP_CONFIG.API_BASE_URL}${endpoint}`,
                {
                    ...options,
                    headers
                }
            );

        } catch (error) {

            console.error("FuelGap API connection error:", error);

            throw new Error(
                "Unable to connect to FuelGap server. Make sure the backend is running."
            );
        }

        /* =================================================
           AUTHENTICATION ERROR
        ================================================= */

        if (response.status === 401) {

            console.warn("FuelGap session expired.");

            if (
                typeof FuelGapUtils !== "undefined" &&
                typeof FuelGapUtils.logout === "function"
            ) {
                FuelGapUtils.logout();
            }

            throw new Error(
                "Your session has expired. Please login again."
            );
        }

        /* =================================================
           READ RESPONSE
        ================================================= */

        let data;

        try {

            data = await response.json();

        } catch (error) {

            throw new Error(
                "The server returned an invalid response."
            );
        }

        /* =================================================
           API ERROR
        ================================================= */

        if (!response.ok) {

            throw new Error(
                data.message ||
                "Request failed."
            );
        }

        return data;
    },


    /* =====================================================
       AUTH
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

        const response = await this.request(
            "/auth/login",
            {
                method: "POST",
                body: JSON.stringify(credentials)
            }
        );

        /*
         * Save Supabase access token
         */

        if (
            response &&
            response.data &&
            response.data.session &&
            response.data.session.access_token
        ) {

            localStorage.setItem(
                FUELGAP_CONFIG.storageKeys.token,
                response.data.session.access_token
            );
        }

        /*
         * Save user profile
         */

        if (
            response &&
            response.data &&
            response.data.user
        ) {

            localStorage.setItem(
                FUELGAP_CONFIG.storageKeys.user,
                JSON.stringify(
                    response.data.user
                )
            );
        }

        return response;
    },


    async getCurrentUser() {

        return this.request(
            "/auth/me"
        );
    },


    async logout() {

        try {

            const response =
                await this.request(
                    "/auth/logout",
                    {
                        method: "POST"
                    }
                );

            return response;

        } finally {

            localStorage.removeItem(
                FUELGAP_CONFIG.storageKeys.token
            );

            localStorage.removeItem(
                FUELGAP_CONFIG.storageKeys.user
            );
        }
    },


    /* =====================================================
       DASHBOARD
    ===================================================== */

    async getDashboard() {

        return this.request(
            "/dashboard"
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


    async updateStation(id, stationData) {

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

        const query = stationId
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


    async updatePump(id, pumpData) {

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

        const query = pumpId
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


    async updateNozzle(id, nozzleData) {

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


    async createStaffLogin(id, password) {

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


    async updateStaff(id, staffData) {

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

        const params = new URLSearchParams();

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
    }

};


/* =========================================================
   EXPORT
========================================================= */

window.FuelGapAPI = FuelGapAPI;