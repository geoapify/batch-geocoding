import { ApiClient } from "./api-client";
import {
  BatchGeocodeOptions,
  BatchResult,
  GeocodingOperation,
  GeocodingResultJson,
  JobFailedError,
  JobStatus,
  JobState,
  ProgressCallback, JOB_STATE
} from "./types";
import { ResultsFilter } from "./helpers";

const DEFAULT_POLL_INTERVAL_MS = 1000;

export class BatcherJob {
  public id: string | undefined;

  private readonly pollIntervalMs: number;

  private resultsCache: GeocodingResultJson | null = null;

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

  async results(options?: BatchGeocodeOptions): Promise<BatchResult> {
    if (!this.finishedPromise) {
      throw new Error("Job has not been started. Call start() first.");
    }

    await this.finishedPromise;

    if (this.state === JOB_STATE.FAILED) {
      throw new JobFailedError(this.id ? this.id : "unknown");
    }

    return this.buildBatchResult(options);
  }

  private async submitJob(): Promise<void> {
    try {
      const response = await this.apiClient.submitJob(this.operation);
      this.id = response.id;
      this.updateState(JOB_STATE.PENDING);
      this.startPolling();
    } catch (error) {
      this.updateState(JOB_STATE.FAILED);
      this.finishedReject(error as Error);
    }
  }

  private startPolling(): void {
    this.pollingTimer = setTimeout(() => this.poll(), this.pollIntervalMs);
  }

  private stopPolling(): void {
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer);
      this.pollingTimer = null;
    }
  }

  private async poll(): Promise<void> {
    if (!this.id) return;

    try {
      const result = await this.apiClient.getJobStatus(this.id);

      if (result.pending) {
        this.updateState(JOB_STATE.PENDING);
        this.pollingTimer = setTimeout(() => this.poll(), this.pollIntervalMs);
      } else {
        this.resultsCache = result.results ?? [];
        this.updateState(JOB_STATE.FINISHED);
        this.stopPolling();
        this.finishedResolve();
      }
    } catch (error) {
      this.updateState(JOB_STATE.FAILED);
      this.stopPolling();
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
      try {
        callback(status);
      } catch {
        // TODO: fix it
      }
    }
  }

  private buildBatchResult(options?: BatchGeocodeOptions): BatchResult {
    const preserveFields = options?.preserveFields ?? this.operation.options?.preserveFields;

    return {
      json: async (): Promise<GeocodingResultJson> => {
        const results = this.resultsCache ?? [];
        
        if (!preserveFields || preserveFields.length === 0) {
          return results;
        }
        
        return ResultsFilter.filterJson(results, preserveFields);
      },

      csv: async (): Promise<string> => {
        const results = this.resultsCache ?? [];
        
        const filteredResults = (preserveFields && preserveFields.length > 0)
          ? ResultsFilter.filterJson(results, preserveFields)
          : results;
        
        return ResultsFilter.jsonToCsv(filteredResults);
      }
    };
  }
}
