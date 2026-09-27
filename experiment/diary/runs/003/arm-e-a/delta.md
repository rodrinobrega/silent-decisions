# Delta: plan.md

Run `20260927T134803-260b20` · plan sha256 `b8c7a2b74776`

**25 silent decision(s), 1 dropped requirement(s).**

## Run health

| Check | Result |
|---|---|
| Scenarios | 37 extracted · 37 verified · 0 vacuous · 0 refuted |
| Census (declared) | 15 decision points · 15 covered · 0 waived · 0 uncovered |
| Trace mode | pairwise-classifier · 1120 calls · threshold 0.7 |
| Trace | 12 stated · 0 entailed · 25 unsourced · 1 downgraded by rules |
| Reverse probes | 7 run · 1 dropped · 1 realised but missed by the extractor |
| Leave-one-out | passed (3 statement(s) hidden: 8 flipped, 0 re-sourced, 0 cited hidden text) |
| Leak check | clean · transcript: 10 tool call(s), 0 outside the room, 0 plan mention(s), 1 denied |

## Silent decisions

### unclustered

#### B-001 · A deposit into a new account credits it and records a deposit entry

> Given a new Ledger with no accounts  
> When deposit('A', 100, 't1') is called  
> Then the result is { ok: true }, balance('A') is 100 and entries('A') is one entry { txnId: 't1', kind: 'deposit', amount: 100 }

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, balance('A') is 100 and entries('A') is one entry { txnId: 't1', kind: 'deposit', amount: 100 } |
| **B. The alternative** | the deposit is refused because account 'A' was never opened, and balance('A') stays 0 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-001 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-001 --decision reject --expected "<what should happen>" --by <you>`

#### B-002 · An unknown account reads as balance 0 with no entries

> Given a new Ledger where account 'X' has never been used  
> When balance('X') and entries('X') are read  
> Then balance('X') is 0 and entries('X') is an empty list

| | |
|---|---|
| **A. What the code does** | balance('X') is 0 and entries('X') is an empty list |
| **B. The alternative** | balance('X') is reported as undefined (no such account) rather than 0 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-002 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-002 --decision reject --expected "<what should happen>" --by <you>`

#### B-003 · Opening an account that already exists does not reset it

> Given account 'A' holds 100 after deposit('A', 100, 't1')  
> When open('A') is called again  
> Then balance('A') stays 100 and its single deposit entry is kept

| | |
|---|---|
| **A. What the code does** | balance('A') stays 100 and its single deposit entry is kept |
| **B. The alternative** | the account is re-created: balance('A') becomes 0 and its history is emptied |

Notes: P-010 is typed structural; only behavioural statements can source; stated without a verifiable quote

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-003 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-003 --decision reject --expected "<what should happen>" --by <you>`

#### B-009 · Deposit amounts are rounded to the nearest cent, with half a cent rounding up

> Given a new Ledger  
> When deposit('A', 0.125, 't1') is called  
> Then the result is { ok: true }, balance('A') is 0.13 and the entry amount is 0.13

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, balance('A') is 0.13 and the entry amount is 0.13 |
| **B. The alternative** | the amount is truncated to 0.12 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-009 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-009 --decision reject --expected "<what should happen>" --by <you>`

#### B-010 · Deposit amounts with a third decimal below 5 round down to the cent

> Given a new Ledger  
> When deposit('A', 1.234, 't1') is called  
> Then balance('A') is 1.23

| | |
|---|---|
| **A. What the code does** | balance('A') is 1.23 |
| **B. The alternative** | the amount is kept as 1.234 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-010 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-010 --decision reject --expected "<what should happen>" --by <you>`

#### B-011 · A deposit smaller than half a cent is accepted but records an amount of 0

> Given a new Ledger  
> When deposit('A', 0.004, 't1') is called  
> Then the result is { ok: true }, balance('A') is 0 and one deposit entry with amount 0 is recorded

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, balance('A') is 0 and one deposit entry with amount 0 is recorded |
| **B. The alternative** | the deposit is rejected as invalid-amount because it rounds to 0 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-011 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-011 --decision reject --expected "<what should happen>" --by <you>`

#### B-013 · Withdrawing one cent more than the balance is rejected

> Given account 'A' holds 100  
> When withdraw('A', 100.01, 'w1') is called  
> Then the result is { ok: false, reason: 'insufficient-funds' } and balance('A') stays 100

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' } and balance('A') stays 100 |
| **B. The alternative** | the withdrawal is accepted ({ ok: true }) and balance('A') becomes -0.01 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-013 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-013 --decision reject --expected "<what should happen>" --by <you>`

#### B-014 · Withdrawing more than the balance is rejected and the balance is unchanged

> Given account 'A' holds 100  
> When withdraw('A', 150, 'w1') is called  
> Then the result is { ok: false, reason: 'insufficient-funds' } and balance('A') stays 100

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' } and balance('A') stays 100 |
| **B. The alternative** | the withdrawal is accepted and balance('A') becomes -50 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-014 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-014 --decision reject --expected "<what should happen>" --by <you>`

