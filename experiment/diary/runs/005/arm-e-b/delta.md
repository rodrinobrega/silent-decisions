# Delta: plan.md

Run `20260928T063845-516be7` · plan sha256 `f1655dc091e1`

**30 silent decision(s), 3 dropped requirement(s).**

## Run health

| Check | Result |
|---|---|
| Scenarios | 46 extracted · 46 verified · 0 vacuous · 0 refuted |
| Census (declared) | 35 decision points · 34 covered · 1 waived · 0 uncovered |
| Trace mode | pairwise-classifier · 2363 calls · threshold 0.7 |
| Trace | 16 stated · 0 entailed · 30 unsourced · 0 downgraded by rules |
| Reverse probes | 14 run · 3 dropped · 3 realised but missed by the extractor |
| Leave-one-out | passed (3 statement(s) hidden: 14 flipped, 0 re-sourced, 0 cited hidden text) |
| Leak check | clean · transcript: 5 tool call(s), 0 outside the room, 0 plan mention(s), 1 denied |

## Silent decisions

### unclustered

#### B-001 · Deposit credits the exact amount, cents kept

> Given a new Ledger  
> When 100.5 is deposited to account A with txnId d1  
> Then the result is ok and balance(A) is 100.5

| | |
|---|---|
| **A. What the code does** | the result is ok and balance(A) is 100.5 |
| **B. The alternative** | balance(A) is 100 (the cents are dropped) |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-001 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-001 --decision reject --expected "<what should happen>" --by <you>`

#### B-008 · A txnId used by a deposit makes a later withdrawal with the same txnId a no-op

> Given a Ledger where 100 was deposited to A with txnId x  
> When 10 is withdrawn from A with txnId x  
> Then the result is ok and balance(A) stays 100

| | |
|---|---|
| **A. What the code does** | the result is ok and balance(A) stays 100 |
| **B. The alternative** | the withdrawal goes through and balance(A) becomes 89.5 |

**The plan may require the opposite:** “Customers can withdraw funds from an account.” (P-004)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-008 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-008 --decision reject --expected "<what should happen>" --by <you>`

#### B-009 · Opening an existing account does not reset it

> Given a Ledger where A was opened and 100 deposited  
> When open(A) is called again  
> Then balance(A) stays 100 and its single entry is kept

| | |
|---|---|
| **A. What the code does** | balance(A) stays 100 and its single entry is kept |
| **B. The alternative** | balance(A) resets to 0 and its entries are cleared |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-009 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-009 --decision reject --expected "<what should happen>" --by <you>`

#### B-010 · An unknown account reads as balance 0 with no entries

> Given a new Ledger  
> When balance(Z) and entries(Z) are read for never-used account Z  
> Then balance is 0 and entries is an empty list

| | |
|---|---|
| **A. What the code does** | balance is 0 and entries is an empty list |
| **B. The alternative** | reading an unknown account throws an error |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-010 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-010 --decision reject --expected "<what should happen>" --by <you>`

#### B-011 · Small withdrawals pay the minimum fee of 0.50

> Given A has balance 100  
> When 10 is withdrawn from A with txnId w1  
> Then the result is ok, balance(A) is 89.5 and the withdrawal entry amount is 10.5 (amount plus fee)

| | |
|---|---|
| **A. What the code does** | the result is ok, balance(A) is 89.5 and the withdrawal entry amount is 10.5 (amount plus fee) |
| **B. The alternative** | the fee is 1% (0.10) and balance(A) becomes 89.9 |

**The plan may require the opposite:** “The fee is recorded in the account history as its own entry, separate from the withdrawal.” (P-013)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-011 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-011 --decision reject --expected "<what should happen>" --by <you>`

#### B-012 · Withdrawal fee is 1% of the amount

> Given A has balance 200  
> When 100 is withdrawn from A  
> Then the fee is 1.00 and balance(A) is 99

| | |
|---|---|
| **A. What the code does** | the fee is 1.00 and balance(A) is 99 |
| **B. The alternative** | only the minimum fee 0.50 applies and balance(A) becomes 99.5 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-012 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-012 --decision reject --expected "<what should happen>" --by <you>`

#### B-013 · Withdrawal fee is rounded up to the next cent

> Given A has balance 200  
> When 100.01 is withdrawn from A  
> Then the fee is 1.01 and balance(A) is 98.98

