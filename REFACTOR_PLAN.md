# 공통 코드 리팩토링 계획 (Phase 1 분석) — 2026-07-04

브랜치 `refactor-common` / 백업 태그 `backup-before-refactor` (커밋 d2feb32)

## 1. 완전 중복 블록 (추출 대상)

**CSS 구조 규칙 (계산기 15개 기준 ~85% 동일, 166+ 공통 라인):**
- CSS 변수 `:root` 골격 (--bg, --card, --border, --text*, --ok/warn/bad, --radius, --font, --mono, 카테고리 토큰)
- `.partson-nav` 네비게이션 + `.pnav-drop/.pnav-toggle/.pnav-menu` 드롭다운
- `.card`, `.section-label`, `.btn/.btn-primary/.btn-ghost/.btn-nav`
- `.steps-bar/.step-item/.step-circle/.step-label/.step-line` (위저드 진행바)
- `.step-wrap`, `.question/.question-desc`
- `.choice-grid/.choice-card`, `.check-group/.check-item`, `.radio-group/.radio-item`
- `.input-group/.input-wrap/.input-unit/.input-hint`
- `.tip-btn/.tip-wrap/.tip-popup` (툴팁)
- `.result-grid/.result-card/.rc-*` (결과 카드)
- `.cmp-table*`, `.comparison-row/.row-selected` (비교 테이블 행클릭)
- `#summary-box/.sum-*`, `.maker-link*` (선정 요약)
- `.guide-banner/.guide-*` (30초 가이드)
- `.disclaimer*`, `.no-result*`, 인쇄 `@media print`, 반응형 `@media`
- `.cat-badge` 카테고리 배지
- `pmnav` 모바일 햄버거 (이미 16개 전체 공통 주입 — 스니펫 형태)

**JS 공통 로직:**
- `pnavToggle()` + document click 닫기 (데스크톱 드롭다운) — 15개 동일
- `renderStepsBar()`, `goStep(n)` (위저드 스텝 컨트롤러) — 신형 계산기 다수 동일
- 비교 테이블 행 클릭 `pickModel()`/`row-selected` 토글 패턴
- 가이드 아코디언 `toggleGuide()`, 계산 도우미 아코디언 토글
- `pmnav` IIFE (16개 전체 동일)

## 2. 거의 중복 (페이지별 차이) — ⚠️ 의도/사고 구분

| 차이 | 전동 9개 | 공압 6개 | 판정 |
|---|---|---|---|
| `--accent` | #1A3A2A (green) | #1A3A5C (blue) | **의도** (카테고리 컬러) |
| `--accent-light` | #E8F0EC | #E8EEF5 | **의도** |
| `--accent-mid` | #2D6B4A | #2D5A8B | **의도** |
| `.partson-nav a.active` 밑줄 | #00C853 | #38BDF8 | **의도** |
| `--electric-primary-hover` 등 hover 토큰 | 일부 페이지만 존재 | 일부만 | 미사용 추정 — 사고성, **보고만** |

**페이지 고유 컴포넌트 (인라인 유지):**
- pneumatic-gripper: `.force-preview*` (파지력 미리보기), `.maker-check-list`
- speed-controller/solenoid-valve: `.bore-helper-*/.bh-*` (보어 도우미), `.q-preview`/`.calc-preview`
- pneumatic-cylinder/fitting: 계산 도우미 `.thrust-helper-*/.th-*`
- servo_motor: 토크 파형 Canvas, 화살표 모델 탐색 스타일
- 각 계산기 SVG 선택지 일러스트 스타일

## 3. 🐛 리팩토링 중 발견한 불일치 (수정 안 함 — 별도 작업 대상)

1. **GA(gtag) 누락 10개**: index·lmguide·ballscrew·bearing·servo·screwjack에만 있고
   planetary·cycloidal·harmonic·electric-gripper·공압 6개엔 없음. → 트래킹 누락 사고.
