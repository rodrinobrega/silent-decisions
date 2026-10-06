# Delta: plan.md

Run `20261006T063811-11a66f` · plan sha256 `b8c7a2b74776`

**35 silent decision(s), 1 dropped requirement(s).**

## Run health

| Check | Result |
|---|---|
| Scenarios | 42 extracted · 42 verified · 0 vacuous · 0 refuted |
| Census (declared) | 15 decision points · 15 covered · 0 waived · 0 uncovered |
| Trace mode | llm-tracer |
| Trace | 7 stated · 0 entailed · 35 unsourced · 4 downgraded by rules |
| Reverse probes | 7 run · 1 dropped · 0 realised but missed by the extractor |
| Leave-one-out | passed (1 statement(s) hidden: 7 flipped, 0 re-sourced, 0 cited hidden text) |
| Leak check | suspect · no audit log (hook not installed) |

Open issues with this run:

- leak check: **suspect**

## Silent decisions

### account lifecycle

#### B-001 · An account never opened reads as balance 0 and empty history

> Given a new Ledger with no accounts  
> When balance and entries are read for account 'ghost'  
> Then balance is 0 and entries is an empty list

| | |
|---|---|
| **A. What the code does** | balance is 0 and entries is an empty list |
| **B. The alternative** | reading 'ghost' fails with an unknown-account error |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-001 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-001 --decision reject --expected "<what should happen>" --by <you>`

#### B-002 · Opening an existing account again does not reset it

> Given account 'a' has received a deposit of 100 (txn 't1')  
> When open('a') is called again  
> Then the balance stays 100 and the history still holds the one deposit

| | |
|---|---|
| **A. What the code does** | the balance stays 100 and the history still holds the one deposit |
| **B. The alternative** | open('a') resets the account to balance 0 with empty history, or fails as already-open |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-002 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-002 --decision reject --expected "<what should happen>" --by <you>`

#### B-003 · A deposit to a new account opens it and records the deposit

> Given a new Ledger  
> When 100 is deposited into 'a' with txn 't1'  
> Then the result is ok, balance of 'a' is 100 and history has one deposit entry of 100 with txnId 't1'

| | |
|---|---|
| **A. What the code does** | the result is ok, balance of 'a' is 100 and history has one deposit entry of 100 with txnId 't1' |
| **B. The alternative** | the deposit is rejected because 'a' was never opened |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-003 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-003 --decision reject --expected "<what should happen>" --by <you>`

#### B-035 · A transfer moves funds and records transfer-out and transfer-in entries

> Given account 'a' has a balance of 100  
> When 40 is transferred from 'a' to 'b' with txn 't2'  
> Then the result is { ok: true }; 'a' is 60 with a transfer-out entry of 40, 'b' is 40 with a transfer-in entry of 40, both with txnId 't2'

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }; 'a' is 60 with a transfer-out entry of 40, 'b' is 40 with a transfer-in entry of 40, both with txnId 't2' |
| **B. The alternative** | the transfer is rejected because 'b' does not exist |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-035 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-035 --decision reject --expected "<what should happen>" --by <you>`

### idempotency scope

#### B-007 · A rejected (invalid-amount) deposit does not use up its txnId

> Given a deposit of 0 into 'a' with txn 't1' was rejected  
> When 100 is deposited into 'a' with the same txn 't1'  
> Then the deposit is applied: balance of 'a' is 100

| | |
|---|---|
| **A. What the code does** | the deposit is applied: balance of 'a' is 100 |
| **B. The alternative** | the second call is treated as a retry of 't1' and ignored, so the balance stays 0 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-007 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-007 --decision reject --expected "<what should happen>" --by <you>`

#### B-008 · The amount check runs before the retry check

> Given a deposit of 100 into 'a' with txn 't1' has been accepted  
> When a deposit of 0 is made with the same txn 't1'  
> Then the result is { ok: false, reason: 'invalid-amount' } rather than the retry's ok

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'invalid-amount' } rather than the retry's ok |
| **B. The alternative** | the call is recognised as a retry of 't1' and returns { ok: true } |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-008 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-008 --decision reject --expected "<what should happen>" --by <you>`

