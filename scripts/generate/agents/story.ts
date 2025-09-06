import fs from 'node:fs/promises';
import { callResponse } from '../../../lib/ai/openai';
import { SYSTEM_STORY } from '../../../lib/ai/prompt-templates';
import { Agent, StoryInput, StoryDraft } from './_types';

const TEMPS = [0.8, 0.95, 1.1];

export const StoryAgent: Agent<StoryInput, StoryDraft[]> = {
  name: 'Story',
  async run({ slug, topic, phases, factGems, sources }) {
    await fs.mkdir(`/tmp/${slug}`, { recursive: true });
    if (!process.env.OPENAI_API_KEY) {
      const base: StoryDraft = {
        title: `${topic} Basics`,
        phases: [
          { type: 'hook', heading: `Exploring ${topic}`, body: `Let's learn about ${topic}.` },
          { type: 'orientation', heading: `What are ${topic}?`, body: `${topic} in a nutshell.` },
          { type: 'discovery', heading: `Digging into ${topic}`, body: `More about ${topic}.` },
          { type: 'wow-panel', heading: `A wow moment`, body: `${topic} can be surprising!` },
          { type: 'fact-gems', items: factGems.slice(0, 3) },
          {
            type: 'mini-quiz',
            items: [
              { q: `Where do ${topic} travel?`, choices: ['Space', 'Sea'], answer: 0 },
              { q: `Are ${topic} fast?`, choices: ['Yes', 'No'], answer: 0 },
            ],
          },
          { type: 'imagine', prompt: `Imagine using ${topic} for adventure.` },
          {
            type: 'wrap',
            keyTakeaways: [`${topic} are fascinating`, `Learning about ${topic} is fun`],
          },
        ],
      };
      const drafts = [base, base, base];
      for (let i = 0; i < drafts.length; i++) {
        await fs.writeFile(`/tmp/${slug}/draft-${i + 1}.json`, JSON.stringify(drafts[i], null, 2), 'utf8');
      }
      return drafts;
    }

    const drafts: StoryDraft[] = [];
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
