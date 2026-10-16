'use strict';
/* ══════════════════════════════════════════════════════════════
   PartsOn 전동 액추에이터 계산 테스트 — 순수 Node
   대상: ../calc/electric-actuator.calc.js (electric-actuator.html 무손실 사본)
   SMC LEY 사양표(워크로드H/V·푸싱력·최대속도·스트로크) 대조 선정
   ══════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert   = require('node:assert/strict');
const { LEY, leyCombos, selectActuator } = require('../calc/electric-actuator.calc.js');

/* ── A) 데이터·조합 ── */
test('leyCombos: 4사이즈×3리드 = 12조합, 카탈로그 앵커값', () => {
  const c = leyCombos();
  assert.equal(c.length, 12);
  // 카탈로그 일치 앵커: LEY25 리드3 푸싱력 452, LEY32 리드4 707, LEY40 최대 워크로드 60H/53V
  const l25_3 = c.find(x => x.size === 'LEY25' && x.lead === 3);
  assert.equal(l25_3.pushF, 452);
  const l32_4 = c.find(x => x.size === 'LEY32' && x.lead === 4);
  assert.equal(l32_4.pushF, 707);
  const l40_4 = c.find(x => x.size === 'LEY40' && x.lead === 4);
  assert.equal(l40_4.workH, 60); assert.equal(l40_4.workV, 53);
});

/* ── B) 골든 선정 ── */
test('골든: 10kg 수평·200mm/s·100스트로크 → LEY16 리드5', () => {
  const r = selectActuator({ load:10, speed:200, stroke:100, ori:'h', push:null });
  assert.ok(r.rec);
  assert.equal(r.rec.size, 'LEY16');
  assert.equal(r.rec.lead, 5);
  assert.equal(r.rec.workLoad, 11);       // 수평 워크로드
});

test('골든: 푸싱력 500N 요구 → 최소 사이즈 LEY32 리드4 (707N)', () => {
  const r = selectActuator({ load:5, speed:100, stroke:50, ori:'h', push:500 });
  assert.ok(r.rec);
  assert.equal(r.rec.size, 'LEY32');
  assert.equal(r.rec.lead, 4);
  assert.ok(r.rec.pushF >= 500);
});

test('골든: 100kg → 적합 모델 없음(최대 워크로드 60kg 초과)', () => {
  const r = selectActuator({ load:100, speed:100, stroke:100, ori:'h', push:null });
  assert.equal(r.rec, null);
  assert.ok(r.combos.every(c => !c.adequate));
});

test('좌굴 경고: 수직 + 스트로크 > 85% 최대', () => {
  const r = selectActuator({ load:5, speed:50, stroke:460, ori:'v', push:null });
  const l32 = r.combos.find(c => c.size === 'LEY32' && c.lead === 4); // strokeMax 500
  assert.ok(l32.buckling);                 // 460 > 0.85*500=425
  const l16 = r.combos.find(c => c.size === 'LEY16' && c.lead === 10); // strokeMax 300
  assert.ok(!l16.strokeOk);                // 460 > 300
});

/* ── C) 불변식 — 시드 랜덤 200개 ── */
function makeRng(seed){let s=seed>>>0;return()=>{s=(1664525*s+1013904223)>>>0;return s/4294967296;}}
const rng = makeRng(20261016);
const pick = (a) => a[Math.floor(rng() * a.length)];
const sizeOrder = { LEY16:1, LEY25:2, LEY32:3, LEY40:4 };

test('불변식: 무작위 입력 200개', () => {
  let recSeen = 0, nullSeen = 0;
  for (let i = 0; i < 200; i++) {
    const input = {
      load: Math.round(rng()*80*10)/10, speed: pick([50,100,150,250,400,500]),
      stroke: Math.round(rng()*520), ori: pick(['h','v']), push: pick([null,50,200,500,900]),
    };
    const r = selectActuator(input);
    const ctx = `#${i} ${JSON.stringify(input)}`;
    // 판정 ↔ 조건
    for (const c of r.combos) {
      const wl = input.ori === 'v' ? c.workV : c.workH;
      assert.equal(c.workLoad, wl);
      assert.equal(c.loadOk, wl >= input.load);
      assert.equal(c.speedOk, c.vmax >= input.speed);
      assert.equal(c.strokeOk, c.strokeMax >= input.stroke);
      assert.equal(c.pushOk, input.push == null ? true : c.pushF >= input.push);
      assert.equal(c.adequate, c.loadOk && c.speedOk && c.strokeOk && c.pushOk);
      assert.equal(c.buckling, input.ori === 'v' && input.stroke > 0.85 * c.strokeMax);
    }
    // 추천 = 적합 중 최소 사이즈 → 최대 리드
    const adeq = r.combos.filter(c => c.adequate);
    if (adeq.length) {
      adeq.sort((a,b) => sizeOrder[a.size]-sizeOrder[b.size] || b.lead-a.lead);
      assert.equal(r.rec.size, adeq[0].size, `추천 사이즈 — ${ctx}`);
      assert.equal(r.rec.lead, adeq[0].lead, `추천 리드 — ${ctx}`);
      recSeen++;
    } else {
      assert.equal(r.rec, null, `무적합 null — ${ctx}`);
      nullSeen++;
    }
  }
  assert.ok(recSeen > 20 && nullSeen > 0, `분기 미관측 rec=${recSeen} null=${nullSeen}`);
});
