import { randomUUID } from "crypto";
import * as Y from "yjs";
import { z } from "zod";
import agent from "./agent";
import getCodeModuleText from "./get-code-module-text";
import yUpsertLLMHistory from "./y-upsert-llm-history";

const nodeName = "stepModuleNeedEvaluator";
export const stepModuleNeedEvaluatorNodePrompt = `
您是一位專業的軟體工程師。
你的任務是：你會獲得到一個完整的程式碼，該程式碼已經被切割成多個段落
同時你也會拿到一個步驟，請判斷該步驟會需要哪些段落
將所有需要的段落輸出

最後以以下 JSON 格式輸出
"""
{
  "usedCodeParagraphNumbers": number[]
}
"""
`;

const responseSchema = z.object({
  usedCodeParagraphNumbers: z.array(z.number()),
});

interface stepModuleNeedEvaluatorOptions {
  yDoc: Y.Doc;
  stepIndex: number;
  codeParagraphs: {
    title: string;
    startLine: number;
  }[];
  fullCode: string;
  stepInstruction: string;
}

async function createStepModuleNeedEvaluatorNode({
  yDoc,
  codeParagraphs,
  fullCode,
  stepInstruction,
  stepIndex,
}: stepModuleNeedEvaluatorOptions) {
  try {
    const llmHistoryId = randomUUID();
    const codeParagraphText = getCodeModuleText(fullCode, codeParagraphs);
    const input = `程式碼：${codeParagraphText}\n步驟方向：${stepInstruction}`;
    // 生成標題和描述
    const response = await agent<z.infer<typeof responseSchema>>({
      prompt: stepModuleNeedEvaluatorNodePrompt,
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
          prompt: stepModuleNeedEvaluatorNodePrompt,
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
        prompt: stepModuleNeedEvaluatorNodePrompt,
        input,
        stepIndex,
      },
    };
  } catch (error) {
    console.error(error);
  }
}

export default createStepModuleNeedEvaluatorNode;
