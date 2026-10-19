/**
 * BREEAM UK Construction Project Scoring Tool — UI Controller
 * Temporary Works Consulting & Design Ltd (temporaryworksconsulting.com)
 */

import {
  RATING_BANDS,
  SCHEMES,
  CATEGORIES,
  BREEAM_ISSUES,
  PROJECT_PRESETS,
  calculateBreeamScore,
  calculateMan03SiteCredits,
  calculateWst01SiteCredits,
  calculateMat03SiteCredits
} from './breeam-engine.js';

const STORAGE_KEY = 'twc_breeam_project_state_v1';

function createDefaultState() {
  const defaultPreset = PROJECT_PRESETS['commercial-office-excellent'];
  return {
    projectName: 'Thames Valley Gateway — Plot 4B',
    siteAddress: 'Reading, Berkshire (UK)',
    assessorName: 'Principal Contractor / BREEAM AP',
    giaM2: defaultPreset.giaM2,
    contractValueGbp: defaultPreset.contractValueGbp,
    stage: defaultPreset.stage,
    schemeId: defaultPreset.schemeId,
    targetBand: defaultPreset.targetBand,
    timberPrerequisiteMet: defaultPreset.timberPrerequisiteMet,
    activePresetId: defaultPreset.id,
    credits: { ...defaultPreset.credits },
    excluded: {},
    activeTab: 'scorer',
    issueFilter: 'all',
    searchQuery: '',
    openCategories: CATEGORIES.map((c) => c.id),
    siteCalcs: {
      man03: {
        uktrLegalTimberConfirmed: true,
        emsCertified: true,
        sustainabilityChampionAppointed: true,
        ccsScore: 40,
        energyMonitoring: true,
        waterMonitoring: true,
        transportMonitoring: true
      },
      wst01: {
        hasRmp: true,
        wasteTonnesPer100m2: 5.8,
        diversionByWeightPct: 88,
        preDemolitionAuditDone: true,
        recycledAggregatePct: 40
      },
      mat03: {
        allSiteTimberLegalAndCertified: true,
        sustainableProcurementPlan: true,
        rscsPercentage: 42
      }
    }
  };
}

let state = loadInitialState();

function loadInitialState() {
  const base = createDefaultState();

  // Check URL query parameter ?breeam=... first
  try {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('breeam');
    if (encoded) {
      const decoded = JSON.parse(atob(encoded));
      if (decoded && typeof decoded === 'object') {
        return {
          ...base,
          ...decoded,
          credits: { ...base.credits, ...(decoded.credits || {}) },
          excluded: { ...(decoded.excluded || {}) }
        };
      }
    }
  } catch {
    // Ignore malformed URL state
  }

  // Check localStorage
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        return {
          ...base,
          ...parsed,
          credits: { ...base.credits, ...(parsed.credits || {}) },
          excluded: { ...(parsed.excluded || {}) },
          siteCalcs: {
            man03: { ...base.siteCalcs.man03, ...(parsed.siteCalcs?.man03 || {}) },
            wst01: { ...base.siteCalcs.wst01, ...(parsed.siteCalcs?.wst01 || {}) },
            mat03: { ...base.siteCalcs.mat03, ...(parsed.siteCalcs?.mat03 || {}) }
          }
        };
      }
    }
  } catch {
    // Ignore storage read errors
  }

  return base;
}

function saveState() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

function showToast(message) {
  let toast = document.getElementById('breeam-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'breeam-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.style.cssText =
      'position:fixed;bottom:24px;right:24px;z-index:9999;background:#0B0C0E;color:#F3EEE4;border:1px solid #C6A15B;border-left:4px solid #2A9B96;padding:12px 18px;border-radius:4px;font-size:13.5px;font-weight:600;box-shadow:0 16px 36px rgba(0,0,0,0.45);transition:opacity 0.2s ease;';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
  }, 3400);
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatGbp(val) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0
  }).format(num);
}

export function initBreeamApp() {
  bindSetupInputs();
  bindTabControls();
  bindFilterControls();
  bindActionButtons();
  bindSiteCalculators();
  syncSetupDomFromState();
  renderAll();
}

