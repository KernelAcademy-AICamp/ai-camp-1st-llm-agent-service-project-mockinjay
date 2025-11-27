/**
 * CareGuide Information Architecture
 * TypeScript Type Definitions
 * 
 * @version 1.0
 * @description 만성콩팥병 환자 종합 케어 플랫폼 라우팅 타입 정의
 */

// ============================================
// 기본 타입 정의
// ============================================

/**
 * 라우트 Depth 레벨
 */
export type RouteDepth = 1 | 2;

/**
 * AI Agent 타입
 */
export type AgentType = 'medical_welfare' | 'nutrition' | 'research';

/**
 * 화면 표시 방식
 */
export type DisplayType = 'page' | 'modal' | 'drawer';

/**
 * 사용자 권한 레벨
 */
export type UserRole = 'general' | 'patient' | 'researcher' | 'admin';

// ============================================
// 라우트 인터페이스
// ============================================

/**
 * 기본 라우트 정보
 */
export interface BaseRoute {
  /** 라우트 고유 ID */
  id: string;
  /** 한글 이름 */
  name: string;
  /** 영문 이름 (선택) */
  nameEn?: string;
  /** URL 경로 */
  path: string;
  /** 설명 */
  description: string;
  /** Depth 레벨 */
  depth: RouteDepth;
  /** 메인 기능 여부 */
  isMain?: boolean;
  /** 화면 표시 방식 (기본: page) */
  displayType?: DisplayType;
  /** 접근 권한 (기본: 모든 사용자) */
  requiredRole?: UserRole[];
}

/**
 * AI 챗봇 라우트 (Agent 포함)
 */
export interface ChatRoute extends BaseRoute {
  /** AI Agent 타입 */
  agent?: AgentType;
}

/**
 * 기능을 포함한 라우트
 */
export interface FeatureRoute extends BaseRoute {
  /** 세부 기능 목록 */
  features?: string[];
}

/**
 * 자식 라우트를 포함한 부모 라우트
 */
export interface ParentRoute extends BaseRoute {
  /** 자식 라우트 */
  children: Route[];
}

/**
 * 통합 라우트 타입
 */
export type Route = BaseRoute | ChatRoute | FeatureRoute | ParentRoute;

// ============================================
// 라우트 상수 정의
// ============================================

/**
 * 라우트 경로 상수
 */
export const ROUTES = {
  // Main
  MAIN: '/main',
  
  // AI Chatbot
  CHAT: '/chat',
  CHAT_MEDICAL_WELFARE: '/chat/medical-welfare',
  CHAT_NUTRITION: '/chat/nutrition',
  CHAT_RESEARCH: '/chat/research',
  
  // Diet Care
  DIET_CARE: '/diet-care',
  NUTRI_COACH: '/nutri-coach',
  DIET_LOG: '/diet-log',
  DIET_TYPE_DETAIL: '/diet-care/diet-type/:dietType',

  // Community
  COMMUNITY: '/community',
  COMMUNITY_LIST: '/community-list',
  COMMUNITY_DETAIL: '/community/:postId',

  // Trends
  TRENDS: '/trends',
  TRENDS_LIST: '/trends-list',
  TRENDS_DETAIL: '/trends-detail',
  
  // Quiz
  QUIZ: '/quiz',
  QUIZ_LIST: '/quiz/list',
  QUIZ_LEVEL: '/quiz/level',
  QUIZ_DAILY: '/quiz/daily',
  QUIZ_COMPLETION: '/quiz/completion',

  // News Detail
  NEWS_DETAIL: '/news/detail/:id',

  // Community Detail/Edit/Create
  COMMUNITY_CREATE: '/community/create',
  COMMUNITY_EDIT: '/community/edit/:id',

  // MyPage Subpages
  MY_PAGE_PROFILE: '/mypage/profile',
  MY_PAGE_KIDNEY_STAGE: '/mypage/profile/kidney-disease-stage',
  MY_PAGE_HEALTH_RECORDS: '/mypage/test-results',
  MY_PAGE_BOOKMARK: '/mypage/bookmark',

  // Utility
  UTILITY: '/utility',
  SIGNUP: '/signup',
  LOGIN: '/login',
  CHANGE_PASSWORD: '/changepw',
  MY_PAGE: '/mypage',
  SUBSCRIBE: '/subscribe',
  NOTIFICATION: '/notification',
  SUPPORT: '/support',
  TERMS_CONDITIONS: '/terms-conditions',
  PRIVACY_POLICY: '/privacy-policy',
  COOKIE_CONSENT: '/cookie-consent',
  ERROR: '/error',
} as const;

/**
 * 라우트 이름 상수
 */
