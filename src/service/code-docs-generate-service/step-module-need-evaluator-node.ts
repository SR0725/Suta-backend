import { randomUUID } from "crypto";
import * as Y from "yjs";
import { z } from "zod";
import agent from "./agent";
import getCodeModuleText from "./get-code-module-text";
import yUpsertLLMHistory from "./y-upsert-llm-history";

const nodeName = "stepModuleNeedEvaluator";
export const stepModuleNeedEvaluatorNodePrompt = `
You are a professional software engineer.
Your task is: You will receive a complete code that has been divided into multiple paragraphs.
At the same time, you will also receive a step. Please determine which paragraphs this step will need.
Output all the required paragraphs.

Finally, output in the following JSON format:
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