function bindSetupInputs() {
  const fields = [
    ['input-project-name', 'projectName', (v) => v],
    ['input-site-address', 'siteAddress', (v) => v],
    ['input-assessor', 'assessorName', (v) => v],
    ['input-gia', 'giaM2', (v) => Math.max(0, Number(v) || 0)],
    ['input-contract-value', 'contractValueGbp', (v) => Math.max(0, Number(v) || 0)],
    ['select-stage', 'stage', (v) => v],
    ['select-scheme', 'schemeId', (v) => v],
    ['select-target-band', 'targetBand', (v) => v]
  ];

  for (const [id, key, transform] of fields) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.addEventListener('input', (e) => {
      state[key] = transform(e.target.value);
      state.activePresetId = 'custom';
      saveState();
      renderAll();
    });
    el.addEventListener('change', (e) => {
      state[key] = transform(e.target.value);
      state.activePresetId = 'custom';
      saveState();
      renderAll();
    });
  }

  const timberCheckbox = document.getElementById('check-timber-prereq');
  if (timberCheckbox) {
    timberCheckbox.addEventListener('change', (e) => {
      state.timberPrerequisiteMet = Boolean(e.target.checked);
      state.siteCalcs.man03.uktrLegalTimberConfirmed = state.timberPrerequisiteMet;
      state.siteCalcs.mat03.allSiteTimberLegalAndCertified = state.timberPrerequisiteMet;
      state.activePresetId = 'custom';
      saveState();
      renderAll();
    });
  }

  document.querySelectorAll('[data-preset-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const presetId = btn.getAttribute('data-preset-id');
      const preset = PROJECT_PRESETS[presetId];
      if (!preset) return;
      state.activePresetId = preset.id;
      state.schemeId = preset.schemeId;
      state.targetBand = preset.targetBand;
      state.giaM2 = preset.giaM2;
      state.contractValueGbp = preset.contractValueGbp;
      state.stage = preset.stage;
      state.timberPrerequisiteMet = preset.timberPrerequisiteMet;
      state.credits = { ...preset.credits };
      state.excluded = {};
      syncSetupDomFromState();
      saveState();
      renderAll();
      showToast(`Loaded preset: ${preset.name}`);
    });
  });
}

function syncSetupDomFromState() {
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val;
  };
  setVal('input-project-name', state.projectName);
  setVal('input-site-address', state.siteAddress);
  setVal('input-assessor', state.assessorName);
  setVal('input-gia', state.giaM2);
  setVal('input-contract-value', state.contractValueGbp);
  setVal('select-stage', state.stage);
  setVal('select-scheme', state.schemeId);
  setVal('select-target-band', state.targetBand);

  const timberCheckbox = document.getElementById('check-timber-prereq');
  if (timberCheckbox) {
    timberCheckbox.checked = Boolean(state.timberPrerequisiteMet);
  }

  document.querySelectorAll('[data-preset-id]').forEach((btn) => {
    const isMatch = btn.getAttribute('data-preset-id') === state.activePresetId;
    btn.classList.toggle('is-active', isMatch);
  });
}

function bindTabControls() {
  document.querySelectorAll('[data-tab-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab-target');
      state.activeTab = tab;
      saveState();
      renderTabs();
    });
  });
}

function renderTabs() {
  document.querySelectorAll('[data-tab-target]').forEach((btn) => {
    const isCurrent = btn.getAttribute('data-tab-target') === state.activeTab;
    btn.classList.toggle('is-active', isCurrent);
    btn.setAttribute('aria-selected', String(isCurrent));
  });

  document.querySelectorAll('[data-tab-panel]').forEach((panel) => {
    const isCurrent = panel.getAttribute('data-tab-panel') === state.activeTab;
    panel.hidden = !isCurrent;
  });
}

function bindFilterControls() {
  document.querySelectorAll('[data-issue-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.issueFilter = btn.getAttribute('data-issue-filter');
      document.querySelectorAll('[data-issue-filter]').forEach((b) => {
        b.classList.toggle('is-active', b === btn);
      });
      renderScorerCategories(lastResult);
    });
  });

  const searchEl = document.getElementById('input-issue-search');
  if (searchEl) {
    searchEl.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim().toLowerCase();
      renderScorerCategories(lastResult);
      renderAuditTable(lastResult);
    });
  }

  const expandAllBtn = document.getElementById('btn-toggle-all-cats');
  if (expandAllBtn) {
    expandAllBtn.addEventListener('click', () => {
      if (state.openCategories.length === CATEGORIES.length) {
        state.openCategories = [];
      } else {
        state.openCategories = CATEGORIES.map((c) => c.id);
      }
      renderScorerCategories(lastResult);
    });
  }
}

function bindActionButtons() {
  const autoFixBtn = document.getElementById('btn-autofix-gates');
  if (autoFixBtn) {
    autoFixBtn.addEventListener('click', () => {
      autoFixMinimumStandards();
    });
  }

  const resetBtn = document.getElementById('btn-reset-default');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      state = createDefaultState();
      syncSetupDomFromState();
      saveState();
      renderAll();
      showToast('Reset project to Commercial Office (Target: Excellent) baseline.');
    });
  }

  const csvBtn = document.getElementById('btn-export-csv');
  if (csvBtn) {
    csvBtn.addEventListener('click', () => exportCsv(lastResult));
  }

  const shareBtn = document.getElementById('btn-share-link');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => shareProjectLink());
  }

  const printBtn = document.getElementById('btn-print-report');
  if (printBtn) {
    printBtn.addEventListener('click', () => window.print());
  }
}

function autoFixMinimumStandards() {
  const res = calculateBreeamScore({
    schemeId: state.schemeId,
    targetBand: state.targetBand,
    credits: state.credits,
    excluded: state.excluded,
    timberPrerequisiteMet: state.timberPrerequisiteMet
  });

  let fixedCount = 0;
  if (!state.timberPrerequisiteMet) {
    state.timberPrerequisiteMet = true;
    const timberCheckbox = document.getElementById('check-timber-prereq');
    if (timberCheckbox) timberCheckbox.checked = true;
    fixedCount++;
  }

  for (const failure of res.targetMinStandards.failures) {
    if (failure.issueId && typeof failure.requiredCredits === 'number') {
      const current = Number(state.credits[failure.issueId] ?? 0);
      if (current < failure.requiredCredits) {
        state.credits[failure.issueId] = failure.requiredCredits;
        fixedCount++;
      }
    }
  }

  saveState();
  renderAll();
  if (fixedCount > 0) {
    showToast(`Unlocked ${fixedCount} mandatory Minimum Standard gate(s) for ${res.targetBandObj.label}.`);
  } else {
    showToast(`All mandatory Minimum Standards for ${res.targetBandObj.label} are already satisfied.`);
  }
}

