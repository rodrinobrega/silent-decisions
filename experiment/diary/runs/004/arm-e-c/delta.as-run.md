# Delta: plan.md

Run `20260927T200421-349175` · plan sha256 `f1655dc091e1`

**30 silent decision(s), 3 dropped requirement(s).**

## Run health

| Check | Result |
|---|---|
| Scenarios | 49 extracted · 49 verified · 0 vacuous · 0 refuted |
| Census (declared) | 35 decision points · 34 covered · 1 waived · 0 uncovered |
| Trace mode | pairwise-classifier · 2516 calls · threshold 0.7 |
| Trace | 19 stated · 0 entailed · 30 unsourced · 0 downgraded by rules |
| Reverse probes | 14 run · 3 dropped · 4 realised but missed by the extractor |
| Leave-one-out | review (3 statement(s) hidden: 13 flipped, 1 re-sourced, 0 cited hidden text) |
| Leak check | clean · transcript: 4 tool call(s), 0 outside the room, 0 plan mention(s), 1 denied |

Open issues with this run:

- leave-one-out: 1 behaviour(s) stayed sourced from another passage, check them below

## Silent decisions

### unclustered

#### B-001 · Balance of an account that was never opened is 0

> Given a new Ledger with no accounts  
> When balance('ghost') and entries('ghost') are read  
> Then the balance is 0 and the entries list is empty

| | |
|---|---|
| **A. What the code does** | the balance is 0 and the entries list is empty |
| **B. The alternative** | reading an unknown account fails with an error |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-001 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-001 --decision reject --expected "<what should happen>" --by <you>`

#### B-003 · Deposit credits an account and records a deposit entry

> Given a new Ledger  
> When 100 is deposited into 'a' with txn 'd1'  
> Then the result is ok, the balance is 100 and one 'deposit' entry of 100 is recorded

| | |
|---|---|
| **A. What the code does** | the result is ok, the balance is 100 and one 'deposit' entry of 100 is recorded |
| **B. The alternative** | the deposit is refused because account 'a' was never opened |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-003 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-003 --decision reject --expected "<what should happen>" --by <you>`

#### B-008 · txnIds are shared across operation types

> Given 100 deposited into 'a' with txn 'x1'  
> When 10 is withdrawn from 'a' using the same txn 'x1'  
> Then the result is ok but nothing is withdrawn; the balance stays 100

| | |
|---|---|
| **A. What the code does** | the result is ok but nothing is withdrawn; the balance stays 100 |
| **B. The alternative** | the withdrawal goes through and the balance becomes 89.5 |

**The plan may require the opposite:** “Customers can withdraw funds from an account.” (P-004)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-008 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-008 --decision reject --expected "<what should happen>" --by <you>`

#### B-011 · A deposit below half a cent is accepted but credits 0

> Given a new Ledger  
> When 0.004 is deposited into 'a' with txn 'd1'  
> Then the result is ok, the balance is 0 and a deposit entry of amount 0 is recorded

| | |
|---|---|
| **A. What the code does** | the result is ok, the balance is 0 and a deposit entry of amount 0 is recorded |
| **B. The alternative** | the deposit is refused as too small |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-011 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-011 --decision reject --expected "<what should happen>" --by <you>`

#### B-014 · Foreign deposit rounds below-half cents down

> Given a new Ledger  
> When depositForeign('a', 10, 0.12345, 'f1') (converts to about 1.2345)  
> Then the balance is 1.23

| | |
|---|---|
| **A. What the code does** | the balance is 1.23 |
| **B. The alternative** | the balance is 1.24 (converted amount rounded up) |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-014 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-014 --decision reject --expected "<what should happen>" --by <you>`

#### B-015 · Foreign deposit with zero rate is invalid-amount

> Given a new Ledger  
> When depositForeign('a', 100, 0, 'f1')  
> Then the result is 'invalid-amount' and the balance stays 0

| | |
|---|---|
| **A. What the code does** | the result is 'invalid-amount' and the balance stays 0 |
| **B. The alternative** | the result is 'amount-too-small' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-015 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-015 --decision reject --expected "<what should happen>" --by <you>`

