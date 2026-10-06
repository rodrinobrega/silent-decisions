# Delta: plan.md

Run `20261006T064356-1007b8` · plan sha256 `b8c7a2b74776`

**39 silent decision(s), 1 dropped requirement(s).**

## Run health

| Check | Result |
|---|---|
| Scenarios | 39 extracted · 39 verified · 0 vacuous · 0 refuted |
| Census (declared) | 15 decision points · 15 covered · 0 waived · 0 uncovered |
| Trace mode | llm-tracer |
| Trace | 0 stated · 0 entailed · 39 unsourced · 8 downgraded by rules |
| Reverse probes | 7 run · 1 dropped · 0 realised but missed by the extractor |
| Leave-one-out | not_applicable (0 statement(s) hidden: 0 flipped, 0 re-sourced, 0 cited hidden text) |
| Leak check | clean · transcript: 6 tool call(s), 0 outside the room, 0 plan mention(s), 1 denied |

## Silent decisions

### unknown-account handling

#### B-001 · Balance of an account never seen is 0

> Given a new Ledger with no accounts  
> When balance('ghost') is read  
> Then it returns 0

| | |
|---|---|
| **A. What the code does** | it returns 0 |
| **B. The alternative** | balance('ghost') throws an unknown-account error |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-001 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-001 --decision reject --expected "<what should happen>" --by <you>`

#### B-002 · Entries of an account never seen is an empty list

> Given a new Ledger with no accounts  
> When entries('ghost') is read  
> Then it returns an empty list []

| | |
|---|---|
| **A. What the code does** | it returns an empty list [] |
| **B. The alternative** | entries('ghost') throws an unknown-account error |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-002 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-002 --decision reject --expected "<what should happen>" --by <you>`

#### B-005 · Deposit into an unopened account opens it and credits it

> Given a new Ledger where account 'a' was never opened  
> When deposit('a', 100, 'd1') is called  
> Then it returns { ok: true }, balance('a') is 100 and entries('a') is [{ txnId: 'd1', kind: 'deposit', amount: 100 }]

| | |
|---|---|
| **A. What the code does** | it returns { ok: true }, balance('a') is 100 and entries('a') is [{ txnId: 'd1', kind: 'deposit', amount: 100 }] |
| **B. The alternative** | the deposit is rejected with 'unknown-account' and balance stays 0 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-005 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-005 --decision reject --expected "<what should happen>" --by <you>`

#### B-019 · Withdrawing from an account never opened is rejected as insufficient-funds

> Given a new Ledger  
> When withdraw('a', 1, 'w1') is called  
> Then it returns { ok: false, reason: 'insufficient-funds' } and balance('a') is 0

| | |
|---|---|
| **A. What the code does** | it returns { ok: false, reason: 'insufficient-funds' } and balance('a') is 0 |
| **B. The alternative** | rejected with reason 'unknown-account' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-019 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-019 --decision reject --expected "<what should happen>" --by <you>`

#### B-031 · Transfer moves money and records an entry on each side

> Given account 'a' holds 100  
> When transfer('a', 'b', 40, 't1') is called  
> Then it returns { ok: true }, balance('a') is 60, balance('b') is 40, 'a' gets { txnId: 't1', kind: 'transfer-out', amount: 40 } and 'b' gets { txnId: 't1', kind: 'transfer-in', amount: 40 }

| | |
|---|---|
| **A. What the code does** | it returns { ok: true }, balance('a') is 60, balance('b') is 40, 'a' gets { txnId: 't1', kind: 'transfer-out', amount: 40 } and 'b' gets { txnId: 't1', kind: 'transfer-in', amount: 40 } |
| **B. The alternative** | the transfer is rejected because 'b' was never opened, and balances stay 100 and 0 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-031 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-031 --decision reject --expected "<what should happen>" --by <you>`

### account opening

#### B-003 · Opening an existing account again keeps its balance and history

> Given account 'a' has received a deposit of 50 with txnId 'd1'  
> When open('a') is called again  
> Then balance('a') is still 50 and entries('a') still holds the one deposit entry

| | |
|---|---|
| **A. What the code does** | balance('a') is still 50 and entries('a') still holds the one deposit entry |
| **B. The alternative** | re-opening resets the account to balance 0 and empty history, or throws 'account exists' |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-003 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-003 --decision reject --expected "<what should happen>" --by <you>`

#### B-004 · Opening a new account gives balance 0 and an empty history

