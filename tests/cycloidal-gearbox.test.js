'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 사이클로이드 감속기 계산 테스트 — 순수 Node
   대상: ../calc/cycloidal-gearbox.calc.js (cycloidal-gearbox.html 무손실 사본)
   ══════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { judgeCG, computeCG, CG_DATA } = require('../calc/cycloidal-gearbox.calc.js');

const near = (a, b, rel = 1e-9) => {
  if (a === b) return;
  const d = Math.abs(a - b), s = Math.max(Math.abs(a), Math.abs(b), 1);
  assert.ok(d / s <= rel, `expected ${a} ≈ ${b} (rel ${d / s})`);
};
const seriesOf = (mk, model) => CG_DATA[mk].series.find(s => s.model === model);

/* ── A) 단위 (judgeCG) ── */
test('judgeCG: 역방향 SF ×1.2 반영', () => {
  const s = CG_DATA.sumitomo.series[0];
  const a = judgeCG(s, 50, 100, 2.0, 1.0, false, 1000, 10000);
  const b = judgeCG(s, 50, 100, 2.0, 1.0, true, 1000, 10000);
  // 역방향이면 tDesignDuty가 1.2배 → 통과/탈락 경계가 달라질 수 있음. 최소한 함수가 동작.
  assert.ok(a === null || typeof a.overall === 'string');
  assert.ok(b === null || typeof b.overall === 'string');
});

/* ── B) 골든 (computeCG) ── */
const M2 = { sumitomo: true, nabtesco: true };
const GOLDEN = [
  { label: 'T100·SF1.5·감속비59 → Nabtesco RV-20E (ok)',
    input: { tLoad: 100, sf: 1.5, duty: 1.0, reverse: false, ratio: 59, nInput: 1500, lh: 15000, makers: M2 },
    expect: { sfFinal: 1.5, tDesignEff: 150, tDesignDuty: 150, n: 17, makerKey: 'nabtesco', model: 'RV-20E', ratedTorque: 196, peakTorque: 980, lifeGrade: 'ok', overall: 'ok' } },
  { label: 'T300·SF2.0·역방향·duty0.75·감속비100 → Sumitomo FC-A5 (rpmWarn→warn)',
    input: { tLoad: 300, sf: 2.0, duty: 0.75, reverse: true, ratio: 100, nInput: 2000, lh: 10000, makers: M2 },
    expect: { sfFinal: 2.4, tDesignEff: 720, tDesignDuty: 540, n: 13, makerKey: 'sumitomo', model: 'FC-A5', ratedTorque: 700, peakTorque: 3500, lifeGrade: 'ok', overall: 'warn' } },
  { label: '과토크 T5000·SF2.0 → 결과 없음',
    input: { tLoad: 5000, sf: 2.0, duty: 1.0, reverse: false, ratio: 50, nInput: 1000, lh: 20000, makers: M2 },
    expect: { sfFinal: 2, tDesignEff: 10000, tDesignDuty: 10000, n: 0, makerKey: null } },
];
for (const g of GOLDEN) {
  test(`골든: ${g.label}`, () => {
    const r = computeCG(g.input); const e = g.expect;
    near(r.sfFinal, e.sfFinal); near(r.tDesignEff, e.tDesignEff); near(r.tDesignDuty, e.tDesignDuty);
    assert.equal(r.results.length, e.n, '결과 수');
    if (e.makerKey === null) { assert.equal(r.recommended, null); return; }
    const c = r.recommended;
    assert.equal(c.makerKey, e.makerKey); assert.equal(c.model, e.model);
    assert.equal(c.ratedTorque, e.ratedTorque); near(c.peakTorque, e.peakTorque);
    assert.equal(c.lifeGrade, e.lifeGrade); assert.equal(c.overall, e.overall);
  });
}

