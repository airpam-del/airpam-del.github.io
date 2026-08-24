'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 공기압 조절 유닛(FR) 계산 테스트 — 순수 Node
   대상: ../calc/pneumatic-fr-unit.calc.js (pneumatic-fr-unit.html 무손실 사본)
   ══════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { judgeFRUnit, computeFR, FR_DATA } = require('../calc/pneumatic-fr-unit.calc.js');

const near = (a, b, rel = 1e-9) => {
  if (a === b) return;
  const d = Math.abs(a - b), s = Math.max(Math.abs(a), Math.abs(b), 1);
  assert.ok(d / s <= rel, `expected ${a} ≈ ${b}`);
};

/* ── B) 골든 (computeFR) ── */
const ALL = { smc: true, festo: true, ckd: true };
const GOLDEN = [
  { label: '유량300·1/4·5μm → SMC AW30 (3사)',
    input: { flow: 300, setP: 0.5, port: '1/4', filter: '5um', makers: ALL },
    expect: { n: 3, models: ['AW30', 'LFR-1/4', 'W3000-8'], maker: 'smc', model: 'AW30', qRated: 1500, margin: 5 } },
  { label: '유량150·1/4·0.3μm → SMC AFM20 (단일)',
    input: { flow: 150, setP: 0.5, port: '1/4', filter: '0.3um', makers: ALL },
    expect: { n: 1, models: ['AFM20'], maker: 'smc', model: 'AFM20', qRated: 200, margin: 1.3333333333333333 } },
  { label: '유량5000·1/2·5μm → 유량 초과로 결과 없음',
    input: { flow: 5000, setP: 0.5, port: '1/2', filter: '5um', makers: ALL },
    expect: { n: 0, models: [], maker: null } },
];
for (const g of GOLDEN) {
  test(`골든: ${g.label}`, () => {
    const r = computeFR(g.input); const e = g.expect;
    assert.equal(r.results.length, e.n, '결과 수');
    assert.deepEqual(r.results.map(x => x.model), e.models);
    if (e.maker === null) { assert.equal(r.recommended, null); return; }
    const c = r.recommended;
    assert.equal(c.maker, e.maker); assert.equal(c.model, e.model); assert.equal(c.qRated, e.qRated);
    near(c.margin, e.margin);
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
  return {
    flow: Math.round(ri(10, 6000)), setP: pick([0.1, 0.3, 0.5, 0.7, 0.9]),
    port: pick(['1/8', '1/4', '3/8', '1/2']), filter: pick(['5um', '0.3um']), makers,
  };
}

test('불변식: 무작위 입력 150개', () => {
  let withResult = 0, pressOutSeen = 0, flowOutSeen = 0;
  for (let i = 0; i < 150; i++) {
    const input = randomInput();
    const r = computeFR(input);
    const ctx = `#${i} ${JSON.stringify(input)}`;

    // (1) 필터 ↔ 조건 + (3) margin
    for (const x of r.results) {
      assert.ok(input.makers[x.maker], `메이커 — ${ctx}`);
      assert.equal(x.port, input.port, `포트 — ${ctx}`);
      assert.equal(x.filter, input.filter, `필터 — ${ctx}`);
      assert.ok(input.flow <= x.qRated, `유량 — ${ctx}`);
      assert.ok(input.setP >= x.pMin && input.setP <= x.pMax, `압력 — ${ctx}`);
      near(x.margin, x.qRated / input.flow);
      assert.ok(typeof x.model === 'string' && Number.isFinite(x.qRated));
    }

    // (2) 필터 완전성: 제외 모델은 조건 불충족
    for (const m of FR_DATA) {
      const included = r.results.some(x => x.maker === m.maker && x.model === m.model);
      const shouldPass = input.makers[m.maker] && judgeFRUnit(m, input.flow, input.setP, input.port, input.filter);
      assert.equal(included, shouldPass, `필터 완전성 ${m.maker}/${m.model} — ${ctx}`);
      if (m.port === input.port && m.filter === input.filter && input.makers[m.maker]) {
        if (input.setP < m.pMin || input.setP > m.pMax) pressOutSeen++;
        if (input.flow > m.qRated) flowOutSeen++;
      }
    }

    // (4) 추천/순서: recommended=첫 항목, results는 FR_DATA 순서(인덱스 오름차순)
    assert.equal(r.recommended, r.results.length ? r.results[0] : null, `추천 — ${ctx}`);
    let prevIdx = -1;
    for (const x of r.results) {
      const idx = FR_DATA.findIndex(m => m.maker === x.maker && m.model === x.model);
      assert.ok(idx > prevIdx, `순서 — ${ctx}`); prevIdx = idx;
    }
    if (r.recommended) withResult++;
  }
  assert.ok(withResult >= 20, `결과 케이스 부족: ${withResult}`);
  assert.ok(pressOutSeen > 0 && flowOutSeen > 0, `제외 분기 미관측 (압력=${pressOutSeen} 유량=${flowOutSeen})`);
});
