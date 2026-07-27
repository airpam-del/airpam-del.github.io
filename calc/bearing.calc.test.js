'use strict';
/* ══════════════════════════════════════════════════════════════
   bearing.calc.js 순수함수 회귀 테스트
   실행:  node --test         (calc/ 폴더 또는 루트에서)
   목적:  계산식이 실수로 바뀌면 즉시 감지 (동작 불변 고정)
   ══════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { interpDGBB, calcP, calcP0 } = require('./bearing.calc.js');

// 부동소수 근사 비교 헬퍼
const near = (a, b, eps = 1e-9) =>
  assert.ok(Math.abs(a - b) <= eps, `expected ${a} ≈ ${b} (Δ=${Math.abs(a - b)})`);

/* ────────── interpDGBB (ISO 281 e·Y 보간) ────────── */
test('interpDGBB: 범위 하한 이하 → 첫 행 고정', () => {
  assert.deepEqual(interpDGBB(0.01), { e: 0.22, Y: 2.00 });
  assert.deepEqual(interpDGBB(0.025), { e: 0.22, Y: 2.00 }); // 경계 (<=)
});

test('interpDGBB: 범위 상한 이상 → 마지막 행 고정', () => {
  assert.deepEqual(interpDGBB(0.6), { e: 0.44, Y: 1.00 });
  assert.deepEqual(interpDGBB(0.5), { e: 0.44, Y: 1.00 }); // 경계 (>=)
});

test('interpDGBB: 표 값과 정확히 일치하는 지점', () => {
  const r = interpDGBB(0.07);
  near(r.e, 0.27); near(r.Y, 1.60);
});

test('interpDGBB: 두 표점 사이 선형 보간 (0.0325 = 0.025~0.040 중점)', () => {
  const r = interpDGBB(0.0325);
  near(r.e, 0.23); // 0.22 + 0.5*(0.24-0.22)
  near(r.Y, 1.90); // 2.00 + 0.5*(1.80-2.00)
});

/* ────────── calcP (등가 동하중) ────────── */
test('calcP: 반경 전용(CRB/NRB) → Fr 그대로', () => {
  assert.equal(calcP('CRB', 10, 2, 999), 10);
  assert.equal(calcP('NRB', 10, 2, 999), 10);
});

test('calcP: 축방향 전용(TBB) → Fa 그대로', () => {
  assert.equal(calcP('TBB', 10, 2, 0), 2);
});

test('calcP: ACBB 3분기', () => {
  near(calcP('ACBB', 0, 2, 0), 1.14);      // fr=0 → 0.57*fa
  assert.equal(calcP('ACBB', 10, 2, 0), 10); // r=0.2 ≤ 1.14 → fr
  near(calcP('ACBB', 10, 20, 0), 14.9);    // r=2 > 1.14 → 0.35fr+0.57fa
});

test('calcP: TRB 3분기 (e=0.4, Y=1.5)', () => {
  near(calcP('TRB', 0, 2, 0), 3);          // fr=0 → 1.5*fa
  assert.equal(calcP('TRB', 10, 2, 0), 10); // r=0.2 ≤ 0.4 → fr
  near(calcP('TRB', 10, 8, 0), 16);        // r=0.8 > 0.4 → 0.4fr+1.5fa
});

test('calcP: SBB 3분기 (e=0.27, Y1=2.3, Y2=3.4)', () => {
  near(calcP('SBB', 0, 2, 0), 6.8);        // fr=0 → 3.4*fa
  near(calcP('SBB', 10, 2, 0), 14.6);      // r=0.2 ≤ 0.27 → fr+2.3fa
  near(calcP('SBB', 10, 8, 0), 33.7);      // r=0.8 > 0.27 → 0.65fr+3.4fa
});

test('calcP: SRB 3분기 (e=0.3, Y1=2.5, Y2=3.7)', () => {
  near(calcP('SRB', 0, 2, 0), 7.4);        // fr=0 → 3.7*fa
  assert.equal(calcP('SRB', 10, 2, 0), 15); // r=0.2 ≤ 0.3 → fr+2.5fa
  near(calcP('SRB', 10, 8, 0), 36.3);      // r=0.8 > 0.3 → 0.67fr+3.7fa
});

test('calcP: DGBB 무하중 → 0', () => {
  assert.equal(calcP('DGBB', 0, 0, 10), 0);
});

test('calcP: DGBB C0=0 폴백 분기', () => {
  assert.equal(calcP('DGBB', 0, 2, 0), 2);           // fr=0 → fa
  assert.equal(calcP('DGBB', 10, 2, 0), 10);         // max(10, 0.56*10+1.5*2=8.6)=10
  near(calcP('DGBB', 10, 20, 0), 0.56 * 10 + 1.5 * 20); // 35.6
});

test('calcP: DGBB 정상 분기 (interpDGBB 사용)', () => {
  assert.equal(calcP('DGBB', 0, 3, 10), 3);          // fr=0 → fa
  assert.equal(calcP('DGBB', 10, 0.7, 10), 10);      // faC0=0.07,e=0.27; r=0.07 ≤ e → fr
  near(calcP('DGBB', 10, 5, 10), 10.6);              // faC0=0.5,e=0.44,Y=1.0; r=0.5>e → 0.56*10+1.0*5
});

/* ────────── calcP0 (등가 정하중) ────────── */
test('calcP0: 반경/축 전용', () => {
  assert.equal(calcP0('CRB', 10, 2), 10);
  assert.equal(calcP0('NRB', 10, 2), 10);
  assert.equal(calcP0('TBB', 10, 2), 2);
});

test('calcP0: 종류별 계수 (max 분기)', () => {
  assert.equal(calcP0('ACBB', 10, 2), 10);           // max(5.52,10)
  near(calcP0('ACBB', 2, 10), 3.6);                  // 0.5*2+0.26*10
  near(calcP0('TRB', 2, 10), 3.2);                   // 0.5*2+0.22*10
  near(calcP0('SBB', 2, 10), 6.2);                   // 0.6*2+0.5*10
  near(calcP0('SRB', 2, 10), 5.5);                   // 0.5*2+0.45*10
  near(calcP0('DGBB', 2, 10), 6.2);                  // 0.6*2+0.5*10
});
