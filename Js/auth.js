document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    if (loginForm) {
        setupLogin(loginForm);
    }

    if (registerForm) {
        setupRegister(registerForm);
    }

});


/* ==========================================
   LOGIN
========================================== */

function setupLogin(form) {

    const message =
        document.getElementById("loginMessage");

    const button =
        form.querySelector("button[type='submit']");


    form.addEventListener("submit", (event) => {

        event.preventDefault();

        const email =
            form.email.value.trim().toLowerCase();

        const password =
            form.password.value;


        if (!email || !password) {

            showMessage(
                message,
                "Please enter your email and password.",
                "error"
            );

            return;

        }


        try {

            setButtonLoading(
                button,
                true,
                "Login"
            );


            const result =
                mockLogin(email, password);


            FuelGapUtils.saveSession(
                result.user,
                result.token,
                result.refreshToken
            );


            window.location.href =
                "./app/dashboard.html";


        } catch (error) {

            showMessage(
                message,
                error.message || "Login failed.",
                "error"
            );


            setButtonLoading(
                button,
                false,
                "Login"
            );

        }

    });

}


/* ==========================================
   REGISTER
========================================== */

function setupRegister(form) {

    const message =
        document.getElementById(
            "registerMessage"
        );


    const button =
        form.querySelector(
            "button[type='submit']"
        );


    form.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();

            console.log(
                "REGISTER FORM SUBMITTED"
            );


            // Get values using input names

            const fullName =
                form.fullName.value.trim();

            const companyName =
                form.companyName.value.trim();

            const email =
                form.email.value
                    .trim()
                    .toLowerCase();

            const password =
                form.password.value;

            const confirmPassword =
                form.confirmPassword.value;


            /* =========================
               VALIDATION
            ========================= */

            if (
                !fullName ||
                !companyName ||
                !email ||
                !password ||
                !confirmPassword
            ) {

                showMessage(
                    message,
                    "Please complete all fields.",
                    "error"
                );

                return;

            }


            if (password.length < 8) {

                showMessage(
                    message,
                    "Password must contain at least 8 characters.",
                    "error"
                );

                return;

            }


            if (
                password !==
                confirmPassword
            ) {

                showMessage(
                    message,
                    "Passwords do not match.",
                    "error"
                );

                return;

            }


            try {

                setButtonLoading(
                    button,
                    true,
                    "Create Account"
                );


                const result =
                    mockRegister({

                        fullName,

                        companyName,

                        email,

                        password

                    });


                console.log(
                    "Registration successful:",
                    result
                );


                /* =========================
                   SAVE SESSION
                ========================= */

                FuelGapUtils.saveSession(

                    result.user,

                    result.token,

                    result.refreshToken

                );


                showMessage(
                    message,
                    "Account created successfully! Redirecting...",
                    "success"
                );


                /* =========================
                   REDIRECT
                ========================= */

                setTimeout(() => {

                    window.location.href =
                        "./app/dashboard.html";

                }, 800);


            } catch (error) {

                console.error(
                    "Registration Error:",
                    error
                );


                showMessage(
                    message,
                    error.message ||
                    "Registration failed.",
                    "error"
                );


                setButtonLoading(
                    button,
                    false,
                    "Create Account"
                );

            }

        }
    );

}


/* ==========================================
   MOCK USERS
========================================== */

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


const MOCK_USERS_STORAGE_KEY =
    "fuelgap_mock_users";


function getMockUsers() {

    const savedUsers =
        localStorage.getItem(
            MOCK_USERS_STORAGE_KEY
        );


    if (savedUsers) {

        try {

            return JSON.parse(
                savedUsers
            );

        } catch (error) {

            console.error(
                "Unable to read users:",
                error
            );

        }

    }


    localStorage.setItem(

        MOCK_USERS_STORAGE_KEY,

        JSON.stringify(
            DEFAULT_MOCK_USERS
        )

    );


    return DEFAULT_MOCK_USERS;

}


function saveMockUsers(users) {

    localStorage.setItem(

        MOCK_USERS_STORAGE_KEY,

        JSON.stringify(users)

    );

}


/* ==========================================
   MOCK LOGIN
========================================== */

function mockLogin(email, password) {

    const users = getMockUsers();

    const normalizedEmail =
        email
            .trim()
            .toLowerCase();


    const user = users.find(

        user =>

            user.email &&
            user.email
                .toLowerCase() ===
            normalizedEmail

    );


    if (!user) {

        throw new Error(
            "No account was found with this email."
        );

    }


    if (
        user.password !== password
    ) {

        throw new Error(
            "Incorrect password."
        );

    }


    if (
        user.status === "inactive"
    ) {

        throw new Error(
            "This account has been deactivated."
        );

    }


    const safeUser = {

        id:
            user.id,

        fullName:
            user.fullName,

        email:
            user.email,

        role:
            user.role,

        organizationId:
            user.organizationId || null,

        stationId:
            user.stationId || null,

        companyName:
            user.companyName || null

    };


    return {

        user:
            safeUser,

        token:
            `mock-token-${user.id}`,

        refreshToken:
            `mock-refresh-token-${user.id}`

    };

}


/* ==========================================
   MOCK REGISTER
========================================== */

function mockRegister(data) {

    const users =
        getMockUsers();


    const existingUser =
        users.find(

            user =>

                user.email
                    .toLowerCase() ===

                data.email
                    .toLowerCase()

        );


    if (existingUser) {

        throw new Error(
            "An account with this email already exists."
        );

    }


    const timestamp =
        Date.now();


    const newUser = {

        id:
            `USR-${timestamp}`,

        fullName:
            data.fullName,

        companyName:
            data.companyName,

        email:
            data.email
                .toLowerCase(),

        password:
            data.password,

        role:
            "owner",

        organizationId:
            `ORG-${timestamp}`,

        stationId:
            null

    };


    users.push(
        newUser
    );


    saveMockUsers(
        users
    );


    const safeUser = {

        id:
            newUser.id,

        fullName:
            newUser.fullName,

        companyName:
            newUser.companyName,

        email:
            newUser.email,

        role:
            newUser.role,

        organizationId:
            newUser.organizationId,

        stationId:
            null

    };


    return {

        user:
            safeUser,

        token:
            `mock-token-${newUser.id}`,

        refreshToken:
            `mock-refresh-${newUser.id}`

    };

}


/* ==========================================
   MESSAGE
========================================== */

function showMessage(
    element,
    message,
    type = "error"
) {

    if (!element) {

        alert(message);

        return;

    }


    element.textContent =
        message;


    element.className =
        `form-message ${type}`;


    element.classList.remove(
        "hidden"
    );

}


/* ==========================================
   BUTTON LOADING
========================================== */

function setButtonLoading(
    button,
    loading,
    normalText
) {

    if (!button) return;


    button.disabled =
        loading;


    button.textContent =
        loading

            ? "Please wait..."

            : normalText;

}