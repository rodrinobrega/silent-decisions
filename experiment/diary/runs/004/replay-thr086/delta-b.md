# Delta: plan.md

Run `20260927T135539-ab5007` · plan sha256 `b8c7a2b74776`

**28 silent decision(s), 1 dropped requirement(s).**

## Run health

| Check | Result |
|---|---|
| Scenarios | 38 extracted · 38 verified · 0 vacuous · 0 refuted |
| Census (declared) | 15 decision points · 15 covered · 0 waived · 0 uncovered |
| Trace mode | pairwise-classifier · 1150 calls · threshold 0.7 |
| Trace | 10 stated · 0 entailed · 28 unsourced · 0 downgraded by rules |
| Reverse probes | 7 run · 1 dropped · 1 realised but missed by the extractor |
| Leave-one-out | passed (2 statement(s) hidden: 10 flipped, 0 re-sourced, 0 cited hidden text) |
| Leak check | suspect · transcript: 5 tool call(s), 0 outside the room, 0 plan mention(s), 1 denied |

Open issues with this run:

- leak check: **suspect** (transcript shows no access outside the room and no mention of the plan: the overlap is phrasing, not a leak)

## Silent decisions

### unclustered

#### B-001 · Depositing into a never-opened account opens it and credits the amount

> Given a new Ledger where account 'A' has never been opened  
> When 100 is deposited into 'A' with txnId 't1'  
> Then the result is { ok: true }, the balance of 'A' is 100 and its entries are one deposit of 100 with txnId 't1'

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, the balance of 'A' is 100 and its entries are one deposit of 100 with txnId 't1' |
| **B. The alternative** | the deposit is rejected because the account was never opened, and the balance stays 0 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-001 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-001 --decision reject --expected "<what should happen>" --by <you>`

#### B-002 · Opening an already-opened account does not reset its balance or history

> Given account 'A' holds 100 from a deposit with txnId 't1'  
> When 'A' is opened again  
> Then the balance of 'A' stays 100 and it still has one entry

| | |
|---|---|
| **A. What the code does** | the balance of 'A' stays 100 and it still has one entry |
| **B. The alternative** | re-opening resets 'A' to a balance of 0 with no entries |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-002 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-002 --decision reject --expected "<what should happen>" --by <you>`

#### B-003 · Balance of an unknown account reads as 0

> Given a new Ledger where account 'ghost' was never opened  
> When the balance of 'ghost' is read  
> Then the balance is 0

| | |
|---|---|
| **A. What the code does** | the balance is 0 |
| **B. The alternative** | the balance is undefined because the account does not exist |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-003 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-003 --decision reject --expected "<what should happen>" --by <you>`

#### B-004 · Entries of an unknown account are an empty list

> Given a new Ledger where account 'ghost' was never opened  
> When the entries of 'ghost' are read  
> Then an empty list is returned

| | |
|---|---|
| **A. What the code does** | an empty list is returned |
| **B. The alternative** | undefined is returned |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-004 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-004 --decision reject --expected "<what should happen>" --by <you>`

#### B-005 · Entries returned are a copy; changing them does not change the ledger

> Given account 'A' has one deposit of 100 with txnId 't1'  
> When the list returned by entries('A') is emptied by the caller  
> Then reading entries('A') again still returns one entry

| | |
|---|---|
| **A. What the code does** | reading entries('A') again still returns one entry |
| **B. The alternative** | the ledger's history for 'A' is emptied as well |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-005 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-005 --decision reject --expected "<what should happen>" --by <you>`

#### B-009 · Deposit amounts are rounded to cents, with a half cent rounding up

> Given a new Ledger  
> When 0.125 is deposited into 'A' with txnId 't1'  
> Then the balance of 'A' is 0.13 and the entry records an amount of 0.13

