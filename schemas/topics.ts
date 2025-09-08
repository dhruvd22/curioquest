import { z } from 'zod';

export const TopicSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  thumbnail: z.string().optional(),
  badges: z.array(z.string()).optional(),
});

export const TopicsSchema = z.array(TopicSchema);

export type Topic = z.infer<typeof TopicSchema>;
