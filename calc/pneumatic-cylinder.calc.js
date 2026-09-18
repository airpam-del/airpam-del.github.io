'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 공압 실린더 계산 — 순수 함수 (DOM 비의존)
   출처: pneumatic-cylinder.html 무손실 추출 (계산식 불변)
   추력 F=P·A·η·부하율 (η=0.85) 3타입 공통. 타입마다 보어표·브랜드 시리즈만 다름.
   3타입 데이터 출처: 표준 로드경=ISO 15552, 소형=ISO 6432 규격, 컴팩트 로드경/후진추력=
   CKD SSD2 카탈로그 이론추력표(p753) 교차검증+SMC CQ2 대조. 시리즈=3사 현행 카탈로그 대조, 2026.
   복동 기준. 단동은 브랜드별 사양차가 커 안내문 처리.
   ══════════════════════════════════════════════════════════════ */

const ETA = 0.85;
const CYL_CLASSES = {
  standard: {
    label: '표준형(ISO 15552)', iso: 'ISO 15552', boreLabel: 'Ø32~125',
    bores: [
      {D:32,  d:12, A_full:804,   A_rod:691},
      {D:40,  d:16, A_full:1257,  A_rod:1056},
      {D:50,  d:20, A_full:1963,  A_rod:1649},
      {D:63,  d:20, A_full:3117,  A_rod:2803},
      {D:80,  d:25, A_full:5027,  A_rod:4536},
      {D:100, d:25, A_full:7854,  A_rod:7363},
      {D:125, d:32, A_full:12272, A_rod:11468},
    ],
    makers: [
      {key:'smc',   name:'SMC',   country:'🇯🇵', seriesName:'C96',  minD:32, maxD:125, pMin:0.05, pMax:1.0, url:'https://www.smcworld.com', note:'ISO 15552 정품(C96/CP96), 국내 유통 최대'},
      {key:'festo', name:'Festo', country:'🇩🇪', seriesName:'DSBC', minD:32, maxD:125, pMin:0.05, pMax:1.0, url:'https://www.festo.com',   note:'ISO 15552 표준품, 정밀·내구성'},
      {key:'ckd',   name:'CKD',   country:'🇯🇵', seriesName:'SCA2', minD:40, maxD:100, pMin:0.05, pMax:1.0, url:'https://www.ckd.co.jp',   note:'가격 경쟁력, SCA2(Ø40~100)'},
    ],
  },
  compact: {
    label: '컴팩트형(ISO 21287)', iso: 'ISO 21287', boreLabel: 'Ø20~100',
    bores: [
      {D:20,  d:10, A_full:314,  A_rod:236},
      {D:25,  d:12, A_full:491,  A_rod:378},
      {D:32,  d:16, A_full:804,  A_rod:603},
      {D:40,  d:16, A_full:1257, A_rod:1056},
      {D:50,  d:20, A_full:1963, A_rod:1649},
      {D:63,  d:20, A_full:3117, A_rod:2803},
      {D:80,  d:25, A_full:5027, A_rod:4536},
      {D:100, d:30, A_full:7854, A_rod:7147},
    ],
    makers: [
      {key:'smc',   name:'SMC',   country:'🇯🇵', seriesName:'CQ2',  minD:20, maxD:100, pMin:0.05, pMax:1.0, url:'https://www.smcworld.com', note:'박형 컴팩트 CQ2, 라인업 광범위'},
      {key:'festo', name:'Festo', country:'🇩🇪', seriesName:'ADN',  minD:20, maxD:100, pMin:0.05, pMax:1.0, url:'https://www.festo.com',   note:'ISO 21287 컴팩트 ADN'},
      {key:'ckd',   name:'CKD',   country:'🇯🇵', seriesName:'SSD2', minD:20, maxD:100, pMin:0.05, pMax:1.0, url:'https://www.ckd.co.jp',   note:'공간절약형 SSD2(현행), 초박형'},
    ],
  },
  mini: {
    label: '소형(ISO 6432)', iso: 'ISO 6432', boreLabel: 'Ø8~25',
    bores: [
      {D:8,  d:4,  A_full:50,  A_rod:38},
      {D:10, d:4,  A_full:79,  A_rod:66},
      {D:12, d:6,  A_full:113, A_rod:85},
      {D:16, d:6,  A_full:201, A_rod:173},
      {D:20, d:8,  A_full:314, A_rod:264},
      {D:25, d:10, A_full:491, A_rod:412},
    ],
    makers: [
      {key:'smc',   name:'SMC',   country:'🇯🇵', seriesName:'C85',  minD:8, maxD:25, pMin:0.05, pMax:1.0, url:'https://www.smcworld.com', note:'ISO 6432 원형 소형 C85'},
      {key:'festo', name:'Festo', country:'🇩🇪', seriesName:'DSNU', minD:8, maxD:25, pMin:0.05, pMax:1.0, url:'https://www.festo.com',   note:'ISO 6432 원형 DSNU'},
      // CKD: ISO 6432 소형(펜형) 표준 라인업 없음 → 제외
    ],
  },
};

