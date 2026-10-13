'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 공압 피팅 계산 — 순수 함수 (DOM 비의존)
   출처: pneumatic-fitting.html 무손실 추출 (계산식 불변)
   ══════════════════════════════════════════════════════════════ */

const OD_TABLE = [
  {od:4,  id:2.5, qMax:2.3},
  {od:6,  id:4.0, qMax:6.0},
  {od:8,  id:5.0, qMax:9.4},
  {od:10, id:6.5, qMax:15.9},
  {od:12, id:8.0, qMax:24.1},
  {od:16, id:10.0,qMax:37.6},
];

/**
 * 필요 내경 계산 [mm]
 * 입력 유량 q 는 ANR(표준상태) 기준 → 사용압력 P 의 실제 체적유량으로 변환 후 계산.
 *   Q_actual = Q_ANR × 0.1013 / (P + 0.1013)   (P: 게이지압 [MPa], 0.1013 = 대기압)
 *   d = sqrt(4·Q_actual / (π × 8 × 60000)) × 1000   (권장 유속 8 m/s 기준)
 * @param {number} q  유량 [L/min ANR]
 * @param {number} P  사용압력 [MPa 게이지] (기본 0.5)
 */
function calcRequiredID(q, P) {
  if (P == null) P = 0.5;
  var qActual = q * 0.1013 / (P + 0.1013);
  return Math.sqrt((4 * qActual) / (Math.PI * 8 * 60000)) * 1000;
}

/**
 * 추천 OD 선택 (내경 ≥ 필요 내경인 가장 작은 OD)
 * @param {number} dRequired 필요 내경 [mm]
 */
function recommendOD(dRequired) {
  const rec = OD_TABLE.find(r => r.id >= dRequired);
  return rec ? rec.od : null; // null: 범위 초과
}

