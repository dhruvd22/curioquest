import fs from 'node:fs/promises';
import { Agent, SafetyInput, SafetyOutput } from './_types';

export const SafetyAgent: Agent<SafetyInput, SafetyOutput> = {
  name: 'Safety',
  async run({ slug }) {
    const output: SafetyOutput = { ok: true };
    await fs.mkdir(`/tmp/${slug}`, { recursive: true });
    await fs.writeFile(`/tmp/${slug}/safety.json`, JSON.stringify(output, null, 2), 'utf8');
    return output;
  },
};
