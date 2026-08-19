'use strict';
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { calcDesignTorque, calcPGLife, judgePG, L_BASE_PG }
  = require('../calc/planetary-gearbox.calc.js');

/* ── calcDesignTorque ── */
test('calcDesignTorque: tLoad × kf', () => {
  assert.equal(calcDesignTorque(50, 1.5), 75);
});

/* ── calcPGLife ── */
test('calcPGLife: tDesign=ratedTorque → L10h = L_BASE_PG', () => {
  assert.equal(calcPGLife(100, 100), L_BASE_PG);
});
test('calcPGLife: tDesign < ratedTorque → 수명 증가', () => {
  assert.ok(calcPGLife(50, 100) > L_BASE_PG);
});
test('calcPGLife: tDesign 작을수록 수명 긺', () => {
  assert.ok(calcPGLife(30, 100) > calcPGLife(60, 100));
});

/* ── judgePG ── */
const SERIES_OK = { series:'TEST', ratios:[5,10,20], torqueRange:[0, 100], maxRpm:5000, bl:10, eff:97 };

test('judgePG: 감속비 없으면 null', () => {
  assert.equal(judgePG(SERIES_OK, 15, 50, 3000, 20, 10000), null);
});
test('judgePG: 백래시 초과 시 null', () => {
  assert.equal(judgePG(SERIES_OK, 10, 50, 3000, 5, 10000), null);
});
test('judgePG: 토크 부족 시 null', () => {
  assert.equal(judgePG(SERIES_OK, 10, 110, 3000, 20, 10000), null);
});
test('judgePG: 조건 충족 시 overall=ok', () => {
  const r = judgePG(SERIES_OK, 10, 50, 3000, 20, 10000);
  assert.ok(r !== null);
  assert.equal(r.overall, 'ok');
});
test('judgePG: rpm 초과 시 overall=bad', () => {
  const r = judgePG(SERIES_OK, 10, 50, 6000, 20, 10000);
  assert.equal(r.overall, 'bad');
});
test('judgePG: 수명 부족 시 overall=warn', () => {
  // L10h < lh → warn
  const r = judgePG(SERIES_OK, 10, 99, 3000, 20, L_BASE_PG * 1000);
  assert.equal(r.overall, 'warn');
});

/* ── 불변식 ── */
test('불변식: overall=ok이면 rpmOk=true && lifeOk=true', () => {
  for (const tDesign of [10, 30, 60, 90]) {
    const r = judgePG(SERIES_OK, 10, tDesign, 3000, 20, 10000);
    if (r && r.overall === 'ok') {
      assert.ok(r.rpmOk && r.lifeOk);
    }
  }
});
test('불변식: overall=bad이면 rpmOk=false or lifeGrade=bad', () => {
  const r = judgePG(SERIES_OK, 10, 50, 6000, 20, 10000);
  if (r && r.overall === 'bad') {
    assert.ok(!r.rpmOk || !r.lifeOk);
  }
});
