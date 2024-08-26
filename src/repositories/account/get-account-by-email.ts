import { getDefaultMongoClientCollection } from "@/utils/mongo-db";

async function getAccountByEmail(email: string) {
  const { accountCollection } = await getDefaultMongoClientCollection();
  return await accountCollection.findOne({ email });
}

export default getAccountByEmail;
