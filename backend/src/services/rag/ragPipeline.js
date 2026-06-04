import { retrieveRelevantMedicalContext } from "./retriever.js";

export async function ragPipeline(input) {
  return retrieveRelevantMedicalContext(input);
}
