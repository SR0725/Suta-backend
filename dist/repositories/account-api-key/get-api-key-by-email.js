"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aes_1 = require("@/utils/aes");
const mongo_db_1 = require("@/utils/mongo-db");
async function getApiKeyByEmail(email) {
    const { accountApiKeyCollection } = await (0, mongo_db_1.getDefaultMongoClientCollection)();
    const accountApiKey = await accountApiKeyCollection.findOne({
        accountEmail: email,
    });
    if (!accountApiKey) {
        return null;
    }
    const apiKey = (0, aes_1.decrypt)(accountApiKey.apiKey);
    return Object.assign(Object.assign({}, accountApiKey), { apiKey });
}
exports.default = getApiKeyByEmail;
