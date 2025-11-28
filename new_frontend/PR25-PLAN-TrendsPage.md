# PR25-PLAN-TrendsPage

## TrendsPage 이식 상세 계획서

**Source**: `frontend/src/pages/TrendsPage.tsx` (505 lines)
**Target**: `new_frontend/src/pages/TrendsPageEnhanced.tsx` (469 lines)

---

## 1. 기능 비교 테이블

| 기능 | frontend/ | new_frontend/ | 이식 필요 |
|------|-----------|---------------|-----------|
| News Feed | ✅ 뉴스 카드 + 북마크 (202-264) | ❌ 없음 | **P0 필수** |
| Clinical Trials | ✅ 임상시험 목록 + 페이지네이션 (371-493) | ❌ 없음 | **P0 필수** |
| Popular Keywords | ✅ 랭킹 위젯 (271-304) | ❌ 없음 | **P1 권장** |
| Research Chart | ✅ Recharts LineChart (306-366) | ❌ 없음 | **P1 권장** |
| Query Builder | ❌ 없음 | ✅ 있음 | 유지 |
| Analysis Selector | ❌ 없음 | ✅ 있음 | 유지 |
| Paper Comparison | ❌ 없음 | ✅ 있음 | 유지 |
| AI Summary | ❌ 없음 | ✅ 있음 | 유지 |

---

## 2. 이식할 코드 스니펫

### P0-1: News Feed 컴포넌트

**Source Location**: `frontend/src/pages/TrendsPage.tsx:202-264`

```tsx
{/* News Tab Content */}
{activeTab === 'news' && (
  <div className="space-y-4">
    {newsItems.map((news) => (
      <div
        key={news.id}
        onClick={() => navigate(`/news/detail/${news.id}`)}
        className="bg-white rounded-[16px] overflow-hidden cursor-pointer transition-shadow hover:shadow-lg relative flex flex-col md:flex-row"
        style={{
          boxShadow: '0px 2px 8px 0px rgba(0,0,0,0.08)',
          minHeight: '180px'
        }}
      >
        {/* Image Section */}
        <div className="relative w-full md:w-[160px] h-[160px] md:h-auto flex-shrink-0">
          <ImageWithFallback
            src={news.image}
            alt={news.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content Section */}
        <div className="flex-1 p-4 md:p-5 md:pl-6 flex flex-col justify-between">
          <div className="flex-1">
            {/* Title */}
            <h4
              className="font-bold text-black mb-2 line-clamp-2"
              style={{
                fontSize: '15px',
                lineHeight: '22px',
                fontFamily: 'Noto Sans KR, sans-serif'
              }}
            >
              {news.title}
            </h4>

            {/* Description */}
            <p
              className="text-[#272727] line-clamp-3"
              style={{
                fontSize: '13px',
                lineHeight: '19px',
                fontFamily: 'Noto Sans KR, sans-serif'
              }}
            >
              {news.description}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-2">
            <p
              className="text-[#777777]"
              style={{ fontSize: '11px' }}
            >
              {news.source} | {news.time}
            </p>
            <Bookmark size={20} color="#CCCCCC" strokeWidth={1.4} />
          </div>
        </div>
      </div>
    ))}
  </div>
)}
```

**News Item Interface**:
```typescript
interface NewsItem {
  id: string;
  title: string;
  source: string;
  time: string;
  description: string;
  image: string;
}
```

---

### P0-2: Clinical Trials Tab (페이지네이션 포함)

**Source Location**: `frontend/src/pages/TrendsPage.tsx:371-493`

