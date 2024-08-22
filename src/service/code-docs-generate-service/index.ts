import createEmptyCodeDocs from "../../repositories/code-docs/create-empty-code-docs";
import { randomUUID } from "crypto";
import getCodeDocsById from "@/repositories/code-docs/get-code-docs-by-id";
import updateCodeDocs from "@/repositories/code-docs/update-code-docs";
import createCRDTDoc, { CRDTDoc } from "@/utils/crdt-doc";
import createEntireStepNode from "./entire-step-node";
import createInitialCodeArchitectureNode from "./initial-code-architecture-node";
import createInitialPurposeNode from "./initial-purpose-node";

async function startNodes(docsId: string, code: string, crdtDoc: CRDTDoc) {
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
  crdtDoc.destroy();
}

async function codeDocsGenerateService(code: string) {
  const docsId = randomUUID();
  const crdtDoc = createCRDTDoc(docsId);
  await createEmptyCodeDocs(docsId, code);
  startNodes(docsId, code, crdtDoc);
  return docsId;
}

export default codeDocsGenerateService;
