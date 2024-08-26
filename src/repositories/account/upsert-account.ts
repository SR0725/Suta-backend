import { Account } from "@/models/account";
import { getDefaultMongoClientCollection } from "@/utils/mongo-db";

async function upsertAccount(account: Account) {
  const { accountCollection } = await getDefaultMongoClientCollection();
  return await accountCollection.updateOne(
    { email: account.email },
    { $set: account },
    { upsert: true }
  );
}

export default upsertAccount;
