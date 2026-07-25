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
  { file: 'pneumatic-cylinder.html',cat: 'pneumatic', desk: '실린더 선정',         mob: '실린더 선정' },
  { file: 'solenoid-valve.html',    cat: 'pneumatic', desk: '솔레노이드 밸브 선정',  mob: '솔레노이드 밸브 선정' },
  { file: 'pneumatic-fitting.html', cat: 'pneumatic', desk: '피팅/튜빙 선정',      mob: '피팅/튜빙 선정' },
  { file: 'pneumatic-fr-unit.html', cat: 'pneumatic', desk: '공기압 조절 유닛 선정', mob: '공기압 조절 유닛 선정' },
  { file: 'pneumatic-gripper.html', cat: 'pneumatic', desk: '공압 그리퍼 선정',     mob: '공압 그리퍼 선정' },
  { file: 'speed-controller.html',  cat: 'pneumatic', desk: '스피드 컨트롤러 선정',  mob: '스피드 컨트롤러 선정' }
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

function poInitNav() { renderNav(); renderMobileNav(); }

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', poInitNav);
} else {
  poInitNav();
}
