export class BatchGeocodingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BatchGeocodingError";
    Object.setPrototypeOf(this, BatchGeocodingError.prototype);
  }
}

export class ValidationError extends BatchGeocodingError {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
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
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

export class JobNotFoundError extends BatchGeocodingError {
  public readonly jobId: string;

  constructor(jobId: string) {
    super(`Job not found: ${jobId}. Results expire after 24 hours.`);
    this.name = "JobNotFoundError";
    this.jobId = jobId;
    Object.setPrototypeOf(this, JobNotFoundError.prototype);
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
    Object.setPrototypeOf(this, JobFailedError.prototype);
  }
}

export class JobSubmitError extends BatchGeocodingError {
  public readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "JobSubmitError";
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, JobSubmitError.prototype);
  }
}
