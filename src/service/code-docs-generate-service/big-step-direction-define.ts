import { randomUUID } from "crypto";
import * as Y from "yjs";
import { z } from "zod";
import getCodeDocsById from "@/repositories/code-docs/get-code-docs-by-id";
import updateCodeDocs from "@/repositories/code-docs/update-code-docs";
import agent from "./agent";
import yUpsertLLMHistory from "./y-upsert-llm-history";

const nodeName = "bigStepDirectionDefine";
const prompt = `
你是一个專業的程式導師，精通於如何指導學生一步一步理解整個程式碼
你的任務是：將程式碼拆分成多個大步驟，降低學生的理解負擔

你將收到一個已經初步切割成多個段落的程式碼

步驟劃分：
1. 將程式從開始到結束的主要過程按功能或邏輯階段切割成幾個部分，例如初始化、數據處理、主邏輯運行、輸出結果、結束程序等。
2. 從高層次逐漸細化成低層次，例如在初始化階段可能包括配置文件加載、變量初始化、外部依賴檢查等。
3. 確定哪些是數據的處理流（資料流）和哪些是控制流程（控制流）。資料流專注於數據的傳遞與轉換，控制流專注於程式邏輯的分支與決策。
4. 流程應明確描述程式中的循環和條件判斷邏輯。循環用於處理重複性的操作，條件判斷用於決策。
5. 每個流程應明確描述其所需的輸入和輸出，包括數據、狀態或事件等。
6. 在流程圖中用清晰的線條或符號標示模組之間的接口，並描述接口的作用和交互數據。
7. 將並行操作和異步操作分開展示，並描述其同步點和相互影響的部分。
8. 請生成一個簡單的編號列表，直接列出所有項目，不需要任何層次關係。項目應按序號排列，如下所示：
["1. 項目一",
"2. 項目二",
"3. 項目三",
"4. 項目四",
"5. 項目五"]

根據上述，將程式碼切割成多個大步驟
輸出格式：
"""
{
  "instructions": ["<步驟說明>"],
}
"""

目標：創建清晰、準確的流程，讓用戶能一步一步寫出整個程式碼
`;

const responseSchema = z.object({
  instructions: z.array(z.string()),
});

interface BigStepDirectionDefineNodeOptions {
  docsId: string;
  codeModuleText: string;
  yDoc: Y.Doc;
}

async function createBigStepDirectionDefineNode({
  docsId,
  codeModuleText,
  yDoc,
}: BigStepDirectionDefineNodeOptions) {
  try {
    const llmHistoryId = randomUUID();
    // 生成段落模塊
    const response = await agent<z.infer<typeof responseSchema>>({
      prompt,
      responseSchema,
      messages: [
        {
          role: "user",
          content: codeModuleText,
        },
      ],
      handleGenerate: (newContent) => {
        yUpsertLLMHistory({
          yDoc,
          nodeType: nodeName,
          llmHistoryId,
          newContent,
          prompt,
          input: codeModuleText,
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
          input: codeModuleText,
        },
      ],
    });

    return response;
  } catch (error) {
    console.error(error);
  }
}

export default createBigStepDirectionDefineNode;
