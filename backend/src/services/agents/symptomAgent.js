export function symptomAgent(input) {
  return input.symptoms
    .split(/[,;\n]+/)
    .map((symptom) => symptom.trim())
    .filter(Boolean);
}
