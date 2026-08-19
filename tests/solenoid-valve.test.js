'use strict';
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { calcQRequired, judgeValve, BORE_TABLE_SV }
  = require('../calc/solenoid-valve.calc.js');

const near = (a, b, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) <= eps, `expected ${a} ≈ ${b}`);

/* ── calcQRequired ── */
test('calcQRequired: 기본 공식 검증 (bore=32, speed=300, P=0.5)', () => {
  const area = BORE_TABLE_SV[32]; // 804
  const expected = (area * 300 * 60) / 1e6 * (0.5 / 0.1013 + 1);
  near(calcQRequired(32, 300, 0.5), expected, 0.0001);
});
test('calcQRequired: supplyP 생략 시 0.5 MPa 기본값', () => {
  near(calcQRequired(32, 300), calcQRequired(32, 300, 0.5));
});
test('calcQRequired: speed=0 이면 Q=0', () => {
  near(calcQRequired(40, 0, 0.5), 0);
});
test('calcQRequired: 알 수 없는 bore → 기본 A=804 사용', () => {
  near(calcQRequired(99, 300, 0.5), calcQRequired(32, 300, 0.5));
});

/* ── judgeValve ── */
test('judgeValve: margin ≥ 1.2 → ok', () => {
  assert.equal(judgeValve(120, 100).status, 'ok');
  assert.ok(judgeValve(120, 100).margin >= 1.2);
});
test('judgeValve: 1.0 ≤ margin < 1.2 → warn', () => {
  assert.equal(judgeValve(110, 100).status, 'warn');
});
test('judgeValve: margin < 1.0 → bad', () => {
  assert.equal(judgeValve(90, 100).status, 'bad');
});

/* ── BORE_TABLE_SV 구조 ── */
test('BORE_TABLE_SV: 표준 보어 8개 포함', () => {
  for (const D of [20,25,32,40,50,63,80,100]) {
    assert.ok(BORE_TABLE_SV[D] > 0, `D=${D} 없음`);
  }
});
