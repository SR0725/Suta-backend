import { getDefaultMongoClientCollection } from "@/utils/mongo-db";

async function getCodeDocsListByUserEmail(userEmail: string) {
  const { codeDocsCollection } = await getDefaultMongoClientCollection();
  return await codeDocsCollection.find({ creatorEmail: userEmail }).toArray();
}

export default getCodeDocsListByUserEmail;
