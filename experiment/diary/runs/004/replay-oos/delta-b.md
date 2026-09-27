# Delta: plan.md

Run `20260927T195750-48d9b3` · plan sha256 `f1655dc091e1`

**29 silent decision(s), 3 dropped requirement(s).**

## Run health

| Check | Result |
|---|---|
| Scenarios | 41 extracted · 41 verified · 0 vacuous · 0 refuted |
| Census (declared) | 35 decision points · 35 covered · 0 waived · 0 uncovered |
| Trace mode | pairwise-classifier · 2108 calls · threshold 0.7 |
| Trace | 12 stated · 0 entailed · 29 unsourced · 1 downgraded by rules |
| Reverse probes | 14 run · 3 dropped · 4 realised but missed by the extractor |
| Leave-one-out | passed (3 statement(s) hidden: 11 flipped, 0 re-sourced, 0 cited hidden text) |
| Leak check | clean · transcript: 3 tool call(s), 0 outside the room, 0 plan mention(s), 0 denied |

## Silent decisions

### unclustered

#### B-001 · An account never seen has balance 0 and no entries

> Given a new Ledger with no accounts  
> When balance('ghost') and entries('ghost') are read  
> Then the balance is 0 and the entries list is empty

| | |
|---|---|
| **A. What the code does** | the balance is 0 and the entries list is empty |
| **B. The alternative** | reading an unknown account's balance gives undefined instead of 0 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-001 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-001 --decision reject --expected "<what should happen>" --by <you>`

#### B-002 · A deposit of 100 raises the balance to 100 and records a deposit entry

> Given a new Ledger  
> When deposit('a', 100, 'd1') is called  
> Then the result is { ok: true }, balance('a') is 100 and entries('a') is [{ txnId: 'd1', kind: 'deposit', amount: 100 }]

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, balance('a') is 100 and entries('a') is [{ txnId: 'd1', kind: 'deposit', amount: 100 }] |
| **B. The alternative** | the deposit is refused because account 'a' was never opened, and the balance stays 0 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-002 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-002 --decision reject --expected "<what should happen>" --by <you>`

#### B-005 · txnIds are shared across operation types: a withdrawal reusing a deposit's txnId is silently ignored

> Given account 'a' has received deposit('a', 100, 't1')  
> When withdraw('a', 50, 't1') is called  
> Then the result is { ok: true } but nothing is withdrawn; the balance stays 100

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } but nothing is withdrawn; the balance stays 100 |
| **B. The alternative** | the withdrawal goes through (txnIds are separate per operation) and the balance becomes 49.5 |

**The plan may require the opposite:** “Customers can withdraw funds from an account.” (P-004); “Each withdrawal is charged a fee of 1% of the amount, with a minimum fee of 0.50.” (P-012)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-005 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-005 --decision reject --expected "<what should happen>" --by <you>`

#### B-007 · A deposit of 0.004 rounds to 0 cents yet is accepted with a zero entry

> Given a new Ledger  
> When deposit('a', 0.004, 'd1') is called  
> Then the result is { ok: true }, the balance is 0 and one entry of kind 'deposit' with amount 0 is recorded

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, the balance is 0 and one entry of kind 'deposit' with amount 0 is recorded |
| **B. The alternative** | the deposit is refused as too small and no entry is recorded |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-007 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-007 --decision reject --expected "<what should happen>" --by <you>`

#### B-008 · Opening an account that already exists keeps its balance and history

> Given account 'a' has received deposit('a', 100, 'd1')  
> When open('a') is called  
> Then the balance stays 100 and the entry is still there

| | |
|---|---|
| **A. What the code does** | the balance stays 100 and the entry is still there |
| **B. The alternative** | re-opening resets the account to balance 0 with no entries |

Notes: P-017 is typed out-of-scope; only behavioural statements can source; stated without a verifiable quote

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-008 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-008 --decision reject --expected "<what should happen>" --by <you>`

#### B-009 · A foreign deposit of 100 at rate 1.5 credits 150 as a deposit