#### B-017 · Foreign deposit converting to under half a cent is amount-too-small

> Given a new Ledger  
> When depositForeign('a', 1, 0.004, 'f1') (converts to 0.004)  
> Then the result is 'amount-too-small', balance 0, no account entries, and the txnId 'f1' is not consumed (a later 100 deposit with 'f1' succeeds)

| | |
|---|---|
| **A. What the code does** | the result is 'amount-too-small', balance 0, no account entries, and the txnId 'f1' is not consumed (a later 100 deposit with 'f1' succeeds) |
| **B. The alternative** | the deposit is accepted with ok and credits 0 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-017 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-017 --decision reject --expected "<what should happen>" --by <you>`

#### B-020 · Withdrawal of 50 costs exactly the 0.50 minimum fee

> Given account 'a' with balance 100  
> When 50 is withdrawn with txn 'w1'  
> Then the balance becomes 49.5

| | |
|---|---|
| **A. What the code does** | the balance becomes 49.5 |
| **B. The alternative** | the fee is 1.00 and the balance becomes 49 |

**The plan may require the opposite:** “Balances are kept in whole cents.” (P-010)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-020 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-020 --decision reject --expected "<what should happen>" --by <you>`

#### B-021 · Fee is 1% rounded up to the next cent

> Given account 'a' with balance 200  
> When 100.01 is withdrawn with txn 'w1' (1% = 1.0001)  
> Then the fee is 1.01 and the balance becomes 98.98

| | |
|---|---|
| **A. What the code does** | the fee is 1.01 and the balance becomes 98.98 |
| **B. The alternative** | the fee is rounded to 1.00 and the balance becomes 98.99 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-021 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-021 --decision reject --expected "<what should happen>" --by <you>`

#### B-022 · Withdrawal of exactly 100 costs a fee of exactly 1.00

> Given account 'a' with balance 200  
> When 100 is withdrawn with txn 'w1'  
> Then the balance becomes 99 and the withdrawal entry amount is 101

| | |
|---|---|
| **A. What the code does** | the balance becomes 99 and the withdrawal entry amount is 101 |
| **B. The alternative** | the fee rounds up to 1.01 and the balance becomes 98.99 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-022 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-022 --decision reject --expected "<what should happen>" --by <you>`

#### B-023 · Large withdrawal fee is capped at 25.00

> Given account 'a' with balance 5000  
> When 3000 is withdrawn with txn 'w1' (1% would be 30)  
> Then the fee is 25 and the balance becomes 1975

| | |
|---|---|
| **A. What the code does** | the fee is 25 and the balance becomes 1975 |
| **B. The alternative** | the uncapped fee of 30 is charged and the balance becomes 1970 |

**The plan may require the opposite:** “Each withdrawal is charged a fee of 1% of the amount, with a minimum fee of 0.50.” (P-012)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-023 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-023 --decision reject --expected "<what should happen>" --by <you>`

#### B-024 · Withdrawal that uses the whole balance including fee is allowed

> Given account 'a' with balance 101  
> When 100 is withdrawn with txn 'w1' (fee 1.00, total 101)  
> Then the result is ok and the balance becomes 0

| | |
|---|---|
| **A. What the code does** | the result is ok and the balance becomes 0 |
| **B. The alternative** | the withdrawal is refused with 'insufficient-funds' and the balance stays 101 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-024 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-024 --decision reject --expected "<what should happen>" --by <you>`

#### B-025 · Withdrawal is refused when the fee pushes it past the balance

> Given account 'a' with balance 100  
> When 99.5 is withdrawn with txn 'w1' (fee 1.00, total 100.50)  
> Then the result is 'insufficient-funds' and the balance stays 100

