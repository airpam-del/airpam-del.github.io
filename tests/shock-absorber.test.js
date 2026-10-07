'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 쇼크 업소버 계산 테스트 — 순수 Node
   대상: ../calc/shock-absorber.calc.js (shock-absorber.html 무손실 사본)
   선정식: E=½mv²+Fwork·S, Me=2E/v², SMC RB 카탈로그 한계 5종 판정
   ══════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { computeSA, SA_MODELS, MASS_REF_SPEED, G } = require('../calc/shock-absorber.calc.js');

const near = (a, b, rel = 1e-6) => {
  if (a === b) return;
  const d = Math.abs(a - b), s = Math.max(Math.abs(a), Math.abs(b), 1);
  assert.ok(d / s <= rel, `expected ${a} ≈ ${b}`);
};
const md = (name) => SA_MODELS.find(m => m.model === name);

/* ── A) 카탈로그 선정 예제 재현 (공식·데이터 교차검증) ── */

// 예제 1: SMC 카탈로그 RB0604 선정 예 (m=1kg, v=0.5, F≈39.25N, 수평) → Me≈2.3kg
test('카탈로그: RB0604 예제 (m=1,v=0.5,F=39.25,수평) → E≈0.282, Me≈2.26, 추천 RB0604', () => {
  const r = computeSA({ mass:1, speed:0.5, driveForce:39.25, orientation:'horizontal', cyclesPerMin:10, count:1 });
  const rb = r.results.find(x => x.model === 'RB0604');
  near(rb.E1, 0.125, 1e-6);
  near(rb.E2, 39.25 * 0.004, 1e-9);
  near(rb.E, 0.125 + 0.157, 1e-6);
  near(rb.Me, 2 * rb.E / 0.25, 1e-9);
  assert.ok(rb.Me > 2.2 && rb.Me < 2.3, `Me=${rb.Me}`);  // 카탈로그 2.3
  assert.equal(rb.status, 'ok');
  assert.equal(r.recommended.model, 'RB0604');
});

// 예제 2: SMC 카탈로그 RB2015 선정 예 (m=50kg, v=0.3, F=630N, 수평) → Me≈260kg<400, 추천 RB2015
// (에너지만으론 RB1411도 통과하지만, 최대상당질량 한계가 저속에서 작은 모델을 걸러 RB2015 선정 — 카탈로그 재현)
test('카탈로그: RB2015 예제 (m=50,v=0.3,F=630,수평) → Me≈260, 추천 RB2015 (질량한계로 RB1411 탈락)', () => {
  const r = computeSA({ mass:50, speed:0.3, driveForce:630, orientation:'horizontal', cyclesPerMin:5, count:1 });
  const rb2015 = r.results.find(x => x.model === 'RB2015');
  near(rb2015.E, 2.25 + 630 * 0.015, 1e-6);          // 11.7 J
  assert.ok(rb2015.Me > 259 && rb2015.Me < 261, `Me=${rb2015.Me}`); // 카탈로그 260
  // RB1411 은 에너지는 되지만 최대상당질량 초과로 탈락해야 함
  const rb1411 = r.results.find(x => x.model === 'RB1411');
  assert.ok(rb1411.okEnergy, 'RB1411 에너지는 통과');
  assert.ok(!rb1411.okMass, 'RB1411 최대상당질량 초과로 탈락');
  assert.equal(r.recommended.model, 'RB2015');
});

// 예제 3: 수직 자유낙하(구동력 0, 중력일 포함) m=5kg, v=1.0, down → 추천 RB0806
test('수직하강 자유낙하 (m=5,v=1.0,F=0,down) → 중력일 반영, 추천 RB0806', () => {
  const r = computeSA({ mass:5, speed:1.0, driveForce:0, orientation:'down', cyclesPerMin:20, count:1 });
  const rb = r.results.find(x => x.model === 'RB0806');
  near(rb.E1, 2.5, 1e-9);
  near(rb.Fwork, 5 * G, 1e-9);                 // F=0 + mg
  near(rb.E2, 5 * G * 0.006, 1e-9);
  assert.equal(rb.status, 'ok');
  assert.equal(r.recommended.model, 'RB0806');
});

// 최대상당질량 환산 검산: RB2015 = 400kg (카탈로그 앵커)
test('최대상당질량 환산: RB2015 ≈ 400kg (카탈로그 앵커)', () => {
  const cap = 2 * md('RB2015').energy / (MASS_REF_SPEED * MASS_REF_SPEED);
  assert.ok(cap > 399 && cap < 401, `cap=${cap}`);
});

