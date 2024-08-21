import type { Collection } from "mongodb";
import { MongoClient } from "mongodb";
import type { CodeDocs } from "@/models/code-docs";

export interface MongoCollections {
  codeDocsCollection: Collection<CodeDocs>;
}

export let defaultMongoCollections: MongoCollections | null = null;

async function createMongoClientCollection(): Promise<MongoCollections> {
  const connectionString = process.env.MONGODB_CONNECTION_STRING;

  const mainDbName = process.env.MONGODB_MAIN_DB_NAME;

  if (!connectionString || !mainDbName) {
    throw new Error("MONGODB_CONNECTION_STRING or mainDbName is not set");
  }

  const client = await MongoClient.connect(connectionString);

  const mainDb = client.db(mainDbName);
  const codeDocsCollection = mainDb.collection<CodeDocs>("codeDocs");

  return {
    codeDocsCollection,
  };
}

export async function getDefaultMongoClientCollection() {
  if (defaultMongoCollections) {
    return defaultMongoCollections;
  }
  console.log("Creating default mongo collections");
  defaultMongoCollections = await createMongoClientCollection()!;
  return defaultMongoCollections;
}

export default createMongoClientCollection;
