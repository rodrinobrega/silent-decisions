# Delta: plan.md

Run `20260927T130316-1614eb` · plan sha256 `b8c7a2b74776`

**24 silent decision(s), 1 dropped requirement(s).**

## Run health

| Check | Result |
|---|---|
| Scenarios | 40 extracted · 40 verified · 0 vacuous · 0 refuted |
| Census (declared) | 15 decision points · 15 covered · 0 waived · 0 uncovered |
| Trace mode | pairwise-classifier · 2210 calls · threshold 0.7 |
| Trace | 16 stated · 0 entailed · 24 unsourced · 0 downgraded by rules |
| Reverse probes | 7 run · 1 dropped · 3 realised but missed by the extractor |
| Leave-one-out | passed (3 statement(s) hidden: 10 flipped, 0 re-sourced, 0 cited hidden text) |
| Leak check | suspect · no audit log (hook not installed) |

Open issues with this run:

- leak check: **suspect**

## Silent decisions

### unclustered

#### B-001 · Opening a new account starts it at a balance of 0 with no entries

> Given a new Ledger with no accounts  
> When account 'A' is opened  
> Then balance('A') is 0 and entries('A') is an empty list

| | |
|---|---|
| **A. What the code does** | balance('A') is 0 and entries('A') is an empty list |
| **B. The alternative** | the account starts with a non-zero balance or an opening entry is recorded |

**The plan may require the opposite:** “Every accepted operation is recorded in the account history.” (P-008)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-001 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-001 --decision reject --expected "<what should happen>" --by <you>`

#### B-003 · An account never opened reports a balance of 0 and no entries

> Given a new Ledger where account 'X' has never been opened or used  
> When balance('X') and entries('X') are read  
> Then balance is 0 and entries is an empty list

| | |
|---|---|
| **A. What the code does** | balance is 0 and entries is an empty list |
| **B. The alternative** | reading the balance of an unknown account fails with an error or returns undefined |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-003 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-003 --decision reject --expected "<what should happen>" --by <you>`

#### B-004 · A deposit into an unopened account opens it and credits it

> Given a new Ledger where account 'A' was never opened  
> When 100 is deposited into 'A' with txnId 't1'  
> Then the result is { ok: true }, balance('A') is 100 and entries('A') is [{ txnId: 't1', kind: 'deposit', amount: 100 }]

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, balance('A') is 100 and entries('A') is [{ txnId: 't1', kind: 'deposit', amount: 100 }] |
| **B. The alternative** | the deposit is rejected because the account does not exist and the balance stays 0 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-004 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-004 --decision reject --expected "<what should happen>" --by <you>`

#### B-009 · A deposit reusing a txnId already used by another account is ignored

> Given account 'A' received a deposit of 100 with txnId 't1'  
> When 50 is deposited into account 'B' with txnId 't1'  
> Then the result is { ok: true } but balance('B') is 0 and entries('B') is empty

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } but balance('B') is 0 and entries('B') is empty |
| **B. The alternative** | txnIds are tracked per account, so 'B' is credited and its balance becomes 50 |

**The plan may require the opposite:** “Customers can deposit funds into an account.” (P-003); “A transfer to the same account is rejected.” (P-007)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-009 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-009 --decision reject --expected "<what should happen>" --by <you>`

#### B-011 · Deposit amounts are rounded to cents, with a half cent rounding up

> Given account 'A' is open with balance 0  
> When 0.125 is deposited with txnId 't1'  
> Then balance('A') is 0.13 and the entry amount is 0.13

| | |
|---|---|
| **A. What the code does** | balance('A') is 0.13 and the entry amount is 0.13 |
| **B. The alternative** | half a cent rounds to even (or is truncated) and the balance is 0.12 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-011 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-011 --decision reject --expected "<what should happen>" --by <you>`

#### B-012 · Sub-cent fractions below a half cent are rounded down

> Given account 'A' is open with balance 0  
> When 10.004 is deposited with txnId 't1'  
> Then balance('A') is 10 and the entry amount is 10

| | |
|---|---|
| **A. What the code does** | balance('A') is 10 and the entry amount is 10 |
| **B. The alternative** | the amount is kept unrounded and the balance is 10.004 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-012 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-012 --decision reject --expected "<what should happen>" --by <you>`

#### B-013 · A deposit that rounds to 0 cents is accepted and recorded as an entry of 0