> Given a new Ledger  
> When open('a') is called  
> Then balance('a') is 0 and entries('a') is []

| | |
|---|---|
| **A. What the code does** | balance('a') is 0 and entries('a') is [] |
| **B. The alternative** | a new account starts with an 'opened' history entry or a non-zero balance |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-004 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-004 --decision reject --expected "<what should happen>" --by <you>`

### amount validation

#### B-006 · Deposit of 0 is rejected as invalid-amount

> Given a new Ledger  
> When deposit('a', 0, 'd1') is called  
> Then it returns { ok: false, reason: 'invalid-amount' } and balance('a') stays 0 with no entries

| | |
|---|---|
| **A. What the code does** | it returns { ok: false, reason: 'invalid-amount' } and balance('a') stays 0 with no entries |
| **B. The alternative** | deposit('a', 0, 'd1') returns { ok: false, reason: 'non-positive-amount' } and entries('a') holds one audit record of the rejected attempt (kind 'rejected', amount 0); balance('a') stays 0 |

Why the plan does not settle it: "otherwise the operation is rejected" rules out accepting 0, and this contrary does reject it. The quote names no reason code and says nothing about whether a rejected attempt leaves a trace in the history, so both 'invalid-amount' and 'no entries' are choices the plan did not make.

Nearest plan text: “An amount must be a positive number, otherwise the operation is rejected.” (P-005)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-006 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-006 --decision reject --expected "<what should happen>" --by <you>`

#### B-007 · Deposit of a negative amount is rejected as invalid-amount

> Given account 'a' holds 100 after deposit 'd1'  
> When deposit('a', -5, 'd2') is called  
> Then it returns { ok: false, reason: 'invalid-amount' } and balance('a') stays 100

| | |
|---|---|
| **A. What the code does** | it returns { ok: false, reason: 'invalid-amount' } and balance('a') stays 100 |
| **B. The alternative** | deposit('a', -5, 'd2') returns { ok: false, reason: 'negative-amount' } and balance('a') stays 100 |

Why the plan does not settle it: The words do rule out accepting -5 (as a deposit or as a disguised withdrawal), but "the operation is rejected" fixes only the outcome, not the reason a client receives. A different reason code satisfies P-005 just as well, so 'invalid-amount' is not decided.

Nearest plan text: “An amount must be a positive number, otherwise the operation is rejected.” (P-005)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-007 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-007 --decision reject --expected "<what should happen>" --by <you>`

#### B-008 · Deposit of NaN is rejected as invalid-amount

> Given a new Ledger  
> When deposit('a', NaN, 'd1') is called  
> Then it returns { ok: false, reason: 'invalid-amount' } and balance('a') is 0

| | |
|---|---|
| **A. What the code does** | it returns { ok: false, reason: 'invalid-amount' } and balance('a') is 0 |
| **B. The alternative** | deposit('a', NaN, 'd1') returns { ok: false, reason: 'not-a-number' } and balance('a') is 0 |

Why the plan does not settle it: NaN is not "a positive number", so P-005 requires rejection, and this contrary rejects it. The quote says nothing about the reason, so a separate 'not-a-number' code (a common way to tell malformed input apart from bad values) complies equally.

Nearest plan text: “An amount must be a positive number, otherwise the operation is rejected.” (P-005)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-008 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-008 --decision reject --expected "<what should happen>" --by <you>`

#### B-020 · Withdrawal of 0 or a negative amount is rejected as invalid-amount

> Given account 'a' holds 100  
> When withdraw('a', 0, 'w1') and withdraw('a', -20, 'w2') are called  
> Then both return { ok: false, reason: 'invalid-amount' } and balance('a') stays 100

| | |
|---|---|
| **A. What the code does** | both return { ok: false, reason: 'invalid-amount' } and balance('a') stays 100 |
| **B. The alternative** | withdraw('a', 0, 'w1') returns { ok: false, reason: 'zero-amount' } and withdraw('a', -20, 'w2') returns { ok: false, reason: 'negative-amount' }; balance('a') stays 100 |

Why the plan does not settle it: Both calls are rejected, which is all P-005 asks ("otherwise the operation is rejected"). The quote does not require one shared reason, or the reason 'invalid-amount', so distinct codes for zero and for negative amounts comply.

