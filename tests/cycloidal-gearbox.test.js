'use strict';
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { judgeCG } = require('../calc/cycloidal-gearbox.calc.js');

const SERIES = {
  torqueMax: 100, ratioMin: 5, ratioMax: 87,
  maxRpm: 3000, guaranteedLife: 20000, peakMultiplier: 2.5
};

/* ── 감속비 범위 체크 ── */
test('judgeCG: 감속비 범위 밖 → null', () => {
  assert.equal(judgeCG(SERIES, 3, 50, 1.5, 1.0, false, 1500, 10000), null);
  assert.equal(judgeCG(SERIES, 100, 50, 1.5, 1.0, false, 1500, 10000), null);
});

/* ── 토크 초과 → null ── */
test('judgeCG: tDesignDuty > torqueMax → null', () => {
  // tDesignDuty = 50 * 1.5 * 1.0 = 75; torqueMax=100 → OK
  // tDesignDuty = 80 * 1.5 * 1.0 = 120 > 100 → null
  assert.equal(judgeCG(SERIES, 10, 80, 1.5, 1.0, false, 1500, 10000), null);
});

/* ── 역방향 sf 증가 ── */
test('judgeCG: reverse=true → sf×1.2 적용', () => {
  // sf=1.5, reverse → sfFinal=1.8; tDesignDuty = 60*1.8*1.0 = 108 > 100 → null
  assert.equal(judgeCG(SERIES, 10, 60, 1.5, 1.0, true, 1500, 10000), null);
  // sf=1.0, reverse → sfFinal=1.2; tDesignDuty = 60*1.2*1.0 = 72 ≤ 100 → not null
  assert.notEqual(judgeCG(SERIES, 10, 60, 1.0, 1.0, true, 1500, 10000), null);
});

/* ── rpmOk / rpmWarn ── */
test('judgeCG: nInput ≤ maxRpm → rpmOk=true', () => {
  const r = judgeCG(SERIES, 10, 50, 1.5, 1.0, false, 1500, 10000);
  assert.equal(r.rpmOk, true);
});
test('judgeCG: nInput > maxRpm → overall=bad', () => {
  const r = judgeCG(SERIES, 10, 50, 1.5, 1.0, false, 4000, 10000);
  assert.equal(r.overall, 'bad');
});
test('judgeCG: nInput > 1800 → rpmWarn=true', () => {
  const r = judgeCG(SERIES, 10, 50, 1.5, 1.0, false, 2000, 10000);
  assert.equal(r.rpmWarn, true);
});

/* ── lifeGrade ── */
test('judgeCG: guaranteedLife ≥ lh×1.2 → lifeGrade=ok', () => {
  // guaranteedLife=20000, lh=15000 → 20000 ≥ 18000 → ok
  const r = judgeCG(SERIES, 10, 50, 1.5, 1.0, false, 1500, 15000);
  assert.equal(r.lifeGrade, 'ok');
});
test('judgeCG: guaranteedLife < lh×0.8 → lifeGrade=bad → overall=bad', () => {
  // guaranteedLife=20000, lh=30000 → 20000 < 24000 → bad
  const r = judgeCG(SERIES, 10, 50, 1.5, 1.0, false, 1500, 30000);
  assert.equal(r.overall, 'bad');
});

/* ── 정상 케이스 ── */
test('judgeCG: 모든 조건 OK → overall=ok', () => {
  const r = judgeCG(SERIES, 10, 50, 1.5, 1.0, false, 1500, 10000);
  assert.equal(r.overall, 'ok');
});
