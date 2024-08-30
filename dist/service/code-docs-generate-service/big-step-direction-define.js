"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const zod_1 = require("zod");
const get_code_docs_by_id_1 = __importDefault(require("@/repositories/code-docs/get-code-docs-by-id"));
const update_code_docs_1 = __importDefault(require("@/repositories/code-docs/update-code-docs"));
const agent_1 = __importDefault(require("./agent"));
const y_upsert_llm_history_1 = __importDefault(require("./y-upsert-llm-history"));
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
const responseSchema = zod_1.z.object({
    instructions: zod_1.z.array(zod_1.z.string()),
});
async function createBigStepDirectionDefineNode({ docsId, codeModuleText, yDoc, apiKey, }) {
    try {
        const llmHistoryId = (0, crypto_1.randomUUID)();
        // 生成段落模塊
        const response = await (0, agent_1.default)({
            prompt,
            responseSchema,
            apiKey,
            messages: [
                {
                    role: "user",
                    content: codeModuleText,
                },
            ],
            handleGenerate: (newContent) => {
                (0, y_upsert_llm_history_1.default)({
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
        const codeDocs = await (0, get_code_docs_by_id_1.default)(docsId);
        if (!codeDocs) {
            throw new Error("CodeDocs not found");
        }
        await (0, update_code_docs_1.default)(docsId, Object.assign(Object.assign({}, codeDocs), { llmHistoryList: [
                ...codeDocs.llmHistoryList,
                {
                    id: llmHistoryId,
                    nodeType: nodeName,
                    response: JSON.stringify(response),
                    prompt,
                    input: codeModuleText,
                },
            ] }));
        return response;
    }
    catch (error) {
        console.error(error);
    }
}
exports.default = createBigStepDirectionDefineNode;
