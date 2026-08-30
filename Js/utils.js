const FuelGapUtils = {

    saveSession(user, token = null, refreshToken = null) {

        localStorage.setItem(
            FUELGAP_CONFIG.storageKeys.user,
            JSON.stringify(user)
        );

        if (token) {

            localStorage.setItem(
                FUELGAP_CONFIG.storageKeys.token,
                token
            );

        }

        if (refreshToken) {

            localStorage.setItem(
                FUELGAP_CONFIG.storageKeys.refreshToken,
                refreshToken
            );

        }

    },


    getCurrentUser() {

        const user = localStorage.getItem(
            FUELGAP_CONFIG.storageKeys.user
        );

        if (!user) return null;

        try {

            return JSON.parse(user);

        } catch {

            return null;

        }

    },


    logout() {

        localStorage.removeItem(
            FUELGAP_CONFIG.storageKeys.user
        );

        localStorage.removeItem(
            FUELGAP_CONFIG.storageKeys.token
        );

        localStorage.removeItem(
            FUELGAP_CONFIG.storageKeys.refreshToken
        );

        window.location.href = "../login.html";

    },


    redirectByRole(role) {

        const allowedRoles = [
            "admin",
            "owner",
            "manager",
            "attendant"
        ];


        if (!allowedRoles.includes(role)) {

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
            "./app/dashboard.html";

    },


    showMessage(
        element,
        message,
        type = "error"
    ) {

        if (!element) return;

        element.textContent = message;

        element.className =
            `form-message ${type}`;

        element.classList.remove(
            "hidden"
        );

    },


    hideMessage(element) {

        if (!element) return;

        element.classList.add(
            "hidden"
        );

    },


    setLoading(
        button,
        loading,
        normalText
    ) {

        if (!button) return;

        button.disabled = loading;

        button.textContent = loading
            ? "Please wait..."
            : normalText;

    }

};