| | |
|---|---|
| **A. What the code does** | the result is 'insufficient-funds' and the balance stays 100 |
| **B. The alternative** | the withdrawal is accepted because 99.5 alone fits within the balance |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-025 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-025 --decision reject --expected "<what should happen>" --by <you>`

#### B-026 · A refused withdrawal does not consume its txnId

> Given account 'a' with balance 50; withdraw('a', 100, 'w1') was refused for insufficient funds  
> When 100 more is deposited (txn 'd2') and withdraw('a', 100, 'w1') is retried  
> Then the retry succeeds and the balance becomes 49 (150 - 100 - 1.00 fee)

| | |
|---|---|
| **A. What the code does** | the retry succeeds and the balance becomes 49 (150 - 100 - 1.00 fee) |
| **B. The alternative** | the retry is silently ignored as a duplicate and the balance stays 150 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-026 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-026 --decision reject --expected "<what should happen>" --by <you>`

#### B-027 · Withdrawing from an account that was never funded is insufficient-funds

> Given a new Ledger  
> When withdraw('ghost', 10, 'w1')  
> Then the result is 'insufficient-funds' and the account now exists with balance 0 and no entries

| | |
|---|---|
| **A. What the code does** | the result is 'insufficient-funds' and the account now exists with balance 0 and no entries |
| **B. The alternative** | the result is an 'unknown-account' refusal |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-027 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-027 --decision reject --expected "<what should happen>" --by <you>`

#### B-029 · Withdrawing exactly the 5000 daily limit is allowed

> Given account 'a' with balance 10000 and nothing withdrawn yet  
> When 5000 is withdrawn with txn 'w1'  
> Then the result is ok and the balance becomes 4975 (5000 plus the capped 25 fee)

| | |
|---|---|
| **A. What the code does** | the result is ok and the balance becomes 4975 (5000 plus the capped 25 fee) |
| **B. The alternative** | the withdrawal is refused with 'daily-limit' and the balance stays 10000 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-029 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-029 --decision reject --expected "<what should happen>" --by <you>`

#### B-030 · Withdrawing one cent over the 5000 daily limit is refused

> Given account 'a' with balance 10000 and nothing withdrawn yet  
> When 5000.01 is withdrawn with txn 'w1'  
> Then the result is 'daily-limit' and the balance stays 10000

| | |
|---|---|
| **A. What the code does** | the result is 'daily-limit' and the balance stays 10000 |
| **B. The alternative** | the withdrawal is accepted and the balance becomes 4974.99 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-030 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-030 --decision reject --expected "<what should happen>" --by <you>`

#### B-031 · Daily limit accumulates across withdrawals, excluding fees

> Given account 'a' with balance 6000; 2500 withdrawn twice (txns 'w1','w2'), leaving balance 950  
> When 1 more is withdrawn with txn 'w3'  
> Then the first two withdrawals succeed, the third is refused with 'daily-limit' and the balance stays 950

| | |
|---|---|
| **A. What the code does** | the first two withdrawals succeed, the third is refused with 'daily-limit' and the balance stays 950 |
| **B. The alternative** | the third withdrawal succeeds and the balance becomes 948.5 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-031 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-031 --decision reject --expected "<what should happen>" --by <you>`

#### B-032 · Insufficient funds is reported before the daily limit

> Given account 'a' with balance 3000  
> When 6000 is withdrawn with txn 'w1'  
> Then the result reason is 'insufficient-funds'

| | |
|---|---|
| **A. What the code does** | the result reason is 'insufficient-funds' |
| **B. The alternative** | the result reason is 'daily-limit' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-032 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-032 --decision reject --expected "<what should happen>" --by <you>`

#### B-033 · Daily limit is tracked per account

> Given accounts 'a' and 'b' each with balance 6000; 5000 already withdrawn from 'a' (txn 'w1')  
> When 5000 is withdrawn from 'b' with txn 'w2'  
> Then the withdrawal from 'b' succeeds and 'b' balance becomes 975

| | |
|---|---|
| **A. What the code does** | the withdrawal from 'b' succeeds and 'b' balance becomes 975 |
| **B. The alternative** | the withdrawal from 'b' is refused with 'daily-limit' because the limit is shared |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-033 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-033 --decision reject --expected "<what should happen>" --by <you>`

