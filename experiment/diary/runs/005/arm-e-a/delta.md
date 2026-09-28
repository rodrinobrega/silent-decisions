# Delta: plan.md

Run `20260928T063223-74cfc3` · plan sha256 `f1655dc091e1`

**20 silent decision(s), 3 dropped requirement(s).**

## Run health

| Check | Result |
|---|---|
| Scenarios | 34 extracted · 34 verified · 0 vacuous · 0 refuted |
| Census (declared) | 35 decision points · 35 covered · 0 waived · 0 uncovered |
| Trace mode | pairwise-classifier · 1751 calls · threshold 0.7 |
| Trace | 14 stated · 0 entailed · 20 unsourced · 1 downgraded by rules |
| Reverse probes | 14 run · 3 dropped · 1 realised but missed by the extractor |
| Leave-one-out | passed (3 statement(s) hidden: 10 flipped, 0 re-sourced, 0 cited hidden text) |
| Leak check | clean · transcript: 5 tool call(s), 0 outside the room, 0 plan mention(s), 1 denied |

## Silent decisions

### unclustered

#### B-001 · An account never used reads as balance 0 with no entries

> Given a new Ledger where account 'ghost' was never opened or used  
> When balance('ghost') and entries('ghost') are read  
> Then the balance is 0 and the entries list is empty

| | |
|---|---|
| **A. What the code does** | the balance is 0 and the entries list is empty |
| **B. The alternative** | the balance of an unknown account is reported as undefined |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-001 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-001 --decision reject --expected "<what should happen>" --by <you>`

#### B-002 · Opening an existing account again keeps its balance

> Given account 'a' holds 100 after deposit 'd1'  
> When open('a') is called again  
> Then the balance stays 100 and the deposit entry remains

| | |
|---|---|
| **A. What the code does** | the balance stays 100 and the deposit entry remains |
| **B. The alternative** | re-opening resets the account to balance 0 |

Notes: P-017 is typed out-of-scope; only behavioural statements can source; stated without a verifiable quote

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-002 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-002 --decision reject --expected "<what should happen>" --by <you>`

#### B-007 · Foreign deposit with rate 0 or amount 0 is rejected as invalid-amount

> Given an empty ledger  
> When depositForeign('a', 100, 0, 'f1') and depositForeign('a', 0, 2, 'f2') are made  
> Then both return { ok: false, reason: 'invalid-amount' } and 'a' stays at 0

| | |
|---|---|
| **A. What the code does** | both return { ok: false, reason: 'invalid-amount' } and 'a' stays at 0 |
| **B. The alternative** | a rate of 0 is rejected as 'amount-too-small' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-007 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-007 --decision reject --expected "<what should happen>" --by <you>`

#### B-008 · Foreign deposit worth less than half a cent is rejected as amount-too-small; half a cent becomes 0.01

> Given an empty ledger  
> When depositForeign('a', 0.001, 1, 'f1') then depositForeign('b', 0.005, 1, 'f2') are made  
> Then the first returns { ok: false, reason: 'amount-too-small' } with 'a' at 0; the second returns { ok: true } with 'b' at 0.01

| | |
|---|---|
| **A. What the code does** | the first returns { ok: false, reason: 'amount-too-small' } with 'a' at 0; the second returns { ok: true } with 'b' at 0.01 |
| **B. The alternative** | the first is accepted with ok: true and credits nothing |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-008 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-008 --decision reject --expected "<what should happen>" --by <you>`

#### B-009 · Foreign deposit with an already used txnId is acknowledged without crediting

> Given account 'a' received deposit('a', 100, 'x1')  
> When depositForeign('a', 50, 2, 'x1') is made with the same txnId  
> Then it returns { ok: true } and 'a' stays at 100

| | |
|---|---|
| **A. What the code does** | it returns { ok: true } and 'a' stays at 100 |
| **B. The alternative** | the foreign deposit is credited and 'a' holds 200 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-009 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-009 --decision reject --expected "<what should happen>" --by <you>`

#### B-014 · Withdrawal fee is capped at 25

> Given account 'a' holds 5000  
> When withdraw('a', 3000, 'w1') is made (1% would be 30)  
> Then the fee is 25 and 'a' holds 1975

| | |
|---|---|
| **A. What the code does** | the fee is 25 and 'a' holds 1975 |
| **B. The alternative** | the fee is uncapped at 30 and 'a' holds 1970 |

**The plan may require the opposite:** “Each withdrawal is charged a fee of 1% of the amount, with a minimum fee of 0.50.” (P-012)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-014 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-014 --decision reject --expected "<what should happen>" --by <you>`

#### B-015 · Withdrawal fee rounds a part-cent up to the next cent

