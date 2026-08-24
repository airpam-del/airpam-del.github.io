'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 공압 FR 유닛 계산 — 순수 함수 (DOM 비의존)
   출처: pneumatic-fr-unit.html 무손실 추출 (계산식 불변)
   ══════════════════════════════════════════════════════════════ */

/**
 * FR 유닛 유량 여유율 계산
 * @param {number} qRated   정격 유량 [L/min]
 * @param {number} flow     필요 유량 [L/min]
 */
function calcMargin(qRated, flow) {
  return qRated / flow;
}

/**
 * FR 유닛 필터 판정 (유량·압력 조건)
 * @param {object} m    모델 { qRated, pMin, pMax, port, filter }
 * @param {number} flow 필요 유량 [L/min]
 * @param {number} setP 설정 압력 [MPa]
 * @param {string} port 포트 사이즈 '1/8'|'1/4'|'3/8'|'1/2'
 * @param {string} filter '5um'|'0.3um'
 */
function judgeFRUnit(m, flow, setP, port, filter) {
  if (m.port !== port) return false;
  if (m.filter !== filter) return false;
  if (flow > m.qRated) return false;
  if (setP < m.pMin || setP > m.pMax) return false;
  return true;
}

var FR_DATA = [
  // SMC AW — 표준 5μm
  {maker:'smc', name:'SMC', country:'🇯🇵', series:'AW 시리즈', model:'AW20',
   port:'1/8', qRated:600,  pMin:0.05, pMax:0.85, filter:'5um', url:'https://www.smcworld.com'},
  {maker:'smc', name:'SMC', country:'🇯🇵', series:'AW 시리즈', model:'AW30',
   port:'1/4', qRated:1500, pMin:0.05, pMax:0.85, filter:'5um', url:'https://www.smcworld.com'},
  {maker:'smc', name:'SMC', country:'🇯🇵', series:'AW 시리즈', model:'AW40',
   port:'3/8', qRated:2800, pMin:0.05, pMax:0.85, filter:'5um', url:'https://www.smcworld.com'},
  {maker:'smc', name:'SMC', country:'🇯🇵', series:'AW 시리즈', model:'AW60',
   port:'1/2', qRated:4500, pMin:0.05, pMax:0.85, filter:'5um', url:'https://www.smcworld.com'},
  /* SMC 정밀 0.3μm — 2026-07 정정: AME는 0.01μm급 슈퍼 미스트 세퍼레이터로 용도가 다름.
     0.3μm 정밀 여과는 AFM 시리즈(모듈러 미스트 세퍼레이터)가 해당. AFM은 필터 단독이므로
     레귤레이터(AW/AR)와 조합 필요. 정격유량: AFM20=200, AFM30=450 (카탈로그 ANR 확인) */
  {maker:'smc', name:'SMC', country:'🇯🇵', series:'AFM 시리즈 (정밀·레귤레이터 별도)', model:'AFM20',
   port:'1/4', qRated:200, pMin:0.05, pMax:0.85, filter:'0.3um', url:'https://www.smcworld.com'},
  {maker:'smc', name:'SMC', country:'🇯🇵', series:'AFM 시리즈 (정밀·레귤레이터 별도)', model:'AFM30',
   port:'3/8', qRated:450, pMin:0.05, pMax:0.85, filter:'0.3um', url:'https://www.smcworld.com'},
  {maker:'smc', name:'SMC', country:'🇯🇵', series:'AFM 시리즈 (정밀·레귤레이터 별도)', model:'AFM40',
   port:'1/2', qRated:1100, pMin:0.05, pMax:0.85, filter:'0.3um', url:'https://www.smcworld.com'}, // TODO: AFM40 정격유량 카탈로그 확인

  // Festo LFR — 표준 5μm
  {maker:'festo', name:'Festo', country:'🇩🇪', series:'LFR 시리즈', model:'LFR-1/8',
   port:'1/8', qRated:700,  pMin:0.05, pMax:0.8,  filter:'5um', url:'https://www.festo.com'},
  {maker:'festo', name:'Festo', country:'🇩🇪', series:'LFR 시리즈', model:'LFR-1/4',
   port:'1/4', qRated:1600, pMin:0.05, pMax:0.8,  filter:'5um', url:'https://www.festo.com'},
  {maker:'festo', name:'Festo', country:'🇩🇪', series:'LFR 시리즈', model:'LFR-3/8',
   port:'3/8', qRated:3000, pMin:0.05, pMax:0.8,  filter:'5um', url:'https://www.festo.com'},
  {maker:'festo', name:'Festo', country:'🇩🇪', series:'LFR 시리즈', model:'LFR-1/2',
   port:'1/2', qRated:4800, pMin:0.05, pMax:0.8,  filter:'5um', url:'https://www.festo.com'},

  /* CKD — 2026-07 정정: C시리즈는 F+R+L 3점 콤보(루브리케이터 포함)라 FR 전용 계산기에 부적합.
     필터+레귤레이터 일체형은 W시리즈(W1000~W8000)가 정답. 포트 코드: 6=1/8, 8=1/4, 10=3/8, 15=1/2.
     TODO: qRated는 구 근사값 유지 — CKD W시리즈 카탈로그 정격유량 대조 필요 */
  {maker:'ckd', name:'CKD', country:'🇯🇵', series:'W1000 시리즈', model:'W1000-6',
   port:'1/8', qRated:650,  pMin:0.05, pMax:0.85, filter:'5um', url:'https://www.ckd.co.jp'},
  {maker:'ckd', name:'CKD', country:'🇯🇵', series:'W3000 시리즈', model:'W3000-8',
   port:'1/4', qRated:1550, pMin:0.05, pMax:0.85, filter:'5um', url:'https://www.ckd.co.jp'},
  {maker:'ckd', name:'CKD', country:'🇯🇵', series:'W3000 시리즈', model:'W3000-10',
   port:'3/8', qRated:2900, pMin:0.05, pMax:0.85, filter:'5um', url:'https://www.ckd.co.jp'},
  {maker:'ckd', name:'CKD', country:'🇯🇵', series:'W4000 시리즈', model:'W4000-15',
   port:'1/2', qRated:4600, pMin:0.05, pMax:0.85, filter:'5um', url:'https://www.ckd.co.jp'},
];

/* ══════════════════════════════════════════════════════════════
   선정 파이프라인 — pneumatic-fr-unit.html runCalc 무손실 사본
   pneumatic-fr-unit.html은 이 모듈을 로드하지 않는 병렬 사본이므로,
   html runCalc 를 고치면 여기도 동일 유지할 것. (정렬 없음 — FR_DATA 순서 유지)
   입력 계약 input = { flow, setP, port, filter, makers:{smc,festo,ckd} }
   ══════════════════════════════════════════════════════════════ */
function computeFR(input) {
  const { flow, setP, port, filter, makers } = input;
  const results = FR_DATA
    .filter(function (m) { return makers[m.maker] && judgeFRUnit(m, flow, setP, port, filter); })
    .map(function (m) { return Object.assign({}, m, { margin: m.qRated / flow }); });
  return { results, recommended: results.length ? results[0] : null };
}

module.exports = { calcMargin, judgeFRUnit, computeFR, FR_DATA };
