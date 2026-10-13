'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 로타리 액추에이터 계산 테스트 — 순수 Node
   대상: ../calc/rotary-actuator.calc.js (rotary-actuator.html 무손실 사본)
   E=½Iω², ω=2θ/t, SMC CRB2 허용 운동에너지 기준 선정(beta)
   ══════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { computeRA, raInertia, RA_MODELS, DEG2RAD } = require('../calc/rotary-actuator.calc.js');

const near = (a, b, rel = 1e-9) => {
  if (a === b) return;
  const d = Math.abs(a - b), s = Math.max(Math.abs(a), Math.abs(b), 1);
  assert.ok(d / s <= rel, `expected ${a} ≈ ${b}`);
};
const get = (r, size) => r.results.find(x => x.size === size);

/* ── A) 관성 헬퍼 ── */
test('관성 헬퍼: 원판 I=½mr², 점질량 mr², 봉끝 ⅓mL²', () => {
  near(raInertia('disc',  { mass:0.1, radiusMm:50 }), 0.5 * 0.1 * 0.05 * 0.05, 1e-12);
  near(raInertia('point', { mass:0.2, radiusMm:100 }), 0.2 * 0.1 * 0.1, 1e-12);
  near(raInertia('rodEnd',{ mass:0.3, lengthMm:200 }), (1/3) * 0.3 * 0.2 * 0.2, 1e-12);
  near(raInertia('plate', { mass:0.5, aMm:100, bMm:60 }), (1/12) * 0.5 * (0.1*0.1 + 0.06*0.06), 1e-12);
});

/* ── B) ω·E 공식 + 모델 선정 ── */
test('원판 0.1kg·r50 / 90°·1s / 싱글 → ω=π, E≈6.17e-4 J, 추천 CRB2BW15', () => {
  const I = raInertia('disc', { mass:0.1, radiusMm:50 });     // 0.000125
  const r = computeRA({ inertia:I, angleDeg:90, timeSec:1, vane:'single' });
  near(r.omega, 2 * (90 * DEG2RAD) / 1, 1e-12);                // = π
  near(r.omega, Math.PI, 1e-9);
  near(r.E, 0.5 * I * Math.PI * Math.PI, 1e-12);
  assert.ok(r.E > 6.1e-4 && r.E < 6.3e-4, `E=${r.E}`);
  assert.equal(get(r, 'CRB2BW10').status, 'bad');             // 0.00015 < E
  assert.equal(get(r, 'CRB2BW15').status, 'ok');              // 0.001 ≥ E
  assert.equal(r.recommended.size, 'CRB2BW15');
});

/* ── C) 더블 베인은 허용 KE가 더 큼(사이즈10·15·20) ── */
test('더블 베인: 허용 KE가 싱글 이상', () => {
  for (const m of RA_MODELS) assert.ok(m.keD >= m.keS, `${m.size} D≥S`);
  const I = 0.0005;
  const s = computeRA({ inertia:I, angleDeg:90, timeSec:1, vane:'single' });
  const d = computeRA({ inertia:I, angleDeg:90, timeSec:1, vane:'double' });
  assert.equal(get(s, 'CRB2BW10').keAllow, RA_MODELS[0].keS);
  assert.equal(get(d, 'CRB2BW10').keAllow, RA_MODELS[0].keD);
});

/* ── D) 필요 토크 = 부하토크 × 안전계수 ── */
test('필요 토크 = 부하토크 × SF(기본 5)', () => {
  const r = computeRA({ inertia:0.0001, angleDeg:90, timeSec:1, vane:'single', loadTorque:2 });
  near(r.requiredTorque, 2 * 5, 1e-12);
  const r2 = computeRA({ inertia:0.0001, angleDeg:90, timeSec:1, vane:'single', loadTorque:2, safety:3 });
  near(r2.requiredTorque, 6, 1e-12);
});

/* ── E) 하중 초과 → warn (KE는 통과) ── */
test('래디얼 하중 초과 → warn (KE 통과시)', () => {
  const r = computeRA({ inertia:1e-6, angleDeg:90, timeSec:1, vane:'single', radialLoad:20 });
  // size10 radial 15 < 20 → warn ; size20 radial 25 ≥ 20 → ok
  assert.equal(get(r, 'CRB2BW10').status, 'warn');
  assert.ok(get(r, 'CRB2BW10').okKE);
  assert.equal(get(r, 'CRB2BW20').status, 'ok');
});

/* ── F) KE가 최대 초과 → 추천 없음 + 경고 ── */
test('운동에너지 0.04J 초과 → 추천 없음', () => {
  const r = computeRA({ inertia:0.1, angleDeg:180, timeSec:0.3, vane:'double' });
  assert.ok(r.E > 0.04);
  assert.equal(r.recommended, null);
  assert.ok(r.notes.some(n => n.includes('0.04J')));
});

/* ── G) 불변식 — 시드 랜덤 200개 ── */
function makeRng(seed){let s=seed>>>0;return()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;}}
const rng = makeRng(20261013);
const pick = (a) => a[Math.floor(rng() * a.length)];

test('불변식: 무작위 입력 200개', () => {
  let okSeen=0, warnSeen=0, badSeen=0;
  for (let i = 0; i < 200; i++) {
    const input = {
      inertia: Math.pow(10, -6 + rng()*4) ,            // 1e-6 ~ 1e-2
      angleDeg: pick([90,100,180,270]),
      timeSec: pick([0.3,0.5,1,2]),
      vane: pick(['single','double']),
      loadTorque: pick([0,0.5,2,5]),
      safety: pick([3,4,5]),
      radialLoad: pick([0,10,20,40]),
      thrustLoad: pick([0,10,30]),
    };
    const r = computeRA(input);
    const ctx = `#${i} ${JSON.stringify(input)}`;
    const omega = 2 * (input.angleDeg * DEG2RAD) / input.timeSec;
    near(r.omega, omega, 1e-9);
    near(r.E, 0.5 * input.inertia * omega * omega, 1e-9);
    near(r.requiredTorque, input.loadTorque>0 ? input.loadTorque*input.safety : 0, 1e-9);
    for (const x of r.results) {
      const keAllow = input.vane==='double' ? x.keD : x.keS;
      assert.equal(x.keAllow, keAllow);
      const okKE = r.E <= keAllow;
      const okR = input.radialLoad<=0 ? true : input.radialLoad <= x.radial;
      const okT = input.thrustLoad<=0 ? true : input.thrustLoad <= x.thrust;
      const exp = (okKE&&okR&&okT)?'ok':okKE?'warn':'bad';
      assert.equal(x.status, exp, `status ${x.size} — ${ctx}`);
      assert.ok(Number.isFinite(x.keMargin) || x.keMargin===Infinity);
      if (x.status==='ok') okSeen++; else if (x.status==='warn') warnSeen++; else badSeen++;
    }
    assert.equal(r.recommended, r.results.find(x=>x.status==='ok')||null, `추천 — ${ctx}`);
  }
  assert.ok(okSeen>0 && warnSeen>0 && badSeen>0, `분기 미관측 ok=${okSeen} warn=${warnSeen} bad=${badSeen}`);
});
