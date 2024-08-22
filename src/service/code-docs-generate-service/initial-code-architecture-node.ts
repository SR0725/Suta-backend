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

const prompt = `你是一個旨在幫助教授編程的AI助手。你的任務是為給定的代碼創建一個乾淨、最小的起始點。這個起始點將作為逐步編程教程的基礎。
你的目標是為這段代碼生成一個初始框架。這個框架應該是：
1. 可執行的（應能在沒有錯誤的情況下運行）
2. 儘可能乾淨和最小
3. 沒有任何特定功能
4. 無需特殊的導入或函數聲明
5. 只包含作為起始點所必需的基本內容

按照以下步驟創建初始框架：
1. 確定代碼的基本結構（例如，是否是函數、類還是腳本）。
2. 移除所有特定功能，只保留最基本的結構。
3. 移除所有導入，除了絕對必要的（如果有的話）。
4. 移除所有函數和變量聲明，僅保留主要入口點（如果適用）。
5. 如果有主函數或入口點，保留其聲明但刪除內容。
6. 確保生成的代碼在語法上仍然正確，並且可以在沒有錯誤的情況下執行。
7. 最後以以下 JSON 格式輸出
"""
{
  "code": "<程式碼>"
}
"""
記住，目標是提供一個最簡單的起始點，以便初學者可以在此基礎上構建，最終創建完整代碼。`;

const responseSchema = z.object({
  code: z.string(),
});

interface CreateInitialCodeArchitectureNodeOptions {
  docsId: string;
  code: string;
  yDoc: Y.Doc;
}

async function createInitialCodeArchitectureNode({
  docsId,
  code,
  yDoc,
}: CreateInitialCodeArchitectureNodeOptions) {
  const llmHistoryId = randomUUID();
  const cardId = randomUUID();
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
        const yText = yDoc.getText(nodeName);
        yText.insert(yText.length, newContent);
      },
    });

    // 完成後，更新 ydoc 的 card
    const card: CodeStepCard = {
      type: "codeStep",
      id: cardId,
      stepIndex: 0,
      description: "初始程式碼架構",
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
