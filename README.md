# CurioQuest

## Project Overview
CurioQuest is a browser‑first static site built with Next.js App Router and Tailwind. Stories are generated offline by a multi‑agent pipeline and saved as JSON and images so the site can serve engaging, kid‑friendly adventures without any runtime API cost.

## Features
- Pre‑generation pipeline using multiple OpenAI agents
- Kid‑safe content with PG‑12 tone
- Phase‑segmented stories (hook → wrap)
- Built‑in mini‑quiz for comprehension
- Optional text‑to‑speech playback
- Optional image rendering (OpenAI or stock)
- Fully static hosting with zero server costs

## Architecture at a glance
Offline generation creates stories and assets, which the Next.js app exports as a static site.

```
[generate scripts] --> content/stories/*.json
                     \
                      -> public/assets/*
                        
Next.js App --> `next build` --> out/
```

## Folder Structure
```
app/              Next.js routes and layout
components/       React components for phases, TTS, etc.
content/
  stories/        Pre‑generated story JSON files
  topics.json     List of topics shown on the homepage
lib/              Utilities (AI, paths, readability)
public/           Static assets (images)
scripts/
  generate/       Offline story generation pipeline
schemas/          Zod schemas for stories and topics
```

## Content Schema
Stories live in `content/stories/<slug>.json`:

```json
{
  "slug": "rockets",
  "title": "Rockets Basics",
  "ageBand": "10-13",
  "readingLevel": "grade-6",
  "estReadMin": 6,
  "heroImage": { "file": "/assets/rockets/hero.webp", "alt": "Rockets hero" },
  "supportImages": [],
  "sources": [{ "id": "s1", "name": "StubSource", "url": "https://example.com" }],
  "phases": [
    { "type": "hook", "heading": "Exploring Rockets", "body": "Let's learn about Rockets." },
    { "type": "orientation", "heading": "What are Rockets?", "body": "Rockets in a nutshell." },
    { "type": "discovery", "heading": "Digging into Rockets", "body": "More about Rockets." },
    { "type": "wow-panel", "heading": "A wow moment", "body": "Rockets can be surprising!" },
    { "type": "fact-gems", "items": [
        { "sourceId": "s1", "text": "Rockets fact 1" },
        { "sourceId": "s1", "text": "Rockets fact 2" },
        { "sourceId": "s1", "text": "Rockets fact 3" }
      ]
    },
    { "type": "mini-quiz", "items": [
        { "q": "Where do Rockets travel?", "choices": ["Space", "Sea"], "answer": 0 },
        { "q": "Are Rockets fast?", "choices": ["Yes", "No"], "answer": 0 }
      ]
    },
    { "type": "imagine", "prompt": "Imagine using Rockets for adventure." },
    { "type": "wrap", "keyTakeaways": ["Rockets are fascinating", "Learning about Rockets is fun"] }
  ],
  "badges": [],
  "crossLinks": []
}
```

Topics are listed in `content/topics.json`:

```json
[
  { "slug": "example", "title": "Example Topic", "thumbnail": "/assets/example/hero.webp", "badges": ["DEMO"] },
  { "slug": "rockets", "title": "Rockets", "thumbnail": "/assets/rockets/hero.webp", "badges": [] }
]
```

## Setup & Requirements
- Node.js 20+
- `npm install`
- Copy `.env.example` to `.env` and set `OPENAI_API_KEY` for generation
- Optional: `sharp` for image rendering (installed by default)

## Scripts
- `npm run dev` – start local development
- `npm run build` – build the Next.js app
- `npm run export` – build and export static site to `out/`
- `npm run validate` – validate content against schemas
- `npm run audit` – readability statistics for stories
- `npm run generate` – run generation pipeline
  - Flags: `--all`, `--topic <topic>`, `--force`, `--images=render|stock|skip`, `--concurrency=<n>`, `--max-ms-per-topic=<ms>`, `--max-chars=<n>`
  - Example: `npm run generate -- --all --images=render --concurrency=2`
- `tsx scripts/generate/smoke-ai.ts` – quick OpenAI smoke test
- Logs: `.ai_logs/<date>.ndjson`

### CI

