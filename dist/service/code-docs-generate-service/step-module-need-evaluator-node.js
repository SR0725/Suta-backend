"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stepModuleNeedEvaluatorNodePrompt = void 0;
const crypto_1 = require("crypto");
const zod_1 = require("zod");
const agent_1 = __importDefault(require("./agent"));
const get_code_module_text_1 = __importDefault(require("./get-code-module-text"));
const y_upsert_llm_history_1 = __importDefault(require("./y-upsert-llm-history"));
const nodeName = "stepModuleNeedEvaluator";
exports.stepModuleNeedEvaluatorNodePrompt = `
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
const responseSchema = zod_1.z.object({
    usedCodeParagraphNumbers: zod_1.z.array(zod_1.z.number()),
});
async function createStepModuleNeedEvaluatorNode({ yDoc, codeParagraphs, fullCode, stepInstruction, stepIndex, apiKey, }) {
    try {
        const llmHistoryId = (0, crypto_1.randomUUID)();
        const codeParagraphText = (0, get_code_module_text_1.default)(fullCode, codeParagraphs);
        const input = `程式碼：${codeParagraphText}\n步驟方向：${stepInstruction}`;
        // 生成標題和描述
        const response = await (0, agent_1.default)({
            prompt: exports.stepModuleNeedEvaluatorNodePrompt,
            responseSchema,
            messages: [
                {
                    role: "user",
                    content: input,
                },
            ],
            handleGenerate: (newContent) => {
                (0, y_upsert_llm_history_1.default)({
                    yDoc,
                    nodeType: nodeName,
                    llmHistoryId,
                    newContent,
                    prompt: exports.stepModuleNeedEvaluatorNodePrompt,
                    input,
                    stepIndex,
                });
            },
            apiKey,
        });
        return {
            response,
            llmHistory: {
                id: llmHistoryId,
                nodeType: nodeName,
                response: JSON.stringify(response),
                prompt: exports.stepModuleNeedEvaluatorNodePrompt,
                input,
                stepIndex,
            },
        };
    }
    catch (error) {
        console.error(error);
    }
}
exports.default = createStepModuleNeedEvaluatorNode;
