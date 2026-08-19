'use strict';
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { evalMotor, MOTORS } = require('../calc/servo_motor.calc.js');

const near = (a, b, eps = 1e-9) =>
  assert.ok(Math.abs(a - b) <= eps, `expected ${a} ≈ ${b}`);

const BASE_P = {
  J_load:0.001, J_drive:0, ratio:1, T_drive:1.0,
  alpha_motor:100, n_motor:2000, tacc:0.1, tdec:0.1, tcycle:1.0
};

/* ── evalMotor 기본 구조 ── */
test('evalMotor: 반환 객체에 필수 속성 존재', () => {
  const m = MOTORS[0];
  const r = evalMotor(m, BASE_P);
  for (const k of ['pass','Jm','JL','ir','T_peak','T_rms','ok_rpm','ok_Trms','ok_Tpk','ok_ir']) {
    assert.ok(Object.prototype.hasOwnProperty.call(r, k), `속성 ${k} 없음`);
  }
});

/* ── 불변식: pass = ok_rpm AND ok_Trms AND ok_Tpk AND ok_ir ── */
test('불변식: pass 값은 4개 조건 AND', () => {
  for (const m of MOTORS) {
    const r = evalMotor(m, BASE_P);
    assert.equal(r.pass, r.ok_rpm && r.ok_Trms && r.ok_Tpk && r.ok_ir,
      `모델 ${m.model}: pass 불일치`);
  }
});

/* ── 불변식: T_rms ≥ 0 ── */
test('불변식: T_rms ≥ 0 항상', () => {
  for (const m of MOTORS) {
    const r = evalMotor(m, BASE_P);
    assert.ok(r.T_rms >= 0, `T_rms=${r.T_rms}`);
  }
});

/* ── 불변식: RPM 초과 시 ok_rpm=false ── */
test('불변식: n_motor > m.nmax이면 ok_rpm=false', () => {
  for (const m of MOTORS) {
    const p = { ...BASE_P, n_motor: m.nmax + 1 };
    const r = evalMotor(m, p);
    assert.equal(r.ok_rpm, false, `모델 ${m.model}`);
  }
});

/* ── 불변식: 무하중 조건에서 T_rms ≈ 0 ── */
test('불변식: T_drive=0 & alpha=0이면 T_peak≈0, T_rms≈0', () => {
  const p = { ...BASE_P, T_drive:0, alpha_motor:0, J_load:0, J_drive:0 };
  const r = evalMotor(MOTORS[0], p);
  near(r.T_peak, 0, 1e-10);
  near(r.T_rms,  0, 1e-10);
});

/* ── 불변식: ir = JL / Jm ── */
test('불변식: ir = JL/Jm', () => {
  for (const m of MOTORS) {
    const r = evalMotor(m, BASE_P);
    near(r.ir, r.JL / r.Jm, 1e-9);
  }
});

/* ── 골든 케이스: 작은 하중에서 최소 모델 PASS ── */
test('골든 케이스: HG-KR053, 가벼운 하중 PASS', () => {
  const m = MOTORS.find(x => x.model === 'HG-KR053');
  // Jm=1.3e-6 kg·m², J_load=1e-6 → ir≈0.77 (≤10 OK)
  // T_rms ≈ 0.05 ≤ Tr×0.9=0.143 OK
  const p = { J_load:0.000001, J_drive:0, ratio:1, T_drive:0.05,
              alpha_motor:10, n_motor:1000, tacc:0.1, tdec:0.1, tcycle:1.0 };
  const r = evalMotor(m, p);
  assert.equal(r.pass, true);
});
