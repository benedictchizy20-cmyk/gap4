const FuelGapAPI = {

    async request(endpoint, options = {}) {

        const token =
            localStorage.getItem(
                FUELGAP_CONFIG.storageKeys.token
            );


        const headers = {

            "Content-Type":
                "application/json",

            ...(options.headers || {})

        };


        if (token) {

            headers.Authorization =
                `Bearer ${token}`;

        }


        const response =
            await fetch(
                `${FUELGAP_CONFIG.API_BASE_URL}${endpoint}`,
                {
                    ...options,
                    headers
                }
            );


        if (response.status === 401) {

            FuelGapUtils.logout();

            return;

        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Request failed."
            );

        }


        return data;
    },


    async getDashboard() {

        if (FUELGAP_CONFIG.USE_MOCK_AUTH) {

            return null;

        }

        return this.request(
            "/dashboard"
        );

    },


    async getStations() {

        if (FUELGAP_CONFIG.USE_MOCK_AUTH) {

            return [];

        }

        return this.request(
            "/stations"
        );

    }

};