export function getEmbeddingModel() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  return import("@langchain/openai").then(({ OpenAIEmbeddings }) =>
    new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small"
    })
  );
}
