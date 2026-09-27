# Delta: plan.md

Run `20260927T194911-d2d804` · plan sha256 `f1655dc091e1`

> **This run is void.** A control failed, so a clean result here means nothing. Fix the cause and re-run.

**32 silent decision(s), 3 dropped requirement(s).**

## Run health

| Check | Result |
|---|---|
| Scenarios | 49 extracted · 49 verified · 0 vacuous · 0 refuted |
| Census (declared) | 35 decision points · 34 covered · 1 waived · 0 uncovered |
| Trace mode | pairwise-classifier · 2516 calls · threshold 0.7 |
| Trace | 17 stated · 0 entailed · 32 unsourced · 0 downgraded by rules |
| Reverse probes | 14 run · 3 dropped · 4 realised but missed by the extractor |
| Leave-one-out | passed (3 statement(s) hidden: 11 flipped, 0 re-sourced, 0 cited hidden text) |
| Leak check | contaminated · transcript: 7 tool call(s), 1 outside the room, 0 plan mention(s), 1 denied |

Open issues with this run:

- leak check: **contaminated**

## Silent decisions

### unclustered

#### B-001 · A deposit credits the account and records a deposit entry

> Given a new Ledger with no accounts  
> When 100 is deposited to 'alice' with txnId 't1'  
> Then the result is { ok: true }, balance('alice') is 100 and entries('alice') is one entry { txnId: 't1', kind: 'deposit', amount: 100 }

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, balance('alice') is 100 and entries('alice') is one entry { txnId: 't1', kind: 'deposit', amount: 100 } |
| **B. The alternative** | the deposit is refused with reason 'unknown-account' because 'alice' was never opened, and her balance stays 0 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-001 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-001 --decision reject --expected "<what should happen>" --by <you>`

#### B-005 · A txnId used by a deposit makes a later withdrawal with the same txnId a silent no-op

> Given a Ledger where 100 was deposited to 'alice' with txnId 't1'  
> When 50 is withdrawn from 'alice' with txnId 't1'  
> Then the result is { ok: true } but nothing is withdrawn: the balance stays 100 and there is 1 entry

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } but nothing is withdrawn: the balance stays 100 and there is 1 entry |
| **B. The alternative** | the withdrawal is applied (txnIds are tracked per operation type) and the balance becomes 49.5 |

**The plan may require the opposite:** “Customers can withdraw funds from an account.” (P-004); “Each withdrawal is charged a fee of 1% of the amount, with a minimum fee of 0.50.” (P-012)

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-005 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-005 --decision reject --expected "<what should happen>" --by <you>`

#### B-009 · An account that was never used reads as balance 0 with no entries

> Given a new Ledger  
> When balance('ghost') and entries('ghost') are read  
> Then balance is 0 and entries is an empty list

| | |
|---|---|
| **A. What the code does** | balance is 0 and entries is an empty list |
| **B. The alternative** | balance returns undefined for an unknown account |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-009 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-009 --decision reject --expected "<what should happen>" --by <you>`

#### B-011 · The list returned by entries is a copy; changing it does not change the history

> Given a Ledger where 50 was deposited to 'alice'  
> When the list returned by entries('alice') is emptied and entries('alice') is read again  
> Then the second read still returns 1 entry

| | |
|---|---|
| **A. What the code does** | the second read still returns 1 entry |
| **B. The alternative** | the history is emptied too and the second read returns 0 entries |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-011 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-011 --decision reject --expected "<what should happen>" --by <you>`

#### B-013 · A foreign deposit with rate 0 is rejected as invalid-amount

