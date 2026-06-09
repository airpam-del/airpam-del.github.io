# CAD 도면 다운로드 기능 구현 요청

## 목적
계산기에서 부품 선정 후, 선정된 모델의 CAD 도면을 바로 다운로드할 수 있도록 연결.
사용자가 계산기 밖에서 다시 부품을 찾는 불편함을 없애는 것이 핵심 목표.

## 방식
**TraceParts 링크 연결 방식**
- TraceParts(traceparts.com)는 무료 CAD 도면 플랫폼
- SOLIDWORKS, STEP, DXF, PDF 등 거의 모든 포맷 지원
- 계산기에서 선정된 제조사 + 시리즈에 맞는 TraceParts 페이지로 바로 이동
- 모델 URL은 시리즈별로 미리 매핑해둠

## 구현 위치
계산기 결과 화면 하단 공급사 섹션 근처에 **"CAD 도면 다운로드"** 버튼 추가.
선정된 사이즈에 맞는 TraceParts 페이지로 새 탭으로 이동.

---

## TraceParts 링크 매핑

### LM Guide (lmguide.html)

| 제조사 | 시리즈 | TraceParts URL |
|--------|--------|----------------|
| THK | HSR | https://www.traceparts.com/en/search/thk-lm-guide-hsr?CatalogPath=THK:F_THK |
| HIWIN | HGH | https://www.traceparts.com/en/search/hiwin-hgh?CatalogPath=HIWIN |
| Bosch Rexroth | NRTVG | https://www.traceparts.com/en/search/bosch-rexroth-nrtvg |
| TBI | TRH | https://www.traceparts.com/en/search/tbi-trh |
| PMI | MSA | https://www.traceparts.com/en/search/pmi-msa |

※ 각 링크는 실제 TraceParts 검색 결과로 연결. 사이즈는 TraceParts 페이지에서 직접 선택.

### 볼스크류 (ballscrew.html)
- 결과에서 선정된 직경 × 리드 조합에 맞는 제조사별 TraceParts 링크 연결
- 제조사 4개사(THK, HIWIN, Bosch Rexroth, NSK) 각각 매핑

### 베어링 (bearing.html)
- 선정된 베어링 타입 + 내경 기준으로 TraceParts 연결

---

## UI 구현 방법

### 버튼 위치
- 결과 카드 하단, 공급사 연결 버튼 옆 또는 아래
- 버튼 텍스트: `📐 CAD 도면 다운로드`
- 클릭 시 새 탭(`target="_blank"`)으로 TraceParts 해당 페이지 이동

### 버튼 스타일
- 기존 디자인 시스템 유지 (딥그린 #1A3A2A)
- 공급사 연결 버튼과 동일한 스타일로 통일

### 코드 예시 (lmguide.html 기준)
```javascript
const TRACEPARTS_LM = {
  'THK HSR':           'https://www.traceparts.com/en/search/thk-hsr',
  'HIWIN HGH':         'https://www.traceparts.com/en/search/hiwin-hgh',
  'Bosch Rexroth NRTVG': 'https://www.traceparts.com/en/search/bosch-rexroth-nrtvg',
  'TBI TRH':           'https://www.traceparts.com/en/search/tbi-trh',
  'PMI MSA':           'https://www.traceparts.com/en/search/pmi-msa',
};

function openCADDownload(maker, size) {
  const url = TRACEPARTS_LM[maker];
  if (url) window.open(url + '-' + size, '_blank');
}
```

---

## 우선순위
1. **lmguide.html** — 먼저 구현 (가장 많이 사용)
2. **ballscrew.html** — 두 번째
3. **bearing.html** — 세 번째

---

## 주의사항
- TraceParts URL은 실제 접속 확인 후 정확한 URL로 교체 필요
- 링크가 깨질 경우를 대비해 "링크가 작동하지 않으면 traceparts.com에서 직접 검색하세요" 안내 문구 추가
- 새 탭으로 열기 (`target="_blank"`, `rel="noopener"`)