// 병렬 N개: 1개당 에너지/질량/구동력이 1/N 로 분담
test('병렬 2개: 1개당 흡수에너지가 단일의 절반', () => {
  const r1 = computeSA({ mass:10, speed:1.0, driveForce:200, orientation:'horizontal', cyclesPerMin:10, count:1 });
  const r2 = computeSA({ mass:10, speed:1.0, driveForce:200, orientation:'horizontal', cyclesPerMin:10, count:2 });
  const e1 = r1.results.find(x => x.model === 'RB1007').E;
  const e2 = r2.results.find(x => x.model === 'RB1007').E;
  near(e2, e1 / 2, 1e-9);
});

/* ── B) 불변식 — 시드 랜덤 200개 ── */
function makeRng(seed) { let s = seed >>> 0; return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; }; }
const rng = makeRng(20261007);
const pick = (a) => a[Math.floor(rng() * a.length)];
const ri = (lo, hi) => lo + rng() * (hi - lo);

test('불변식: 무작위 입력 200개', () => {
  let okSeen = 0, warnSeen = 0, badSeen = 0, recSeen = 0;
  for (let i = 0; i < 200; i++) {
    const input = {
      mass: Math.round(ri(0.5, 200) * 10) / 10,
      speed: pick([0.02, 0.1, 0.2, 0.3, 0.5, 0.8, 1.0, 2.0, 3.5, 6.0]),
      driveForce: Math.round(ri(0, 2500)),
      orientation: pick(['horizontal', 'down', 'up']),
      cyclesPerMin: pick([2, 5, 10, 20, 40, 60, 90]),
      count: pick([1, 1, 1, 2, 4]),
    };
    const r = computeSA(input);
    const ctx = `#${i} ${JSON.stringify(input)}`;
    const n = input.count, mu = input.mass / n, Fu = input.driveForce / n, w = mu * G, v = input.speed;

    for (const x of r.results) {
      // Fwork / Fthrust 방향식
      const expFwork = input.orientation === 'down' ? Fu + w : input.orientation === 'up' ? Fu - w : Fu;
      const expFthr  = input.orientation === 'down' ? Fu + w : Fu;
      near(x.Fwork, expFwork, 1e-9);
      near(x.Fthrust, expFthr, 1e-9);
      // E = max(0, ½ mu v² + Fwork·S) ; Me = 2E/v²
      const expE = Math.max(0, 0.5 * mu * v * v + expFwork * (x.stroke_mm / 1000));
      near(x.E, expE, 1e-9);
      near(x.Me, v > 0 ? 2 * expE / (v * v) : Infinity, 1e-9);
      // massCap = 2E_max/vRef²
      near(x.massCap, 2 * x.energy / (MASS_REF_SPEED * MASS_REF_SPEED), 1e-9);
      // 판정 ↔ 5조건
      const okSpeed = v >= x.vMin && v <= x.vMax;
      const okEnergy = expE <= x.energy;
      const okFreq = input.cyclesPerMin <= x.maxFreq;
      const okThrust = expFthr <= x.maxThrust;
      const okMass = x.Me <= x.massCap;
      const coreOk = okEnergy && okFreq && okThrust && okMass;
      const exp = (okSpeed && coreOk) ? 'ok' : coreOk ? 'warn' : 'bad';
      assert.equal(x.status, exp, `status — ${ctx} / ${x.model}`);
      // 유한성
      for (const k of ['E1', 'E2', 'E', 'Fwork', 'Fthrust', 'massCap']) assert.ok(Number.isFinite(x[k]), `${k} — ${ctx}`);
      if (x.status === 'ok') okSeen++; else if (x.status === 'warn') warnSeen++; else badSeen++;
    }
    // 추천 = status==='ok' 인 첫(가장 작은 에너지) 모델
    const firstOk = r.results.find(x => x.status === 'ok') || null;
    assert.equal(r.recommended, firstOk, `추천 — ${ctx}`);
    if (r.recommended) recSeen++;
  }
  assert.ok(okSeen > 0 && warnSeen > 0 && badSeen > 0, `분기 미관측 (ok=${okSeen} warn=${warnSeen} bad=${badSeen})`);
  assert.ok(recSeen > 20, `추천 케이스 부족: ${recSeen}`);
});
