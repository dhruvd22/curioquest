// Simple, conservative budget estimator + guard
// Defaults assume gpt-4o-mini ~cheap text, and gpt-image-1 with medium cost.
// We estimate tokens ~ chars/4. Adjust factors conservatively to *under-spend*.

type Event = { kind: "text" | "image"; inChars?: number; outChars?: number; images?: number; costUSD: number; note?: string };
export class Budget {
  private cap = Number(process.env.BUDGET_USD || 20);
  private spent = 0;
  private events: Event[] = [];
  // pricing assumptions (tune down to be safer)
  private TEXT_IN_PER_M   = 0.15; // $/1M input tokens (approx)
  private TEXT_OUT_PER_M  = 0.60; // $/1M output tokens (approx)
  private CHARS_PER_TOKEN = 4;    // conservative
  private IMG_MEDIUM_EACH = 0.04; // $ per 1024x1024 medium

  spentUSD() { return this.spent; }
  remainingUSD() { return Math.max(0, this.cap - this.spent); }
  log() { return this.events; }

  // estimate text call cost by chars
  estimateTextUSD(inChars: number, outChars: number) {
    const inTok = inChars / this.CHARS_PER_TOKEN;
    const outTok = outChars / this.CHARS_PER_TOKEN;
    return (inTok/1e6)*this.TEXT_IN_PER_M + (outTok/1e6)*this.TEXT_OUT_PER_M;
  }
  estimateImgsUSD(n: number) { return n * this.IMG_MEDIUM_EACH; }

  approveText(inChars: number, outChars: number, note?: string) {
    const cost = this.estimateTextUSD(inChars, outChars);
    if (this.spent + cost > this.cap) return false;
    this.spent += cost; this.events.push({ kind:"text", inChars, outChars, costUSD: cost, note });
    return true;
  }
  approveImages(n: number, note?: string) {
    const cost = this.estimateImgsUSD(n);
    if (this.spent + cost > this.cap) return false;
    this.spent += cost; this.events.push({ kind:"image", images:n, costUSD: cost, note });
    return true;
  }
}
