import type { Collection } from "mongodb";
import { MongoClient } from "mongodb";
import type { Account } from "@/models/account";
import type { AccountApiKey } from "@/models/account-api-key";
import type { CodeDocs } from "@/models/code-docs";

export interface MongoCollections {
  codeDocsCollection: Collection<CodeDocs>;
  accountCollection: Collection<Account>;
  accountApiKeyCollection: Collection<AccountApiKey>;
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
  const accountCollection = mainDb.collection<Account>("account");
  const accountApiKeyCollection =
    mainDb.collection<AccountApiKey>("accountApiKey");

  return {
    codeDocsCollection,
    accountCollection,
    accountApiKeyCollection,
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
