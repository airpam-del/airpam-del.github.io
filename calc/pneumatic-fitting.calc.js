'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 공압 피팅 계산 — 순수 함수 (DOM 비의존)
   출처: pneumatic-fitting.html 무손실 추출 (계산식 불변)
   ══════════════════════════════════════════════════════════════ */

const OD_TABLE = [
  {od:4,  id:2.5, qMax:2.3},
  {od:6,  id:4.0, qMax:6.0},
  {od:8,  id:5.0, qMax:9.4},
  {od:10, id:6.5, qMax:15.9},
  {od:12, id:8.0, qMax:24.1},
  {od:16, id:10.0,qMax:37.6},
];

/**
 * 필요 내경 계산 [mm]
 * 공식: d = sqrt(4Q / (π × 8 × 60000)) × 1000
 * (배관 내 권장 유속 8 m/s = 8000 mm/s 기준)
 * @param {number} q  유량 [L/min]
 */
function calcRequiredID(q) {
  return Math.sqrt((4 * q) / (Math.PI * 8 * 60000)) * 1000;
}

/**
 * 추천 OD 선택 (내경 ≥ 필요 내경인 가장 작은 OD)
 * @param {number} dRequired 필요 내경 [mm]
 */
function recommendOD(dRequired) {
  const rec = OD_TABLE.find(r => r.id >= dRequired);
  return rec ? rec.od : null; // null: 범위 초과
}

module.exports = { calcRequiredID, recommendOD, OD_TABLE };
