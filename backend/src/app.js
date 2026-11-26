import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { attachUser } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import healthRoutes from "./routes/health.js";
import authRoutes from "./routes/auth.js";
import catalogRoutes from "./routes/catalog.js";
import aiRoutes from "./routes/ai.js";
import bookingRoutes from "./routes/bookings.js";
import adminRoutes from "./routes/admin.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.CORS_ORIGINS.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
    }),
  );
  app.use(cookieParser());
  // Allow base64 compressed product photos up to 1MB
  app.use(express.json({ limit: "1mb" }));

  // Attach authenticated user from HttpOnly cookie or Bearer token
  app.use("/api", attachUser);

  // Mount API routes
  app.use("/api", healthRoutes);
  app.use("/api", authRoutes);
  app.use("/api", catalogRoutes);
  app.use("/api", aiRoutes);
  app.use("/api", bookingRoutes);
  app.use("/api", adminRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
