'use strict';
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { getRatedTorque, judgeHD } = require('../calc/harmonic-drive.calc.js');

const near = (a, b, eps = 0.1) =>
  assert.ok(Math.abs(a - b) <= eps, `expected ${a} ≈ ${b}`);

/* ── 테스트용 모델 (tr 방식) ── */
const MODEL_TR = {
  rr: [50, 100, 160],
  tr: { 50: 10, 100: 20, 160: 30 },
  mp: { 50: 30, 100: 60, 160: 90 },
  rp: null,
  mrpm: 3500,
  l10: 10000,
};

/* ── 보간 방식 모델 (rr에 중간값 포함) ── */
const MODEL_INTERP = {
  rr: [50, 105, 160],   // 105 포함해야 includes() 통과 후 보간 수행
  tr: null,
  mp: null,
  rp: null,
  trMin: 10, trMax: 30,
  mrpm: 3000,
  l10: 10000,
};

/* ── getRatedTorque ── */
test('getRatedTorque: tr 방식 — 감속비별 직접 반환', () => {
  assert.equal(getRatedTorque(MODEL_TR, 50),  10);
  assert.equal(getRatedTorque(MODEL_TR, 100), 20);
  assert.equal(getRatedTorque(MODEL_TR, 160), 30);
});
test('getRatedTorque: 미지원 감속비 → null', () => {
  assert.equal(getRatedTorque(MODEL_TR, 80), null);
});
test('getRatedTorque: 보간 방식 — 경계값', () => {
  near(getRatedTorque(MODEL_INTERP, 50),  10);
  near(getRatedTorque(MODEL_INTERP, 160), 30);
});
test('getRatedTorque: 보간 방식 — 중간값', () => {
  // ratio=105: t = (105-50)/(160-50) = 55/110 = 0.5 → 10 + 0.5*(30-10) = 20
  near(getRatedTorque(MODEL_INTERP, 105), 20, 1);
});

/* ── judgeHD ── */
test('judgeHD: 지원 안되는 감속비 → null', () => {
  assert.equal(judgeHD(MODEL_TR, 80, 5, 10, 1500, 10000), null);
});
test('judgeHD: tCont > ratedTorque → overall=bad', () => {
  const r = judgeHD(MODEL_TR, 50, 100, 15, 1500, 5000);
  assert.equal(r.overall, 'bad');
  assert.equal(r.torqueOk, false);
});
test('judgeHD: nInput > mrpm → overall=bad', () => {
  const r = judgeHD(MODEL_TR, 50, 5, 10, 5000, 5000);
  assert.equal(r.overall, 'bad');
  assert.equal(r.rpmOk, false);
});
test('judgeHD: tPeak > peakTorque → ratchetRisk=true → bad', () => {
  // peakTorque = mp[50] = 30; tPeak=50
  const r = judgeHD(MODEL_TR, 50, 5, 50, 1500, 5000);
  assert.equal(r.ratchetRisk, true);
  assert.equal(r.overall, 'bad');
});
test('judgeHD: 모든 조건 충족 → overall=ok or warn', () => {
  // ratio=50, tCont=5, tPeak=10(≤30), nInput=1500, lh=5000
  const r = judgeHD(MODEL_TR, 50, 5, 10, 1500, 5000);
  assert.ok(['ok','warn'].includes(r.overall));
});
test('judgeHD: lifeH > 0', () => {
  const r = judgeHD(MODEL_TR, 50, 5, 10, 1500, 5000);
  assert.ok(r.lifeH > 0);
});

/* ── 불변식 ── */
test('불변식: overall=bad이면 !torqueOk||!rpmOk||ratchetRisk||lifeGrade=bad', () => {
  const r = judgeHD(MODEL_TR, 50, 100, 10, 1500, 5000);
  if (r && r.overall === 'bad') {
    assert.ok(!r.torqueOk || !r.rpmOk || r.ratchetRisk || r.lifeGrade === 'bad');
  }
});
