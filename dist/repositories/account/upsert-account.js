"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongo_db_1 = require("@/utils/mongo-db");
async function upsertAccount(account) {
    const { accountCollection } = await (0, mongo_db_1.getDefaultMongoClientCollection)();
    return await accountCollection.updateOne({ email: account.email }, { $set: account }, { upsert: true });
}
exports.default = upsertAccount;
