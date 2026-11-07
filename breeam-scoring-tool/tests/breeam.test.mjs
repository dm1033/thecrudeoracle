import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  RATING_BANDS,
  SCHEMES,
  CATEGORIES,
  BREEAM_ISSUES,
  PROJECT_PRESETS,
  getScoreBand,
  checkMinimumStandardsForBand,
  calculateBreeamScore,
  calculateMan03SiteCredits,
  calculateWst01SiteCredits,
  calculateMat03SiteCredits
} from '../assets/breeam-engine.js';
import {
  encodeSharePayload,
  decodeSharePayload,
  TAB_ALIAS_MAP,
  PRESET_ALIAS_MAP
} from '../assets/app.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

describe('BREEAM UK Scoring Engine — Core Weights & Catalogue', () => {
  test('All 5 BREEAM schemes have environmental weights summing to 100%', () => {
    const envCats = CATEGORIES.filter((c) => c.id !== 'Inn').map((c) => c.id);
    for (const [schemeId, scheme] of Object.entries(SCHEMES)) {
      const sum = envCats.reduce((acc, catId) => acc + (scheme.weights[catId] || 0), 0);
      assert.equal(
        Math.round(sum * 100) / 100,
        100,
        `Scheme ${schemeId} environmental weights should sum to 100%, got ${sum}`
      );
      assert.equal(scheme.weights.Inn, 10, `Scheme ${schemeId} should have 10% additive Innovation cap`);
    }
  });

  test('Catalogue contains all 10 categories and 43 BREEAM issues with valid metadata', () => {
    assert.equal(CATEGORIES.length, 10);
    assert.equal(BREEAM_ISSUES.length, 43);

    for (const issue of BREEAM_ISSUES) {
      assert.ok(issue.id, 'Issue must have id');
      assert.ok(issue.title, `Issue ${issue.id} must have title`);
      assert.ok(issue.maxCredits > 0, `Issue ${issue.id} must have positive maxCredits`);
      assert.ok(['contractor', 'design', 'client'].includes(issue.owner), `Issue ${issue.id} must have valid owner`);
      assert.ok(issue.evidenceRequired.length > 10, `Issue ${issue.id} must specify evidenceRequired`);
    }
  });

  test('getScoreBand returns accurate BREEAM rating bands at exact thresholds', () => {
    assert.equal(getScoreBand(85.0).id, 'outstanding');
    assert.equal(getScoreBand(84.99).id, 'excellent');
    assert.equal(getScoreBand(70.0).id, 'excellent');
    assert.equal(getScoreBand(69.9).id, 'very_good');
    assert.equal(getScoreBand(55.0).id, 'very_good');
    assert.equal(getScoreBand(45.0).id, 'good');
    assert.equal(getScoreBand(30.0).id, 'pass');
    assert.equal(getScoreBand(29.99).id, 'unclassified');
  });
});

describe('BREEAM UK Scoring Engine — Project Presets & Minimum Standards Gates', () => {
  test('Commercial Office Excellent preset achieves >=70% and passes all Excellent minimum standards', () => {
    const preset = PROJECT_PRESETS['commercial-office-excellent'];
    const res = calculateBreeamScore(preset);
    assert.ok(res.totalScore >= 70, `Expected score >= 70%, got ${res.totalScore}%`);
    assert.equal(res.scoreBand.id, 'excellent');
    assert.equal(res.certifiedBand.id, 'excellent');
    assert.equal(res.isDowngradedByMinStandards, false);
    assert.equal(res.targetMinStandards.passed, true);
  });

  test('Data Centre Outstanding preset achieves >=85% and passes all Outstanding minimum standards', () => {
    const preset = PROJECT_PRESETS['data-centre-outstanding'];
    const res = calculateBreeamScore(preset);
    assert.ok(res.totalScore >= 85, `Expected score >= 85%, got ${res.totalScore}%`);
    assert.equal(res.certifiedBand.id, 'outstanding');
    assert.equal(res.isDowngradedByMinStandards, false);
  });

  test('At-Risk Rescue Audit preset demonstrates mandatory minimum standard downgrade despite high raw score', () => {
    const preset = PROJECT_PRESETS['at-risk-rescue-audit'];
    const res = calculateBreeamScore(preset);
    assert.equal(res.targetMinStandards.passed, false);
    assert.ok(res.targetMinStandards.failures.length >= 4, 'Should flag Man 03, Man 05, Ene 01, Wst 03 failures');

    // Fixing the minimum standard failures unlocks Excellent
    const fixedCredits = {
      ...preset.credits,
      'Man 03': 3,
      'Man 05': 1,
      'Ene 01': 6,
      'Wst 03': 1
    };
    const fixedRes = calculateBreeamScore({
      ...preset,
      credits: fixedCredits
    });
    assert.equal(fixedRes.targetMinStandards.passed, true);
    assert.equal(fixedRes.certifiedBand.id, 'excellent');
  });

  test('Failing the UKTR Legal Timber Prerequisite blocks all certification bands (downgrades to Unclassified)', () => {
    const preset = PROJECT_PRESETS['commercial-office-excellent'];
    const res = calculateBreeamScore({
      ...preset,
      timberPrerequisiteMet: false
    });
    assert.ok(res.totalScore >= 70);
    assert.equal(res.certifiedBand.id, 'unclassified');
    assert.equal(res.isDowngradedByMinStandards, true);
  });
});

