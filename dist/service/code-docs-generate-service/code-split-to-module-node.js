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
const nodeName = "codeSplitToModule";
const prompt = `You are a professional software engineer focused on structuring code.
Your task is to: Split the code into multiple paragraphs and generate a description for each paragraph, reducing the cognitive load for other software engineers.

Paragraph division:
- Each line of code has an encoding; when dividing paragraphs, please directly specify the line code.
- Each paragraph should focus on one main function.
- Can be split based on the logic of functions or classes themselves
- Each part should be limited to 200 lines.
- Review for consistency and accuracy.


Output format:
"""
{
  "codeParagraphs": [
    {
      "title": "<paragraph title>",
      "startLine": <start line number>
    }
  ]
}
"""

Goal: Create clear, accurate structures to enhance understanding.
`;
const responseSchema = zod_1.z.object({
    codeParagraphs: zod_1.z.array(zod_1.z.object({
        title: zod_1.z.string(),
        startLine: zod_1.z.number(),
    })),
});
async function createCodeSplitToModuleNode({ docsId, code, yDoc, apiKey, }) {
    const llmHistoryId = (0, crypto_1.randomUUID)();
    try {
        // 生成段落模塊
        const response = await (0, agent_1.default)({
            prompt,
            responseSchema,
            apiKey,
            messages: [
                {
                    role: "user",
                    content: code,
                },
            ],
            handleGenerate: (newContent) => {
                (0, y_upsert_llm_history_1.default)({
                    yDoc,
                    nodeType: nodeName,
                    llmHistoryId,
                    newContent,
                    prompt,
                    input: code,
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
                    input: code,
                },
            ] }));
        return response;
    }
    catch (error) {
        console.error(error);
    }
}
exports.default = createCodeSplitToModuleNode;
