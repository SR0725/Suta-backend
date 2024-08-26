import { randomUUID } from "crypto";
import * as Y from "yjs";
import { CodeStepCard } from "@/models/code-docs";
import createStepCodeModifyGenerationNode from "./step-code-modify-generation-node";
import createStepGuideGenerationNode from "./step-guide-generation-node";

// 定義單一步驟節點的選項介面
interface StepNodeOptions {
  yDoc: Y.Doc;
  fullCode: string;
  currentCode: string;
  lastStepInstruction: string;
  nextStepDirection: string;
  stepIndex: number;
}

// 創建單一步驟節點的函式
async function createStepNode({
  yDoc,
  fullCode,
  currentCode,
  lastStepInstruction,
  nextStepDirection,
  stepIndex,
}: StepNodeOptions) {
  // 生成唯一的步驟 ID
  const stepId = randomUUID();

  // 創建步驟指南節點
  const stepGuideNodeResult = await createStepGuideGenerationNode({
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
  const updatedCodeNodeResult = await createStepCodeModifyGenerationNode({
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
  const stepCard: CodeStepCard = {
    id: stepId,
    type: "codeStep",
    stepIndex: stepIndex,
    description: updatedCodeNodeResult.explanation,
    conclusion: "",
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

export default createStepNode;
