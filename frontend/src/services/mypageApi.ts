import api from './api';
import type { UserProfile, HealthProfile, QuizStats, BookmarkedPaper, UserSettings } from '../types/mypage';

const MYPAGE_BASE_URL = '/api/mypage';
const PROFILE_ENDPOINT = `${MYPAGE_BASE_URL}/profile`;
const HEALTH_ENDPOINT = `${MYPAGE_BASE_URL}/health-profile`;
const QUIZ_STATS_ENDPOINT = `${MYPAGE_BASE_URL}/quiz-stats`;
const QUIZ_STATS_FALLBACK_ENDPOINT = '/api/quiz/stats';
const BOOKMARKS_ENDPOINT = `${MYPAGE_BASE_URL}/bookmarks`;
const SETTINGS_ENDPOINT = `${MYPAGE_BASE_URL}/preferences`;
const USER_STORAGE_KEY = 'careguide_user';

type RawUserProfile = Partial<UserProfile> & {
  _id?: string;
  fullName?: string;
  profile?: string;
  profileImageUrl?: string;
  createdAt?: string;
};

type RawHealthProfile = Partial<HealthProfile> & {
  _id?: string;
  stage?: string;
  conditions?: string[];
  treatmentType?: string;
  dialysis?: string;
  updatedAt?: string;
};

type RawQuizStats = Partial<QuizStats> & {
  totalSessions?: number;
  totalQuestions?: number;
  accuracyRate?: number;
  currentStreak?: number;
  bestStreak?: number;
};

type RawBookmark = {
  id?: string;
  _id?: string;
  paperId?: string;
  pmid?: string;
  userId?: string;
  user_id?: string;
  title?: string;
  journal?: string;
  year?: number | string;
  bookmarkedAt?: string;
  createdAt?: string;
  paperData?: {
    pmid?: string;
    title?: string;
    journal?: string;
    year?: number | string;
    bookmarkedAt?: string;
    [key: string]: unknown;
  };
};

type RawBookmarksResponse =
  | RawBookmark[]
  | {
      bookmarks?: RawBookmark[];
      items?: RawBookmark[];
      results?: RawBookmark[];
    };

type RawUserSettings = Partial<UserSettings> & {
  notifications?: boolean | Record<string, boolean>;
};

function normalizeUserProfile(payload?: RawUserProfile): UserProfile {
  return {
    id: payload?.id ?? payload?._id ?? '',
    username: payload?.username ?? payload?.email ?? '',
    email: payload?.email ?? '',
    nickname: payload?.nickname ?? payload?.fullName ?? payload?.username ?? '',
    profileImage: payload?.profileImage ?? payload?.profileImageUrl ?? '',
    diseaseStage: payload?.diseaseStage ?? payload?.profile ?? '',
    createdAt: payload?.createdAt ?? new Date().toISOString(),
  };
}

function normalizeHealthProfile(payload?: RawHealthProfile): HealthProfile {
  const rawDietaryRestrictions = Array.isArray(payload?.dietaryRestrictions)
    ? payload?.dietaryRestrictions ?? []
    : [];
  const dietaryRestrictions = rawDietaryRestrictions.map((item) => String(item));

  const primaryCondition = Array.isArray(payload?.conditions) ? payload?.conditions?.[0] : undefined;

  const diseaseStage =
    payload?.diseaseStage ??
    payload?.stage ??
    primaryCondition ??
    '';

  const eGFRSource = payload?.eGFR;
  const eGFRValue = typeof eGFRSource === 'number' ? eGFRSource : Number(eGFRSource ?? 0);

  return {
    userId: payload?.userId ?? payload?._id ?? '',
    diseaseStage: diseaseStage ?? '',
    eGFR: Number.isFinite(eGFRValue) ? (eGFRValue as number) : 0,
    dialysisType: payload?.dialysisType ?? payload?.dialysis ?? payload?.treatmentType ?? '',
    dietaryRestrictions,
  };
}

