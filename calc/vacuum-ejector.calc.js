'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 진공 이젝터(진공 발생기) 선정 — 순수 함수 (DOM 비의존)
   출처: vacuum-ejector.html 무손실 추출 (계산식 불변). html은 이 모듈을
   로드하지 않는 병렬 사본이므로, html computeVE 를 고치면 여기도 동일 유지할 것.
   등급: 베타(beta). 이젝터 사양(최대진공·최대흡입유량·공기소비량)은 SMC ZH 카탈로그
     실측(정확)이나, 배기시간·누설 통기 매칭은 유량-진공 특성곡선에 의존해 근사다.
   ────────────────────────────────────────────────────────────────
   선정 개념(SMC 진공 기술자료):
     · 비통기(sealed) 워크 → S타입(고진공 −88kPa). 관건은 배기(응답)시간.
     · 통기/누설(porous) 워크 → L타입(대유량 −48/−53kPa). 관건은 흡입유량 ≥ 누설.
     · 흡입구 밀폐 시 유량0·진공최대(Pmax), 개방될수록 유량↑·진공↓ (특성곡선).
   배기(응답)시간 — 이론 최소치:
     t[s] = 60 · (V / Q) · ln( Pa / (Pa − Pv) )
       V=배기체적[L], Q=최대흡입유량[L/min ANR], Pa=101.3kPa(대기), Pv=목표진공[kPa, 게이지]
     실제는 유량이 진공 깊어질수록 감소 → 이론치의 약 1.5~2.5배. 기본 보정 ×2.0(조정값).
   공기소비량 → 가동비는 "공기 소비량·전기료" 계산기로 연계.
   ────────────────────────────────────────────────────────────────
   데이터 출처: SMC Vacuum Ejector Series ZH 카탈로그(ZH_EU). 공급압 0.45 MPa 기준.
     최대흡입유량 S/L · 공기소비량 · 최대진공(S −88 / L −48, ZH15~20 L −53) 실측 전재(2026).
   ══════════════════════════════════════════════════════════════ */

const P_ATM_KPA = 101.3;     // 대기압[kPa] (배기시간 ln 항)

/* SMC ZH 시리즈 (공급압 0.45MPa). q*=최대흡입유량[L/min ANR], air=공기소비량[L/min ANR] */
const VE_SIZES = [
  { size:'ZH05', nozzle:0.5, qS:5,  qL:8,   air:13,  pMaxL:48 },
  { size:'ZH07', nozzle:0.7, qS:12, qL:20,  air:23,  pMaxL:48 },
  { size:'ZH10', nozzle:1.0, qS:24, qL:34,  air:46,  pMaxL:48 },
  { size:'ZH13', nozzle:1.3, qS:40, qL:70,  air:78,  pMaxL:48 },
  { size:'ZH15', nozzle:1.5, qS:55, qL:75,  air:95,  pMaxL:53 },
  { size:'ZH18', nozzle:1.8, qS:65, qL:110, air:150, pMaxL:53 },
  { size:'ZH20', nozzle:2.0, qS:85, qL:135, air:185, pMaxL:53 },
];
const P_MAX_S = 88;          // S타입 최대진공[kPa]

/* ──────────────────────────────────────────────────────────────
   입력 계약 input = {
     workType,          // 'sealed'(비통기) | 'porous'(통기/누설)
     targetVacuum,      // 목표 진공도 [kPa, 게이지 양수]  (예: 60)
     volume,            // 배기 체적 V [L]  (패드+튜브 내용적)
     leakFlow,          // (porous) 추정 누설 유량 [L/min ANR]
     timeTarget,        // (옵션) 목표 배기시간 [s] — 충족 최소 모델 추천(기본 1.0)
     tFactor,           // 실제 보정계수 (기본 2.0)
     safety,            // 누설 여유계수 (기본 1.5)
   }
   반환 { type, results:[...], recommended, notes }
   ────────────────────────────────────────────────────────────── */
