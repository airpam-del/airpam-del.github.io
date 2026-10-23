'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn · 금강케이블 전력케이블(VV/CV) 선정 — 순수 함수 (DOM 비의존)
   출처: cable-power.html 무손실 추출 (계산식 불변). html은 이 모듈을
   로드하지 않는 병렬 사본이므로, html computePower 를 고치면 여기도 동일 유지할 것.
   등급: verified — 전압강하는 금강 카탈로그 도체저항으로 정확 계산, 허용전류는
     IEC 60364-5-52(KS C IEC 60364-5-52) 설치방식별 표준표 + 주위온도·집합 보정계수를
     그대로 적용. 과거 "방법 C·30℃ 고정"이라 beta였으나, 설치방식·온도·집합을
     표준대로 모델링하여 verified 승격.
   ────────────────────────────────────────────────────────────────
   선정식:
     전압강하 ΔV[V] = k · I · R · L/1000   (k: 단상 2, 3상 √3 / R=도체저항[Ω/km], L=긍장[m])
     전압강하율[%] = ΔV / V × 100
     보정 허용전류[A] = 기준 허용전류(설치방식·도체수) × k_온도 × k_집합
     추천 = 전압강하율 ≤ 허용% AND 보정 허용전류 ≥ 부하전류 인 최소 공칭단면적(SQ) → 금강 VV/CV 품번
   데이터 출처:
     · 도체저항[Ω/km] : 금강케이블 카탈로그 VV(p.8)/CV(p.10) 실측(동도체, KS 표준값 일치).
     · 완성외경[mm]   : 금강 카탈로그(VV/CV, 심수별).
     · 기준 허용전류[A]: IEC 60364-5-52 Ed.3 Table B.52.2~B.52.5 (동도체).
        방법 A1(단열벽 전선관)·B1(전선관 노출/매입)·C(노출·클립 직결)=기준 30℃(기중),
        방법 D(지중 매설)=기준 20℃(지중). PVC(VV)=70℃, XLPE(CV)=90℃.
     · 주위온도 보정 : Table B.52.14(기중)·B.52.15(지중). 집합 보정: Table B.52.17(밀집/다발).
   ══════════════════════════════════════════════════════════════ */

const SQ_LIST = [1.5, 2.5, 4, 6, 10];
/* 도체저항 [Ω/km] (20℃, 동도체) — VV/CV 공통(동일 도체) */
const R_OHM = { 1.5:12.1, 2.5:7.41, 4:4.61, 6:3.08, 10:1.83 };

/* 기준 허용전류 [A] IEC 60364-5-52 Table B.52.2~B.52.5 (Cu).
   [타입][설치방식][부하도체수 2(단상)/3(3상)][SQ]
   A1·B1·C = 기중(ref 30℃),  D = 지중(ref 20℃, 토양저항 2.5 K·m/W). */