> Given a new Ledger  
> When depositForeign('a', 100, 1.5, 'f1') is called  
> Then the result is { ok: true }, the balance is 150 and the entry is { txnId: 'f1', kind: 'deposit', amount: 150 }

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, the balance is 150 and the entry is { txnId: 'f1', kind: 'deposit', amount: 150 } |
| **B. The alternative** | the rate is applied as a divisor and the balance is 66.67 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-009 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-009 --decision reject --expected "<what should happen>" --by <you>`

#### B-010 · A foreign deposit with rate 0 or amount -1 is rejected as invalid-amount

> Given a new Ledger  
> When depositForeign('a', 100, 0, 'f1') and depositForeign('a', -1, 1.5, 'f2') are called  
> Then both return { ok: false, reason: 'invalid-amount' } and the balance is 0

| | |
|---|---|
| **A. What the code does** | both return { ok: false, reason: 'invalid-amount' } and the balance is 0 |
| **B. The alternative** | the rate-0 deposit is accepted and credits 0 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-010 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-010 --decision reject --expected "<what should happen>" --by <you>`

#### B-011 · A foreign deposit converting to under half a cent is rejected as amount-too-small; half a cent is accepted as 0.01

> Given a new Ledger  
> When depositForeign('a', 0.001, 1, 'f1') then depositForeign('a', 0.005, 1, 'f2') are called  
> Then the first returns { ok: false, reason: 'amount-too-small' }; the second returns { ok: true } and the balance is 0.01

| | |
|---|---|
| **A. What the code does** | the first returns { ok: false, reason: 'amount-too-small' }; the second returns { ok: true } and the balance is 0.01 |
| **B. The alternative** | the 0.001 deposit is accepted and credits 0 with { ok: true } |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-011 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-011 --decision reject --expected "<what should happen>" --by <you>`

#### B-013 · Withdrawing 50 from 100 charges a 1% fee of 0.50, leaving 49.50

> Given account 'a' has balance 100  
> When withdraw('a', 50, 'w1') is called  
> Then the result is { ok: true }, the balance is 49.5 and the withdrawal entry amount is 50.5 (principal plus fee)

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, the balance is 49.5 and the withdrawal entry amount is 50.5 (principal plus fee) |
| **B. The alternative** | no fee is charged and the balance becomes 50 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-013 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-013 --decision reject --expected "<what should happen>" --by <you>`

#### B-014 · Withdrawing 10 charges the minimum fee of 0.50, not 1% (0.10)

> Given account 'a' has balance 100  
> When withdraw('a', 10, 'w1') is called  
> Then the balance is 89.5

| | |
|---|---|
| **A. What the code does** | the balance is 89.5 |
| **B. The alternative** | a plain 1% fee of 0.10 is charged and the balance is 89.9 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-014 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-014 --decision reject --expected "<what should happen>" --by <you>`

#### B-015 · A fractional-cent fee is rounded up: withdrawing 123.45 costs a fee of 1.24

> Given account 'a' has balance 1000  
> When withdraw('a', 123.45, 'w1') is called  
> Then the fee is 1.24 and the balance is 875.31

| | |
|---|---|
| **A. What the code does** | the fee is 1.24 and the balance is 875.31 |
| **B. The alternative** | the fee is rounded down to 1.23 and the balance is 875.32 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-015 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-015 --decision reject --expected "<what should happen>" --by <you>`

#### B-016 · An exact whole-cent fee is not rounded up: withdrawing 100 costs exactly 1.00

> Given account 'a' has balance 1000  
> When withdraw('a', 100, 'w1') is called  
> Then the balance is 899

