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

const PG_DATA = {
  // ── 출처: Neugart 유성감속기 (PLE Economy Line + PLN Precision Line) ─────────────
  //   neugart.com/en-us/gearboxes/economy-gearboxes/ple (제품페이지·PLE 카탈로그, 확인일 2026-08)
  //   ⚠️ torqueRange = 보수적 선정용 정격값(연속토크 T2D ~ 중간 밴드 근사). Neugart는 T2D(연속)·
  //   T2max(최대)·T2N(정격)을 감속비별 '범위'로 표기 → 단일 정격값이 아님. 현재 값은 안전측(과소평가측)
  //   근사이며, 사이즈별 정밀 정격은 카탈로그 정격표(프레임×감속비) 확보 시 교체 예정.
  //   참고(제품페이지 Stage1 실측): T2max PLE040 8~24 / 060 24~61 / 080 60~175 / 120 152~310 / 160 450~720 N·m,
  //   T2D(연속) PLE040 4~13 / 060 13~24 / 080 32~84 / 120 80~165 / 160 340~380 N·m.
  //   bl=백래시(arcmin, PLE 22'/PLN 1'), eff=효율%. ───────────────────────────────
  neugart: {
    name: 'Neugart',
    series: [
      // PLE 시리즈 (Economy Line)
      { series:'PLE040', ratios:[3,4,5,7,10], torqueRange:[5,9],   maxRpm:10000, bl:22, eff:97, stage:1 },
      { series:'PLE060', ratios:[3,4,5,7,10,15,20,25,35,50,70,100], torqueRange:[18,36], maxRpm:8000,  bl:22, eff:97, stage:2 },
      { series:'PLE080', ratios:[3,4,5,7,10,15,20,25,35,50,70,100], torqueRange:[40,75], maxRpm:6000,  bl:22, eff:97, stage:2 },
      { series:'PLE120', ratios:[3,4,5,7,10,15,20,25,35,50,70,100], torqueRange:[120,190],maxRpm:4000, bl:22, eff:97, stage:2 },
      { series:'PLE160', ratios:[3,4,5,7,10,15,20,25,35,50,70,100], torqueRange:[230,450],maxRpm:3000, bl:22, eff:97, stage:2 },
      // PLN 시리즈 (Precision Line)
      { series:'PLN070', ratios:[3,4,5,7,10,15,20,25,35,50,70,100], torqueRange:[22,48],  maxRpm:8000,  bl:1,  eff:97, stage:2 },
      { series:'PLN090', ratios:[3,4,5,7,10,15,20,25,35,50,70,100], torqueRange:[55,110], maxRpm:6000,  bl:1,  eff:97, stage:2 },
      { series:'PLN115', ratios:[3,4,5,7,10,15,20,25,35,50,70,100], torqueRange:[130,260],maxRpm:4000,  bl:1,  eff:97, stage:2 },
      { series:'PLN142', ratios:[3,4,5,7,10,15,20,25,35,50,70,100], torqueRange:[280,600],maxRpm:3000,  bl:1,  eff:97, stage:2 },
    ]
  },
  // ── 출처: Apex Dynamics AB(표준 백래시)·AD(고정밀) 시리즈 공표 정격 기준 ──────────
  //   프레임별 정격토크 AB/AD 042=14 · 060=40 · 090=120 · 115=250 · 142=500 N·m,
  //   백래시 1단 AB 5'/AD 3' (2단 +2'). ⚠️ 이번 세션 카탈로그 원문 대조 미완 —
  //   apexdynamics 카탈로그로 정격·감속비 재확인 권장. ─────────────────────────────
  apex: {
    name: 'Apex Dynamics',
    series: [
      // AB 시리즈 (Standard Backlash, 1단)
      { series:'AB042', ratios:[3,4,5,7,10], torqueRange:[14,14],  maxRpm:6000, bl:5, eff:97, stage:1 },
      { series:'AB060', ratios:[3,4,5,7,10], torqueRange:[40,40],  maxRpm:5000, bl:5, eff:97, stage:1 },
      { series:'AB090', ratios:[3,4,5,7,10], torqueRange:[120,120],maxRpm:4000, bl:5, eff:97, stage:1 },
      { series:'AB115', ratios:[3,4,5,7,10], torqueRange:[250,250],maxRpm:3500, bl:5, eff:97, stage:1 },
      { series:'AB142', ratios:[3,4,5,7,10], torqueRange:[500,500],maxRpm:3000, bl:5, eff:97, stage:1 },
      // AB 2단
      { series:'AB042-2', ratios:[16,21,25,31,35,40,50,61,70,91,100], torqueRange:[14,14],  maxRpm:6000, bl:7, eff:94, stage:2 },
      { series:'AB060-2', ratios:[16,21,25,31,35,40,50,61,70,91,100], torqueRange:[40,40],  maxRpm:5000, bl:7, eff:94, stage:2 },
      { series:'AB090-2', ratios:[16,21,25,31,35,40,50,61,70,91,100], torqueRange:[120,120],maxRpm:4000, bl:7, eff:94, stage:2 },
      { series:'AB115-2', ratios:[16,21,25,31,35,40,50,61,70,91,100], torqueRange:[250,250],maxRpm:3500, bl:7, eff:94, stage:2 },
      { series:'AB142-2', ratios:[16,21,25,31,35,40,50,61,70,91,100], torqueRange:[500,500],maxRpm:3000, bl:7, eff:94, stage:2 },
      // AD 시리즈 (High Precision, 1단)
      { series:'AD042', ratios:[4,5,7,10], torqueRange:[14,14],  maxRpm:6000, bl:3, eff:97, stage:1 },
      { series:'AD060', ratios:[4,5,7,10], torqueRange:[40,40],  maxRpm:5000, bl:3, eff:97, stage:1 },
      { series:'AD090', ratios:[4,5,7,10], torqueRange:[120,120],maxRpm:4000, bl:3, eff:97, stage:1 },
      { series:'AD115', ratios:[4,5,7,10], torqueRange:[250,250],maxRpm:3500, bl:3, eff:97, stage:1 },
      { series:'AD142', ratios:[4,5,7,10], torqueRange:[500,500],maxRpm:3000, bl:3, eff:97, stage:1 },
      // AD 2단
      { series:'AD042-2', ratios:[16,21,25,31,35,40,50,61,70,91,100], torqueRange:[14,14],  maxRpm:6000, bl:5, eff:94, stage:2 },
      { series:'AD060-2', ratios:[16,21,25,31,35,40,50,61,70,91,100], torqueRange:[40,40],  maxRpm:5000, bl:5, eff:94, stage:2 },
      { series:'AD090-2', ratios:[16,21,25,31,35,40,50,61,70,91,100], torqueRange:[120,120],maxRpm:4000, bl:5, eff:94, stage:2 },
      { series:'AD115-2', ratios:[16,21,25,31,35,40,50,61,70,91,100], torqueRange:[250,250],maxRpm:3500, bl:5, eff:94, stage:2 },
      { series:'AD142-2', ratios:[16,21,25,31,35,40,50,61,70,91,100], torqueRange:[500,500],maxRpm:3000, bl:5, eff:94, stage:2 },
    ]
  },
  shimpo: {
    name: 'Shimpo / Nidec',
    series: [
      // VRSF 시리즈 (Economy)
      { series:'VRSF-B', ratios:[3,4,5,7,9,11,15,21,27,33,45,81], torqueRange:[10,20],   maxRpm:5000, bl:15, eff:95, stage:2 },
      { series:'VRSF-C', ratios:[3,4,5,7,9,11,15,21,27,33,45,81], torqueRange:[25,50],   maxRpm:4500, bl:15, eff:95, stage:2 },
      { series:'VRSF-D', ratios:[3,4,5,7,9,11,15,21,27,33,45,81], torqueRange:[60,91],   maxRpm:4000, bl:15, eff:95, stage:2 },
      { series:'VRSF-E', ratios:[3,4,5,7,9,11,15,21,27,33,45,81], torqueRange:[120,274], maxRpm:3500, bl:15, eff:95, stage:2 },
      // VRL 시리즈 (Standard Precision)
      { series:'VRL-050', ratios:[3,4,5,7,10,15,20,25,35,50,70,100], torqueRange:[30,60],   maxRpm:5000, bl:5, eff:96, stage:2 },
      { series:'VRL-070', ratios:[3,4,5,7,10,15,20,25,35,50,70,100], torqueRange:[80,160],  maxRpm:4500, bl:5, eff:96, stage:2 },
      { series:'VRL-090', ratios:[3,4,5,7,10,15,20,25,35,50,70,100], torqueRange:[180,360], maxRpm:4000, bl:5, eff:96, stage:2 },
      { series:'VRL-115', ratios:[3,4,5,7,10,15,20,25,35,50,70,100], torqueRange:[400,800], maxRpm:3000, bl:5, eff:96, stage:2 },
    ]
  }
};

