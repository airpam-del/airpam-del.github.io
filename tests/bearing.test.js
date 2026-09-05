'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 베어링 계산 테스트 — 순수 Node(node:test + assert)만 사용
   대상: ../calc/bearing.calc.js  (bearing.html 인라인 로직의 무손실 사본)

   A) 골든 케이스 — 현재 계산값을 고정, 계산식이 바뀌면 실패
   B) 불변식(구조적 버그 차단) — 시드 PRNG로 무작위 입력 100개 검사
   ══════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const {
  selectBearing, findCandidates, BRG_DB, BRG_META,
} = require('../calc/bearing.calc.js');

/* 상대오차 근사 비교 */
const near = (a, b, rel = 1e-9) => {
  if (a === b) return;
  const d = Math.abs(a - b), s = Math.max(Math.abs(a), Math.abs(b), 1);
  assert.ok(d / s <= rel, `expected ${a} ≈ ${b} (rel ${d / s})`);
};

/* ────────────────────────────────────────────────────────────
   A) 골든 케이스 (정답 고정)
   ──────────────────────────────────────────────────────────── */
const GOLDEN = [
  {
    label: 'DGBB 내경20 · 중하중 · 1800rpm · 8000h → 수명 미달(bad)',
    input: { type: 'DGBB', searchBy: 'bore', dimVal: 20, fr: 300, fa: 50, fw: 1.2, ft: 1.0, lh: 8000, n: 1800 },
    expect: { name: '6304', judge: 'bad', nAllow: 14000, nCands: 3,
      l10h: 844.992964595987, P: 2.9429999999999996, s0: 2.684335711858648, cReq: 33.63639333078535,
      warnings: { incompatibleAxial: false, incompatibleRadial: false, lifeShort: true, rpmExceed: false } },
  },
  {
    label: 'DGBB 내경30 · 경하중 · 1000rpm · 20000h → 적합(ok)',
    input: { type: 'DGBB', searchBy: 'bore', dimVal: 30, fr: 150, fa: 0, fw: 1.0, ft: 1.0, lh: 20000, n: 1000 },
    expect: { name: '6206', judge: 'ok', nAllow: 11000, nCands: 3,
      l10h: 38785.713436080456, P: 1.4714999999999998, s0: 7.679238871899424, cReq: 15.637020845522118,
      warnings: { incompatibleAxial: false, incompatibleRadial: false, lifeShort: false, rpmExceed: false } },
  },
  {
    label: 'ACBB 내경25 · 축하중 · 3000rpm · 10000h → 최선책(warn)',
    input: { type: 'ACBB', searchBy: 'bore', dimVal: 25, fr: 200, fa: 150, fw: 1.2, ft: 1.0, lh: 10000, n: 3000 },
    expect: { name: '7305', judge: 'warn', nAllow: 14000, nCands: 2,
      l10h: 7141.7828906617015, P: 1.9619999999999997, s0: 9.174311926605506, cReq: 28.639872756756017,
      warnings: { incompatibleAxial: false, incompatibleRadial: false, lifeShort: true, rpmExceed: false } },
  },
  {
    label: 'CRB 내경40 · 대반경 · 1500rpm · 15000h → 최선책(warn)',
    input: { type: 'CRB', searchBy: 'bore', dimVal: 40, fr: 800, fa: 0, fw: 1.5, ft: 1.0, lh: 15000, n: 1500 },
    expect: { name: 'NJ308', judge: 'warn', nAllow: 7000, nCands: 2,
      l10h: 7527.794128876126, P: 7.847999999999999, s0: 11.098369011213048, cReq: 102.31760927307897,
      warnings: { incompatibleAxial: false, incompatibleRadial: false, lifeShort: true, rpmExceed: false } },
  },
];

for (const g of GOLDEN) {
  test(`골든: ${g.label}`, () => {
    const r = selectBearing(g.input);
    const rec = r.recommended;
    assert.equal(rec.name, g.expect.name, '추천 모델');
    assert.equal(rec.judge, g.expect.judge, '판정');
    assert.equal(rec.nAllow, g.expect.nAllow, '허용rpm');
    assert.equal(r.candidates.length, g.expect.nCands, '후보 수');
    near(rec.l10h, g.expect.l10h);
    near(rec.P, g.expect.P);
    near(rec.s0, g.expect.s0);
    near(rec.cReq, g.expect.cReq);
    assert.deepEqual(r.warnings, g.expect.warnings, '경고 플래그');
    // 히어로 카드 수명 == 추천행 수명
    assert.equal(r.heroLife, rec.l10h);
  });
}

/* ────────────────────────────────────────────────────────────
   B) 불변식 — 시드 PRNG로 무작위 입력 100개
   ──────────────────────────────────────────────────────────── */

// 재현 가능한 LCG (Numerical Recipes)
function makeRng(seed) {
  let s = seed >>> 0;
  return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; };
}
const rng = makeRng(20260817);
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
const randIn = (lo, hi) => lo + rng() * (hi - lo);

const TYPES = Object.keys(BRG_META);           // DGBB, ACBB, CRB, SBB, SRB, TRB, TBB, NRB
// 각 타입에서 실제 존재하는 내경(bore) 목록
const boresByType = {};
for (const t of TYPES) {
  boresByType[t] = [...new Set(Object.values(BRG_DB[t]).map(d => d[0]))];
}

