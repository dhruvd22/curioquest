import fs from 'node:fs/promises';
import { Agent, JudgeInput, JudgeOutput } from './_types';

export const JudgeAgent: Agent<JudgeInput, JudgeOutput> = {
  name: 'Judge',
  async run({ slug, drafts }) {
    const output: JudgeOutput = { chosenIndex: 0, scores: drafts.map(() => 1) };
    await fs.mkdir(`/tmp/${slug}`, { recursive: true });
    await fs.writeFile(`/tmp/${slug}/judge.json`, JSON.stringify(output, null, 2), 'utf8');
    return output;
  },
};
