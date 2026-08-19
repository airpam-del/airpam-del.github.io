'use strict';
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { calcBuckling, calcTorqueMotor, ZE_MODELS, ETA_SCREW_SINGLE }
  = require('../calc/screwjack.calc.js');

const near = (a, b, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) <= eps, `expected ${a} ≈ ${b}`);

/* ── calcBuckling ── */
test('calcBuckling: coreD ≥ d_min 이면 pass=true', () => {
  // ZE-200 (가장 큰 모델), 짧은 스트로크
  const m = ZE_MODELS.find(x => x.model === 'ZE-200');
  const r = calcBuckling(m, 50, 200, 2, 3, 'tr1');
  assert.equal(r.pass, true);
});
test('calcBuckling: 매우 긴 스트로크에서 pass=false 가능', () => {
  const m = ZE_MODELS.find(x => x.model === 'ZE-5');
  const r = calcBuckling(m, 4.5, 2000, 1, 3, 'tr1'); // Euler1: L_eff=4000mm
  // d_min이 12.9보다 클 것이므로 fail 예상
  assert.equal(r.pass, false);
});
test('calcBuckling: d_min > 0 항상', () => {
  for (const m of ZE_MODELS) {
    const r = calcBuckling(m, m.rated * 0.5, 300, 2, 3, 'tr1');
    assert.ok(r.d_min > 0);
  }
});

/* ── 불변식: ball 스크류는 coreBall 사용 ── */
test('불변식: ball 타입에서 coreD = model.coreBall', () => {
  const m = ZE_MODELS[3];
  const r = calcBuckling(m, 10, 300, 2, 3, 'ball');
  assert.equal(r.coreD, m.coreBall);
});
test('불변식: tr 타입에서 coreD = model.coreTr', () => {
  const m = ZE_MODELS[3];
  const r = calcBuckling(m, 10, 300, 2, 3, 'tr1');
  assert.equal(r.coreD, m.coreTr);
});

/* ── calcTorqueMotor ── */
test('calcTorqueMotor: n_rpm > 0', () => {
  const m = ZE_MODELS[2]; // ZE-25
  const r = calcTorqueMotor(m, 10, 5, 'N', 'tr1', 1.3, 1.0);
  assert.ok(r.n_rpm > 0);
});
test('calcTorqueMotor: MG > 0 (양의 토크)', () => {
  const m = ZE_MODELS[2];
  const r = calcTorqueMotor(m, 15, 8, 'N', 'tr1', 1.3, 1.0);
  assert.ok(r.MG > 0);
});
test('calcTorqueMotor: L모드는 N모드보다 스크류 n_rpm 높음 (feedPerRev 작음)', () => {
  // L모드: feed_L×pitch < feed_N×pitch → 같은 선속도에 더 많은 회전 필요
  const m = ZE_MODELS[2]; // ZE-25: feed_N=1.0, feed_L=0.25, pitch=6
  const rN = calcTorqueMotor(m, 10, 5, 'N', 'tr1', 1.3, 1.0);
  const rL = calcTorqueMotor(m, 10, 5, 'L', 'tr1', 1.3, 1.0);
  assert.ok(rL.n_rpm > rN.n_rpm, `L rpm(${rL.n_rpm}) <= N rpm(${rN.n_rpm})`);
});

/* ── ETA_SCREW_SINGLE 키 존재 확인 ── */
test('ZE_MODELS 모든 스크류 타입이 ETA_SCREW_SINGLE에 존재', () => {
  for (const m of ZE_MODELS) {
    assert.ok(Object.prototype.hasOwnProperty.call(ETA_SCREW_SINGLE, m.screw),
      `${m.model}.screw = ${m.screw} 키 없음`);
  }
});
