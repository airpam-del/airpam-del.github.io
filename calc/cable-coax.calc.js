'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn · 금강케이블 동축케이블 선정 — 순수 함수 (DOM 비의존)
   출처: cable-coax.html 무손실 추출 (계산식 불변). html은 이 모듈을
   로드하지 않는 병렬 사본이므로, html computeCoax 를 고치면 여기도 동일 유지할 것.
   등급: verified — 금강케이블 카탈로그(동축케이블 주요생산품) 감쇠량 실측표 기반.
   ────────────────────────────────────────────────────────────────
   선정식(결정론적):
     거리 손실[dB] = 감쇠량[dB/km] × 거리[km]   (주파수별 카탈로그 실측 감쇠량)
     추천 = 허용 손실(dB, 시스템 입력) 이내인 가장 가는(경제적) 케이블.
   데이터 출처: 금강케이블_카다로그 p.39 "동축케이블 주요생산품(High Frequency Coaxial Cable)".
     특성임피던스 75Ω(RG-58만 50Ω·본 계산 제외). 감쇠는 외경(굵기) 지배 → 5C/7C/10C 3클래스.
     일반 주파수(≤864MHz)는 전 품번, 광대역(>864MHz, 위성)은 HFBT(A도체) 인증품만.
   ※ "허용 손실(dB)"은 시스템(수신 감도·분배 손실·여유)에 따라 다른 입력값(기본 20dB 가이드).
     아날로그 CCTV 베이스밴드 등은 RF 감쇠표 영역과 다르므로 캐비앗 안내.
   ══════════════════════════════════════════════════════════════ */

/* 클래스별 감쇠량 [dB/km] (주파수 MHz). 5C/7C/10C 외경군별 동일. */
const COAX_ATT = {
  '5C':  { 10:23.8, 50:47.2, 150:77.2, 250:98.9, 350:117.1, 450:137.0, 750:178.0, 806:188.9, 864:195.0, 950:201.8, 1200:244.7, 1450:262.4, 1800:287.3, 2150:315.3 },
  '7C':  { 10:15.7, 50:30.7, 150:55.1, 250:71.0, 350:86.2,  450:95.9,  750:124.3, 806:129.7, 864:133.7, 950:134.7, 1200:151.2, 1450:165.8, 1800:190.2, 2150:203.5 },
  '10C': { 10:12.0, 50:25.4, 150:42.2, 250:54.0, 350:65.7,  450:73.4,  750:96.2,  806:101.2, 864:106.2, 950:107.2, 1200:118.1, 1450:129.6, 1800:148.1, 2150:162.1 },
};
/* 선택 가능한 주파수(카탈로그 실측 컬럼) + 용도 라벨 */
const COAX_FREQS = [
  { f:50,   label:'50 MHz · VHF 하단' },
  { f:150,  label:'150 MHz' },
  { f:250,  label:'250 MHz' },
  { f:350,  label:'350 MHz' },
  { f:450,  label:'450 MHz · FM/VHF' },
  { f:750,  label:'750 MHz · 지상파 UHF' },
  { f:864,  label:'864 MHz · CATV 풀밴드' },
  { f:950,  label:'950 MHz · 위성 IF 하단' },
  { f:1200, label:'1.2 GHz · 위성' },
  { f:1450, label:'1.45 GHz · 위성' },
  { f:1800, label:'1.8 GHz · 위성' },
  { f:2150, label:'2.15 GHz · 위성 IF 상단' },
];
/* 용도 프리셋 → 대표(보수적 최고) 주파수 */
const COAX_USES = {
  catv:      { label:'지상파·CATV (UHF)', freq:864 },
  satellite: { label:'위성방송 (SAT/IF)', freq:2150 },
  rf:        { label:'일반 RF·통신 (직접 선택)', freq:450 },
};
/* 금강케이블 동축 품번 (cls=감쇠 클래스, od=외경mm, cond 도체, wideband=광대역인증, ss=자가지지) */
const COAX_PRODUCTS = [
  { pn:'RG-6/U/T',   cls:'5C',  od:6.95,  imp:75, cond:'CW', wideband:false, ss:false, note:'범용 75Ω' },
  { pn:'5C-FBT',     cls:'5C',  od:6.95,  imp:75, cond:'CW', wideband:false, ss:false, note:'발포 절연' },
  { pn:'5C-HFBT',    cls:'5C',  od:7.10,  imp:75, cond:'A',  wideband:true,  ss:false, note:'주력·광대역(2.15GHz)' },
  { pn:'5C-SS',      cls:'5C',  od:6.95,  imp:75, cond:'CW', wideband:false, ss:true,  note:'자가지지(지지선)' },
  { pn:'RG-11/U/T',  cls:'7C',  od:10.20, imp:75, cond:'CW', wideband:false, ss:false, note:'범용 75Ω·저손실' },
  { pn:'7C-FBT',     cls:'7C',  od:10.20, imp:75, cond:'CW', wideband:false, ss:false, note:'발포 절연·저손실' },
  { pn:'7C-HFBT',    cls:'7C',  od:10.20, imp:75, cond:'A',  wideband:true,  ss:false, note:'저손실·광대역(2.15GHz)' },
  { pn:'7C-SS',      cls:'7C',  od:10.20, imp:75, cond:'CW', wideband:false, ss:true,  note:'자가지지(지지선)' },
  { pn:'10C-HFBT',   cls:'10C', od:12.80, imp:75, cond:'A',  wideband:true,  ss:false, note:'장거리·광대역(2.15GHz)' },
];

