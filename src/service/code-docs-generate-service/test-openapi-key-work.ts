import agent from "./agent";

async function testOpenAiApiKeyWork(apiKey: string) {
  const response = await agent<string>({
    prompt: "",
    apiKey,
    messages: [
      {
        role: "user",
        content: "just say ok",
      },
    ],
  });
  return response;
}

export default testOpenAiApiKeyWork;
