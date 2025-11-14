# CareGuide

> 만성콩팥병(CKD) 환자를 위한 종합 케어 플랫폼

## 프로젝트 개요

CareGuide는 만성콩팥병 환자에게 AI 챗봇 기반 의료정보, 영양 관리, 커뮤니티 기능을 제공하는 웹 플랫폼입니다.

## 기술 스택

### Backend
- Python 3.10+
- FastAPI
- MongoDB
- OpenAI API

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Vite

## 프로젝트 구조

```
.
├── backend/          # Python 백엔드
│   ├── app/
│   │   ├── main.py
│   │   ├── api/      # API 라우터
│   │   ├── models/   # 데이터 모델
│   │   ├── services/ # 비즈니스 로직
│   │   └── db/       # DB 연결
│   └── requirements.txt
├── frontend/         # React 프론트엔드
│   ├── src/
│   └── package.json
└── data/            # 데이터 파일
```

## 실행 방법

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 팀 구성

- **Yj**: Nutri Coach (영양 관리)
- **ch**: Community (커뮤니티)
- **jh**: Knowledge Search, Trends (지식 검색, 대시보드)
- **jk**: Sign up, My Page (회원가입, 마이페이지)

## 문서

- [기술 명세](./tech-spec.md)
- [통합 가이드](./integration-guide.md)
- 개별 개발 계획: [jk](./jk-plan.md), [jh](./jh-plan.md), [Yj](./Yj-plan.md), [ch](./ch-plan.md)
