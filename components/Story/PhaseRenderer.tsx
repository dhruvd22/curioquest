import Hook from "../Phase/Hook";
import Orientation from "../Phase/Orientation";
import Discovery from "../Phase/Discovery";
import WowPanel from "../Phase/WowPanel";
import FactGems from "../Phase/FactGems";
import MiniQuiz from "../Phase/MiniQuiz";
import Imagine from "../Phase/Imagine";
import Wrap from "../Phase/Wrap";

export type Phase =
  | { type: "hook"; heading: string; body: string }
  | { type: "orientation"; heading: string; body: string }
  | { type: "discovery"; heading: string; body: string }
  | { type: "wow-panel"; heading: string; body: string }
  | { type: "fact-gems"; items: { sourceId: string; text: string }[] }
  | { type: "mini-quiz"; items: { q: string; choices: string[]; answer: number }[] }
  | { type: "imagine"; prompt: string }
  | { type: "wrap"; keyTakeaways: string[] };

export default function PhaseRenderer({ phase }: { phase: Phase }) {
  switch (phase.type) {
    case "hook":
      return <Hook {...phase} />;
    case "orientation":
      return <Orientation {...phase} />;
    case "discovery":
      return <Discovery {...phase} />;
    case "wow-panel":
      return <WowPanel {...phase} />;
    case "fact-gems":
      return <FactGems {...phase} />;
    case "mini-quiz":
      return <MiniQuiz {...phase} />;
    case "imagine":
      return <Imagine {...phase} />;
    case "wrap":
      return <Wrap {...phase} />;
    default:
      return null;
  }
}
