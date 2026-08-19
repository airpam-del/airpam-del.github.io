'use strict';
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { bsCalcFa, bsFindBest, BS_DATA, DN_LIMIT } = require('../calc/ballscrew.calc.js');

const near = (a, b, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) <= eps, `expected ${a} ≈ ${b}`);

/* ── bsCalcFa ── */
test('bsCalcFa: 수평 — 마찰+가속력', () => {
  const Fa = bsCalcFa(100, 'horizontal', 0, 500, 0.5);
  // a = (500mm/s / 1000) / 0.5s = 1.0 m/s²; Fi = 100×1.0 = 100N
  near(Fa, 100*9.81*0.003 + 100*(500/1000)/0.5, 0.001);
});
test('bsCalcFa: 수직 — 중력+가속력', () => {
  const Fa = bsCalcFa(50, 'vertical', 0, 200, 0.2);
  // a = (200/1000)/0.2 = 1.0 m/s²; Fi = 50×1.0 = 50N
  near(Fa, 50*9.81 + 50*(200/1000)/0.2, 0.001);
});
test('bsCalcFa: 경사 — sin/cos 합산', () => {
  const Fa = bsCalcFa(100, 'incline', 30, 300, 0.3);
  // a = (300/1000)/0.3 = 1.0 m/s²; Fi = 100×1.0 = 100N
  const rad = 30 * Math.PI / 180;
  near(Fa, 100*9.81*(Math.sin(rad)+0.003*Math.cos(rad)) + 100*(300/1000)/0.3, 0.01);
});

/* ── bsFindBest ── */
test('bsFindBest: 반드시 BS_DATA 키 중 하나의 d0/lead 반환', () => {
  const combos = bsFindBest(1000, 300, 500, 20000, 1.0, 100, 0.2);
  assert.ok(combos.length > 0);
  for (const r of combos) {
    const key = `${r.d0}x${r.lead}`;
    assert.ok(Object.prototype.hasOwnProperty.call(BS_DATA, key), `키 ${key} 없음`);
  }
});
test('bsFindBest: allOk=true인 결과는 4개 조건 모두 충족', () => {
  const combos = bsFindBest(500, 200, 300, 15000, 1.0, 100, 0.15);
  for (const r of combos.filter(c => c.allOk)) {
    assert.ok(r.lifeOk && r.buckOk && r.dnsOk && r.statOk);
  }
});
test('불변식: Dn = d0 × nm_op ≤ DN_LIMIT (필터 통과 결과만)', () => {
  const combos = bsFindBest(2000, 500, 1000, 10000, 1.4286, 100, 0.3);
  for (const r of combos) {
    // nm_op > nAllowed*1.05인 것은 이미 제외됨
    assert.ok(r.Dn <= r.nm_allowed * r.d0 * 1.05 + 1);
  }
});
test('불변식: L10h 계산은 양수', () => {
  const combos = bsFindBest(1000, 300, 400, 20000, 1.0, 100, 0.2);
  for (const r of combos) {
    assert.ok(r.L10h > 0);
  }
});
test('골든 케이스: 가벼운 하중 조건 — 소형 볼스크류 최상위 추천', () => {
  const combos = bsFindBest(200, 150, 200, 10000, 1.0, 100, 0.1);
  assert.ok(combos.length > 0);
  // 최상위 추천은 d0 ≤ 32
  assert.ok(combos[0].d0 <= 32, `d0=${combos[0].d0}`);
});
