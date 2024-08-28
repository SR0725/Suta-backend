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
async function createEntireStepNode({ docsId, yDoc, fullCode, initialCode, codeParagraphs, instructions, locale, }) {
    let currentCode = initialCode;
    const codeStepCardList = [];
    const newLLMHistoryList = [];
    for (let stepIndex = 1; stepIndex < instructions.length; stepIndex++) {
        const instruction = instructions[stepIndex];
        const step = await (0, step_node_1.default)({
            yDoc,
            fullCode,
            currentCode,
            codeParagraphs,
            stepInstruction: instruction,
            nextStepInstruction: stepIndex === instructions.length - 1
                ? ""
                : instructions[stepIndex + 1],
            stepIndex,
            isLastStep: stepIndex === instructions.length - 1,
            locale,
        });
        currentCode = step.updatedCode;
        // 將步驟卡片推送到 Yjs 文件
        (0, y_push_card_1.default)({
            yDoc,
            card: step.stepCard,
        });
        // 添加步驟卡片和 LLM 歷史記錄到列表中
        codeStepCardList.push(step.stepCard);
        newLLMHistoryList.push(...step.llmHistoryList);
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
