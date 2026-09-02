'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn LM가이드 계산 테스트 — 순수 Node(node:test + assert)
   대상: ../calc/lmguide.calc.js  (lmguide.html 인라인 로직의 무손실 사본)
   A) 단위 테스트  B) 골든 케이스  C) 고유 불변식(시드 랜덤)
   ══════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const {
  calcAvgSpeed, getfw, getVerdict, selectModel, calcL10km, computeLM,
  LM_MODELS, LM_MIN_YEARS,
} = require('../calc/lmguide.calc.js');

const near = (a, b, rel = 1e-9) => {
  if (a === b) return;
  const d = Math.abs(a - b), s = Math.max(Math.abs(a), Math.abs(b), 1);
  assert.ok(d / s <= rel, `expected ${a} ≈ ${b} (rel ${d / s})`);
};

/* ────────────────────────────────────────────────────────────
   A) 단위 테스트 (helper 동작)
   ──────────────────────────────────────────────────────────── */
test('calcAvgSpeed: 등속 구간 없는 경우 constDist=0', () => {
  const r = calcAvgSpeed(500, 100, 0.2);
  assert.equal(r.constDist, 0);
});
test('calcAvgSpeed: 일반 사다리꼴 프로파일', () => {
  const r = calcAvgSpeed(500, 500, 0.1);
  near(r.accelDist, 25); near(r.constDist, 450);
  assert.ok(r.avgSpeed > 0 && r.avgSpeed <= 500);
});
test('getfw: 속도 구간별 하중계수', () => {
  assert.equal(getfw(50), 1.0);  assert.equal(getfw(51), 1.2);
  assert.equal(getfw(300), 1.2); assert.equal(getfw(301), 1.5);
  assert.equal(getfw(600), 1.5); assert.equal(getfw(601), 1.8);
});
test('calcL10km: (C100/P)^3 × 100', () => {
  near(calcL10km(1000, 200), Math.pow(5, 3) * 100);
});

/* ────────────────────────────────────────────────────────────
   B) 골든 케이스 (정답 고정)
   ──────────────────────────────────────────────────────────── */
const GOLDEN = [
  { label: 'simple 경하중 → size20 적합',
    input: { mode: 'simple', load: 200, speed: 300, hours: 8, blocks: 1, sets: 1, dirFactor: 1.0 },
    expect: { P: 240, size: 20, L10km: 47455.2, years: 23.15068493150685, ratio: 12.225,
      verdict: '적합', safety: '적합 — 안전율 및 수명 기준 충족', nRows: 1 } },
  { label: 'simple 중하중·2블록 → size45 수명부족',
    input: { mode: 'simple', load: 1500, speed: 500, hours: 16, blocks: 2, sets: 1, dirFactor: 1.3 },
    expect: { P: 1462.5, size: 45, L10km: 12584.806455240308, years: 1.8418227454689597, ratio: 8.99008547008547,
      verdict: '수명 부족', safety: '주의 — 안전율은 충족하나 수명이 5년 미만입니다', nRows: 1 } },
  { label: 'advanced 모멘트하중 → size35 적합 (비교행 2개)',
    input: { mode: 'advanced', load: 400, speed: 400, hours: 12, blocks: 2, sets: 1, dirFactor: 1.0,
      stroke: 600, tn: 0.15, blockDist: 80, railDist: 100, height: 50, eccentric: 30, selectedSizes: [30] },
    expect: { P: 670, size: 35, L10km: 32850.90000000001, years: 5.729323630136988, ratio: 11.511940298507463,
      verdict: '적합', safety: '적합 — 안전율 및 수명 기준 충족', nRows: 2 } },
  { label: 'simple 과하중 → size45 부적합',
    input: { mode: 'simple', load: 9000, speed: 200, hours: 24, blocks: 1, sets: 1, dirFactor: 1.5 },
    expect: { P: 16200, size: 45, L10km: 9.259533802646954, years: 0.002258599159604397, ratio: 0.811604938271605,
      verdict: '부적합', safety: '부적합 — 상위 사이즈 또는 블록 수 증가를 권장합니다', nRows: 1 } },
];

for (const g of GOLDEN) {
  test(`골든: ${g.label}`, () => {
    const r = computeLM(g.input);
    near(r.P, g.expect.P);
    assert.equal(r.recommended.size, g.expect.size, '추천 size');
    near(r.summary.L10km, g.expect.L10km);
    near(r.summary.years, g.expect.years);
    near(r.summary.ratio, g.expect.ratio);
    assert.equal(r.summary.verdict, g.expect.verdict, '판정');
    assert.equal(r.safetyText, g.expect.safety, '안전 문구');
    assert.equal(r.rows.length, g.expect.nRows, '비교행 수');
  });
}

/* ────────────────────────────────────────────────────────────
   C) 고유 불변식 — 시드 PRNG 무작위 입력 100개
   ──────────────────────────────────────────────────────────── */
function makeRng(seed) { let s = seed >>> 0; return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; }; }
const rng = makeRng(20260817);
const pick = (a) => a[Math.floor(rng() * a.length)];
const randIn = (lo, hi) => lo + rng() * (hi - lo);

