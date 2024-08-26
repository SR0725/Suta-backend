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
  startCode: string;
}

// 創建總體步驟節點的函式
async function createEntireStepNode({
  docsId,
  yDoc,
  fullCode,
  startCode,
}: EntireStepNodeOptions) {
  const maxStepIndex = Number(process.env.MAX_CODE_STEP) || 20;
  let stepIndex = 1;
  let lastStepInstruction = "";
  let currentCode = startCode;
  let nextStepDirection = "";
  const codeStepCardList: CodeStepCard[] = [];
  const newLLMHistoryList: LLMHistory[] = [];

  // 循環創建步驟，直到達到最大步驟數或遇到最後一步
  while (stepIndex < maxStepIndex) {
    const step = await createStepNode({
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
    YPushCard({
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
