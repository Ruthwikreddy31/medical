export function researchAgent(retrievedContext) {
  return retrievedContext.map((document) => ({
    source: document.source,
    summary: document.content
  }));
}
