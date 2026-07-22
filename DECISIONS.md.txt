# Group Expense Splitter — Project Decisions

## Stack
- Backend: Node.js + TypeScript, Drizzle ORM, PostgreSQL, Better Auth
- Frontend: React Native + Expo
- Repo type: monorepo (backend/ and mobile/ folders, one git history)

## Core Rules
- Balances are always calculated on the backend, never the client
- Balances shown as simplified/net (one net number per person-pair), with itemized breakdown available underneath
- Only the person who paid an expense can log it (no logging on someone else's behalf)
- Only the person who is OWED money can confirm a settlement (not the debtor)
- Partial settlements are supported; backend recalculates remaining balance
- No default split type — user picks Equal or Exact every time
- Expense description/purpose is required, not optional
- Users can belong to multiple groups
- Members can be added even if not registered yet (placeholder profile: name only), linked to a real account once they sign up
- Placeholder members cannot access/view the group until they log in or sign up

## v1 Screens
1. Login/Signup — email+password AND Google sign-in (Better Auth)
2. My Groups — total balance + list of group cards (no photo icons, text-only)
3. Inside a Group — shows only the logged-in user's own net balances with each member, plus itemized breakdown
4. Add Expense — amount, required description, split type (no default), scrollable member checklist, no default selection, payer = logged-in user automatically
5. Settle-up — net + itemized breakdown, editable amount (partial allowed), Show QR + Remind buttons, Confirm Payment Received
6. Create Group — group name, then "Add Members" or "Send Invite Link"
7. Add Members — search registered users, or add as placeholder by name
8. Activity Feed — feed of expense/settle events across all groups, grouped by day
9. Expense Detail — amount, split breakdown, receipt (add/replace), Edit + Delete buttons
- Edit Expense reuses the Add Expense screen, pre-filled

## Design
- Dark theme: black/grey background, yellow accent
- Frame size: 390x844 (standard Android/iPhone)
- Bottom nav: 2 tabs — Groups, Activity (consistent on every screen)

## Deferred (not in v1)
- Percentage-based splits
- Push notifications (FCM)
- Real payment integration (settle-up is record-only)