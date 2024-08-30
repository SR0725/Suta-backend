import { encrypt } from "@/utils/aes";
import { getDefaultMongoClientCollection } from "@/utils/mongo-db";

async function deleteApiKeyByEmail(email: string) {
  const { accountApiKeyCollection, accountCollection } =
    await getDefaultMongoClientCollection();

  const account = await accountCollection.findOne({
    email,
  });

  if (!account) {
    throw new Error("Account not found");
  }

  await accountApiKeyCollection.deleteMany({
    accountEmail: email,
  });
}

export default deleteApiKeyByEmail;
