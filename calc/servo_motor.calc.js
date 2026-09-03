'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 서보모터 계산 — 순수 함수 (DOM 비의존)
   출처: servo_motor.html 인라인 <script> 무손실 추출 (계산식 불변)
   ══════════════════════════════════════════════════════════════ */

const MOTORS = [
  // J: 현행 카탈로그 실측(2026 대조). servo_motor.html과 동기화 (축약 서브셋)
  { maker:'미쯔비시', series:'HG-KR', model:'HG-KR053', power:50,   Tr:0.159, Tmax:0.56, J:0.045,  nr:3000, nmax:6000 },
  { maker:'미쯔비시', series:'HG-KR', model:'HG-KR13',  power:100,  Tr:0.318, Tmax:1.1,  J:0.0777, nr:3000, nmax:6000 },
  { maker:'미쯔비시', series:'HG-KR', model:'HG-KR23',  power:200,  Tr:0.637, Tmax:2.2,  J:0.221,  nr:3000, nmax:6000 },
  { maker:'미쯔비시', series:'HG-KR', model:'HG-KR43',  power:400,  Tr:1.27,  Tmax:4.5,  J:0.371,  nr:3000, nmax:6000 },
  { maker:'미쯔비시', series:'HG-KR', model:'HG-KR73',  power:750,  Tr:2.39,  Tmax:8.4,  J:1.26,   nr:3000, nmax:6000 },
  { maker:'미쯔비시', series:'HG-SR', model:'HG-SR52',  power:500,  Tr:2.39,  Tmax:7.16,  J:7.26,  nr:2000, nmax:3000 },
  { maker:'미쯔비시', series:'HG-SR', model:'HG-SR102', power:1000, Tr:4.77,  Tmax:14.3,  J:11.6,  nr:2000, nmax:3000 },
  { maker:'파나소닉', series:'MSMF', model:'MSMF5AZL1',  power:50,   Tr:0.159, Tmax:0.477, J:0.026, nr:3000, nmax:5000 },
  { maker:'파나소닉', series:'MSMF', model:'MSMF012L1',  power:100,  Tr:0.318, Tmax:0.955, J:0.048, nr:3000, nmax:5000 },
  { maker:'파나소닉', series:'MSMF', model:'MSMF022L1',  power:200,  Tr:0.637, Tmax:1.91,  J:0.14,  nr:3000, nmax:5000 },
  { maker:'LS산전',  series:'APMC', model:'APMC-FALR5A', power:50,   Tr:0.159, Tmax:0.477, J:0.023, nr:3000, nmax:5000 },
  { maker:'LS산전',  series:'APMC', model:'APMC-FAL01A', power:100,  Tr:0.318, Tmax:0.955, J:0.043, nr:3000, nmax:5000 },
  { maker:'LS산전',  series:'APMC', model:'APMC-FBL02A', power:200,  Tr:0.637, Tmax:1.91,  J:0.147, nr:3000, nmax:5000 },
];

/**
 * 서보모터 적합 여부 평가
 * @param {object} m  MOTORS 항목
 * @param {object} p  { J_load, J_drive, ratio, T_drive, alpha_motor, n_motor, tacc, tdec, tcycle }
 */
function evalMotor(m, p) {
  const { J_load, J_drive, ratio, T_drive, alpha_motor, n_motor, tacc, tdec, tcycle } = p;
  const Jm = m.J * 1e-4;
  const JL = J_load / (ratio * ratio);
  const Jt = Jm + JL + J_drive;
  const ir = JL / Jm;

  const T_acc   = Jt * alpha_motor;
  const T_peak  = T_drive + T_acc;
  const T_dec   = Math.max(0, T_drive - T_acc);
  const t_const = Math.max(0, tcycle - tacc - tdec);

  const T_rms = Math.sqrt(
    (T_peak*T_peak*tacc + T_drive*T_drive*t_const + T_dec*T_dec*tdec) / tcycle
  );

  const ok_rpm  = n_motor <= m.nmax;
  const ok_Trms = T_rms <= m.Tr * 0.9;
  const ok_Tpk  = T_peak <= m.Tmax;
  const ok_ir   = ir <= 10;
  const pass = ok_rpm && ok_Trms && ok_Tpk && ok_ir;

  const fails = [];
  if (!ok_rpm)  fails.push(`RPM 초과(${Math.round(n_motor)} > ${m.nmax})`);
  if (!ok_Trms) fails.push(`실효토크 초과`);
  if (!ok_Tpk)  fails.push(`순시토크 초과`);
  if (!ok_ir)   fails.push(`관성비 과대`);

  return { m, pass, Jm, JL, Jt, ir, T_acc, T_peak, T_rms, T_dec, n_motor,
           ok_rpm, ok_Trms, ok_Tpk, ok_ir, reason: fails.join(' · ') };
}

/* ══════════════════════════════════════════════════════════════
   부하 물리계산 — servo_motor.html calcLoad 무손실 사본 (5개 기구)
   servo_motor.html은 이 모듈을 로드하지 않는 병렬 사본이므로,
   html calcLoad/showResult 를 고치면 여기도 동일 유지할 것.
   상수: G=9.81, RHO=7.85e-6 kg/mm³
   입력 키 = DOM id 의 camelCase (op·bt·gr·bs·rp·cv·idx·rot 접두사)
   ══════════════════════════════════════════════════════════════ */