> Given account 'a' holds 100  
> When withdraw('a', 50.01, 'w1') is made (1% is 0.5001)  
> Then the fee is 0.51 and 'a' holds 49.48

| | |
|---|---|
| **A. What the code does** | the fee is 0.51 and 'a' holds 49.48 |
| **B. The alternative** | the fee is rounded to 0.50 and 'a' holds 49.49 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-015 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-015 --decision reject --expected "<what should happen>" --by <you>`

#### B-016 · Withdrawal must be covered including its fee

> Given accounts 'a' and 'b' each hold 100  
> When withdraw('a', 99.5, 'w1') (fee 1.00, total 100.50) and withdraw('b', 99, 'w2') (fee 0.99, total 99.99) are made  
> Then the first returns { ok: false, reason: 'insufficient-funds' } and 'a' stays 100; the second succeeds and 'b' holds 0.01

| | |
|---|---|
| **A. What the code does** | the first returns { ok: false, reason: 'insufficient-funds' } and 'a' stays 100; the second succeeds and 'b' holds 0.01 |
| **B. The alternative** | the first is accepted because 99.5 alone fits within the balance |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-016 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-016 --decision reject --expected "<what should happen>" --by <you>`

#### B-017 · A withdrawal that takes the balance exactly to 0 is allowed

> Given account 'a' holds 100.50  
> When withdraw('a', 99.5, 'w1') is made (fee 1.00, total 100.50)  
> Then it returns { ok: true } and 'a' holds 0

| | |
|---|---|
| **A. What the code does** | it returns { ok: true } and 'a' holds 0 |
| **B. The alternative** | it is refused as insufficient-funds because the balance must stay above 0 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-017 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-017 --decision reject --expected "<what should happen>" --by <you>`

#### B-018 · Withdrawals total at most 5000 per account; the fee does not count toward it

> Given account 'a' holds 20000  
> When withdraw('a', 5000, 'w1') then withdraw('a', 0.01, 'w2') are made  
> Then the first succeeds leaving 14975 (fee 25); the second returns { ok: false, reason: 'daily-limit' } and 'a' stays at 14975

| | |
|---|---|
| **A. What the code does** | the first succeeds leaving 14975 (fee 25); the second returns { ok: false, reason: 'daily-limit' } and 'a' stays at 14975 |
| **B. The alternative** | the second is accepted because there is still room under the limit |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-018 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-018 --decision reject --expected "<what should happen>" --by <you>`

#### B-019 · A single withdrawal of 5000.01 is refused as daily-limit

> Given account 'a' holds 20000 and has not withdrawn anything  
> When withdraw('a', 5000.01, 'w1') is made  
> Then it returns { ok: false, reason: 'daily-limit' } and 'a' stays at 20000

| | |
|---|---|
| **A. What the code does** | it returns { ok: false, reason: 'daily-limit' } and 'a' stays at 20000 |
| **B. The alternative** | it is accepted, leaving 14974.99 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-019 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-019 --decision reject --expected "<what should happen>" --by <you>`

#### B-020 · Insufficient funds is reported before the daily limit

> Given account 'a' holds 100  
> When withdraw('a', 6000, 'w1') is made (over both the balance and the 5000 limit)  
> Then it returns { ok: false, reason: 'insufficient-funds' }

| | |
|---|---|
| **A. What the code does** | it returns { ok: false, reason: 'insufficient-funds' } |
| **B. The alternative** | it returns { ok: false, reason: 'daily-limit' } |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-020 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-020 --decision reject --expected "<what should happen>" --by <you>`

#### B-021 · A refused withdrawal does not use up the daily limit

> Given account 'a' holds 20000  
> When withdraw('a', 5000.01, 'w1') is refused, then withdraw('a', 5000, 'w2') is made  
> Then the second succeeds and 'a' holds 14975

| | |
|---|---|
| **A. What the code does** | the second succeeds and 'a' holds 14975 |
| **B. The alternative** | the refused attempt counted toward the limit, so the second is refused as daily-limit |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-021 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-021 --decision reject --expected "<what should happen>" --by <you>`

#### B-025 · Split of 0 is rejected as invalid-amount, even with no recipients

> Given account 'a' holds 100  
> When split('a', [], 0, 's1') is made  
> Then it returns { ok: false, reason: 'invalid-amount' }

| | |
|---|---|
| **A. What the code does** | it returns { ok: false, reason: 'invalid-amount' } |
| **B. The alternative** | it returns { ok: false, reason: 'no-recipients' } |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-025 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-025 --decision reject --expected "<what should happen>" --by <you>`

#### B-026 · Split with no recipients is rejected, even when its txnId was already used

