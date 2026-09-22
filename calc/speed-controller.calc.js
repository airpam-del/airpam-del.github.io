'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 스피드 컨트롤러 계산 — 순수 함수 (DOM 비의존)
   출처: speed-controller.html 무손실 추출 (계산식 불변)
   ══════════════════════════════════════════════════════════════ */

/* 보어별 수압 면적 [mm²] */
const BORE_TABLE_SC = {
  20:314, 25:491, 32:804, 40:1257, 50:1963, 63:3117, 80:5027, 100:7854
};
const STD_BORES_SC = [20, 25, 32, 40, 50, 63, 80, 100];

/**
 * 참고 유량 계산 [L/min ANR]
 * @param {number} bore   실린더 보어 [mm]
 * @param {number} speed  피스톤 속도 [mm/s]
 * @param {number} P      공급압 [MPa]
 */
function calcRefFlow(bore, speed, P) {
  const area = BORE_TABLE_SC[bore] || 804;
  return (area * speed * 60) / 1000000 * (P / 0.1013 + 1);
}

/**
 * 보어 헬퍼 — 필요 추력/압력으로 권장 보어 산정
 * 권장 추력 = P × A × 0.6 ≥ F
 * @param {number} F  필요 추력 [N]
 * @param {number} P  공급압 [MPa]
 */
function recommendBore(F, P) {
  for (const D of STD_BORES_SC) {
    const area = BORE_TABLE_SC[D];
    if (P * area * 0.6 >= F) return D;
  }
  return null;
}

/**
 * 수평 부하 추력 계산 [N]
 * @param {number} m   질량 [kg]
 * @param {number} mu  마찰계수
 */
function calcForceHorizontal(m, mu) {
  return m * 9.81 * mu * 1.5;
}

/**
 * 수직 부하 추력 계산 [N]
 * @param {number} m  질량 [kg]
 * @param {number} a  가속 보정 계수 (1.0=없음 / 1.3=고속·충격) — 가속도(m/s²) 아님
 * F = 부하 무게 × 9.81 × 안전계수(1.5) × 가속 보정. UI 힌트와 일치 (검토 완료 2026).
 */
function calcForceVertical(m, a) {
  return m * 9.81 * 1.5 * a;
}

/* 나사×튜브OD 호환 매트릭스 — 3사 카탈로그 elbow 확정.
   출처: SMC AS 데이터시트(AS-F)·CKD SC3W 사양·Festo GRLA 카탈로그 2026 대조 (elbow 확정).
   인라인 항목은 근사(제조사 카탈로그로 확인). speed-controller.html 과 동일 유지. */
const SC_DATA = {
  smc: { name:'SMC', country:'🇯🇵', series:'AS 시리즈', url:'https://www.smcworld.com',
    models:[
      {model:'AS1201F',    mount:'elbow', thread:'M5',   ods:[4,6]},
      {model:'AS2201F-01', mount:'elbow', thread:'R1/8', ods:[4,6,8,10]},
      {model:'AS3201F-02', mount:'elbow', thread:'R1/4', ods:[6,8,10,12]},
      {model:'AS3201F-03', mount:'elbow', thread:'R3/8', ods:[6,8,10,12]},
      {model:'AS4201F-04', mount:'elbow', thread:'R1/2', ods:[10,12,16]},
      {model:'AS2052F(인라인)', mount:'inline', thread:null, ods:[6,8,10]}, // 인라인 근사
    ]},
  festo: { name:'Festo', country:'🇩🇪', series:'GRLA 시리즈', url:'https://www.festo.com',
    models:[
      {model:'GRLA-M5',  mount:'elbow', thread:'M5',   ods:[4,6]},
      {model:'GRLA-1/8', mount:'elbow', thread:'R1/8', ods:[4,6,8]},
      {model:'GRLA-1/4', mount:'elbow', thread:'R1/4', ods:[6,8,10]},
      {model:'GRLA-3/8', mount:'elbow', thread:'R3/8', ods:[8,10,12]},
      {model:'GRLA-1/2', mount:'elbow', thread:'R1/2', ods:[10,12]},
      {model:'GRLA 인라인(QS-QS)', mount:'inline', thread:null, ods:[4,6,8,10,12]}, // 인라인 근사
    ]},
  ckd: { name:'CKD', country:'🇯🇵', series:'SC3W 시리즈', url:'https://www.ckd.co.jp',
    models:[
      {model:'SC3W-M5', mount:'elbow', thread:'M5',   ods:[4,6]},
      {model:'SC3W-6',  mount:'elbow', thread:'R1/8', ods:[4,6,8]},
      {model:'SC3W-8',  mount:'elbow', thread:'R1/4', ods:[6,8,10]},
      {model:'SC3W-10', mount:'elbow', thread:'R3/8', ods:[6,8,10,12]},
      {model:'SC3W-15', mount:'elbow', thread:'R1/2', ods:[10,12]},
      {model:'SC1 인라인', mount:'inline', thread:null, ods:[4,6,8,10,12]}, // 인라인 근사
    ]},
};

/* ══════════════════════════════════════════════════════════════
   선정 파이프라인 — speed-controller.html runCalc 무손실 사본
   speed-controller.html은 이 모듈을 로드하지 않는 병렬 사본이므로,
   html runCalc 를 고치면 여기도 동일 유지할 것.
   입력 계약 input = { mount:'elbow'|'inline', od, thread, makers:{smc,festo,ckd} }
   ══════════════════════════════════════════════════════════════ */
function computeSC(input) {
  const { mount, od, thread, makers } = input;
  const activeMakers = Object.keys(makers).filter(function (k) { return makers[k]; });
  const results = [], excluded = [];
  activeMakers.forEach(function (key) {
    const mk = SC_DATA[key];
    if (!mk) return;
    const matches = mk.models.filter(function (m) {
      if (m.mount !== mount) return false;
      if (m.ods.indexOf(od) === -1) return false;
      if (mount === 'elbow' && m.thread !== thread) return false;
      return true;
    });
    if (matches.length === 0) {
      excluded.push({ makerKey: key, name: mk.name, country: mk.country });
    } else {
      matches.forEach(function (m) {
        results.push({ makerKey: key, name: mk.name, country: mk.country, series: mk.series, url: mk.url,
          model: m.model, mount: m.mount, thread: m.thread, ods: m.ods });
      });
    }
  });
  return { results, excluded, recommended: results.length ? results[0] : null };
}

module.exports = { calcRefFlow, recommendBore, calcForceHorizontal, calcForceVertical,
                   computeSC, BORE_TABLE_SC, STD_BORES_SC, SC_DATA };
