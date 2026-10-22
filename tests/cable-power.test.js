'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn · 금강케이블 전력케이블(VV/CV) 선정 테스트 — 순수 Node
   대상: ../calc/cable-power.calc.js (cable-power.html 무손실 사본)
   ΔV=k·I·R·L/1000, 허용전류(IEC 60364-5-52 방법C) 체크
   ══════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { computePower, powerToCurrent, R_OHM, AMP } = require('../calc/cable-power.calc.js');

const near = (a, b, rel = 1e-9) => {
  if (a === b) return;
  const d = Math.abs(a - b), s = Math.max(Math.abs(a), Math.abs(b), 1);
  assert.ok(d / s <= rel, `expected ${a} ≈ ${b}`);
};
const sq = (r, v) => r.results.find(x => x.sq === v);

/* ── A) 전압강하식 + 추천(단상, 전압강하 지배) ── */
test('단상 220V·20A·50m·VV·3% → 6SQ (전압강하 기준)', () => {
  const r = computePower({ cableType:'VV', phase:'1p', voltage:220, currentA:20, lengthM:50, dropPct:3 });
  near(sq(r, 2.5).vdV, 2 * 20 * 7.41 * 0.05, 1e-9);        // 14.82 V
  near(sq(r, 6).vdPct, (2 * 20 * 3.08 * 0.05) / 220 * 100, 1e-9); // 2.8%
  assert.ok(!sq(r, 4).vdOk);                                // 4.19% > 3
  assert.ok(sq(r, 6).vdOk && sq(r, 6).ampOk);
  assert.equal(r.recommended.sq, 6);
});

/* ── B) 허용전류 지배(짧은 긍장·큰 전류) ── */
test('단상 220V·50A·5m·VV → 허용전류가 10SQ 강제', () => {
  const r = computePower({ cableType:'VV', phase:'1p', currentA:50, lengthM:5, dropPct:3 });
  assert.ok(!sq(r, 6).ampOk);                               // VV 2선 6SQ=46 < 50
  assert.ok(sq(r, 10).ampOk);                               // 10SQ=63 ≥ 50
  assert.equal(r.recommended.sq, 10);
});

/* ── C) CV가 VV보다 허용전류 큼 ── */
test('허용전류: CV(XLPE) > VV(PVC) 동일 SQ', () => {
  for (const s of [1.5,2.5,4,6,10]) {
    assert.ok(AMP.CV[2][s] > AMP.VV[2][s], `CV>${s}SQ`);
    assert.ok(AMP.CV[3][s] > AMP.VV[3][s]);
  }
});

/* ── D) 3상 √3 계수 ── */
test('3상 전압강하 계수 √3', () => {
  const r = computePower({ cableType:'CV', phase:'3p', voltage:380, currentA:30, lengthM:40, dropPct:3 });
  near(sq(r, 4).vdV, Math.sqrt(3) * 30 * 4.61 * 0.04, 1e-9);
  assert.equal(r.loaded, 3);
});

/* ── E) 전력→전류 도우미 ── */
test('powerToCurrent: 3상 380V 10kW pf0.9, 단상 220V 2kW pf0.9', () => {
  near(powerToCurrent(10, 380, 0.9, '3p'), 10000 / (Math.sqrt(3) * 380 * 0.9), 1e-9);
  near(powerToCurrent(2, 220, 0.9, '1p'), 2000 / (220 * 0.9), 1e-9);
  assert.equal(powerToCurrent(0, 380, 0.9, '3p'), 0);
});

/* ── F) 초과 → 추천 없음 ── */
test('과대 조건 → 추천 없음 + 경고', () => {
  const r = computePower({ cableType:'VV', phase:'1p', currentA:30, lengthM:500, dropPct:3 });
  assert.equal(r.recommended, null);                        // 10SQ도 전압강하 초과
  assert.ok(r.notes.some(n => n.includes('10SQ')));
});

/* ── G) 불변식 — 시드 랜덤 200개 ── */
function makeRng(seed){let s=seed>>>0;return()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;}}
const rng = makeRng(20261022);
const pick = (a) => a[Math.floor(rng() * a.length)];

test('불변식: 무작위 입력 200개', () => {
  let recSeen = 0, nullSeen = 0;
  for (let i = 0; i < 200; i++) {
    const phase = pick(['1p','3p']);
    const input = { cableType:pick(['VV','CV']), phase, voltage: phase==='3p'?380:220,
      currentA: Math.round(rng()*80), lengthM: Math.round(rng()*400), dropPct: pick([2,3,5]), cores: pick([2,3,4]) };
    const r = computePower(input);
    const k = phase==='3p'?Math.sqrt(3):2, loaded = phase==='3p'?3:2;
    for (const x of r.results) {
      near(x.R, R_OHM[x.sq], 1e-12);
      near(x.vdV, k*input.currentA*R_OHM[x.sq]*(input.lengthM/1000), 1e-9);
      near(x.vdPct, input.voltage>0 ? x.vdV/input.voltage*100 : 0, 1e-9);
      assert.equal(x.amp, AMP[input.cableType][loaded][x.sq]);
      assert.equal(x.vdOk, x.vdPct <= input.dropPct);
      assert.equal(x.ampOk, x.amp >= input.currentA);
      assert.equal(x.ok, x.vdOk && x.ampOk);
    }
    const passing = r.results.filter(x => x.ok);
    if (passing.length) { assert.equal(r.recommended.sq, passing[0].sq); recSeen++; }
    else { assert.equal(r.recommended, null); nullSeen++; }
  }
  assert.ok(recSeen > 20 && nullSeen > 0, `rec=${recSeen} null=${nullSeen}`);
});
