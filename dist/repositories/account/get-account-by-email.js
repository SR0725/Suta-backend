"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongo_db_1 = require("@/utils/mongo-db");
async function getAccountByEmail(email) {
    const { accountCollection } = await (0, mongo_db_1.getDefaultMongoClientCollection)();
    return await accountCollection.findOne({ email });
}
exports.default = getAccountByEmail;
