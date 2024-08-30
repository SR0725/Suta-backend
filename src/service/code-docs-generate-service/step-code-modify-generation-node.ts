import { randomUUID } from "crypto";
import { diffLines } from "diff";
import * as Y from "yjs";
import { z } from "zod";
import { CodeLine } from "@/models/code-docs";
import agent from "./agent";
import getCodeModuleText from "./get-code-module-text";
import yUpsertLLMHistory from "./y-upsert-llm-history";

const nodeName = "stepCodeModifyGeneration";
const prompt = {
  en: `You are a professional software engineer, focused on structured programming education.
Your task is: you will receive a complete code that has been divided into multiple paragraphs,
as well as the code that the current user has already learned.
You will also receive step-by-step instructions.
You need to write the code that the user will understand after completing this step, based on the step instructions.

Please follow these rules:
1. The generated code fully complies with the step instructions
2. The program does not exceed the scope of the step instructions
3. It should focus on only one key point, and separate logic from presentation
4. When both logic and presentation need to be understood, only write the logical part
5. Never write logic and presentation simultaneously
6. The code can only use the given paragraphs

Additionally, please write guidance and instructions for this step
1. Please provide teaching and explanations for the modified code
2. The instructions should be simple and easy to understand, use analogies, imagine you're explaining to a high school student
3. Try to be concise and direct, limit it to 100 words

And generate a step conclusion if necessary
1. Only write a conclusion if the next step differs significantly from this step's code
2. The conclusion should be simple and easy to understand, use analogies, imagine you're explaining to a middle school student
3. Try to be concise and direct, limit it to 100 words
4. In most cases, a conclusion is not needed

Finally, output in the following JSON format
"""
{
  "code": "<code>",
  "explanation": "<guidance and instructions for this step, can use markdown format>",
  "conclusion": "<conclusion for this step, can use markdown format>"
}
"""
Remember, your goal is to write the code that the user will understand after completing this step
Please write in English
`,
  "zh-TW": `您是一位專業的軟體工程師，專注於結構化程式教學。
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
請使用台灣繁體中文撰寫
`,
};
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

  return `Below is the instruction for this step, please follow it strictly
Do not make any modifications beyond the scope of the instruction
<step_instruction>
${stepInstruction}
</step_instruction>

Below is the direction for the next step, for reference in program structure design only
Do not apply this direction in the current step
<next_step_instruction>
${nextStepInstruction}
</next_instruction>

Below are partial modules of the target code, which already include the parts you need
<code> 
${codeText}
</code>

Below is the code that the user has already learned:
<current_code>
${currentCode}
</current_code>

You are writing the code that the user will understand after completing this step, based on the code they have already learned
So remember to include the code that the user has already learned as well
The target code may not be complete, but that's okay, you only need to focus on the code for this step
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
  locale: "en" | "zh-TW";
  apiKey: string;
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
  locale,
  apiKey,
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
      prompt: prompt[locale],
      responseSchema,
      apiKey,
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
          prompt: prompt[locale],
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
        prompt: prompt[locale],
        input,
        stepIndex,
      },
    };
  } catch (error) {
    console.error(error);
  }
}

export default createStepCodeModifyGenerationNode;
