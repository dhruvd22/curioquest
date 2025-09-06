import fs from 'node:fs/promises';
import { Agent, ResearchInput, ResearchOutput } from './_types';

async function fetchWikiSummary(title: string) {
  try {
    let res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (res.status === 404) {
      const search = await fetch(
        `https://en.wikipedia.org/w/rest.php/v1/search/title?q=${encodeURIComponent(title)}&limit=1`
      );
      const sjson: any = await search.json().catch(() => null);
      const resolved = sjson?.pages?.[0]?.title;
      if (resolved) {
        res = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(resolved)}`
        );
      }
    }
    if (!res.ok) return null;
    const json: any = await res.json().catch(() => null);
    if (!json) return null;
    return {
      title: json.title as string,
      extract: json.extract as string,
      url: json.content_urls?.desktop?.page || json.content_urls?.mobile?.page || '',
    };
  } catch {
    return null;
  }
}

function takeSentences(text: string) {
  return text.match(/[^\.\!?]+[\.\!?]/g) || [];
}

function trimWords(text: string, max: number) {
  const words = text.split(/\s+/).slice(0, max);
  return words.join(' ').trim();
}

export const ResearchAgent: Agent<ResearchInput, ResearchOutput> = {
  name: 'Research',
  async run({ slug, topic, subAngles = [] }) {
    const sources: { id: string; name: string; url: string }[] = [];
    const facts: ResearchOutput['facts'] = [];
    let srcCounter = 1;

    async function addTopic(t: string) {
      if (facts.length >= 5) return;
      const summary = await fetchWikiSummary(t);
      if (!summary) return;
      const sourceId = `s${srcCounter++}`;
      sources.push({ id: sourceId, name: `Wikipedia: ${summary.title}`, url: summary.url });
      const sentences = takeSentences(summary.extract);
      for (const sentence of sentences) {
        if (facts.length >= 5) break;
        const quote = trimWords(sentence, 40);
        if (!quote) continue;
        facts.push({
          claim: quote,
          quote,
          url: summary.url,
          sourceId,
          sourceName: 'Wikipedia',
        });
      }
    }

    try {
      await addTopic(topic);
      for (const angle of subAngles) {
        await addTopic(`${topic} ${angle}`);
      }

      // Optional NASA image
      try {
        if (facts.length < 5) {
          const nasa = await fetch(
            `https://images-api.nasa.gov/search?q=${encodeURIComponent(topic)}&media_type=image`
          );
          const nj: any = await nasa.json();
          const item = nj?.collection?.items?.[0];
          const data = item?.data?.[0];
          if (data) {
            const sourceId = `s${srcCounter++}`;
            const url = `https://images.nasa.gov/details-${data.nasa_id}`;
            sources.push({ id: sourceId, name: 'NASA Image', url });
            const desc = trimWords(data.description || data.title || '', 40);
            if (desc) {
              facts.push({
                claim: data.title || desc,
                quote: desc,
                url,
                sourceId,
                sourceName: 'NASA',
              });
            }
          }
        }
      } catch {
        /* ignore optional NASA */
      }
    } catch {
      /* ignore network errors */
    }

    if (facts.length === 0) {
      const sourceId = `s${srcCounter++}`;
      sources.push({ id: sourceId, name: 'StubSource', url: 'https://example.com' });
      for (let i = 0; i < 3; i++) {
        facts.push({
          claim: `${topic} fact ${i + 1}`,
          quote: `${topic} fact ${i + 1}`,
          url: 'https://example.com',
          sourceId,
          sourceName: 'Stub',
        });
      }
    }

    if (facts.length > 5) facts.length = 5;

    const output: ResearchOutput = { facts, sources };
    await fs.mkdir(`/tmp/${slug}`, { recursive: true });
    await fs.writeFile(`/tmp/${slug}/research.json`, JSON.stringify(output, null, 2), 'utf8');
    return output;
  },
};