#### B-015 · Withdrawing from an account that was never funded is rejected as insufficient-funds

> Given a new Ledger  
> When withdraw('Z', 10, 'w1') is called  
> Then the result is { ok: false, reason: 'insufficient-funds' } and balance('Z') is 0

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' } and balance('Z') is 0 |
| **B. The alternative** | the withdrawal is rejected with reason 'unknown-account' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-015 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-015 --decision reject --expected "<what should happen>" --by <you>`

#### B-019 · A txnId already used by a deposit makes a withdrawal with that txnId a silent no-op

> Given deposit('A', 100, 't1') has succeeded  
> When withdraw('A', 40, 't1') is called with the same txnId  
> Then the result is { ok: true } but balance('A') stays 100 and no withdrawal entry is recorded

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } but balance('A') stays 100 and no withdrawal entry is recorded |
| **B. The alternative** | the withdrawal is applied because it is a different kind of operation, and balance('A') becomes 60 |

**The plan may require the opposite:** “Customers can withdraw funds from an account.” (P-004)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-019 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-019 --decision reject --expected "<what should happen>" --by <you>`

#### B-020 · A rejected withdrawal does not use up its txnId, so it can be retried later

> Given account 'A' holds 50 and withdraw('A', 100, 'w1') was rejected for insufficient-funds, then deposit('A', 50, 'd2') brought the balance to 100  
> When withdraw('A', 100, 'w1') is retried  
> Then the result is { ok: true } and balance('A') becomes 0

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and balance('A') becomes 0 |
| **B. The alternative** | the retry is treated as a duplicate of the rejected 'w1', acknowledged, and balance('A') stays 100 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-020 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-020 --decision reject --expected "<what should happen>" --by <you>`

#### B-021 · Withdrawing exactly the daily limit of 5000 in one go is allowed

> Given account 'A' holds 10000 and has not withdrawn anything  
> When withdraw('A', 5000, 'w1') is called  
> Then the result is { ok: true } and balance('A') becomes 5000

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and balance('A') becomes 5000 |
| **B. The alternative** | the withdrawal is rejected with reason 'daily-limit' and balance('A') stays 10000 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-021 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-021 --decision reject --expected "<what should happen>" --by <you>`

#### B-022 · Withdrawing one cent over the daily limit of 5000 is rejected

> Given account 'A' holds 10000 and has not withdrawn anything  
> When withdraw('A', 5000.01, 'w1') is called  
> Then the result is { ok: false, reason: 'daily-limit' } and balance('A') stays 10000

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'daily-limit' } and balance('A') stays 10000 |
| **B. The alternative** | the withdrawal is accepted ({ ok: true }) and balance('A') becomes 4999.99 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-022 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-022 --decision reject --expected "<what should happen>" --by <you>`

#### B-023 · The daily limit is cumulative across withdrawals on the same account

> Given account 'A' holds 10000 and has already withdrawn 3000 and then 2000 (5000 in total)  
> When withdraw('A', 0.01, 'w3') is called  
> Then the result is { ok: false, reason: 'daily-limit' } and balance('A') stays 5000

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'daily-limit' } and balance('A') stays 5000 |
| **B. The alternative** | each withdrawal is checked on its own, so the 0.01 is accepted ({ ok: true }) |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-023 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-023 --decision reject --expected "<what should happen>" --by <you>`

#### B-024 · A withdrawal rejected by the daily limit does not count toward the limit

> Given account 'A' holds 10000, withdrew 4000, then had withdraw 2000 rejected for daily-limit  
> When withdraw('A', 1000, 'w3') is called  
> Then the result is { ok: true } and balance('A') becomes 5000

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and balance('A') becomes 5000 |
| **B. The alternative** | the rejected 2000 is still counted, so the 1000 is rejected with 'daily-limit' and balance('A') stays 6000 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-024 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-024 --decision reject --expected "<what should happen>" --by <you>`

#### B-025 · The daily limit is tracked separately per account

> Given accounts 'A' and 'B' each hold 10000 and 'A' has withdrawn 5000  
> When withdraw('B', 5000, 'wb') is called  
> Then the result is { ok: true } and balance('B') becomes 5000

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and balance('B') becomes 5000 |
| **B. The alternative** | the limit is shared across the whole ledger, so 'B' is rejected with 'daily-limit' |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-025 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-025 --decision reject --expected "<what should happen>" --by <you>`

#### B-026 · Insufficient funds is reported before the daily limit when both apply

