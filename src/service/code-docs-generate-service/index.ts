import createEmptyCodeDocs from "../../repositories/code-docs/create-empty-code-docs";
import { randomUUID } from "crypto";
import { Account } from "@/models/account";
import upsertAccount from "@/repositories/account/upsert-account";
import getCodeDocsById from "@/repositories/code-docs/get-code-docs-by-id";
import updateCodeDocs from "@/repositories/code-docs/update-code-docs";
import createCRDTDoc, { CRDTDoc } from "@/utils/crdt-doc";
import createEntireStepNode from "./entire-step-node";
import createInitialCodeArchitectureNode from "./initial-code-architecture-node";
import createInitialPurposeNode from "./initial-purpose-node";

async function startNodes(docsId: string, code: string, crdtDoc: CRDTDoc) {
  // 設定 doc isGenerating
  const yIsGenerating = crdtDoc.doc.getText("isGenerating");
  yIsGenerating.insert(0, "true");
  // 初始解析
  await createInitialPurposeNode({
    docsId,
    code,
    yDoc: crdtDoc.doc,
  });

  // 生成初始程式碼
  const initialCode = await createInitialCodeArchitectureNode({
    docsId,
    code,
    yDoc: crdtDoc.doc,
  });

  if (!initialCode) {
    throw new Error("Initial code not found");
  }

  // 創建全部步驟
  await createEntireStepNode({
    docsId,
    fullCode: code,
    startCode: initialCode,
    yDoc: crdtDoc.doc,
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

async function codeDocsGenerateService(account: Account, code: string) {
  const docsId = randomUUID();
  const crdtDoc = createCRDTDoc(docsId);
  await createEmptyCodeDocs(docsId, code, account);
  try {
    startNodes(docsId, code, crdtDoc);
  } catch (error) {
    console.error(error);
  } finally {
    setTimeout(() => {
      crdtDoc.destroy();
    }, 5000);
  }

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
