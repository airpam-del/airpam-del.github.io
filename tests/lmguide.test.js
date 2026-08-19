'use strict';
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { calcAvgSpeed, getfw, getVerdict, selectModel, calcL10km, LM_MODELS, LM_MIN_YEARS }
  = require('../calc/lmguide.calc.js');

const near = (a, b, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) <= eps, `expected ${a} ≈ ${b}`);

/* ── calcAvgSpeed ── */
test('calcAvgSpeed: 등속 구간 없는 경우 constDist=0', () => {
  const r = calcAvgSpeed(500, 100, 0.2); // 가감속만으로 스트로크 초과
  assert.ok(r.constDist === 0);
});
test('calcAvgSpeed: 일반 사다리꼴 프로파일', () => {
  const r = calcAvgSpeed(500, 500, 0.1);
  near(r.accelDist, 0.5 * 500 * 0.1); // 25mm
  near(r.constDist, 500 - 50);        // 450mm
  assert.ok(r.avgSpeed > 0 && r.avgSpeed <= 500);
});

/* ── getfw ── */
test('getfw: 속도 구간별 하중계수', () => {
  assert.equal(getfw(0),   1.0);
  assert.equal(getfw(50),  1.0);
  assert.equal(getfw(51),  1.2);
  assert.equal(getfw(300), 1.2);
  assert.equal(getfw(301), 1.5);
  assert.equal(getfw(600), 1.5);
  assert.equal(getfw(601), 1.8);
});

/* ── getVerdict ── */
test('getVerdict: ratio<3 → 부적합', () => {
  assert.equal(getVerdict(2.9, 10).text, '부적합');
});
test('getVerdict: ratio 3~4 → 주의', () => {
  assert.equal(getVerdict(3.5, 10).text, '주의');
});
test('getVerdict: ratio≥4 & years<MIN → 수명 부족', () => {
  assert.equal(getVerdict(4.5, LM_MIN_YEARS - 0.1).text, '수명 부족');
});
test('getVerdict: ratio≥4 & years≥MIN → 적합', () => {
  assert.equal(getVerdict(4.5, LM_MIN_YEARS).text, '적합');
});

/* ── selectModel ── */
test('selectModel: 낮은 하중에서 최소 사이즈 선택', () => {
  const m = selectModel(10, 100, 8, 'simple');
  assert.ok(LM_MODELS.some(x => x.size === m.size));
});
test('selectModel: 반드시 LM_MODELS 중 하나 반환', () => {
  const m = selectModel(9999, 1000, 24, 'simple');
  assert.ok(LM_MODELS.includes(m));
});

/* ── 불변식: 추천 모델은 C0/P ≥ 4.0 or 마지막 모델 ── */
test('불변식: 추천 모델의 C0/P ≥ 4.0 또는 카탈로그 최대', () => {
  for (let P = 20; P <= 5000; P += 200) {
    const m = selectModel(P, 300, 8, 'simple');
    const ratio = m.C0 / P;
    // ratio < 4이면 마지막 모델이어야 함
    if (ratio < 4.0) {
      assert.equal(m.size, LM_MODELS[LM_MODELS.length - 1].size,
        `P=${P}: ratio=${ratio.toFixed(2)}이지만 마지막 모델 아님`);
    }
  }
});

/* ── calcL10km ── */
test('calcL10km: L10km = (C100/P)^3 × 100', () => {
  near(calcL10km(1000, 200), Math.pow(5, 3) * 100, 1e-6);
});
