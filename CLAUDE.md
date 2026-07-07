# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

**PartsOn Linear** — 기계 부품(LM Guide, 볼스크류, 베어링) 선정/수명 계산기 + 공급사 연결 플랫폼.  
배포: https://partson.co.kr (GitHub Pages — airpam-del/airpam-del.github.io, main 브랜치)

## 배포 방법

백엔드/빌드 도구 없음. 순수 HTML+CSS+JS 정적 파일.

**배포 저장소:** `D:\여홍 업무\partson-live\` (GitHub 연결된 git 저장소)  
**배포 방법:** `PartsOn 배포\` 파일을 `partson-live\`에 복사 후 git commit & push → 자동 배포

## SEO 구조 (2026-07-04 기초 공사)

- **sitemap.xml**: index(priority 1.0) + 계산기 15개(0.8), admin 제외. `js/common.js`의
  CALCULATORS 기반 생성 — 계산기 추가 시 sitemap도 갱신 필요(수기 또는 재생성 스크립트)
- **robots.txt**: 전체 허용 + `Disallow: /admin.html` + Sitemap 경로
- **페이지별 메타(정적, JS 주입 아님)**: title(`핵심키워드 | PartsOn`), meta description(80~120자),
  keywords(3~5개), canonical, `robots: index,follow`(admin만 `noindex,nofollow`),
  OG(title/description/type/url/image), twitter:card. 각 계산기 페이지 `<head>`에 직접 기입
- **JSON-LD**: 계산기 15개 = `WebApplication`(EngineeringApplication, offers price 0),
  index = `WebSite`. 크롤러가 리치결과로 인식
- **검색엔진 인증**: index에 **네이버 실제 인증 코드 존재**(`naver-site-verification`, 보존 필수).
  전 페이지 `<head>` 하단에 google 인증용 주석 플레이스홀더 있음 → 발급 코드 넣고 주석 해제
- **OG 이미지**: `og-image.png`(공용, 1200×630) 존재 → 전 페이지 공유. TODO: 계산기별 맞춤 OG
  이미지는 향후 개선(선택). make-og-image.html로 생성

### 검색엔진 등록 절차 (사용자 작업)
1. **구글 서치콘솔**(search.google.com/search-console): 속성 추가 → HTML 태그 인증 →
   발급 코드를 index.html `<head>`의 `<!-- <meta name="google-site-verification" ...> -->`
   주석 해제 후 삽입 → 배포 → 인증 → sitemap.xml 제출
2. **네이버 서치어드바이저**(searchadvisor.naver.com): 이미 인증됨 → 사이트맵/RSS 제출만
3. 메타 SEO 태그 수정 시 `$TEMP/seo-meta.js`(로컬 스크립트) 패턴 재사용 가능

## 공통 코드 구조 (2026-07-04 리팩토링)

- **`js/common.js`** — 계산기 목록 **단일 출처** `CALCULATORS` 배열 + 네비게이션 렌더.
  - `CALCULATORS`: `{file, cat:'electric'|'pneumatic', desk:'데스크톱 라벨', mob:'모바일 라벨'}`
  - `renderNav()`: 계산기 페이지 `<div id="site-nav"></div>` 자리에 데스크톱 드롭다운 주입
  - `renderMobileNav()`: 모바일 햄버거(pmnav) — 16개 전 페이지 공통
  - 계산기 페이지 15개: 인라인 `<nav>` 대신 `<div id="site-nav"></div>` + `<script src="js/common.js">`
  - **네비 CSS(`.partson-nav`/`.pnav-*`)는 각 페이지 인라인 유지** (CSS는 드리프트로 미추출 — 아래 참고)
- **index.html**: 데스크톱 드롭다운·"N종" 통계는 CALCULATORS 기반 JS 렌더. 히어로 칩·CTA·툴카드는
  SEO·무JS 복원력 위해 **정적 HTML 유지** + 개수 가드(불일치 시 콘솔 경고).

### ✅ 새 계산기 추가 절차
1. `계산기.html` 제작 (기존 공압/전동 페이지 복제 — 네비는 `<div id="site-nav"></div>` +
   `<script src="js/common.js"></script>`만 넣으면 됨)
2. **`js/common.js`의 `CALCULATORS` 배열에 1줄 추가** → 전 페이지 네비 드롭다운·모바일 메뉴·
   index 통계 자동 반영
3. index.html에 **정적 요소 3곳 수동 추가**(SEO): 히어로 칩(`.chip`), CTA 버튼(`.cta-group-btns`),
   툴카드(`.tool-card`) — 누락 시 index 콘솔에 `[PartsOn] … 개수 불일치` 경고 표시됨
4. sitemap.xml에 URL 추가

### ⚠️ CSS는 왜 공통 추출 안 했나 (2026-07-04 조사)
15개 페이지 CSS가 시간차 수작업으로 드리프트(바이트 동일 교집합 8개뿐, `.btn` 6변형 등).
안전한 대형 common.css는 100+ 규칙 정본 통일이 필요 → 외형 변경 위험으로 보류. 상세 REFACTOR_PLAN.md.

### 🔙 리팩토링 복구 (문제 시)
- 병합 후 이상: `git reset --hard backup-before-refactor && git push --force origin main` → CNAME 재확인
- 특정 커밋만: `git revert <커밋>`
- **CNAME(partson.co.kr) 절대 삭제 금지** — 과거 삭제로 도메인 풀린 사고 있음

## 파일 구조

```
PartsOn 배포/
├── index.html          — 메인 랜딩 페이지 (2026-05-28 신규, 구 landing.html)
├── lmguide.html        — LM Guide 수명 계산기 (구 index.html)
├── ballscrew.html      — 볼스크류 + LM Guide 선정 계산기 (5단계 위저드 + LM Guide 탭)
├── bearing.html        — 베어링 선정 계산기 (5단계 위저드)
├── servo_motor.html    — 서보모터 선정 계산기 (5단계 위저드, 2026-05-29 신규)
├── planetary-gearbox.html — 유성 감속기 선정 계산기 (5단계 위저드, 2026-06-18 신규)
├── cycloidal-gearbox.html — 사이클로이드 감속기 선정 계산기 (5단계 위저드, 2026-06-19 신규)
├── pneumatic-cylinder.html — 공압 실린더 선정 계산기 (5단계 위저드, 2026-06-21 신규, category-pneumatic)
├── solenoid-valve.html    — 솔레노이드 밸브 선정 계산기 (5단계 위저드, 2026-06-21 신규, category-pneumatic)
├── speed-controller.html  — 스피드 컨트롤러 선정 계산기 (5단계 위저드, 2026-07-04 신규, 나사×OD 치수 매칭)
├── admin.html          — 공급사 관리 페이지 (비밀번호 보호)
├── logo.png            — 원본 로고 (흰 배경 PNG)
├── logo-white.png      — 가공 로고 (흰색 실루엣, 투명 배경 — 네비바 사용)
└── og-image.png        — SNS 공유 썸네일 (1200x630px, make-og-image.html로 생성)
```

모든 파일은 단일 HTML 파일로 CSS·JS가 인라인 포함되어 있음.

## 아키텍처

### 디자인 시스템 (전 파일 공통)
- **폰트**: Space Grotesk (헤드라인) + Pretendard (본문) + IBM Plex Mono (숫자/코드) — Google Fonts CDN
- **배경**: `#F8F7F5` (따뜻한 베이지), 포인트: `#1A3A2A` (딥그린), 강조: `#00C853`
- **텍스트**: `#0F0E0C` (딥블랙, 가독성 향상)
- CSS 변수: `--bg`, `--surface`, `--border`, `--border-light`, `--text-primary`, `--text-secondary`, `--text-muted`, `--accent`, `--accent-mid`, `--accent-light`, `--font`, `--mono`
- **애니메이션**: 페이드인, 호버 scale/shadow, 펄스(배지 점), GPU 가속 (transform/opacity만 사용)
- **반응형**: 데스크톱 → 태블릿(1024px 2열) → 모바일(768px 1열) → 소형(480px)
- **이징**: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`, `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`
- 상단 내비게이션: `.partson-nav` 클래스 (전 파일 동일)
- **네비게이션 그룹화 (2026-06-19)**: "전동 부품 ▾" / "공압 부품 ▾" 2개 드롭다운으로 구조화
  - 전동 부품: LM Guide, 볼스크류, 베어링, 서보모터, 스크류잭, 유성 감속기, 사이클로이드, 하모닉 드라이브
  - 공압 부품: 실린더 선정, 솔레노이드 밸브 선정 (향후 추가 시 이 드롭다운에 링크 추가)
  - 드롭다운 CSS: `.pnav-drop`, `.pnav-toggle`, `.pnav-menu`, `.pnav-soon` (각 계산기 파일 인라인)
  - 드롭다운 JS: `pnavToggle()` 함수 + `document.addEventListener('click',...)` (nav 직후 `<script>` 블록)
  - 전동 드롭다운: `class="pnav-drop electric-drop"` / 공압: `class="pnav-drop pneumatic-drop"`
  - index.html nav는 `.nav-dropdown electric-nav` / `.nav-dropdown pneumatic-nav`
- **카테고리 컬러 시스템 (2026-06-21)**:
  - CSS 변수: `--electric-primary`, `--electric-icon(#00C853)`, `--electric-badge-bg`, `--pneumatic-primary(#1A3A5C)`, `--pneumatic-icon(#0088CC)`, `--pneumatic-badge-bg` (각 파일 `:root`에 인라인)
  - 전동 계산기 8개: `<body class="category-electric">` 적용 완료
  - 공압 계산기(미래): `<body class="category-pneumatic">` 사용 — 공압 실린더 계산기 추가 시 적용
  - 계산기 페이지 헤더 배지: `<span class="cat-badge">⚡ 전동</span>` (h1 인라인)
  - 공압 배지: `<span class="cat-badge">💨 공압</span>` (공압 계산기 추가 시 사용)
  - 판정 신호색(✅⚠️❌)은 `--ok/--warn/--bad` 변수 사용 — 카테고리 색과 절대 혼용 금지
- **접근성**: `prefers-reduced-motion` 지원

### 데이터 저장 (localStorage)
공급사 데이터는 브라우저 localStorage에만 저장됨 (서버 없음).

| 키 | 용도 |
|----|------|
| `partson_lm_suppliers` | LM Guide 공급사 목록 |
| `partson_bs_suppliers` | 볼스크류 공급사 목록 |
| `partson_brg_suppliers` | 베어링 공급사 목록 |
| `partson_admin_pw` | 관리자 비밀번호 (기본값: `partsON1`) |

공급사 객체 구조:
```js
{ id, name, phone, email, website, brands: [], sizes: [], note }
```

### index.html — 메인 랜딩 페이지
- 슬로건: "빠른 선정, 정확한 부품"
- 로고: `logo-white.png` (224px, margin-left: -139px으로 내부 여백 보정)
- 배지: "자동화 부품 선정 플랫폼" (14px, `.hero-badge`)
- 히어로 CTA 버튼 3개: LM Guide 선정 / 볼스크류 선정하기 / 베어링 선정하기
- 네비바 높이: 240px (로고 크기에 맞춤)

### lmguide.html — LM Guide 선정 계산기 (구 index.html)
- **MAKER_DATA / MAKER_C0**: 5개사(Bosch Rexroth·THK·HIWIN·TBI·PMI) C₁₀₀, C₀ 값 배열. 인덱스 순서: [15, 20, 25, 30, 35, 45]
- **MODELS**: 5개사 평균 C₁₀₀, C₀, 정격 하중 배열
- **calcSimple() / calcAdvanced()**: 계산 후 `renderSuppliers(sel.size, prefix)` 호출해 공급사 표시
- Simple 탭 prefix: `'s'`, Advanced 탭 prefix: `'a'`
- 결과 카드 ID: `s-result-card`, `a-result-card` (초기 `hidden` 클래스 필수)
- nav-brand: `<span class="nav-brand">PartsOn Linear</span>` (ballscrew.html과 동일 구조)

### ballscrew.html — 볼스크류 + LM Guide 선정
- **BS_DATA**: 볼스크류 사이즈별 `{C, C0, dr}` (4개사 그라운드 등급 평균, ISO 3408-5). 키 형식: `'직경x리드'` (예: `'25x10'`)
- **BS 객체**: 위저드 상태 저장 `{dir, angle, W, S, extra, vmax, tacc, life, h_day, support}`
- **bsRender()**: 결과 렌더 후 `bsBuildCompare()` → `renderBSSuppliers()` 순서로 호출
- LM Guide 탭은 `switchApp('lm', el)`로 전환, `app-lm` div 표시/숨김
- LM Guide 공급사 렌더: `renderSuppliers(sel.size, prefix)` — index.html과 동일한 `partson_lm_suppliers` 키 사용

### bearing.html — 베어링 선정
- **BRG_META**: 베어링 종류별 메타 (`name, code, desc, allowsFr, allowsFa, p`)
- **BRG_DB**: 베어링 데이터 `[내경, 외경, 폭, C(kN), C0(kN), 허용rpm]`
- **state 객체**: `{type, fr, fa, fw, n, ft, lh, searchBy, dimVal}`
- **brgState**: `{h_day}` — 일일 가동 시간 (state와 분리)
- Step 5에서 내경/외경 기준 선택 시 `selSearchBy()` → `initBoreGrid()` 즉시 호출해 치수 버튼 표시
- 결과 후 `renderBrgSuppliers()` 호출

### admin.html — 공급사 관리
- **currentTab**: `'lm'` | `'bs'` | `'brg'`
- **KEYS 객체**: 탭별 localStorage 키 매핑
- `size-group` div: LM Guide 탭에서만 표시 (볼스크류·베어링은 사이즈 필터 불필요)
- `switchTab(tab, el)` 호출 시 탭 + 라벨 + 사이즈 섹션 표시 여부 동시 변경

### servo_motor.html — 서보모터 선정 계산기

- **위저드 구조**: 5단계 (부하 형태 → 전달 방식 → 부하 조건 → 운전 조건 → 결과)
- **부하 형태 5종**: `ballscrew` / `rack` / `conveyor` / `index` / `rotary`
- **전달 방식 4종**: `direct` / `belt` / `gear` / `chain`
- **상태 객체 `S`**: `{ lt, dt, 'bs-ori', 'rp-ori', 'idx-dist', step }`

**모터 DB (`MOTORS` 배열)**
```js
{ maker, series, model, power(W), Tr(N·m), Tmax(N·m), J(kg·cm²), nr(rpm), nmax(rpm) }
```

| 제조사 | 시리즈 | 용량 범위 | 비고 |
|---|---|---|---|
| 미쯔비시 | HG-KR | 50W~750W | 저관성, 최고 6000rpm |
| 미쯔비시 | HG-SR | 500W~7kW | 중관성, 최고 3000rpm |
| 파나소닉 | MSMF | 50W~5kW | 중관성, 최고 5000rpm |
| 파나소닉 | MQMF | 100W~750W | 초저관성, 최고 5000rpm |
| LS산전 | APMC | 50W~750W | 콤팩트 저관성, 국내 주력 |
| LS산전 | APM | 100W~3kW | 표준 중관성, 국내 주력 |

**계산 흐름**
1. `calcLoad()` → `{ n_motor, J_load, T_drive, alpha_motor, ratio, eta_drive, J_drive, tacc, tdec, tcycle }` 반환
2. `evalMotor(m, p)` → 각 모터 판정. 선정 기준:
   - 실효 토크 T_rms ≤ 정격 토크 × 90%
   - 피크 토크 T_peak ≤ 최대 토크
   - 관성비 JL/JM ≤ 10
   - 필요 RPM ≤ 최고 RPM
3. T_rms = √[(T_peak²·t_acc + T_drive²·t_const + T_dec²·t_dec) / T_cycle]

**결과 전역 상태**
```js
let _calcP, _allResults, _passingList, _curIdx, _makerFilter;
```
- `_passingList`: 현재 필터 적용 후 **전체 모터** (PASS+FAIL 혼합, 용량 오름차순, PASS 먼저)
- `applyMakerFilter(maker)`: 필터 변경 시 `_curIdx`를 첫 번째 PASS 인덱스로 리셋
- `navigateModel(dir)`: `_curIdx` ±1 이동 → `renderResultCard()` 호출
- `renderResultCard(idx)`: PASS면 정상 카드, FAIL이면 경고 배너(원인별) + 붉은 카드

**부하 관성 계산 공식**
```
볼스크류: J_load = J_screw + m*(lead/2π/1000)²  [kg·m²]
랙&피니언: J_load = (m+m_rack)*(D/2/1000)²
컨베이어:  J_load = (m+m_belt)*(D_roller/2/1000)²
인덱스:    J_load = α * m * (D/2/1000)²  (α: 분포계수 0.5~1.0)
회전부하:  J_load = 0.5 * m * (D/2/1000)²
```

**모터축 환산**: `JL_motor = J_load / ratio²`  
**관성비**: `ir = JL_motor / J_motor`

**스텝 바 클릭 네비게이션**: 완료된 스텝(✓)만 클릭 가능. `renderStepsBar(cur)` 에서 `onclick="goStep(n)"` 동적 삽입.

**설치 방향 버튼 (`bs-ori`, `rp-ori`)**: `sel()` 함수 `step=0`으로 호출. `if (step >= 0)` 조건으로 sel 클래스 항상 적용.

### cycloidal-gearbox.html — 사이클로이드 감속기 선정 계산기

- **위저드 구조**: 5단계 (조건 입력 → 충격 부하(SF) → 메이커 → 결과 → 비교·선정)
- **메이커 DB**: Sumitomo Cyclo 6000(5종) / Fine Cyclo(6종), Nabtesco RV-E(7종) / RV-N(4종) (총 22개 모델)
- **핵심 차이점**: 백래시 없음 → "위치 정밀도(히스테리시스 손실)" 표기, 순간 최대 토크 = 정격 × 5배
- **설계 토크**: T_design = T_load × SF × 운전 패턴 보정계수 (역전 운전 시 SF × 1.2 추가)
- **수명 등급**: 보장 수명 vs 요구 수명 비율로 ✅/⚠️/❌ 판정
- **감속비 범위**: 입력값이 모델 ratioMin~ratioMax 내에 있는지 확인 후 필터링
- **상태 객체 `S`**: `{ step, tLoad, nInput, ratio, lh, duty, sf, reverse, makers, results, picked }`
- **데이터**: `CG_DATA` 객체 내 인라인

### planetary-gearbox.html — 유성 감속기 선정 계산기

- **위저드 구조**: 5단계 (조건 입력 → 정밀도 → 메이커 → 결과 → 비교·선정)
- **메이커 DB**: Neugart PLE/PLN, Apex Dynamics AB/AD, Shimpo VRSF/VRL (총 31개 시리즈)
- **필터링**: 감속비 일치 + 백래시 ≤ 허용값 + 정격 토크 ≥ 설계 토크 (= T_load × Kf)
- **수명 계산**: L10h ≈ 20,000 × (T_rated / T_design)^(10/3) [h]
- **판정**: ok(적합) / warn(수명 미달) / bad(rpm 초과)
- **상태 객체 `S`**: `{ step, tLoad, nInput, ratio, lh, jLoad, blMax, kf, makers, results, picked }`
- **데이터**: `PG_DATA` 객체 내 인라인 (별도 JS 파일 없음)

## 작업 이력

### 2026-05-28 — 랜딩 페이지 신규 제작 + 전체 개편

**랜딩 페이지 (`index.html`) 신규 제작**
- 슬로건: "빠른 선정, 정확한 부품"
- 자막: "데이터 기반 계산으로 정밀 부품을 빠르게 선정하고, 최적의 공급사와 즉시 연결됩니다."
- 섹션: 네비 → 히어로 → 통계바 → 계산기 카드 3개 → Why PartsOn → 공급사 → CTA → 푸터
- 히어로 CTA 버튼 3개: LM Guide 선정 / 볼스크류 선정하기 / 베어링 선정하기
- 배지 "자동화 부품 선정 플랫폼" 14px (IBM Plex Sans KR)

**로고 (`logo-white.png`) 적용**
- PowerShell + System.Drawing으로 원본 PNG 흰 배경 제거 (밝기 기반 픽셀 처리)
- 네비바 224px 높이, `margin-left: -139px`으로 PNG 내부 여백 보정 → 히어로 텍스트와 좌측 정렬
- 네비바 높이 240px으로 증가

**파일 구조 개편**
- `landing.html` → `index.html` (진입점), `index.html` → `lmguide.html`
- 4개 HTML 파일 내부 링크 전체 수정
- lmguide.html nav-brand: `<span class="nav-brand">PartsOn Linear</span>`으로 ballscrew.html과 통일
- LM Guide 카드 이름: "수명 계산기" → "LM Guide 선정"

### 2026-05-29 — 서보모터 선정 계산기 신규 제작

**`servo_motor.html` 신규 제작**
- ballscrew.html과 동일한 PartsOn 디자인 시스템 적용 (IBM Plex Sans KR, 딥그린 #1A3A2A)
- 5단계 위저드: 부하형태 → 전달방식 → 부하조건 → 운전조건 → 결과
- 미쯔비시 HG-KR/HG-SR, 파나소닉 MSMF/MQMF, LS산전 APMC/APM 총 39개 모델 DB
- 결과: 4개 부하율 메트릭 바 (연속부하율·순시토크·RPM·관성비) + 토크 파형 Canvas 그래프
- 제조사 필터 (전체/미쯔비시/파나소닉/LS산전) + 화살표 모델 탐색 (PASS·FAIL 전체)
- FAIL 모델 선택 시 원인별 경고 배너 표시 (RPM초과/순시토크초과/과열위험/관성비과대)
- 완료된 위저드 스텝 클릭 시 해당 스텝으로 복귀

**전체 nav 업데이트**
- `index.html`, `lmguide.html`, `ballscrew.html`, `bearing.html` 상단 네비에 서보모터 선정 링크 추가

### 2026-05-29 — PDF 저장 기능 + 전체 nav 개선

**PDF 저장 기능 (전체 계산기 공통)**
- 결과 화면 하단 `📄 PDF 저장 (인쇄)` 버튼 → `window.print()` 실행
- `@media print` CSS로 nav·header·입력 폼·버튼 숨기고 결과만 인쇄
- 인쇄 헤더: PartsOn 로고 텍스트 + 계산기명 + 계산일 (우측)
- 함수명: `doPrint()`(서보), `brgDoPrint()`(베어링), `lmDoPrint()`(LM), `bsDoPrint()`(볼스크류)
- print-only 요소: `.print-header` (평소 `display:none`, 인쇄 시 `display:flex`)

**nav 개선**
- 모든 계산기 좌상단 "PartsOn Linear" → `<a href="index.html">PartsOn</a>` (클릭 시 메인으로)

### 2026-05-29 — Manus AI UI/UX 전면 개선

**디자인 시스템 업그레이드 (`index.html` 중심)**
- 폰트: IBM Plex Sans KR → Space Grotesk (헤드라인) + Pretendard (본문)
- 강조색: `#4ADE80` → `#00C853`, 배경: `#F4F2ED` → `#F8F7F5`, 텍스트: `#0F0E0C`
- 애니메이션: 페이드인, 펄스(배지), 호버 scale/shadow/slide 추가
- 반응형 3단계: 1024px(2열), 768px(1열), 480px(소형)
- 계산기 카드: 아이콘 추가, 호버 시 상단 보더 애니메이션
- OG 이미지: `make-og-image.html`로 `og-image.png` (1200×630) 생성
- `prefers-reduced-motion` 접근성 지원

### 2026-07-02 — 데이터 검증 발견 오류 수정 (서보모터·실린더·LM가이드)

**servo_motor.html — 모터 DB 수정**
- 미쓰비시 HG-SR 7개 모델 Tr/Tmax 교체: 3000rpm 기준 토크가 잘못 들어가 있던 것을 2000rpm 정격 기준으로 수정 (Tr=9.55×P/2000, Tmax=Tr×300%, 미쓰비시 공식 사양 확인)
- 파나소닉 MSMF 1kW 이상 5개 모델(102L1/152L1/202L1/302L1/502L1) nr: 2000 → 3000 (Tr은 3000rpm 기준으로 정확했음)
- 물리 일관성 전수 검증: 39개 모델 중 35개 통과 (|Tr − 9.55×P/nr| 오차 5% 이내)
- **검증 FAIL 4건 (임의 수정 보류, TODO 주석만 추가)**: LS산전 APM-SC10A/SC15A/SC20A/SC30A — Tr은 3000rpm 기준값인데 nr:2000으로 기재 (오차 33%, MSMF와 동일 패턴 의심)

**pneumatic-cylinder.html — 시리즈 매핑 리팩토링**
- `MAKERS.series`를 타입별 단일 객체 → **보어 범위별 배열** 구조로 변경: `single/double: [{name, minD, maxD, pMin, pMax}, ...]` — 보어 D에 맞는 항목의 시리즈명 표시
- SMC 복동: CM2B(Ø20~40) / CA2(Ø50~100) 분리 — 존재하지 않는 "CM2B Ø63" 표기 제거
- SMC 단동: CM2(단동)(Ø20~40) / "CA2 계열(단동 사양 확인 필요)"(Ø50~100)
- Festo ESNU maxD: 100 → 63 (ESNU 라인업은 Ø63까지)
- `runCalc()`에 `S.makerNotes` 추가: 보어 라인업 없음/압력범위 밖으로 제외된 메이커·보어를 결과 요약 아래 info-box로 안내 (예: "Festo: Ø80, Ø100는 단동 라인업 없음 — 결과에서 제외")
- Step 3 메이커 카드 문구 갱신 (CM2/CA2 보어 분리, ESNU 20~63mm)

**lmguide.html — 추정값 투명성**
- TBI·PMI C₀ 추정값 각주 추가: Simple/Advanced 결과 카드 note + 메이커별 C₁₀₀ 참고표 하단 ("※ TBI·PMI의 정정격하중(C₀)은 추정값입니다...")

**공통 — 데이터 기준 표기**
- 세 계산기 하단 면책 고지에 "데이터 최종 검증: 2026.07 (일부 항목 검증 진행 중)" 추가

**회귀 테스트**: 세 계산기 5단계 위저드 전체 흐름 통과 (실린더 단동/복동 시나리오, 서보 볼스크류+직결, LM Simple/Advanced), 콘솔 에러 없음

### 2026-07-03 — 2차 데이터 검증 확정 오류 수정 (그리퍼 2종·피팅) + 치명적 JS 버그 수정

**🔥 치명적 버그 — 스텝바 아이콘 따옴표 오류로 계산기 3종 전체 스크립트 실행 불능**
- `pneumatic-fitting.html`, `solenoid-valve.html`, `pneumatic-fr-unit.html`의 스텝바 렌더 코드
  `<i class="ti "+STEP_ICONS[i-1]+'"` — 따옴표 불일치 SyntaxError로 **메인 스크립트 블록 전체 미실행**
  (계산기가 아예 동작하지 않는 상태로 배포돼 있었음). 아이콘 시스템 커밋(1635c46 계열)에서 유입.
- 3개 파일 모두 `class="ti '+STEP_ICONS[i-1]+'"`로 수정, 전 HTML 인라인 스크립트 node 구문검사 통과 확인

**pneumatic-gripper.html — SMC MHZ2 파지력 전면 교체 (물리 모순 해소)**
- SMC 카탈로그 유효 파지력(0.5MPa, L=20mm, 손가락당)으로 검증 교체:
  Ø10=11/17, Ø16=34/45, Ø20=42/66, Ø25=65/104(기존값 정확), Ø32=158/193, Ø40=254/318 (외부/내부 N)
- 기존 데이터는 Ø10~20이 2~3배 부풀려져 Ø20(90N)>Ø25(65N) 역전 — 과소 보어 추천 위험이었음
- 스트로크/편측 수정: Ø20 4→5, Ø32 8→11, Ø40 8→15 mm
- Festo HGPT 16/20/25 데이터시트 값으로 교체(53/60, 77/82, 124/133 — 6bar 조당), 32/40은 변형별 상이로 TODO
- **CKD "HGW" 시리즈 실존 확인 실패** (실제 CKD 평행핸드는 HMF·LHA·HAP·BHA 계열) — 데이터 전체가
  SMC 미러 근사값. TODO 주석만 추가, 사용자 확인 후 시리즈 교체 필요

**electric-gripper.html — Schunk EGP 파지력 수정**
- EGP 40: 0~30 → 35~140N, EGP 25: 0~12 → 20~40N (Schunk 공식 제품페이지 검증 — 기존값은 스피드 버전 N-S-B 값)
- Co-act EGP-C robots: ['doosan','kuka'] → ['ur','doosan','fanuc'], 라벨 'UR·Doosan·FANUC CR·Mitsubishi 인증'
  (공식 변형 UR·Doosan·FCR7·ASSISTA 확인, KUKA 근거 없음), Step2 로봇 툴팁도 갱신

**pneumatic-fitting.html — 표-공식 모순 해소 + 비실존 품번 교체**
- OD_TABLE 내경을 SMC TU 실측으로 수정(OD8: 5.8→5.0, OD10: 7.5→6.5, OD12: 9.0→8.0, OD16: 12→10),
  qMax를 calcTube()와 동일 공식(유속 8m/s)으로 재계산(2.3/6.0/9.4/15.9/24.1/37.6) — 2.5배 모순 해소
- SMC 튜빙 품번: TU1075/TU1209/TU1613(비실존) → TU1065/TU1208/TU1610, 16mm 나일론 TS1612
- CKD GW 피팅 형상 매핑 수정: GWS=스트레이트/GWL=엘보/GWT=티 (기존은 GWL을 스트레이트, 비실존 GWE를 엘보로 오기)
- CKD 튜빙 TAS/TAN 실존 미확인 — TODO 주석 (실제는 U-95/NU 계열 추정)

**회귀 테스트**: 그리퍼 2종·피팅 위저드 전체 흐름 + 물리 일관성(보어↑=파지력↑, 외부<내부) 자동 점검 통과,
솔밸브·FR유닛 스크립트 실행 복구 확인, 17개 HTML 인라인 스크립트 구문검사 전수 통과, 콘솔 에러 없음
- `.claude/launch.json`: python 미설치 환경이라 `npx http-server`로 변경

### 2026-07-03 (2차) — 하모닉·솔밸브·FR유닛 데이터 검증 수정

**harmonic-drive.html — HDS 데이터 전면 교체 + 래칫팅 판정 구조 개선**
- HDS CSF/SHF 정격이 실제의 1.6~4배로 부풀려져 있던 것을 공식 정격표(harmonicdrive.net
  CSF-2UH/SHF-2UH/CSF-2XH, 2개 소스 교차 검증)로 전면 교체 — 용량 부족 감속기를 적합 추천하던
  위험 방향 오류. 감속비 라인업도 실제로 수정(CSF-8/11: 30/50/100만, CSF-40+: 30 없음 등)
- 데이터 구조 변경: trMin/trMax 선형보간 → 감속비별 실측 테이블 tr(정격)/rp(반복피크)/mp(순간최대)
- 판정 로직: 래칫팅 = tPeak > mp(실측), 신규 가감속 초과 경고 = tPeak > rp → warn
- l10: HDS CSF/SHF 정격수명 7,000h 반영(기존 10,000h 일괄). mrpm 그리스 기준 실측값으로 수정
- **"Leadshine"은 하모닉 감속기 제조사 아님** (실제 중국 메이커는 Leaderdrive·Laifual) — TODO,
  미검증 모델(LS/LF)에 "근사 데이터" 배지 표시. Laifual 링크 laifualdrive.com으로 수정

**solenoid-valve.html — SYJ 모델명 정정 + 유량 기준 통일(ANR)**
- SYJ3000/5000(실제는 5포트 시리즈) → SYJ300/500/700(진짜 3포트)으로 정정, C값 기반 유량
  92/329/724 L/min 반영
- calcQ()에 ANR 환산(0.5MPa 가정, ×5.94) 추가 — 기존엔 비환산 배출유량이라 카탈로그
  유량·피팅 계산기 입력(ANR)과 기준이 어긋났음. qRated 전량 카탈로그 기준 교체:
  SY=294/687/1178(C=1.0/2.4/4.1), VUVG=220/560/870, CPE=350/810, CKD 4F3/4F4=C값 기반
- **CKD "3F" 3포트 시리즈 실존 확인 실패** (실제는 3GA/3GB·3QR·3KA 계열) — TODO, 근사 환산만 적용

**pneumatic-fr-unit.html — 시리즈 분류 정정**
- CKD C3000(F+R+L 콤보라 부적합) → W시리즈(W1000-6/W3000-8/W3000-10/W4000-15, 필터+레귤레이터
  일체형)로 교체. 포트 코드 6=1/8, 8=1/4, 10=3/8, 15=1/2. qRated는 근사 유지(TODO)
- SMC AME(실제는 0.01μm 슈퍼 미스트 세퍼레이터) → AFM 시리즈(진짜 0.3μm, AFM20=200/AFM30=450
  카탈로그 확인, AFM40=1100 TODO)로 교체 + "레귤레이터 별도 조합" 안내 추가

**회귀 테스트**: 3개 계산기 위저드 전체 흐름 + 하모닉 tr≤rp≤mp 무결성 전수 통과, 콘솔 에러 없음

### 2026-07-04 — 스피드 컨트롤러 계산기 신규 + index 버튼 통일 + 모바일 네비 전면 수정

**speed-controller.html 신규 (공압 카테고리 — 계산기 15종째)**
- 5단계 위저드: 실린더 연결 조건(보어·속도·튜브OD·포트나사) → 제어·취부(SVG 카드) → 메이커 → 결과 → 비교·선정
- 선정 로직: **나사×튜브OD 치수 매칭** 중심 (엘보형: 나사+OD 일치 / 인라인형: OD만).
  유량값은 검증 전이라 미포함 — Step1에 참고 필요유량(ANR·0.5MPa, 솔밸브와 동일 공식)만 표시
- 미터아웃(권장)/미터인, 엘보형(일반적)/인라인형 SVG 일러스트 카드. 미터인 선택 시
  "주문 시 사양 코드 확인" 안내만 표시 (접미사 임의 생성 금지 원칙 준수)
- 데이터: SMC AS(엘보 5종+인라인 2종)/Festo GRLA·GRO/CKD SC3W·SC1 — [추정] 항목 전부
  `// TODO: 카탈로그 확인 필요` 주석(6개), 하단 "데이터 최종 검증: 미완" 표기
- 링크 추가: index(네비 드롭다운·히어로 칩·하단 CTA), 전 계산기 페이지(14개) 공압 드롭다운, sitemap.xml
- index CTA 문구 "12가지" → "15가지"

**index.html — 공압 버튼 크기 통일 (진단 결과)**
- 데스크톱 CSS는 .btn-ghost와 .btn-ghost-blue가 동일(패딩 14×32/폰트 14px)했으나,
  **모바일 미디어쿼리의 `width:100%` 규칙에 .btn-ghost-blue가 누락**돼 모바일에서만 크기 불일치
- 리팩토링: 마크업을 `class="btn-ghost btn-ghost-blue"`로 base 클래스 공유,
  .btn-ghost-blue는 색상(보더·텍스트·배경) 오버라이드만 잔존 → 모바일 풀폭 규칙 자동 상속

**모바일 네비게이션 — 전 페이지 햄버거 메뉴 (진단 결과)**
- 원인: index는 768px 이하에서 `.nav-links{display:none}` 처리 후 대체 메뉴 없음(링크 접근 불가),
  계산기 페이지는 데스크톱 드롭다운 구조 그대로라 모바일 UX 부재
- 수정: **자기완결형 공통 스니펫**(`pmnav-style` + IIFE 스크립트)을 16개 페이지(15 계산기+index)
  `</body>` 앞에 동일 주입 — JS가 햄버거(44×44)와 패널(⚡전동 9개/💨공압 6개/홈, 링크 44px,
  현재 페이지 하이라이트)을 동적 생성하므로 페이지별 nav 구조 차이와 무관하게 일관 동작
- 스니펫 수정 시: `pmnav-style`~`</script>` 블록을 전 페이지에서 일괄 교체할 것 (원본:
  스니펫이 각 파일에 동일 복사돼 있음)
- 회귀 확인: 데스크톱 드롭다운(pnavToggle/navToggle) 정상, 햄버거는 데스크톱에서 숨김

**검증**: 전 18개 HTML 인라인 스크립트 구문 통과, 위저드 3개 시나리오(매칭/조합없음/인라인) 통과,
index 데스크톱 버튼 동일(54px)·모바일 풀폭 동일(327px), 모바일 네비 4개 페이지 표본 확인, 콘솔 에러 없음

### 2026-07-04 (3차) — 스피드 컨트롤러·솔레노이드 밸브에 보어 계산 도우미 추가

- 두 계산기 Step 1의 실린더 보어 입력 아래에 접이식 "계산 도우미" 추가 (피팅 계산기 유량 도우미와 동일 UX)
- 3탭 구조: 수평 이동 부하(무게·μ·압력) / 수직 리프트(무게·가속보정·압력) / 필요 추력 직접 입력
- 로직: 필요 추력 F → 권장 추력(이론 추력 P×A×60%) ≥ F 만족하는 최소 표준 보어(20~100) 추천.
  이론 추력 = P[MPa]×A[mm²] 공압 실린더 계산기와 동일 기준. 추력식도 실린더 도우미와 동일
  (수평 m×9.81×μ×1.5, 수직 m×9.81×1.5×가속보정)
- 적용 버튼: 해당 계산기의 보어 select(inp-bore / bore) 설정 + 하이라이트 + 기존 재계산(calcPreview/calcQ) 호출 후 닫힘
- CSS/HTML/JS 네임스페이스 `bh-*`·`bore-helper-*`로 기존 요소와 충돌 없음. Ø100 초과 시 적용 비활성
- 검증: 3탭 수계산 일치(200kg→441N→Ø50, 40kg수직→765N→Ø63, 300N→Ø40), 적용·닫힘·재계산·오버플로우
  전부 정상, 모바일 375px 가로 오버플로우 0, 콘솔 에러 0

### 2026-07-04 (2차) — 전체 계산기 15개 회귀 테스트

**방법**: 정적 분석(node — 네비 링크 분류·body 클래스·배지·행클릭 패턴·구버전 버튼·아이콘·검증표기·
TODO 보존·깨진 링크·서보 DB 물리 일관성) + 브라우저 실동작(15개 전부 위저드 완주, 대표 입력 수계산 대조,
0/무효 입력 방어, 도우미 3종, 모바일 375px 표본 4곳)

**결과 요약**
- 기본동작 15/15 통과 — 수계산 대조 정확: LM(등가하중 200/4=50kgf), 베어링(L10h 공식 소수점까지 일치),
  서보(1800rpm·T=0.087N·m), 유성(설계토크=토크×Kf), 사이클로(×SF×duty), 실린더(수직 도우미 766N)
- 네비 15/15: 15링크×카테고리 정확(전동그리퍼 위치 정상), 깨진 링크 0, 모바일 햄버거 동일 구조
- 컬러 15/15: body 클래스·배지 정확, 판정색(--ok/--warn/--bad)은 카테고리색과 분리 유지
- 행클릭: 신형 10개 적용 완료·stopPropagation 정상. 구형 5개(LM·볼스크류·베어링·서보·스크류잭)는
  설계상 다른 선택 UI(탭·카드·화살표) — **구버전 '선택' 버튼 잔존 없음**. 통일은 다음 작업 후보
- 아이콘: 13/15 적용. **미적용 2개: lmguide, bearing** (다음 작업 범위)
- 데이터: 서보 39모델 중 오차 5% 초과는 기지 4건(LS산전 APM-SC, TODO 보존)뿐,
  실린더 Ø63=CA2 표기 정상(CM2B Ø63 없음), LM C₀ 각주 표시, TODO 주석 전체 보존
- 모바일: 375px 가로 오버플로우 0(실린더·피팅·하모닉), 비교 테이블 가로 스크롤 정상, 콘솔 에러 0

**회귀 테스트 중 수정한 것**
- pneumatic-fr-unit: 전동 드롭다운에 electric-drop 클래스·hover CSS 누락 → 추가 (기능은 정상이었음)
- index: meta description "8종"→15종, 통계바 "14종"→15종, **tool-card 그리드에 스피드 컨트롤러
  카드 누락 → 추가** (14→15카드)
- "데이터 최종 검증" 표기 없던 5개에 상태별 문구 추가: ballscrew(부분 검증), bearing(표본 대조 완료),
  screwjack(내부 일관성 통과), planetary(진행 중·근사값), cycloidal(Nabtesco 완료/Sumitomo 진행 중)

### 2026-07-03 (3차) — 하모닉: Leadshine 제거, Leaderdrive·Laifual 공표 정격표로 보강

- **Leadshine(하모닉 미제조) 전체 삭제** → **Leaderdrive**(중국 1위) LCS(솔리드)·LHS(중공) 14종 추가
  — leaderdrive.com 공표 정격표 기준, HDS와 동일한 tr/rp/mp 감속비별 테이블 구조
- **Laifual** 근사값 전면 교체 → FSS(솔리드, 구 LSS)·FHT(중공, 구 LHT) 15종 — laifualdrive.com
  공표 정격표 기준. 구 표기 "CSF/SHF"는 Laifual 실제 시리즈명이 아니었음
- 두 메이커 모두 HDS CSF 호환 사양 체계(공표값이 CSF 정격표와 일치) — 교차 검증 완료
- 특이사항: Leaderdrive LCS/LHS-50 감속비 50 정격 122 N·m은 메이커 페이지 기재값 그대로
  (HDS 동급 245 대비 낮음, 오기 의심되나 보수적이라 유지 — 카탈로그 PDF 재확인 TODO)
- 호환 메이커 prec 1.5·eff·l10 7000은 보수 추정(TODO). S.makers 키 leadshine→leaderdrive,
  메이커 카드/가이드/메타/링크(leaderdrive.com) 일괄 교체. 45개 모델 무결성(tr≤rp≤mp) 전수 통과

**남은 TODO (카탈로그 확인 필요 — 임의 수정 금지)**
- [ ] servo_motor: MSMF 1kW 이상 5개 모델 nmax (현재 3000, 실제 4500~5000 가능성) — 각 행 주석
- [ ] servo_motor: LS산전 APM-SC10A/15A/20A/30A Tr–nr 불일치 (검증 FAIL 4건) — DB 내 주석
- [ ] servo_motor: 전 모델 J(관성) 값 카탈로그 대조 미완 — DB 상단 주석
- [ ] pneumatic-cylinder: SMC 대구경(Ø50~) 단동 표준 시리즈명 미확정
- [ ] pneumatic-cylinder: ESNU 압력범위 0.5~0.8MPa 의심 (단동 최소압 통상 0.15~0.25MPa)
- [ ] pneumatic-cylinder: CKD SSD/SCA2 보어 라인업 Ø20~100 전체 커버 여부
- [ ] lmguide: TBI·PMI C₀ 추정값의 실측 카탈로그 값 확보
- [ ] pneumatic-gripper: CKD "HGW" 시리즈 실존 미확인 — 실제 시리즈(HMF/LHA 등) 선정 후 재작성
- [ ] pneumatic-gripper: Festo HGPT 32/40 파지력(변형 G1/G2별 상이)·전 사이즈 strokePerSide·단동 표기 검증
- [ ] pneumatic-fitting: CKD 튜빙 TAS/TAN 실존 미확인 — U-95/NU 계열 확인 후 교체
- [ ] electric-gripper: Co-act EGP-C (대형) 파지력 40~230N·EGP 시리즈 IO-Link 지원 여부 검증
- [ ] harmonic-drive: Leaderdrive LCS/LHS-50-50 정격 122 N·m 재확인(메이커 페이지 기재값, 오기 의심),
      호환 메이커(LD·LF) 정밀도·효율·수명 카탈로그 명시값 확보, CSF-8/11 최대입력rpm 확인
- [ ] solenoid-valve: CKD "3F" 실존 미확인 — 실제 3포트 시리즈(3GA/3GB 등) 선정 후 재작성,
      4F2 C값·CPE 대표 품번 유량 확정
- [ ] pneumatic-fr-unit: CKD W시리즈·SMC AW·Festo LFR·AFM40 정격유량 카탈로그 대조
- [ ] speed-controller: [추정] 6건 카탈로그 대조 — AS2211F/AS2052F 조합, GRLA OD 조합·인라인
      시리즈명(GRO/GRE), SC3W 나사-호칭 매핑·인라인(SC1), 각사 미터인/미터아웃 접미사 체계
- [ ] 2차 보고서 🟡 잔여: 유성감속기 PLE 단수·백래시, Sumitomo 사이클로 토크, RV peakMultiplier
      조건, 스크류잭 ZE-200 N/L 비율
- [ ] (UI) 아이콘 시스템 미적용 2개: lmguide, bearing — 스텝바/입력 라벨 아이콘 적용
- [ ] (UI) 구형 5개(LM·볼스크류·베어링·서보·스크류잭) Step5 행 클릭 선택 통일 여부 검토
      (현재는 설계상 다른 선택 UI, 구버전 버튼 잔존은 없음)

## 수정 시 주의사항

- **공급사 섹션 HTML ID 규칙**: `{prefix}-supplier-section`, `{prefix}-supplier-list`  
  LM: `s-`, `a-` / 볼스크류 BS: `bs-` / 베어링: `brg-`
- `s-result-card` / `a-result-card`는 반드시 초기 `hidden` 클래스 유지 (없으면 계산 전 결과가 보임)
- ballscrew.html의 비교 그리드(`.cmp-grid`) 컬럼 수: **10컬럼** — CSS grid-template-columns와 JS의 헤더/셀 추가 수 반드시 일치
- 베어링 SVG는 JS `const SVG = {...}` 객체에 인라인 저장, `initBearingGrid()`에서 DOM에 주입

**서보모터 계산기 (`servo_motor.html`) 수정 시**
- 모터 DB 단위: `J`는 **kg·cm²**, `Tr`/`Tmax`는 **N·m** — 계산 시 `J * 1e-4`로 kg·m² 변환
- `_passingList`는 PASS+FAIL 전체 포함 (PASS 먼저 정렬). PASS만 필요하면 `.filter(r => r.pass)` 추가
- `sel()` 함수는 `step=0`일 때도 sel 클래스 적용 (`step >= 0` 조건) — 설치 방향 버튼에 사용
- 볼스크류 관성 단위 변환: `J_screw = (π*ρ/32) * ds⁴ * Ls * 1e-9` (mm→m 환산 포함, ρ=7.85e-6 kg/mm³)
- `scrollIntoView` 제거됨 — 테이블 하이라이트 시 자동 스크롤 금지 (화살표 UX 유지)