const FITTING_DATA = {
  smc: {
    name:'SMC', country:'🇯🇵',
    fittingSeries:'KQ2 시리즈',
    tubingSeries:{pu:'TU 튜빙', pa:'TS 튜빙'},
    url:'https://www.smcworld.com',
    models:{
      4:  {straight:'KQ2H04', elbow:'KQ2L04', tee:'KQ2T04', tubing:{pu:'TU0425', pa:'TS0425'}, pMax:1.0},
      6:  {straight:'KQ2H06', elbow:'KQ2L06', tee:'KQ2T06', tubing:{pu:'TU0604', pa:'TS0604'}, pMax:1.0},
      8:  {straight:'KQ2H08', elbow:'KQ2L08', tee:'KQ2T08', tubing:{pu:'TU0805', pa:'TS0805'}, pMax:1.0},
      /* SMC 튜빙 품번 2026-07 검증: TU1065(10×6.5)·TU1208(12×8)·TU1610(16×10)이 실제 라인업.
         구 표기 TU1075/TU1209/TU1613은 비실존 품번이었음. 16mm 소프트나일론은 TS1612(16×12) */
      10: {straight:'KQ2H10', elbow:'KQ2L10', tee:'KQ2T10', tubing:{pu:'TU1065', pa:'TS1065'}, pMax:1.0},
      12: {straight:'KQ2H12', elbow:'KQ2L12', tee:'KQ2T12', tubing:{pu:'TU1208', pa:'TS1208'}, pMax:1.0},
      16: {straight:'KQ2H16', elbow:'KQ2L16', tee:'KQ2T16', tubing:{pu:'TU1610', pa:'TS1612'}, pMax:1.0},
    }
  },
  festo: {
    name:'Festo', country:'🇩🇪',
    fittingSeries:'QS 시리즈',
    tubingSeries:{pu:'PUN 튜빙', pa:'PLN 튜빙'},
    url:'https://www.festo.com',
    models:{
      4:  {straight:'QS-4',  elbow:'QSL-4',  tee:'QST-4',  tubing:{pu:'PUN-4X0.75',   pa:'PLN-4X0.75'},  pMax:1.0},
      6:  {straight:'QS-6',  elbow:'QSL-6',  tee:'QST-6',  tubing:{pu:'PUN-6X1',      pa:'PLN-6X1'},     pMax:1.0},
      8:  {straight:'QS-8',  elbow:'QSL-8',  tee:'QST-8',  tubing:{pu:'PUN-8X1.25',   pa:'PLN-8X1.25'},  pMax:1.0},
      10: {straight:'QS-10', elbow:'QSL-10', tee:'QST-10', tubing:{pu:'PUN-10X1.5',   pa:'PLN-10X1.5'},  pMax:1.0},
      12: {straight:'QS-12', elbow:'QSL-12', tee:'QST-12', tubing:{pu:'PUN-12X2',     pa:'PLN-12X2'},    pMax:1.0},
      16: {straight:'QS-16', elbow:'QSL-16', tee:'QST-16', tubing:{pu:'PUN-16X2.5',   pa:'PLN-16X2.5'},  pMax:1.0},
    }
  },
  ckd: {
    name:'CKD', country:'🇯🇵',
    fittingSeries:'GW 시리즈',
    tubingSeries:{pu:'U-95 튜브', pa:'F-15 튜브'},
    url:'https://www.ckd.co.jp',
    /* CKD 2026-10 검증(카탈로그 대조): GW 원터치 피팅 GWS(스트레이트)·GWL(엘보)·GWT(티).
       GWT(티)는 Ø4~12만, GWS/GWL은 Ø4~16. 품번은 튜브경 기준(예: GWS6, GWT10).
       튜브: 우레탄=U-95(Ø3.2~12), 소프트나일론=F-15. ← 구 표기 TAS/TAN은 비실존(수정 완료).
       U-95는 Ø16 미지원 → Ø16은 CKD 라인업 밖(모델 미정의 → 결과에서 제외). */
    models:{
      4:  {straight:'GWS4',  elbow:'GWL4',  tee:'GWT4',  tubing:{pu:'U-95-4',  pa:'F-15-4'},  pMax:1.0},
      6:  {straight:'GWS6',  elbow:'GWL6',  tee:'GWT6',  tubing:{pu:'U-95-6',  pa:'F-15-6'},  pMax:1.0},
      8:  {straight:'GWS8',  elbow:'GWL8',  tee:'GWT8',  tubing:{pu:'U-95-8',  pa:'F-15-8'},  pMax:1.0},
      10: {straight:'GWS10', elbow:'GWL10', tee:'GWT10', tubing:{pu:'U-95-10', pa:'F-15-10'}, pMax:1.0},
      12: {straight:'GWS12', elbow:'GWL12', tee:'GWT12', tubing:{pu:'U-95-12', pa:'F-15-12'}, pMax:1.0},
      // Ø16: CKD U-95(Ø~12)·GWT(Ø~12) 라인업 밖 → 정의하지 않음(결과 제외)
    }
  }
};

/* ══════════════════════════════════════════════════════════════
   선정 파이프라인 — pneumatic-fitting.html calcTube + runCalc 무손실 사본
   pneumatic-fitting.html은 이 모듈을 로드하지 않는 병렬 사본이므로,
   html 로직을 고치면 여기도 동일 유지할 것.
   ⚠️ calcTube: 유량 범위 초과 시 최대 OD로 폴백(find || 마지막). recommendOD(null 반환)와 다름.
   입력 계약 input = { flow(ANR), pressure[MPa], material:'pu'|'pa', makers:{smc,festo,ckd} }
   ══════════════════════════════════════════════════════════════ */
function computeFitting(input) {
  const { flow, pressure, material, makers } = input;
  const dRequired = calcRequiredID(flow, pressure);
  const rec = OD_TABLE.find(function (r) { return r.id >= dRequired; }) || OD_TABLE[OD_TABLE.length - 1];
  const recommendedOD = rec.od;
  const activeMakers = Object.keys(makers).filter(function (k) { return makers[k]; });
  const results = activeMakers.map(function (key) {
    const mk = FITTING_DATA[key];
    if (!mk) return null;
    const m = mk.models[recommendedOD];
    if (!m) return null;
    return {
      makerKey: key, name: mk.name, country: mk.country,
      fittingSeries: mk.fittingSeries, tubingSeries: mk.tubingSeries[material],
      url: mk.url, od: recommendedOD, tubing: m.tubing[material],
      fittings: { straight: m.straight, elbow: m.elbow, tee: m.tee },
      pMax: m.pMax,
    };
  }).filter(Boolean);
  return { dRequired, recommendedOD, results };
}

module.exports = { calcRequiredID, recommendOD, computeFitting, OD_TABLE, FITTING_DATA };
