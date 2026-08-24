'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 볼스크류 계산 테스트 — 순수 Node(node:test + assert)
   대상: ../calc/ballscrew.calc.js  (ballscrew.html 인라인 로직의 무손실 사본)
   A) 단위 테스트  B) 골든(위저드)  C) 고유 불변식(시드 랜덤)
   ══════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { bsCalcFa, bsFindBest, computeBS, BS_DATA, DN_LIMIT } = require('../calc/ballscrew.calc.js');

const near = (a, b, rel = 1e-9) => {
  if (a === b) return;
  const d = Math.abs(a - b), s = Math.max(Math.abs(a), Math.abs(b), 1);
  assert.ok(d / s <= rel, `expected ${a} ≈ ${b} (rel ${d / s})`);
};

/* ── A) 단위: bsCalcFa ── */
test('bsCalcFa: 수평 — 마찰+가속력', () => {
  const Fa = bsCalcFa(100, 'horizontal', 0, 500, 0.5);
  near(Fa, 100 * 9.81 * 0.003 + 100 * (500 / 1000) / 0.5, 1e-9);
});
test('bsCalcFa: 수직 — 중력+가속력', () => {
  const Fa = bsCalcFa(50, 'vertical', 0, 200, 0.2);
  near(Fa, 50 * 9.81 + 50 * (200 / 1000) / 0.2, 1e-9);
});
test('bsCalcFa: 경사 — sin/cos 합산', () => {
  const Fa = bsCalcFa(100, 'incline', 30, 300, 0.3);
  const rad = 30 * Math.PI / 180;
  near(Fa, 100 * 9.81 * (Math.sin(rad) + 0.003 * Math.cos(rad)) + 100 * (300 / 1000) / 0.3, 1e-9);
});
test('bsFindBest: 결과 키는 모두 BS_DATA에 존재', () => {
  const combos = bsFindBest(1000, 300, 500, 20000, 1.0, 100, 0.2, 100);
  assert.ok(combos.length > 0);
  for (const r of combos) assert.ok(Object.prototype.hasOwnProperty.call(BS_DATA, `${r.d0}x${r.lead}`));
});

/* ── B) 골든 (위저드 computeBS) ── */
const GOLDEN = [
  { label: '수평 100kg 500mm/s → φ16×L10 전조건 충족',
    input: { W: 100, dir: 'horizontal', angle: 0, vmax: 500, tacc: 0.2, S: 600, extra: 100, life: '20000', support: '1.4286' },
    expect: { Fa: 252.943, noOk: false, nCombos: 6, nAlts: 4, d0: 16, lead: 10,
      L10h: 229002.6806969144, buckSF: 54.58514707917679, Dn: 48000, statSF: 52.18567028935372,
      T_total: 0.88114649288437, P_kW: 0.2768203348781948, allOk: true, score: 2.7896825396825395,
      classes: { life: 'ok', buck: 'ok', dns: 'ok', stat: 'ok' } } },
  { label: '수직 50kg 300mm/s → φ16×L5 전조건 충족',
    input: { W: 50, dir: 'vertical', angle: 0, vmax: 300, tacc: 0.15, S: 400, extra: 100, life: '10000', support: '1.0' },
    expect: { Fa: 590.5, noOk: false, nCombos: 13, nAlts: 4, d0: 16, lead: 5,
      L10h: 22829.78205203815, buckSF: 22.454946663067407, Dn: 57600, statSF: 27.095681625740898,
      T_total: 0.6464414697401238, P_kW: 0.2437026926773634, allOk: true, score: 2.6646825396825395,
      classes: { life: 'ok', buck: 'ok', dns: 'ok', stat: 'ok' } } },
  { label: '과부하 500kg 800mm/s → φ20×L20 근접(조건 미충족)',
    input: { W: 500, dir: 'horizontal', angle: 0, vmax: 800, tacc: 0.1, S: 1000, extra: 100, life: '30000', support: '0.5' },
    expect: { Fa: 4014.715, noOk: true, nCombos: 2, nAlts: 1, d0: 20, lead: 20,
      L10h: 146.00521492387975, buckSF: 0.4189706500750015, Dn: 48000, statSF: 3.935522197715155,
      T_total: 27.13563648303766, P_kW: 6.819929298047543, allOk: false, score: 3003.6746031746034,
      classes: { life: 'bad', buck: 'bad', dns: 'ok', stat: 'ok' } } },
];
for (const g of GOLDEN) {
  test(`골든: ${g.label}`, () => {
    const r = computeBS(g.input);
    const c = r.recommended;
    near(r.Fa, g.expect.Fa);
    assert.equal(r.noOk, g.expect.noOk);
    assert.equal(r.combos.length, g.expect.nCombos, '후보 수');
    assert.equal(r.alts.length, g.expect.nAlts, 'alts 수');
    assert.equal(c.d0, g.expect.d0); assert.equal(c.lead, g.expect.lead);
    near(c.L10h, g.expect.L10h); near(c.buckSF, g.expect.buckSF);
    assert.equal(c.Dn, g.expect.Dn); near(c.statSF, g.expect.statSF);
    near(c.T_total, g.expect.T_total); near(c.P_kW, g.expect.P_kW);
    assert.equal(c.allOk, g.expect.allOk); near(c.score, g.expect.score);
    assert.deepEqual(r.classes, g.expect.classes);
  });
}

