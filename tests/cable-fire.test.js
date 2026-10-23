'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn · 금강케이블 소방 내화케이블(TFR-8) 선정 테스트 — 순수 Node
   대상: ../calc/cable-fire.calc.js (cable-fire.html 무손실 사본)
   금강 TFR-8 심수×SQ 라인업(완성외경·중량) 대조
   ══════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { computeFire, OD_TFR8, W_TFR8, R_FIRE } = require('../calc/cable-fire.calc.js');

/* ── A) 카탈로그 앵커 ── */
test('카탈로그 앵커: TFR-8 2C 2.5SQ 외경15.0·중량190, 4C 10SQ 외경22.5·중량645', () => {
  assert.equal(OD_TFR8[2][2.5], 15.0);
  assert.equal(W_TFR8[2][2.5], 190);
  assert.equal(OD_TFR8[4][10], 22.5);
  assert.equal(W_TFR8[4][10], 645);
  assert.equal(R_FIRE[2.5], 7.41);
});

/* ── B) 선정 ── */
test('TFR-8 3심 4SQ → 품번·외경·중량', () => {
  const r = computeFire({ cores:3, sq:4 });
  assert.equal(r.recommended.pn, 'TFR-8 3C×4SQ');
  assert.equal(r.recommended.od, 17.0);
  assert.equal(r.recommended.weight, 290);
  assert.equal(r.recommended.cores, 3);
});

test('결과는 심수 1~4 전부 + 추천은 선택 심수', () => {
  const r = computeFire({ cores:2, sq:2.5 });
  assert.equal(r.results.length, 4);
  assert.deepEqual(r.results.map(x => x.cores), [1,2,3,4]);
  assert.equal(r.recommended.cores, 2);
  for (const x of r.results) assert.equal(x.od, OD_TFR8[x.cores][2.5]);
});

/* ── C) 기본값 보정 ── */
test('잘못된 입력 → 기본값(1심·2.5SQ)', () => {
  const r = computeFire({ cores:9, sq:999 });
  assert.equal(r.cores, 1);
  assert.equal(r.sq, 2.5);
  assert.equal(r.recommended.cores, 1);
});

/* ── D) 불변식 — 전 조합 ── */
test('불변식: 전 심수×SQ 조합', () => {
  for (const c of [1,2,3,4]) for (const s of [1.5,2.5,4,6,10]) {
    const r = computeFire({ cores:c, sq:s });
    assert.equal(r.recommended.pn, 'TFR-8 ' + c + 'C×' + s + 'SQ');
    assert.equal(r.recommended.od, OD_TFR8[c][s]);
    assert.equal(r.recommended.weight, W_TFR8[c][s]);
    assert.equal(r.recommended.R, R_FIRE[s]);
    assert.ok(r.results.filter(x => x.ok).length === 1);
  }
});
