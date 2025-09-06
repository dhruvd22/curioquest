import fs from 'node:fs/promises';
import { Agent, OutlineInput, OutlineOutput } from './_types';

export const OutlineAgent: Agent<OutlineInput, OutlineOutput> = {
  name: 'Outline',
  async run({ slug, facts, sources }) {
    const phases = facts.map((f, i) => ({ step: i, text: f.claim }));
    const output: OutlineOutput = { phases, sources };
    await fs.mkdir(`/tmp/${slug}`, { recursive: true });
    await fs.writeFile(`/tmp/${slug}/outline.json`, JSON.stringify(output, null, 2), 'utf8');
    return output;
  },
};
