import { randomUUID } from "crypto";
import * as Y from "yjs";
import { z } from "zod";
import getCodeDocsById from "@/repositories/code-docs/get-code-docs-by-id";
import updateCodeDocs from "@/repositories/code-docs/update-code-docs";
import agent from "./agent";
import yUpsertLLMHistory from "./y-upsert-llm-history";

const nodeName = "codeSplitToModule";
const prompt = `You are a professional software engineer focused on structuring code.
Your task is to: Split the code into multiple paragraphs and generate a description for each paragraph, reducing the cognitive load for other software engineers.

Paragraph division:
- Each line of code has an encoding; when dividing paragraphs, please directly specify the line code.
- Each paragraph should focus on one main function.
- Can be split based on the logic of functions or classes themselves
- Each part should be limited to 200 lines.
- Review for consistency and accuracy.


Output format:
"""
{
  "codeParagraphs": [
    {
      "title": "<paragraph title>",
      "startLine": <start line number>
    }
  ]
}
"""

Goal: Create clear, accurate structures to enhance understanding.
`;
const responseSchema = z.object({
  codeParagraphs: z.array(
    z.object({
      title: z.string(),
      startLine: z.number(),
    })
  ),
});

interface CodeSplitToModuleNodeOptions {
  docsId: string;
  code: string;
  yDoc: Y.Doc;
}

async function createCodeSplitToModuleNode({
  docsId,
  code,
  yDoc,
}: CodeSplitToModuleNodeOptions) {
  const llmHistoryId = randomUUID();
  try {
    // 生成段落模塊
    const response = await agent<z.infer<typeof responseSchema>>({
      prompt,
      responseSchema,
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
      },
    });

    // 完全生成完畢後，更新 CodeDocs 資料庫
    const codeDocs = await getCodeDocsById(docsId);
    if (!codeDocs) {
      throw new Error("CodeDocs not found");
    }
    await updateCodeDocs(docsId, {
      ...codeDocs,
      llmHistoryList: [
        ...codeDocs.llmHistoryList,
        {
          id: llmHistoryId,
          nodeType: nodeName,
          response: JSON.stringify(response),
          prompt,
          input: code,
        },
      ],
    });

    return response;
  } catch (error) {
    console.error(error);
  }
}

export default createCodeSplitToModuleNode;
