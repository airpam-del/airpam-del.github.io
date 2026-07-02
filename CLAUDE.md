# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

**PartsOn Linear** — 기계 부품(LM Guide, 볼스크류, 베어링) 선정/수명 계산기 + 공급사 연결 플랫폼.  
배포: https://partson.co.kr (GitHub Pages — airpam-del/airpam-del.github.io, main 브랜치)

## 배포 방법

백엔드/빌드 도구 없음. 순수 HTML+CSS+JS 정적 파일.

**배포 저장소:** `D:\여홍 업무\partson-live\` (GitHub 연결된 git 저장소)  
**배포 방법:** `PartsOn 배포\` 파일을 `partson-live\`에 복사 후 git commit & push → 자동 배포

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

**남은 TODO (카탈로그 확인 필요 — 임의 수정 금지)**
- [ ] servo_motor: MSMF 1kW 이상 5개 모델 nmax (현재 3000, 실제 4500~5000 가능성) — 각 행 주석
- [ ] servo_motor: LS산전 APM-SC10A/15A/20A/30A Tr–nr 불일치 (검증 FAIL 4건) — DB 내 주석
- [ ] servo_motor: 전 모델 J(관성) 값 카탈로그 대조 미완 — DB 상단 주석
- [ ] pneumatic-cylinder: SMC 대구경(Ø50~) 단동 표준 시리즈명 미확정
- [ ] pneumatic-cylinder: ESNU 압력범위 0.5~0.8MPa 의심 (단동 최소압 통상 0.15~0.25MPa)
- [ ] pneumatic-cylinder: CKD SSD/SCA2 보어 라인업 Ø20~100 전체 커버 여부
- [ ] lmguide: TBI·PMI C₀ 추정값의 실측 카탈로그 값 확보

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
