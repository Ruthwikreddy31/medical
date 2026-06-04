import { generateTriageResponse } from "../triageEngine.js";

export function recommendationAgent(input, retrievedContext) {
  return generateTriageResponse(input, retrievedContext);
}
