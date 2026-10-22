'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn · 금강케이블 동축 선정 테스트 — 순수 Node
   대상: ../calc/cable-coax.calc.js (cable-coax.html 무손실 사본)
   손실[dB]=감쇠량[dB/km]×거리[km], 금강 카탈로그 감쇠표 기준
   ══════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { computeCoax, COAX_ATT, COAX_PRODUCTS } = require('../calc/cable-coax.calc.js');

const near = (a, b, rel = 1e-9) => {
  if (a === b) return;
  const d = Math.abs(a - b), s = Math.max(Math.abs(a), Math.abs(b), 1);
  assert.ok(d / s <= rel, `expected ${a} ≈ ${b}`);
};
const get = (r, pn) => r.results.find(x => x.pn === pn);

/* ── A) 감쇠 앵커 (카탈로그 실측) ── */
test('감쇠 앵커: 5C/7C/10C @450MHz = 137/95.9/73.4, 5C@2.15GHz=315.3', () => {
  assert.equal(COAX_ATT['5C'][450], 137.0);
  assert.equal(COAX_ATT['7C'][450], 95.9);
  assert.equal(COAX_ATT['10C'][450], 73.4);
  assert.equal(COAX_ATT['5C'][2150], 315.3);
});

/* ── B) 손실 = 감쇠 × 거리 + 추천 ── */
test('450MHz·100m·20dB → 손실=감쇠×0.1, 추천 RG-6(최소외경)', () => {
  const r = computeCoax({ freqMHz:450, distanceM:100, budgetDB:20 });
  near(get(r, '5C-FBT').loss, 137.0 * 0.1, 1e-9);     // 13.7
  near(get(r, '7C-FBT').loss, 95.9 * 0.1, 1e-9);      // 9.59
  assert.ok(get(r, '5C-FBT').ok);
  assert.equal(r.recommended.pn, 'RG-6/U/T');          // od 6.95 최소
});

test('450MHz·150m·20dB → 5C 초과(20.55), 추천 7C급 RG-11', () => {
  const r = computeCoax({ freqMHz:450, distanceM:150, budgetDB:20 });
  assert.ok(!get(r, '5C-FBT').ok);                     // 137*0.15=20.55 > 20
  near(get(r, '5C-FBT').loss, 20.55, 1e-9);
  assert.ok(get(r, 'RG-11/U/T').ok);                   // 95.9*0.15=14.385
  assert.equal(r.recommended.pn, 'RG-11/U/T');         // od 10.20 최소 적합
});

/* ── C) 광대역(>864MHz): HFBT만 ── */
test('2.15GHz·30m → 비광대역 품번 제외, 추천 5C-HFBT', () => {
  const r = computeCoax({ freqMHz:2150, distanceM:30, budgetDB:20 });
  assert.ok(r.wideband);
  assert.ok(!get(r, '5C-FBT').freqOk);                 // 비광대역 → 제외
  assert.ok(get(r, '5C-HFBT').freqOk);
  near(get(r, '5C-HFBT').loss, 315.3 * 0.03, 1e-9);    // 9.459
  assert.equal(r.recommended.pn, '5C-HFBT');
});

/* ── D) 자가지지 필터 ── */
test('자가지지 전용 → SS 품번만 적합', () => {
  const r = computeCoax({ freqMHz:450, distanceM:50, budgetDB:20, selfSupportOnly:true });
  for (const x of r.results) if (x.ok) assert.ok(x.ss, x.pn + ' ss');
  assert.ok(['5C-SS', '7C-SS'].includes(r.recommended.pn));
});

/* ── E) 초장거리 → 추천 없음 + 경고 ── */
test('450MHz·500m·20dB → 전 품번 초과, 추천 없음', () => {
  const r = computeCoax({ freqMHz:450, distanceM:500, budgetDB:20 });
  near(get(r, '10C-HFBT').loss, 73.4 * 0.5, 1e-9);     // 36.7 > 20
  assert.equal(r.recommended, null);
  assert.ok(r.notes.some(n => n.includes('허용 손실')));
});

/* ── F) 불변식 — 시드 랜덤 200개 ── */
function makeRng(seed){let s=seed>>>0;return()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;}}
const rng = makeRng(20261022);
const pick = (a) => a[Math.floor(rng() * a.length)];

test('불변식: 무작위 입력 200개', () => {
  let recSeen = 0, nullSeen = 0;
  for (let i = 0; i < 200; i++) {
    const freq = pick([50,150,250,350,450,750,864,950,1200,1450,1800,2150]);
    const input = { freqMHz:freq, distanceM: Math.round(rng()*600), budgetDB: pick([10,15,20,30]), selfSupportOnly: rng()<0.2 };
    const r = computeCoax(input);
    const wb = freq > 864, distKm = input.distanceM/1000;
    for (const x of r.results) {
      const att = COAX_ATT[x.cls][freq];
      assert.equal(x.att, att != null ? att : null);
      const freqOk = att != null && (!wb || x.wideband);
      assert.equal(x.freqOk, freqOk);
      if (freqOk) near(x.loss, att * distKm, 1e-9); else assert.equal(x.loss, null);
      const ssOk = !input.selfSupportOnly || x.ss;
      const ok = freqOk && ssOk && x.loss != null && x.loss <= input.budgetDB;
      assert.equal(x.ok, ok);
    }
    // 추천 = 적합 중 외경 최소
    const passing = r.results.filter(x => x.ok).slice().sort((a,b)=>a.od-b.od);
    if (passing.length) { assert.equal(r.recommended.pn, passing[0].pn); recSeen++; }
    else { assert.equal(r.recommended, null); nullSeen++; }
  }
  assert.ok(recSeen > 20 && nullSeen > 0, `분기 rec=${recSeen} null=${nullSeen}`);
});
