import fs from "fs";
import path from "path";

function parseAndApplyEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const key = match[1];
    if (process.env[key] !== undefined) continue;

    let value = match[2].trim();
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function loadLocalEnvForTests(): void {
  if (process.env.GEOAPIFY_API_KEY) return;

  const cwd = process.cwd();
  const rootDir = __dirname;
  const candidates = [
    path.join(cwd, ".env.local"),
    path.join(cwd, ".env"),
    path.join(rootDir, ".env.local"),
    path.join(rootDir, ".env"),
  ];

  for (const candidate of candidates) {
    parseAndApplyEnvFile(candidate);
    if (process.env.GEOAPIFY_API_KEY) break;
  }
}

loadLocalEnvForTests();

const TEST_API_KEY = process.env.GEOAPIFY_API_KEY ?? "";
export const hasTestApiKey = TEST_API_KEY.trim().length > 0;

export default TEST_API_KEY;
