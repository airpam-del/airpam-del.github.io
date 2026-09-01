/* ═══════════════════════════════════════════════════════════════
   PartsOn 공통 스크립트 — 네비게이션 단일 출처
   ---------------------------------------------------------------
   ▶ 새 계산기 추가 절차: 아래 CALCULATORS 배열에 1줄 추가하면
     전 계산기 페이지의 데스크톱 드롭다운 + 모바일 햄버거 메뉴가
     자동 반영됩니다. (index.html 버튼·통계는 index 자체 스크립트에서
     같은 배열을 재사용 — index-nav.js 참고)
   ▶ 라벨: desk = 데스크톱 드롭다운 표기, mob = 모바일 메뉴 표기
     (일부 항목은 데스크톱에서 축약 표기라 두 라벨이 다름)
   ═══════════════════════════════════════════════════════════════ */
var CALCULATORS = [
  { file: 'lmguide.html',           cat: 'electric',  desk: 'LM Guide',          mob: 'LM Guide 선정' },
  { file: 'ballscrew.html',         cat: 'electric',  desk: '볼스크류 선정',       mob: '볼스크류 선정' },
  { file: 'bearing.html',           cat: 'electric',  desk: '베어링 선정',         mob: '베어링 선정' },
  { file: 'servo_motor.html',       cat: 'electric',  desk: '서보모터 선정',       mob: '서보모터 선정' },
  { file: 'screwjack.html',         cat: 'electric',  desk: '스크류잭 선정',       mob: '스크류잭 선정' },
  { file: 'planetary-gearbox.html', cat: 'electric',  desk: '유성 감속기',         mob: '유성 감속기 선정' },
  { file: 'cycloidal-gearbox.html', cat: 'electric',  desk: '사이클로이드',        mob: '사이클로이드 선정' },
  { file: 'harmonic-drive.html',    cat: 'electric',  desk: '하모닉 드라이브',      mob: '하모닉 드라이브 선정' },
  { file: 'electric-gripper.html',  cat: 'electric',  desk: '전동 그리퍼 선정',     mob: '전동 그리퍼 선정' },
  { file: 'coupling.html',          cat: 'electric',  desk: '커플링 선정',         mob: '커플링 선정' },
  { file: 'timing-belt.html',       cat: 'electric',  desk: '타이밍벨트 선정',      mob: '타이밍벨트·풀리 선정' },
  { file: 'linear-motor.html',      cat: 'electric',  desk: '리니어모터 선정',      mob: '리니어모터 선정' },
  { file: 'electric-actuator.html', cat: 'electric',  desk: '전동 액추에이터 선정',   mob: '전동 액추에이터 선정' },
  { file: 'pneumatic-cylinder.html',cat: 'pneumatic', desk: '실린더 선정',         mob: '실린더 선정' },
  { file: 'solenoid-valve.html',    cat: 'pneumatic', desk: '솔레노이드 밸브 선정',  mob: '솔레노이드 밸브 선정' },
  { file: 'pneumatic-fitting.html', cat: 'pneumatic', desk: '피팅/튜빙 선정',      mob: '피팅/튜빙 선정' },
  { file: 'pneumatic-fr-unit.html', cat: 'pneumatic', desk: '공기압 조절 유닛 선정', mob: '공기압 조절 유닛 선정' },
  { file: 'pneumatic-gripper.html', cat: 'pneumatic', desk: '공압 그리퍼 선정',     mob: '공압 그리퍼 선정' },
  { file: 'speed-controller.html',  cat: 'pneumatic', desk: '스피드 컨트롤러 선정',  mob: '스피드 컨트롤러 선정' },
  { file: 'vacuum-pad.html',        cat: 'pneumatic', desk: '진공 흡착패드 선정',    mob: '진공 흡착패드 선정' }
];

/* 현재 페이지 파일명 */
function poCurrentFile() { return location.pathname.split('/').pop() || 'index.html'; }

/* 데스크톱 드롭다운 토글 (기존 인라인 pnavToggle과 동일 동작) */
function pnavToggle(btn) {
  var menu = btn.nextElementSibling;
  var isOpen = !menu.classList.contains('open');
  document.querySelectorAll('.pnav-menu').forEach(function (m) {
    m.classList.remove('open'); m.previousElementSibling.classList.remove('open');
  });
  if (isOpen) { menu.classList.add('open'); btn.classList.add('open'); }
}

/* 계산기 페이지 상단 데스크톱 네비게이션 렌더 (#site-nav 플레이스홀더로 주입) */
function renderNav() {
  var host = document.getElementById('site-nav');
  if (!host) return; // index 등 자체 네비 페이지는 건너뜀
  var cur = poCurrentFile();
  function menu(items) {
    return items.map(function (c) {
      return '<a href="' + c.file + '"' + (cur === c.file ? ' class="active"' : '') + '>' + c.desk + '</a>';
    }).join('\n      ');
  }
  var electric = CALCULATORS.filter(function (c) { return c.cat === 'electric'; });
  var pneumatic = CALCULATORS.filter(function (c) { return c.cat === 'pneumatic'; });
  host.outerHTML =
    '<nav class="partson-nav">\n' +
    '  <a href="index.html" class="nav-brand" style="text-decoration:none;color:rgba(255,255,255,0.7);font-weight:600">PartsOn</a>\n' +
    '  <div class="pnav-drop electric-drop">\n' +
    '    <button class="pnav-toggle" onclick="pnavToggle(this)">전동 부품 ▾</button>\n' +
    '    <div class="pnav-menu">\n      ' + menu(electric) + '\n    </div>\n' +
    '  </div>\n' +
    '  <div class="pnav-drop pneumatic-drop">\n' +
    '    <button class="pnav-toggle" onclick="pnavToggle(this)">공압 부품 ▾</button>\n' +
    '    <div class="pnav-menu">\n      ' + menu(pneumatic) + '\n    </div>\n' +
    '  </div>\n' +
    '</nav>';
  // 데스크톱 드롭다운 바깥 클릭 시 닫기 (기존 인라인과 동일)
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.pnav-drop')) {
      document.querySelectorAll('.pnav-menu').forEach(function (m) {
        m.classList.remove('open'); m.previousElementSibling.classList.remove('open');
      });
    }
  });
}