```tsx
{/* Clinical Trials Tab Content */}
{activeTab === 'clinical-trials' && (
  <div className="space-y-4">
    {/* Section Header */}
    <h3
      className="font-bold text-[#1F2937] mb-4"
      style={{ fontSize: '18px', fontFamily: 'Noto Sans KR, sans-serif' }}
    >
      임상시험
    </h3>

    {/* Info Banner */}
    <div
      className="rounded-[16px] p-4 mb-6"
      style={{
        background: 'linear-gradient(135deg, #EFF6FF 0%, #F9FAFB 100%)',
        border: '1px solid #E0F2FE'
      }}
    >
      <p className="text-[#272727]" style={{ fontSize: '14px', lineHeight: '20px' }}>
        신장 질환 관련 임상시험 정보를 ClinicalTrials.gov에서 제공받고 있습니다.
        각 임상시험을 클릭하면 AI가 요약한 정보를 확인할 수 있습니다.
        (최신 업데이트순으로 정렬됨)
      </p>
    </div>

    {/* Loading State */}
    {loadingTrials ? (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="animate-spin mb-4" size={48} color="#00C9B7" />
        <p className="text-[#9CA3AF]">임상시험 정보를 불러오는 중...</p>
      </div>
    ) : clinicalTrials.length > 0 ? (
      <>
        {/* Clinical Trials List */}
        <div className="grid grid-cols-1 gap-4">
          {clinicalTrials.map((trial) => (
            <ClinicalTrialCard
              key={trial.nctId}
              trial={trial}
              onClick={() => handleTrialClick(trial.nctId)}
            />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: currentPage === 1 ? '#F3F4F6' : '#00C9B7',
                color: currentPage === 1 ? '#9CA3AF' : 'white'
              }}
            >
              이전
            </button>

            {/* Page Numbers with Ellipsis */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className="w-10 h-10 rounded-lg transition-colors"
                    style={{
                      backgroundColor: currentPage === pageNum ? '#00C9B7' : '#F3F4F6',
                      color: currentPage === pageNum ? 'white' : '#272727',
                      fontWeight: currentPage === pageNum ? 'bold' : 'normal'
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: currentPage === totalPages ? '#F3F4F6' : '#00C9B7',
                color: currentPage === totalPages ? '#9CA3AF' : 'white'
              }}
            >
              다음
            </button>
          </div>
        )}
      </>
    ) : (
      <div className="text-center py-12">
        <p className="text-[#9CA3AF]">임상시험 정보를 찾을 수 없습니다.</p>
      </div>
    )}
  </div>
)}
```

---

### P1-1: Popular Keywords 위젯

**Source Location**: `frontend/src/pages/TrendsPage.tsx:271-304`

```tsx
{/* Keywords Section */}
<section>
  <h3 className="mb-4 font-bold text-[#1F2937]">
    📈 인기 키워드
  </h3>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {[
      { text: '당뇨병성 신증', count: 1245, rank: 1 },
      { text: '25년 복지 수당 신청', count: 1087, rank: 2 },
      { text: '저칼륨 식단', count: 924, rank: 3 },
      { text: '투석 관리', count: 856, rank: 4 }
    ].map((keyword, index) => (
      <div
        key={index}
        className="p-4 rounded-lg border transition-all duration-200 hover:shadow-sm bg-white border-gray-200"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="flex items-center justify-center rounded-full bg-[#EFF6FF] text-[#00C8B4] font-bold text-sm w-7 h-7"
            >
              {keyword.rank}
            </span>
            <span className="text-sm font-medium text-[#1F2937]">{keyword.text}</span>
          </div>

          <span className="text-xs text-gray-400">
            {keyword.count.toLocaleString()}
          </span>
        </div>
      </div>
    ))}
  </div>
</section>
```

---

### P1-2: Research Trends Chart (Recharts)

**Source Location**: `frontend/src/pages/TrendsPage.tsx:306-366`

```tsx
{/* Research Trends - PubMed Data */}
<section>
  <h3 className="mb-4 font-bold text-[#1F2937]">
    📊 연구 트렌드
  </h3>

  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
    <p className="mb-4 text-sm text-gray-500">
      신장병 관련 주제별 PubMed 연구 논문 발행 추이
    </p>
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={researchData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="date"
          stroke="#9CA3AF"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke="#9CA3AF"
          style={{ fontSize: '12px' }}
        />
        <Tooltip
          contentStyle={{
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Legend wrapperStyle={{ paddingTop: '20px' }} />
        <Line
          type="monotone"
          dataKey="ckd"
          stroke="#00C8B4"
          strokeWidth={3}
          name="만성신장병"
          dot={{ fill: '#00C8B4', r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="treatment"
          stroke="#9F7AEA"
          strokeWidth={3}
          name="치료법"
          dot={{ fill: '#9F7AEA', r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="diet"
          stroke="#FFB84D"
          strokeWidth={3}
          name="식이요법"
          dot={{ fill: '#FFB84D', r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  </div>
</section>
```

