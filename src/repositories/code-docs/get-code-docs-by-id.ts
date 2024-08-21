import { getDefaultMongoClientCollection } from "@/utils/mongo-db";

async function getCodeDocsById(docsId: string) {
  const { codeDocsCollection } = await getDefaultMongoClientCollection();
  return await codeDocsCollection.findOne({ id: docsId });
}

export default getCodeDocsById;
