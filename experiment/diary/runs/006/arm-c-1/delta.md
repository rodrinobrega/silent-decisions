# Delta: plan.md

Run `20261006T061410-2d700c` · plan sha256 `f1655dc091e1`

**34 silent decision(s), 3 dropped requirement(s).**

## Run health

| Check | Result |
|---|---|
| Scenarios | 38 extracted · 38 verified · 0 vacuous · 0 refuted |
| Census (declared) | 35 decision points · 34 covered · 1 waived · 0 uncovered |
| Trace mode | llm-tracer |
| Trace | 4 stated · 0 entailed · 34 unsourced · 5 downgraded by rules |
| Reverse probes | 14 run · 3 dropped · 0 realised but missed by the extractor |
| Leave-one-out | passed (2 statement(s) hidden: 4 flipped, 0 re-sourced, 0 cited hidden text) |
| Leak check | suspect · no audit log (hook not installed) |

Open issues with this run:

- leak check: **suspect**

## Silent decisions

### sub-cent amounts

#### B-002 · A deposit that rounds to zero cents is still accepted and recorded as 0

> Given an empty ledger  
> When 0.004 is deposited into account 'a' with transaction 'd1'  
> Then the deposit is accepted, the balance stays 0 and the history holds a deposit entry of amount 0

| | |
|---|---|
| **A. What the code does** | the deposit is accepted, the balance stays 0 and the history holds a deposit entry of amount 0 |
| **B. The alternative** | the deposit is rejected because it rounds to 0 cents |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-002 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-002 --decision reject --expected "<what should happen>" --by <you>`

#### B-010 · A foreign deposit worth less than half a cent is 'amount-too-small'

> Given an empty ledger  
> When depositForeign of 0.004 at rate 1 ('f1'), then of 0.005 at rate 1 ('f2')  
> Then the first is rejected with reason 'amount-too-small'; the second is accepted and the balance becomes 0.01

| | |
|---|---|
| **A. What the code does** | the first is rejected with reason 'amount-too-small'; the second is accepted and the balance becomes 0.01 |
| **B. The alternative** | the 0.004 foreign deposit is accepted and recorded as 0 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-010 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-010 --decision reject --expected "<what should happen>" --by <you>`

### transaction id idempotency

#### B-003 · Zero or negative deposits are rejected and do not use up the transaction id

> Given an empty ledger  
> When 0 is deposited with transaction 't1', then -5 with 't1', then 100 with 't1'  
> Then the first two are rejected with reason 'invalid-amount' and the deposit of 100 is accepted, balance 100

| | |
|---|---|
| **A. What the code does** | the first two are rejected with reason 'invalid-amount' and the deposit of 100 is accepted, balance 100 |
| **B. The alternative** | the deposit of 100 with 't1' is treated as a repeat of the rejected 't1' and is not applied |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-003 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-003 --decision reject --expected "<what should happen>" --by <you>`

#### B-004 · Repeating a deposit transaction id is a silent no-op, even on another account

> Given 100 has been deposited into 'a' with transaction 't1'  
> When 50 is deposited into 'a' with 't1', and 50 into 'b' with 't1'  
> Then both calls report ok, 'a' stays at 100 with one entry, and 'b' stays at 0

| | |
|---|---|
| **A. What the code does** | both calls report ok, 'a' stays at 100 with one entry, and 'b' stays at 0 |
| **B. The alternative** | reusing 't1' with a different amount or account is rejected as a conflicting transaction id |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-004 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-004 --decision reject --expected "<what should happen>" --by <you>`

#### B-011 · Repeating a foreign deposit transaction id is a no-op

> Given an empty ledger  
> When depositForeign of 100 at rate 1.5 with 'f1' is called twice  
> Then both report ok and the balance is 150

| | |
|---|---|
| **A. What the code does** | both report ok and the balance is 150 |
| **B. The alternative** | the second depositForeign with 'f1' is rejected with reason 'duplicate-transaction' and the balance stays 150 |

