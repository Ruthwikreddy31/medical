import { Chroma } from "@langchain/community/vectorstores/chroma";
import { getChromaConfig } from "../../config/chroma.js";
import { getEmbeddingModel } from "./embeddingService.js";

export async function getChromaVectorStore() {
  const embeddings = await getEmbeddingModel();
  if (!embeddings) {
    return null;
  }

  return Chroma.fromExistingCollection(embeddings, getChromaConfig());
}
