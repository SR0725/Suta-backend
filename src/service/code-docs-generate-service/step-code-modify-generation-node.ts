import { randomUUID } from "crypto";
import { diffLines } from "diff";
import * as Y from "yjs";
import { z } from "zod";
import { CodeLine } from "@/models/code-docs";
import agent from "./agent";
import getCodeModuleText from "./get-code-module-text";
import yUpsertLLMHistory from "./y-upsert-llm-history";

const nodeName = "stepCodeModifyGeneration";
const stepCodeModifyGenerationNodePrompt = `您是一位專業的軟體工程師，專注於結構化程式教學。
你的任務是：你將取得一個完整的程式碼，該程式碼已經被切割成多個段落
以及當前用戶已經習得的程式碼
同時你也會拿到一個步驟指引
你需要根據步驟指引，撰寫出用戶本步驟理解完畢後的程式碼

請遵守以下規則：
1. 生成的程式碼完全遵守步驟指引
2. 程式不超出步驟指引的範圍
3. 應當只聚焦在一個重點上，並且將邏輯與畫面分離
4. 當同時有邏輯、畫面的程式需要理解，只撰寫邏輯得部分
5. 切勿同時撰寫邏輯與畫面
6. 程式碼只能取用所給予的段落

另外請撰寫這個步驟的指導與教學
1. 請需要針對有修改的程式碼做教學與解釋
2. 教學應當簡單易懂，善用譬喻，想像你在對高中生解釋一般
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
"""
記住，你的目標是撰寫出用戶本步驟理解完畢後的程式碼
`;

export const requestPromptTemplate = (
  fullCode: string,
  codeParagraphs: {
    startLine: number;
    title: string;
  }[],
  usedCodeParagraphNumbers: number[],
  currentCode: string,
  stepInstruction: string,
  nextStepInstruction: string
) => {
  const usedCodeParagraphs = codeParagraphs.filter((paragraph, index) =>
    usedCodeParagraphNumbers.includes(index)
  );

  const codeText = getCodeModuleText(fullCode, usedCodeParagraphs);

  return `
以下是本步驟指引，請務必遵循
不要做出任何超出指引範圍的修改
<step_instruction>
${stepInstruction}
</step_instruction>

以下是下一步驟的方向，僅供程式架構設計參考
切勿在本步驟套用該方向
<next_step_instruction>
${nextStepInstruction}
</next_step_instruction>

以下是目標程式碼的部分模塊，當中已經包含了你需要的部分
<code> 
${codeText}
</code>

以下是用戶已經學會的程式碼：
<current_code>
${currentCode}
</current_code>

你是在用戶已經學會的程式碼的基礎上，撰寫出用戶本步驟理解完畢後的程式碼
所以記得將用戶已經學會的程式碼，也一併寫入
目標程式碼可能並不完整，但這無妨，你只需要專注於本步驟的程式碼即可
`;
};

const responseSchema = z.object({
  code: z.string(),
  explanation: z.string(),
  conclusion: z.string().optional(),
});

interface StepCodeModifyGenerationOptions {
  yDoc: Y.Doc;
  codeParagraphs: {
    startLine: number;
    title: string;
  }[];
  fullCode: string;
  usedCodeParagraphNumbers: number[];
  currentCode: string;
  stepInstruction: string;
  nextStepInstruction: string;
  isLastStep: boolean;
  stepIndex: number;
}

async function createStepCodeModifyGenerationNode({
  yDoc,
  codeParagraphs,
  fullCode,
  usedCodeParagraphNumbers,
  currentCode,
  stepInstruction,
  nextStepInstruction,
  isLastStep,
  stepIndex,
}: StepCodeModifyGenerationOptions) {
  try {
    const llmHistoryId = randomUUID();

    const input = requestPromptTemplate(
      fullCode,
      codeParagraphs,
      usedCodeParagraphNumbers,
      currentCode,
      stepInstruction,
      nextStepInstruction
    );
    const response = await agent<z.infer<typeof responseSchema>>({
      prompt: stepCodeModifyGenerationNodePrompt,
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
