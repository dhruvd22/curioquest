import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import PhaseRenderer, { Phase } from "../../../components/Story/PhaseRenderer";
import TTSButton from "../../../components/Story/TTSButton";

export const dynamicParams = false;

const CONTENT_DIR = path.join(process.cwd(), "content", "stories");

export async function generateStaticParams() {
  try {
    const files = await fs.readdir(CONTENT_DIR);
    const slugs = files.filter((f) => f.endsWith(".json")).map((f) => ({ slug: f.replace(/\.json$/, "") }));
    // Next.js static export requires at least one path for dynamic routes
    return slugs.length > 0 ? slugs : [{ slug: "__placeholder__" }];
  } catch {
    return [{ slug: "__placeholder__" }];
  }
}

type Story = {
  slug: string; title: string; phases: Phase[]; heroImage?: { file: string; alt: string };
};

async function loadStory(slug: string): Promise<Story | null> {
  try {
    const raw = await fs.readFile(path.join(CONTENT_DIR, `${slug}.json`), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function collectText(phases: Phase[]): string {
  return phases.map(p => {
    switch (p.type) {
      case "hook":
      case "orientation":
      case "discovery":
      case "wow-panel":
        return `${p.heading} ${p.body}`;
      case "fact-gems":
        return p.items.map(it => it.text).join(" ");
      case "mini-quiz":
        return p.items.map(it => `${it.q} ${it.choices.join(" ")}`).join(" ");
      case "imagine":
        return p.prompt;
      case "wrap":
        return p.keyTakeaways.join(" ");
      default:
        return "";
    }
  }).join(" ");
}

export default async function StoryPage({ params }: { params: { slug: string } }) {
  const story = await loadStory(params.slug);
  if (!story) return notFound();
  const fullText = `${story.title} ${collectText(story.phases)}`;
  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{story.title}</h1>
      {story.heroImage && <img className="rounded mb-6" src={story.heroImage.file} alt={story.heroImage.alt} />}
      <div className="mb-4"><TTSButton text={fullText} /></div>
      <article className="space-y-6">
        {story.phases.map((p, i) => (
          <section key={i}>
            <PhaseRenderer phase={p} />
          </section>
        ))}
      </article>
    </main>
  );
}
