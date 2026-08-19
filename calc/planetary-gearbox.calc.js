'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 유성 감속기 계산 — 순수 함수 (DOM 비의존)
   출처: planetary-gearbox.html 무손실 추출 (계산식 불변)
   ══════════════════════════════════════════════════════════════ */

const L_BASE_PG = 20000; // 카탈로그 기준 수명 [h]

/**
 * 설계 토크 계산
 * @param {number} tLoad 부하 토크 [N·m]
 * @param {number} kf    서비스 팩터
 */
function calcDesignTorque(tLoad, kf) {
  return tLoad * kf;
}

/**
 * 유성 감속기 수명 추정
 * @param {number} tDesign    설계 토크 [N·m]
 * @param {number} ratedTorque 정격 토크 [N·m]
 */
function calcPGLife(tDesign, ratedTorque) {
  const torqueRatio = tDesign / ratedTorque;
  return Math.round(L_BASE_PG * Math.pow(1 / torqueRatio, 10/3));
}

/**
 * 유성 감속기 단일 시리즈 판정
 * @param {object} s       시리즈 { ratios, torqueRange, maxRpm, bl }
 * @param {number} ratio   선택 감속비
 * @param {number} tDesign 설계 토크 [N·m]
 * @param {number} nInput  입력 rpm
 * @param {number} blMax   허용 백래시 [arcmin]
 * @param {number} lh      요구 수명 [h]
 */
function judgePG(s, ratio, tDesign, nInput, blMax, lh) {
  if (!s.ratios.includes(ratio)) return null;
  if (s.bl > blMax) return null;
  const ratedTorque = s.torqueRange[1];
  if (ratedTorque < tDesign) return null; // 토크 부족

  const rpmOk = nInput <= s.maxRpm;
  const L10h  = calcPGLife(tDesign, ratedTorque);
  const lifeOk = L10h >= lh;
  const overall = (!rpmOk) ? 'bad' : (!lifeOk) ? 'warn' : 'ok';

  return { series:s.series, ratio, ratedTorque, tDesign, bl:s.bl,
           L10h, lifeOk, rpmOk, eff:s.eff, overall };
}

module.exports = { calcDesignTorque, calcPGLife, judgePG, L_BASE_PG };
