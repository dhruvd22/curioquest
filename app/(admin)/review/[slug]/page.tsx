import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import PhaseRenderer, { Phase } from "../../../../components/Story/PhaseRenderer";
import CopyButton from "../../../../components/Admin/CopyButton";

const INCOMING_DIR = path.join(process.cwd(), "review", "incoming");

export const dynamicParams = false;

export const dynamic = "force-static";

export async function generateStaticParams() {
  try {
    const entries = await fs.readdir(INCOMING_DIR, { withFileTypes: true });
    const slugs = entries.filter((e) => e.isDirectory()).map((e) => ({ slug: e.name }));
    // Next.js static export requires at least one path for dynamic routes
    return slugs.length > 0 ? slugs : [{ slug: "__placeholder__" }];
  } catch {
    return [{ slug: "__placeholder__" }];
  }
}

type Story = {
  slug: string;
  title: string;
  phases: Phase[];
  heroImage?: { file: string; alt: string };
  supportImages?: { file: string; alt: string }[];
  sources: { id: string; name: string; url: string }[];
};

async function loadStory(slug: string): Promise<Story | null> {
  try {
    const raw = await fs.readFile(path.join(INCOMING_DIR, slug, "story.json"), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default async function ReviewStory({ params }: { params: { slug: string } }) {
  const story = await loadStory(params.slug);
  if (!story) return notFound();
  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{story.title}</h1>
      {story.heroImage && <img className="rounded mb-6" src={story.heroImage.file} alt={story.heroImage.alt} />}
      <article className="space-y-6">
        {story.phases.map((p, i) => (
          <section key={i}>
            <PhaseRenderer phase={p} />
          </section>
        ))}
      </article>
      {story.sources.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Sources</h2>
          <ul className="list-disc list-inside">
            {story.sources.map((s) => (
              <li key={s.id}>
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="fixed bottom-4 right-4 bg-white border shadow p-4 rounded space-y-2 text-sm">
        <CopyButton text={`npm run approve -- --slug ${story.slug} --by "<name>"`} label="Copy approve" />
        <CopyButton text={`npm run publish -- --slug ${story.slug}`} label="Copy publish" />
      </div>
    </main>
  );
}
