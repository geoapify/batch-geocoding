import { Batcher } from "../src/batcher";
import { ApiError, JobSubmitError } from "../src";

const originalFetch = global.fetch;

describe("Batcher Error handling", () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should throw ApiError when status check failed", async () => {
    const batcher = new Batcher("test-api-key");

    global.fetch = jest.fn((url: string) => {
      // Only status check endpoint should fail
      if (url.includes("/v1/batch?id=")) {
        return Promise.resolve({
          status: 500,
          statusText: "Internal Server Error",
          text: async () => JSON.stringify({ error: "Server error" }),
          json: async () => ({ error: "Server error" })
        });
      }
      return Promise.resolve({
        status: 202,
        json: async () => ({ id: "test-job-123" })
      });
    }) as any;

    const job = batcher.geocode([{ city: "Berlin", country: "Germany" }]);

    try {
      await job.getResults();
      fail();
    } catch (error: any) {
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(500);
      expect(error.message).toContain("Failed to get job status");
    } finally {
      console.log(`[task-id] ${expect.getState().currentTestName}: ${job.getId() ?? "not-assigned"}`);
    }
  });

  it("should throw ApiError with text body when status check error is non-json", async () => {
    const batcher = new Batcher("test-api-key");

    global.fetch = jest.fn((url: string) => {
      if (url.includes("/v1/batch?id=")) {
        return Promise.resolve({
          status: 502,
          statusText: "Bad Gateway",
          text: async () => "<html>bad gateway</html>"
        });
      }
      return Promise.resolve({
        status: 202,
        json: async () => ({ id: "test-job-abc" })
      });
    }) as any;

    const job = batcher.geocode([{ city: "Berlin", country: "Germany" }]);

    try {
      await job.getResults();
      fail();
    } catch (error: any) {
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(502);
      expect(error.responseBody).toBe("<html>bad gateway</html>");
    } finally {
      console.log(`[task-id] ${expect.getState().currentTestName}: ${job.getId() ?? "not-assigned"}`);
    }
  });

  it("should throw JobSubmitError with text body when submit error is non-json", async () => {
    const batcher = new Batcher("test-api-key");

    global.fetch = jest.fn(() => {
      return Promise.resolve({
        status: 401,
        statusText: "Unauthorized",
        text: async () => "invalid api key"
      });
    }) as any;

    const job = batcher.geocode([{ city: "Berlin", country: "Germany" }]);

    try {
      await job.getResults();
      fail();
    } catch (error: any) {
      expect(error).toBeInstanceOf(JobSubmitError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("Failed to submit job: invalid api key");
    } finally {
      console.log(`[task-id] ${expect.getState().currentTestName}: ${job.getId() ?? "not-assigned"}`);
    }
  });
});