let lastResult = null;

function renderAll() {
  renderTabs();

  const result = calculateBreeamScore({
    schemeId: state.schemeId,
    targetBand: state.targetBand,
    credits: state.credits,
    excluded: state.excluded,
    timberPrerequisiteMet: state.timberPrerequisiteMet
  });
  lastResult = result;

  renderScoreboard(result);
  renderMinStandardsBanner(result);
  renderScorerCategories(result);
  renderSidePanel(result);
  renderSiteCalculators();
  renderAuditTable(result);
  updateConsultationLinks(result);
}

function renderScoreboard(result) {
  const totalScoreEl = document.getElementById('metric-total-score');
  if (totalScoreEl) {
    totalScoreEl.textContent = `${result.totalScore.toFixed(2)}%`;
  }

  const baseBreakdownEl = document.getElementById('metric-score-sub');
  if (baseBreakdownEl) {
    baseBreakdownEl.textContent = `${result.baseWeightedScore.toFixed(2)}% base + ${result.innovationScore.toFixed(1)}% innovation`;
  }

  const certifiedBandEl = document.getElementById('metric-certified-band');
  if (certifiedBandEl) {
    certifiedBandEl.textContent = result.certifiedBand.label.toUpperCase();
    certifiedBandEl.style.color = result.certifiedBand.color;
  }

  const certifiedStarsEl = document.getElementById('metric-certified-stars');
  if (certifiedStarsEl) {
    if (result.isDowngradedByMinStandards) {
      certifiedStarsEl.innerHTML = `<span class="rating-pill rating-pill--warn">CAPPED FROM ${escapeHtml(result.scoreBand.label.toUpperCase())}</span>`;
    } else {
      certifiedStarsEl.innerHTML = `<span class="rating-pill rating-pill--pass">${escapeHtml(result.certifiedBand.stars)} CERTIFIED GATE PASS</span>`;
    }
  }

  const targetGapEl = document.getElementById('metric-target-gap');
  const targetGapSubEl = document.getElementById('metric-target-sub');
  if (targetGapEl && targetGapSubEl) {
    if (result.gapToTargetPct > 0) {
      targetGapEl.textContent = `-${result.gapToTargetPct.toFixed(2)}%`;
      targetGapEl.style.color = '#FF9C97';
      targetGapSubEl.textContent = `Short of ${result.targetBandObj.label} (${result.targetBandObj.minScore}% threshold)`;
    } else {
      targetGapEl.textContent = `+${result.marginAboveTargetPct.toFixed(2)}%`;
      targetGapEl.style.color = '#5CE09B';
      targetGapSubEl.textContent = `Buffer above ${result.targetBandObj.label} (${result.targetBandObj.minScore}% threshold)`;
    }
  }

  const contractorShareEl = document.getElementById('metric-contractor-share');
  const contractorSubEl = document.getElementById('metric-contractor-sub');
  if (contractorShareEl && contractorSubEl) {
    const c = result.ownerSummary.contractor;
    contractorShareEl.textContent = `${c.achievedPct.toFixed(1)}% / ${c.availablePct.toFixed(1)}%`;
    contractorSubEl.textContent = `Principal Contractor & Temporary Works (${c.achievedCredits}/${c.availableCredits} credits)`;
  }
}

function renderMinStandardsBanner(result) {
  const banner = document.getElementById('min-standards-banner');
  const titleEl = document.getElementById('min-standards-title');
  const listEl = document.getElementById('min-standards-list');
  const autoFixBtn = document.getElementById('btn-autofix-gates');
  if (!banner || !titleEl || !listEl) return;

  const failures = result.targetMinStandards.failures;
  if (failures.length === 0) {
    banner.classList.remove('is-failing');
    titleEl.innerHTML = `Mandatory Minimum Standards Gate: <strong>PASSED</strong> for target <strong>${escapeHtml(result.targetBandObj.label)} (${result.targetBandObj.minScore}%+)</strong>`;
    listEl.innerHTML = '';
    listEl.hidden = true;
    if (autoFixBtn) autoFixBtn.hidden = true;
  } else {
    banner.classList.add('is-failing');
    titleEl.innerHTML = `Mandatory Minimum Standards Alert: <strong>${failures.length} Gate Failure(s)</strong> blocking <strong>${escapeHtml(result.targetBandObj.label)}</strong> certification`;
    listEl.hidden = false;
    listEl.innerHTML = failures
      .map(
        (f) =>
          `<li><strong>${escapeHtml(f.issueId)} — ${escapeHtml(f.title)}:</strong> Achieved <code>${escapeHtml(f.achievedCredits)}</code> / Required <code>${escapeHtml(f.requiredCredits)}</code>. ${escapeHtml(f.note)}</li>`
      )
      .join('');
    if (autoFixBtn) autoFixBtn.hidden = false;
  }
}

