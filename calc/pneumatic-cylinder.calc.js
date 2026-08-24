'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 공압 실린더 계산 — 순수 함수 (DOM 비의존)
   출처: pneumatic-cylinder.html 무손실 추출 (계산식 불변)
   ══════════════════════════════════════════════════════════════ */

const BORE_TABLE = [
  {D:20,  d:8,   A_full:314,  A_rod:264},
  {D:25,  d:10,  A_full:491,  A_rod:412},
  {D:32,  d:12,  A_full:804,  A_rod:691},
  {D:40,  d:16,  A_full:1257, A_rod:1056},
  {D:50,  d:20,  A_full:1963, A_rod:1649},
  {D:63,  d:20,  A_full:3117, A_rod:2803},
  {D:80,  d:25,  A_full:5027, A_rod:4536},
  {D:100, d:30,  A_full:7854, A_rod:7147},
];
const ETA = 0.85; // 실린더 추력 효율

/**
 * 보어별 추력 계산
 * @param {number} P          공급압 [MPa]
 * @param {number} loadFactor 부하율 (0~1)
 * @param {boolean} needPull  후진 추력 필요 여부
 */
function calcCylinderResults(P, loadFactor, fRequired, needPull) {
  return BORE_TABLE.map(({ D, d, A_full, A_rod }) => {
    const F_push_theo = P * A_full * ETA;
    const F_push_rec  = F_push_theo * loadFactor;
    const F_pull_theo = needPull ? P * A_rod * ETA : null;
    const F_pull_rec  = needPull ? F_pull_theo * loadFactor : null;

    const pushOk = F_push_rec >= fRequired;
    const pullOk = !needPull || (F_pull_rec !== null && F_pull_rec >= fRequired);
    const theoOk = F_push_theo >= fRequired;

    let status;
    if (pushOk && pullOk)       status = 'ok';
    else if (theoOk && !pushOk) status = 'warn';
    else                         status = 'bad';

    return { D, d, A_full, A_rod, F_push_theo, F_push_rec, F_pull_theo, F_pull_rec,
             status, needPull };
  });
}

const MAKERS = [
  {
    key:'smc', name:'SMC', country:'🇯🇵',
    series:{
      // 2026-07 검증: CM2는 Ø20~40, Ø50 이상은 CA2 시리즈로 분리
      single:[
        {name:'CM2(단동)', minD:20, maxD:40, pMin:0.05, pMax:1.0},
        {name:'CA2 계열(단동 사양 확인 필요)', minD:50, maxD:100, pMin:0.05, pMax:1.0}, // TODO: SMC 대구경(Ø50~) 단동 표준 시리즈명 카탈로그 확인 필요
      ],
      double:[
        {name:'CM2B', minD:20, maxD:40, pMin:0.05, pMax:1.0},
        {name:'CA2',  minD:50, maxD:100, pMin:0.05, pMax:1.0},
      ],
    },
    url:'https://www.smcworld.com',
    note:'국내 유통망 최대, 부품 수급 용이'
  },
  {
    key:'festo', name:'Festo', country:'🇩🇪',
    series:{
      single:[
        {name:'ESNU', minD:20, maxD:63, pMin:0.5, pMax:0.8}, // TODO: ESNU 압력범위 카탈로그 확인 (단동 최소압 통상 0.15~0.25MPa 수준으로 추정)
      ],
      double:[
        {name:'DSBC', minD:32, maxD:100, pMin:0.05, pMax:1.0},
      ],
    },
    url:'https://www.festo.com',
    note:'정밀 제어·내구성 강점'
  },
  {
    key:'ckd', name:'CKD', country:'🇯🇵',
    series:{
      // TODO: SSD(단동)·SCA2(복동)의 실제 보어 라인업이 Ø20~100 전체를 커버하는지 카탈로그 확인 필요
      single:[
        {name:'SSD',  minD:20, maxD:100, pMin:0.05, pMax:1.0},
      ],
      double:[
        {name:'SCA2', minD:20, maxD:100, pMin:0.05, pMax:1.0},
      ],
    },
    url:'https://www.ckd.co.jp',
    note:'가격 경쟁력, ISO 표준 호환'
  },
];

/* ══════════════════════════════════════════════════════════════
   선정 파이프라인 — pneumatic-cylinder.html runCalc 무손실 사본
   pneumatic-cylinder.html은 이 모듈을 로드하지 않는 병렬 사본이므로,
   html runCalc 를 고치면 여기도 동일 유지할 것.
   입력 계약 input = { pressure, loadFactor, fRequired, cylinderType:'single'|'double',
                       direction:'push'|'pull'|'both', makers:{smc,festo,ckd} }
   ══════════════════════════════════════════════════════════════ */
function computePC(input) {
  const { pressure, loadFactor, fRequired, cylinderType, direction, makers } = input;
  const P = pressure, LF = loadFactor;
  const needPull = cylinderType === 'double' || direction === 'both';
  const typeLabel = cylinderType === 'single' ? '단동' : '복동';
  const results = [], makerNotes = [];
  for (const maker of MAKERS) {
    if (!makers[maker.key]) continue;
    const seriesList = cylinderType === 'single' ? maker.series.single : maker.series.double;
    const noBore = [], noPres = [];
    for (const bore of BORE_TABLE) {
      const { D, d, A_full, A_rod } = bore;
      const series = seriesList.find(s => D >= s.minD && D <= s.maxD);
      if (!series) { noBore.push('Ø' + D); continue; }
      if (P < series.pMin || P > series.pMax) { noPres.push('Ø' + D); continue; }
      const F_push_theo = P * A_full * ETA;
      const F_push_rec  = F_push_theo * LF;
      const F_pull_theo = needPull ? P * A_rod * ETA : null;
      const F_pull_rec  = needPull ? F_pull_theo * LF : null;
      const pushOk = F_push_rec >= fRequired;
      const pullOk = !needPull || (F_pull_rec !== null && F_pull_rec >= fRequired);
      const theoOk = F_push_theo >= fRequired;
      let status;
      if (pushOk && pullOk) status = 'ok';
      else if (theoOk && !pushOk) status = 'warn';
      else status = 'bad';
      results.push({ maker, series, D, d, A_full, A_rod, F_push_theo, F_push_rec, F_pull_theo, F_pull_rec, status, needPull });
    }
    if (noBore.length) makerNotes.push(`${maker.country} ${maker.name}: ${noBore.join(', ')}는 ${typeLabel} 라인업 없음 — 결과에서 제외`);
    if (noPres.length) makerNotes.push(`${maker.country} ${maker.name}: 공급압 ${P} MPa가 ${typeLabel} 시리즈 압력범위 밖 — ${noPres.join(', ')} 제외`);
  }
  const order = { ok: 0, warn: 1, bad: 2 };
  results.sort((a, b) => order[a.status] - order[b.status] || a.D - b.D);
  return { needPull, results, makerNotes, recommended: results.length ? results[0] : null };
}

module.exports = { calcCylinderResults, computePC, BORE_TABLE, MAKERS, ETA };