Nearest plan text: “An amount must be a positive number, otherwise the operation is rejected.” (P-005)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-020 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-020 --decision reject --expected "<what should happen>" --by <you>`

#### B-034 · Transfer of 0 or a negative amount is rejected as invalid-amount

> Given account 'a' holds 100  
> When transfer('a', 'b', 0, 't1') and transfer('a', 'b', -10, 't2') are called  
> Then both return { ok: false, reason: 'invalid-amount' } and balances stay 100 and 0

| | |
|---|---|
| **A. What the code does** | both return { ok: false, reason: 'invalid-amount' } and balances stay 100 and 0 |
| **B. The alternative** | transfer('a', 'b', 0, 't1') and transfer('a', 'b', -10, 't2') both return { ok: false, reason: 'amount-must-be-positive' }; balances stay 100 and 0 |

Why the plan does not settle it: P-005 rules out accepting the backwards -10 transfer, and this contrary does not accept it. The quote is silent on the reason string, so 'invalid-amount' is an unrequested choice.

Nearest plan text: “An amount must be a positive number, otherwise the operation is rejected.” (P-005)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-034 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-034 --decision reject --expected "<what should happen>" --by <you>`

### idempotency

#### B-009 · Repeating a deposit with the same txnId reports success but credits only once

> Given account 'a' received deposit('a', 100, 'd1')  
> When deposit('a', 100, 'd1') is called again  
> Then it returns { ok: true }, balance('a') stays 100 and entries('a') still has one entry

| | |
|---|---|
| **A. What the code does** | it returns { ok: true }, balance('a') stays 100 and entries('a') still has one entry |
| **B. The alternative** | the repeated deposit('a', 100, 'd1') returns { ok: false, reason: 'duplicate' }; balance('a') stays 100 with one entry |

Why the plan does not settle it: "so that retries are safe" is a purpose clause. At most it forbids double-crediting, and a 'duplicate' rejection does not double-credit. Nothing in the words requires the repeat to report { ok: true }, and the tracer concedes this in its own reasoning.

Nearest plan text: “Each operation carries a client-supplied transaction id so that retries are safe.” (P-009)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-009 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-009 --decision reject --expected "<what should happen>" --by <you>`

#### B-010 · A reused txnId on a different account or with a different amount is silently ignored

> Given account 'a' received deposit('a', 100, 'd1')  
> When deposit('b', 70, 'd1') is called  
> Then it returns { ok: true } but balance('b') is 0 and balance('a') stays 100

| | |
|---|---|
| **A. What the code does** | it returns { ok: true } but balance('b') is 0 and balance('a') stays 100 |
| **B. The alternative** | deposit('b', 70, 'd1') is applied (a different operation, not a retry) or rejected as 'duplicate' |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-010 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-010 --decision reject --expected "<what should happen>" --by <you>`

#### B-011 · Invalid amount is reported even when the txnId was already used

> Given account 'a' received deposit('a', 100, 'd1')  
> When deposit('a', 0, 'd1') is called  
> Then it returns { ok: false, reason: 'invalid-amount' } (amount checked before duplicate)

| | |
|---|---|
| **A. What the code does** | it returns { ok: false, reason: 'invalid-amount' } (amount checked before duplicate) |
| **B. The alternative** | returns ok:true because the txnId was already processed |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-011 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-011 --decision reject --expected "<what should happen>" --by <you>`

#### B-021 · Repeating a withdrawal with the same txnId reports success but debits once

> Given account 'a' holds 100 and withdraw('a', 30, 'w1') has succeeded  
> When withdraw('a', 30, 'w1') is called again  
> Then it returns { ok: true } and balance('a') stays 70

| | |
|---|---|
| **A. What the code does** | it returns { ok: true } and balance('a') stays 70 |
| **B. The alternative** | the repeated withdraw('a', 30, 'w1') returns { ok: false, reason: 'duplicate' } and balance('a') stays 70 |

Why the plan does not settle it: A retry rejected as a duplicate debits only once, so it is "safe" in the only sense the words fix. The quote does not say the repeat must report success, so the { ok: true } response is undecided.

Nearest plan text: “Each operation carries a client-supplied transaction id so that retries are safe.” (P-009)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-021 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-021 --decision reject --expected "<what should happen>" --by <you>`

#### B-022 · txnIds are shared across operation types: a withdrawal reusing a deposit's txnId is ignored

> Given account 'a' received deposit('a', 100, 't1')  
> When withdraw('a', 40, 't1') is called  
> Then it returns { ok: true } but balance('a') stays 100 and no withdrawal entry is added

