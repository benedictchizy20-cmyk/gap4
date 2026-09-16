/* =========================================================
   FUELGAP - UTILITIES
   COOKIE BASED AUTHENTICATION
   NO LOCALSTORAGE
========================================================= */

const FuelGapUtils = {

    /* =====================================================
       CURRENT USER
    ===================================================== */

    async getCurrentUser() {

        try {

            const response =
                await FuelGapAPI.getCurrentUser();

            if (
                response &&
                response.success &&
                response.data &&
                response.data.user
            ) {

                return response.data.user;

            }

            return null;

        } catch (error) {

            console.error(
                "Unable to get current user:",
                error
            );

            return null;

        }

    },


    /* =====================================================
       LOGOUT
    ===================================================== */

    async logout() {

        try {

            await FuelGapAPI.logout();

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

        } finally {

            /*
             * There is NOTHING to remove from
             * LocalStorage because we no longer
             * store authentication there.
             */

            window.location.href =
                "../login.html";

        }

    },


    /* =====================================================
       ROLE REDIRECTION
    ===================================================== */

    redirectByRole(role) {

        const allowedRoles = [

            "admin",

            "owner",

            "manager",

            "attendant"

        ];


        if (
            !allowedRoles.includes(role)
        ) {

            console.error(
                "Unknown user role:",
                role
            );

            alert(
                "Your account has an invalid role."
            );

            return;

        }


        window.location.href =
            "./dashboard.html";

    },


    /* =====================================================
       SHOW MESSAGE
    ===================================================== */

    showMessage(
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

    },


    /* =====================================================
       HIDE MESSAGE
    ===================================================== */

    hideMessage(element) {

        if (!element) return;


        element.classList.add(
            "hidden"
        );

    },


    /* =====================================================
       BUTTON LOADING
    ===================================================== */

    setLoading(
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

};


/* =========================================================
   GLOBAL EXPORT
========================================================= */

window.FuelGapUtils =
    FuelGapUtils;