describe('BREEAM Site & Temporary Works Calculators (Man 03, Wst 01/02, Mat 03)', () => {
  test('Man 03 calculator computes 6 credits + 1 Exemplary credit when CCS >= 40 and logs are complete', () => {
    const res = calculateMan03SiteCredits({
      uktrLegalTimberConfirmed: true,
      emsCertified: true,
      sustainabilityChampionAppointed: true,
      ccsScore: 41,
      energyMonitoring: true,
      waterMonitoring: true,
      transportMonitoring: true
    });
    assert.equal(res.prerequisitePassed, true);
    assert.equal(res.credits, 6);
    assert.equal(res.exemplaryCredit, 1);
  });

  test('Wst 01 & Wst 02 calculator awards construction waste and BR 470 recycled aggregate credits', () => {
    const res = calculateWst01SiteCredits({
      hasRmp: true,
      wasteTonnesPer100m2: 3.1,
      diversionByWeightPct: 88,
      preDemolitionAuditDone: true,
      recycledAggregatePct: 40
    });
    assert.equal(res.wst01Credits, 5);
    assert.equal(res.wst02Credits, 1);
    assert.equal(res.exemplaryCredit, 1);
  });

  test('Mat 03 calculator enforces temporary works timber Chain-of-Custody gate', () => {
    const failRes = calculateMat03SiteCredits({
      allSiteTimberLegalAndCertified: false,
      sustainableProcurementPlan: true,
      rscsPercentage: 50
    });
    assert.equal(failRes.prerequisitePassed, false);
    assert.equal(failRes.credits, 0);

    const passRes = calculateMat03SiteCredits({
      allSiteTimberLegalAndCertified: true,
      sustainableProcurementPlan: true,
      rscsPercentage: 40
    });
    assert.equal(passRes.prerequisitePassed, true);
    assert.equal(passRes.credits, 4);
  });
});

describe('Temporary Works Consulting Integration & HTML Structure', () => {
  test('index.html and all required assets exist and attach to temporaryworksconsulting.com', () => {
    const indexPath = resolve(rootDir, 'index.html');
    assert.ok(existsSync(indexPath), 'index.html must exist');
    const html = readFileSync(indexPath, 'utf8');

    assert.ok(html.includes('https://www.temporaryworksconsulting.com/'), 'Must link to temporaryworksconsulting.com');
    assert.ok(html.includes('Temporary Works Consulting &amp; Design Ltd'), 'Must include TWC company name');
    assert.ok(html.includes('David J. Miller'), 'Must reference David J. Miller MSc CEng MICE');
    assert.ok(html.includes('hub-primary-live-tab'), 'Must include live BREEAM Scorer tab in primary header navigation');
    assert.ok(html.includes('id="categories-accordion-root"'), 'Must include scorer mount point');
    assert.ok(html.includes('id="audit-table-body"'), 'Must include audit table mount point');
  });

  test('twc-site-integration pages include live BREEAM Scorer tab and catalogue card for temporaryworksconsulting.com', () => {
    const twcIndex = readFileSync(resolve(rootDir, 'twc-site-integration/index.html'), 'utf8');
    const twcTools = readFileSync(resolve(rootDir, 'twc-site-integration/tools.html'), 'utf8');
    const twcSeats = readFileSync(resolve(rootDir, 'twc-site-integration/seatsprep.html'), 'utf8');
    const svgThumb = resolve(rootDir, 'twc-site-integration/assets/images/tools/breeam-scorer.svg');

    assert.ok(existsSync(svgThumb), 'breeam-scorer.svg thumbnail must exist');
    assert.ok(twcIndex.includes('<a href="/breeam-scoring-tool/">BREEAM Scorer</a>'), 'Homepage header must include live BREEAM Scorer tab');
    assert.ok(twcIndex.includes('data-thumbnail="breeam-scorer"'), 'Homepage catalogue must include BREEAM Scorer card');
    assert.ok(twcTools.includes('<a href="/breeam-scoring-tool/">BREEAM Scorer</a>'), 'Tools hub header must include live BREEAM Scorer tab');
    assert.ok(twcTools.includes('data-thumbnail="breeam-scorer"'), 'Tools hub catalogue must include BREEAM Scorer card');
    assert.ok(twcSeats.includes('/breeam-scoring-tool/'), 'SEATS & BREEAM page must link directly to BREEAM Scorer');
  });

  test('Shareable link encoder handles em dashes and non-ASCII characters safely', () => {
    const payload = {
      projectName: 'Thames Valley Gateway — Plot 4B (£24.5m)',
      stage: 'RIBA Stage 3–4 (Technical Design)'
    };
    const encoded = encodeSharePayload(payload);
    const decoded = decodeSharePayload(encoded);
    assert.deepEqual(decoded, payload);
  });

  test('Tab aliases and preset aliases map to valid rendered IDs and PROJECT_PRESETS keys', () => {
    for (const target of Object.values(TAB_ALIAS_MAP)) {
      assert.ok(['scorer', 'calculators', 'audit'].includes(target), `Invalid tab target ${target}`);
    }
    for (const presetId of Object.values(PRESET_ALIAS_MAP)) {
      assert.ok(PROJECT_PRESETS[presetId], `Alias mapped to nonexistent preset ${presetId}`);
    }
  });

  test('All preset RIBA stage strings exist in index.html select options', () => {
    const html = readFileSync(resolve(rootDir, 'index.html'), 'utf8');
    for (const preset of Object.values(PROJECT_PRESETS)) {
      const escapedStage = preset.stage.replace(/&/g, '&amp;');
      assert.ok(
        html.includes(`value="${preset.stage}"`) || html.includes(`value="${escapedStage}"`),
        `Preset ${preset.id} stage "${preset.stage}" must be in #select-stage options`
      );
    }
  });
});
