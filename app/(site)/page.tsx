import fs from "node:fs/promises";
import path from "node:path";
import Link from "next/link";

type Topic = { slug: string; title: string; thumbnail?: string; badges?: string[] };

async function getTopics(): Promise<Topic[]> {
  const file = path.join(process.cwd(), "content", "topics.json");
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw);
}

export default async function HomePage() {
  const topics = await getTopics();
  return (
    <main className="p-6 grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {topics.map(t => (
        <Link key={t.slug} href={`/story/${t.slug}`} className="border rounded-lg p-4 hover:shadow">
          <img src={t.thumbnail ?? ""} alt="" className="w-full h-32 object-cover rounded mb-3" />
          <div className="font-semibold">{t.title}</div>
          <div className="text-xs opacity-70">{t.badges?.join(" • ")}</div>
        </Link>
      ))}
    </main>
  );
}