> Given account 'A' is open with balance 0  
> When 0.004 is deposited with txnId 't1'  
> Then the result is { ok: true }, the balance stays 0 and an entry { txnId: 't1', kind: 'deposit', amount: 0 } is recorded

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, the balance stays 0 and an entry { txnId: 't1', kind: 'deposit', amount: 0 } is recorded |
| **B. The alternative** | the deposit is rejected with reason 'invalid-amount' because it rounds to 0 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-013 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-013 --decision reject --expected "<what should happen>" --by <you>`

#### B-016 · Withdrawing more than the balance is rejected as insufficient-funds

> Given account 'A' has a balance of 100  
> When 150 is withdrawn with txnId 'w1'  
> Then the result is { ok: false, reason: 'insufficient-funds' }, the balance stays 100 and no withdrawal entry is recorded

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' }, the balance stays 100 and no withdrawal entry is recorded |
| **B. The alternative** | the withdrawal is accepted and the balance becomes -50 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-016 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-016 --decision reject --expected "<what should happen>" --by <you>`

#### B-017 · Withdrawing exactly the whole balance is allowed and leaves 0

> Given account 'A' has a balance of 100  
> When 100 is withdrawn with txnId 'w1'  
> Then the result is { ok: true }, the balance is 0 and a withdrawal entry of 100 is recorded

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, the balance is 0 and a withdrawal entry of 100 is recorded |
| **B. The alternative** | the withdrawal is rejected as insufficient-funds and the balance stays 100 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-017 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-017 --decision reject --expected "<what should happen>" --by <you>`

#### B-018 · Withdrawing from an unopened account is rejected as insufficient-funds

> Given a new Ledger where account 'Z' was never opened  
> When 10 is withdrawn from 'Z' with txnId 'w1'  
> Then the result is { ok: false, reason: 'insufficient-funds' } and balance('Z') is 0

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' } and balance('Z') is 0 |
| **B. The alternative** | the withdrawal is rejected with reason 'unknown-account' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-018 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-018 --decision reject --expected "<what should happen>" --by <you>`

#### B-021 · A withdrawal reusing a deposit's txnId is silently ignored

> Given account 'A' received a deposit of 100 with txnId 't1'  
> When 40 is withdrawn from 'A' with txnId 't1'  
> Then the result is { ok: true } and the balance stays 100

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and the balance stays 100 |
| **B. The alternative** | txnIds are tracked per operation type, so the withdrawal goes through and the balance becomes 60 |

**The plan may require the opposite:** “Customers can withdraw funds from an account.” (P-004)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-021 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-021 --decision reject --expected "<what should happen>" --by <you>`

#### B-022 · Withdrawing exactly the daily limit of 5000 is allowed

> Given account 'A' has a balance of 10000 and nothing withdrawn yet  
> When 5000 is withdrawn with txnId 'w1'  
> Then the result is { ok: true } and the balance becomes 5000

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and the balance becomes 5000 |
| **B. The alternative** | the withdrawal is rejected with reason 'daily-limit' and the balance stays 10000 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-022 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-022 --decision reject --expected "<what should happen>" --by <you>`

#### B-023 · A single withdrawal of 5000.01 exceeds the daily limit

> Given account 'A' has a balance of 10000 and nothing withdrawn yet  
> When 5000.01 is withdrawn with txnId 'w1'  
> Then the result is { ok: false, reason: 'daily-limit' } and the balance stays 10000

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'daily-limit' } and the balance stays 10000 |
| **B. The alternative** | the withdrawal is accepted and the balance becomes 4999.99 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-023 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-023 --decision reject --expected "<what should happen>" --by <you>`

#### B-024 · The daily limit is cumulative across withdrawals

> Given account 'A' has a balance of 10000 and withdrawal 'w1' of 3000 succeeded  
> When 2000.01 is withdrawn with txnId 'w2'  
> Then the result is { ok: false, reason: 'daily-limit' } and the balance stays 7000

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'daily-limit' } and the balance stays 7000 |
| **B. The alternative** | the limit applies per withdrawal, so it is accepted and the balance becomes 4999.99 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-024 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-024 --decision reject --expected "<what should happen>" --by <you>`

#### B-025 · Cumulative withdrawals reaching exactly 5000 are allowed

> Given account 'A' has a balance of 10000 and withdrawal 'w1' of 3000 succeeded  
> When 2000 is withdrawn with txnId 'w2'  
> Then the result is { ok: true } and the balance becomes 5000

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and the balance becomes 5000 |
| **B. The alternative** | the withdrawal is rejected with reason 'daily-limit' and the balance stays 7000 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-025 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-025 --decision reject --expected "<what should happen>" --by <you>`

#### B-027 · A withdrawal rejected by the daily limit does not use up any of the limit

> Given account 'A' has a balance of 10000 and withdrawal 'w1' of 6000 was rejected as daily-limit  
> When 5000 is withdrawn with txnId 'w2'  
> Then the result is { ok: true } and the balance becomes 5000

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and the balance becomes 5000 |
| **B. The alternative** | the rejected 6000 counted toward the limit, so this is rejected as daily-limit |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-027 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-027 --decision reject --expected "<what should happen>" --by <you>`

#### B-028 · Insufficient funds is reported ahead of the daily limit