> Given account 'A' holds 100  
> When withdraw('A', 6000, 'w1') is called  
> Then the result is { ok: false, reason: 'insufficient-funds' }

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' } |
| **B. The alternative** | the result is { ok: false, reason: 'daily-limit' } |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-026 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-026 --decision reject --expected "<what should happen>" --by <you>`

#### B-027 · Transfers are not subject to or counted toward the daily withdrawal limit

> Given account 'A' holds 20000  
> When transfer('A', 'B', 8000, 't1') is called, then withdraw('A', 5000, 'w1')  
> Then both succeed: balance('A') becomes 7000 and balance('B') becomes 8000

| | |
|---|---|
| **A. What the code does** | both succeed: balance('A') becomes 7000 and balance('B') becomes 8000 |
| **B. The alternative** | the 8000 transfer is rejected with 'daily-limit' |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-027 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-027 --decision reject --expected "<what should happen>" --by <you>`

#### B-028 · A withdrawal amount is rounded to cents before the balance check

> Given account 'A' holds 1  
> When withdraw('A', 0.999, 'w1') is called  
> Then the amount rounds to 1, the result is { ok: true } and balance('A') becomes 0

| | |
|---|---|
| **A. What the code does** | the amount rounds to 1, the result is { ok: true } and balance('A') becomes 0 |
| **B. The alternative** | the unrounded 0.999 is withdrawn, leaving balance('A') at 0.001 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-028 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-028 --decision reject --expected "<what should happen>" --by <you>`

#### B-029 · A transfer moves money between accounts and records an entry on each side

> Given account 'A' holds 100 and 'B' has never been used  
> When transfer('A', 'B', 40, 't1') is called  
> Then the result is { ok: true }, balance('A') is 60, balance('B') is 40, 'A' gets a transfer-out entry of 40 and 'B' gets a transfer-in entry of 40

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, balance('A') is 60, balance('B') is 40, 'A' gets a transfer-out entry of 40 and 'B' gets a transfer-in entry of 40 |
| **B. The alternative** | the transfer is refused because 'B' was never opened, and balance('A') stays 100 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-029 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-029 --decision reject --expected "<what should happen>" --by <you>`

#### B-030 · Transferring exactly the whole balance is allowed

> Given account 'A' holds 100  
> When transfer('A', 'B', 100, 't1') is called  
> Then the result is { ok: true }, balance('A') is 0 and balance('B') is 100

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, balance('A') is 0 and balance('B') is 100 |
| **B. The alternative** | the transfer is rejected as insufficient-funds and both balances stay as they were |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-030 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-030 --decision reject --expected "<what should happen>" --by <you>`

#### B-031 · Transferring one cent more than the balance is rejected and nothing moves

> Given account 'A' holds 100  
> When transfer('A', 'B', 100.01, 't1') is called  
> Then the result is { ok: false, reason: 'insufficient-funds' }, balance('A') stays 100, balance('B') stays 0 and no transfer entries are recorded

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' }, balance('A') stays 100, balance('B') stays 0 and no transfer entries are recorded |
| **B. The alternative** | the transfer goes through ({ ok: true }), balance('A') becomes -0.01 and balance('B') becomes 100.01 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-031 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-031 --decision reject --expected "<what should happen>" --by <you>`

#### B-035 · A transfer from an account to itself is accepted, leaves the balance unchanged and records two entries

> Given account 'A' holds 100  
> When transfer('A', 'A', 30, 't1') is called  
> Then the result is { ok: true }, balance('A') stays 100, and entries('A') gains a transfer-out of 30 then a transfer-in of 30

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, balance('A') stays 100, and entries('A') gains a transfer-out of 30 then a transfer-in of 30 |
| **B. The alternative** | the self-transfer is rejected and entries('A') holds only the original deposit |

**The plan may require the opposite:** “A transfer to the same account is rejected.” (P-007)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-035 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-035 --decision reject --expected "<what should happen>" --by <you>`

#### B-036 · Transfer amounts are rounded to the nearest cent, with half a cent rounding up

> Given account 'A' holds 1  
> When transfer('A', 'B', 0.125, 't1') is called  
> Then balance('B') is 0.13 and the transfer-in entry amount is 0.13

| | |
|---|---|
| **A. What the code does** | balance('B') is 0.13 and the transfer-in entry amount is 0.13 |
| **B. The alternative** | the amount is truncated and balance('B') is 0.12 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-036 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-036 --decision reject --expected "<what should happen>" --by <you>`

#### B-037 · The list returned by entries is a copy; changing it does not change the ledger's history

> Given account 'A' has one deposit entry  
> When the caller empties the array returned by entries('A') and reads entries('A') again  
> Then entries('A') still has 1 entry

| | |
|---|---|
| **A. What the code does** | entries('A') still has 1 entry |
| **B. The alternative** | the caller's change leaks into the ledger and entries('A') is now empty |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-037 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-037 --decision reject --expected "<what should happen>" --by <you>`

## Dropped requirements

#### P-007

> A transfer to the same account is rejected.

Plan line 13. Probe `PR-P-007` fails against the code: AssertionError: expected true to be false // Object.is equality

Contradicting behaviour(s): B-035.

## Extractor misses

The code does realise these statements, but blind extraction did not describe the behaviour. This is a measure of extraction recall, not a defect in the code.

- P-004: Customers can withdraw funds from an account.
