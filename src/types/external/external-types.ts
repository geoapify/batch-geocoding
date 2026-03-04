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
  common?: BatchGeocodeCommonOptions;
}

export interface BatchGeocodeCommonOptions {
  type?: LocationType;
  lang?: string;
  filter?: {
    circle?: ByCircleOptions;
    countrycode?: ByCountryCodeOptions;
    rect?: ByRectOptions;
    place?: string;
  },
  bias?: {
    circle?: ByCircleOptions;
    countrycode?: ByCountryCodeOptions;
    rect?: ByRectOptions;
    proximity?: ByProximityOptions;
  }
}

export interface ByProximityOptions {
    lon: number;
    lat: number;
}

export interface ByCircleOptions {
    lon: number;
    lat: number;
    radiusMeters: number;
}

export interface ByRectOptions {
    lon1: number;
    lat1: number;
    lon2: number;
    lat2: number;
}

export const JOB_STATE = {
  SUBMITTING: 'submitting',
  PENDING: 'pending',
  RUNNING: 'running',
  FINISHED: 'finished',
  FAILED: 'failed',
} as const;

export type JobState = typeof JOB_STATE[keyof typeof JOB_STATE];

export interface JobStatus {
  state: JobState;
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

export type LocationType = 'country' | 'state' | 'city' | 'postcode' | 'street' | 'amenity';
export type CountryCode = "none" | "auto" | "ad" | "ae" | "af" | "ag" | "ai" | "al" | "am" | "an" | "ao" | "ap" | "aq" | "ar" | "as" | "at" | "au" | "aw" | "az" | "ba" | "bb" | "bd" | "be" | "bf" | "bg" | "bh" | "bi" | "bj" | "bm" | "bn" | "bo" | "br" | "bs" | "bt" | "bv" | "bw" | "by" | "bz" | "ca" | "cc" | "cd" | "cf" | "cg" | "ch" | "ci" | "ck" | "cl" | "cm" | "cn" | "co" | "cr" | "cu" | "cv" | "cx" | "cy" | "cz" | "de" | "dj" | "dk" | "dm" | "do" | "dz" | "ec" | "ee" | "eg" | "eh" | "er" | "es" | "et" | "eu" | "fi" | "fj" | "fk" | "fm" | "fo" | "fr" | "ga" | "gb" | "gd" | "ge" | "gf" | "gh" | "gi" | "gl" | "gm" | "gn" | "gp" | "gq" | "gr" | "gs" | "gt" | "gu" | "gw" | "gy" | "hk" | "hm" | "hn" | "hr" | "ht" | "hu" | "id" | "ie" | "il" | "in" | "io" | "iq" | "ir" | "is" | "it" | "jm" | "jo" | "jp" | "ke" | "kg" | "kh" | "ki" | "km" | "kn" | "kp" | "kr" | "kw" | "ky" | "kz" | "la" | "lb" | "lc" | "li" | "lk" | "lr" | "ls" | "lt" | "lu" | "lv" | "ly" | "ma" | "mc" | "md" | "me" | "mg" | "mh" | "mk" | "ml" | "mm" | "mn" | "mo" | "mp" | "mq" | "mr" | "ms" | "mt" | "mu" | "mv" | "mw" | "mx" | "my" | "mz" | "na" | "nc" | "ne" | "nf" | "ng" | "ni" | "nl" | "no" | "np" | "nr" | "nu" | "nz" | "om" | "pa" | "pe" | "pf" | "pg" | "ph" | "pk" | "pl" | "pm" | "pr" | "ps" | "pt" | "pw" | "py" | "qa" | "re" | "ro" | "rs" | "ru" | "rw" | "sa" | "sb" | "sc" | "sd" | "se" | "sg" | "sh" | "si" | "sj" | "sk" | "sl" | "sm" | "sn" | "so" | "sr" | "st" | "sv" | "sy" | "sz" | "tc" | "td" | "tf" | "tg" | "th" | "tj" | "tk" | "tm" | "tn" | "to" | "tr" | "tt" | "tv" | "tw" | "tz" | "ua" | "ug" | "um" | "us" | "uy" | "uz" | "va" | "vc" | "ve" | "vg" | "vi" | "vn" | "vu" | "wf" | "ws" | "ye" | "yt" | "za" | "zm" | "zw";

export type ByCountryCodeOptions = CountryCode[];
