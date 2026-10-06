# Delta: plan.md

Run `20261006T062148-32eeef` · plan sha256 `f1655dc091e1`

**54 silent decision(s), 3 dropped requirement(s).**

## Run health

| Check | Result |
|---|---|
| Scenarios | 59 extracted · 59 verified · 0 vacuous · 0 refuted |
| Census (declared) | 35 decision points · 34 covered · 1 waived · 0 uncovered |
| Trace mode | llm-tracer |
| Trace | 5 stated · 0 entailed · 54 unsourced · 11 downgraded by rules |
| Reverse probes | 14 run · 3 dropped · 0 realised but missed by the extractor |
| Leave-one-out | passed (2 statement(s) hidden: 5 flipped, 0 re-sourced, 0 cited hidden text) |
| Leak check | suspect · transcript: 4 tool call(s), 0 outside the room, 0 plan mention(s), 1 denied |

Open issues with this run:

- leak check: **suspect** (transcript shows no access outside the room and no mention of the plan: the overlap is phrasing, not a leak)

## Silent decisions

### account lifecycle

#### B-001 · A deposit credits the account and records a deposit entry

> Given a new Ledger with no accounts  
> When 100 is deposited to account 'a' with txnId 't1'  
> Then the result is ok, balance('a') is 100 and entries('a') is a single deposit entry of 100 with txnId 't1'

| | |
|---|---|
| **A. What the code does** | the result is ok, balance('a') is 100 and entries('a') is a single deposit entry of 100 with txnId 't1' |
| **B. The alternative** | the deposit is refused because account 'a' was never opened, and the balance stays 0 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-001 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-001 --decision reject --expected "<what should happen>" --by <you>`

#### B-009 · An account that was never opened reads as balance 0 with no entries

> Given a new Ledger  
> When balance('x') and entries('x') are read  
> Then balance is 0 and entries is an empty list

| | |
|---|---|
| **A. What the code does** | balance is 0 and entries is an empty list |
| **B. The alternative** | reading an unknown account throws an error |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-009 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-009 --decision reject --expected "<what should happen>" --by <you>`

#### B-010 · Opening an existing account does not reset it

> Given account 'a' holding 50 after a deposit with txnId 't1'  
> When open('a') is called  
> Then balance('a') stays 50 and the deposit entry is still there

| | |
|---|---|
| **A. What the code does** | balance('a') stays 50 and the deposit entry is still there |
| **B. The alternative** | re-opening resets the account to balance 0 with no entries |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-010 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-010 --decision reject --expected "<what should happen>" --by <you>`

### sub-cent amounts

#### B-005 · A deposit smaller than half a cent is accepted but credits 0

> Given a new Ledger  
> When 0.004 is deposited to 'a' with txnId 't1'  
> Then the result is ok, balance('a') is 0 and a deposit entry of amount 0 is recorded

| | |
|---|---|
| **A. What the code does** | the result is ok, balance('a') is 0 and a deposit entry of amount 0 is recorded |
| **B. The alternative** | the deposit is rejected with 'amount-too-small' and no entry is recorded |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-005 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-005 --decision reject --expected "<what should happen>" --by <you>`

#### B-015 · A foreign deposit that converts to less than half a cent is rejected as amount-too-small

> Given a new Ledger  
> When depositForeign('a', 0.004, 1, 'f1') is called  
> Then the result is { ok: false, reason: 'amount-too-small' }, balance('a') is 0 and entries('a') is empty

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'amount-too-small' }, balance('a') is 0 and entries('a') is empty |
| **B. The alternative** | the deposit is accepted and a deposit entry of 0 is recorded |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-015 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-015 --decision reject --expected "<what should happen>" --by <you>`

#### B-043 · A transfer of less than half a cent succeeds even from an empty account and records zero entries

> Given a new Ledger with no money anywhere  
> When 0.004 is transferred from 'a' to 'b' with txnId 'x1'  
> Then the result is ok, both balances are 0, 'a' has a transfer-out entry of 0 and 'b' a transfer-in entry of 0

| | |
|---|---|
| **A. What the code does** | the result is ok, both balances are 0, 'a' has a transfer-out entry of 0 and 'b' a transfer-in entry of 0 |
| **B. The alternative** | the transfer is rejected with 'amount-too-small' |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-043 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-043 --decision reject --expected "<what should happen>" --by <you>`

