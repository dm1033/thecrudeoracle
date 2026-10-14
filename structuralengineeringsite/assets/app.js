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
    rsj: {
      title: "FIG 01 · INTERNAL MASONRY WALL REMOVAL — UNIVERSAL STEEL BEAM ON PADSTONES",
      code: "BS EN 1993-1-1 & BS EN 1996-1-1",
      spec1Label: "Design Code",
      spec1Val: "BS EN 1993-1-1 (EC3)",
      spec2Label: "Deflection Limit",
      spec2Val: "L / 360 (Brittle finish)",
      spec3Label: "Typical Fee / Speed",
      spec3Val: "From £149 · 24–48 hrs",
      svg: `
        <svg viewBox="0 0 540 290" class="hub-blueprint-svg" role="img" aria-label="Engineering blueprint of a universal steel beam on concrete padstones across a masonry wall opening">
          <defs>
            <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(243,238,228,0.06)" stroke-width="0.8"/>
            </pattern>
          </defs>
          <rect width="540" height="290" fill="url(#gridPattern)"/>
          <rect x="20" y="18" width="500" height="206" fill="none" stroke="rgba(243,238,228,0.28)" stroke-width="1"/>
          <!-- Distributed floor/wall load arrows along top -->
          <g stroke="#C6A15B" stroke-width="1.2">
            <line x1="95" y1="30" x2="445" y2="30"/>
            <path d="M115 30 v18 m-4 -5 l4 5 l4 -5"/>
            <path d="M165 30 v18 m-4 -5 l4 5 l4 -5"/>
            <path d="M215 30 v18 m-4 -5 l4 5 l4 -5"/>
            <path d="M270 30 v18 m-4 -5 l4 5 l4 -5"/>
            <path d="M325 30 v18 m-4 -5 l4 5 l4 -5"/>
            <path d="M375 30 v18 m-4 -5 l4 5 l4 -5"/>
            <path d="M425 30 v18 m-4 -5 l4 5 l4 -5"/>
          </g>
          <text x="270" y="26" text-anchor="middle" fill="#C6A15B" font-family="IBM Plex Mono, monospace" font-size="9.5">FACTORED UDL: 1.35 Gk + 1.50 Qk (kN/m) — FLOOR + MASONRY ABOVE</text>
          <!-- Left & Right Masonry Piers -->
          <rect x="34" y="54" width="90" height="170" fill="rgba(243,238,228,0.06)" stroke="#F3EEE4" stroke-width="1.4"/>
          <rect x="416" y="54" width="90" height="170" fill="rgba(243,238,228,0.06)" stroke="#F3EEE4" stroke-width="1.4"/>
          <!-- Concrete Padstones -->
          <rect x="86" y="72" width="52" height="20" fill="#C6A15B" stroke="#F3EEE4" stroke-width="1"/>
          <rect x="402" y="72" width="52" height="20" fill="#C6A15B" stroke="#F3EEE4" stroke-width="1"/>
          <!-- Steel Universal Beam -->
          <rect x="92" y="52" width="356" height="20" fill="#2A9B96" stroke="#F3EEE4" stroke-width="1.2"/>
          <text x="270" y="65" text-anchor="middle" fill="#0B0C0E" font-family="IBM Plex Mono, monospace" font-weight="600" font-size="10">203 × 133 × 25 UKB (S355) + 30 MIN FIRE BOARD</text>
          <!-- Padstone callouts -->
          <text x="112" y="106" text-anchor="middle" fill="#C6A15B" font-family="IBM Plex Mono, monospace" font-size="8.5">PADSTONE</text>
          <text x="112" y="117" text-anchor="middle" fill="#8B9098" font-family="IBM Plex Mono, monospace" font-size="8">300×102×215</text>
          <text x="428" y="106" text-anchor="middle" fill="#C6A15B" font-family="IBM Plex Mono, monospace" font-size="8.5">PADSTONE</text>
          <text x="428" y="117" text-anchor="middle" fill="#8B9098" font-family="IBM Plex Mono, monospace" font-size="8">300×102×215</text>
          <!-- Span Dimension Line -->
          <line x1="124" y1="196" x2="416" y2="196" stroke="#F3EEE4" stroke-width="1"/>
          <line x1="124" y1="189" x2="124" y2="203" stroke="#F3EEE4" stroke-width="1.2"/>
          <line x1="416" y1="189" x2="416" y2="203" stroke="#F3EEE4" stroke-width="1.2"/>
          <text x="270" y="190" text-anchor="middle" fill="#F3EEE4" font-family="IBM Plex Mono, monospace" font-size="10">CLEAR STRUCTURAL OPENING · SIZED TO YOUR PLANS</text>
          <text x="270" y="213" text-anchor="middle" fill="#6CE0DA" font-family="IBM Plex Mono, monospace" font-size="9">Includes temporary needling &amp; propping sequence notes (BS 5975)</text>
          <text x="34" y="252" fill="#C6A15B" font-family="IBM Plex Mono, monospace" font-size="9.5">CHECKED &amp; SIGNED: DAVID J. MILLER · CEng MICE · EngC 094002192</text>
          <text x="34" y="270" fill="#8B9098" font-family="IBM Plex Mono, monospace" font-size="9">DELIVERABLE: PDF CALCULATION PACK + BUILDER ARRANGEMENT SKETCH</text>
        </svg>
      `
    },
    needling: {
      title: "FIG 02 · TEMPORARY NEEDLING & ACROW PROPPING BEFORE WALL BREAK-OUT",
      code: "BS 5975:2024 & CDM 2015",
      spec1Label: "Temporary Code",
      spec1Val: "BS 5975:2024 Procedural",
      spec2Label: "Prop Capacity Check",
      spec2Val: "Acrow + Soleboard Bearing",
      spec3Label: "Typical Fee / Speed",
      spec3Val: "From £195 · 24–48 hrs",
      svg: `
        <svg viewBox="0 0 540 290" class="hub-blueprint-svg" role="img" aria-label="Engineering blueprint of temporary needle beams and Acrow props supporting masonry during lintel installation">
          <rect width="540" height="290" fill="#0D1117"/>
          <rect x="20" y="18" width="500" height="206" fill="none" stroke="rgba(243,238,228,0.28)" stroke-width="1"/>
          <text x="270" y="34" text-anchor="middle" fill="#C6A15B" font-family="IBM Plex Mono, monospace" font-size="9.5">TEMPORARY CONDITION: NEEDLES AT MAX 900mm c/c PRIOR TO DEMOLITION</text>
          <!-- Existing Wall Above -->
          <rect x="110" y="44" width="320" height="36" fill="rgba(243,238,228,0.08)" stroke="#F3EEE4" stroke-width="1.2"/>
          <text x="270" y="66" text-anchor="middle" fill="#F3EEE4" font-family="IBM Plex Mono, monospace" font-size="9.5">EXISTING MASONRY &amp; FIRST FLOOR JOISTS SUPPORTED ON NEEDLES</text>
          <!-- Needle Beams -->
          <rect x="82" y="80" width="376" height="12" fill="#C6A15B"/>
          <text x="270" y="89" text-anchor="middle" fill="#0B0C0E" font-family="IBM Plex Mono, monospace" font-weight="600" font-size="8.5">STEEL NEEDLE BEAMS + HARDWOOD PACKING WEDGES</text>
          <!-- Acrow Props Left & Right -->
          <g stroke="#2A9B96" stroke-width="4">
            <line x1="120" y1="92" x2="120" y2="198"/>
            <line x1="165" y1="92" x2="165" y2="198"/>
            <line x1="375" y1="92" x2="375" y2="198"/>
            <line x1="420" y1="92" x2="420" y2="198"/>
          </g>
          <!-- Timber Soleboards -->
          <rect x="96" y="198" width="90" height="10" fill="#C6A15B"/>
          <rect x="354" y="198" width="90" height="10" fill="#C6A15B"/>
          <!-- Working Zone in Middle -->
          <rect x="195" y="102" width="150" height="90" fill="rgba(42,155,150,0.12)" stroke="#2A9B96" stroke-dasharray="4 3"/>
          <text x="270" y="142" text-anchor="middle" fill="#6CE0DA" font-family="IBM Plex Mono, monospace" font-size="9.5">SAFE BREAK-OUT ZONE</text>
          <text x="270" y="158" text-anchor="middle" fill="#F3EEE4" font-family="IBM Plex Mono, monospace" font-size="8.5">Install permanent RSJ + dry-pack</text>
          <text x="270" y="172" text-anchor="middle" fill="#8B9098" font-family="IBM Plex Mono, monospace" font-size="8">24 hr cure before prop strike</text>
          <text x="34" y="252" fill="#C6A15B" font-family="IBM Plex Mono, monospace" font-size="9.5">WHY THIS MATTERS: MOST ONLINE BEAM CALCS IGNORE TEMPORARY STABILITY</text>
          <text x="34" y="270" fill="#8B9098" font-family="IBM Plex Mono, monospace" font-size="9">WE INCLUDE CLEAR TEMPORARY WORKS NOTES &amp; PROP LOADS WHERE NEEDED</text>
        </svg>
      `
    },
    loft: {
      title: "FIG 03 · LOFT CONVERSION RIDGE BEAM, FLOOR STEELS & GOALPOST SWAY FRAME",
      code: "BS EN 1993-1-1 & BS EN 1995-1-1",
      spec1Label: "Scope Covered",
      spec1Val: "Ridge + Floor + Dormer",
      spec2Label: "Moment Connections",
      spec2Val: "Bolted End-Plate / Splice",
      spec3Label: "Package Fee",
      spec3Val: "From £349 Fixed Pack",
      svg: `
        <svg viewBox="0 0 540 290" class="hub-blueprint-svg" role="img" aria-label="Engineering blueprint of loft conversion steel ridge beam, floor beams, and rear dormer frame">
          <rect width="540" height="290" fill="#0D1117"/>
          <rect x="20" y="18" width="500" height="206" fill="none" stroke="rgba(243,238,228,0.28)" stroke-width="1"/>
          <!-- Pitched Roof + Rear Dormer Profile -->
          <path d="M 80 185 L 220 48 L 430 48 L 430 185 Z" fill="rgba(243,238,228,0.04)" stroke="#F3EEE4" stroke-width="1.4"/>
          <!-- Ridge Steel Beam -->
          <rect x="208" y="42" width="24" height="24" fill="#C6A15B" stroke="#F3EEE4" stroke-width="1.2"/>
          <text x="220" y="34" text-anchor="middle" fill="#C6A15B" font-family="IBM Plex Mono, monospace" font-size="9">RIDGE STEEL (152×89 UKB) + SPLICE DETAIL</text>
          <!-- Loft Floor Steel Beams -->
          <rect x="74" y="180" width="368" height="16" fill="#2A9B96" stroke="#F3EEE4" stroke-width="1.2"/>
          <text x="260" y="191" text-anchor="middle" fill="#0B0C0E" font-family="IBM Plex Mono, monospace" font-weight="600" font-size="9">NEW LOFT FLOOR STEELS + TIMBER JOIST HANGERS (BS EN 1995)</text>
          <!-- Party Wall Padstones -->
          <rect x="64" y="196" width="32" height="16" fill="#C6A15B"/>
          <rect x="420" y="196" width="32" height="16" fill="#C6A15B"/>
          <text x="270" y="122" text-anchor="middle" fill="#6CE0DA" font-family="IBM Plex Mono, monospace" font-size="9.5">INCLUDES: RIDGE STEEL + FLOOR STEELS + TRIMMER JOISTS + PADSTONES</text>
          <text x="34" y="252" fill="#C6A15B" font-family="IBM Plex Mono, monospace" font-size="9.5">SPLICE CONNECTIONS INCLUDED FOR EASY LOFT ACCESS</text>
          <text x="34" y="270" fill="#8B9098" font-family="IBM Plex Mono, monospace" font-size="9">PARTY WALL SURVEYOR READY ENGINEERING CALCULATIONS &amp; BEARING LOADS</text>
        </svg>
      `
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
      const loadFactor = parseFloat(loadSelect.value || "22"); // kN/m factored UDL

      let fee = info.baseFee + extraMembers * info.perExtraMember;
      if (isExpress) fee += 50;
      if (tempCheck && tempCheck.checked && scopeKey !== "needling-propping") fee += 45;
      if (pwCheck && pwCheck.checked) fee += 35;

      const typicalCompetitor = info.highStreetFee + extraMembers * 140 + (isExpress ? 150 : 0);
      const savings = Math.max(120, typicalCompetitor - fee);

      // Preliminary engineering sizing check (indicative UKB + padstone + props)
      // Factored UDL w (kN/m), M_Ed = w * L^2 / 8, V_Ed = w * L / 2
      const mEd = (loadFactor * spanM * spanM) / 8;
      const vEd = (loadFactor * spanM) / 2;

      let beamSection = "152 × 89 × 16 UKB (S355)";
      let padstoneSize = "215 × 102 × 150 mm C35 Padstone";
      if (spanM > 5.2 || mEd > 115) {
        beamSection = "254 × 146 × 37 UKB or 203 × 203 × 46 UKC (S355)";
        padstoneSize = "440 × 140 × 215 mm C35 Engineering Padstone";
      } else if (spanM > 4.0 || mEd > 65) {
        beamSection = "203 × 133 × 30 UKB or 203 × 203 × 46 UKC (S355)";
        padstoneSize = "330 × 102 × 215 mm C35 Precast Padstone";
      } else if (spanM > 2.8 || mEd > 32) {
        beamSection = "178 × 102 × 19 UKB or 203 × 102 × 23 UKB (S355)";
        padstoneSize = "300 × 102 × 215 mm C35 Precast Padstone";
      }

      const needleCount = Math.max(2, Math.ceil(spanM / 0.9) + 1);
      const acrowCount = needleCount * 2;

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
      if (beamEl) beamEl.textContent = beamSection;
      if (momentEl) momentEl.textContent = `M_Ed ≈ ${mEd.toFixed(1)} kNm · R_Ed ≈ ${vEd.toFixed(1)} kN per bearing`;
      if (padEl) padEl.textContent = padstoneSize;
      if (propEl) propEl.textContent = `${needleCount} needles @ ≤900mm c/c (${acrowCount} No. Acrow props)`;

      if (applyBtn) {
        applyBtn.onclick = function () {
          applyToQuoteForm({
            serviceLabel: info.label,
            summary: `Estimated Scope: ${info.label} (${countSelect.value} member(s), ~${spanM.toFixed(1)}m clear span, ${isExpress ? "Express 24-48hr" : "Standard 2-3 day"} turnaround, indicative fee £${fee}).`
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
    sheet1: {
      ref: "DOC REF: TWC-NAC-2026-014 · SHEET 01 OF 03",
      status: "STATUS: FOR BUILDING CONTROL SUBMISSION (APPROVED DOCUMENT A)",
      title: "Sheet 01 — Builder's Plain-English Summary & Bearing Arrangement",
      lines: [
        { k: "Element Reference", v: "Beam B1 — Ground Floor Rear Knock-Through (3.85 m Clear Span)", pass: true },
        { k: "Adopted Steel Section", v: "203 × 133 × 30 UKB in Grade S355JR Steel (Primed + 30 min fire board)", pass: true },
        { k: "End Bearings & Padstones", v: "Min. 150 mm end bearing onto 300 × 102 × 215 mm C35 precast concrete padstones", pass: true },
        { k: "Total Factored Reaction", v: "R_d = 46.8 kN per end · Masonry bearing stress σ_c = 1.49 N/mm² ≤ f_k/γ_M (PASS)", pass: true },
        { k: "Deflection Check (SLS)", v: "δ_live = 4.2 mm ≤ Span / 360 (10.7 mm limit for plastered masonry above) — PASS", pass: true }
      ],
      note: "Every NeedACalc pack starts with this one-page summary sheet so your builder, steel fabricator and Building Control officer can read the beam size, bearing length, fire protection and padstone specification in under 30 seconds."
    },
    sheet2: {
      ref: "DOC REF: TWC-NAC-2026-014 · SHEET 02 OF 03",
      status: "CODES: BS EN 1990 · BS EN 1991-1-1 · BS EN 1993-1-1 · BS EN 1996-1-1",
      title: "Sheet 02 — Eurocode Structural Load Takedown & Member Verification",
      lines: [
        { k: "Characteristic Dead Load (Gk)", v: "Cavity masonry + timber floor + roof tributary = 11.4 kN/m", pass: false },
        { k: "Characteristic Imposed Load (Qk)", v: "Domestic floor (1.5 kN/m²) + roof snow (0.75 kN/m²) = 5.8 kN/m", pass: false },
        { k: "ULS Combination (BS EN 1990)", v: "w_Ed = (1.35 × 11.4) + (1.50 × 5.8) = 24.09 kN/m", pass: true },
        { k: "Bending Moment Resistance", v: "M_Ed = 48.2 kNm ≤ M_b,Rd = 69.4 kNm (Utilisation = 0.69 ≤ 1.00 — PASS)", pass: true },
        { k: "Shear Buckling & Web Bearing", v: "V_Ed = 46.8 kN ≤ V_c,Rd = 244.0 kN (Utilisation = 0.19 ≤ 1.00 — PASS)", pass: true }
      ],
      note: "Full Eurocode load combinations, lateral-torsional buckling checks (L_E / r_y) and masonry bearing stress checks are set out clearly with zero black-box ambiguity."
    },
    sheet3: {
      ref: "DOC REF: TWC-NAC-2026-014 · SHEET 03 OF 03",
      status: "TEMPORARY CONDITION & DESIGNER RISK NOTES (BS 5975 & CDM 2015)",
      title: "Sheet 03 — Temporary Needling, Propping & Residual Risk Schedule",
      lines: [
        { k: "Temporary Propping Prior to Cut", v: "Install Steel Needles (100×100 SHS or double channels) at max 900 mm centres", pass: true },
        { k: "Acrow Prop Working Load", v: "Unfactored temporary line load = 14.2 kN/m → ~6.4 kN per Acrow No. 2 prop (SWL 13–17 kN)", pass: true },
        { k: "Soleboards & Load Spread", v: "Continuous 225 × 50 mm C24 timber soleplates on sound floor / ground bearing", pass: true },
        { k: "Dry-Pack & Load Transfer", v: "Pack top flange tight to masonry with 1:3 dry-pack mortar; cure 24 hrs before striking props", pass: true },
        { k: "Party Wall Act 1996 Note", v: "Bearing loads stated for Party Wall Notice / Award where padstone cuts into party wall", pass: true }
      ],
      note: "Because NeedACalc is run by Temporary Works Consulting & Design Ltd, we explicitly call out the temporary propping and needling considerations that most domestic beam services leave out."
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
    const refCode = "NAC-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
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

      if (!name || !email || !project || details.length < 8) {
        if (statusBox) {
          statusBox.hidden = false;
          statusBox.style.borderColor = "#C94A4A";
          statusBox.innerHTML = `<strong style="color:#C94A4A">Please complete required fields:</strong> Add your name, email, calculation type, and a short description of your opening or project.`;
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
      payload.set("_captcha", "false");
      payload.set("_replyto", email);
      if (hasFile) payload.set("drawings", file);

      try {
        const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(CONTACT_EMAIL)}`, {
          method: "POST",
          body: payload,
          headers: { Accept: "application/json" }
        });
        if (!res.ok) throw new Error("Form service returned non-200");

        if (statusBox) {
          statusBox.hidden = false;
          statusBox.style.borderColor = "#248F68";
          statusBox.innerHTML = `
            <p class="hub-kicker" style="margin-bottom:6px;color:#248F68">Enquiry Received · Reference ${refCode}</p>
            <h3 style="margin:0 0 8px;font-family:var(--tw-display);font-size:1.6rem">Your quote request is in with David.</h3>
            <p style="margin:0;font-size:0.92rem;color:var(--tw-ink-soft)">David J. Miller (CEng MICE) will review your scope and reply with a confirmed fixed fee and delivery date — usually the same working day. Nothing is charged until you accept the written quote via Stripe. Have additional PDFs or photos? <a href="${WHATSAPP_BASE}?text=${encodeURIComponent("Hi David, following up on NeedACalc quote " + refCode)}" style="text-decoration:underline;font-weight:700">Send them via WhatsApp</a> or email <a href="mailto:${CONTACT_EMAIL}" style="text-decoration:underline;font-weight:700">${CONTACT_EMAIL}</a>.</p>
          `;
        }
        form.reset();
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
            <p style="margin:0;font-size:0.92rem">Opening your email client with reference <strong>${refCode}</strong> pre-filled, or <a href="${mailtoUrl}" style="text-decoration:underline;font-weight:700">click here to send via email</a> / <a href="${WHATSAPP_BASE}" style="text-decoration:underline;font-weight:700">WhatsApp 07900 984900</a>.</p>
          `;
        }
        window.location.href = mailtoUrl;
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Get Fixed-Fee Structural Quote ↗";
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
