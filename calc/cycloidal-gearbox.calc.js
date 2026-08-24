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

const CG_DATA = {
  sumitomo: {
    name: 'Sumitomo',
    series: [
      /* Cyclo 6000 — 산업용 범용 */
      { series:'Cyclo 6000', seriesTag:'산업용 범용', model:'6B', ratioMin:11, ratioMax:87,  torqueMin:58,   torqueMax:118,  maxRpm:1800, hysteresis:'< 3', eff:93, guaranteedLife:10000, peakMultiplier:5 },
      { series:'Cyclo 6000', seriesTag:'산업용 범용', model:'6C', ratioMin:11, ratioMax:119, torqueMin:120,  torqueMax:280,  maxRpm:1800, hysteresis:'< 3', eff:93, guaranteedLife:10000, peakMultiplier:5 },
      { series:'Cyclo 6000', seriesTag:'산업용 범용', model:'6D', ratioMin:11, ratioMax:119, torqueMin:290,  torqueMax:580,  maxRpm:1500, hysteresis:'< 3', eff:93, guaranteedLife:10000, peakMultiplier:5 },
      { series:'Cyclo 6000', seriesTag:'산업용 범용', model:'6E', ratioMin:11, ratioMax:119, torqueMin:600,  torqueMax:1200, maxRpm:1200, hysteresis:'< 3', eff:92, guaranteedLife:10000, peakMultiplier:5 },
      { series:'Cyclo 6000', seriesTag:'산업용 범용', model:'6F', ratioMin:11, ratioMax:119, torqueMin:1250, torqueMax:2500, maxRpm:1000, hysteresis:'< 3', eff:92, guaranteedLife:10000, peakMultiplier:5 },
      /* Fine Cyclo — 정밀 서보용 */
      { series:'Fine Cyclo', seriesTag:'정밀 서보용', model:'FC-A1', ratioMin:29, ratioMax:179, torqueMin:12,  torqueMax:25,   maxRpm:6150, hysteresis:'< 1', eff:90, guaranteedLife:20000, peakMultiplier:5 },
      { series:'Fine Cyclo', seriesTag:'정밀 서보용', model:'FC-A2', ratioMin:29, ratioMax:179, torqueMin:26,  torqueMax:55,   maxRpm:5000, hysteresis:'< 1', eff:90, guaranteedLife:20000, peakMultiplier:5 },
      { series:'Fine Cyclo', seriesTag:'정밀 서보용', model:'FC-A3', ratioMin:29, ratioMax:179, torqueMin:60,  torqueMax:130,  maxRpm:4000, hysteresis:'< 1', eff:88, guaranteedLife:20000, peakMultiplier:5 },
      { series:'Fine Cyclo', seriesTag:'정밀 서보용', model:'FC-A4', ratioMin:29, ratioMax:179, torqueMin:140, torqueMax:300,  maxRpm:3000, hysteresis:'< 1', eff:88, guaranteedLife:20000, peakMultiplier:5 },
      { series:'Fine Cyclo', seriesTag:'정밀 서보용', model:'FC-A5', ratioMin:29, ratioMax:179, torqueMin:320, torqueMax:700,  maxRpm:2500, hysteresis:'< 1', eff:87, guaranteedLife:20000, peakMultiplier:5 },
      { series:'Fine Cyclo', seriesTag:'정밀 서보용', model:'FC-A6', ratioMin:29, ratioMax:179, torqueMin:750, torqueMax:1600, maxRpm:2000, hysteresis:'< 1', eff:87, guaranteedLife:20000, peakMultiplier:5 },
    ]
  },
  nabtesco: {
    name: 'Nabtesco',
    series: [
      /* RV-E 시리즈 — 표준 */
      { series:'RV-E', seriesTag:'표준형', model:'RV-6E',   ratioMin:31, ratioMax:185, torqueMin:58,   torqueMax:58,   maxRpm:3000, hysteresis:'< 1', eff:85, guaranteedLife:20000, peakMultiplier:5 },
      { series:'RV-E', seriesTag:'표준형', model:'RV-20E',  ratioMin:31, ratioMax:185, torqueMin:196,  torqueMax:196,  maxRpm:3000, hysteresis:'< 1', eff:85, guaranteedLife:20000, peakMultiplier:5 },
      { series:'RV-E', seriesTag:'표준형', model:'RV-40E',  ratioMin:31, ratioMax:185, torqueMin:392,  torqueMax:392,  maxRpm:2500, hysteresis:'< 1', eff:85, guaranteedLife:20000, peakMultiplier:5 },
      { series:'RV-E', seriesTag:'표준형', model:'RV-80E',  ratioMin:31, ratioMax:185, torqueMin:784,  torqueMax:784,  maxRpm:2000, hysteresis:'< 1', eff:85, guaranteedLife:20000, peakMultiplier:5 },
      { series:'RV-E', seriesTag:'표준형', model:'RV-110E', ratioMin:31, ratioMax:185, torqueMin:1078, torqueMax:1078, maxRpm:2000, hysteresis:'< 1', eff:85, guaranteedLife:20000, peakMultiplier:5 },
      { series:'RV-E', seriesTag:'표준형', model:'RV-160E', ratioMin:31, ratioMax:185, torqueMin:1568, torqueMax:1568, maxRpm:1500, hysteresis:'< 1', eff:85, guaranteedLife:20000, peakMultiplier:5 },
      { series:'RV-E', seriesTag:'표준형', model:'RV-320E', ratioMin:31, ratioMax:185, torqueMin:3136, torqueMax:3136, maxRpm:1500, hysteresis:'< 1', eff:85, guaranteedLife:20000, peakMultiplier:5 },
      /* RV-N 시리즈 — 컴팩트·고토크 */
      { series:'RV-N', seriesTag:'컴팩트·고토크', model:'RV-245N', ratioMin:40, ratioMax:200, torqueMin:2450, torqueMax:2450, maxRpm:1500, hysteresis:'< 1', eff:85, guaranteedLife:20000, peakMultiplier:5 },
      { series:'RV-N', seriesTag:'컴팩트·고토크', model:'RV-320N', ratioMin:40, ratioMax:200, torqueMin:3136, torqueMax:3136, maxRpm:1500, hysteresis:'< 1', eff:85, guaranteedLife:20000, peakMultiplier:5 },
      { series:'RV-N', seriesTag:'컴팩트·고토크', model:'RV-500N', ratioMin:40, ratioMax:200, torqueMin:4900, torqueMax:4900, maxRpm:1200, hysteresis:'< 1', eff:85, guaranteedLife:20000, peakMultiplier:5 },
      { series:'RV-N', seriesTag:'컴팩트·고토크', model:'RV-800N', ratioMin:40, ratioMax:200, torqueMin:7840, torqueMax:7840, maxRpm:1000, hysteresis:'< 1', eff:85, guaranteedLife:20000, peakMultiplier:5 },
    ]
  }
};