#### B-035 · Transfer of the entire balance is allowed

> Given account 'a' with balance 50  
> When transfer('a', 'b', 50, 't1')  
> Then ok; 'a' is 0 and 'b' is 50

| | |
|---|---|
| **A. What the code does** | ok; 'a' is 0 and 'b' is 50 |
| **B. The alternative** | the transfer is refused with 'insufficient-funds' |

**The plan may require the opposite:** “Each withdrawal is charged a fee of 1% of the amount, with a minimum fee of 0.50.” (P-012)

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-035 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-035 --decision reject --expected "<what should happen>" --by <you>`

#### B-036 · Transfer one cent over the balance is refused

> Given account 'a' with balance 50  
> When transfer('a', 'b', 50.01, 't1')  
> Then 'insufficient-funds'; 'a' stays 50 and 'b' is 0

| | |
|---|---|
| **A. What the code does** | 'insufficient-funds'; 'a' stays 50 and 'b' is 0 |
| **B. The alternative** | the transfer goes through and 'a' becomes -0.01 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-036 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-036 --decision reject --expected "<what should happen>" --by <you>`

#### B-039 · Split gives the leftover cent to the first recipient

> Given account 'a' with balance 100  
> When split('a', ['x','y','z'], 100, 's1')  
> Then ok; 'a' is 0, 'x' gets 33.34, 'y' 33.33, 'z' 33.33; 'a' has a 'split-out' entry of 100 and 'x' a 'split-in' of 33.34

| | |
|---|---|
| **A. What the code does** | ok; 'a' is 0, 'x' gets 33.34, 'y' 33.33, 'z' 33.33; 'a' has a 'split-out' entry of 100 and 'x' a 'split-in' of 33.34 |
| **B. The alternative** | the leftover cent goes to the last recipient: 'x' 33.33 and 'z' 33.34 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-039 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-039 --decision reject --expected "<what should happen>" --by <you>`

#### B-040 · Split remainder of 2 cents goes to the first two recipients

> Given account 'a' with balance 1  
> When split('a', ['x','y','z'], 0.05, 's1')  
> Then 'x' gets 0.02, 'y' 0.02, 'z' 0.01

| | |
|---|---|
| **A. What the code does** | 'x' gets 0.02, 'y' 0.02, 'z' 0.01 |
| **B. The alternative** | the first recipient gets the whole remainder: 'x' 0.03, 'y' 0.01, 'z' 0.01 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-040 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-040 --decision reject --expected "<what should happen>" --by <you>`

#### B-041 · Split over the balance is refused and nothing moves

> Given account 'a' with balance 10  
> When split('a', ['x','y'], 10.01, 's1')  
> Then 'insufficient-funds'; 'a' stays 10 and 'x' and 'y' are 0

| | |
|---|---|
| **A. What the code does** | 'insufficient-funds'; 'a' stays 10 and 'x' and 'y' are 0 |
| **B. The alternative** | the split goes through and 'a' becomes -0.01 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-041 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-041 --decision reject --expected "<what should happen>" --by <you>`

#### B-042 · Split with no recipients is refused, even for a seen txnId

> Given account 'a' with balance 10 funded by txn 'd1'  
> When split('a', [], 5, 'd1')  
> Then 'no-recipients' and 'a' stays 10

| | |
|---|---|
| **A. What the code does** | 'no-recipients' and 'a' stays 10 |
| **B. The alternative** | the call returns ok because txnId 'd1' was already seen |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-042 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-042 --decision reject --expected "<what should happen>" --by <you>`

