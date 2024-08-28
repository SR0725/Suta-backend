import createEmptyCodeDocs from "../../repositories/code-docs/create-empty-code-docs";
import { randomUUID } from "crypto";
import { Account } from "@/models/account";
import upsertAccount from "@/repositories/account/upsert-account";
import getCodeDocsById from "@/repositories/code-docs/get-code-docs-by-id";
import updateCodeDocs from "@/repositories/code-docs/update-code-docs";
import createCRDTDoc, { CRDTDoc } from "@/utils/crdt-doc";
import createBigStepDirectionDefineNode from "./big-step-direction-define";
import createCodeSplitToModuleNode from "./code-split-to-module-node";
import createEntireStepNode from "./entire-step-node";
import getCodeModuleText from "./get-code-module-text";
import createInitialCodeArchitectureNode from "./initial-code-architecture-node";
import createInitialPurposeNode from "./initial-purpose-node";

async function startNodes(
  docsId: string,
  code: string,
  crdtDoc: CRDTDoc,
  locale: "zh-TW" | "en"
) {
  // 設定 doc isGenerating
  const yIsGenerating = crdtDoc.doc.getText("isGenerating");
  yIsGenerating.insert(0, "true");
  // 初始解析
  await createInitialPurposeNode({
    docsId,
    code,
    yDoc: crdtDoc.doc,
    locale,
  });

  // 分割程式碼
  const codeSplitToModuleResult = await createCodeSplitToModuleNode({
    docsId,
    code,
    yDoc: crdtDoc.doc,
  });

  if (!codeSplitToModuleResult) {
    throw new Error("Code split to module not found");
  }
  const codeParagraphs = codeSplitToModuleResult.codeParagraphs;

  // 生成大步驟方向
  const bigStepDirection = await createBigStepDirectionDefineNode({
    docsId,
    yDoc: crdtDoc.doc,
    codeModuleText: getCodeModuleText(code, codeParagraphs),
  });

  if (!bigStepDirection) {
    throw new Error("Big step direction not found");
  }

  // 生成初始程式碼架構
  const initialCodeArchitecture = await createInitialCodeArchitectureNode({
    docsId,
    code,
    yDoc: crdtDoc.doc,
    locale,
  });

  if (!initialCodeArchitecture) {
    throw new Error("Initial code architecture not found");
  }

  // 創建全部步驟
  await createEntireStepNode({
    docsId,
    fullCode: code,
    initialCode: initialCodeArchitecture,
    codeParagraphs: codeParagraphs,
    instructions: bigStepDirection.instructions,
    yDoc: crdtDoc.doc,
    locale,
  });

  // 完成工作
  const codeDocs = await getCodeDocsById(docsId);
  if (!codeDocs) {
    throw new Error("CodeDocs not found");
  }
  await updateCodeDocs(docsId, { ...codeDocs, isGenerating: false });
  // 更新 YJS 資料庫
  yIsGenerating.delete(0, yIsGenerating.length);
  yIsGenerating.insert(0, "false");
}

async function codeDocsGenerateService(
  account: Account,
  code: string,
  locale: "zh-TW" | "en"
) {
  const docsId = randomUUID();
  const crdtDoc = createCRDTDoc(docsId);
  await createEmptyCodeDocs(docsId, code, account);
  startNodes(docsId, code, crdtDoc, locale)
    .then(() => {
      console.log("startNodes done");
    })
    .catch((error) => {
      console.error(error);
    })
    .finally(() => {
      setTimeout(() => {
        crdtDoc.destroy();
      }, 5000);
    });

  await upsertAccount({
    ...account,
    codeDocsGenerateUsage: {
      thisDayGeneratedCount:
        account?.codeDocsGenerateUsage?.lastGeneratedAt.toDateString() ===
        new Date().toDateString()
          ? account?.codeDocsGenerateUsage?.thisDayGeneratedCount + 1
          : 1,
      lastGeneratedAt: new Date(),
    },
  });
  return docsId;
}

export default codeDocsGenerateService;
