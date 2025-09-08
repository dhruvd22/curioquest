import OpenAI from "openai";
import { logAI } from "./logging";
export const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function sleep(ms:number){ return new Promise(r=>setTimeout(r,ms)); }
export async function withBackoff<T>(fn:()=>Promise<T>, retries=5) {
  let delay=400; for(let i=0;i<retries;i++){
    try { return await fn(); } catch(e:any){
      const code = e?.status || e?.code || 0;
      if (![429,500,502,503,504].includes(code) || i===retries-1) throw e;
      await sleep(delay + Math.random()*200); delay*=1.8;
    }
  } throw new Error("backoff failed");
}

export async function callResponse(args:{
  instructions: string;
  input: string | Array<{role:"user"|"system"|"assistant"; content:string}>;
  temperature?: number;
}){
  const start=Date.now();
  const temperature = args.temperature ?? 0.9;
  const inputChars = args.instructions.length + (typeof args.input === 'string' ? args.input.length : args.input.reduce((n,m)=>n+m.content.length,0));
  const res = await withBackoff(()=> client.responses.create({
    model: 'gpt-4o-mini',
    instructions: args.instructions,
    input: typeof args.input === 'string'? [{role:'user', content: args.input}]: args.input,
    temperature
  }));
  const text = (res as any).output_text ?? '';
  await logAI({ model:'gpt-4o-mini', temperature, input: inputChars, output: text.length, ms: Date.now()-start });
  return { text, raw: res, ms: Date.now()-start };
}
