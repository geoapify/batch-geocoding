import { ApiClient } from "./api-client";
import { BatcherJob } from "./batcher-job";
import { BatchGeocodeOptions, Coordinates, OperationType, StructuredAddress, ValidationError } from "./types";

export class Batcher {
  private readonly apiClient: ApiClient;

  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim() === "") {
      throw new ValidationError("API key is required");
    }

    this.apiClient = new ApiClient(apiKey);
  }

  geocode(items: StructuredAddress[], options?: BatchGeocodeOptions): BatcherJob {
    if (!items || items.length === 0) {
      throw new ValidationError("At least one address is required");
    }

    const job = new BatcherJob(
      this.apiClient,
      {
        type: OperationType.Forward,
        addresses: items,
        options: options
      }
    );

    job.start();
    return job;
  }

  reverseGeocode(coordinates: Coordinates[], options?: BatchGeocodeOptions): BatcherJob {
    if (!coordinates || coordinates.length === 0) {
      throw new ValidationError("At least one coordinate is required");
    }

    const job = new BatcherJob(
      this.apiClient,
      {
        type: OperationType.Reverse,
        coordinates: coordinates,
        options: options
      }
    );

    job.start();
    return job;
  }
}
