import { retrieveMedicalContext } from "../ragService.js";

export async function retrieveRelevantMedicalContext(input) {
  return retrieveMedicalContext(input);
}