function normalizeQuizStats(payload?: RawQuizStats): QuizStats {
  const totalQuestions =
    typeof payload?.totalQuestions === 'number'
      ? payload?.totalQuestions
      : typeof payload?.totalQuizzes === 'number'
        ? payload?.totalQuizzes
        : typeof payload?.totalSessions === 'number'
          ? payload?.totalSessions
          : 0;

  const correctAnswers = typeof payload?.correctAnswers === 'number' ? payload?.correctAnswers : 0;
  const incorrectAnswers =
    typeof payload?.incorrectAnswers === 'number'
      ? payload?.incorrectAnswers
      : Math.max(totalQuestions - correctAnswers, 0);

  const accuracy =
    typeof payload?.accuracy === 'number'
      ? payload?.accuracy
      : typeof payload?.accuracyRate === 'number'
        ? payload?.accuracyRate
        : totalQuestions
          ? (correctAnswers / totalQuestions) * 100
          : 0;

  const totalQuizzes =
    typeof payload?.totalQuizzes === 'number'
      ? payload?.totalQuizzes
      : typeof payload?.totalSessions === 'number'
        ? payload?.totalSessions
        : totalQuestions;

  const streak =
    typeof payload?.streak === 'number'
      ? payload?.streak
      : typeof payload?.currentStreak === 'number'
        ? payload?.currentStreak
        : typeof payload?.bestStreak === 'number'
          ? payload?.bestStreak
          : 0;

  return {
    totalQuizzes,
    correctAnswers,
    incorrectAnswers,
    accuracy,
    streak,
  };
}

function normalizeBookmark(raw: RawBookmark): BookmarkedPaper {
  const paper = raw.paperData ?? {};
  const pmid = raw.paperId ?? paper.pmid ?? raw.pmid ?? '';
  const yearValue = paper.year ?? raw.year;
  const parsedYear =
    typeof yearValue === 'number' ? yearValue : Number(yearValue ?? 0);
  const year = Number.isFinite(parsedYear) ? parsedYear : 0;

  return {
    id: raw.id ?? raw._id ?? pmid,
    pmid,
    paperId: pmid,
    userId: raw.userId ?? raw.user_id ?? '',
    title: paper.title ?? raw.title ?? '',
    journal: paper.journal ?? raw.journal ?? '',
    year,
    bookmarkedAt: paper.bookmarkedAt ?? raw.bookmarkedAt ?? raw.createdAt ?? new Date().toISOString(),
  };
}

function extractBookmarks(payload?: RawBookmarksResponse): RawBookmark[] {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.bookmarks)) {
    return payload?.bookmarks ?? [];
  }

  if (Array.isArray(payload?.items)) {
    return payload?.items ?? [];
  }

  if (Array.isArray(payload?.results)) {
    return payload?.results ?? [];
  }

  return [];
}

function normalizeUserSettings(raw?: RawUserSettings): UserSettings {
  const notificationsSource = raw?.notifications;
  let notificationsEnabled = true;

  if (typeof notificationsSource === 'boolean') {
    notificationsEnabled = notificationsSource;
  } else if (notificationsSource && typeof notificationsSource === 'object') {
    const values = Object.values(notificationsSource);
    notificationsEnabled = values.length ? values.some(Boolean) : notificationsEnabled;
  }

  return {
    notifications: notificationsEnabled,
    language: raw?.language ?? 'ko',
    theme: raw?.theme ?? 'light',
  };
}

function buildUserSettingsPayload(data: Partial<UserSettings>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (data.language !== undefined) {
    payload.language = data.language;
  }

  if (data.theme !== undefined) {
    payload.theme = data.theme;
  }

  if (data.notifications !== undefined) {
    payload.notifications = {
      email: data.notifications,
      push: data.notifications,
      community: data.notifications,
      trends: data.notifications,
    };
  }

  return payload;
}

function buildProfileUpdatePayload(data: Partial<UserProfile>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (data.nickname !== undefined) {
    payload.fullName = data.nickname;
    payload.nickname = data.nickname;
  }

  if (data.profileImage !== undefined) {
    payload.profileImage = data.profileImage;
  }

  if (data.diseaseStage !== undefined) {
    payload.diseaseStage = data.diseaseStage;
  }

  if (data.email !== undefined) {
    payload.email = data.email;
  }

  if (data.username !== undefined) {
    payload.username = data.username;
  }

  return payload;
}

