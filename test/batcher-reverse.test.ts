import { Batcher } from "../src/batcher";
import TEST_API_KEY from "../env-variables";
import { ValidationError } from "../src";

describe("Batcher - Reverse Geocoding E2E", () => {
  let batcher: Batcher;

  beforeAll(() => {
    batcher = new Batcher(TEST_API_KEY);
  });

  it("should reverse geocode single coordinate", async () => {
    const job = batcher.reverseGeocode([{ lat: 48.8566, lon: 2.3522 }], { pollIntervalMs: 2000 });

    const result = await job.results();
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
    ], { pollIntervalMs: 2000 });

    const result = await job.results();
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
    ], { pollIntervalMs: 2000 });

    const result = await job.results();
    const json = await result.json();

    expect(json).toHaveLength(2);
    expect(json[0].formatted).toBeDefined();
    expect(json[1].formatted).toBeDefined();
  }, 120000);

  it("should return CSV results", async () => {
    const job = batcher.reverseGeocode([
      { lat: 41.9028, lon: 12.4964 }  // Rome
    ], { pollIntervalMs: 2000 });

    const result = await job.results();
    const csv = await result.csv();

    expect(typeof csv).toBe("string");
    expect(csv.length).toBeGreaterThan(0);
  }, 120000);

  it("should let backend handle out-of-range coordinates", async () => {
    const job = batcher.reverseGeocode([
      { lat: 100, lon: 200 }  // Invalid range
    ], { pollIntervalMs: 2000 });

    expect(job).toBeDefined();
    
    const result = await job.results();
    const json = await result.json();
    
    expect(Array.isArray(json)).toBe(true);
  }, 120000);

  it("should filter reverse geocoding results with preserveFields", async () => {
    const job = batcher.reverseGeocode(
      [{ lat: 48.8566, lon: 2.3522 }],  // Paris
      { pollIntervalMs: 2000, preserveFields: ["lat", "lon", "city", "country"] }
    );

    const result = await job.results();
    const json = await result.json();

    expect(json).toHaveLength(1);
    expect(json[0].lat).toBeDefined();
    expect(json[0].lon).toBeDefined();
    expect(json[0].city).toBeDefined();
    expect(json[0].country).toBeDefined();
    expect(json[0].formatted).toBeNull();
    expect(json[0].street).toBeNull();
  }, 120000);

  it("should return validation if 1001 rows are passed", async () => {
    const coordinates1001 = Array(1001)
        .fill({ lat: 41.9028, lon: 12.4964 })
        .flat()
        .slice(0, 1001);
    try {
      batcher.reverseGeocode(coordinates1001, {pollIntervalMs: 2000});
      fail();
    } catch (e: any) {
      expect(e).toBeInstanceOf(ValidationError);
      expect(e.message).toBe("Batch size should be less than 1000");
    }
  }, 120000);
});