function renderScorerCategories(result) {
  const container = document.getElementById('categories-accordion-root');
  if (!container) return;

  const filter = state.issueFilter;
  const query = state.searchQuery;

  const htmlParts = [];

  for (const cat of result.categories) {
    const catIssues = result.issues.filter((issue) => {
      if (issue.category !== cat.id) return false;
      if (filter === 'contractor' && issue.owner !== 'contractor') return false;
      if (filter === 'tw' && !issue.twLink) return false;
      if (filter === 'gates' && Object.keys(issue.minStandards || {}).length === 0 && !issue.prerequisiteLabel) {
        return false;
      }
      if (filter === 'unachieved' && issue.remainingCredits <= 0) return false;
      if (query) {
        const hay = `${issue.id} ${issue.title} ${issue.evidenceRequired} ${issue.twNote || ''}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });

    if (catIssues.length === 0) continue;

    const isOpen = state.openCategories.includes(cat.id);
    const weightLabel = cat.isAdditive
      ? `Additive Max +${cat.effectiveWeight.toFixed(1)}%`
      : `Weight ${cat.effectiveWeight.toFixed(1)}%`;

    htmlParts.push(`
      <details class="cat-section" data-cat-id="${escapeHtml(cat.id)}" ${isOpen ? 'open' : ''}>
        <summary class="cat-section-head">
          <div class="cat-head-left">
            <span class="cat-code-badge">${escapeHtml(cat.code)}</span>
            <div class="cat-head-title">
              <h3>${escapeHtml(cat.name)}</h3>
              <p>${escapeHtml(cat.summary)}</p>
            </div>
          </div>
          <div class="cat-head-metrics">
            <span>${cat.achievedCredits}/${cat.availableCredits} cr (${cat.percentageAchieved.toFixed(0)}%)</span>
            <span>|</span>
            <span>${weightLabel}</span>
            <span>|</span>
            <span class="cat-head-weighted">+${cat.weightedContribution.toFixed(2)}%</span>
          </div>
        </summary>
        <div class="cat-site-note">
          <strong>Temporary Works &amp; Site Focus:</strong> ${escapeHtml(cat.siteNote)}
        </div>
        <div class="issue-list">
          ${catIssues.map((issue) => renderIssueRow(issue, result.targetBandObj.id)).join('')}
        </div>
      </details>
    `);
  }

  if (htmlParts.length === 0) {
    container.innerHTML = `
      <div class="panel-box" style="background:#FAF7F1;color:#11161D;border-color:#D9D4C9;">
        <p>No BREEAM issues match the current filter/search criteria. Reset the filter pills above to view all 43 issues.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = htmlParts.join('');

  // Bind details open/close state
  container.querySelectorAll('details.cat-section').forEach((det) => {
    det.addEventListener('toggle', () => {
      const catId = det.getAttribute('data-cat-id');
      if (det.open) {
        if (!state.openCategories.includes(catId)) state.openCategories.push(catId);
      } else {
        state.openCategories = state.openCategories.filter((id) => id !== catId);
      }
    });
  });

  // Bind credit steppers, number inputs, sliders, and N/A toggles
  container.querySelectorAll('[data-step-issue]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const issueId = btn.getAttribute('data-step-issue');
      const delta = Number(btn.getAttribute('data-step-delta'));
      const issueObj = BREEAM_ISSUES.find((i) => i.id === issueId);
      if (!issueObj) return;
      const current = Number(state.credits[issueId] ?? 0);
      const next = Math.max(0, Math.min(issueObj.maxCredits, current + delta));
      state.credits[issueId] = next;
      state.activePresetId = 'custom';
      saveState();
      renderAll();
    });
  });

  container.querySelectorAll('[data-credit-input]').forEach((inp) => {
    inp.addEventListener('change', (e) => {
      const issueId = inp.getAttribute('data-credit-input');
      const issueObj = BREEAM_ISSUES.find((i) => i.id === issueId);
      if (!issueObj) return;
      const next = Math.max(0, Math.min(issueObj.maxCredits, Math.round(Number(e.target.value) || 0)));
      state.credits[issueId] = next;
      state.activePresetId = 'custom';
      saveState();
      renderAll();
    });
  });

  container.querySelectorAll('[data-credit-slider]').forEach((slider) => {
    slider.addEventListener('input', (e) => {
      const issueId = slider.getAttribute('data-credit-slider');
      const issueObj = BREEAM_ISSUES.find((i) => i.id === issueId);
      if (!issueObj) return;
      const next = Math.max(0, Math.min(issueObj.maxCredits, Number(e.target.value) || 0));
      state.credits[issueId] = next;
      state.activePresetId = 'custom';
      saveState();
      renderAll();
    });
  });

  container.querySelectorAll('[data-exclude-issue]').forEach((chk) => {
    chk.addEventListener('change', (e) => {
      const issueId = chk.getAttribute('data-exclude-issue');
      state.excluded[issueId] = Boolean(e.target.checked);
      state.activePresetId = 'custom';
      saveState();
      renderAll();
    });
  });
}

function renderIssueRow(issue, targetBandId) {
  const ownerLabel =
    issue.owner === 'contractor'
      ? 'Principal Contractor / Site'
      : issue.owner === 'client'
        ? 'Client / Brief'
        : 'Design Team / MEP / Structural';

  const minRuleForTarget = issue.minStandards?.[targetBandId];
  const minBadge = minRuleForTarget
    ? `<span class="badge-chip badge-chip--min">Mandatory for Target: min ${minRuleForTarget.minCredits ?? 0} cr</span>`
    : '';

  const rowClasses = [
    'issue-row',
    issue.isMinStandardFailureForTarget ? 'is-min-fail' : '',
    issue.twLink ? 'is-tw-linked' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return `
    <div class="${rowClasses}" data-issue-row="${escapeHtml(issue.id)}">
      <div class="issue-top">
        <div>
          <div>
            <span class="issue-id">${escapeHtml(issue.id)}</span>
            <span class="issue-title">${escapeHtml(issue.title)}</span>
          </div>
          <div class="issue-badges">
            <span class="badge-chip ${issue.owner === 'contractor' ? 'badge-chip--contractor' : ''}">${escapeHtml(ownerLabel)}</span>
            <span class="badge-chip">${escapeHtml(issue.stageGate)}</span>
            <span class="badge-chip">${issue.pctPerCredit.toFixed(2)}% per credit</span>
            ${issue.twLink ? '<span class="badge-chip badge-chip--tw">Temporary Works Interface</span>' : ''}
            ${minBadge}
          </div>
        </div>

        <div class="issue-controls">
          <div class="credit-stepper">
            <button type="button" data-step-issue="${escapeHtml(issue.id)}" data-step-delta="-1" aria-label="Decrease ${escapeHtml(issue.id)} credits" ${issue.isExcluded ? 'disabled' : ''}>−</button>
            <input type="number" min="0" max="${issue.maxCredits}" value="${issue.achievedCredits}" data-credit-input="${escapeHtml(issue.id)}" aria-label="${escapeHtml(issue.id)} targeted credits" ${issue.isExcluded ? 'disabled' : ''} />
            <button type="button" data-step-issue="${escapeHtml(issue.id)}" data-step-delta="1" aria-label="Increase ${escapeHtml(issue.id)} credits" ${issue.isExcluded ? 'disabled' : ''}>+</button>
          </div>
          <div class="credit-max-label">
            / ${issue.maxCredits} cr<br/>
            <strong style="color:#1F7470;">+${issue.achievedWeightedPct.toFixed(2)}%</strong>
          </div>
          <label class="badge-chip" style="cursor:pointer;user-select:none;" title="Exclude issue if scoped out of assessment">
            <input type="checkbox" data-exclude-issue="${escapeHtml(issue.id)}" ${issue.isExcluded ? 'checked' : ''} /> N/A
          </label>
        </div>
      </div>

      <input
        type="range"
        class="credit-slider"
        min="0"
        max="${issue.maxCredits}"
        step="1"
        value="${issue.achievedCredits}"
        data-credit-slider="${escapeHtml(issue.id)}"
        aria-label="${escapeHtml(issue.id)} credit slider"
        ${issue.isExcluded ? 'disabled' : ''}
      />

      <div class="issue-meta">
        <strong>Evidence required:</strong> ${escapeHtml(issue.evidenceRequired)}
      </div>
      ${
        issue.twNote
          ? `<div class="issue-tw-callout"><strong>TW &amp; Site Engineering Note:</strong> ${escapeHtml(issue.twNote)}</div>`
          : ''
      }
    </div>
  `;
}

function renderSidePanel(result) {
  const catBarsEl = document.getElementById('side-category-bars');
  if (catBarsEl) {
    catBarsEl.innerHTML = result.categories
      .map((cat) => {
        const pctWidth = Math.min(100, Math.max(0, cat.percentageAchieved));
        return `
          <div class="cat-bar-item">
            <div class="cat-bar-top">
              <span><strong>${escapeHtml(cat.code)}</strong> ${escapeHtml(cat.name)}</span>
              <span>${cat.weightedContribution.toFixed(2)}% / ${cat.effectiveWeight.toFixed(1)}%</span>
            </div>
            <div class="cat-bar-track">
              <div class="cat-bar-fill ${cat.isAdditive ? 'cat-bar-fill--inn' : ''}" style="width:${pctWidth.toFixed(1)}%"></div>
            </div>
          </div>
        `;
      })
      .join('');
  }

  const quickWinsEl = document.getElementById('side-quick-wins');
  if (quickWinsEl) {
    const topWins = result.quickWins.slice(0, 6);
    if (topWins.length === 0) {
      quickWinsEl.innerHTML = `<p style="font-size:13px;color:#B8BDC6;">100% of available credits are currently targeted.</p>`;
    } else {
      quickWinsEl.innerHTML = topWins
        .map((item) => {
          return `
            <div class="quick-win-card ${item.isMinStandardFailureForTarget ? 'is-gate' : ''}">
              <div class="quick-win-info">
                <strong>${escapeHtml(item.id)} — ${escapeHtml(item.title)}</strong>
                <small>
                  ${item.isMinStandardFailureForTarget ? 'MANDATORY GATE · ' : ''}
                  +${item.pctPerCredit.toFixed(2)}% per credit · ${item.remainingCredits} cr available (${escapeHtml(item.owner)})
                </small>
              </div>
              <button type="button" class="btn-add-credit" data-quick-add="${escapeHtml(item.id)}">
                +1 Cr (+${item.pctPerCredit.toFixed(2)}%)
              </button>
            </div>
          `;
        })
        .join('');

      quickWinsEl.querySelectorAll('[data-quick-add]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const issueId = btn.getAttribute('data-quick-add');
          const issueObj = BREEAM_ISSUES.find((i) => i.id === issueId);
          if (!issueObj) return;
          const current = Number(state.credits[issueId] ?? 0);
          if (current < issueObj.maxCredits) {
            state.credits[issueId] = current + 1;
            state.activePresetId = 'custom';
            saveState();
            renderAll();
            showToast(`Added +1 credit to ${issueId} (+${(lastResult.issues.find((x) => x.id === issueId)?.pctPerCredit || 0).toFixed(2)}% weighted score).`);
          }
        });
      });
    }
  }
}

