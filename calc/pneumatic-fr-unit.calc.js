'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 공압 FR 유닛 계산 — 순수 함수 (DOM 비의존)
   출처: pneumatic-fr-unit.html 무손실 추출 (계산식 불변)
   ══════════════════════════════════════════════════════════════ */

/**
 * FR 유닛 유량 여유율 계산
 * @param {number} qRated   정격 유량 [L/min]
 * @param {number} flow     필요 유량 [L/min]
 */
function calcMargin(qRated, flow) {
  return qRated / flow;
}

/**
 * FR 유닛 필터 판정 (유량·압력 조건)
 * @param {object} m    모델 { qRated, pMin, pMax, port, filter }
 * @param {number} flow 필요 유량 [L/min]
 * @param {number} setP 설정 압력 [MPa]
 * @param {string} port 포트 사이즈 '1/8'|'1/4'|'3/8'|'1/2'
 * @param {string} filter '5um'|'0.3um'
 */
function judgeFRUnit(m, flow, setP, port, filter) {
  if (m.port !== port) return false;
  if (m.filter !== filter) return false;
  if (flow > m.qRated) return false;
  if (setP < m.pMin || setP > m.pMax) return false;
  return true;
}

module.exports = { calcMargin, judgeFRUnit };
