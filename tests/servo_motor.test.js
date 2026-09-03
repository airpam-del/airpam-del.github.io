'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 서보모터 계산 테스트 — 순수 Node(node:test + assert)
   대상: ../calc/servo_motor.calc.js  (servo_motor.html 인라인 로직 무손실 사본)
   A) evalMotor 단위  B) 골든(computeServo)  C) 고유 불변식(시드 랜덤)
   ══════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { evalMotor, computeServoLoad, computeServo, MOTORS } = require('../calc/servo_motor.calc.js');

const near = (a, b, rel = 1e-9) => {
  if (a === b) return;
  const d = Math.abs(a - b), s = Math.max(Math.abs(a), Math.abs(b), 1);
  assert.ok(d / s <= rel, `expected ${a} ≈ ${b} (rel ${d / s})`);
};

/* ── A) evalMotor 단위 ── */
const BASE_P = { J_load: 0.001, J_drive: 0, ratio: 1, T_drive: 1.0, alpha_motor: 100, n_motor: 2000, tacc: 0.1, tdec: 0.1, tcycle: 1.0 };
test('evalMotor: pass = 4개 조건 AND', () => {
  for (const m of MOTORS) {
    const r = evalMotor(m, BASE_P);
    assert.equal(r.pass, r.ok_rpm && r.ok_Trms && r.ok_Tpk && r.ok_ir, m.model);
  }
});
test('evalMotor: ir = JL/Jm, T_rms≥0', () => {
  for (const m of MOTORS) {
    const r = evalMotor(m, BASE_P);
    near(r.ir, r.JL / r.Jm); assert.ok(r.T_rms >= 0);
  }
});
test('evalMotor: n_motor>nmax이면 ok_rpm=false + reason에 RPM', () => {
  for (const m of MOTORS) {
    const r = evalMotor(m, { ...BASE_P, n_motor: m.nmax + 1 });
    assert.equal(r.ok_rpm, false);
    assert.ok(r.reason.includes('RPM'), `reason=${r.reason}`);
  }
});

/* ── B) 골든 (computeServo) ── */
const GOLDEN = [
  { label: '볼스크류 직결 → HG-KR23 통과',
    input: { lt: 'ballscrew', dt: 'direct', opSpeed: 300, opTacc: 0.1, opTdec: 0.1, opTcycle: 1.0,
      bsLead: 10, bsDiam: 20, bsLen: 500, bsEta: 0.9, bsMass: 50, bsMu: 0.01, bsOri: 'h', bsCb: false, bsExtload: 0 },
    expect: { noFit: false, nPass: 7, n_motor: 1800, model: 'HG-KR23', power: 200,
      ir: 5.73362594157235, T_rms: 0.09177528219775352, T_peak: 0.28918009221477475 } },
  { label: '컨베이어+기어10:1 → HG-SR52 통과',
    input: { lt: 'conveyor', dt: 'gear', grRatio: 10, grEta: 0.9, grJ: 1.0, opSpeed: 500, opTacc: 0.2, opTdec: 0.2, opTcycle: 3.0,
      cvRoller: 100, cvMass: 30, cvBeltMass: 5, cvEta: 0.9, cvMu: 0.1, cvAngle: 0 },
    expect: { noFit: false, nPass: 3, n_motor: 954.929658551372, model: 'HG-SR52', power: 500,
      ir: 1.2052341597796146, T_rms: 0.33791064059719483, T_peak: 1.0624444444444445 } },
  { label: '볼스크류+기어5:1 고RPM → 적합 없음',
    input: { lt: 'ballscrew', dt: 'gear', grRatio: 5, grEta: 0.95, grJ: 0.5, opSpeed: 200, opTacc: 0.1, opTdec: 0.1, opTcycle: 2.0,
      bsLead: 5, bsDiam: 16, bsLen: 400, bsEta: 0.9, bsMass: 80, bsMu: 0.01, bsOri: 'v', bsCb: false, bsExtload: 0 },
    expect: { noFit: true, nPass: 0, n_motor: 12000, model: null } },
];
for (const g of GOLDEN) {
  test(`골든: ${g.label}`, () => {
    const r = computeServo(g.input);
    assert.equal(r.noFit, g.expect.noFit);
    assert.equal(r.allPassing.length, g.expect.nPass, '통과 수');
    near(r.p.n_motor, g.expect.n_motor);
    if (g.expect.noFit) { assert.equal(r.recommended, null); return; }
    const c = r.recommended;
    assert.equal(c.m.model, g.expect.model, '추천 모델');
    assert.equal(c.m.power, g.expect.power);
    near(c.ir, g.expect.ir); near(c.T_rms, g.expect.T_rms); near(c.T_peak, g.expect.T_peak);
  });
}

/* ── C) 고유 불변식 — 시드 랜덤 100개 ── */
function makeRng(seed) { let s = seed >>> 0; return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; }; }
const rng = makeRng(20260817);
const pick = (a) => a[Math.floor(rng() * a.length)];
const ri = (lo, hi) => lo + rng() * (hi - lo);