| | |
|---|---|
| **A. What the code does** | it returns { ok: true } but balance('a') stays 100 and no withdrawal entry is added |
| **B. The alternative** | the withdrawal with id 't1' is applied as a different operation (balance 60) or rejected as 'duplicate' |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-022 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-022 --decision reject --expected "<what should happen>" --by <you>`

#### B-023 · A rejected withdrawal does not use up its txnId

> Given account 'a' holds 50 and withdraw('a', 80, 'w1') was rejected as insufficient-funds  
> When deposit('a', 50, 'd2') is made and withdraw('a', 80, 'w1') is retried  
> Then the retry returns { ok: true } and balance('a') is 20

| | |
|---|---|
| **A. What the code does** | the retry returns { ok: true } and balance('a') is 20 |
| **B. The alternative** | the retried id is treated as already used, so the retry is ignored or rejected |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-023 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-023 --decision reject --expected "<what should happen>" --by <you>`

#### B-035 · Repeating a transfer with the same txnId reports success but moves money once

> Given account 'a' holds 100 and transfer('a', 'b', 40, 't1') succeeded  
> When transfer('a', 'b', 40, 't1') is called again  
> Then it returns { ok: true }, balance('a') stays 60 and balance('b') stays 40

| | |
|---|---|
| **A. What the code does** | it returns { ok: true }, balance('a') stays 60 and balance('b') stays 40 |
| **B. The alternative** | the repeated transfer('a', 'b', 40, 't1') returns { ok: false, reason: 'duplicate' }; balance('a') stays 60 and balance('b') stays 40 |

Why the plan does not settle it: The money still moves once, so the retry is safe. "so that retries are safe" does not say whether the repeat succeeds or is refused, so the { ok: true } response is not decided by the quote.

Nearest plan text: “Each operation carries a client-supplied transaction id so that retries are safe.” (P-009)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-035 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-035 --decision reject --expected "<what should happen>" --by <you>`

### amount rounding

#### B-012 · Deposit amounts are rounded to 2 decimals (12.346 becomes 12.35)

> Given a new Ledger  
> When deposit('a', 12.346, 'd1') is called  
> Then balance('a') is 12.35 and the entry amount is 12.35

| | |
|---|---|
| **A. What the code does** | balance('a') is 12.35 and the entry amount is 12.35 |
| **B. The alternative** | the amount is kept unrounded: balance 12.346 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-012 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-012 --decision reject --expected "<what should happen>" --by <you>`

#### B-013 · Rounding goes down below the half cent (12.344 becomes 12.34)

> Given a new Ledger  
> When deposit('a', 12.344, 'd1') is called  
> Then balance('a') is 12.34

| | |
|---|---|
| **A. What the code does** | balance('a') is 12.34 |
| **B. The alternative** | the amount is rounded up to 12.35 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-013 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-013 --decision reject --expected "<what should happen>" --by <you>`

#### B-014 · An exact half cent rounds up (0.125 becomes 0.13)

> Given a new Ledger  
> When deposit('a', 0.125, 'd1') is called  
> Then balance('a') is 0.13

| | |
|---|---|
| **A. What the code does** | balance('a') is 0.13 |
| **B. The alternative** | the half cent rounds to even: balance 0.12 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-014 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-014 --decision reject --expected "<what should happen>" --by <you>`

#### B-015 · A deposit below half a cent is accepted but rounds to a 0 entry

> Given a new Ledger  
> When deposit('a', 0.004, 'd1') is called  
> Then it returns { ok: true }, balance('a') is 0 and entries('a') holds an entry { txnId: 'd1', kind: 'deposit', amount: 0 }

| | |
|---|---|
| **A. What the code does** | it returns { ok: true }, balance('a') is 0 and entries('a') holds an entry { txnId: 'd1', kind: 'deposit', amount: 0 } |
| **B. The alternative** | the deposit is rejected as invalid-amount because it rounds to 0 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-015 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-015 --decision reject --expected "<what should happen>" --by <you>`

#### B-018 · Withdrawal amount is rounded before checking funds (10.004 from 10 succeeds)

> Given account 'a' holds 10  
> When withdraw('a', 10.004, 'w1') is called  
> Then it returns { ok: true } and balance('a') is 0 (amount rounded to 10)

| | |
|---|---|
| **A. What the code does** | it returns { ok: true } and balance('a') is 0 (amount rounded to 10) |
| **B. The alternative** | the withdrawal is rejected as insufficient-funds because 10.004 exceeds 10 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-018 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-018 --decision reject --expected "<what should happen>" --by <you>`