2. **`<footer>` 태그 불일치**: 16개 중 5개(index·lmguide·ballscrew·servo·screwjack)에만 존재.
   나머지 11개는 `.disclaimer`로 끝나고 푸터 없음. → "공통 푸터 추출"이 단순 적용 불가.
   **결정: 없던 페이지에 푸터를 새로 추가하지 않음**(외형 변경 금지 원칙). 푸터는 Phase 3 범위에서
   제외하거나, 있는 페이지에서만 선택적 추출. 불일치는 별도 작업으로 통일 검토.
3. **index 네비 구조 상이**: `nav-inner/navToggle/nav-dropdown/nav-links` (계산기는
   `partson-nav/pnavToggle/pnav-drop`). renderNav()가 두 구조를 모두 커버하거나 index는
   자체 유지. → Phase 3에서 index는 CALCULATORS 배열 데이터만 공유하고 마크업은 자체 유지 검토.

## 4. 추출 계획안

**css/common.css** — 계산기 15개 공통 구조 규칙 + `:root` 기본 토큰(공압/중립) +
`body.category-electric{...}` 토큰 오버라이드. index는 별도 스타일시트라 이번 범위 제외
(또는 index 전용 규칙만 인라인 유지).

**js/common.js** — 최상단 `CALCULATORS` 배열(name·file·category)을 단일 출처로:
- `renderNav()`: 데스크톱 드롭다운 + 모바일 햄버거를 배열 기반 생성 (현 pmnav 스니펫 대체·통합)
- `renderFooter()`: 공통 푸터 (있던 페이지 대상, 신규 추가 금지)
- 위저드/행클릭/툴팁/도우미 공통 유틸
- index 버튼 그룹·"N종" 통계도 CALCULATORS 기반 렌더 (하드코딩 숫자 제거)

## 4-B. ⚠️ Phase 2 실측 결과 — CSS 추출 전제 재검토 필요

앞서 "CSS ~85% 공통"은 최근 공압 두 페이지끼리 비교값이었음. **15개 전체 실측 결과 전제가 다름:**

- **바이트 동일 교집합**(전 15페이지): 액센트·공백 정규화 후에도 **8개 규칙뿐**
- 12+ 페이지 공통 27개 / 8+ 페이지 공통 123개 — "대부분 공통이나 조금씩 다름"
- 대표 규칙 변형 수: `.btn` **6종**, `.step-circle` 5종, `.card`/`.result-card` 3~4종,
  `.pnav-menu` 2종(fr-unit min-width 195 vs 나머지 185)
- 원인 혼재: ① 의도적(lmguide는 위저드/result-card 없음 등 계산기별 구조 차이),
  ② 시간차 수작업 드리프트(같은 컴포넌트인데 값·속성 미세 상이)

**함의**: 안전한(렌더 무변) 대형 common.css 추출이 불가. 의미 있는 common.css를 만들려면
100+ 규칙을 정본으로 **통일**해야 하는데, 이는 「임의 통일 금지」·「외형 변경 절대 금지」와
충돌하고 라이브 15페이지 렌더링을 바꿀 위험. → **Phase 2는 사용자 결정 없이 강행하지 않음.**

**대안 경로:**
- (A) Phase 2(CSS 통일) 보류, **Phase 3(네비/CALCULATORS 단일 출처)만 진행** — 안전·고가치.
  네비 마크업은 14/15 동일하고 모바일 pmnav는 이미 공통. 사용자 핵심 목표(네비 한 파일 수정,
  개수 불일치 차단) 직접 달성.
- (B) CSS 정본 통일 패스 + 시각 회귀 검증(전 페이지 computed style 대조) — 소폭 렌더 변경
  위험 감수, 고비용.
- (C) 진짜 안전한 부분집합(해당 규칙 보유 페이지 간 동일한 것)만 추출 — 가치 작음, 저위험.

## 5. 안전 원칙
- main 병합 금지(브랜치 작업), 단계별 커밋, 각 Phase 검증 통과 후 진행
- CNAME 보존, 본문 정적 콘텐츠 JS 주입 금지
- 발견 버그는 보고만, 리팩토링 커밋에 기능 변경 혼입 금지
- 복구: 병합 후 이상 시 `git reset --hard backup-before-refactor && git push --force`
