import fs from 'node:fs/promises';
import { callResponse } from '../../../lib/ai/openai';
import { SYSTEM_ART } from '../../../lib/ai/prompt-templates';
import { Agent, IllustratorPromptInput, IllustratorPromptOutput } from './_types';

export const IllustratorPromptAgent: Agent<IllustratorPromptInput, IllustratorPromptOutput> = {
  name: 'IllustratorPrompt',
  async run({ slug, story }) {
    let output: IllustratorPromptOutput;
    if (!process.env.OPENAI_API_KEY) {
      output = {
        hero: { prompt: `Illustrate: ${story.title}`, alt: `${story.title} hero`, license: 'stock' },
        supports: [],
      };
    } else {
      const prompt = `Story title: ${story.title}\nStory JSON: ${JSON.stringify(story, null, 2)}`;
      const { text } = await callResponse({ instructions: SYSTEM_ART, input: prompt, temperature: 0.6 });
      const jsonText = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
      const parsed = JSON.parse(jsonText);
      output = { hero: parsed.hero, supports: parsed.supports || [] };
    }
    await fs.mkdir(`/tmp/${slug}`, { recursive: true });
    await fs.writeFile(`/tmp/${slug}/illustratorPrompt.json`, JSON.stringify(output, null, 2), 'utf8');
    return output;
  },
};
