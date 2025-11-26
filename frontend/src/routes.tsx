/**
 * CareGuide Route Configuration
 * @version 1.0.0
 * @description React Native / React 라우팅 설정
 * 
 * 사용법:
 * - React Native: @react-navigation/native와 함께 사용
 * - React Web: react-router-dom과 함께 사용
 * - Flutter: 이 파일을 참고하여 Dart 라우팅 구현
 */

// ============================================================
// 1. 타입 정의 (Type Definitions)
// ============================================================

/** 프로필 유형 */
export type ProfileType = 'GENERAL' | 'PATIENT' | 'RESEARCHER';

/** 사용자 역할 */
export type UserRole = 'GUEST' | 'USER' | 'ADMIN';

/** 권한 */
export type Permission = 'read' | 'write' | 'update' | 'delete_own' | 'delete_all';

/** 의도 분류 카테고리 */
export type IntentCategory = 
  | 'NON_MEDICAL'
  | 'ILLEGAL_REQUEST'
  | 'MEDICAL_INFO'
  | 'DIET_INFO'
  | 'RESEARCH'
  | 'WELFARE_INFO'
  | 'HEALTH_RECORD'
  | 'LEARNING'
  | 'POLICY'
  | 'CHIT_CHAT';

/** 라우트 설정 */
export interface RouteConfig {
  id: string;
  path: string;
  name: string;
  nameKo: string;
  description?: string;
  component?: string;
  requiresAuth?: boolean;
  permissions?: Permission[];
  children?: RouteConfig[];
}

/** AI Agent 설정 */
export interface AgentConfig {
  id: string;
  name: string;
  nameKo: string;
  intentCategory: IntentCategory;
}

// ============================================================
// 2. 상수 정의 (Constants)
// ============================================================

/** 프로필 유형 목록 */
export const PROFILE_TYPES: Record<ProfileType, { label: string; description: string }> = {
  GENERAL: { label: '일반인', description: '비질환자, 예방 정보 탐색' },
  PATIENT: { label: '질환자', description: 'CKD 진단 환자, 식단/증상 관리' },
  RESEARCHER: { label: '연구자', description: '의료진/연구원, 논문 검색' },
};

/** 역할별 권한 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  GUEST: ['read'],
  USER: ['read', 'write', 'update', 'delete_own'],
  ADMIN: ['read', 'write', 'update', 'delete_own', 'delete_all'],
};

/** AI Agents (단일 /chat UI에서 비동기 처리) */
export const AI_AGENTS: AgentConfig[] = [
  { id: 'medical_welfare', name: 'Medical_welfare', nameKo: '의료 복지', intentCategory: 'WELFARE_INFO' },
  { id: 'nutrition', name: 'Nutrition', nameKo: '식이 영양', intentCategory: 'DIET_INFO' },
  { id: 'research_paper', name: 'Research_paper', nameKo: '연구 논문', intentCategory: 'RESEARCH' },
];

// ============================================================
// 3. 라우트 경로 상수 (Route Paths)
// ============================================================

export const ROUTES = {
  // Home
  HOME: '/main',
  
  // AI Chatbot
  CHAT: '/chat',
  
  // Diet Care
  DIET_CARE: '/diet-care',
  NUTRI_COACH: '/nutri-coach',
  DIET_LOG: '/diet-log',
  ADD_FOOD: '/add-food',
  DIET_LOG_DETAIL: '/diet-log-detail',
  
  // Community
  COMMUNITY: '/community',
  COMMUNITY_LIST: '/community-list',
  COMMUNITY_DETAIL: '/community-detail',
  
  // Trends
  TRENDS: '/trends',
  NEWS_LIST: '/news-list',
  NEWS_DETAIL: '/news-detail',
  TRENDS_LIST: '/trends-list',
  
  // Utility - Auth
  SIGNUP: '/signup',
  LOGIN: '/login',
  AUTH: '/auth',
  FIND_ID: '/findid',
  FIND_PW: '/findpw',
  CHANGE_PW: '/changepw',
  LOGOUT: '/logout',
  SIGNOUT: '/signout',
  
  // Utility - User
  MYPAGE: '/mypage',
  SUBSCRIBE: '/subscribe',
  NOTIFICATION: '/notification',
  
  // Utility - Info
  SUPPORT: '/support',
  TERMS: '/terms-conditions',
  PRIVACY: '/privacy-policy',
  COOKIE: '/cookie-consent',
  ERROR: '/error',
} as const;

