import { GeocodingResultJson } from "../types";

export class ResultsFilter {
  static filterJson(results: GeocodingResultJson, fields: string[]): GeocodingResultJson {
    return results.map(result => {
      const filtered = { ...result };
      const resultRecord = filtered as Record<string, unknown>;
      
      for (const key in resultRecord) {
        if (!fields.includes(key)) {
          resultRecord[key] = null;
        }
      }
      
      return filtered;
    }) as GeocodingResultJson;
  }

  static jsonToCsv(results: GeocodingResultJson): string {
    if (results.length === 0) return "";

    const allKeys = new Set<string>();
    results.forEach(result => {
      Object.keys(result).forEach(key => allKeys.add(key));
    });

    const headers = Array.from(allKeys);
    const csvLines = [headers.join(',')];

    results.forEach(result => {
      const row = headers.map(header => {
        const value = (result as unknown as Record<string, unknown>)[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value).replace(/,/g, ';');
        return String(value).replace(/,/g, ';');
      });
      csvLines.push(row.join(','));
    });

    return csvLines.join('\n');
  }
}
