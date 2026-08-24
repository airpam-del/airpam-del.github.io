'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 전동 그리퍼 계산 — 순수 함수 (DOM 비의존)
   출처: electric-gripper.html 무손실 추출 (계산식 불변)
   ══════════════════════════════════════════════════════════════ */

/**
 * 필요 파지력 계산 (×2: 양쪽 핑거 반력 합산)
 * @param {number} w  워크 무게 [g]
 */
function calcRequiredForce(w) {
  return (w / 1000) * 9.81 * 2;
}

/**
 * 전동 그리퍼 모델 판정
 * @param {object} m     모델 { forceMin, forceMax, stroke, comm:[], robots:[] }
 * @param {number} fRequired 필요 파지력 [N]
 * @param {number} width  워크피스 폭 [mm]
 * @param {string} comm   통신 방식 'dio' | 'iolink'
 * @param {string} robot  로봇 종류 'ur'|'doosan'|'kuka'|'fanuc'|'other'
 */
function judgeEGripper(m, fRequired, width, comm, robot) {
  if (fRequired > m.forceMax) return 'bad';
  const strokeOk   = m.stroke >= width;
  const commOk     = m.comm.indexOf(comm) !== -1;
  const robotOk    = m.robots.length === 0 || m.robots.indexOf(robot) !== -1;
  const forceInRange = fRequired >= m.forceMin;
  if (!strokeOk || !commOk || !robotOk || !forceInRange) return 'warn';
  return 'ok';
}

/* 출처: 각 메이커 전동그리퍼 카탈로그 — Schunk EGP(schunk.com). 완제품(EoAT) 필터링 방식.
   대표값 재확인 EGP40 파지력 35~140 N·스트로크 6mm/조 (확인일 2026-08). 타 메이커는 해당 사 카탈로그 기준. */
var MAKERS = {
  schunk: {
    name: 'Schunk', country: '🇩🇪',
    url: 'https://schunk.com',
    models: [
      /* EGP 시리즈 (범용 산업용) */
      {
        /* EGP 25-N-N-B 기준: 20~40N (Schunk 공식, 2026-07 검증). 12N은 스피드 버전(N-S-B) 값 */
        model:'EGP 25', series:'EGP 시리즈',
        forceMin:20, forceMax:40,  stroke:6,
        comm:['dio'],
        robots:[], robotLabel:'범용 (어댑터 필요)',
        note:'소형 워크피스 전용'
      },
      {
        /* EGP 40-N-N-B 기준: 35~140N (Schunk 공식, 2026-07 검증). 30N은 스피드 버전(N-S-B) 값 */
        model:'EGP 40', series:'EGP 시리즈',
        forceMin:35, forceMax:140, stroke:12,
        comm:['dio','iolink'],
        robots:[], robotLabel:'범용 (어댑터 필요)',
        note:''
      },
      {
        model:'EGP 50', series:'EGP 시리즈',
        forceMin:54, forceMax:215, stroke:16,
        comm:['dio','iolink'],
        robots:[], robotLabel:'범용 (어댑터 필요)',
        note:''
      },
      {
        model:'EGP 64', series:'EGP 시리즈',
        forceMin:75, forceMax:300, stroke:20,
        comm:['dio','iolink'],
        robots:[], robotLabel:'범용 (어댑터 필요)',
        note:''
      },
      /* Co-act EGP-C 시리즈 (협동로봇 인증형) */
      {
        /* 공식 변형 확인(2026-07): UR·Doosan·FANUC CR-7(FCR7)·Mitsubishi ASSISTA. KUKA 변형 근거 없음 */
        model:'Co-act EGP-C 40', series:'Co-act EGP-C 시리즈',
        forceMin:35, forceMax:140, stroke:12,
        comm:['dio'],
        robots:['ur','doosan','fanuc'], robotLabel:'UR·Doosan·FANUC CR·Mitsubishi 인증',
        note:'협동로봇 인증 취득'
      },
      {
        /* TODO: 대형(EGP-C 64 추정) 파지력 40~230N 카탈로그 미검증 — 확인 필요 */
        model:'Co-act EGP-C (대형)', series:'Co-act EGP-C 시리즈',
        forceMin:40, forceMax:230, stroke:20,
        comm:['dio'],
        robots:['ur','doosan','fanuc'], robotLabel:'UR·Doosan·FANUC CR·Mitsubishi 인증',
        note:'협동로봇 인증 취득'
      }
    ]
  },
  onrobot: {
    name: 'OnRobot', country: '🇩🇰',
    url: 'https://onrobot.com',
    models: [
      {
        model:'RG2', series:'RG 시리즈',
        forceMin:3,  forceMax:40,  stroke:110,
        comm:['iolink'],
        robots:['ur'], robotLabel:'Universal Robots 네이티브 호환',
        note:'Quick Changer 내장'
      },
      {
        model:'RG6', series:'RG 시리즈',
        forceMin:25, forceMax:120, stroke:160,
        comm:['iolink'],
        robots:['ur'], robotLabel:'Universal Robots 네이티브 호환',
        note:'Quick Changer 내장'
      }
    ]
  }
};

/* ══════════════════════════════════════════════════════════════
   선정 파이프라인 — electric-gripper.html renderResultCards 무손실 사본
   electric-gripper.html은 이 모듈을 로드하지 않는 병렬 사본이므로,
   html 로직을 고치면 여기도 동일 유지할 것.
   입력 계약 input = { weight[g], width, comm:'dio'|'iolink', robot, makers:{...} }
   ══════════════════════════════════════════════════════════════ */
function computeEG(input) {
  const { weight, width, comm, robot, makers } = input;
  const fRequired = calcRequiredForce(weight);
  const makerResults = [], allModels = [];
  Object.keys(MAKERS).forEach(key => {
    if (!makers[key]) return;
    const mk = MAKERS[key];
    let bestModel = null, bestStatus = 'bad';
    mk.models.forEach(m => {
      const status = judgeEGripper(m, fRequired, width, comm, robot);
      if (status === 'ok' && bestStatus !== 'ok') { bestModel = m; bestStatus = 'ok'; }
      else if (status === 'warn' && bestStatus === 'bad') { bestModel = m; bestStatus = 'warn'; }
      allModels.push({ makerKey: key, makerName: mk.name, model: m.model, status });
    });
    if (!bestModel) { bestModel = mk.models[0]; bestStatus = 'bad'; }
    makerResults.push({ makerKey: key, makerName: mk.name, bestModel, bestStatus });
  });
  return { fRequired, makerResults, allModels };
}

module.exports = { calcRequiredForce, judgeEGripper, computeEG, MAKERS };