#### B-043 · Split with zero amount and no recipients reports invalid-amount first

> Given a new Ledger  
> When split('a', [], 0, 's1')  
> Then 'invalid-amount'

| | |
|---|---|
| **A. What the code does** | 'invalid-amount' |
| **B. The alternative** | 'no-recipients' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-043 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-043 --decision reject --expected "<what should happen>" --by <you>`

#### B-045 · Interest for a full year uses a 365-day year

> Given account 'a' with balance 1000  
> When applyInterest('a', 5, 365, 'i1')  
> Then ok; 50 interest is credited, balance 1050, with an 'interest' entry of 50

| | |
|---|---|
| **A. What the code does** | ok; 50 interest is credited, balance 1050, with an 'interest' entry of 50 |
| **B. The alternative** | a 360-day year is used and 50.69 is credited (balance 1050.69) |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-045 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-045 --decision reject --expected "<what should happen>" --by <you>`

#### B-046 · Partial-cent interest is rounded down

> Given account 'a' with balance 1000  
> When applyInterest('a', 5, 30, 'i1') (exact interest 4.1095…)  
> Then 4.10 is credited and the balance becomes 1004.1

| | |
|---|---|
| **A. What the code does** | 4.10 is credited and the balance becomes 1004.1 |
| **B. The alternative** | interest is rounded to the nearest cent, 4.11, and the balance becomes 1004.11 |

**The plan may require the opposite:** “Balances are kept in whole cents.” (P-010); “An amount with more than two decimals is rounded to the nearest cent, with halves rounded away from zero.” (P-011)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-046 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-046 --decision reject --expected "<what should happen>" --by <you>`

#### B-047 · Interest that rounds to zero is ok, records nothing, and leaves the txnId reusable

> Given account 'a' with balance 1  
> When applyInterest('a', 1, 1, 'i1') (exact interest 0.0027 cents), then 999 more is deposited and applyInterest('a', 5, 365, 'i1') is called  
> Then the first call is ok with no interest entry and balance 1; the second call credits 50 and the balance becomes 1050

| | |
|---|---|
| **A. What the code does** | the first call is ok with no interest entry and balance 1; the second call credits 50 and the balance becomes 1050 |
| **B. The alternative** | the second call is ignored because 'i1' was already used, leaving balance 1000 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-047 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-047 --decision reject --expected "<what should happen>" --by <you>`

## Dropped requirements

#### P-007

> A transfer to the same account is rejected.

Plan line 13. Probe `PR-P-007` fails against the code: AssertionError: expected true to be false // Object.is equality

_The trace had marked this realised (by B-006, B-007, B-038); the probe overrules it._

#### P-013

> The fee is recorded in the account history as its own entry, separate from the withdrawal.

Plan line 22. Probe `PR-P-013` fails against the code: AssertionError: expected 2 to be 3 // Object.is equality

#### P-014

> Customers can deposit an amount in a foreign currency together with an exchange rate; the amount is converted at that rate and rounded to the nearest cent, with halves rounded to even.

Plan line 23. Probe `PR-P-014` fails against the code: AssertionError: expected 0.13 to be 0.12 // Object.is equality

_The trace had marked this realised (by B-009, B-010, B-011, B-012, B-013, B-014); the probe overrules it._

## Leave-one-out: check these

The cited statement was hidden and the tracer still found a source. Either the plan says it twice, or the tracer is over-matching.

- B-006: now cites “A transfer to the same account is rejected.” (P-007)

## Extractor misses

The code does realise these statements, but blind extraction did not describe the behaviour. This is a measure of extraction recall, not a defect in the code.

- P-004: Customers can withdraw funds from an account.
- P-010: Balances are kept in whole cents.
- P-011: An amount with more than two decimals is rounded to the nearest cent, with halves rounded away from zero.
- P-012: Each withdrawal is charged a fee of 1% of the amount, with a minimum fee of 0.50.
