import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db/index.js";
import * as schema from "./db/schema.js";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const auth = betterAuth({
  appName: "Social Ledger",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret:
    process.env.BETTER_AUTH_SECRET ??
    "development-only-secret-change-before-production",
  trustedOrigins: [process.env.FRONTEND_URL ?? "http://localhost:8081"],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    transaction: true,
  }),
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
  user: {
    modelName: "users",
    additionalFields: {
      isPlaceholder: {
        type: "boolean",
        required: true,
        defaultValue: false,
        input: false,
      },
    },
  },
  session: {
    modelName: "sessions",
  },
  account: {
    modelName: "accounts",
  },
  verification: {
    modelName: "verifications",
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders:
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : {},
});
