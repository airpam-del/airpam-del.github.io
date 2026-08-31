/**
 * PartsOn 견적 문의 + 오류 신고 수신 웹앱 (Google Apps Script)
 * ─────────────────────────────────────────────────────────────
 * 반영: 구글 스프레드시트 > 확장 프로그램 > Apps Script 에 doPost 를 아래로 교체 →
 *       "배포 관리 > 편집(연필) > 새 버전 > 배포" 로 재배포 (웹앱 URL 유지됨).
 *
 * ▶ 첫 시트(PartsOn문의기록)의 기존 9개 컬럼을 그대로 사용:
 *     A일시 B계산기 C선정모델 D주요사양 E이름 F연락처 G이메일 H회사 I메모
 *   + 입력값(inputs)은 J열에 추가(헤더 자동 생성). 기존 행은 그대로 유지됨.
 * ▶ type === "error_report" → "오류신고" 시트 탭에 기록 + "[PartsOn 오류신고]" 메일.
 *
 * 프런트(js/common.js) payload:
 *   문의 : { calc, model, spec, inputs, name, phone, email, company, memo, ts, page }
 *   신고 : { type:"error_report", calc, result, inputs, message, email, ts, page }
 * ─────────────────────────────────────────────────────────────
 */

var NOTIFY_EMAIL = 'airpam@naver.com'; // 알림 받을 주소

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (d.type === 'error_report') handleErrorReport(ss, d);
    else handleInquiry(ss, d);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* ── 일반 견적 문의 → 첫 시트 (기존 컬럼 유지 + J열 입력값) ── */
function handleInquiry(ss, d) {
  var sheet = ss.getSheets()[0]; // PartsOn문의기록 (첫 시트)
  if (sheet.getRange('J1').getValue() === '') sheet.getRange('J1').setValue('입력값');
  // 기존 순서: 일시, 계산기, 선정모델, 주요사양, 이름, 연락처, 이메일, 회사, 메모, (J)입력값
  sheet.appendRow([
    new Date(), d.calc || '', d.model || '', d.spec || '',
    d.name || '', d.phone || '', d.email || '', d.company || '', d.memo || '', d.inputs || ''
  ]);

  var body = '[PartsOn 견적 문의]\n\n'
    + '계산기: ' + (d.calc || '') + '\n'
    + '추천 모델: ' + (d.model || '') + '\n'
    + '사양: ' + (d.spec || '') + '\n\n'
    + '[입력값]\n' + (d.inputs || '(없음)') + '\n\n'
    + '이름: ' + (d.name || '') + '\n연락처: ' + (d.phone || '') + '\n이메일: ' + (d.email || '') + '\n'
    + '회사: ' + (d.company || '') + '\n메모: ' + (d.memo || '') + '\n페이지: ' + (d.page || '');
  MailApp.sendEmail(NOTIFY_EMAIL, '[PartsOn 견적문의] ' + (d.calc || ''), body);
}

/* ── 계산 결과 오류 신고 → "오류신고" 탭 ── */
function handleErrorReport(ss, d) {
  var sheet = ss.getSheetByName('오류신고');
  if (!sheet) sheet = ss.insertSheet('오류신고');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['접수시각', '계산기', '결과', '입력값', '신고 내용', '회신 이메일', '페이지']);
  }
  sheet.appendRow([
    new Date(), d.calc || '', d.result || '', d.inputs || '', d.message || '', d.email || '', d.page || ''
  ]);

  var body = '[PartsOn 오류신고]\n\n'
    + '계산기: ' + (d.calc || '') + '\n'
    + '결과: ' + (d.result || '') + '\n\n'
    + '[입력값]\n' + (d.inputs || '(없음)') + '\n\n'
    + '신고 내용: ' + (d.message || '') + '\n'
    + '회신 이메일: ' + (d.email || '(없음)') + '\n페이지: ' + (d.page || '');
  MailApp.sendEmail(NOTIFY_EMAIL, '[PartsOn 오류신고] ' + (d.calc || ''), body);
}
