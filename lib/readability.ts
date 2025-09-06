export function readabilityStats(text: string) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const words = text.split(/\s+/).filter(Boolean);
  const syllables = words.reduce((acc, w) => acc + countSyllables(w), 0);
  const ASL = words.length / Math.max(1, sentences.length); // average sentence length
  const ASW = syllables / Math.max(1, words.length); // average syllables per word
  // Flesch-Kincaid Grade Level
  const FK = 0.39 * ASL + 11.8 * ASW - 15.59;
  return { sentences: sentences.length, words: words.length, syllables, ASL, ASW, FK };
}

function countSyllables(word: string) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  const matches = w.match(/[aeiouy]+/g) ?? [];
  let syl = matches.length;
  if (w.endsWith("e")) syl = Math.max(1, syl - 1);
  return Math.max(1, syl);
}
