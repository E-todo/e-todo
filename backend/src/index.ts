import express from "express";
import db from "./config/db";
import authRoutes from "./routes/auth/auth";
import { authMiddleware } from "./middleware/auth";
import userRoutes from "./routes/user/user";
import todoRoutes from "./routes/todos/todos";
import cors from "cors";

const app = express();
const PORT = Number(process.env.PORT ?? "3000");

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error("Invalid PORT");
}

app.use(cors());
app.use(express.json());
app.use(authRoutes);
app.use(userRoutes);
app.use(todoRoutes);

app.get("/", (_req, res) => {
  res.send("MY_E-TODO API is running");
});

app.get("/health/db", async (_req, res) => {
  try {
    await db.query("SELECT 1");

    res.json({
      status: "ok",
      database: "connected"
    });
  } catch (error) {
    console.error("Database connection failed:", error);

    res.status(500).json({
      status: "error",
      database: "disconnected"
    });
  }
});

app.get("/health/auth", authMiddleware, (req, res) => {
  res.json({
    status: "authenticated",
    userId: req.userId
  });
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});