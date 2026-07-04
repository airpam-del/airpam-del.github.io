# 리팩토링 기준 상태 (refactor-common 브랜치) — 2026-07-04

리팩토링 전후 동작·외형 동일성 검증의 기준. 각 Phase 검증 시 이 표와 대조.

## 파일 기준 (backup-before-refactor 태그 = 커밋 d2feb32 시점)

| 파일 | 크기(B) | 라인 | 네비 구조 | 위저드 | 비교 UI | body class | footer | GA |
|---|---|---|---|---|---|---|---|---|
| index.html | 66470 | 2014 | nav-inner/navToggle | (히어로·툴카드) | - | (없음) | Y | Y |
| lmguide.html | 93538 | 1329 | partson-nav | 탭(Simple/Adv) | - | electric | Y | Y |
| ballscrew.html | 118706 | 1655 | partson-nav | 6스텝 | cmp테이블 | electric | Y | Y |
| bearing.html | 105123 | 1593 | partson-nav | 다단 | - | electric | - | Y |
| servo_motor.html | 134558 | 1835 | partson-nav | 5스텝 | 화살표탐색 | electric | Y | Y |
| screwjack.html | 84146 | 1431 | partson-nav | 5스텝 | - | electric | Y | Y |
| planetary-gearbox.html | 73468 | 1235 | partson-nav | 5스텝 | row클릭 | electric | - | - |
| cycloidal-gearbox.html | 78427 | 1248 | partson-nav | 5스텝 | row클릭 | electric | - | - |
| harmonic-drive.html | 80111 | 1140 | partson-nav | 5스텝 | row클릭 | electric | - | - |
| electric-gripper.html | 54698 | 988 | partson-nav | 5스텝 | row클릭 | electric | - | - |
| pneumatic-cylinder.html | 69259 | 1186 | partson-nav | 5스텝 | row클릭 | pneumatic | - | - |
| solenoid-valve.html | 77377 | 1302 | partson-nav | 5스텝 | row클릭 | pneumatic | - | - |
| pneumatic-fitting.html | 64430 | 1122 | partson-nav | 5스텝 | row클릭 | pneumatic | - | - |
| pneumatic-fr-unit.html | 60282 | 996 | partson-nav | 5스텝 | row클릭 | pneumatic | - | - |
| pneumatic-gripper.html | 56928 | 987 | partson-nav | 5스텝 | row클릭 | pneumatic | - | - |
| speed-controller.html | 68205 | 1176 | partson-nav | 5스텝 | row클릭 | pneumatic | - | - |

## 계산기별 기준 계산값 (동일 입력 → 동일 결과 검증용)

- **servo_motor**: 볼스크류 직결, 리드10·축경20·길이500·질량50kg·속도300mm/s·가속0.1s·수명8000h
  → n_motor **1800 rpm**, T_drive **0.087 N·m**, PASS **25/39**, 첫 PASS **HG-KR43(400W)**
- **pneumatic-cylinder**: 수직 도우미 40kg×1.3 → 필요추력 **766 N**; 필요추력 700N·0.5MPa·복동
  → 첫 결과 **SMC CA2 Ø63**(권장 전진추력 795N)
- **lmguide**: Simple 하중200kg·스트로크500·블록4·속도30·8h
  → 등가하중 **50.0 kgf**, 추천 **size 15**, 안전율 **29.3배**

## 절대 보존 항목
- **CNAME = partson.co.kr** (루트, 과거 삭제로 도메인 풀린 사고 있음)
- 페이지 본문 정적 콘텐츠(계산기 제목·설명) — JS 주입 전환 금지 (SEO)
- 계산기별 데이터·계산 함수 — 리팩토링 범위 밖