function randomInput() {
  const mode = pick(['simple', 'advanced']);
  const base = {
    mode,
    load: Math.round(randIn(50, 8000)),
    speed: Math.round(randIn(10, 1000)),
    hours: pick([4, 8, 12, 16, 24]),
    blocks: pick([1, 2, 4]),
    sets: pick([1, 2]),
    dirFactor: pick([1.0, 1.3, 2.0]),
  };
  if (mode === 'advanced') {
    Object.assign(base, {
      stroke: Math.round(randIn(100, 1500)),
      tn: +randIn(0.05, 0.5).toFixed(3),
      blockDist: pick([0, 60, 80, 120]),
      railDist: pick([0, 80, 100, 150]),
      height: pick([0, 30, 50, 100]),
      eccentric: pick([0, 20, 40, 80]),
      selectedSizes: pick([[], [20], [30, 45]]),
    });
  }
  return base;
}

/* getVerdict 임계값을 독립 재현 */
function refVerdict(ratio, years) {
  if (ratio < 3) return '부적합';
  if (ratio < 4) return '주의';
  if (years < LM_MIN_YEARS) return '수명 부족';
  return '적합';
}
/* selectModel 우선순위를 독립 재현 */
function refSelect(input, P, avgSpeed) {
  for (const m of LM_MODELS) {
    const L10 = Math.pow(m.C100 / P, 3) * 100;
    const years = input.mode === 'advanced'
      ? (L10 / ((avgSpeed * 3600 * input.hours) / 1e6)) / 365
      : (L10 / ((input.speed * 0.65 * 3600 * input.hours) / 1e6)) / 365;
    if (m.C0 / P >= 4.0 && years >= LM_MIN_YEARS) return m.size;
  }
  return LM_MODELS[LM_MODELS.length - 1].size;
}
const safetyByVerdict = {
  '적합': '적합 — 안전율 및 수명 기준 충족',
  '수명 부족': '주의 — 안전율은 충족하나 수명이 ' + LM_MIN_YEARS + '년 미만입니다',
  '주의': '주의 — 안전율이 권장 기준(4배)보다 낮습니다',
  '부적합': '부적합 — 상위 사이즈 또는 블록 수 증가를 권장합니다',
};

test('불변식(1): getVerdict 임계값 방향 (경계 포함)', () => {
  for (let i = 0; i < 200; i++) {
    const ratio = randIn(0, 10), years = randIn(0, 30);
    assert.equal(getVerdict(ratio, years).text, refVerdict(ratio, years), `ratio=${ratio} years=${years}`);
  }
  // 경계값
  assert.equal(getVerdict(3, 100).text, '주의');      // ratio=3 → 부적합 아님
  assert.equal(getVerdict(4, LM_MIN_YEARS).text, '적합');
  assert.equal(getVerdict(4, LM_MIN_YEARS - 1e-9).text, '수명 부족');
});

test('불변식(2~6): 무작위 입력 100개', () => {
  for (let i = 0; i < 100; i++) {
    const input = randomInput();
    const r = computeLM(input);
    const ctx = `#${i} ${JSON.stringify(input)} → size${r.recommended.size}`;

    // (6) undefined/NaN 참조 없음
    for (const k of ['size', 'C100', 'C0']) assert.ok(Number.isFinite(r.recommended[k]), `recommended.${k} — ${ctx}`);
    for (const k of ['L10km', 'years', 'ratio']) assert.ok(Number.isFinite(r.summary[k]), `summary.${k} — ${ctx}`);
    assert.ok(typeof r.summary.verdict === 'string' && r.summary.verdict.length > 0, `verdict — ${ctx}`);
    for (const row of r.rows) {
      for (const k of ['size', 'L10km', 'years', 'ratio']) assert.ok(Number.isFinite(row[k]), `row.${k} — ${ctx}`);
      assert.ok(typeof row.verdict === 'string', `row.verdict — ${ctx}`);
    }

    // (2) 요약값 == 비교표의 추천행 값
    const recRow = r.rows.find(x => x.size === r.recommended.size);
    assert.ok(recRow, `추천행 없음 — ${ctx}`);
    near(r.summary.L10km, recRow.L10km); near(r.summary.years, recRow.years);
    near(r.summary.ratio, recRow.ratio); assert.equal(r.summary.verdict, recRow.verdict, `요약↔표 판정 — ${ctx}`);

    // (3) 단위환산 일관성: ratio=C0/P, L10km=(C100/P)^3×100
    near(r.summary.ratio, r.recommended.C0 / r.P);
    near(r.summary.L10km, Math.pow(r.recommended.C100 / r.P, 3) * 100);
    // advanced: years = opHours / (hours×365)
    if (input.mode === 'advanced') {
      near(recRow.years, recRow.opHours / (input.hours * 365));
    }

    // (4) 경고↔조건: safetyText는 판정과 1:1
    assert.equal(r.safetyText, safetyByVerdict[r.summary.verdict], `safety↔verdict — ${ctx}`);
    // 판정은 자기 ratio/years 임계값과 일치
    assert.equal(r.summary.verdict, refVerdict(r.summary.ratio, r.summary.years), `verdict 임계값 — ${ctx}`);

    // (5) selectModel 우선순위: 독립 재현과 추천 size 일치
    assert.equal(r.recommended.size, refSelect(input, r.P, r.avgSpeed), `추천 우선순위 — ${ctx}`);
  }
});
