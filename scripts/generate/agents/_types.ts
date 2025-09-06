export interface Agent<I, O> { name: string; run(input: I): Promise<O>; }

export type CuratorInput = { topic: string };
export type CuratorOutput = {
  slug: string;
  subAngles: string[];
  toneTags: string[];
  readingLevelTarget: string;
};

export type ResearchOutput = {
  facts: { claim: string; quote: string; sourceId: string; sourceName: string; url: string }[];
  sources: { id: string; name: string; url: string }[];
};
export type ResearchInput = { topic: string; subAngles?: string[]; slug: string };

export type OutlineInput = ResearchOutput & { slug: string; topic: string };
export type OutlineOutput = {
  phases: any[];
  factGems: { sourceId: string; text: string }[];
  sources: { id: string; name: string; url: string }[];
};

export type StoryInput = OutlineOutput & { slug: string; topic: string };
export type StoryDraft = { phases: any[]; title: string };

export type IllustratorPromptInput = { slug: string; story: StoryDraft };
export type IllustratorPromptOutput = { prompt: string };

export type SafetyInput = { slug: string; story: StoryDraft };
export type SafetyOutput = { ok: boolean };

export type VerifierInput = { slug: string; story: StoryDraft };
export type VerifierOutput = { verified: boolean };

export type JudgeInput = { slug: string; drafts: StoryDraft[] };
export type JudgeOutput = { chosenIndex: number; scores: number[] };

export type PackagerInput = { slug: string; topic: string; draft: StoryDraft };
export type PackagerOutput = { path: string };
