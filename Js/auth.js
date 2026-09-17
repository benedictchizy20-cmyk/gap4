/* =========================================================
   FUELGAP - AUTHENTICATION
   REAL BACKEND AUTHENTICATION
   HTTPONLY COOKIE SESSION
   NO LOCALSTORAGE
========================================================= */

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


/* =========================================================
   LOGIN
========================================================= */

function setupLogin(form) {

    const message =
        document.getElementById("loginMessage");

    const button =
        form.querySelector("button[type='submit']");


    form.addEventListener("submit", async (event) => {

        event.preventDefault();


        const email =
            form.email.value.trim().toLowerCase();

        const password =
            form.password.value;


        /* =====================================================
           VALIDATION
        ===================================================== */

        if (!email || !password) {

            FuelGapUtils.showMessage(
                message,
                "Please enter your email and password.",
                "error"
            );

            return;
        }


        try {

            FuelGapUtils.setLoading(
                button,
                true,
                "Login"
            );


            /* =================================================
               LOGIN THROUGH BACKEND
            ================================================= */

            const result =
                await FuelGapAPI.login({
                    email,
                    password
                });


            console.log(
                "FUELGAP LOGIN RESPONSE:",
                result
            );


            /* =================================================
               CHECK LOGIN RESPONSE
            ================================================= */

            if (
                !result ||
                result.success !== true
            ) {

                throw new Error(
                    result?.message ||
                    "Login failed."
                );
            }


            /* =================================================
               IMPORTANT
               GIVE THE BROWSER A MOMENT TO STORE COOKIE
            ================================================= */

            await new Promise(resolve => {
                setTimeout(resolve, 300);
            });


            /* =================================================
               VERIFY SESSION
            ================================================= */

            let currentUser;

            try {

                currentUser =
                    await FuelGapAPI.getCurrentUser();

            } catch (sessionError) {

                console.error(
                    "SESSION VERIFICATION ERROR:",
                    sessionError
                );

                throw new Error(
                    "Login was successful, but your session could not be verified. Please try again."
                );
            }


            console.log(
                "FUELGAP CURRENT USER:",
                currentUser
            );


            /* =================================================
               VERIFY USER EXISTS
            ================================================= */

            if (
                !currentUser ||
                currentUser.success !== true
            ) {

                throw new Error(
                    "Login succeeded, but the user session is not available."
                );
            }


            /* =================================================
               LOGIN SUCCESS
            ================================================= */

            FuelGapUtils.showMessage(
                message,
                "Login successful. Opening dashboard...",
                "success"
            );


            /* =================================================
               GO TO DASHBOARD
            ================================================= */

            setTimeout(() => {

                window.location.href =
                    "./app/dashboard.html";

            }, 500);


        } catch (error) {

            console.error(
                "FUELGAP LOGIN ERROR:",
                error
            );


            FuelGapUtils.showMessage(
                message,
                error.message ||
                "Login failed. Please check your email and password.",
                "error"
            );


            FuelGapUtils.setLoading(
                button,
                false,
                "Login"
            );

        }

    });

}


/* =========================================================
   REGISTER
========================================================= */

function setupRegister(form) {

    const message =
        document.getElementById("registerMessage");

    const button =
        form.querySelector(
            "button[type='submit']"
        );


    form.addEventListener("submit", async (event) => {

        event.preventDefault();


        /* =====================================================
           FORM VALUES
        ===================================================== */

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


        /* =====================================================
           VALIDATION
        ===================================================== */

        if (
            !fullName ||
            !companyName ||
            !email ||
            !password ||
            !confirmPassword
        ) {

            FuelGapUtils.showMessage(
                message,
                "Please complete all fields.",
                "error"
            );

            return;
        }


        if (password.length < 8) {

            FuelGapUtils.showMessage(
                message,
                "Password must contain at least 8 characters.",
                "error"
            );

            return;
        }


        if (password !== confirmPassword) {

            FuelGapUtils.showMessage(
                message,
                "Passwords do not match.",
                "error"
            );

            return;
        }


        try {

            FuelGapUtils.setLoading(
                button,
                true,
                "Create Account"
            );


            /* =================================================
               BACKEND REGISTRATION
            ================================================= */

           const result =
         await FuelGapAPI.register({

            organization_name:
              companyName,

            full_name:
            fullName,

            email,

           password,

           confirm_password:
              confirmPassword

    });
             


            console.log(
                "FUELGAP REGISTRATION RESPONSE:",
                result
            );


            /* =================================================
               CHECK REGISTRATION
            ================================================= */

            if (
                !result ||
                result.success !== true
            ) {

                throw new Error(
                    result?.message ||
                    "Registration failed."
                );
            }


            /* =================================================
               SUCCESS
            ================================================= */

            FuelGapUtils.showMessage(
                message,
                "Account created successfully! Please login.",
                "success"
            );


            setTimeout(() => {

                window.location.href =
                    "./login.html";

            }, 1200);


        } catch (error) {

            console.error(
                "FUELGAP REGISTRATION ERROR:",
                error
            );


            FuelGapUtils.showMessage(
                message,
                error.message ||
                "Registration failed.",
                "error"
            );


            FuelGapUtils.setLoading(
                button,
                false,
                "Create Account"
            );

        }

    });

}