import fs from 'node:fs/promises';
import path from 'node:path';
import { Agent, PackagerInput, PackagerOutput } from './_types';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'stories');
const TOPICS_FILE = path.join(process.cwd(), 'content', 'topics.json');

export const PackagerAgent: Agent<PackagerInput, PackagerOutput> = {
  name: 'Packager',
  async run({ slug, topic, draft, sources, images }) {
    const story = {
      slug,
      title: draft.title,
      ageBand: '10-13',
      readingLevel: 'grade-6',
      estReadMin: 6,
      heroImage: images.hero,
      supportImages: images.supports,
      sources,
      phases: draft.phases,
      badges: [],
      crossLinks: [],
    };

    const storyPath = path.join(CONTENT_DIR, `${slug}.json`);
    await fs.mkdir(path.dirname(storyPath), { recursive: true });
    await fs.writeFile(storyPath, JSON.stringify(story, null, 2), 'utf8');

    const topicsArr = JSON.parse(await fs.readFile(TOPICS_FILE, 'utf8'));
    if (!topicsArr.find((t: any) => t.slug === slug)) {
      topicsArr.push({ slug, title: topic, thumbnail: images.hero.file, badges: [] });
      await fs.writeFile(TOPICS_FILE, JSON.stringify(topicsArr, null, 2), 'utf8');
    }

    const assetDir = path.join(process.cwd(), 'public', 'assets', slug);
    await fs.mkdir(assetDir, { recursive: true });
    const ensure = async (file: string) => {
      const p = path.join(assetDir, file);
      try {
        await fs.access(p);
      } catch {
        await fs.writeFile(p, '');
      }
    };
    await ensure(path.basename(images.hero.file));
    for (const s of images.supports) {
      await ensure(path.basename(s.file));
    }

    await fs.mkdir(`/tmp/${slug}`, { recursive: true });
    await fs.writeFile(`/tmp/${slug}/packager.json`, JSON.stringify({ storyPath }, null, 2), 'utf8');

    return { path: storyPath };
  },
};
