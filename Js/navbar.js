document.addEventListener("DOMContentLoaded", () => {

    const menuButton = document.querySelector(".mobile-menu-btn");
    const mobileMenu = document.querySelector(".mobile-menu");

    if (!menuButton || !mobileMenu) return;

    menuButton.addEventListener("click", () => {
        mobileMenu.classList.toggle("active");

        const isOpen = mobileMenu.classList.contains("active");

        menuButton.setAttribute(
            "aria-expanded",
            isOpen.toString()
        );
    });

});