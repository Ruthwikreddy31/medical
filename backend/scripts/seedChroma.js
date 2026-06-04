import dotenv from "dotenv";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

dotenv.config();

const knowledgeBasePath = fileURLToPath(new URL("../src/data/medical-knowledge.json", import.meta.url));
const knowledgeBase = JSON.parse(readFileSync(knowledgeBasePath, "utf8"));

if (!process.env.CHROMA_URL && !process.env.CHROMA_API_KEY) {
  throw new Error("Set CHROMA_URL for local ChromaDB or CHROMA_API_KEY with CHROMA_TENANT and CHROMA_DATABASE for Chroma Cloud.");
}

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required for OpenAI embeddings.");
}

const { OpenAIEmbeddings } = await import("@langchain/openai");
const { Chroma } = await import("@langchain/community/vectorstores/chroma");

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small"
});

const vectorStore = await Chroma.fromDocuments(
  knowledgeBase.map((document) => ({
    pageContent: document.content,
    metadata: {
      id: document.id,
      source: document.id,
      title: document.title,
      tags: document.tags
    }
  })),
  embeddings,
  getChromaConfig()
);

console.log(`Seeded ${knowledgeBase.length} medical documents into ${process.env.CHROMA_COLLECTION || "medical_knowledge"}.`);

function getChromaConfig() {
  const config = {
    collectionName: process.env.CHROMA_COLLECTION || "medical_knowledge"
  };

  if (process.env.CHROMA_URL) {
    config.url = process.env.CHROMA_URL;
  }
  if (process.env.CHROMA_API_KEY) {
    config.chromaApiKey = process.env.CHROMA_API_KEY;
  }
  if (process.env.CHROMA_TENANT) {
    config.tenant = process.env.CHROMA_TENANT;
  }
  if (process.env.CHROMA_DATABASE) {
    config.database = process.env.CHROMA_DATABASE;
  }

  return config;
}
