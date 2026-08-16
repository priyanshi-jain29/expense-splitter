import { and, eq, inArray } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db/index.js";
import { expenseShares, expenses, groupMembers } from "../db/schema.js";

const router = Router();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const moneyPattern = /^\d{1,10}(?:\.\d{1,2})?$/;

function toCents(value: unknown): number | null {
  if (
    (typeof value !== "string" && typeof value !== "number") ||
    !moneyPattern.test(String(value))
  ) {
    return null;
  }

  const [whole, fraction = ""] = String(value).split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

router.post("/", async (request, response, next) => {
  const { groupId, paidBy, amount, description, splitType, members } =
    (request.body as Record<string, unknown> | undefined) ?? {};
  const amountInCents = toCents(amount);

  if (typeof groupId !== "string" || !uuidPattern.test(groupId)) {
    response.status(400).json({ error: "groupId must be a valid UUID" });
    return;
  }
  if (typeof paidBy !== "string" || !uuidPattern.test(paidBy)) {
    response.status(400).json({ error: "paidBy must be a valid UUID" });
    return;
  }
  if (amountInCents === null || amountInCents <= 0) {
    response
      .status(400)
      .json({ error: "amount must be a positive monetary value" });
    return;
  }
  if (
    typeof description !== "string" ||
    description.trim().length === 0 ||
    description.trim().length > 500
  ) {
    response.status(400).json({
      error: "description is required and must be 500 characters or fewer",
    });
    return;
  }
  if (splitType !== "equal" && splitType !== "exact") {
    response.status(400).json({ error: "splitType must be 'equal' or 'exact'" });
    return;
  }
  if (!Array.isArray(members) || members.length === 0) {
    response.status(400).json({ error: "members must be a non-empty array" });
    return;
  }

  let shares: Array<{ userId: string; shareAmount: string }>;

  if (splitType === "equal") {
    if (
      !members.every(
        (member): member is string =>
          typeof member === "string" && uuidPattern.test(member),
      )
    ) {
      response
        .status(400)
        .json({ error: "equal-split members must be user IDs" });
      return;
    }
    if (!members.includes(paidBy)) {
      response
        .status(400)
        .json({ error: "equal-split members must include the payer" });
      return;
    }

    const baseShare = Math.floor(amountInCents / members.length);
    const remainder = amountInCents % members.length;
    shares = members.map((userId, index) => ({
      userId,
      shareAmount: formatCents(baseShare + (index < remainder ? 1 : 0)),
    }));
  } else {
    const exactShares: Array<{ userId: string; cents: number }> = [];
    for (const member of members) {
      if (typeof member !== "object" || member === null) {
        response.status(400).json({
          error: "exact-split members must include userId and shareAmount",
        });
        return;
      }

      const { userId, shareAmount } = member as Record<string, unknown>;
      const shareInCents = toCents(shareAmount);
      if (
        typeof userId !== "string" ||
        !uuidPattern.test(userId) ||
        shareInCents === null ||
        shareInCents < 0
      ) {
        response.status(400).json({
          error: "each exact share must have a valid userId and shareAmount",
        });
        return;
      }
      exactShares.push({ userId, cents: shareInCents });
    }

    if (
      exactShares.reduce((total, share) => total + share.cents, 0) !==
      amountInCents
    ) {
      response
        .status(400)
        .json({ error: "exact shares must sum to the expense amount" });
      return;
    }
    shares = exactShares.map(({ userId, cents }) => ({
      userId,
      shareAmount: formatCents(cents),
    }));
  }

  const participantIds = shares.map((share) => share.userId);
  if (new Set(participantIds).size !== participantIds.length) {
    response.status(400).json({ error: "members must not contain duplicates" });
    return;
  }

  try {
    const idsToVerify = [...new Set([...participantIds, paidBy])];
    const validMembers = await db
      .select({ userId: groupMembers.userId })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          inArray(groupMembers.userId, idsToVerify),
        ),
      );

    if (validMembers.length !== idsToVerify.length) {
      response
        .status(400)
        .json({ error: "payer and split members must belong to the group" });
      return;
    }

    const result = await db.transaction(async (transaction) => {
      const [expense] = await transaction
        .insert(expenses)
        .values({
          groupId,
          paidBy,
          amount: formatCents(amountInCents),
          description: description.trim(),
          splitType,
        })
        .returning();

      const createdShares = await transaction
        .insert(expenseShares)
        .values(
          shares.map((share) => ({
            expenseId: expense.id,
            userId: share.userId,
            shareAmount: share.shareAmount,
          })),
        )
        .returning();

      return { ...expense, shares: createdShares };
    });

    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
