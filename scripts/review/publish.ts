import fs from 'node:fs/promises';
import path from 'node:path';

const REVIEW_ROOT = path.join(process.cwd(), 'review');
const CONTENT_STORIES = path.join(process.cwd(), 'content', 'stories');
const TOPICS_FILE = path.join(process.cwd(), 'content', 'topics.json');
const ASSETS_DIR = path.join(process.cwd(), 'public', 'assets');

async function publishSlug(slug: string) {
  const approvalPath = path.join(REVIEW_ROOT, 'approvals', `${slug}.json`);
  const approval = JSON.parse(await fs.readFile(approvalPath, 'utf8'));
  if (!approval.approved) throw new Error(`Not approved: ${slug}`);

  const incomingPath = path.join(REVIEW_ROOT, 'incoming', slug, 'story.json');
  const story = JSON.parse(await fs.readFile(incomingPath, 'utf8'));

  const destPath = path.join(CONTENT_STORIES, `${slug}.json`);
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.writeFile(destPath, JSON.stringify(story, null, 2), 'utf8');

  const topics = JSON.parse(await fs.readFile(TOPICS_FILE, 'utf8'));
  if (!topics.find((t: any) => t.slug === slug)) {
    topics.push({ slug, title: story.title, thumbnail: story.heroImage.file, badges: [] });
    await fs.writeFile(TOPICS_FILE, JSON.stringify(topics, null, 2), 'utf8');
  }

  const assetDir = path.join(ASSETS_DIR, slug);
  await fs.mkdir(assetDir, { recursive: true });
  try {
    const files = await fs.readdir(assetDir);
    for (const f of files) {
      const src = path.join(assetDir, f);
      const dest = path.join(assetDir, f);
      await fs.copyFile(src, dest);
    }
  } catch {}
}

async function main() {
  const args = process.argv.slice(2);
  let slugs: string[] = [];
  const slugIdx = args.indexOf('--slug');
  if (slugIdx >= 0 && args[slugIdx + 1]) slugs.push(args[slugIdx + 1]);
  if (args.includes('--all-approved')) {
    try {
      const files = await fs.readdir(path.join(REVIEW_ROOT, 'approvals'));
      for (const f of files) {
        const a = JSON.parse(await fs.readFile(path.join(REVIEW_ROOT, 'approvals', f), 'utf8'));
        if (a.approved) slugs.push(f.replace(/\.json$/, ''));
      }
    } catch {}
  }
  for (const s of slugs) await publishSlug(s);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
