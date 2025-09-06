import { callResponse } from "../../lib/ai/openai";

async function main() {
  const res = await callResponse({
    instructions: "You are a friendly assistant who replies with a short greeting.",
    input: "Say hi to CurioQuest",
    temperature: 0.2,
  });
  console.log(res.text);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
