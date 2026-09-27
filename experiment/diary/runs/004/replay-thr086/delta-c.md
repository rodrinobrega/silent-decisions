# Delta: plan.md

Run `20260927T135933-2beea3` · plan sha256 `b8c7a2b74776`

**33 silent decision(s), 1 dropped requirement(s).**

## Run health

| Check | Result |
|---|---|
| Scenarios | 45 extracted · 45 verified · 0 vacuous · 0 refuted |
| Census (declared) | 15 decision points · 15 covered · 0 waived · 0 uncovered |
| Trace mode | pairwise-classifier · 1360 calls · threshold 0.7 |
| Trace | 12 stated · 0 entailed · 33 unsourced · 1 downgraded by rules |
| Reverse probes | 7 run · 1 dropped · 3 realised but missed by the extractor |
| Leave-one-out | passed (2 statement(s) hidden: 12 flipped, 0 re-sourced, 0 cited hidden text) |
| Leak check | clean · transcript: 10 tool call(s), 0 outside the room, 0 plan mention(s), 2 denied |

## Silent decisions

### unclustered

#### B-001 · Balance of an account never opened or used is 0

> Given a new Ledger with no accounts  
> When balance('ghost') is read  
> Then it returns 0 without error

| | |
|---|---|
| **A. What the code does** | it returns 0 without error |
| **B. The alternative** | reading the balance of an unknown account throws an error |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-001 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-001 --decision reject --expected "<what should happen>" --by <you>`

#### B-002 · Entries of an unknown account is an empty list

> Given a new Ledger  
> When entries('ghost') is read  
> Then it returns an empty list []

| | |
|---|---|
| **A. What the code does** | it returns an empty list [] |
| **B. The alternative** | it returns undefined |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-002 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-002 --decision reject --expected "<what should happen>" --by <you>`

#### B-003 · Opening an account starts it at balance 0 with no entries

> Given a new Ledger  
> When open('A') is called  
> Then balance('A') is 0 and entries('A') is []

| | |
|---|---|
| **A. What the code does** | balance('A') is 0 and entries('A') is [] |
| **B. The alternative** | the account starts with a non-zero opening balance of 100 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-003 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-003 --decision reject --expected "<what should happen>" --by <you>`

#### B-004 · Re-opening an existing account does not reset its balance or history

> Given account 'A' has received a deposit of 100 with txnId 't1'  
> When open('A') is called again  
> Then balance('A') stays 100 and entries('A') still holds the single deposit of 100

| | |
|---|---|
| **A. What the code does** | balance('A') stays 100 and entries('A') still holds the single deposit of 100 |
| **B. The alternative** | re-opening resets the balance to 0 and clears the history |

Notes: P-010 is typed structural; only behavioural statements can source; stated without a verifiable quote

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-004 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-004 --decision reject --expected "<what should happen>" --by <you>`

#### B-005 · Depositing into an unopened account opens it and credits it

> Given a new Ledger where 'A' was never opened  
> When deposit('A', 100, 't1') is called  
> Then the result is { ok: true }, balance('A') is 100 and entries('A') is [{ txnId: 't1', kind: 'deposit', amount: 100 }]

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, balance('A') is 100 and entries('A') is [{ txnId: 't1', kind: 'deposit', amount: 100 }] |
| **B. The alternative** | the deposit is rejected because the account does not exist and the balance stays 0 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-005 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-005 --decision reject --expected "<what should happen>" --by <you>`

#### B-009 · Smallest positive deposit of 0.01 is accepted

> Given a new Ledger  
> When deposit('A', 0.01, 't1') is called  
> Then the result is { ok: true } and balance('A') is 0.01

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and balance('A') is 0.01 |
| **B. The alternative** | the deposit is rejected with 'invalid-amount' and the balance stays 0 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-009 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-009 --decision reject --expected "<what should happen>" --by <you>`

#### B-010 · Deposit amounts are rounded to cents; a half cent rounds up

> Given a new Ledger  
> When deposit('A', 0.125, 't1') is called  
> Then the result is { ok: true }, balance('A') is 0.13 and the entry amount is 0.13

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, balance('A') is 0.13 and the entry amount is 0.13 |
| **B. The alternative** | the half cent is rounded down (or to even) and the balance is 0.12 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-010 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-010 --decision reject --expected "<what should happen>" --by <you>`

#### B-011 · Deposit fractions below half a cent round down

> Given a new Ledger  
> When deposit('A', 10.004, 't1') is called  
> Then balance('A') is 10

| | |
|---|---|
| **A. What the code does** | balance('A') is 10 |
| **B. The alternative** | the fraction is always rounded up and the balance is 10.01 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-011 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-011 --decision reject --expected "<what should happen>" --by <you>`