### idempotency

#### B-006 · Repeating a deposit with the same txnId is accepted but credits only once

> Given 100 deposited to 'a' with txnId 't1'  
> When 100 is deposited to 'a' again with txnId 't1'  
> Then the second call returns ok, balance('a') stays 100 and there is one entry

| | |
|---|---|
| **A. What the code does** | the second call returns ok, balance('a') stays 100 and there is one entry |
| **B. The alternative** | the repeat is rejected with { ok: false, reason: 'duplicate' } and the balance stays 100 |

Why the plan does not settle it: 'so that retries are safe' only requires that a retry does not move money twice, and rejecting it as a duplicate is safe. Nothing in the quote says a retry must report success.

Nearest plan text: “Each operation carries a client-supplied transaction id so that retries are safe.” (P-009)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-006 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-006 --decision reject --expected "<what should happen>" --by <you>`

#### B-019 · Repeating a foreign deposit with the same txnId credits only once

> Given depositForeign('a', 10, 1.5, 'f1') credited 15  
> When depositForeign('a', 10, 1.5, 'f1') is called again  
> Then it returns ok and balance('a') stays 15

| | |
|---|---|
| **A. What the code does** | it returns ok and balance('a') stays 15 |
| **B. The alternative** | the repeat is rejected with { ok: false, reason: 'duplicate' } and the balance stays 15 |

Why the plan does not settle it: Rejecting the retry still keeps it safe, because nothing is credited twice. The quote does not require the retry to return ok.

Nearest plan text: “Each operation carries a client-supplied transaction id so that retries are safe.” (P-009)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-019 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-019 --decision reject --expected "<what should happen>" --by <you>`

#### B-029 · Repeating a withdrawal with the same txnId debits only once

> Given account 'a' holding 200 and 100 withdrawn with txnId 'w1' (balance 99)  
> When 100 is withdrawn again with txnId 'w1'  
> Then the call returns ok and balance('a') stays 99

| | |
|---|---|
| **A. What the code does** | the call returns ok and balance('a') stays 99 |
| **B. The alternative** | the repeat is rejected with { ok: false, reason: 'duplicate' } and the balance stays 99 |

Why the plan does not settle it: Rejecting the retry as a duplicate does not debit twice, so retries stay safe. The quote does not decide between returning ok and returning an error.

Nearest plan text: “Each operation carries a client-supplied transaction id so that retries are safe.” (P-009)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-029 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-029 --decision reject --expected "<what should happen>" --by <you>`

#### B-042 · Repeating a transfer with the same txnId moves money only once

> Given account 'a' holding 100 and 30 transferred to 'b' with txnId 'x1'  
> When the same transfer of 30 with txnId 'x1' is repeated  
> Then the call returns ok, 'a' stays 70 and 'b' stays 30

| | |
|---|---|
| **A. What the code does** | the call returns ok, 'a' stays 70 and 'b' stays 30 |
| **B. The alternative** | the repeat is rejected with { ok: false, reason: 'duplicate' }, 'a' stays 70 and 'b' stays 30 |

Why the plan does not settle it: Retries are safe when the repeat is refused, because no money moves twice. The quote does not require the retry to return ok.

Nearest plan text: “Each operation carries a client-supplied transaction id so that retries are safe.” (P-009)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-042 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-042 --decision reject --expected "<what should happen>" --by <you>`

#### B-050 · Repeating a split with the same txnId pays out only once

> Given account 'a' holding 100 and 10 split to ['b', 'c'] with txnId 's1'  
> When the same split is repeated with txnId 's1'  
> Then it returns ok, 'a' stays 90 and 'b' stays 5

| | |
|---|---|
| **A. What the code does** | it returns ok, 'a' stays 90 and 'b' stays 5 |
| **B. The alternative** | the repeat is rejected with { ok: false, reason: 'duplicate' }, 'a' stays 90 and 'b' stays 5 |

Why the plan does not settle it: A duplicate rejection pays nothing out twice and so meets 'retries are safe'. Returning ok is not required by the words.

