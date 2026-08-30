const DEFAULT_MOCK_USERS = [
    {
        id: "USR-001",
        fullName: "FuelGap Administrator",
        email: "admin@fuelgap.test",
        password: "Admin123!",
        role: "admin",
        organizationId: null,
        stationId: null
    },

    {
        id: "USR-002",
        fullName: "Company Owner",
        email: "owner@fuelgap.test",
        password: "Owner123!",
        role: "owner",
        organizationId: "ORG-001",
        stationId: null
    },

    {
        id: "USR-003",
        fullName: "Station Manager",
        email: "manager@fuelgap.test",
        password: "Manager123!",
        role: "manager",
        organizationId: "ORG-001",
        stationId: "ST-001"
    },

    {
        id: "USR-004",
        fullName: "Fuel Attendant",
        email: "attendant@fuelgap.test",
        password: "Attendant123!",
        role: "attendant",
        organizationId: "ORG-001",
        stationId: "ST-001"
    }
];


const MOCK_USERS_STORAGE_KEY = "fuelgap_mock_users";


function getMockUsers() {

    const savedUsers = localStorage.getItem(
        MOCK_USERS_STORAGE_KEY
    );

    if (savedUsers) {

        try {

            return JSON.parse(savedUsers);

        } catch (error) {

            console.error(
                "Unable to read saved mock users",
                error
            );

        }

    }

    localStorage.setItem(
        MOCK_USERS_STORAGE_KEY,
        JSON.stringify(DEFAULT_MOCK_USERS)
    );

    return DEFAULT_MOCK_USERS;
}


function saveMockUsers(users) {

    localStorage.setItem(
        MOCK_USERS_STORAGE_KEY,
        JSON.stringify(users)
    );

}