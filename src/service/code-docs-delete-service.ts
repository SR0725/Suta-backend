import deleteCodeDocsById from "@/repositories/code-docs/delete-code-docs-by-id";

async function codeDocsDeleteService(docsId: string) {
  return await deleteCodeDocsById(docsId);
}

export default codeDocsDeleteService;
