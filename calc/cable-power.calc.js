'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn · 금강케이블 전력케이블(VV/CV) 선정 — 순수 함수 (DOM 비의존)
   출처: cable-power.html 무손실 추출 (계산식 불변). html은 이 모듈을
   로드하지 않는 병렬 사본이므로, html computePower 를 고치면 여기도 동일 유지할 것.
   등급: beta — 전압강하는 카탈로그 도체저항으로 정확 계산(verified급), 허용전류는
     설치방식·주위온도·집합에 따라 달라지는 표준 참고값(공사방법 C·30℃)이라 보정 필요 → beta.
   ────────────────────────────────────────────────────────────────
   선정식:
     전압강하 ΔV[V] = k · I · R · L/1000   (k: 단상 2, 3상 √3 / R=도체저항[Ω/km], L=긍장[m])
     전압강하율[%] = ΔV / V × 100
     허용전류 체크 = 표준 허용전류(A) ≥ 부하전류
     추천 = 전압강하율 ≤ 허용% AND 허용전류 ≥ 부하 인 최소 공칭단면적(SQ) → 금강 VV/CV 품번
   데이터 출처:
     · 도체저항[Ω/km] : 금강케이블 카탈로그 VV(p.8)/CV(p.10) 실측(동도체, KS 표준값 일치).
     · 완성외경[mm]   : 금강 카탈로그(VV/CV, 심수별).
     · 허용전류[A]    : IEC 60364-5-52 공사방법 C(노출·클립 직결)·동도체·주위 30℃ 표준 참고값.
                        PVC(VV)=70℃, XLPE(CV)=90℃. ★설치방식·온도·집합 보정 필수(그래서 beta).
   ══════════════════════════════════════════════════════════════ */

const SQ_LIST = [1.5, 2.5, 4, 6, 10];
/* 도체저항 [Ω/km] (20℃, 동도체) — VV/CV 공통(동일 도체) */
const R_OHM = { 1.5:12.1, 2.5:7.41, 4:4.61, 6:3.08, 10:1.83 };
/* 허용전류 [A] IEC 60364-5-52 공사방법C·Cu·30℃. [부하도체수 2(단상)/3(3상)] */
const AMP = {
  VV: { 2:{1.5:19.5,2.5:27,4:36,6:46,10:63}, 3:{1.5:17.5,2.5:24,4:32,6:41,10:57} }, // PVC 70℃
  CV: { 2:{1.5:24,2.5:33,4:45,6:58,10:80},   3:{1.5:22,2.5:30,4:40,6:52,10:71} },   // XLPE 90℃
};
/* 완성외경 [mm] (금강 카탈로그) — [타입][심수][SQ] */
const OD = {
  VV: { 1:{1.5:6.5,2.5:7.0,4:8.0,6:8.5,10:9.5}, 2:{1.5:11.5,2.5:12.0,4:14.0,6:15.5,10:17.0}, 3:{1.5:12.0,2.5:13.0,4:15.0,6:16.0,10:18.0}, 4:{1.5:13.0,2.5:14.0,4:16.0,6:17.5,10:20.0} },
  CV: { 1:{1.5:6.3,2.5:6.7,4:7.2,6:7.8,10:9.4}, 2:{1.5:11.0,2.5:12.0,4:13.0,6:14.0,10:17.0}, 3:{1.5:11.5,2.5:12.5,4:13.5,6:14.5,10:18.0}, 4:{1.5:12.5,2.5:13.5,4:14.5,6:16.0,10:20.0} },
};
const CABLE_META = {
  VV: { name:'VV', full:'0.6/1kV 비닐절연 비닐시즈 (PVC)', tmax:70 },
  CV: { name:'CV', full:'0.6/1kV 가교폴리에틸렌절연 비닐시즈 (XLPE)', tmax:90 },
};

/* ──────────────────────────────────────────────────────────────
   입력 계약 input = {
     cableType:'VV'|'CV', phase:'1p'|'3p', voltage, currentA, lengthM, dropPct, cores
   }
   ────────────────────────────────────────────────────────────── */
function computePower(input) {
  const type = (input.cableType === 'CV') ? 'CV' : 'VV';
  const phase = (input.phase === '3p') ? '3p' : '1p';
  const I = Math.max(0, +input.currentA || 0);
  const L = Math.max(0, +input.lengthM || 0);
  const V = (+input.voltage > 0) ? +input.voltage : (phase === '3p' ? 380 : 220);
  const dropPct = (+input.dropPct > 0) ? +input.dropPct : 3;
  const cores = [1, 2, 3, 4].indexOf(+input.cores) >= 0 ? +input.cores : (phase === '3p' ? 4 : 2);
  const loaded = (phase === '3p') ? 3 : 2;
  const k = (phase === '3p') ? Math.sqrt(3) : 2;

  const results = SQ_LIST.map(sq => {
    const R = R_OHM[sq];
    const vdV = k * I * R * (L / 1000);          // 전압강하 [V]
    const vdPct = V > 0 ? (vdV / V * 100) : 0;    // 전압강하율 [%]
    const amp = AMP[type][loaded][sq];
    const od = (OD[type][cores] && OD[type][cores][sq]) || null;
    const vdOk = vdPct <= dropPct;
    const ampOk = amp >= I;
    const ok = vdOk && ampOk;
    return { sq, R, vdV, vdPct, amp, od, loaded, vdOk, ampOk, ok };
  });

  const passing = results.filter(r => r.ok); // SQ_LIST 오름차순이라 첫 적합이 최소 SQ
  const recommended = passing.length ? passing[0] : null;

  const notes = [];
  if (I <= 0) notes.push('부하 전류를 입력하세요(전력→전류 도우미 이용 가능).');
  if (L <= 0) notes.push('긍장(전선 길이)을 입력하세요.');
  if (!recommended && I > 0 && L > 0) notes.push('이 조건에서 10SQ(카탈로그 최대)로도 부족합니다(전압강하 또는 허용전류 초과). 긍장 단축·회로 분할·더 큰 규격(제작 문의)을 검토하세요.');
  notes.push('허용전류는 IEC 60364-5-52 공사방법 C·주위 30℃ 표준 참고값입니다. 실제 설치방식(배관·직매·트레이)·주위온도·집합 회로수에 따라 보정(감소)이 필요합니다.');

  return {
    cableType:type, meta:CABLE_META[type], phase, voltage:V, currentA:I, lengthM:L, dropPct, cores, loaded,
    results, recommended, notes,
  };
}

/* 전력→전류 도우미: kW·전압·역률 → 전류[A] */
function powerToCurrent(kW, V, pf, phase) {
  kW = +kW || 0; V = +V || 0; pf = (+pf > 0 && +pf <= 1) ? +pf : 0.9;
  if (kW <= 0 || V <= 0) return 0;
  const W = kW * 1000;
  return (phase === '3p') ? W / (Math.sqrt(3) * V * pf) : W / (V * pf);
}

module.exports = { computePower, powerToCurrent, SQ_LIST, R_OHM, AMP, OD, CABLE_META };