#### B-010 · A reused txnId with a different amount is silently ignored

> Given 100 was deposited into 'a' with txn 't1'  
> When 500 is deposited into 'a' with txn 't1'  
> Then the result is { ok: true } and the balance stays 100

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and the balance stays 100 |
| **B. The alternative** | the call is rejected as a conflicting reuse of 't1' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-010 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-010 --decision reject --expected "<what should happen>" --by <you>`

#### B-011 · txnIds are shared across all accounts

> Given 100 was deposited into 'a' with txn 't1'  
> When 50 is deposited into a different account 'b' with txn 't1'  
> Then the result is { ok: true } but nothing is applied: balance of 'b' is 0

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } but nothing is applied: balance of 'b' is 0 |
| **B. The alternative** | txnIds are per account, so 'b' receives 50 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-011 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-011 --decision reject --expected "<what should happen>" --by <you>`

#### B-012 · txnIds are shared across operation types

> Given 100 was deposited into 'a' with txn 't1'  
> When 50 is withdrawn from 'a' with txn 't1'  
> Then the result is { ok: true } but nothing is withdrawn: balance stays 100

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } but nothing is withdrawn: balance stays 100 |
| **B. The alternative** | the withdrawal is applied and the balance becomes 50 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-012 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-012 --decision reject --expected "<what should happen>" --by <you>`

#### B-023 · A withdrawal rejected for insufficient funds can be retried with the same txnId later

> Given account 'a' has 100, and a withdrawal of 150 with txn 't2' was rejected as insufficient-funds  
> When 100 more is deposited (txn 't3') and the withdrawal of 150 with txn 't2' is sent again  
> Then the withdrawal now succeeds and the balance is 50

| | |
|---|---|
| **A. What the code does** | the withdrawal now succeeds and the balance is 50 |
| **B. The alternative** | 't2' counts as used, so the retry is ignored and the balance stays 200 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-023 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-023 --decision reject --expected "<what should happen>" --by <you>`

### idempotent retries

#### B-009 · Retrying a deposit with the same txnId is a no-op that reports success

> Given 100 was deposited into 'a' with txn 't1'  
> When the deposit of 100 with txn 't1' is sent again  
> Then the result is { ok: true }, balance stays 100 and history still has one entry

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, balance stays 100 and history still has one entry |
| **B. The alternative** | the repeated deposit of 100 with txn 't1' is refused with { ok: false, reason: 'duplicate-txn' }; balance stays 100 and history still has one entry |

Why the plan does not settle it: "Each operation carries a client-supplied transaction id so that retries are safe" requires only that the id exists and that retries are "safe". Refusing the duplicate is just as safe as silently returning ok, so the { ok: true } in the Then (what a retry reports to the client) is not decided by the quote.

Nearest plan text: “Each operation carries a client-supplied transaction id so that retries are safe.” (P-009)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-009 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-009 --decision reject --expected "<what should happen>" --by <you>`

#### B-020 · Retrying a withdrawal with the same txnId withdraws only once

> Given account 'a' has a balance of 100 and 30 was withdrawn with txn 't2'  
> When the withdrawal of 30 with txn 't2' is sent again  
> Then the result is { ok: true } and the balance stays 70

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and the balance stays 70 |
| **B. The alternative** | the repeated withdrawal of 30 with txn 't2' is refused with { ok: false, reason: 'duplicate-txn' }; balance stays 70 |

Why the plan does not settle it: Refusing a duplicate txnId withdraws nothing a second time, so retries stay "safe". The quote does not say that a retry must report { ok: true }, so this part of the Then is undecided.

Nearest plan text: “Each operation carries a client-supplied transaction id so that retries are safe.” (P-009)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-020 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-020 --decision reject --expected "<what should happen>" --by <you>`

#### B-039 · Retrying a transfer with the same txnId moves money only once

> Given account 'a' has 100 and 40 was transferred to 'b' with txn 't2'  
> When the transfer of 40 with txn 't2' is sent again  
> Then the result is { ok: true }; 'a' stays 60 and 'b' stays 40

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }; 'a' stays 60 and 'b' stays 40 |
| **B. The alternative** | the repeated transfer of 40 with txn 't2' is refused with { ok: false, reason: 'duplicate-txn' }; 'a' stays 60 and 'b' stays 40 |

