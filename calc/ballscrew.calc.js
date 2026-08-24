'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 볼스크류 계산 — 순수 함수 (DOM 비의존)
   출처: ballscrew.html 인라인 <script> 무손실 추출 (계산식 불변)
   ══════════════════════════════════════════════════════════════ */

const BS_DATA = {
  '16x5' :{C:9700,  C0:16000, dr:13.5},
  '16x10':{C:8300,  C0:13200, dr:13.5},
  '20x5' :{C:14000, C0:24000, dr:16.9},
  '20x10':{C:15200, C0:23300, dr:16.9},
  '20x20':{C:10800, C0:15800, dr:16.9},
  '25x5' :{C:22000, C0:42000, dr:21.5},
  '25x10':{C:24200, C0:40500, dr:21.5},
  '25x20':{C:19500, C0:31000, dr:21.5},
  '32x10':{C:39500, C0:73600, dr:27.3},
  '32x20':{C:33300, C0:60500, dr:27.3},
  '40x10':{C:52700, C0:103500,dr:34.0},
  '40x20':{C:46100, C0:88800, dr:34.0},
  '50x10':{C:76300, C0:161600,dr:43.0},
  '50x20':{C:65500, C0:134600,dr:43.0},
  '63x10':{C:103700,C0:221000,dr:55.0},
  '63x20':{C:90700, C0:194500,dr:55.0},
};
const DN_LIMIT = 70000;

/**
 * 축방향 하중 계산 [N]
 * @param {number} W  질량 [kg]
 * @param {'horizontal'|'vertical'|'incline'} dir
 * @param {number} ang  경사각 [deg] (incline 시)
 * @param {number} vmax  최대속도 [mm/s]
 * @param {number} tacc  가속시간 [s]
 */
function bsCalcFa(W, dir, ang, vmax, tacc) {
  const g = 9.81, mu = 0.003;
  const a = (vmax / 1000) / tacc;
  const Fi = W * a;
  if (dir === 'horizontal') return W * g * mu + Fi;
  if (dir === 'vertical')   return W * g + Fi;
  const rad = ang * Math.PI / 180;
  return W * g * (Math.sin(rad) + mu * Math.cos(rad)) + Fi;
}

/**
 * 후보 볼스크류 탐색
 * @param {number} Fa  [N]
 * @param {number} S   스트로크 [mm]
 * @param {number} vmax [mm/s]
 * @param {number} Lreq 요구 수명 [h]
 * @param {number} kFactor 좌굴 지지계수
 * @param {number} extra 여유 길이 [mm]
 * @param {number} tacc 가속시간 [s]
 */
