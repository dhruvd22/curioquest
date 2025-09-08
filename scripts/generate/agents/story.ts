import fs from 'node:fs/promises';
import { callResponse } from '../../../lib/ai/openai';
import { SYSTEM_STORY } from '../../../lib/ai/prompt-templates';
import { Agent, StoryInput, StoryDraft } from './_types';

const TEMPS = [0.8, 0.95, 1.1];

function normalizeFactGems(draft: StoryDraft, fallback: StoryInput['factGems']) {
  for (const phase of draft.phases) {
    if (phase.type === 'fact-gems') {
      phase.items = phase.items.map((it: any, idx: number) => {
        const text = it.text || it.claim || fallback[idx]?.text || '';
        return { sourceId: it.sourceId || fallback[idx]?.sourceId || `s${idx + 1}`, text };
      });
    }
  }
}

function makeFallbackDraft(topic: string, factGems: StoryInput['factGems']): StoryDraft {
  return {
    title: `${topic} Basics`,
    phases: [
      {
        type: 'hook',
        heading: `Exploring ${topic}`,
        body: `Let's learn about ${topic}. This topic touches our everyday lives in ways we might not notice. From the moment we wake up until we go to sleep, ${topic} play a role in our world.`,
      },
      {
        type: 'orientation',
        heading: `What are ${topic}?`,
        body: `${topic} in a nutshell. Understanding the basics of ${topic} helps us appreciate how they work and why they matter. With a little curiosity, we can uncover stories hidden in history, science, and art about ${topic}.`,
      },
      {
        type: 'discovery',
        heading: `Digging into ${topic}`,
        body: `More about ${topic}. Imagine walking through a museum, visiting a lab, or exploring outdoors—each place offers clues about ${topic}. The more we investigate, the more connections we find to technology, culture, and the natural world.`,
      },
      {
        type: 'wow-panel',
        heading: `A wow moment`,
        body: `${topic} can be surprising! Sometimes a single fact can change how we think about the entire subject, showing just how remarkable ${topic} truly are.`,
      },
      { type: 'fact-gems', items: factGems.slice(0, 3) },
      {
        type: 'mini-quiz',
        items: [
          { q: `Where do ${topic} travel?`, choices: ['Space', 'Sea'], answer: 0 },
          { q: `Are ${topic} fast?`, choices: ['Yes', 'No'], answer: 0 },
          { q: `Would you like to explore ${topic}?`, choices: ['Absolutely', 'Maybe later'], answer: 0 },
        ],
      },
      {
        type: 'imagine',
        prompt: `Imagine using ${topic} for adventure. Picture yourself sharing amazing facts with friends or building a project inspired by ${topic}.`,
      },
      {
        type: 'wrap',
        keyTakeaways: [
          `${topic} are fascinating`,
          `Learning about ${topic} is fun`,
          `There is always more to discover about ${topic}`,
        ],
      },
    ],
  };
}

export const StoryAgent: Agent<StoryInput, StoryDraft[]> = {
  name: 'Story',
  async run({ slug, topic, phases, factGems, sources }) {
    await fs.mkdir(`/tmp/${slug}`, { recursive: true });
    if (!process.env.OPENAI_API_KEY) {
      const base = makeFallbackDraft(topic, factGems);
      const drafts = [base, base, base];
      for (let i = 0; i < drafts.length; i++) {
        await fs.writeFile(`/tmp/${slug}/draft-${i + 1}.json`, JSON.stringify(drafts[i], null, 2), 'utf8');
      }
      return drafts;
    }

    const drafts: StoryDraft[] = [];
    for (let i = 0; i < TEMPS.length; i++) {
      const input = `Topic: ${topic}\nTone tags: playful, adventurous, science-forward\nFacts (with sourceIds): ${JSON.stringify(
        factGems,
        null,
        2
      )}\nOutline (phases): ${JSON.stringify(
        phases,
        null,
        2
      )}\nSources (JSON): ${JSON.stringify(
        sources,
        null,
        2
      )}\nWrite a 900–1100 word, phase-segmented story. Make the hook irresistible; in discovery scenes, show concrete sensory details.\nThe WOW panel must present one striking comparison grounded in the facts (no exaggeration).\nInclude exactly 3 "Did you know?" fact-gems (using provided sourceIds), and 2–3 mini-quiz MCQs with unambiguous answers.\nKeep it PG, inclusive, and grade ~6 reading level. Shorten paragraphs near the end. End with a single-sentence "imagine" prompt.`;
      const { text } = await callResponse({ instructions: SYSTEM_STORY, input, temperature: TEMPS[i] });
      try {
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start === -1 || end === -1) throw new Error('Missing JSON object');
        const jsonText = text.slice(start, end + 1);
        const draft = JSON.parse(jsonText);
        normalizeFactGems(draft, factGems);
        drafts.push(draft);
        await fs.writeFile(`/tmp/${slug}/draft-${i + 1}.json`, JSON.stringify(draft, null, 2), 'utf8');
      } catch (err) {
        const fallback = makeFallbackDraft(topic, factGems);
        normalizeFactGems(fallback, factGems);
        drafts.push(fallback);
        await fs.writeFile(`/tmp/${slug}/draft-${i + 1}.json`, JSON.stringify(fallback, null, 2), 'utf8');
      }
    }
    return drafts;
  },
};