/* ══════════════════════════════════════════════════════════════
   선정 파이프라인 — pneumatic-cylinder.html computePC 무손실 사본
   html은 이 모듈을 로드하지 않는 병렬 사본이므로, html computePC 를 고치면 여기도 동일 유지할 것.
   입력 계약 input = { cylinderClass:'standard'|'compact'|'mini', pressure, loadFactor,
                       fRequired, cylinderType:'single'|'double', direction:'push'|'pull'|'both',
                       makers:{smc,festo,ckd} }
   ══════════════════════════════════════════════════════════════ */
function computePC(input) {
  const { cylinderClass, pressure:P, loadFactor:LF, fRequired, cylinderType, direction, makers } = input;
  const cls = CYL_CLASSES[cylinderClass] || CYL_CLASSES.standard;
  const needPull = cylinderType === 'double' || direction === 'both';
  const results = [], makerNotes = [];
  if (cylinderType === 'single') {
    makerNotes.push('현재 검증 데이터는 복동(양방향) 기준입니다. 단동(스프링 복귀)은 브랜드별 사양 차가 커, 복동으로 검토하시거나 제조사 카탈로그를 확인하세요.');
    return { cls, needPull, results, makerNotes, recommended: null };
  }
  for (const maker of cls.makers) {
    if (!makers[maker.key]) continue;
    const noBore = [], noPres = [];
    for (const b of cls.bores) {
      if (b.D < maker.minD || b.D > maker.maxD) { noBore.push('Ø'+b.D); continue; }
      if (P < maker.pMin || P > maker.pMax) { noPres.push('Ø'+b.D); continue; }
      const F_push_theo = P * b.A_full * ETA;
      const F_push_rec  = F_push_theo * LF;
      const F_pull_theo = needPull ? P * b.A_rod * ETA : null;
      const F_pull_rec  = needPull ? F_pull_theo * LF : null;
      const pushOk = F_push_rec >= fRequired;
      const pullOk = !needPull || (F_pull_rec !== null && F_pull_rec >= fRequired);
      const theoOk = F_push_theo >= fRequired;
      const status = (pushOk && pullOk) ? 'ok' : (theoOk && !pushOk) ? 'warn' : 'bad';
      results.push({ maker, D:b.D, d:b.d, A_full:b.A_full, A_rod:b.A_rod,
                     F_push_theo, F_push_rec, F_pull_theo, F_pull_rec, status, needPull });
    }
    if (noBore.length) makerNotes.push(`${maker.country} ${maker.name} ${maker.seriesName}: ${noBore.join(', ')}는 ${cls.label} 라인업 밖 — 제외`);
    if (noPres.length) makerNotes.push(`${maker.country} ${maker.name}: 공급압 ${P} MPa 범위 밖 — ${noPres.join(', ')} 제외`);
  }
  const order = { ok:0, warn:1, bad:2 };
  results.sort((a,b) => order[a.status]-order[b.status] || a.D-b.D);
  return { cls, needPull, results, makerNotes, recommended: results.length ? results[0] : null };
}

module.exports = { computePC, CYL_CLASSES, ETA };