function bindSiteCalculators() {
  // Man 03 inputs
  const manChecks = [
    ['calc-man03-uktr', 'uktrLegalTimberConfirmed'],
    ['calc-man03-ems', 'emsCertified'],
    ['calc-man03-champ', 'sustainabilityChampionAppointed'],
    ['calc-man03-energy', 'energyMonitoring'],
    ['calc-man03-water', 'waterMonitoring'],
    ['calc-man03-transport', 'transportMonitoring']
  ];
  for (const [id, key] of manChecks) {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', (e) => {
        state.siteCalcs.man03[key] = Boolean(e.target.checked);
        saveState();
        renderSiteCalculators();
      });
    }
  }
  const ccsInput = document.getElementById('calc-man03-ccs');
  if (ccsInput) {
    ccsInput.addEventListener('input', (e) => {
      state.siteCalcs.man03.ccsScore = Number(e.target.value) || 0;
      saveState();
      renderSiteCalculators();
    });
  }
  const applyMan03Btn = document.getElementById('btn-apply-man03');
  if (applyMan03Btn) {
    applyMan03Btn.addEventListener('click', () => {
      const calc = calculateMan03SiteCredits(state.siteCalcs.man03);
      state.credits['Man 03'] = calc.credits;
      state.timberPrerequisiteMet = calc.prerequisitePassed;
      if (calc.exemplaryCredit > 0 && (state.credits['Inn 01'] || 0) < 1) {
        state.credits['Inn 01'] = Math.min(10, (state.credits['Inn 01'] || 0) + 1);
      }
      syncSetupDomFromState();
      saveState();
      renderAll();
      showToast(`Applied Man 03 calculator: ${calc.credits}/6 credits assigned to project.`);
    });
  }

  // Wst 01 & Wst 02 inputs
  const wstRmp = document.getElementById('calc-wst-rmp');
  if (wstRmp) {
    wstRmp.addEventListener('change', (e) => {
      state.siteCalcs.wst01.hasRmp = Boolean(e.target.checked);
      saveState();
      renderSiteCalculators();
    });
  }
  const wstAudit = document.getElementById('calc-wst-audit');
  if (wstAudit) {
    wstAudit.addEventListener('change', (e) => {
      state.siteCalcs.wst01.preDemolitionAuditDone = Boolean(e.target.checked);
      saveState();
      renderSiteCalculators();
    });
  }
  const wstTonnes = document.getElementById('calc-wst-tonnes');
  if (wstTonnes) {
    wstTonnes.addEventListener('input', (e) => {
      state.siteCalcs.wst01.wasteTonnesPer100m2 = Number(e.target.value) || 0;
      saveState();
      renderSiteCalculators();
    });
  }
  const wstDiv = document.getElementById('calc-wst-diversion');
  if (wstDiv) {
    wstDiv.addEventListener('input', (e) => {
      state.siteCalcs.wst01.diversionByWeightPct = Number(e.target.value) || 0;
      saveState();
      renderSiteCalculators();
    });
  }
  const wstAgg = document.getElementById('calc-wst-agg');
  if (wstAgg) {
    wstAgg.addEventListener('input', (e) => {
      state.siteCalcs.wst01.recycledAggregatePct = Number(e.target.value) || 0;
      saveState();
      renderSiteCalculators();
    });
  }
  const applyWstBtn = document.getElementById('btn-apply-wst');
  if (applyWstBtn) {
    applyWstBtn.addEventListener('click', () => {
      const calc = calculateWst01SiteCredits(state.siteCalcs.wst01);
      state.credits['Wst 01'] = calc.wst01Credits;
      state.credits['Wst 02'] = calc.wst02Credits;
      saveState();
      renderAll();
      showToast(`Applied Waste & Platform calculator: Wst 01 (${calc.wst01Credits}/5) & Wst 02 (${calc.wst02Credits}/1).`);
    });
  }

  // Mat 03 inputs
  const matTimber = document.getElementById('calc-mat03-timber');
  if (matTimber) {
    matTimber.addEventListener('change', (e) => {
      state.siteCalcs.mat03.allSiteTimberLegalAndCertified = Boolean(e.target.checked);
      saveState();
      renderSiteCalculators();
    });
  }
  const matPlan = document.getElementById('calc-mat03-plan');
  if (matPlan) {
    matPlan.addEventListener('change', (e) => {
      state.siteCalcs.mat03.sustainableProcurementPlan = Boolean(e.target.checked);
      saveState();
      renderSiteCalculators();
    });
  }
  const matRscs = document.getElementById('calc-mat03-rscs');
  if (matRscs) {
    matRscs.addEventListener('input', (e) => {
      state.siteCalcs.mat03.rscsPercentage = Number(e.target.value) || 0;
      saveState();
      renderSiteCalculators();
    });
  }
  const applyMat03Btn = document.getElementById('btn-apply-mat03');
  if (applyMat03Btn) {
    applyMat03Btn.addEventListener('click', () => {
      const calc = calculateMat03SiteCredits(state.siteCalcs.mat03);
      state.credits['Mat 03'] = calc.credits;
      state.timberPrerequisiteMet = calc.prerequisitePassed;
      syncSetupDomFromState();
      saveState();
      renderAll();
      showToast(`Applied Mat 03 calculator: ${calc.credits}/4 credits & timber prerequisite updated.`);
    });
  }
}

