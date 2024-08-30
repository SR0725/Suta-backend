import updateCodeDocs from "../../repositories/code-docs/update-code-docs";
import { randomUUID } from "crypto";
import * as Y from "yjs";
import { z } from "zod";
import getCodeDocsById from "@/repositories/code-docs/get-code-docs-by-id";
import agent from "./agent";
import yUpsertLLMHistory from "./y-upsert-llm-history";

const nodeName = "initialPurpose";
const promptObject = {
  en: `You need to analyze a piece of code and generate a title and description for its main purpose and functionality.
Follow these steps to complete the task:
1. Carefully read and understand the provided code.
2. Identify the main goal of the code and its primary functions. Consider the design purpose and implementation method.
3. Generate a concise title that summarizes the overall purpose of the code.
4. Write a brief description explaining the main functionality and objectives of the code. Ensure the description is clear and informative.
5. Please use English

Output the title and description in the following JSON format:
"""
{
  "title": "<your generated title>",
  "description": "<your generated description>",
  "language": "<the language of the code, try to use a format recognizable by hljs, such as jsx, glsl, tsx>"
}
"""

Ensure the JSON format is valid and follows the provided structure.`,

  "zh-TW": `你需要分析一段程式碼，並生成該程式碼的主要目標和功能的標題和描述。
按照以下步驟完成任務：
1. 仔細閱讀並理解提供的程式碼。
2. 識別該程式碼的主要目標及其主要功能。思考程式碼的設計目的及其實現方法。
3. 生成一個簡潔的標題，以概括該程式碼的整體目的。
4. 撰寫一個簡短的描述，解釋程式碼的主要功能和目標。確保描述清晰且具說明性。
5. 請使用台灣用語 繁體中文

以以下 JSON 格式輸出標題和描述：
"""
{
  "title": "<你生成的標題>",
  "description": "<你生成的描述>",
  "language": "<程式碼的語言，請盡量使用 hljs 能辨識的寫法，如 jsx、glsl、tsx>"
}
"""

確保 JSON 格式有效，並遵循所提供的結構。`,
};

const responseSchema = z.object({
  title: z.string(),
  description: z.string(),
  language: z.string(),
});

interface CreateInitialPurposeNodeOptions {
  docsId: string;
  code: string;
  yDoc: Y.Doc;
  locale: string;
  apiKey: string;
}

async function createInitialPurposeNode({
  docsId,
  code,
  yDoc,
  locale,
  apiKey,
}: CreateInitialPurposeNodeOptions) {
  const llmHistoryId = randomUUID();
  try {
    // 生成標題和描述
    const response = await agent<z.infer<typeof responseSchema>>({
      prompt: promptObject[locale as "en" | "zh-TW"],
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
          prompt: promptObject[locale as "en" | "zh-TW"],
          input: code,
        });
      },
    });
    // 更新 YJS 資料庫
    const title = yDoc.getText("title");
    const description = yDoc.getText("description");
    const language = yDoc.getText("language");
    title.insert(0, response.title);
    description.insert(0, response.description);
    language.insert(0, response.language.toLowerCase());
    // 完全生成完畢後，更新 CodeDocs 資料庫
    const codeDocs = await getCodeDocsById(docsId);
    if (!codeDocs) {
      throw new Error("CodeDocs not found");
    }
    await updateCodeDocs(docsId, {
      ...codeDocs,
      title: response.title,
      description: response.description,
      language: response.language.toLowerCase(),
      llmHistoryList: [
        ...codeDocs.llmHistoryList,
        {
          id: llmHistoryId,
          nodeType: nodeName,
          response: JSON.stringify(response),
          prompt: promptObject[locale as "en" | "zh-TW"],
          input: code,
        },
      ],
    });

    return response;
  } catch (error) {
    console.error(error);
  }
}

export default createInitialPurposeNode;
