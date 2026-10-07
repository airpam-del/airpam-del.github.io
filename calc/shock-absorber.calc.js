'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 쇼크 업소버(유압 완충기) 선정 — 순수 함수 (DOM 비의존)
   출처: shock-absorber.html 무손실 추출 (계산식 불변). html은 이 모듈을
   로드하지 않는 병렬 사본이므로, html computeSA 를 고치면 여기도 동일 유지할 것.
   ────────────────────────────────────────────────────────────────
   선정식 (SMC RB 카탈로그 "Selection" 절차 그대로):
     운동에너지   E1 = ½·m·v²
     구동/중력일  E2 = Fwork · S     (S = 해당 모델 스트로크[m])
        · 수평      Fwork = F
        · 수직하강  Fwork = F + m·g   (중력이 충돌 방향으로 일을 더함)
        · 수직상승  Fwork = F − m·g   (중력이 감속을 도움 → 흡수에너지 감소)
     흡수에너지   E  = E1 + E2        (음수 방지 위해 0 하한)
     상당질량     Me = 2·E / v²
     N개 병렬 시: 1개당 E/N, 질량 m/N, 구동력 F/N (속도 v 동일)
   적합 판정(모델별 카탈로그 한계 전부 충족해야 ok):
     ① 충돌속도 v  ∈ [vMin, vMax]
     ② 1사이클 흡수E ≤ 최대흡수에너지(J)
     ③ 작동빈도 ≤ 최대작동빈도(cycle/min)
     ④ 구동추력(수직은 중력 포함) ≤ 최대허용추력(N)
   ⑤ 상당질량 Me ≤ 최대상당질량(kg)  ← 저속·고질량 영역 지배 한계
   ※ 최대상당질량은 카탈로그 "상당질량(Me)-충돌속도" 그래프의 저속 평탄부 값이다.
     그래프의 평탄부는 기준속도 v_ref 에서 에너지한계로 환산되므로
       최대상당질량 = 2·(최대흡수에너지) / v_ref²   (정의상 Me=2E/v²)
     v_ref 은 카탈로그 공개 앵커(RB2015 = 400kg)에 맞춰 0.542 m/s 로 교정했다.
     → 검산: RB2015 2·58.8/0.542²=400kg(카탈로그 400) ✓ / RB0604 ≈3.4(카탈로그 3, 소형 근사).
     이 한계는 에너지만으로 통과할 작은 모델을 저속 영역에서 걸러 더 큰(안전한) 모델로
     밀어주므로 항상 안전측이며, 카탈로그 선정 예제(50kg·0.3m/s → RB2015)를 그대로 재현한다.
   ────────────────────────────────────────────────────────────────
   데이터 출처: SMC Shock Absorber Series RB 카탈로그(EMC-RB-01A-UK) Specifications 표.
     흡수에너지 / 스트로크 / 최대작동빈도 / 최대허용추력 / 충돌속도 전부 실측 전재(2026 대조).
   공식 검증: 카탈로그 선정 예제와 일치 —
     RB0604: m=1kg·v=0.5·F=39N → E1=0.125, E2≈0.157, E≈0.282, Me≈2.3kg (카탈로그 2.3) ✓
     RB2015: m=50kg·v=0.3·F=630N → E≈11.7, Me≈260kg (카탈로그 260) ✓
   타사(Festo YSR / CKD FCK·FK)는 동급 셀프어저스팅/조정형 시리즈로 안내만 하며,
   모델별 수치 선정은 카탈로그 실측 확보 전까지 SMC RB 기준으로 한다(값 지어내지 않음).
   ══════════════════════════════════════════════════════════════ */

const G = 9.81;
/* 최대상당질량 환산 기준속도 [m/s] — 카탈로그 그래프 저속 평탄부 앵커(RB2015=400kg)에 교정 */
const MASS_REF_SPEED = 0.542;

/* SMC RB 시리즈 (basic type). stroke_m = 스트로크[m], energy=최대흡수에너지[J],
   maxFreq=최대작동빈도[cycle/min], maxThrust=최대허용추력[N], v=[충돌속도 하한,상한][m/s] */
const SA_MODELS = [
  { model:'RB0604', thread:'M6×0.75',  energy:0.5,  stroke_mm:4,  maxFreq:80, maxThrust:150,  vMin:0.3,  vMax:1.0 },
  { model:'RB0805', thread:'M8×1.0',   energy:0.98, stroke_mm:5,  maxFreq:80, maxThrust:245,  vMin:0.05, vMax:5.0 },
  { model:'RB0806', thread:'M8×1.0',   energy:2.94, stroke_mm:6,  maxFreq:80, maxThrust:245,  vMin:0.05, vMax:5.0 },
  { model:'RB1006', thread:'M10×1.0',  energy:3.92, stroke_mm:6,  maxFreq:70, maxThrust:422,  vMin:0.05, vMax:5.0 },
  { model:'RB1007', thread:'M10×1.0',  energy:5.88, stroke_mm:7,  maxFreq:70, maxThrust:422,  vMin:0.05, vMax:5.0 },
  { model:'RB1411', thread:'M14×1.5',  energy:14.7, stroke_mm:11, maxFreq:45, maxThrust:814,  vMin:0.05, vMax:5.0 },
  { model:'RB1412', thread:'M14×1.5',  energy:19.6, stroke_mm:12, maxFreq:45, maxThrust:814,  vMin:0.05, vMax:5.0 },
  { model:'RB2015', thread:'M20×1.5',  energy:58.8, stroke_mm:15, maxFreq:25, maxThrust:1961, vMin:0.05, vMax:5.0 },
  { model:'RB2725', thread:'M27×1.5',  energy:147,  stroke_mm:25, maxFreq:10, maxThrust:2942, vMin:0.05, vMax:5.0 },
];

