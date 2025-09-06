import { logCall } from "./logging";

let client: any = null;
try {
  if (process.env.OPENAI_API_KEY) {
    const mod = await import('openai');
    const OpenAI = mod.default;
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch {
  client = null;
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
async function withBackoff<T>(fn: () => Promise<T>, max=5) {
  let delay = 400;
  for (let i=0;i<max;i++){
    try { return await fn(); }
    catch (e:any) {
      const code = e?.status || e?.code || 0;
      if (![429,500,502,503,504].includes(code) || i===max-1) throw e;
      await sleep(delay + Math.random()*200);
      delay *= 1.8;
    }
  }
  // unreachable
  throw new Error("Backoff failed");
}

export async function callResponse(args: {
  instructions: string;
  input: string | Array<{role:"user"|"system"|"assistant"; content:string}>;
  temperature?: number;
}) {
  const start = Date.now();
  const temperature = args.temperature ?? 0.9;
  const inputChars = args.instructions.length + (typeof args.input === "string" ? args.input.length : args.input.reduce((n,m)=>n+m.content.length,0));
  if (!client) {
    return { text: '', ms: 0, raw: null };
  }
  const res = await withBackoff(() => client.responses.create({
    model: "gpt-4o-mini",
    instructions: args.instructions,
    input: typeof args.input === "string" ? [{role:"user", content: args.input}] : args.input,
    temperature
  }));
  const text = (res as any).output_text ?? "";
  const ms = Date.now() - start;
  await logCall({ model: "gpt-4o-mini", temperature, input: inputChars, output: text.length, ms });
  return { text, ms, raw: res };
}
