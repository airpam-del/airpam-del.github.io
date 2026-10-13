'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 로타리 액추에이터(베인형) 선정 — 순수 함수 (DOM 비의존)
   출처: rotary-actuator.html 무손실 추출 (계산식 불변). html은 이 모듈을
   로드하지 않는 병렬 사본이므로, html computeRA 를 고치면 여기도 동일 유지할 것.
   등급: 베타(beta). 허용 운동에너지·허용 하중은 SMC CRB2 카탈로그 실측(정확)이나,
     작동(유효) 토크는 압력별 "토크 선도(그래프)"로만 제공되어 수치 선정에서 제외하고
     필요 토크를 계산·표기 + 카탈로그 선도 확인으로 안내한다(값 지어내지 않음).
   ────────────────────────────────────────────────────────────────
   선정 개념(SMC 로타리 선정 절차):
     ① 부하 관성 I 산출 → ② 각속도 ω = 2θ/t (θ[rad], t[s]; 평균의 2배=종단)
     ③ 운동에너지 E = ½·I·ω²  ≤  허용 운동에너지(모델별, 싱글/더블 베인)  ← 핵심 한계
     ④ 허용 래디얼/스러스트 하중 이내
     ⑤ 필요 토크 = 부하토크 × 안전계수(저항부하 3~5) — 작동토크는 카탈로그 선도로 확인
     ⑥ 공기 소비량(옵션, 별도 계산기 연계)
   ────────────────────────────────────────────────────────────────
   데이터 출처: SMC Vane Type Rotary Actuator Series CRB2 카탈로그(CAT.ES20-159).
     허용 운동에너지(J, 싱글 S/더블 D) · 허용 래디얼/스러스트 하중(N) · 작동압 범위 실측 전재(2026).
   공식 검증: E=½Iω², ω=2θ/t 는 표준 역학. 허용 KE는 카탈로그 값과 직접 비교.
   ══════════════════════════════════════════════════════════════ */

const DEG2RAD = Math.PI / 180;

/* SMC CRB2 (베인형). keS/keD=허용 운동에너지[J] 싱글/더블, radial/thrust=허용하중[N] */
const RA_MODELS = [
  { size:'CRB2BW10', mm:10, keS:0.00015, keD:0.0003,  radial:15, thrust:10, pMin:0.15, pMax:1.0 },
  { size:'CRB2BW15', mm:15, keS:0.001,   keD:0.0012,  radial:15, thrust:10, pMin:0.15, pMax:1.0 },
  { size:'CRB2BW20', mm:20, keS:0.003,   keD:0.0033,  radial:25, thrust:20, pMin:0.15, pMax:1.0 },
  { size:'CRB2BW30', mm:30, keS:0.02,    keD:0.02,    radial:30, thrust:25, pMin:0.15, pMax:1.0 },
  { size:'CRB2BW40', mm:40, keS:0.04,    keD:0.04,    radial:60, thrust:40, pMin:0.15, pMax:1.0 },
];

/* 관성 모멘트 헬퍼 I[kg·m²] — 형상별. 길이 입력은 mm, 질량 kg. */
function raInertia(shape, p) {
  const m = Math.max(0, +p.mass || 0);
  const r = Math.max(0, (+p.radiusMm || 0)) / 1000;   // 반경[m]
  const L = Math.max(0, (+p.lengthMm || 0)) / 1000;   // 길이[m]
  const a = Math.max(0, (+p.aMm || 0)) / 1000, b = Math.max(0, (+p.bMm || 0)) / 1000;
  switch (shape) {
    case 'disc':    return 0.5 * m * r * r;                 // 원판/원기둥(중심축)
    case 'point':   return m * r * r;                        // 점질량(회전중심서 r)
    case 'rodEnd':  return (1 / 3) * m * L * L;              // 봉/암(끝단 축)
    case 'plate':   return (1 / 12) * m * (a * a + b * b);   // 사각판(중심 수직축)
    default:        return 0;
  }
}

/* ──────────────────────────────────────────────────────────────
   입력 계약 input = {
     inertia,          // 부하 관성 I [kg·m²]  (헬퍼 raInertia 로 산출 가능)
     angleDeg,         // 회전 각도 θ [deg]
     timeSec,          // 회전 시간 t [s]
     vane,             // 'single' | 'double'
     loadTorque,       // (옵션) 부하 토크(마찰·중력 등) [N·m]
     safety,           // 필요 토크 안전계수 (기본 5, SMC 저항부하 3~5)
     radialLoad,       // (옵션) 축 래디얼 하중 [N]
     thrustLoad,       // (옵션) 축 스러스트 하중 [N]
   }
   ────────────────────────────────────────────────────────────── */
function computeRA(input) {
  const I = Math.max(0, +input.inertia || 0);
  const angleDeg = Math.max(0, +input.angleDeg || 0);
  const t = Math.max(0, +input.timeSec || 0);
  const vane = input.vane === 'double' ? 'double' : 'single';
  const loadTorque = Math.max(0, +input.loadTorque || 0);
  const SF = (input.safety != null && +input.safety > 0) ? +input.safety : 5;
  const radial = Math.max(0, +input.radialLoad || 0);
  const thrust = Math.max(0, +input.thrustLoad || 0);

  const theta = angleDeg * DEG2RAD;
  const omega = t > 0 ? (2 * theta / t) : 0;        // 종단 각속도 [rad/s]
  const E = 0.5 * I * omega * omega;                // 운동에너지 [J]
  const requiredTorque = loadTorque > 0 ? loadTorque * SF : 0;

  const results = RA_MODELS.map(m => {
    const keAllow = vane === 'double' ? m.keD : m.keS;
    const okKE = E <= keAllow;
    const okRadial = radial <= 0 ? true : radial <= m.radial;
    const okThrust = thrust <= 0 ? true : thrust <= m.thrust;
    const ok = okKE && okRadial && okThrust;
    const coreOk = okKE;                              // KE는 되는데 하중만 초과 → warn
    const status = ok ? 'ok' : (coreOk ? 'warn' : 'bad');
    return { ...m, keAllow, vane, okKE, okRadial, okThrust, status,
             keMargin: keAllow > 0 ? E / keAllow : Infinity };
  });

  const recommended = results.find(r => r.status === 'ok') || null;

  const notes = [];
  if (I <= 0) notes.push('부하 관성 모멘트를 입력하세요(관성 도우미 이용 가능).');
  if (t <= 0 || angleDeg <= 0) notes.push('회전 각도와 회전 시간을 입력하세요.');
  notes.push('작동(유효) 토크는 SMC 카탈로그에 압력별 "토크 선도(그래프)"로 제공됩니다. 위 필요 토크를 충족하는지 선정 모델의 토크 선도로 반드시 확인하세요(본 계산기는 토크를 수치 비교하지 않습니다).');
  if (E > 0.04) notes.push('운동에너지가 CRB2 최대 허용(0.04J)을 초과합니다. 외부 스토퍼·쇼크 업소버 병용 또는 랙&피니언형(MSQ/CRA)·저속형(CRQ2/CRB1)을 검토하세요.');

  return { omega, theta, E, requiredTorque, SF, vane, results, recommended, notes };
}

module.exports = { computeRA, raInertia, RA_MODELS, DEG2RAD };
