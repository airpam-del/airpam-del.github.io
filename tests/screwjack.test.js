'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 스크류잭 계산 테스트 — 순수 Node(node:test + assert)
   대상: ../calc/screwjack.calc.js  (screwjack.html 인라인 로직 무손실 사본)
   A) 단위  B) 골든(computeSJ)  C) 고유 불변식(시드 랜덤)
   ══════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const {
  calcBuckling, calcTorqueMotor, computeSJ, getEtaGear,
  ZE_MODELS, ETA_GEAR, LAYOUTS,
} = require('../calc/screwjack.calc.js');

const near = (a, b, rel = 1e-9) => {
  if (a === b) return;
  const d = Math.abs(a - b), s = Math.max(Math.abs(a), Math.abs(b), 1);
  assert.ok(d / s <= rel, `expected ${a} ≈ ${b} (rel ${d / s})`);
};

/* ── A) 단위 ── */
test('calcBuckling: coreD ≥ d_min이면 pass', () => {
  const m = ZE_MODELS.find(x => x.model === 'ZE-100');
  const b = calcBuckling(m, 10, 300, 2, 3, 'tr1');
  assert.equal(b.pass, b.coreD >= b.d_min);
});
test('calcTorqueMotor: η_gear는 ETA_GEAR 테이블 값 (0.85 하드코딩 아님)', () => {
  const m = ZE_MODELS.find(x => x.model === 'ZE-25');
  const rN = calcTorqueMotor(m, 20, 10, 'N', 'tr1', 1.3, 1.0);
  const rL = calcTorqueMotor(m, 20, 10, 'L', 'tr1', 1.3, 1.0);
  assert.equal(rN.eta_gear, ETA_GEAR['ZE-25'][0]); // 0.87
  assert.equal(rL.eta_gear, ETA_GEAR['ZE-25'][1]); // 0.72
});

/* ── B) 골든 (computeSJ) ── */
const GOLDEN = [
  { label: '1000kg 단독 tr1 → ZE-10',
    input: { F_kg: 1000, qty: 1, layout: 0, L: 300, euler: 2, vsf: 3, msf: 1.3, screw: 'tr1', gr: 'N', v: 10, actMode: 'C' },
    expect: { F_total: 9.81, F_jack: 9.81, nPass: 7, rec: 'ZE-10', n_rpm: 150, eta_gear: 0.84, eta_screw: 0.39,
      MG: 4.765903515663899, PM: 0.07485712328267904, PM_rec: 0.09731426026748276, MR: 4.765903515663899,
      alerts: ['buckOk'], needBrake: false } },
  { label: '5000kg 2잭 tr1 → ZE-35 (배치 2.1배)',
    input: { F_kg: 5000, qty: 2, layout: 0, L: 500, euler: 2, vsf: 3, msf: 1.3, screw: 'tr1', gr: 'N', v: 15, actMode: 'R' },
    expect: { F_total: 49.05, F_jack: 24.525, nPass: 5, rec: 'ZE-35', n_rpm: 128.57142857142858, eta_gear: 0.87, eta_screw: 0.35,
      MG: 12.818637042130488, PM: 0.17257701328223546, PM_rec: 0.2243501172669061, MR: 26.919137788474025,
      alerts: ['buckOk'], needBrake: false } },
  { label: '20000kg ball → ZE-200 (브레이크 필요)',
    input: { F_kg: 20000, qty: 1, layout: 0, L: 800, euler: 3, vsf: 3, msf: 1.3, screw: 'ball', gr: 'N', v: 20, actMode: 'R' },
    expect: { F_total: 196.2, F_jack: 196.2, nPass: 1, rec: 'ZE-200', n_rpm: 66.66666666666667, eta_gear: 0.9, eta_screw: 0.9,
      MG: 57.82629599005531, PM: 0.4036739685169655, PM_rec: 0.5247761590720552, MR: 57.82629599005531,
      alerts: ['buckOk', 'selfLock'], needBrake: true } },
];
for (const g of GOLDEN) {
  test(`골든: ${g.label}`, () => {
    const r = computeSJ(g.input); const t = r.torque; const e = g.expect;
    near(r.F_total, e.F_total); near(r.F_jack, e.F_jack);
    assert.equal(r.candidates.filter(c => c.pass).length, e.nPass, '통과 수');
    assert.equal(r.recommended.model, e.rec, '추천');
    near(t.n_rpm, e.n_rpm); assert.equal(t.eta_gear, e.eta_gear); assert.equal(t.eta_screw, e.eta_screw);
    near(t.MG, e.MG); near(t.PM, e.PM); near(t.PM_rec, e.PM_rec); near(t.MR, e.MR);
    assert.deepEqual(r.alerts.map(a => a.type), e.alerts, '경고');
    assert.equal(r.needBrake, e.needBrake);
  });
}