function randomDrive() {
  const dt = pick(['direct', 'gear', 'belt']);
  if (dt === 'gear' || dt === 'chain') return { dt, grRatio: +ri(2, 20).toFixed(2), grEta: +ri(0.9, 0.97).toFixed(3), grJ: +ri(0.1, 2).toFixed(3) };
  if (dt === 'belt') return { dt, btDrive: Math.round(ri(20, 60)), btDriven: Math.round(ri(40, 120)), btMass: +ri(0.5, 5).toFixed(2), btEta: +ri(0.9, 0.97).toFixed(3) };
  return { dt };
}
function randomInput() {
  const lt = pick(['ballscrew', 'rack', 'conveyor', 'index', 'rotary']);
  const op = { opSpeed: Math.round(ri(50, 600)), opTacc: +ri(0.05, 0.3).toFixed(3), opTdec: +ri(0.05, 0.3).toFixed(3), opTcycle: +ri(0.6, 5).toFixed(2) };
  const drive = randomDrive();
  let mech;
  if (lt === 'ballscrew') mech = { bsLead: Math.round(ri(5, 20)), bsDiam: Math.round(ri(12, 40)), bsLen: Math.round(ri(200, 1000)), bsEta: +ri(0.85, 0.95).toFixed(3), bsMass: Math.round(ri(10, 200)), bsMu: +ri(0.005, 0.02).toFixed(4), bsOri: pick(['h', 'v']), bsCb: pick([true, false]), bsExtload: Math.round(ri(0, 500)) };
  else if (lt === 'rack') mech = { rpDiam: Math.round(ri(30, 100)), rpMass: Math.round(ri(10, 200)), rpRackMass: Math.round(ri(5, 50)), rpEta: +ri(0.85, 0.95).toFixed(3), rpMu: +ri(0.005, 0.02).toFixed(4), rpOri: pick(['h', 'v']), rpExtload: Math.round(ri(0, 500)) };
  else if (lt === 'conveyor') mech = { cvRoller: Math.round(ri(50, 150)), cvMass: Math.round(ri(10, 100)), cvBeltMass: Math.round(ri(2, 20)), cvEta: +ri(0.85, 0.95).toFixed(3), cvMu: +ri(0.05, 0.2).toFixed(3), cvAngle: Math.round(ri(0, 30)) };
  else if (lt === 'index') mech = { idxDiam: Math.round(ri(50, 300)), idxMass: Math.round(ri(5, 100)), idxDiv: Math.round(ri(2, 12)), idxTime: +ri(0.2, 2).toFixed(2), idxDist: +ri(0.5, 1).toFixed(2), idxResist: +ri(0, 10).toFixed(2) };
  else mech = { rotDiam: Math.round(ri(50, 300)), rotMass: Math.round(ri(5, 100)), rotRpm: Math.round(ri(10, 200)), rotEta: +ri(0.85, 0.95).toFixed(3), rotResist: +ri(0, 10).toFixed(2) };
  return { lt, ...op, ...drive, ...mech };
}

test('불변식: 무작위 입력 100개', () => {
  let fit = 0;
  for (let i = 0; i < 100; i++) {
    const input = randomInput();
    const r = computeServo(input);
    const ctx = `#${i} ${JSON.stringify(input)}`;

    // (1) 판정 ↔ 임계값 방향 (모든 모터)
    for (const x of r.allResults) {
      assert.equal(x.ok_rpm,  x.n_motor <= x.m.nmax, `ok_rpm — ${ctx}`);
      assert.equal(x.ok_Trms, x.T_rms <= x.m.Tr * 0.9, `ok_Trms — ${ctx}`);
      assert.equal(x.ok_Tpk,  x.T_peak <= x.m.Tmax, `ok_Tpk — ${ctx}`);
      assert.equal(x.ok_ir,   x.ir <= 10, `ok_ir — ${ctx}`);
      assert.equal(x.pass,    x.ok_rpm && x.ok_Trms && x.ok_Tpk && x.ok_ir, `pass — ${ctx}`);
      // (3) 관성비 정의
      near(x.ir, x.JL / x.Jm);
      near(x.JL, r.p.J_load / (r.p.ratio * r.p.ratio));
      // (4) 단위 일관성: T_peak = T_drive + T_acc, T_acc = Jt × alpha_motor
      near(x.T_peak, r.p.T_drive + x.T_acc);
      near(x.T_acc, x.Jt * r.p.alpha_motor);
      // (6) reason: pass면 빈 문자열, 실패면 사유 존재
      assert.equal(typeof x.reason, 'string');
      if (x.pass) assert.equal(x.reason, ''); else assert.ok(x.reason.length > 0, `reason 비었음 — ${ctx}`);
    }

    // (5) noFit ⟺ 통과 0개
    assert.equal(r.noFit, r.allPassing.length === 0, `noFit — ${ctx}`);
    for (const x of r.allPassing) assert.ok(x.pass, `allPassing에 fail — ${ctx}`);

    if (r.recommended) {
      fit++;
      // (2) 추천 = 통과 중 최소 출력
      const minPower = Math.min(...r.allPassing.map(x => x.m.power));
      assert.equal(r.recommended.m.power, minPower, `추천 최소출력 아님 — ${ctx}`);
      assert.ok(r.allResults.includes(r.recommended), `추천이 allResults에 없음 — ${ctx}`);
      // undefined/NaN 없음
      for (const k of ['ir', 'T_rms', 'T_peak', 'n_motor', 'Jt']) assert.ok(Number.isFinite(r.recommended[k]), `${k} — ${ctx}`);
      // allPassing 출력 오름차순
      for (let j = 1; j < r.allPassing.length; j++) assert.ok(r.allPassing[j - 1].m.power <= r.allPassing[j].m.power, `정렬 — ${ctx}`);
    }
  }
  assert.ok(fit >= 20, `적합 케이스 너무 적음: ${fit}`);
});
