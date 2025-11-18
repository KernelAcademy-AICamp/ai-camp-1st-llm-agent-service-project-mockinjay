/**
 * Trends API Client
 * Handles all API requests for trends analysis
 */
import axios, { AxiosInstance } from 'axios';
import type {
  TemporalTrendsRequest,
  GeographicDistributionRequest,
  MeshCategoryRequest,
  CompareKeywordsRequest,
  PapersRequest,
  SummarizeRequest,
  TrendResponse,
  PapersResponse,
  SummaryResponse
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class TrendsApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 60000, // 60 seconds for long-running analyses
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Analyze temporal trends (publication trends over time)
   */
  async analyzeTemporalTrends(request: Partial<TemporalTrendsRequest>): Promise<TrendResponse> {
    const defaultRequest: TemporalTrendsRequest = {
      query: request.query || '',
      start_year: request.start_year || 2015,
      end_year: request.end_year || 2024,
      normalize: request.normalize ?? true,
      session_id: request.session_id || this.generateSessionId(),
      language: request.language || 'ko',
    };

    const response = await this.client.post<TrendResponse>(
      '/api/trends/temporal',
      defaultRequest
    );
    return response.data;
  }

  /**
   * Analyze geographic distribution of research
   */
  async analyzeGeographicDistribution(request: Partial<GeographicDistributionRequest>): Promise<TrendResponse> {
    const defaultRequest: GeographicDistributionRequest = {
      query: request.query || '',
      countries: request.countries,
      session_id: request.session_id || this.generateSessionId(),
      language: request.language || 'ko',
    };

    const response = await this.client.post<TrendResponse>(
      '/api/trends/geographic',
      defaultRequest
    );
    return response.data;
  }

  /**
   * Analyze MeSH categories and subheadings
   */
  async analyzeMeshCategories(request: Partial<MeshCategoryRequest>): Promise<TrendResponse> {
    const defaultRequest: MeshCategoryRequest = {
      query: request.query || '',
      session_id: request.session_id || this.generateSessionId(),
      language: request.language || 'ko',
    };

    const response = await this.client.post<TrendResponse>(
      '/api/trends/mesh',
      defaultRequest
    );
    return response.data;
  }

  /**
   * Compare trends across multiple keywords
   */
  async compareKeywords(request: Partial<CompareKeywordsRequest>): Promise<TrendResponse> {
    const defaultRequest: CompareKeywordsRequest = {
      keywords: request.keywords || [],
      start_year: request.start_year || 2015,
      end_year: request.end_year || 2024,
      session_id: request.session_id || this.generateSessionId(),
      language: request.language || 'ko',
    };

    const response = await this.client.post<TrendResponse>(
      '/api/trends/compare',
      defaultRequest
    );
    return response.data;
  }

  /**
   * Search for research papers
   */
  async searchPapers(request: Partial<PapersRequest>): Promise<PapersResponse> {
    const defaultRequest: PapersRequest = {
      query: request.query || '',
      max_results: request.max_results || 10,
      sort: request.sort || 'relevance',
      session_id: request.session_id || this.generateSessionId(),
    };

    const response = await this.client.post<PapersResponse>(
      '/api/trends/papers',
      defaultRequest
    );
    return response.data;
  }

  /**
   * Generate AI-powered summary of papers
   */
  async summarizePapers(request: SummarizeRequest): Promise<SummaryResponse> {
    const response = await this.client.post<SummaryResponse>(
      '/api/trends/summarize',
      request
    );
    return response.data;
  }

  /**
   * Health check for trends API
   */
  async healthCheck(): Promise<{ status: string; components: Record<string, string> }> {
    const response = await this.client.get('/api/trends/health');
    return response.data;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `trends_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

// Export singleton instance
export const trendsApi = new TrendsApiClient();

// Export class for testing
export default TrendsApiClient;
