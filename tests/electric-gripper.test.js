'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 전동 그리퍼 계산 테스트 — 순수 Node
   대상: ../calc/electric-gripper.calc.js (electric-gripper.html 무손실 사본)
   ══════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { calcRequiredForce, judgeEGripper, computeEG, MAKERS } = require('../calc/electric-gripper.calc.js');

const near = (a, b, rel = 1e-9) => {
  if (a === b) return;
  const d = Math.abs(a - b), s = Math.max(Math.abs(a), Math.abs(b), 1);
  assert.ok(d / s <= rel, `expected ${a} ≈ ${b}`);
};

/* ── A) 단위 ── */
test('calcRequiredForce: (w/1000)×9.81×2', () => { near(calcRequiredForce(500), 9.81); });
test('judgeEGripper: 파지력 초과 → bad', () => {
  const m = { forceMin: 20, forceMax: 40, stroke: 6, comm: ['dio'], robots: [] };
  assert.equal(judgeEGripper(m, 100, 5, 'dio', 'other'), 'bad');
  assert.equal(judgeEGripper(m, 30, 5, 'dio', 'other'), 'ok');
  assert.equal(judgeEGripper(m, 30, 99, 'dio', 'other'), 'warn'); // 스트로크 부족
});

/* ── B) 골든 (computeEG) ── */
const ALL = { schunk: true, onrobot: true };
const GOLDEN = [
  { label: '워크 500g·폭5·dio → 둘 다 warn',
    input: { weight: 500, width: 5, comm: 'dio', robot: 'other', makers: ALL },
    expect: { fRequired: 9.81, n: 8, results: [['schunk', 'EGP 25', 'warn'], ['onrobot', 'RG2', 'warn']] } },
  { label: '워크 2kg·폭20·iolink·UR → OnRobot ok',
    input: { weight: 2000, width: 20, comm: 'iolink', robot: 'ur', makers: ALL },
    expect: { fRequired: 39.24, n: 8, results: [['schunk', 'EGP 25', 'warn'], ['onrobot', 'RG2', 'ok']] } },
  { label: '워크 50kg → 전부 부적합',
    input: { weight: 50000, width: 5, comm: 'dio', robot: 'other', makers: ALL },
    expect: { fRequired: 981.0, n: 8, results: [['schunk', 'EGP 25', 'bad'], ['onrobot', 'RG2', 'bad']] } },
];
for (const g of GOLDEN) {
  test(`골든: ${g.label}`, () => {
    const r = computeEG(g.input); const e = g.expect;
    near(r.fRequired, e.fRequired);
    assert.equal(r.allModels.length, e.n, 'allModels 수');
    assert.deepEqual(r.makerResults.map(mr => [mr.makerKey, mr.bestModel.model, mr.bestStatus]), e.results);
  });
}

/* ── C) 고유 불변식 — 시드 랜덤 150개 ── */
function makeRng(seed) { let s = seed >>> 0; return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; }; }
const rng = makeRng(20260817);
const pick = (a) => a[Math.floor(rng() * a.length)];
const ri = (lo, hi) => lo + rng() * (hi - lo);

function randomInput() {
  const makers = { schunk: rng() < 0.85, onrobot: rng() < 0.85 };
  if (!makers.schunk && !makers.onrobot) makers.schunk = true;
  return {
    weight: Math.round(ri(50, 60000)), width: Math.round(ri(1, 30)),
    comm: pick(['dio', 'iolink']), robot: pick(['ur', 'doosan', 'kuka', 'fanuc', 'other']), makers,
  };
}

test('불변식: 무작위 입력 150개', () => {
  let okSeen = 0, warnSeen = 0, badSeen = 0;
  for (let i = 0; i < 150; i++) {
    const input = randomInput();
    const r = computeEG(input);
    const ctx = `#${i} ${JSON.stringify(input)}`;

    // (3) 단위
    near(r.fRequired, input.weight / 1000 * 9.81 * 2);

    // (4) allModels = 활성 메이커 전 모델
    const expectN = Object.keys(MAKERS).filter(k => input.makers[k]).reduce((s, k) => s + MAKERS[k].models.length, 0);
    assert.equal(r.allModels.length, expectN, `allModels 수 — ${ctx}`);

    // (1) 판정 ↔ 조건 (재현)
    for (const am of r.allModels) {
      const m = MAKERS[am.makerKey].models.find(x => x.model === am.model);
      const st = judgeEGripper(m, r.fRequired, input.width, input.comm, input.robot);
      assert.equal(am.status, st, `status — ${ctx}`);
      // 명시적 조건
      let expSt;
      if (r.fRequired > m.forceMax) expSt = 'bad';
      else {
        const ok = m.stroke >= input.width && m.comm.indexOf(input.comm) !== -1 &&
          (m.robots.length === 0 || m.robots.indexOf(input.robot) !== -1) && r.fRequired >= m.forceMin;
        expSt = ok ? 'ok' : 'warn';
      }
      assert.equal(am.status, expSt, `status 조건 — ${ctx}`);
      if (st === 'ok') okSeen++; if (st === 'warn') warnSeen++; if (st === 'bad') badSeen++;
    }

    // (2) 메이커별 추천: 첫 ok → 첫 warn → models[0]
    for (const mr of r.makerResults) {
      const models = MAKERS[mr.makerKey].models;
      const statuses = models.map(m => judgeEGripper(m, r.fRequired, input.width, input.comm, input.robot));
      const okIdx = statuses.indexOf('ok');
      const warnIdx = statuses.indexOf('warn');
      let expIdx, expStatus;
      if (okIdx !== -1) { expIdx = okIdx; expStatus = 'ok'; }
      else if (warnIdx !== -1) { expIdx = warnIdx; expStatus = 'warn'; }
      else { expIdx = 0; expStatus = 'bad'; }
      assert.equal(mr.bestModel.model, models[expIdx].model, `bestModel — ${ctx}`);
      assert.equal(mr.bestStatus, expStatus, `bestStatus — ${ctx}`);
      // (5) undefined 없음
      assert.ok(mr.bestModel && typeof mr.bestModel.model === 'string');
    }
  }
  assert.ok(okSeen > 0 && warnSeen > 0 && badSeen > 0, `분기 미관측 (ok=${okSeen} warn=${warnSeen} bad=${badSeen})`);
});
