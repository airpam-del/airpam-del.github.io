'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 진공 이젝터 계산 테스트 — 순수 Node
   대상: ../calc/vacuum-ejector.calc.js (vacuum-ejector.html 무손실 사본)
   t=60·(V/Q)·ln(Pa/(Pa−Pv)), SMC ZH 사양 기준 선정(beta)
   ══════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { computeVE, evacVolumeL, VE_SIZES, P_MAX_S, P_ATM_KPA } = require('../calc/vacuum-ejector.calc.js');

const near = (a, b, rel = 1e-9) => {
  if (a === b) return;
  const d = Math.abs(a - b), s = Math.max(Math.abs(a), Math.abs(b), 1);
  assert.ok(d / s <= rel, `expected ${a} ≈ ${b}`);
};
const get = (r, size) => r.results.find(x => x.size === size);

/* ── A) 배기시간 공식 + 비통기 모델 선정 ── */
test('비통기: V=0.1L·목표60kPa·목표시간1s → 배기시간식 + 추천 ZH07', () => {
  const r = computeVE({ workType:'sealed', targetVacuum:60, volume:0.1, timeTarget:1.0, tFactor:2.0 });
  const ln = Math.log(101.3 / (101.3 - 60));
  near(r.lnTerm, ln, 1e-12);
  const z05 = get(r, 'ZH05'), z07 = get(r, 'ZH07');
  near(z05.tTheory, 60 * (0.1 / 5) * ln, 1e-9);
  near(z05.tReal, z05.tTheory * 2.0, 1e-12);
  assert.equal(z05.status, 'warn');              // 진공·유량 OK, 시간 초과(2.15s>1)
  near(z07.tReal, 60 * (0.1 / 12) * ln * 2.0, 1e-9);
  assert.ok(z07.tReal <= 1.0);
  assert.equal(z07.status, 'ok');
  assert.equal(r.recommended.size, 'ZH07');
  assert.equal(r.recommended.type, 'S');
  assert.equal(r.recommended.pMax, 88);
});

/* ── B) 통기/누설: 흡입유량 매칭 ── */
test('통기: 누설30·여유1.5 → qL≥45 필요 → 추천 ZH13 (L타입)', () => {
  const r = computeVE({ workType:'porous', targetVacuum:40, volume:0.2, leakFlow:30, safety:1.5 });
  assert.equal(r.type, 'L');
  const z10 = get(r, 'ZH10'), z13 = get(r, 'ZH13');
  assert.equal(z10.Q, 34); assert.ok(!z10.okFlow);     // 34 < 45
  assert.equal(z13.Q, 70); assert.ok(z13.okFlow);      // 70 ≥ 45
  assert.ok(z13.okVacuum);                             // pMaxL 48 ≥ 40
  assert.equal(r.recommended.size, 'ZH13');
});

// 통기 + 목표진공이 L타입 최대(−48)를 초과 → 도달 불가(진공 판정 실패)
test('통기: 목표 60kPa > L타입 최대 48 → okVacuum false', () => {
  const r = computeVE({ workType:'porous', targetVacuum:60, volume:0.2, leakFlow:5, safety:1.5 });
  for (const x of r.results.filter(m => m.size!=='ZH15' && m.size!=='ZH18' && m.size!=='ZH20'))
    assert.ok(!x.okVacuum, `${x.size} 48<60`);
});

/* ── C) 체적 헬퍼 ── */
test('체적 헬퍼: 패드2×5cm³ + 튜브Ø4×2m', () => {
  const v = evacVolumeL(2, 5, 4, 2);
  const tubeCm3 = (Math.PI/4*16)*(2000)/1000;         // mm³→cm³
  near(v, (10 + tubeCm3) / 1000, 1e-9);
});

/* ── D) 불변식 — 시드 랜덤 200개 ── */
function makeRng(seed){let s=seed>>>0;return()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;}}
const rng = makeRng(20261013);
const pick = (a) => a[Math.floor(rng() * a.length)];

test('불변식: 무작위 입력 200개', () => {
  let okSeen=0, warnSeen=0, badSeen=0;
  for (let i = 0; i < 200; i++) {
    const workType = pick(['sealed','porous']);
    const input = {
      workType, targetVacuum: pick([20,40,50,60,70,85]),
      volume: Math.round(rng()*500)/1000 + 0.01,
      leakFlow: pick([0,5,20,40,80]),
      timeTarget: pick([0.5,1,2,5]), tFactor: pick([1.5,2,2.5]), safety: pick([1.2,1.5,2]),
    };
    const r = computeVE(input);
    const ctx = `#${i} ${JSON.stringify(input)}`;
    const ln = input.targetVacuum>0 ? Math.log(P_ATM_KPA/(P_ATM_KPA-input.targetVacuum)) : 0;
    for (const x of r.results) {
      const Q = input.workType==='porous' ? x.qL : x.qS;
      const pMax = input.workType==='porous' ? x.pMaxL : P_MAX_S;
      assert.equal(x.Q, Q); assert.equal(x.pMax, pMax);
      near(x.tTheory, (input.volume>0&&Q>0)?60*(input.volume/Q)*ln:0, 1e-9);
      near(x.tReal, x.tTheory*input.tFactor, 1e-9);
      const okVac = input.targetVacuum <= pMax;
      const okFlow = input.workType==='porous' ? (input.leakFlow>0 ? Q >= input.leakFlow*input.safety : true) : true;
      const okTime = input.workType==='porous' ? true : (x.tReal <= input.timeTarget);
      const coreOk = okVac && okFlow;
      const exp = (okVac&&okFlow&&okTime)?'ok':coreOk?'warn':'bad';
      assert.equal(x.status, exp, `status ${x.size} — ${ctx}`);
      for (const k of ['tTheory','tReal']) assert.ok(Number.isFinite(x[k]) && x[k] >= 0, `${k} — ${ctx}`);
      if (x.status==='ok') okSeen++; else if (x.status==='warn') warnSeen++; else badSeen++;
    }
    assert.equal(r.recommended, r.results.find(x=>x.status==='ok')||null, `추천 — ${ctx}`);
  }
  assert.ok(okSeen>0 && warnSeen>0 && badSeen>0, `분기 미관측 ok=${okSeen} warn=${warnSeen} bad=${badSeen}`);
});
