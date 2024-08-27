"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongo_db_1 = require("@/utils/mongo-db");
async function getCodeDocsListByUserEmail(userEmail) {
    const { codeDocsCollection } = await (0, mongo_db_1.getDefaultMongoClientCollection)();
    return await codeDocsCollection.find({ creatorEmail: userEmail }).toArray();
}
exports.default = getCodeDocsListByUserEmail;
