'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 하모닉 드라이브 계산 테스트 — 순수 Node
   대상: ../calc/harmonic-drive.calc.js (harmonic-drive.html 무손실 사본)
   ══════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { getRatedTorque, judgeHD, computeHD, HD_MODELS } = require('../calc/harmonic-drive.calc.js');

const near = (a, b, rel = 1e-9) => {
  if (a === b) return;
  const d = Math.abs(a - b), s = Math.max(Math.abs(a), Math.abs(b), 1);
  assert.ok(d / s <= rel, `expected ${a} ≈ ${b} (rel ${d / s})`);
};

/* ── A) 단위 ── */
test('getRatedTorque: tr 테이블 직접 조회', () => {
  const m = HD_MODELS.find(x => x.mk === 'HDS' && x.sr === 'CSF' && x.sz === 8);
  assert.equal(getRatedTorque(m, 100), m.tr[100]);
  assert.equal(getRatedTorque(m, 999), null); // rr에 없음
});

/* ── B) 골든 (computeHD) ── */
const ALL = { hds: true, leaderdrive: true, laifual: true };
const GOLDEN = [
  { label: 'T2·감속비100 → HDS CSF-11 (ok)',
    input: { tCont: 2, tPeak: 5, nInput: 2000, ratio: 100, lh: 5000, shaft: 'solid', precision: 1.0, makers: ALL },
    expect: { n: 9, mk: 'HDS', sr: 'CSF', sz: 11, ratedTorque: 5, peakTorque: 25, lifeH: 109375, overall: 'ok', ratchetRisk: false } },
  { label: 'T20·감속비50 → HDS CSF-25 (ok)',
    input: { tCont: 20, tPeak: 60, nInput: 1500, ratio: 50, lh: 7000, shaft: 'solid', precision: 1.0, makers: ALL },
    expect: { n: 9, mk: 'HDS', sr: 'CSF', sz: 25, ratedTorque: 39, peakTorque: 186, lifeH: 69205, overall: 'ok', ratchetRisk: false } },
  { label: 'T2·피크50 → 작은 사이즈 래칫, 첫 ok는 CSF-17',
    input: { tCont: 2, tPeak: 50, nInput: 2000, ratio: 100, lh: 5000, shaft: 'solid', precision: 1.0, makers: ALL },
    expect: { n: 9, mk: 'HDS', sr: 'CSF', sz: 17, ratedTorque: 24, peakTorque: 108, lifeH: 12096000, overall: 'ok', ratchetRisk: false } },
  { label: '과토크 T5000 → 전부 부적합(래칫)',
    input: { tCont: 5000, tPeak: 8000, nInput: 1000, ratio: 100, lh: 10000, shaft: 'solid', precision: 1.0, makers: ALL },
    expect: { n: 9, mk: 'HDS', sr: 'CSF', sz: 8, ratedTorque: 2.4, peakTorque: 9, lifeH: 0, overall: 'bad', ratchetRisk: true } },
];
for (const g of GOLDEN) {
  test(`골든: ${g.label}`, () => {
    const r = computeHD(g.input); const e = g.expect;
    assert.equal(r.results.length, e.n, '결과 수');
    const c = r.recommended;
    assert.equal(c.m.mk, e.mk); assert.equal(c.m.sr, e.sr); assert.equal(c.m.sz, e.sz);
    near(c.ratedTorque, e.ratedTorque); near(c.peakTorque, e.peakTorque);
    assert.equal(c.lifeH, e.lifeH); assert.equal(c.overall, e.overall); assert.equal(c.ratchetRisk, e.ratchetRisk);
  });
}

/* ── C) 고유 불변식 — 시드 랜덤 150개 ── */
function makeRng(seed) { let s = seed >>> 0; return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; }; }
const rng = makeRng(20260817);
const pick = (a) => a[Math.floor(rng() * a.length)];
const ri = (lo, hi) => lo + rng() * (hi - lo);
const order = { ok: 0, warn: 1, bad: 2 };