function bsFindBest(Fa, S, vmax, Lreq, kFactor, extra, tacc, W) {
  extra = extra || 100;
  tacc  = tacc  || 0.1;
  W     = W     || 0;
  const results = [];
  for (const [key, dat] of Object.entries(BS_DATA)) {
    const parts = key.split('x');
    const d0 = parseInt(parts[0]), lead = parseInt(parts[1]);
    const { C, C0, dr } = dat;
    const nAllowed = DN_LIMIT / d0;
    const nm_op = vmax * 60 / lead;
    if (nm_op > nAllowed * 1.05) continue;
    const accelDist = 0.5 * vmax * tacc;
    const constDist = Math.max(0, S - 2 * accelDist);
    const tripTime  = tacc + (constDist > 0 ? constDist / vmax : 0) + tacc;
    const avgSpeed  = tripTime > 0 ? S / tripTime : vmax * 0.65;
    const nm_avg    = avgSpeed * 60 / lead;
    const Fa_safe   = Math.max(Fa, 10);
    const L10     = (C / Fa_safe) ** 3;
    const L10h    = L10 * 1e6 / (60 * Math.max(nm_avg, 1));
    const dr_m    = dr / 1000;
    const Ls      = (S + extra) / 1000;
    const E       = 206e9, I = Math.PI * dr_m ** 4 / 64;
    const Fb_N    = kFactor ** 2 * Math.PI ** 2 * E * I / Ls ** 2;
    const buckSF  = Fb_N / Fa_safe;
    const Dn      = d0 * nm_op;
    const statSF  = C0 / Fa_safe;
    const lifeOk  = L10h >= Lreq, buckOk = buckSF >= 3.5, dnsOk = Dn <= DN_LIMIT, statOk = statSF >= 3.0;
    const penalty = (lifeOk?0:2000)+(buckOk?0:1000)+(dnsOk?0:500)+(statOk?0:500);
    const tiebreak = (d0/63)*10 + (lead/40)*1;
    // 가속 토크·출력 (스크류+테이블 관성) — ballscrew.html bsFindBest 와 동일
    const rho     = 7800, Ltot = (S + extra + 200) / 1000;
    const J_screw = (Math.PI/2) * rho * Ltot * (dr_m/2)**4;
    const J_table = W * (lead/1000/(2*Math.PI))**2;
    const J_total = J_screw + J_table;
    const alpha   = (nm_op*2*Math.PI/60) / tacc;
    const T_run   = Fa_safe * (lead/1000) / (2 * Math.PI * 0.9);
    const T_acc   = J_total * alpha;
    const T_total = T_run + T_acc;
    const P_kW    = T_total * (nm_op*2*Math.PI/60) / 1000;
    results.push({ d0, lead, nm_op, nm_avg, nm_allowed:nAllowed, L10h, Fb_N, buckSF, Dn, statSF,
                   lifeOk, buckOk, dnsOk, statOk, score:penalty+tiebreak,
                   C, C0, dr, Ls, allOk:lifeOk&&buckOk&&dnsOk&&statOk,
                   T_run, T_acc, T_total, P_kW, J_screw, J_table });
  }
  results.sort((a, b) => a.score - b.score);
  return results;
}

/* ══════════════════════════════════════════════════════════════
   위저드 파이프라인 — ballscrew.html bsRender 의 무손실 사본 (계산식 불변)
   ballscrew.html은 이 모듈을 로드하지 않는 병렬 사본이므로, html bsRender/
   bsFindBest 를 고치면 여기도 동일 유지할 것.
   입력 계약 input = { W[kg], dir, angle[deg], vmax[mm/s], tacc[s], S[mm],
                       extra[mm], life[h], support(kFactor 문자열), h_day }
   ══════════════════════════════════════════════════════════════ */
function computeBS(input) {
  const { W, dir, angle, vmax, tacc, S, extra, life, support } = input;
  const Fa = bsCalcFa(W, dir, angle, vmax, tacc);
  const Lreq = parseFloat(life), kFactor = parseFloat(support);
  const combos = bsFindBest(Fa, S, vmax, Lreq, kFactor, extra, tacc, W);
  if (!combos.length) {
    return { Fa, Lreq, kFactor, combos: [], recommended: null, noOk: true, classes: null, alts: [] };
  }
  const bestOk = combos.find(c => c.allOk);
  const r = bestOk || combos[0];
  const noOk = !bestOk;
  const classes = {
    life: r.lifeOk ? 'ok' : r.L10h >= Lreq * 0.7 ? 'warn' : 'bad',
    buck: r.buckOk ? 'ok' : r.buckSF >= 2 ? 'warn' : 'bad',
    dns:  r.dnsOk  ? 'ok' : r.Dn <= DN_LIMIT * 1.1 ? 'warn' : 'bad',
    stat: r.statOk ? 'ok' : 'warn',
  };
  const alts = combos.filter(c => (c.d0 !== r.d0 || c.lead !== r.lead) && (noOk ? true : c.allOk)).slice(0, 4);
  return { Fa, Lreq, kFactor, combos, recommended: r, noOk, classes, alts };
}

module.exports = { bsCalcFa, bsFindBest, computeBS, BS_DATA, DN_LIMIT };
