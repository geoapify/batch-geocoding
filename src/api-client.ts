import {
  ApiError,
  BatchGeocodeOptions,
  BatchInput,
  BatchRequestBody,
  Coordinates,
  CoordinatesObject,
  GeocodingOperation,
  GeocodingResult,
  JobNotFoundError,
  JobStatusResult,
  JobSubmitError,
  OperationType,
  PendingJobResponse,
  ReverseGeocodingResult,
  StructuredAddress,
  SubmitJobResponse
} from "./types";

const DEFAULT_BASE_URL = "https://api.geoapify.com";

export class ApiClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey: string, base_url?: string) {
    this.apiKey = apiKey;
    this.baseUrl = base_url || DEFAULT_BASE_URL;
  }

  async submitJob(operation: GeocodingOperation): Promise<SubmitJobResponse> {
    if (operation.type === OperationType.Forward) {
      return this.submitForwardJob(operation.addresses!, operation.options);
    } else {
      return this.submitReverseJob(operation.coordinates!, operation.options);
    }
  }

  private async submitForwardJob(items: StructuredAddress[], options?: BatchGeocodeOptions): Promise<SubmitJobResponse> {
    const inputs: BatchInput[] = items.map((item) => ({ params: item  }));
    return this.executeSubmitJob("/v1/geocode/search", inputs, options);
  }

  private async submitReverseJob(coordinates: Coordinates[], options?: BatchGeocodeOptions): Promise<SubmitJobResponse> {
    const inputs: BatchInput[] = coordinates.map((coord) => ({
      params: this.normalizeCoordinates(coord)
    }));
    return this.executeSubmitJob("/v1/geocode/reverse", inputs, options);
  }

  async getJobStatus(jobId: string): Promise<JobStatusResult> {
    const url = `${this.getBatchUrl()}?id=${encodeURIComponent(jobId)}&apiKey=${this.apiKey}`;

    const response = await fetch(url);

    if (response.status === 404) {
      throw new JobNotFoundError(jobId);
    }

    if (response.status === 202) {
      const body = (await response.json()) as PendingJobResponse;
      return {
        id: body.id,
        pending: true
      };
    }

    if (response.status === 200) {
      const data: any = await response.json();
      
      let results: Array<GeocodingResult | ReverseGeocodingResult> = [];
      
      if (data && Array.isArray(data.results)) {
        results = data.results.map((item: any) => {
          if (item.result?.type === "FeatureCollection" && Array.isArray(item.result.features)) {
            // GeoJSON format - extract properties from first feature
            const feature = item.result.features[0];
            if (feature?.properties) {
              return {
                ...feature.properties,
                lat: feature.geometry?.coordinates?.[1],
                lon: feature.geometry?.coordinates?.[0]
              };
            }
          }
          // Fallback to result as-is
          return item.result ?? item;
        });
      }
      
      return {
        id: jobId,
        pending: false,
        results: results as any
      };
    }

    const errorBody = await response.json();
    throw new ApiError(
      `Failed to get job status: ${response.statusText}`,
      response.status,
      errorBody
    );
  }

  private async executeSubmitJob(api: string, inputs: BatchInput[], options?: BatchGeocodeOptions): Promise<SubmitJobResponse> {
    const url = `${this.getBatchUrl()}?apiKey=${this.apiKey}`;

    const body: BatchRequestBody = {
      api,
      inputs
    };

    if (options?.priority !== undefined) {
      body.priority = options.priority;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (response.status !== 202) {
      throw new JobSubmitError(
        `Failed to submit job: ${response.statusText}`,
        response.status
      );
    }

    const data = await response.json();
    return data as SubmitJobResponse;
  }

  private normalizeCoordinates(coord: Coordinates): CoordinatesObject {
    if (Array.isArray(coord)) {
      return { lon: coord[0], lat: coord[1] };
    }
    return coord;
  }

  private getBatchUrl(): string {
    return `${this.baseUrl}/v1/batch`;
  }
}
