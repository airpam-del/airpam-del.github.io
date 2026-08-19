'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 스크류잭 계산 — 순수 함수 (DOM 비의존)
   출처: screwjack.html 인라인 <script> 무손실 추출 (계산식 불변)
   ══════════════════════════════════════════════════════════════ */

const ZE_MODELS = [
  { model:'ZE-5',   rated:5,   screw:'Tr18×4',  pitch:4,  coreTr:12.9, coreBall:12.9, i_N:4,  i_L:16, feed_N:1.00, feed_L:0.25 },
  { model:'ZE-10',  rated:10,  screw:'Tr20×4',  pitch:4,  coreTr:14.9, coreBall:12.9, i_N:4,  i_L:16, feed_N:1.00, feed_L:0.25 },
  { model:'ZE-25',  rated:25,  screw:'Tr30×6',  pitch:6,  coreTr:22.1, coreBall:21.5, i_N:6,  i_L:24, feed_N:1.00, feed_L:0.25 },
  { model:'ZE-35',  rated:35,  screw:'Tr40×7',  pitch:7,  coreTr:31.0, coreBall:27.3, i_N:7,  i_L:28, feed_N:1.00, feed_L:0.25 },
  { model:'ZE-50',  rated:50,  screw:'Tr40×7',  pitch:7,  coreTr:31.0, coreBall:34.1, i_N:7,  i_L:28, feed_N:1.00, feed_L:0.25 },
  { model:'ZE-100', rated:100, screw:'Tr55×9',  pitch:9,  coreTr:43.6, coreBall:43.6, i_N:9,  i_L:36, feed_N:1.00, feed_L:0.25 },
  { model:'ZE-150', rated:150, screw:'Tr60×9',  pitch:9,  coreTr:48.6, coreBall:51.8, i_N:9,  i_L:36, feed_N:1.00, feed_L:0.25 },
  { model:'ZE-200', rated:200, screw:'Tr70×12', pitch:12, coreTr:55.2, coreBall:67.0, i_N:8,  i_L:24, feed_N:1.50, feed_L:0.50 },
];

const ETA_SCREW_SINGLE = {
  'Tr18×4':0.42,'Tr20×4':0.39,'Tr30×6':0.39,'Tr40×7':0.35,
  'Tr55×9':0.34,'Tr60×9':0.32,'Tr70×12':0.35
};

/**
 * 좌굴 계산
 * @param {object} model  ZE_MODELS 항목
 * @param {number} F_kN   잭 1개당 하중 [kN]
 * @param {number} L      스트로크 [mm]
 * @param {number} eulerN Euler 단부 조건 번호 (1~3)
 * @param {number} vsf    속도 안전율
 * @param {'tr1'|'tr2'|'ball'} screwType
 */
function calcBuckling(model, F_kN, L, eulerN, vsf, screwType) {
  const L_eff = { 1: L*2, 2: L, 3: L*0.7 }[eulerN];
  const E = 210000; // N/mm²
  const F_N = F_kN * 1000 * vsf;
  const I_req = F_N * (L_eff**2) / (Math.PI**2 * E);
  const d_min = Math.pow(I_req * 64 / Math.PI, 0.25);
  const coreD  = screwType === 'ball' ? model.coreBall : model.coreTr;
  return { L_eff, I_req, d_min, coreD, pass: coreD >= d_min };
}

/**
 * 구동 토크 및 RPM 계산
 * @param {object} model  ZE_MODELS 항목
 * @param {number} F_kN   잭 1개당 하중 [kN]
 * @param {number} v      이송 속도 [mm/s]
 * @param {'N'|'L'} gr    기어비 모드
 * @param {'tr1'|'tr2'|'ball'} screwType
 * @param {number} msf    모터 안전율
 * @param {number} layoutMult 배치 토크 배율
 */
function calcTorqueMotor(model, F_kN, v, gr, screwType, msf, layoutMult) {
  const i = gr === 'L' ? model.i_L : model.i_N;
  const feedPerRev = gr === 'L'
    ? model.feed_L * model.pitch
    : model.feed_N * model.pitch;
  const n_rpm = v * 60 / feedPerRev;

  let eta_screw;
  if (screwType === 'ball') eta_screw = 0.90;
  else {
    const base = ETA_SCREW_SINGLE[model.screw] || 0.35;
    eta_screw = screwType === 'tr2' ? base * 1.5 : base;
  }
  const eta_gear = 0.85; // 근사값 (N모드 1500rpm 기준)

  const pitchM = model.pitch / 1000;
  const MG = (F_kN * 1000 * pitchM) / (2 * Math.PI * eta_gear * eta_screw * i);
  const PM  = MG * n_rpm / 9550;
  const PM_rec = PM * msf;
  const MR = MG * (layoutMult || 1.0);
  const MA = MR * 1.5;
  return { n_rpm, MG, PM, PM_rec, MR, MA, eta_gear, eta_screw, i, feedPerRev };
}

module.exports = { calcBuckling, calcTorqueMotor, ZE_MODELS, ETA_SCREW_SINGLE };