Nearest plan text: “Each operation carries a client-supplied transaction id so that retries are safe.” (P-009)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-050 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-050 --decision reject --expected "<what should happen>" --by <you>`

#### B-059 · Repeating interest with the same txnId credits only once

> Given account 'a' holding 1000 and applyInterest('a', 5, 365, 'i1') credited 50  
> When applyInterest('a', 5, 365, 'i1') is called again  
> Then it returns ok and balance('a') stays 1050

| | |
|---|---|
| **A. What the code does** | it returns ok and balance('a') stays 1050 |
| **B. The alternative** | the repeat is rejected with { ok: false, reason: 'duplicate' } and the balance stays 1050 |

Why the plan does not settle it: Refusing the retry does not credit interest twice, so retries stay safe. The quote does not require the repeat to return ok.

Nearest plan text: “Each operation carries a client-supplied transaction id so that retries are safe.” (P-009)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-059 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-059 --decision reject --expected "<what should happen>" --by <you>`

### idempotency scope

#### B-007 · A txnId already used on one account blocks a deposit to another account

> Given 100 deposited to 'a' with txnId 't1'  
> When 50 is deposited to 'b' with txnId 't1'  
> Then the call returns ok but balance('b') is 0 and 'b' has no entries

| | |
|---|---|
| **A. What the code does** | the call returns ok but balance('b') is 0 and 'b' has no entries |
| **B. The alternative** | txnIds are per account, so 'b' is credited 50 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-007 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-007 --decision reject --expected "<what should happen>" --by <you>`

#### B-017 · A rejected too-small foreign deposit does not use up its txnId

> Given depositForeign('a', 0.004, 1, 'f1') was rejected as amount-too-small  
> When depositForeign('a', 10, 1, 'f1') is called  
> Then it is credited and balance('a') is 10

| | |
|---|---|
| **A. What the code does** | it is credited and balance('a') is 10 |
| **B. The alternative** | the txnId is treated as already used and the balance stays 0 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-017 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-017 --decision reject --expected "<what should happen>" --by <you>`

#### B-030 · A withdrawal reusing a deposit's txnId is silently ignored

> Given 100 deposited to 'a' with txnId 't1'  
> When 50 is withdrawn from 'a' with txnId 't1'  
> Then the call returns ok and balance('a') stays 100

| | |
|---|---|
| **A. What the code does** | the call returns ok and balance('a') stays 100 |
| **B. The alternative** | txnIds are tracked per operation type, so 50.50 is debited and the balance is 49.5 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-030 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-030 --decision reject --expected "<what should happen>" --by <you>`

#### B-038 · A withdrawal refused for funds can be retried with the same txnId

> Given account 'a' holding 100; withdrawing 200 with txnId 'w1' was refused; then 500 more is deposited (balance 600)  
> When 200 is withdrawn again with txnId 'w1'  
> Then the result is ok and balance('a') is 398

| | |
|---|---|
| **A. What the code does** | the result is ok and balance('a') is 398 |
| **B. The alternative** | the txnId was used up by the refused attempt, so nothing is debited and the balance stays 600 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-038 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-038 --decision reject --expected "<what should happen>" --by <you>`

### check ordering

#### B-008 · An invalid amount is reported even when the txnId was already used

> Given 100 deposited to 'a' with txnId 't1'  
> When 0 is deposited to 'a' with txnId 't1'  
> Then the result is { ok: false, reason: 'invalid-amount' }

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'invalid-amount' } |
| **B. The alternative** | the duplicate txnId is checked first and the call returns ok |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-008 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-008 --decision reject --expected "<what should happen>" --by <you>`

#### B-018 · A foreign deposit with an already used txnId returns ok before the too-small check

> Given 100 deposited to 'a' with txnId 't1'  
> When depositForeign('a', 0.001, 1, 't1') is called  
> Then the result is ok and balance('a') stays 100

| | |
|---|---|
| **A. What the code does** | the result is ok and balance('a') stays 100 |
| **B. The alternative** | the call is rejected as amount-too-small |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-018 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-018 --decision reject --expected "<what should happen>" --by <you>`

#### B-037 · Insufficient funds is reported before the daily limit

