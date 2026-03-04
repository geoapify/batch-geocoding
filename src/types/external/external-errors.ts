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

export class JobSubmitError extends BatchGeocodingError {
  public readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "JobSubmitError";
    this.statusCode = statusCode;
  }
}
