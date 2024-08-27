"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const step_code_modify_generation_node_1 = __importDefault(require("./step-code-modify-generation-node"));
const step_guide_generation_node_1 = __importDefault(require("./step-guide-generation-node"));
// 創建單一步驟節點的函式
async function createStepNode({ yDoc, fullCode, currentCode, lastStepInstruction, nextStepDirection, stepIndex, }) {
    // 生成唯一的步驟 ID
    const stepId = (0, crypto_1.randomUUID)();
    // 創建步驟指南節點
    const stepGuideNodeResult = await (0, step_guide_generation_node_1.default)({
        yDoc,
        fullCode,
        currentCode,
        lastStepInstruction,
        nextStepDirection,
        stepIndex,
    });
    if (!stepGuideNodeResult) {
        throw new Error("找不到步驟指南");
    }
    // 創建程式碼修改節點
    const updatedCodeNodeResult = await (0, step_code_modify_generation_node_1.default)({
        yDoc,
        fullCode,
        currentCode,
        stepInstruction: stepGuideNodeResult.response.instruction,
        nextStepDirection: stepGuideNodeResult.response.nextStepDirection,
        isLastStep: stepGuideNodeResult.response.isLastStep || false,
        stepIndex,
    });
    if (!updatedCodeNodeResult) {
        throw new Error("找不到更新後的程式碼");
    }
    // 整合 LLM 歷史記錄
    const llmHistoryList = [
        stepGuideNodeResult.llmHistory,
        updatedCodeNodeResult.llmHistory,
    ];
    // 建立步驟卡片
    const stepCard = {
        id: stepId,
        type: "codeStep",
        stepIndex: stepIndex,
        description: updatedCodeNodeResult.explanation,
        conclusion: updatedCodeNodeResult.conclusion || "",
        codeLines: updatedCodeNodeResult.newCodeLines,
        preview: null,
    };
    // 回傳步驟相關資訊
    return {
        stepCard,
        updatedCode: updatedCodeNodeResult.newCode,
        stepInstruction: stepGuideNodeResult.response.instruction,
        nextStepDirection: stepGuideNodeResult.response.nextStepDirection,
        isLastStep: stepGuideNodeResult.response.isLastStep,
        llmHistoryList,
    };
}
exports.default = createStepNode;
