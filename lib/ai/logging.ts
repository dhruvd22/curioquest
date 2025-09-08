import fs from "node:fs/promises"; import path from "node:path";
export async function logAI(event: any){
  try{
    const dir = path.join(process.cwd(), ".ai_logs");
    await fs.mkdir(dir, { recursive: true });
    const f = path.join(dir, `${new Date().toISOString().slice(0,10)}.ndjson`);
    await fs.appendFile(f, JSON.stringify({ t:new Date().toISOString(), ...event })+"\n", "utf8");
  }catch{}
}