/* ──────────────────────────────────────────────────────────────
   입력 계약 input = { freqMHz, distanceM, budgetDB, selfSupportOnly }
   ────────────────────────────────────────────────────────────── */
function computeCoax(input) {
  const freq = +input.freqMHz || 0;
  const dist = Math.max(0, +input.distanceM || 0);
  const budget = (+input.budgetDB > 0) ? +input.budgetDB : 20;
  const ssOnly = !!input.selfSupportOnly;
  const distKm = dist / 1000;
  const wideband = freq > 864;

  const results = COAX_PRODUCTS.map(p => {
    const att = (COAX_ATT[p.cls] && COAX_ATT[p.cls][freq] != null) ? COAX_ATT[p.cls][freq] : null;
    // 주파수 적용 가능? 광대역(>864)은 wideband 인증품만
    const freqOk = att != null && (!wideband || p.wideband);
    const ssOk = !ssOnly || p.ss;
    const loss = freqOk ? att * distKm : null;
    const ok = freqOk && ssOk && loss != null && loss <= budget;
    return Object.assign({}, p, { att, loss, freqOk, ssOk, ok });
  });

  // 추천: 조건 충족 중 가장 가는(외경 최소=경제적). 없으면 null.
  const passing = results.filter(r => r.ok).slice().sort((a, b) => a.od - b.od);
  const recommended = passing.length ? passing[0] : null;

  // 표시 정렬: 적합 먼저 → 외경 오름차순
  const order = results.slice().sort((a, b) =>
    (a.ok === b.ok ? 0 : a.ok ? -1 : 1) || a.od - b.od);

  const notes = [];
  if (dist <= 0) notes.push('전송 거리를 입력하세요.');
  if (wideband) notes.push('864MHz 초과(위성 등)는 광대역 인증품(HFBT)만 적용됩니다.');
  if (!recommended && dist > 0) notes.push('이 거리·주파수에서 허용 손실(' + budget + 'dB) 이내 케이블이 없습니다. 더 굵은 품번·라인증폭기(부스터)·광전송을 검토하세요.');
  notes.push('아날로그 CCTV 영상(베이스밴드)은 RF 감쇠표와 다릅니다. CATV·위성·RF 전송 기준입니다.');

  return { freq, distanceM: dist, budgetDB: budget, distKm, wideband, results: order, recommended, notes };
}

module.exports = { computeCoax, COAX_ATT, COAX_PRODUCTS, COAX_FREQS, COAX_USES };
