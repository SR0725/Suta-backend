import { randomUUID } from "crypto";
import { diffLines } from "diff";
import * as Y from "yjs";
import { z } from "zod";
import { CodeLine } from "@/models/code-docs";
import agent from "./agent";
import {
  requestPromptTemplate,
  stepGuideGenerationNodePrompt,
} from "./step-guide-generation-node";
import yUpsertLLMHistory from "./y-upsert-llm-history";

const nodeName = "stepCodeModifyGeneration";
const stepCodeModifyGenerationNodePrompt = `
你是一个程式導師，旨在一步步地指導使用者學習程式。
你現在要根據剛剛討論出來的結果
撰寫用戶學習完畢本步驟後，其程式碼應該呈現的樣子
請遵守以下規則：
1. 確保生成的程式碼僅包含本步驟的修改
2. 確保生成的程式碼在語法上正確

另外請撰寫這個步驟的指導與教學
1. 請需要針對有修改的程式碼做教學與解釋
2. 教學應當簡單易懂，善用譬喻，想像你在對國中生解釋一般
3. 盡量簡潔、直接，限制在 100 字內

以及視情況生成一個步驟結語
1. 只有在下一步驟與本步驟的程式碼差異較大時，才需要撰寫結語
2. 結語應當簡單易懂，善用譬喻，想像你在對國中生解釋一般
3. 盡量簡潔、直接，限制在 100 字內
4. 通常情況，不需要生成結語

最後以以下 JSON 格式輸出
"""
{
  "code": "<程式碼>",
  "explanation": "<本步驟的指導與教學，可以使用 markdown 格式>",
  "conclusion": "<本步驟的結語，可以使用 markdown 格式>"
}
"""`;

const responseSchema = z.object({
  code: z.string(),
  explanation: z.string(),
  conclusion: z.string().optional(),
});

interface StepCodeModifyGenerationOptions {
  yDoc: Y.Doc;
  fullCode: string;
  currentCode: string;
  stepInstruction: string;
  nextStepDirection: string;
  isLastStep: boolean;
  stepIndex: number;
}

async function createStepCodeModifyGenerationNode({
  yDoc,
  fullCode,
  currentCode,
  stepInstruction,
  nextStepDirection,
  isLastStep,
  stepIndex,
}: StepCodeModifyGenerationOptions) {
  try {
    const llmHistoryId = randomUUID();
    const input = requestPromptTemplate(
      fullCode,
      currentCode,
      stepInstruction,
      nextStepDirection
    );
    // 生成標題和描述
    const response = await agent<z.infer<typeof responseSchema>>({
      prompt: stepGuideGenerationNodePrompt,
      responseSchema,
      messages: [
        {
          role: "user",
          content: input,
        },
        {
          role: "assistant",
          content: `本步驟指引：${stepInstruction}`,
        },
        {
          role: "user",
          content: stepCodeModifyGenerationNodePrompt,
        },
      ],
      handleGenerate: (newContent) => {
        yUpsertLLMHistory({
          yDoc,
          nodeType: nodeName,
          llmHistoryId,
          newContent,
          prompt: stepCodeModifyGenerationNodePrompt,
          input,
          stepIndex,
        });
      },
    });

    const newCode = response.code;
    const differences = diffLines(currentCode, newCode);

    const newCodeLines = differences.reduce((acc, diff) => {
      acc.push(
        ...diff.value.split("\n").map((line) => ({
          text: line,
          added: diff.added,
          removed: diff.removed,
        }))
      );
      return acc;
    }, [] as CodeLine[]);

    return {
      newCodeLines,
      newCode: isLastStep ? fullCode : newCode,
      explanation: response.explanation,
      conclusion: response.conclusion,
      llmHistory: {
        id: llmHistoryId,
        nodeType: nodeName,
        response: JSON.stringify(response),
        prompt: stepCodeModifyGenerationNodePrompt,
        input,
        stepIndex,
      },
    };
  } catch (error) {
    console.error(error);
  }
}

export default createStepCodeModifyGenerationNode;
