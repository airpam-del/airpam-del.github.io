'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 유성감속기 계산 테스트 — 순수 Node(node:test + assert)
   대상: ../calc/planetary-gearbox.calc.js (planetary-gearbox.html 무손실 사본)
   A) 단위  B) 골든(computePG)  C) 고유 불변식(시드 랜덤)
   ══════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { calcDesignTorque, calcPGLife, computePG, PG_DATA } = require('../calc/planetary-gearbox.calc.js');

const near = (a, b, rel = 1e-9) => {
  if (a === b) return;
  const d = Math.abs(a - b), s = Math.max(Math.abs(a), Math.abs(b), 1);
  assert.ok(d / s <= rel, `expected ${a} ≈ ${b} (rel ${d / s})`);
};
const seriesOf = (mk, name) => PG_DATA[mk].series.find(s => s.series === name);

/* ── A) 단위 ── */
test('calcDesignTorque: T×Kf', () => { near(calcDesignTorque(50, 1.25), 62.5); });
test('calcPGLife: 20000×(rated/tDesign)^(10/3)', () => {
  near(calcPGLife(62.5, 110), Math.round(20000 * Math.pow(110 / 62.5, 10 / 3)));
});

/* ── B) 골든 (computePG) ── */
const ALL = { neugart: true, apex: true, shimpo: true };
const GOLDEN = [
  { label: '토크50·Kf1.25·감속비10·백래시10 → Neugart PLN090',
    input: { tLoad: 50, kf: 1.25, ratio: 10, nInput: 2000, lh: 20000, blMax: 10, jLoad: null, makers: ALL },
    expect: { tDesign: 62.5, n: 12, makerKey: 'neugart', series: 'PLN090', ratedTorque: 110, L10h: 131645, overall: 'ok' } },
  { label: '토크200·감속비5·백래시5 정밀 → Apex AB115',
    input: { tLoad: 200, kf: 1.0, ratio: 5, nInput: 1500, lh: 30000, blMax: 5, jLoad: null, makers: ALL },
    expect: { tDesign: 200, n: 8, makerKey: 'apex', series: 'AB115', ratedTorque: 250, L10h: 42079, overall: 'ok' } },
  { label: '과토크 감속비3 → 결과 없음',
    input: { tLoad: 2000, kf: 1.5, ratio: 3, nInput: 3000, lh: 20000, blMax: 20, jLoad: null, makers: ALL },
    expect: { tDesign: 3000, n: 0, makerKey: null } },
];
for (const g of GOLDEN) {
  test(`골든: ${g.label}`, () => {
    const r = computePG(g.input); const e = g.expect;
    near(r.tDesign, e.tDesign);
    assert.equal(r.results.length, e.n, '결과 수');
    if (e.makerKey === null) { assert.equal(r.recommended, null); return; }
    const c = r.recommended;
    assert.equal(c.makerKey, e.makerKey); assert.equal(c.series, e.series);
    assert.equal(c.ratedTorque, e.ratedTorque); assert.equal(c.L10h, e.L10h);
    assert.equal(c.overall, e.overall);
  });
}

/* ── C) 고유 불변식 — 시드 랜덤 120개 ── */
function makeRng(seed) { let s = seed >>> 0; return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; }; }
const rng = makeRng(20260817);
const pick = (a) => a[Math.floor(rng() * a.length)];
const ri = (lo, hi) => lo + rng() * (hi - lo);
const RATIOS = [3, 4, 5, 7, 9, 10, 11, 15, 20, 21, 25, 35, 50, 70, 100];
const order = { ok: 0, warn: 1, bad: 2 };

function randomInput() {
  const makers = { neugart: rng() < 0.8, apex: rng() < 0.8, shimpo: rng() < 0.8 };
  if (!makers.neugart && !makers.apex && !makers.shimpo) makers.neugart = true;
  return {
    tLoad: Math.round(ri(5, 1500)), kf: pick([1.0, 1.25, 1.5]), ratio: pick(RATIOS),
    nInput: Math.round(ri(500, 6000)), lh: pick([10000, 20000, 30000, 50000]),
    blMax: pick([1, 3, 5, 10, 15, 22]), jLoad: pick([null, 0.001, 0.01]), makers,
  };
}

test('불변식: 무작위 입력 120개', () => {
  let withResult = 0, warnSeen = 0, badSeen = 0;
  for (let i = 0; i < 120; i++) {
    const input = randomInput();
    const r = computePG(input);
    const ctx = `#${i} ${JSON.stringify(input)}`;

    // (4) 단위: tDesign
    near(r.tDesign, input.tLoad * input.kf);

    for (const x of r.results) {
      const s = seriesOf(x.makerKey, x.series);
      // (2) 필터
      assert.ok(s.ratios.includes(input.ratio), `감속비 미포함 — ${ctx}`);
      assert.ok(s.bl <= input.blMax, `백래시 초과 — ${ctx}`);
      assert.ok(x.ratedTorque >= r.tDesign, `토크 부족 — ${ctx}`);
      // (1) 판정 ↔ 조건
      assert.equal(x.rpmOk, input.nInput <= s.maxRpm, `rpmOk — ${ctx}`);
      assert.equal(x.lifeOk, x.L10h >= input.lh, `lifeOk — ${ctx}`);
      assert.equal(x.overall, (!x.rpmOk) ? 'bad' : (!x.lifeOk) ? 'warn' : 'ok', `overall — ${ctx}`);
      // (4) L10h 공식
      assert.equal(x.L10h, Math.round(20000 * Math.pow(x.ratedTorque / r.tDesign, 10 / 3)), `L10h — ${ctx}`);
      // (5) undefined/NaN 없음
      for (const k of ['ratedTorque', 'L10h', 'bl', 'eff']) assert.ok(Number.isFinite(x[k]), `${k} — ${ctx}`);
      if (x.overall === 'warn') warnSeen++; if (x.overall === 'bad') badSeen++;
    }

    // (3) 정렬 + 추천
    for (let j = 1; j < r.results.length; j++) {
      const a = r.results[j - 1], b = r.results[j];
      const cmp = order[a.overall] - order[b.overall] || a.ratedTorque - b.ratedTorque;
      assert.ok(cmp <= 0, `정렬 위반 — ${ctx}`);
    }
    assert.equal(r.recommended, r.results.length ? r.results[0] : null, `추천 — ${ctx}`);
    if (r.recommended) withResult++;
  }
  assert.ok(withResult >= 40, `결과 케이스 부족: ${withResult}`);
  assert.ok(warnSeen > 0 && badSeen > 0, `warn/bad 분기 미관측 (warn=${warnSeen} bad=${badSeen})`);
});
