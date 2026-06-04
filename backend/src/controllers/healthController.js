export function healthCheck(_request, response) {
  response.json({ status: "ok", service: "medical-triage-api" });
}