> Given account 'a' holding 100  
> When 6000 is withdrawn  
> Then the result is { ok: false, reason: 'insufficient-funds' }

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' } |
| **B. The alternative** | the daily limit is checked first and the reason is 'daily-limit' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-037 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-037 --decision reject --expected "<what should happen>" --by <you>`

#### B-048 · A split of 0 with no recipients reports invalid-amount first

> Given account 'a' holding 100  
> When 0 is split from 'a' to []  
> Then the result is { ok: false, reason: 'invalid-amount' }

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'invalid-amount' } |
| **B. The alternative** | the empty recipient list is checked first and the reason is 'no-recipients' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-048 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-048 --decision reject --expected "<what should happen>" --by <you>`

#### B-049 · A split with no recipients is rejected even if its txnId was already used

> Given 100 deposited to 'a' with txnId 't1'  
> When 10 is split from 'a' to [] with txnId 't1'  
> Then the result is { ok: false, reason: 'no-recipients' }

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'no-recipients' } |
| **B. The alternative** | the duplicate txnId is checked first and the call returns ok |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-049 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-049 --decision reject --expected "<what should happen>" --by <you>`

### foreign deposit conversion

#### B-011 · A foreign deposit is converted at the given rate and recorded as a deposit

> Given a new Ledger  
> When depositForeign('a', 10, 1.5, 'f1') is called  
> Then the result is ok, balance('a') is 15 and the entry is a deposit of 15

| | |
|---|---|
| **A. What the code does** | the result is ok, balance('a') is 15 and the entry is a deposit of 15 |
| **B. The alternative** | the amount is divided by the rate, so 6.67 is credited and the entry is a deposit of 6.67 |

Why the plan does not settle it: 'the amount is converted at that rate' does not say whether the rate is home-per-foreign or foreign-per-home. Dividing 10 by 1.5 is just as much a conversion at that rate as multiplying.

Nearest plan text: “the amount is converted at that rate” (P-014)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-011 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-011 --decision reject --expected "<what should happen>" --by <you>`

### foreign deposit rounding

#### B-012 · A converted foreign amount is rounded to the cent, half up

> Given a new Ledger  
> When depositForeign('a', 1, 0.125, 'f1') is called (converted value 0.125)  
> Then balance('a') is 0.13

| | |
|---|---|
| **A. What the code does** | balance('a') is 0.13 |
| **B. The alternative** | the half cent rounds to even and the balance is 0.12 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-012 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-012 --decision reject --expected "<what should happen>" --by <you>`

#### B-016 · A foreign deposit converting to exactly half a cent rounds up to 0.01 and is accepted

> Given a new Ledger  
> When depositForeign('a', 0.005, 1, 'f1') is called  
> Then the result is ok and balance('a') is 0.01

| | |
|---|---|
| **A. What the code does** | the result is ok and balance('a') is 0.01 |
| **B. The alternative** | the half cent rounds to even (0.00) and 0.01 is not credited |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-016 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-016 --decision reject --expected "<what should happen>" --by <you>`

### foreign deposit validation

#### B-013 · A foreign deposit with rate 0 is rejected as invalid-amount

> Given a new Ledger  
> When depositForeign('a', 10, 0, 'f1') is called  
> Then the result is { ok: false, reason: 'invalid-amount' } and balance('a') is 0

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'invalid-amount' } and balance('a') is 0 |
| **B. The alternative** | the deposit is accepted and credits 0 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-013 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-013 --decision reject --expected "<what should happen>" --by <you>`

#### B-014 · A foreign deposit with amount 0 or a negative rate is rejected as invalid-amount

> Given a new Ledger  
> When depositForeign('a', 0, 1.5, 'f1') and depositForeign('a', 10, -2, 'f2') are called  
> Then both return { ok: false, reason: 'invalid-amount' } and balance('a') is 0

| | |
|---|---|
| **A. What the code does** | both return { ok: false, reason: 'invalid-amount' } and balance('a') is 0 |
| **B. The alternative** | the negative rate is accepted and the call returns ok |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-014 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-014 --decision reject --expected "<what should happen>" --by <you>`

### withdrawal fee

#### B-020 · A withdrawal is charged a 1% fee, recorded together with the amount

> Given account 'a' holding 200  
> When 100 is withdrawn from 'a' with txnId 'w1'  
> Then the result is ok, balance('a') is 99 and the withdrawal entry amount is 101

