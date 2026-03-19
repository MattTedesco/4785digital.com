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
    (currentPage === "home" && href === "home.html") ||
    (currentPage === "about" && href === "About.html")
  ) {
    link.classList.add("is-active");
  }
});

if (
  dropdownToggle &&
  ["sem", "seo", "paid-social", "cro"].includes(currentPage)
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

const aboutContactForm = document.querySelector("#about-contact-form");

if (aboutContactForm) {
  aboutContactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.querySelector("#about-name")?.value.trim() || "";
    const email = document.querySelector("#about-email")?.value.trim() || "";
    const message = document.querySelector("#about-message")?.value.trim() || "";

    if (!email || !message) {
      aboutContactForm.reportValidity();
      return;
    }

    const subject = encodeURIComponent(
      name ? `New website inquiry from ${name}` : "New website inquiry"
    );
    const body = encodeURIComponent(
      `Name: ${name || "Not provided"}\nEmail: ${email}\n\nMessage:\n${message}`
    );

    window.location.href = `mailto:4785digital@gmail.com?subject=${subject}&body=${body}`;
  });
}
