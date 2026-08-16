import { Router } from "express";
import { db } from "../db/index.js";
import { groupMembers, groups } from "../db/schema.js";

const router = Router();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

router.post("/", async (request, response, next) => {
  const { name, userId } = request.body as {
    name?: unknown;
    userId?: unknown;
  };

  if (typeof name !== "string" || name.trim().length === 0) {
    response.status(400).json({ error: "name is required" });
    return;
  }

  if (name.trim().length > 255) {
    response.status(400).json({ error: "name must be 255 characters or fewer" });
    return;
  }

  if (typeof userId !== "string" || !uuidPattern.test(userId)) {
    response.status(400).json({ error: "userId must be a valid UUID" });
    return;
  }

  try {
    const group = await db.transaction(async (transaction) => {
      const [createdGroup] = await transaction
        .insert(groups)
        .values({ name: name.trim(), createdBy: userId })
        .returning();

      await transaction.insert(groupMembers).values({
        groupId: createdGroup.id,
        userId,
      });

      return createdGroup;
    });

    response.status(201).json(group);
  } catch (error) {
    next(error);
  }
});

export default router;