const AMP_BASE = {
  VV: { // PVC 70℃ (B.52.2 2심 / B.52.4 3심)
    A1: { 2:{1.5:14.5,2.5:19.5,4:26,6:34,10:46}, 3:{1.5:13.5,2.5:18,4:24,6:31,10:42} },
    B1: { 2:{1.5:17.5,2.5:24,  4:32,6:41,10:57}, 3:{1.5:15.5,2.5:21,4:28,6:36,10:50} },
    C:  { 2:{1.5:19.5,2.5:27,  4:36,6:46,10:63}, 3:{1.5:17.5,2.5:24,4:32,6:41,10:57} },
    D:  { 2:{1.5:22,  2.5:29,  4:38,6:47,10:63}, 3:{1.5:18,  2.5:24,4:31,6:39,10:52} },
  },
  CV: { // XLPE 90℃ (B.52.3 2심 / B.52.5 3심)
    A1: { 2:{1.5:19,2.5:26,4:35,6:45,10:61}, 3:{1.5:17,2.5:23,4:31,6:40,10:54} },
    B1: { 2:{1.5:23,2.5:31,4:42,6:54,10:75}, 3:{1.5:20,2.5:28,4:37,6:48,10:66} },
    C:  { 2:{1.5:24,2.5:33,4:45,6:58,10:80}, 3:{1.5:22,2.5:30,4:40,6:52,10:71} },
    D:  { 2:{1.5:26,2.5:34,4:44,6:56,10:73}, 3:{1.5:22,2.5:29,4:37,6:46,10:61} },
  },
};
/* 설치방식 메타 — 라벨·환경(기중/지중)·기준온도 */
const METHODS = {
  A1: { label:'A1 · 단열벽 내 전선관', env:'air',    ref:30, desc:'절연전선을 단열벽 속 전선관에 포설(방열 최저, 가장 보수적)' },
  B1: { label:'B1 · 전선관 배선',       env:'air',    ref:30, desc:'전선관(노출·매입) 안에 절연전선 포설 — 일반 배관' },
  C:  { label:'C · 노출·벽면 직결',     env:'air',    ref:30, desc:'케이블을 벽면·트레이에 직접 클립 고정(노출)' },
  D:  { label:'D · 지중 매설',          env:'ground', ref:20, desc:'지중 전선관/직매(토양저항 2.5 K·m/W 기준)' },
};
/* 주위온도 보정계수 — B.52.14(기중) / B.52.15(지중). [온도℃]=계수 */
const TEMP_AIR = {
  VV: {10:1.22,15:1.17,20:1.12,25:1.06,30:1.0,35:0.94,40:0.87,45:0.79,50:0.71,55:0.61,60:0.50},
  CV: {10:1.15,15:1.12,20:1.08,25:1.04,30:1.0,35:0.96,40:0.91,45:0.87,50:0.82,55:0.76,60:0.71,65:0.65,70:0.58,75:0.50,80:0.41},
};
const TEMP_GND = {
  VV: {10:1.10,15:1.05,20:1.0,25:0.95,30:0.89,35:0.84,40:0.77,45:0.71,50:0.63,55:0.55,60:0.45},
  CV: {10:1.07,15:1.04,20:1.0,25:0.96,30:0.93,35:0.89,40:0.85,45:0.80,50:0.76,55:0.71,60:0.65,65:0.60,70:0.53,75:0.46,80:0.38},
};
/* 집합(다발) 감소계수 — B.52.17 "다발·표면·매입/밀폐". [회로수]=계수 */
const GROUP = {1:1.0,2:0.80,3:0.70,4:0.65,5:0.60,6:0.57,7:0.54,8:0.52,9:0.50,12:0.45,16:0.41,20:0.38};

/* 온도 보정계수 (표 사이는 선형보간, 표 범위 밖은 양끝 클램프) */
function tempFactor(type, env, ambientC) {
  const tbl = (env === 'ground') ? TEMP_GND[type] : TEMP_AIR[type];
  const keys = Object.keys(tbl).map(Number).sort((a, b) => a - b);
  const t = (ambientC == null || !isFinite(ambientC)) ? keys[0] : +ambientC;
  if (t <= keys[0]) return tbl[keys[0]];
  if (t >= keys[keys.length - 1]) return tbl[keys[keys.length - 1]];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t >= a && t <= b) {
      const fa = tbl[a], fb = tbl[b];
      return fa + (fb - fa) * (t - a) / (b - a);
    }
  }
  return 1;
}
/* 집합 감소계수 — 표에 없는 회로수는 같거나 큰 최소 키(더 보수적=낮은 계수) */
function groupFactor(circuits) {
  const n = Math.max(1, Math.round(+circuits || 1));
  const keys = Object.keys(GROUP).map(Number).sort((a, b) => a - b);
  if (n <= keys[0]) return GROUP[keys[0]];
  if (n >= keys[keys.length - 1]) return GROUP[keys[keys.length - 1]];
  if (GROUP[n] != null) return GROUP[n];
  for (let i = 0; i < keys.length; i++) { if (keys[i] >= n) return GROUP[keys[i]]; }
  return GROUP[keys[keys.length - 1]];
}

const CABLE_META = {
  VV: { name:'VV', full:'0.6/1kV 비닐절연 비닐시즈 (PVC)', tmax:70 },
  CV: { name:'CV', full:'0.6/1kV 가교폴리에틸렌절연 비닐시즈 (XLPE)', tmax:90 },
};