/* 모바일 햄버거 네비게이션 (기존 pmnav 스니펫과 동일 — CSS 주입 + 패널 생성) */
function renderMobileNav() {
  if (document.getElementById('pmnav-panel')) return;
  if (!document.getElementById('pmnav-style')) {
    var st = document.createElement('style');
    st.id = 'pmnav-style';
    st.textContent =
      '.pmnav-toggle{display:none}.pmnav-panel{display:none}' +
      '@media(max-width:768px){' +
      '.partson-nav .pnav-drop{display:none!important}.nav-links{display:none!important}' +
      '.partson-nav{position:relative}' +
      '.pmnav-toggle{display:flex;align-items:center;justify-content:center;width:44px;height:44px;margin-left:auto;background:none;border:none;color:rgba(255,255,255,.85);font-size:24px;line-height:1;cursor:pointer;padding:0;flex-shrink:0}' +
      '.pmnav-panel{position:absolute;top:100%;left:0;right:0;background:#0a1d12;border-bottom:1px solid rgba(255,255,255,.12);box-shadow:0 12px 24px rgba(0,0,0,.45);z-index:500;max-height:calc(100vh - 56px);overflow-y:auto}' +
      '.pmnav-panel.open{display:block}' +
      '.pmnav-sec{padding:8px 0 6px}.pmnav-sec+.pmnav-sec{border-top:1px solid rgba(255,255,255,.08)}' +
      '.pmnav-sec-title{display:flex;align-items:center;min-height:36px;padding:0 20px;font-size:12px;font-weight:700;letter-spacing:.5px;color:rgba(255,255,255,.45)}' +
      '.pmnav-panel a{display:flex;align-items:center;min-height:44px;padding:0 20px 0 30px;font-size:15px;color:rgba(255,255,255,.75);text-decoration:none;border-bottom:0}' +
      '.pmnav-panel a:hover,.pmnav-panel a:active{color:#fff;background:rgba(255,255,255,.07)}' +
      '.pmnav-panel a.pmnav-active{color:#38BDF8;font-weight:600}' +
      '.pmnav-panel a.pmnav-home{padding-left:20px}' +
      '}';
    document.head.appendChild(st);
  }
  var host = document.querySelector('.partson-nav') || document.querySelector('nav .nav-inner') || document.querySelector('nav');
  if (!host) return;
  var anchor = document.querySelector('.partson-nav') || document.querySelector('nav');
  if (getComputedStyle(anchor).position === 'static') anchor.style.position = 'relative';

  var cur = poCurrentFile();
  function sec(title, items) {
    var h = '<div class="pmnav-sec"><div class="pmnav-sec-title">' + title + '</div>';
    items.forEach(function (c) {
      h += '<a href="' + c.file + '"' + (cur === c.file ? ' class="pmnav-active"' : '') + '>' + c.mob + '</a>';
    });
    return h + '</div>';
  }
  var electric = CALCULATORS.filter(function (c) { return c.cat === 'electric'; });
  var pneumatic = CALCULATORS.filter(function (c) { return c.cat === 'pneumatic'; });

  var btn = document.createElement('button');
  btn.className = 'pmnav-toggle';
  btn.setAttribute('aria-label', '전체 메뉴');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '☰';

  var panel = document.createElement('div');
  panel.className = 'pmnav-panel';
  panel.id = 'pmnav-panel';
  panel.innerHTML = sec('⚡ 전동 부품', electric)
    + sec('💨 공압 부품', pneumatic)
    + '<div class="pmnav-sec"><a href="index.html" class="pmnav-home' + (cur === 'index.html' ? ' pmnav-active' : '') + '">🏠 PartsOn 홈</a></div>';

  host.appendChild(btn);
  anchor.appendChild(panel);

  function close() { panel.classList.remove('open'); btn.innerHTML = '☰'; btn.setAttribute('aria-expanded', 'false'); }
  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = panel.classList.toggle('open');
    btn.innerHTML = open ? '✕' : '☰';
    btn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('#pmnav-panel') && !e.target.closest('.pmnav-toggle')) close();
  });
}

function poInitNav() { renderNav(); renderMobileNav(); poInjectResultBtnCSS(); poGradeInit(); poRelatedInit(); }

/* 결과 영역 문의 버튼 스타일 (로드 시 주입) */
function poInjectResultBtnCSS() {
  if (document.getElementById('po-inq-btn-style')) return;
  var st = document.createElement('style'); st.id = 'po-inq-btn-style';
  st.textContent = [
    '.po-inq-row{display:flex;gap:8px;flex-wrap:wrap;margin:2px 0 14px}',
    '.po-inq-row button{flex:1;min-width:168px;display:flex;align-items:center;justify-content:center;gap:7px;height:48px;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .15s}',
    '.po-inq-primary{background:var(--accent,#1A3A2A);color:#fff;box-shadow:0 2px 8px rgba(26,58,42,.22)}',
    '.po-inq-primary:hover{filter:brightness(1.12)}',
    '.po-inq-email{background:#0071B8;color:#fff}',
    '.po-inq-email:hover{background:#0088CC}',
    '@media print{.po-inq-row{display:none!important}}'
  ].join('');
  (document.head || document.documentElement).appendChild(st);
}

