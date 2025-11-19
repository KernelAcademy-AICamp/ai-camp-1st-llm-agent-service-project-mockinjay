# 병원·약국 2025년 9월 공공데이터 + 혈액투석기 + 야간투석 통합 NoSQL 파이프라인

## 개요

2025년 9월 건강보험심사평가원 공공데이터를 기반으로 전국 병원/약국 정보와 혈액투석기 대수, 야간투석 운영 정보를 통합하여 NoSQL(MongoDB)에 최적화된 데이터셋을 생성하는 파이프라인입니다.

---

## 데이터 출처

| 우선순위 | 파일명 | 출처 | 설명 |
|:---:|---|---|---|
| 1순위 | `7.의료기관별상세정보서비스_05_의료장비정보 2025.9.xlsx` | 건강보험심사평가원 | **D214 코드 = 혈액투석기 대수 (정확도 100%)** |
| 2순위 | `hira_night_dialysis.pdf` | 심평원 야간투석 공개자료 | 야간투석 운영 병원 목록 |
| 3순위 | `1.병원정보서비스(2025.9).xlsx` | 건강보험심사평가원 | 전국 병원/의원 기본정보 |
| 3순위 | `2._약국정보서비스(2025.9).xlsx` | 건강보험심사평가원 | 전국 약국 기본정보 |

**구글드라이브 링크**: [다운로드](https://drive.google.com/drive/folders/1fNGxXcPWqiXcYQtAbUCfgNv2TQRiKYKI?usp=sharing)

---

## NoSQL 최적 컬럼 설계

| 컬럼명 | 타입 | 설명 | 챗봇 활용 |
|---|---|---|---|
| `name` | string | 요양기관명 | 검색 키워드 |
| `address` | string | 주소 | 위치 안내 |
| `phone` | string | 전화번호 | 예약 연결 |
| `region` | string | 시도명 | 지역 필터링 |
| `type` | string | 병원/의원 또는 약국 | 타입 필터링 |
| `dialysis_machines` | int | 혈액투석기 대수 (D214) | **투석 가능 여부 판단** |
| `has_dialysis_unit` | bool | 투석실 보유 여부 | 빠른 필터링 |
| `night_dialysis` | bool | 야간투석 운영 여부 | **야간 환자 안내** |
| `dialysis_days` | string | 야간투석 요일 | 상세 안내 |
| `lat` | float | 위도 (WGS84) | 지도 표시 |
| `lng` | float | 경도 (WGS84) | 지도 표시 |
| `coord_source` | string | 좌표 출처 (public_data/kakao) | 정확도 확인 |
| `naver_map_url` | string | 네이버지도 링크 | 바로가기 |
| `kakao_map_url` | string | 카카오맵 링크 | 바로가기 |
| `updated_at` | datetime | 처리 일시 | 데이터 버전 관리 |

---

## 실행 방법

### 1. 환경 설정

```bash
# 가상환경 활성화
source .venv/bin/activate

# 필요 패키지 설치
pip install pandas openpyxl PyPDF2 tqdm requests python-dotenv
```

### 2. 데이터 파일 배치

구글드라이브에서 다운로드 후 아래 경로에 배치:

```
data/raw/healthcareproviders/
├── 1.병원정보서비스(2025.9).xlsx
├── 2._약국정보서비스(2025.9).xlsx
├── 7.의료기관별상세정보서비스_05_의료장비정보 2025.9.xlsx
└── hira_night_dialysis.pdf
```

### 3. 카카오맵 API 키 설정 (선택)

`.env` 파일에 카카오 REST API 키 추가:

```bash
KAKAO_REST_API_KEY=여기에_실제_키_입력
```

> 카카오 API 키가 없어도 공공데이터 좌표로 실행됩니다.
> API 키가 있으면 좌표 오류를 99.9% 정확도로 보정합니다.

### 4. 전처리 실행

```bash
python preprocess/hospital_dialysis_preprocess.py
```

### 5. 출력 확인

```
processed/
├── hospital_pharmacy_dialysis_2025.csv   (엑셀 호환, utf-8-sig)
└── hospital_pharmacy_dialysis_2025.jsonl (MongoDB 업로드용)
```

---

## MongoDB 업로드

```bash
# 방법 1: mongoimport (권장)
mongoimport --db=careguide --collection=healthcare_providers \
  --file=processed/hospital_pharmacy_dialysis_2025.jsonl

# 방법 2: Python
from pymongo import MongoClient
import json

client = MongoClient('mongodb://localhost:27017')
db = client['careguide']
collection = db['healthcare_providers']

with open('processed/hospital_pharmacy_dialysis_2025.jsonl', 'r') as f:
    for line in f:
        doc = json.loads(line)
        collection.insert_one(doc)

print(f"총 {collection.count_documents({})}건 업로드 완료")
```

---

## 챗봇 활용 예시

### 1. 야간투석 가능한 병원 찾기

```python
# MongoDB 쿼리
db.healthcare_providers.find({
    "night_dialysis": true,
    "region": "서울특별시"
}).limit(10)
```

**챗봇 응답 예시**:
> "서울에서 야간투석이 가능한 병원을 찾았습니다:
> 1. OO병원 (강남구) - 투석기 15대, 월/수/금 야간 운영
> 2. XX의원 (송파구) - 투석기 8대, 화/목 야간 운영
> [네이버지도로 보기] [카카오맵으로 보기]"

### 2. 투석기 많은 병원 순위

```python
db.healthcare_providers.find({
    "has_dialysis_unit": true
}).sort("dialysis_machines", -1).limit(5)
```

### 3. 특정 지역 투석 병원 검색

```python
db.healthcare_providers.find({
    "has_dialysis_unit": true,
    "region": {"$regex": "경기"}
})
```

---

## 데이터 통계 (2025년 9월 기준)

| 항목 | 건수 |
|---|---:|
| 총 의료기관 | 104,836건 |
| 병원/의원 | 79,322건 |
| 약국 | 25,514건 |
| 혈액투석기 보유 | 1,363곳 |
| 총 투석기 대수 | 40,152대 |
| 야간투석 운영 | 260곳 |

---

## 파일 구조

```
ai-camp-1st-llm-agent-service-project-mockinjay/
├── data/
│   └── raw/
│       └── healthcareproviders/     # 원본 파일 (git 제외)
├── preprocess/
│   └── hospital_dialysis_preprocess.py  # 전처리 스크립트
├── processed/                       # 출력 파일 (git 제외)
│   ├── hospital_pharmacy_dialysis_2025.csv
│   └── hospital_pharmacy_dialysis_2025.jsonl
├── .env                             # API 키 (git 제외)
├── .env.example                     # API 키 템플릿
└── README_HOSPITAL_DATA.md          # 이 문서
```

---

## 주의사항

1. **D214 코드 우선**: 혈액투석기 대수는 반드시 7번 엑셀의 D214 코드만 사용
2. **좌표 검증**: 위도 33~39, 경도 124~132 범위 외 데이터는 카카오맵으로 보정
3. **인코딩**: CSV는 `utf-8-sig`로 저장 (엑셀에서 한글 깨짐 방지)
4. **API 제한**: 카카오맵 API는 일일 30만건 제한, 0.02초 딜레이 적용

---

## 라이선스

- 공공데이터: 공공누리 1유형 (출처 표시)
- 코드: MIT License

---

**작성일**: 2025-11-19
**버전**: 1.0.0
**AI-CAMP 1기 프로젝트**
