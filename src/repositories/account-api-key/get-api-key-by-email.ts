import { decrypt } from "@/utils/aes";
import { getDefaultMongoClientCollection } from "@/utils/mongo-db";

async function getApiKeyByEmail(email: string) {
  const { accountApiKeyCollection } = await getDefaultMongoClientCollection();
  const accountApiKey = await accountApiKeyCollection.findOne({
    accountEmail: email,
  });

  if (!accountApiKey) {
    return null;
  }

  const apiKey = decrypt(accountApiKey.apiKey);

  return {
    ...accountApiKey,
    apiKey,
  };
}

export default getApiKeyByEmail;
