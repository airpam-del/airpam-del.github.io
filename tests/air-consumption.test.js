'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 공기 소비량·비용 계산 테스트 — 순수 Node
   대상: ../calc/air-consumption.calc.js (air-consumption.html 무손실 사본)
   공식: CR=(P+0.1013)/0.1013, 복동 V=(A_head+A_rod)·L·CR, 비용=투명 산술
   ══════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { computeAC, compRatio, STD_ROD, DEFAULTS, P_ATM } = require('../calc/air-consumption.calc.js');

const near = (a, b, rel = 1e-9) => {
  if (a === b) return;
  const d = Math.abs(a - b), s = Math.max(Math.abs(a), Math.abs(b), 1);
  assert.ok(d / s <= rel, `expected ${a} ≈ ${b}`);
};

/* ── A) SMC 카탈로그 선정 예제 재현 ── */
// 보어50·스트로크600·0.5MPa·복동 → 1사이클 ≈ 12.87 L (SMC 표기 13 L)
test('카탈로그: 보어50·스트로크600·0.5MPa·복동 → 1사이클 ≈12.87 L (SMC 13 L)', () => {
  const r = computeAC({ bore:50, stroke:600, pressure:0.5, acting:'double', cyclesPerMin:1, numCylinders:1 });
  near(r.CR, (0.5 + 0.1013) / 0.1013, 1e-9);
  assert.equal(r.rod, 20);                       // STD_ROD[50]
  assert.ok(r.perCycle.extendL > 6.98 && r.perCycle.extendL < 7.00, `extend=${r.perCycle.extendL}`);
  assert.ok(r.perCycle.retractL > 5.86 && r.perCycle.retractL < 5.88, `retract=${r.perCycle.retractL}`);
  assert.ok(r.perCycle.totalL > 12.8 && r.perCycle.totalL < 12.95, `total=${r.perCycle.totalL}`);
  assert.equal(Math.round(r.perCycle.totalL), 13); // 카탈로그 반올림 일치
});

// SMC 전체 예제: 위 실린더 ×10회/분 ×5대 (배관 제외) → ≈643 L/min (SMC 650, 13×10×5 반올림)
test('카탈로그: ×10회/분 ×5대 → ≈643 L/min (SMC 650 반올림)', () => {
  const r = computeAC({ bore:50, stroke:600, pressure:0.5, acting:'double', cyclesPerMin:10, numCylinders:5 });
  assert.ok(r.flowLpm > 642 && r.flowLpm < 644, `flow=${r.flowLpm}`);
});

// 단동: 전진만 공압 → 복동의 전진분과 동일(후진 0)
test('단동: 후진 소비 0, 총=전진분', () => {
  const r = computeAC({ bore:50, stroke:600, pressure:0.5, acting:'single', cyclesPerMin:1, numCylinders:1 });
  assert.equal(r.perCycle.retractL, 0);
  near(r.perCycle.totalL, r.perCycle.extendL, 1e-12);
});

// 압축비 정의
test('압축비 CR=(P+0.1013)/0.1013', () => {
  assert.ok(compRatio(0.5) > 5.93 && compRatio(0.5) < 5.94, `CR0.5=${compRatio(0.5)}`);
  near(compRatio(0.7), (0.7 + P_ATM) / P_ATM, 1e-12);
  near(compRatio(0), 1, 1e-12);
});

/* ── B) 비용 환산 체인 (투명 산술) ── */
test('비용: 월 공기량→전력→전기료 체인', () => {
  const r = computeAC({ bore:40, stroke:300, pressure:0.5, acting:'double', cyclesPerMin:20, numCylinders:2,
                        hoursPerDay:8, daysPerMonth:22, specificEnergy:0.11, rate:170 });
  const minMonth = 8 * 60 * 22;
  near(r.cost.minPerMonth, minMonth, 1e-9);
  near(r.cost.airM3Month, (r.flowLpm / 1000) * minMonth, 1e-9);
  near(r.cost.energyKwhMonth, r.cost.airM3Month * 0.11, 1e-9);
  near(r.cost.costMonth, r.cost.energyKwhMonth * 170, 1e-9);
  near(r.cost.costYear, r.cost.costMonth * 12, 1e-9);
});

