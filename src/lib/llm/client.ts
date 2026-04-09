import Anthropic from "@anthropic-ai/sdk";

const MODEL_ID = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 500;

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export async function generateSummary(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const anthropic = getClient();

  const response = await anthropic.messages.create({
    model: MODEL_ID,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock?.text ?? "";
}