> Given a new Ledger  
> When depositForeign('alice', 100, 0, 'f1')  
> Then the result is { ok: false, reason: 'invalid-amount' } and the balance stays 0

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'invalid-amount' } and the balance stays 0 |
| **B. The alternative** | the deposit is rejected with reason 'amount-too-small' instead |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-013 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-013 --decision reject --expected "<what should happen>" --by <you>`

#### B-015 · A foreign deposit worth less than half a cent is rejected as amount-too-small and does not use up its txnId

> Given a new Ledger  
> When depositForeign('alice', 1, 0.004, 'f1') is made (worth 0.004), then 5 is deposited with txnId 'f1'  
> Then the foreign deposit returns { ok: false, reason: 'amount-too-small' } with no entry, and the later deposit of 5 is applied so the balance is 5

| | |
|---|---|
| **A. What the code does** | the foreign deposit returns { ok: false, reason: 'amount-too-small' } with no entry, and the later deposit of 5 is applied so the balance is 5 |
| **B. The alternative** | the foreign deposit is accepted crediting 0, and the later deposit with the same txnId is ignored so the balance stays 0 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-015 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-015 --decision reject --expected "<what should happen>" --by <you>`

#### B-016 · A foreign deposit worth exactly half a cent rounds up to 0.01

> Given a new Ledger  
> When depositForeign('alice', 1, 0.005, 'f1') (worth 0.005)  
> Then the result is { ok: true } and the balance is 0.01

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and the balance is 0.01 |
| **B. The alternative** | the deposit is rejected with reason 'amount-too-small' and the balance stays 0 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-016 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-016 --decision reject --expected "<what should happen>" --by <you>`

#### B-017 · A foreign deposit reusing a txnId is a silent no-op

> Given a Ledger where 100 was deposited to 'alice' with txnId 't1'  
> When depositForeign('alice', 10, 2, 't1')  
> Then the result is { ok: true } and the balance stays 100

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and the balance stays 100 |
| **B. The alternative** | the foreign deposit is applied and the balance becomes 120 |

**The plan may require the opposite:** “Customers can deposit an amount in a foreign currency together with an exchange rate; the amount is converted at that rate and rounded to the nearest cent, with halves rounded to even.” (P-014)

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-017 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-017 --decision reject --expected "<what should happen>" --by <you>`

#### B-018 · A small withdrawal is charged the minimum fee of 0.50, included in the withdrawal entry

> Given a Ledger where 'alice' has a balance of 20  
> When 10 is withdrawn from 'alice' with txnId 'w1'  
> Then the result is { ok: true }, the balance is 9.5 and the withdrawal entry has amount 10.5 (10 plus 0.50 fee)

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, the balance is 9.5 and the withdrawal entry has amount 10.5 (10 plus 0.50 fee) |
| **B. The alternative** | the fee is 1% (0.10) and the balance becomes 9.9 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-018 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-018 --decision reject --expected "<what should happen>" --by <you>`

#### B-019 · A withdrawal of 100 is charged a 1% fee of 1.00

> Given a Ledger where 'alice' has a balance of 1000  
> When 100 is withdrawn from 'alice'  
> Then the balance is 899

| | |
|---|---|
| **A. What the code does** | the balance is 899 |
| **B. The alternative** | the minimum fee of 0.50 applies and the balance is 899.5 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-019 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-019 --decision reject --expected "<what should happen>" --by <you>`

#### B-020 · The withdrawal fee is rounded up to the next cent

> Given a Ledger where 'alice' has a balance of 1000  
> When 100.01 is withdrawn from 'alice' (1% fee is 1.0001)  
> Then the fee is 1.01 and the balance is 898.98

| | |
|---|---|
| **A. What the code does** | the fee is 1.01 and the balance is 898.98 |
| **B. The alternative** | the fee is rounded down to 1.00 and the balance is 898.99 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-020 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-020 --decision reject --expected "<what should happen>" --by <you>`

#### B-021 · The withdrawal fee is capped at 25.00

> Given a Ledger where 'alice' has a balance of 5000  
> When 3000 is withdrawn from 'alice' (1% would be 30)  
> Then the fee is 25 and the balance is 1975

| | |
|---|---|
| **A. What the code does** | the fee is 25 and the balance is 1975 |
| **B. The alternative** | the uncapped fee of 30 is charged and the balance is 1970 |

**The plan may require the opposite:** “Each withdrawal is charged a fee of 1% of the amount, with a minimum fee of 0.50.” (P-012)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-021 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-021 --decision reject --expected "<what should happen>" --by <you>`

