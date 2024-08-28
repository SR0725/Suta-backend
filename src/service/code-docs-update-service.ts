import { CodeDocs } from "@/models/code-docs";
import updateCodeDocs from "@/repositories/code-docs/update-code-docs";

async function codeDocsUpdateService(
  docsId: string,
  codeDocs: Partial<CodeDocs>
) {
  await updateCodeDocs(docsId, codeDocs);
  return true;
}

export default codeDocsUpdateService;