/* ══════════════════════════════════════════════════════════════
   선정 파이프라인 — cycloidal-gearbox.html runCalc 무손실 사본
   cycloidal-gearbox.html은 이 모듈을 로드하지 않는 병렬 사본이므로,
   html runCalc 를 고치면 여기도 동일 유지할 것.
   입력 계약 input = { tLoad, sf, duty, reverse, ratio, nInput, lh,
                       makers:{sumitomo,nabtesco} }
   ══════════════════════════════════════════════════════════════ */
function computeCG(input) {
  const { tLoad, sf, duty, reverse, ratio, nInput, lh, makers } = input;
  const activeMakers = Object.keys(makers).filter(k => makers[k]);
  let sfFinal = sf;
  if (reverse) sfFinal *= 1.2;
  const tDesignEff = tLoad * sfFinal;
  const tDesignDuty = tDesignEff * duty;
  const results = [];
  for (const makerKey of activeMakers) {
    const maker = CG_DATA[makerKey];
    if (!maker) continue;
    for (const s of maker.series) {
      if (ratio < s.ratioMin || ratio > s.ratioMax) continue;
      if (s.torqueMax < tDesignDuty) continue;
      const rpmOk = nInput <= s.maxRpm;
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
      results.push({ makerKey, makerName: maker.name, series: s.series, seriesTag: s.seriesTag,
        model: s.model, ratio, ratedTorque: s.torqueMax, tDesignEff, tDesignDuty, peakTorque,
        hysteresis: s.hysteresis, guaranteedLife: s.guaranteedLife, lifeGrade, rpmOk, rpmWarn, eff: s.eff, overall });
    }
  }
  const order = { ok: 0, warn: 1, bad: 2 };
  results.sort((a, b) => order[a.overall] - order[b.overall] || a.ratedTorque - b.ratedTorque);
  return { sfFinal, tDesignEff, tDesignDuty, results, recommended: results.length ? results[0] : null };
}

module.exports = { judgeCG, computeCG, CG_DATA };
