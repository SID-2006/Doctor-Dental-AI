import {
  AnalysisResponse,
  HealthResponse,
  ModelsInfoResponse,
} from '../types/api';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8005').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson && errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // Ignore JSON parse error and use status message
    }
    throw new ApiError(errorDetail, res.status);
  }
  return res.json() as Promise<T>;
}

export const apiClient = {
  getBaseUrl(): string {
    return API_BASE_URL;
  },

  async getHealth(): Promise<HealthResponse> {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    return handleResponse<HealthResponse>(res);
  },

  async getModelsInfo(): Promise<ModelsInfoResponse> {
    const res = await fetch(`${API_BASE_URL}/api/models/info`);
    return handleResponse<ModelsInfoResponse>(res);
  },

  async uploadAndAnalyze(
    file: File | Blob,
    filename: string = 'scan.jpg',
    enumerationConf?: number,
    diseaseConf?: number
  ): Promise<AnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file, filename);
    if (enumerationConf !== undefined) {
      formData.append('enumeration_conf', enumerationConf.toString());
    }
    if (diseaseConf !== undefined) {
      formData.append('disease_conf', diseaseConf.toString());
    }

    const res = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<AnalysisResponse>(res);
  },

  async getAnalysis(analysisId: string): Promise<AnalysisResponse> {
    const res = await fetch(`${API_BASE_URL}/api/analysis/${encodeURIComponent(analysisId)}`);
    return handleResponse<AnalysisResponse>(res);
  },

  getOriginalImageUrl(analysisId: string): string {
    return `${API_BASE_URL}/api/analysis/${encodeURIComponent(analysisId)}/image/original`;
  },

  getAnnotatedImageUrl(analysisId: string): string {
    return `${API_BASE_URL}/api/analysis/${encodeURIComponent(analysisId)}/image/annotated`;
  },

  getTeethOnlyImageUrl(analysisId: string): string {
    return `${API_BASE_URL}/api/analysis/${encodeURIComponent(analysisId)}/image/teeth_only`;
  },

  getDiseasesOnlyImageUrl(analysisId: string): string {
    return `${API_BASE_URL}/api/analysis/${encodeURIComponent(analysisId)}/image/diseases_only`;
  },

  getReportDownloadUrl(analysisId: string): string {
    return `${API_BASE_URL}/api/analysis/${encodeURIComponent(analysisId)}/report`;
  },
};
