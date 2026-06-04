import { generateTriageResponse } from "../triageEngine.js";

export function riskAgent(input, retrievedContext) {
  return generateTriageResponse(input, retrievedContext).risk_assessment;
}
