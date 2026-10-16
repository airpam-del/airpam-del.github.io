'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 전동 액추에이터(로드형) 계산 — 순수 함수 (DOM 비의존)
   출처: electric-actuator.html 무손실 추출 (계산식 불변). html은 이 모듈을
   로드하지 않는 병렬 사본이므로, html selectActuator 를 고치면 여기도 동일 유지할 것.
   등급: verified — SMC LEY(로드형·스텝모터) 사양표 실측 대조.
   ────────────────────────────────────────────────────────────────
   데이터 검증(2026-10 재확인, SMC LEY 카탈로그):
     · 푸싱력 max: LEY25 452 N, LEY32 707 N — 카탈로그와 정확 일치.
     · 시리즈 최대 워크로드: 수평 60kg / 수직 53kg — LEY40 값(60/53)과 정확 일치.
     · 리드셋: LEY16 2.5/5/10, LEY40 4/8/16 등 사이즈별 카탈로그 일치. 스트로크 한계 일치.
     → 특정 비(非)반올림 값들이 모두 일치 → 표 전체가 카탈로그 전사로 확인(하모닉과 동일 기준).
   선정식(카탈로그 정격 대조):
     워크로드(설치 H/V) ≥ 이동질량 · 최대속도 ≥ 요구속도 · 스트로크한계 ≥ 요구스트로크 ·
     (선택)푸싱력 ≥ 요구푸싱력. 추천 = 적합 중 최소 사이즈 → 그 중 최대 리드(고속).
     좌굴 경고(정성): 로드형 수직 + 스트로크 > 최대의 85%.
   ※ 캐비앗(카탈로그 공통): 실제 워크로드-속도는 가감속·듀티에 따라 달라짐(부하속도 그래프 확인).
     현재 로드형(LEY) 지원. 슬라이더형(LEFS/LEFB)은 카탈로그 확보 후 추가.
   ══════════════════════════════════════════════════════════════ */

/* SMC LEY 실데이터 (스텝모터). 각 리드: [워크로드H kg, 워크로드V kg, 푸싱력(max) N, 최대속도 mm/s] */
const LEY = {
  'LEY16': { strokeMax:300, motor:'28',  leads:{ '10':[4,2,38,500],  '5':[11,4,74,250],  '2.5':[20,8,141,125] } },
  'LEY25': { strokeMax:400, motor:'42',  leads:{ '12':[12,8,122,500], '6':[30,16,238,250], '3':[30,30,452,125] } },
  'LEY32': { strokeMax:500, motor:'56M', leads:{ '16':[20,11,189,500], '8':[40,22,370,250], '4':[40,43,707,125] } },
  'LEY40': { strokeMax:500, motor:'56L', leads:{ '16':[30,13,283,300], '8':[60,27,553,150], '4':[60,53,1058,75] } },
};

/* LEY 사이즈×리드 조합 평탄화 */
function leyCombos() {
  const out = [];
  Object.keys(LEY).forEach(size => { const s = LEY[size];
    Object.keys(s.leads).forEach(lead => { const a = s.leads[lead];
      out.push({ size, lead: parseFloat(lead), strokeMax: s.strokeMax, workH: a[0], workV: a[1], pushF: a[2], vmax: a[3] });
    });
  });
  return out;
}

/* 선정 — input: { load(kg), speed(mm/s), stroke(mm), ori:'h'|'v', push(N|null) } */
function selectActuator(input) {
  const combos = leyCombos().map(c => {
    const workLoad = input.ori === 'v' ? c.workV : c.workH;
    const loadOk = workLoad >= input.load;
    const speedOk = c.vmax >= input.speed;
    const strokeOk = c.strokeMax >= input.stroke;
    const pushOk = (input.push == null) ? true : (c.pushF >= input.push);
    const buckling = (input.ori === 'v' && input.stroke > 0.85 * c.strokeMax);
    return Object.assign({}, c, { workLoad, loadOk, speedOk, strokeOk, pushOk, buckling,
      adequate: loadOk && speedOk && strokeOk && pushOk });
  });
  const adeq = combos.filter(c => c.adequate);
  let rec = null;
  if (adeq.length) {
    const sizeOrder = { LEY16:1, LEY25:2, LEY32:3, LEY40:4 };
    adeq.sort((a, b) => sizeOrder[a.size] - sizeOrder[b.size] || b.lead - a.lead);
    rec = adeq[0];
  }
  return { combos, rec };
}

module.exports = { LEY, leyCombos, selectActuator };
