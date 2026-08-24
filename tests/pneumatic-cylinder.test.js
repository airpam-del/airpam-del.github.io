'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 공압 실린더 계산 테스트 — 순수 Node
   대상: ../calc/pneumatic-cylinder.calc.js (pneumatic-cylinder.html 무손실 사본)
   ══════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { computePC, BORE_TABLE, MAKERS, ETA } = require('../calc/pneumatic-cylinder.calc.js');

const near = (a, b, rel = 1e-9) => {
  if (a === b) return;
  const d = Math.abs(a - b), s = Math.max(Math.abs(a), Math.abs(b), 1);
  assert.ok(d / s <= rel, `expected ${a} ≈ ${b}`);
};

/* ── B) 골든 (computePC) ── */
const ALL = { smc: true, festo: true, ckd: true };
const GOLDEN = [
  { label: '0.5MPa·LF0.6·필요200N·복동 → SMC CM2B Ø40 (ok)',
    input: { pressure: 0.5, loadFactor: 0.6, fRequired: 200, cylinderType: 'double', direction: 'push', makers: ALL },
    expect: { needPull: true, n: 22, maker: 'smc', series: 'CM2B', D: 40, F_push_rec: 320.535, F_pull_rec: 269.28, status: 'ok' } },
  { label: '0.5MPa·LF0.7·필요1000N·양방향 → SMC CA2 Ø80 (ok)',
    input: { pressure: 0.5, loadFactor: 0.7, fRequired: 1000, cylinderType: 'double', direction: 'both', makers: ALL },
    expect: { needPull: true, n: 22, maker: 'smc', series: 'CA2', D: 80, F_push_rec: 1495.5324999999998, F_pull_rec: 1349.4599999999998, status: 'ok' } },
  { label: '필요 50000N·단동 → 최소 보어 부적합',
    input: { pressure: 0.5, loadFactor: 0.6, fRequired: 50000, cylinderType: 'single', direction: 'push', makers: ALL },
    expect: { needPull: false, n: 22, maker: 'smc', series: 'CM2(단동)', D: 20, F_push_rec: 80.07, F_pull_rec: null, status: 'bad' } },
];
for (const g of GOLDEN) {
  test(`골든: ${g.label}`, () => {
    const r = computePC(g.input); const c = r.recommended; const e = g.expect;
    assert.equal(r.needPull, e.needPull);
    assert.equal(r.results.length, e.n, '결과 수');
    assert.equal(c.maker.key, e.maker); assert.equal(c.series.name, e.series); assert.equal(c.D, e.D);
    near(c.F_push_rec, e.F_push_rec); assert.equal(c.F_pull_rec, e.F_pull_rec);
    assert.equal(c.status, e.status);
  });
}

/* ── C) 고유 불변식 — 시드 랜덤 150개 ── */
function makeRng(seed) { let s = seed >>> 0; return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; }; }
const rng = makeRng(20260817);
const pick = (a) => a[Math.floor(rng() * a.length)];
const ri = (lo, hi) => lo + rng() * (hi - lo);
const order = { ok: 0, warn: 1, bad: 2 };

function randomInput() {
  const makers = { smc: rng() < 0.85, festo: rng() < 0.7, ckd: rng() < 0.7 };
  if (!makers.smc && !makers.festo && !makers.ckd) makers.smc = true;
  return {
    pressure: pick([0.3, 0.4, 0.5, 0.6, 0.7]), loadFactor: pick([0.5, 0.6, 0.7]),
    fRequired: Math.round(ri(10, 5000)), cylinderType: pick(['single', 'double']),
    direction: pick(['push', 'pull', 'both']), makers,
  };
}

test('불변식: 무작위 입력 150개', () => {
  let withResult = 0, okSeen = 0, warnSeen = 0, badSeen = 0;
  for (let i = 0; i < 150; i++) {
    const input = randomInput();
    const r = computePC(input);
    const ctx = `#${i} ${JSON.stringify(input)}`;

    // (6) needPull
    assert.equal(r.needPull, input.cylinderType === 'double' || input.direction === 'both');

    for (const x of r.results) {
      // (2) 필터
      assert.ok(input.makers[x.maker.key], `메이커 — ${ctx}`);
      assert.ok(x.D >= x.series.minD && x.D <= x.series.maxD, `보어 범위 — ${ctx}`);
      assert.ok(input.pressure >= x.series.pMin && input.pressure <= x.series.pMax, `압력 범위 — ${ctx}`);
      // series는 활성 타입 리스트에서 선택됨
      const list = input.cylinderType === 'single' ? x.maker.series.single : x.maker.series.double;
      assert.ok(list.includes(x.series), `시리즈 타입 — ${ctx}`);

      // (4) 단위
      near(x.F_push_theo, input.pressure * x.A_full * ETA);
      near(x.F_push_rec, x.F_push_theo * input.loadFactor);
      if (r.needPull) { near(x.F_pull_theo, input.pressure * x.A_rod * ETA); near(x.F_pull_rec, x.F_pull_theo * input.loadFactor); }
      else { assert.equal(x.F_pull_theo, null); assert.equal(x.F_pull_rec, null); }

      // (1) 판정 ↔ 조건
      const pushOk = x.F_push_rec >= input.fRequired;
      const pullOk = !r.needPull || (x.F_pull_rec !== null && x.F_pull_rec >= input.fRequired);
      const theoOk = x.F_push_theo >= input.fRequired;
      const exp = (pushOk && pullOk) ? 'ok' : (theoOk && !pushOk) ? 'warn' : 'bad';
      assert.equal(x.status, exp, `status — ${ctx}`);
      if (x.status === 'ok') okSeen++; if (x.status === 'warn') warnSeen++; if (x.status === 'bad') badSeen++;

      // (5) undefined/NaN 없음
      for (const k of ['D', 'A_full', 'F_push_theo', 'F_push_rec']) assert.ok(Number.isFinite(x[k]), `${k} — ${ctx}`);
    }

    // (3) 정렬 + 추천
    for (let j = 1; j < r.results.length; j++) {
      const a = r.results[j - 1], b = r.results[j];
      assert.ok((order[a.status] - order[b.status] || a.D - b.D) <= 0, `정렬 — ${ctx}`);
    }
    assert.equal(r.recommended, r.results.length ? r.results[0] : null, `추천 — ${ctx}`);
    if (r.recommended) withResult++;
  }
  assert.ok(withResult >= 60, `결과 케이스 부족: ${withResult}`);
  assert.ok(okSeen > 0 && warnSeen > 0 && badSeen > 0, `분기 미관측 (ok=${okSeen} warn=${warnSeen} bad=${badSeen})`);
});