#### B-038 · Transfer amounts are rounded to 2 decimals

> Given account 'a' holds 100  
> When transfer('a', 'b', 10.006, 't1') is called  
> Then balance('b') is 10.01 and the transfer-in entry amount is 10.01

| | |
|---|---|
| **A. What the code does** | balance('b') is 10.01 and the transfer-in entry amount is 10.01 |
| **B. The alternative** | the amount is kept unrounded: balance('b') is 10.006 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-038 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-038 --decision reject --expected "<what should happen>" --by <you>`

### overdraft policy

#### B-016 · Withdrawing exactly the whole balance is allowed

> Given account 'a' holds 100  
> When withdraw('a', 100, 'w1') is called  
> Then it returns { ok: true }, balance('a') is 0 and the last entry is { txnId: 'w1', kind: 'withdrawal', amount: 100 }

| | |
|---|---|
| **A. What the code does** | it returns { ok: true }, balance('a') is 0 and the last entry is { txnId: 'w1', kind: 'withdrawal', amount: 100 } |
| **B. The alternative** | withdrawing the whole balance is rejected because a minimum balance must remain |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-016 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-016 --decision reject --expected "<what should happen>" --by <you>`

#### B-017 · Withdrawing one cent more than the balance is rejected

> Given account 'a' holds 100  
> When withdraw('a', 100.01, 'w1') is called  
> Then it returns { ok: false, reason: 'insufficient-funds' } and balance('a') stays 100

| | |
|---|---|
| **A. What the code does** | it returns { ok: false, reason: 'insufficient-funds' } and balance('a') stays 100 |
| **B. The alternative** | the withdrawal is accepted and the balance becomes -0.01 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-017 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-017 --decision reject --expected "<what should happen>" --by <you>`

#### B-032 · Transferring exactly the whole balance is allowed

> Given account 'a' holds 100  
> When transfer('a', 'b', 100, 't1') is called  
> Then it returns { ok: true }, balance('a') is 0 and balance('b') is 100

| | |
|---|---|
| **A. What the code does** | it returns { ok: true }, balance('a') is 0 and balance('b') is 100 |
| **B. The alternative** | transferring the whole balance is rejected with 'insufficient-funds' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-032 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-032 --decision reject --expected "<what should happen>" --by <you>`

#### B-033 · Transferring one cent more than the balance is rejected, both balances unchanged

> Given account 'a' holds 100 and 'b' holds 0  
> When transfer('a', 'b', 100.01, 't1') is called  
> Then it returns { ok: false, reason: 'insufficient-funds' }, balance('a') stays 100, balance('b') stays 0 and 'b' has no entries

| | |
|---|---|
| **A. What the code does** | it returns { ok: false, reason: 'insufficient-funds' }, balance('a') stays 100, balance('b') stays 0 and 'b' has no entries |
| **B. The alternative** | the transfer is accepted, 'a' becomes -0.01 and 'b' becomes 100.01 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-033 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-033 --decision reject --expected "<what should happen>" --by <you>`

### daily withdrawal limit

#### B-024 · A single withdrawal of exactly 5000 is within the daily limit

> Given account 'a' holds 6000 and nothing has been withdrawn  
> When withdraw('a', 5000, 'w1') is called  
> Then it returns { ok: true } and balance('a') is 1000

| | |
|---|---|
| **A. What the code does** | it returns { ok: true } and balance('a') is 1000 |
| **B. The alternative** | there is a lower limit and the 5000 withdrawal is rejected |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-024 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-024 --decision reject --expected "<what should happen>" --by <you>`

#### B-025 · A single withdrawal of 5000.01 exceeds the daily limit

> Given account 'a' holds 6000 and nothing has been withdrawn  
> When withdraw('a', 5000.01, 'w1') is called  
> Then it returns { ok: false, reason: 'daily-limit' } and balance('a') stays 6000

| | |
|---|---|
| **A. What the code does** | it returns { ok: false, reason: 'daily-limit' } and balance('a') stays 6000 |
| **B. The alternative** | 5000.01 is accepted because there is no daily limit |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-025 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-025 --decision reject --expected "<what should happen>" --by <you>`

#### B-026 · The daily limit is cumulative across withdrawals: 3000 + 2000 is allowed, a further 0.01 is not

> Given account 'a' holds 10000 and has withdrawn 3000 ('w1') and 2000 ('w2') successfully  
> When withdraw('a', 0.01, 'w3') is called  
> Then it returns { ok: false, reason: 'daily-limit' } and balance('a') stays 5000

| | |
|---|---|
| **A. What the code does** | it returns { ok: false, reason: 'daily-limit' } and balance('a') stays 5000 |
| **B. The alternative** | 0.01 is accepted because there is no cumulative limit |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-026 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-026 --decision reject --expected "<what should happen>" --by <you>`