/* hero-card 계열 계산기 공통 문의 (heroModel/heroDim/heroCap 자동 읽기) */
function poInquiryHero(calcName, emailOnly) {
  var m = document.getElementById('heroModel'), d = document.getElementById('heroDim'), c = document.getElementById('heroCap');
  var model = m ? m.textContent.trim() : '';
  var parts = [];
  [d, c].forEach(function (e) { if (e) { var t = e.textContent.trim(); if (t && t !== '—') parts.push(t); } });
  if (typeof poOpenInquiry !== 'function') { location.href = 'mailto:' + 'airpam@naver.com'; return; }
  poOpenInquiry({ calc: calcName, model: model, spec: parts.join(' · '), emailOnly: !!emailOnly });
}

/* 범용 문의 리더 — 여러 결과 구조에서 추천 모델/사양을 best-effort로 읽음 */
function poText(sel) { try { var e = document.querySelector(sel); if (!e) return ''; var t = (e.textContent || '').trim(); return t === '—' ? '' : t; } catch (x) { return ''; } }
function poInquiryAuto(calcName, emailOnly) {
  var model = poText('#heroModel');
  if (!model) { var mk = poText('.result-card .rc-maker'), md = poText('.result-card .rc-model'); model = (mk + ' ' + md).trim(); }
  if (!model) model = poText('#cmp-selected-name') || poText('#s-rec-model') || poText('#a-rec-model');
  if (!model) model = poText('#nav-model') || poText('.rh-model');
  var spec = '';
  var hd = poText('#heroDim'), hc = poText('#heroCap');
  if (hd || hc) spec = [hd, hc].filter(Boolean).join(' · ');
  else spec = poText('#result-desc') || poText('#result-summary-bar') || poText('.rh-specs') || poText('#result-card');
  spec = (spec || '').replace(/\s+/g, ' ').trim();
  if (typeof poOpenInquiry !== 'function') { location.href = 'mailto:' + 'airpam@naver.com'; return; }
  poOpenInquiry({ calc: calcName, model: model, spec: spec.slice(0, 300), emailOnly: !!emailOnly });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', poInitNav);
} else {
  poInitNav();
}

/* ═══════════════════════════════════════════════════════════════
   견적 문의 (구글 앱스스크립트 웹앱 → 시트 기록 + Gmail 알림)
   ▶ 엔드포인트는 여기 한 곳에서 관리 (URL만 바꾸면 전 계산기 반영)
   ▶ 각 계산기: poOpenInquiry({calc, model, spec, inputs, emailOnly}) 호출.
     inputs 미지정 시 계산기가 정의한 전역 poGetInputs() 를 자동 사용(표준).
   ▶ CORS 프리플라이트 회피: Content-Type text/plain + mode:no-cors 단순요청
   ═══════════════════════════════════════════════════════════════ */
var INQUIRY_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwHsYy-IOmiKPy5WenV3SLvoCNGaiFa3Ul5ta2bUPw13WJGpsx93aVZmoqWdId5Ik9AfA/exec';
var INQUIRY_FALLBACK_EMAIL = 'airpam@naver.com';
var _poInqCtx = { calc: '', model: '', spec: '', inputs: '', emailOnly: false };

function poEsc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function poValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

/* ── 입력값(inputs) 표준 헬퍼 ──────────────────────────────────
   각 계산기는 자신의 입력 필드를 읽어 사람이 읽기 쉬운 여러 줄 문자열을 만든다.
   · poVal(id)        : 폼 필드 값(select는 표시 텍스트) 읽기
   · poInputsStr(rows): [['라벨', 값, '단위'?], ...] → "라벨: 값 단위\n..." (빈 값 제외)
   자동 연결: 계산기가 전역 poGetInputs() 를 정의하면 poOpenInquiry 가 자동으로 사용.
   ──────────────────────────────────────────────────────────── */
function poVal(id) {
  var e = document.getElementById(id);
  if (!e) return '';
  if (e.tagName === 'SELECT') { var o = e.options[e.selectedIndex]; return o ? String(o.textContent || o.value).trim() : ''; }
  if (e.type === 'checkbox') return e.checked ? '예' : '아니오';
  return (e.value != null ? String(e.value) : '').trim();
}
function poInputsStr(rows) {
  var out = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i]; if (!r) continue;
    var v = r[1]; if (v == null) continue;
    v = String(v).trim(); if (v === '' || v === '—') continue;
    out.push(r[0] + ': ' + v + (r[2] ? ' ' + r[2] : ''));
  }
  return out.join('\n');
}

