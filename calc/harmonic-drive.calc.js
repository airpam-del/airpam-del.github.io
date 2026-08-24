'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 하모닉 드라이브 계산 — 순수 함수 (DOM 비의존)
   출처: harmonic-drive.html 무손실 추출 (계산식 불변)
   ══════════════════════════════════════════════════════════════ */

/**
 * 감속비별 정격 토크 취득
 * @param {object} m      HD_MODELS 항목
 * @param {number} ratio  선택 감속비
 */
function getRatedTorque(m, ratio) {
  if (!m.rr.includes(ratio)) return null;
  if (m.tr) return m.tr[ratio] !== undefined ? m.tr[ratio] : null;
  const r0 = m.rr[0], r1 = m.rr[m.rr.length - 1];
  if (r0 === r1) return m.trMin;
  const t = (ratio - r0) / (r1 - r0);
  return Math.round((m.trMin + (m.trMax - m.trMin) * t) * 10) / 10;
}

/**
 * 하모닉 드라이브 단일 모델 판정
 * @param {object} m       HD_MODELS 항목
 * @param {number} ratio   선택 감속비
 * @param {number} tCont   연속 토크 [N·m]
 * @param {number} tPeak   피크 토크 [N·m]
 * @param {number} nInput  입력 rpm
 * @param {number} lh      요구 수명 [h]
 */
function judgeHD(m, ratio, tCont, tPeak, nInput, lh) {
  const ratedTorque = getRatedTorque(m, ratio);
  if (ratedTorque === null) return null;

  const peakApprox = !m.mp;
  const peakTorque = m.mp ? m.mp[ratio] : Math.round(ratedTorque * 3 * 10) / 10;
  const rpTorque   = m.rp ? m.rp[ratio] : null;

  const torqueOk    = tCont <= ratedTorque;
  const ratchetRisk = tPeak > peakTorque;
  const accelOver   = rpTorque !== null && !ratchetRisk && tPeak > rpTorque;
  const rpmOk       = nInput <= m.mrpm;

  // lifeH ≈ (T_rated / T_cont)^3 × l10 × (2000 / nInput)
  const lifeH = Math.round(
    Math.pow(ratedTorque / tCont, 3) * (m.l10 || 10000) * (2000 / nInput)
  );
  const lifeGrade = lifeH >= lh ? 'ok' : lifeH >= lh * 0.8 ? 'warn' : 'bad';

  let overall;
  if (!torqueOk || !rpmOk)       overall = 'bad';
  else if (ratchetRisk)           overall = 'bad';
  else if (lifeGrade === 'bad')   overall = 'bad';
  else if (accelOver || lifeGrade === 'warn') overall = 'warn';
  else                            overall = 'ok';

  return { ratedTorque, peakTorque, peakApprox, rpTorque, accelOver,
           torqueOk, rpmOk, ratchetRisk, lifeH, lifeGrade, overall };
}

