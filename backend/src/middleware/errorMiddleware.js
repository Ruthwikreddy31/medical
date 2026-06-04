export function errorMiddleware(error, _request, response, _next) {
  console.error(error);
  response.status(error.status || 500).json({
    message: error.message || "Internal server error"
  });
}
