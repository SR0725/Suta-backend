import { getDefaultMongoClientCollection } from "@/utils/mongo-db";

async function deleteCodeDocsById(docsId: string) {
  const { codeDocsCollection } = await getDefaultMongoClientCollection();
  return await codeDocsCollection.deleteOne({ id: docsId });
}

export default deleteCodeDocsById;
