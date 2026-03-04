import { Batcher } from "../src/batcher";
import { JOB_STATE, ValidationError } from "../src/types";
import TEST_API_KEY from "../env-variables";

describe("Batcher - Core Functionality", () => {
  describe("constructor", () => {
    it("should create instance with valid API key", () => {
      const batcher = new Batcher(TEST_API_KEY);
      expect(batcher).toBeInstanceOf(Batcher);
    });

    it("should throw ValidationError for empty API key", () => {
      expect(() => new Batcher("")).toThrow(ValidationError);
    });
  });

  describe("BatcherJob", () => {
    let batcher: Batcher;

    beforeAll(() => {
      batcher = new Batcher(TEST_API_KEY);
    });

    it("should have undefined id initially", () => {
      const job = batcher.geocode([{ city: "Berlin", country: "Germany" }], { pollIntervalMs: 2000 });
      expect(job.id).toBeUndefined();
    });

    it("should have id after submission", async () => {
      const job = batcher.geocode([{ city: "Paris", country: "France" }], { pollIntervalMs: 2000 });

      await new Promise(resolve => setTimeout(resolve, 3000));

      expect(job.id).toBeDefined();
    }, 10000);

    it("should track progress via onProgress", async () => {
      const statuses: string[] = [];

      const job = batcher.geocode([{ city: "London", country: "United Kingdom" }], { pollIntervalMs: 2000 });

      job.onProgress((status) => {
        statuses.push(status.state);
      });

      await job.results();

      expect(statuses.length).toBeGreaterThan(0);
      expect(statuses).toContain("finished");
    }, 120000);

    it("should return status via getStatus", async () => {
      const job = batcher.geocode([{ city: "Madrid", country: "Spain" }], { pollIntervalMs: 2000 });

      const status = job.getStatus();

      expect(status.state).toBeDefined();
      expect([JOB_STATE.SUBMITTING, JOB_STATE.PENDING, JOB_STATE.RUNNING, JOB_STATE.FINISHED]).toContain(status.state);
    }, 10000);

    it("should return BatcherJob with expected methods", () => {
      const job = batcher.geocode([{ city: "Amsterdam", country: "Netherlands" }]);

      expect(job).toBeDefined();
      expect(typeof job.onProgress).toBe("function");
      expect(typeof job.getStatus).toBe("function");
      expect(typeof job.results).toBe("function");
    });
  });
});
