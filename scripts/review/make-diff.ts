import fs from 'node:fs/promises';
import path from 'node:path';

const REVIEW_INCOMING = path.join(process.cwd(), 'review', 'incoming');
const REVIEW_DIFFS = path.join(process.cwd(), 'review', 'diffs');
const CONTENT_STORIES = path.join(process.cwd(), 'content', 'stories');

async function exists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function extractFactTexts(story: any): string[] {
  return (
    story.phases.find((p: any) => p.type === 'fact-gems')?.items?.map((i: any) => i.text) || []
  );
}

function extractQuiz(story: any) {
  return story.phases.find((p: any) => p.type === 'mini-quiz')?.items || [];
}

async function diffStory(slug: string) {
  const incomingPath = path.join(REVIEW_INCOMING, slug, 'story.json');
  if (!(await exists(incomingPath))) return;
  const newStory = JSON.parse(await fs.readFile(incomingPath, 'utf8'));

  const oldPath = path.join(CONTENT_STORIES, `${slug}.json`);
  const lines: string[] = [`# Diff for ${slug}`];

  if (await exists(oldPath)) {
    const oldStory = JSON.parse(await fs.readFile(oldPath, 'utf8'));

    if (oldStory.title !== newStory.title) {
      lines.push('', '## Title', `- "${oldStory.title}" → "${newStory.title}"`);
    }

    const phaseDiff: string[] = [];
    const maxLen = Math.max(oldStory.phases.length, newStory.phases.length);
    for (let i = 0; i < maxLen; i++) {
      const o = oldStory.phases[i];
      const n = newStory.phases[i];
      if (!o && n) phaseDiff.push(`- Added ${n.type}: ${n.heading || ''}`);
      else if (o && !n) phaseDiff.push(`- Removed ${o.type}: ${o.heading || ''}`);
      else if (o.type !== n.type || o.heading !== n.heading)
        phaseDiff.push(`- ${o.type} → ${n.type}: "${o.heading || ''}" → "${n.heading || ''}"`);
    }
    if (phaseDiff.length) lines.push('', '## Phases', ...phaseDiff);

    const oldFacts = extractFactTexts(oldStory);
    const newFacts = extractFactTexts(newStory);
    const factDiff: string[] = [];
    for (const f of newFacts) if (!oldFacts.includes(f)) factDiff.push(`- Added: ${f}`);
    for (const f of oldFacts) if (!newFacts.includes(f)) factDiff.push(`- Removed: ${f}`);
    if (factDiff.length) lines.push('', '## Fact Gems', ...factDiff);

    const oldQuiz = extractQuiz(oldStory);
    const newQuiz = extractQuiz(newStory);
    const quizDiff: string[] = [];
    const qLen = Math.max(oldQuiz.length, newQuiz.length);
    for (let i = 0; i < qLen; i++) {
      const oq = oldQuiz[i];
      const nq = newQuiz[i];
      if (!oq && nq) quizDiff.push(`- Added Q${i + 1}: ${nq.q}`);
      else if (oq && !nq) quizDiff.push(`- Removed Q${i + 1}: ${oq.q}`);
      else if (oq.q !== nq.q) quizDiff.push(`- Q${i + 1}: "${oq.q}" → "${nq.q}"`);
    }
    if (quizDiff.length) lines.push('', '## Quiz', ...quizDiff);
  } else {
    lines.push('', '- New story');
  }

  await fs.mkdir(REVIEW_DIFFS, { recursive: true });
  await fs.writeFile(path.join(REVIEW_DIFFS, `${slug}.md`), lines.join('\n'), 'utf8');
}

async function main() {
  const args = process.argv.slice(2);
  let slugs: string[] = [];
  if (args.includes('--all')) {
    slugs = await fs.readdir(REVIEW_INCOMING);
  } else {
    const idx = args.indexOf('--slug');
    if (idx >= 0 && args[idx + 1]) slugs = [args[idx + 1]];
  }
  for (const slug of slugs) await diffStory(slug);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
