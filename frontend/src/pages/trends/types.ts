/**
 * TypeScript Type Definitions for Trends Page
 */

// ==================== Analysis Types ====================

export type AnalysisType = 'temporal' | 'geographic' | 'mesh' | 'compare';

export type ChartType = 'line' | 'bar' | 'doughnut' | 'radar';

// ==================== Query Types ====================

export interface TrendQuery {
  query: string;
  startYear?: number;
  endYear?: number;
  keywords?: string[];
  countries?: string[];
  normalize?: boolean;
  sessionId?: string;
  language?: string;
}

// ==================== Chart Data Types ====================

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
  options?: any;
}

// ==================== Paper Types ====================

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

export interface PaperSummary {
  summary: string;
  key_findings: string[];
  clinical_significance: string;
  tokens_used?: number;
  error?: string;
}

export interface MultiplePaperSummary {
  overview: string;
  key_themes: string[];
  research_trends: string;
  clinical_implications: string;
  recommendations: string[];
  papers_analyzed: number;
  total_papers: number;
  tokens_used?: number;
  error?: string;
}

// ==================== API Response Types ====================

export interface TrendResponse {
  answer: string;
  sources: ChartConfig[];
  papers: PaperResult[];
  tokens_used: number;
  status: string;
  agent_type: string;
  metadata: Record<string, any>;
}

export interface PapersResponse {
  papers: PaperResult[];
  total: number;
  query: string;
  status: string;
}

export interface SummaryResponse {
  status: string;
  // For single paper summary
  summary?: string;
  key_findings?: string[];
  clinical_significance?: string;
  // For multiple papers summary
  overview?: string;
  key_themes?: string[];
  research_trends?: string;
  clinical_implications?: string;
  recommendations?: string[];
  papers_analyzed?: number;
  total_papers?: number;
  tokens_used?: number;
  error?: string;
}

// ==================== UI State Types ====================

export interface TrendsPageState {
  step: 1 | 2 | 3;  // Query -> Analysis -> Results
  query: string;
  keywords: string[];
  startYear: number;
  endYear: number;
  selectedAnalysis: AnalysisType | null;
  loading: boolean;
  error: string | null;
}

export interface AnalysisResult {
  type: AnalysisType;
  explanation: string;
  charts: ChartConfig[];
  papers: PaperResult[];
  metadata: Record<string, any>;
}

export interface SummaryState {
  type: 'original' | 'ai';
  loading: boolean;
  data: MultiplePaperSummary | null;
  error: string | null;
}

// ==================== API Request Types ====================

export interface TemporalTrendsRequest {
  query: string;
  start_year: number;
  end_year: number;
  normalize: boolean;
  session_id: string;
  language: string;
}

export interface GeographicDistributionRequest {
  query: string;
  countries?: string[];
  session_id: string;
  language: string;
}

export interface MeshCategoryRequest {
  query: string;
  session_id: string;
  language: string;
}

export interface CompareKeywordsRequest {
  keywords: string[];
  start_year: number;
  end_year: number;
  session_id: string;
  language: string;
}

export interface PapersRequest {
  query: string;
  max_results: number;
  sort: 'relevance' | 'pub_date';
  session_id: string;
}

export interface SummarizeRequest {
  papers: PaperResult[];
  query: string;
  language: string;
  summary_type: 'single' | 'multiple';
}
