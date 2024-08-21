import { randomUUID } from "crypto";
import * as Y from "yjs";
import { CodeStepCard, LLMHistory } from "@/models/code-docs";
import getCodeDocsById from "@/repositories/code-docs/get-code-docs-by-id";
import updateCodeDocs from "@/repositories/code-docs/update-code-docs";
import createStepCodeModifyGenerationNode from "./step-code-modify-generation-node";
import createStepGuideGenerationNode from "./step-guide-generation-node";
import YPushCard from "./y-push-card";

interface StepNodeOptions {
  yDoc: Y.Doc;
  fullCode: string;
  currentCode: string;
  lastStepInstruction: string;
}

async function createStepNode({
  yDoc,
  fullCode,
  currentCode,
  lastStepInstruction,
}: StepNodeOptions) {
  const stepId = randomUUID();
  const stepGuideNodeResult = await createStepGuideGenerationNode({
    yDoc,
    fullCode,
    currentCode,
    lastStepInstruction,
  });

  if (!stepGuideNodeResult) {
    throw new Error("No step guide found");
  }

  const updatedCodeNodeResult = await createStepCodeModifyGenerationNode({
    yDoc,
    fullCode,
    currentCode,
    stepInstruction: stepGuideNodeResult.response.instruction,
  });

  if (!updatedCodeNodeResult) {
    throw new Error("No updated code found");
  }

  const llmHistoryList = [
    stepGuideNodeResult.llmHistory,
    updatedCodeNodeResult.llmHistory,
  ];

  return {
    stepId,
    updatedCodeLines: updatedCodeNodeResult.newCodeLines,
    ...stepGuideNodeResult.response,
    llmHistoryList,
  };
}

interface ComplexStepNodeOptions {
  docsId: string;
  yDoc: Y.Doc;
  fullCode: string;
  startCode: string;
}

async function createComplexStepNode({
  docsId,
  yDoc,
  fullCode,
  startCode,
}: ComplexStepNodeOptions) {
  const maxStepIndex = 12;
  let stepIndex = 0;
  let lastStepInstruction = "";
  let currentCode = startCode;
  const codeStepCardList: CodeStepCard[] = [];
  const newLLMHistoryList: LLMHistory[] = [];
  while (stepIndex < maxStepIndex) {
    console.log("stepIndex", stepIndex);
    const step = await createStepNode({
      yDoc,
      fullCode,
      currentCode,
      lastStepInstruction,
    });
    lastStepInstruction = step.instruction;
    currentCode = step.updatedCodeLines.map((line) => line.text).join("\n");
    stepIndex++;
    const newCard: CodeStepCard = {
      id: step.stepId,
      type: "codeStep",
      description: `${step.instruction}\n${step.explanation}`,
      conclusion: "",
      codeLines: step.updatedCodeLines,
      preview: null,
    };
    YPushCard({
      yDoc,
      card: newCard,
    });
    codeStepCardList.push(newCard);
    newLLMHistoryList.push(...step.llmHistoryList);
    if (step.isLastStep) {
      break;
    }
  }

  // 完全生成完畢後，更新 CodeDocs 資料庫
  const codeDocs = await getCodeDocsById(docsId);
  if (!codeDocs) {
    throw new Error("CodeDocs not found");
  }

  await updateCodeDocs(docsId, {
    ...codeDocs,
    cards: [...codeDocs.cards, ...codeStepCardList],
    llmHistoryList: [...codeDocs.llmHistoryList, ...newLLMHistoryList],
  });
}

export default createComplexStepNode;
