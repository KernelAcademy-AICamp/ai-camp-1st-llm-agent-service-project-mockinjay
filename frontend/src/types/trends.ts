export interface ClinicalTrial {
    nctId: string;
    title: string;
    status: string;
    conditions: string[];
    interventions: string[];
    locations: string[];
    startDate: string;
    completionDate: string;
    sponsor: string;
    phase: string;
    enrollmentCount: number;
    briefSummary: string;
    detailedDescription: string;
    eligibilityCriteria: string;
    contactInfo: string;
    url: string;
}

export interface ClinicalTrialsResponse {
    trials: ClinicalTrial[];
    totalCount: number;
    page: number;
    pageSize: number;
}

export interface NewsArticle {
    id: string;
    title: string;
    description: string;
    content: string;
    source: string;
    author: string;
    url: string;
    imageUrl: string;
    publishedAt: string;
    language: string;
}

export type AnalysisType = 'temporal' | 'geographic' | 'mesh' | 'compare';

export interface PaperResult {
    pmid: string;
    title: string;
    authors: string[];
    journal: string;
    year: number;
    abstract: string;
    meshTerms: string[];
    citations: number;
}

export interface TrendResponse {
    query?: string;
    results?: PaperResult[];
    chartData?: unknown;
    summary?: string;
    // New API format
    answer?: string;
    sources?: ChartConfig[];
    papers?: PaperResult[];
    tokens_used?: number;
    status?: string;
    agent_type?: string;
    metadata?: Record<string, unknown>;
}

export interface ChartConfig {
    type: string;
    data: unknown;
    options?: Record<string, unknown>;
}
