/**
 * PartsOn 견적 문의 + 오류 신고 수신 웹앱 (Google Apps Script)
 * ─────────────────────────────────────────────────────────────
 * 사용법: 구글 스프레드시트 > 확장 프로그램 > Apps Script 에 아래 doPost 로 교체 후
 *         "배포 관리 > 편집(연필) > 새 버전 > 배포" 로 재배포 (웹앱 URL 유지됨).
 *
 * 프런트(js/common.js)가 보내는 payload:
 *   견적 문의  : { calc, model, spec, inputs, name, phone, email, company, memo, ts, page }
 *   오류 신고  : { type:"error_report", calc, result, inputs, message, email, ts, page }
 *
 * type === "error_report" → "오류신고" 시트 탭 기록 + 제목 "[PartsOn 오류신고]" 메일
 * 그 외(일반 문의)         → "문의" 시트(없으면 첫 시트) 기록 + 제목 "[PartsOn 견적문의]" 메일
 * ─────────────────────────────────────────────────────────────
 */

var NOTIFY_EMAIL = 'airpam@naver.com'; // 알림 받을 주소

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (d.type === 'error_report') {
      handleErrorReport(ss, d);
    } else {
      handleInquiry(ss, d);
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* ── 일반 견적 문의 ── */
function handleInquiry(ss, d) {
  var sheet = ss.getSheetByName('문의') || ss.getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['접수시각', '계산기', '추천모델', '사양', '입력값',
                     '이름', '연락처', '이메일', '회사', '메모', '페이지']);
  }
  sheet.appendRow([
    new Date(), d.calc || '', d.model || '', d.spec || '', d.inputs || '',
    d.name || '', d.phone || '', d.email || '', d.company || '', d.memo || '', d.page || ''
  ]);

  var body = '[PartsOn 견적 문의]\n\n'
    + '계산기: ' + (d.calc || '') + '\n'
    + '추천 모델: ' + (d.model || '') + '\n'
    + '사양: ' + (d.spec || '') + '\n\n'
    + '[입력값]\n' + (d.inputs || '(없음)') + '\n\n'
    + '이름: ' + (d.name || '') + '\n'
    + '연락처: ' + (d.phone || '') + '\n'
    + '이메일: ' + (d.email || '') + '\n'
    + '회사: ' + (d.company || '') + '\n'
    + '메모: ' + (d.memo || '') + '\n'
    + '페이지: ' + (d.page || '');
  MailApp.sendEmail(NOTIFY_EMAIL, '[PartsOn 견적문의] ' + (d.calc || ''), body);
}

/* ── 계산 결과 오류 신고 (별도 탭) ── */
function handleErrorReport(ss, d) {
  var sheet = ss.getSheetByName('오류신고');
  if (!sheet) {
    sheet = ss.insertSheet('오류신고');
  }
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
    + '회신 이메일: ' + (d.email || '(없음)') + '\n'
    + '페이지: ' + (d.page || '');
  MailApp.sendEmail(NOTIFY_EMAIL, '[PartsOn 오류신고] ' + (d.calc || ''), body);
}
