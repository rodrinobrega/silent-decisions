# Delta: plan.md

Run `20260927T123101-751c21` · plan sha256 `b8c7a2b74776`

**20 silent decision(s), 0 dropped requirement(s).**

## Run health

| Check | Result |
|---|---|
| Scenarios | 33 extracted · 33 verified · 0 vacuous · 0 refuted |
| Census (declared) | 15 decision points · 15 covered · 0 waived · 0 uncovered |
| Trace mode | pairwise-classifier · 1000 calls · threshold 0.7 |
| Trace | 13 stated · 0 entailed · 20 unsourced · 0 downgraded by rules |
| Leave-one-out | passed (3 statement(s) hidden: 8 flipped, 0 re-sourced, 0 cited hidden text) |
| Leak check | clean · no audit log (hook not installed) |

## Silent decisions

### unclustered

#### B-007 · Amounts are rounded to cents, half away from zero

> Given a new Ledger  
> When 0.125 is deposited to 'A'  
> Then balance is 0.13 and the entry amount is 0.13

| | |
|---|---|
| **A. What the code does** | balance is 0.13 and the entry amount is 0.13 |
| **B. The alternative** | the amount is rounded half-to-even to 0.12 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-007 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-007 --decision reject --expected "<what should happen>" --by <you>`

#### B-008 · Amount below half a cent rounds to 0 but is still accepted

> Given a new Ledger  
> When 0.001 is deposited to 'A' with txnId 't1'  
> Then result is ok, balance is 0 and a deposit entry with amount 0 is recorded

| | |
|---|---|
| **A. What the code does** | result is ok, balance is 0 and a deposit entry with amount 0 is recorded |
| **B. The alternative** | the deposit is rejected as invalid-amount |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-008 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-008 --decision reject --expected "<what should happen>" --by <you>`

#### B-009 · Balance sums are not re-rounded to cents

> Given a new Ledger  
> When 0.1 and then 0.2 are deposited to 'A'  
> Then balance is 0.30000000000000004

| | |
|---|---|
| **A. What the code does** | balance is 0.30000000000000004 |
| **B. The alternative** | balance is exactly 0.3 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-009 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-009 --decision reject --expected "<what should happen>" --by <you>`

#### B-010 · Unknown account has balance 0 and no entries

> Given a new Ledger  
> When balance and entries of 'X' are read  
> Then balance is 0 and entries is []

| | |
|---|---|
| **A. What the code does** | balance is 0 and entries is [] |
| **B. The alternative** | the balance of an unknown account is undefined |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-010 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-010 --decision reject --expected "<what should happen>" --by <you>`

#### B-012 · Entries returns a copy

> Given 'A' has one deposit  
> When the array returned by entries is pushed to  
> Then a later entries call still has 1 entry

| | |
|---|---|
| **A. What the code does** | a later entries call still has 1 entry |
| **B. The alternative** | the ledger's own history is changed and has 2 entries |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-012 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-012 --decision reject --expected "<what should happen>" --by <you>`

#### B-014 · Withdrawing more than the balance is rejected

> Given 'A' has balance 100  
> When 150 is withdrawn  
> Then result is insufficient-funds and balance stays 100

| | |
|---|---|
| **A. What the code does** | result is insufficient-funds and balance stays 100 |
| **B. The alternative** | the withdrawal is accepted and the balance becomes -50 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-014 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-014 --decision reject --expected "<what should happen>" --by <you>`

#### B-015 · Withdrawal amount is rounded before the funds check

> Given 'A' has balance 100  
> When 100.001 is withdrawn  
> Then result ok and balance 0, because 100.001 is rounded to 100 first

| | |
|---|---|
| **A. What the code does** | result ok and balance 0, because 100.001 is rounded to 100 first |
| **B. The alternative** | the withdrawal is rejected as insufficient-funds |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-015 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-015 --decision reject --expected "<what should happen>" --by <you>`

#### B-018 · TxnIds are shared across deposits and withdrawals

> Given 'A' has had 100 deposited with txnId 't1'  
> When 50 is withdrawn with txnId 't1'  
> Then result ok but balance stays 100

| | |
|---|---|
| **A. What the code does** | result ok but balance stays 100 |
| **B. The alternative** | the withdrawal executes and the balance becomes 50 |

**The plan may require the opposite:** “Build an in-memory ledger for customer accounts.” (P-001); “Customers can withdraw funds from an account.” (P-004)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-018 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-018 --decision reject --expected "<what should happen>" --by <you>`

#### B-019 · A rejected withdrawal does not use up its txnId

> Given 'A' has 100; a withdrawal of 150 with 'w1' was rejected; then 100 more was deposited  
> When 150 is withdrawn again with 'w1'  
> Then result ok and balance becomes 50

| | |
|---|---|
| **A. What the code does** | result ok and balance becomes 50 |
| **B. The alternative** | the retry is treated as a duplicate and the balance stays 200 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-019 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-019 --decision reject --expected "<what should happen>" --by <you>`