> Given account 'A' has a balance of 100  
> When 6000 is withdrawn with txnId 'w1'  
> Then the result is { ok: false, reason: 'insufficient-funds' }

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' } |
| **B. The alternative** | the daily limit is checked first and the reason is 'daily-limit' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-028 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-028 --decision reject --expected "<what should happen>" --by <you>`

#### B-029 · Withdrawal amounts are rounded to cents before the limit check

> Given account 'A' has a balance of 10000 and nothing withdrawn yet  
> When 5000.004 is withdrawn with txnId 'w1'  
> Then it is treated as 5000: the result is { ok: true }, the balance becomes 5000 and the entry amount is 5000

| | |
|---|---|
| **A. What the code does** | it is treated as 5000: the result is { ok: true }, the balance becomes 5000 and the entry amount is 5000 |
| **B. The alternative** | the unrounded 5000.004 exceeds the limit and the withdrawal is rejected as daily-limit |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-029 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-029 --decision reject --expected "<what should happen>" --by <you>`

#### B-034 · Transfers are not subject to the 5000 daily withdrawal limit

> Given account 'A' has a balance of 10000 and 'B' is open  
> When 6000 is transferred from 'A' to 'B' with txnId 'x1'  
> Then the result is { ok: true }, 'A' becomes 4000 and 'B' becomes 6000

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, 'A' becomes 4000 and 'B' becomes 6000 |
| **B. The alternative** | the transfer is rejected with reason 'daily-limit' and balances stay 10000 and 0 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-034 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-034 --decision reject --expected "<what should happen>" --by <you>`

#### B-035 · Transfers do not use up the daily withdrawal limit

> Given account 'A' has a balance of 10000 and has transferred 5000 to 'B' (txnId 'x1')  
> When 5000 is withdrawn from 'A' with txnId 'w1'  
> Then the result is { ok: true } and 'A' becomes 0

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and 'A' becomes 0 |
| **B. The alternative** | the transfer counted toward the limit, so the withdrawal is rejected as daily-limit and 'A' stays 5000 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-035 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-035 --decision reject --expected "<what should happen>" --by <you>`

#### B-037 · A transfer to an unopened account opens it and credits it

> Given account 'A' has a balance of 100 and 'C' was never opened  
> When 25 is transferred from 'A' to 'C' with txnId 'x1'  
> Then the result is { ok: true }, 'A' becomes 75 and 'C' becomes 25

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, 'A' becomes 75 and 'C' becomes 25 |
| **B. The alternative** | the transfer is rejected because 'C' does not exist and 'A' stays 100 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-037 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-037 --decision reject --expected "<what should happen>" --by <you>`

#### B-038 · A transfer to the same account leaves the balance unchanged but records both entries

> Given account 'A' has a balance of 100  
> When 50 is transferred from 'A' to 'A' with txnId 'x1'  
> Then the result is { ok: true }, the balance stays 100 and entries are deposit 100, transfer-out 50, transfer-in 50

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, the balance stays 100 and entries are deposit 100, transfer-out 50, transfer-in 50 |
| **B. The alternative** | a transfer to the same account is rejected and no entries are added |

**The plan may require the opposite:** “A transfer to the same account is rejected.” (P-007)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-038 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-038 --decision reject --expected "<what should happen>" --by <you>`

#### B-039 · Transfer amounts are rounded to cents, half a cent rounding up

> Given account 'A' has a balance of 1 and 'B' is open  
> When 0.125 is transferred from 'A' to 'B' with txnId 'x1'  
> Then 'B' receives 0.13 and both entries carry amount 0.13

| | |
|---|---|
| **A. What the code does** | 'B' receives 0.13 and both entries carry amount 0.13 |
| **B. The alternative** | half a cent rounds down and 'B' receives 0.12 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-039 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-039 --decision reject --expected "<what should happen>" --by <you>`

#### B-040 · entries returns a copy that callers cannot use to alter the history

> Given account 'A' received a deposit of 100 with txnId 't1'  
> When the list returned by entries('A') is emptied by the caller and entries('A') is read again  
> Then the second read still holds 1 entry

| | |
|---|---|
| **A. What the code does** | the second read still holds 1 entry |
| **B. The alternative** | the history is shared and the second read is empty |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-040 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-040 --decision reject --expected "<what should happen>" --by <you>`

## Dropped requirements

#### P-007

> A transfer to the same account is rejected.

Plan line 13. Probe `PR-P-007` fails against the code: AssertionError: expected true to be false // Object.is equality

Contradicting behaviour(s): B-008, B-009, B-038.

## Extractor misses

The code does realise these statements, but blind extraction did not describe the behaviour. This is a measure of extraction recall, not a defect in the code.

- P-003: Customers can deposit funds into an account.
- P-004: Customers can withdraw funds from an account.
- P-008: Every accepted operation is recorded in the account history.
