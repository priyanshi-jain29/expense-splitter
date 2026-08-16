import { and, eq, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Router } from "express";
import { db } from "../db/index.js";
import {
  expenseShares,
  expenses,
  groupMembers,
  groups,
  settlements,
  users,
} from "../db/schema.js";

const router = Router();
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const settlementPayer = alias(users, "settlement_payer");
const settlementRecipient = alias(users, "settlement_recipient");

router.get("/", async (request, response, next) => {
  const { userId } = request.query;

  if (typeof userId !== "string" || !uuidPattern.test(userId)) {
    response.status(400).json({ error: "userId must be a valid UUID" });
    return;
  }

  try {
    const userGroups = await db
      .select({ id: groups.id, name: groups.name })
      .from(groups)
      .innerJoin(groupMembers, eq(groups.id, groupMembers.groupId))
      .where(eq(groupMembers.userId, userId));

    response.json(userGroups);
  } catch (error) {
    next(error);
  }
});

router.get("/:groupId/activity", async (request, response, next) => {
  const { groupId } = request.params;

  if (!uuidPattern.test(groupId)) {
    response.status(400).json({ error: "groupId must be a valid UUID" });
    return;
  }

  try {
    const [groupExpenses, groupSettlements] = await Promise.all([
      db
        .select({
          id: expenses.id,
          description: expenses.description,
          payerName: users.name,
          amount: expenses.amount,
          timestamp: expenses.createdAt,
        })
        .from(expenses)
        .innerJoin(users, eq(users.id, expenses.paidBy))
        .where(eq(expenses.groupId, groupId)),
      db
        .select({
          id: settlements.id,
          payerName: settlementPayer.name,
          recipientName: settlementRecipient.name,
          amount: settlements.amount,
          timestamp: settlements.createdAt,
        })
        .from(settlements)
        .innerJoin(
          settlementPayer,
          eq(settlementPayer.id, settlements.fromUser),
        )
        .innerJoin(
          settlementRecipient,
          eq(settlementRecipient.id, settlements.toUser),
        )
        .where(eq(settlements.groupId, groupId)),
    ]);

    const activity = [
      ...groupExpenses.map((expense) => ({
        id: expense.id,
        type: "expense" as const,
        description: `${expense.description} — paid by ${expense.payerName}`,
        amount: Number(expense.amount),
        timestamp: expense.timestamp,
      })),
      ...groupSettlements.map((settlement) => ({
        id: settlement.id,
        type: "settlement" as const,
        description: `${settlement.payerName} paid ${settlement.recipientName}`,
        amount: Number(settlement.amount),
        timestamp: settlement.timestamp,
      })),
    ].sort(
      (first, second) =>
        second.timestamp.getTime() - first.timestamp.getTime(),
    );

    response.json(activity);
  } catch (error) {
    next(error);
  }
});

router.get("/:groupId/members", async (request, response, next) => {
  const { groupId } = request.params;

  if (!uuidPattern.test(groupId)) {
    response.status(400).json({ error: "groupId must be a valid UUID" });
    return;
  }

  try {
    const members = await db
      .select({
        id: users.id,
        name: users.name,
        is_placeholder: users.isPlaceholder,
      })
      .from(groupMembers)
      .innerJoin(users, eq(users.id, groupMembers.userId))
      .where(eq(groupMembers.groupId, groupId));

    response.json(members);
  } catch (error) {
    next(error);
  }
});

