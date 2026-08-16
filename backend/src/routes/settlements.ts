import { and, eq, inArray } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db/index.js";
import { groupMembers, settlements } from "../db/schema.js";

const router = Router();
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const moneyPattern = /^\d{1,10}(?:\.\d{1,2})?$/;

router.post("/", async (request, response, next) => {
  const { groupId, fromUser, toUser, amount } =
    (request.body as Record<string, unknown> | undefined) ?? {};

  if (typeof groupId !== "string" || !uuidPattern.test(groupId)) {
    response.status(400).json({ error: "groupId must be a valid UUID" });
    return;
  }
  if (typeof fromUser !== "string" || !uuidPattern.test(fromUser)) {
    response.status(400).json({ error: "fromUser must be a valid UUID" });
    return;
  }
  if (typeof toUser !== "string" || !uuidPattern.test(toUser)) {
    response.status(400).json({ error: "toUser must be a valid UUID" });
    return;
  }
  if (fromUser === toUser) {
    response.status(400).json({ error: "A user cannot settle with themselves" });
    return;
  }
  if (
    (typeof amount !== "string" && typeof amount !== "number") ||
    !moneyPattern.test(String(amount)) ||
    Number(amount) <= 0
  ) {
    response
      .status(400)
      .json({ error: "amount must be a positive monetary value" });
    return;
  }

  try {
    const participantIds = [fromUser, toUser];
    const memberships = await db
      .select({ userId: groupMembers.userId })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          inArray(groupMembers.userId, participantIds),
        ),
      );

    if (memberships.length !== participantIds.length) {
      response
        .status(400)
        .json({ error: "Both users must belong to the group" });
      return;
    }

    const [settlement] = await db
      .insert(settlements)
      .values({
        groupId,
        fromUser,
        toUser,
        amount: Number(amount).toFixed(2),
      })
      .returning();

    response.status(201).json(settlement);
  } catch (error) {
    next(error);
  }
});

export default router;
