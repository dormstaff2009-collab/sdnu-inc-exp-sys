# Security Specification: SDNU Income & Expense System

## Data Invariants
1. A transaction cannot be created or accessed by anyone other than its authenticated owner (`userId == request.auth.uid`).
2. Transaction amounts must be positive numbers (> 0).
3. Transaction type must be strictly 'income' or 'expense'.
4. User profiles and budgets can only be created, read, updated, or deleted by the authenticated user whose `uid` matches the document path.
5. Users cannot spoof ownership or manipulate transactions of other users.

## The Dirty Dozen Payloads (Designed to break laws of Identity, Integrity, State)
1. **Malicious Owner Inversion**: An authenticated user attempting to create a transaction under `/users/otherUser/transactions/t1` with their own auth.uid.
2. **Identity Spoofing**: An authenticated user writing a transaction with `userId: "victimUserId"`.
3. **Negative Amount Exploit**: Writing a transaction with `amount: -500` to manipulate summaries.
4. **Invalid Type**: Writing a transaction with `type: "transfer_exploit"`.
5. **Junk ID Injection**: Document ID containing 1KB random malicious payload.
6. **Ghost Field Poisoning**: Inserting unexpected schema fields like `isAdmin: true` into `UserProfile`.
7. **Cross-Tenant Budget Tampering**: Writing a monthly budget to another user's budget path `/users/victimId/budgets/2026-10`.
8. **Unauthenticated Read**: Attempting to query `/users/{userId}/transactions` without `request.auth`.
9. **Unauthenticated Write**: Attempting to write `/users/{userId}` without logging in.
10. **Unverified Email / Missing Auth**: Writing transactions when not authenticated or invalid auth token.
11. **Gigantic Note Denial-of-Wallet**: Writing a note larger than 500 characters.
12. **Malformed Month Format**: Writing a budget with `month: "invalid-month-slug"` violating regex `^[0-9]{4}-[0-9]{2}$`.
