'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 공압 그리퍼 계산 테스트 — 순수 Node
   대상: ../calc/pneumatic-gripper.calc.js (pneumatic-gripper.html 무손실 사본)
   ══════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { calcRequiredForce, judgeGripper, computeGripper, MAKERS } = require('../calc/pneumatic-gripper.calc.js');

const near = (a, b, rel = 1e-9) => {
  if (a === b) return;
  const d = Math.abs(a - b), s = Math.max(Math.abs(a), Math.abs(b), 1);
  assert.ok(d / s <= rel, `expected ${a} ≈ ${b}`);
};

/* ── A) 단위 ── */
test('calcRequiredForce: (w/1000)×9.81×15', () => { near(calcRequiredForce(200), 200 / 1000 * 9.81 * 15); });
test('judgeGripper: 압력/파지력 판정', () => {
  const m = { forceOuter: 42, forceInner: 66, pMin: 0.1, pMax: 0.7 };
  assert.equal(judgeGripper(m, 100, 'outer', 0.5).status, 'bad');  // 파지력 부족
  assert.equal(judgeGripper(m, 42, 'outer', 0.5).status, 'warn');  // 42 < 42×1.3
  assert.equal(judgeGripper(m, 30, 'outer', 0.5).status, 'ok');    // 42 ≥ 39
  assert.equal(judgeGripper(m, 30, 'outer', 0.05).status, 'bad');  // 압력 부족
});

/* ── B) 골든 (computeGripper) ── */
const ALL = { smc: true, festo: true, ckd: true };
const GOLDEN = [
  { label: '워크 200g·외부·복동 → 각 사 적합',
    input: { weight: 200, gripDir: 'outer', pressure: 0.5, actuator: 'double', makers: ALL },
    expect: { fRequired: 29.43, n: 16, results: [['smc', 'MHZ2-20D', 'ok'], ['festo', 'HGPT-16', 'ok'], ['ckd', 'HGW-16', 'ok']] } },
  { label: '워크 1kg·외부·복동 → 대형 보어',
    input: { weight: 1000, gripDir: 'outer', pressure: 0.5, actuator: 'double', makers: ALL },
    expect: { fRequired: 147.15, n: 16, results: [['smc', 'MHZ2-40D', 'ok'], ['festo', 'HGPT-40', 'ok'], ['ckd', 'HGW-40', 'ok']] } },
  { label: '워크 50kg → 전부 부적합(폴백 최대보어)',
    input: { weight: 50000, gripDir: 'outer', pressure: 0.5, actuator: 'double', makers: ALL },
    expect: { fRequired: 7357.5, n: 16, results: [['smc', 'MHZ2-40D', 'bad'], ['festo', 'HGPT-40', 'bad'], ['ckd', 'HGW-40', 'bad']] } },
];
for (const g of GOLDEN) {
  test(`골든: ${g.label}`, () => {
    const r = computeGripper(g.input); const e = g.expect;
    near(r.fRequired, e.fRequired);
    assert.equal(r.allModels.length, e.n, 'allModels 수');
    assert.deepEqual(r.makerResults.map(mr => [mr.makerKey, mr.modelName, mr.bestStatus]), e.results);
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
    weight: Math.round(ri(50, 60000)), gripDir: pick(['outer', 'inner']),
    pressure: pick([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7]), actuator: pick(['single', 'double']), makers,
  };
}

test('불변식: 무작위 입력 150개', () => {
  let okSeen = 0, warnSeen = 0, badSeen = 0;
  for (let i = 0; i < 150; i++) {
    const input = randomInput();
    const r = computeGripper(input);
    const ctx = `#${i} ${JSON.stringify(input)}`;

    // (3) 단위
    near(r.fRequired, input.weight / 1000 * 9.81 * 15);

    // (4) allModels 완전성
    const expN = Object.keys(MAKERS).filter(k => input.makers[k]).reduce((s, k) => s + MAKERS[k].models.length, 0);
    assert.equal(r.allModels.length, expN, `allModels 수 — ${ctx}`);

    // (1) 판정 ↔ 조건
    for (const am of r.allModels) {
      const m = MAKERS[am.makerKey].models.find(x => x.bore === am.bore);
      const st = judgeGripper(m, r.fRequired, input.gripDir, input.pressure).status;
      assert.equal(am.status, st, `status — ${ctx}`);
      const fRated = input.gripDir === 'outer' ? m.forceOuter : m.forceInner;
      let exp;
      if (input.pressure < m.pMin || fRated < r.fRequired) exp = 'bad';
      else if (fRated < r.fRequired * 1.3) exp = 'warn';
      else exp = 'ok';
      assert.equal(am.status, exp, `status 조건 — ${ctx}`);
      if (st === 'ok') okSeen++; if (st === 'warn') warnSeen++; if (st === 'bad') badSeen++;
    }

    // (2) 메이커별 추천: 첫 ok → 첫 warn → models[last]
    for (const mr of r.makerResults) {
      const models = MAKERS[mr.makerKey].models;
      const statuses = models.map(m => judgeGripper(m, r.fRequired, input.gripDir, input.pressure).status);
      const okIdx = statuses.indexOf('ok'), warnIdx = statuses.indexOf('warn');
      let expIdx, expStatus;
      if (okIdx !== -1) { expIdx = okIdx; expStatus = 'ok'; }
      else if (warnIdx !== -1) { expIdx = warnIdx; expStatus = 'warn'; }
      else { expIdx = models.length - 1; expStatus = 'bad'; }
      assert.equal(mr.bestModel.bore, models[expIdx].bore, `bestModel — ${ctx}`);
      assert.equal(mr.bestStatus, expStatus, `bestStatus — ${ctx}`);
      // (5) undefined 없음
      assert.ok(typeof mr.modelName === 'string' && Number.isFinite(mr.fRated));
    }
  }
  assert.ok(okSeen > 0 && warnSeen > 0 && badSeen > 0, `분기 미관측 (ok=${okSeen} warn=${warnSeen} bad=${badSeen})`);
});