| | |
|---|---|
| **A. What the code does** | the fee is 1.01 and balance(A) is 98.98 |
| **B. The alternative** | the fee is rounded down to 1.00 and balance(A) becomes 98.99 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-013 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-013 --decision reject --expected "<what should happen>" --by <you>`

#### B-014 · Withdrawal fee is capped at 25

> Given A has balance 5000  
> When 3000 is withdrawn from A  
> Then the fee is 25 and balance(A) is 1975

| | |
|---|---|
| **A. What the code does** | the fee is 25 and balance(A) is 1975 |
| **B. The alternative** | the uncapped 1% fee of 30 applies and balance(A) becomes 1970 |

**The plan may require the opposite:** “Each withdrawal is charged a fee of 1% of the amount, with a minimum fee of 0.50.” (P-012)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-014 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-014 --decision reject --expected "<what should happen>" --by <you>`

#### B-015 · A withdrawal that uses the whole balance including fee is allowed

> Given A has balance 101  
> When 100 is withdrawn from A (100 plus fee 1 = 101)  
> Then the result is ok and balance(A) is 0

| | |
|---|---|
| **A. What the code does** | the result is ok and balance(A) is 0 |
| **B. The alternative** | the withdrawal is rejected with 'insufficient-funds' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-015 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-015 --decision reject --expected "<what should happen>" --by <you>`

#### B-016 · A withdrawal whose amount plus fee exceeds the balance by one cent is rejected

> Given A has balance 100.99  
> When 100 is withdrawn from A (needs 101 with fee)  
> Then the result is { ok: false, reason: 'insufficient-funds' } and balance(A) stays 100.99

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' } and balance(A) stays 100.99 |
| **B. The alternative** | the withdrawal goes through and balance(A) becomes -0.01 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-016 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-016 --decision reject --expected "<what should happen>" --by <you>`

#### B-017 · Withdrawals are limited to 5000 in total; the next cent is refused

> Given A has balance 10000 and has already withdrawn 5000 with txnId w1 (balance now 4975)  
> When 0.01 is withdrawn from A with txnId w2  
> Then the result is { ok: false, reason: 'daily-limit' } and balance(A) stays 4975

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'daily-limit' } and balance(A) stays 4975 |
| **B. The alternative** | the withdrawal goes through (ok) and balance(A) becomes 4974.49 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-017 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-017 --decision reject --expected "<what should happen>" --by <you>`

#### B-018 · A single withdrawal above 5000 is refused

> Given A has balance 10000  
> When 5000.01 is withdrawn from A  
> Then the result is { ok: false, reason: 'daily-limit' } and balance(A) stays 10000

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'daily-limit' } and balance(A) stays 10000 |
| **B. The alternative** | the withdrawal goes through (ok) and balance(A) becomes 4974.99 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-018 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-018 --decision reject --expected "<what should happen>" --by <you>`

#### B-019 · Fees do not count toward the 5000 withdrawal limit, and reaching exactly 5000 is allowed

> Given A has balance 10000 and withdrew 4990 (fee 25) with txnId w1  
> When 10 is withdrawn from A with txnId w2, bringing the total withdrawn to exactly 5000  
> Then the result is ok and balance(A) is 4974.5

| | |
|---|---|
| **A. What the code does** | the result is ok and balance(A) is 4974.5 |
| **B. The alternative** | fees count toward the limit, so the withdrawal is refused with 'daily-limit' |

**The plan may require the opposite:** “Balances are kept in whole cents.” (P-010)

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-019 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-019 --decision reject --expected "<what should happen>" --by <you>`

#### B-020 · Insufficient funds is reported before the withdrawal limit

> Given A has balance 6000 and withdrew 5000 with txnId w1 (balance now 975)  
> When 2000 is withdrawn from A with txnId w2 (over both the balance and the limit)  
> Then the result is { ok: false, reason: 'insufficient-funds' } and balance(A) stays 975

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' } and balance(A) stays 975 |
| **B. The alternative** | the result reason is 'daily-limit' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-020 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-020 --decision reject --expected "<what should happen>" --by <you>`

#### B-021 · A rejected withdrawal does not use up its txnId

> Given A has balance 5; withdrawing 10 with txnId w1 was rejected; then 100 more was deposited  
> When 10 is withdrawn from A with txnId w1 again  
> Then the result is ok and balance(A) is 94.5

