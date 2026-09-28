# Census delta (baseline, no extraction, no execution)

Run `20260928T065306-59b047` · 35 decision points · 23 undecided by the plan

| Census | Kind | Where | Code | Decided by |
|---|---|---|---|---|
| C-001 | constant | src/ledger.ts:9 | `DAILY_WITHDRAWAL_LIMIT = 5000` | **none** |
| C-002 | constant | src/ledger.ts:10 | `FEE_PERCENT = 1` | P-012 (0.86) |
| C-003 | constant | src/ledger.ts:11 | `MIN_FEE_CENTS = 50` | P-012 (0.94) |
| C-004 | constant | src/ledger.ts:12 | `MAX_FEE_CENTS = 2500` | **none** |
| C-005 | constant | src/ledger.ts:13 | `DAYS_PER_YEAR = 365` | P-015 (0.93) |
| C-006 | rounding | src/ledger.ts:16 | `Math.round(Math.abs(amount) * 100 + 1e-7)` | P-010 (0.74) |
| C-007 | literal | src/ledger.ts:20 | `cents / 100` | **none** |
| C-008 | rounding | src/ledger.ts:24 | `Math.ceil((cents * FEE_PERCENT) / 100 - 1e-9)` | **none** |
| C-009 | condition | src/ledger.ts:35 | `!this.balances.has(account)` | **none** |
| C-010 | default | src/ledger.ts:42 | `this.balances.get(account) ?? 0` | **none** |
| C-011 | condition | src/ledger.ts:50 | `!(amount > 0)` | P-005 (0.87) |
| C-012 | condition | src/ledger.ts:51 | `this.seen.has(txnId)` | **none** |
| C-013 | condition | src/ledger.ts:59 | `!(amount > 0) \|\| !(rate > 0)` | **none** |
| C-014 | condition | src/ledger.ts:60 | `this.seen.has(txnId)` | **none** |
| C-015 | condition | src/ledger.ts:62 | `cents <= 0` | P-005 (0.80) |
| C-016 | condition | src/ledger.ts:70 | `!(amount > 0)` | P-005 (0.88) |
| C-017 | condition | src/ledger.ts:71 | `this.seen.has(txnId)` | **none** |
| C-018 | condition | src/ledger.ts:75 | `this.cents(account) - (cents + fee) < 0` | **none** |
| C-019 | default | src/ledger.ts:76 | `this.withdrawnToday.get(account) ?? 0` | **none** |
| C-020 | condition | src/ledger.ts:77 | `used + cents > DAILY_WITHDRAWAL_LIMIT * 100` | **none** |
| C-021 | condition | src/ledger.ts:85 | `!(amount > 0)` | P-005 (0.88) |
| C-022 | condition | src/ledger.ts:86 | `this.seen.has(txnId)` | **none** |
| C-023 | condition | src/ledger.ts:90 | `this.cents(from) - cents < 0` | **none** |
| C-024 | condition | src/ledger.ts:98 | `!(amount > 0)` | P-005 (0.88) |
| C-025 | condition | src/ledger.ts:99 | `recipients.length === 0` | **none** |
| C-026 | condition | src/ledger.ts:100 | `this.seen.has(txnId)` | **none** |
| C-027 | condition | src/ledger.ts:104 | `this.cents(from) - cents < 0` | **none** |
| C-028 | rounding | src/ledger.ts:105 | `Math.floor(cents / recipients.length)` | **none** |
| C-029 | condition | src/ledger.ts:108 | `i < remainder` | **none** |
| C-030 | condition | src/ledger.ts:114 | `!(annualRatePercent > 0) \|\| !(days > 0)` | **none** |
| C-031 | condition | src/ledger.ts:115 | `this.seen.has(txnId)` | **none** |
| C-032 | literal | src/ledger.ts:117 | `100 * DAYS_PER_YEAR` | P-010 (0.70) |
| C-033 | rounding | src/ledger.ts:118 | `Math.floor(exact + 1e-7)` | P-010 (0.70) |
| C-034 | condition | src/ledger.ts:119 | `cents <= 0` | P-005 (0.82) |
| C-035 | default | src/ledger.ts:126 | `this.balances.get(account) ?? 0` | **none** |

## Plan sentences no decision point was matched to

- P-001: Build an in-memory ledger for customer accounts.
- P-002: Use TypeScript with no runtime dependencies.
- P-003: Customers can deposit funds into an account.
- P-004: Customers can withdraw funds from an account.
- P-006: Customers can transfer funds between two accounts.
- P-007: A transfer to the same account is rejected.
- P-008: Every accepted operation is recorded in the account history.
- P-009: Each operation carries a client-supplied transaction id so that retries are safe.
- P-011: An amount with more than two decimals is rounded to the nearest cent, with halves rounded away from zero.
- P-013: The fee is recorded in the account history as its own entry, separate from the withdrawal.
- P-014: Customers can deposit an amount in a foreign currency together with an exchange rate; the amount is converted at that rate and rounded to the nearest cent, with halves rounded to even.
- P-016: A split payment divides an amount evenly between several recipient accounts.
- P-017: Persistence, authentication, exchange-rate lookup.
