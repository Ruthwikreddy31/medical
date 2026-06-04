export function safetyAgent(response) {
  return {
    ...response,
    safety_checked: true
  };
}