#### B-027 · Funds are checked before the daily limit

> Given account 'a' holds 100  
> When withdraw('a', 6000, 'w1') is called (over both balance and daily limit)  
> Then it returns { ok: false, reason: 'insufficient-funds' }

| | |
|---|---|
| **A. What the code does** | it returns { ok: false, reason: 'insufficient-funds' } |
| **B. The alternative** | it returns reason 'daily-limit' instead of 'insufficient-funds' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-027 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-027 --decision reject --expected "<what should happen>" --by <you>`

#### B-028 · Daily limit is tracked per account

> Given accounts 'a' and 'b' each hold 6000 and 'a' has withdrawn 5000  
> When withdraw('b', 5000, 'w2') is called  
> Then it returns { ok: true } and balance('b') is 1000

| | |
|---|---|
| **A. What the code does** | it returns { ok: true } and balance('b') is 1000 |
| **B. The alternative** | the limit is shared across accounts and the withdrawal from 'b' is rejected |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-028 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-028 --decision reject --expected "<what should happen>" --by <you>`

#### B-029 · Withdrawal rounding applies to the daily limit (5000.004 counts as 5000)

> Given account 'a' holds 6000  
> When withdraw('a', 5000.004, 'w1') is called  
> Then it returns { ok: true } and balance('a') is 1000

| | |
|---|---|
| **A. What the code does** | it returns { ok: true } and balance('a') is 1000 |
| **B. The alternative** | 5000.004 is rejected as daily-limit |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-029 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-029 --decision reject --expected "<what should happen>" --by <you>`

#### B-030 · A withdrawal refused for daily-limit does not count toward the limit

> Given account 'a' holds 10000 and withdraw('a', 4000, 'w1') succeeded, then withdraw('a', 1500, 'w2') was refused for daily-limit  
> When withdraw('a', 1000, 'w3') is called  
> Then it returns { ok: true } and balance('a') is 5000

| | |
|---|---|
| **A. What the code does** | it returns { ok: true } and balance('a') is 5000 |
| **B. The alternative** | the refused 1500 counts toward the limit and the 1000 withdrawal is rejected |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-030 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-030 --decision reject --expected "<what should happen>" --by <you>`

#### B-036 · Transfers do not count toward the daily withdrawal limit

> Given account 'a' holds 10000 and has withdrawn 5000 today  
> When transfer('a', 'b', 3000, 't1') is called  
> Then it returns { ok: true }, balance('a') is 2000 and balance('b') is 3000

| | |
|---|---|
| **A. What the code does** | it returns { ok: true }, balance('a') is 2000 and balance('b') is 3000 |
| **B. The alternative** | the transfer counts toward the daily limit and is rejected with 'daily-limit' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-036 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-036 --decision reject --expected "<what should happen>" --by <you>`

### self-transfer

#### B-037 · Transfer to the same account leaves the balance unchanged but records two entries

> Given account 'a' holds 100  
> When transfer('a', 'a', 30, 't1') is called  
> Then it returns { ok: true }, balance('a') stays 100 and entries('a') gains a transfer-out of 30 then a transfer-in of 30

| | |
|---|---|
| **A. What the code does** | it returns { ok: true }, balance('a') stays 100 and entries('a') gains a transfer-out of 30 then a transfer-in of 30 |
| **B. The alternative** | the self-transfer is rejected and no entries are added |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-037 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-037 --decision reject --expected "<what should happen>" --by <you>`

### history exposure

#### B-039 · entries returns a copy; changing it does not change the ledger

> Given account 'a' received deposit('a', 100, 'd1')  
> When the list returned by entries('a') has an item pushed onto it  
> Then entries('a') read again still has length 1

| | |
|---|---|
| **A. What the code does** | entries('a') read again still has length 1 |
| **B. The alternative** | entries returns the live internal list, so mutating it changes the ledger |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-039 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-039 --decision reject --expected "<what should happen>" --by <you>`

## Dropped requirements

#### P-007

> A transfer to the same account is rejected.

Plan line 13. Probe `PR-P-007` fails against the code: AssertionError: expected true to be false // Object.is equality
