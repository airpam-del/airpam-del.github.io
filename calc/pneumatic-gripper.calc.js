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

/* 출처: SMC 에어그리퍼 카탈로그(MHZ2 병렬형, smcworld.com). 유효 파지력 0.5MPa·파지점 L=20mm.
   대표값 재확인 Ø16 외34/내45 N (확인일 2026-08). Festo 등 타 메이커는 각 사 카탈로그 기준. */
var MAKERS = {
  smc: {
    name:'SMC', country:'🇯🇵', series:'MHZ2 시리즈',
    url:'https://www.smcworld.com',
    models:[
      /* SMC 카탈로그 유효 파지력(0.5MPa, 파지점 L=20mm, 손가락당) — 2026-07 카탈로그 검증 완료.
         MHZ2는 전 보어에서 외부(닫힘) < 내부(열림) 파지력이 정상 (피스톤 수압 면적 차이) */
      {bore:10, modelD:'MHZ2-10D', modelS:'MHZ2-10S', forceOuter:11,  forceInner:17,  strokePerSide:2,  pMin:0.15, pMax:0.7},
      {bore:16, modelD:'MHZ2-16D', modelS:'MHZ2-16S', forceOuter:34,  forceInner:45,  strokePerSide:3,  pMin:0.15, pMax:0.7},
      {bore:20, modelD:'MHZ2-20D', modelS:'MHZ2-20S', forceOuter:42,  forceInner:66,  strokePerSide:5,  pMin:0.1,  pMax:0.7},
      {bore:25, modelD:'MHZ2-25D', modelS:'MHZ2-25S', forceOuter:65,  forceInner:104, strokePerSide:7,  pMin:0.1,  pMax:0.7},
      {bore:32, modelD:'MHZ2-32D', modelS:'MHZ2-32S', forceOuter:158, forceInner:193, strokePerSide:11, pMin:0.1,  pMax:0.7},
      {bore:40, modelD:'MHZ2-40D', modelS:'MHZ2-40S', forceOuter:254, forceInner:318, strokePerSide:15, pMin:0.1,  pMax:0.7}
    ]
  },
  festo: {
    name:'Festo', country:'🇩🇪', series:'HGPT 시리즈',
    url:'https://www.festo.com',
    models:[
      /* Festo HGPT-A 카탈로그 파지력(6bar, 조당) — 16/20/25는 2026-07 데이터시트 검증.
         외부(닫힘) < 내부(열림)이 정상. TODO: 32/40은 변형(G1/G2)별 값 상이 — 카탈로그 확인 필요.
         TODO: strokePerSide·단동(modelS) 표기 미검증 */
      {bore:16, modelD:'HGPT-16', modelS:'HGPT-16-A', forceOuter:53,  forceInner:60,  strokePerSide:3, pMin:0.2,  pMax:0.8},
      {bore:20, modelD:'HGPT-20', modelS:'HGPT-20-A', forceOuter:77,  forceInner:82,  strokePerSide:4, pMin:0.2,  pMax:0.8},
      {bore:25, modelD:'HGPT-25', modelS:'HGPT-25-A', forceOuter:124, forceInner:133, strokePerSide:6, pMin:0.15, pMax:0.8},
      {bore:32, modelD:'HGPT-32', modelS:'HGPT-32-A', forceOuter:160, forceInner:200, strokePerSide:8, pMin:0.15, pMax:0.8},
      {bore:40, modelD:'HGPT-40', modelS:'HGPT-40-A', forceOuter:250, forceInner:320, strokePerSide:8, pMin:0.15, pMax:0.8}
    ]
  },
  ckd: {
    /* TODO(중요): CKD "HGW" 평행 그리퍼 시리즈는 실존 확인 실패 (2026-07 검색 — CKD 실제
       평행핸드는 HMF·LHA·HAP·BHA 계열). 아래 데이터 전체가 SMC 미러 근사값이므로
       실제 시리즈 선정 후 카탈로그 기준으로 재작성 필요. 사용자 확인 전 임의 교체 보류. */
    name:'CKD', country:'🇯🇵', series:'HGW 시리즈',
    url:'https://www.ckd.co.jp',
    models:[
      {bore:16, modelD:'HGW-16', modelS:'HGW-16-S', forceOuter:58,  forceInner:46,  strokePerSide:3, pMin:0.15, pMax:0.7},
      {bore:20, modelD:'HGW-20', modelS:'HGW-20-S', forceOuter:82,  forceInner:65,  strokePerSide:4, pMin:0.1,  pMax:0.7},
      {bore:25, modelD:'HGW-25', modelS:'HGW-25-S', forceOuter:92,  forceInner:98,  strokePerSide:6, pMin:0.1,  pMax:0.7},
      {bore:32, modelD:'HGW-32', modelS:'HGW-32-S', forceOuter:155, forceInner:198, strokePerSide:8, pMin:0.1,  pMax:0.7},
      {bore:40, modelD:'HGW-40', modelS:'HGW-40-S', forceOuter:245, forceInner:315, strokePerSide:8, pMin:0.1,  pMax:0.7}
    ]
  }
};

/* ══════════════════════════════════════════════════════════════
   선정 파이프라인 — pneumatic-gripper.html renderResultCards 무손실 사본
   pneumatic-gripper.html은 이 모듈을 로드하지 않는 병렬 사본이므로,
   html 로직을 고치면 여기도 동일 유지할 것. (폴백: models[last])
   입력 계약 input = { weight[g], gripDir:'outer'|'inner', pressure,
                       actuator:'single'|'double', makers:{smc,festo,ckd} }
   ══════════════════════════════════════════════════════════════ */
function computeGripper(input) {
  const { weight, gripDir, pressure, actuator, makers } = input;
  const fRequired = calcRequiredForce(weight, 15);
  const makerResults = [], allModels = [];
  Object.keys(MAKERS).forEach(function (key) {
    if (!makers[key]) return;
    const mk = MAKERS[key];
    let bestModel = null, bestStatus = 'bad';
    mk.models.forEach(function (m) {
      const status = judgeGripper(m, fRequired, gripDir, pressure).status;
      if (status === 'ok' && bestStatus !== 'ok') { bestModel = m; bestStatus = 'ok'; }
      else if (status === 'warn' && bestStatus === 'bad') { bestModel = m; bestStatus = 'warn'; }
      allModels.push({ makerKey: key, makerName: mk.name, bore: m.bore, status });
    });
    if (!bestModel) { bestModel = mk.models[mk.models.length - 1]; bestStatus = 'bad'; }
    const modelName = actuator === 'double' ? bestModel.modelD : bestModel.modelS;
    const fRated = gripDir === 'outer' ? bestModel.forceOuter : bestModel.forceInner;
    makerResults.push({ makerKey: key, makerName: mk.name, bestModel, bestStatus, modelName, fRated });
  });
  return { fRequired, makerResults, allModels };
}

module.exports = { calcRequiredForce, judgeGripper, computeGripper, MAKERS };