function randomInput() {
  const type = pick(TYPES);
  return {
    type,
    searchBy: 'bore',
    dimVal: pick(boresByType[type]),
    fr: Math.round(randIn(10, 2000)),   // kgf (>=10 → 유효하중 0 방지)
    fa: Math.round(randIn(0, 1000)),    // kgf (0 허용 — 비호환 경고 경로도 탐색)
    fw: pick([1.0, 1.2, 1.5, 2.0]),
    ft: pick([1.0, 1.0, 0.9, 0.8]),
    lh: pick([5000, 8000, 10000, 20000, 30000]),
    n: Math.round(randIn(100, 8000)),
  };
}

/* 추천 우선순위를 독립적으로 재현 (selectBearing과 별개 코드로 검증) */
function referenceRec(cands) {
  let rec = cands.find(c => c.judge === 'ok' && c.C >= c.cReq);
  if (!rec) rec = cands.filter(c => c.judge === 'ok').sort((a, b) => a.C - b.C)[0];
  if (!rec) rec = cands.filter(c => c.judge === 'warn').sort((a, b) => b.l10h - a.l10h)[0];
  if (!rec) rec = cands.slice().sort((a, b) => b.l10h - a.l10h)[0];
  return rec;
}
const tierRank = { ok: 3, warn: 2, bad: 1 };

test('불변식: 무작위 입력 100개가 모든 불변식을 통과', () => {
  for (let i = 0; i < 100; i++) {
    const input = randomInput();
    const r = selectBearing(input);
    const rec = r.recommended;
    const ctx = `#${i} input=${JSON.stringify(input)} rec=${rec && rec.name}`;

    // 후보는 항상 존재해야 한다(존재하는 내경으로만 생성)
    assert.ok(r.candidates.length > 0, `후보 없음 — ${ctx}`);
    assert.ok(rec, `추천 없음 — ${ctx}`);

    // (5) 경고가 참조하는 속성이 후보 객체에 실제로 존재(undefined 참조 금지)
    for (const key of ['name', 'l10h', 'nAllow', 'lifeOk', 'rpmOk', 's0']) {
      assert.ok(Object.prototype.hasOwnProperty.call(rec, key), `추천 객체에 ${key} 없음 — ${ctx}`);
      assert.ok(rec[key] !== undefined, `${key}=undefined — ${ctx}`);
    }

    // (1) 수명 미달 경고 ⇔ 추천 l10h < 요구수명  (lifeOk 플래그가 아닌 원시값으로 검증 → lifeOk 버그 포착)
    if (r.warnings.lifeShort) {
      assert.ok(rec.l10h < input.lh, `lifeShort인데 l10h(${rec.l10h}) ≥ lh(${input.lh}) — ${ctx}`);
    } else {
      assert.ok(rec.l10h >= input.lh, `lifeShort 아닌데 l10h(${rec.l10h}) < lh(${input.lh}) — ${ctx}`);
    }

    // (2) 회전수 초과 경고 ⇔ 운전 rpm > 허용 rpm
    if (r.warnings.rpmExceed) {
      assert.ok(input.n > rec.nAllow, `rpmExceed인데 n(${input.n}) ≤ nAllow(${rec.nAllow}) — ${ctx}`);
    } else {
      assert.ok(input.n <= rec.nAllow, `rpmExceed 아닌데 n(${input.n}) > nAllow(${rec.nAllow}) — ${ctx}`);
    }

    // (3) 히어로 카드 수명값 == 비교표 추천행 수명값
    assert.equal(r.heroLife, rec.l10h, `heroLife != rec.l10h — ${ctx}`);

    // (4) 추천은 판정 우선순위에 맞는 후보
    //   4a) 독립 재현한 추천과 형번 일치
    const refName = referenceRec(r.candidates).name;
    assert.equal(rec.name, refName, `추천 우선순위 불일치 (ref=${refName}) — ${ctx}`);
    //   4b) 존재하는 최고 등급(tier)을 벗어나 낮은 등급을 고르지 않는다
    const bestTier = Math.max(...r.candidates.map(c => tierRank[c.judge]));
    assert.equal(tierRank[rec.judge], bestTier, `더 나은 등급 후보가 있는데 낮은 등급 추천 — ${ctx}`);
    //   4c) warn 추천이면 warn 후보 중 최대 수명
    if (rec.judge === 'warn') {
      const maxWarnLife = Math.max(...r.candidates.filter(c => c.judge === 'warn').map(c => c.l10h));
      near(rec.l10h, maxWarnLife, 0);
    }
  }
});

/* 추가 불변식: findCandidates 결과의 형번은 모두 해당 타입 DB에 존재 */
test('불변식: 후보 형번은 모두 BRG_DB에 존재', () => {
  for (let i = 0; i < 30; i++) {
    const input = randomInput();
    for (const c of findCandidates(input)) {
      assert.ok(Object.prototype.hasOwnProperty.call(BRG_DB[input.type], c.name), `${c.name} 없음`);
    }
  }
});
