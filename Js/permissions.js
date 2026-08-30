/* ==========================================
   FUELGAP ROLE PERMISSIONS
========================================== */

const ROLE_PERMISSIONS = {

    /* ======================================
       FUELGAP SUPER ADMIN
    ====================================== */

    admin: [

        "dashboard",
        "organizations",
        "stations",
        "pumps",
        "readings",
        "shifts",
        "sales",
        "payments",
        "gaps",
        "alerts",
        "reports",
        "staff",
        "audit"

    ],


    /* ======================================
       COMPANY / ORGANIZATION OWNER
    ====================================== */

    owner: [

        "dashboard",
        "stations",
        "pumps",
        "readings",
        "shifts",
        "sales",
        "payments",
        "gaps",
        "alerts",
        "reports",
        "staff"

    ],


    /* ======================================
       STATION MANAGER
    ====================================== */

    manager: [

        "dashboard",
        "stations",
        "pumps",
        "readings",
        "shifts",
        "sales",
        "payments",
        "gaps",
        "alerts",
        "reports"

    ],


    /* ======================================
       FUEL ATTENDANT
    ====================================== */

    attendant: [

        "dashboard",
        "readings",
        "payments",
        // "shifts",
        "sales"

    ]

};


/* ==========================================
   CHECK PERMISSION
========================================== */

function hasPermission(role, permission) {

    /* Normalize role */

    if (!role) {

        return false;

    }


    const normalizedRole =
        role
            .toLowerCase()
            .trim();


    /* Check role exists */

    if (!ROLE_PERMISSIONS[normalizedRole]) {

        console.warn(
            `Unknown role: ${role}`
        );

        return false;

    }


    /* Check permission */

    return ROLE_PERMISSIONS[
        normalizedRole
    ].includes(
        permission
    );

}