import { Batcher } from "../src/batcher";
import TEST_API_KEY from "../env-variables";
import { JobSubmitError } from "../src";

describe("Batcher - Forward Geocoding E2E", () => {
  let batcher: Batcher;

  beforeAll(() => {
    batcher = new Batcher(TEST_API_KEY);
  });

  it("should geocode single address", async () => {
    const job = batcher.geocode([{ name: "Brandenburg Gate"}], {common: { type: "amenity"}});

    const result = await job.results();
    const json = await result.json();

    expect(json).toHaveLength(1);
    expect(json[0].lat).toBe(52.5162699);
    expect(json[0].lon).toBe(13.377703399031432);
    expect(json[0].city).toBe("Berlin");
  }, 120000);

  it("should geocode multiple addresses", async () => {
    const job = batcher.geocode([
        { name: "Brandenburg Gate"},
        { name: "Eiffel Tower"},
        { name: "Big Ben"}
    ], {common: { type: "amenity"}})

    const result = await job.results();
    const json = await result.json();

    expect(json).toHaveLength(3);
    expect(json[0].postcode).toBe("10117");
    expect(json[1].postcode).toBe("75007")
    expect(json[2].state_code).toBe("QLD")
  }, 120000);

  it("should geocode structured addresses", async () => {
    const job = batcher.geocode([{ street: "Unter den Linden", city: "Berlin", country: "Germany" }, { city: "Munich", country: "Germany" }]);

    const result = await job.results();
    const json = await result.json();

    expect(json).toHaveLength(2);
    expect(json[0].city).toBe("Berlin");
    expect(json[1].city).toBe('Munich');
  }, 120000);

  it("should support priority option", async () => {
    const job = batcher.geocode([{ city: "Paris", country: "France" }], {
      priority: 1.0
    });

    const result = await job.results();
    const json = await result.json();

    expect(json).toHaveLength(1);
    expect(json[0].city).toBe('Paris')
  }, 120000);

  it("should return CSV results", async () => {
    const job = batcher.geocode([{ city: "Rome", country: "Italy" }]);

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
      { preserveFields: ["lat", "lon", "city"] }
    );

    const result = await job.results();
    const json = await result.json();

    expect(json).toHaveLength(1);
    expect(json[0].lat).toBeDefined();
    expect(json[0].lon).toBeDefined();
    expect(json[0].city).toBeDefined();
    expect(json[0].country).toBeUndefined();
    expect(json[0].formatted).toBeUndefined();
  }, 120000);

  it("should filter results with preserveFields in results() method", async () => {
    const job = batcher.geocode([{ city: "Berlin", country: "Germany" }]);

    const result = await job.results({ preserveFields: ["lat", "lon"] });
    const json = await result.json();

    expect(json).toHaveLength(1);
    expect(json[0].lat).toBeDefined();
    expect(json[0].lon).toBeDefined();
    expect(json[0].city).toBeUndefined();
    expect(json[0].country).toBeUndefined();
  }, 120000);

  it("should prioritize results() preserveFields over job creation", async () => {
    const job = batcher.geocode(
      [{ city: "London", country: "United Kingdom" }],
      { preserveFields: ["lat", "lon", "city", "country"] }
    );

    const result = await job.results({ preserveFields: ["lat", "lon"] });
    const json = await result.json();

    expect(json).toHaveLength(1);
    expect(json[0].lat).toBeDefined();
    expect(json[0].lon).toBeDefined();
    expect(json[0].city).toBeUndefined();
    expect(json[0].country).toBeUndefined();
  }, 120000);

  it("should return validation if 1001 rows are passed", async () => {
    const locations1001 = Array(1001)
      .fill({ "name": "Brandenburg Gate", "city": "Berlin", "country": "Germany" },)
      .flat()
      .slice(0, 1001);
    try {
      let job = batcher.geocode(locations1001);
      const result = await job.results();
      await result.json();
      fail();
    } catch (e: any) {
      expect(e).toBeInstanceOf(JobSubmitError);
      expect(e.message).toBe("Failed to submit job: \"inputs\" must contain less than or equal to 1000 items");
    }
  }, 120000);

  it("should filter CSV results with preserveFields", async () => {
    const job = batcher.geocode(
      [{ city: "Madrid", country: "Spain" }],
      { preserveFields: ["lat", "lon", "city"] }
    );

    const result = await job.results();
    const csv = await result.csv();

    expect(typeof csv).toBe("string");
    expect(csv.length).toBeGreaterThan(0);

    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    
    expect(headers).toEqual(expect.arrayContaining(["lat", "lon", "city"]));
    
    const filteredOutFields = ["country", "street", "housenumber", "formatted", "datasource.sourcename"];
    for (const field of filteredOutFields) {
      expect(headers).not.toContain(field);
    }
  }, 120000);

  it("should filter by type=country", async () => {
    const job = batcher.geocode(
      [{ name: "Georgia" }],
      {
        common: { type: "country", lang: "en" }
      }
    );

    const result = await job.results();
    const json = await result.json();

    expect(json).toHaveLength(1);
    expect(json[0].result_type).toBe("country");
    expect(json[0].country).toBe("Georgia");
  }, 120000);

  it("should filter by countrycode", async () => {
    const job = batcher.geocode(
      [{ name: "Paris" }],
      { 
        common: {
          type: "city",
          lang: "en",
          filter: { countrycode: ["fr"] }
        }
      }
    );

    const result = await job.results();
    const json = await result.json();

    expect(json).toHaveLength(1);
    expect(json[0].city).toBe("Paris");
    expect(json[0].country_code).toBe("fr");
  }, 120000);

  it("should filter by circle", async () => {
    const job = batcher.geocode(
      [{ name: "Brandenburg Gate" }],
      { 
        common: {
          type: "amenity",
          lang: "en",
          filter: { 
            circle: { lon: 13.377704, lat: 52.516275, radiusMeters: 5000 }
          }
        }
      }
    );

    const result = await job.results();
    const json = await result.json();

    expect(json).toHaveLength(1);
    expect(json[0].name).toBe("Brandenburg Gate");
    expect(json[0].city).toBe("Berlin");
  }, 120000);

  it("should filter by rect", async () => {
    const job = batcher.geocode(
      [{ name: "restaurant" }],
      { 
        common: {
          type: "amenity",
          lang: "en",
          filter: { 
            rect: { lon1: 13.35, lat1: 52.48, lon2: 13.42, lat2: 52.54 }
          }
        }
      }
    );

    const result = await job.results();
    const json = await result.json();

    expect(json).toHaveLength(1);
    expect(json[0].city).toBe("Berlin");
  }, 120000);

  it("should return results in Spanish when lang=es", async () => {
    const job = batcher.geocode(
      [{ name: "Germany" }],
      { 
        common: { type: "country", lang: "es" }
      }
    );

    const result = await job.results();
    const json = await result.json();

    expect(json).toHaveLength(1);
    expect(json[0].country).toBe("Alemania");
  }, 120000);

  it("should bias by countrycode", async () => {
    const job = batcher.geocode(
      [{ name: "Springfield" }],
      { 
        common: {
          type: "city",
          lang: "en",
          bias: { countrycode: ["us"] }
        }
      }
    );

    const result = await job.results();
    const json = await result.json();

    expect(json).toHaveLength(1);
    expect(json[0].city).toBe("Springfield");
    expect(json[0].country_code).toBe("us");
  }, 120000);

  it("should bias by proximity", async () => {
    const job = batcher.geocode(
      [{ name: "Paris" }],
      { 
        common: {
          type: "city",
          lang: "en",
          bias: { proximity: { lon: 2.3522, lat: 48.8566 } }
        }
      }
    );

    const result = await job.results();
    const json = await result.json();

    expect(json).toHaveLength(1);
    expect(json[0].city).toBe("Paris");
    expect(json[0].country_code).toBe("fr");
  }, 120000);

  it("should work with fast polling interval (500ms)", async () => {
    const job = batcher.geocode(
      [{ city: "Berlin", country: "Germany" }],
      { pollIntervalMs: 500 }
    );

    const result = await job.results();
    const json = await result.json();

    expect(json).toHaveLength(1);
    expect(json[0].city).toBe("Berlin");
  }, 120000);

  it("should work with slow polling interval (5000ms)", async () => {
    const job = batcher.geocode(
      [{ city: "Madrid", country: "Spain" }],
      { pollIntervalMs: 5000 }
    );

    const result = await job.results();
    const json = await result.json();

    expect(json).toHaveLength(1);
    expect(json[0].city).toBe("Madrid");
  }, 120000);

  it("should handle address with only city", async () => {
    const job = batcher.geocode(
      [{ city: "Tokyo" }]
    );

    const result = await job.results();
    const json = await result.json();

    expect(json).toHaveLength(1);
    expect(json[0].lat).toBeDefined();
    expect(json[0].lon).toBeDefined();
    expect(json[0].city).toBeDefined();
  }, 120000);

  it("should handle address with only country", async () => {
    const job = batcher.geocode(
      [{ country: "Switzerland" }]
    );

    const result = await job.results();
    const json = await result.json();

    expect(json).toHaveLength(1);
    expect(json[0].lat).toBeDefined();
    expect(json[0].lon).toBeDefined();
    expect(json[0].country).toBeDefined();
  }, 120000);

  it("should handle very specific address", async () => {
    const job = batcher.geocode(
      [{ 
        street: "Champs-Élysées",
        housenumber: "10",
        postcode: "75008",
        city: "Paris",
        country: "France"
      }]
    );

    const result = await job.results();
    const json = await result.json();

    expect(json).toHaveLength(1);
    expect(json[0].lat).toBeDefined();
    expect(json[0].lon).toBeDefined();
    expect(json[0].city).toBe("Paris");
  }, 120000);

  it("should throw error when no addresses provided", () => {
    expect(() => {
      batcher.geocode([]);
    }).toThrow("At least one address is required");
  });

  it("should handle addresses with special characters", async () => {
    const job = batcher.geocode([
      { city: "São Paulo", country: "Brazil" },
      { city: "Zürich", country: "Switzerland" }
    ]);

    const result = await job.results();
    const json = await result.json();

    expect(json).toHaveLength(2);
    expect(json[0].lat).toBeDefined();
    expect(json[1].lat).toBeDefined();
  }, 120000);

  it("should throw JobSubmitError when using invalid API key", async () => {
    const invalidBatcher = new Batcher("invalid-api-key-12345");

    const job = invalidBatcher.geocode([{ city: "Berlin", country: "Germany" }]);

    try {
      await job.results();
      fail("Expected JobSubmitError to be thrown");
    } catch (error: any) {
      expect(error).toBeInstanceOf(JobSubmitError);
      expect(error.statusCode).toBeDefined();
      expect(error.message).toContain("Failed to submit job");
    }
  }, 30000);
});