**Research Data**:
```typescript
const researchData = [
  { date: '2020', ckd: 120, treatment: 80, diet: 95 },
  { date: '2021', ckd: 145, treatment: 98, diet: 112 },
  { date: '2022', ckd: 178, treatment: 125, diet: 134 },
  { date: '2023', ckd: 210, treatment: 156, diet: 167 },
  { date: '2024', ckd: 245, treatment: 189, diet: 198 },
  { date: '2025', ckd: 268, treatment: 215, diet: 223 }
];
```

---

## 3. API 연동

**Clinical Trials API**:
```typescript
// API 호출
const fetchClinicalTrials = async (page: number) => {
  setLoadingTrials(true);
  try {
    const response = await fetch('/api/clinical-trials/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        condition: 'kidney',
        page: page,
        page_size: 10,
      }),
    });

    if (!response.ok) throw new Error('Failed to fetch clinical trials');

    const data = await response.json();
    setClinicalTrials(data.trials);
    setTotalPages(data.totalPages || 1);
    setCurrentPage(page);
  } catch (error) {
    console.error('Error fetching clinical trials:', error);
  } finally {
    setLoadingTrials(false);
  }
};
```

---

## 4. 통합 구조 제안

**new_frontend의 Step 기반 UI 유지 + frontend의 탭 컨텐츠 추가**:

```
TrendsPageEnhanced
├── QueryBuilder (new_frontend 유지)
├── AnalysisSelector (new_frontend 유지)
├── Results View (new_frontend 유지)
│   ├── ChartRenderer
│   ├── PaperList
│   ├── PaperComparison
│   └── SummaryPanel
│
└── [추가] Quick Access Tabs
    ├── News Feed (frontend에서 이식)
    ├── Popular Keywords (frontend에서 이식)
    └── Clinical Trials (frontend에서 이식)
```

---

## 5. Dependencies

| 패키지 | frontend/ | new_frontend/ | 비고 |
|--------|-----------|---------------|------|
| recharts | ✅ 2.15.2 | ❌ 미설치 | **설치 필요** |
| lucide-react | ✅ | ✅ | 동일 |

**설치 명령어**:
```bash
cd new_frontend && npm install recharts@2.15.2
```

---

## 6. 구현 계획

### Phase 1: News Feed

1. `NewsFeed` 컴포넌트 생성
2. 뉴스 아이템 카드 UI 구현
3. 북마크 기능 추가 (UI만)

### Phase 2: Clinical Trials

1. `ClinicalTrialCard` 컴포넌트 이식
2. 페이지네이션 로직 구현
3. API 연동 확인

### Phase 3: Dashboard 탭

1. `recharts` 설치
2. Popular Keywords 위젯 구현
3. Research Trends Chart 구현

---

## 7. 스타일 가이드라인

| 요소 | 값 |
|------|-----|
| 뉴스 카드 shadow | `0px 2px 8px 0px rgba(0,0,0,0.08)` |
| 뉴스 카드 radius | `rounded-[16px]` |
| 키워드 랭크 배경 | `bg-[#EFF6FF]` |
| 키워드 랭크 색상 | `text-[#00C8B4]` |
| 차트 틸 색상 | `#00C8B4` |
| 차트 보라 색상 | `#9F7AEA` |
| 차트 노랑 색상 | `#FFB84D` |
| Info Banner 배경 | `linear-gradient(135deg, #EFF6FF 0%, #F9FAFB 100%)` |

---

*Generated: 2025-11-27*