function poInjectInquiryUI() {
  if (document.getElementById('po-inq-overlay')) return;
  var style = document.createElement('style');
  style.textContent = [
    '#po-inq-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:500;align-items:center;justify-content:center;padding:16px;font-family:inherit}',
    '#po-inq-overlay.open{display:flex}',
    '.po-inq-box{background:#fff;border-radius:14px;max-width:420px;width:100%;max-height:92vh;overflow:auto;box-shadow:0 14px 44px rgba(0,0,0,.28)}',
    '.po-inq-head{background:var(--accent,#1A3A2A);color:#fff;padding:15px 20px;display:flex;align-items:center;justify-content:space-between}',
    '.po-inq-head h3{font-size:16px;font-weight:600;margin:0}',
    '.po-inq-x{background:rgba(255,255,255,.2);border:none;color:#fff;width:28px;height:28px;border-radius:7px;font-size:14px;cursor:pointer;line-height:1}',
    '.po-inq-body{padding:18px 20px}',
    '.po-inq-ctx{background:#F4F2ED;border-radius:9px;padding:11px 13px;font-size:12px;color:#4B5563;line-height:1.7;margin-bottom:15px}',
    '.po-inq-ctx b{color:var(--accent,#1A3A2A)}',
    '.po-inq-f{margin-bottom:11px}',
    '.po-inq-f label{display:block;font-size:12px;font-weight:600;color:#374151;margin-bottom:4px}',
    '.po-inq-f input,.po-inq-f textarea{width:100%;border:1.5px solid #D8D4CC;border-radius:8px;padding:9px 11px;font-size:14px;font-family:inherit;color:#1A1814;outline:none;background:#FAFBFC}',
    '.po-inq-f input:focus,.po-inq-f textarea:focus{border-color:var(--accent-mid,#2D6B4A);background:#fff}',
    '.po-inq-f textarea{resize:vertical;min-height:52px}',
    '.po-inq-req{color:#B91C1C}',
    '.po-inq-submit{width:100%;height:46px;background:var(--accent,#1A3A2A);color:#fff;border:none;border-radius:9px;font-size:15px;font-weight:700;cursor:pointer;margin-top:6px;font-family:inherit}',
    '.po-inq-submit:disabled{opacity:.6;cursor:default}',
    '.po-inq-err{font-size:12px;color:#B91C1C;margin-top:9px;display:none}',
    '.po-inq-priv{font-size:10.5px;color:#9E9B96;margin-top:11px;line-height:1.6}',
    '.po-inq-done{padding:34px 22px;text-align:center;display:none}',
    '.po-inq-done .po-ic{font-size:40px;line-height:1}',
    '.po-inq-done h4{font-size:17px;color:var(--accent,#1A3A2A);margin:12px 0 6px}',
    '.po-inq-done p{font-size:13px;color:#4B5563;line-height:1.7;margin:0}',
    '.po-inq-done a{color:var(--accent-mid,#2D6B4A);font-weight:600}',
    '.po-inq-close2{margin-top:18px;height:40px;padding:0 20px;background:#F4F2ED;color:#4B5563;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}'
  ].join('');
  document.head.appendChild(style);
  var ov = document.createElement('div');
  ov.id = 'po-inq-overlay';
  ov.innerHTML =
    '<div class="po-inq-box" role="dialog" aria-modal="true">' +
      '<div class="po-inq-head"><h3 id="po-inq-title">📩 견적 문의</h3><button class="po-inq-x" onclick="poCloseInquiry()" aria-label="닫기">✕</button></div>' +
      '<div class="po-inq-body" id="po-inq-form">' +
        '<div class="po-inq-ctx" id="po-inq-ctx"></div>' +
        '<div class="po-inq-f" id="po-inq-f-name"><label>이름 <span class="po-inq-req">*</span></label><input id="po-inq-name" type="text" autocomplete="name"></div>' +
        '<div class="po-inq-f" id="po-inq-f-phone"><label>연락처 <span class="po-inq-req">*</span></label><input id="po-inq-phone" type="tel" autocomplete="tel" placeholder="010-0000-0000"></div>' +
        '<div class="po-inq-f"><label>이메일 <span class="po-inq-req">*</span></label><input id="po-inq-email" type="email" autocomplete="email" placeholder="name@company.com"></div>' +
        '<div class="po-inq-f" id="po-inq-f-company"><label>회사 (선택)</label><input id="po-inq-company" type="text" autocomplete="organization"></div>' +
        '<div class="po-inq-f" id="po-inq-f-memo"><label>메모 (선택)</label><textarea id="po-inq-memo" placeholder="수량 · 납기 · 요청사항 등"></textarea></div>' +
        '<button class="po-inq-submit" id="po-inq-submit" onclick="poSubmitInquiry()">문의 보내기</button>' +
        '<div class="po-inq-err" id="po-inq-err"></div>' +
        '<div class="po-inq-priv">입력하신 정보는 견적 응대 목적으로만 사용됩니다.</div>' +
      '</div>' +
      '<div class="po-inq-done" id="po-inq-done"></div>' +
    '</div>';
  document.body.appendChild(ov);
  ov.addEventListener('click', function (e) { if (e.target === ov) poCloseInquiry(); });
}

function poOpenInquiry(ctx) {
  poInjectInquiryUI();
  ctx = ctx || {};
  // inputs: 명시적으로 넘기지 않으면 계산기가 정의한 전역 poGetInputs() 를 자동 사용
  var inputs = (ctx.inputs != null && String(ctx.inputs).trim() !== '')
    ? String(ctx.inputs)
    : (typeof window.poGetInputs === 'function' ? (window.poGetInputs() || '') : '');
  _poInqCtx = { calc: ctx.calc || '부품 선정', model: ctx.model || '', spec: ctx.spec || '', inputs: inputs, emailOnly: !!ctx.emailOnly };
  document.getElementById('po-inq-form').style.display = 'block';
  document.getElementById('po-inq-done').style.display = 'none';
  document.getElementById('po-inq-title').textContent = _poInqCtx.emailOnly ? '📧 결과를 이메일로 받기' : '📩 견적 문의';
  document.getElementById('po-inq-ctx').innerHTML = '<b>' + poEsc(_poInqCtx.calc) + '</b>' +
    (_poInqCtx.model ? ' · 추천 <b>' + poEsc(_poInqCtx.model) + '</b>' : '') +
    (_poInqCtx.spec ? '<br>' + poEsc(_poInqCtx.spec) : '') +
    (_poInqCtx.inputs ? '<br><span style="color:#8A8680;font-weight:600">［입력값］</span><br>' + poEsc(_poInqCtx.inputs).replace(/\n/g, '<br>') : '');
  ['name', 'phone', 'company', 'memo'].forEach(function (f) {
    var el = document.getElementById('po-inq-f-' + f); if (el) el.style.display = _poInqCtx.emailOnly ? 'none' : 'block';
  });
  document.getElementById('po-inq-submit').textContent = _poInqCtx.emailOnly ? '이메일로 결과 받기' : '문의 보내기';
  document.getElementById('po-inq-submit').disabled = false;
  document.getElementById('po-inq-err').style.display = 'none';
  ['po-inq-name', 'po-inq-phone', 'po-inq-email', 'po-inq-company', 'po-inq-memo'].forEach(function (id) { var e = document.getElementById(id); if (e) e.value = ''; });
  document.getElementById('po-inq-overlay').classList.add('open');
  setTimeout(function () { var f = document.getElementById(_poInqCtx.emailOnly ? 'po-inq-email' : 'po-inq-name'); if (f) f.focus(); }, 40);
}
function poCloseInquiry() { var o = document.getElementById('po-inq-overlay'); if (o) o.classList.remove('open'); }
function poInqErr(msg) { var e = document.getElementById('po-inq-err'); e.textContent = msg; e.style.display = 'block'; }

