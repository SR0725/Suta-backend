"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongo_db_1 = require("@/utils/mongo-db");
async function updateCodeDocs(docsId, codeDocs) {
    const { codeDocsCollection } = await (0, mongo_db_1.getDefaultMongoClientCollection)();
    await codeDocsCollection.updateOne({ id: docsId }, { $set: codeDocs });
}
exports.default = updateCodeDocs;