/* 동급 대체 시리즈 안내(수치 선정은 미지원 — 카탈로그 확보 전까지 값 지어내지 않음) */
const SA_ALT_MAKERS = [
  { name:'Festo',  country:'🇩🇪', series:'YSR / YSRW', range:'0.6~380 J', url:'https://www.festo.com',   note:'셀프어저스팅 유압 완충기(자동 조정). 스트로크 4~60mm.' },
  { name:'CKD',    country:'🇯🇵', series:'FCK / FK',   range:'1~200 J',   url:'https://www.ckd.co.jp',   note:'조정형(FCK)·논어저스팅(FK). 용량 1~200J.' },
];

/* ──────────────────────────────────────────────────────────────
   선정 파이프라인
   입력 계약 input = {
     mass,            // 충돌물 질량 [kg]
     speed,           // 충돌 속도 v [m/s]
     driveForce,      // 구동(추진) 추력 F [N]  (자유낙하/관성만이면 0)
     orientation,     // 'horizontal' | 'down' | 'up'
     cyclesPerMin,    // 작동 빈도 [cycle/min]
     count,           // 병렬 설치 개수 N (기본 1)
   }
   반환 { perUnit:{E1,E2,E,Me,Fwork,Fthrust,...}, results:[...], recommended, notes }
   ────────────────────────────────────────────────────────────── */
function computeSA(input) {
  const m = Math.max(0, +input.mass || 0);
  const v = Math.max(0, +input.speed || 0);
  const F = Math.max(0, +input.driveForce || 0);
  const orientation = input.orientation || 'horizontal';
  const n = Math.max(1, Math.round(+input.count || 1));
  const cyc = Math.max(0, +input.cyclesPerMin || 0);

  // N개 분담 (1개당)
  const mu = m / n;          // 1개당 질량
  const Fu = F / n;          // 1개당 구동력
  const weight = mu * G;     // 1개당 중력
  // 구동+중력 일 성분 (방향별)
  let Fwork;
  if (orientation === 'down')      Fwork = Fu + weight;
  else if (orientation === 'up')   Fwork = Fu - weight;
  else                             Fwork = Fu;              // horizontal
  // 추력 한계 비교용 (연속으로 완충기를 누르는 힘)
  let Fthrust;
  if (orientation === 'down')      Fthrust = Fu + weight;
  else                             Fthrust = Fu;            // horizontal·up

  const E1 = 0.5 * mu * v * v;

  const results = SA_MODELS.map(md => {
    const S = md.stroke_mm / 1000;             // m
    const E2 = Fwork * S;                       // 모델 스트로크에 따라 달라짐
    const E = Math.max(0, E1 + E2);
    const Me = v > 0 ? (2 * E / (v * v)) : Infinity;
    const massCap = 2 * md.energy / (MASS_REF_SPEED * MASS_REF_SPEED); // 최대상당질량[kg]
    const okSpeed  = v >= md.vMin && v <= md.vMax;
    const okEnergy = E <= md.energy;
    const okFreq   = cyc <= md.maxFreq;
    const okThrust = Fthrust <= md.maxThrust;
    const okMass   = Me <= massCap;
    const ok = okSpeed && okEnergy && okFreq && okThrust && okMass;
    // warn: 핵심(에너지·추력·빈도·질량)은 되는데 속도범위만 벗어남 (재검토 여지)
    const coreOk = okEnergy && okFreq && okThrust && okMass;
    const status = ok ? 'ok' : (coreOk ? 'warn' : 'bad');
    return {
      ...md, S_m:S, E1, E2, E, Me, massCap, Fwork, Fthrust,
      okSpeed, okEnergy, okFreq, okThrust, okMass, status,
      energyMargin: md.energy > 0 ? E / md.energy : Infinity, // 사용률(≤1이면 OK)
    };
  });

  // 추천: 전 조건 충족(ok) 중 가장 작은(에너지 용량 최소) 모델 = 가장 경제적
  const recommended = results.find(r => r.status === 'ok') || null;

  const notes = [];
  if (v <= 0)  notes.push('충돌 속도를 입력하세요. 속도가 0이면 선정할 수 없습니다.');
  if (v > 0 && v < 0.3) notes.push('충돌 속도가 매우 낮습니다(0.3 m/s 미만). 이 영역은 "최대 상당질량" 한계가 지배적이므로, 추천 모델을 카탈로그의 상당질량-속도 그래프로 반드시 재확인하세요.');
  if (orientation === 'up' && Fwork < 0) notes.push('수직 상승 + 낮은 구동력 조건이라 중력이 감속을 돕습니다(흡수 에너지 감소). 구동력 입력값을 다시 확인하세요.');
  if (!recommended && results.every(r => !r.okSpeed) && v > 0) notes.push('충돌 속도가 RB 시리즈 허용 범위(대부분 0.05~5.0 m/s)를 벗어났습니다.');

  return {
    perUnit: { massEach:mu, driveEach:Fu, weight, Fwork, Fthrust, E1, count:n, orientation, speed:v },
    results, recommended, notes,
    altMakers: SA_ALT_MAKERS,
  };
}

module.exports = { computeSA, SA_MODELS, SA_ALT_MAKERS, G, MASS_REF_SPEED };
