import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";

export const dynamicParams = false;

const CONTENT_DIR = path.join(process.cwd(), "content", "stories");

export async function generateStaticParams() {
  const files = await fs.readdir(CONTENT_DIR);
  return files.filter(f => f.endsWith(".json")).map(f => ({ slug: f.replace(/\.json$/, "") }));
}

type Phase =
  | { type: "hook"; heading: string; body: string }
  | { type: "orientation"; heading: string; body: string }
  | { type: "discovery"; heading: string; body: string }
  | { type: "wow-panel"; heading: string; body: string }
  | { type: "fact-gems"; items: { sourceId: string; text: string }[] }
  | { type: "mini-quiz"; items: { q: string; choices: string[]; answer: number }[] }
  | { type: "imagine"; prompt: string }
  | { type: "wrap"; keyTakeaways: string[] };

type Story = {
  slug: string; title: string; phases: Phase[]; heroImage?: { file: string; alt: string };
};

async function loadStory(slug: string): Promise<Story | null> {
  try {
    const raw = await fs.readFile(path.join(CONTENT_DIR, `${slug}.json`), "utf8");
    return JSON.parse(raw);
  } catch { return null; }
}

export default async function StoryPage({ params }: { params: { slug: string } }) {
  const story = await loadStory(params.slug);
  if (!story) return notFound();
  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{story.title}</h1>
      {story.heroImage && <img className="rounded mb-6" src={story.heroImage.file} alt={story.heroImage.alt} />}
      <article className="space-y-6">
        {story.phases.map((p, i) => <section key={i}><PhaseRenderer phase={p as any} /></section>)}
      </article>
    </main>
  );
}

function PhaseRenderer({ phase }: { phase: any }) {
  switch (phase.type) {
    case "hook":
    case "orientation":
    case "discovery":
    case "wow-panel":
      return (<><h2 className="text-xl font-semibold mb-1">{phase.heading}</h2><p>{phase.body}</p></>);
    case "fact-gems":
      return (<ul className="list-disc pl-6">{phase.items.map((it: any, i: number) => <li key={i}><strong>Did you know?</strong> {it.text}</li>)}</ul>);
    case "mini-quiz":
      return (<div><h3 className="font-semibold">Quick Quiz</h3><ol className="list-decimal pl-6">{phase.items.map((q:any, i:number)=><li key={i}>{q.q}</li>)}</ol></div>);
    case "imagine":
      return (<div className="italic">Imagine: {phase.prompt}</div>);
    case "wrap":
      return (<div><h3 className="font-semibold">Takeaways</h3><ul className="list-disc pl-6">{phase.keyTakeaways.map((k:string,i:number)=><li key={i}>{k}</li>)}</ul></div>);
    default:
      return null;
  }
}
