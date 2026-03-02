// API - Geoapify API request/response interfaces (not exposed to users)
import { GeocodingResult, ReverseGeocodingResult } from "../external/external-types";

export interface BatchInput {
  id?: string;
  params?: any;
  body?: Record<string, unknown>;
}

export interface BatchRequestBody {
  api: string;
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
  priority?: number;
  inputs: BatchInput[];
}

export interface SubmitJobResponse {
  id: string;
  status: string;
}

export interface JobStatusResult {
  id: string;
  pending: boolean;
  results?: GeocodingResult[] | ReverseGeocodingResult[];
}

export interface PendingJobResponse {
  id: string;
  status: string;
}
