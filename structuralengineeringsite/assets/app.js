/* ==========================================================================
   NeedACalc · Interactive Engineering Tools, Blueprint Switcher & Express Quote
   Temporary Works Consulting & Design Ltd (CEng MICE · EngC 094002192)
   ========================================================================== */

(function () {
  "use strict";

  const CONTACT_EMAIL = "david@temporaryworksconsulting.com";
  const WHATSAPP_BASE = "https://wa.me/447900984900";

  /* --------------------------------------------------------------------------
     1. Hero Architectural Blueprint Switcher
     -------------------------------------------------------------------------- */
  const BLUEPRINTS = {
  "rsj": {
    "title": "CONCEPT ONLY \u00b7 Beam and bearings concept",
    "code": "NOT A PROJECT DESIGN",
    "spec1Label": "Status",
    "spec1Val": "Illustration only",
    "spec2Label": "Approval",
    "spec2Val": "Not for construction",
    "spec3Label": "Next step",
    "spec3Val": "Request a scoped quotation",
    "svg": "<svg viewBox=\"0 0 540 290\" class=\"hub-blueprint-svg\" role=\"img\" aria-label=\"Beam and bearings concept: illustration only, not for construction\"><rect width=\"540\" height=\"290\" fill=\"#0D1117\"/><text x=\"270\" y=\"25\" text-anchor=\"middle\" fill=\"#C6A15B\" font-size=\"13\">ILLUSTRATION ONLY \u2014 NOT FOR CONSTRUCTION</text><path d=\"M80 160 V80 H460 V160 M80 92 H460\" stroke=\"#2A9B96\" stroke-width=\"7\" fill=\"none\"/><text x=\"270\" y=\"245\" text-anchor=\"middle\" fill=\"#F3EEE4\" font-size=\"12\">Beam and bearings concept</text><text x=\"270\" y=\"270\" text-anchor=\"middle\" fill=\"#F3EEE4\" font-size=\"9\">Project-specific beam, bearings and stability checks required</text></svg>"
  },
  "needling": {
    "title": "CONCEPT ONLY \u00b7 Temporary support concept",
    "code": "NOT A PROJECT DESIGN",
    "spec1Label": "Status",
    "spec1Val": "Illustration only",
    "spec2Label": "Approval",
    "spec2Val": "Not for construction",
    "spec3Label": "Next step",
    "spec3Val": "Request a scoped quotation",
    "svg": "<svg viewBox=\"0 0 540 290\" class=\"hub-blueprint-svg\" role=\"img\" aria-label=\"Temporary support concept: illustration only, not for construction\"><rect width=\"540\" height=\"290\" fill=\"#0D1117\"/><text x=\"270\" y=\"25\" text-anchor=\"middle\" fill=\"#C6A15B\" font-size=\"13\">ILLUSTRATION ONLY \u2014 NOT FOR CONSTRUCTION</text><path d=\"M110 215 V90 H430 V215 M80 90 H460\" stroke=\"#2A9B96\" stroke-width=\"7\" fill=\"none\"/><text x=\"270\" y=\"245\" text-anchor=\"middle\" fill=\"#F3EEE4\" font-size=\"12\">Temporary support concept</text><text x=\"270\" y=\"270\" text-anchor=\"middle\" fill=\"#F3EEE4\" font-size=\"9\">Engineered sequence and verified support conditions required</text></svg>"
  },
  "loft": {
    "title": "CONCEPT ONLY \u00b7 Loft structure concept",
    "code": "NOT A PROJECT DESIGN",
    "spec1Label": "Status",
    "spec1Val": "Illustration only",
    "spec2Label": "Approval",
    "spec2Val": "Not for construction",
    "spec3Label": "Next step",
    "spec3Val": "Request a scoped quotation",
    "svg": "<svg viewBox=\"0 0 540 290\" class=\"hub-blueprint-svg\" role=\"img\" aria-label=\"Loft structure concept: illustration only, not for construction\"><rect width=\"540\" height=\"290\" fill=\"#0D1117\"/><text x=\"270\" y=\"25\" text-anchor=\"middle\" fill=\"#C6A15B\" font-size=\"13\">ILLUSTRATION ONLY \u2014 NOT FOR CONSTRUCTION</text><path d=\"M70 205 L270 50 L470 205 Z M90 195 H450\" stroke=\"#2A9B96\" stroke-width=\"7\" fill=\"none\"/><text x=\"270\" y=\"245\" text-anchor=\"middle\" fill=\"#F3EEE4\" font-size=\"12\">Loft structure concept</text><text x=\"270\" y=\"270\" text-anchor=\"middle\" fill=\"#F3EEE4\" font-size=\"9\">Load paths, connections and existing structure require design</text></svg>"
  }
};

  function initBlueprintTabs() {
    const tabs = document.querySelectorAll("[data-blueprint-tab]");
    const titleEl = document.getElementById("bp-title");
    const codeEl = document.getElementById("bp-code");
    const canvasEl = document.getElementById("bp-canvas");
    const s1L = document.getElementById("bp-s1-l");
    const s1V = document.getElementById("bp-s1-v");
    const s2L = document.getElementById("bp-s2-l");
    const s2V = document.getElementById("bp-s2-v");
    const s3L = document.getElementById("bp-s3-l");
    const s3V = document.getElementById("bp-s3-v");

    if (!tabs.length || !canvasEl) return;

    tabs.forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-blueprint-tab");
        const data = BLUEPRINTS[key];
        if (!data) return;

        tabs.forEach((t) => t.setAttribute("aria-selected", t === btn ? "true" : "false"));
        if (titleEl) titleEl.textContent = data.title;
        if (codeEl) codeEl.textContent = data.code;
        canvasEl.innerHTML = data.svg;
        if (s1L) s1L.textContent = data.spec1Label;
        if (s1V) s1V.textContent = data.spec1Val;
        if (s2L) s2L.textContent = data.spec2Label;
        if (s2V) s2V.textContent = data.spec2Val;
        if (s3L) s3L.textContent = data.spec3Label;
        if (s3V) s3V.textContent = data.spec3Val;
      });
    });
  }

  /* --------------------------------------------------------------------------
     2. Interactive Fee & Preliminary Steel Beam Sizing Tool (#calculator)
     -------------------------------------------------------------------------- */
  const SCOPE_PRICING = {
    "single-beam": {
      label: "Single RSJ Steel Beam & Padstone Check",
      baseFee: 149,
      highStreetFee: 395,
      perExtraMember: 65,
      stdTurnaround: "2–3 working days",
      expTurnaround: "Within 24–48 hours"
    },
    "wall-opening": {
      label: "Load-Bearing Wall Removal + Padstones",
      baseFee: 165,
      highStreetFee: 450,
      perExtraMember: 65,
      stdTurnaround: "2–3 working days",
      expTurnaround: "Within 24–48 hours"
    },
    "needling-propping": {
      label: "Needling, Propping & Temporary Support Pack",
      baseFee: 195,
      highStreetFee: 525,
      perExtraMember: 75,
      stdTurnaround: "2–3 working days",
      expTurnaround: "Within 24–48 hours"
    },
    "column-goalpost": {
      label: "Columns, Posts or Goalpost Sway Frame",
      baseFee: 225,
      highStreetFee: 550,
      perExtraMember: 75,
      stdTurnaround: "2–3 working days",
      expTurnaround: "Within 24–48 hours"
    },
    "extension-pack": {
      label: "Home Extension Structural Calculation Pack",
      baseFee: 295,
      highStreetFee: 695,
      perExtraMember: 60,
      stdTurnaround: "3–4 working days",
      expTurnaround: "Within 48 hours"
    },
    "loft-pack": {
      label: "Full Loft Conversion Steel & Timber Pack",
      baseFee: 349,
      highStreetFee: 850,
      perExtraMember: 60,
      stdTurnaround: "3–4 working days",
      expTurnaround: "Within 48 hours"
    },
    "foundation-shoring": {
      label: "Foundations, Underpinning or Domestic Shoring",
      baseFee: 225,
      highStreetFee: 575,
      perExtraMember: 75,
      stdTurnaround: "2–4 working days",
      expTurnaround: "Within 48 hours"
    }
  };

  function initCalculator() {
    const scopeSelect = document.getElementById("calc-scope");
    const countSelect = document.getElementById("calc-count");
    const speedSelect = document.getElementById("calc-speed");
    const spanInput = document.getElementById("calc-span");
    const loadSelect = document.getElementById("calc-load");
    const tempCheck = document.getElementById("calc-addon-temp");
    const pwCheck = document.getElementById("calc-addon-pw");

    if (!scopeSelect) return;

    function updateEstimate() {
      const scopeKey = scopeSelect.value || "single-beam";
      const info = SCOPE_PRICING[scopeKey] || SCOPE_PRICING["single-beam"];
      const extraMembers = Math.max(0, parseInt(countSelect.value || "1", 10) - 1);
      const isExpress = speedSelect.value === "express";
      const spanM = Math.max(1.0, Math.min(9.0, parseFloat(spanInput.value || "3.6")));

      let fee = info.baseFee + extraMembers * info.perExtraMember;
      if (isExpress) fee += 50;
      if (tempCheck && tempCheck.checked && scopeKey !== "needling-propping") fee += 45;
      if (pwCheck && pwCheck.checked) fee += 35;

      const typicalCompetitor = info.highStreetFee + extraMembers * 140 + (isExpress ? 150 : 0);
      const savings = Math.max(120, typicalCompetitor - fee);

      // Fee guide only: no member sizes, load capacities or temporary support instructions.
      // Update DOM
      const feeEl = document.getElementById("res-fee");
      const compEl = document.getElementById("res-competitor");
      const saveEl = document.getElementById("res-savings");
      const turnEl = document.getElementById("res-turnaround");
      const beamEl = document.getElementById("res-beam");
      const momentEl = document.getElementById("res-moment");
      const padEl = document.getElementById("res-padstone");
      const propEl = document.getElementById("res-props");
      const applyBtn = document.getElementById("res-apply-btn");

      if (feeEl) feeEl.textContent = `£${fee}`;
      if (compEl) compEl.textContent = `£${typicalCompetitor}+`;
      if (saveEl) saveEl.textContent = `Save ~£${savings} vs traditional practice`;
      if (turnEl) turnEl.textContent = isExpress ? info.expTurnaround : info.stdTurnaround;
      if (beamEl) beamEl.textContent = "Project-specific design required";
      if (momentEl) momentEl.textContent = "Loads, deflection, restraint and stability have not been verified.";
      if (padEl) padEl.textContent = "Bearing and temporary support design required";
      if (propEl) propEl.textContent = "Do not order materials, remove walls or install props from this website.";

      if (applyBtn) {
        applyBtn.onclick = function () {
          applyToQuoteForm({
            serviceLabel: info.label,
            summary: `Estimated Scope: ${info.label} (${countSelect.value} member(s), ~${spanM.toFixed(1)}m clear span, ${isExpress ? "Priority programme to be agreed" : "Standard programme to be agreed"} turnaround, indicative fee £${fee}).`
          });
        };
      }
    }

    [scopeSelect, countSelect, speedSelect, spanInput, loadSelect, tempCheck, pwCheck].forEach((el) => {
      if (el) {
        el.addEventListener("input", updateEstimate);
        el.addEventListener("change", updateEstimate);
      }
    });

    updateEstimate();
  }

  /* --------------------------------------------------------------------------
     3. Sample Calculation Pack Viewer (#sample-pack)
     -------------------------------------------------------------------------- */
  const SAMPLE_SHEETS = {
  "sheet1": {
    "ref": "ILLUSTRATIVE CONTENT \u00b7 SHEET 1 OF 3",
    "status": "DEMONSTRATION ONLY \u2014 NOT FOR CONSTRUCTION OR SUBMISSION",
    "title": "Builder's summary format",
    "lines": [
      {
        "k": "Element reference",
        "v": "Identifies only the elements included in the accepted commission.",
        "pass": false
      },
      {
        "k": "Member and bearing details",
        "v": "Specified only in the issued project-specific design.",
        "pass": false
      },
      {
        "k": "Issue status",
        "v": "The project document states revision, limitations and permitted use.",
        "pass": false
      }
    ],
    "note": "This is an example of document content only. It is not a checked, signed or approved design. Payment does not change its status."
  },
  "sheet2": {
    "ref": "ILLUSTRATIVE CONTENT \u00b7 SHEET 2 OF 3",
    "status": "DEMONSTRATION ONLY \u2014 NOT FOR CONSTRUCTION OR SUBMISSION",
    "title": "Engineering verification format",
    "lines": [
      {
        "k": "Design basis",
        "v": "Project geometry, condition survey, loads and load combinations require verification.",
        "pass": false
      },
      {
        "k": "Member verification",
        "v": "Strength, serviceability, restraint, connections and stability checks are project-specific.",
        "pass": false
      },
      {
        "k": "Supporting construction",
        "v": "Bearing capacity, existing masonry and load paths require assessment.",
        "pass": false
      }
    ],
    "note": "This is an example of document content only. It is not a checked, signed or approved design. Payment does not change its status."
  },
  "sheet3": {
    "ref": "ILLUSTRATIVE CONTENT \u00b7 SHEET 3 OF 3",
    "status": "DEMONSTRATION ONLY \u2014 NOT FOR CONSTRUCTION OR SUBMISSION",
    "title": "Temporary works and risk format",
    "lines": [
      {
        "k": "Temporary stability",
        "v": "A project-specific design and agreed sequence are required where applicable.",
        "pass": false
      },
      {
        "k": "Support conditions",
        "v": "Props, needles, foundations, floors and load spread must be verified.",
        "pass": false
      },
      {
        "k": "Hold points",
        "v": "Installation, inspection and permission to load or strike are defined for the project.",
        "pass": false
      }
    ],
    "note": "This is an example of document content only. It is not a checked, signed or approved design. Payment does not change its status."
  }
};

  function initSampleViewer() {
    const tabs = document.querySelectorAll("[data-sample-tab]");
    const refEl = document.getElementById("sample-ref");
    const statusEl = document.getElementById("sample-status");
    const titleEl = document.getElementById("sample-title");
    const linesEl = document.getElementById("sample-lines");
    const noteEl = document.getElementById("sample-note");

    if (!tabs.length || !linesEl) return;

    function renderSheet(key) {
      const s = SAMPLE_SHEETS[key];
      if (!s) return;
      if (refEl) refEl.textContent = s.ref;
      if (statusEl) statusEl.textContent = s.status;
      if (titleEl) titleEl.textContent = s.title;
      if (noteEl) noteEl.textContent = s.note;
      linesEl.innerHTML = s.lines
        .map(
          (item) => `
          <div class="hub-calc-line ${item.pass ? "pass" : ""}">
            <span>${item.k}</span>
            <strong>${item.v}</strong>
          </div>
        `
        )
        .join("");
    }

    tabs.forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-sample-tab");
        tabs.forEach((t) => t.setAttribute("aria-selected", t === btn ? "true" : "false"));
        renderSheet(key);
      });
    });

    renderSheet("sheet1");
  }

  /* --------------------------------------------------------------------------
     4. Service Row Pre-Selection & Express Quote Form (#enquire)
     -------------------------------------------------------------------------- */
  function applyToQuoteForm({ serviceLabel, summary }) {
    const projectSelect = document.getElementById("q-project");
    const detailsBox = document.getElementById("q-details");
    const enquireSection = document.getElementById("enquire");

    if (projectSelect && serviceLabel) {
      let matched = false;
      Array.from(projectSelect.options).forEach((opt) => {
        if (opt.value.toLowerCase() === serviceLabel.toLowerCase() || opt.textContent.toLowerCase().includes(serviceLabel.toLowerCase().slice(0, 12))) {
          projectSelect.value = opt.value;
          matched = true;
        }
      });
      if (!matched) {
        const customOpt = document.createElement("option");
        customOpt.value = serviceLabel;
        customOpt.textContent = serviceLabel;
        projectSelect.appendChild(customOpt);
        projectSelect.value = serviceLabel;
      }
    }

    if (detailsBox && summary) {
      const current = detailsBox.value.trim();
      if (!current.includes(summary)) {
        detailsBox.value = current ? `${summary}\n\n${current}` : `${summary}\nProject postcode / details: `;
      }
    }

    if (enquireSection) {
      enquireSection.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => {
        const nameInput = document.getElementById("q-name");
        if (nameInput) nameInput.focus();
      }, 450);
    }
  }

  function initQuoteForm() {
    // Generate unique reference like temporaryworksconsulting.com/quote.html
    const refCode = "NAC-" + new Date().getFullYear() + "-" + crypto.randomUUID().slice(0, 8).toUpperCase();
    const refInput = document.getElementById("q-ref");
    const refDisplay = document.getElementById("q-ref-display");
    if (refInput) refInput.value = refCode;
    if (refDisplay) refDisplay.textContent = refCode;

    // Bind service selection buttons across page
    document.querySelectorAll("[data-select-service]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const label = el.getAttribute("data-select-service");
        const feeHint = el.getAttribute("data-service-fee") || "";
        applyToQuoteForm({
          serviceLabel: label,
          summary: `Selected Service: ${label}${feeHint ? " (" + feeHint + ")" : ""}.`
        });
      });
    });

    // Check URL query parameter ?need=...
    const params = new URLSearchParams(window.location.search);
    const needParam = params.get("need");
    if (needParam) {
      applyToQuoteForm({
        serviceLabel: needParam,
        summary: `Enquiry regarding: ${needParam}.`
      });
    }

    // Close mega-menu when clicking internal hash links
    const menuDetails = document.querySelector("details.hub-menu");
    if (menuDetails) {
      menuDetails.querySelectorAll("a[href^='#'], a[href^='/#']").forEach((a) => {
        a.addEventListener("click", () => {
          menuDetails.removeAttribute("open");
        });
      });
    }

    // Handle Express Quote submission
    const form = document.getElementById("needacalc-quote-form");
    const statusBox = document.getElementById("q-status");
    const waDirectBtn = document.getElementById("q-whatsapp-send");

    if (waDirectBtn && form) {
      waDirectBtn.addEventListener("click", () => {
        const fd = new FormData(form);
        const name = String(fd.get("name") || "").trim();
        const project = String(fd.get("project") || "Structural Calculation").trim();
        const postcode = String(fd.get("postcode") || "").trim();
        const urgency = String(fd.get("urgency") || "Standard (2-3 days)").trim();
        const details = String(fd.get("details") || "").trim();
        const msg = [
          `Hello David, I'd like a fixed-fee NeedACalc quote (${refCode}).`,
          name ? `Name: ${name}` : "",
          `Service: ${project}`,
          postcode ? `Location: ${postcode}` : "",
          `Turnaround: ${urgency}`,
          details ? `Details: ${details}` : ""
        ]
          .filter(Boolean)
          .join("\n");
        window.open(`${WHATSAPP_BASE}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
      });
    }

    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const fd = new FormData(form);
      if (String(fd.get("_honey") || "") !== "") return;

      const name = String(fd.get("name") || "").trim();
      const email = String(fd.get("email") || "").trim();
      const phone = String(fd.get("phone") || "").trim();
      const postcode = String(fd.get("postcode") || "").trim();
      const project = String(fd.get("project") || "").trim();
      const urgency = String(fd.get("urgency") || "").trim();
      const details = String(fd.get("details") || "").trim();
      const file = fd.get("drawings");
      const hasFile = file instanceof File && file.size > 0;

      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !project || details.length < 8 || fd.get("consent") !== "on" || (hasFile && (file.size > 5 * 1024 * 1024 || !/\.(pdf|jpe?g|png|webp)$/i.test(file.name)))) {
        if (statusBox) {
          statusBox.hidden = false;
          statusBox.style.borderColor = "#C94A4A";
          statusBox.innerHTML = `<strong style="color:#C94A4A">Please complete required fields:</strong> Add your name, valid email, calculation type, a description of at least 8 characters, and acknowledge the privacy notice. Attach only a PDF, JPG, PNG or WebP file up to 5 MB.`;
        }
        return;
      }

      const submitBtn = form.querySelector("button[type='submit']");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending enquiry to David J. Miller…";
      }

      const payload = new FormData();
      payload.set("enquiry_reference", refCode);
      payload.set("name", name);
      payload.set("email", email);
      payload.set("phone", phone);
      payload.set("postcode", postcode);
      payload.set("project", project);
      payload.set("urgency", urgency);
      payload.set("details", details);
      payload.set("_subject", `NeedACalc Quote [${refCode}] — ${project} — ${name}`);
      payload.set("_template", "table");
      payload.set("_replyto", email);
      if (hasFile) payload.set("attachment", file);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      try {
        const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(CONTACT_EMAIL)}`, {
          method: "POST",
          body: payload,
          headers: { Accept: "application/json" },
          signal: controller.signal
        });
        const outcome = await res.json();
        if (!res.ok || !(outcome.success === true || outcome.success === "true")) throw new Error("Form service did not accept enquiry");

        if (statusBox) {
          statusBox.hidden = false;
          statusBox.style.borderColor = "#248F68";
          statusBox.innerHTML = `
            <p class="hub-kicker" style="margin-bottom:6px;color:#248F68">Enquiry submitted · Reference ${refCode}</p>
            <h3 style="margin:0 0 8px;font-family:var(--tw-display);font-size:1.6rem">Your enquiry was accepted by the form service.</h3>
            <p style="margin:0;font-size:0.92rem;color:var(--tw-ink-soft)">Email delivery to the practice is not yet confirmed. David will review your scope and reply with a written quotation. If you have no reply by the next working day, contact us with this reference. This enquiry is not a commission or a payment. Written scope acceptance is recorded separately before a private payment invitation can be issued. Have additional PDFs or photos? <a href="${WHATSAPP_BASE}?text=${encodeURIComponent("Hi David, following up on NeedACalc quote " + refCode)}" style="text-decoration:underline;font-weight:700">Send them via WhatsApp</a> or email <a href="mailto:${CONTACT_EMAIL}" style="text-decoration:underline;font-weight:700">${CONTACT_EMAIL}</a>.</p>
          `;
        }
        form.reset();
        if (refInput) refInput.value = refCode;
      } catch (_err) {
        const bodyLines = [
          `Enquiry Reference: ${refCode}`,
          `Name: ${name}`,
          `Email: ${email}`,
          `Phone: ${phone || "—"}`,
          `Postcode / Site: ${postcode || "—"}`,
          `Calculation Type: ${project}`,
          `Turnaround Needed: ${urgency}`,
          "",
          details,
          "",
          hasFile ? "(Note: Please attach your drawing/photo file to this email)" : ""
        ]
          .filter(Boolean)
          .join("\n");
        const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`NeedACalc Quote [${refCode}] — ${project}`)}&body=${encodeURIComponent(bodyLines)}`;
        if (statusBox) {
          statusBox.hidden = false;
          statusBox.style.borderColor = "#C6A15B";
          statusBox.innerHTML = `
            <p style="margin:0;font-size:0.92rem">We could not confirm submission. Your details have been retained. Check with the practice before resending to avoid duplicates. Open your email client with reference <strong>${refCode}</strong> pre-filled, or <a href="${mailtoUrl}" style="text-decoration:underline;font-weight:700">click here to send via email</a> / <a href="${WHATSAPP_BASE}" style="text-decoration:underline;font-weight:700">WhatsApp 07900 984900</a>.</p>
          `;
        }
      } finally {
        clearTimeout(timeout);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Get My Free Quote ↗";
        }
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initBlueprintTabs();
    initCalculator();
    initSampleViewer();
    initQuoteForm();
  });
})();
