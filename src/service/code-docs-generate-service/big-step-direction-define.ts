import { randomUUID } from "crypto";
import * as Y from "yjs";
import { z } from "zod";
import getCodeDocsById from "@/repositories/code-docs/get-code-docs-by-id";
import updateCodeDocs from "@/repositories/code-docs/update-code-docs";
import agent from "./agent";
import yUpsertLLMHistory from "./y-upsert-llm-history";

const nodeName = "bigStepDirectionDefine";
const prompt = `
You are a professional programming mentor, skilled in guiding students to understand the entire codebase step by step.
Your task is to: Break down the code into several major steps, reducing the cognitive load for students.

You will receive a code that has been preliminarily divided into multiple paragraphs.

Step division:
1. Divide the main process of the program from start to finish into several parts according to functionality or logical stages, such as initialization, data processing, main logic execution, output results, program termination, etc.
2. Gradually refine from high-level to low-level, for example, the initialization stage may include configuration file loading, variable initialization, external dependency checks, etc.
3. Determine which are data processing flows (data flow) and which are control flows. Data flow focuses on data transmission and transformation, while control flow focuses on program logic branches and decisions.
4. The flow should clearly describe the loop and conditional logic in the program. Loops are used for repetitive operations, and conditionals are used for decision-making.
5. Each flow should clearly describe its required inputs and outputs, including data, states, or events.
6. In the flowchart, use clear lines or symbols to mark the interfaces between modules, and describe the function of the interfaces and the interaction data.
7. Separate parallel operations and asynchronous operations, and describe their synchronization points and parts that affect each other.
8. Please generate a simple numbered list, directly listing all items without any hierarchical relationship. Items should be arranged by serial number, as shown below:
["1. Item one",
"2. Item two",
"3. Item three",
"4. Item four",
"5. Item five"]

Based on the above, divide the code into multiple major steps.
Output format:
"""
{
  "instructions": ["<Step description>"],
}
"""

Goal: Create a clear and accurate flow that allows users to write out the entire code step by step.
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
