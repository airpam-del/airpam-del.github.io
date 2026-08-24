'use strict';
/**
 * PartsOn 계산기 전체 테스트 실행기
 * 사용법: node tests/run-all.js
 * 각 계산기 테스트를 순차 실행하고 [계산기 / 통과·실패 / 실패 내용] 표로 요약한다.
 */
const { execSync } = require('child_process');
const path = require('path');

const TEST_FILES = [
  'tests/bearing.test.js',
  'tests/lmguide.test.js',
  'tests/ballscrew.test.js',
  'tests/servo_motor.test.js',
  'tests/screwjack.test.js',
  'tests/planetary-gearbox.test.js',
  'tests/cycloidal-gearbox.test.js',
  'tests/harmonic-drive.test.js',
  'tests/electric-gripper.test.js',
  'tests/pneumatic-cylinder.test.js',
  'tests/solenoid-valve.test.js',
  'tests/pneumatic-fitting.test.js',
  'tests/pneumatic-fr-unit.test.js',
  'tests/pneumatic-gripper.test.js',
  'tests/speed-controller.test.js',
];

// node --test 출력에서 pass/fail 카운트 (ℹ pass N / # pass N 두 형식 모두 지원)
function parseCount(out, key) {
  const m = out.match(new RegExp('(?:#|\\u2139)\\s*' + key + '\\s+(\\d+)'));
  return m ? parseInt(m[1], 10) : null;
}
// 첫 실패 요지 추출 (실패 내용)
function firstFailure(out) {
  const lines = out.split(/\r?\n/);
  // "✖ ..." 또는 "not ok" 라인 + AssertionError 메시지
  const failLine = lines.find(l => /^\s*✖/.test(l) && !/failing tests/.test(l));
  const errLine  = lines.find(l => /AssertionError|Error:/.test(l));
  const pick = (errLine || failLine || '').trim().replace(/\s+/g, ' ');
  return pick.slice(0, 80);
}

const results = [];
let totalPass = 0, totalFail = 0;

for (const file of TEST_FILES) {
  const label = path.basename(file, '.js').replace(/\.test$/, '');
  let out = '', ok = true;
  try {
    out = execSync(`node --test ${file}`, { cwd: path.resolve(__dirname, '..'), encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (err) {
    ok = false;
    out = (err.stdout || '') + '\n' + (err.stderr || '');
  }
  const pass = parseCount(out, 'pass');
  const fail = parseCount(out, 'fail');
  const p = pass == null ? 0 : pass;
  const f = fail == null ? (ok ? 0 : 1) : fail;
  totalPass += p; totalFail += f;
  results.push({ label, pass: p, fail: f, detail: f > 0 ? firstFailure(out) : '' });
}

// ── 요약 표 ──
console.log('\n══════════════════════════════════════════════════════════════════════');
console.log('  PartsOn 계산기 테스트 스위트 — 골든 + 불변식');
console.log('══════════════════════════════════════════════════════════════════════\n');

const W = 24;
console.log(`${'계산기'.padEnd(W)}  결과   통과 실패  실패 내용`);
console.log('─'.repeat(70));
for (const r of results) {
  const mark = r.fail === 0 ? '✅' : '❌';
  console.log(
    `${r.label.padEnd(W)}  ${mark}    ${String(r.pass).padStart(3)}  ${String(r.fail).padStart(3)}  ${r.detail}`
  );
}
console.log('─'.repeat(70));
console.log(`${'합계 (' + results.length + '종)'.padEnd(W)}  ${totalFail === 0 ? '✅' : '❌'}    ${String(totalPass).padStart(3)}  ${String(totalFail).padStart(3)}`);
console.log();

if (totalFail > 0) {
  console.log(`❌ 실패 ${totalFail}건 — push 중단 권장.\n`);
  process.exit(1);
} else {
  console.log(`✅ 전체 ${results.length}종 · ${totalPass}개 테스트 통과.\n`);
  process.exit(0);
}