/* ── C) 고유 불변식 — 시드 랜덤 120개 ── */
function makeRng(seed) { let s = seed >>> 0; return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; }; }
const rng = makeRng(20260817);
const pick = (a) => a[Math.floor(rng() * a.length)];
const ri = (lo, hi) => lo + rng() * (hi - lo);

function randomInput() {
  const qty = pick([1, 2, 4, 6]);
  const layout = Math.floor(rng() * LAYOUTS[qty].length);
  const override = rng() < 0.4 ? pick(ZE_MODELS).model : undefined; // buckDanger/minLoad 유도
  return {
    F_kg: Math.round(ri(200, 30000)), qty, layout,
    L: Math.round(ri(100, 1500)), euler: pick([1, 2, 3]), vsf: pick([2, 3, 4]), msf: pick([1.0, 1.3, 1.5]),
    screw: pick(['tr1', 'tr2', 'ball']), gr: pick(['N', 'L']), v: Math.round(ri(5, 50)), actMode: pick(['R', 'C', 'L']),
    selectedModel: override,
  };
}

test('불변식: 무작위 입력 120개', () => {
  let withSel = 0, buckDangerSeen = 0, minLoadSeen = 0;
  for (let i = 0; i < 120; i++) {
    const input = randomInput();
    const r = computeSJ(input);
    const ctx = `#${i} ${JSON.stringify(input)}`;

    // (1) 후보 판정 ↔ 조건
    for (const c of r.candidates) {
      assert.equal(c.loadPass, c.m.rated >= r.F_jack, `loadPass — ${ctx}`);
      assert.equal(c.buck.pass, c.buck.coreD >= c.buck.d_min, `buck.pass — ${ctx}`);
      assert.equal(c.pass, c.loadPass && c.buck.pass, `pass — ${ctx}`);
    }
    // (2) 추천 = 정격 오름차순 첫 통과
    const firstPass = r.candidates.find(c => c.pass);
    assert.equal(r.recommended, firstPass ? firstPass.m : null, `추천 — ${ctx}`);

    if (!r.selected) { assert.equal(r.torque, null); continue; }
    withSel++;
    const t = r.torque, sel = r.selected;

    // (4) 단위 일관성
    const feedPerRev = input.gr === 'L' ? sel.feed_L * sel.pitch : sel.feed_N * sel.pitch;
    near(t.n_rpm, input.v * 60 / feedPerRev);
    near(t.PM, t.MG * t.n_rpm / 9550);
    near(t.PM_rec, t.PM * input.msf);
    const layoutMult = LAYOUTS[input.qty][input.layout].mult;
    near(t.MR, t.MG * layoutMult); near(t.MA, t.MR * 1.5);
    near(t.eta_gear, getEtaGear(sel, input.gr));

    // (3) 경고 ↔ 조건
    const types = r.alerts.map(a => a.type);
    assert.equal(types.includes('buckDanger'), !r.buck.pass, `buckDanger — ${ctx}`);
    assert.equal(types.includes('buckOk'), r.buck.pass, `buckOk — ${ctx}`);
    assert.equal(types.includes('minLoad'), r.F_jack < sel.rated * 0.15, `minLoad — ${ctx}`);
    assert.equal(types.includes('selfLock'), r.needBrake, `selfLock — ${ctx}`);
    const coreD = input.screw === 'ball' ? sel.coreBall : sel.coreTr;
    const critExpected = input.actMode === 'R' && t.n_rpm > 0.8 * (4.73e6 * coreD / (input.L ** 2));
    assert.equal(types.includes('critRpm'), critExpected, `critRpm — ${ctx}`);
    if (types.includes('buckDanger')) buckDangerSeen++;
    if (types.includes('minLoad')) minLoadSeen++;

    // (5) undefined/NaN 없음
    for (const k of ['n_rpm', 'MG', 'PM', 'PM_rec', 'MR', 'MA', 'eta_gear', 'eta_screw']) {
      assert.ok(Number.isFinite(t[k]), `${k} — ${ctx}`);
    }
  }
  // 경고 분기가 실제로 관측되었는지(테스트가 유효한지)
  assert.ok(withSel >= 60, `선택 케이스 부족: ${withSel}`);
  assert.ok(buckDangerSeen > 0, '좌굴 위험 경고가 한 번도 관측 안 됨');
  assert.ok(minLoadSeen > 0, '최소하중 경고가 한 번도 관측 안 됨');
});
