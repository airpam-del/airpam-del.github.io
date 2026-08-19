'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn LM가이드 계산 — 순수 함수 (DOM 비의존)
   출처: lmguide.html 인라인 <script> 무손실 추출 (계산식 불변)
   ══════════════════════════════════════════════════════════════ */

const MAKER_DATA = {
  rexroth: [ 1005, 2385, 2916, 3722, 5280, 8807 ],
  thk:     [  830, 1380, 1910, 2890, 3760, 6010 ],
  hiwin:   [ 1160, 1810, 2159, 3338, 4820, 7902 ],
  tbi:     [  815, 1590, 2040, 2946, 3934, 6626 ],
  pmi:     [  867, 1632, 2040, 3160, 4283, 6934 ],
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

module.exports = { calcAvgSpeed, getfw, getVerdict, selectModel, calcL10km, LM_MODELS, LM_MIN_YEARS };
