#!/usr/bin/env node
/**
 * Turns CI quality reports into shields.io "endpoint" badge JSON and prints a
 * Markdown summary.
 *
 *   node scripts/make-badges.mjs [reportsDir=reports] [outDir=badges-out]
 *
 * Expected inputs (any may be missing; its badge is simply skipped):
 *   <reports>/backend/test-results.json       Vitest --reporter=json output
 *   <reports>/backend/coverage-summary.json   Vitest v8 coverage (json-summary)
 *   <reports>/frontend/test-results.json
 *   <reports>/frontend/coverage-summary.json
 *   <reports>/lighthouse/manifest.json        Lighthouse CI filesystem upload
 *
 * Every number comes from a real test run; nothing is hard-coded.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const reportsDir = process.argv[2] ?? 'reports';
const outDir = process.argv[3] ?? 'badges-out';

const readJson = (path) => (existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null);
const badges = {};
const summary = ['## Quality report', ''];

function badge(file, label, message, color) {
  badges[file] = { schemaVersion: 1, label, message: String(message), color };
}

// --- Tests ---------------------------------------------------------------
const suites = {};
for (const name of ['backend', 'frontend']) {
  const r = readJson(join(reportsDir, name, 'test-results.json'));
  if (r) suites[name] = { total: r.numTotalTests, passed: r.numPassedTests, failed: r.numFailedTests };
}
const testColor = (s) => (s.failed === 0 && s.passed === s.total ? 'brightgreen' : 'red');

if (suites.backend) {
  const s = suites.backend;
  badge('api-tests.json', 'API tests', `${s.passed}/${s.total} passing`, testColor(s));
  summary.push(`- **Backend (API) tests:** ${s.passed}/${s.total} passing`);
}
if (suites.frontend) {
  const s = suites.frontend;
  summary.push(`- **Frontend tests:** ${s.passed}/${s.total} passing`);
}
const all = Object.values(suites);
if (all.length) {
  const total = all.reduce((n, s) => n + s.total, 0);
  const passed = all.reduce((n, s) => n + s.passed, 0);
  const failed = all.reduce((n, s) => n + s.failed, 0);
  badge('tests.json', 'tests', `${passed}/${total} passing`, testColor({ total, passed, failed }));
  summary.push(`- **Total tests:** ${passed}/${total} passing`);
}

// --- Coverage ------------------------------------------------------------
// The badge reports the API (backend) suite only: it is the integration-tested
// layer. Frontend coverage is still collected and shown in the summary.
const colorFor = (pct) => (pct >= 90 ? 'brightgreen' : pct >= 80 ? 'green' : pct >= 70 ? 'yellowgreen' : pct >= 60 ? 'yellow' : 'orange');
for (const name of ['backend', 'frontend']) {
  const c = readJson(join(reportsDir, name, 'coverage-summary.json'));
  if (!c) continue;
  const { pct, covered, total } = c.total.lines;
  summary.push(`- **${name} line coverage:** ${pct}% (${covered}/${total})`);
  if (name === 'backend') badge('coverage.json', 'API coverage', `${pct}%`, colorFor(pct));
}

// --- Lighthouse ----------------------------------------------------------
const manifest = readJson(join(reportsDir, 'lighthouse', 'manifest.json'));
if (Array.isArray(manifest) && manifest.length) {
  const run = manifest.find((m) => m.isRepresentativeRun) ?? manifest[0];
  const s = run.summary;
  const score = (v) => Math.round(v * 100);
  const [perf, a11y, bp, seo] = [s.performance, s.accessibility, s['best-practices'], s.seo].map(score);
  const min = Math.min(perf, a11y, bp, seo);
  const color = min >= 90 ? 'brightgreen' : min >= 50 ? 'orange' : 'red';
  badge('lighthouse.json', 'Lighthouse', `${perf} perf · ${a11y} a11y · ${bp} bp · ${seo} seo`, color);
  summary.push(`- **Lighthouse (median run):** performance ${perf}, accessibility ${a11y}, best practices ${bp}, SEO ${seo}`);
}

if (summary.length === 2) summary.push('_No reports found._');

mkdirSync(outDir, { recursive: true });
for (const [file, data] of Object.entries(badges)) {
  writeFileSync(join(outDir, file), JSON.stringify(data) + '\n');
}
console.log(summary.join('\n'));