Why the plan does not settle it: 'so that retries are safe' is met as long as the retry is not applied twice. It does not say a retry reports ok rather than an error, and the Then claims 'both report ok'.

Nearest plan text: “Each operation carries a client-supplied transaction id so that retries are safe.” (P-009)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-011 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-011 --decision reject --expected "<what should happen>" --by <you>`

#### B-023 · A withdrawal reusing any earlier transaction id is ignored

> Given 100 has been deposited into 'a' with transaction 'x'  
> When 10 is withdrawn with 'x', then 10 is withdrawn twice with 'w1'  
> Then the 'x' withdrawal reports ok but does nothing; only one 'w1' withdrawal applies, so the balance is 89.5

| | |
|---|---|
| **A. What the code does** | the 'x' withdrawal reports ok but does nothing; only one 'w1' withdrawal applies, so the balance is 89.5 |
| **B. The alternative** | the 'x' withdrawal is applied (ids are scoped per operation kind) or rejected as a conflicting id |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-023 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-023 --decision reject --expected "<what should happen>" --by <you>`

### account lifecycle

#### B-005 · An unknown account reads as balance 0 with empty history

> Given an empty ledger  
> When the balance and entries of 'ghost' are read  
> Then the balance is 0 and the entries are an empty list

| | |
|---|---|
| **A. What the code does** | the balance is 0 and the entries are an empty list |
| **B. The alternative** | reading an unknown account raises an error |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-005 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-005 --decision reject --expected "<what should happen>" --by <you>`

#### B-006 · Opening an existing account does not reset it

> Given 100 has been deposited into 'a'  
> When open('a') is called  
> Then the balance is still 100 and the history still has 1 entry

| | |
|---|---|
| **A. What the code does** | the balance is still 100 and the history still has 1 entry |
| **B. The alternative** | open('a') on an existing account fails or resets it |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-006 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-006 --decision reject --expected "<what should happen>" --by <you>`

### foreign currency deposit

#### B-007 · A foreign deposit is multiplied by the rate and recorded as a plain deposit

> Given an empty ledger  
> When depositForeign of 100 at rate 1.5 into 'a' with transaction 'f1'  
> Then the balance is 150 and the history holds a 'deposit' entry of 150

| | |
|---|---|
| **A. What the code does** | the balance is 150 and the history holds a 'deposit' entry of 150 |
| **B. The alternative** | the amount is divided by the rate, or the entry is recorded as a distinct foreign-deposit kind |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-007 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-007 --decision reject --expected "<what should happen>" --by <you>`

#### B-008 · A converted half cent is rounded up, not to even

> Given an empty ledger  
> When depositForeign of 1.25 at rate 0.5 into 'a' (exactly 0.625)  
> Then the balance is 0.63

| | |
|---|---|
| **A. What the code does** | the balance is 0.63 |
| **B. The alternative** | the half cent is rounded to even and the balance is 0.62 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-008 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-008 --decision reject --expected "<what should happen>" --by <you>`

#### B-009 · A foreign deposit with a zero or negative rate or amount is 'invalid-amount'

> Given an empty ledger  
> When depositForeign of 100 at rate 0, of 100 at rate -1.5, and of -100 at rate 1.5  
> Then all three are rejected with reason 'invalid-amount' and the balance stays 0

