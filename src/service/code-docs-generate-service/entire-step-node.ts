import * as Y from "yjs";
import { CodeStepCard, LLMHistory } from "@/models/code-docs";
import getCodeDocsById from "@/repositories/code-docs/get-code-docs-by-id";
import updateCodeDocs from "@/repositories/code-docs/update-code-docs";
import createStepNode from "./step-node";
import YPushCard from "./y-push-card";

// 定義總體步驟節點的選項介面
interface EntireStepNodeOptions {
  docsId: string;
  yDoc: Y.Doc;
  fullCode: string;
  initialCode: string;
  codeParagraphs: {
    title: string;
    startLine: number;
  }[];
  instructions: string[];
}

// 創建總體步驟節點的函式
async function createEntireStepNode({
  docsId,
  yDoc,
  fullCode,
  initialCode,
  codeParagraphs,
  instructions,
}: EntireStepNodeOptions) {
  let currentCode = initialCode;
  const codeStepCardList: CodeStepCard[] = [];
  const newLLMHistoryList: LLMHistory[] = [];

  for (let stepIndex = 1; stepIndex < instructions.length; stepIndex++) {
    const instruction = instructions[stepIndex];
    const step = await createStepNode({
      yDoc,
      fullCode,
      currentCode,
      codeParagraphs,
      stepInstruction: instruction,
      nextStepInstruction:
        stepIndex === instructions.length - 1
          ? ""
          : instructions[stepIndex + 1],
      stepIndex,
      isLastStep: stepIndex === instructions.length - 1,
    });

    currentCode = step.updatedCode;

    // 將步驟卡片推送到 Yjs 文件
    YPushCard({
      yDoc,
      card: step.stepCard,
    });

    // 添加步驟卡片和 LLM 歷史記錄到列表中
    codeStepCardList.push(step.stepCard);
    newLLMHistoryList.push(...step.llmHistoryList);
  }

  // 全部步驟生成完畢後，更新 CodeDocs 資料庫
  const codeDocs = await getCodeDocsById(docsId);
  if (!codeDocs) {
    throw new Error("找不到 CodeDocs");
  }

  // 更新 CodeDocs，加入新的卡片和 LLM 歷史記錄
  await updateCodeDocs(docsId, {
    ...codeDocs,
    cards: [...codeDocs.cards, ...codeStepCardList],
    llmHistoryList: [...codeDocs.llmHistoryList, ...newLLMHistoryList],
  });
}

export default createEntireStepNode;
