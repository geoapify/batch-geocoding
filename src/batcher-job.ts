import { ApiClient } from "./api-client";
import {
  BatchResult,
  GeocodingOperation,
  GeocodingResultJson,
  OperationType,
  ValidationError,
  JobStatus,
  JobState,
  ProgressCallback, JOB_STATE
} from "./types";
import { ResultConverter } from "./helpers";

const DEFAULT_POLL_INTERVAL_MS = 1000;

export class BatcherJob {
  private jobId: string | undefined;

  private readonly pollIntervalMs: number;

  private resultsCache: GeocodingResultJson = [];

  private state: JobState = JOB_STATE.SUBMITTING;
  private progressCallbacks: ProgressCallback[] = [];
  private pollingTimer: ReturnType<typeof setTimeout> | null = null;
  private finishedPromise: Promise<void> | null = null;
  private finishedResolve!: () => void;
  private finishedReject!: (error: Error) => void;

  private readonly apiClient: ApiClient;
  private readonly operation: GeocodingOperation;

  constructor(apiClient: ApiClient, operation: GeocodingOperation) {
    this.apiClient = apiClient;
    this.operation = operation;
    this.pollIntervalMs = operation.options?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  }

  async start(): Promise<void> {
    if (this.finishedPromise) {
      return;
    }

    this.finishedPromise = new Promise((resolve, reject) => {
      this.finishedResolve = resolve;
      this.finishedReject = reject;
    });
    // Prevent process-level unhandled-rejection warnings when consumers never call getResults().
    this.finishedPromise.catch(() => {});

    await this.submitJob();
  }

  onProgress(callback: ProgressCallback): void {
    this.progressCallbacks.push(callback);

    if (this.state !== JOB_STATE.SUBMITTING) {
      callback(this.getStatus());
    }
  }

  getStatus(): JobStatus {
    return { state: this.state };
  }

  getId(): string | undefined {
    return this.jobId;
  }

  async getResults(): Promise<BatchResult> {
    if (!this.finishedPromise) {
      throw new ValidationError("Job has not been started");
    }

    await this.finishedPromise;

    return this.buildBatchResult();
  }

  private async submitJob(): Promise<void> {
    try {
      const response = await this.apiClient.submitJob(this.operation);
      this.jobId = response.id;
      this.updateState(JOB_STATE.PENDING);
      this.pollingTimer = setTimeout(() => this.poll(), this.pollIntervalMs);
    } catch (error) {
      this.updateState(JOB_STATE.FAILED);
      this.finishedReject(error as Error);
    }
  }

  private async poll(): Promise<void> {
    if (!this.jobId) return;

    try {
      const result = await this.apiClient.getJobStatus(this.jobId);

      if (result.pending) {
        this.updateState(JOB_STATE.PENDING);
        this.pollingTimer = setTimeout(() => this.poll(), this.pollIntervalMs);
      } else {
        this.resultsCache = result.results ? result.results : [];
        this.updateState(JOB_STATE.FINISHED);
        if (this.pollingTimer) {
          clearTimeout(this.pollingTimer);
          this.pollingTimer = null;
        }
        this.finishedResolve();
      }
    } catch (error) {
      this.updateState(JOB_STATE.FAILED);
      if (this.pollingTimer) {
        clearTimeout(this.pollingTimer);
        this.pollingTimer = null;
      }
      this.finishedReject(error as Error);
    }
  }

  private updateState(newState: JobState): void {
    this.state = newState;
    this.notifyProgress();
  }

  private notifyProgress(): void {
    const status = this.getStatus();
    for (const callback of this.progressCallbacks) {
      callback(status);
    }
  }

  private buildBatchResult(): BatchResult {
    const preserveFields = this.operation.options?.preserveFields;
    const preservedResults = this.appendPreservedFields(this.resultsCache, preserveFields);

    return {
      json: async (): Promise<GeocodingResultJson> => {
        return preservedResults;
      },

      csv: async (): Promise<string> => {
        return ResultConverter.jsonToCsv(preservedResults);
      }
    };
  }

  private appendPreservedFields(results: GeocodingResultJson, preserveFields?: string[]): GeocodingResultJson {
    if (!preserveFields || preserveFields.length === 0) {
      return results;
    }

    const inputRows = this.getInputRows();
    return results.map((result, index) => {
      const inputRow = inputRows[index] ?? {};
      const preserved: Record<string, unknown> = {};

      for (const field of preserveFields) {
        if (Object.prototype.hasOwnProperty.call(inputRow, field)) {
          preserved[`preserved_${field}`] = inputRow[field];
        }
      }

      if (Object.keys(preserved).length === 0) {
        return result;
      }

      return {
        ...(result as Record<string, unknown>),
        ...preserved
      };
    }) as GeocodingResultJson;
  }

  private getInputRows(): Array<Record<string, unknown>> {
    if (this.operation.type === OperationType.Forward) {
      return (this.operation.addresses ?? []).map((item) => ({ ...item }));
    }

    return (this.operation.coordinates ?? []).map((coord) => {
      if (Array.isArray(coord)) {
        return { lon: coord[0], lat: coord[1] };
      }
      return { ...coord };
    });
  }
}