| | |
|---|---|
| **A. What the code does** | all three are rejected with reason 'invalid-amount' and the balance stays 0 |
| **B. The alternative** | a rate of 0 is rejected with a distinct reason such as 'invalid-rate' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-009 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-009 --decision reject --expected "<what should happen>" --by <you>`

### withdrawal fee

#### B-012 · A small withdrawal is charged the minimum fee of 0.50

> Given a balance of 100 in 'a'  
> When 10 is withdrawn  
> Then the fee is 0.50 (1% would be 0.10) and the balance becomes 89.5

| | |
|---|---|
| **A. What the code does** | the fee is 0.50 (1% would be 0.10) and the balance becomes 89.5 |
| **B. The alternative** | the 0.50 fee is taken out of the 10 withdrawn (the customer receives 9.50) and the balance becomes 90 |

Why the plan does not settle it: 'Each withdrawal is charged a fee of 1% of the amount, with a minimum fee of 0.50' fixes the fee at 0.50, but not whether it is debited on top of the amount or netted from the payout. Both systems charge 0.50.

Nearest plan text: “Each withdrawal is charged a fee of 1% of the amount, with a minimum fee of 0.50.” (P-012)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-012 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-012 --decision reject --expected "<what should happen>" --by <you>`

#### B-013 · The fee is recorded inside the withdrawal entry, not as its own entry

> Given a balance of 100 in 'a' from deposit 'd1'  
> When 10 is withdrawn with transaction 'w1'  
> Then the history is the deposit of 100 followed by one 'withdrawal' entry of 10.5

| | |
|---|---|
| **A. What the code does** | the history is the deposit of 100 followed by one 'withdrawal' entry of 10.5 |
| **B. The alternative** | the history shows a 'withdrawal' entry of 10 and a separate fee entry of 0.50 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-013 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-013 --decision reject --expected "<what should happen>" --by <you>`

#### B-014 · A 1% fee with a fraction of a cent is rounded up

> Given a balance of 100 in 'a'  
> When 60.01 is withdrawn (1% is 0.6001)  
> Then the fee is 0.61 and the balance becomes 39.38

| | |
|---|---|
| **A. What the code does** | the fee is 0.61 and the balance becomes 39.38 |
| **B. The alternative** | the fee is rounded to the nearest cent, 0.60, and the balance becomes 39.39 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-014 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-014 --decision reject --expected "<what should happen>" --by <you>`

#### B-015 · The withdrawal fee is capped at 25

> Given a balance of 4000 in 'a'  
> When 3000 is withdrawn (1% would be 30)  
> Then the fee is 25 and the balance becomes 975

| | |
|---|---|
| **A. What the code does** | the fee is 25 and the balance becomes 975 |
| **B. The alternative** | the full 1% fee of 30 is charged and the balance becomes 970 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-015 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-015 --decision reject --expected "<what should happen>" --by <you>`

### overdraft policy

#### B-016 · Withdrawing the whole balance is refused because the fee must also fit

> Given a balance of 100 in 'a'  
> When 100 is withdrawn, then 99 is withdrawn  
> Then the 100 withdrawal is rejected with 'insufficient-funds'; the 99 withdrawal (fee 0.99) is accepted, leaving 0.01

| | |
|---|---|
| **A. What the code does** | the 100 withdrawal is rejected with 'insufficient-funds'; the 99 withdrawal (fee 0.99) is accepted, leaving 0.01 |
| **B. The alternative** | the 100 withdrawal is accepted because only the amount is checked against the balance |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-016 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-016 --decision reject --expected "<what should happen>" --by <you>`

#### B-017 · A withdrawal that leaves exactly 0 after the fee is allowed

> Given a balance of 10.50 in 'a'  
> When 10.01 is withdrawn, then 10 is withdrawn  
> Then 10.01 is rejected with 'insufficient-funds' (10.01 + 0.50 > 10.50); 10 is accepted and the balance becomes 0

| | |
|---|---|
| **A. What the code does** | 10.01 is rejected with 'insufficient-funds' (10.01 + 0.50 > 10.50); 10 is accepted and the balance becomes 0 |
| **B. The alternative** | the 10 withdrawal is rejected because the balance must stay above 0 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-017 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-017 --decision reject --expected "<what should happen>" --by <you>`

#### B-025 · A transfer may empty the account exactly but not overdraw it

> Given a balance of 100 in 'a'  
> When 100.01 is transferred to 'b', then 100 is transferred to 'b'  
> Then 100.01 is rejected with 'insufficient-funds'; 100 is accepted, leaving 'a' at 0 and 'b' at 100

| | |
|---|---|
| **A. What the code does** | 100.01 is rejected with 'insufficient-funds'; 100 is accepted, leaving 'a' at 0 and 'b' at 100 |
| **B. The alternative** | the 100.01 transfer is accepted and 'a' goes negative |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-025 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-025 --decision reject --expected "<what should happen>" --by <you>`

