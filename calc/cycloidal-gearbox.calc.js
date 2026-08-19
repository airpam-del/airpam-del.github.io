'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 사이클로이달 감속기 계산 — 순수 함수 (DOM 비의존)
   출처: cycloidal-gearbox.html 무손실 추출 (계산식 불변)
   ══════════════════════════════════════════════════════════════ */

/**
 * 사이클로이달 감속기 단일 시리즈 판정
 * @param {object} s        시리즈 { torqueMax, ratioMin, ratioMax, maxRpm, guaranteedLife, peakMultiplier }
 * @param {number} ratio    선택 감속비
 * @param {number} tLoad    부하 토크 [N·m]
 * @param {number} sf       서비스 팩터
 * @param {number} duty     운전 패턴 보정 (S1=1.0, S3=0.65 등)
 * @param {boolean} reverse 역방향 운전 (SF ×1.2)
 * @param {number} nInput   입력 rpm
 * @param {number} lh       요구 수명 [h]
 */
function judgeCG(s, ratio, tLoad, sf, duty, reverse, nInput, lh) {
  let sfFinal = reverse ? sf * 1.2 : sf;
  const tDesignEff  = tLoad * sfFinal;
  const tDesignDuty = tDesignEff * duty;

  if (ratio < s.ratioMin || ratio > s.ratioMax) return null;
  if (s.torqueMax < tDesignDuty) return null;

  const rpmOk  = nInput <= s.maxRpm;
  const rpmWarn = nInput > 1800;

  let lifeGrade;
  if (s.guaranteedLife >= lh * 1.2)      lifeGrade = 'ok';
  else if (s.guaranteedLife >= lh * 0.8) lifeGrade = 'warn';
  else                                    lifeGrade = 'bad';

  const peakTorque = s.torqueMax * s.peakMultiplier;

  let overall;
  if (!rpmOk || lifeGrade === 'bad')        overall = 'bad';
  else if (lifeGrade === 'warn' || rpmWarn) overall = 'warn';
  else                                       overall = 'ok';

  return { ratio, ratedTorque:s.torqueMax, tDesignDuty, lifeGrade,
           guaranteedLife:s.guaranteedLife, peakTorque, rpmOk, rpmWarn, overall };
}

module.exports = { judgeCG };
