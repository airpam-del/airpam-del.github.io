'use strict';
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { calcCylinderResults, BORE_TABLE, ETA }
  = require('../calc/pneumatic-cylinder.calc.js');

/* ── 기본 구조 ── */
test('calcCylinderResults: BORE_TABLE 길이만큼 반환', () => {
  const rs = calcCylinderResults(0.5, 0.7, 500, false);
  assert.equal(rs.length, BORE_TABLE.length);
});

/* ── 추력 계산 공식 ── */
test('calcCylinderResults: F_push_theo = P × A_full × ETA', () => {
  const P = 0.5, rs = calcCylinderResults(P, 0.7, 1, false);
  for (const [i, r] of rs.entries()) {
    const expected = P * BORE_TABLE[i].A_full * ETA;
    assert.ok(Math.abs(r.F_push_theo - expected) < 0.001,
      `D=${BORE_TABLE[i].D}: ${r.F_push_theo} ≠ ${expected}`);
  }
});
test('calcCylinderResults: F_push_rec = F_push_theo × loadFactor', () => {
  const lf = 0.7, rs = calcCylinderResults(0.5, lf, 1, false);
  for (const r of rs) {
    assert.ok(Math.abs(r.F_push_rec - r.F_push_theo * lf) < 0.001);
  }
});

/* ── needPull=false → F_pull_theo/rec null ── */
test('needPull=false 이면 F_pull_theo = null', () => {
  const rs = calcCylinderResults(0.5, 0.7, 100, false);
  for (const r of rs) assert.equal(r.F_pull_theo, null);
});
test('needPull=true 이면 F_pull_theo > 0', () => {
  const rs = calcCylinderResults(0.5, 0.7, 100, true);
  for (const r of rs) assert.ok(r.F_pull_theo > 0);
});

/* ── status 판정 ── */
test('status: fRequired 매우 작을 때 최소 보어도 ok', () => {
  const rs = calcCylinderResults(0.5, 0.7, 1, false);
  assert.equal(rs[0].status, 'ok');
});
test('status: fRequired 매우 클 때 최대 보어도 bad 가능', () => {
  const rs = calcCylinderResults(0.1, 0.3, 1e9, false);
  assert.equal(rs[rs.length - 1].status, 'bad');
});
test('status: warn = theoOk && !pushOk 조건', () => {
  // P=0.5, A_full[0]=314, ETA=0.85, theo=133.45N, rec=133.45*0.3=40N
  // fRequired 90 → theoOk=true, pushOk=false → warn
  const rs = calcCylinderResults(0.5, 0.3, 90, false);
  assert.equal(rs[0].status, 'warn');
});

/* ── 불변식 ── */
test('불변식: 보어 클수록 F_push_theo 증가', () => {
  const rs = calcCylinderResults(0.5, 0.7, 1, false);
  for (let i = 1; i < rs.length; i++) {
    assert.ok(rs[i].F_push_theo > rs[i-1].F_push_theo);
  }
});