| | |
|---|---|
| **A. What the code does** | the balance of 'A' is 0.13 and the entry records an amount of 0.13 |
| **B. The alternative** | the half cent is dropped and the balance is 0.12 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-009 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-009 --decision reject --expected "<what should happen>" --by <you>`

#### B-010 · Deposit fractions below half a cent are dropped

> Given a new Ledger  
> When 1.004 is deposited into 'A' with txnId 't1'  
> Then the balance of 'A' is 1

| | |
|---|---|
| **A. What the code does** | the balance of 'A' is 1 |
| **B. The alternative** | the amount is kept unrounded and the balance is 1.004 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-010 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-010 --decision reject --expected "<what should happen>" --by <you>`

#### B-013 · A txnId used by a deposit makes a later transfer with the same txnId a no-op

> Given account 'A' holds 100 from a deposit with txnId 't1'  
> When 50 is transferred from 'A' to 'B' with txnId 't1'  
> Then the result is { ok: true }, 'A' stays at 100 and 'B' stays at 0

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, 'A' stays at 100 and 'B' stays at 0 |
| **B. The alternative** | txnIds are tracked per operation type, so the transfer goes through: 'A' becomes 50 and 'B' becomes 50 |

**The plan may require the opposite:** “Customers can transfer funds between two accounts.” (P-006)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-013 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-013 --decision reject --expected "<what should happen>" --by <you>`

#### B-016 · A withdrawal reusing a seen txnId reports success without checking funds

> Given account 'A' holds 100 from a deposit with txnId 't1'  
> When 500 is withdrawn from 'A' with txnId 't1'  
> Then the result is { ok: true } and the balance stays 100

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and the balance stays 100 |
| **B. The alternative** | the withdrawal is checked on its own and refused with reason 'insufficient-funds' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-016 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-016 --decision reject --expected "<what should happen>" --by <you>`

#### B-017 · Withdrawing more than the balance is refused as insufficient-funds

> Given account 'A' holds 100  
> When 150 is withdrawn from 'A' with txnId 'w1'  
> Then the result is { ok: false, reason: 'insufficient-funds' } and the balance stays 100

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' } and the balance stays 100 |
| **B. The alternative** | the withdrawal is accepted and the balance becomes -50 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-017 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-017 --decision reject --expected "<what should happen>" --by <you>`

#### B-018 · Withdrawing exactly the whole balance is allowed and leaves 0

> Given account 'A' holds 100  
> When 100 is withdrawn from 'A' with txnId 'w1'  
> Then the result is { ok: true }, the balance is 0 and the last entry is a withdrawal of 100

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, the balance is 0 and the last entry is a withdrawal of 100 |
| **B. The alternative** | the withdrawal is refused with 'insufficient-funds' because it would empty the account, and the balance stays 100 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-018 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-018 --decision reject --expected "<what should happen>" --by <you>`

#### B-019 · The funds check uses the amount after rounding to cents

> Given account 'A' holds 100  
> When 100.004 is withdrawn from 'A' with txnId 'w1'  
> Then the amount rounds to 100, the result is { ok: true } and the balance is 0

| | |
|---|---|
| **A. What the code does** | the amount rounds to 100, the result is { ok: true } and the balance is 0 |
| **B. The alternative** | the unrounded 100.004 is compared to the balance and the withdrawal is refused with 'insufficient-funds' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-019 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-019 --decision reject --expected "<what should happen>" --by <you>`

#### B-020 · Withdrawing from a never-opened account is refused and opens it empty

> Given a new Ledger where 'A' was never opened  
> When 50 is withdrawn from 'A' with txnId 'w1'  
> Then the result is { ok: false, reason: 'insufficient-funds' }, the balance is 0 and entries('A') is an empty list

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' }, the balance is 0 and entries('A') is an empty list |
| **B. The alternative** | the withdrawal is refused with reason 'unknown-account' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-020 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-020 --decision reject --expected "<what should happen>" --by <you>`

#### B-021 · A single withdrawal of exactly 5000 is within the daily limit

