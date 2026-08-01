import { relations } from "drizzle-orm";
import {
  boolean,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const splitTypeEnum = pgEnum("split_type", ["equal", "exact"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    // Placeholder members may not have an email until they claim their account.
    email: varchar("email", { length: 320 }),
    passwordHash: varchar("password_hash", { length: 255 }),
    isPlaceholder: boolean("is_placeholder").notNull().default(false),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const groups = pgTable("groups", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const groupMembers = pgTable(
  "group_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groups.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
  },
  (table) => [
    uniqueIndex("group_members_group_user_unique").on(
      table.groupId,
      table.userId,
    ),
  ],
);

export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  paidBy: uuid("paid_by")
    .notNull()
    .references(() => users.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  splitType: splitTypeEnum("split_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const expenseShares = pgTable(
  "expense_shares",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    expenseId: uuid("expense_id")
      .notNull()
      .references(() => expenses.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    shareAmount: numeric("share_amount", { precision: 12, scale: 2 }).notNull(),
  },
  (table) => [
    uniqueIndex("expense_shares_expense_user_unique").on(
      table.expenseId,
      table.userId,
    ),
  ],
);

export const settlements = pgTable("settlements", {
  id: uuid("id").defaultRandom().primaryKey(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  fromUser: uuid("from_user")
    .notNull()
    .references(() => users.id),
  toUser: uuid("to_user")
    .notNull()
    .references(() => users.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  createdGroups: many(groups),
  groupMemberships: many(groupMembers),
  paidExpenses: many(expenses),
  expenseShares: many(expenseShares),
  sentSettlements: many(settlements, { relationName: "settlementSender" }),
  receivedSettlements: many(settlements, { relationName: "settlementRecipient" }),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  creator: one(users, {
    fields: [groups.createdBy],
    references: [users.id],
  }),
  members: many(groupMembers),
  expenses: many(expenses),
  settlements: many(settlements),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, {
    fields: [groupMembers.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [groupMembers.userId],
    references: [users.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  group: one(groups, {
    fields: [expenses.groupId],
    references: [groups.id],
  }),
  payer: one(users, {
    fields: [expenses.paidBy],
    references: [users.id],
  }),
  shares: many(expenseShares),
}));

export const expenseSharesRelations = relations(expenseShares, ({ one }) => ({
  expense: one(expenses, {
    fields: [expenseShares.expenseId],
    references: [expenses.id],
  }),
  user: one(users, {
    fields: [expenseShares.userId],
    references: [users.id],
  }),
}));

export const settlementsRelations = relations(settlements, ({ one }) => ({
  group: one(groups, {
    fields: [settlements.groupId],
    references: [groups.id],
  }),
  sender: one(users, {
    fields: [settlements.fromUser],
    references: [users.id],
    relationName: "settlementSender",
  }),
  recipient: one(users, {
    fields: [settlements.toUser],
    references: [users.id],
    relationName: "settlementRecipient",
  }),
}));
