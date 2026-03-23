const navButton = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const dropdown = document.querySelector(".nav-dropdown");
const dropdownToggle = document.querySelector(".nav-dropdown-toggle");

if (navButton && siteNav) {
    navButton.addEventListener("click", () => {
        const isOpen = siteNav.classList.toggle("is-open");
        navButton.setAttribute("aria-expanded", String(isOpen));
    });
}

if (dropdown && dropdownToggle) {
    dropdownToggle.addEventListener("click", () => {
        const isOpen = dropdown.classList.toggle("is-open");
        dropdownToggle.setAttribute("aria-expanded", String(isOpen));
    });

    dropdown.addEventListener("mouseenter", () => {
        if (window.innerWidth > 900) {
            dropdown.classList.add("is-open");
            dropdownToggle.setAttribute("aria-expanded", "true");
        }
    });

    dropdown.addEventListener("mouseleave", () => {
        if (window.innerWidth > 900) {
            dropdown.classList.remove("is-open");
            dropdownToggle.setAttribute("aria-expanded", "false");
        }
    });

    document.addEventListener("click", (event) => {
        if (!dropdown.contains(event.target)) {
            dropdown.classList.remove("is-open");
            dropdownToggle.setAttribute("aria-expanded", "false");
        }
    });
}

const currentPage = document.body.dataset.page;
const navLinks = document.querySelectorAll(".site-nav a");

navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (
        (currentPage === "home" && (href === "index.html" || href === "../index.html")) ||
        (currentPage === "about" && (href === "About.html" || href === "../About.html")) ||
        (currentPage === "case-studies" && (href === "Case-Studies.html" || href === "../Case-Studies.html")) ||
        (currentPage === "blog" && (href === "blog/" || href === "../blog/" || href === "index.html"))
    ) {
        link.classList.add("is-active");
    }
});

if (
    dropdownToggle &&
    ["sem", "seo", "paid-social", "cro", "analytics"].includes(currentPage)
) {
    dropdownToggle.classList.add("is-active");
}

const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);
            }
        });
    },
    {
        threshold: 0.15,
    }
);

document.querySelectorAll(".reveal").forEach((element) => {
    observer.observe(element);
});

const aboutContactStatus = document.querySelector("#about-contact-status");

if (
    aboutContactStatus &&
    window.location.pathname.toLowerCase().includes("about.html") &&
    new URLSearchParams(window.location.search).get("submitted") === "1"
) {
    aboutContactStatus.textContent =
        "Message sent. We will get back to you soon.";
}