> Given account 'a' holds 100 from a deposit with txnId 'x1'  
> When split('a', [], 10, 'x1') is made  
> Then it returns { ok: false, reason: 'no-recipients' } and 'a' stays 100

| | |
|---|---|
| **A. What the code does** | it returns { ok: false, reason: 'no-recipients' } and 'a' stays 100 |
| **B. The alternative** | it returns { ok: true } as an already-seen transaction |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-026 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-026 --decision reject --expected "<what should happen>" --by <you>`

#### B-028 · Split larger than the payer's balance is refused

> Given account 'a' holds 10  
> When split('a', ['b','c'], 10.01, 's1') is made  
> Then it returns { ok: false, reason: 'insufficient-funds' }; 'a' stays 10 and 'b' stays 0

| | |
|---|---|
| **A. What the code does** | it returns { ok: false, reason: 'insufficient-funds' }; 'a' stays 10 and 'b' stays 0 |
| **B. The alternative** | it is accepted and 'a' goes to -0.01 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-028 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-028 --decision reject --expected "<what should happen>" --by <you>`

#### B-029 · Split hands leftover cents one each to the first-listed recipients

> Given account 'a' holds exactly 10  
> When split('a', ['b','c','d'], 10, 's1') is made  
> Then 'a' holds 0 with a 'split-out' entry of 10; 'b' gets 3.34, 'c' 3.33 and 'd' 3.33, each as a 'split-in' entry

| | |
|---|---|
| **A. What the code does** | 'a' holds 0 with a 'split-out' entry of 10; 'b' gets 3.34, 'c' 3.33 and 'd' 3.33, each as a 'split-in' entry |
| **B. The alternative** | the leftover cent goes to the last recipient: 'b' 3.33, 'c' 3.33, 'd' 3.34 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-029 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-029 --decision reject --expected "<what should happen>" --by <you>`

#### B-030 · Interest uses a 365-day year: 10% for 365 days on 1000 gives 100

> Given account 'a' holds 1000  
> When applyInterest('a', 10, 365, 'i1') is made  
> Then it returns { ok: true } and 'a' holds 1100 with an 'interest' entry of 100

| | |
|---|---|
| **A. What the code does** | it returns { ok: true } and 'a' holds 1100 with an 'interest' entry of 100 |
| **B. The alternative** | a 360-day year is used, giving 101.38 and a balance of 1101.38 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-030 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-030 --decision reject --expected "<what should happen>" --by <you>`

#### B-031 · Interest is rounded down to the cent

> Given account 'a' holds 1000  
> When applyInterest('a', 5, 30, 'i1') is made (exact interest 4.1095...)  
> Then 'a' is credited 4.10 and holds 1004.1

| | |
|---|---|
| **A. What the code does** | 'a' is credited 4.10 and holds 1004.1 |
| **B. The alternative** | interest is rounded to the nearest cent, 4.11, and 'a' holds 1004.11 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-031 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-031 --decision reject --expected "<what should happen>" --by <you>`

#### B-034 · Interest that comes to 0 returns ok, records nothing, and leaves the txnId reusable

> Given account 'a' has balance 0  
> When applyInterest('a', 10, 365, 'i1') is made, then 1000 is deposited as 'd1' and applyInterest('a', 10, 365, 'i1') is made again  
> Then the first returns { ok: true } with no entry; the second, with the same txnId, credits 100 so 'a' holds 1100

| | |
|---|---|
| **A. What the code does** | the first returns { ok: true } with no entry; the second, with the same txnId, credits 100 so 'a' holds 1100 |
| **B. The alternative** | the first call uses up txnId 'i1', so the second is ignored and 'a' holds 1000 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-034 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-034 --decision reject --expected "<what should happen>" --by <you>`

## Dropped requirements

#### P-007

> A transfer to the same account is rejected.

Plan line 13. Probe `PR-P-007` fails against the code: AssertionError: expected true to be false // Object.is equality

_The trace had marked this realised (by B-009, B-022); the probe overrules it._

#### P-013

> The fee is recorded in the account history as its own entry, separate from the withdrawal.

Plan line 22. Probe `PR-P-013` fails against the code: AssertionError: expected 2 to be 3 // Object.is equality

#### P-014

> Customers can deposit an amount in a foreign currency together with an exchange rate; the amount is converted at that rate and rounded to the nearest cent, with halves rounded to even.

Plan line 23. Probe `PR-P-014` fails against the code: AssertionError: expected 0.13 to be 0.12 // Object.is equality

_The trace had marked this realised (by B-005, B-006); the probe overrules it._

## Extractor misses

The code does realise these statements, but blind extraction did not describe the behaviour. This is a measure of extraction recall, not a defect in the code.

- P-012: Each withdrawal is charged a fee of 1% of the amount, with a minimum fee of 0.50.
