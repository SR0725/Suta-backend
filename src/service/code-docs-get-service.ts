import getCodeDocsById from "@/repositories/code-docs/get-code-docs-by-id";

async function codeDocsGetService(docsId: string) {
  const codeDocs = await getCodeDocsById(docsId);
  return codeDocs;
}

export default codeDocsGetService;