function randomInput() {
  const makers = { hds: rng() < 0.85, leaderdrive: rng() < 0.7, laifual: rng() < 0.7 };
  if (!makers.hds && !makers.leaderdrive && !makers.laifual) makers.hds = true;
  const tCont = Math.round(ri(1, 800));
  return {
    tCont, tPeak: Math.round(tCont * ri(1, 4)), nInput: Math.round(ri(500, 8000)),
    ratio: pick([30, 50, 80, 100, 120, 160]), lh: pick([5000, 7000, 10000, 20000]),
    shaft: pick(['solid', 'hollow', 'any']), precision: pick([1.0, 3.0, 5.0]), makers,
  };
}

test('불변식: 무작위 입력 150개', () => {
  let withResult = 0, warnSeen = 0, badSeen = 0, ratchetSeen = 0, accelSeen = 0;
  for (let i = 0; i < 150; i++) {
    const input = randomInput();
    const r = computeHD(input);
    const ctx = `#${i} ${JSON.stringify(input)}`;

    for (const x of r.results) {
      const m = x.m;
      // (2) 필터
      if (m.mk === 'HDS') assert.ok(input.makers.hds, `hds 필터 — ${ctx}`);
      if (m.mk === 'LD') assert.ok(input.makers.leaderdrive, `ld 필터 — ${ctx}`);
      if (m.mk === 'LF') assert.ok(input.makers.laifual, `lf 필터 — ${ctx}`);
      if (input.shaft === 'solid') assert.equal(m.sh, 'solid', `shaft — ${ctx}`);
      if (input.shaft === 'hollow') assert.equal(m.sh, 'hollow', `shaft — ${ctx}`);
      assert.ok(m.prec <= input.precision, `precision — ${ctx}`);
      assert.ok(m.rr.includes(input.ratio), `감속비 — ${ctx}`);

      // (4) 단위: ratedTorque, peakTorque, lifeH
      near(x.ratedTorque, getRatedTorque(m, input.ratio));
      const expPeak = m.mp ? m.mp[input.ratio] : Math.round(x.ratedTorque * 3 * 10) / 10;
      near(x.peakTorque, expPeak);
      assert.equal(x.lifeH, Math.round(Math.pow(x.ratedTorque / input.tCont, 3) * (m.l10 || 10000) * (2000 / input.nInput)), `lifeH — ${ctx}`);

      // (1) 판정 ↔ 조건
      assert.equal(x.torqueOk, input.tCont <= x.ratedTorque, `torqueOk — ${ctx}`);
      assert.equal(x.ratchetRisk, input.tPeak > x.peakTorque, `ratchetRisk — ${ctx}`);
      assert.equal(x.rpmOk, input.nInput <= m.mrpm, `rpmOk — ${ctx}`);
      const rpT = m.rp ? m.rp[input.ratio] : null;
      assert.equal(x.accelOver, rpT !== null && !x.ratchetRisk && input.tPeak > rpT, `accelOver — ${ctx}`);
      const lg = x.lifeH >= input.lh ? 'ok' : x.lifeH >= input.lh * 0.8 ? 'warn' : 'bad';
      assert.equal(x.lifeGrade, lg, `lifeGrade — ${ctx}`);
      let ov;
      if (!x.torqueOk || !x.rpmOk) ov = 'bad';
      else if (x.ratchetRisk) ov = 'bad';
      else if (x.lifeGrade === 'bad') ov = 'bad';
      else if (x.accelOver || x.lifeGrade === 'warn') ov = 'warn';
      else ov = 'ok';
      assert.equal(x.overall, ov, `overall — ${ctx}`);

      if (x.overall === 'warn') warnSeen++; if (x.overall === 'bad') badSeen++;
      if (x.ratchetRisk) ratchetSeen++; if (x.accelOver) accelSeen++;
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
  assert.ok(warnSeen > 0 && badSeen > 0 && ratchetSeen > 0 && accelSeen > 0,
    `분기 미관측 (warn=${warnSeen} bad=${badSeen} ratchet=${ratchetSeen} accel=${accelSeen})`);
});
