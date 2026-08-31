/**
 * PartsOn 견적 문의 + 오류 신고 수신 웹앱 (Google Apps Script) — 배포본
 * ─────────────────────────────────────────────────────────────
 * 반영: 스프레드시트 > 확장 프로그램 > Apps Script 에 붙여넣고
 *       "배포 관리 > 편집 > 새 버전 > 배포" 로 재배포 (웹앱 URL 유지).
 *       ※ DocumentApp/DriveApp 권한 승인 요청이 뜨면 허용할 것.
 *
 * 문의 : 첫 시트(9열 + J열 입력값) 기록 + PDF 첨부 알림메일 + 문의자 자동회신(PDF)
 * 신고 : type==="error_report" → "오류신고" 탭 기록 + "[PartsOn 오류신고]" 메일
 * ─────────────────────────────────────────────────────────────
 */
const NOTIFY_EMAIL = "partson0717@gmail.com";
const SHEET_ID = "1-6I0vbrIN9yw2o8FPsyJvQvOG8U08XjDXAbr-qD6f8Q";

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SHEET_ID);
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

// ── 견적 문의 ──
function handleInquiry(ss, d) {
  const sheet = ss.getSheets()[0];
  if (sheet.getRange('J1').getValue() === '') sheet.getRange('J1').setValue('입력값');
  const now = new Date();
  sheet.appendRow([
    now, d.calc||'', d.model||'', d.spec||'', d.name||'',
    d.phone||'', d.email||'', d.company||'', d.memo||'', d.inputs||''
  ]);

  const pdf = makeInquiryPdf(d, now);

  // 사장님 알림 (PDF 첨부)
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: "[PartsOn 문의] " + (d.calc||"") + " / " + (d.model||""),
    body:
      "새 견적 문의가 접수되었습니다.\n\n" +
      "계산기: " + (d.calc||"") + "\n선정 모델: " + (d.model||"") + "\n" +
      "주요 사양: " + (d.spec||"") + "\n\n[입력값]\n" + (d.inputs||"(없음)") + "\n\n" +
      "이름: " + (d.name||"") + "\n연락처: " + (d.phone||"") + "\n" +
      "이메일: " + (d.email||"") + "\n회사: " + (d.company||"") + "\n" +
      "메모: " + (d.memo||"") + "\n\n접수시각: " + now,
    attachments: [pdf]
  });

  // 문의자 자동 회신 (PDF 첨부, 이메일 있을 때만)
  if (d.email) {
    MailApp.sendEmail({
      to: d.email,
      subject: "[PartsOn] 문의가 접수되었습니다",
      body:
        "안녕하세요, PartsOn입니다.\n\n" +
        "부품 선정 문의 주셔서 감사합니다. 문의 내용은 정상적으로 접수되었습니다.\n" +
        "문의하신 선정 내용을 PDF로 첨부해 드립니다.\n\n" +
        "현재 PartsOn은 정식 부품 공급 서비스를 준비 중이며, 오픈 전까지는 " +
        "선정 결과에 대한 기술 안내를 우선 도와드리고 있습니다.\n\n" +
        "구매가 급하신 경우 이 메일에 회신 주시면 신속히 안내해 드리겠습니다. " +
        "정식 오픈 시 가장 먼저 소식을 전해드리겠습니다.\n\n" +
        "감사합니다.\nPartsOn 드림 · partson0717@gmail.com",
      attachments: [pdf]
    });
  }
}

// ── 오류 신고 ──
function handleErrorReport(ss, d) {
  let sheet = ss.getSheetByName('오류신고');
  if (!sheet) sheet = ss.insertSheet('오류신고');
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['접수시각','계산기','결과','입력값','신고 내용','회신 이메일','페이지']);
  }
  const now = new Date();
  sheet.appendRow([now, d.calc||'', d.result||'', d.inputs||'', d.message||'', d.email||'', d.page||'']);

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: "[PartsOn 오류신고] " + (d.calc||""),
    body:
      "계산기 오류 신고가 접수되었습니다.\n\n" +
      "계산기: " + (d.calc||"") + "\n결과: " + (d.result||"") + "\n\n" +
      "[입력값]\n" + (d.inputs||"(없음)") + "\n\n" +
      "신고 내용: " + (d.message||"") + "\n" +
      "회신 이메일: " + (d.email||"(없음)") + "\n" +
      "페이지: " + (d.page||"") + "\n\n접수시각: " + now
  });
}

// ── 문의 내용 PDF 생성 ──
function makeInquiryPdf(d, now) {
  const lines = [
    "PartsOn 부품 선정 문의 내역",
    "============================", "",
    "■ 접수시각: " + now, "",
    "■ 계산기: " + (d.calc || "-"),
    "■ 선정 모델: " + (d.model || "-"), "",
    "■ 입력값",
    (d.inputs ? indent(d.inputs) : "  -"), "",
    "■ 주요 사양/결과",
    (d.spec ? indent(d.spec) : "  -"), "",
    "■ 문의자 정보",
    "  이름: " + (d.name || "-"),
    "  연락처: " + (d.phone || "-"),
    "  이메일: " + (d.email || "-"),
    "  회사: " + (d.company || "-"),
    "  메모: " + (d.memo || "-"), "",
    "----------------------------",
    "본 내역은 참고용 사전 검토 자료입니다.",
    "최종 선정은 제조사 카탈로그로 확인하시기 바랍니다.",
    "PartsOn · https://partson.co.kr · partson0717@gmail.com"
  ];
  const doc = DocumentApp.create("PartsOn_문의_" + Utilities.formatDate(now, "Asia/Seoul", "yyyyMMdd_HHmmss"));
  doc.getBody().setText(lines.join("\n"));
  doc.saveAndClose();
  const pdfBlob = DriveApp.getFileById(doc.getId()).getAs("application/pdf").setName("PartsOn_문의내역.pdf");
  DriveApp.getFileById(doc.getId()).setTrashed(true);
  return pdfBlob;
}

function indent(s) {
  return String(s).split("\n").map(function(x){ return "    " + x; }).join("\n");
}