#### B-022 · A withdrawal that uses the whole balance including the fee is allowed

> Given a Ledger where 'alice' has a balance of 101  
> When 100 is withdrawn (fee 1.00)  
> Then the result is { ok: true } and the balance is 0

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and the balance is 0 |
| **B. The alternative** | the withdrawal is rejected with 'insufficient-funds' and the balance stays 101 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-022 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-022 --decision reject --expected "<what should happen>" --by <you>`

#### B-023 · A withdrawal the balance covers but not with the fee is rejected

> Given a Ledger where 'alice' has a balance of 100.99  
> When 100 is withdrawn (fee 1.00, total 101)  
> Then the result is { ok: false, reason: 'insufficient-funds' } and the balance stays 100.99

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' } and the balance stays 100.99 |
| **B. The alternative** | the withdrawal goes through and the balance becomes -0.01 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-023 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-023 --decision reject --expected "<what should happen>" --by <you>`

#### B-024 · Withdrawing exactly the daily limit of 5000 is allowed (the fee does not count toward the limit)

> Given a Ledger where 'alice' has a balance of 6000 and has withdrawn nothing  
> When 5000 is withdrawn  
> Then the result is { ok: true } and the balance is 975 (5000 plus the 25 fee)

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and the balance is 975 (5000 plus the 25 fee) |
| **B. The alternative** | the withdrawal is rejected with 'daily-limit' because 5000 plus the fee exceeds 5000 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-024 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-024 --decision reject --expected "<what should happen>" --by <you>`

#### B-025 · A single withdrawal of 5000.01 exceeds the daily limit

> Given a Ledger where 'alice' has a balance of 6000  
> When 5000.01 is withdrawn  
> Then the result is { ok: false, reason: 'daily-limit' } and the balance stays 6000

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'daily-limit' } and the balance stays 6000 |
| **B. The alternative** | the withdrawal goes through (accepted with { ok: true }) |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-025 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-025 --decision reject --expected "<what should happen>" --by <you>`

#### B-026 · The daily limit is cumulative across withdrawals and is never reset within a Ledger

> Given a Ledger where 'alice' has a balance of 10000 and has already withdrawn 3000 (balance 6975)  
> When a further 2000.01 is withdrawn  
> Then the result is { ok: false, reason: 'daily-limit' } and the balance stays 6975

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'daily-limit' } and the balance stays 6975 |
| **B. The alternative** | the withdrawal goes through because each withdrawal is checked on its own |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-026 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-026 --decision reject --expected "<what should happen>" --by <you>`

#### B-027 · After withdrawing 3000, a further 2000 exactly reaches the limit and is allowed

> Given a Ledger where 'alice' has a balance of 10000 and has already withdrawn 3000 (balance 6975)  
> When a further 2000 is withdrawn (fee 20)  
> Then the result is { ok: true } and the balance is 4955

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and the balance is 4955 |
| **B. The alternative** | the withdrawal is rejected with 'daily-limit' and the balance stays 6975 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-027 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-027 --decision reject --expected "<what should happen>" --by <you>`

#### B-028 · Each account has its own daily withdrawal limit

> Given a Ledger where 'alice' and 'bob' each have 6000 and 'alice' has already withdrawn 5000  
> When 'bob' withdraws 5000  
> Then the result is { ok: true } and bob's balance is 975

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and bob's balance is 975 |
| **B. The alternative** | bob's withdrawal is rejected with 'daily-limit' because the limit is shared across the ledger |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-028 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-028 --decision reject --expected "<what should happen>" --by <you>`

#### B-029 · Insufficient funds is reported ahead of the daily limit

