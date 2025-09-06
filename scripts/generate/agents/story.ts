import fs from 'node:fs/promises';
import { Agent, StoryInput, StoryDraft } from './_types';

export const StoryAgent: Agent<StoryInput, StoryDraft> = {
  name: 'Story',
  async run({ slug, topic }) {
    const draft: StoryDraft = {
      title: `${topic}: A Kid's Guide`,
      phases: [
        { type: 'hook', heading: `What if ${topic} could talk?`, body: '...' },
        { type: 'orientation', heading: 'Where we begin', body: '...' },
        { type: 'discovery', heading: 'Discoveries', body: '...' },
        { type: 'wow-panel', heading: 'Big wow', body: '...' },
        {
          type: 'fact-gems',
          items: [
            { sourceId: 's1', text: 'Short fact 1.' },
            { sourceId: 's1', text: 'Short fact 2.' },
            { sourceId: 's1', text: 'Short fact 3.' },
          ],
        },
        {
          type: 'mini-quiz',
          items: [
            { q: 'Pick one', choices: ['A', 'B'], answer: 0 },
            { q: 'Pick two', choices: ['C', 'D'], answer: 1 },
          ],
        },
        { type: 'imagine', prompt: 'Imagine...' },
        { type: 'wrap', keyTakeaways: ['A', 'B'] },
      ],
    };
    await fs.mkdir(`/tmp/${slug}`, { recursive: true });
    await fs.writeFile(`/tmp/${slug}/story.json`, JSON.stringify(draft, null, 2), 'utf8');
    return draft;
  },
};
