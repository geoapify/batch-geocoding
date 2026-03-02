import { Batcher } from "../src/batcher";
import TEST_API_KEY from "../env-variables";
import { ValidationError } from "../src";

describe("Batcher - Forward Geocoding E2E", () => {
  let batcher: Batcher;

  beforeAll(() => {
    batcher = new Batcher();
  });

  it("should geocode single address", async () => {
    const job = batcher.geocode([{ name: "Brandenburg Gate", city: "Berlin", country: "Germany" }], { pollIntervalMs: 2000, apiKey: TEST_API_KEY });

    const result = await job.results();
    const json = await result.json();

    expect(json).toHaveLength(1);
    expect(json[0].lat).toBeDefined();
    expect(json[0].lon).toBeDefined();
    expect(json[0].city).toBe("Berlin");
  }, 120000);

  it("should geocode multiple addresses", async () => {
    const job = batcher.geocode([
      { name: "Brandenburg Gate", city: "Berlin", country: "Germany" },
      { name: "Eiffel Tower", city: "Paris", country: "France" },
      { name: "Big Ben", city: "London", country: "United Kingdom" }
    ], { pollIntervalMs: 2000, apiKey: TEST_API_KEY });

    const result = await job.results();
    const json = await result.json();

    expect(json).toHaveLength(3);
    expect(json[0].lat).toBeDefined();
    expect(json[1].lat).toBeDefined();
    expect(json[2].lat).toBeDefined();
  }, 120000);

  it("should geocode structured addresses", async () => {
    const job = batcher.geocode([
      { street: "Unter den Linden", city: "Berlin", country: "Germany" },
      { city: "Munich", country: "Germany" }
    ], { pollIntervalMs: 2000, apiKey: TEST_API_KEY });

    const result = await job.results();
    const json = await result.json();

    expect(json).toHaveLength(2);
    expect(json[0].lat).toBeDefined();
    expect(json[0].lon).toBeDefined();
    expect(json[1].city).toBeDefined();
  }, 120000);

  it("should support priority option", async () => {
    const job = batcher.geocode([{ city: "Paris", country: "France" }], {
      pollIntervalMs: 2000,
      priority: 1.0,
      apiKey: TEST_API_KEY
    });

    const result = await job.results();
    const json = await result.json();

    expect(json).toHaveLength(1);
    expect(json[0].city).toBeDefined();
  }, 120000);

  it("should return CSV results", async () => {
    const job = batcher.geocode([{ city: "Rome", country: "Italy" }], { pollIntervalMs: 2000, apiKey: TEST_API_KEY });

    const result = await job.results();
    const csv = await result.csv();

    expect(typeof csv).toBe("string");
    expect(csv.length).toBeGreaterThan(0);
    expect(csv).toContain("lat");
    expect(csv).toContain("lon");
  }, 120000);

  it("should filter results with preserveFields at job creation", async () => {
    const job = batcher.geocode(
      [{ city: "Paris", country: "France" }],
      { pollIntervalMs: 2000, preserveFields: ["lat", "lon", "city"], apiKey: TEST_API_KEY }
    );

    const result = await job.results();
    const json = await result.json();

    expect(json).toHaveLength(1);
    expect(json[0].lat).toBeDefined();
    expect(json[0].lon).toBeDefined();
    expect(json[0].city).toBeDefined();
    expect(json[0].country).toBeNull();
    expect(json[0].formatted).toBeNull();
  }, 120000);

  it("should filter results with preserveFields in results() method", async () => {
    const job = batcher.geocode([{ city: "Berlin", country: "Germany" }], { pollIntervalMs: 2000, apiKey: TEST_API_KEY });

    const result = await job.results({ preserveFields: ["lat", "lon"] });
    const json = await result.json();

    expect(json).toHaveLength(1);
    expect(json[0].lat).toBeDefined();
    expect(json[0].lon).toBeDefined();
    expect(json[0].city).toBeNull();
    expect(json[0].country).toBeNull();
  }, 120000);

  it("should prioritize results() preserveFields over job creation", async () => {
    const job = batcher.geocode(
      [{ city: "London", country: "United Kingdom" }],
      { pollIntervalMs: 2000, preserveFields: ["lat", "lon", "city", "country"], apiKey: TEST_API_KEY }
    );

    const result = await job.results({ preserveFields: ["lat", "lon"] });
    const json = await result.json();

    expect(json).toHaveLength(1);
    expect(json[0].lat).toBeDefined();
    expect(json[0].lon).toBeDefined();
    expect(json[0].city).toBeNull();
    expect(json[0].country).toBeNull();
  }, 120000);

  it("should return validation if 1001 rows are passed", async () => {
    const locations1001 = Array(1001)
      .fill({ "name": "Brandenburg Gate", "city": "Berlin", "country": "Germany" },)
      .flat()
      .slice(0, 1001);
    try {
      batcher.geocode(locations1001, { pollIntervalMs: 2000, apiKey: TEST_API_KEY });
      fail();
    } catch (e: any) {
      expect(e).toBeInstanceOf(ValidationError);
      expect(e.message).toBe("Batch size should be less than 1000");
    }
  }, 120000);

  it("should filter CSV results with preserveFields", async () => {
    const job = batcher.geocode(
      [{ city: "Madrid", country: "Spain" }],
      { pollIntervalMs: 2000, preserveFields: ["lat", "lon", "city"], apiKey: TEST_API_KEY }
    );

    const result = await job.results();
    const csv = await result.csv();

    expect(typeof csv).toBe("string");
    expect(csv.length).toBeGreaterThan(0);

    // const lines = csv.split('\n');
    // const firstLine = lines[0];
  //   TODO: need to fix
  }, 120000);
});