function computeVE(input) {
  const workType = input.workType === 'porous' ? 'porous' : 'sealed';
  const Pv = Math.max(0, Math.min(P_ATM_KPA - 0.1, +input.targetVacuum || 0));
  const V = Math.max(0, +input.volume || 0);
  const leak = Math.max(0, +input.leakFlow || 0);
  const timeTarget = (input.timeTarget != null && +input.timeTarget > 0) ? +input.timeTarget : 1.0;
  const tFactor = (input.tFactor != null && +input.tFactor > 0) ? +input.tFactor : 2.0;
  const safety = (input.safety != null && +input.safety > 0) ? +input.safety : 1.5;
  const type = workType === 'porous' ? 'L' : 'S';

  const lnTerm = Pv > 0 ? Math.log(P_ATM_KPA / (P_ATM_KPA - Pv)) : 0;

  const results = VE_SIZES.map(m => {
    const Q = type === 'L' ? m.qL : m.qS;
    const pMax = type === 'L' ? m.pMaxL : P_MAX_S;
    // 배기(응답)시간 — 이론 최소 + 실제 보정
    const tTheory = (V > 0 && Q > 0) ? 60 * (V / Q) * lnTerm : 0;
    const tReal = tTheory * tFactor;
    // 판정
    const okVacuum = Pv <= pMax;                 // 목표 진공 도달 가능?
    let okFlow, okTime;
    if (workType === 'porous') {
      okFlow = leak > 0 ? (Q >= leak * safety) : true;  // 누설의 안전배수 이상 흡입
      okTime = true;                                     // 통기는 시간보다 유량이 관건
    } else {
      okFlow = true;
      okTime = tReal <= timeTarget;                      // 목표 배기시간 충족
    }
    const ok = okVacuum && okFlow && okTime;
    const coreOk = okVacuum && okFlow;                   // 진공·유량은 되는데 시간만 초과 → warn
    const status = ok ? 'ok' : (coreOk ? 'warn' : 'bad');
    return { ...m, type, Q, pMax, tTheory, tReal, okVacuum, okFlow, okTime, status };
  });

  const recommended = results.find(r => r.status === 'ok') || null;

  const notes = [];
  if (V <= 0) notes.push('배기 체적(패드+튜브 내용적)을 입력하세요.');
  if (Pv <= 0) notes.push('목표 진공도를 입력하세요(예: 60 kPa).');
  if (workType === 'porous' && leak <= 0) notes.push('통기/누설 워크는 추정 누설 유량을 입력해야 흡입 유량 매칭이 됩니다. 미입력 시 유량 판정은 생략됩니다.');
  if (workType === 'porous') notes.push('통기 워크는 유량-진공 특성곡선상 목표 진공에 도달하지 못할 수 있습니다(누설이 클수록 진공↓). L타입(대유량)으로 완화하세요.');
  notes.push('배기시간은 이론 최소치 × 보정계수(기본 2.0)입니다. 실제 값은 유량곡선·배관에 따라 달라지니 여유를 두세요.');

  return { type, targetVacuum:Pv, volume:V, lnTerm, tFactor, safety, results, recommended, notes };
}

/* 체적 헬퍼: 패드 수·패드 1개 내용적(cm³) + 튜브(내경 id[mm]·길이 len[m]) → V[L] */
function evacVolumeL(padCount, padVolCm3, tubeIdMm, tubeLenM) {
  const pads = Math.max(0, (+padCount || 0) * (+padVolCm3 || 0));           // cm³
  const tube = (tubeIdMm > 0 && tubeLenM > 0) ? (Math.PI / 4 * tubeIdMm * tubeIdMm) * (tubeLenM * 1000) / 1000 : 0; // mm³→cm³
  return (pads + tube) / 1000;  // cm³ → L
}

module.exports = { computeVE, evacVolumeL, VE_SIZES, P_MAX_S, P_ATM_KPA };
