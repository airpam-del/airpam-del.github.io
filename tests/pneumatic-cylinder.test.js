'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 공압 실린더 계산 테스트 — 순수 Node
   대상: ../calc/pneumatic-cylinder.calc.js (pneumatic-cylinder.html 무손실 사본)
   3타입(표준/컴팩트/소형) · 추력 F=P·A·η·부하율 (η=0.85) 공통
   ══════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { computePC, CYL_CLASSES, ETA } = require('../calc/pneumatic-cylinder.calc.js');

const near = (a, b, rel = 1e-9) => {
  if (a === b) return;
  const d = Math.abs(a - b), s = Math.max(Math.abs(a), Math.abs(b), 1);
  assert.ok(d / s <= rel, `expected ${a} ≈ ${b}`);
};

/* ── B) 골든 (computePC) ── */
const ALL = { smc: true, festo: true, ckd: true };
const GOLDEN = [
  { label: '표준형 0.5MPa·LF0.6·1000N·복동 → SMC C96 Ø80 (ok)',
    input: { cylinderClass: 'standard', pressure: 0.5, loadFactor: 0.6, fRequired: 1000, cylinderType: 'double', direction: 'push', makers: ALL },
    expect: { needPull: true, n: 19, maker: 'smc', series: 'C96', D: 80, F_push_rec: 1281.885, F_pull_rec: 1156.6799999999998, status: 'ok', notes: 1 } },
  { label: '컴팩트형 0.5MPa·LF0.6·300N·양방향 → SMC CQ2 Ø50 (ok)',
    input: { cylinderClass: 'compact', pressure: 0.5, loadFactor: 0.6, fRequired: 300, cylinderType: 'double', direction: 'both', makers: ALL },
    expect: { needPull: true, n: 24, maker: 'smc', series: 'CQ2', D: 50, F_push_rec: 500.56499999999994, F_pull_rec: 420.49499999999995, status: 'ok', notes: 0 } },
  { label: '소형 0.5MPa·LF0.6·50N·복동 → SMC C85 Ø20 (ok)',
    input: { cylinderClass: 'mini', pressure: 0.5, loadFactor: 0.6, fRequired: 50, cylinderType: 'double', direction: 'push', makers: ALL },
    expect: { needPull: true, n: 12, maker: 'smc', series: 'C85', D: 20, F_push_rec: 80.07, F_pull_rec: 67.32, status: 'ok', notes: 0 } },
];
for (const g of GOLDEN) {
  test(`골든: ${g.label}`, () => {
    const r = computePC(g.input); const c = r.recommended; const e = g.expect;
    assert.equal(r.needPull, e.needPull);
    assert.equal(r.results.length, e.n, '결과 수');
    assert.equal(r.makerNotes.length, e.notes, '안내문 수');
    assert.equal(c.maker.key, e.maker); assert.equal(c.maker.seriesName, e.series); assert.equal(c.D, e.D);
    near(c.F_push_rec, e.F_push_rec); near(c.F_pull_rec, e.F_pull_rec);
    assert.equal(c.status, e.status);
  });
}

/* 단동 골든: 안내문만·결과 0·추천 null */
test('골든: 단동 → 안내문 + 결과 0 + 추천 null', () => {
  const r = computePC({ cylinderClass: 'standard', pressure: 0.5, loadFactor: 0.6, fRequired: 1000, cylinderType: 'single', direction: 'push', makers: ALL });
  assert.equal(r.recommended, null);
  assert.equal(r.results.length, 0);
  assert.equal(r.makerNotes.length, 1);
});

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
    cylinderClass: pick(['standard', 'compact', 'mini']),
    pressure: pick([0.3, 0.4, 0.5, 0.6, 0.7]), loadFactor: pick([0.5, 0.6, 0.7]),
    fRequired: Math.round(ri(10, 5000)), cylinderType: pick(['single', 'double']),
    direction: pick(['push', 'pull', 'both']), makers,
  };
}

test('불변식: 무작위 입력 150개', () => {
  let withResult = 0, okSeen = 0, warnSeen = 0, badSeen = 0, singleSeen = 0;
  for (let i = 0; i < 150; i++) {
    const input = randomInput();
    const r = computePC(input);
    const cls = CYL_CLASSES[input.cylinderClass];
    const ctx = `#${i} ${JSON.stringify(input)}`;

    // (6) needPull
    assert.equal(r.needPull, input.cylinderType === 'double' || input.direction === 'both');

    // 단동: 검증 데이터 복동 전용 → 결과 0·추천 null·안내문 1
    if (input.cylinderType === 'single') {
      assert.equal(r.results.length, 0, `단동 결과0 — ${ctx}`);
      assert.equal(r.recommended, null, `단동 추천null — ${ctx}`);
      assert.equal(r.makerNotes.length, 1, `단동 안내문 — ${ctx}`);
      singleSeen++;
      continue;
    }

    for (const x of r.results) {
      // (2) 필터: 활성 메이커·선택 클래스 소속·보어/압력 범위
      assert.ok(input.makers[x.maker.key], `메이커 — ${ctx}`);
      assert.ok(cls.makers.includes(x.maker), `클래스 소속 — ${ctx}`);
      assert.ok(x.D >= x.maker.minD && x.D <= x.maker.maxD, `보어 범위 — ${ctx}`);
      assert.ok(input.pressure >= x.maker.pMin && input.pressure <= x.maker.pMax, `압력 범위 — ${ctx}`);
      // 보어는 선택 클래스 bores 기준
      assert.ok(cls.bores.some(b => b.D === x.D && b.A_full === x.A_full && b.A_rod === x.A_rod), `보어표 — ${ctx}`);

      // (4) 단위: F=P·A·η, 권장=×부하율
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
  // 절반가량이 단동(결과0)이라 복동 유효케이스 하한은 낮춤. 시드 고정, 분기(ok/warn/bad)는 모두 관측되어야 함(정확성 불변식 유지)
  assert.ok(withResult >= 30, `결과 케이스 부족: ${withResult}`);
  assert.ok(singleSeen > 0, `단동 케이스 미관측: ${singleSeen}`);
  assert.ok(okSeen > 0 && warnSeen > 0 && badSeen > 0, `분기 미관측 (ok=${okSeen} warn=${warnSeen} bad=${badSeen})`);
});