| | |
|---|---|
| **A. What the code does** | the result is ok, balance('a') is 99 and the withdrawal entry amount is 101 |
| **B. The alternative** | the fee is recorded as a separate entry of 1 and the withdrawal entry is 100 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-020 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-020 --decision reject --expected "<what should happen>" --by <you>`

#### B-021 · The withdrawal fee is at least 0.50

> Given account 'a' holding 100  
> When 10 is withdrawn (1% would be 0.10)  
> Then the fee charged is 0.50 and balance('a') is 89.5

| | |
|---|---|
| **A. What the code does** | the fee charged is 0.50 and balance('a') is 89.5 |
| **B. The alternative** | the 0.50 fee is deducted from the payout (customer receives 9.50), so 10 is debited and balance('a') is 90 |

Why the plan does not settle it: 'Each withdrawal is charged a fee of 1% ... with a minimum fee of 0.50' fixes the fee at 0.50 but not whether it is added to the debit or taken out of the amount paid out. Netting it from the proceeds still charges the withdrawal 0.50.

Nearest plan text: “Each withdrawal is charged a fee of 1% of the amount, with a minimum fee of 0.50.” (P-012)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-021 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-021 --decision reject --expected "<what should happen>" --by <you>`

#### B-023 · A withdrawal fee above the minimum is exactly 1% with nothing added

> Given account 'a' holding 100  
> When 60 is withdrawn  
> Then the fee is 0.60 and balance('a') is 39.4

| | |
|---|---|
| **A. What the code does** | the fee is 0.60 and balance('a') is 39.4 |
| **B. The alternative** | the 0.60 fee is deducted from the payout (customer receives 59.40), so 60 is debited and balance('a') is 40 |

Why the plan does not settle it: The quote sets the fee at 1% of 60 = 0.60 but does not say the fee is debited on top of the amount. Taking it out of the money paid out complies just as well, and the balance would be 40 rather than 39.4.

Nearest plan text: “Each withdrawal is charged a fee of 1% of the amount, with a minimum fee of 0.50.” (P-012)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-023 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-023 --decision reject --expected "<what should happen>" --by <you>`

#### B-024 · The withdrawal fee is capped at 25

> Given account 'a' holding 10000  
> When 3000 is withdrawn (1% would be 30)  
> Then the fee is 25 and balance('a') is 6975

| | |
|---|---|
| **A. What the code does** | the fee is 25 and balance('a') is 6975 |
| **B. The alternative** | there is no cap, the fee is 30 and the balance is 6970 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-024 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-024 --decision reject --expected "<what should happen>" --by <you>`

### withdrawal fee rounding

#### B-022 · The 1% withdrawal fee is rounded up to the next cent

> Given account 'a' holding 100  
> When 50.01 is withdrawn (1% is 0.5001)  
> Then the fee is 0.51 and balance('a') is 49.48

| | |
|---|---|
| **A. What the code does** | the fee is 0.51 and balance('a') is 49.48 |
| **B. The alternative** | the fee is rounded to 0.50 and the balance is 49.49 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-022 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-022 --decision reject --expected "<what should happen>" --by <you>`

### overdraft policy

#### B-025 · A withdrawal must leave room for the fee

> Given account 'a' holding 100  
> When 100 is withdrawn (fee 1, total 101)  
> Then the result is { ok: false, reason: 'insufficient-funds' } and the balance stays 100

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' } and the balance stays 100 |
| **B. The alternative** | the withdrawal is accepted and the balance becomes -1 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-025 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-025 --decision reject --expected "<what should happen>" --by <you>`

#### B-026 · A withdrawal that uses the balance exactly, fee included, is accepted

> Given account 'a' holding 101  
> When 100 is withdrawn (fee 1, total 101)  
> Then the result is ok and balance('a') is 0

| | |
|---|---|
| **A. What the code does** | the result is ok and balance('a') is 0 |
| **B. The alternative** | the withdrawal is rejected as insufficient-funds because it would empty the account |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-026 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-026 --decision reject --expected "<what should happen>" --by <you>`

#### B-027 · A withdrawal from an account that was never opened is rejected as insufficient-funds

> Given a new Ledger  
> When 1 is withdrawn from 'x'  
> Then the result is { ok: false, reason: 'insufficient-funds' } and balance('x') is 0

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' } and balance('x') is 0 |
| **B. The alternative** | the withdrawal is rejected with 'unknown-account' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-027 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-027 --decision reject --expected "<what should happen>" --by <you>`

