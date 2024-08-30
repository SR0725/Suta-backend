"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultMongoCollections = void 0;
exports.getDefaultMongoClientCollection = getDefaultMongoClientCollection;
const mongodb_1 = require("mongodb");
exports.defaultMongoCollections = null;
async function createMongoClientCollection() {
    const connectionString = process.env.MONGODB_CONNECTION_STRING;
    const mainDbName = process.env.MONGODB_MAIN_DB_NAME;
    if (!connectionString || !mainDbName) {
        throw new Error("MONGODB_CONNECTION_STRING or mainDbName is not set");
    }
    const client = await mongodb_1.MongoClient.connect(connectionString);
    const mainDb = client.db(mainDbName);
    const codeDocsCollection = mainDb.collection("codeDocs");
    const accountCollection = mainDb.collection("account");
    const accountApiKeyCollection = mainDb.collection("accountApiKey");
    return {
        codeDocsCollection,
        accountCollection,
        accountApiKeyCollection,
    };
}
async function getDefaultMongoClientCollection() {
    if (exports.defaultMongoCollections) {
        return exports.defaultMongoCollections;
    }
    console.log("Creating default mongo collections");
    exports.defaultMongoCollections = await createMongoClientCollection();
    return exports.defaultMongoCollections;
}
exports.default = createMongoClientCollection;