Why the plan does not settle it: No money moves twice, so retries are still "safe". The quote does not say what a retry returns, so the { ok: true } in the Then is not decided by it.

Nearest plan text: “Each operation carries a client-supplied transaction id so that retries are safe.” (P-009)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-039 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-039 --decision reject --expected "<what should happen>" --by <you>`

### amount rounding

#### B-013 · Amounts are rounded to cents, half rounds up (0.125 becomes 0.13)

> Given a new Ledger  
> When 0.125 is deposited into 'a' with txn 't1'  
> Then the balance is 0.13 and the history entry amount is 0.13

| | |
|---|---|
| **A. What the code does** | the balance is 0.13 and the history entry amount is 0.13 |
| **B. The alternative** | the balance is 0.12 (half-to-even or truncation) or 0.125 (unrounded) |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-013 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-013 --decision reject --expected "<what should happen>" --by <you>`

#### B-014 · Amounts below half a cent round down (0.124 becomes 0.12)

> Given a new Ledger  
> When 0.124 is deposited into 'a' with txn 't1'  
> Then the balance is 0.12

| | |
|---|---|
| **A. What the code does** | the balance is 0.12 |
| **B. The alternative** | the balance is 0.124 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-014 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-014 --decision reject --expected "<what should happen>" --by <you>`

#### B-015 · A positive amount that rounds to 0 cents is accepted as a 0 deposit

> Given a new Ledger  
> When 0.004 is deposited into 'a' with txn 't1'  
> Then the result is { ok: true }, balance is 0 and history holds a deposit entry of amount 0

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, balance is 0 and history holds a deposit entry of amount 0 |
| **B. The alternative** | the deposit is rejected as invalid-amount |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-015 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-015 --decision reject --expected "<what should happen>" --by <you>`

#### B-016 · The running balance itself is not rounded to cents

> Given a new Ledger  
> When 0.1 is deposited into 'a' (txn 't1') and then 0.2 (txn 't2')  
> Then the balance reads 0.30000000000000004

| | |
|---|---|
| **A. What the code does** | the balance reads 0.30000000000000004 |
| **B. The alternative** | the balance reads exactly 0.3 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-016 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-016 --decision reject --expected "<what should happen>" --by <you>`

### withdrawal

#### B-017 · A withdrawal records a withdrawal entry and reduces the balance

> Given account 'a' has a balance of 100  
> When 40 is withdrawn from 'a' with txn 't2'  
> Then the result is { ok: true }, balance is 60 and the last history entry is a withdrawal of 40 with txnId 't2'

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, balance is 60 and the last history entry is a withdrawal of 40 with txnId 't2' |
| **B. The alternative** | the withdrawal of 40 is rejected with { ok: false, reason: 'over-limit' } because the system caps a single withdrawal at 25; balance stays 100 and no entry is recorded |

Why the plan does not settle it: "Customers can withdraw funds from an account" grants a capability, not an unconditional right to any amount. A per-withdrawal cap (or a minimum balance, or a fee that leaves the balance at 59.50) still lets customers withdraw. "Every accepted operation is recorded" only applies to accepted operations, so a rejected one breaches nothing. The quotes do not decide that 40 is withdrawn in full and the balance becomes exactly 60.

Nearest plan text: “Customers can withdraw funds from an account.” (P-004); “Every accepted operation is recorded in the account history.” (P-008)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-017 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-017 --decision reject --expected "<what should happen>" --by <you>`

### overdraft policy

#### B-021 · Withdrawing the entire balance is allowed (balance may reach exactly 0)

> Given account 'a' has a balance of 100  
> When 100 is withdrawn from 'a' with txn 't2'  
> Then the result is { ok: true } and the balance is 0

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and the balance is 0 |
| **B. The alternative** | the withdrawal is rejected and the balance stays 100 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-021 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-021 --decision reject --expected "<what should happen>" --by <you>`

#### B-022 · Withdrawing one cent more than the balance is rejected

> Given account 'a' has a balance of 100  
> When 100.01 is withdrawn from 'a' with txn 't2'  
> Then the result is { ok: false, reason: 'insufficient-funds' }, balance stays 100 and nothing is added to history

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' }, balance stays 100 and nothing is added to history |
| **B. The alternative** | the withdrawal is accepted and the balance becomes -0.01 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-022 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-022 --decision reject --expected "<what should happen>" --by <you>`

