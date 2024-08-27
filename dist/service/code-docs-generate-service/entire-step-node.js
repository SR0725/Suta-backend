"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const get_code_docs_by_id_1 = __importDefault(require("@/repositories/code-docs/get-code-docs-by-id"));
const update_code_docs_1 = __importDefault(require("@/repositories/code-docs/update-code-docs"));
const step_node_1 = __importDefault(require("./step-node"));
const y_push_card_1 = __importDefault(require("./y-push-card"));
// 創建總體步驟節點的函式
async function createEntireStepNode({ docsId, yDoc, fullCode, startCode, }) {
    const maxStepIndex = Number(process.env.MAX_CODE_STEP) || 20;
    let stepIndex = 1;
    let lastStepInstruction = "";
    let currentCode = startCode;
    let nextStepDirection = "";
    const codeStepCardList = [];
    const newLLMHistoryList = [];
    // 循環創建步驟，直到達到最大步驟數或遇到最後一步
    while (stepIndex < maxStepIndex) {
        const step = await (0, step_node_1.default)({
            yDoc,
            fullCode,
            currentCode,
            lastStepInstruction,
            nextStepDirection,
            stepIndex,
        });
        // 更新相關變數
        lastStepInstruction = step.stepInstruction;
        nextStepDirection = step.nextStepDirection;
        currentCode = step.updatedCode;
        stepIndex++;
        // 將步驟卡片推送到 Yjs 文件
        (0, y_push_card_1.default)({
            yDoc,
            card: step.stepCard,
        });
        // 添加步驟卡片和 LLM 歷史記錄到列表中
        codeStepCardList.push(step.stepCard);
        newLLMHistoryList.push(...step.llmHistoryList);
        // 如果是最後一步，跳出迴圈
        if (step.isLastStep) {
            break;
        }
    }
    // 全部步驟生成完畢後，更新 CodeDocs 資料庫
    const codeDocs = await (0, get_code_docs_by_id_1.default)(docsId);
    if (!codeDocs) {
        throw new Error("找不到 CodeDocs");
    }
    // 更新 CodeDocs，加入新的卡片和 LLM 歷史記錄
    await (0, update_code_docs_1.default)(docsId, Object.assign(Object.assign({}, codeDocs), { cards: [...codeDocs.cards, ...codeStepCardList], llmHistoryList: [...codeDocs.llmHistoryList, ...newLLMHistoryList] }));
}
exports.default = createEntireStepNode;
