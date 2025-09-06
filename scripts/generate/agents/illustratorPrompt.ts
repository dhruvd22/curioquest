import fs from 'node:fs/promises';
import { Agent, IllustratorPromptInput, IllustratorPromptOutput } from './_types';

export const IllustratorPromptAgent: Agent<IllustratorPromptInput, IllustratorPromptOutput> = {
  name: 'IllustratorPrompt',
  async run({ slug, story }) {
    const output: IllustratorPromptOutput = {
      prompt: `Illustrate: ${story.title}`,
    };
    await fs.mkdir(`/tmp/${slug}`, { recursive: true });
    await fs.writeFile(`/tmp/${slug}/illustratorPrompt.json`, JSON.stringify(output, null, 2), 'utf8');
    return output;
  },
};
