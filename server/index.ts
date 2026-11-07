import "dotenv/config";
import "@langchain/community";
import express from "express";
import cors from "cors";
import { existsSync } from "fs";
import path from "path";
import uploadRoutes from "./routes/upload";
import chatRoutes from "./routes/chat";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/upload", uploadRoutes);
app.use("/api/chat", chatRoutes);

app.get("/health", (req, res) => {
  res.json({
    message: "🚀 AI Workspace Backend is running",
  });
});

const frontendPath = [
  path.resolve(__dirname, "../dist"),
  path.resolve(__dirname, "../../dist"),
].find((candidate) => existsSync(path.join(candidate, "index.html")));

if (frontendPath) {
  app.use(express.static(frontendPath));
  app.get("/{*path}", (req, res, next) => {
    if (req.path === "/api" || req.path.startsWith("/api/")) {
      return res.sendStatus(404);
    }

    res.sendFile(path.join(frontendPath, "index.html"), (err) => {
      if (err) next(err);
    });
  });
}

// Start Server
const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});