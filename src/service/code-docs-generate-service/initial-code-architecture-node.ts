import updateCodeDocs from "../../repositories/code-docs/update-code-docs";
import { randomUUID } from "crypto";
import * as Y from "yjs";
import { z } from "zod";
import { CodeStepCard } from "@/models/code-docs";
import getCodeDocsById from "@/repositories/code-docs/get-code-docs-by-id";
import agent from "./agent";
import YPushCard from "./y-push-card";
import yUpsertLLMHistory from "./y-upsert-llm-history";

const nodeName = "initialCodeArchitecture";

const prompt = `You are an AI assistant designed to help teach programming. Your task is to create a clean, minimal starting point for the given code. This starting point will serve as the foundation for a step-by-step programming tutorial.

Your goal is to generate an initial framework for this code. This framework should be:
1. Executable (should run without errors)
2. As clean and minimal as possible
3. Without any specific functionality
4. Without special imports or function declarations
5. Containing only the essential elements necessary for a starting point

Follow these steps to create the initial framework:
1. Identify the basic structure of the code (e.g., whether it's a function, class, or script).
2. Remove all specific functionality, keeping only the most basic structure.
3. Remove all imports except those that are absolutely necessary (if any).
4. Remove all function and variable declarations, keeping only the main entry point (if applicable).
5. If there's a main function or entry point, keep its declaration but delete its contents.
6. Ensure the generated code is still syntactically correct and can be executed without errors.
7. Finally, output in the following JSON format:
"""
{
  "code": "<code>"
}
"""
Remember, the goal is to provide the simplest starting point possible for beginners to build upon and eventually create the complete code.`;
const responseSchema = z.object({
  code: z.string(),
});

interface CreateInitialCodeArchitectureNodeOptions {
  docsId: string;
  code: string;
  yDoc: Y.Doc;
  locale: "zh-TW" | "en";
  apiKey: string;
}

async function createInitialCodeArchitectureNode({
  docsId,
  code,
  yDoc,
  locale,
  apiKey,
}: CreateInitialCodeArchitectureNodeOptions) {
  const llmHistoryId = randomUUID();
  const cardId = randomUUID();
  try {
    // 生成標題和描述
    const response = await agent<z.infer<typeof responseSchema>>({
      prompt,
      responseSchema,
      apiKey,
      messages: [
        {
          role: "user",
          content: code,
        },
      ],
      handleGenerate: (newContent) => {
        yUpsertLLMHistory({
          yDoc,
          nodeType: nodeName,
          llmHistoryId,
          newContent,
          prompt,
          input: code,
        });
        const yText = yDoc.getText(nodeName);
        yText.insert(yText.length, newContent);
      },
    });

    // 完成後，更新 ydoc 的 card
    const card: CodeStepCard = {
      type: "codeStep",
      id: cardId,
      stepIndex: 0,
      description:
        locale === "zh-TW" ? "初始程式碼架構" : "Initial code architecture",
      conclusion: "",
      codeLines: response.code.split("\n").map((line) => ({
        text: line,
      })),
      preview: null,
    };

    YPushCard({
      yDoc,
      card,
    });
    // 完全生成完畢後，更新 CodeDocs 資料庫
    const codeDocs = await getCodeDocsById(docsId);
    if (!codeDocs) {
      throw new Error("CodeDocs not found");
    }
    await updateCodeDocs(docsId, {
      ...codeDocs,
      cards: [card],
      llmHistoryList: [
        ...codeDocs.llmHistoryList,
        {
          id: llmHistoryId,
          nodeType: nodeName,
          response: JSON.stringify(response),
          targetCardId: cardId,
          prompt,
          input: code,
        },
      ],
    });

    return response.code;
  } catch (error) {
    console.error(error);
  }
}

export default createInitialCodeArchitectureNode;
