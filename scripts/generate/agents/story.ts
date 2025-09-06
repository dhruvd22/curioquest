import fs from 'node:fs/promises';
import { callResponse } from '../../../lib/ai/openai';
import { SYSTEM_STORY } from '../../../lib/ai/prompt-templates';
import { Agent, StoryInput, StoryDraft } from './_types';

const TEMPS = [0.8, 0.95, 1.1];

export const StoryAgent: Agent<StoryInput, StoryDraft[]> = {
  name: 'Story',
  async run({ slug, topic, phases, factGems, sources }) {
    const drafts: StoryDraft[] = [];
    await fs.mkdir(`/tmp/${slug}`, { recursive: true });
    for (let i = 0; i < TEMPS.length; i++) {
      const input = `Topic: ${topic}\nOutline (JSON): ${JSON.stringify(
        { phases, factGems },
        null,
        2
      )}\nSources (JSON): ${JSON.stringify(
        sources,
        null,
        2
      )}\nWrite a story JSON following schemas/story.ts. Use exactly these fact-gems and include 2-3 quiz items with clear answers.`;
      const { text } = await callResponse({ instructions: SYSTEM_STORY, input, temperature: TEMPS[i] });
      const jsonText = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
      const draft = JSON.parse(jsonText);
      drafts.push(draft);
      await fs.writeFile(`/tmp/${slug}/draft-${i + 1}.json`, JSON.stringify(draft, null, 2), 'utf8');
    }
    return drafts;
  },
};
