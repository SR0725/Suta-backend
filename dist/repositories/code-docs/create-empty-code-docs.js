"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongo_db_1 = require("@/utils/mongo-db");
async function createEmptyCodeDocs(docsId, originalCode, creatorAccount) {
    const { codeDocsCollection } = await (0, mongo_db_1.getDefaultMongoClientCollection)();
    const codeDocs = await codeDocsCollection.findOne({ docsId });
    if (codeDocs) {
        throw new Error("CodeDocs already exists");
    }
    const newCodeDocs = {
        id: docsId,
        originalCode,
        creatorEmail: creatorAccount.email,
        language: "plaintext",
        title: "",
        description: "",
        estimatedReadMinutes: 0,
        illustration: null,
        cards: [],
        llmHistoryList: [],
        isGenerating: true,
        createdAt: new Date(),
        tags: [],
    };
    await codeDocsCollection.insertOne(newCodeDocs);
}
exports.default = createEmptyCodeDocs;
