import updateCodeDocs from "../../repositories/code-docs/update-code-docs";
import { randomUUID } from "crypto";
import * as Y from "yjs";
import { z } from "zod";
import getCodeDocsById from "@/repositories/code-docs/get-code-docs-by-id";
import agent from "./agent";
import yUpsertLLMHistory from "./y-upsert-llm-history";

const nodeName = "initialPurpose";
const prompt = `你需要分析一段程式碼，並生成該程式碼的主要目標和功能的標題和描述。
按照以下步驟完成任務：
1. 仔細閱讀並理解提供在 CODE 標籤中的程式碼。
2. 識別該程式碼的主要目標及其主要功能。思考程式碼的設計目的及其實現方法。
3. 生成一個簡潔的標題，以概括該程式碼的整體目的。
4. 撰寫一個簡短的描述，解釋程式碼的主要功能和目標。確保描述清晰且具說明性。
5. 請使用台灣用語 繁體中文

以以下 JSON 格式輸出標題和描述：
"""
{
  "title": "<你生成的標題>",
  "description": "<你生成的描述>",
  "language": "<程式碼的語言>"
}
"""

確保 JSON 格式有效，並遵循所提供的結構。`;

const responseSchema = z.object({
  title: z.string(),
  description: z.string(),
  language: z.string(),
});

interface CreateInitialPurposeNodeOptions {
  docsId: string;
  code: string;
  yDoc: Y.Doc;
}

async function createInitialPurposeNode({
  docsId,
  code,
  yDoc,
}: CreateInitialPurposeNodeOptions) {
  const llmHistoryId = randomUUID();
  try {
    // 生成標題和描述
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
      title: response.title,
      description: response.description,
      language: response.language,
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
  } catch (error) {
    console.error(error);
  }
}

export default createInitialPurposeNode;