/* ── C) 고유 불변식 — 시드 랜덤 100개 ── */
function makeRng(seed) { let s = seed >>> 0; return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; }; }
const rng = makeRng(20260817);
const pick = (a) => a[Math.floor(rng() * a.length)];
const randIn = (lo, hi) => lo + rng() * (hi - lo);

function randomInput() {
  const dir = pick(['horizontal', 'vertical', 'incline']);
  return {
    W: Math.round(randIn(10, 1000)), dir, angle: dir === 'incline' ? Math.round(randIn(5, 60)) : 0,
    vmax: Math.round(randIn(50, 1200)), tacc: +randIn(0.05, 0.5).toFixed(3),
    S: Math.round(randIn(100, 1500)), extra: pick([50, 100, 150]),
    life: pick(['5000', '10000', '20000', '30000']), support: pick(['0.5', '1.0', '1.4286', '2.0']),
  };
}

test('불변식: 무작위 입력 100개', () => {
  let withCombos = 0;
  for (let i = 0; i < 100; i++) {
    const input = randomInput();
    const r = computeBS(input);
    const ctx = `#${i} ${JSON.stringify(input)}`;
    if (r.combos.length === 0) { assert.equal(r.recommended, null); continue; }
    withCombos++;
    const c = r.recommended;

    // (2) 필터: 반환된 모든 후보는 nm_op ≤ 허용×1.05
    for (const x of r.combos) assert.ok(x.nm_op <= x.nm_allowed * 1.05 + 1e-9, `필터 위반 — ${ctx}`);

    // (1) 판정 ↔ 임계값 방향
    for (const x of r.combos) {
      assert.equal(x.lifeOk, x.L10h >= r.Lreq, `lifeOk — ${ctx}`);
      assert.equal(x.buckOk, x.buckSF >= 3.5, `buckOk — ${ctx}`);
      assert.equal(x.dnsOk, x.Dn <= DN_LIMIT, `dnsOk — ${ctx}`);
      assert.equal(x.statOk, x.statSF >= 3.0, `statOk — ${ctx}`);
      assert.equal(x.allOk, x.lifeOk && x.buckOk && x.dnsOk && x.statOk, `allOk — ${ctx}`);
    }

    // (3) 추천 우선순위: 첫 allOk(점수 오름차순) 또는 최고점수
    const bestOk = r.combos.find(x => x.allOk);
    const expected = bestOk || r.combos[0];
    assert.equal(c, expected, `추천 우선순위 — ${ctx}`);
    // combos 점수 오름차순 정렬
    for (let j = 1; j < r.combos.length; j++) assert.ok(r.combos[j - 1].score <= r.combos[j].score + 1e-9, `정렬 — ${ctx}`);

    // (4) 요약==비교표값: recommended 는 combos 원소
    assert.ok(r.combos.includes(c), `추천이 combos에 없음 — ${ctx}`);

    // (5) 단위 일관성
    near(c.Dn, c.d0 * c.nm_op);
    near(c.T_total, c.T_run + c.T_acc);
    near(c.P_kW, c.T_total * (c.nm_op * 2 * Math.PI / 60) / 1000);
    assert.ok(c.L10h > 0, `L10h>0 — ${ctx}`);

    // (6) undefined/NaN 없음
    for (const k of ['d0', 'lead', 'L10h', 'buckSF', 'Dn', 'statSF', 'T_total', 'P_kW', 'score']) {
      assert.ok(Number.isFinite(c[k]), `${k} 비정상 — ${ctx}`);
    }

    // (7) classes ↔ 판정 (bsRender 티어)
    assert.equal(r.classes.life, c.lifeOk ? 'ok' : c.L10h >= r.Lreq * 0.7 ? 'warn' : 'bad', `classes.life — ${ctx}`);
    assert.equal(r.classes.buck, c.buckOk ? 'ok' : c.buckSF >= 2 ? 'warn' : 'bad', `classes.buck — ${ctx}`);
    assert.equal(r.classes.dns, c.dnsOk ? 'ok' : c.Dn <= DN_LIMIT * 1.1 ? 'warn' : 'bad', `classes.dns — ${ctx}`);
    assert.equal(r.classes.stat, c.statOk ? 'ok' : 'warn', `classes.stat — ${ctx}`);
  }
  assert.ok(withCombos >= 80, `유효 후보 케이스 너무 적음: ${withCombos}`);
});
