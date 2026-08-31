'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 공압 피팅 계산 테스트 — 순수 Node
   대상: ../calc/pneumatic-fitting.calc.js (pneumatic-fitting.html 무손실 사본)
   ══════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { calcRequiredID, computeFitting, OD_TABLE, FITTING_DATA } = require('../calc/pneumatic-fitting.calc.js');

const near = (a, b, rel = 1e-9) => {
  if (a === b) return;
  const d = Math.abs(a - b), s = Math.max(Math.abs(a), Math.abs(b), 1);
  assert.ok(d / s <= rel, `expected ${a} ≈ ${b}`);
};

/* ── A) 단위: ANR→실제유량 변환 포함 ── */
test('calcRequiredID: ANR→실제유량 변환 후 sqrt(4·Qact/(π×8×60000))×1000', () => {
  const qAct = 100 * 0.1013 / (0.5 + 0.1013);
  near(calcRequiredID(100, 0.5), Math.sqrt((4 * qAct) / (Math.PI * 8 * 60000)) * 1000);
  // 압력이 높을수록 실제유량↓ → 필요 내경↓
  assert.ok(calcRequiredID(100, 0.7) < calcRequiredID(100, 0.4));
});

/* ── B) 골든 (computeFitting) — ANR 유량 + 사용압력 ── */
const ALL = { smc: true, festo: true, ckd: true };
const GOLDEN = [
  { label: '유량5(ANR)·0.5MPa·PU → OD4 KQ2H04/TU0425',
    input: { flow: 5, pressure: 0.5, material: 'pu', makers: ALL },
    expect: { dRequired: 1.494784423320089, od: 4, n: 3, tubing: 'TU0425', straight: 'KQ2H04', tubingSeries: 'TU 튜빙' } },
  { label: '유량100(ANR)·0.5MPa·PU → OD12 KQ2H12/TU1208',
    input: { flow: 100, pressure: 0.5, material: 'pu', makers: ALL },
    expect: { dRequired: 6.684879164503083, od: 12, n: 3, tubing: 'TU1208', straight: 'KQ2H12', tubingSeries: 'TU 튜빙' } },
  { label: '유량800(ANR)·0.5MPa·PA(나일론) → OD16 폴백 TS1612',
    input: { flow: 800, pressure: 0.5, material: 'pa', makers: ALL },
    expect: { dRequired: 18.907693554531168, od: 16, n: 3, tubing: 'TS1612', straight: 'KQ2H16', tubingSeries: 'TS 튜빙' } },
];
for (const g of GOLDEN) {
  test(`골든: ${g.label}`, () => {
    const r = computeFitting(g.input); const e = g.expect;
    near(r.dRequired, e.dRequired);
    assert.equal(r.recommendedOD, e.od);
    assert.equal(r.results.length, e.n);
    const smc = r.results.find(x => x.makerKey === 'smc');
    assert.equal(smc.tubing, e.tubing); assert.equal(smc.fittings.straight, e.straight);
    assert.equal(smc.tubingSeries, e.tubingSeries);
  });
}

/* ── C) 고유 불변식 — 시드 랜덤 150개 ── */
function makeRng(seed) { let s = seed >>> 0; return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; }; }
const rng = makeRng(20260817);
const pick = (a) => a[Math.floor(rng() * a.length)];
const ri = (lo, hi) => lo + rng() * (hi - lo);

function randomInput() {
  const makers = { smc: rng() < 0.85, festo: rng() < 0.75, ckd: rng() < 0.75 };
  if (!makers.smc && !makers.festo && !makers.ckd) makers.smc = true;
  return { flow: +ri(1, 5000).toFixed(2), pressure: pick([0.4, 0.5, 0.6, 0.7]), material: pick(['pu', 'pa']), makers };
}

test('불변식: 무작위 입력 150개', () => {
  let smallSeen = 0, fallbackSeen = 0;
  for (let i = 0; i < 150; i++) {
    const input = randomInput();
    const r = computeFitting(input);
    const ctx = `#${i} ${JSON.stringify(input)}`;

    // (2) 단위 (ANR→실제유량 변환 포함)
    near(r.dRequired, calcRequiredID(input.flow, input.pressure));

    // (1) 추천 OD: 내경≥필요인 최소 OD, 없으면 최대 OD
    const found = OD_TABLE.find(x => x.id >= r.dRequired);
    const expOD = found ? found.od : OD_TABLE[OD_TABLE.length - 1].od;
    assert.equal(r.recommendedOD, expOD, `추천OD — ${ctx}`);
    if (found) smallSeen++; else fallbackSeen++;

    // (3)(4) 필터 + 품번 정합
    const activeMakers = Object.keys(input.makers).filter(k => input.makers[k]);
    const expResults = activeMakers.filter(k => FITTING_DATA[k] && FITTING_DATA[k].models[expOD]);
    assert.equal(r.results.length, expResults.length, `결과 수 — ${ctx}`);
    for (const x of r.results) {
      const mk = FITTING_DATA[x.makerKey];
      const model = mk.models[x.od];
      assert.equal(x.od, expOD, `od — ${ctx}`);
      assert.equal(x.tubing, model.tubing[input.material], `튜빙 — ${ctx}`);
      assert.equal(x.fittings.straight, model.straight, `straight — ${ctx}`);
      assert.equal(x.fittings.elbow, model.elbow, `elbow — ${ctx}`);
      assert.equal(x.fittings.tee, model.tee, `tee — ${ctx}`);
      assert.equal(x.tubingSeries, mk.tubingSeries[input.material], `튜빙시리즈 — ${ctx}`);
      // (5) undefined 없음
      assert.ok(typeof x.tubing === 'string' && typeof x.fittings.straight === 'string');
    }
  }
  assert.ok(smallSeen > 0 && fallbackSeen > 0, `분기 미관측 (정상=${smallSeen} 폴백=${fallbackSeen})`);
});