> Given account 'A' holds 10000 and nothing has been withdrawn yet  
> When 5000 is withdrawn from 'A' with txnId 'w1'  
> Then the result is { ok: true } and the balance is 5000

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and the balance is 5000 |
| **B. The alternative** | the withdrawal is refused with 'daily-limit' because the limit must not be reached, and the balance stays 10000 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-021 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-021 --decision reject --expected "<what should happen>" --by <you>`

#### B-022 · A single withdrawal of 5000.01 exceeds the daily limit

> Given account 'A' holds 10000 and nothing has been withdrawn yet  
> When 5000.01 is withdrawn from 'A' with txnId 'w1'  
> Then the result is { ok: false, reason: 'daily-limit' } and the balance stays 10000

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'daily-limit' } and the balance stays 10000 |
| **B. The alternative** | the withdrawal is accepted and the balance becomes 4999.99 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-022 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-022 --decision reject --expected "<what should happen>" --by <you>`

#### B-023 · Withdrawals accumulate towards the 5000 daily limit

> Given account 'A' holds 10000 and 3000 has already been withdrawn with txnId 'w1'  
> When 2001 is withdrawn from 'A' with txnId 'w2'  
> Then the result is { ok: false, reason: 'daily-limit' } and the balance stays 7000

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'daily-limit' } and the balance stays 7000 |
| **B. The alternative** | the limit applies per withdrawal, so it is accepted and the balance becomes 4999 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-023 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-023 --decision reject --expected "<what should happen>" --by <you>`

#### B-024 · Accumulated withdrawals reaching exactly 5000 are allowed

> Given account 'A' holds 10000 and 3000 has already been withdrawn with txnId 'w1'  
> When 2000 is withdrawn from 'A' with txnId 'w2'  
> Then the result is { ok: true } and the balance is 5000

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and the balance is 5000 |
| **B. The alternative** | the withdrawal is refused with 'daily-limit' and the balance stays 7000 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-024 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-024 --decision reject --expected "<what should happen>" --by <you>`

#### B-025 · A refused withdrawal does not use up any of the daily limit

> Given account 'A' holds 10000 and a withdrawal of 6000 with txnId 'w1' was refused for 'daily-limit'  
> When 5000 is withdrawn from 'A' with txnId 'w2'  
> Then the result is { ok: true } and the balance is 5000

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and the balance is 5000 |
| **B. The alternative** | the refused 6000 counted towards the limit, so this is refused with 'daily-limit' and the balance stays 10000 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-025 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-025 --decision reject --expected "<what should happen>" --by <you>`

#### B-026 · The daily limit is tracked separately per account

> Given accounts 'A' and 'B' each hold 10000, and 5000 has been withdrawn from 'A'  
> When 5000 is withdrawn from 'B' with txnId 'w2'  
> Then the result is { ok: true } and 'B' has a balance of 5000

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and 'B' has a balance of 5000 |
| **B. The alternative** | the limit is shared across the ledger, so it is refused with 'daily-limit' and 'B' stays 10000 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-026 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-026 --decision reject --expected "<what should happen>" --by <you>`

#### B-027 · The funds check is applied before the daily-limit check

> Given account 'A' holds 100 and nothing has been withdrawn  
> When 6000 is withdrawn from 'A' with txnId 'w1'  
> Then the result is { ok: false, reason: 'insufficient-funds' }

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' } |
| **B. The alternative** | the result is { ok: false, reason: 'daily-limit' } |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-027 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-027 --decision reject --expected "<what should happen>" --by <you>`

#### B-028 · A refused withdrawal's txnId can be reused later to succeed

> Given account 'A' held 100, a withdrawal of 150 with txnId 'w1' was refused, then 100 more was deposited (balance 200)  
> When 150 is withdrawn from 'A' with txnId 'w1' again  
> Then the result is { ok: true } and the balance is 50

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and the balance is 50 |
| **B. The alternative** | 'w1' is remembered as already seen, the call returns ok but nothing is withdrawn and the balance stays 200 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-028 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-028 --decision reject --expected "<what should happen>" --by <you>`

#### B-032 · Transferring more than the sender holds is refused as insufficient-funds