#### B-032 · A split may empty the payer exactly but not overdraw it

> Given a balance of 10 in 'a'  
> When 10.01 is split to ['b', 'c'], then 10 is split to ['b', 'c']  
> Then 10.01 is rejected with 'insufficient-funds' and nothing moves; 10 is accepted, 'a' becomes 0 and 'b' and 'c' get 5 each

| | |
|---|---|
| **A. What the code does** | 10.01 is rejected with 'insufficient-funds' and nothing moves; 10 is accepted, 'a' becomes 0 and 'b' and 'c' get 5 each |
| **B. The alternative** | the split of 10.01 is accepted and 'a' goes negative |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-032 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-032 --decision reject --expected "<what should happen>" --by <you>`

### withdrawal limit

#### B-018 · Withdrawals are limited to 5000 in total per account; once used up, even 0.01 is refused

> Given a balance of 10000 in 'a'  
> When 5000 is withdrawn, then 0.01 is withdrawn  
> Then 5000 is accepted (balance 4975 after the 25 fee); 0.01 is rejected with 'daily-limit'

| | |
|---|---|
| **A. What the code does** | 5000 is accepted (balance 4975 after the 25 fee); 0.01 is rejected with 'daily-limit' |
| **B. The alternative** | the 0.01 withdrawal is accepted |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-018 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-018 --decision reject --expected "<what should happen>" --by <you>`

#### B-019 · The fee does not count towards the withdrawal limit

> Given a balance of 10000 in 'a'  
> When 4990 is withdrawn (4990 plus the 25 fee is 5015)  
> Then it is accepted and the balance becomes 4985

| | |
|---|---|
| **A. What the code does** | it is accepted and the balance becomes 4985 |
| **B. The alternative** | it is rejected because amount plus fee exceeds 5000 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-019 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-019 --decision reject --expected "<what should happen>" --by <you>`

#### B-020 · A single withdrawal of 5000.01 exceeds the limit

> Given a balance of 10000 in 'a'  
> When 5000.01 is withdrawn  
> Then it is rejected with 'daily-limit' and the balance stays 10000

| | |
|---|---|
| **A. What the code does** | it is rejected with 'daily-limit' and the balance stays 10000 |
| **B. The alternative** | it is accepted and the balance becomes 4974.99 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-020 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-020 --decision reject --expected "<what should happen>" --by <you>`

#### B-021 · Insufficient funds is reported before the withdrawal limit

> Given a balance of 100 in 'a'  
> When 6000 is withdrawn  
> Then it is rejected with 'insufficient-funds'

| | |
|---|---|
| **A. What the code does** | it is rejected with 'insufficient-funds' |
| **B. The alternative** | it is rejected with 'daily-limit' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-021 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-021 --decision reject --expected "<what should happen>" --by <you>`

### amount validation

#### B-022 · Zero or negative withdrawals are 'invalid-amount'

> Given a balance of 100 in 'a'  
> When 0 is withdrawn, and -10 is withdrawn  
> Then both are rejected with 'invalid-amount' and the balance stays 100

| | |
|---|---|
| **A. What the code does** | both are rejected with 'invalid-amount' and the balance stays 100 |
| **B. The alternative** | both withdrawals are rejected with reason 'non-positive-amount' and the balance stays 100 |

Why the plan does not settle it: 'otherwise the operation is rejected' decides that the operation is rejected but not the reason it reports. The Then asserts 'invalid-amount'. Accepting 0 or -10 would be a breach.

Nearest plan text: “An amount must be a positive number, otherwise the operation is rejected.” (P-005)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-022 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-022 --decision reject --expected "<what should happen>" --by <you>`

