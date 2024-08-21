import { randomUUID } from "crypto";
import * as Y from "yjs";
import { z } from "zod";
import { LLMHistory } from "@/models/code-docs";
import agent from "./agent";
import applyCodeModify from "./apply-code-modify";
import yUpsertLLMHistory from "./y-upsert-llm-history";

const nodeName = "stepCodeModifyGeneration";
const prompt = `您是一名 AI 編程導師，旨在逐步指導用戶學習編程。您的任務是分析完整代碼（學習目標）和當前進度之間的差異，然後根據給定的指南提供下一步的修改指示。
分析完整代碼和當前進度之間的差異。重點是根據修改指南實施下一步所需的變更。
根據您的分析，創建一個 JSON 響應，指定要添加、修改或刪除的代碼。響應應遵循以下結構：
"""
{
  "addCodes": [{
    "insertAfter": number,
    "code": "string"
  }],
  "modifyCodes": [{
    "modifyStartLine": number,
    "modifyEndLine": number,
    "code": "string"
  }]
}
"""
其中：
"addCodes" 指定了要在特定行號後插入的新代碼。
"modifyCodes" 指定了要修改的代碼，包括修改的起始行號和結束行號以及要替換的新增代碼。
確保您的修改：
1. 完全符合修改指南中的要求。
2. 參考完整代碼以保持一致性，避免編造不存在的代碼。
3. 只進行必要的更改以從當前狀態過渡到下一步。
4. 保持現有代碼的整體結構和風格。
如果某個類別（addCodes 或 modifyCodes）不需要修改，請為該類別包含一個空數組

`;

const requestPromptTemplate = (
  fullCode: string,
  currentCode: string,
  stepInstruction: string
) => {
  return `以下是使用者正在努力實現的完整代碼：
<complete_code> 
${fullCode
  .split("\n")
  .map((line, index) => `${index + 1}. ${line}`)
  .join("\n")}
</complete_code>

以下是使用者代碼的當前進度：
<current_progress> 
${currentCode
  .split("\n")
  .map((line, index) => `${index + 1}. ${line}`)
  .join("\n")}
</current_progress>

以下是本步驟的修改指南：
<last_step_guide> 
${stepInstruction}
</last_step_guide>
  `;
};

const responseSchema = z.object({
  addCodes: z.array(
    z.object({
      insertAfter: z.number(),
      code: z.string(),
    })
  ),
  modifyCodes: z.array(
    z.object({
      modifyStartLine: z.number(),
      modifyEndLine: z.number(),
      code: z.string(),
    })
  ),
});

interface StepCodeModifyGenerationOptions {
  yDoc: Y.Doc;
  fullCode: string;
  currentCode: string;
  stepInstruction: string;
}

async function createStepCodeModifyGenerationNode({
  yDoc,
  fullCode,
  currentCode,
  stepInstruction,
}: StepCodeModifyGenerationOptions) {
  try {
    const llmHistoryId = randomUUID();
    // 生成標題和描述
    const response = await agent<z.infer<typeof responseSchema>>({
      prompt,
      responseSchema,
      messages: [
        {
          role: "user",
          content: requestPromptTemplate(
            fullCode,
            currentCode,
            stepInstruction
          ),
        },
      ],
      handleGenerate: (newContent) => {
        yUpsertLLMHistory({
          yDoc,
          nodeType: nodeName,
          llmHistoryId,
          newContent,
        });
      },
    });

    const newCodeLines = applyCodeModify(currentCode, response);
    return {
      newCodeLines,
      llmHistory: {
        id: llmHistoryId,
        nodeType: nodeName,
        response: JSON.stringify(response),
      },
    };
  } catch (error) {
    console.error(error);
  }
}

export default createStepCodeModifyGenerationNode;
