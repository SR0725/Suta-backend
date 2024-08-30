"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aes_1 = require("@/utils/aes");
const mongo_db_1 = require("@/utils/mongo-db");
async function insertApiKeyByEmail(email, apiKey, service) {
    const { accountApiKeyCollection, accountCollection } = await (0, mongo_db_1.getDefaultMongoClientCollection)();
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
    const encryptedApiKey = (0, aes_1.encrypt)(apiKey);
    await accountApiKeyCollection.insertOne({
        accountEmail: email,
        apiKey: encryptedApiKey,
        service,
        createdAt: new Date(),
        updatedAt: new Date(),
    });
}
exports.default = insertApiKeyByEmail;
