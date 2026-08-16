import express, { type ErrorRequestHandler } from "express";
import expensesRouter from "./routes/expenses.js";
import groupsRouter from "./routes/groups.js";

export const app = express();

app.use(express.json());
app.use("/expenses", expensesRouter);
app.use("/groups", groupsRouter);

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: "Internal server error" });
};

app.use(errorHandler);