#### B-040 · A transfer one cent over the balance is refused

> Given account 'a' holding 100  
> When 100.01 is transferred from 'a' to 'b'  
> Then the result is { ok: false, reason: 'insufficient-funds' }, 'a' stays 100 and 'b' stays 0

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' }, 'a' stays 100 and 'b' stays 0 |
| **B. The alternative** | the transfer goes through and 'a' becomes -0.01 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-040 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-040 --decision reject --expected "<what should happen>" --by <you>`

#### B-051 · A split one cent over the balance is refused

> Given account 'a' holding 10  
> When 10.01 is split from 'a' to ['b', 'c']  
> Then the result is { ok: false, reason: 'insufficient-funds' }, 'a' stays 10 and 'b' and 'c' stay 0

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'insufficient-funds' }, 'a' stays 10 and 'b' and 'c' stay 0 |
| **B. The alternative** | the split goes through and 'a' becomes -0.01 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-051 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-051 --decision reject --expected "<what should happen>" --by <you>`

#### B-052 · A split of exactly the whole balance is accepted

> Given account 'a' holding 10  
> When 10 is split from 'a' to ['b', 'c']  
> Then the result is ok, 'a' is 0, 'b' and 'c' are 5 each

| | |
|---|---|
| **A. What the code does** | the result is ok, 'a' is 0, 'b' and 'c' are 5 each |
| **B. The alternative** | the split is refused as insufficient-funds because it empties the account |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-052 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-052 --decision reject --expected "<what should happen>" --by <you>`

### daily withdrawal limit

#### B-031 · Withdrawing exactly the daily limit of 5000 is accepted; the fee does not count towards it

> Given account 'a' holding 10000 with no withdrawals yet  
> When 5000 is withdrawn (fee 25)  
> Then the result is ok and balance('a') is 4975

| | |
|---|---|
| **A. What the code does** | the result is ok and balance('a') is 4975 |
| **B. The alternative** | the withdrawal is rejected with 'daily-limit' because 5000 plus the fee exceeds 5000 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-031 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-031 --decision reject --expected "<what should happen>" --by <you>`

#### B-032 · A single withdrawal one cent over the daily limit is rejected

> Given account 'a' holding 10000 with no withdrawals yet  
> When 5000.01 is withdrawn  
> Then the result is { ok: false, reason: 'daily-limit' } and the balance stays 10000

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'daily-limit' } and the balance stays 10000 |
| **B. The alternative** | the withdrawal is accepted and the balance becomes 4974.99 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-032 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-032 --decision reject --expected "<what should happen>" --by <you>`

#### B-033 · The daily limit counts all earlier withdrawals from the account

> Given account 'a' holding 10000, from which 3000 was withdrawn (balance 6975)  
> When 2000.01 is withdrawn  
> Then the result is { ok: false, reason: 'daily-limit' } and the balance stays 6975

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'daily-limit' } and the balance stays 6975 |
| **B. The alternative** | each withdrawal is checked on its own, so it is accepted and the balance becomes 4954.99 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-033 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-033 --decision reject --expected "<what should happen>" --by <you>`

#### B-034 · Once 5000 has been withdrawn, even 1 more is refused; the allowance never resets

> Given account 'a' holding 10000, from which 5000 was withdrawn (balance 4975)  
> When 1 is withdrawn  
> Then the result is { ok: false, reason: 'daily-limit' } and the balance stays 4975

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'daily-limit' } and the balance stays 4975 |
| **B. The alternative** | the withdrawal is accepted and the balance becomes 4973.5 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-034 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-034 --decision reject --expected "<what should happen>" --by <you>`

#### B-035 · A withdrawal refused for the daily limit does not use up any allowance

> Given account 'a' holding 10000; a withdrawal of 5000.01 was refused for daily-limit  
> When 5000 is withdrawn  
> Then the result is ok and balance('a') is 4975

| | |
|---|---|
| **A. What the code does** | the result is ok and balance('a') is 4975 |
| **B. The alternative** | the refused attempt was counted, so 5000 is also refused with 'daily-limit' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-035 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-035 --decision reject --expected "<what should happen>" --by <you>`

#### B-036 · The daily limit is tracked per account

> Given accounts 'a' and 'b' each holding 10000; 5000 already withdrawn from 'a'  
> When 5000 is withdrawn from 'b'  
> Then the result is ok and balance('b') is 4975

