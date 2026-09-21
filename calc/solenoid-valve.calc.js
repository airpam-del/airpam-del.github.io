'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 솔레노이드 밸브 계산 — 순수 함수 (DOM 비의존)
   출처: solenoid-valve.html 무손실 추출 (계산식 불변)
   ══════════════════════════════════════════════════════════════ */

/* 솔레노이드 밸브용 보어별 면적 [mm²] (π/4·D²) */
const BORE_TABLE_SV = {20:314,25:491,32:804,40:1257,50:1963,63:3117,80:5027,100:7854};

/**
 * 필요 유량 계산 [L/min ANR]
 * @param {number} bore   실린더 보어 [mm]
 * @param {number} speed  피스톤 속도 [mm/s]
 * @param {number} supplyP 공급압 [MPa] (default 0.5)
 */
function calcQRequired(bore, speed, supplyP) {
  supplyP = supplyP || 0.5;
  const area = BORE_TABLE_SV[bore] || 804;
  return (area * speed * 60) / 1000000 * (supplyP / 0.1013 + 1);
}

/**
 * 밸브 판정
 * @param {number} qRated    밸브 정격 유량 [L/min]
 * @param {number} qRequired 필요 유량 [L/min]
 */
function judgeValve(qRated, qRequired) {
  const margin = qRated / qRequired;
  if (margin >= 1.2) return { status:'ok',   margin };
  if (margin >= 1.0) return { status:'warn',  margin };
  return                    { status:'bad',   margin };
}

/* qRated 기준: 5포트 SMC SY/CKD 4F = 카탈로그 C값 기반 250×C, Festo = 공칭유량 Qn 직접,
   3포트 = 근사(카탈로그 C 미확정). CKD 3포트는 실제 3GA/3GB 시리즈(가공 형번 '3F' 폐기). 2026 정리.
   밸브 유량은 본질적으로 개략(ISO 6358 공칭유량 근사) — 등급 beta 유지. */