#### B-024 · Withdrawing from an account that was never funded is insufficient-funds

> Given a new Ledger  
> When 10 is withdrawn from 'x' with txn 't1'  
> Then the result is { ok: false, reason: 'insufficient-funds' } and balance of 'x' is 0

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' } and balance of 'x' is 0 |
| **B. The alternative** | the withdrawal is rejected as unknown-account, or accepted and the balance becomes -10 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-024 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-024 --decision reject --expected "<what should happen>" --by <you>`

#### B-040 · Transferring the entire balance is allowed

> Given account 'a' has a balance of 100  
> When 100 is transferred from 'a' to 'b' with txn 't2'  
> Then the result is { ok: true }; 'a' is 0 and 'b' is 100

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }; 'a' is 0 and 'b' is 100 |
| **B. The alternative** | the transfer is rejected as insufficient-funds |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-040 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-040 --decision reject --expected "<what should happen>" --by <you>`

#### B-041 · Transferring one cent more than the balance is rejected

> Given account 'a' has a balance of 100  
> When 100.01 is transferred from 'a' to 'b' with txn 't2'  
> Then the result is { ok: false, reason: 'insufficient-funds' }; 'a' stays 100, 'b' stays 0 and neither history changes

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' }; 'a' stays 100, 'b' stays 0 and neither history changes |
| **B. The alternative** | the transfer is accepted: 'a' becomes -0.01 and 'b' becomes 100.01 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-041 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-041 --decision reject --expected "<what should happen>" --by <you>`

### daily withdrawal limit

#### B-025 · Insufficient funds is checked before the daily limit

> Given account 'a' has a balance of 100  
> When 6000 is withdrawn from 'a' with txn 't2'  
> Then the reason given is 'insufficient-funds', not 'daily-limit'

| | |
|---|---|
| **A. What the code does** | the reason given is 'insufficient-funds', not 'daily-limit' |
| **B. The alternative** | the reason given is 'daily-limit' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-025 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-025 --decision reject --expected "<what should happen>" --by <you>`

#### B-026 · A single withdrawal of exactly 5000 is within the daily limit

> Given account 'a' has a balance of 6000 and nothing withdrawn yet  
> When 5000 is withdrawn from 'a' with txn 't2'  
> Then the result is { ok: true } and the balance is 1000

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and the balance is 1000 |
| **B. The alternative** | the withdrawal is rejected as daily-limit |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-026 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-026 --decision reject --expected "<what should happen>" --by <you>`

#### B-027 · A single withdrawal of 5000.01 exceeds the daily limit

> Given account 'a' has a balance of 6000 and nothing withdrawn yet  
> When 5000.01 is withdrawn from 'a' with txn 't2'  
> Then the result is { ok: false, reason: 'daily-limit' } and the balance stays 6000

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'daily-limit' } and the balance stays 6000 |
| **B. The alternative** | the withdrawal is accepted and the balance becomes 999.99 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-027 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-027 --decision reject --expected "<what should happen>" --by <you>`

#### B-028 · Withdrawals accumulate toward the 5000 daily limit

> Given account 'a' has a balance of 10000 and 3000 was withdrawn (txn 't2')  
> When 2000.01 is withdrawn (txn 't3'), then 2000 is withdrawn (txn 't4')  
> Then the 2000.01 withdrawal is rejected as daily-limit; the 2000 withdrawal succeeds and the balance is 5000

| | |
|---|---|
| **A. What the code does** | the 2000.01 withdrawal is rejected as daily-limit; the 2000 withdrawal succeeds and the balance is 5000 |
| **B. The alternative** | both withdrawals succeed |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-028 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-028 --decision reject --expected "<what should happen>" --by <you>`

#### B-029 · Once 5000 has been withdrawn, even 0.01 more is refused

> Given account 'a' has a balance of 6000 and 5000 has been withdrawn (txn 't2')  
> When 0.01 is withdrawn (txn 't3')  
> Then the result is { ok: false, reason: 'daily-limit' } and the balance stays 1000

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'daily-limit' } and the balance stays 1000 |
| **B. The alternative** | the withdrawal is accepted and the balance becomes 999.99 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-029 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-029 --decision reject --expected "<what should happen>" --by <you>`

