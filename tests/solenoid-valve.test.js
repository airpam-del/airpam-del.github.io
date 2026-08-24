'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 솔레노이드 밸브 계산 테스트 — 순수 Node
   대상: ../calc/solenoid-valve.calc.js (solenoid-valve.html 무손실 사본)
   ══════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { calcQRequired, computeSV, BORE_TABLE_SV, VALVE_DATA } = require('../calc/solenoid-valve.calc.js');

const near = (a, b, rel = 1e-9) => {
  if (a === b) return;
  const d = Math.abs(a - b), s = Math.max(Math.abs(a), Math.abs(b), 1);
  assert.ok(d / s <= rel, `expected ${a} ≈ ${b}`);
};

/* ── A) 단위 ── */
test('calcQRequired: area×speed×60/1e6×(P/0.1013+1)', () => {
  near(calcQRequired(32, 300, 0.5), 804 * 300 * 60 / 1e6 * (0.5 / 0.1013 + 1));
});

/* ── B) 골든 (computeSV) ── */
const ALL = { smc: true, festo: true, ckd: true };
const GOLDEN = [
  { label: 'Ø32·300mm/s·5포트·복동·DC24 → Festo VUVG-L10 (ok)',
    input: { bore: 32, speed: 300, supplyP: 0.5, ports: '5', actuator: 'double', voltage: 'DC24V', makers: ALL },
    expect: { qRequired: 85.90339190523198, n: 11, maker: 'festo', model: 'VUVG-L10', qRated: 220, margin: 2.5610164525598993, status: 'ok' } },
  { label: 'Ø63·500mm/s·AC220 → SMC SY5000 (ok)',
    input: { bore: 63, speed: 500, supplyP: 0.5, ports: '5', actuator: 'double', voltage: 'AC220V', makers: ALL },
    expect: { qRequired: 555.0598519249753, n: 11, maker: 'smc', model: 'SY5000', qRated: 687, margin: 1.2377043621826542, status: 'ok' } },
  { label: 'Ø100·1000mm/s → 유량 부족(bad)',
    input: { bore: 100, speed: 1000, supplyP: 0.5, ports: '5', actuator: 'double', voltage: 'DC24V', makers: ALL },
    expect: { qRequired: 2797.2024876604146, n: 11, maker: 'festo', model: 'VUVG-L10', qRated: 220, margin: 0.07865000870352021, status: 'bad' } },
];
for (const g of GOLDEN) {
  test(`골든: ${g.label}`, () => {
    const r = computeSV(g.input); const c = r.recommended; const e = g.expect;
    near(r.qRequired, e.qRequired);
    assert.equal(r.results.length, e.n, '결과 수');
    assert.equal(c.maker, e.maker); assert.equal(c.model, e.model); assert.equal(c.qRated, e.qRated);
    near(c.margin, e.margin); assert.equal(c.status, e.status);
  });
}

/* ── C) 고유 불변식 — 시드 랜덤 150개 ── */
function makeRng(seed) { let s = seed >>> 0; return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; }; }
const rng = makeRng(20260817);
const pick = (a) => a[Math.floor(rng() * a.length)];
const ri = (lo, hi) => lo + rng() * (hi - lo);
const order = { ok: 0, warn: 1, bad: 2 };
const BORES = Object.keys(BORE_TABLE_SV).map(Number);

function voltMatch(v, voltage) {
  return v.voltages.some(vv => voltage === 'AC220V' ? (vv === 'AC220V' || vv === 'AC230V') : vv === voltage);
}
function randomInput() {
  const makers = { smc: rng() < 0.85, festo: rng() < 0.75, ckd: rng() < 0.75 };
  if (!makers.smc && !makers.festo && !makers.ckd) makers.smc = true;
  return {
    bore: pick(BORES), speed: Math.round(ri(50, 2000)), supplyP: pick([0.3, 0.4, 0.5, 0.6, 0.7]),
    ports: pick(['3', '5']), actuator: pick(['single', 'double']),
    voltage: pick(['DC24V', 'AC220V', 'AC110V']), makers,
  };
}

test('불변식: 무작위 입력 150개', () => {
  let withResult = 0, okSeen = 0, warnSeen = 0, badSeen = 0;
  for (let i = 0; i < 150; i++) {
    const input = randomInput();
    const r = computeSV(input);
    const ctx = `#${i} ${JSON.stringify(input)}`;
    const portNum = parseInt(input.ports, 10);

    // (4) 단위: qRequired
    near(r.qRequired, BORE_TABLE_SV[input.bore] * input.speed * 60 / 1e6 * (input.supplyP / 0.1013 + 1));

    for (const x of r.results) {
      // (2) 필터
      assert.ok(input.makers[x.maker], `메이커 — ${ctx}`);
      assert.ok(x.ports === 'both' || x.ports === portNum, `포트 — ${ctx}`);
      assert.ok(x.actuators.includes(input.actuator), `작동방식 — ${ctx}`);
      assert.ok(voltMatch(x, input.voltage), `전원 — ${ctx}`);
      // (1) 판정 ↔ 조건
      near(x.margin, x.qRated / r.qRequired);
      const exp = x.margin >= 1.2 ? 'ok' : x.margin >= 1.0 ? 'warn' : 'bad';
      assert.equal(x.status, exp, `status — ${ctx}`);
      // (5) undefined 없음
      assert.ok(Number.isFinite(x.qRated) && typeof x.model === 'string');
      if (x.status === 'ok') okSeen++; if (x.status === 'warn') warnSeen++; if (x.status === 'bad') badSeen++;
    }

    // 필터 완전성: 제외된 밸브는 조건 하나 이상 불충족
    for (const v of VALVE_DATA) {
      const included = r.results.some(x => x.model === v.model && x.maker === v.maker);
      const shouldPass = input.makers[v.maker] && (v.ports === 'both' || v.ports === portNum) &&
        v.actuators.includes(input.actuator) && voltMatch(v, input.voltage);
      assert.equal(included, shouldPass, `필터 완전성 ${v.maker}/${v.model} — ${ctx}`);
    }

    // (3) 정렬 + 추천
    for (let j = 1; j < r.results.length; j++) {
      const a = r.results[j - 1], b = r.results[j];
      assert.ok((order[a.status] - order[b.status] || a.qRated - b.qRated) <= 0, `정렬 — ${ctx}`);
    }
    assert.equal(r.recommended, r.results.length ? r.results[0] : null, `추천 — ${ctx}`);
    if (r.recommended) withResult++;
  }
  assert.ok(withResult >= 60, `결과 케이스 부족: ${withResult}`);
  assert.ok(okSeen > 0 && warnSeen > 0 && badSeen > 0, `분기 미관측 (ok=${okSeen} warn=${warnSeen} bad=${badSeen})`);
});
