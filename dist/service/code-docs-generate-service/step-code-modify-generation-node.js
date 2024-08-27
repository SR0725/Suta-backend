"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const diff_1 = require("diff");
const zod_1 = require("zod");
const agent_1 = __importDefault(require("./agent"));
const step_guide_generation_node_1 = require("./step-guide-generation-node");
const y_upsert_llm_history_1 = __importDefault(require("./y-upsert-llm-history"));
const nodeName = "stepCodeModifyGeneration";
const stepCodeModifyGenerationNodePrompt = `
你現在要根據以上引導，修改程式碼
逐漸將 #NOT_LEARNED 移除
請遵守以下規則：
1. 撰寫新的程式時，只需要撰寫使用者學習完後，會呈現的樣子即可
2. 確保生成的代碼在語法上正確，並符合剛剛提到的需求。

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
const responseSchema = zod_1.z.object({
    code: zod_1.z.string(),
    explanation: zod_1.z.string(),
    conclusion: zod_1.z.string().optional(),
});
async function createStepCodeModifyGenerationNode({ yDoc, fullCode, currentCode, stepInstruction, nextStepDirection, isLastStep, stepIndex, }) {
    try {
        const llmHistoryId = (0, crypto_1.randomUUID)();
        const input = (0, step_guide_generation_node_1.requestPromptTemplate)(fullCode, currentCode, stepInstruction, nextStepDirection);
        // 生成標題和描述
        const response = await (0, agent_1.default)({
            prompt: step_guide_generation_node_1.stepGuideGenerationNodePrompt,
            responseSchema,
            messages: [
                {
                    role: "user",
                    content: input,
                },
                {
                    role: "assistant",
                    content: `本步驟指引：${stepInstruction}，下一個步驟方向(僅供程式設計參考，請勿用於本步驟的撰寫上)：${nextStepDirection}`,
                },
                {
                    role: "user",
                    content: stepCodeModifyGenerationNodePrompt,
                },
            ],
            handleGenerate: (newContent) => {
                (0, y_upsert_llm_history_1.default)({
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
        const differences = (0, diff_1.diffLines)(currentCode, newCode);
        const newCodeLines = differences.reduce((acc, diff) => {
            acc.push(...diff.value.split("\n").map((line) => ({
                text: line,
                added: diff.added,
                removed: diff.removed,
            })));
            return acc;
        }, []);
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
    }
    catch (error) {
        console.error(error);
    }
}
exports.default = createStepCodeModifyGenerationNode;
