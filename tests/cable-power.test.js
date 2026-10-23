'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn · 금강케이블 전력케이블(VV/CV) 선정 테스트 — 순수 Node
   대상: ../calc/cable-power.calc.js (cable-power.html 무손실 사본)
   ΔV=k·I·R·L/1000, 보정 허용전류 = 기준(IEC 60364-5-52 B.52.2~5) × k_온도 × k_집합
   ══════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { computePower, powerToCurrent, tempFactor, groupFactor, R_OHM, AMP_BASE, METHODS, TEMP_AIR, TEMP_GND, GROUP } = require('../calc/cable-power.calc.js');

const near = (a, b, rel = 1e-9) => {
  if (a === b) return;
  const d = Math.abs(a - b), s = Math.max(Math.abs(a), Math.abs(b), 1);
  assert.ok(d / s <= rel, `expected ${a} ≈ ${b}`);
};
const sq = (r, v) => r.results.find(x => x.sq === v);

/* ── A) 전압강하식 + 추천(단상, 전압강하 지배) — 기본 방법 C·30℃·1회로 ── */
test('단상 220V·20A·50m·VV·3% → 6SQ (전압강하 기준)', () => {
  const r = computePower({ cableType:'VV', phase:'1p', voltage:220, currentA:20, lengthM:50, dropPct:3 });
  assert.equal(r.method, 'C'); assert.equal(r.kTemp, 1); assert.equal(r.kGroup, 1);
  near(sq(r, 2.5).vdV, 2 * 20 * 7.41 * 0.05, 1e-9);        // 14.82 V
  near(sq(r, 6).vdPct, (2 * 20 * 3.08 * 0.05) / 220 * 100, 1e-9); // 2.8%
  assert.ok(!sq(r, 4).vdOk);                                // 4.19% > 3
  assert.ok(sq(r, 6).vdOk && sq(r, 6).ampOk);
  assert.equal(r.recommended.sq, 6);
});

/* ── B) 허용전류 지배(짧은 긍장·큰 전류) — 기본 방법 C ── */
test('단상 220V·50A·5m·VV → 허용전류가 10SQ 강제', () => {
  const r = computePower({ cableType:'VV', phase:'1p', currentA:50, lengthM:5, dropPct:3 });
  assert.equal(sq(r, 6).amp, 46);                           // VV C 2선 6SQ=46 < 50
  assert.ok(!sq(r, 6).ampOk);
  assert.ok(sq(r, 10).ampOk);                               // 10SQ=63 ≥ 50
  assert.equal(r.recommended.sq, 10);
});

/* ── C) CV가 VV보다 기준 허용전류 큼 (모든 방법·도체수) ── */
test('기준 허용전류: CV(XLPE) > VV(PVC) 동일 SQ', () => {
  for (const m of ['A1','B1','C','D']) for (const ld of [2,3]) for (const s of [1.5,2.5,4,6,10]) {
    assert.ok(AMP_BASE.CV[m][ld][s] > AMP_BASE.VV[m][ld][s], `CV>${m}/${ld}/${s}SQ`);
  }
});

/* ── D) 3상 √3 계수 ── */
test('3상 전압강하 계수 √3', () => {
  const r = computePower({ cableType:'CV', phase:'3p', voltage:380, currentA:30, lengthM:40, dropPct:3 });
  near(sq(r, 4).vdV, Math.sqrt(3) * 30 * 4.61 * 0.04, 1e-9);
  assert.equal(r.loaded, 3);
});

/* ── E) 전력→전류 도우미 ── */
test('powerToCurrent: 3상 380V 10kW pf0.9, 단상 220V 2kW pf0.9', () => {
  near(powerToCurrent(10, 380, 0.9, '3p'), 10000 / (Math.sqrt(3) * 380 * 0.9), 1e-9);
  near(powerToCurrent(2, 220, 0.9, '1p'), 2000 / (220 * 0.9), 1e-9);
  assert.equal(powerToCurrent(0, 380, 0.9, '3p'), 0);
});

/* ── F) 초과 → 추천 없음 ── */
test('과대 조건 → 추천 없음 + 경고', () => {
  const r = computePower({ cableType:'VV', phase:'1p', currentA:30, lengthM:500, dropPct:3 });
  assert.equal(r.recommended, null);                        // 10SQ도 전압강하 초과
  assert.ok(r.notes.some(n => n.includes('10SQ')));
});

/* ── G) 설치방식: A1(최저) < B1 < C, D 는 지중 ── */
test('설치방식별 기준 허용전류 대소: A1 < B1 < C', () => {
  for (const t of ['VV','CV']) for (const ld of [2,3]) for (const s of [1.5,2.5,4,6,10]) {
    assert.ok(AMP_BASE[t].A1[ld][s] <= AMP_BASE[t].B1[ld][s], `A1<=B1 ${t}/${ld}/${s}`);
    assert.ok(AMP_BASE[t].B1[ld][s] <= AMP_BASE[t].C[ld][s],  `B1<=C ${t}/${ld}/${s}`);
  }
});

test('방법 A1 이 C 보다 보수적 → 더 굵은 SQ', () => {
  const base = { cableType:'VV', phase:'1p', voltage:220, currentA:42, lengthM:10, dropPct:3 };
  const rC  = computePower({ ...base, method:'C' });
  const rA1 = computePower({ ...base, method:'A1' });
  assert.equal(rC.recommended.sq, 6);   // C: 6SQ=46 ≥ 42
  assert.equal(rA1.recommended.sq, 10); // A1: 6SQ=34 < 42 → 10SQ=46
});

