import path from 'node:path';
import fs from 'node:fs/promises';
import { readJSON, exists } from '../lib/utils/io';
import { TopicsSchema } from '../schemas/topics';
import { StorySchema } from '../schemas/story';
import { STORIES_DIR, PUBLIC_DIR, TOPICS_FILE } from '../lib/paths';
import { log, error } from '../lib/utils/logger';

async function main() {
  const strict = process.argv.includes('--strict');
  let ok = true;
  const topics = await readJSON<any>(TOPICS_FILE);
  const parsedTopics = TopicsSchema.safeParse(topics);
  if (!parsedTopics.success) {
    error(parsedTopics.error.format());
    process.exit(1);
  }
  const storySlugs = new Set<string>();
  for (const t of parsedTopics.data) {
    storySlugs.add(t.slug);
    const storyPath = path.join(STORIES_DIR, `${t.slug}.json`);
    if (!(await exists(storyPath))) {
      error('Missing story:', storyPath);
      ok = false;
      continue;
    }
    const story = await readJSON<any>(storyPath);
    const parsedStory = StorySchema.safeParse(story);
    if (!parsedStory.success) {
      error('Invalid story:', t.slug);
      for (const issue of parsedStory.error.issues) {
        error(`  ${issue.path.join('.')}: ${issue.message}`);
      }
      ok = false;
      continue;
    }
    const hero = parsedStory.data.heroImage;
    if (hero) {
      const img = path.join(PUBLIC_DIR, hero.file.replace(/^\//, ''));
      if (!(await exists(img))) {
        error('Missing hero image file:', img);
        ok = false;
      }
    }
    for (const imgRef of parsedStory.data.supportImages) {
      const img = path.join(PUBLIC_DIR, imgRef.file.replace(/^\//, ''));
      if (!(await exists(img))) {
        error('Missing support image file:', img);
        ok = false;
      }
    }
  }
  const assetRoot = path.join(PUBLIC_DIR, 'assets');
  let assetSlugs: string[] = [];
  try {
    assetSlugs = await fs.readdir(assetRoot);
  } catch {}
  for (const slug of assetSlugs) {
    if (!storySlugs.has(slug)) {
      const msg = `Orphan asset folder: ${slug}`;
      if (strict) { error(msg); ok = false; } else { log(msg); }
    }
  }
  for (const slug of Array.from(storySlugs)) {
    if (!assetSlugs.includes(slug)) {
      const msg = `Missing asset folder for story: ${slug}`;
      if (strict) { error(msg); ok = false; } else { log(msg); }
    }
  }
  if (!ok) {
    error('Validation failed ❌');
    process.exit(1);
  }
  log('Validation OK ✅');
}

main();