#### B-012 · A positive deposit that rounds to 0 is accepted and recorded as 0

> Given a new Ledger  
> When deposit('A', 0.004, 't1') is called  
> Then the result is { ok: true }, balance('A') is 0 and an entry { txnId: 't1', kind: 'deposit', amount: 0 } is recorded

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, balance('A') is 0 and an entry { txnId: 't1', kind: 'deposit', amount: 0 } is recorded |
| **B. The alternative** | the deposit is rejected with 'invalid-amount' because it rounds to zero |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-012 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-012 --decision reject --expected "<what should happen>" --by <you>`

#### B-013 · Running balances are not re-rounded: 0.1 + 0.2 gives 0.30000000000000004

> Given a new Ledger  
> When deposit('A', 0.1, 't1') and deposit('A', 0.2, 't2') are made  
> Then balance('A') is 0.30000000000000004

| | |
|---|---|
| **A. What the code does** | balance('A') is 0.30000000000000004 |
| **B. The alternative** | balance('A') is exactly 0.3 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-013 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-013 --decision reject --expected "<what should happen>" --by <you>`

#### B-015 · A txnId already used on one account is silently ignored on another account

> Given deposit('A', 100, 't1') has succeeded  
> When deposit('B', 50, 't1') is called  
> Then the result is { ok: true } but balance('B') is 0 and 'B' has no entries

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } but balance('B') is 0 and 'B' has no entries |
| **B. The alternative** | txnIds are per account, so 'B' is credited and its balance becomes 50 |

**The plan may require the opposite:** “Customers can deposit funds into an account.” (P-003); “Every accepted operation is recorded in the account history.” (P-008)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-015 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-015 --decision reject --expected "<what should happen>" --by <you>`

#### B-017 · A deposit txnId blocks a later withdrawal with the same txnId

> Given deposit('A', 100, 't1') has succeeded  
> When withdraw('A', 40, 't1') is called  
> Then the result is { ok: true } but balance('A') stays 100 and only the deposit entry exists

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } but balance('A') stays 100 and only the deposit entry exists |
| **B. The alternative** | the withdrawal is applied and the balance becomes 60 |

**The plan may require the opposite:** “Build an in-memory ledger for customer accounts.” (P-001); “Customers can withdraw funds from an account.” (P-004); “Every accepted operation is recorded in the account history.” (P-008)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-017 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-017 --decision reject --expected "<what should happen>" --by <you>`

#### B-018 · Withdrawal debits the balance and records a withdrawal entry

> Given account 'A' has a balance of 100  
> When withdraw('A', 30, 'w1') is called  
> Then the result is { ok: true }, balance('A') is 70 and the new entry is { txnId: 'w1', kind: 'withdrawal', amount: 30 }

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, balance('A') is 70 and the new entry is { txnId: 'w1', kind: 'withdrawal', amount: 30 } |
| **B. The alternative** | the withdrawal is rejected and the balance stays 100 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-018 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-018 --decision reject --expected "<what should happen>" --by <you>`

#### B-019 · Withdrawing more than the balance is rejected as insufficient-funds

> Given account 'A' has a balance of 100  
> When withdraw('A', 150, 'w1') is called  
> Then the result is { ok: false, reason: 'insufficient-funds' } and balance('A') stays 100

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' } and balance('A') stays 100 |
| **B. The alternative** | the withdrawal is accepted and the balance becomes -50 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-019 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-019 --decision reject --expected "<what should happen>" --by <you>`

#### B-020 · Withdrawing exactly the whole balance is allowed

> Given account 'A' has a balance of 100  
> When withdraw('A', 100, 'w1') is called  
> Then the result is { ok: true } and balance('A') is 0

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and balance('A') is 0 |
| **B. The alternative** | the withdrawal is rejected as insufficient-funds and the balance stays 100 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-020 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-020 --decision reject --expected "<what should happen>" --by <you>`

#### B-021 · Withdrawing one cent more than the balance is rejected

> Given account 'A' has a balance of 100  
> When withdraw('A', 100.01, 'w1') is called  
> Then the result is { ok: false, reason: 'insufficient-funds' } and balance('A') stays 100

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' } and balance('A') stays 100 |
| **B. The alternative** | the withdrawal is accepted with { ok: true } |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-021 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-021 --decision reject --expected "<what should happen>" --by <you>`

#### B-022 · The funds check uses the withdrawal amount after rounding to cents

> Given account 'A' has a balance of 100  
> When withdraw('A', 100.004, 'w1') is called  
> Then the amount rounds to 100, the result is { ok: true } and balance('A') is 0

