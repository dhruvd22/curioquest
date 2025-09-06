import fs from 'node:fs/promises';
import path from 'node:path';
import { Agent, PackagerInput, PackagerOutput } from './_types';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'stories');
const TOPICS_FILE = path.join(process.cwd(), 'content', 'topics.json');

export const PackagerAgent: Agent<PackagerInput, PackagerOutput> = {
  name: 'Packager',
  async run({ slug, topic, draft }) {
    const story = {
      slug,
      title: draft.title,
      ageBand: '10-13',
      readingLevel: 'grade-6',
      estReadMin: 6,
      heroImage: { file: `/assets/${slug}/hero.webp`, alt: `${topic} hero` },
      supportImages: [],
      sources: [{ id: 's1', name: 'StubSource', url: 'https://example.com' }],
      phases: draft.phases,
      badges: [],
      crossLinks: [],
    };

    const storyPath = path.join(CONTENT_DIR, `${slug}.json`);
    await fs.mkdir(path.dirname(storyPath), { recursive: true });
    await fs.writeFile(storyPath, JSON.stringify(story, null, 2), 'utf8');

    const topicsArr = JSON.parse(await fs.readFile(TOPICS_FILE, 'utf8'));
    if (!topicsArr.find((t: any) => t.slug === slug)) {
      topicsArr.push({ slug, title: topic, thumbnail: `/assets/${slug}/hero.webp`, badges: [] });
      await fs.writeFile(TOPICS_FILE, JSON.stringify(topicsArr, null, 2), 'utf8');
    }

    const assetDir = path.join(process.cwd(), 'public', 'assets', slug);
    await fs.mkdir(assetDir, { recursive: true });
    const heroPath = path.join(assetDir, 'hero.webp');
    try {
      await fs.access(heroPath);
    } catch {
      await fs.writeFile(heroPath, '');
    }

    await fs.mkdir(`/tmp/${slug}`, { recursive: true });
    await fs.writeFile(`/tmp/${slug}/packager.json`, JSON.stringify({ storyPath }, null, 2), 'utf8');

    return { path: storyPath };
  },
};
