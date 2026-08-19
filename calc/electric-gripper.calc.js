'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 전동 그리퍼 계산 — 순수 함수 (DOM 비의존)
   출처: electric-gripper.html 무손실 추출 (계산식 불변)
   ══════════════════════════════════════════════════════════════ */

/**
 * 필요 파지력 계산 (×2: 양쪽 핑거 반력 합산)
 * @param {number} w  워크 무게 [g]
 */
function calcRequiredForce(w) {
  return (w / 1000) * 9.81 * 2;
}

/**
 * 전동 그리퍼 모델 판정
 * @param {object} m     모델 { forceMin, forceMax, stroke, comm:[], robots:[] }
 * @param {number} fRequired 필요 파지력 [N]
 * @param {number} width  워크피스 폭 [mm]
 * @param {string} comm   통신 방식 'dio' | 'iolink'
 * @param {string} robot  로봇 종류 'ur'|'doosan'|'kuka'|'fanuc'|'other'
 */
function judgeEGripper(m, fRequired, width, comm, robot) {
  if (fRequired > m.forceMax) return 'bad';
  const strokeOk   = m.stroke >= width;
  const commOk     = m.comm.indexOf(comm) !== -1;
  const robotOk    = m.robots.length === 0 || m.robots.indexOf(robot) !== -1;
  const forceInRange = fRequired >= m.forceMin;
  if (!strokeOk || !commOk || !robotOk || !forceInRange) return 'warn';
  return 'ok';
}

module.exports = { calcRequiredForce, judgeEGripper };
