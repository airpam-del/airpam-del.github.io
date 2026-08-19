'use strict';
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { calcRefFlow, recommendBore, calcForceHorizontal, calcForceVertical,
        BORE_TABLE_SC, STD_BORES_SC }
  = require('../calc/speed-controller.calc.js');

const near = (a, b, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) <= eps, `${a} ≠ ${b}`);

/* ── calcRefFlow ── */
test('calcRefFlow: 공식 검증 (bore=32, speed=300, P=0.5)', () => {
  const area = BORE_TABLE_SC[32]; // 804
  const expected = (area * 300 * 60) / 1e6 * (0.5 / 0.1013 + 1);
  near(calcRefFlow(32, 300, 0.5), expected, 0.0001);
});
test('calcRefFlow: speed=0 → Q=0', () => {
  near(calcRefFlow(50, 0, 0.5), 0);
});
test('calcRefFlow: 알 수 없는 bore → 기본 A=804 사용', () => {
  near(calcRefFlow(99, 100, 0.5), calcRefFlow(32, 100, 0.5));
});

/* ── recommendBore ── */
test('recommendBore: F 매우 작으면 최소 보어(20) 반환', () => {
  assert.equal(recommendBore(1, 0.5), 20);
});
test('recommendBore: F 매우 크면 null', () => {
  assert.equal(recommendBore(1e9, 0.5), null);
});
test('recommendBore: 결과는 항상 STD_BORES_SC 중 하나', () => {
  for (const F of [100, 500, 1000, 3000]) {
    const b = recommendBore(F, 0.5);
    if (b !== null) assert.ok(STD_BORES_SC.includes(b), `bore=${b} 비표준`);
  }
});
test('recommendBore: P×A×0.6 ≥ F 조건 만족', () => {
  for (const F of [50, 200, 800, 2000]) {
    const bore = recommendBore(F, 0.5);
    if (bore !== null) {
      assert.ok(0.5 * BORE_TABLE_SC[bore] * 0.6 >= F,
        `bore=${bore}: P×A×0.6=${0.5*BORE_TABLE_SC[bore]*0.6} < F=${F}`);
    }
  }
});

/* ── calcForceHorizontal / calcForceVertical ── */
test('calcForceHorizontal: m×9.81×mu×1.5', () => {
  near(calcForceHorizontal(10, 0.2), 10*9.81*0.2*1.5, 0.0001);
});
test('calcForceVertical: m×9.81×1.5×a', () => {
  near(calcForceVertical(10, 2), 10*9.81*1.5*2, 0.0001);
});

/* ── BORE_TABLE_SC 구조 ── */
test('BORE_TABLE_SC: STD_BORES_SC 모든 키 존재', () => {
  for (const D of STD_BORES_SC) {
    assert.ok(BORE_TABLE_SC[D] > 0, `D=${D} 없음`);
  }
});
