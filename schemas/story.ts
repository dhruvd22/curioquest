import { z } from 'zod';

const FactGem = z.object({
  sourceId: z.string().min(1),
  text: z.string().min(1),
});

const MiniQuizItem = z.object({
  q: z.string().min(1),
  choices: z.array(z.string().min(1)).min(2),
  answer: z.number().int().nonnegative(),
});

const Phase = z.discriminatedUnion('type', [
  z.object({ type: z.literal('hook'), heading: z.string(), body: z.string() }),
  z.object({ type: z.literal('orientation'), heading: z.string(), body: z.string() }),
  z.object({ type: z.literal('discovery'), heading: z.string(), body: z.string() }),
  z.object({ type: z.literal('wow-panel'), heading: z.string(), body: z.string() }),
  z.object({ type: z.literal('fact-gems'), items: z.array(FactGem).length(3) }),
  z.object({ type: z.literal('mini-quiz'), items: z.array(MiniQuizItem).min(2).max(3) }),
  z.object({ type: z.literal('imagine'), prompt: z.string() }),
  z.object({ type: z.literal('wrap'), keyTakeaways: z.array(z.string()).min(2).max(5) }),
]);

export const StorySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  ageBand: z.string().default('10-13'),
  readingLevel: z.string().default('grade-6'),
  estReadMin: z.number().int().positive().default(6),
  heroImage: z.object({ file: z.string(), alt: z.string() }).optional(),
  supportImages: z.array(z.object({ file: z.string(), alt: z.string() })).default([]),
  sources: z.array(z.object({ id: z.string(), name: z.string(), url: z.string().url() })).default([]),
  phases: z.array(Phase).min(6),
  badges: z.array(z.string()).default([]),
  crossLinks: z.array(z.string()).default([]),
});

export type Story = z.infer<typeof StorySchema>;