function poSubmitInquiry() {
  var email = document.getElementById('po-inq-email').value.trim();
  var eo = _poInqCtx.emailOnly;
  var name = eo ? '' : document.getElementById('po-inq-name').value.trim();
  var phone = eo ? '' : document.getElementById('po-inq-phone').value.trim();
  var company = eo ? '' : document.getElementById('po-inq-company').value.trim();
  var memo = eo ? '결과 이메일 요청' : document.getElementById('po-inq-memo').value.trim();
  document.getElementById('po-inq-err').style.display = 'none';
  if (!poValidEmail(email)) { poInqErr('올바른 이메일 주소를 입력해 주세요.'); document.getElementById('po-inq-email').focus(); return; }
  if (!eo) {
    if (!name) { poInqErr('이름을 입력해 주세요.'); return; }
    if (!phone) { poInqErr('연락처를 입력해 주세요.'); return; }
  }
  var payload = { calc: _poInqCtx.calc, model: _poInqCtx.model, spec: _poInqCtx.spec, inputs: _poInqCtx.inputs, name: name, phone: phone, email: email, company: company, memo: memo, ts: new Date().toISOString(), page: (location.pathname.split('/').pop() || 'index.html') };
  var btn = document.getElementById('po-inq-submit');
  btn.disabled = true; btn.textContent = '전송 중…';
  fetch(INQUIRY_ENDPOINT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
    .then(function () { poInqDone(true); })
    .catch(function () { poInqDone(false); });
}
function poInqDone(ok) {
  document.getElementById('po-inq-form').style.display = 'none';
  var d = document.getElementById('po-inq-done'); d.style.display = 'block';
  var eo = _poInqCtx.emailOnly;
  if (ok) {
    d.innerHTML = '<div class="po-ic">✅</div><h4>' + (eo ? '요청이 접수되었습니다' : '문의가 접수되었습니다') + '</h4>' +
      '<p>' + (eo ? '입력하신 이메일로 결과를 보내드리겠습니다.' : '확인 후 빠르게 연락드리겠습니다. 감사합니다.') + '</p>' +
      '<button class="po-inq-close2" onclick="poCloseInquiry()">닫기</button>';
  } else {
    d.innerHTML = '<div class="po-ic">⚠️</div><h4>전송에 실패했습니다</h4>' +
      '<p>네트워크 확인 후 다시 시도하시거나,<br>아래로 직접 연락 주세요.<br><a href="mailto:' + INQUIRY_FALLBACK_EMAIL + '">' + INQUIRY_FALLBACK_EMAIL + '</a></p>' +
      '<button class="po-inq-close2" onclick="poCloseInquiry()">닫기</button>';
  }
}

/* ═══════════════════════════════════════════════════════════════
   오류 신고 (계산 결과 이상 신고) — 견적 문의와 같은 웹앱 재사용
   ▶ 페이로드에 type:"error_report" 포함 → doPost가 분기해 "오류신고" 탭 기록 + 별도 메일
   ▶ 각 계산기: 결과 하단 🚩 링크에서 poReport('계산기명') 호출 (결과·입력값 자동 첨부)
   ▶ inputs 는 각 계산기 poGetInputs() 자동 사용(문의와 동일 표준)
   ═══════════════════════════════════════════════════════════════ */
var _poRepCtx = { calc: '', result: '', inputs: '' };

/* 결과 요약(추천 모델·사양) best-effort 리더 — 문의 리더와 동일 선택자 */
function _poReadModelSpec() {
  var model = poText('#heroModel') || poText('#s-rec-model') || poText('#a-rec-model') || poText('#nav-model') || poText('.rh-model') || poText('#cmp-selected-name');
  if (!model) { var mk = poText('.result-card .rc-maker'), md = poText('.result-card .rc-model'); model = (mk + ' ' + md).trim(); }
  var spec = '';
  var hd = poText('#heroDim'), hc = poText('#heroCap');
  if (hd || hc) spec = [hd, hc].filter(Boolean).join(' · ');
  else spec = poText('#result-desc') || poText('#result-summary-bar') || poText('.rh-specs');
  return { model: model, spec: (spec || '').replace(/\s+/g, ' ').trim().slice(0, 300) };
}

function poInjectReportUI() {
  if (document.getElementById('po-rep-overlay')) return;
  poInjectInquiryUI(); // .po-inq-* 클래스(모달 내부) 재사용
  var st = document.createElement('style');
  st.textContent = [
    '#po-rep-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:501;align-items:center;justify-content:center;padding:16px;font-family:inherit}',
    '#po-rep-overlay.open{display:flex}',
    '.po-rep-link{display:inline-flex;align-items:center;gap:5px;font-size:12px;color:#9E9B96;cursor:pointer;text-decoration:none;padding:6px 4px;background:none;border:none;font-family:inherit}',
    '.po-rep-link:hover{color:#B45309;text-decoration:underline}',
    '.po-rep-row{text-align:center;margin:12px 0 2px}',
    '@media print{.po-rep-row{display:none!important}}'
  ].join('');
  document.head.appendChild(st);
  var ov = document.createElement('div');
  ov.id = 'po-rep-overlay';
  ov.innerHTML =
    '<div class="po-inq-box" role="dialog" aria-modal="true">' +
      '<div class="po-inq-head" style="background:#8B4A1A"><h3>🚩 계산 결과 오류 신고</h3><button class="po-inq-x" onclick="poCloseReport()" aria-label="닫기">✕</button></div>' +
      '<div class="po-inq-body" id="po-rep-form">' +
        '<div class="po-inq-ctx" id="po-rep-ctx"></div>' +
        '<div class="po-inq-f"><label>어떤 점이 이상한가요? <span class="po-inq-req">*</span></label><textarea id="po-rep-msg" placeholder="예: 추천 모델의 수명값이 실제보다 너무 커 보입니다" style="min-height:80px"></textarea></div>' +
        '<div class="po-inq-f"><label>이메일 (선택 · 답변 받을 주소)</label><input id="po-rep-email" type="email" autocomplete="email" placeholder="name@company.com"></div>' +
        '<button class="po-inq-submit" id="po-rep-submit" style="background:#8B4A1A" onclick="poSubmitReport()">신고 보내기</button>' +
        '<div class="po-inq-err" id="po-rep-err"></div>' +
        '<div class="po-inq-priv">계산기·입력조건·결과가 함께 전송되어 오류 확인에만 사용됩니다.</div>' +
      '</div>' +
      '<div class="po-inq-done" id="po-rep-done"></div>' +
    '</div>';
  document.body.appendChild(ov);
  ov.addEventListener('click', function (e) { if (e.target === ov) poCloseReport(); });
}

function poOpenReport(ctx) {
  poInjectReportUI();
  ctx = ctx || {};
  var rd = _poReadModelSpec();
  var model = ctx.model != null ? ctx.model : rd.model;
  var spec = ctx.spec != null ? ctx.spec : rd.spec;
  var result = [model, spec].filter(Boolean).join(' · ');
  var inputs = (ctx.inputs != null && String(ctx.inputs).trim() !== '') ? String(ctx.inputs)
    : (typeof window.poGetInputs === 'function' ? (window.poGetInputs() || '') : '');
  _poRepCtx = { calc: ctx.calc || '부품 선정', result: result, inputs: inputs };
  document.getElementById('po-rep-form').style.display = 'block';
  document.getElementById('po-rep-done').style.display = 'none';
  document.getElementById('po-rep-ctx').innerHTML = '<b>' + poEsc(_poRepCtx.calc) + '</b>' +
    (result ? '<br>결과: ' + poEsc(result) : '') +
    (inputs ? '<br><span style="color:#8A8680;font-weight:600">［입력값］</span><br>' + poEsc(inputs).replace(/\n/g, '<br>') : '');
  var sb = document.getElementById('po-rep-submit'); sb.disabled = false; sb.textContent = '신고 보내기';
  document.getElementById('po-rep-err').style.display = 'none';
  document.getElementById('po-rep-msg').value = '';
  document.getElementById('po-rep-email').value = '';
  document.getElementById('po-rep-overlay').classList.add('open');
  setTimeout(function () { var f = document.getElementById('po-rep-msg'); if (f) f.focus(); }, 40);
}
function poCloseReport() { var o = document.getElementById('po-rep-overlay'); if (o) o.classList.remove('open'); }
function poRepErr(msg) { var e = document.getElementById('po-rep-err'); e.textContent = msg; e.style.display = 'block'; }

function poSubmitReport() {
  var message = document.getElementById('po-rep-msg').value.trim();
  var email = document.getElementById('po-rep-email').value.trim();
  document.getElementById('po-rep-err').style.display = 'none';
  if (!message) { poRepErr('이상한 점을 입력해 주세요.'); document.getElementById('po-rep-msg').focus(); return; }
  if (email && !poValidEmail(email)) { poRepErr('이메일 형식을 확인해 주세요.'); return; }
  var payload = { type: 'error_report', calc: _poRepCtx.calc, inputs: _poRepCtx.inputs, result: _poRepCtx.result, message: message, email: email, ts: new Date().toISOString(), page: (location.pathname.split('/').pop() || 'index.html') };
  var btn = document.getElementById('po-rep-submit');
  btn.disabled = true; btn.textContent = '전송 중…';
  fetch(INQUIRY_ENDPOINT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
    .then(function () { poRepDone(true); })
    .catch(function () { poRepDone(false); });
}
function poRepDone(ok) {
  document.getElementById('po-rep-form').style.display = 'none';
  var d = document.getElementById('po-rep-done'); d.style.display = 'block';
  if (ok) {
    d.innerHTML = '<div class="po-ic">✅</div><h4>신고가 접수되었습니다</h4><p>확인 후 개선하겠습니다. 감사합니다.</p><button class="po-inq-close2" onclick="poCloseReport()">닫기</button>';
  } else {
    d.innerHTML = '<div class="po-ic">⚠️</div><h4>전송에 실패했습니다</h4><p>네트워크 확인 후 다시 시도하시거나,<br><a href="mailto:' + INQUIRY_FALLBACK_EMAIL + '">' + INQUIRY_FALLBACK_EMAIL + '</a>로 알려 주세요.</p><button class="po-inq-close2" onclick="poCloseReport()">닫기</button>';
  }
}

/* 결과 하단 🚩 링크에서 호출: 결과(추천모델·사양)·입력값 자동 첨부.
   탭형 계산기는 poOpenReport({calc, model, spec, inputs}) 로 직접 전달 가능. */
function poReport(calcName) { poOpenReport({ calc: calcName }); }

/* ═══════════════════════════════════════════════════════════════
   계산기 신뢰도 등급 (한 곳에서 관리 → 제목 뱃지·면책 배너·index 카드 자동 반영)
   ▶ 등급을 바꾸려면 아래 CALC_GRADES 만 수정하면 전 페이지에 반영됨.
   ▶ verified=검증완료(초록) / beta=베타(노랑) / reference=참고용(회색). 미지정=기본 beta.
   ═══════════════════════════════════════════════════════════════ */
var CALC_GRADES = {
  'lmguide.html': 'verified',
  'ballscrew.html': 'verified',
  'bearing.html': 'verified',
  'servo_motor.html': 'verified',
  // 데이터 출처 점검상 불확실(생소 분야·추정값) → 참고용 기본값
  'cycloidal-gearbox.html': 'reference',
  'speed-controller.html': 'reference'
  // 그 외 미지정 계산기는 기본 'beta'
};
var GRADE_META = {
  verified:  { label: '검증완료', color: '#166534', bg: '#EBF5EE', border: '#A7D9B8',
    notice: 'ISO 기준으로 검증된 계산입니다. 최종 선정은 제조사 카탈로그로 확인하시기 바랍니다.' },
  beta:      { label: '베타',    color: '#8B5A00', bg: '#FEF6E7', border: '#F5D48A',
    notice: '이 계산기는 베타입니다. 결과는 참고용이며, 반드시 제조사 카탈로그로 재확인하세요.' },
  reference: { label: '참고용',  color: '#57534E', bg: '#EFECE6', border: '#D8D4CC',
    notice: '이 계산기는 참고용(생소 분야·추정값 포함)입니다. 반드시 제조사 카탈로그로 재확인하세요.' }
};
function poCalcGrade(page) {
  page = page || (location.pathname.split('/').pop() || 'index.html');
  return CALC_GRADES[page] || 'beta';
}
function poGradeInit() {
  try {
    var page = location.pathname.split('/').pop() || 'index.html';
    if (page === '' || page === 'index.html') { poGradeIndex(); return; }
    var m = GRADE_META[poCalcGrade(page)]; if (!m) return;
    // 1) 제목 옆 등급 뱃지
    var h1 = document.querySelector('header h1') || document.querySelector('.hdr h1') || document.querySelector('h1');
    if (h1 && !document.getElementById('po-grade-badge')) {
      var b = document.createElement('span');
      b.id = 'po-grade-badge';
      b.textContent = m.label;
      b.style.cssText = 'display:inline-block;margin-left:8px;font-size:11px;font-weight:700;padding:2px 9px;border-radius:20px;vertical-align:middle;color:' + m.color + ';background:' + m.bg + ';border:1px solid ' + m.border;
      h1.appendChild(b);
    }
    // 2) 헤더 아래(main 최상단) 등급별 면책 배너
    var host = document.querySelector('main');
    if (host && !document.getElementById('po-grade-notice')) {
      var n = document.createElement('div');
      n.id = 'po-grade-notice';
      n.innerHTML = '<b>' + poEsc(m.label) + '</b> · ' + poEsc(m.notice);
      n.style.cssText = 'font-size:12px;line-height:1.6;color:' + m.color + ';background:' + m.bg + ';border:1px solid ' + m.border + ';border-radius:9px;padding:9px 13px;margin-bottom:1rem';
      host.insertBefore(n, host.firstChild);
    }
  } catch (e) {}
}
/* index.html 계산기 카드에 작은 등급 뱃지 */
function poGradeIndex() {
  try {
    var cards = document.querySelectorAll('a.tool-card');
    for (var i = 0; i < cards.length; i++) {
      var href = (cards[i].getAttribute('href') || '').split('/').pop();
      if (!href) continue;
      var m = GRADE_META[poCalcGrade(href)]; if (!m) continue;
      var nameEl = cards[i].querySelector('.tool-name');
      if (nameEl && !nameEl.querySelector('.po-grade-mini')) {
        var b = document.createElement('span');
        b.className = 'po-grade-mini';
        b.textContent = m.label;
        b.style.cssText = 'display:inline-block;margin-left:6px;font-size:10px;font-weight:700;padding:1px 7px;border-radius:20px;vertical-align:middle;color:' + m.color + ';background:' + m.bg + ';border:1px solid ' + m.border;
        nameEl.appendChild(b);
      }
    }
  } catch (e) {}
}

/* ═══════════════════════════════════════════════════════════════
   이송축 설계 연계 — 결과 화면 "다음 단계 →" (인기 계산기 트래픽 순환)
   ▶ 각 계산기 결과 하단에 <div class="po-related"></div> 만 넣으면 자동 채워짐.
   ▶ 연계 대상은 아래 RELATED_CALCS 한 곳에서 관리.
   ═══════════════════════════════════════════════════════════════ */
var RELATED_CALCS = {
  'lmguide.html':            [['ballscrew.html','볼스크류 선정','이 이송축의 볼스크류도 선정해보세요'], ['servo_motor.html','서보모터 선정','이 축에 맞는 서보모터도 선정해보세요']],
  'ballscrew.html':          [['lmguide.html','LM 가이드 선정','같은 이송축의 LM 가이드도 선정해보세요'], ['servo_motor.html','서보모터 선정','이 축을 구동할 서보모터도 선정해보세요']],
  'servo_motor.html':        [['planetary-gearbox.html','유성 감속기 선정','감속이 필요하면 유성 감속기도 선정해보세요'], ['coupling.html','커플링 선정','축 연결용 커플링도 선정해보세요']],
  'bearing.html':            [['ballscrew.html','볼스크류 선정','이 축의 볼스크류도 선정해보세요'], ['lmguide.html','LM 가이드 선정','직선 이송축 LM 가이드도 선정해보세요']],
  'screwjack.html':          [['servo_motor.html','서보모터 선정','이 잭을 구동할 서보모터도 선정해보세요'], ['coupling.html','커플링 선정','모터-잭 연결 커플링도 선정해보세요']],
  'planetary-gearbox.html':  [['servo_motor.html','서보모터 선정','이 감속기에 맞는 서보모터도 선정해보세요'], ['coupling.html','커플링 선정','출력축 커플링도 선정해보세요']],
  'cycloidal-gearbox.html':  [['servo_motor.html','서보모터 선정','이 감속기에 맞는 서보모터도 선정해보세요'], ['coupling.html','커플링 선정','출력축 커플링도 선정해보세요']],
  'harmonic-drive.html':     [['servo_motor.html','서보모터 선정','이 감속기에 맞는 서보모터도 선정해보세요'], ['coupling.html','커플링 선정','축 연결 커플링도 선정해보세요']],
  'coupling.html':           [['servo_motor.html','서보모터 선정','연결할 서보모터도 선정해보세요'], ['ballscrew.html','볼스크류 선정','이송축 볼스크류도 선정해보세요']],
  'timing-belt.html':        [['servo_motor.html','서보모터 선정','벨트 구동용 서보모터도 선정해보세요'], ['bearing.html','베어링 선정','풀리 지지 베어링도 선정해보세요']],
  'linear-motor.html':       [['lmguide.html','LM 가이드 선정','안내용 LM 가이드도 선정해보세요'], ['servo_motor.html','서보모터 선정','비교용 서보+볼스크류도 검토해보세요']],
  'electric-actuator.html':  [['servo_motor.html','서보모터 선정','내장 서보모터 사양도 비교해보세요'], ['lmguide.html','LM 가이드 선정','외부 안내축 LM 가이드도 선정해보세요']],
  'electric-gripper.html':   [['servo_motor.html','서보모터 선정','로봇 축 서보모터도 선정해보세요'], ['pneumatic-gripper.html','공압 그리퍼 선정','공압 그리퍼와 비교해보세요']],
  'pneumatic-cylinder.html': [['solenoid-valve.html','솔레노이드 밸브 선정','이 실린더를 제어할 밸브를 선정해보세요'], ['speed-controller.html','스피드 컨트롤러 선정','속도 조절용 스피드 컨트롤러도 선정해보세요'], ['pneumatic-fitting.html','피팅·튜빙 선정','배관 피팅·튜브 사이즈도 선정해보세요']],
  'solenoid-valve.html':     [['pneumatic-cylinder.html','공압 실린더 선정','구동할 실린더를 선정해보세요'], ['speed-controller.html','스피드 컨트롤러 선정','속도 조절용 스피드 컨트롤러도 선정해보세요']],
  'speed-controller.html':   [['pneumatic-cylinder.html','공압 실린더 선정','대상 실린더를 선정해보세요'], ['solenoid-valve.html','솔레노이드 밸브 선정','제어 밸브도 선정해보세요']],
  'pneumatic-fitting.html':  [['pneumatic-cylinder.html','공압 실린더 선정','연결할 실린더를 선정해보세요'], ['pneumatic-fr-unit.html','공기압 조절 유닛 선정','공급 라인 FR 유닛도 선정해보세요']],
  'pneumatic-fr-unit.html':  [['pneumatic-cylinder.html','공압 실린더 선정','구동 실린더를 선정해보세요'], ['pneumatic-fitting.html','피팅·튜빙 선정','배관 피팅·튜브도 선정해보세요']],
  'pneumatic-gripper.html':  [['pneumatic-cylinder.html','공압 실린더 선정','이송 실린더도 선정해보세요'], ['solenoid-valve.html','솔레노이드 밸브 선정','그리퍼 제어 밸브도 선정해보세요']],
  'vacuum-pad.html':         [['pneumatic-gripper.html','공압 그리퍼 선정','파지 방식 그리퍼와 비교해보세요'], ['solenoid-valve.html','솔레노이드 밸브 선정','진공 회로 제어 밸브도 선정해보세요']]
};
function poInjectRelatedCSS() {
  if (document.getElementById('po-rel-css')) return;
  var st = document.createElement('style'); st.id = 'po-rel-css';
  st.textContent = [
    '.po-related{margin-top:16px}',
    '.po-rel-title{font-size:12px;font-weight:700;color:var(--text3,#9E9B96);letter-spacing:.5px;margin-bottom:8px}',
    '.po-rel-cards{display:flex;gap:8px;flex-wrap:wrap}',
    '.po-rel-card{flex:1;min-width:200px;display:flex;flex-direction:column;gap:3px;padding:11px 14px;border:1.5px solid var(--border,#D8D4CC);border-radius:10px;background:#fff;text-decoration:none;transition:all .15s}',
    '.po-rel-card:hover{border-color:var(--accent,#1A3A2A);background:var(--accent-light,#E8F0EC)}',
    '.po-rel-blurb{font-size:12px;color:var(--text2,#6B6760);line-height:1.4}',
    '.po-rel-go{font-size:14px;font-weight:700;color:var(--accent,#1A3A2A)}',
    '@media print{.po-related{display:none!important}}'
  ].join('');
  (document.head || document.documentElement).appendChild(st);
}
function poRelatedInit() {
  try {
    var hosts = document.querySelectorAll('.po-related');
    if (!hosts.length) return;
    var page = location.pathname.split('/').pop() || 'index.html';
    var rel = RELATED_CALCS[page];
    if (!rel || !rel.length) return;
    poInjectRelatedCSS();
    var html = '<div class="po-rel-title">다음 단계 — 설계를 이어서 완성하세요</div><div class="po-rel-cards">';
    for (var i = 0; i < rel.length; i++) {
      html += '<a class="po-rel-card" href="' + rel[i][0] + '">' +
              '<span class="po-rel-blurb">' + poEsc(rel[i][2]) + '</span>' +
              '<span class="po-rel-go">' + poEsc(rel[i][1]) + ' →</span></a>';
    }
    html += '</div>';
    for (var j = 0; j < hosts.length; j++) { hosts[j].innerHTML = html; }
  } catch (e) {}
}
