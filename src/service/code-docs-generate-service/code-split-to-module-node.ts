import { randomUUID } from "crypto";
import * as Y from "yjs";
import { z } from "zod";
import getCodeDocsById from "@/repositories/code-docs/get-code-docs-by-id";
import updateCodeDocs from "@/repositories/code-docs/update-code-docs";
import agent from "./agent";
import yUpsertLLMHistory from "./y-upsert-llm-history";

const nodeName = "codeSplitToModule";
const prompt = `您是一位專業的軟體工程師，專注於結構化程式碼。
你的任務是：將程式碼拆分成多個段落，並且生成每個段落的說明，降低其他軟體工程師的理解負擔。

段落劃分：
- 程式碼的每一行都有編碼；在劃分段落時，請直接指明行代碼。
- 每個段落應專注於一個主要功能。
- 可以根據本身函數、類別的邏輯做切割
- 每一部分應該限制在 200 行內。
- 審查一致性和準確性。


輸出格式：
"""
{
  "codeParagraphs": [
    {
      "title": "<段落標題>",
      "startLine": <開始行數>
    }
  ]
}
"""

目標：創建清晰、準確的結構以增強理解。
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
