import sharp from "sharp"; import fs from "node:fs/promises"; import path from "node:path";
export async function saveBase64Webp(b64: string, outFile: string) {
  const buf = Buffer.from(b64, "base64");
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await sharp(buf).webp({ quality: 82 }).toFile(outFile);
}