> Given a Ledger where 'alice' has a balance of 100  
> When 6000 is withdrawn  
> Then the result is { ok: false, reason: 'insufficient-funds' }

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' } |
| **B. The alternative** | the result is { ok: false, reason: 'daily-limit' } |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-029 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-029 --decision reject --expected "<what should happen>" --by <you>`

#### B-030 · A rejected withdrawal does not use up its txnId or the daily limit

> Given a Ledger where 'alice' has a balance of 6000  
> When 5000.01 is withdrawn with txnId 'w1' (rejected), then 5000 is withdrawn with the same txnId 'w1'  
> Then the second attempt returns { ok: true } and the balance is 975

| | |
|---|---|
| **A. What the code does** | the second attempt returns { ok: true } and the balance is 975 |
| **B. The alternative** | the second attempt is treated as a duplicate of 'w1' and the balance stays 6000 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-030 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-030 --decision reject --expected "<what should happen>" --by <you>`

#### B-033 · Transferring the entire balance is allowed

> Given a Ledger where 'alice' has 100  
> When 100 is transferred from 'alice' to 'bob'  
> Then the result is { ok: true }, alice has 0 and bob has 100

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, alice has 0 and bob has 100 |
| **B. The alternative** | the transfer is rejected with 'insufficient-funds' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-033 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-033 --decision reject --expected "<what should happen>" --by <you>`

#### B-034 · Transferring one cent more than the balance is rejected

> Given a Ledger where 'alice' has 100  
> When 100.01 is transferred from 'alice' to 'bob'  
> Then the result is { ok: false, reason: 'insufficient-funds' }, alice still has 100 and bob has 0

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' }, alice still has 100 and bob has 0 |
| **B. The alternative** | the transfer goes through and alice has -0.01 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-034 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-034 --decision reject --expected "<what should happen>" --by <you>`

#### B-037 · A split of 0.05 among 3 recipients gives the leftover cents to the first recipients in order

> Given a Ledger where 'alice' has 1  
> When 0.05 is split from 'alice' to ['b', 'c', 'd']  
> Then b gets 0.02, c gets 0.02, d gets 0.01 and alice has 0.95

| | |
|---|---|
| **A. What the code does** | b gets 0.02, c gets 0.02, d gets 0.01 and alice has 0.95 |
| **B. The alternative** | the leftover goes to the last recipients: b 0.01, c 0.02, d 0.02 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-037 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-037 --decision reject --expected "<what should happen>" --by <you>`

#### B-038 · A split of 100 among 3 gives 33.34, 33.33, 33.33 and debits exactly 100

> Given a Ledger where 'alice' has 100  
> When 100 is split from 'alice' to ['b', 'c', 'd'] with txnId 's1'  
> Then the result is { ok: true }; b has 33.34, c 33.33, d 33.33, alice 0; alice's entry is split-out 100 and b's is split-in 33.34

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }; b has 33.34, c 33.33, d 33.33, alice 0; alice's entry is split-out 100 and b's is split-in 33.34 |
| **B. The alternative** | each recipient gets 33.33 and 0.01 stays with alice |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-038 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-038 --decision reject --expected "<what should happen>" --by <you>`

#### B-041 · A split with no recipients is rejected even when its txnId was already used

> Given a Ledger where 100 was deposited to 'alice' with txnId 't1'  
> When 10 is split from 'alice' to [] with txnId 't1'  
> Then the result is { ok: false, reason: 'no-recipients' }

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'no-recipients' } |
| **B. The alternative** | the result is { ok: true } because t1 was already processed |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-041 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-041 --decision reject --expected "<what should happen>" --by <you>`

#### B-042 · Repeating a split with the same txnId has no further effect

> Given a Ledger where 'alice' had 100 and already split 10 to ['b', 'c'] with txnId 's1'  
> When the same split is made again with txnId 's1'  
> Then the result is { ok: true }, alice stays at 90 and b at 5

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, alice stays at 90 and b at 5 |
| **B. The alternative** | the split is applied again: alice has 80 and b has 10 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-042 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-042 --decision reject --expected "<what should happen>" --by <you>`

#### B-043 · A split larger than the balance is rejected

