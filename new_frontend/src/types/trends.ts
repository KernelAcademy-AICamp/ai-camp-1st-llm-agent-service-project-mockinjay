/**
 * Trends Types
 * Type definitions for trends-related features including clinical trials
 */

// ==================== Clinical Trials ====================

export interface ClinicalTrial {
  nctId: string;
  title: string;
  status: string;
  phase: string;
  conditions: string[];
  interventions: string[];
  startDate?: string;
  completionDate?: string;
  sponsor?: string;
  briefSummary?: string;
}

export interface ClinicalTrialsResponse {
  trials: ClinicalTrial[];
  totalPages: number;
  currentPage: number;
  totalTrials: number;
}

// ==================== Export for convenience ====================

export type { AnalysisType, ChartType, ChartDataset, ChartData, ChartConfig, PaperResult, TrendResponse, PapersResponse, MultiplePaperSummary, TrendData } from '../services/trendsApi';
