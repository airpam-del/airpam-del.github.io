'use strict';
/**
 * PartsOn 계산기 전체 테스트 실행기
 * 사용법: node tests/run-all.js
 */

const { execSync } = require('child_process');
const path = require('path');

const TEST_FILES = [
  'calc/bearing.calc.test.js',
  'tests/lmguide.test.js',
  'tests/ballscrew.test.js',
  'tests/servo_motor.test.js',
  'tests/screwjack.test.js',
  'tests/pneumatic-cylinder.test.js',
  'tests/solenoid-valve.test.js',
  'tests/pneumatic-gripper.test.js',
  'tests/electric-gripper.test.js',
  'tests/pneumatic-fr-unit.test.js',
  'tests/pneumatic-fitting.test.js',
  'tests/speed-controller.test.js',
  'tests/planetary-gearbox.test.js',
  'tests/cycloidal-gearbox.test.js',
  'tests/harmonic-drive.test.js',
];

const PASS = '✅ PASS';
const FAIL = '❌ FAIL';

const results = [];
let totalPass = 0, totalFail = 0;

console.log('\n══════════════════════════════════════════════════');
console.log('  PartsOn 계산기 테스트 스위트');
console.log('══════════════════════════════════════════════════\n');

for (const file of TEST_FILES) {
  const label = path.basename(file, '.js').replace(/\.calc\.test$/, '').replace(/\.test$/, '');
  try {
    const out = execSync(`node --test ${file}`, {
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    // 통과/실패 카운트 파싱
    const passMatch = out.match(/# pass\s+(\d+)/);
    const failMatch = out.match(/# fail\s+(\d+)/);
    const pass = passMatch ? parseInt(passMatch[1], 10) : 0;
    const fail = failMatch ? parseInt(failMatch[1], 10) : 0;
    totalPass += pass;
    totalFail += fail;
    const status = fail === 0 ? PASS : FAIL;
    results.push({ label, status, pass, fail, error: null });
  } catch (err) {
    // node --test exits with code 1 when tests fail; stderr has details
    const output = (err.stdout || '') + (err.stderr || '');
    const passMatch = output.match(/# pass\s+(\d+)/);
    const failMatch = output.match(/# fail\s+(\d+)/);
    const pass = passMatch ? parseInt(passMatch[1], 10) : 0;
    const fail = failMatch ? parseInt(failMatch[1], 10) : 1;
    totalPass += pass;
    totalFail += fail;
    results.push({ label, status: FAIL, pass, fail, error: output.slice(0, 300) });
  }
}

// 결과 표 출력
const W = 30;
console.log(`${'계산기'.padEnd(W)} ${'결과'.padEnd(8)} 통과  실패`);
console.log('─'.repeat(W + 22));
for (const { label, status, pass, fail } of results) {
  console.log(
    `${label.padEnd(W)} ${status.padEnd(8)} ${String(pass).padStart(4)}  ${String(fail).padStart(4)}`
  );
}
console.log('─'.repeat(W + 22));
console.log(`${'합계'.padEnd(W)} ${''.padEnd(8)} ${String(totalPass).padStart(4)}  ${String(totalFail).padStart(4)}`);
console.log();

if (totalFail > 0) {
  console.log('❌ 실패한 테스트가 있습니다. git push를 중단하세요.\n');
  // 오류 상세 출력
  for (const { label, error } of results.filter(r => r.error)) {
    console.log(`\n── ${label} 오류 ──`);
    console.log(error);
  }
  process.exit(1);
} else {
  console.log(`✅ 전체 ${totalPass}개 테스트 통과. 배포 가능.\n`);
  process.exit(0);
}