// ============================================================
// 4. 라우트 설정 (Route Configurations)
// ============================================================

export const routeConfigs: RouteConfig[] = [
  // ─────────────────────────────────────────────────────────
  // Home
  // ─────────────────────────────────────────────────────────
  {
    id: 'home',
    path: ROUTES.HOME,
    name: 'Home',
    nameKo: '홈',
    description: '앱 진입점 (Splash) → /chat 리다이렉트',
    component: 'HomeScreen',
  },

  // ─────────────────────────────────────────────────────────
  // AI Chatbot
  // ─────────────────────────────────────────────────────────
  {
    id: 'chat',
    path: ROUTES.CHAT,
    name: 'AI Chatbot',
    nameKo: 'AI 챗봇',
    description: 'PubMed 논문 검색, RAG 분석, 논문 북마크',
    component: 'ChatScreen',
  },

  // ─────────────────────────────────────────────────────────
  // Diet Care
  // ─────────────────────────────────────────────────────────
  {
    id: 'diet-care',
    path: ROUTES.DIET_CARE,
    name: 'Diet Care',
    nameKo: '식단케어',
    component: 'DietCareScreen',
    children: [
      {
        id: 'nutri-coach',
        path: ROUTES.NUTRI_COACH,
        name: 'Nutri Coach',
        nameKo: '뉴트리 코치',
        description: '질환식 정보',
        component: 'NutriCoachScreen',
      },
      {
        id: 'diet-log',
        path: ROUTES.DIET_LOG,
        name: 'Diet Log',
        nameKo: '식단 로그',
        description: '식단 관리 목표 등록, 식사 정보 등록',
        component: 'DietLogScreen',
        children: [
          {
            id: 'add-food',
            path: ROUTES.ADD_FOOD,
            name: 'Add Food',
            nameKo: '식사 기록',
            description: '신규 식사 등록',
            component: 'AddFoodScreen',
            requiresAuth: true,
          },
          {
            id: 'diet-log-detail',
            path: ROUTES.DIET_LOG_DETAIL,
            name: 'Diet Log Detail',
            nameKo: '식사 상세',
            description: '작성자: 수정/삭제, 관리자: 삭제만',
            component: 'DietLogDetailScreen',
            requiresAuth: true,
            permissions: ['read', 'update', 'delete_own'],
          },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // Community
  // ─────────────────────────────────────────────────────────
  {
    id: 'community',
    path: ROUTES.COMMUNITY,
    name: 'Community',
    nameKo: '커뮤니티',
    description: '게시글 작성/댓글, 설문 생성(연구자), 포인트 적립',
    component: 'CommunityScreen',
    children: [
      {
        id: 'community-list',
        path: ROUTES.COMMUNITY_LIST,
        name: 'Community List',
        nameKo: '게시글 목록',
        component: 'CommunityListScreen',
        permissions: ['read', 'update', 'delete_own'],
      },
      {
        id: 'community-detail',
        path: ROUTES.COMMUNITY_DETAIL,
        name: 'Community Detail',
        nameKo: '게시글 상세',
        description: '작성자: 수정/삭제, 관리자: 삭제',
        component: 'CommunityDetailScreen',
        permissions: ['read', 'update', 'delete_own', 'delete_all'],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // Trends
  // ─────────────────────────────────────────────────────────
  {
    id: 'trends',
    path: ROUTES.TRENDS,
    name: 'Trends',
    nameKo: '트렌드',
    description: '시계열 통계, 설문 결과 분석, 데이터 시각화',
    component: 'TrendsScreen',
    children: [
      {
        id: 'news-list',
        path: ROUTES.NEWS_LIST,
        name: 'News List',
        nameKo: '새소식 목록',
        description: '신장병 키워드 뉴스 스크래핑',
        component: 'NewsListScreen',
      },
      {
        id: 'news-detail',
        path: ROUTES.NEWS_DETAIL,
        name: 'News Detail',
        nameKo: '새소식 상세',
        component: 'NewsDetailScreen',
      },
      {
        id: 'trends-list',
        path: ROUTES.TRENDS_LIST,
        name: 'Dashboard',
        nameKo: '대시보드',
        description: '상세페이지 없음',
        component: 'DashboardScreen',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // Utility - Auth
  // ─────────────────────────────────────────────────────────
  {
    id: 'signup',
    path: ROUTES.SIGNUP,
    name: 'Sign Up',
    nameKo: '회원가입',
    description: 'ID, PW, 인증, 개인정보, 질환정보, 프로필유형',
    component: 'SignUpScreen',
  },
  {
    id: 'login',
    path: ROUTES.LOGIN,
    name: 'Log In',
    nameKo: '로그인',
    component: 'LoginScreen',
  },
  {
    id: 'auth',
    path: ROUTES.AUTH,
    name: 'Auth',
    nameKo: '인증',
    description: '로그인 인증 처리 (OAuth, JWT)',
    component: 'AuthScreen',
  },
  {
    id: 'findid',
    path: ROUTES.FIND_ID,
    name: 'Find ID',
    nameKo: '아이디 찾기',
    component: 'FindIdScreen',
  },
  {
    id: 'findpw',
    path: ROUTES.FIND_PW,
    name: 'Find Password',
    nameKo: '비밀번호 찾기',
    component: 'FindPwScreen',
  },
  {
    id: 'changepw',
    path: ROUTES.CHANGE_PW,
    name: 'Change Password',
    nameKo: '비밀번호 변경',
    component: 'ChangePwScreen',
    requiresAuth: true,
  },
  {
    id: 'logout',
    path: ROUTES.LOGOUT,
    name: 'Log Out',
    nameKo: '로그아웃',
    component: 'LogoutScreen',
    requiresAuth: true,
  },
  {
    id: 'signout',
    path: ROUTES.SIGNOUT,
    name: 'Sign Out',
    nameKo: '회원탈퇴',
    component: 'SignOutScreen',
    requiresAuth: true,
  },

  // ─────────────────────────────────────────────────────────
  // Utility - User
  // ─────────────────────────────────────────────────────────
  {
    id: 'mypage',
    path: ROUTES.MYPAGE,
    name: 'My Page',
    nameKo: '마이페이지',
    description: '프로필, 뱃지, 포인트, 북마크, 설정, 프로필유형 수정',
    component: 'MyPageScreen',
    requiresAuth: true,
  },
  {
    id: 'subscribe',
    path: ROUTES.SUBSCRIBE,
    name: 'Subscribe',
    nameKo: '구독',
    component: 'SubscribeScreen',
    requiresAuth: true,
  },
  {
    id: 'notification',
    path: ROUTES.NOTIFICATION,
    name: 'Notification',
    nameKo: '알림',
    description: '모달 팝업',
    component: 'NotificationModal',
  },

  // ─────────────────────────────────────────────────────────
  // Utility - Info
  // ─────────────────────────────────────────────────────────
  {
    id: 'support',
    path: ROUTES.SUPPORT,
    name: 'Support',
    nameKo: '도움말',
    component: 'SupportScreen',
  },
  {
    id: 'terms',
    path: ROUTES.TERMS,
    name: 'Terms & Conditions',
    nameKo: '이용약관',
    component: 'TermsScreen',
  },
  {
    id: 'privacy',
    path: ROUTES.PRIVACY,
    name: 'Privacy Policy',
    nameKo: '개인정보처리방침',
    component: 'PrivacyScreen',
  },
  {
    id: 'cookie',
    path: ROUTES.COOKIE,
    name: 'Cookie Consent',
    nameKo: '쿠키 동의',
    component: 'CookieScreen',
  },
  {
    id: 'error',
    path: ROUTES.ERROR,
    name: 'Error',
    nameKo: '에러',
    component: 'ErrorScreen',
  },
];

// ============================================================
// 5. 유틸리티 함수 (Utility Functions)
// ============================================================

/**
 * 경로로 라우트 설정 찾기
 */
export function getRouteByPath(path: string): RouteConfig | undefined {
  const findRoute = (routes: RouteConfig[]): RouteConfig | undefined => {
    for (const route of routes) {
      if (route.path === path) return route;
      if (route.children) {
        const found = findRoute(route.children);
        if (found) return found;
      }
    }
    return undefined;
  };
  return findRoute(routeConfigs);
}

/**
 * 라우트 ID로 경로 가져오기
 */
export function getPathById(id: string): string | undefined {
  const findPath = (routes: RouteConfig[]): string | undefined => {
    for (const route of routes) {
      if (route.id === id) return route.path;
      if (route.children) {
        const found = findPath(route.children);
        if (found) return found;
      }
    }
    return undefined;
  };
  return findPath(routeConfigs);
}

/**
 * 인증이 필요한 라우트인지 확인
 */
export function requiresAuthentication(path: string): boolean {
  const route = getRouteByPath(path);
  return route?.requiresAuth ?? false;
}

/**
 * 권한 확인
 */
export function hasPermission(
  userRole: UserRole,
  requiredPermission: Permission
): boolean {
  return ROLE_PERMISSIONS[userRole].includes(requiredPermission);
}

/**
 * 관리자 삭제 권한 확인 (커뮤니티용)
 */
export function canAdminDelete(userRole: UserRole): boolean {
  return userRole === 'ADMIN';
}

// ============================================================
// 6. 세션/프로필 관리 타입 (Session & Profile Types)
// ============================================================

/** 세션 정보 */
export interface SessionInfo {
  guid: string;
  isAuthenticated: boolean;
  userId?: string;
  role: UserRole;
  profileType: ProfileType;
  createdAt: Date;
}

/** 프로필 저장 정책 */
export const PROFILE_STORAGE_POLICY = {
  /** 비로그인: 쿠키/캐시에 프로필 유형 저장 */
  GUEST: {
    storage: 'cookie' as const,
    key: 'careguide_profile_type',
    defaultValue: 'GENERAL' as ProfileType,
  },
  /** 로그인: DB에서 프로필 유형 조회, Chat 맞춤 유형에 강제 맵핑 */
  USER: {
    storage: 'database' as const,
    chatMappingForced: true,
  },
};

/**
 * Chat 맞춤 유형 가져오기
 * - 비로그인: 쿠키에서 로드
 * - 로그인: DB 프로필 유형 강제 맵핑
 */
export function getChatProfileType(session: SessionInfo): ProfileType {
  if (session.isAuthenticated) {
    // 로그인 상태: DB 프로필 유형 강제 맵핑
    return session.profileType;
  }
  // 비로그인 상태: 쿠키에서 로드 (기본값: GENERAL)
  return session.profileType || PROFILE_STORAGE_POLICY.GUEST.defaultValue;
}

// ============================================================
// 7. API 엔드포인트 매핑 (API Endpoints)
// ============================================================

export const API_ENDPOINTS = {
  // Chat
  CHAT_MESSAGE: '/api/chat/message',
  CHAT_SESSION: '/api/chat/session',
  
  // Diet
  DIET_LOGS: '/api/diet/logs',
  DIET_LOGS_DETAIL: '/api/diet/logs/:id',
  DIET_FOOD: '/api/diet/food',
  
  // Community
  COMMUNITY_POSTS: '/api/community/posts',
  COMMUNITY_POSTS_DETAIL: '/api/community/posts/:id',
  
  // Trends
  NEWS: '/api/trends/news',
  NEWS_DETAIL: '/api/trends/news/:id',
  
  // Auth
  SIGNUP: '/api/auth/signup',
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  
  // User
  PROFILE: '/api/user/profile',
} as const;

// ============================================================
// 8. 내보내기 (Exports)
// ============================================================

export default {
  ROUTES,
  routeConfigs,
  AI_AGENTS,
  PROFILE_TYPES,
  ROLE_PERMISSIONS,
  API_ENDPOINTS,
  PROFILE_STORAGE_POLICY,
  getRouteByPath,
  getPathById,
  requiresAuthentication,
  hasPermission,
  canAdminDelete,
  getChatProfileType,
};
