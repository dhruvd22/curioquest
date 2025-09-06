import fs from 'node:fs/promises';
import { callResponse } from '../../../lib/ai/openai';
import { SYSTEM_STORY } from '../../../lib/ai/prompt-templates';
import { Agent, OutlineInput, OutlineOutput } from './_types';

export const OutlineAgent: Agent<OutlineInput, OutlineOutput> = {
  name: 'Outline',
  async run({ slug, topic, facts, sources }) {
    if (!process.env.OPENAI_API_KEY) {
      const factGems = facts.slice(0, 3).map((f) => ({ sourceId: f.sourceId, text: f.claim }));
      const output: OutlineOutput = { phases: [], factGems, sources };
      await fs.mkdir(`/tmp/${slug}`, { recursive: true });
      await fs.writeFile(`/tmp/${slug}/outline.json`, JSON.stringify(output, null, 2), 'utf8');
      return output;
    }

    const prompt = `Topic: ${topic}\nFacts (JSON): ${JSON.stringify(
      facts,
      null,
      2
    )}\nSources (JSON): ${JSON.stringify(
      sources,
      null,
      2
    )}\nDraft a phase plan with headings and bullet notes; map 3 fact-gems to valid sourceIds. Return JSON { phases: [...], factGems: [...] }.`;
    const { text } = await callResponse({ instructions: SYSTEM_STORY, input: prompt, temperature: 0.4 });
    const jsonText = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const parsed = JSON.parse(jsonText);
    const output: OutlineOutput = { phases: parsed.phases, factGems: parsed.factGems, sources };
    await fs.mkdir(`/tmp/${slug}`, { recursive: true });
    await fs.writeFile(`/tmp/${slug}/outline.json`, JSON.stringify(output, null, 2), 'utf8');
    return output;
  },
};
