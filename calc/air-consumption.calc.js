'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 공기 소비량·비용 계산 — 순수 함수 (DOM 비의존)
   출처: air-consumption.html 무손실 추출 (계산식 불변). html은 이 모듈을
   로드하지 않는 병렬 사본이므로, html computeAC 를 고치면 여기도 동일 유지할 것.
   ────────────────────────────────────────────────────────────────
   공기 소비량 (SMC/ISO 표준식):
     압축비 CR = (P + 0.1013) / 0.1013      (P=게이지압[MPa], 대기압 0.1013MPa=ANR)
     실린더 1사이클 소비(ANR):
        복동: V = (A_head·L + A_rod·L) · CR   (전진=풀보어, 후진=보어−로드)
        단동: V = A_head·L · CR               (전진만 공압, 복귀=스프링)
        A_head = π/4·D², A_rod = π/4·(D²−d²)  [mm²], L=스트로크[mm] → V[mm³]/1e6 = L(리터)
     유량 Q[L/min ANR] = 1사이클 소비(L) × 작동빈도(회/분) × 실린더 수
     (옵션) 배관 튜브 충전분 = π/4·id²·len · CR  를 1사이클에 가산
   비용 환산(투명 산술 — 계수는 사용자 조정 가능):
     월 공기량[m³] = Q[L/min] × 가동(분/일) × 가동일/월 / 1000
     월 전력[kWh]  = 월 공기량 × 비에너지[kWh/m³]
     월 전기료[원] = 월 전력 × 단가[원/kWh]
   ────────────────────────────────────────────────────────────────
   공식 검증(SMC 카탈로그 선정 예제 재현):
     보어50·스트로크600·0.5MPa·복동 → 1사이클 ≈ 12.87 L (SMC 표기 13 L) ✓
       CR=(0.5+0.1013)/0.1013=5.936 / 전진 1.178L×CR=6.99 / 후진(로드20) 0.990L×CR=5.87 / 합 12.87
     ×10회/분 ×5대 = 643 L/min (SMC 예제 650, 13×10×5 반올림) ✓
   비에너지 0.10~0.13 kWh/m³(ANR, 7bar 스크류 컴프레서 일반범위) · 단가는 국내 산업용 예시(≈170원/kWh).
   이 둘은 설비·계약마다 달라 사용자 입력(기본값 제공·출처 명시)으로 둔다. 값 지어내지 않음.
   ══════════════════════════════════════════════════════════════ */

const P_ATM = 0.1013;             // 대기압[MPa] (ANR 기준)

/* 표준 보어→로드 (ISO 15552/6432 등 현행 카탈로그 통용값) — 복동 후진면적용 */
const STD_ROD = { 12:6, 16:6, 20:8, 25:10, 32:12, 40:16, 50:20, 63:20, 80:25, 100:25, 125:32, 160:40, 200:40 };
const STD_BORES = [12,16,20,25,32,40,50,63,80,100,125,160,200];

/* 기본 계수(사용자 조정 가능) */
const DEFAULTS = {
  specificEnergy: 0.11,   // kWh/m³(ANR) — 7bar 스크류 컴프레서 일반(0.10~0.13)
  rate: 170,              // 원/kWh — 국내 산업용 평균 예시(2025 기준)
  hoursPerDay: 8,
  daysPerMonth: 22,
};

function compRatio(P) { return (P + P_ATM) / P_ATM; }
function areaMM2(D) { return Math.PI / 4 * D * D; }

/* ──────────────────────────────────────────────────────────────
   입력 계약 input = {
     bore,              // 보어 D [mm]
     rod,               // 로드 d [mm] (미지정 시 STD_ROD[D] 또는 0.4D)
     stroke,            // 스트로크 L [mm]
     pressure,          // 게이지압 P [MPa]
     acting,            // 'single' | 'double'
     cyclesPerMin,      // 작동빈도 [회/분]
     numCylinders,      // 실린더 수
     tubeId,            // (옵션) 배관 튜브 내경 [mm]  0/미지정이면 제외
     tubeLength,        // (옵션) 배관 길이 [m]
     hoursPerDay, daysPerMonth, specificEnergy, rate  // 비용 계수(미지정 시 DEFAULTS)
   }
   ────────────────────────────────────────────────────────────── */
function computeAC(input) {
  const D = Math.max(0, +input.bore || 0);
  const L = Math.max(0, +input.stroke || 0);
  const P = Math.max(0, +input.pressure || 0);
  const acting = input.acting === 'single' ? 'single' : 'double';
  const n = Math.max(0, +input.cyclesPerMin || 0);
  const nc = Math.max(1, Math.round(+input.numCylinders || 1));
  const rod = (input.rod != null && +input.rod > 0) ? +input.rod : (STD_ROD[D] != null ? STD_ROD[D] : Math.round(0.4 * D));
  const rodKnown = (input.rod != null && +input.rod > 0) || STD_ROD[D] != null;

  const CR = compRatio(P);
  const A_head = areaMM2(D);
  const A_rod = areaMM2(D) - areaMM2(rod);          // 후진 유효면적(보어−로드)

  // 1사이클 소비 [L] = mm³/1e6
  const extendL = (A_head * L) * CR / 1e6;
  const retractL = acting === 'double' ? (A_rod * L) * CR / 1e6 : 0;
  // 옵션 배관
  const tubeId = Math.max(0, +input.tubeId || 0);
  const tubeLen = Math.max(0, +input.tubeLength || 0);
  const pipingL = (tubeId > 0 && tubeLen > 0) ? (areaMM2(tubeId) * (tubeLen * 1000)) * CR / 1e6 : 0;

  const perCycleL = extendL + retractL + pipingL;

  // 유량
  const flowLpm = perCycleL * n * nc;               // L/min (ANR)
  const flowM3min = flowLpm / 1000;

  // 비용
  const hpd = (input.hoursPerDay != null) ? +input.hoursPerDay : DEFAULTS.hoursPerDay;
  const dpm = (input.daysPerMonth != null) ? +input.daysPerMonth : DEFAULTS.daysPerMonth;
  const se  = (input.specificEnergy != null) ? +input.specificEnergy : DEFAULTS.specificEnergy;
  const rate = (input.rate != null) ? +input.rate : DEFAULTS.rate;

  const minPerMonth = hpd * 60 * dpm;
  const airM3Month = flowM3min * minPerMonth;        // m³/월
  const energyKwhMonth = airM3Month * se;            // kWh/월
  const costMonth = energyKwhMonth * rate;           // 원/월
  const costYear = costMonth * 12;

  return {
    CR, A_head, A_rod, rod, rodKnown,
    perCycle: { extendL, retractL, pipingL, totalL: perCycleL, acting },
    flowLpm, flowM3min,
    cost: { hoursPerDay: hpd, daysPerMonth: dpm, specificEnergy: se, rate,
            minPerMonth, airM3Month, energyKwhMonth, costMonth, costYear },
    numCylinders: nc,
  };
}

module.exports = { computeAC, compRatio, STD_ROD, STD_BORES, DEFAULTS, P_ATM };