const SV_G = 9.81, SV_RHO = 7.85e-6;

function computeServoLoad(input) {
  const lt = input.lt, dt = input.dt;
  const tacc = input.opTacc, tdec = input.opTdec, tcycle = input.opTcycle;

  let ratio = 1, eta_drive = 1, J_drive = 0;
  if (dt === 'belt') {
    const Dd = input.btDrive, Dn = input.btDriven, bm = input.btMass;
    eta_drive = input.btEta;
    ratio = Dn / Dd;
    J_drive = bm * Math.pow(Dd / 2 / 1000, 2);
  } else if (dt === 'gear' || dt === 'chain') {
    ratio = input.grRatio;
    eta_drive = input.grEta;
    J_drive = input.grJ * 1e-4;
  }

  let n_motor = 0, J_load = 0, T_drive = 0, alpha_motor = 0;
  let eta_mech = 1;

  if (lt === 'ballscrew') {
    const lead = input.bsLead, ds = input.bsDiam, Ls = input.bsLen;
    eta_mech = input.bsEta;
    const mass = input.bsMass, mu = input.bsMu, ori = input.bsOri, cb = input.bsCb, Fext = input.bsExtload;
    const speed = input.opSpeed;
    n_motor = (speed / lead * 60) * ratio;
    const r = lead / (2 * Math.PI) / 1000;
    const J_screw = (Math.PI * SV_RHO / 32) * Math.pow(ds, 4) * Ls * 1e-9;
    J_load = J_screw + mass * r * r;
    const W = mass * SV_G;
    const Ff = mu * W;
    const Fg = (ori === 'v' && !cb) ? W : 0;
    T_drive = (Fext + Ff + Fg) * (lead / 1000) / (2 * Math.PI * eta_mech * eta_drive) / ratio;
    const omega_m = speed / 1000 * 2 * Math.PI / (lead / 1000) * ratio;
    alpha_motor = omega_m / tacc;

  } else if (lt === 'rack') {
    const D = input.rpDiam, mass = input.rpMass, rackM = input.rpRackMass;
    eta_mech = input.rpEta;
    const mu = input.rpMu, ori = input.rpOri, Fext = input.rpExtload, speed = input.opSpeed;
    const r = D / 2 / 1000;
    n_motor = speed * 60 / (Math.PI * D) * ratio;
    J_load = (mass + rackM) * r * r;
    const totM = mass + rackM;
    const Ff = mu * totM * SV_G;
    const Fg = (ori === 'v') ? totM * SV_G : 0;
    T_drive = (Fext + Ff + Fg) * r / (eta_mech * eta_drive) / ratio;
    const omega_m = speed / 1000 / r * ratio;
    alpha_motor = omega_m / tacc;

  } else if (lt === 'conveyor') {
    const D = input.cvRoller, mass = input.cvMass, bm = input.cvBeltMass;
    eta_mech = input.cvEta;
    const mu = input.cvMu, ang = input.cvAngle * Math.PI / 180, speed = input.opSpeed;
    const r = D / 2 / 1000;
    n_motor = speed * 60 / (Math.PI * D) * ratio;
    J_load = (mass + bm) * r * r;
    const Ff = (mass + bm) * SV_G * Math.cos(ang) * mu;
    const Fg = (mass + bm) * SV_G * Math.sin(ang);
    T_drive = (Ff + Fg) * r / (eta_mech * eta_drive) / ratio;
    const omega_m = speed / 1000 / r * ratio;
    alpha_motor = omega_m / tacc;

  } else if (lt === 'index') {
    const D = input.idxDiam, mass = input.idxMass, div = input.idxDiv, tIdx = input.idxTime;
    const alpha = input.idxDist, Tres = input.idxResist;
    const theta = 2 * Math.PI / div;
    const ta = Math.min(tacc, tIdx * 0.4);
    const omega_max = theta / ((ta + tdec) / 2 + Math.max(0, tIdx - ta - tdec));
    n_motor = omega_max * ratio * 60 / (2 * Math.PI);
    const r = D / 2 / 1000;
    J_load = alpha * mass * r * r;
    T_drive = Tres / (eta_drive) / ratio;
    alpha_motor = omega_max * ratio / ta;

  } else if (lt === 'rotary') {
    const D = input.rotDiam, mass = input.rotMass, trpm = input.rotRpm;
    eta_mech = input.rotEta;
    const Tres = input.rotResist;
    n_motor = trpm * ratio;
    const r = D / 2 / 1000;
    J_load = 0.5 * mass * r * r;
    T_drive = Tres / (eta_mech * eta_drive) / ratio;
    const omega_m = n_motor * 2 * Math.PI / 60;
    alpha_motor = omega_m / tacc;
  }

  return { n_motor, J_load, T_drive, alpha_motor, ratio, eta_drive, J_drive, tacc, tdec, tcycle };
}

/* 선정 파이프라인 — servo_motor.html showResult 기준 */
function computeServo(input) {
  const p = computeServoLoad(input);
  const allResults = MOTORS.map(m => evalMotor(m, p));
  const allPassing = allResults.filter(r => r.pass).sort((a, b) => a.m.power - b.m.power);
  return {
    p, allResults, allPassing,
    recommended: allPassing.length ? allPassing[0] : null,
    noFit: allPassing.length === 0,
  };
}

module.exports = { evalMotor, computeServoLoad, computeServo, MOTORS };
