const FUELGAP_CONFIG = {
    appName: "FuelGap",

    // We will change this when the Express backend is connected.
    API_BASE_URL: "http://localhost:7000/api/v1",

    // Frontend development mode
    USE_MOCK_AUTH: true,

    storageKeys: {
        user: "fuelgap_user",
        token: "fuelgap_token",
        refreshToken: "fuelgap_refresh_token"
    }
};