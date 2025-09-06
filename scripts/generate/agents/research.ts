import fs from 'node:fs/promises';
import { Agent, ResearchInput, ResearchOutput } from './_types';

export const ResearchAgent: Agent<ResearchInput, ResearchOutput> = {
  name: 'Research',
  async run({ slug }) {
    const sources = [{ id: 's1', name: 'StubSource', url: 'https://example.com' }];
    const facts = [
      {
        claim: `Fact about ${slug} 1`,
        sourceId: 's1',
        sourceName: 'StubSource',
        url: 'https://example.com',
      },
    ];
    const output: ResearchOutput = { facts, sources };
    await fs.mkdir(`/tmp/${slug}`, { recursive: true });
    await fs.writeFile(`/tmp/${slug}/research.json`, JSON.stringify(output, null, 2), 'utf8');
    return output;
  },
};
