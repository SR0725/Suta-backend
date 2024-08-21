import { CodeDocs } from "@/models/code-docs";
import { getDefaultMongoClientCollection } from "@/utils/mongo-db";

async function createEmptyCodeDocs(docsId: string, originalCode: string) {
  const { codeDocsCollection } = await getDefaultMongoClientCollection();
  const codeDocs = await codeDocsCollection.findOne({ docsId });
  if (codeDocs) {
    throw new Error("CodeDocs already exists");
  }
  const newCodeDocs: CodeDocs = {
    id: docsId,
    originalCode,
    language: "plaintext",
    title: "",
    description: "",
    estimatedReadMinutes: 0,
    illustration: null,
    cards: [],
    llmHistoryList: [],
    isGenerating: true,
  };
  await codeDocsCollection.insertOne(newCodeDocs);
}

export default createEmptyCodeDocs;
