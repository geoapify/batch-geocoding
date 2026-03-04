import { GeocodingResultJson } from "../types";

export class ResultConverter {
  static filterJson(results: GeocodingResultJson, fields: string[]): GeocodingResultJson {
    return results.map(result => {
      const filtered = { ...result };
      const resultRecord: any = filtered;
      
      for (const key in resultRecord) {
        if (!fields.includes(key)) {
          delete resultRecord[key];
        }
      }
      
      return filtered;
    }) as GeocodingResultJson;
  }

  static jsonToCsv(results: GeocodingResultJson): string {
    if (results.length === 0) {
      return "";
    }

    const headers = this.createCsvHeaders(results);
    const csvLines = [headers.join(',')];

    let csvBody = this.createCsvBody(results, headers);
    csvLines.push(...csvBody);
    return csvLines.join('\n');
  }

  private static createCsvBody(results: GeocodingResultJson, headers: string[]): string[] {
    const lines: string[] = [];

    for (const result of results) {
      const cells: string[] = [];

      for (const header of headers) {
        const value = this.getValueByPath(result, header);
        cells.push(this.convertValueToSafeCsv(value));
      }

      lines.push(cells.join(','));
    }

    return lines;
  }

  private static toHeaderPaths(value: any, prefix: string): string[] {
    const isObject = value !== null && typeof value === "object";
    if (!isObject) {
      return [prefix];
    }
    const keys = Object.keys(value);
    if (keys.length === 0) {
      return [prefix];
    }

    return keys.flatMap((key) => {
      return this.toHeaderPaths(value[key], `${prefix}.${key}`)
    });
  }

  private static createCsvHeaders(results: Array<Record<string, any>>): string[] {
    const allPaths: string[] = [];

    for (const row of results) {
      for (const key of Object.keys(row)) {
        allPaths.push(...this.toHeaderPaths(row[key], key));
      }
    }

    return Array.from(new Set(allPaths));
  }

  private static getValueByPath(item: any, path: string): any {
    const parts = path.split('.');
    let currentObject = item;

    for (const part of parts) {
      if (currentObject === null || currentObject === undefined) {
        return undefined;
      }
      currentObject = currentObject[part];
    }
    return currentObject;
  }

  private static convertValueToSafeCsv(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    let stringValue = String(value);

    if (stringValue.includes('"')) {
      stringValue = stringValue.replace(/"/g, '""');
    }
    const shouldAddQuotes = stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('\r') || stringValue.includes('"');
    return shouldAddQuotes ? `"${stringValue}"` : stringValue;
  }
}
