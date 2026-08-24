'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 스피드 컨트롤러 계산 테스트 — 순수 Node
   대상: ../calc/speed-controller.calc.js (speed-controller.html 무손실 사본)
   ══════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const {
  calcRefFlow, recommendBore, calcForceHorizontal, calcForceVertical,
  computeSC, BORE_TABLE_SC, STD_BORES_SC, SC_DATA,
} = require('../calc/speed-controller.calc.js');

const near = (a, b, rel = 1e-9) => {
  if (a === b) return;
  const d = Math.abs(a - b), s = Math.max(Math.abs(a), Math.abs(b), 1);
  assert.ok(d / s <= rel, `expected ${a} ≈ ${b}`);
};

/* ── A) 단위 helper ── */
test('calcRefFlow: area×speed×60/1e6×(P/0.1013+1)', () => {
  near(calcRefFlow(32, 300, 0.5), 804 * 300 * 60 / 1e6 * (0.5 / 0.1013 + 1));
});
test('recommendBore: P×A×0.6≥F 인 최소 보어', () => {
  const F = 200, P = 0.5;
  const D = recommendBore(F, P);
  const area = BORE_TABLE_SC[D];
  assert.ok(P * area * 0.6 >= F);
  const idx = STD_BORES_SC.indexOf(D);
  if (idx > 0) { const prev = BORE_TABLE_SC[STD_BORES_SC[idx - 1]]; assert.ok(P * prev * 0.6 < F); }
});
test('calcForceHorizontal/Vertical 공식', () => {
  near(calcForceHorizontal(10, 0.1), 10 * 9.81 * 0.1 * 1.5);
  near(calcForceVertical(10, 2), 10 * 9.81 * 1.5 * 2);
});

/* ── B) 골든 (computeSC) ── */
const ALL = { smc: true, festo: true, ckd: true };
const GOLDEN = [
  { label: '엘보·OD6·R1/8 → 3사 매칭',
    input: { mount: 'elbow', od: 6, thread: 'R1/8', makers: ALL },
    expect: { n: 3, excl: 0, rec: 'AS2201F', models: ['AS2201F', 'GRLA-1/8', 'SC3W-6'] } },
  { label: '인라인·OD8 → 3사 매칭',
    input: { mount: 'inline', od: 8, thread: null, makers: ALL },
    expect: { n: 3, excl: 0, rec: 'AS2052F', models: ['AS2052F', 'GRO 계열', 'SC1 계열'] } },
  { label: '엘보·OD4·R1/2 → 조합 없음',
    input: { mount: 'elbow', od: 4, thread: 'R1/2', makers: ALL },
    expect: { n: 0, excl: 3, rec: null, models: [] } },
];
for (const g of GOLDEN) {
  test(`골든: ${g.label}`, () => {
    const r = computeSC(g.input); const e = g.expect;
    assert.equal(r.results.length, e.n, '결과 수');
    assert.equal(r.excluded.length, e.excl, '제외 수');
    assert.deepEqual(r.results.map(x => x.model), e.models);
    assert.equal(r.recommended ? r.recommended.model : null, e.rec);
  });
}

/* ── C) 고유 불변식 — 시드 랜덤 150개 ── */
function makeRng(seed) { let s = seed >>> 0; return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; }; }
const rng = makeRng(20260817);
const pick = (a) => a[Math.floor(rng() * a.length)];

function randomInput() {
  const makers = { smc: rng() < 0.85, festo: rng() < 0.75, ckd: rng() < 0.75 };
  if (!makers.smc && !makers.festo && !makers.ckd) makers.smc = true;
  return {
    mount: pick(['elbow', 'inline']), od: pick([4, 6, 8, 10, 12]),
    thread: pick(['M5', 'R1/8', 'R1/4', 'R3/8', 'R1/2']), makers,
  };
}

test('불변식: 무작위 입력 150개', () => {
  let withResult = 0, exclSeen = 0;
  for (let i = 0; i < 150; i++) {
    const input = randomInput();
    const r = computeSC(input);
    const ctx = `#${i} ${JSON.stringify(input)}`;

    // (1) 필터 ↔ 조건
    for (const x of r.results) {
      assert.ok(input.makers[x.makerKey], `메이커 — ${ctx}`);
      assert.equal(x.mount, input.mount, `마운트 — ${ctx}`);
      assert.ok(x.ods.indexOf(input.od) !== -1, `OD — ${ctx}`);
      if (input.mount === 'elbow') assert.equal(x.thread, input.thread, `나사 — ${ctx}`);
      assert.ok(typeof x.model === 'string');
    }

    // (2) 필터 완전성: 각 활성 메이커는 정확히 (매칭 있으면 results에, 없으면 excluded에)
    const activeMakers = Object.keys(input.makers).filter(k => input.makers[k]);
    for (const key of activeMakers) {
      const expMatches = SC_DATA[key].models.filter(m =>
        m.mount === input.mount && m.ods.indexOf(input.od) !== -1 &&
        (input.mount !== 'elbow' || m.thread === input.thread));
      const inResults = r.results.filter(x => x.makerKey === key).length;
      const inExcluded = r.excluded.some(x => x.makerKey === key);
      assert.equal(inResults, expMatches.length, `매칭 수 ${key} — ${ctx}`);
      assert.equal(inExcluded, expMatches.length === 0, `제외 ${key} — ${ctx}`);
    }
    if (r.excluded.length) exclSeen++;

    // (3) 추천/순서
    assert.equal(r.recommended, r.results.length ? r.results[0] : null, `추천 — ${ctx}`);
    if (r.recommended) withResult++;
  }
  assert.ok(withResult >= 40 && exclSeen > 0, `커버리지 부족 (결과=${withResult} 제외관측=${exclSeen})`);
});
