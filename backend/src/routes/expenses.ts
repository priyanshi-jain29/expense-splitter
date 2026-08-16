import { and, eq, inArray } from "drizzle-orm";
import { Router } from "express";
import { db } from "../db/index.js";
import { expenseShares, expenses, groupMembers, users } from "../db/schema.js";

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

type SplitType = "equal" | "exact";
type ShareValue = { userId: string; shareAmount: string };

function buildShares(
  amountInCents: number,
  splitType: SplitType,
  members: unknown,
  paidBy: string,
): { shares: ShareValue[] } | { error: string } {
  if (!Array.isArray(members) || members.length === 0) {
    return { error: "members must be a non-empty array" };
  }

  let shares: ShareValue[];
  if (splitType === "equal") {
    if (
      !members.every(
        (member): member is string =>
          typeof member === "string" && uuidPattern.test(member),
      )
    ) {
      return { error: "equal-split members must be user IDs" };
    }
    if (!members.includes(paidBy)) {
      return { error: "equal-split members must include the payer" };
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
        return {
          error: "exact-split members must include userId and shareAmount",
        };
      }

      const { userId, shareAmount } = member as Record<string, unknown>;
      const shareInCents = toCents(shareAmount);
      if (
        typeof userId !== "string" ||
        !uuidPattern.test(userId) ||
        shareInCents === null ||
        shareInCents < 0
      ) {
        return {
          error: "each exact share must have a valid userId and shareAmount",
        };
      }
      exactShares.push({ userId, cents: shareInCents });
    }

    if (
      exactShares.reduce((total, share) => total + share.cents, 0) !==
      amountInCents
    ) {
      return { error: "exact shares must sum to the expense amount" };
    }
    shares = exactShares.map(({ userId, cents }) => ({
      userId,
      shareAmount: formatCents(cents),
    }));
  }

  const participantIds = shares.map((share) => share.userId);
  if (new Set(participantIds).size !== participantIds.length) {
    return { error: "members must not contain duplicates" };
  }

  return { shares };
}

router.get("/:expenseId", async (request, response, next) => {
  const { expenseId } = request.params;
  if (!uuidPattern.test(expenseId)) {
    response.status(400).json({ error: "expenseId must be a valid UUID" });
    return;
  }

  try {
    const [expense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, expenseId))
      .limit(1);

    if (!expense) {
      response.status(404).json({ error: "Expense not found" });
      return;
    }

    const shares = await db
      .select({
        userId: users.id,
        name: users.name,
        is_placeholder: users.isPlaceholder,
        shareAmount: expenseShares.shareAmount,
      })
      .from(expenseShares)
      .innerJoin(users, eq(users.id, expenseShares.userId))
      .where(eq(expenseShares.expenseId, expenseId));

    response.json({ ...expense, shares });
  } catch (error) {
    next(error);
  }
});

router.put("/:expenseId", async (request, response, next) => {
  const { expenseId } = request.params;
  const { amount, description, splitType, members } =
    (request.body as Record<string, unknown> | undefined) ?? {};
  const amountInCents = toCents(amount);

  if (!uuidPattern.test(expenseId)) {
    response.status(400).json({ error: "expenseId must be a valid UUID" });
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

  try {
    const [existingExpense] = await db
      .select()
      .from(expenses)
      .where(eq(expenses.id, expenseId))
      .limit(1);

    if (!existingExpense) {
      response.status(404).json({ error: "Expense not found" });
      return;
    }

    const splitResult = buildShares(
      amountInCents,
      splitType,
      members,
      existingExpense.paidBy,
    );
    if ("error" in splitResult) {
      response.status(400).json({ error: splitResult.error });
      return;
    }
    const { shares } = splitResult;
    const participantIds = shares.map((share) => share.userId);
    const validMembers = await db
      .select({ userId: groupMembers.userId })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, existingExpense.groupId),
          inArray(groupMembers.userId, participantIds),
        ),
      );

    if (validMembers.length !== participantIds.length) {
      response
        .status(400)
        .json({ error: "split members must belong to the group" });
      return;
    }

    const result = await db.transaction(async (transaction) => {
      const [expense] = await transaction
        .update(expenses)
        .set({
          amount: formatCents(amountInCents),
          description: description.trim(),
          splitType,
        })
        .where(eq(expenses.id, expenseId))
        .returning();

      await transaction
        .delete(expenseShares)
        .where(eq(expenseShares.expenseId, expenseId));

      const updatedShares = await transaction
        .insert(expenseShares)
        .values(
          shares.map((share) => ({
            expenseId,
            userId: share.userId,
            shareAmount: share.shareAmount,
          })),
        )
        .returning();

      return { ...expense, shares: updatedShares };
    });

    response.json(result);
  } catch (error) {
    next(error);
  }
});

router.delete("/:expenseId", async (request, response, next) => {
  const { expenseId } = request.params;
  if (!uuidPattern.test(expenseId)) {
    response.status(400).json({ error: "expenseId must be a valid UUID" });
    return;
  }

  try {
    const [deletedExpense] = await db
      .delete(expenses)
      .where(eq(expenses.id, expenseId))
      .returning({ id: expenses.id });

    if (!deletedExpense) {
      response.status(404).json({ error: "Expense not found" });
      return;
    }

    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

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
  const splitResult = buildShares(
    amountInCents,
    splitType,
    members,
    paidBy,
  );
  if ("error" in splitResult) {
    response.status(400).json({ error: splitResult.error });
    return;
  }
  const { shares } = splitResult;
  const participantIds = shares.map((share) => share.userId);

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
