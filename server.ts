import path from "path";
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import globalError from "./middlewares/errorMiddleware";
import dbContacion from "./config/database";
import mountRoutes from "./routes";

dotenv.config({ path: "config.env" });

const app = express();

// Database connection
dbContacion();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "uploads")));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
  console.log(`mode: ${process.env.NODE_ENV}`);
}

// Mount Routes
mountRoutes(app as any);

// Global error handling middleware for express
app.use(globalError as any);

const PORT = process.env.PORT || 8080;
const server = app.listen(PORT, () => {
  console.log(`app running on port ${PORT}`);
});

process.on("unhandledRejection", (err: any) => {
  console.error(`unhandledRejection Errors:${err?.name} | ${err?.message}`);
  server.close(() => {
    console.error(`Shutting down....`);
    process.exit(1);
  });
});