| | |
|---|---|
| **A. What the code does** | the result is ok and balance(A) is 94.5 |
| **B. The alternative** | the retry is treated as an already-seen transaction: ok but balance(A) stays 105 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-021 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-021 --decision reject --expected "<what should happen>" --by <you>`

#### B-024 · Transferring the whole balance succeeds with no fee

> Given A has balance 100 and B is new  
> When 100 is transferred from A to B with txnId t1  
> Then the result is ok; A is 0, B is 100; A has a transfer-out entry of 100 and B a transfer-in entry of 100

| | |
|---|---|
| **A. What the code does** | the result is ok; A is 0, B is 100; A has a transfer-out entry of 100 and B a transfer-in entry of 100 |
| **B. The alternative** | the transfer is rejected with 'insufficient-funds' because a fee would be due |

**The plan may require the opposite:** “Each withdrawal is charged a fee of 1% of the amount, with a minimum fee of 0.50.” (P-012)

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-024 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-024 --decision reject --expected "<what should happen>" --by <you>`

#### B-025 · A transfer one cent above the balance is rejected

> Given A has balance 100  
> When 100.01 is transferred from A to B  
> Then the result is { ok: false, reason: 'insufficient-funds' }; A stays 100 and B stays 0

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' }; A stays 100 and B stays 0 |
| **B. The alternative** | the transfer goes through (ok) and A becomes -0.01 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-025 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-025 --decision reject --expected "<what should happen>" --by <you>`

#### B-028 · Split gives leftover cents to the first recipients in list order

> Given A has balance 1  
> When 1.00 is split from A to [B, C, D] with txnId s1  
> Then the result is ok; A is 0; B gets 0.34, C 0.33, D 0.33

| | |
|---|---|
| **A. What the code does** | the result is ok; A is 0; B gets 0.34, C 0.33, D 0.33 |
| **B. The alternative** | the leftover cent goes to the last recipient: B 0.33, C 0.33, D 0.34 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-028 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-028 --decision reject --expected "<what should happen>" --by <you>`

#### B-029 · A split smaller than the number of recipients leaves the last recipient with 0

> Given A has balance 1  
> When 0.02 is split from A to [B, C, D] with txnId s1  
> Then the result is ok; A is 0.98; B gets 0.01, C gets 0.01, D gets 0 but still has a split-in entry of 0

| | |
|---|---|
| **A. What the code does** | the result is ok; A is 0.98; B gets 0.01, C gets 0.01, D gets 0 but still has a split-in entry of 0 |
| **B. The alternative** | the split is rejected as too small to divide |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-029 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-029 --decision reject --expected "<what should happen>" --by <you>`

#### B-030 · A split with no recipients is rejected

> Given A has balance 100  
> When 10 is split from A to []  
> Then the result is { ok: false, reason: 'no-recipients' } and A stays 100

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'no-recipients' } and A stays 100 |
| **B. The alternative** | the split is accepted (ok) as a no-op |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-030 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-030 --decision reject --expected "<what should happen>" --by <you>`

#### B-032 · A split above the balance is rejected

> Given A has balance 100  
> When 100.01 is split from A to [B, C]  
> Then the result is { ok: false, reason: 'insufficient-funds' }; A stays 100 and B stays 0

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' }; A stays 100 and B stays 0 |
| **B. The alternative** | the split goes through (ok) and A becomes -0.01 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-032 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-032 --decision reject --expected "<what should happen>" --by <you>`

#### B-034 · Repeating a split txnId is ignored

> Given A has balance 100 and split 10 to [B, C] with txnId s1  
> When 10 is split to [B, C] with txnId s1 again  
> Then the result is ok; A stays 90, B 5 and C 5

| | |
|---|---|
| **A. What the code does** | the result is ok; A stays 90, B 5 and C 5 |
| **B. The alternative** | the split is applied twice: A becomes 80, B 10, C 10 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-034 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-034 --decision reject --expected "<what should happen>" --by <you>`

#### B-035 · Interest for 365 days at 5% on 1000 is exactly 50

> Given A has balance 1000  
> When applyInterest(A, 5, 365, i1) is called  
> Then the result is ok, balance(A) is 1050 and an interest entry of 50 is recorded

| | |
|---|---|
| **A. What the code does** | the result is ok, balance(A) is 1050 and an interest entry of 50 is recorded |
| **B. The alternative** | a 360-day year is used and balance(A) becomes 1050.69 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-035 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-035 --decision reject --expected "<what should happen>" --by <you>`

#### B-036 · Interest is rounded down to the cent

> Given A has balance 1000  
> When applyInterest(A, 5, 30, i1) is called (exact interest 4.10958…)  
> Then balance(A) is 1004.1

| | |
|---|---|
| **A. What the code does** | balance(A) is 1004.1 |
| **B. The alternative** | interest is rounded to nearest (up) giving 1004.11 |

**The plan may require the opposite:** “Balances are kept in whole cents.” (P-010)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-036 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-036 --decision reject --expected "<what should happen>" --by <you>`

