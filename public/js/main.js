(function () {
  "use strict";

  // ──────────────────────────────────────────────
  // Page Loader
  // ──────────────────────────────────────────────
  (function initLoader() {
    const loader   = document.getElementById("page-loader");
    const bar      = document.getElementById("loaderBar");
    const status   = document.getElementById("loaderStatus");

    if (!loader) return;

    // Prevent scroll during load
    document.body.classList.add("loading");

    let progress = 0;

    function setProgress(p, label) {
      progress = Math.min(100, Math.max(progress, p));
      if (bar)    bar.style.width = progress + "%";
      if (status) status.textContent = label || "loading...";
    }

    function finish() {
      setProgress(100, "ready");
      setTimeout(function () {
        loader.classList.add("is-hidden");
        document.body.classList.remove("loading");
        // Remove from DOM after transition
        loader.addEventListener("transitionend", function () {
          loader.remove();
        }, { once: true });
      }, 200);
    }

    // ── Track font loading ──
    var fontReady = false;
    var imagesReady = false;

    function checkDone() {
      if (fontReady && imagesReady) finish();
    }

    // Fonts via document.fonts API
    if (document.fonts && document.fonts.ready) {
      setProgress(10, "loading fonts...");
      document.fonts.ready.then(function () {
        fontReady = true;
        setProgress(50, "fonts loaded");
        checkDone();
      });
    } else {
      // Fallback: assume fonts done quickly
      fontReady = true;
      setProgress(50, "fonts loaded");
    }

    // ── Track image loading ──
    var images = Array.from(document.images);

    if (images.length === 0) {
      imagesReady = true;
      setProgress(90, "images loaded");
      checkDone();
    } else {
      var loaded = 0;

      function onImageLoad() {
        loaded++;
        var imgProgress = 50 + Math.round((loaded / images.length) * 45);
        setProgress(imgProgress, "loading images (" + loaded + "/" + images.length + ")...");
        if (loaded >= images.length) {
          imagesReady = true;
          setProgress(95, "images loaded");
          checkDone();
        }
      }

      images.forEach(function (img) {
        if (img.complete && img.naturalWidth > 0) {
          onImageLoad();
        } else {
          img.addEventListener("load",  onImageLoad, { once: true });
          img.addEventListener("error", onImageLoad, { once: true }); // don't block on broken img
        }
      });
    }

    // ── Safety timeout — never block indefinitely ──
    setTimeout(function () {
      if (!loader.classList.contains("is-hidden")) {
        finish();
      }
    }, 5000);
  })();

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
