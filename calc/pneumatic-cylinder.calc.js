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

module.exports = { calcCylinderResults, BORE_TABLE, ETA };
