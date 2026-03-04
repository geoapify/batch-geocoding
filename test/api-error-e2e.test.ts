import { Batcher } from "../src/batcher";
import { ApiError } from "../src";

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
      await job.results();
      fail();
    } catch (error: any) {
      expect(error).toBeInstanceOf(ApiError);
      expect(error.statusCode).toBe(500);
      expect(error.message).toContain("Failed to get job status");
    }
  });
});
