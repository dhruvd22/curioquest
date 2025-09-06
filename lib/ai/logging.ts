import fs from "node:fs/promises";
import path from "node:path";

const LOG_DIR = path.join(process.cwd(), ".ai_logs");

export async function logCall(meta: {
  model: string;
  temperature: number;
  input: number;
  output: number;
  ms: number;
}) {
  await fs.mkdir(LOG_DIR, { recursive: true });
  const file = path.join(LOG_DIR, `${new Date().toISOString().slice(0,10)}.ndjson`);
  const record = { timestamp: new Date().toISOString(), ...meta };
  await fs.appendFile(file, JSON.stringify(record) + "\n");
}
