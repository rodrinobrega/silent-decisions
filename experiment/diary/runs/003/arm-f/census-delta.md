# Census delta (baseline, no extraction, no execution)

Run `20260927T140716-b9d0c4` · 15 decision points · 12 undecided by the plan

| Census | Kind | Where | Code | Decided by |
|---|---|---|---|---|
| C-001 | constant | src/ledger.ts:10 | `DAILY_WITHDRAWAL_LIMIT = 5000` | **none** |
| C-002 | rounding | src/ledger.ts:14 | `Math.round(amount * 100)` | **none** |
| C-003 | literal | src/ledger.ts:14 | `Math.round(amount * 100) / 100` | **none** |
| C-004 | condition | src/ledger.ts:24 | `!this.balances.has(account)` | **none** |
| C-005 | default | src/ledger.ts:31 | `this.balances.get(account) ?? 0` | **none** |
| C-006 | condition | src/ledger.ts:39 | `!(amount > 0)` | P-005 (0.88) |
| C-007 | condition | src/ledger.ts:41 | `this.seen.has(txnId)` | **none** |
| C-008 | condition | src/ledger.ts:51 | `!(amount > 0)` | P-005 (0.88) |
| C-009 | condition | src/ledger.ts:52 | `this.seen.has(txnId)` | **none** |
| C-010 | condition | src/ledger.ts:56 | `this.balance(account) - value < 0` | **none** |
| C-011 | default | src/ledger.ts:57 | `this.withdrawnToday.get(account) ?? 0` | **none** |
| C-012 | condition | src/ledger.ts:58 | `used + value > DAILY_WITHDRAWAL_LIMIT` | **none** |
| C-013 | condition | src/ledger.ts:67 | `!(amount > 0)` | P-005 (0.89) |
| C-014 | condition | src/ledger.ts:68 | `this.seen.has(txnId)` | **none** |
| C-015 | condition | src/ledger.ts:72 | `this.balance(from) - value < 0` | **none** |

## Plan sentences no decision point was matched to

- P-001: Build an in-memory ledger for customer accounts.
- P-002: Use TypeScript with no runtime dependencies.
- P-003: Customers can deposit funds into an account.
- P-004: Customers can withdraw funds from an account.
- P-006: Customers can transfer funds between two accounts.
- P-007: A transfer to the same account is rejected.
- P-008: Every accepted operation is recorded in the account history.
- P-009: Each operation carries a client-supplied transaction id so that retries are safe.
- P-010: Persistence, currencies, authentication.
