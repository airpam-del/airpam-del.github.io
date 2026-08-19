'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 스피드 컨트롤러 계산 — 순수 함수 (DOM 비의존)
   출처: speed-controller.html 무손실 추출 (계산식 불변)
   ══════════════════════════════════════════════════════════════ */

/* 보어별 수압 면적 [mm²] */
const BORE_TABLE_SC = {
  20:314, 25:491, 32:804, 40:1257, 50:1963, 63:3117, 80:5027, 100:7854
};
const STD_BORES_SC = [20, 25, 32, 40, 50, 63, 80, 100];

/**
 * 참고 유량 계산 [L/min ANR]
 * @param {number} bore   실린더 보어 [mm]
 * @param {number} speed  피스톤 속도 [mm/s]
 * @param {number} P      공급압 [MPa]
 */
function calcRefFlow(bore, speed, P) {
  const area = BORE_TABLE_SC[bore] || 804;
  return (area * speed * 60) / 1000000 * (P / 0.1013 + 1);
}

/**
 * 보어 헬퍼 — 필요 추력/압력으로 권장 보어 산정
 * 권장 추력 = P × A × 0.6 ≥ F
 * @param {number} F  필요 추력 [N]
 * @param {number} P  공급압 [MPa]
 */
function recommendBore(F, P) {
  for (const D of STD_BORES_SC) {
    const area = BORE_TABLE_SC[D];
    if (P * area * 0.6 >= F) return D;
  }
  return null;
}

/**
 * 수평 부하 추력 계산 [N]
 * @param {number} m   질량 [kg]
 * @param {number} mu  마찰계수
 */
function calcForceHorizontal(m, mu) {
  return m * 9.81 * mu * 1.5;
}

/**
 * 수직 부하 추력 계산 [N]
 * @param {number} m  질량 [kg]
 * @param {number} a  가속도 [m/s²]
 */
function calcForceVertical(m, a) {
  return m * 9.81 * 1.5 * a;
}

module.exports = { calcRefFlow, recommendBore, calcForceHorizontal, calcForceVertical,
                   BORE_TABLE_SC, STD_BORES_SC };
