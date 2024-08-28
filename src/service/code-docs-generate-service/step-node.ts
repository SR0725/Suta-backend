import { randomUUID } from "crypto";
import * as Y from "yjs";
import { CodeStepCard } from "@/models/code-docs";
import createStepCodeModifyGenerationNode from "./step-code-modify-generation-node";
import createStepModuleNeedEvaluatorNode from "./step-module-need-evaluator-node";

// 定義單一步驟節點的選項介面
interface StepNodeOptions {
  yDoc: Y.Doc;
  fullCode: string;
  currentCode: string;
  codeParagraphs: {
    title: string;
    startLine: number;
  }[];
  stepInstruction: string;
  nextStepInstruction: string;
  stepIndex: number;
  isLastStep: boolean;
  locale: "zh-TW" | "en";
}

// 創建單一步驟節點的函式
async function createStepNode({
  yDoc,
  fullCode,
  currentCode,
  codeParagraphs,
  stepInstruction,
  nextStepInstruction,
  stepIndex,
  isLastStep,
  locale,
}: StepNodeOptions) {
  // 生成唯一的步驟 ID
  const stepId = randomUUID();

  // 評估步驟需求模塊
  const stepModuleNeedEvaluatorNodeResult =
    await createStepModuleNeedEvaluatorNode({
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
  const updatedCodeNodeResult = await createStepCodeModifyGenerationNode({
    yDoc,
    fullCode,
    currentCode,
    codeParagraphs,
    usedCodeParagraphNumbers:
      stepModuleNeedEvaluatorNodeResult.response.usedCodeParagraphNumbers,
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
  const stepCard: CodeStepCard = {
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

export default createStepNode;