#### B-037 · Interest under one cent is a silent no-op and does not use up the txnId

> Given A has balance 1  
> When applyInterest(A, 1, 1, i1) is called, then 5 is deposited to A with txnId i1  
> Then the interest call is ok with no entry added, and the later deposit with i1 is applied: balance(A) is 6

| | |
|---|---|
| **A. What the code does** | the interest call is ok with no entry added, and the later deposit with i1 is applied: balance(A) is 6 |
| **B. The alternative** | the interest call consumes i1, so the later deposit is ignored and balance(A) stays 1 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-037 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-037 --decision reject --expected "<what should happen>" --by <you>`

#### B-041 · A foreign deposit credits amount times rate as a deposit

> Given a new Ledger  
> When depositForeign(A, 100, 1.1, f1) is called  
> Then the result is ok, balance(A) is 110 and the entry is kind 'deposit' with amount 110

| | |
|---|---|
| **A. What the code does** | the result is ok, balance(A) is 110 and the entry is kind 'deposit' with amount 110 |
| **B. The alternative** | the rate is applied as a division and balance(A) becomes 90.91 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-041 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-041 --decision reject --expected "<what should happen>" --by <you>`

#### B-042 · A foreign deposit with rate 0 is rejected

> Given a new Ledger  
> When depositForeign(A, 100, 0, f1) is called  
> Then the result is { ok: false, reason: 'invalid-amount' }

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'invalid-amount' } |
| **B. The alternative** | the result reason is 'amount-too-small' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-042 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-042 --decision reject --expected "<what should happen>" --by <you>`

#### B-044 · A foreign deposit that converts to under half a cent is rejected and records nothing

> Given a new Ledger  
> When depositForeign(A, 0.001, 1, f1) is called  
> Then the result is { ok: false, reason: 'amount-too-small' } and entries(A) is empty

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'amount-too-small' } and entries(A) is empty |
| **B. The alternative** | the deposit is accepted (ok) with 0 credited |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-044 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-044 --decision reject --expected "<what should happen>" --by <you>`

#### B-045 · A foreign deposit converting to exactly half a cent rounds up to 0.01

> Given a new Ledger  
> When depositForeign(A, 10, 0.0005, f1) is called (converted value 0.005)  
> Then the result is ok and balance(A) is 0.01

| | |
|---|---|
| **A. What the code does** | the result is ok and balance(A) is 0.01 |
| **B. The alternative** | the half cent is dropped and the deposit is rejected with 'amount-too-small' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-045 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-045 --decision reject --expected "<what should happen>" --by <you>`

#### B-046 · Repeating a foreign deposit txnId is ignored, even if the repeat would be too small

> Given A received depositForeign of 100 at rate 2 with txnId f1 (balance 200)  
> When depositForeign(A, 100, 2, f1) and then depositForeign(A, 0.001, 1, f1) are called  
> Then both calls return ok and balance(A) stays 200

| | |
|---|---|
| **A. What the code does** | both calls return ok and balance(A) stays 200 |
| **B. The alternative** | the repeat is applied and balance(A) becomes 400 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-046 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-046 --decision reject --expected "<what should happen>" --by <you>`

## Dropped requirements

#### P-007

> A transfer to the same account is rejected.

Plan line 13. Probe `PR-P-007` fails against the code: AssertionError: expected true to be false // Object.is equality

_The trace had marked this realised (by B-026, B-027); the probe overrules it._

#### P-013

> The fee is recorded in the account history as its own entry, separate from the withdrawal.

Plan line 22. Probe `PR-P-013` fails against the code: AssertionError: expected 1 to be 2 // Object.is equality

Contradicting behaviour(s): B-011.

#### P-014

> Customers can deposit an amount in a foreign currency together with an exchange rate; the amount is converted at that rate and rounded to the nearest cent, with halves rounded to even.

Plan line 23. Probe `PR-P-014` fails against the code: AssertionError: expected 0.13 to be 0.12 // Object.is equality

_The trace had marked this realised (by B-002, B-041, B-045, B-046); the probe overrules it._

## Extractor misses

The code does realise these statements, but blind extraction did not describe the behaviour. This is a measure of extraction recall, not a defect in the code.

- P-004: Customers can withdraw funds from an account.
- P-010: Balances are kept in whole cents.
- P-012: Each withdrawal is charged a fee of 1% of the amount, with a minimum fee of 0.50.
