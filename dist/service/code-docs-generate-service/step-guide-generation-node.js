"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestPromptTemplate = exports.stepGuideGenerationNodePrompt = void 0;
const crypto_1 = require("crypto");
const diff_1 = require("diff");
const zod_1 = require("zod");
const agent_1 = __importDefault(require("./agent"));
const y_upsert_llm_history_1 = __importDefault(require("./y-upsert-llm-history"));
const nodeName = "stepGuideGeneration";
exports.stepGuideGenerationNodePrompt = `
你是一个程式導師，旨在一步步地指導使用者學習程式。
你會獲得到一個目標程式碼，你的目的是指導用戶學會這個程式碼
當中每一行的開頭，會用一個 ||- 符號來表示說使用者還沒學到這行程式碼
你需要引導用戶，一步一步逐漸移除 ||-
為此，請你設計本步驟該學習目標程式碼的那些功能
可以參考 Apple 的 Tutorial 的步驟
學習目標應該符合以下規則
1. 清晰且具體
2. 能夠在一次迭代中完成
3. 每一步只專注於一個小重點上頭
4. 請描述做法，不要直接講解程式碼
5. 不要教學程式碼以外的功能
6. 如果剩餘的部分已經相差不大，請直接結束

基於上述任務，請反饋以下：
1. 請提供此步驟的具體解決項目
2. 最後請判定此是否已完成目標
3. 所有的技術名詞僅使用台灣用語 繁體中文

另外為了方便程式架構的設計，請順便指出下一步驟的大概修改方向
指出在本步驟完成後，下一步驟應該怎麼修改

最後請判定這次學習是否為最後一步，為了不拖延文長，如果距離目標不遠，請嘗試直接完成全部

最後以以下 JSON 格式輸出
"""
{
  "instruction": "<給出清晰、簡明的指示，告訴使用者接下來應該做什麼。",
  "nextStepDirection": "<下一步的修改方向，僅供程式架構設計參考>",
  "isLastStep"?: <請判定此是否已完成目標，應當填入 true 或 false>
}
"""

請記住，你的目標是引導使用者通過學習過程。鼓勵理解和逐步進展目標程式碼。
請不要給予任何超出目標的指示，如果已經完成目標，請直接結束
`;
const requestPromptTemplate = (fullCode, currentCode, lastStepInstruction, nextStepDirection) => {
    const differences = (0, diff_1.diffLines)(fullCode, currentCode);
    const code = differences
        .filter((diff) => !diff.added)
        .flatMap((diff) => diff.value.split("\n").map((line) => (Object.assign(Object.assign({}, diff), { value: line }))))
        .map((diff) => diff.removed
        ? diff.value.trim() === ""
            ? ""
            : `||- ${diff.value}`
        : diff.value)
        .join("\n");
    return `以下是使用者正在努力實現的完整代碼：
<code> 
${code}
</code>

${lastStepInstruction &&
        `以下是使用者上一步所被指引的指示：
<last_step_guide> 
${lastStepInstruction}
</last_step_guide>`}

${nextStepDirection &&
        `這個本步驟的大致修改方向
你可以參考這個方向，撰寫完整的修改方式
<next_step_direction> 
${nextStepDirection}
</next_step_direction>`}`;
};
exports.requestPromptTemplate = requestPromptTemplate;
const responseSchema = zod_1.z.object({
    isLastStep: zod_1.z.boolean().optional(),
    instruction: zod_1.z.string(),
    nextStepDirection: zod_1.z.string(),
});
async function createStepGuideGenerationNode({ yDoc, fullCode, currentCode, lastStepInstruction, nextStepDirection, stepIndex, }) {
    try {
        const llmHistoryId = (0, crypto_1.randomUUID)();
        const input = (0, exports.requestPromptTemplate)(fullCode, currentCode, lastStepInstruction, nextStepDirection);
        // 生成標題和描述
        const response = await (0, agent_1.default)({
            prompt: exports.stepGuideGenerationNodePrompt,
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
                    prompt: exports.stepGuideGenerationNodePrompt,
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
                prompt: exports.stepGuideGenerationNodePrompt,
                input,
                stepIndex,
            },
        };
    }
    catch (error) {
        console.error(error);
    }
}
exports.default = createStepGuideGenerationNode;
