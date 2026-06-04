import { MongoClient } from "mongodb";

let client;
let db;

export async function getDb() {
  if (!process.env.MONGODB_URI) {
    return null;
  }

  if (!db) {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    db = client.db();
  }
  return db;
}