// 기본 계수 적용 (미지정 시 DEFAULTS)
test('비용: 계수 미지정 시 DEFAULTS 적용', () => {
  const r = computeAC({ bore:32, stroke:200, pressure:0.6, acting:'double', cyclesPerMin:15, numCylinders:1 });
  assert.equal(r.cost.specificEnergy, DEFAULTS.specificEnergy);
  assert.equal(r.cost.rate, DEFAULTS.rate);
  assert.equal(r.cost.hoursPerDay, DEFAULTS.hoursPerDay);
  assert.equal(r.cost.daysPerMonth, DEFAULTS.daysPerMonth);
});

// 배관 옵션: 튜브 충전분이 1사이클에 가산
test('배관 옵션: 튜브 충전분 가산 (없으면 0)', () => {
  const base = computeAC({ bore:50, stroke:600, pressure:0.5, acting:'double', cyclesPerMin:1, numCylinders:1 });
  const pipe = computeAC({ bore:50, stroke:600, pressure:0.5, acting:'double', cyclesPerMin:1, numCylinders:1, tubeId:4, tubeLength:2 });
  assert.equal(base.perCycle.pipingL, 0);
  assert.ok(pipe.perCycle.pipingL > 0);
  near(pipe.perCycle.totalL, base.perCycle.totalL + pipe.perCycle.pipingL, 1e-9);
});

/* ── C) 불변식 — 시드 랜덤 200개 ── */
function makeRng(seed){let s=seed>>>0;return()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;}}
const rng = makeRng(20261013);
const pick = (a) => a[Math.floor(rng() * a.length)];

test('불변식: 무작위 입력 200개', () => {
  let dblSeen = 0, sglSeen = 0;
  for (let i = 0; i < 200; i++) {
    const bore = pick([12,16,20,25,32,40,50,63,80,100,125,160,200]);
    const input = {
      bore, stroke: Math.round(10 + rng()*990), pressure: pick([0.3,0.4,0.5,0.6,0.7]),
      acting: pick(['single','double']), cyclesPerMin: pick([1,5,10,20,40,60]),
      numCylinders: pick([1,1,2,4]),
      tubeId: pick([0,0,4,6]), tubeLength: pick([0,1,2,5]),
      specificEnergy: pick([0.10,0.11,0.12,0.13]), rate: pick([120,150,170,200]),
      hoursPerDay: pick([8,16,24]), daysPerMonth: pick([20,22,30]),
    };
    const r = computeAC(input);
    const ctx = `#${i} ${JSON.stringify(input)}`;
    const CR = (input.pressure + P_ATM) / P_ATM;
    near(r.CR, CR, 1e-12);
    // 면적·소비
    const Ah = Math.PI/4*bore*bore, Ar = Ah - Math.PI/4*r.rod*r.rod;
    near(r.perCycle.extendL, Ah*input.stroke*CR/1e6, 1e-9);
    const expRet = input.acting==='double' ? Ar*input.stroke*CR/1e6 : 0;
    near(r.perCycle.retractL, expRet, 1e-9);
    const expPipe = (input.tubeId>0 && input.tubeLength>0) ? (Math.PI/4*input.tubeId*input.tubeId)*(input.tubeLength*1000)*CR/1e6 : 0;
    near(r.perCycle.pipingL, expPipe, 1e-9);
    near(r.perCycle.totalL, r.perCycle.extendL + expRet + expPipe, 1e-9);
    // 유량·비용 체인
    near(r.flowLpm, r.perCycle.totalL * input.cyclesPerMin * input.numCylinders, 1e-9);
    const minMonth = input.hoursPerDay*60*input.daysPerMonth;
    near(r.cost.airM3Month, (r.flowLpm/1000)*minMonth, 1e-9);
    near(r.cost.energyKwhMonth, r.cost.airM3Month*input.specificEnergy, 1e-9);
    near(r.cost.costMonth, r.cost.energyKwhMonth*input.rate, 1e-9);
    // 단동 ≤ 복동(같은 조건 후진분만큼)
    if (input.acting==='single') { assert.equal(r.perCycle.retractL, 0); sglSeen++; } else dblSeen++;
    // 유한성·비음수
    for (const k of ['extendL','retractL','pipingL','totalL']) assert.ok(Number.isFinite(r.perCycle[k]) && r.perCycle[k] >= 0, `${k} — ${ctx}`);
    assert.ok(r.cost.costMonth >= 0 && Number.isFinite(r.cost.costMonth), `cost — ${ctx}`);
  }
  assert.ok(dblSeen > 0 && sglSeen > 0, `분기 미관측 d=${dblSeen} s=${sglSeen}`);
});
