import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const knowledgeBasePath = fileURLToPath(new URL("../data/medical-knowledge.json", import.meta.url));
const knowledgeBase = JSON.parse(readFileSync(knowledgeBasePath, "utf8"));

const STOP_WORDS = new Set([
  "and",
  "or",
  "the",
  "a",
  "an",
  "for",
  "of",
  "to",
  "in",
  "with",
  "from",
  "on",
  "is",
  "are",
  "has",
  "have",
  "day",
  "days"
]);

export async function retrieveMedicalContext(input) {
  const chromaResults = await retrieveFromChroma(input);
  if (chromaResults.length > 0) {
    return chromaResults;
  }

  return retrieveFromLocalKnowledge(input);
}

async function retrieveFromChroma(input) {
  if (!process.env.CHROMA_URL || !process.env.OPENAI_API_KEY) {
    return [];
  }

  try {
    const { OpenAIEmbeddings } = await import("@langchain/openai");
    const { Chroma } = await import("@langchain/community/vectorstores/chroma");
    const embeddings = new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small"
    });
    const vectorStore = await Chroma.fromExistingCollection(embeddings, getChromaConfig());
    const documents = await vectorStore.similaritySearch(buildQuery(input), 5);

    return documents.map((document, index) => ({
      source: document.metadata?.source || document.metadata?.id || `chroma-${index + 1}`,
      content: document.pageContent
    }));
  } catch (error) {
    console.warn("Chroma retrieval unavailable; using local medical knowledge.", error.message);
    return [];
  }
}

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

function retrieveFromLocalKnowledge(input) {
  const queryTerms = tokenize([
    input.symptoms,
    input.duration,
    input.additional_notes,
    input.medical_conditions.join(" ")
  ].join(" "));

  return knowledgeBase
    .map((document) => ({
      ...document,
      score: scoreDocument(document, queryTerms)
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 5)
    .map((document) => ({
      source: document.id,
      content: document.content
    }));
}

function buildQuery(input) {
  return [
    input.symptoms,
    input.duration,
    input.additional_notes,
    input.medical_conditions.join(" "),
    input.previous_consultation_history
  ].join(" ");
}

function tokenize(text) {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function scoreDocument(document, queryTerms) {
  const haystack = `${document.title} ${document.content} ${document.tags.join(" ")}`.toLowerCase();
  return queryTerms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
}
