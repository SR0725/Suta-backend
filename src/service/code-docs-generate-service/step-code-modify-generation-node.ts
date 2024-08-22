import { randomUUID } from "crypto";
import { diffLines } from "diff";
import * as Y from "yjs";
import { z } from "zod";
import { CodeLine } from "@/models/code-docs";
import agent from "./agent";
import yUpsertLLMHistory from "./y-upsert-llm-history";

const nodeName = "stepCodeModifyGeneration";
const prompt = `你是一個程式碼工程師
你將被授予完整的目標程式碼，以及目前你已經寫的程式碼。
你同時也會拿到一個程式碼修改指南
你需要根據修改指南，修改當前進度的程式碼，最終使其趨近於完整程式碼
請遵守以下規則：
1. 請只做出修改指南提到的修改
2. 程式碼的使用上，請盡量遵循目標程式碼
3. 確保生成的代碼在語法上正確，並符合修改指南需求。
4. 最後以以下 JSON 格式輸出
"""
{
  "code": "<程式碼>"
}
"""`;

const requestPromptTemplate = (
  fullCode: string,
  currentCode: string,
  stepInstruction: string,
  nextStepDirection: string
) => {
  return `以下是完整的目標程式碼：
<complete_code> 
${fullCode}
</complete_code>

以下是當前進度：
<current_progress> 
${currentCode}
</current_progress>

以下是本步驟的修改指南：
<step_guide> 
${stepInstruction}
</step_guide>

以下是下一步驟的參考，請注意，這個指南僅供下一步使用
僅供架構設計參考用，請不要將這個指南用於本步驟的修改
<next_step_direction> 
${nextStepDirection}
</next_step_direction>
  `;
};

const responseSchema = z.object({
  code: z.string(),
});

interface StepCodeModifyGenerationOptions {
  yDoc: Y.Doc;
  fullCode: string;
  currentCode: string;
  stepInstruction: string;
  nextStepDirection: string;
  stepIndex: number;
}

async function createStepCodeModifyGenerationNode({
  yDoc,
  fullCode,
  currentCode,
  stepInstruction,
  nextStepDirection,
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
      newCode: newCode,
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

export default createStepCodeModifyGenerationNode;