| | |
|---|---|
| **A. What the code does** | the amount rounds to 100, the result is { ok: true } and balance('A') is 0 |
| **B. The alternative** | the unrounded 100.004 exceeds the balance so it is rejected as insufficient-funds |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-022 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-022 --decision reject --expected "<what should happen>" --by <you>`

#### B-023 · Withdrawing from an unknown account is refused as insufficient-funds

> Given a new Ledger  
> When withdraw('ghost', 10, 'w1') is called  
> Then the result is { ok: false, reason: 'insufficient-funds' } and balance('ghost') is 0

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' } and balance('ghost') is 0 |
| **B. The alternative** | the result is { ok: false, reason: 'unknown-account' } |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-023 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-023 --decision reject --expected "<what should happen>" --by <you>`

#### B-028 · A rejected withdrawal does not use up its txnId

> Given account 'A' has 50 and withdraw('A', 80, 'w1') was rejected as insufficient-funds  
> When deposit('A', 50, 'd2') is made and withdraw('A', 80, 'w1') is retried  
> Then the retry returns { ok: true } and balance('A') becomes 20

| | |
|---|---|
| **A. What the code does** | the retry returns { ok: true } and balance('A') becomes 20 |
| **B. The alternative** | the retry is treated as a duplicate: it returns ok but the balance stays 100 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-028 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-028 --decision reject --expected "<what should happen>" --by <you>`

#### B-029 · Withdrawing exactly the daily limit of 5000 is allowed

> Given account 'A' has a balance of 10000 and no withdrawals yet  
> When withdraw('A', 5000, 'w1') is called  
> Then the result is { ok: true } and balance('A') is 5000

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and balance('A') is 5000 |
| **B. The alternative** | the withdrawal is rejected with 'daily-limit' because the limit must not be reached |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-029 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-029 --decision reject --expected "<what should happen>" --by <you>`

#### B-030 · A single withdrawal of 5000.01 breaches the daily limit

> Given account 'A' has a balance of 10000 and no withdrawals yet  
> When withdraw('A', 5000.01, 'w1') is called  
> Then the result is { ok: false, reason: 'daily-limit' } and balance('A') stays 10000

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'daily-limit' } and balance('A') stays 10000 |
| **B. The alternative** | the withdrawal is accepted with { ok: true } and the balance becomes 4999.99 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-030 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-030 --decision reject --expected "<what should happen>" --by <you>`

#### B-031 · The daily limit is cumulative across withdrawals

> Given account 'A' has 10000 and has already withdrawn 3000 (w1)  
> When withdraw('A', 2000.01, 'w2') is called  
> Then the result is { ok: false, reason: 'daily-limit' } and balance('A') stays 7000

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'daily-limit' } and balance('A') stays 7000 |
| **B. The alternative** | the limit applies per withdrawal, so it is accepted with { ok: true } |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-031 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-031 --decision reject --expected "<what should happen>" --by <you>`

#### B-032 · Cumulative withdrawals may reach exactly 5000

> Given account 'A' has 10000 and has already withdrawn 3000 (w1)  
> When withdraw('A', 2000, 'w2') is called  
> Then the result is { ok: true } and balance('A') is 5000

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and balance('A') is 5000 |
| **B. The alternative** | the withdrawal is rejected with 'daily-limit' and the balance stays 7000 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-032 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-032 --decision reject --expected "<what should happen>" --by <you>`

#### B-033 · The daily limit is tracked per account

> Given accounts 'A' and 'B' each have 10000 and 'A' has already withdrawn 5000  
> When withdraw('B', 5000, 'w2') is called  
> Then the result is { ok: true } and balance('B') is 5000

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and balance('B') is 5000 |
| **B. The alternative** | the limit is shared across the ledger and 'B' is rejected with 'daily-limit' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-033 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-033 --decision reject --expected "<what should happen>" --by <you>`

#### B-034 · A rejected withdrawal does not consume the daily limit

> Given account 'A' has 10000 and withdraw('A', 5000.01, 'w1') was rejected with 'daily-limit'  
> When withdraw('A', 5000, 'w2') is called  
> Then the result is { ok: true } and balance('A') is 5000

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and balance('A') is 5000 |
| **B. The alternative** | the rejected attempt counted toward the limit and this one is rejected with 'daily-limit' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-034 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-034 --decision reject --expected "<what should happen>" --by <you>`

#### B-035 · Insufficient funds is reported ahead of the daily limit

> Given account 'A' has a balance of 100  
> When withdraw('A', 6000, 'w1') is called  
> Then the result is { ok: false, reason: 'insufficient-funds' }

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' } |
| **B. The alternative** | the result is { ok: false, reason: 'daily-limit' } |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-035 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-035 --decision reject --expected "<what should happen>" --by <you>`

