export type JobState = "submitting" | "pending" | "running" | "finished" | "failed";

export interface JobStatus {
  state: JobState;
  progress?: {
    done?: number;
    total?: number;
  };
}

export interface CoordinatesObject {
  lat: number;
  lon: number;
}

/** Tuple format [lon, lat] to match GeoJSON convention */
export type CoordinatesTuple = [number, number];

export type Coordinates = CoordinatesObject | CoordinatesTuple;

export type LocationType = "country" | "state" | "city" | "postcode" | "street" | "amenity" | "locality";

export interface BatchGeocodeOptions {
  /** Polling interval in ms (default: 1000, recommended 60000 for large jobs) */
  pollIntervalMs?: number;
  preserveFields?: string[];
  /** Job priority [0.1, 1] */
  priority?: number;
  type?: LocationType;
  /** ISO 639-1 language code */
  lang?: string;
  filter?: string;
  bias?: string;
}

export interface ResultOptions {
  format?: "json" | "csv";
}

export type ProgressCallback = (status: JobStatus) => void;

export interface ParsedQuery {
  housenumber?: string;
  street?: string;
  postcode?: string;
  city?: string;
  state?: string;
  country?: string;
  expected_type?: string;
}

export interface GeocodingQuery {
  text?: string;
  parsed?: ParsedQuery;
}

export interface ReverseGeocodingQuery {
  lat: number;
  lon: number;
}

export interface DataSource {
  sourcename: string;
  attribution: string;
  license: string;
  url: string;
}

export interface Rank {
  importance?: number;
  popularity?: number;
  confidence?: number;
  confidence_city_level?: number;
  confidence_street_level?: number;
  match_type?: string;
}

export interface GeocodingResult {
  query?: GeocodingQuery;
  datasource?: DataSource;
  name?: string;
  housenumber?: string;
  street?: string;
  suburb?: string;
  district?: string;
  city?: string;
  county?: string;
  state?: string;
  state_code?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
  lon: number;
  lat: number;
  formatted?: string;
  address_line1?: string;
  address_line2?: string;
  result_type?: string;
  rank?: Rank;
  place_id?: string;
  category?: string;
}

export interface ReverseGeocodingResult {
  query?: ReverseGeocodingQuery;
  datasource?: DataSource;
  name?: string;
  housenumber?: string;
  street?: string;
  suburb?: string;
  district?: string;
  city?: string;
  county?: string;
  state?: string;
  state_code?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
  lon: number;
  lat: number;
  distance?: number;
  formatted?: string;
  address_line1?: string;
  address_line2?: string;
  result_type?: string;
  rank?: Rank;
  place_id?: string;
  category?: string;
}

export interface BatchResult {
  json(): Promise<GeocodingResultJson>;
  csv(): Promise<string>;
}

export type GeocodingResultJson = GeocodingResult[] | ReverseGeocodingResult[];

export interface BatchInput {
  id?: string;
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
}

export interface BatchRequestBody {
  api: string;
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
  priority?: number;
  inputs: BatchInput[];
}

export interface JobSubmitResponse {
  id: string;
  status: string;
  url?: string;
}

export interface JobStatusResponse {
  id: string;
  status?: string;
  results?: unknown[];
}

export type GeocodingType = "forward" | "reverse";