#### B-027 · Zero or negative transfers are 'invalid-amount'

> Given a balance of 100 in 'a'  
> When 0 and then -10 are transferred to 'b'  
> Then both are rejected with 'invalid-amount'; 'a' stays 100 and 'b' 0

| | |
|---|---|
| **A. What the code does** | both are rejected with 'invalid-amount'; 'a' stays 100 and 'b' 0 |
| **B. The alternative** | both transfers are rejected with reason 'non-positive-amount'; 'a' stays 100 and 'b' 0 |

Why the plan does not settle it: As with B-022, the quote requires rejection but names no reason code, so the 'invalid-amount' label in the Then is not decided. Accepting the transfers would be a breach.

Nearest plan text: “An amount must be a positive number, otherwise the operation is rejected.” (P-005)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-027 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-027 --decision reject --expected "<what should happen>" --by <you>`

### transfer

#### B-024 · A transfer moves the amount with no fee and records out/in entries

> Given a balance of 100 in 'a'  
> When 30 is transferred from 'a' to 'b' with transaction 't1'  
> Then 'a' has 70 and 'b' has 30; 'a' records 'transfer-out' 30 and 'b' records 'transfer-in' 30

| | |
|---|---|
| **A. What the code does** | 'a' has 70 and 'b' has 30; 'a' records 'transfer-out' 30 and 'b' records 'transfer-in' 30 |
| **B. The alternative** | the withdrawal fee of 0.50 is also charged and 'a' has 69.5 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-024 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-024 --decision reject --expected "<what should happen>" --by <you>`

#### B-026 · A transfer to the same account is accepted and leaves the balance unchanged

> Given a balance of 100 in 'a' from deposit 'd1'  
> When 30 is transferred from 'a' to 'a' with transaction 't1'  
> Then it is accepted, the balance stays 100, and the history gains 'transfer-out' 30 and 'transfer-in' 30

| | |
|---|---|
| **A. What the code does** | it is accepted, the balance stays 100, and the history gains 'transfer-out' 30 and 'transfer-in' 30 |
| **B. The alternative** | the transfer is rejected because source and destination are the same |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-026 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-026 --decision reject --expected "<what should happen>" --by <you>`

### split payment

#### B-029 · In a split, leftover cents go to the first recipients in list order

> Given a balance of 100 in 'a'  
> When 10 is split from 'a' to ['b', 'c', 'd']  
> Then 'b' gets 3.34, 'c' 3.33, 'd' 3.33, and 'a' has 90

| | |
|---|---|
| **A. What the code does** | 'b' gets 3.34, 'c' 3.33, 'd' 3.33, and 'a' has 90 |
| **B. The alternative** | the leftover cent goes to the last recipient: 'b' 3.33 and 'd' 3.34 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-029 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-029 --decision reject --expected "<what should happen>" --by <you>`

#### B-030 · A split too small for everyone gives the last recipient a 0 entry

> Given a balance of 100 in 'a'  
> When 0.02 is split from 'a' to ['b', 'c', 'd'] with transaction 's1'  
> Then 'b' gets 0.01, 'c' 0.01, 'd' 0, and 'd' still has a 'split-in' entry of amount 0

| | |
|---|---|
| **A. What the code does** | 'b' gets 0.01, 'c' 0.01, 'd' 0, and 'd' still has a 'split-in' entry of amount 0 |
| **B. The alternative** | 'd' receives nothing and has no history entry |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-030 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-030 --decision reject --expected "<what should happen>" --by <you>`

#### B-031 · A split with no recipients is refused; an invalid amount is reported first

> Given a balance of 100 in 'a'  
> When 10 is split to [], 0 is split to [], and -1 is split to ['b']  
> Then the first is rejected with 'no-recipients'; the second and third with 'invalid-amount'; 'a' stays 100

| | |
|---|---|
| **A. What the code does** | the first is rejected with 'no-recipients'; the second and third with 'invalid-amount'; 'a' stays 100 |
| **B. The alternative** | splitting 0 to [] is reported as 'no-recipients', or a split to [] is a no-op |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-031 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-031 --decision reject --expected "<what should happen>" --by <you>`

