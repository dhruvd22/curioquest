import fs from 'node:fs/promises';
import path from 'node:path';
import { CuratorAgent } from './agents/curator';
import { ResearchAgent } from './agents/research';
import { OutlineAgent } from './agents/outline';
import { StoryAgent } from './agents/story';
import { SafetyAgent } from './agents/safety';
import { VerifierAgent } from './agents/verifier';
import { JudgeAgent } from './agents/judge';
import { PackagerAgent } from './agents/packager';
import { IllustratorPromptAgent } from './agents/illustratorPrompt';
import { renderImage } from './imageRender'; // optional image rendering helper

const CONTENT = path.join(process.cwd(), 'content', 'stories');

function log(...msg: any[]) {
  console.log(new Date().toISOString(), ...msg);
}

type ImageMode = 'render' | 'stock' | 'skip';

async function runTopic(topic: string, force: boolean, imageMode: ImageMode) {
  const curator = await CuratorAgent.run({ topic });
  const { slug } = curator;
  const finalPath = path.join(CONTENT, `${slug}.json`);
  if (!force) {
    try {
      await fs.access(finalPath);
      log('Skip (exists):', slug);
      return;
    } catch {}
  }

  log('Start:', slug);
  const research = await ResearchAgent.run({ slug, topic, subAngles: curator.subAngles });
  const outline = await OutlineAgent.run({ slug, topic, ...research });
  const drafts = await StoryAgent.run({ slug, topic, ...outline });

  const safeDrafts = [] as typeof drafts;
  for (let i = 0; i < drafts.length; i++) {
    const safety = await SafetyAgent.run({ slug, draft: drafts[i] });
    await fs.writeFile(`/tmp/${slug}/safety-${i + 1}.json`, JSON.stringify(safety, null, 2), 'utf8');
    if (safety.ok) safeDrafts.push(safety.draft);
    else {
      const rej = path.join(process.cwd(), '_rejects', slug);
      await fs.mkdir(rej, { recursive: true });
      await fs.writeFile(path.join(rej, `draft-${i + 1}.json`), JSON.stringify(drafts[i], null, 2), 'utf8');
    }
  }
  if (safeDrafts.length === 0) {
    log('No safe drafts:', slug);
    return;
  }

  const verifiedDrafts = [] as typeof drafts;
  for (let i = 0; i < safeDrafts.length; i++) {
    const verifier = await VerifierAgent.run({ slug, draft: safeDrafts[i] });
    await fs.writeFile(`/tmp/${slug}/verifier-${i + 1}.json`, JSON.stringify(verifier, null, 2), 'utf8');
    if (verifier.verified) verifiedDrafts.push(verifier.draft);
    else {
      const rej = path.join(process.cwd(), '_rejects', slug);
      await fs.mkdir(rej, { recursive: true });
      await fs.writeFile(path.join(rej, `draft-${i + 1}.json`), JSON.stringify(safeDrafts[i], null, 2), 'utf8');
    }
  }
  if (verifiedDrafts.length === 0) {
    log('No verified drafts:', slug);
    return;
  }

  const judge = await JudgeAgent.run({ slug, drafts: verifiedDrafts });
  const finalDraft = verifiedDrafts[judge.chosenIndex] || verifiedDrafts[0];

  const assetDir = path.join(process.cwd(), 'public', 'assets', slug);
  await fs.mkdir(assetDir, { recursive: true });
  const heroFile = path.join(assetDir, 'hero.webp');

  let images = {
    hero: { file: `/assets/${slug}/hero.webp`, alt: `${topic} hero` },
    supports: [] as { file: string; alt: string }[],
  };

  if (imageMode !== 'skip') {
    const art = await IllustratorPromptAgent.run({ slug, story: finalDraft });
    images.hero.alt = art.hero.alt;
    if (imageMode === 'render' && art.hero.license === 'render') {
      await renderImage(art.hero.prompt, heroFile);
    } else {
      try { await fs.access(heroFile); } catch { await fs.writeFile(heroFile, ''); }
    }
    for (let i = 0; i < Math.min(2, art.supports.length); i++) {
      const img = art.supports[i];
      const fname = `support-${i + 1}.webp`;
      const fpath = path.join(assetDir, fname);
      if (imageMode === 'render' && img.license === 'render') {
        await renderImage(img.prompt, fpath);
      } else {
        try { await fs.access(fpath); } catch { await fs.writeFile(fpath, ''); }
      }
      images.supports.push({ file: `/assets/${slug}/${fname}`, alt: img.alt });
    }
  } else {
    try { await fs.access(heroFile); } catch { await fs.writeFile(heroFile, ''); }
  }

  await PackagerAgent.run({ slug, topic, draft: finalDraft, sources: outline.sources, images });
  log('Generated:', slug);
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const topicIdx = args.indexOf('--topic');
  const imgArg = args.find((a) => a.startsWith('--images='));
  const imageMode = (imgArg ? imgArg.split('=')[1] : 'skip') as ImageMode;
  let topics: string[] = [];
  if (topicIdx >= 0 && args[topicIdx + 1]) {
    topics = [args[topicIdx + 1]];
  } else {
    const seed = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'scripts/generate/topics.seed.json'), 'utf8')
    );
    topics = seed;
  }

  for (const topic of topics) {
    await runTopic(topic, force, imageMode);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
