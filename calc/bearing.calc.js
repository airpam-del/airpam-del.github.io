'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 베어링 계산 — 순수 함수 (DOM/전역 state 비의존)
   bearing.html 인라인 <script>에서 무손실 추출 (계산식 불변, 위치만 이동)
   추출 대상: interpDGBB, calcP, calcP0, DGBB_TABLE
   ══════════════════════════════════════════════════════════════ */

/* DGBB ISO 281 보간 */
const DGBB_TABLE = [
  {ratio:0.025,e:0.22,Y:2.00},{ratio:0.040,e:0.24,Y:1.80},{ratio:0.070,e:0.27,Y:1.60},
  {ratio:0.130,e:0.31,Y:1.40},{ratio:0.250,e:0.37,Y:1.20},{ratio:0.500,e:0.44,Y:1.00},
];
function interpDGBB(faC0) {
  const t = DGBB_TABLE;
  if (faC0 <= t[0].ratio) return {e:t[0].e,Y:t[0].Y};
  if (faC0 >= t[t.length-1].ratio) return {e:t[t.length-1].e,Y:t[t.length-1].Y};
  for (let i=0;i<t.length-1;i++) {
    if (faC0 >= t[i].ratio && faC0 <= t[i+1].ratio) {
      const r = (faC0 - t[i].ratio)/(t[i+1].ratio - t[i].ratio);
      return {e:t[i].e + r*(t[i+1].e-t[i].e), Y:t[i].Y + r*(t[i+1].Y-t[i].Y)};
    }
  }
  return {e:0.44,Y:1.00};
}

/* ══════════ 계산: 등가 동하중 P ══════════ */
function calcP(type, frKN, faKN, C0kN) {
  if (type === 'CRB' || type === 'NRB') return frKN; // 반경 전용
  if (type === 'TBB') return faKN; // 축방향 전용
  if (type === 'ACBB') {
    if (frKN === 0) return faKN * 0.57;
    const r = faKN/frKN;
    if (r <= 1.14) return frKN;
    return 0.35*frKN + 0.57*faKN;
  }
  if (type === 'TRB') {
    // e ≈ 0.4, Y ≈ 1.5 (대표값)
    const e = 0.4, Y = 1.5;
    if (frKN === 0) return 0.4*0 + Y*faKN;
    const r = faKN/frKN;
    if (r <= e) return frKN;
    return 0.4*frKN + Y*faKN;
  }
  if (type === 'SBB') {
    // 자동조심 볼: e ≈ 0.27, Y2 ≈ 2.3 (대표)
    const e = 0.27, Y1 = 2.3, Y2 = 3.4;
    if (frKN === 0) return Y2*faKN;
    const r = faKN/frKN;
    if (r <= e) return frKN + Y1*faKN;
    return 0.65*frKN + Y2*faKN;
  }
  if (type === 'SRB') {
    // 자동조심 롤러: e ≈ 0.3, Y2 ≈ 2.5 (대표)
    const e = 0.3, Y1 = 2.5, Y2 = 3.7;
    if (frKN === 0) return Y2*faKN;
    const r = faKN/frKN;
    if (r <= e) return frKN + Y1*faKN;
    return 0.67*frKN + Y2*faKN;
  }
  // DGBB
  if (frKN === 0 && faKN === 0) return 0;
  if (C0kN === 0) {
    if (frKN === 0) return faKN;
    return Math.max(frKN, 0.56*frKN + 1.5*faKN);
  }
  const faC0 = faKN/C0kN;
  const {e,Y} = interpDGBB(faC0);
  if (frKN === 0) return faKN;
  const r = faKN/frKN;
  if (r <= e) return frKN;
  return 0.56*frKN + Y*faKN;
}

/* ══════════ 계산: 등가 정하중 P0 ══════════ */
function calcP0(type, frKN, faKN) {
  if (type === 'CRB' || type === 'NRB') return frKN;
  if (type === 'TBB') return faKN;
  if (type === 'ACBB') return Math.max(0.5*frKN + 0.26*faKN, frKN);
  if (type === 'TRB') return Math.max(0.5*frKN + 0.22*faKN, frKN);
  if (type === 'SBB') return Math.max(0.6*frKN + 0.5*faKN, frKN);
  if (type === 'SRB') return Math.max(0.5*frKN + 0.45*faKN, frKN);
  return Math.max(0.6*frKN + 0.5*faKN, frKN); // DGBB
}

/* Node 테스트 환경에서만 export (브라우저에서는 module 미정의 → 건너뜀) */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DGBB_TABLE, interpDGBB, calcP, calcP0 };
}
