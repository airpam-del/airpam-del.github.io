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

// η_gear: [1500N, 1500L, 1000N, 1000L, 750N, 750L, 500N, 500L] — screwjack.html ETA_GEAR
const ETA_GEAR = {
  'ZE-5':   [0.82,0.70,0.82,0.67,0.82,0.65,0.82,0.62],
  'ZE-10':  [0.84,0.74,0.82,0.72,0.84,0.70,0.84,0.67],
  'ZE-25':  [0.87,0.72,0.86,0.70,0.85,0.68,0.83,0.65],
  'ZE-35':  [0.87,0.64,0.87,0.64,0.86,0.64,0.85,0.63],
  'ZE-50':  [0.87,0.66,0.86,0.66,0.85,0.66,0.84,0.65],
  'ZE-100': [0.88,0.67,0.87,0.65,0.87,0.65,0.85,0.65],
  'ZE-150': [0.89,0.67,0.89,0.66,0.88,0.65,0.87,0.63],
  'ZE-200': [0.90,0.77,0.90,0.77,0.90,0.77,0.90,0.76],
};

// 시스템 레이아웃 토크 배율 — screwjack.html LAYOUTS
const LAYOUTS = {
  1: [{ label:'단독',   mult:1.0 }],
  2: [{ label:'A형',    mult:2.1 }, { label:'T형',      mult:2.4 }],
  4: [{ label:'H형',    mult:4.9 }, { label:'직렬 I형', mult:3.6 }, { label:'T형', mult:3.5 }],
  6: [{ label:'복합',   mult:7.1 }],
};

function getEtaGear(model, gr) {
  const arr = ETA_GEAR[model.model];
  if (!arr) return 0.85;
  return gr === 'L' ? arr[1] : arr[0];
}
function getEtaScrew(model, screwType) {
  if (screwType === 'ball') return 0.90;
  const base = ETA_SCREW_SINGLE[model.screw] || 0.35;
  return screwType === 'tr2' ? base * 1.5 : base;
}

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

  const eta_screw = getEtaScrew(model, screwType);
  const eta_gear  = getEtaGear(model, gr); // screwjack.html: ETA_GEAR[model][N=0/L=1]

  const pitchM = model.pitch / 1000;
  const MG = (F_kN * 1000 * pitchM) / (2 * Math.PI * eta_gear * eta_screw * i);
  const PM  = MG * n_rpm / 9550;
  const PM_rec = PM * msf;
  const MR = MG * (layoutMult || 1.0);
  const MA = MR * 1.5;
  return { n_rpm, MG, PM, PM_rec, MR, MA, eta_gear, eta_screw, i, feedPerRev };
}

/* ══════════════════════════════════════════════════════════════
   선정 파이프라인 — screwjack.html buildModelCards + buildStep5 무손실 사본
   screwjack.html은 이 모듈을 로드하지 않는 병렬 사본이므로, html 로직을
   고치면 여기도 동일 유지할 것.
   ⚠️ 좌굴은 총하중(S.F), 토크는 잭당(F_jack=F/qty) 기준 — html과 동일.
   입력 계약 input = { F_kg, qty, layout(index), L, euler, vsf, msf,
                       screw:'tr1'|'tr2'|'ball', gr:'N'|'L', v, actMode:'R'|'L',
                       selectedModel? }
   ══════════════════════════════════════════════════════════════ */
function computeSJ(input) {
  const F_total = input.F_kg * 9.81 / 1000;   // kg → kN (getInputs)
  const qty = input.qty, F_jack = F_total / qty;
  const { L, euler, vsf, msf, screw, gr, v, actMode } = input;

  // 후보: 정격 하중 + 좌굴(총하중 기준)
  const candidates = ZE_MODELS.map(m => {
    const loadPass = m.rated >= F_jack;
    const buck = calcBuckling(m, F_total, L, euler, vsf, screw);
    return { m, loadPass, buck, pass: loadPass && buck.pass };
  });
  const recommended = (candidates.find(c => c.pass) || {}).m || null;

  const selected = input.selectedModel
    ? (ZE_MODELS.find(m => m.model === input.selectedModel) || null)
    : recommended;

  if (!selected) {
    return { F_total, F_jack, candidates, recommended, selected: null, torque: null, alerts: [], needBrake: null };
  }

  const layoutMult = (LAYOUTS[qty] && LAYOUTS[qty][input.layout]) ? LAYOUTS[qty][input.layout].mult : 1.0;
  const torque = calcTorqueMotor(selected, F_jack, v, gr, screw, msf, layoutMult);
  const buck = calcBuckling(selected, F_total, L, euler, vsf, screw);
  const isSelfLocking = screw === 'tr1' && getEtaScrew(selected, screw) < 0.5;
  const needBrake = !isSelfLocking;

  // 경고 (buildStep5 조건과 동일, 메시지 대신 type 플래그)
  const alerts = [];
  alerts.push(buck.pass ? { type: 'buckOk', cls: 'ab-ok' } : { type: 'buckDanger', cls: 'ab-danger' });
  if (F_jack < selected.rated * 0.15) alerts.push({ type: 'minLoad', cls: 'ab-warn' });
  if (actMode === 'R') {
    const coreD = screw === 'ball' ? selected.coreBall : selected.coreTr;
    const n_kr = 4.73e6 * coreD / (L ** 2);
    if (torque.n_rpm > 0.8 * n_kr) alerts.push({ type: 'critRpm', cls: 'ab-warn', n_kr });
  }
  if (needBrake) alerts.push({ type: 'selfLock', cls: 'ab-info' });

  return { F_total, F_jack, candidates, recommended, selected, torque, buck, alerts, needBrake };
}

module.exports = {
  calcBuckling, calcTorqueMotor, computeSJ, getEtaGear, getEtaScrew,
  ZE_MODELS, ETA_SCREW_SINGLE, ETA_GEAR, LAYOUTS,
};
