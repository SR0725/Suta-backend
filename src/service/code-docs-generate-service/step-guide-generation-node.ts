import { randomUUID } from "crypto";
import * as Y from "yjs";
import { z } from "zod";
import agent from "./agent";
import yUpsertLLMHistory from "./y-upsert-llm-history";

const nodeName = "stepGuideGeneration";
const prompt = `
你是一个 AI 程式設計導師，旨在一步步地指導使用者學習程式。
你將被授予完整的目標程式碼，以及使用者目前的進度。
你的目的是指導用戶完成目標程式碼，你需要給予一個明確的指導方針來告知用戶該怎麼修改
也就是下一步該怎麼走，以便更接近完整代碼，此步驟應該是：
1. 清晰且具體
2. 能夠在一次迭代中完成
3. 每一步只專注於一個概念或功能
4. 修改的程式碼行數不超過 20 行
5. 如果剩餘的部分已經相差不大，請直接結束

基於上述任務，請反饋以下：
1. 請提供此步驟的具體解決項目
2. 最後請判定此是否已完成目標
3. 所有的技術名詞僅使用台灣用語 繁體中文

另外為了方便程式架構的設計，請順便指出下一步驟的大概修改方向
指出在本步驟完成後，下一步驟應該怎麼修改


最後以以下 JSON 格式輸出
"""
{
  "instruction": "<給出清晰、簡明的指示，告訴使用者接下來應該做什麼。",
  "nextStepDirection": "<下一步的修改方向，僅供程式架構設計參考>",
  "isLastStep"?: <請判定此是否已完成目標，應當填入 true 或 false>
}
"""

請記住，你的目標是引導使用者通過學習過程。鼓勵理解和逐步進展目標程式碼。
請不要給予任何超出目標的指示，如果已經完成目標，請直接結束
`;

const requestPromptTemplate = (
  fullCode: string,
  currentCode: string,
  lastStepInstruction: string,
  nextStepDirection: string
) => {
  return `以下是使用者正在努力實現的完整代碼：
<complete_code> 
${fullCode}
</complete_code>

以下是使用者代碼的當前進度：
<current_progress> 
${currentCode}
</current_progress>

${
  lastStepInstruction &&
  `以下是使用者上一步所被指引的指示：
<last_step_guide> 
${lastStepInstruction}
</last_step_guide>`
}

${
  nextStepDirection &&
  `這個本步驟的大致修改方向
你可以參考這個方向，撰寫完整的修改方式
<next_step_direction> 
${nextStepDirection}
</next_step_direction>`
}`;
};

const responseSchema = z.object({
  isLastStep: z.boolean().optional(),
  instruction: z.string(),
  nextStepDirection: z.string(),
});

interface StepGuideGenerationOptions {
  yDoc: Y.Doc;
  fullCode: string;
  currentCode: string;
  lastStepInstruction: string;
  nextStepDirection: string;
  stepIndex: number;
}

async function createStepGuideGenerationNode({
  yDoc,
  fullCode,
  currentCode,
  lastStepInstruction,
  nextStepDirection,
  stepIndex,
}: StepGuideGenerationOptions) {
  try {
    const llmHistoryId = randomUUID();
    const input = requestPromptTemplate(
      fullCode,
      currentCode,
      lastStepInstruction,
      nextStepDirection
    );
    // 生成標題和描述
    const response = await agent<z.infer<typeof responseSchema>>({
      prompt,
      responseSchema,
      messages: [
        {
          role: "user",
          content: input,
        },
      ],
      handleGenerate: (newContent) => {
        yUpsertLLMHistory({
          yDoc,
          nodeType: nodeName,
          llmHistoryId,
          newContent,
          prompt,
          input,
          stepIndex,
        });
      },
    });

    return {
      response,

      llmHistory: {
        id: llmHistoryId,
        nodeType: nodeName,
        response: JSON.stringify(response),
        prompt,
        input,
        stepIndex,
      },
    };
  } catch (error) {
    console.error(error);
  }
}

export default createStepGuideGenerationNode;
