'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 서보모터 계산 — 순수 함수 (DOM 비의존)
   출처: servo_motor.html 인라인 <script> 무손실 추출 (계산식 불변)
   ══════════════════════════════════════════════════════════════ */

const MOTORS = [
  { maker:'미쯔비시', series:'HG-KR', model:'HG-KR053', power:50,   Tr:0.159, Tmax:0.477, J:0.013, nr:3000, nmax:6000 },
  { maker:'미쯔비시', series:'HG-KR', model:'HG-KR13',  power:100,  Tr:0.318, Tmax:0.955, J:0.028, nr:3000, nmax:6000 },
  { maker:'미쯔비시', series:'HG-KR', model:'HG-KR23',  power:200,  Tr:0.637, Tmax:1.91,  J:0.072, nr:3000, nmax:6000 },
  { maker:'미쯔비시', series:'HG-KR', model:'HG-KR43',  power:400,  Tr:1.27,  Tmax:3.82,  J:0.230, nr:3000, nmax:6000 },
  { maker:'미쯔비시', series:'HG-KR', model:'HG-KR73',  power:750,  Tr:2.39,  Tmax:7.16,  J:0.610, nr:3000, nmax:6000 },
  { maker:'미쯔비시', series:'HG-SR', model:'HG-SR52',  power:500,  Tr:2.39,  Tmax:7.16,  J:1.04,  nr:2000, nmax:3000 },
  { maker:'미쯔비시', series:'HG-SR', model:'HG-SR102', power:1000, Tr:4.77,  Tmax:14.3,  J:2.30,  nr:2000, nmax:3000 },
  { maker:'파나소닉', series:'MSMF', model:'MSMF5AZL1',  power:50,   Tr:0.159, Tmax:0.477, J:0.013, nr:3000, nmax:5000 },
  { maker:'파나소닉', series:'MSMF', model:'MSMF012L1',  power:100,  Tr:0.318, Tmax:0.955, J:0.030, nr:3000, nmax:5000 },
  { maker:'파나소닉', series:'MSMF', model:'MSMF022L1',  power:200,  Tr:0.637, Tmax:1.91,  J:0.078, nr:3000, nmax:5000 },
  { maker:'LS산전',  series:'APMC', model:'APMC-S0S',   power:50,   Tr:0.159, Tmax:0.477, J:0.012, nr:3000, nmax:5000 },
  { maker:'LS산전',  series:'APMC', model:'APMC-S1S',   power:100,  Tr:0.318, Tmax:0.955, J:0.025, nr:3000, nmax:5000 },
  { maker:'LS산전',  series:'APMC', model:'APMC-S2S',   power:200,  Tr:0.637, Tmax:1.91,  J:0.065, nr:3000, nmax:5000 },
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

  return { m, pass, Jm, JL, Jt, ir, T_acc, T_peak, T_rms, T_dec, n_motor,
           ok_rpm, ok_Trms, ok_Tpk, ok_ir };
}

module.exports = { evalMotor, MOTORS };
