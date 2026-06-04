export function getChromaConfig() {
  const config = {
    collectionName: process.env.CHROMA_COLLECTION || "medical_knowledge"
  };

  if (process.env.CHROMA_URL) config.url = process.env.CHROMA_URL;
  if (process.env.CHROMA_API_KEY) config.chromaApiKey = process.env.CHROMA_API_KEY;
  if (process.env.CHROMA_TENANT) config.tenant = process.env.CHROMA_TENANT;
  if (process.env.CHROMA_DATABASE) config.database = process.env.CHROMA_DATABASE;

  return config;
}
