'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 솔레노이드 밸브 계산 — 순수 함수 (DOM 비의존)
   출처: solenoid-valve.html 무손실 추출 (계산식 불변)
   ══════════════════════════════════════════════════════════════ */

/* 솔레노이드 밸브용 보어별 면적 [mm²] (π/4·D²) */
const BORE_TABLE_SV = {20:314,25:491,32:804,40:1257,50:1963,63:3117,80:5027,100:7854};

/**
 * 필요 유량 계산 [L/min ANR]
 * @param {number} bore   실린더 보어 [mm]
 * @param {number} speed  피스톤 속도 [mm/s]
 * @param {number} supplyP 공급압 [MPa] (default 0.5)
 */
function calcQRequired(bore, speed, supplyP) {
  supplyP = supplyP || 0.5;
  const area = BORE_TABLE_SV[bore] || 804;
  return (area * speed * 60) / 1000000 * (supplyP / 0.1013 + 1);
}

/**
 * 밸브 판정
 * @param {number} qRated    밸브 정격 유량 [L/min]
 * @param {number} qRequired 필요 유량 [L/min]
 */
function judgeValve(qRated, qRequired) {
  const margin = qRated / qRequired;
  if (margin >= 1.2) return { status:'ok',   margin };
  if (margin >= 1.0) return { status:'warn',  margin };
  return                    { status:'bad',   margin };
}

module.exports = { calcQRequired, judgeValve, BORE_TABLE_SV };
