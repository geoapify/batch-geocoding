import { ResultConverter } from "../src/helpers/result-converter";
import * as fs from "fs";
import * as path from "path";

describe("ResultConverter - jsonToCsv", () => {
  const dataDir = path.join(__dirname, "data");

  describe("geocode results", () => {
    it("should match baseline CSV", () => {
      const jsonPath = path.join(dataDir, "geocode-results.json");
      const csvPath = path.join(dataDir, "geocode-results.csv");
      
      const geocodeResults = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      const csv = ResultConverter.jsonToCsv(geocodeResults);
      const expectedCsv = fs.readFileSync(csvPath, "utf-8");

      expect(csv).toBe(expectedCsv);
    });
  });

  describe("reverse geocode results", () => {
    it("should match baseline CSV", () => {
      const jsonPath = path.join(dataDir, "reverse-results.json");
      const csvPath = path.join(dataDir, "reverse-results.csv");
      
      const reverseResults = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      const csv = ResultConverter.jsonToCsv(reverseResults);
      const expectedCsv = fs.readFileSync(csvPath, "utf-8");

      expect(csv).toBe(expectedCsv);
    });
  });

  describe("edge cases", () => {
    it("should return empty string for empty results", () => {
      const csv = ResultConverter.jsonToCsv([]);
      expect(csv).toBe("");
    });

    it("should handle null values in results", () => {
      const results: any = [
        {
          lat: 48.8566,
          lon: 2.3522,
          city: "Paris",
          country: null,
          formatted: undefined
        }
      ];

      const csv = ResultConverter.jsonToCsv(results);
      expect(csv).toContain("city");
      expect(csv).toContain("Paris");
    });
  });
});
