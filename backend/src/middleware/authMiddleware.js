import jwt from "jsonwebtoken";

export function requireAuth(request, response, next) {
  const authHeader = request.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return response.status(401).json({ message: "Authentication required" });
  }

  try {
    request.user = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    next();
  } catch {
    response.status(401).json({ message: "Invalid or expired session" });
  }
}
