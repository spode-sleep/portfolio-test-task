(function () {
  "use strict";

  // ──────────────────────────────────────────────
  // Form validation
  // ──────────────────────────────────────────────
  const validators = {
    name: (v) => {
      if (!v.trim()) return "Please enter your name";
      if (v.trim().length < 2) return "Name is too short";
      return "";
    },
    phone: (v) => {
      if (!v.trim()) return "Please provide a phone number";
      const clean = v.replace(/[\s\-\(\)]/g, "");
      if (!/^\+?[\d]{7,15}$/.test(clean)) return "Invalid phone number";
      return "";
    },
    email: (v) => {
      if (!v.trim()) return "Please enter an email address";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Invalid email";
      return "";
    },
    comment: (v) => {
      if (!v.trim()) return "Please write a message";
      if (v.trim().length < 10) return "Message is too short";
      return "";
    },
  };

  function validateField(name, value) {
    const fn = validators[name];
    return fn ? fn(value) : "";
  }

  function showFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorEl = document.getElementById(fieldId + "Error");
    if (!input || !errorEl) return;
    errorEl.textContent = message;
    if (message) {
      input.classList.add("has-error");
    } else {
      input.classList.remove("has-error");
    }
  }

  // ──────────────────────────────────────────────
  // Form submission
  // ──────────────────────────────────────────────
  const form = document.getElementById("contactForm");
  const submitBtn = document.getElementById("submitBtn");
  const btnText = submitBtn ? submitBtn.querySelector(".btn-text") : null;
  const btnLoading = submitBtn ? submitBtn.querySelector(".btn-loading") : null;
  const formSuccess = document.getElementById("formSuccess");
  const successIcon = document.getElementById("successIcon");
  const successMessage = document.getElementById("successMessage");
  const formError = document.getElementById("formError");

  function setLoading(loading) {
    if (!submitBtn || !btnText || !btnLoading) return;
    submitBtn.disabled = loading;
    btnText.hidden = loading;
    btnLoading.hidden = !loading;
  }

  function showPending() {
    if (formSuccess) formSuccess.hidden = false;
    if (successIcon) successIcon.hidden = true;
    if (successMessage) successMessage.textContent = "waiting for response...";
    if (formError) formError.hidden = true;
  }

  function showSuccess(message) {
    if (successIcon) successIcon.hidden = false;
    if (successMessage) successMessage.textContent = message;
  }

  function showGlobalError(message) {
    if (formSuccess) formSuccess.hidden = true;
    if (formError) {
      formError.hidden = false;
      formError.textContent = message;
    }
  }

  function clearGlobalError() {
    if (formError) formError.hidden = true;
  }

  if (form) {
    // Inline validation on blur
    ["name", "phone", "email", "comment"].forEach((fieldId) => {
      const input = document.getElementById(fieldId);
      if (!input) return;

      input.addEventListener("blur", () => {
        const error = validateField(fieldId, input.value);
        showFieldError(fieldId, error);
      });

      input.addEventListener("input", () => {
        if (input.classList.contains("has-error")) {
          const error = validateField(fieldId, input.value);
          showFieldError(fieldId, error);
        }
      });
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearGlobalError();

      const fields = ["name", "phone", "email", "comment"];
      let hasErrors = false;

      const data = {};
      fields.forEach((fieldId) => {
        const input = document.getElementById(fieldId);
        if (!input) return;
        const value = input.value;
        data[fieldId] = value;
        const error = validateField(fieldId, value);
        showFieldError(fieldId, error);
        if (error) hasErrors = true;
      });

      if (hasErrors) return;

      setLoading(true);
      showPending();

      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "An error occurred during submission");
        }

        showSuccess(result.message || "Message sent successfully.");
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Failed to send message. Please try again or contact us directly via email.";
        showGlobalError(msg);
      } finally {
        setLoading(false);
      }
    });
  }

  // ──────────────────────────────────────────────
  // Active nav link on scroll
  // ──────────────────────────────────────────────
  const sections = document.querySelectorAll("[id]");
  const navLinks = document.querySelectorAll(".nav__links a");

  function updateNav() {
    let current = "";
    sections.forEach((sec) => {
      const rect = sec.getBoundingClientRect();
      if (rect.top <= 100) current = sec.id;
    });
    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      link.style.color =
        href === "#" + current ? "var(--accent)" : "";
    });
  }

  window.addEventListener("scroll", updateNav, { passive: true });
  updateNav();
})();