function renderSiteCalculators() {
  // Sync Man 03 DOM
  const m = state.siteCalcs.man03;
  const setChk = (id, v) => {
    const el = document.getElementById(id);
    if (el) el.checked = Boolean(v);
  };
  const setNum = (id, v) => {
    const el = document.getElementById(id);
    if (el && document.activeElement !== el) el.value = v;
  };

  setChk('calc-man03-uktr', m.uktrLegalTimberConfirmed);
  setChk('calc-man03-ems', m.emsCertified);
  setChk('calc-man03-champ', m.sustainabilityChampionAppointed);
  setChk('calc-man03-energy', m.energyMonitoring);
  setChk('calc-man03-water', m.waterMonitoring);
  setChk('calc-man03-transport', m.transportMonitoring);
  setNum('calc-man03-ccs', m.ccsScore);

  const manRes = calculateMan03SiteCredits(m);
  const manScoreEl = document.getElementById('out-man03-score');
  const manListEl = document.getElementById('out-man03-list');
  if (manScoreEl) {
    manScoreEl.textContent = `${manRes.credits} / 6 Credits${manRes.exemplaryCredit ? ' (+1 Inn)' : ''}`;
  }
  if (manListEl) {
    manListEl.innerHTML = manRes.breakdown.map((line) => `<li>${escapeHtml(line)}</li>`).join('');
  }

  // Sync Wst 01 & Wst 02 DOM
  const w = state.siteCalcs.wst01;
  setChk('calc-wst-rmp', w.hasRmp);
  setChk('calc-wst-audit', w.preDemolitionAuditDone);
  setNum('calc-wst-tonnes', w.wasteTonnesPer100m2);
  setNum('calc-wst-diversion', w.diversionByWeightPct);
  setNum('calc-wst-agg', w.recycledAggregatePct);

  const wstRes = calculateWst01SiteCredits(w);
  const wstScoreEl = document.getElementById('out-wst-score');
  const wstListEl = document.getElementById('out-wst-list');
  if (wstScoreEl) {
    wstScoreEl.textContent = `Wst 01: ${wstRes.wst01Credits}/5 · Wst 02: ${wstRes.wst02Credits}/1`;
  }
  if (wstListEl) {
    wstListEl.innerHTML = wstRes.breakdown.map((line) => `<li>${escapeHtml(line)}</li>`).join('');
  }

  // Sync Mat 03 DOM
  const mat = state.siteCalcs.mat03;
  setChk('calc-mat03-timber', mat.allSiteTimberLegalAndCertified);
  setChk('calc-mat03-plan', mat.sustainableProcurementPlan);
  setNum('calc-mat03-rscs', mat.rscsPercentage);

  const matRes = calculateMat03SiteCredits(mat);
  const matScoreEl = document.getElementById('out-mat03-score');
  const matListEl = document.getElementById('out-mat03-list');
  if (matScoreEl) {
    matScoreEl.textContent = `${matRes.credits} / 4 Credits${matRes.prerequisitePassed ? '' : ' (BLOCKED)'}`;
  }
  if (matListEl) {
    matListEl.innerHTML = matRes.breakdown.map((line) => `<li>${escapeHtml(line)}</li>`).join('');
  }
}