#### B-030 · A withdrawal refused for the daily limit does not count toward the limit

> Given account 'a' has a balance of 10000 and a withdrawal of 5000.01 (txn 't2') was refused as daily-limit  
> When 5000 is withdrawn (txn 't3')  
> Then the result is { ok: true } and the balance is 5000

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and the balance is 5000 |
| **B. The alternative** | the refused attempt counted, so this withdrawal is refused |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-030 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-030 --decision reject --expected "<what should happen>" --by <you>`

#### B-031 · The daily limit is tracked per account

> Given accounts 'a' and 'b' each have a balance of 6000, and 5000 was withdrawn from 'a'  
> When 5000 is withdrawn from 'b'  
> Then the result is { ok: true } and balance of 'b' is 1000

| | |
|---|---|
| **A. What the code does** | the result is { ok: true } and balance of 'b' is 1000 |
| **B. The alternative** | the limit is shared across accounts and the withdrawal is refused |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-031 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-031 --decision reject --expected "<what should happen>" --by <you>`

#### B-032 · The 'daily' limit never resets when the date changes

> Given on 2026-01-01 account 'a' has a balance of 10000 and 5000 was withdrawn  
> When the clock moves to 2026-01-02 and 1 is withdrawn  
> Then the result is { ok: false, reason: 'daily-limit' }

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'daily-limit' } |
| **B. The alternative** | the limit resets on the new day and the withdrawal is accepted |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-032 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-032 --decision reject --expected "<what should happen>" --by <you>`

#### B-033 · The daily limit is checked on the rounded amount (5000.004 counts as 5000)

> Given account 'a' has a balance of 6000  
> When 5000.004 is withdrawn  
> Then the result is { ok: true }, the withdrawal entry is 5000 and the balance is 1000

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, the withdrawal entry is 5000 and the balance is 1000 |
| **B. The alternative** | the withdrawal is refused as daily-limit |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-033 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-033 --decision reject --expected "<what should happen>" --by <you>`

#### B-034 · Transfers do not count toward the daily withdrawal limit

> Given account 'a' has a balance of 12000  
> When 6000 is transferred from 'a' to 'b' (txn 't2') and then 5000 is withdrawn from 'a' (txn 't3')  
> Then both succeed; balance of 'a' is 1000 and 'b' is 6000

| | |
|---|---|
| **A. What the code does** | both succeed; balance of 'a' is 1000 and 'b' is 6000 |
| **B. The alternative** | the 5000 withdrawal is refused as daily-limit |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-034 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-034 --decision reject --expected "<what should happen>" --by <you>`

### same-account transfer

#### B-036 · A transfer to the same account is accepted and leaves the balance unchanged

> Given account 'a' has a balance of 100  
> When 30 is transferred from 'a' to 'a' with txn 't2'  
> Then the result is { ok: true }, the balance stays 100, and history gains a transfer-out of 30 and a transfer-in of 30

| | |
|---|---|
| **A. What the code does** | the result is { ok: true }, the balance stays 100, and history gains a transfer-out of 30 and a transfer-in of 30 |
| **B. The alternative** | the transfer is rejected because source and destination are the same |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-036 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-036 --decision reject --expected "<what should happen>" --by <you>`

### history access

#### B-042 · The history returned by entries is a copy

> Given account 'a' has one deposit of 100  
> When the list returned by entries('a') is emptied by the caller and entries('a') is read again  
> Then the second read still has one entry

| | |
|---|---|
| **A. What the code does** | the second read still has one entry |
| **B. The alternative** | the caller's change affects the ledger and the second read is empty |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-042 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-042 --decision reject --expected "<what should happen>" --by <you>`

## Dropped requirements

#### P-007

> A transfer to the same account is rejected.

Plan line 13. Probe `PR-P-007` fails against the code: AssertionError: expected true to be false // Object.is equality