router.post("/:groupId/members", async (request, response, next) => {
  const { groupId } = request.params;
  const { userId, name } =
    (request.body as { userId?: unknown; name?: unknown } | undefined) ?? {};

  if (!uuidPattern.test(groupId)) {
    response.status(400).json({ error: "groupId must be a valid UUID" });
    return;
  }

  const hasUserId = userId !== undefined;
  const hasName = name !== undefined;
  if (hasUserId === hasName) {
    response.status(400).json({ error: "Provide either userId or name" });
    return;
  }
  if (hasUserId && (typeof userId !== "string" || !uuidPattern.test(userId))) {
    response.status(400).json({ error: "userId must be a valid UUID" });
    return;
  }
  if (
    hasName &&
    (typeof name !== "string" ||
      name.trim().length === 0 ||
      name.trim().length > 255)
  ) {
    response.status(400).json({
      error: "name is required and must be 255 characters or fewer",
    });
    return;
  }

  try {
    const [group] = await db
      .select({ id: groups.id })
      .from(groups)
      .where(eq(groups.id, groupId))
      .limit(1);

    if (!group) {
      response.status(404).json({ error: "Group not found" });
      return;
    }

    if (typeof userId === "string") {
      const [member] = await db
        .select({
          id: users.id,
          name: users.name,
          is_placeholder: users.isPlaceholder,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!member) {
        response.status(404).json({ error: "User not found" });
        return;
      }

      const [existingMembership] = await db
        .select({ id: groupMembers.id })
        .from(groupMembers)
        .where(
          and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, userId),
          ),
        )
        .limit(1);

      if (existingMembership) {
        response.status(409).json({ error: "User is already a group member" });
        return;
      }

      await db.insert(groupMembers).values({ groupId, userId });
      response.status(201).json(member);
      return;
    }

    const member = await db.transaction(async (transaction) => {
      const [placeholder] = await transaction
        .insert(users)
        .values({
          name: (name as string).trim(),
          isPlaceholder: true,
        })
        .returning({
          id: users.id,
          name: users.name,
          is_placeholder: users.isPlaceholder,
        });

      await transaction.insert(groupMembers).values({
        groupId,
        userId: placeholder.id,
      });

      return placeholder;
    });

    response.status(201).json(member);
  } catch (error) {
    next(error);
  }
});

router.get("/:groupId/balances", async (request, response, next) => {
  const { groupId } = request.params;
  const { userId } = request.query;

  if (!uuidPattern.test(groupId)) {
    response.status(400).json({ error: "groupId must be a valid UUID" });
    return;
  }

  if (typeof userId !== "string" || !uuidPattern.test(userId)) {
    response.status(400).json({ error: "userId must be a valid UUID" });
    return;
  }

  try {
    const [membership] = await db
      .select({ id: groupMembers.id })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, userId),
        ),
      )
      .limit(1);

    if (!membership) {
      response.status(403).json({ error: "User is not a member of this group" });
      return;
    }

    const [members, owedToUser, owedByUser, groupSettlements] =
      await Promise.all([
        db
          .select({ userId: users.id, name: users.name })
          .from(groupMembers)
          .innerJoin(users, eq(users.id, groupMembers.userId))
          .where(
            and(
              eq(groupMembers.groupId, groupId),
              ne(groupMembers.userId, userId),
            ),
          ),
        db
          .select({
            userId: expenseShares.userId,
            amount: expenseShares.shareAmount,
          })
          .from(expenses)
          .innerJoin(expenseShares, eq(expenseShares.expenseId, expenses.id))
          .where(
            and(
              eq(expenses.groupId, groupId),
              eq(expenses.paidBy, userId),
              ne(expenseShares.userId, userId),
            ),
          ),
        db
          .select({
            userId: expenses.paidBy,
            amount: expenseShares.shareAmount,
          })
          .from(expenses)
          .innerJoin(expenseShares, eq(expenseShares.expenseId, expenses.id))
          .where(
            and(
              eq(expenses.groupId, groupId),
              ne(expenses.paidBy, userId),
              eq(expenseShares.userId, userId),
            ),
          ),
        db
          .select({
            fromUser: settlements.fromUser,
            toUser: settlements.toUser,
            amount: settlements.amount,
          })
          .from(settlements)
          .where(eq(settlements.groupId, groupId)),
      ]);

    const netByUser = new Map(members.map((member) => [member.userId, 0]));
    const adjustNet = (memberId: string, amount: number) => {
      if (netByUser.has(memberId)) {
        netByUser.set(memberId, netByUser.get(memberId)! + amount);
      }
    };

    for (const share of owedToUser) {
      adjustNet(share.userId, Number(share.amount));
    }
    for (const share of owedByUser) {
      adjustNet(share.userId, -Number(share.amount));
    }
    for (const settlement of groupSettlements) {
      if (settlement.fromUser === userId) {
        adjustNet(settlement.toUser, Number(settlement.amount));
      } else if (settlement.toUser === userId) {
        adjustNet(settlement.fromUser, -Number(settlement.amount));
      }
    }

    const balances = members.map((member) => {
      const signedNet = netByUser.get(member.userId) ?? 0;
      return {
        ...member,
        netAmount: Number(Math.abs(signedNet).toFixed(2)),
        direction: signedNet >= 0 ? "owed_to_you" : "you_owe",
      };
    });

    response.json(balances);
  } catch (error) {
    next(error);
  }
});

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
