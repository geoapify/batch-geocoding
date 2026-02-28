// External - User-facing types (what users pass in or receive back)
export interface StructuredAddress {
  name?: string;
  housenumber?: string;
  street?: string;
  postcode?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface CoordinatesObject {
  lat: number;
  lon: number;
}

export type CoordinatesTuple = [number, number];

export type Coordinates = CoordinatesObject | CoordinatesTuple;

export interface BatchGeocodeOptions {
  pollIntervalMs?: number;
  preserveFields?: string[];
  priority?: number;
}

export type JobState = "submitting" | "pending" | "running" | "finished" | "failed";

export interface JobStatus {
  state: JobState;
  progress?: {
    done?: number;
    total?: number;
  };
}

export type ProgressCallback = (status: JobStatus) => void;

export interface BatchResult {
  json(): Promise<GeocodingResultJson>;
  csv(): Promise<string>;
}

export type GeocodingResultJson = GeocodingResult[] | ReverseGeocodingResult[];

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
