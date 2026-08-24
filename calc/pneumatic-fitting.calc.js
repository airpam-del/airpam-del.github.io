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
 * 공식: d = sqrt(4Q / (π × 8 × 60000)) × 1000
 * (배관 내 권장 유속 8 m/s = 8000 mm/s 기준)
 * @param {number} q  유량 [L/min]
 */
function calcRequiredID(q) {
  return Math.sqrt((4 * q) / (Math.PI * 8 * 60000)) * 1000;
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
    tubingSeries:{pu:'TAS 튜빙', pa:'TAN 튜빙'},
    url:'https://www.ckd.co.jp',
    /* CKD GW 시리즈 형상 코드 2026-07 검증: GWS=스트레이트, GWL=엘보, GWT=티.
       (구 표기는 GWL을 스트레이트, 비실존 GWE를 엘보로 잘못 매핑했었음)
       실제 품번은 나사경 포함 2단 표기(예: GWS8-6) — 아래는 튜브경 기준 축약 표기.
       TODO: CKD 튜빙 "TAS/TAN" 시리즈는 실존 미확인 (실제 CKD 우레탄 튜브는 U-95/NU 계열,
       나일론은 F-15 계열 추정) — 카탈로그 확인 후 교체 필요. 사용자 확인 전 임의 교체 보류. */
    models:{
      4:  {straight:'GWS-04', elbow:'GWL-04', tee:'GWT-04', tubing:{pu:'TAS0425', pa:'TAN0425'}, pMax:1.0},
      6:  {straight:'GWS-06', elbow:'GWL-06', tee:'GWT-06', tubing:{pu:'TAS0604', pa:'TAN0604'}, pMax:1.0},
      8:  {straight:'GWS-08', elbow:'GWL-08', tee:'GWT-08', tubing:{pu:'TAS0805', pa:'TAN0805'}, pMax:1.0},
      10: {straight:'GWS-10', elbow:'GWL-10', tee:'GWT-10', tubing:{pu:'TAS1075', pa:'TAN1075'}, pMax:1.0},
      12: {straight:'GWS-12', elbow:'GWL-12', tee:'GWT-12', tubing:{pu:'TAS1209', pa:'TAN1209'}, pMax:1.0},
      16: {straight:'GWS-16', elbow:'GWL-16', tee:'GWT-16', tubing:{pu:'TAS1613', pa:'TAN1613'}, pMax:1.0},
    }
  }
};

/* ══════════════════════════════════════════════════════════════
   선정 파이프라인 — pneumatic-fitting.html calcTube + runCalc 무손실 사본
   pneumatic-fitting.html은 이 모듈을 로드하지 않는 병렬 사본이므로,
   html 로직을 고치면 여기도 동일 유지할 것.
   ⚠️ calcTube: 유량 범위 초과 시 최대 OD로 폴백(find || 마지막). recommendOD(null 반환)와 다름.
   입력 계약 input = { flow, material:'pu'|'pa', makers:{smc,festo,ckd} }
   ══════════════════════════════════════════════════════════════ */
function computeFitting(input) {
  const { flow, material, makers } = input;
  const dRequired = calcRequiredID(flow);
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
