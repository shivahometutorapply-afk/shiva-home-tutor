/* Shiva Home Tutor — shared site script
   Handles: mobile menu, enquiry form, tutor form, Google Sheet submission,
   stat-counter animation. Loaded on every page. */

// ⚠️ Your deployed Google Apps Script Web App URL (see google-sheet-setup-code.gs)
const SHEET_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxTSSd7MRnkqpbnH31WJJuBIxlFf-EqcJFOOfIq4zLHVynwDS7LStrDbj3wyCtWsZ9Hng/exec";

const WHATSAPP_NUMBER = "918766379988";
const CONTACT_EMAIL = "shivahometutor.apply@gmail.com";

function sendToSheet(payload) {
  if (!SHEET_SCRIPT_URL || SHEET_SCRIPT_URL.indexOf("PASTE_YOUR") === 0) {
    console.warn("Google Sheet URL not set yet — skipping sheet save.");
    return Promise.resolve();
  }
  return fetch(SHEET_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  }).catch(function (err) { console.error("Sheet save failed:", err); });
}

/* ---------- Mobile menu ---------- */
document.addEventListener("DOMContentLoaded", function () {
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".mobile-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      const isOpen = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Parent enquiry form ---------- */
  const enquiryForm = document.getElementById("enquiryForm");
  if (enquiryForm) {
    enquiryForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const name = document.getElementById("p-name").value;
      const mobile = document.getElementById("p-mobile").value;
      const cls = document.getElementById("p-class").value;
      const subject = document.getElementById("p-subject").value;
      const area = document.getElementById("p-area").value;
      const time = document.getElementById("p-time").value;
      const msg = "Hi, I need a tutor.\nName: " + name + "\nMobile: " + mobile +
        "\nClass: " + cls + "\nSubject: " + subject + "\nArea: " + area +
        "\nPreferred timing: " + time;

      sendToSheet({
        formType: "parent",
        name: name, mobile: mobile, class: cls, subject: subject, area: area, timing: time
      });

      const waBtn = document.getElementById("enquiryWa");
      if (waBtn) waBtn.href = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msg);
      const successEl = document.getElementById("enquirySuccess");
      if (successEl) successEl.classList.add("show");
      enquiryForm.style.display = "none";
    });
  }

  /* ---------- Tutor registration form ---------- */
  const tutorForm = document.getElementById("tutorForm");
  if (tutorForm) {
    tutorForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const name = document.getElementById("t-name").value;
      const mobile = document.getElementById("t-mobile").value;
      const qual = document.getElementById("t-qual").value;
      const exp = document.getElementById("t-exp").value;
      const subjects = document.getElementById("t-subjects").value;
      const classes = document.getElementById("t-classes").value;
      const area = document.getElementById("t-area").value;
      const mode = document.getElementById("t-mode").value;
      const msg = "Hi, I want to register as a tutor.\nName: " + name + "\nMobile: " + mobile +
        "\nQualification: " + qual + "\nExperience: " + exp + "\nSubjects: " + subjects +
        "\nClasses: " + classes + "\nPreferred Area: " + area + "\nMode: " + mode;

      sendToSheet({
        formType: "tutor",
        name: name, mobile: mobile, qualification: qual, experience: exp,
        subjects: subjects, classes: classes, area: area, mode: mode
      });

      const waBtn = document.getElementById("tutorWa");
      if (waBtn) waBtn.href = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msg);
      const emailBtn = document.getElementById("tutorEmail");
      if (emailBtn) {
        emailBtn.href = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent("Tutor Registration - " + name) +
          "&body=" + encodeURIComponent(msg + "\n\n(Please attach your resume and photo to this email)");
      }
      const successEl = document.getElementById("tutorSuccess");
      if (successEl) successEl.classList.add("show");
      tutorForm.style.display = "none";
    });
  }

  /* ---------- Stat counter animation ---------- */
  const statEls = document.querySelectorAll(".stat-num[data-count-to]");
  if (statEls.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.getAttribute("data-count-to"), 10) || 0;
        const suffix = el.getAttribute("data-suffix") || "";
        let current = 0;
        const step = Math.max(1, Math.round(target / 40));
        const timer = setInterval(function () {
          current += step;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          el.textContent = current + suffix;
        }, 30);
        observer.unobserve(el);
      });
    }, { threshold: 0.4 });
    statEls.forEach(function (el) { observer.observe(el); });
  }
});
