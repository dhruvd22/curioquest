import fs from 'node:fs/promises';
import { Agent, CuratorInput, CuratorOutput } from './_types';

export const CuratorAgent: Agent<CuratorInput, CuratorOutput> = {
  name: 'Curator',
  async run({ topic, slug }) {
    const output: CuratorOutput = {
      slug,
      subAngles: ['history', 'science', 'surprise'],
      toneTags: ['playful', 'curious'],
      readingLevelTarget: 'grade-6',
    };
    await fs.mkdir(`/tmp/${slug}`, { recursive: true });
    await fs.writeFile(`/tmp/${slug}/curator.json`, JSON.stringify(output, null, 2), 'utf8');
    return output;
  },
};