#### B-036 · Transfers are not subject to or counted in the daily withdrawal limit

> Given account 'A' has 20000  
> When transfer('A', 'B', 6000, 't1') is made and then withdraw('A', 5000, 'w1')  
> Then both return { ok: true }; balance('A') is 9000 and balance('B') is 6000

| | |
|---|---|
| **A. What the code does** | both return { ok: true }; balance('A') is 9000 and balance('B') is 6000 |
| **B. The alternative** | the transfer is rejected with 'daily-limit' because it exceeds 5000 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-036 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-036 --decision reject --expected "<what should happen>" --by <you>`

#### B-037 · Transfer moves money, opens the recipient and records transfer-out and transfer-in entries

> Given account 'A' has 100 and 'B' was never opened  
> When transfer('A', 'B', 30, 't1') is called  
> Then the result is { ok: true }; balance('A') is 70, balance('B') is 30; 'A' gets { txnId: 't1', kind: 'transfer-out', amount: 30 } and 'B' gets { txnId: 't1', kind: 'transfer-in', amount: 30 }

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }; balance('A') is 70, balance('B') is 30; 'A' gets { txnId: 't1', kind: 'transfer-out', amount: 30 } and 'B' gets { txnId: 't1', kind: 'transfer-in', amount: 30 } |
| **B. The alternative** | the transfer is rejected because 'B' does not exist and 'B' stays at 0 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-037 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-037 --decision reject --expected "<what should happen>" --by <you>`

#### B-038 · Transferring the whole balance is allowed

> Given account 'A' has 100  
> When transfer('A', 'B', 100, 't1') is called  
> Then the result is { ok: true }, balance('A') is 0 and balance('B') is 100

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, balance('A') is 0 and balance('B') is 100 |
| **B. The alternative** | the transfer is rejected as insufficient-funds and balances stay 100 and 0 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-038 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-038 --decision reject --expected "<what should happen>" --by <you>`

#### B-039 · Transferring one cent more than the balance is rejected

> Given account 'A' has 100 and 'B' has 0  
> When transfer('A', 'B', 100.01, 't1') is called  
> Then the result is { ok: false, reason: 'insufficient-funds' }; balances stay 100 and 0 and no entries are added

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' }; balances stay 100 and 0 and no entries are added |
| **B. The alternative** | the transfer is accepted with { ok: true } and 'A' goes to -0.01 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-039 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-039 --decision reject --expected "<what should happen>" --by <you>`

#### B-043 · Transfer amounts are rounded to cents; a half cent rounds up

> Given account 'A' has 100  
> When transfer('A', 'B', 0.125, 't1') is called  
> Then balance('B') is 0.13 and the transfer-in entry amount is 0.13

| | |
|---|---|
| **A. What the code does** | balance('B') is 0.13 and the transfer-in entry amount is 0.13 |
| **B. The alternative** | the half cent is rounded down and balance('B') is 0.12 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-043 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-043 --decision reject --expected "<what should happen>" --by <you>`

#### B-044 · Transfer to the same account leaves the balance unchanged but records two entries

> Given account 'A' has 100  
> When transfer('A', 'A', 40, 't1') is called  
> Then the result is { ok: true }, balance('A') stays 100 and 'A' gets both a transfer-out and a transfer-in entry after its deposit

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, balance('A') stays 100 and 'A' gets both a transfer-out and a transfer-in entry after its deposit |
| **B. The alternative** | a transfer to the same account is rejected |

**The plan may require the opposite:** “A transfer to the same account is rejected.” (P-007)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-044 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-044 --decision reject --expected "<what should happen>" --by <you>`

#### B-045 · entries returns a copy; changing it does not change the ledger history

> Given account 'A' has a single deposit of 100  
> When the caller empties the list returned by entries('A')  
> Then a fresh entries('A') still has 1 entry

| | |
|---|---|
| **A. What the code does** | a fresh entries('A') still has 1 entry |
| **B. The alternative** | the ledger history is emptied and entries('A') returns 0 entries |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-045 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-045 --decision reject --expected "<what should happen>" --by <you>`

## Dropped requirements

#### P-007

> A transfer to the same account is rejected.

Plan line 13. Probe `PR-P-007` fails against the code: AssertionError: expected true to be false // Object.is equality

Contradicting behaviour(s): B-044.

## Extractor misses

The code does realise these statements, but blind extraction did not describe the behaviour. This is a measure of extraction recall, not a defect in the code.

- P-003: Customers can deposit funds into an account.
- P-004: Customers can withdraw funds from an account.
- P-008: Every accepted operation is recorded in the account history.
