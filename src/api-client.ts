import {
  ApiError,
  BatchGeocodeOptions,
  BatchInput,
  BatchRequestBody,
  GeocodingOperation,
  GeocodingResult,
  JobNotFoundError,
  JobStatusResult,
  JobSubmitError,
  OperationType,
  ReverseGeocodingResult,
  SubmitJobResponse
} from "./types";

const DEFAULT_BASE_URL = "https://api.geoapify.com";
const REQUEST_PARAM_LIMIT = "1";

export class ApiClient {
  private options: BatchGeocodeOptions | undefined;

  async submitJob(operation: GeocodingOperation): Promise<SubmitJobResponse> {
    this.options = operation.options;
    if (operation.type === OperationType.Forward) {
      const inputs: BatchInput[] = operation.addresses!.map((item) => ({ params: item  }));
      return this.executeSubmitJob("/v1/geocode/search", inputs, operation.options);
    } else {
      const inputs: BatchInput[] = operation.coordinates!.map((coord) => ({
        params: (() => {
          if (Array.isArray(coord)) {
            return { lon: coord[0], lat: coord[1] };
          }
          return coord;
        })(),
      }));
      return this.executeSubmitJob("/v1/geocode/reverse", inputs, operation.options);
    }
  }

  async getJobStatus(jobId: string): Promise<JobStatusResult> {
    const url = `${DEFAULT_BASE_URL}/v1/batch?id=${encodeURIComponent(jobId)}&apiKey=${this.options?.apiKey}`;

    const response = await fetch(url);

    if (response.status === 404) {
      throw new JobNotFoundError(jobId);
    }

    if (response.status === 202) {
      const body = (await response.json()) as SubmitJobResponse;
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
    const url = `${DEFAULT_BASE_URL}/v1/batch?apiKey=${options?.apiKey}`;

    const body: BatchRequestBody = {
      api: api,
      inputs: inputs,
      params: {
        limit: REQUEST_PARAM_LIMIT
      }
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
}
