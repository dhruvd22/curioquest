import fs from 'node:fs/promises';
import path from 'node:path';
import { CuratorAgent } from './agents/curator';
import { ResearchAgent } from './agents/research';
import { OutlineAgent } from './agents/outline';
import { StoryAgent } from './agents/story';

const CONTENT = path.join(process.cwd(), 'content', 'stories');

function log(...msg: any[]) {
  console.log(new Date().toISOString(), ...msg);
}

async function runTopic(topic: string, force: boolean) {
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
  await StoryAgent.run({ slug, topic, ...outline });
  log('Generated:', slug);
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const topicIdx = args.indexOf('--topic');
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
    await runTopic(topic, force);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