const VALVE_DATA = [
  // SMC SY (5포트) — 카탈로그 C값 기반 qRated=250×C
  {maker:'smc', name:'SMC', country:'🇯🇵', series:'SY 시리즈', model:'SY3000', qRated:275,  ports:5, actuators:['single','double'], voltages:['DC24V','AC220V','AC110V'], url:'https://www.smcworld.com', note:'컴팩트 표준 (C=1.1)'},
  {maker:'smc', name:'SMC', country:'🇯🇵', series:'SY 시리즈', model:'SY5000', qRated:700,  ports:5, actuators:['single','double'], voltages:['DC24V','AC220V','AC110V'], url:'https://www.smcworld.com', note:'중형 표준 (C=2.8)'},
  {maker:'smc', name:'SMC', country:'🇯🇵', series:'SY 시리즈', model:'SY7000', qRated:1125, ports:5, actuators:['single','double'], voltages:['DC24V','AC220V','AC110V'], url:'https://www.smcworld.com', note:'대형 고유량 (C=4.5)'},
  // SMC SYJ (3포트) — 근사(카탈로그 C 미확정)
  {maker:'smc', name:'SMC', country:'🇯🇵', series:'SYJ 시리즈', model:'SYJ300', qRated:92,  ports:3, actuators:['single'], voltages:['DC24V','AC220V'], url:'https://www.smcworld.com', note:'소형 3포트(근사)'},
  {maker:'smc', name:'SMC', country:'🇯🇵', series:'SYJ 시리즈', model:'SYJ500', qRated:329, ports:3, actuators:['single'], voltages:['DC24V','AC220V'], url:'https://www.smcworld.com', note:'중형 3포트(근사)'},
  {maker:'smc', name:'SMC', country:'🇯🇵', series:'SYJ 시리즈', model:'SYJ700', qRated:724, ports:3, actuators:['single'], voltages:['DC24V','AC220V'], url:'https://www.smcworld.com', note:'대형 3포트(근사)'},
  // Festo VUVG (5포트) — 공칭유량 Qn
  {maker:'festo', name:'Festo', country:'🇩🇪', series:'VUVG 시리즈', model:'VUVG-L10', qRated:220, ports:5, actuators:['single','double'], voltages:['DC24V','AC230V'], url:'https://www.festo.com', note:'소형 (Qn 220)'},
  {maker:'festo', name:'Festo', country:'🇩🇪', series:'VUVG 시리즈', model:'VUVG-L14', qRated:700, ports:5, actuators:['single','double'], voltages:['DC24V','AC230V'], url:'https://www.festo.com', note:'표준 (Qn 700)'},
  {maker:'festo', name:'Festo', country:'🇩🇪', series:'VUVG 시리즈', model:'VUVG-L18', qRated:870, ports:5, actuators:['single','double'], voltages:['DC24V','AC230V'], url:'https://www.festo.com', note:'대형 (Qn 870)'},
  // Festo CPE (3/5포트 범용)
  {maker:'festo', name:'Festo', country:'🇩🇪', series:'CPE 시리즈', model:'CPE10', qRated:350, ports:'both', actuators:['single','double'], voltages:['DC24V','AC230V'], url:'https://www.festo.com', note:'3·5포트 범용'},
  {maker:'festo', name:'Festo', country:'🇩🇪', series:'CPE 시리즈', model:'CPE14', qRated:810, ports:'both', actuators:['single','double'], voltages:['DC24V','AC230V'], url:'https://www.festo.com', note:'3·5포트 범용'},
  // CKD 4F (5포트, 파일럿) — 카탈로그 C값 기반 250×C
  {maker:'ckd', name:'CKD', country:'🇯🇵', series:'4F 시리즈', model:'4F1', qRated:400,  ports:5, actuators:['single','double'], voltages:['DC24V','AC220V','AC110V'], url:'https://www.ckd.co.jp', note:'소형 (C=1.6)'},
  {maker:'ckd', name:'CKD', country:'🇯🇵', series:'4F 시리즈', model:'4F3', qRated:975,  ports:5, actuators:['single','double'], voltages:['DC24V','AC220V','AC110V'], url:'https://www.ckd.co.jp', note:'중형 (C=3.9)'},
  {maker:'ckd', name:'CKD', country:'🇯🇵', series:'4F 시리즈', model:'4F4', qRated:1250, ports:5, actuators:['single','double'], voltages:['DC24V','AC220V','AC110V'], url:'https://www.ckd.co.jp', note:'대형 (C=5.0)'},
  // CKD 3GA (3포트, 실제 시리즈 — 기존 가공형번 3F 교체) — 근사(카탈로그 C 미확정)
  {maker:'ckd', name:'CKD', country:'🇯🇵', series:'3GA/3GB 시리즈', model:'3GA1', qRated:330, ports:3, actuators:['single'], voltages:['DC24V','AC220V'], url:'https://www.ckd.co.jp', note:'소형 3포트(근사)'},
  {maker:'ckd', name:'CKD', country:'🇯🇵', series:'3GA/3GB 시리즈', model:'3GA2', qRated:830, ports:3, actuators:['single'], voltages:['DC24V','AC220V'], url:'https://www.ckd.co.jp', note:'중형 3포트(근사)'},
];

/* ══════════════════════════════════════════════════════════════
   선정 파이프라인 — solenoid-valve.html runCalc 무손실 사본
   solenoid-valve.html은 이 모듈을 로드하지 않는 병렬 사본이므로,
   html runCalc 를 고치면 여기도 동일 유지할 것.
   입력 계약 input = { bore, speed, supplyP, ports:'3'|'5', actuator,
                       voltage, makers:{smc,festo,ckd} }
   ══════════════════════════════════════════════════════════════ */
function computeSV(input) {
  const { bore, speed, supplyP, ports, actuator, voltage, makers } = input;
  const qRequired = calcQRequired(bore, speed, supplyP);
  const portNum = parseInt(ports, 10);
  const results = VALVE_DATA.filter(function (v) {
    if (!makers[v.maker]) return false;
    if (v.ports !== 'both' && v.ports !== portNum) return false;
    if (!v.actuators.includes(actuator)) return false;
    const voltMatch = v.voltages.some(function (vv) {
      if (voltage === 'AC220V') return vv === 'AC220V' || vv === 'AC230V';
      return vv === voltage;
    });
    if (!voltMatch) return false;
    return true;
  }).map(function (v) {
    const margin = v.qRated / qRequired;
    const status = margin >= 1.2 ? 'ok' : margin >= 1.0 ? 'warn' : 'bad';
    return Object.assign({}, v, { margin: margin, status: status });
  }).sort(function (a, b) {
    const ord = { ok: 0, warn: 1, bad: 2 };
    if (ord[a.status] !== ord[b.status]) return ord[a.status] - ord[b.status];
    return a.qRated - b.qRated;
  });
  return { qRequired, results, recommended: results.length ? results[0] : null };
}

module.exports = { calcQRequired, judgeValve, computeSV, BORE_TABLE_SV, VALVE_DATA };
