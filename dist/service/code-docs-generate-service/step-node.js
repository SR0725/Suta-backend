"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const step_code_modify_generation_node_1 = __importDefault(require("./step-code-modify-generation-node"));
const step_module_need_evaluator_node_1 = __importDefault(require("./step-module-need-evaluator-node"));
// 創建單一步驟節點的函式
async function createStepNode({ yDoc, fullCode, currentCode, codeParagraphs, stepInstruction, nextStepInstruction, stepIndex, isLastStep, locale, }) {
    // 生成唯一的步驟 ID
    const stepId = (0, crypto_1.randomUUID)();
    // 評估步驟需求模塊
    const stepModuleNeedEvaluatorNodeResult = await (0, step_module_need_evaluator_node_1.default)({
        yDoc,
        codeParagraphs,
        fullCode,
        stepInstruction,
        stepIndex,
    });
    if (!stepModuleNeedEvaluatorNodeResult) {
        throw new Error("找不到步驟需求模塊");
    }
    // 創建程式碼修改節點
    const updatedCodeNodeResult = await (0, step_code_modify_generation_node_1.default)({
        yDoc,
        fullCode,
        currentCode,
        codeParagraphs,
        usedCodeParagraphNumbers: stepModuleNeedEvaluatorNodeResult.response.usedCodeParagraphNumbers,
        stepInstruction,
        nextStepInstruction,
        isLastStep,
        stepIndex,
        locale,
    });
    if (!updatedCodeNodeResult) {
        throw new Error("找不到更新後的程式碼");
    }
    // 整合 LLM 歷史記錄
    const llmHistoryList = [
        stepModuleNeedEvaluatorNodeResult.llmHistory,
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
        llmHistoryList,
    };
}
exports.default = createStepNode;
