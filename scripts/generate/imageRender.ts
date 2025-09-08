import fs from 'node:fs/promises';
import sharp from 'sharp';

let client: any = null;
async function loadClient() {
  if (client || !process.env.OPENAI_API_KEY) return client;
  try {
    const mod = await import('openai');
    const OpenAI = mod.default;
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch {
    client = null;
  }
  return client;
}

export async function saveBase64Webp(b64: string, outFile: string) {
  const buf = Buffer.from(b64, 'base64');
  await sharp(buf).webp({ quality: 82 }).toFile(outFile);
}

export async function renderImage(prompt: string, outFile: string, force = false) {
  const cli = await loadClient();
  if (!cli) return false;
  if (!force) {
    try {
      await fs.access(outFile);
      return true;
    } catch {}
  }
  const res = await cli.images.generate({ model: 'gpt-image-1', prompt, size: '1024x1024' });
  const b64 = res?.data?.[0]?.b64_json;
  if (!b64) return false;
  await saveBase64Webp(b64, outFile);
  return true;
}
