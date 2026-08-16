import { and, eq, ilike, or } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";

const router = Router();

router.get("/search", async (request, response, next) => {
  const { query } = request.query;
  if (typeof query !== "string" || query.trim().length === 0) {
    response.status(400).json({ error: "query is required" });
    return;
  }
  if (query.trim().length > 100) {
    response
      .status(400)
      .json({ error: "query must be 100 characters or fewer" });
    return;
  }

  try {
    const searchPattern = `%${query.trim()}%`;
    const matches = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(
        and(
          eq(users.isPlaceholder, false),
          or(
            ilike(users.name, searchPattern),
            ilike(users.email, searchPattern),
          ),
        ),
      )
      .limit(20);

    response.json(matches);
  } catch (error) {
    next(error);
  }
});

export default router;
