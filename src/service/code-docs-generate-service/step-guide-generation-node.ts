import { randomUUID } from "crypto";
import * as Y from "yjs";
import { z } from "zod";
import agent from "./agent";
import yUpsertLLMHistory from "./y-upsert-llm-history";

const nodeName = "stepGuideGeneration";
const prompt = `你是一个 AI 程式設計導師，旨在一步步地指導使用者學習編程。你的任務是分析完整目標代碼與當前進度之間的差異，然後提供用戶應該採取的下一步邏輯步驟。
分析完整代碼與當前進度之間的差異。確定用戶應該採取的下一步邏輯步驟，以便更接近完整代碼。此步驟應該是：
1. 清晰且具體
2. 能夠在一次迭代中完成
3. 修改的代碼行數不超過 20 行

在提供下一步時，請遵循以下指導方針：
1. 一次專注於一個概念或功能
2. 提供此步驟的重要性簡短解釋
3. 如果介紹新的編程概念，請簡要說明
4. 避免給出整個解決方案
5. 如果此為整個教學的最終一步，請填入 isLastStep: true
最後以以下 JSON 格式輸出
"""
{
  "isLastStep"?: Boolean,
  "instruction": "<給出清晰、簡明的指示，告訴使用者接下來應該做什麼。字數盡量在 100 字內",
  "explanation": "<提供下一步的簡短解釋以及其重要性。>"
}
"""
請記住，你的目標是引導使用者通過學習過程，而不是簡單地提供完整的解決方案。鼓勵理解和逐步進展，而不是僅僅複製。`;

const requestPromptTemplate = (
  fullCode: string,
  currentCode: string,
  lastStepInstruction: string
) => {
  return `以下是使用者正在努力實現的完整代碼：
<complete_code> 
${fullCode}
</complete_code>

以下是使用者代碼的當前進度：
<current_progress> 
${currentCode}
</current_progress>

以下是使用者上一步的指示：
<last_step_guide> 
${lastStepInstruction}
</last_step_guide>
  `;
};

const responseSchema = z.object({
  isLastStep: z.boolean().optional(),
  instruction: z.string(),
  explanation: z.string(),
});

interface StepGuideGenerationOptions {
  yDoc: Y.Doc;
  fullCode: string;
  currentCode: string;
  lastStepInstruction: string;
}

async function createStepGuideGenerationNode({
  yDoc,
  fullCode,
  currentCode,
  lastStepInstruction,
}: StepGuideGenerationOptions) {
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
            lastStepInstruction
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

    return {
      response,
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

export default createStepGuideGenerationNode;
