import { ApiClient } from "./api-client";
import { BatcherJob } from "./batcher-job";
import { BatchGeocodeOptions, Coordinates, OperationType, StructuredAddress, ValidationError } from "./types";

const BATCH_MAX_SIZE = 1000;

export class Batcher {
  private readonly apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
  }

  geocode(items: StructuredAddress[], options: BatchGeocodeOptions): BatcherJob {
    if (!options.apiKey || options.apiKey.trim() === "") {
      throw new ValidationError("API key is required");
    }
    if (!items || items.length === 0) {
      throw new ValidationError("At least one address is required");
    }
    if(items.length > BATCH_MAX_SIZE) {
      throw new ValidationError("Batch size should be less than 1000");
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

  reverseGeocode(coordinates: Coordinates[], options: BatchGeocodeOptions): BatcherJob {
    if (!options.apiKey || options.apiKey.trim() === "") {
      throw new ValidationError("API key is required");
    }
    if (!coordinates || coordinates.length === 0) {
      throw new ValidationError("At least one coordinate is required");
    }
    if(coordinates.length > BATCH_MAX_SIZE) {
      throw new ValidationError("Batch size should be less than 1000");
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
