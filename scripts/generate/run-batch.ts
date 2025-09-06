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
import { renderImage } from './imageRender';

const CONTENT = path.join(process.cwd(), 'content', 'stories');
const CHECKPOINT_FILE = '/tmp/_checkpoints.json';

function log(...msg: any[]) {
  console.log(new Date().toISOString(), ...msg);
}

type ImageMode = 'render' | 'stock' | 'skip';

interface RunResult {
  status: 'ok' | 'skipped' | 'error' | 'timeout';
  slug?: string;
  ms: number;
  tokensIn: number;
  tokensOut: number;
  timings: Record<string, number>;
}

async function runTopic(
  topic: string,
  force: boolean,
  imageMode: ImageMode,
  reviewMode: boolean
): Promise<RunResult> {
  const timings: Record<string, number> = {};
  let tokensOut = 0;
  const start = Date.now();

  const curatorStart = Date.now();
  const curator = await CuratorAgent.run({ topic });
  timings.CuratorAgent = Date.now() - curatorStart;
  tokensOut += JSON.stringify(curator).length;
  const { slug } = curator;

  const finalPath = path.join(CONTENT, `${slug}.json`);
  if (!force) {
    try {
      await fs.access(finalPath);
      log('Skip (exists):', slug);
      return { status: 'skipped', slug, ms: 0, tokensIn: 0, tokensOut: 0, timings };
    } catch {}
  }

  log('Start:', slug);

  const researchStart = Date.now();
  const research = await ResearchAgent.run({ slug, topic, subAngles: curator.subAngles });
  timings.ResearchAgent = Date.now() - researchStart;
  tokensOut += JSON.stringify(research).length;

  const outlineStart = Date.now();
  const outline = await OutlineAgent.run({ slug, topic, ...research });
  timings.OutlineAgent = Date.now() - outlineStart;
  tokensOut += JSON.stringify(outline).length;

  const draftsStart = Date.now();
  const drafts = await StoryAgent.run({ slug, topic, ...outline });
  timings.StoryAgent = Date.now() - draftsStart;
  tokensOut += JSON.stringify(drafts).length;

  const safeDrafts = [] as typeof drafts;
  for (let i = 0; i < drafts.length; i++) {
    const safetyStart = Date.now();
    const safety = await SafetyAgent.run({ slug, draft: drafts[i] });
    const sMs = Date.now() - safetyStart;
    timings.SafetyAgent = (timings.SafetyAgent || 0) + sMs;
    tokensOut += JSON.stringify(safety).length;
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
    return { status: 'error', slug, ms: Date.now() - start, tokensIn: tokensOut, tokensOut, timings };
  }

  const verifiedDrafts = [] as typeof drafts;
  for (let i = 0; i < safeDrafts.length; i++) {
    const verifierStart = Date.now();
    const verifier = await VerifierAgent.run({ slug, draft: safeDrafts[i] });
    const vMs = Date.now() - verifierStart;
    timings.VerifierAgent = (timings.VerifierAgent || 0) + vMs;
    tokensOut += JSON.stringify(verifier).length;
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
    return { status: 'error', slug, ms: Date.now() - start, tokensIn: tokensOut, tokensOut, timings };
  }

  const judgeStart = Date.now();
  const judge = await JudgeAgent.run({ slug, drafts: verifiedDrafts });
  timings.JudgeAgent = Date.now() - judgeStart;
  tokensOut += JSON.stringify(judge).length;
  const finalDraft = verifiedDrafts[judge.chosenIndex] || verifiedDrafts[0];

  const assetDir = path.join(process.cwd(), 'public', 'assets', slug);
  await fs.mkdir(assetDir, { recursive: true });
  const heroFile = path.join(assetDir, 'hero.webp');

  let images = {
    hero: { file: `/assets/${slug}/hero.webp`, alt: `${topic} hero` },
    supports: [] as { file: string; alt: string }[],
  };

  if (imageMode !== 'skip') {
    const artStart = Date.now();
    const art = await IllustratorPromptAgent.run({ slug, story: finalDraft });
    timings.IllustratorPromptAgent = Date.now() - artStart;
    tokensOut += JSON.stringify(art).length;
    images.hero.alt = art.hero.alt;
    if (imageMode === 'render' && art.hero.license === 'render') {
      await renderImage(art.hero.prompt, heroFile);
    } else {
      try {
        await fs.access(heroFile);
      } catch {
        await fs.writeFile(heroFile, '');
      }
    }
    for (let i = 0; i < Math.min(2, art.supports.length); i++) {
      const img = art.supports[i];
      const fname = `support-${i + 1}.webp`;
      const fpath = path.join(assetDir, fname);
      if (imageMode === 'render' && img.license === 'render') {
        await renderImage(img.prompt, fpath);
      } else {
        try {
          await fs.access(fpath);
        } catch {
          await fs.writeFile(fpath, '');
        }
      }
      images.supports.push({ file: `/assets/${slug}/${fname}`, alt: img.alt });
    }
  } else {
    try {
      await fs.access(heroFile);
    } catch {
      await fs.writeFile(heroFile, '');
    }
  }

  const packagerStart = Date.now();
  await PackagerAgent.run({
    slug,
    topic,
    draft: finalDraft,
    sources: outline.sources,
    images,
    reviewMode,
  });
  timings.PackagerAgent = Date.now() - packagerStart;

  log('Generated:', slug);

  const ms = Date.now() - start;
  const tokensIn = tokensOut; // rough approximation
  return { status: 'ok', slug, ms, tokensIn, tokensOut, timings };
}

