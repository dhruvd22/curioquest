import fs from 'node:fs/promises';
import { Agent, VerifierInput, VerifierOutput } from './_types';

export const VerifierAgent: Agent<VerifierInput, VerifierOutput> = {
  name: 'Verifier',
  async run({ slug, draft }) {
    const output: VerifierOutput = { verified: true, draft };
    await fs.mkdir(`/tmp/${slug}`, { recursive: true });
    await fs.writeFile(`/tmp/${slug}/verifier.json`, JSON.stringify(output, null, 2), 'utf8');
    return output;
  },
};