> Given account 'A' holds 100 and 'B' holds 0  
> When 150 is transferred from 'A' to 'B' with txnId 'x1'  
> Then the result is { ok: false, reason: 'insufficient-funds' }; 'A' stays 100 and 'B' stays 0

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' }; 'A' stays 100 and 'B' stays 0 |
| **B. The alternative** | the transfer is accepted: 'A' becomes -50 and 'B' becomes 150 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-032 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-032 --decision reject --expected "<what should happen>" --by <you>`

#### B-033 · Transferring the whole balance is allowed and records out/in entries

> Given account 'A' holds 100 and 'B' was never opened  
> When 100 is transferred from 'A' to 'B' with txnId 'x1'  
> Then the result is { ok: true }; 'A' is 0, 'B' is 100, 'A' gets a transfer-out entry of 100 and 'B' gets a transfer-in entry of 100, both with txnId 'x1'

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }; 'A' is 0, 'B' is 100, 'A' gets a transfer-out entry of 100 and 'B' gets a transfer-in entry of 100, both with txnId 'x1' |
| **B. The alternative** | the transfer is refused with 'insufficient-funds' because it would empty 'A'; 'A' stays 100 and 'B' 0 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-033 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-033 --decision reject --expected "<what should happen>" --by <you>`

#### B-034 · Transfers are not subject to the 5000 daily withdrawal limit

> Given account 'A' holds 10000  
> When 6000 is transferred from 'A' to 'B' with txnId 'x1'  
> Then the result is { ok: true }; 'A' is 4000 and 'B' is 6000

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }; 'A' is 4000 and 'B' is 6000 |
| **B. The alternative** | the transfer is refused with 'daily-limit' and 'A' stays 10000 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-034 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-034 --decision reject --expected "<what should happen>" --by <you>`

#### B-035 · Transfers do not use up the daily withdrawal limit

> Given account 'A' holds 10000 and 3000 was transferred from 'A' to 'B'  
> When 5000 is withdrawn from 'A' with txnId 'w1'  
> Then the result is { ok: true } and 'A' is 2000

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and 'A' is 2000 |
| **B. The alternative** | the transfer counted towards the limit, so the withdrawal is refused with 'daily-limit' and 'A' stays 7000 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-035 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-035 --decision reject --expected "<what should happen>" --by <you>`

#### B-036 · Transfer amounts are rounded to cents, half a cent rounding up

> Given account 'A' holds 1  
> When 0.125 is transferred from 'A' to 'B' with txnId 'x1'  
> Then 'B' receives 0.13 and both entries record 0.13

| | |
|---|---|
| **A. What the code does** | 'B' receives 0.13 and both entries record 0.13 |
| **B. The alternative** | the half cent is dropped and 'B' receives 0.12 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-036 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-036 --decision reject --expected "<what should happen>" --by <you>`

#### B-037 · A refused transfer still opens the receiving account with no entries

> Given a new Ledger where neither 'A' nor 'B' was opened  
> When 10 is transferred from 'A' to 'B' with txnId 'x1'  
> Then the result is { ok: false, reason: 'insufficient-funds' }; 'B' has balance 0 and entries('B') is an empty list

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' }; 'B' has balance 0 and entries('B') is an empty list |
| **B. The alternative** | the transfer is refused with reason 'unknown-account' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-037 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-037 --decision reject --expected "<what should happen>" --by <you>`

#### B-038 · A transfer to the same account leaves the balance unchanged but records two entries

> Given account 'A' holds 100  
> When 50 is transferred from 'A' to 'A' with txnId 'x1'  
> Then the result is { ok: true }, the balance stays 100, and 'A' gains a transfer-out and a transfer-in entry of 50 in that order

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, the balance stays 100, and 'A' gains a transfer-out and a transfer-in entry of 50 in that order |
| **B. The alternative** | the self-transfer is refused and 'A' keeps only its deposit entry |

**The plan may require the opposite:** “A transfer to the same account is rejected.” (P-007)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-038 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-038 --decision reject --expected "<what should happen>" --by <you>`

## Dropped requirements

#### P-007

> A transfer to the same account is rejected.

Plan line 13. Probe `PR-P-007` fails against the code: AssertionError: expected true to be false // Object.is equality

Contradicting behaviour(s): B-038.

## Extractor misses

The code does realise these statements, but blind extraction did not describe the behaviour. This is a measure of extraction recall, not a defect in the code.

- P-006: Customers can transfer funds between two accounts.
