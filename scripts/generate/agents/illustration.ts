import path from 'node:path';
import { Budget } from '../../../lib/ai/budget';
import { client, withBackoff } from '../../../lib/ai/openai';
import { saveBase64Webp } from '../../../lib/images/save';
import { STOCK_MAP } from '../../../lib/images/stock-map';

interface Args {
  slug: string;
  topic: string;
  heroPrompt: string;
  supportPrompt?: string;
  budget: Budget;
}

export class IllustrationAgent {
  static async run({ slug, heroPrompt, supportPrompt, budget }: Args) {
    let want = supportPrompt ? 2 : 1;
    if (!budget.approveImages(want, `illustration:${slug}`)) {
      want = 1;
      if (!budget.approveImages(1, `illustration:${slug}:hero`)) {
        return { hero: STOCK_MAP.generic, supports: [] };
      }
    }
    try {
      const hero = await withBackoff(() =>
        client.images.generate({ model: 'gpt-image-1', prompt: heroPrompt, size: '1024x1024' })
      );
      const heroOut = path.join(process.cwd(), 'public', 'assets', slug, 'hero.webp');
      await saveBase64Webp((hero as any).data[0].b64_json, heroOut);
      const supports: string[] = [];
      if (supportPrompt && want > 1) {
        const sup = await withBackoff(() =>
          client.images.generate({ model: 'gpt-image-1', prompt: supportPrompt, size: '1024x1024' })
        );
        const supOut = path.join(process.cwd(), 'public', 'assets', slug, 'support-1.webp');
        await saveBase64Webp((sup as any).data[0].b64_json, supOut);
        supports.push(`/assets/${slug}/support-1.webp`);
      }
      return { hero: `/assets/${slug}/hero.webp`, supports };
    } catch {
      return { hero: STOCK_MAP.generic, supports: [] };
    }
  }
}
