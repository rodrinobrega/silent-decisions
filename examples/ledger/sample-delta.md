> Sample output. The model stages here are hand-written fixtures (`fixtures/`), not a real agent run; two of the ten scenarios are deliberately bad to show the twin and refutation checks. Produced by `./demo.sh`.

# Delta: plan.md

Run `<run-id>` · plan sha256 `b8c7a2b74776`

**5 silent decision(s), 1 dropped requirement(s).**

## Run health

| Check | Result |
|---|---|
| Scenarios | 10 extracted · 8 verified · 1 vacuous · 1 refuted |
| Census (declared) | 15 decision points · 13 covered · 2 waived · 0 uncovered |
| Trace | 3 stated · 0 entailed · 5 unsourced · 3 downgraded by rules |
| Reverse probes | 1 run · 1 dropped · 0 realised but missed by the extractor |
| Leave-one-out | review (3 statement(s) hidden: 2 flipped, 1 re-sourced, 0 cited hidden text) |
| Leak check | clean · no audit log (hook not installed) |

Open issues with this run:

- leave-one-out: 1 behaviour(s) stayed sourced from another passage, check them below

## Silent decisions

### overdraft policy

#### B-002 · A withdrawal larger than the balance is rejected

> Given an account with balance 100  
> When 150 is withdrawn  
> Then the withdrawal is rejected with reason 'insufficient-funds' and the balance stays 100

| | |
|---|---|
| **A. What the code does** | the withdrawal is rejected with reason 'insufficient-funds' and the balance stays 100 |
| **B. The alternative** | the withdrawal is accepted and the balance becomes -50 |

Why the plan does not settle it: 'Customers can withdraw funds from an account' is equally satisfied by a ledger that allows overdrafts. The quote does not say what happens when the balance is too low.

Nearest plan text: “Customers can withdraw funds from an account.” (P-004)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: return value and balance()

- [ ] A is right: `sd ledger --behaviour B-002 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-002 --decision reject --expected "<what should happen>" --by <you>`

### withdrawal limits

#### B-003 · Withdrawals are capped at 5000 per account

> Given an account with balance 10000 that has already withdrawn 4000  
> When a further 1500 is withdrawn  
> Then the withdrawal is rejected with reason 'daily-limit' and the balance stays 6000

| | |
|---|---|
| **A. What the code does** | the withdrawal is rejected with reason 'daily-limit' and the balance stays 6000 |
| **B. The alternative** | the withdrawal is accepted; there is no limit |

Where: src/ledger.ts · observed at: return value and balance()

- [ ] A is right: `sd ledger --behaviour B-003 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-003 --decision reject --expected "<what should happen>" --by <you>`

### money precision

#### B-004 · Amounts are rounded half-up to two decimal places

> Given a new account  
> When 10.005 is deposited  
> Then the balance is 10.01

| | |
|---|---|
| **A. What the code does** | the balance is 10.01 |
| **B. The alternative** | the balance is 10.005 (no rounding), or 10.00 (banker's rounding or truncation) |

Where: src/ledger.ts · observed at: balance()

- [ ] A is right: `sd ledger --behaviour B-004 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-004 --decision reject --expected "<what should happen>" --by <you>`

### retries

#### B-005 · A repeated transaction id is acknowledged and has no effect, even with a different amount

> Given an account where 50 was deposited with transaction id 't1'  
> When 70 is deposited again with transaction id 't1'  
> Then the call reports success and the balance stays 50

| | |
|---|---|
| **A. What the code does** | the call reports success and the balance stays 50 |
| **B. The alternative** | the second call is rejected because its amount differs from the first call with the same id |

Why the plan does not settle it: Rejecting a mismatched replay is also 'safe'. The plan says retries are safe, not whether a same-id call with a different payload is a retry.

Nearest plan text: “Each operation carries a client-supplied transaction id so that retries are safe.” (P-009); “Every accepted operation is recorded in the account history.” (P-008)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: return value and balance()

- [ ] A is right: `sd ledger --behaviour B-005 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-005 --decision reject --expected "<what should happen>" --by <you>`

### unknown accounts

#### B-008 · The balance of an unknown account is 0

> Given no account 'zz' has been opened  
> When its balance is read  
> Then the result is 0 and no error is raised

| | |
|---|---|
| **A. What the code does** | the result is 0 and no error is raised |
| **B. The alternative** | reading an unknown account raises an error |

Notes: quote not found in plan: "unknown accounts report a zero balance"; stated without a verifiable quote

Where: src/ledger.ts · observed at: balance()

- [ ] A is right: `sd ledger --behaviour B-008 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-008 --decision reject --expected "<what should happen>" --by <you>`

## Dropped requirements

#### P-007

> A transfer to the same account is rejected.

Plan line 13. Probe `PR-P-007` fails against the code: AssertionError: expected true to be false // Object.is equality

## Leave-one-out: check these

The cited statement was hidden and the tracer still found a source. Either the plan says it twice, or the tracer is over-matching.

- B-007: now cites “Every accepted operation is recorded in the account history.” (P-008)