const HD_MODELS = [
  /* HDS 데이터 2026-07 카탈로그 전면 교체 (harmonicdrive.net CSF-2UH/SHF-2UH/CSF-2XH 정격표):
     tr = 감속비별 정격토크(2000rpm), rp = 반복 허용 피크(기동·정지), mp = 순간최대허용토크(래칫팅 한계) [N·m]
     구 데이터는 정격이 실제의 1.6~4배로 부풀려져 있었고 감속비 범위도 실제와 달랐음.
     mrpm은 그리스 윤활 기준 최대 입력 회전수. l10: CSF/SHF 정격수명 7,000h (HDS 규정) */
  // HDS CSF (솔리드 샤프트, 컵형)
  {mk:'HDS',mn:'Harmonic Drive Systems',sr:'CSF',sz:8, sh:'solid', rr:[30,50,100],
   tr:{30:0.9,50:1.8,100:2.4}, rp:{30:1.8,50:3.3,100:4.8}, mp:{30:3.3,50:6.6,100:9},
   mrpm:8500,prec:1.0,eff:78,l10:7000,brand:'original'}, // TODO: CSF-8/11 최대입력rpm 미니어처 카탈로그 확인
  {mk:'HDS',mn:'Harmonic Drive Systems',sr:'CSF',sz:11,sh:'solid', rr:[30,50,100],
   tr:{30:2.2,50:3.5,100:5}, rp:{30:4.5,50:8.3,100:11}, mp:{30:8.5,50:17,100:25},
   mrpm:7300,prec:1.0,eff:80,l10:7000,brand:'original'},
  {mk:'HDS',mn:'Harmonic Drive Systems',sr:'CSF',sz:14,sh:'solid', rr:[30,50,80,100],
   tr:{30:4,50:5.4,80:7.8,100:7.8}, rp:{30:9,50:18,80:23,100:28}, mp:{30:17,50:35,80:47,100:54},
   mrpm:8500,prec:1.0,eff:82,l10:7000,brand:'original'},
  {mk:'HDS',mn:'Harmonic Drive Systems',sr:'CSF',sz:17,sh:'solid', rr:[30,50,80,100,120],
   tr:{30:8.8,50:16,80:22,100:24,120:24}, rp:{30:16,50:34,80:43,100:54,120:54}, mp:{30:30,50:70,80:87,100:108,120:86},
   mrpm:7300,prec:1.0,eff:82,l10:7000,brand:'original'},
  {mk:'HDS',mn:'Harmonic Drive Systems',sr:'CSF',sz:20,sh:'solid', rr:[30,50,80,100,120,160],
   tr:{30:15,50:25,80:34,100:40,120:40,160:40}, rp:{30:27,50:56,80:74,100:82,120:87,160:92}, mp:{30:50,50:98,80:127,100:147,120:147,160:147},
   mrpm:6500,prec:1.0,eff:83,l10:7000,brand:'original'},
  {mk:'HDS',mn:'Harmonic Drive Systems',sr:'CSF',sz:25,sh:'solid', rr:[30,50,80,100,120,160],
   tr:{30:27,50:39,80:63,100:67,120:67,160:67}, rp:{30:50,50:98,80:137,100:157,120:167,160:176}, mp:{30:95,50:186,80:255,100:284,120:304,160:314},
   mrpm:5600,prec:1.0,eff:84,l10:7000,brand:'original'},
  {mk:'HDS',mn:'Harmonic Drive Systems',sr:'CSF',sz:32,sh:'solid', rr:[30,50,80,100,120,160],
   tr:{30:54,50:76,80:118,100:137,120:137,160:137}, rp:{30:100,50:216,80:304,100:333,120:353,160:372}, mp:{30:200,50:382,80:568,100:647,120:686,160:686},
   mrpm:4800,prec:1.0,eff:84,l10:7000,brand:'original'},
  {mk:'HDS',mn:'Harmonic Drive Systems',sr:'CSF',sz:40,sh:'solid', rr:[50,80,100,120,160],
   tr:{50:137,80:206,100:265,120:294,160:294}, rp:{50:402,80:519,100:568,120:617,160:647}, mp:{50:686,80:980,100:1080,120:1180,160:1180},
   mrpm:4000,prec:1.0,eff:85,l10:7000,brand:'original'},
  {mk:'HDS',mn:'Harmonic Drive Systems',sr:'CSF',sz:50,sh:'solid', rr:[50,80,100,120,160],
   tr:{50:245,80:372,100:470,120:529,160:529}, rp:{50:715,80:941,100:980,120:1080,160:1180}, mp:{50:1430,80:1860,100:2060,120:2060,160:2450},
   mrpm:3500,prec:1.0,eff:85,l10:7000,brand:'original'},
  // HDS SHF (중공 샤프트, 실크햇형) — 정격표는 CSF와 동일 (SHF-2UH 카탈로그 확인)
  {mk:'HDS',mn:'Harmonic Drive Systems',sr:'SHF',sz:14,sh:'hollow',rr:[50,80,100],
   tr:{50:5.4,80:7.8,100:7.8}, rp:{50:18,80:23,100:28}, mp:{50:35,80:47,100:54},
   mrpm:8500,prec:1.0,eff:81,l10:7000,brand:'original'},
  {mk:'HDS',mn:'Harmonic Drive Systems',sr:'SHF',sz:17,sh:'hollow',rr:[50,80,100,120],
   tr:{50:16,80:22,100:24,120:24}, rp:{50:34,80:43,100:54,120:54}, mp:{50:70,80:87,100:108,120:86},
   mrpm:7300,prec:1.0,eff:82,l10:7000,brand:'original'},
  {mk:'HDS',mn:'Harmonic Drive Systems',sr:'SHF',sz:20,sh:'hollow',rr:[50,80,100,120,160],
   tr:{50:25,80:34,100:40,120:40,160:40}, rp:{50:56,80:74,100:82,120:87,160:92}, mp:{50:98,80:127,100:147,120:147,160:147},
   mrpm:6500,prec:1.0,eff:82,l10:7000,brand:'original'},
  {mk:'HDS',mn:'Harmonic Drive Systems',sr:'SHF',sz:25,sh:'hollow',rr:[50,80,100,120,160],
   tr:{50:39,80:63,100:67,120:67,160:67}, rp:{50:98,80:137,100:157,120:167,160:176}, mp:{50:186,80:255,100:284,120:304,160:314},
   mrpm:5600,prec:1.0,eff:83,l10:7000,brand:'original'},
  {mk:'HDS',mn:'Harmonic Drive Systems',sr:'SHF',sz:32,sh:'hollow',rr:[50,80,100,120,160],
   tr:{50:76,80:118,100:137,120:137,160:137}, rp:{50:216,80:304,100:333,120:353,160:372}, mp:{50:382,80:568,100:647,120:686,160:686},
   mrpm:4800,prec:1.0,eff:84,l10:7000,brand:'original'},
  {mk:'HDS',mn:'Harmonic Drive Systems',sr:'SHF',sz:40,sh:'hollow',rr:[50,80,100,120,160],
   tr:{50:137,80:206,100:265,120:294,160:294}, rp:{50:402,80:519,100:568,120:617,160:647}, mp:{50:686,80:980,100:1080,120:1180,160:1180},
   mrpm:4000,prec:1.0,eff:85,l10:7000,brand:'original'},
  {mk:'HDS',mn:'Harmonic Drive Systems',sr:'SHF',sz:50,sh:'hollow',rr:[50,80,100,120,160],
   tr:{50:245,80:372,100:470,120:529,160:529}, rp:{50:715,80:941,100:980,120:1080,160:1180}, mp:{50:1430,80:1860,100:2060,120:2060,160:2450},
   mrpm:3500,prec:1.0,eff:85,l10:7000,brand:'original'},
  /* Leaderdrive(綠的, 중국 1위) — 2026-07 leaderdrive.com 공표 정격표 기준 (Leadshine 대체).
     LCS=표준 컵형(솔리드), LHS=표준 실크햇형(중공). HDS CSF 호환 사양 체계.
     주의: LCS/LHS-50 감속비 50의 정격 122 N·m은 메이커 페이지 기재값 그대로 (HDS 동급 245 대비
     낮음 — 오기 가능성 있으나 보수적 방향이라 기재값 유지, 카탈로그 PDF 재확인 TODO).
     prec(히스테리시스)·eff·수명은 카탈로그 명시값 미확인 — 보수 추정(TODO) */
  // Leaderdrive LCS (솔리드 샤프트, 컵형)
  {mk:'LD', mn:'Leaderdrive',           sr:'LCS',sz:14,sh:'solid', rr:[30,50,80,100],
   tr:{30:4,50:5.4,80:7.8,100:7.8}, rp:{30:9,50:18,80:23,100:28}, mp:{30:17,50:35,80:47,100:54},
   mrpm:8500,prec:1.5,eff:80,l10:7000,brand:'compatible'},
  {mk:'LD', mn:'Leaderdrive',           sr:'LCS',sz:17,sh:'solid', rr:[30,50,80,100,120],
   tr:{30:8.8,50:16,80:22,100:24,120:24}, rp:{30:16,50:34,80:43,100:54,120:54}, mp:{30:30,50:70,80:87,100:108,120:86},
   mrpm:7300,prec:1.5,eff:80,l10:7000,brand:'compatible'},
  {mk:'LD', mn:'Leaderdrive',           sr:'LCS',sz:20,sh:'solid', rr:[30,50,80,100,120,160],
   tr:{30:15,50:25,80:34,100:40,120:40,160:40}, rp:{30:26,50:56,80:74,100:82,120:87,160:92}, mp:{30:50,50:98,80:127,100:147,120:147,160:147},
   mrpm:6500,prec:1.5,eff:81,l10:7000,brand:'compatible'},
  {mk:'LD', mn:'Leaderdrive',           sr:'LCS',sz:25,sh:'solid', rr:[30,50,80,100,120,160],
   tr:{30:27,50:39,80:63,100:67,120:67,160:67}, rp:{30:50,50:98,80:137,100:157,120:167,160:176}, mp:{30:95,50:186,80:255,100:284,120:304,160:314},
   mrpm:5600,prec:1.5,eff:82,l10:7000,brand:'compatible'},
  {mk:'LD', mn:'Leaderdrive',           sr:'LCS',sz:32,sh:'solid', rr:[30,50,80,100,120,160],
   tr:{30:54,50:76,80:118,100:137,120:137,160:137}, rp:{30:100,50:216,80:304,100:333,120:353,160:372}, mp:{30:200,50:382,80:568,100:647,120:686,160:686},
   mrpm:4800,prec:1.5,eff:82,l10:7000,brand:'compatible'},
  {mk:'LD', mn:'Leaderdrive',           sr:'LCS',sz:40,sh:'solid', rr:[50,80,100,120,160],
   tr:{50:137,80:206,100:265,120:294,160:294}, rp:{50:402,80:519,100:568,120:617,160:647}, mp:{50:686,80:980,100:1080,120:1180,160:1180},
   mrpm:4000,prec:1.5,eff:83,l10:7000,brand:'compatible'},
  {mk:'LD', mn:'Leaderdrive',           sr:'LCS',sz:50,sh:'solid', rr:[50,80,100,120,160],
   tr:{50:122,80:372,100:470,120:529,160:529}, rp:{50:715,80:941,100:980,120:1080,160:1180}, mp:{50:1430,80:1860,100:2060,120:2060,160:2450},
   mrpm:3500,prec:1.5,eff:83,l10:7000,brand:'compatible'},
  // Leaderdrive LHS (중공 샤프트, 실크햇형) — 일부 셀은 LCS(컵형)와 교차 검증해 보수값 채택
  {mk:'LD', mn:'Leaderdrive',           sr:'LHS',sz:14,sh:'hollow',rr:[30,50,80,100],
   tr:{30:4,50:5.4,80:7.8,100:7.8}, rp:{30:9,50:18,80:23,100:28}, mp:{30:17,50:35,80:47,100:54},
   mrpm:8500,prec:1.5,eff:80,l10:7000,brand:'compatible'},
  {mk:'LD', mn:'Leaderdrive',           sr:'LHS',sz:17,sh:'hollow',rr:[30,50,80,100,120],
   tr:{30:8.8,50:16,80:22,100:24,120:24}, rp:{30:16,50:34,80:43,100:54,120:54}, mp:{30:30,50:70,80:87,100:108,120:86},
   mrpm:7300,prec:1.5,eff:80,l10:7000,brand:'compatible'},
  {mk:'LD', mn:'Leaderdrive',           sr:'LHS',sz:20,sh:'hollow',rr:[30,50,80,100,120,160],
   tr:{30:15,50:25,80:34,100:40,120:40,160:40}, rp:{30:27,50:56,80:74,100:82,120:87,160:92}, mp:{30:50,50:98,80:127,100:147,120:147,160:147},
   mrpm:6500,prec:1.5,eff:81,l10:7000,brand:'compatible'},
  {mk:'LD', mn:'Leaderdrive',           sr:'LHS',sz:25,sh:'hollow',rr:[30,50,80,100,120,160],
   tr:{30:27,50:39,80:63,100:67,120:67,160:67}, rp:{30:50,50:98,80:137,100:157,120:167,160:176}, mp:{30:95,50:186,80:255,100:284,120:304,160:314},
   mrpm:5600,prec:1.5,eff:82,l10:7000,brand:'compatible'},
  {mk:'LD', mn:'Leaderdrive',           sr:'LHS',sz:32,sh:'hollow',rr:[30,50,80,100,120,160],
   tr:{30:54,50:76,80:118,100:137,120:137,160:137}, rp:{30:100,50:216,80:304,100:333,120:353,160:372}, mp:{30:200,50:382,80:568,100:647,120:686,160:686},
   mrpm:4800,prec:1.5,eff:82,l10:7000,brand:'compatible'},
  {mk:'LD', mn:'Leaderdrive',           sr:'LHS',sz:40,sh:'hollow',rr:[50,80,100,120,160],
   tr:{50:137,80:206,100:265,120:294,160:294}, rp:{50:402,80:519,100:568,120:617,160:647}, mp:{50:686,80:980,100:1080,120:1180,160:1180},
   mrpm:4000,prec:1.5,eff:83,l10:7000,brand:'compatible'},
  {mk:'LD', mn:'Leaderdrive',           sr:'LHS',sz:50,sh:'hollow',rr:[50,80,100,120,160],
   tr:{50:122,80:372,100:470,120:529,160:529}, rp:{50:715,80:941,100:980,120:1080,160:1180}, mp:{50:1430,80:1860,100:2060,120:2060,160:2450},
   mrpm:3500,prec:1.5,eff:83,l10:7000,brand:'compatible'},
  /* Laifual(来福, 중국 2위) — 2026-07 laifualdrive.com 공표 정격표 기준 (구 근사값 전면 교체).
     FSS=표준 컵형 솔리드(구 LSS), FHT=중공 실크햇형(구 LHT). HDS CSF 호환 사양 체계.
     prec·eff·수명은 카탈로그 명시값 미확인 — 보수 추정(TODO) */
  // Laifual FSS (솔리드 샤프트, 컵형)
  {mk:'LF', mn:'Laifual Drive',         sr:'FSS',sz:8, sh:'solid', rr:[50,100],
   tr:{50:1.8,100:2.4}, rp:{50:3.3,100:4.8}, mp:{50:6.6,100:9},
   mrpm:8500,prec:1.5,eff:78,l10:7000,brand:'compatible'},
  {mk:'LF', mn:'Laifual Drive',         sr:'FSS',sz:11,sh:'solid', rr:[50,100],
   tr:{50:3.5,100:5}, rp:{50:8.3,100:11}, mp:{50:17,100:25},
   mrpm:8500,prec:1.5,eff:79,l10:7000,brand:'compatible'},
  {mk:'LF', mn:'Laifual Drive',         sr:'FSS',sz:14,sh:'solid', rr:[50,80,100],
   tr:{50:5.4,80:7.8,100:7.8}, rp:{50:18,80:23,100:28}, mp:{50:35,80:47,100:54},
   mrpm:8500,prec:1.5,eff:80,l10:7000,brand:'compatible'},
  {mk:'LF', mn:'Laifual Drive',         sr:'FSS',sz:17,sh:'solid', rr:[50,80,100,120],
   tr:{50:16,80:22,100:24,120:24}, rp:{50:34,80:43,100:54,120:54}, mp:{50:70,80:87,100:108,120:86},
   mrpm:7300,prec:1.5,eff:80,l10:7000,brand:'compatible'},
  {mk:'LF', mn:'Laifual Drive',         sr:'FSS',sz:20,sh:'solid', rr:[50,80,100,120,160],
   tr:{50:25,80:34,100:40,120:40,160:40}, rp:{50:56,80:74,100:82,120:87,160:92}, mp:{50:98,80:127,100:147,120:147,160:147},
   mrpm:6500,prec:1.5,eff:81,l10:7000,brand:'compatible'},
  {mk:'LF', mn:'Laifual Drive',         sr:'FSS',sz:25,sh:'solid', rr:[50,80,100,120,160],
   tr:{50:39,80:63,100:67,120:67,160:67}, rp:{50:98,80:137,100:157,120:167,160:176}, mp:{50:186,80:255,100:284,120:304,160:314},
   mrpm:5600,prec:1.5,eff:82,l10:7000,brand:'compatible'},
  {mk:'LF', mn:'Laifual Drive',         sr:'FSS',sz:32,sh:'solid', rr:[50,80,100,120,160],
   tr:{50:76,80:118,100:137,120:137,160:137}, rp:{50:216,80:304,100:333,120:353,160:372}, mp:{50:382,80:568,100:647,120:686,160:686},
   mrpm:4800,prec:1.5,eff:82,l10:7000,brand:'compatible'},
  {mk:'LF', mn:'Laifual Drive',         sr:'FSS',sz:40,sh:'solid', rr:[50,80,100,120,160],
   tr:{50:137,80:206,100:265,120:294,160:294}, rp:{50:402,80:519,100:568,120:617,160:647}, mp:{50:686,80:980,100:1080,120:1180,160:1180},
   mrpm:4000,prec:1.5,eff:83,l10:7000,brand:'compatible'},
  // Laifual FHT (중공 샤프트, 실크햇형)
  {mk:'LF', mn:'Laifual Drive',         sr:'FHT',sz:11,sh:'hollow',rr:[50],
   tr:{50:3.5}, rp:{50:8.3}, mp:{50:17},
   mrpm:8500,prec:1.5,eff:79,l10:7000,brand:'compatible'},
  {mk:'LF', mn:'Laifual Drive',         sr:'FHT',sz:14,sh:'hollow',rr:[50,80,100],
   tr:{50:5.4,80:7.8,100:7.8}, rp:{50:18,80:23,100:28}, mp:{50:35,80:47,100:54},
   mrpm:8500,prec:1.5,eff:80,l10:7000,brand:'compatible'},
  {mk:'LF', mn:'Laifual Drive',         sr:'FHT',sz:17,sh:'hollow',rr:[50,80,100,120],
   tr:{50:16,80:22,100:24,120:24}, rp:{50:34,80:43,100:54,120:54}, mp:{50:70,80:87,100:108,120:86},
   mrpm:7300,prec:1.5,eff:80,l10:7000,brand:'compatible'},
  {mk:'LF', mn:'Laifual Drive',         sr:'FHT',sz:20,sh:'hollow',rr:[50,80,100,120,160],
   tr:{50:25,80:34,100:40,120:40,160:40}, rp:{50:56,80:74,100:82,120:87,160:92}, mp:{50:98,80:127,100:147,120:147,160:147},
   mrpm:6500,prec:1.5,eff:81,l10:7000,brand:'compatible'},
  {mk:'LF', mn:'Laifual Drive',         sr:'FHT',sz:25,sh:'hollow',rr:[50,80,100,120,160],
   tr:{50:39,80:63,100:67,120:67,160:67}, rp:{50:98,80:137,100:157,120:167,160:176}, mp:{50:186,80:255,100:284,120:304,160:314},
   mrpm:5600,prec:1.5,eff:82,l10:7000,brand:'compatible'},
  {mk:'LF', mn:'Laifual Drive',         sr:'FHT',sz:32,sh:'hollow',rr:[50,80,100,120,160],
   tr:{50:76,80:118,100:137,120:137,160:137}, rp:{50:216,80:304,100:333,120:353,160:372}, mp:{50:382,80:568,100:647,120:686,160:686},
   mrpm:4800,prec:1.5,eff:82,l10:7000,brand:'compatible'},
  {mk:'LF', mn:'Laifual Drive',         sr:'FHT',sz:40,sh:'hollow',rr:[50,80,100,120,160],
   tr:{50:137,80:206,100:265,120:294,160:294}, rp:{50:402,80:519,100:568,120:617,160:647}, mp:{50:686,80:980,100:1080,120:1180,160:1180},
   mrpm:4000,prec:1.5,eff:83,l10:7000,brand:'compatible'},
];

