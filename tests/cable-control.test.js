'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn · 금강케이블 제어케이블(CVV/CCV-S) 선정 테스트 — 순수 Node
   대상: ../calc/cable-control.calc.js (cable-control.html 무손실 사본)
   심수×SQ 라인업(금강 카탈로그)에서 필요 심수 이상 최소 심수 선정
   ══════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { computeControl, coreList, OD_CTRL, R_CTRL } = require('../calc/cable-control.calc.js');

/* ── A) 라인업·외경 앵커 (카탈로그) ── */
test('카탈로그 앵커: CVV 2C 2.5SQ 외경 12.0, CCV-S 2C 2.5SQ 12.5, 저항 7.41', () => {
  assert.equal(OD_CTRL.CVV[2][2.5], 12.0);
  assert.equal(OD_CTRL.CCVS[2][2.5], 12.5);   // 차폐로 약간 큼
  assert.equal(R_CTRL[2.5], 7.41);
  assert.deepEqual(coreList('CVV'), [2,3,4,5,6,7,8,10,12,15,20,30]);
});

/* ── B) 필요 심수 이상 최소 심수 ── */
test('CVV 2.5SQ 6심 필요 → 추천 6C (정확)', () => {
  const r = computeControl({ shieldType:'CVV', coresNeeded:6, sq:2.5 });
  assert.equal(r.recommended.cores, 6);
  assert.equal(r.recommended.pn, 'CVV 6C×2.5SQ');
  assert.equal(r.recommended.spare, 0);
});

test('CVV 2.5SQ 9심 필요 → 추천 10C (여유 1심)', () => {
  const r = computeControl({ shieldType:'CVV', coresNeeded:9, sq:2.5 });
  assert.equal(r.recommended.cores, 10);
  assert.equal(r.recommended.spare, 1);
});

/* ── C) 고심수×큰 SQ 미제공 → 추천 없음 ── */
test('CVV 10SQ 15심 필요 → 10SQ는 12심까지만 → 추천 없음 + 안내', () => {
  const r = computeControl({ shieldType:'CVV', coresNeeded:15, sq:10 });
  // 10SQ 제공 심수: 2~12 (15/20/30은 10SQ 없음)
  assert.ok(!r.availCores.includes(15));
  assert.equal(r.recommended, null);
  assert.ok(r.notes.some(n => n.includes('이상 제공 규격이 없습니다')));
});

/* ── D) CCV-S(차폐) 외경 > CVV 동일 규격 ── */
test('CCV-S 외경이 CVV보다 큼(동일 심수·SQ)', () => {
  for (const c of [2,3,4,5,6,8]) for (const s of [1.5,2.5,4,6]) {
    if (OD_CTRL.CVV[c] && OD_CTRL.CCVS[c] && OD_CTRL.CVV[c][s] != null && OD_CTRL.CCVS[c][s] != null)
      assert.ok(OD_CTRL.CCVS[c][s] >= OD_CTRL.CVV[c][s], `CCVS≥CVV ${c}C ${s}SQ`);
  }
});

/* ── E) 불변식 — 시드 랜덤 200개 ── */
function makeRng(seed){let s=seed>>>0;return()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;}}
const rng = makeRng(20261023);
const pick = (a) => a[Math.floor(rng() * a.length)];

test('불변식: 무작위 입력 200개', () => {
  let recSeen = 0, nullSeen = 0;
  for (let i = 0; i < 200; i++) {
    const type = pick(['CVV','CCVS']);
    const input = { shieldType:type, coresNeeded: 1 + Math.floor(rng()*32), sq: pick([1.5,2.5,4,6,10]) };
    const r = computeControl(input);
    const avail = coreList(type).filter(c => OD_CTRL[type][c][input.sq] != null);
    assert.deepEqual(r.availCores, avail);
    for (const x of r.results) {
      assert.equal(x.od, OD_CTRL[type][x.cores][input.sq]);
      assert.equal(x.ok, x.cores >= input.coresNeeded);
      assert.equal(x.spare, x.cores - input.coresNeeded);
    }
    const passing = r.results.filter(x => x.ok);
    if (passing.length) { assert.equal(r.recommended.cores, passing[0].cores); recSeen++; }
    else { assert.equal(r.recommended, null); nullSeen++; }
  }
  assert.ok(recSeen > 20 && nullSeen > 0, `rec=${recSeen} null=${nullSeen}`);
});
