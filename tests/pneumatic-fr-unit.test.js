'use strict';
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { calcMargin, judgeFRUnit }
  = require('../calc/pneumatic-fr-unit.calc.js');

const near = (a, b, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) <= eps, `${a} ≠ ${b}`);

const MODEL = { qRated:100, pMin:0.1, pMax:0.7, port:'1/4', filter:'5um' };

/* ── calcMargin ── */
test('calcMargin: qRated/flow 비율 반환', () => {
  near(calcMargin(100, 50), 2.0);
  near(calcMargin(30, 30), 1.0);
});
test('calcMargin: flow > qRated → margin < 1', () => {
  assert.ok(calcMargin(50, 100) < 1);
});

/* ── judgeFRUnit ── */
test('judgeFRUnit: 모든 조건 OK → true', () => {
  assert.equal(judgeFRUnit(MODEL, 50, 0.4, '1/4', '5um'), true);
});
test('judgeFRUnit: 포트 불일치 → false', () => {
  assert.equal(judgeFRUnit(MODEL, 50, 0.4, '1/8', '5um'), false);
});
test('judgeFRUnit: 필터 불일치 → false', () => {
  assert.equal(judgeFRUnit(MODEL, 50, 0.4, '1/4', '0.3um'), false);
});
test('judgeFRUnit: flow > qRated → false', () => {
  assert.equal(judgeFRUnit(MODEL, 150, 0.4, '1/4', '5um'), false);
});
test('judgeFRUnit: setP < pMin → false', () => {
  assert.equal(judgeFRUnit(MODEL, 50, 0.05, '1/4', '5um'), false);
});
test('judgeFRUnit: setP > pMax → false', () => {
  assert.equal(judgeFRUnit(MODEL, 50, 0.8, '1/4', '5um'), false);
});