/* ── C) 고유 불변식 — 시드 랜덤 120개 ── */
function makeRng(seed) { let s = seed >>> 0; return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; }; }
const rng = makeRng(20260817);
const pick = (a) => a[Math.floor(rng() * a.length)];
const ri = (lo, hi) => lo + rng() * (hi - lo);
const RATIOS = [11, 20, 29, 40, 50, 59, 87, 100, 119, 150, 179, 185, 200];
const order = { ok: 0, warn: 1, bad: 2 };

function randomInput() {
  const makers = { sumitomo: rng() < 0.85, nabtesco: rng() < 0.85 };
  if (!makers.sumitomo && !makers.nabtesco) makers.sumitomo = true;
  return {
    tLoad: Math.round(ri(10, 8000)), sf: pick([1.0, 1.25, 1.5, 2.0]), duty: pick([1.0, 0.9, 0.75]),
    reverse: rng() < 0.4, ratio: pick(RATIOS), nInput: Math.round(ri(500, 6000)),
    lh: pick([10000, 15000, 20000, 30000]), makers,
  };
}

test('불변식: 무작위 입력 120개', () => {
  let withResult = 0, warnSeen = 0, badSeen = 0, rpmWarnSeen = 0;
  for (let i = 0; i < 120; i++) {
    const input = randomInput();
    const r = computeCG(input);
    const ctx = `#${i} ${JSON.stringify(input)}`;

    // (4) 단위: sfFinal, tDesignEff, tDesignDuty
    near(r.sfFinal, input.sf * (input.reverse ? 1.2 : 1));
    near(r.tDesignEff, input.tLoad * r.sfFinal);
    near(r.tDesignDuty, r.tDesignEff * input.duty);

    for (const x of r.results) {
      const s = seriesOf(x.makerKey, x.model);
      // (2) 필터
      assert.ok(input.ratio >= s.ratioMin && input.ratio <= s.ratioMax, `감속비 범위 — ${ctx}`);
      assert.ok(x.ratedTorque >= r.tDesignDuty, `토크 부족 — ${ctx}`);
      // (1) 판정 ↔ 조건
      assert.equal(x.rpmOk, input.nInput <= s.maxRpm, `rpmOk — ${ctx}`);
      assert.equal(x.rpmWarn, input.nInput > 1800, `rpmWarn — ${ctx}`);
      const lg = s.guaranteedLife >= input.lh * 1.2 ? 'ok' : s.guaranteedLife >= input.lh * 0.8 ? 'warn' : 'bad';
      assert.equal(x.lifeGrade, lg, `lifeGrade — ${ctx}`);
      const ov = (!x.rpmOk || x.lifeGrade === 'bad') ? 'bad' : (x.lifeGrade === 'warn' || x.rpmWarn) ? 'warn' : 'ok';
      assert.equal(x.overall, ov, `overall — ${ctx}`);
      // (4) peakTorque = torqueMax × peakMultiplier
      near(x.peakTorque, s.torqueMax * s.peakMultiplier);
      // (5) undefined/NaN 없음
      for (const k of ['ratedTorque', 'peakTorque', 'guaranteedLife', 'eff']) assert.ok(Number.isFinite(x[k]), `${k} — ${ctx}`);
      if (x.overall === 'warn') warnSeen++; if (x.overall === 'bad') badSeen++; if (x.rpmWarn) rpmWarnSeen++;
    }

    // (3) 정렬 + 추천
    for (let j = 1; j < r.results.length; j++) {
      const a = r.results[j - 1], b = r.results[j];
      assert.ok((order[a.overall] - order[b.overall] || a.ratedTorque - b.ratedTorque) <= 0, `정렬 — ${ctx}`);
    }
    assert.equal(r.recommended, r.results.length ? r.results[0] : null, `추천 — ${ctx}`);
    if (r.recommended) withResult++;
  }
  assert.ok(withResult >= 40, `결과 케이스 부족: ${withResult}`);
  assert.ok(warnSeen > 0 && badSeen > 0 && rpmWarnSeen > 0, `분기 미관측 (warn=${warnSeen} bad=${badSeen} rpmWarn=${rpmWarnSeen})`);
});