export const ROUTE_NAMES = {
  MAIN: 'Main',
  AI_CHATBOT: 'AI챗봇',
  MEDICAL_WELFARE: '의료 복지',
  NUTRITION: '식이 영양',
  RESEARCH_PAPER: '연구 논문',
  DIET_CARE: '식단케어',
  NUTRI_COACH: '뉴트리 코치',
  DIET_LOG: '식단 로그',
  COMMUNITY: '커뮤니티',
  TRENDS: '트렌드',
  UTILITY: '유틸리티',
  SIGNUP: '회원가입',
  LOGIN: '로그인',
  MY_PAGE: '마이페이지',
} as const;

// ============================================
// 라우트 구조 정의
// ============================================

/**
 * CareGuide 전체 IA 구조
 */
export const CAREGUIDE_IA: ParentRoute[] = [
  // 1. Main
  {
    id: 'main',
    name: 'Main',
    path: ROUTES.MAIN,
    description: 'URL 진입 시 splash, BI로고 클릭 시 /chat으로 direct',
    depth: 1,
    children: [],
  },

  // 2. AI Chatbot
  {
    id: 'ai-chatbot',
    name: 'AI챗봇',
    nameEn: 'AI Chatbot',
    path: ROUTES.CHAT,
    description: 'PubMed 논문 검색, RAG 분석, 논문 북마크',
    depth: 1,
    isMain: true,
    children: [
      {
        id: 'medical-welfare',
        name: '의료 복지',
        nameEn: 'Medical_welfare',
        path: ROUTES.CHAT_MEDICAL_WELFARE,
        description: '의료 복지 agent',
        depth: 2,
        agent: 'medical_welfare',
      } as ChatRoute,
      {
        id: 'nutrition',
        name: '식이 영양',
        nameEn: 'Nutrition',
        path: ROUTES.CHAT_NUTRITION,
        description: '영양 레시피 agent',
        depth: 2,
        agent: 'nutrition',
      } as ChatRoute,
      {
        id: 'research-paper',
        name: '연구 논문',
        nameEn: 'Research_paper',
        path: ROUTES.CHAT_RESEARCH,
        description: '연구 논문 agent',
        depth: 2,
        agent: 'research',
      } as ChatRoute,
    ],
  },

  // 3. Diet Care
  {
    id: 'diet-care',
    name: '식단케어',
    nameEn: 'Diet care',
    path: ROUTES.DIET_CARE,
    description: '식단 관리 및 영양 정보',
    depth: 1,
    children: [
      {
        id: 'nutri-coach',
        name: '뉴트리 코치',
        nameEn: 'Nutri_coach',
        path: ROUTES.NUTRI_COACH,
        description: '질환식 정보',
        depth: 2,
      },
      {
        id: 'diet-log',
        name: '식단 로그',
        nameEn: 'Diet_log',
        path: ROUTES.DIET_LOG,
        description: '식단 관리 목표 등록, 식사 정보 등록',
        depth: 2,
        features: [
          '식단 관리 목표 등록',
          '식사 정보 등록(아침/점심/저녁/간식)',
        ],
      } as FeatureRoute,
    ],
  },

  // 4. Community
  {
    id: 'community',
    name: '커뮤니티',
    nameEn: 'Community',
    path: ROUTES.COMMUNITY,
    description: '게시글 작성/댓글, 설문 생성(연구자), 포인트 적립',
    depth: 1,
    children: [
      {
        id: 'community-list',
        name: '목록 페이지',
        nameEn: 'List',
        path: ROUTES.COMMUNITY_LIST,
        description: '커뮤니티 게시글 목록',
        depth: 2,
      },
      {
        id: 'community-detail',
        name: '상세 페이지',
        nameEn: 'Detail',
        path: ROUTES.COMMUNITY_DETAIL,
        description: '커뮤니티 게시글 상세',
        depth: 2,
      },
    ],
  },

  // 5. Trends
  {
    id: 'trends',
    name: '트렌드',
    nameEn: 'Trends',
    path: ROUTES.TRENDS,
    description: '시계열 통계, 설문 결과 분석, 데이터 시각화',
    depth: 1,
    requiredRole: ['researcher', 'admin'],
    children: [
      {
        id: 'trends-list',
        name: '목록 페이지',
        path: ROUTES.TRENDS_LIST,
        description: '트렌드 대시보드 목록',
        depth: 2,
      },
      {
        id: 'trends-detail',
        name: '상세 페이지',
        path: ROUTES.TRENDS_DETAIL,
        description: '트렌드 상세 분석',
        depth: 2,
      },
    ],
  },

  // 6. Utility
  {
    id: 'utility',
    name: '유틸리티',
    nameEn: 'Utility',
    path: ROUTES.UTILITY,
    description: '사용자 인증 및 설정 관련',
    depth: 1,
    children: [
      {
        id: 'signup',
        name: '회원가입',
        nameEn: 'Sign up',
        path: ROUTES.SIGNUP,
        description: '신규 사용자 등록',
        depth: 2,
        features: [
          'Id, pw 입력',
          '인증',
          '개인정보 입력',
          '질환정보 입력',
        ],
      } as FeatureRoute,
      {
        id: 'login',
        name: '로그인/로그아웃',
        nameEn: 'Log in',
        path: ROUTES.LOGIN,
        description: '사용자 인증',
        depth: 2,
      },
      {
        id: 'change-password',
        name: '비밀번호 변경',
        path: ROUTES.CHANGE_PASSWORD,
        description: '비밀번호 변경',
        depth: 2,
      },
      {
        id: 'mypage',
        name: '마이페이지',
        nameEn: 'My page',
        path: ROUTES.MY_PAGE,
        description: '프로필 관리, 뱃지, 포인트, 논문 북마크 조회, 설정',
        depth: 2,
      },
      {
        id: 'subscribe',
        name: '구독',
        path: ROUTES.SUBSCRIBE,
        description: '프리미엄 구독 관리',
        depth: 2,
      },
      {
        id: 'notification',
        name: '알림',
        nameEn: 'Notification',
        path: ROUTES.NOTIFICATION,
        description: '알림 확인',
        depth: 2,
        displayType: 'modal',
      },
      {
        id: 'support',
        name: '도움말 및 지원',
        nameEn: 'Support',
        path: ROUTES.SUPPORT,
        description: '사용자 지원',
        depth: 2,
      },
      {
        id: 'terms-conditions',
        name: '약관',
        nameEn: 'Terms & Conditions',
        path: ROUTES.TERMS_CONDITIONS,
        description: '서비스 이용약관',
        depth: 2,
      },
      {
        id: 'privacy-policy',
        name: '개인정보처리방침',
        nameEn: 'Privacy Policy',
        path: ROUTES.PRIVACY_POLICY,
        description: '개인정보 처리 방침',
        depth: 2,
      },
      {
        id: 'cookie-consent',
        name: '쿠키',
        nameEn: 'Cookie',
        path: ROUTES.COOKIE_CONSENT,
        description: '쿠키 정책',
        depth: 2,
      },
      {
        id: 'error',
        name: '에러',
        nameEn: 'Error',
        path: ROUTES.ERROR,
        description: '에러 페이지',
        depth: 2,
      },
    ],
  },
];

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 경로로 라우트 정보 찾기
 */