/* ── H) 주위온도 보정 (B.52.14 기중) ── */
test('온도보정: 표값·선형보간·클램프', () => {
  assert.equal(tempFactor('VV','air',30), 1.0);
  assert.equal(tempFactor('VV','air',40), 0.87);
  assert.equal(tempFactor('CV','air',40), 0.91);
  near(tempFactor('VV','air',37.5), (0.94 + 0.87) / 2, 1e-12); // 35↔40 보간
  assert.equal(tempFactor('VV','air',5),  TEMP_AIR.VV[10]);    // 하한 클램프
  assert.equal(tempFactor('CV','air',999), TEMP_AIR.CV[80]);   // 상한 클램프
  assert.equal(tempFactor('VV','ground',20), 1.0);             // 지중 기준 20℃
  assert.equal(tempFactor('VV','ground',30), TEMP_GND.VV[30]); // 0.89
});

test('고온 45℃ → 보정으로 더 굵은 SQ', () => {
  const base = { cableType:'VV', phase:'1p', voltage:220, currentA:42, lengthM:10, dropPct:3, method:'C' };
  const r30 = computePower({ ...base, ambientC:30 });
  const r45 = computePower({ ...base, ambientC:45 });
  assert.equal(r30.recommended.sq, 6);                 // 6SQ=46 ≥ 42
  assert.equal(r45.kTemp, 0.79);
  assert.equal(sq(r45, 6).amp, Math.round(46 * 0.79 * 10) / 10); // 36.3 < 42
  assert.ok(!sq(r45, 6).ampOk);
  assert.equal(r45.recommended.sq, 10);                // 10SQ=63×0.79=49.8 ≥ 42
});

/* ── I) 집합 보정 (B.52.17) ── */
test('집합보정: 표값·보수적 올림', () => {
  assert.equal(groupFactor(1), 1.0);
  assert.equal(groupFactor(3), 0.70);
  assert.equal(groupFactor(9), 0.50);
  assert.equal(groupFactor(10), 0.45);  // 표에 없음 → 다음 키 12=0.45 (보수적)
  assert.equal(groupFactor(100), 0.38); // 상한 클램프
});

test('집합 3회로 → 보정으로 더 굵은 SQ', () => {
  const base = { cableType:'VV', phase:'1p', voltage:220, currentA:42, lengthM:10, dropPct:3, method:'C' };
  const r1 = computePower({ ...base, circuits:1 });
  const r3 = computePower({ ...base, circuits:3 });
  assert.equal(r1.recommended.sq, 6);
  assert.equal(r3.kGroup, 0.70);
  assert.equal(sq(r3, 6).amp, Math.round(46 * 0.70 * 10) / 10); // 32.2 < 42
  assert.equal(r3.recommended.sq, 10);                          // 63×0.70=44.1 ≥ 42
});

/* ── J) 불변식 — 시드 랜덤 300개 (방법·온도·집합 포함) ── */
function makeRng(seed){let s=seed>>>0;return()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;}}
const rng = makeRng(20261024);
const pick = (a) => a[Math.floor(rng() * a.length)];

test('불변식: 무작위 입력 300개', () => {
  let recSeen = 0, nullSeen = 0;
  for (let i = 0; i < 300; i++) {
    const phase = pick(['1p','3p']);
    const type = pick(['VV','CV']);
    const method = pick(['A1','B1','C','D']);
    const ambientC = pick([null, 20, 30, 40, 45, 37]);
    const circuits = pick([1, 2, 3, 6, 10]);
    const input = { cableType:type, phase, voltage: phase==='3p'?380:220,
      currentA: Math.round(rng()*80), lengthM: Math.round(rng()*400), dropPct: pick([2,3,5]), cores: pick([2,3,4]),
      method, ambientC, circuits };
    const r = computePower(input);
    const k = phase==='3p'?Math.sqrt(3):2, loaded = phase==='3p'?3:2;
    const env = METHODS[method].env, refT = METHODS[method].ref;
    const at = (ambientC==null) ? refT : ambientC;
    const kT = tempFactor(type, env, at), kG = groupFactor(circuits);
    for (const x of r.results) {
      near(x.R, R_OHM[x.sq], 1e-12);
      near(x.vdV, k*input.currentA*R_OHM[x.sq]*(input.lengthM/1000), 1e-9);
      near(x.vdPct, input.voltage>0 ? x.vdV/input.voltage*100 : 0, 1e-9);
      assert.equal(x.baseAmp, AMP_BASE[type][method][loaded][x.sq]);
      assert.equal(x.amp, Math.round(AMP_BASE[type][method][loaded][x.sq] * kT * kG * 10) / 10);
      assert.equal(x.vdOk, x.vdPct <= input.dropPct);
      assert.equal(x.ampOk, x.amp >= input.currentA);
      assert.equal(x.ok, x.vdOk && x.ampOk);
    }
    const passing = r.results.filter(x => x.ok);
    if (passing.length) { assert.equal(r.recommended.sq, passing[0].sq); recSeen++; }
    else { assert.equal(r.recommended, null); nullSeen++; }
  }
  assert.ok(recSeen > 20 && nullSeen > 0, `rec=${recSeen} null=${nullSeen}`);
});