function buildHealthProfilePayload(data: Partial<HealthProfile>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  if (data.diseaseStage !== undefined) {
    payload.diseaseStage = data.diseaseStage;
    payload.conditions = data.diseaseStage ? [data.diseaseStage] : [];
  }

  if (data.eGFR !== undefined) {
    payload.eGFR = data.eGFR;
  }

  if (data.dialysisType !== undefined) {
    payload.dialysisType = data.dialysisType;
  }

  if (data.dietaryRestrictions !== undefined) {
    payload.dietaryRestrictions = data.dietaryRestrictions;
  }

  return payload;
}

function getStoredUserId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as { id?: string; _id?: string; userId?: string };
    return parsed.id ?? parsed._id ?? parsed.userId ?? null;
  } catch {
    return null;
  }
}

async function requestQuizStats(
  url: string,
  params?: Record<string, string>
): Promise<QuizStats> {
  const config = params ? { params } : undefined;
  const { data } = await api.get<RawQuizStats>(url, config);
  return normalizeQuizStats(data);
}

export async function fetchUserProfile(): Promise<UserProfile> {
  const { data } = await api.get<RawUserProfile>(PROFILE_ENDPOINT);
  return normalizeUserProfile(data);
}

export async function updateUserProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  const payload = buildProfileUpdatePayload(data);
  const { data: response } = await api.put<RawUserProfile>(PROFILE_ENDPOINT, payload);
  return normalizeUserProfile(response);
}

export async function fetchHealthProfile(): Promise<HealthProfile> {
  const { data } = await api.get<RawHealthProfile>(HEALTH_ENDPOINT);
  return normalizeHealthProfile(data);
}

export async function updateHealthProfile(
  data: Partial<HealthProfile>
): Promise<HealthProfile> {
  const payload = buildHealthProfilePayload(data);
  const { data: response } = await api.put<RawHealthProfile>(HEALTH_ENDPOINT, payload);
  return normalizeHealthProfile(response);
}

export async function fetchQuizStats(): Promise<QuizStats> {
  try {
    return await requestQuizStats(QUIZ_STATS_ENDPOINT);
  } catch (primaryError) {
    const userId = getStoredUserId();
    if (!userId) {
      throw primaryError;
    }

    try {
      return await requestQuizStats(QUIZ_STATS_FALLBACK_ENDPOINT, { userId });
    } catch (fallbackError) {
      throw fallbackError;
    }
  }
}

export async function fetchBookmarkedPapers(): Promise<BookmarkedPaper[]> {
  const { data } = await api.get<RawBookmarksResponse>(BOOKMARKS_ENDPOINT);
  return extractBookmarks(data).map((bookmark) => normalizeBookmark(bookmark));
}

export async function addBookmark(
  pmid: string,
  title: string,
  journal: string,
  year: number
): Promise<BookmarkedPaper> {
  const payload = {
    paperId: pmid,
    paperData: {
      pmid,
      title,
      journal,
      year,
    },
  };

  const { data } = await api.post<RawBookmark>(BOOKMARKS_ENDPOINT, payload);
  return normalizeBookmark(data);
}

export async function removeBookmark(bookmarkId: string): Promise<void> {
  await api.delete(`${BOOKMARKS_ENDPOINT}/${encodeURIComponent(bookmarkId)}`);
}

export async function fetchUserSettings(): Promise<UserSettings> {
  const { data } = await api.get<RawUserSettings>(SETTINGS_ENDPOINT);
  return normalizeUserSettings(data);
}

export async function updateUserSettings(
  data: Partial<UserSettings>
): Promise<UserSettings> {
  const payload = buildUserSettingsPayload(data);
  const { data: response } = await api.put<RawUserSettings>(SETTINGS_ENDPOINT, payload);
  return normalizeUserSettings(response);
}