interface RecordEntry {
  topic: string;
  status: 'pending' | 'running' | 'done' | 'error' | 'timeout' | 'skipped';
  ms?: number;
  tokensIn?: number;
  tokensOut?: number;
}

function displayProgress(records: RecordEntry[]) {
  console.log('\nProgress');
  console.table(
    records.map((r) => ({
      topic: r.topic,
      status: r.status,
      ms: r.ms ?? '',
      in: r.tokensIn ?? '',
      out: r.tokensOut ?? '',
    }))
  );
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const all = args.includes('--all');
  const topicIdx = args.indexOf('--topic');
  const imgArg = args.find((a) => a.startsWith('--images='));
  const imageMode = (imgArg ? imgArg.split('=')[1] : 'skip') as ImageMode;
  const concArg = args.find((a) => a.startsWith('--concurrency='));
  const concurrency = concArg ? parseInt(concArg.split('=')[1], 10) : 1;
  const maxMsArg = args.find((a) => a.startsWith('--max-ms-per-topic='));
  const maxMsPerTopic = maxMsArg ? parseInt(maxMsArg.split('=')[1], 10) : Infinity;
  const maxCharsArg = args.find((a) => a.startsWith('--max-chars='));
  const maxChars = maxCharsArg ? parseInt(maxCharsArg.split('=')[1], 10) : Infinity;
  const reviewArg = args.find((a) => a.startsWith('--review-mode'));
  const reviewMode = reviewArg ? reviewArg.split('=')[1] !== 'false' : true;

  let seedTopics: string[] = [];
  if (topicIdx >= 0 && args[topicIdx + 1]) {
    seedTopics = [args[topicIdx + 1]];
  } else {
    const seed = JSON.parse(
      await fs.readFile(path.join(process.cwd(), 'scripts/generate/topics.seed.json'), 'utf8')
    );
    seedTopics = seed;
  }

  let checkpoint: string[] = [];
  try {
    checkpoint = JSON.parse(await fs.readFile(CHECKPOINT_FILE, 'utf8'));
  } catch {}
  const checkpointSet = new Set(checkpoint);

  const records: RecordEntry[] = seedTopics.map((t) => ({
    topic: t,
    status: !force && !all && checkpointSet.has(t) ? 'skipped' : 'pending',
  }));

  const topicsToRun = records.filter((r) => r.status === 'pending');

  let nextIndex = 0;
  let totalChars = 0;
  let aborted = false;
  const agentTotals: Record<string, number> = {};
  const startBatch = Date.now();

  displayProgress(records);

  async function saveCheckpoints() {
    await fs.writeFile(
      CHECKPOINT_FILE,
      JSON.stringify(Array.from(checkpointSet), null, 2),
      'utf8'
    );
  }

  async function worker() {
    while (true) {
      if (aborted) break;
      const current = topicsToRun[nextIndex++];
      if (!current) break;
      current.status = 'running';
      displayProgress(records);
      const run =
        maxMsPerTopic === Infinity
          ? await runTopic(current.topic, force, imageMode, reviewMode)
          : await Promise.race([
              runTopic(current.topic, force, imageMode, reviewMode),
              new Promise<RunResult>((resolve) =>
                setTimeout(
                  () =>
                    resolve({
                      status: 'timeout',
                      ms: maxMsPerTopic,
                      tokensIn: 0,
                      tokensOut: 0,
                      timings: {},
                    }),
                  maxMsPerTopic,
                ),
              ),
            ]);
      if (run.status === 'ok') {
        current.status = 'done';
        current.ms = run.ms;
        current.tokensIn = run.tokensIn;
        current.tokensOut = run.tokensOut;
        totalChars += run.tokensOut;
        checkpointSet.add(current.topic);
        await saveCheckpoints();
        for (const [agent, ms] of Object.entries(run.timings)) {
          agentTotals[agent] = (agentTotals[agent] || 0) + ms;
        }
      } else if (run.status === 'skipped') {
        current.status = 'skipped';
        checkpointSet.add(current.topic);
        await saveCheckpoints();
      } else if (run.status === 'timeout') {
        current.status = 'timeout';
        current.ms = maxMsPerTopic;
      } else {
        current.status = 'error';
      }
      displayProgress(records);
      if (totalChars >= maxChars) {
        aborted = true;
        break;
      }
    }
  }

  const workers = Array.from({ length: Math.max(1, concurrency) }, () => worker());
  await Promise.all(workers);

  const elapsed = Date.now() - startBatch;
  const rejects = path.join(process.cwd(), '_rejects');

  console.log('\nSummary');
  console.table({
    total: records.length,
    completed: records.filter((r) => r.status === 'done').length,
    skipped: records.filter((r) => r.status === 'skipped').length,
    failed: records.filter((r) => r.status === 'error').length,
    timeout: records.filter((r) => r.status === 'timeout').length,
    elapsedMs: elapsed,
    totalChars,
    rejects,
  });

  console.log('\nAgent timings (ms)');
  console.table(agentTotals);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

