import Groq from "groq-sdk";

const MODEL_ID = "llama-3.3-70b-versatile";
const MAX_TOKENS = 500;

let client: Groq | null = null;

function getClient(): Groq {
  if (!client) {
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}

export async function generateSummary(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const groq = getClient();

  const response = await groq.chat.completions.create({
    model: MODEL_ID,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content ?? "";
}