function renderAuditTable(result) {
  const tbody = document.getElementById('audit-table-body');
  if (!tbody) return;

  const query = state.searchQuery;
  const rows = result.issues.filter((i) => {
    if (!query) return true;
    const hay = `${i.id} ${i.title} ${i.evidenceRequired} ${i.twNote || ''}`.toLowerCase();
    return hay.includes(query);
  });

  tbody.innerHTML = rows
    .map((i) => {
      const statusBadge = i.isExcluded
        ? '<span class="badge-chip">Excluded (N/A)</span>'
        : i.isMinStandardFailureForTarget
          ? '<span class="badge-chip badge-chip--min">GATE FAIL</span>'
          : i.achievedCredits > 0
            ? '<span class="badge-chip badge-chip--tw">Targeted</span>'
            : '<span class="badge-chip">0 Targeted</span>';

      return `
        <tr>
          <td><strong>${escapeHtml(i.id)}</strong><br/><small>${escapeHtml(i.category)}</small></td>
          <td>
            <strong>${escapeHtml(i.title)}</strong>
            ${i.twLink ? '<div style="margin-top:4px;"><span class="badge-chip badge-chip--tw">TW Interface</span></div>' : ''}
          </td>
          <td style="font-family:var(--tw-mono);font-weight:700;">
            ${i.isExcluded ? 'N/A' : `${i.achievedCredits} / ${i.maxCredits}`}<br/>
            <small style="color:#1F7470;">+${i.achievedWeightedPct.toFixed(2)}%</small>
          </td>
          <td>${escapeHtml(i.stageGate)}<br/><small>${escapeHtml(i.owner.toUpperCase())}</small></td>
          <td>${escapeHtml(i.evidenceRequired)}</td>
          <td>${escapeHtml(i.twNote || 'Standard permanent works specification & QA sign-off.')}</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    })
    .join('');
}

function updateConsultationLinks(result) {
  const summaryText = [
    `Hello David, I have run a BREEAM pre-assessment on temporaryworksconsulting.com for "${state.projectName}" (${state.siteAddress}).`,
    `Scheme: ${result.scheme.shortName}`,
    `Current Score: ${result.totalScore.toFixed(2)}% (${result.certifiedBand.label}) vs Target: ${result.targetBandObj.label} (${result.targetBandObj.minScore}%).`,
    `Principal Contractor / TW Credits: ${result.ownerSummary.contractor.achievedCredits}/${result.ownerSummary.contractor.availableCredits} (${result.ownerSummary.contractor.achievedPct.toFixed(1)}%).`,
    `We would like to discuss temporary works engineering (BR 470 piling platforms / propping / RAMS / BREEAM site evidence).`
  ].join(' ');

  const waBtn = document.getElementById('cta-whatsapp-breeam');
  if (waBtn) {
    waBtn.href = `https://wa.me/447900984900?text=${encodeURIComponent(summaryText)}`;
  }

  const mailBtn = document.getElementById('cta-email-breeam');
  if (mailBtn) {
    mailBtn.href = `mailto:david@temporaryworksconsulting.com?subject=${encodeURIComponent(`BREEAM & Temporary Works Enquiry — ${state.projectName} (${result.totalScore.toFixed(1)}%)`)}&body=${encodeURIComponent(summaryText)}`;
  }
}

function exportCsv(result) {
  if (!result) return;
  const headers = [
    'Issue ID',
    'Category',
    'Title',
    'Owner',
    'RIBA Stage Gate',
    'Targeted Credits',
    'Max Credits',
    'Weighted % Per Credit',
    'Weighted % Achieved',
    'Temporary Works Interface',
    'Evidence Required',
    'Temporary Works Note'
  ];

  const escapeCsv = (val) => {
    const str = String(val ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };

  const lines = [
    `# BREEAM UK Construction Project Scoring Schedule — Temporary Works Consulting & Design Ltd`,
    `# Project: ${state.projectName} | Location: ${state.siteAddress} | GIA: ${state.giaM2} m2 | Value: ${formatGbp(state.contractValueGbp)}`,
    `# Scheme: ${result.scheme.name} | Total Score: ${result.totalScore.toFixed(2)}% | Certified Rating: ${result.certifiedBand.label}`,
    headers.map(escapeCsv).join(',')
  ];

  for (const item of result.issues) {
    lines.push(
      [
        item.id,
        item.category,
        item.title,
        item.owner,
        item.stageGate,
        item.isExcluded ? 'N/A' : item.achievedCredits,
        item.maxCredits,
        item.pctPerCredit.toFixed(2),
        item.achievedWeightedPct.toFixed(2),
        item.twLink ? 'YES' : 'NO',
        item.evidenceRequired,
        item.twNote || ''
      ]
        .map(escapeCsv)
        .join(',')
    );
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const slug = state.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';
  a.href = url;
  a.download = `breeam-score-${slug}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('Exported BREEAM credit & temporary works schedule (.csv).');
}

function shareProjectLink() {
  try {
    const payload = {
      projectName: state.projectName,
      siteAddress: state.siteAddress,
      giaM2: state.giaM2,
      contractValueGbp: state.contractValueGbp,
      stage: state.stage,
      schemeId: state.schemeId,
      targetBand: state.targetBand,
      timberPrerequisiteMet: state.timberPrerequisiteMet,
      credits: state.credits,
      excluded: state.excluded
    };
    const encoded = btoa(JSON.stringify(payload));
    const shareUrl = `${window.location.origin}${window.location.pathname}?breeam=${encodeURIComponent(encoded)}`;
    window.history.replaceState({}, '', `?breeam=${encodeURIComponent(encoded)}`);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl);
    }
    showToast('Shareable project URL updated and copied to clipboard.');
  } catch {
    showToast('Updated URL with current BREEAM project state.');
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBreeamApp);
  } else {
    initBreeamApp();
  }
}