| | |
|---|---|
| **A. What the code does** | the result is ok and balance('b') is 4975 |
| **B. The alternative** | the limit is shared across accounts and 'b' is refused with 'daily-limit' |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-036 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-036 --decision reject --expected "<what should happen>" --by <you>`

### transfer fees

#### B-039 · A transfer of the whole balance moves it with no fee

> Given account 'a' holding 100  
> When 100 is transferred from 'a' to 'b' with txnId 'x1'  
> Then the result is ok, 'a' is 0, 'b' is 100, 'a' has a transfer-out entry of 100 and 'b' a transfer-in entry of 100

| | |
|---|---|
| **A. What the code does** | the result is ok, 'a' is 0, 'b' is 100, 'a' has a transfer-out entry of 100 and 'b' a transfer-in entry of 100 |
| **B. The alternative** | a 1% fee applies and the transfer is refused as insufficient-funds |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-039 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-039 --decision reject --expected "<what should happen>" --by <you>`

### self-transfer

#### B-044 · A transfer to the same account leaves the balance unchanged but records both legs

> Given account 'a' holding 100  
> When 50 is transferred from 'a' to 'a' with txnId 'x1'  
> Then the result is ok, balance('a') stays 100 and entries('a') ends with transfer-out 50 then transfer-in 50

| | |
|---|---|
| **A. What the code does** | the result is ok, balance('a') stays 100 and entries('a') ends with transfer-out 50 then transfer-in 50 |
| **B. The alternative** | self-transfers are rejected and no entries are added |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-044 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-044 --decision reject --expected "<what should happen>" --by <you>`

### split remainder

#### B-045 · A split that does not divide evenly gives the extra cent to the first recipient

> Given account 'a' holding 100  
> When 100 is split from 'a' to ['b', 'c', 'd'] with txnId 's1'  
> Then 'b' gets 33.34, 'c' and 'd' get 33.33 each, and 'a' is 0

| | |
|---|---|
| **A. What the code does** | 'b' gets 33.34, 'c' and 'd' get 33.33 each, and 'a' is 0 |
| **B. The alternative** | the extra cent goes to the last recipient: 'b' 33.33, 'd' 33.34 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-045 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-045 --decision reject --expected "<what should happen>" --by <you>`

#### B-046 · With two leftover cents, the first two recipients each get one

> Given account 'a' holding 1  
> When 0.05 is split from 'a' to ['b', 'c', 'd']  
> Then 'b' gets 0.02, 'c' gets 0.02, 'd' gets 0.01 and 'a' is 0.95

| | |
|---|---|
| **A. What the code does** | 'b' gets 0.02, 'c' gets 0.02, 'd' gets 0.01 and 'a' is 0.95 |
| **B. The alternative** | the first recipient takes both leftover cents: 'b' 0.03, 'c' 0.01, 'd' 0.01 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-046 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-046 --decision reject --expected "<what should happen>" --by <you>`

### split validation

#### B-047 · A split with no recipients is rejected as no-recipients

> Given account 'a' holding 100  
> When 10 is split from 'a' to []  
> Then the result is { ok: false, reason: 'no-recipients' } and 'a' stays 100

| | |
|---|---|
| **A. What the code does** | the result is { ok: false, reason: 'no-recipients' } and 'a' stays 100 |
| **B. The alternative** | the split is accepted as a no-op |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-047 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-047 --decision reject --expected "<what should happen>" --by <you>`

#### B-053 · A recipient listed twice receives two shares

> Given account 'a' holding 10  
> When 1 is split from 'a' to ['b', 'b'] with txnId 's1'  
> Then 'b' receives 1 in total, recorded as two split-in entries of 0.5