#### B-020 · Withdrawing exactly the daily limit of 5000 is allowed

> Given 'A' has balance 10000  
> When 5000 is withdrawn  
> Then result ok and balance 5000

| | |
|---|---|
| **A. What the code does** | result ok and balance 5000 |
| **B. The alternative** | the withdrawal is rejected as daily-limit |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-020 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-020 --decision reject --expected "<what should happen>" --by <you>`

#### B-021 · Withdrawing 5000.01 at once exceeds the daily limit

> Given 'A' has balance 10000  
> When 5000.01 is withdrawn  
> Then result is daily-limit and balance stays 10000

| | |
|---|---|
| **A. What the code does** | result is daily-limit and balance stays 10000 |
| **B. The alternative** | the withdrawal is accepted with ok true |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-021 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-021 --decision reject --expected "<what should happen>" --by <you>`

#### B-022 · Daily limit adds up across withdrawals

> Given 'A' has 10000 and has withdrawn 3000 then 2000  
> When 0.01 is withdrawn  
> Then result is daily-limit and balance stays 5000

| | |
|---|---|
| **A. What the code does** | result is daily-limit and balance stays 5000 |
| **B. The alternative** | the withdrawal is accepted with ok true |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-022 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-022 --decision reject --expected "<what should happen>" --by <you>`

#### B-023 · Daily limit is tracked per account

> Given 'A' and 'B' each have 6000, and 'A' has withdrawn 5000  
> When 'B' withdraws 5000  
> Then result ok and 'B' balance is 1000

| | |
|---|---|
| **A. What the code does** | result ok and 'B' balance is 1000 |
| **B. The alternative** | the withdrawal is rejected as daily-limit because the limit is shared |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-023 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-023 --decision reject --expected "<what should happen>" --by <you>`

#### B-024 · Insufficient funds is checked before the daily limit

> Given 'A' has balance 100  
> When 6000 is withdrawn  
> Then reason is insufficient-funds

| | |
|---|---|
| **A. What the code does** | reason is insufficient-funds |
| **B. The alternative** | reason is daily-limit |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-024 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-024 --decision reject --expected "<what should happen>" --by <you>`

#### B-025 · A withdrawal rejected for daily-limit does not use up allowance

> Given 'A' has 10000 and a 6000 withdrawal was rejected as daily-limit  
> When 5000 is withdrawn  
> Then result ok and balance 5000

| | |
|---|---|
| **A. What the code does** | result ok and balance 5000 |
| **B. The alternative** | the withdrawal is rejected as daily-limit because the 6000 was counted |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-025 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-025 --decision reject --expected "<what should happen>" --by <you>`

#### B-026 · Transfers do not count toward the daily withdrawal limit

> Given 'A' has 10000 and has transferred 5000 to 'B'  
> When 'A' withdraws 5000  
> Then result ok and 'A' balance is 0

| | |
|---|---|
| **A. What the code does** | result ok and 'A' balance is 0 |
| **B. The alternative** | the withdrawal is rejected as daily-limit |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-026 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-026 --decision reject --expected "<what should happen>" --by <you>`

#### B-027 · Withdrawal from an unknown account is insufficient-funds

> Given a new Ledger  
> When 10 is withdrawn from 'X'  
> Then result is insufficient-funds and balance of 'X' is 0

| | |
|---|---|
| **A. What the code does** | result is insufficient-funds and balance of 'X' is 0 |
| **B. The alternative** | the withdrawal is accepted and the balance becomes -10 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-027 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-027 --decision reject --expected "<what should happen>" --by <you>`

#### B-029 · Transferring the full balance is allowed

> Given 'A' has 100  
> When 100 is transferred to 'B'  
> Then ok; A is 0 and B is 100

| | |
|---|---|
| **A. What the code does** | ok; A is 0 and B is 100 |
| **B. The alternative** | the transfer is rejected as insufficient-funds |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-029 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-029 --decision reject --expected "<what should happen>" --by <you>`

#### B-030 · Transfer of more than the balance is rejected

> Given 'A' has 100  
> When 100.01 is transferred to 'B'  
> Then result is insufficient-funds; A stays 100 and B stays 0

| | |
|---|---|
| **A. What the code does** | result is insufficient-funds; A stays 100 and B stays 0 |
| **B. The alternative** | the transfer is accepted with ok true |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-030 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-030 --decision reject --expected "<what should happen>" --by <you>`

#### B-033 · Transfer to the same account leaves the balance unchanged but records two entries

> Given 'A' has 100  
> When 50 is transferred from 'A' to 'A'  
> Then ok; balance stays 100; entries are deposit, transfer-out, transfer-in

| | |
|---|---|
| **A. What the code does** | ok; balance stays 100; entries are deposit, transfer-out, transfer-in |
| **B. The alternative** | the balance ends at 50 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-033 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-033 --decision reject --expected "<what should happen>" --by <you>`

## Dropped requirements

None confirmed.
