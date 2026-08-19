'use strict';
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { calcRequiredForce, judgeEGripper }
  = require('../calc/electric-gripper.calc.js');

const near = (a, b, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) <= eps, `${a} ≠ ${b}`);

const MODEL = {
  forceMin: 5, forceMax: 100,
  stroke: 40,
  comm: ['dio', 'iolink'],
  robots: ['ur', 'doosan'],
};

/* ── calcRequiredForce ── */
test('calcRequiredForce: (w/1000)×9.81×2', () => {
  near(calcRequiredForce(500), (500/1000)*9.81*2, 0.0001);
});
test('calcRequiredForce: w=0 → 0', () => {
  near(calcRequiredForce(0), 0);
});

/* ── judgeEGripper ── */
test('judgeEGripper: 모든 조건 OK → ok', () => {
  const fReq = calcRequiredForce(500); // ≈9.81N, within 5~100N, stroke≥30mm
  assert.equal(judgeEGripper(MODEL, fReq, 30, 'dio', 'ur'), 'ok');
});
test('judgeEGripper: fRequired > forceMax → bad', () => {
  assert.equal(judgeEGripper(MODEL, 200, 30, 'dio', 'ur'), 'bad');
});
test('judgeEGripper: 스트로크 부족 → warn', () => {
  const fReq = calcRequiredForce(500);
  assert.equal(judgeEGripper(MODEL, fReq, 50, 'dio', 'ur'), 'warn');
});
test('judgeEGripper: 미지원 통신 → warn', () => {
  const fReq = calcRequiredForce(500);
  assert.equal(judgeEGripper(MODEL, fReq, 30, 'canopen', 'ur'), 'warn');
});
test('judgeEGripper: 미지원 로봇 → warn', () => {
  const fReq = calcRequiredForce(500);
  assert.equal(judgeEGripper(MODEL, fReq, 30, 'dio', 'fanuc'), 'warn');
});
test('judgeEGripper: fRequired < forceMin → warn', () => {
  // forceMin=5N, 아주 가벼운 워크
  assert.equal(judgeEGripper(MODEL, 1, 30, 'dio', 'ur'), 'warn');
});
test('judgeEGripper: robots=[] 이면 모든 로봇 허용', () => {
  const m = { ...MODEL, robots: [] };
  const fReq = calcRequiredForce(500);
  assert.equal(judgeEGripper(m, fReq, 30, 'dio', 'kuka'), 'ok');
});