export function findRouteByPath(path: string): Route | undefined {
  for (const parent of CAREGUIDE_IA) {
    if (parent.path === path) return parent;
    
    if ('children' in parent) {
      const found = parent.children.find(child => child.path === path);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * ID로 라우트 정보 찾기
 */
export function findRouteById(id: string): Route | undefined {
  for (const parent of CAREGUIDE_IA) {
    if (parent.id === id) return parent;
    
    if ('children' in parent) {
      const found = parent.children.find(child => child.id === id);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * 특정 Depth의 모든 라우트 가져오기
 */
export function getRoutesByDepth(depth: RouteDepth): Route[] {
  const routes: Route[] = [];
  
  for (const parent of CAREGUIDE_IA) {
    if (parent.depth === depth) {
      routes.push(parent);
    }
    
    if ('children' in parent) {
      const childRoutes = parent.children.filter(child => child.depth === depth);
      routes.push(...childRoutes);
    }
  }
  
  return routes;
}

/**
 * 사용자 권한에 따른 접근 가능한 라우트 필터링
 */
export function getAccessibleRoutes(userRole: UserRole): Route[] {
  const routes: Route[] = [];
  
  for (const parent of CAREGUIDE_IA) {
    if (!parent.requiredRole || parent.requiredRole.includes(userRole)) {
      routes.push(parent);
    }
    
    if ('children' in parent) {
      const accessibleChildren = parent.children.filter(
        child => !child.requiredRole || child.requiredRole.includes(userRole)
      );
      routes.push(...accessibleChildren);
    }
  }
  
  return routes;
}

/**
 * Agent 타입으로 라우트 찾기
 */
export function getRoutesByAgent(agent: AgentType): ChatRoute[] {
  const routes: ChatRoute[] = [];
  
  for (const parent of CAREGUIDE_IA) {
    if ('children' in parent) {
      for (const child of parent.children) {
        if ('agent' in child && child.agent === agent) {
          routes.push(child as ChatRoute);
        }
      }
    }
  }
  
  return routes;
}
