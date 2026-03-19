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
const aboutContactStatus = document.querySelector("#about-contact-status");

if (aboutContactForm) {
  aboutContactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!aboutContactForm.reportValidity()) {
      return;
    }

    const submitButton = aboutContactForm.querySelector('button[type="submit"]');
    const formData = new FormData(aboutContactForm);

    if (aboutContactStatus) {
      aboutContactStatus.textContent = "Sending...";
    }

    if (submitButton) {
      submitButton.disabled = true;
    }

    fetch(aboutContactForm.action, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Request failed");
        }
        return response.json();
      })
      .then(() => {
        aboutContactForm.reset();
        if (aboutContactStatus) {
          aboutContactStatus.textContent = "Message sent. We will get back to you soon.";
        }
      })
      .catch(() => {
        if (aboutContactStatus) {
          aboutContactStatus.textContent = "There was a problem sending your message. Please email 4785digital@gmail.com directly.";
        }
      })
      .finally(() => {
        if (submitButton) {
          submitButton.disabled = false;
        }
      });
  });
}
