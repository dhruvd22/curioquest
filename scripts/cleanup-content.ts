import fs from 'node:fs/promises';
import path from 'node:path';

const STORIES_DIR = path.join(process.cwd(), 'content', 'stories');
const ASSETS_DIR = path.join(process.cwd(), 'public', 'assets');

async function rmDir(dir: string) {
  await fs.rm(dir, { recursive: true, force: true });
}

async function cleanup() {
  let stories: string[] = [];
  try {
    stories = await fs.readdir(STORIES_DIR);
  } catch {
    // no stories directory; continue with empty list
  }
  const storySlugs = new Set(
    stories
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace(/\.json$/, ''))
  );

  // remove empty story files and their assets
  for (const slug of Array.from(storySlugs)) {
    const storyPath = path.join(STORIES_DIR, `${slug}.json`);
    const stat = await fs.stat(storyPath);
    if (stat.size === 0) {
      await fs.rm(storyPath, { force: true });
      await rmDir(path.join(ASSETS_DIR, slug));
      storySlugs.delete(slug);
    }
  }

  let assetDirs: string[] = [];
  try {
    assetDirs = await fs.readdir(ASSETS_DIR);
  } catch {
    return;
  }

  for (const dir of assetDirs) {
    const assetPath = path.join(ASSETS_DIR, dir);
    const stat = await fs.stat(assetPath);
    if (!stat.isDirectory()) continue;
    if (!storySlugs.has(dir)) {
      await rmDir(assetPath);
      continue;
    }
    // ensure directory isn't empty; zero-byte placeholders are kept
  }
}

cleanup().catch((e) => {
  console.error('cleanup failed', e);
  process.exit(1);
});
