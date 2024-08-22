import { zodResponseFormat } from "openai/helpers/zod";
import { ChatCompletionMessageParam } from "openai/resources";
import { z } from "zod";
import { createOpenAI } from "@/utils/openai";

interface AgentProps<T> {
  prompt: string;
  messages: ChatCompletionMessageParam[];
  responseSchema?: z.ZodType<T>;
  handleGenerate: (newContent: string) => void;
  model?: string;
  maxTokens?: number;
}

async function agent<T = string>({
  prompt,
  messages,
  responseSchema,
  handleGenerate,
  model = "gpt-4o-mini",
  maxTokens = 4096,
}: AgentProps<T>): Promise<T> {
  const client = createOpenAI();
  const stream = await client.chat.completions.create({
    model: model,
    messages: [{ role: "system", content: prompt }, ...messages],
    max_tokens: maxTokens,
    temperature: 0.2,
    stream: true,
    ...(responseSchema
      ? {
          response_format: zodResponseFormat(responseSchema, "response-format"),
        }
      : {}),
  });

  let resultContent = "";
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || "";
    resultContent += content;
    handleGenerate(content);
  }
  return responseSchema
    ? responseSchema.parse(JSON.parse(resultContent))
    : (resultContent as T);
}

export default agent;
