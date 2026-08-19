'use strict';
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { calcRequiredForce, judgeGripper }
  = require('../calc/pneumatic-gripper.calc.js');

const near = (a, b, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) <= eps, `${a} ≠ ${b}`);

const MODEL_OK = { forceOuter:50, forceInner:40, pMin:0.3, pMax:0.7 };

/* ── calcRequiredForce ── */
test('calcRequiredForce: 기본 안전율 15', () => {
  near(calcRequiredForce(100), (100/1000)*9.81*15, 0.0001);
});
test('calcRequiredForce: 커스텀 안전율', () => {
  near(calcRequiredForce(200, 10), (200/1000)*9.81*10, 0.0001);
});
test('calcRequiredForce: w=0 → 0', () => {
  near(calcRequiredForce(0), 0);
});

/* ── judgeGripper ── */
test('judgeGripper: pressureOk && forceOk && 여유충분 → ok', () => {
  // fRequired=1N << forceOuter=50N (margin 50x), pressure=0.5≥0.3
  assert.equal(judgeGripper(MODEL_OK, 1, 'outer', 0.5).status, 'ok');
});
test('judgeGripper: 압력 부족 → bad', () => {
  assert.equal(judgeGripper(MODEL_OK, 1, 'outer', 0.1).status, 'bad');
});
test('judgeGripper: forceOuter < fRequired → bad', () => {
  assert.equal(judgeGripper(MODEL_OK, 100, 'outer', 0.5).status, 'bad');
});
test('judgeGripper: fRated < fRequired×1.3 → warn', () => {
  // forceOuter=50, fRequired=45: 50 < 45*1.3=58.5 → warn
  assert.equal(judgeGripper(MODEL_OK, 45, 'outer', 0.5).status, 'warn');
});
test('judgeGripper: inner 방향 사용', () => {
  // forceInner=40, fRequired=1 → ok
  assert.equal(judgeGripper(MODEL_OK, 1, 'inner', 0.5).status, 'ok');
});
