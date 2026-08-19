'use strict';
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { calcRequiredID, recommendOD, OD_TABLE }
  = require('../calc/pneumatic-fitting.calc.js');

const near = (a, b, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) <= eps, `${a} ≠ ${b}`);

/* ── calcRequiredID ── */
test('calcRequiredID: 공식 검증 q=10 L/min', () => {
  const q = 10;
  const expected = Math.sqrt((4 * q) / (Math.PI * 8 * 60000)) * 1000;
  near(calcRequiredID(q), expected, 1e-10);
});
test('calcRequiredID: q=0 → 0', () => {
  near(calcRequiredID(0), 0);
});
test('calcRequiredID: q 증가 → d 증가 (단조)', () => {
  assert.ok(calcRequiredID(20) > calcRequiredID(10));
});

/* ── recommendOD ── */
test('recommendOD: dRequired=0 → 최소 OD(4mm) 반환', () => {
  assert.equal(recommendOD(0), 4);
});
test('recommendOD: 범위 초과 → null', () => {
  assert.equal(recommendOD(999), null);
});
test('recommendOD: 경계값 — id=4.0 정확히 충족', () => {
  // OD_TABLE[1].id = 4.0 → od=6
  assert.equal(recommendOD(4.0), 6);
});
test('recommendOD: 실제 유량 흐름 — q=20 L/min 추천 결과 검증', () => {
  const d = calcRequiredID(20);
  const od = recommendOD(d);
  // 추천 OD의 내경이 d 이상이어야 함
  const rec = OD_TABLE.find(r => r.od === od);
  assert.ok(rec.id >= d);
});

/* ── OD_TABLE 구조 ── */
test('OD_TABLE: 내경 단조 증가', () => {
  for (let i = 1; i < OD_TABLE.length; i++) {
    assert.ok(OD_TABLE[i].id > OD_TABLE[i-1].id);
  }
});