| | |
|---|---|
| **A. What the code does** | the balance is 899 |
| **B. The alternative** | the fee is bumped by a cent to 1.01 and the balance is 898.99 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-016 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-016 --decision reject --expected "<what should happen>" --by <you>`

#### B-017 · The withdrawal fee is capped at 25: withdrawing 3000 costs 25, not 30

> Given account 'a' has balance 10000  
> When withdraw('a', 3000, 'w1') is called  
> Then the balance is 6975

| | |
|---|---|
| **A. What the code does** | the balance is 6975 |
| **B. The alternative** | the uncapped 1% fee of 30 is charged and the balance is 6970 |

**The plan may require the opposite:** “Each withdrawal is charged a fee of 1% of the amount, with a minimum fee of 0.50.” (P-012)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-017 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-017 --decision reject --expected "<what should happen>" --by <you>`

#### B-018 · A withdrawal whose amount fits the balance but whose fee does not is rejected

> Given account 'a' has balance 100  
> When withdraw('a', 99.5, 'w1') is called (fee 1.00, total 100.50)  
> Then the result is { ok: false, reason: 'insufficient-funds' } and the balance stays 100

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' } and the balance stays 100 |
| **B. The alternative** | the withdrawal is accepted because 99.50 is within the balance, leaving -0.50 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-018 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-018 --decision reject --expected "<what should happen>" --by <you>`

#### B-019 · A withdrawal that takes the balance to exactly 0 including fee is allowed

> Given account 'a' has balance 50.5  
> When withdraw('a', 50, 'w1') is called (fee 0.50)  
> Then the result is { ok: true } and the balance is 0

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and the balance is 0 |
| **B. The alternative** | the withdrawal is rejected as insufficient-funds because it would empty the account, and the balance stays 50.5 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-019 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-019 --decision reject --expected "<what should happen>" --by <you>`

#### B-020 · A withdrawal rejected for insufficient funds can be retried with the same txnId

> Given account 'a' has balance 10 and withdraw('a', 20, 'w1') was rejected as insufficient-funds  
> When 20 more is deposited and withdraw('a', 20, 'w1') is called again  
> Then the retry returns { ok: true } and the balance is 9.5

| | |
|---|---|
| **A. What the code does** | the retry returns { ok: true } and the balance is 9.5 |
| **B. The alternative** | the retry is treated as a duplicate and ignored, leaving the balance at 30 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-020 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-020 --decision reject --expected "<what should happen>" --by <you>`

#### B-021 · Withdrawing exactly the daily limit of 5000 is allowed; one more cent that day is refused

> Given account 'a' has balance 10000  
> When withdraw('a', 5000, 'w1') then withdraw('a', 0.01, 'w2') are called  
> Then the first returns { ok: true } leaving 4975 (fee 25); the second returns { ok: false, reason: 'daily-limit' } and the balance stays 4975

| | |
|---|---|
| **A. What the code does** | the first returns { ok: true } leaving 4975 (fee 25); the second returns { ok: false, reason: 'daily-limit' } and the balance stays 4975 |
| **B. The alternative** | the limit is exclusive so the 5000 withdrawal itself is refused with 'daily-limit' and the balance stays 10000 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-021 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-021 --decision reject --expected "<what should happen>" --by <you>`

#### B-022 · A single withdrawal of 5000.01 exceeds the daily limit and is refused

> Given account 'a' has balance 10000  
> When withdraw('a', 5000.01, 'w1') is called  
> Then the result is { ok: false, reason: 'daily-limit' } and the balance stays 10000

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'daily-limit' } and the balance stays 10000 |
| **B. The alternative** | the withdrawal is accepted and the balance becomes 4974.99 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-022 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-022 --decision reject --expected "<what should happen>" --by <you>`

#### B-023 · The daily withdrawal limit is tracked per account

> Given accounts 'a' and 'b' each have balance 10000 and 'a' has withdrawn 5000  
> When withdraw('b', 100, 'w2') is called  
> Then the result is { ok: true } and 'b' has balance 9899

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and 'b' has balance 9899 |
| **B. The alternative** | the limit is shared across the ledger, so 'b' is refused with 'daily-limit' and keeps 10000 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-023 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-023 --decision reject --expected "<what should happen>" --by <you>`

#### B-024 · When a withdrawal is both unaffordable and over the daily limit, insufficient-funds is reported

