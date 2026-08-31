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

function poInitNav() { renderNav(); renderMobileNav(); poInjectResultBtnCSS(); }

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
