import { encrypt } from "@/utils/aes";
import { getDefaultMongoClientCollection } from "@/utils/mongo-db";

async function insertApiKeyByEmail(
  email: string,
  apiKey: string,
  service: string
) {
  const { accountApiKeyCollection, accountCollection } =
    await getDefaultMongoClientCollection();

  const account = await accountCollection.findOne({
    email,
  });

  if (!account) {
    throw new Error("Account not found");
  }

  const oldAccountApiKey = await accountApiKeyCollection.findOne({
    accountEmail: email,
  });

  if (oldAccountApiKey) {
    throw new Error("Account API key already exists");
  }

  const encryptedApiKey = encrypt(apiKey);

  await accountApiKeyCollection.insertOne({
    accountEmail: email,
    apiKey: encryptedApiKey,
    service,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export default insertApiKeyByEmail;