> Given account 'a' has balance 100  
> When withdraw('a', 6000, 'w1') is called  
> Then the result is { ok: false, reason: 'insufficient-funds' }

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' } |
| **B. The alternative** | the daily limit is checked first and the reason is 'daily-limit' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-024 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-024 --decision reject --expected "<what should happen>" --by <you>`

#### B-026 · Repeating a withdrawal with the same txnId deducts only once

> Given account 'a' has balance 100  
> When withdraw('a', 10, 'w1') is called twice  
> Then both return { ok: true } and the balance is 89.5

| | |
|---|---|
| **A. What the code does** | both return { ok: true } and the balance is 89.5 |
| **B. The alternative** | both withdrawals are applied and the balance is 79 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-026 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-026 --decision reject --expected "<what should happen>" --by <you>`

#### B-027 · A transfer of 30 moves exactly 30 with no fee and records out/in entries

> Given account 'a' has balance 100  
> When transfer('a', 'b', 30, 't1') is called  
> Then the result is { ok: true }; 'a' has 70 with a last entry { txnId: 't1', kind: 'transfer-out', amount: 30 }; 'b' has 30 with entries [{ txnId: 't1', kind: 'transfer-in', amount: 30 }]

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }; 'a' has 70 with a last entry { txnId: 't1', kind: 'transfer-out', amount: 30 }; 'b' has 30 with entries [{ txnId: 't1', kind: 'transfer-in', amount: 30 }] |
| **B. The alternative** | a withdrawal-style fee of 0.50 is charged and 'a' ends with 69.5 |

**The plan may require the opposite:** “Each withdrawal is charged a fee of 1% of the amount, with a minimum fee of 0.50.” (P-012)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-027 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-027 --decision reject --expected "<what should happen>" --by <you>`

#### B-031 · Splitting 10 among three recipients gives the leftover cent to the first: 3.34, 3.33, 3.33

> Given account 'a' has balance 100  
> When split('a', ['b', 'c', 'd'], 10, 's1') is called  
> Then the result is { ok: true }; 'a' has 90 with a 'split-out' entry of 10; 'b' gets 3.34, 'c' 3.33, 'd' 3.33, each as a 'split-in' entry

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }; 'a' has 90 with a 'split-out' entry of 10; 'b' gets 3.34, 'c' 3.33, 'd' 3.33, each as a 'split-in' entry |
| **B. The alternative** | the leftover cent goes to the last recipient: 'b' 3.33, 'c' 3.33, 'd' 3.34 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-031 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-031 --decision reject --expected "<what should happen>" --by <you>`

#### B-032 · Splitting 0.02 among three gives 0.01, 0.01 and 0 in recipient order

> Given account 'a' has balance 1  
> When split('a', ['b', 'c', 'd'], 0.02, 's1') is called  
> Then 'b' gets 0.01, 'c' 0.01, 'd' gets 0 but still has a 'split-in' entry of amount 0; 'a' has 0.98

| | |
|---|---|
| **A. What the code does** | 'b' gets 0.01, 'c' 0.01, 'd' gets 0 but still has a 'split-in' entry of amount 0; 'a' has 0.98 |
| **B. The alternative** | the split is refused because a share would be zero, and 'a' keeps 1 |

**The plan may require the opposite:** “An amount must be a positive number, otherwise the operation is rejected.” (P-005)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-032 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-032 --decision reject --expected "<what should happen>" --by <you>`

#### B-033 · A split with no recipients is rejected as no-recipients, even if its txnId was already used

> Given account 'a' has received deposit('a', 100, 't1')  
> When split('a', [], 10, 't1') and split('a', [], 10, 's2') are called  
> Then both return { ok: false, reason: 'no-recipients' } and 'a' keeps 100

| | |
|---|---|
| **A. What the code does** | both return { ok: false, reason: 'no-recipients' } and 'a' keeps 100 |
| **B. The alternative** | the call reusing 't1' is treated as a duplicate and returns { ok: true } |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-033 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-033 --decision reject --expected "<what should happen>" --by <you>`

