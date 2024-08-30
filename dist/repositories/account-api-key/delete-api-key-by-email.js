"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongo_db_1 = require("@/utils/mongo-db");
async function deleteApiKeyByEmail(email) {
    const { accountApiKeyCollection, accountCollection } = await (0, mongo_db_1.getDefaultMongoClientCollection)();
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
exports.default = deleteApiKeyByEmail;
