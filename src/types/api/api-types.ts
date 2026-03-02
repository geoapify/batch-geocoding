// API - Geoapify API request/response interfaces (not exposed to users)
import { GeocodingResult, ReverseGeocodingResult } from "../external/external-types";

export interface BatchInput {
  id?: string;
  params?: any;
}

export interface BatchRequestBody {
  api: string;
  priority?: number;
  inputs: BatchInput[];
  params: {
    limit: string
  };
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
