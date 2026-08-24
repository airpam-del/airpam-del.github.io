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

const VALVE_DATA = [
  // SMC SY 시리즈 (5포트)
  {maker:'smc', name:'SMC', country:'🇯🇵', series:'SY 시리즈', model:'SY3000',
   qRated:294,  ports:5, actuators:['single','double'], voltages:['DC24V','AC220V','AC110V'],
   url:'https://www.smcworld.com', note:'컴팩트 표준형'},
  {maker:'smc', name:'SMC', country:'🇯🇵', series:'SY 시리즈', model:'SY5000',
   qRated:687, ports:5, actuators:['single','double'], voltages:['DC24V','AC220V','AC110V'],
   url:'https://www.smcworld.com', note:'중형 표준'},
  {maker:'smc', name:'SMC', country:'🇯🇵', series:'SY 시리즈', model:'SY7000',
   qRated:1178, ports:5, actuators:['single','double'], voltages:['DC24V','AC220V','AC110V'],
   url:'https://www.smcworld.com', note:'대형 고유량'},
  // SMC SYJ300/500/700 시리즈 (3포트) — 2026-07 정정: SYJ3000/5000은 5포트 시리즈였음 (SMC 체계)
  {maker:'smc', name:'SMC', country:'🇯🇵', series:'SYJ 시리즈', model:'SYJ300',
   qRated:92,  ports:3, actuators:['single'], voltages:['DC24V','AC220V'],
   url:'https://www.smcworld.com', note:'소형 3포트'},
  {maker:'smc', name:'SMC', country:'🇯🇵', series:'SYJ 시리즈', model:'SYJ500',
   qRated:329, ports:3, actuators:['single'], voltages:['DC24V','AC220V'],
   url:'https://www.smcworld.com', note:'중형 3포트'},
  {maker:'smc', name:'SMC', country:'🇯🇵', series:'SYJ 시리즈', model:'SYJ700',
   qRated:724, ports:3, actuators:['single'], voltages:['DC24V','AC220V'],
   url:'https://www.smcworld.com', note:'대형 3포트'},
  // Festo VUVG 시리즈 (5포트) — 표준 정격유량 카탈로그 검증
  {maker:'festo', name:'Festo', country:'🇩🇪', series:'VUVG 시리즈', model:'VUVG-L10',
   qRated:220,  ports:5, actuators:['single','double'], voltages:['DC24V','AC230V'],
   url:'https://www.festo.com', note:'소형 컴팩트'},
  {maker:'festo', name:'Festo', country:'🇩🇪', series:'VUVG 시리즈', model:'VUVG-L14',
   qRated:560, ports:5, actuators:['single','double'], voltages:['DC24V','AC230V'],
   url:'https://www.festo.com', note:'표준형'},
  {maker:'festo', name:'Festo', country:'🇩🇪', series:'VUVG 시리즈', model:'VUVG-L18',
   qRated:870, ports:5, actuators:['single','double'], voltages:['DC24V','AC230V'],
   url:'https://www.festo.com', note:'대형 고유량'},
  // Festo CPE 시리즈 (3포트/5포트 범용) — CPE10: M7 5/2 기준 350, CPE14: 1/8" 기준 810
  {maker:'festo', name:'Festo', country:'🇩🇪', series:'CPE 시리즈', model:'CPE10',
   qRated:350,  ports:'both', actuators:['single','double'], voltages:['DC24V','AC230V'],
   url:'https://www.festo.com', note:'3·5포트 범용'},
  {maker:'festo', name:'Festo', country:'🇩🇪', series:'CPE 시리즈', model:'CPE14',
   qRated:810, ports:'both', actuators:['single','double'], voltages:['DC24V','AC230V'],
   url:'https://www.festo.com', note:'3·5포트 범용'},
  /* CKD 4F 시리즈 (5포트, 파일럿) — 4F3(Rp1/4) C=3.9→약 1150, 4F4(Rc1/4) C=5.0→약 1470 (카탈로그 C값 기반)
     TODO: 4F2 C값 미확인 — 구 근사값을 ANR 기준으로 환산(×5.94)만 해둠. 카탈로그 확인 필요 */
  {maker:'ckd', name:'CKD', country:'🇯🇵', series:'4F 시리즈', model:'4F2',
   qRated:445,  ports:5, actuators:['single','double'], voltages:['DC24V','AC220V','AC110V'],
   url:'https://www.ckd.co.jp', note:'소형 표준형'},
  {maker:'ckd', name:'CKD', country:'🇯🇵', series:'4F 시리즈', model:'4F3',
   qRated:1150, ports:5, actuators:['single','double'], voltages:['DC24V','AC220V','AC110V'],
   url:'https://www.ckd.co.jp', note:'중형 표준형'},
  {maker:'ckd', name:'CKD', country:'🇯🇵', series:'4F 시리즈', model:'4F4',
   qRated:1470, ports:5, actuators:['single','double'], voltages:['DC24V','AC220V','AC110V'],
   url:'https://www.ckd.co.jp', note:'대형 고유량'},
  /* TODO(중요): CKD "3F" 3포트 시리즈는 실존 확인 실패 (2026-07 — 실제 CKD 3포트는
     3GA/3GB·3QR·3KA 계열). 실제 시리즈 선정 후 재작성 필요. 사용자 확인 전 임의 교체 보류.
     qRated는 ANR 기준 환산(×5.94)만 적용한 근사값 */
  {maker:'ckd', name:'CKD', country:'🇯🇵', series:'3F 시리즈', model:'3F2',
   qRated:327,  ports:3, actuators:['single'], voltages:['DC24V','AC220V'],
   url:'https://www.ckd.co.jp', note:'소형 3포트'},
  {maker:'ckd', name:'CKD', country:'🇯🇵', series:'3F 시리즈', model:'3F3',
   qRated:831, ports:3, actuators:['single'], voltages:['DC24V','AC220V'],
   url:'https://www.ckd.co.jp', note:'중형 3포트'},
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
