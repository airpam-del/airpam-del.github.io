'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 공압 그리퍼 계산 — 순수 함수 (DOM 비의존)
   출처: pneumatic-gripper.html 무손실 추출 (계산식 불변)
   ══════════════════════════════════════════════════════════════ */

/**
 * 필요 파지력 계산
 * @param {number} w    워크 무게 [g]
 * @param {number} safetyFactor  안전율 (기본 15)
 */
function calcRequiredForce(w, safetyFactor) {
  safetyFactor = safetyFactor || 15;
  return (w / 1000) * 9.81 * safetyFactor;
}

/**
 * 그리퍼 모델 판정
 * @param {object} m       모델 { forceOuter, forceInner, pMin, pMax }
 * @param {number} fRequired 필요 파지력 [N]
 * @param {string} gripDir   'outer' | 'inner'
 * @param {number} pressure  공급압 [MPa]
 */
function judgeGripper(m, fRequired, gripDir, pressure) {
  const fRated = gripDir === 'outer' ? m.forceOuter : m.forceInner;
  const pressureOk = pressure >= m.pMin;
  const forceOk    = fRated >= fRequired;
  if (!pressureOk || !forceOk) return { status:'bad', fRated };
  if (fRated < fRequired * 1.3) return { status:'warn', fRated };
  return { status:'ok', fRated };
}

module.exports = { calcRequiredForce, judgeGripper };