#### B-036 · A split of the whole balance is allowed; one cent more is refused

> Given account 'a' has balance 10  
> When split('a', ['b', 'c'], 10.01, 's1') then split('a', ['b', 'c'], 10, 's2') are called  
> Then the first returns { ok: false, reason: 'insufficient-funds' } with 'a' still 10; the second returns { ok: true }, 'a' is 0 and 'b' and 'c' each 5

| | |
|---|---|
| **A. What the code does** | the first returns { ok: false, reason: 'insufficient-funds' } with 'a' still 10; the second returns { ok: true }, 'a' is 0 and 'b' and 'c' each 5 |
| **B. The alternative** | the 10.01 split is accepted and 'a' goes to -0.01 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-036 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-036 --decision reject --expected "<what should happen>" --by <you>`

#### B-037 · A year of 5% interest on 1000 credits 50 as an interest entry

> Given account 'a' has balance 1000  
> When applyInterest('a', 5, 365, 'i1') is called  
> Then the result is { ok: true }, the balance is 1050 and the last entry is { txnId: 'i1', kind: 'interest', amount: 50 }

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, the balance is 1050 and the last entry is { txnId: 'i1', kind: 'interest', amount: 50 } |
| **B. The alternative** | a 360-day year is used and the balance becomes 1050.69 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-037 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-037 --decision reject --expected "<what should happen>" --by <you>`

#### B-038 · 30 days of 5% interest on 1000 is 4.10, rounded down from 4.1096

> Given account 'a' has balance 1000  
> When applyInterest('a', 5, 30, 'i1') is called  
> Then the balance is 1004.1

| | |
|---|---|
| **A. What the code does** | the balance is 1004.1 |
| **B. The alternative** | the interest is rounded to nearest (4.11) and the balance is 1004.11 |

**The plan may require the opposite:** “Balances are kept in whole cents.” (P-010)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-038 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-038 --decision reject --expected "<what should happen>" --by <you>`

#### B-039 · Interest that rounds to 0 returns ok, records nothing, and leaves the txnId reusable

> Given account 'a' has balance 1  
> When applyInterest('a', 1, 1, 'i1') is called, then deposit('a', 5, 'i1')  
> Then the interest call returns { ok: true } with no new entry and balance still 1; the later deposit with 'i1' is credited and the balance becomes 6

| | |
|---|---|
| **A. What the code does** | the interest call returns { ok: true } with no new entry and balance still 1; the later deposit with 'i1' is credited and the balance becomes 6 |
| **B. The alternative** | the zero-interest call consumes 'i1', so the later deposit is ignored and the balance stays 1 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-039 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-039 --decision reject --expected "<what should happen>" --by <you>`

## Dropped requirements

#### P-007

> A transfer to the same account is rejected.

Plan line 13. Probe `PR-P-007` fails against the code: AssertionError: expected true to be false // Object.is equality

_The trace had marked this realised (by B-004, B-029); the probe overrules it._

#### P-013

> The fee is recorded in the account history as its own entry, separate from the withdrawal.

Plan line 22. Probe `PR-P-013` fails against the code: AssertionError: expected [ { txnId: 't1', …(2) }, …(1) ] to have a length of 3 but got 2

#### P-014

> Customers can deposit an amount in a foreign currency together with an exchange rate; the amount is converted at that rate and rounded to the nearest cent, with halves rounded to even.

Plan line 23. Probe `PR-P-014` fails against the code: AssertionError: expected 0.13 to be 0.12 // Object.is equality

_The trace had marked this realised (by B-009, B-011, B-012); the probe overrules it._

## Extractor misses

The code does realise these statements, but blind extraction did not describe the behaviour. This is a measure of extraction recall, not a defect in the code.

- P-004: Customers can withdraw funds from an account.
- P-005: An amount must be a positive number, otherwise the operation is rejected.
- P-010: Balances are kept in whole cents.
- P-012: Each withdrawal is charged a fee of 1% of the amount, with a minimum fee of 0.50.