/* 완성외경 [mm] (금강 카탈로그) — [타입][심수][SQ] */
const OD = {
  VV: { 1:{1.5:6.5,2.5:7.0,4:8.0,6:8.5,10:9.5}, 2:{1.5:11.5,2.5:12.0,4:14.0,6:15.5,10:17.0}, 3:{1.5:12.0,2.5:13.0,4:15.0,6:16.0,10:18.0}, 4:{1.5:13.0,2.5:14.0,4:16.0,6:17.5,10:20.0} },
  CV: { 1:{1.5:6.3,2.5:6.7,4:7.2,6:7.8,10:9.4}, 2:{1.5:11.0,2.5:12.0,4:13.0,6:14.0,10:17.0}, 3:{1.5:11.5,2.5:12.5,4:13.5,6:14.5,10:18.0}, 4:{1.5:12.5,2.5:13.5,4:14.5,6:16.0,10:20.0} },
};

/* ──────────────────────────────────────────────────────────────
   입력 계약 input = {
     cableType:'VV'|'CV', phase:'1p'|'3p', voltage, currentA, lengthM, dropPct, cores,
     method:'A1'|'B1'|'C'|'D'(기본 'C'), ambientC(기본 30/지중 20 기준), circuits(기본 1)
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
  const method = METHODS[input.method] ? input.method : 'C';
  const env = METHODS[method].env;
  const refTemp = METHODS[method].ref;
  const ambientC = (input.ambientC != null && isFinite(+input.ambientC)) ? +input.ambientC : refTemp;
  const circuits = Math.max(1, Math.round(+input.circuits || 1));
  const kTemp = tempFactor(type, env, ambientC);
  const kGroup = groupFactor(circuits);

  const results = SQ_LIST.map(sq => {
    const R = R_OHM[sq];
    const vdV = k * I * R * (L / 1000);          // 전압강하 [V]
    const vdPct = V > 0 ? (vdV / V * 100) : 0;    // 전압강하율 [%]
    const baseAmp = AMP_BASE[type][method][loaded][sq];
    const amp = Math.round(baseAmp * kTemp * kGroup * 10) / 10; // 보정 허용전류
    const od = (OD[type][cores] && OD[type][cores][sq]) || null;
    const vdOk = vdPct <= dropPct;
    const ampOk = amp >= I;
    const ok = vdOk && ampOk;
    return { sq, R, vdV, vdPct, baseAmp, amp, od, loaded, vdOk, ampOk, ok };
  });

  const passing = results.filter(r => r.ok); // SQ_LIST 오름차순이라 첫 적합이 최소 SQ
  const recommended = passing.length ? passing[0] : null;

  const notes = [];
  if (I <= 0) notes.push('부하 전류를 입력하세요(전력→전류 도우미 이용 가능).');
  if (L <= 0) notes.push('긍장(전선 길이)을 입력하세요.');
  if (!recommended && I > 0 && L > 0) notes.push('이 조건에서 10SQ(카탈로그 최대)로도 부족합니다(전압강하 또는 보정 허용전류 초과). 긍장 단축·회로 분할·설치방식 변경·더 큰 규격(제작 문의)을 검토하세요.');
  notes.push('허용전류는 IEC 60364-5-52(KS C IEC 60364-5-52) 설치방식 ' + method + '(' + METHODS[method].label.replace(/^[A-D0-9]+ · /, '') + ') 기준표에 주위온도·집합 보정을 적용한 값입니다. 실제 포설 형태·그룹핑·토양 조건은 설계·감리로 최종 확인하세요.');

  return {
    cableType:type, meta:CABLE_META[type], phase, voltage:V, currentA:I, lengthM:L, dropPct, cores, loaded,
    method, methodLabel:METHODS[method].label, env, refTemp, ambientC, circuits, kTemp, kGroup,
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

module.exports = { computePower, powerToCurrent, tempFactor, groupFactor, SQ_LIST, R_OHM, AMP_BASE, METHODS, TEMP_AIR, TEMP_GND, GROUP, OD, CABLE_META };