/* ══════════════════════════════════════════════════════════════
   선정 파이프라인 — harmonic-drive.html runCalcAndGo 무손실 사본
   harmonic-drive.html은 이 모듈을 로드하지 않는 병렬 사본이므로,
   html runCalcAndGo 를 고치면 여기도 동일 유지할 것.
   입력 계약 input = { tCont, tPeak, nInput, ratio, lh, shaft:'solid'|'hollow'|'any',
                       precision, makers:{hds,leaderdrive,laifual} }
   ══════════════════════════════════════════════════════════════ */
function computeHD(input) {
  const { tCont, tPeak, nInput, ratio, lh, shaft, precision, makers } = input;
  const results = [];
  HD_MODELS.forEach(m => {
    if (m.mk === 'HDS' && !makers.hds) return;
    if (m.mk === 'LD'  && !makers.leaderdrive) return;
    if (m.mk === 'LF'  && !makers.laifual) return;
    if (shaft === 'solid'  && m.sh !== 'solid')  return;
    if (shaft === 'hollow' && m.sh !== 'hollow') return;
    if (m.prec > precision) return;
    if (!m.rr.includes(ratio)) return;
    const j = judgeHD(m, ratio, tCont, tPeak, nInput, lh);
    if (!j) return;
    results.push(Object.assign({ m }, j));
  });
  results.sort((a, b) => {
    const o = { ok: 0, warn: 1, bad: 2 };
    if (o[a.overall] !== o[b.overall]) return o[a.overall] - o[b.overall];
    return a.ratedTorque - b.ratedTorque;
  });
  return { results, recommended: results.length ? results[0] : null };
}

module.exports = { getRatedTorque, judgeHD, computeHD, HD_MODELS };
