'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn LM가이드 계산 — 순수 함수 (DOM 비의존)
   출처: lmguide.html 인라인 <script> 무손실 추출 (계산식 불변)
   ══════════════════════════════════════════════════════════════ */

const MAKER_DATA = {
  // C100(kgf) — 현행 카탈로그 실측(2026 대조). lmguide.html과 동기화
  rexroth: [ 1005, 2385, 2916, 3720, 5280, 8807 ],  // BSHP FNS
  thk:     [  882, 1602, 2233, 3277, 4361, 6650 ],  // HSR-C
  hiwin:   [ 1189, 2193, 2824, 3924, 5226, 8398 ],  // HGH-CA
  tbi:     [  957, 1627, 2048, 3021, 4040, 6010 ],  // TRH-VN
  pmi:     [  955, 1553, 2273, 3171, 4207, 6780 ],  // MSA-S
};
const MAKER_C0 = {
  rexroth: [ 1295, 3038, 3660, 4903, 8247,13456 ],
  thk:     [ 1100, 1906, 2701, 4138, 5556, 9328 ],
  hiwin:   [ 1731, 2828, 3669, 5040, 7060,11954 ],
  tbi:     [ 1600, 3500, 4500, 6500, 9000,16000 ],
  pmi:     [ 1600, 3400, 4400, 6200, 8700,15000 ],
};
const LM_SIZES = [15, 20, 25, 30, 35, 45];
const LM_MODELS = LM_SIZES.map((size, i) => {
  const keys = Object.keys(MAKER_DATA);
  const avgC100 = Math.round(keys.reduce((s, k) => s + MAKER_DATA[k][i], 0) / keys.length);
  const avgC0   = Math.round(keys.reduce((s, k) => s + MAKER_C0[k][i],   0) / keys.length);
  return { size, C100: avgC100, C0: avgC0 };
});
const LM_MIN_YEARS = 5;

function calcAvgSpeed(V, stroke, tn) {
  const accelDist = 0.5 * V * tn;
  const decelDist = accelDist;
  const constDist = Math.max(0, stroke - accelDist - decelDist);
  const tripTime  = tn + (constDist > 0 ? constDist / V : 0) + tn;
  const avgSpeed  = stroke / tripTime;
  return { avgSpeed, accelDist, constDist, decelDist, tripTime };
}

function getfw(speed) {
  if (speed <= 50)  return 1.0;
  if (speed <= 300) return 1.2;
  if (speed <= 600) return 1.5;
  return 1.8;
}

function getVerdict(ratio, years) {
  if (ratio < 3)              return { cls:'verdict-bad',  text:'부적합' };
  if (ratio < 4)              return { cls:'verdict-warn', text:'주의' };
  if (years < LM_MIN_YEARS)  return { cls:'verdict-warn', text:'수명 부족' };
  return                             { cls:'verdict-ok',   text:'적합' };
}

function selectModel(P, speed, hours, mode, tn, stroke) {
  for (const m of LM_MODELS) {
    const L10_km = Math.pow(m.C100 / P, 3) * 100;
    let years;
    if (mode === 'advanced' && tn && stroke) {
      const { avgSpeed } = calcAvgSpeed(speed, stroke, tn);
      years = (L10_km / ((avgSpeed * 3600 * hours) / 1e6)) / 365;
    } else {
      years = (L10_km / ((speed * 0.65 * 3600 * hours) / 1e6)) / 365;
    }
    if (m.C0 / P >= 4.0 && years >= LM_MIN_YEARS) return m;
  }
  return LM_MODELS[LM_MODELS.length - 1];
}

function calcL10km(C100, P) {
  return Math.pow(C100 / P, 3) * 100;
}

/* ══════════════════════════════════════════════════════════════
   렌더 파이프라인 — lmguide.html calcSimple/calcAdvanced + buildCompareTable
   + renderSafety 의 무손실 사본 (계산식 불변). lmguide.html은 이 모듈을
   로드하지 않는 병렬 사본이므로, html 로직을 고치면 여기도 동일 유지할 것.
   입력 계약:
     simple  : { mode:'simple',   load, speed, hours, blocks, sets, dirFactor, selectedSizes? }
     advanced: { mode:'advanced', load, speed, hours, blocks, sets, dirFactor,
                 stroke, tn, blockDist, railDist, height, eccentric, selectedSizes? }
   ══════════════════════════════════════════════════════════════ */
function lmSafetyText(verdictText) {
  if (verdictText === '적합')      return '적합 — 안전율 및 수명 기준 충족';
  if (verdictText === '수명 부족') return '주의 — 안전율은 충족하나 수명이 ' + LM_MIN_YEARS + '년 미만입니다';
  if (verdictText === '주의')      return '주의 — 안전율이 권장 기준(4배)보다 낮습니다';
  return '부적합 — 상위 사이즈 또는 블록 수 증가를 권장합니다';
}

function lmComputeP(input) {
  const fw = getfw(input.speed);
  const totalBlocks = (input.blocks || 1) * (input.sets || 1);
  if (input.mode === 'advanced') {
    const pload = (input.load / totalBlocks) * input.dirFactor * fw;
    const My = input.load * (input.height || 0);
    const Mz = input.load * (input.eccentric || 0);
    const blockDist = input.blockDist || 0, railDist = input.railDist || 0;
    const Fmy = blockDist > 0 ? (2 * My) / (blockDist * totalBlocks) : 0;
    const Fmz = railDist  > 0 ? (2 * Mz) / (railDist  * totalBlocks) : 0;
    return { P: pload + Fmy + Fmz, pload, fw };
  }
  const P = (input.load / totalBlocks) * input.dirFactor * fw;
  return { P, pload: P, fw };
}

function lmRowFor(size, P, input, avgSpeed) {
  const m = LM_MODELS.find(x => x.size === size);
  const L10km = Math.pow(m.C100 / P, 3) * 100;
  let years, opHours = null;
  if (input.mode === 'advanced') {
    years   = (L10km / ((avgSpeed * 3600 * input.hours) / 1e6)) / 365;
    opHours = L10km / ((avgSpeed * 3600) / 1e6);
  } else {
    years = (L10km / ((input.speed * 0.65 * 3600 * input.hours) / 1e6)) / 365;
  }
  const ratio = m.C0 / P;
  const v = getVerdict(ratio, years);
  return { size, L10km, years, opHours, ratio, verdict: v.text, verdictCls: v.cls };
}

function computeLM(input) {
  const { P, pload } = lmComputeP(input);
  const avgSpeed = input.mode === 'advanced'
    ? calcAvgSpeed(input.speed, input.stroke, input.tn).avgSpeed
    : null;
  const sel = selectModel(P, input.speed, input.hours, input.mode, input.tn, input.stroke);
  const summaryRow = lmRowFor(sel.size, P, input, avgSpeed);
  const sizes = [...new Set([sel.size, ...(input.selectedSizes || [])])].sort((a, b) => a - b);
  const rows = sizes.map(s => lmRowFor(s, P, input, avgSpeed));
  return {
    P, pload, avgSpeed,
    recommended: { size: sel.size, C100: sel.C100, C0: sel.C0 },
    summary: { L10km: summaryRow.L10km, years: summaryRow.years, ratio: summaryRow.ratio, verdict: summaryRow.verdict },
    safetyText: lmSafetyText(summaryRow.verdict),
    rows,
  };
}

module.exports = {
  calcAvgSpeed, getfw, getVerdict, selectModel, calcL10km,
  lmComputeP, lmRowFor, lmSafetyText, computeLM,
  LM_MODELS, LM_MIN_YEARS,
};
