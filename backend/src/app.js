import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { healthCheck } from "./controllers/healthController.js";
import { errorMiddleware } from "./middleware/errorMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import hospitalRoutes from "./routes/hospitalRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import triageRoutes from "./routes/triageRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", healthCheck);
app.use("/api/auth", authRoutes);
app.use("/api/triage", triageRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/chat", chatRoutes);
app.use(errorMiddleware);

export default app;
