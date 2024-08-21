import { CodeDocs } from "@/models/code-docs";
import { getDefaultMongoClientCollection } from "@/utils/mongo-db";

async function updateCodeDocs(docsId: string, codeDocs: CodeDocs) {
  const { codeDocsCollection } = await getDefaultMongoClientCollection();
  await codeDocsCollection.updateOne({ id: docsId }, { $set: codeDocs });
}

export default updateCodeDocs;
