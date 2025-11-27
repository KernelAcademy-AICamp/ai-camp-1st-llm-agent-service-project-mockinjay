/**
 * Trends API Service
 * 트렌드 데이터 검색 및 시각화를 위한 API
 */

import api from './api';

// ==================== Types ====================

export type AnalysisType = 'temporal' | 'geographic' | 'mesh' | 'compare';
export type ChartType = 'line' | 'bar' | 'doughnut' | 'radar';

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  tension?: number;
  yAxisID?: string;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartConfig {
  type: ChartType;
  data: ChartData;
  options?: Record<string, unknown>;
}

export interface PaperResult {
  pmid: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  pub_date: string;
  doi: string;
  keywords: string[];
  mesh_terms: Record<string, boolean>;
  source: string;
  url: string;
}

export interface TrendResponse {
  answer: string;
  sources: ChartConfig[];
  papers: PaperResult[];
  tokens_used: number;
  status: string;
  agent_type: string;
  metadata: Record<string, unknown>;
}

export interface PapersResponse {
  papers: PaperResult[];
  total: number;
  query: string;
  status: string;
}

export interface MultiplePaperSummary {
  overview?: string;
  key_themes?: string[];
  research_trends?: string;
  clinical_implications?: string;
  recommendations?: string[];
  papers_analyzed?: number;
  total_papers?: number;
  tokens_used?: number;
  error?: string;
  status: string;
}

export interface TrendData {
  keyword: string;
  data: {
    year: number;
    count: number;
    percentage?: number;
  }[];
}

// ==================== API Functions ====================

/**
 * 트렌드 검색 (시계열)
 */
export async function searchTemporalTrends(
  query: string,
  startYear: number = 2015,
  endYear: number = 2024
): Promise<TrendResponse> {
  try {
    const response = await api.post('/api/trends/temporal', {
      query,
      start_year: startYear,
      end_year: endYear,
      normalize: true,
      session_id: 'default',
      language: 'ko',
    });
    return response.data;
  } catch (error) {
    console.error('Error searching temporal trends:', error);
    const errorMessage = error instanceof Error
      ? error.message
      : (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'detail' in error.response.data)
        ? String(error.response.data.detail)
        : '시간대별 트렌드 분석 중 오류가 발생했습니다';
    throw new Error(errorMessage);
  }
}

/**
 * 지역별 분포 검색
 */
export async function searchGeographicTrends(query: string): Promise<TrendResponse> {
  try {
    const response = await api.post('/api/trends/geographic', {
      query,
      countries: null,
      session_id: 'default',
      language: 'ko',
    });
    return response.data;
  } catch (error) {
    console.error('Error searching geographic trends:', error);
    const errorMessage = error instanceof Error
      ? error.message
      : (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'detail' in error.response.data)
        ? String(error.response.data.detail)
        : '지역별 트렌드 분석 중 오류가 발생했습니다';
    throw new Error(errorMessage);
  }
}

/**
 * 키워드 비교
 */
export async function compareKeywords(
  keywords: string[],
  startYear: number = 2015,
  endYear: number = 2024
): Promise<TrendResponse> {
  try {
    const response = await api.post('/api/trends/compare', {
      keywords,
      start_year: startYear,
      end_year: endYear,
      session_id: 'default',
      language: 'ko',
    });
    return response.data;
  } catch (error) {
    console.error('Error comparing keywords:', error);
    const errorMessage = error instanceof Error
      ? error.message
      : (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'detail' in error.response.data)
        ? String(error.response.data.detail)
        : '키워드 비교 분석 중 오류가 발생했습니다';
    throw new Error(errorMessage);
  }
}

/**
 * 최신 논문 검색
 */
export async function searchRecentPapers(query: string, maxResults: number = 10): Promise<PapersResponse> {
  try {
    const response = await api.post('/api/trends/papers', {
      query,
      max_results: maxResults,
      sort: 'pub_date',
      session_id: 'default',
    });
    return response.data;
  } catch (error) {
    console.error('Error searching recent papers:', error);
    const errorMessage = error instanceof Error
      ? error.message
      : (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'detail' in error.response.data)
        ? String(error.response.data.detail)
        : '최신 논문 검색 중 오류가 발생했습니다';
    throw new Error(errorMessage);
  }
}

/**
 * MeSH 카테고리/하위주제 분석
 */
export async function searchMeshDistribution(query: string): Promise<TrendResponse> {
  try {
    const response = await api.post('/api/trends/mesh', {
      query,
      session_id: 'default',
      language: 'ko',
    });
    return response.data;
  } catch (error) {
    console.error('Error searching MeSH distribution:', error);
    const errorMessage = error instanceof Error
      ? error.message
      : (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'detail' in error.response.data)
        ? String(error.response.data.detail)
        : 'MeSH 분포 분석 중 오류가 발생했습니다';
    throw new Error(errorMessage);
  }
}

/**
 * 논문 요약
 */
export async function summarizePapers(
  papers: PaperResult[],
  query: string,
  language: string = 'ko',
  summaryType: string = 'multiple'
): Promise<MultiplePaperSummary> {
  try {
    const response = await api.post('/api/trends/summarize', {
      papers,
      query,
      language,
      summary_type: summaryType,
    });
    return response.data;
  } catch (error) {
    console.error('Error summarizing papers:', error);
    const errorMessage = error instanceof Error
      ? error.message
      : (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'detail' in error.response.data)
        ? String(error.response.data.detail)
        : '논문 요약 중 오류가 발생했습니다';
    throw new Error(errorMessage);
  }
}

/**
 * One-line summary response interface
 * 한 줄 요약 응답 인터페이스
 */
export interface OneLineSummariesResponse {
  summaries: Record<string, string>; // PMID -> summary mapping
  status: string;
}

/**
 * 각 논문별 한 줄 요약 생성
 */
export async function generateOneLineSummaries(
  papers: PaperResult[],
  language: string = 'ko'
): Promise<OneLineSummariesResponse> {
  try {
    const response = await api.post('/api/trends/one-line-summaries', {
      papers,
      language,
    });
    return response.data;
  } catch (error) {
    console.error('Error generating one-line summaries:', error);
    const errorMessage = error instanceof Error
      ? error.message
      : (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'detail' in error.response.data)
        ? String(error.response.data.detail)
        : '논문 요약 생성 중 오류가 발생했습니다';
    throw new Error(errorMessage);
  }
}

/**
 * Translation response interface
 * 번역 응답 인터페이스
 */
export interface TranslationResponse {
  translations: Record<string, string>; // PMID -> translated abstract mapping
  status: string;
}

/**
 * 영문 초록 한글 번역
 */
export async function translateAbstracts(
  papers: PaperResult[],
  targetLanguage: string = 'ko'
): Promise<TranslationResponse> {
  try {
    const response = await api.post('/api/trends/translate', {
      papers,
      target_language: targetLanguage,
    });
    return response.data;
  } catch (error) {
    console.error('Error translating abstracts:', error);
    const errorMessage = error instanceof Error
      ? error.message
      : (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response && error.response.data && typeof error.response.data === 'object' && 'detail' in error.response.data)
        ? String(error.response.data.detail)
        : '초록 번역 중 오류가 발생했습니다';
    throw new Error(errorMessage);
  }
}
