'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 하모닉 드라이브 계산 — 순수 함수 (DOM 비의존)
   출처: harmonic-drive.html 무손실 추출 (계산식 불변)
   ══════════════════════════════════════════════════════════════ */

/**
 * 감속비별 정격 토크 취득
 * @param {object} m      HD_MODELS 항목
 * @param {number} ratio  선택 감속비
 */
function getRatedTorque(m, ratio) {
  if (!m.rr.includes(ratio)) return null;
  if (m.tr) return m.tr[ratio] !== undefined ? m.tr[ratio] : null;
  const r0 = m.rr[0], r1 = m.rr[m.rr.length - 1];
  if (r0 === r1) return m.trMin;
  const t = (ratio - r0) / (r1 - r0);
  return Math.round((m.trMin + (m.trMax - m.trMin) * t) * 10) / 10;
}

/**
 * 하모닉 드라이브 단일 모델 판정
 * @param {object} m       HD_MODELS 항목
 * @param {number} ratio   선택 감속비
 * @param {number} tCont   연속 토크 [N·m]
 * @param {number} tPeak   피크 토크 [N·m]
 * @param {number} nInput  입력 rpm
 * @param {number} lh      요구 수명 [h]
 */
function judgeHD(m, ratio, tCont, tPeak, nInput, lh) {
  const ratedTorque = getRatedTorque(m, ratio);
  if (ratedTorque === null) return null;

  const peakApprox = !m.mp;
  const peakTorque = m.mp ? m.mp[ratio] : Math.round(ratedTorque * 3 * 10) / 10;
  const rpTorque   = m.rp ? m.rp[ratio] : null;

  const torqueOk    = tCont <= ratedTorque;
  const ratchetRisk = tPeak > peakTorque;
  const accelOver   = rpTorque !== null && !ratchetRisk && tPeak > rpTorque;
  const rpmOk       = nInput <= m.mrpm;

  // lifeH ≈ (T_rated / T_cont)^3 × l10 × (2000 / nInput)
  const lifeH = Math.round(
    Math.pow(ratedTorque / tCont, 3) * (m.l10 || 10000) * (2000 / nInput)
  );
  const lifeGrade = lifeH >= lh ? 'ok' : lifeH >= lh * 0.8 ? 'warn' : 'bad';

  let overall;
  if (!torqueOk || !rpmOk)       overall = 'bad';
  else if (ratchetRisk)           overall = 'bad';
  else if (lifeGrade === 'bad')   overall = 'bad';
  else if (accelOver || lifeGrade === 'warn') overall = 'warn';
  else                            overall = 'ok';

  return { ratedTorque, peakTorque, peakApprox, rpTorque, accelOver,
           torqueOk, rpmOk, ratchetRisk, lifeH, lifeGrade, overall };
}

module.exports = { getRatedTorque, judgeHD };
