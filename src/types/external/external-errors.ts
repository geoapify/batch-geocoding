export class BatchGeocodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BatchGeocodingError";
  }
}

export class ValidationError extends BatchGeocodingError {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ApiError extends BatchGeocodingError {
  public readonly statusCode: number;
  public readonly responseBody?: unknown;

  constructor(message: string, statusCode: number, responseBody?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.responseBody = responseBody;
  }
}

export class JobNotFoundError extends BatchGeocodingError {
  public readonly jobId: string;

  constructor(jobId: string) {
    super(`Job not found: ${jobId}. Results expire after 24 hours.`);
    this.name = "JobNotFoundError";
    this.jobId = jobId;
  }
}

export class JobFailedError extends BatchGeocodingError {
  public readonly jobId: string;
  public readonly reason?: string;

  constructor(jobId: string, reason?: string) {
    super(`Job failed: ${jobId}${reason ? `. Reason: ${reason}` : ""}`);
    this.name = "JobFailedError";
    this.jobId = jobId;
    this.reason = reason;
  }
}

export class JobSubmitError extends BatchGeocodingError {
  public readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "JobSubmitError";
    this.statusCode = statusCode;
  }
}
