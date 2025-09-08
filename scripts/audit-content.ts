import fs from "node:fs/promises";
import path from "node:path";
import { readabilityStats } from "../lib/readability";

const STORIES = path.join(process.cwd(), "content", "stories");

(async () => {
  let files: string[] = [];
  try {
    files = (await fs.readdir(STORIES)).filter(f => f.endsWith(".json"));
  } catch {
    console.log("Story Readability Audit: no stories found");
    return;
  }
  console.log("Story Readability Audit");
  for (const f of files) {
    const story = JSON.parse(await fs.readFile(path.join(STORIES, f), "utf8"));
    const narrative = (story.phases ?? [])
      .filter((p: any) => ["hook","orientation","discovery","wow-panel","wrap"].includes(p.type))
      .map((p: any) => [p.heading, p.body].filter(Boolean).join(". "))
      .join(" ");
    const stats = readabilityStats(narrative);
    const warn = (stats.FK > 7.5 || stats.ASL > 20) ? " ⚠" : "";
    console.log(`${story.slug}: FK=${stats.FK.toFixed(1)} ASL=${stats.ASL.toFixed(1)}${warn}`);
  }
})();
