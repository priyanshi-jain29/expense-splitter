Social Ledger

A group expense splitter (basically my own Splitwise clone), built to actually learn a full stack I'd never touched before — Node/TypeScript backend, React Native frontend, real auth, real database.

Why I built this

I wanted a project that forces me to go through every part of building a real app, not just the frontend or just the backend. So this covers everything: designing the screens, picking the data model, writing the API, wiring up auth, connecting it all together.

Stack
Backend: Node.js, TypeScript, Express, Drizzle ORM, PostgreSQL (on Neon), Better Auth
Frontend: React Native + Expo
Design: Google Stitch

What it does
Sign up / log in (email+password, Google sign-in coming)
Create groups, add people to them (they don't even need an account yet — they get added as a placeholder and it links up once they sign up)
Log an expense, split it equally or by exact amounts
See what you owe / are owed per group — calculated by the backend, never faked on the frontend
Settle up (just records that a payment happened, doesn't move real money)
Edit or delete an expense, attach a receipt
Activity feed showing everything that's happened across your groups
Screens

Login/Signup, My Groups, Inside a Group, Add Expense, Settle-up, Create Group, Add Members, Activity Feed, Expense Detail.

Six main tables: users, groups, group_members, expenses, expense_shares, settlements. Plus whatever Better Auth needs (sessions, accounts, verifications).

The main thing I learned here: don't store anything you can calculate. Balances aren't a column anywhere — they're computed fresh from expenses + settlements every time.

API
POST   /groups
GET    /groups
GET    /groups/:groupId/balances
GET    /groups/:groupId/members
POST   /groups/:groupId/members
GET    /groups/:groupId/activity
POST   /expenses
GET    /expenses/:expenseId
PUT    /expenses/:expenseId
DELETE /expenses/:expenseId
POST   /settlements
Running it locally

Backend:

bash
cd backend
npm install
# add a .env with DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, FRONTEND_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
npm run db:generate
npm run db:migrate
npm run dev

Frontend:

bash
cd mobile
npm install
npx expo start --web
Where it's at

The core app works end to end — signup, groups, adding members, logging expenses, real balance calculation, settling up, activity feed, editing/deleting expenses. All hitting a real Postgres database, nothing faked.

Still to do: Google sign-in, receipt uploads, and eventually deploying this somewhere instead of just running on my laptop. Percentage splits and push notifications are on the maybe-later list.
