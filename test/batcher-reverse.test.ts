import { Batcher } from "../src/batcher";
import TEST_API_KEY, { hasTestApiKey } from "../env-variables";
import { JobSubmitError } from "../src";

(hasTestApiKey ? describe : describe.skip)("Batcher - Reverse Geocoding E2E", () => {
  let batcher: Batcher;
  let lastJob: { getId: () => string | undefined } | null = null;

  beforeAll(() => {
    batcher = new Batcher(TEST_API_KEY);
    const originalReverseGeocode = batcher.reverseGeocode.bind(batcher);
    batcher.reverseGeocode = ((...args: Parameters<Batcher["reverseGeocode"]>) => {
      const job = originalReverseGeocode(...args);
      lastJob = job;
      return job;
    }) as Batcher["reverseGeocode"];
  });

  beforeEach(() => {
    lastJob = null;
  });

  afterEach(() => {
    console.log(`[task-id] ${expect.getState().currentTestName}: ${lastJob?.getId() ?? "not-assigned"}`);
  });

  it("should reverse geocode single coordinate", async () => {
    const job = batcher.reverseGeocode([{ lat: 48.8566, lon: 2.3522 }]);

    const result = await job.getResults();
    const json = await result.json();

    expect(json).toHaveLength(1);
    expect(json[0].formatted).toBeDefined();
    expect(json[0].country).toBeDefined();
  }, 120000);

  it("should reverse geocode multiple coordinates", async () => {
    const job = batcher.reverseGeocode([
      { lat: 48.8566, lon: 2.3522 },  // Paris
      { lat: 52.5200, lon: 13.4050 },  // Berlin
      { lat: 51.5074, lon: -0.1278 }   // London
    ]);

    const result = await job.getResults();
    const json = await result.json();

    expect(json).toHaveLength(3);
    expect(json[0].formatted).toBeDefined();
    expect(json[1].formatted).toBeDefined();
    expect(json[2].formatted).toBeDefined();
  }, 120000);

  it("should accept tuple coordinates [lon, lat]", async () => {
    const job = batcher.reverseGeocode([
      [2.3522, 48.8566],   // Paris [lon, lat]
      [13.4050, 52.5200]   // Berlin [lon, lat]
    ]);

    const result = await job.getResults();
    const json = await result.json();

    expect(json).toHaveLength(2);
    expect(json[0].formatted).toBeDefined();
    expect(json[1].formatted).toBeDefined();
  }, 120000);

  it("should return CSV results", async () => {
    const job = batcher.reverseGeocode([
      { lat: 41.9028, lon: 12.4964 }  // Rome
    ]);

    const result = await job.getResults();
    const csv = await result.csv();

    expect(typeof csv).toBe("string");
    expect(csv.length).toBeGreaterThan(0);
  }, 120000);

  it("should let backend handle out-of-range coordinates", async () => {
    const job = batcher.reverseGeocode([
      { lat: 100, lon: 200 }  // Invalid range
    ]);

    expect(job).toBeDefined();
    
    const result = await job.getResults();
    const json = await result.json();
    
    expect(Array.isArray(json)).toBe(true);
  }, 120000);

  it("should preserve reverse geocoding input fields with preserveFields", async () => {
    const job = batcher.reverseGeocode(
      [{ lat: 48.8566, lon: 2.3522, id: "reverse-paris-1" } as any],  // Paris
      { preserveFields: ["id"] }
    );

    const result = await job.getResults();
    const json = await result.json();

    expect(json).toHaveLength(1);
    expect(json[0].lat).toBeDefined();
    expect(json[0].lon).toBeDefined();
    expect(json[0].city).toBeDefined();
    expect(json[0].country).toBeDefined();
    expect((json[0] as any)["preserved_id"]).toBe("reverse-paris-1");
  }, 120000);

  it("should return validation if 1001 rows are passed", async () => {
    const coordinates1001 = Array(1001)
        .fill({ lat: 41.9028, lon: 12.4964 })
        .flat()
        .slice(0, 1001);
    try {
      let job = batcher.reverseGeocode(coordinates1001);
      const result = await job.getResults();
      await result.json();
      fail();
    } catch (e: any) {
      expect(e).toBeInstanceOf(JobSubmitError);
      expect(e.message).toBe("Failed to submit job: \"inputs\" must contain less than or equal to 1000 items");
    }
  }, 120000);
});
