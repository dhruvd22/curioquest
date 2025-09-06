import path from 'node:path';
import { readJSON, exists } from '../lib/utils/io';
import { TopicsSchema } from '../schemas/topics';
import { StorySchema } from '../schemas/story';
import { STORIES_DIR, PUBLIC_DIR, TOPICS_FILE } from '../lib/paths';
import { log, error } from '../lib/utils/logger';

async function main() {
  let ok = true;
  const topics = await readJSON<any>(TOPICS_FILE);
  const parsedTopics = TopicsSchema.safeParse(topics);
  if (!parsedTopics.success) {
    error(parsedTopics.error.format());
    process.exit(1);
  }
  for (const t of parsedTopics.data) {
    const storyPath = path.join(STORIES_DIR, `${t.slug}.json`);
    if (!(await exists(storyPath))) {
      error('Missing story:', storyPath);
      ok = false;
      continue;
    }
    const story = await readJSON<any>(storyPath);
    const parsedStory = StorySchema.safeParse(story);
    if (!parsedStory.success) {
      error('Invalid story:', t.slug, parsedStory.error.format());
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
  if (!ok) {
    error('Validation failed ❌');
    process.exit(1);
  }
  log('Validation OK ✅');
}

main();
