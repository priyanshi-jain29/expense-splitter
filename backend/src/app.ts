import cors from "cors";
import express, { type ErrorRequestHandler } from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
import expensesRouter from "./routes/expenses.js";
import groupsRouter from "./routes/groups.js";
import settlementsRouter from "./routes/settlements.js";
import usersRouter from "./routes/users.js";

export const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:8081",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);
app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());
app.use("/expenses", expensesRouter);
app.use("/groups", groupsRouter);
app.use("/settlements", settlementsRouter);
app.use("/users", usersRouter);

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: "Internal server error" });
};

app.use(errorHandler);
