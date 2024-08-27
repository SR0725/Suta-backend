"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongo_db_1 = require("@/utils/mongo-db");
async function getCodeDocsById(docsId) {
    const { codeDocsCollection } = await (0, mongo_db_1.getDefaultMongoClientCollection)();
    return await codeDocsCollection.findOne({ id: docsId });
}
exports.default = getCodeDocsById;