| | |
|---|---|
| **A. What the code does** | 'b' receives 1 in total, recorded as two split-in entries of 0.5 |
| **B. The alternative** | duplicates are merged and 'b' receives a single share of 0.5 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-053 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-053 --decision reject --expected "<what should happen>" --by <you>`

### interest

#### B-054 · Interest uses a 365-day year: 5% for 365 days on 1000 credits 50

> Given account 'a' holding 1000  
> When applyInterest('a', 5, 365, 'i1') is called  
> Then the result is ok, balance('a') is 1050 and an interest entry of 50 is recorded

| | |
|---|---|
| **A. What the code does** | the result is ok, balance('a') is 1050 and an interest entry of 50 is recorded |
| **B. The alternative** | interest is compounded daily over a 365-day year: 1000 x ((1 + 0.05/365)^365 - 1) = 51.27 is credited, giving 1051.27 |

Why the plan does not settle it: 'computed on the current balance with a 365-day year' rules out a 360-day year but does not say simple or compound interest. Daily compounding on the current balance with a 365-day year is computed exactly as the words describe.

Nearest plan text: “computed on the current balance with a 365-day year.” (P-015)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-054 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-054 --decision reject --expected "<what should happen>" --by <you>`

#### B-056 · Interest that works out to exactly one whole amount is credited in full

> Given account 'a' holding 73  
> When applyInterest('a', 10, 50, 'i1') is called (exact interest 1.00)  
> Then 1.00 is credited and balance('a') is 74

| | |
|---|---|
| **A. What the code does** | 1.00 is credited and balance('a') is 74 |
| **B. The alternative** | interest is compounded daily (73 x ((1 + 0.1/365)^50 - 1) = 1.0067) and rounded to the nearest cent, so 1.01 is credited and the balance is 74.01 |

Why the plan does not settle it: The quote fixes the base (the current balance) and the day count (365), but not simple versus compound interest or how the result is rounded. Daily compounding with rounding to the nearest cent complies and credits 1.01, not 1.00.

Nearest plan text: “computed on the current balance with a 365-day year.” (P-015)

Notes: flip test: the contrary behaviour also satisfies the quoted text

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-056 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-056 --decision reject --expected "<what should happen>" --by <you>`

### interest rounding

#### B-055 · Interest is rounded down to the cent

> Given account 'a' holding 1000  
> When applyInterest('a', 5, 30, 'i1') is called (exact interest 4.10958…)  
> Then 4.10 is credited and balance('a') is 1004.1

| | |
|---|---|
| **A. What the code does** | 4.10 is credited and balance('a') is 1004.1 |
| **B. The alternative** | interest is rounded to nearest, 4.11 is credited and the balance is 1004.11 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-055 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-055 --decision reject --expected "<what should happen>" --by <you>`

#### B-057 · Interest below one cent returns ok, credits nothing and leaves the txnId unused

> Given account 'a' holding 1; applyInterest('a', 1, 1, 'i1') returned ok (interest under one cent)  
> When 5 is deposited to 'a' with the same txnId 'i1'  
> Then the interest call added no entry, and the deposit is credited so balance('a') is 6

| | |
|---|---|
| **A. What the code does** | the interest call added no entry, and the deposit is credited so balance('a') is 6 |
| **B. The alternative** | the interest call used up txnId 'i1', so the deposit is ignored and the balance stays 1 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-057 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-057 --decision reject --expected "<what should happen>" --by <you>`

### interest validation

#### B-058 · Interest with a rate of 0 or 0 days is rejected as invalid-amount

> Given account 'a' holding 1000  
> When applyInterest('a', 0, 365, 'i1') and applyInterest('a', 5, 0, 'i2') are called  
> Then both return { ok: false, reason: 'invalid-amount' } and the balance stays 1000

| | |
|---|---|
| **A. What the code does** | both return { ok: false, reason: 'invalid-amount' } and the balance stays 1000 |
| **B. The alternative** | both calls return ok with nothing credited |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-058 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-058 --decision reject --expected "<what should happen>" --by <you>`

## Dropped requirements

#### P-007

> A transfer to the same account is rejected.

Plan line 13. Probe `PR-P-007` fails against the code: AssertionError: expected true to be false // Object.is equality

#### P-013

> The fee is recorded in the account history as its own entry, separate from the withdrawal.

Plan line 22. Probe `PR-P-013` fails against the code: AssertionError: expected [ { txnId: 'd1', …(2) }, …(1) ] to have a length of 3 but got 2

#### P-014

> Customers can deposit an amount in a foreign currency together with an exchange rate; the amount is converted at that rate and rounded to the nearest cent, with halves rounded to even.

Plan line 23. Probe `PR-P-014` fails against the code: AssertionError: expected 0.13 to be 0.12 // Object.is equality

_The trace had marked this realised (by B-011); the probe overrules it._
