import fs from "node:fs/promises";
import type { Dirent } from "node:fs";
import path from "node:path";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import CopyButton from "../../../components/Admin/CopyButton";

const ROOT = path.join(process.cwd(), "review");
const INCOMING_DIR = path.join(ROOT, "incoming");
const DIFFS_DIR = path.join(ROOT, "diffs");
const APPROVALS_DIR = path.join(ROOT, "approvals");

async function listStories() {
  let dirents: Dirent[] = [];
  try {
    dirents = await fs.readdir(INCOMING_DIR, { withFileTypes: true });
  } catch {
    return [];
  }
  const stories = [] as {
    slug: string;
    title: string;
    estReadMin: number;
    badges: string[];
    hasImages: boolean;
    diff?: string;
    status: string;
  }[];
  for (const d of dirents) {
    if (!d.isDirectory()) continue;
    const slug = d.name;
    try {
      const raw = await fs.readFile(path.join(INCOMING_DIR, slug, "story.json"), "utf8");
      const story = JSON.parse(raw);
      const hasImages = Boolean(story.heroImage || (story.supportImages && story.supportImages.length > 0));
      let diff: string | undefined;
      try {
        diff = await fs.readFile(path.join(DIFFS_DIR, `${slug}.md`), "utf8");
      } catch {}
      let status = "pending";
      try {
        await fs.access(path.join(APPROVALS_DIR, `${slug}.json`));
        status = "approved";
      } catch {}
      stories.push({ slug, title: story.title, estReadMin: story.estReadMin, badges: story.badges, hasImages, diff, status });
    } catch {}
  }
  return stories;
}

export default async function ReviewIndex() {
  const stories = await listStories();
  return (
    <main className="p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold mb-4">Incoming Stories</h1>
      {stories.map((s) => (
        <div key={s.slug} className="border p-4 rounded">
          <div className="flex justify-between items-start">
            <div>
              <Link href={`/review/${s.slug}`} className="text-lg font-semibold text-blue-600">
                {s.slug}
              </Link>
              <div>{s.title}</div>
              <div className="text-sm text-gray-600">
                {s.estReadMin} min · badges: {s.badges.join(", ") || "none"} · images:{" "}
                {s.hasImages ? "yes" : "no"} · status: {s.status}
              </div>
            </div>
            <div className="space-x-2">
              <CopyButton
                label="Copy approve"
                text={`npm run approve -- --slug ${s.slug} --by "<name>"`}
              />
              <CopyButton
                label="Copy publish"
                text={`npm run publish -- --slug ${s.slug}`}
              />
            </div>
          </div>
          {s.diff && (
            <details className="mt-2">
              <summary className="cursor-pointer text-sm text-blue-700">Diff</summary>
              <div className="prose mt-2">
                <ReactMarkdown>{s.diff}</ReactMarkdown>
              </div>
            </details>
          )}
        </div>
      ))}
      {stories.length === 0 && <p>No incoming stories.</p>}
    </main>
  );
}