GitHub Actions automate key workflows:

- **Generate** (`.github/workflows/generate.yml`) – manually trigger to run generation, validation, and audit, committing updates to `content/` and `public/assets/`.
- **Release** (`.github/workflows/release.yml`) – on push to `main` or manual dispatch, builds the static site and publishes a container image to GHCR that serves `out/` on `$PORT`.

## Generation Pipeline (Agents)
1. **Curator** – derives slug, sub‑angles, tone
2. **Research** – gathers facts and sources (Wikipedia, NASA)
3. **Outline** – plans phases and fact gems
4. **Storywriter** – writes several drafts
5. **Safety** – filters out unsafe drafts
6. **Verifier** – checks fact gems
7. **Judge** – scores drafts and picks the best
8. **Illustrator‑Prompt** – prepares hero/support image prompts
9. **Packager** – writes story JSON, updates `topics.json`, saves assets

Runs are idempotent. Checkpoints in `/tmp/_checkpoints.json` skip completed topics unless `--all` or `--force` is used.

## Images
Hero and support images live under `public/assets/<slug>/`. Use `--images=render` to call OpenAI and save `.webp` files, `--images=stock` to reserve filenames for CC0/NASA/Smithsonian art, or `--images=skip` to skip artwork. Always provide descriptive `alt` text.

## Accessibility & Kid‑Safety
Stories target grades 5–7 with inclusive language and clear structure. Each phase uses headings, quiz answers are explicit, images require alt text, and tone remains age‑appropriate.

## Deployment
Run `npm run export` to output a fully static site in `out/`. Deploy with Vercel, Cloudflare Pages, Netlify, or any static file host. When running `serverless.mjs` directly (e.g., `npm run runpod`), generate `out/` first.

The included Dockerfile builds the site during the image build (`npm ci` followed by `npm run export`) and bundles `serverless.mjs`. The resulting container serves `out/` on `process.env.PORT` and exposes `/ping` on `process.env.PORT_HEALTH` when started with `node serverless.mjs`.

### RunPod Serverless
To run CurioQuest on [RunPod](https://www.runpod.io/):

1. **Build and push the image**
   The Dockerfile runs `npm ci` and `npm run export`, so no pre-built `out/` directory is required.
   ```bash
   docker build -t <registry-user>/curioquest:latest .
   docker push <registry-user>/curioquest:latest
   ```
2. **Start the serverless handler**
   RunPod injects `PORT` and `PORT_HEALTH`. For local testing outside Docker, generate `out/` then launch:
   ```bash
   npm install
   npm run export
   RUNPOD_LOCAL=1 PORT=3000 PORT_HEALTH=3001 node serverless.mjs
   ```
3. **Access the site**
   After deployment open your endpoint URL, e.g. `https://js4f1ftbo81bhb.api.runpod.ai`, in a browser. The `/ping` path on the health port returns `200` for health checks.

When deploying to RunPod you will receive two identifiers:

- **Endpoint ID** – a UUID shown in the endpoint URL.
- **API Key** – your personal secret used for authentication.

The API key is **different** from the endpoint ID. You can create or view API keys in the RunPod dashboard by clicking your avatar → **API Keys**.

Example requests:

Using an Authorization header:

```bash
curl -X POST https://api.runpod.ai/v2/<ENDPOINT_ID>/run \
  -H "Authorization: Bearer <RUNPOD_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"input": {}}'
```

Passing the key as a query parameter:

```bash
curl "https://api.runpod.ai/v2/<ENDPOINT_ID>/run?api_key=<RUNPOD_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"input": {}}'
```

Use your API key in these requests, not the endpoint ID.

## Roadmap
- Search across stories
- Recommendation engine
- Per‑child reading profiles
- Breakfast recall mode

## License
No license file is present. Add a LICENSE file (e.g. MIT) before publishing.

## Acknowledgements
Powered by OpenAI, Wikipedia, NASA, Tailwind CSS, Next.js, Zod, and Sharp. CC0 and public‑domain images from NASA and the Smithsonian are encouraged.

## Getting Help
Questions or problems? [Open an issue](https://github.com/dhruvd22/curioquest/issues).