/* ══════════════════════════════════════════════════════════════
   선정 파이프라인 — planetary-gearbox.html runCalc 무손실 사본
   planetary-gearbox.html은 이 모듈을 로드하지 않는 병렬 사본이므로,
   html runCalc 를 고치면 여기도 동일 유지할 것.
   입력 계약 input = { tLoad, kf, ratio, nInput, lh, blMax, jLoad,
                       makers:{neugart,apex,shimpo} }
   ══════════════════════════════════════════════════════════════ */
function computePG(input) {
  const { tLoad, kf, ratio, nInput, lh, blMax, jLoad, makers } = input;
  const activeMakers = Object.keys(makers).filter(k => makers[k]);
  const tDesign = tLoad * kf;
  const nOutput = nInput / ratio;
  const results = [];
  for (const makerKey of activeMakers) {
    const maker = PG_DATA[makerKey];
    if (!maker) continue;
    for (const s of maker.series) {
      if (!s.ratios.includes(ratio)) continue;
      if (s.bl > blMax) continue;
      const ratedTorque = s.torqueRange[1];
      if (ratedTorque < tDesign) continue;
      const rpmOk = nInput <= s.maxRpm;
      const L_base = 20000;
      const torqueRatio = tDesign / ratedTorque;
      const L10h = Math.round(L_base * Math.pow(1 / torqueRatio, 10 / 3));
      const lifeOk = L10h >= lh;
      let irStr = null;
      if (jLoad !== null && jLoad !== undefined) {
        const J_gb = 0;
        const ir = (jLoad + J_gb) / (ratio * ratio * 0.0001);
        irStr = ir.toFixed(2);
      }
      const overall = (!rpmOk) ? 'bad' : (!lifeOk) ? 'warn' : 'ok';
      results.push({ makerKey, makerName: maker.name, series: s.series, ratio, ratedTorque,
                     tDesign, bl: s.bl, L10h, lifeOk, rpmOk, eff: s.eff, overall, irStr });
    }
  }
  const order = { ok: 0, warn: 1, bad: 2 };
  results.sort((a, b) => order[a.overall] - order[b.overall] || a.ratedTorque - b.ratedTorque);
  return { tDesign, nOutput, results, recommended: results.length ? results[0] : null };
}

module.exports = { calcDesignTorque, calcPGLife, judgePG, computePG, PG_DATA, L_BASE_PG };
