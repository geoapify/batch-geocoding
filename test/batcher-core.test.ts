import { Batcher } from "../src/batcher";
import { JOB_STATE, ValidationError } from "../src/types";
import { BatcherJob } from "../src/batcher-job";
import { ApiClient } from "../src/api-client";
import { OperationType } from "../src/types";
import TEST_API_KEY, { hasTestApiKey } from "../env-variables";

describe("Batcher - Core Functionality", () => {
  describe("constructor", () => {
    it("should create instance with valid API key", () => {
      const batcher = new Batcher("test-api-key");
      expect(batcher).toBeInstanceOf(Batcher);
    });

    it("should throw ValidationError for empty API key", () => {
      expect(() => new Batcher("")).toThrow(ValidationError);
    });

    it("should throw ValidationError when reading results before start", async () => {
      const job = new BatcherJob(
        new ApiClient("test-api-key"),
        {
          type: OperationType.Forward,
          addresses: [{ city: "Berlin", country: "Germany" }]
        }
      );

      await expect(job.getResults()).rejects.toThrow(ValidationError);
      await expect(job.getResults()).rejects.toThrow("Job has not been started");
    });
  });

  (hasTestApiKey ? describe : describe.skip)("BatcherJob", () => {
    let batcher: Batcher;
    let lastJob: { getId: () => string | undefined } | null = null;

    beforeAll(() => {
      batcher = new Batcher(TEST_API_KEY);
      const originalGeocode = batcher.geocode.bind(batcher);
      batcher.geocode = ((...args: Parameters<Batcher["geocode"]>) => {
        const job = originalGeocode(...args);
        lastJob = job;
        return job;
      }) as Batcher["geocode"];
    });

    beforeEach(() => {
      lastJob = null;
    });

    afterEach(() => {
      console.log(`[task-id] ${expect.getState().currentTestName}: ${lastJob?.getId() ?? "not-assigned"}`);
    });

    it("should have id after submission", async () => {
      const job = batcher.geocode([{ city: "Paris", country: "France" }]);

      await new Promise(resolve => setTimeout(resolve, 3000));

      expect(job.getId()).toBeDefined();
    }, 10000);

    it("should track progress via onProgress", async () => {
      const statuses: string[] = [];

      const job = batcher.geocode([{ city: "London", country: "United Kingdom" }]);

      job.onProgress((status) => {
        statuses.push(status.state);
      });

      await job.getResults();

      expect(statuses.length).toBeGreaterThan(0);
      expect(statuses).toContain("finished");
    }, 120000);

    it("should return status via getStatus", async () => {
      const job = batcher.geocode([{ city: "Madrid", country: "Spain" }]);

      const status = job.getStatus();

      expect(status.state).toBeDefined();
      expect([JOB_STATE.SUBMITTING, JOB_STATE.PENDING, JOB_STATE.RUNNING, JOB_STATE.FINISHED]).toContain(status.state);

      await job.getResults();
    }, 10000);
  });
});