### interest

#### B-034 · Interest is rounded down to the cent

> Given a balance of 1000 in 'a'  
> When interest at 5% annual for 30 days is applied with 'i1' (exactly 4.1095...)  
> Then 4.10 is credited as an 'interest' entry and the balance becomes 1004.1

| | |
|---|---|
| **A. What the code does** | 4.10 is credited as an 'interest' entry and the balance becomes 1004.1 |
| **B. The alternative** | interest is rounded to the nearest cent, 4.11, and the balance becomes 1004.11 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-034 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-034 --decision reject --expected "<what should happen>" --by <you>`

#### B-035 · Interest uses a 365-day year

> Given a balance of 1000 in 'a'  
> When interest at 36% annual for 10 days is applied  
> Then 9.86 is credited and the balance becomes 1009.86

| | |
|---|---|
| **A. What the code does** | 9.86 is credited and the balance becomes 1009.86 |
| **B. The alternative** | interest of 9.8630... is rounded up to 9.87 (or compounded daily to 9.91) and the balance becomes 1009.87 |

Why the plan does not settle it: 'computed on the current balance with a 365-day year' rules out a 360-day year but sets no rounding and no simple-versus-compound method. Rounding up, or compounding daily on a 365-day year, uses the current balance and a 365-day year just the same.

Nearest plan text: “computed on the current balance with a 365-day year” (P-015)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-035 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-035 --decision reject --expected "<what should happen>" --by <you>`

#### B-036 · Interest that rounds to 0 reports ok, records nothing, and leaves the id reusable

> Given a balance of 1 in 'a'  
> When interest at 1% for 1 day is applied with 'i1'; then 1000 is deposited and interest at 36% for 10 days is applied again with 'i1'  
> Then the first call reports ok with no entry and balance 1; the second call credits 9.87 and the balance becomes 1010.87

| | |
|---|---|
| **A. What the code does** | the first call reports ok with no entry and balance 1; the second call credits 9.87 and the balance becomes 1010.87 |
| **B. The alternative** | the second call is treated as a repeat of 'i1' and ignored, leaving the balance at 1001 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-036 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-036 --decision reject --expected "<what should happen>" --by <you>`

#### B-037 · Interest with a zero or negative rate or days is 'invalid-amount'

> Given a balance of 1000 in 'a'  
> When interest is applied at 0% for 30 days, at 5% for 0 days, and at -5% for 30 days  
> Then all three are rejected with 'invalid-amount' and the balance stays 1000

| | |
|---|---|
| **A. What the code does** | all three are rejected with 'invalid-amount' and the balance stays 1000 |
| **B. The alternative** | a 0% rate is accepted as a no-op |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-037 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-037 --decision reject --expected "<what should happen>" --by <you>`

## Dropped requirements

#### P-007

> A transfer to the same account is rejected.

Plan line 13. Probe `PR-P-007` fails against the code: AssertionError: expected true to be false // Object.is equality

#### P-013

> The fee is recorded in the account history as its own entry, separate from the withdrawal.

Plan line 22. Probe `PR-P-013` fails against the code: AssertionError: expected 2 to be 3 // Object.is equality

#### P-014

> Customers can deposit an amount in a foreign currency together with an exchange rate; the amount is converted at that rate and rounded to the nearest cent, with halves rounded to even.

Plan line 23. Probe `PR-P-014` fails against the code: AssertionError: expected 0.13 to be 0.12 // Object.is equality

_The trace had marked this realised (by B-007); the probe overrules it._