> Given a Ledger where 'alice' has 10  
> When 10.01 is split from 'alice' to ['b', 'c']  
> Then the result is { ok: false, reason: 'insufficient-funds' }, alice keeps 10 and b has 0

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' }, alice keeps 10 and b has 0 |
| **B. The alternative** | the split goes through and alice has -0.01 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-043 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-043 --decision reject --expected "<what should happen>" --by <you>`

#### B-044 · A full year of 5% interest on 1000 credits 50 (simple interest)

> Given a Ledger where 'alice' has 1000  
> When applyInterest('alice', 5, 365, 'i1')  
> Then the result is { ok: true }, the balance is 1050 and an 'interest' entry of 50 is recorded

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, the balance is 1050 and an 'interest' entry of 50 is recorded |
| **B. The alternative** | interest compounds daily and the balance is 1051.27 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-044 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-044 --decision reject --expected "<what should happen>" --by <you>`

#### B-045 · Interest uses a 365-day year

> Given a Ledger where 'alice' has 365  
> When applyInterest('alice', 100, 1, 'i1') (100% for 1 day)  
> Then the interest is exactly 1.00 and the balance is 366

| | |
|---|---|
| **A. What the code does** | the interest is exactly 1.00 and the balance is 366 |
| **B. The alternative** | a 360-day year is used, interest is 1.01 and the balance is 366.01 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-045 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-045 --decision reject --expected "<what should happen>" --by <you>`

#### B-046 · Interest is rounded down to the cent

> Given a Ledger where 'alice' has 1000  
> When applyInterest('alice', 5, 30, 'i1') (exact interest 4.1095...)  
> Then the interest is 4.10 and the balance is 1004.1

| | |
|---|---|
| **A. What the code does** | the interest is 4.10 and the balance is 1004.1 |
| **B. The alternative** | interest is rounded to the nearest cent giving 4.11 and a balance of 1004.11 |

**The plan may require the opposite:** “Balances are kept in whole cents.” (P-010); “An amount with more than two decimals is rounded to the nearest cent, with halves rounded away from zero.” (P-011)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-046 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-046 --decision reject --expected "<what should happen>" --by <you>`

#### B-047 · Interest that rounds to 0 reports success, records nothing and does not use up the txnId

> Given a Ledger where 'alice' has 1  
> When applyInterest('alice', 1, 1, 'i1') (worth 0.0000274), then 5 is deposited with txnId 'i1'  
> Then the interest call returns { ok: true } with no interest entry, and the later deposit is applied so the balance is 6

| | |
|---|---|
| **A. What the code does** | the interest call returns { ok: true } with no interest entry, and the later deposit is applied so the balance is 6 |
| **B. The alternative** | the txnId 'i1' is consumed by the interest call, so the later deposit is ignored and the balance stays 1 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-047 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-047 --decision reject --expected "<what should happen>" --by <you>`

## Dropped requirements

#### P-007

> A transfer to the same account is rejected.

Plan line 13. Probe `PR-P-007` fails against the code: AssertionError: expected true to be false // Object.is equality

_The trace had marked this realised (by B-004, B-017); the probe overrules it._

#### P-013

> The fee is recorded in the account history as its own entry, separate from the withdrawal.

Plan line 22. Probe `PR-P-013` fails against the code: AssertionError: expected [ { txnId: 'w1', …(2) } ] to have a length of 2 but got 1

#### P-014

> Customers can deposit an amount in a foreign currency together with an exchange rate; the amount is converted at that rate and rounded to the nearest cent, with halves rounded to even.

Plan line 23. Probe `PR-P-014` fails against the code: AssertionError: expected 0.13 to be 0.12 // Object.is equality

Contradicting behaviour(s): B-007, B-017.

## Extractor misses

The code does realise these statements, but blind extraction did not describe the behaviour. This is a measure of extraction recall, not a defect in the code.

- P-004: Customers can withdraw funds from an account.
- P-010: Balances are kept in whole cents.
- P-011: An amount with more than two decimals is rounded to the nearest cent, with halves rounded away from zero.
- P-012: Each withdrawal is charged a fee of 1% of the amount, with a minimum fee of 0.50.
