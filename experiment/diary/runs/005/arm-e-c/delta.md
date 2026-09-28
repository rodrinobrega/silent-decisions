# Delta: plan.md

Run `20260928T064636-ec03cf` · plan sha256 `f1655dc091e1`

**38 silent decision(s), 3 dropped requirement(s).**

## Run health

| Check | Result |
|---|---|
| Scenarios | 49 extracted · 49 verified · 0 vacuous · 0 refuted |
| Census (declared) | 35 decision points · 34 covered · 1 waived · 0 uncovered |
| Trace mode | pairwise-classifier · 2516 calls · threshold 0.7 |
| Trace | 11 stated · 0 entailed · 38 unsourced · 1 downgraded by rules |
| Reverse probes | 14 run · 3 dropped · 3 realised but missed by the extractor |
| Leave-one-out | review (3 statement(s) hidden: 8 flipped, 1 re-sourced, 0 cited hidden text) |
| Leak check | clean · transcript: 3 tool call(s), 0 outside the room, 0 plan mention(s), 0 denied |

Open issues with this run:

- leave-one-out: 1 behaviour(s) stayed sourced from another passage, check them below

## Silent decisions

### unclustered

#### B-001 · Unknown account reads as zero balance and empty history

> Given a new Ledger with no accounts  
> When the balance and entries of account 'ghost' are read  
> Then balance is 0 and entries is an empty list

| | |
|---|---|
| **A. What the code does** | balance is 0 and entries is an empty list |
| **B. The alternative** | reading an unknown account throws an error |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-001 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-001 --decision reject --expected "<what should happen>" --by <you>`

#### B-002 · Opening an existing account does not reset it

> Given account 'a' has received a deposit of 100 (txn 'd1')  
> When open('a') is called again  
> Then balance stays 100 and history still has the 1 deposit entry

| | |
|---|---|
| **A. What the code does** | balance stays 100 and history still has the 1 deposit entry |
| **B. The alternative** | the account is reset to a balance of 0 with empty history |

Notes: P-017 is typed out-of-scope; only behavioural statements can source; stated without a verifiable quote

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-002 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-002 --decision reject --expected "<what should happen>" --by <you>`

#### B-003 · Deposit of 100 credits the account and records a deposit entry

> Given a new Ledger  
> When 100 is deposited into 'a' with txn 'd1'  
> Then result is ok, balance is 100 and entries is [{txnId 'd1', kind 'deposit', amount 100}]

| | |
|---|---|
| **A. What the code does** | result is ok, balance is 100 and entries is [{txnId 'd1', kind 'deposit', amount 100}] |
| **B. The alternative** | the deposit is rejected because account 'a' was never opened, balance stays 0 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-003 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-003 --decision reject --expected "<what should happen>" --by <you>`

#### B-007 · Transaction ids are shared across all operation types

> Given 100 has been deposited into 'a' with txn 't1'  
> When 50 is withdrawn from 'a' using txn 't1'  
> Then result is ok but nothing happens: balance stays 100 and there is 1 entry

| | |
|---|---|
| **A. What the code does** | result is ok but nothing happens: balance stays 100 and there is 1 entry |
| **B. The alternative** | the withdrawal goes through (50 plus 0.50 fee) and balance becomes 49.5 |

**The plan may require the opposite:** “Customers can withdraw funds from an account.” (P-004); “Each withdrawal is charged a fee of 1% of the amount, with a minimum fee of 0.50.” (P-012); “The fee is recorded in the account history as its own entry, separate from the withdrawal.” (P-013)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-007 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-007 --decision reject --expected "<what should happen>" --by <you>`

#### B-010 · A deposit that rounds to zero cents is accepted and records a 0 entry

> Given a new Ledger  
> When 0.004 is deposited into 'a' with txn 'd1'  
> Then result is ok, balance is 0 and one deposit entry of amount 0 is recorded

| | |
|---|---|
| **A. What the code does** | result is ok, balance is 0 and one deposit entry of amount 0 is recorded |
| **B. The alternative** | the deposit is rejected as amount-too-small and no entry is recorded |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-010 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-010 --decision reject --expected "<what should happen>" --by <you>`

#### B-011 · Entries returns a copy that cannot change the ledger

> Given 100 has been deposited into 'a'  
> When the list returned by entries('a') is emptied by the caller  
> Then entries('a') still returns 1 entry

| | |
|---|---|
| **A. What the code does** | entries('a') still returns 1 entry |
| **B. The alternative** | the ledger history is emptied too and entries('a') returns 0 entries |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-011 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-011 --decision reject --expected "<what should happen>" --by <you>`

#### B-013 · Foreign deposit converted value is rounded to nearest cent: 10 at 0.12345 credits 1.23

> Given a new Ledger  
> When depositForeign('a', 10, 0.12345, 'f1')  
> Then balance is 1.23

| | |
|---|---|
| **A. What the code does** | balance is 1.23 |
| **B. The alternative** | the converted value is rounded up and balance is 1.24 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-013 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-013 --decision reject --expected "<what should happen>" --by <you>`

#### B-014 · Foreign deposit with zero rate or non-positive amount is invalid-amount

> Given a new Ledger  
> When depositForeign is called with amount 10 and rate 0, and with amount -1 and rate 1.5  
> Then both return {ok:false, reason:'invalid-amount'} and balance stays 0

| | |
|---|---|
| **A. What the code does** | both return {ok:false, reason:'invalid-amount'} and balance stays 0 |
| **B. The alternative** | a zero rate is accepted and credits 0 with ok |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-014 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-014 --decision reject --expected "<what should happen>" --by <you>`

#### B-015 · Foreign deposit that converts to under half a cent is rejected as amount-too-small and does not use up the txnId

> Given a new Ledger  
> When depositForeign('a', 0.004, 1, 'f1') and then deposit('a', 5, 'f1')  
> Then the foreign deposit returns {ok:false, reason:'amount-too-small'}; the later deposit with 'f1' goes through and balance is 5

| | |
|---|---|
| **A. What the code does** | the foreign deposit returns {ok:false, reason:'amount-too-small'}; the later deposit with 'f1' goes through and balance is 5 |
| **B. The alternative** | the foreign deposit is accepted with ok (crediting 0) |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-015 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-015 --decision reject --expected "<what should happen>" --by <you>`

#### B-017 · Small withdrawal is charged the minimum fee of 0.50

> Given account 'a' has 100  
> When 10 is withdrawn with txn 'w1'  
> Then result is ok, balance is 89.5 and the withdrawal entry amount is 10.5 (amount plus fee)

| | |
|---|---|
| **A. What the code does** | result is ok, balance is 89.5 and the withdrawal entry amount is 10.5 (amount plus fee) |
| **B. The alternative** | only the 1% fee of 0.10 is charged and balance is 89.9 |

**The plan may require the opposite:** “The fee is recorded in the account history as its own entry, separate from the withdrawal.” (P-013)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-017 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-017 --decision reject --expected "<what should happen>" --by <you>`

#### B-018 · Withdrawal fee is 1% of the amount: withdrawing 100 costs 1.00

> Given account 'a' has 1000  
> When 100 is withdrawn  
> Then balance is 899

| | |
|---|---|
| **A. What the code does** | balance is 899 |
| **B. The alternative** | the minimum fee of 0.50 is charged and balance is 899.5 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-018 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-018 --decision reject --expected "<what should happen>" --by <you>`

#### B-019 · At exactly 50 withdrawn the 1% fee equals the minimum 0.50

> Given account 'a' has 100  
> When 50 is withdrawn  
> Then balance is 49.5

| | |
|---|---|
| **A. What the code does** | balance is 49.5 |
| **B. The alternative** | the fee is rounded up to 0.51 and balance is 49.49 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-019 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-019 --decision reject --expected "<what should happen>" --by <you>`

#### B-020 · Fractional-cent fees are rounded up: withdrawing 50.01 costs 0.51

> Given account 'a' has 100  
> When 50.01 is withdrawn  
> Then the fee is 0.51 and balance is 49.48

| | |
|---|---|
| **A. What the code does** | the fee is 0.51 and balance is 49.48 |
| **B. The alternative** | the fee is rounded to nearest/down at 0.50 and balance is 49.49 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-020 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-020 --decision reject --expected "<what should happen>" --by <you>`

#### B-021 · Withdrawal fee is capped at 25.00

> Given account 'a' has 10000  
> When 3000 is withdrawn  
> Then the fee is 25 (not 30) and balance is 6975

| | |
|---|---|
| **A. What the code does** | the fee is 25 (not 30) and balance is 6975 |
| **B. The alternative** | the uncapped 1% fee of 30 is charged and balance is 6970 |

**The plan may require the opposite:** “Each withdrawal is charged a fee of 1% of the amount, with a minimum fee of 0.50.” (P-012)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-021 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-021 --decision reject --expected "<what should happen>" --by <you>`

#### B-022 · Fee cap boundary: 2500 costs 25.00 and 2500.01 still costs 25.00

> Given two accounts 'a' and 'b' each with 10000  
> When 2500 is withdrawn from 'a' and 2500.01 from 'b'  
> Then 'a' balance is 7475 and 'b' balance is 7474.99

| | |
|---|---|
| **A. What the code does** | 'a' balance is 7475 and 'b' balance is 7474.99 |
| **B. The alternative** | 2500.01 is charged a 25.01 fee and 'b' balance is 7474.98 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-022 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-022 --decision reject --expected "<what should happen>" --by <you>`

#### B-023 · Withdrawal can use the whole balance including the fee

> Given account 'a' has 10.50  
> When 10 is withdrawn  
> Then result is ok and balance is 0

| | |
|---|---|
| **A. What the code does** | result is ok and balance is 0 |
| **B. The alternative** | it is rejected as insufficient-funds and balance stays 10.5 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-023 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-023 --decision reject --expected "<what should happen>" --by <you>`

#### B-024 · Withdrawal is refused when balance covers the amount but not the fee

> Given account 'a' has 10.49  
> When 10 is withdrawn  
> Then result is {ok:false, reason:'insufficient-funds'} and balance stays 10.49

| | |
|---|---|
| **A. What the code does** | result is {ok:false, reason:'insufficient-funds'} and balance stays 10.49 |
| **B. The alternative** | the withdrawal is accepted and balance becomes -0.01 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-024 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-024 --decision reject --expected "<what should happen>" --by <you>`

#### B-025 · Withdrawal from an account that was never funded is insufficient-funds

> Given a new Ledger  
> When 1 is withdrawn from 'ghost'  
> Then result is {ok:false, reason:'insufficient-funds'} and balance is 0

| | |
|---|---|
| **A. What the code does** | result is {ok:false, reason:'insufficient-funds'} and balance is 0 |
| **B. The alternative** | it is rejected as an unknown account |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-025 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-025 --decision reject --expected "<what should happen>" --by <you>`

#### B-026 · Withdrawal of zero or negative amount is invalid-amount

> Given account 'a' has 100  
> When 0 and then -10 are withdrawn  
> Then both return {ok:false, reason:'invalid-amount'} and balance stays 100

| | |
|---|---|
| **A. What the code does** | both return {ok:false, reason:'invalid-amount'} and balance stays 100 |
| **B. The alternative** | withdrawing 0 is accepted and charges the 0.50 minimum fee, leaving 99.5 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-026 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-026 --decision reject --expected "<what should happen>" --by <you>`

#### B-028 · A refused withdrawal does not use up its txnId

> Given account 'a' has 5 and a withdrawal of 10 with txn 'w1' was refused for insufficient funds  
> When 10 more is deposited and the withdrawal of 10 with 'w1' is retried  
> Then the retry succeeds and balance is 4.5

| | |
|---|---|
| **A. What the code does** | the retry succeeds and balance is 4.5 |
| **B. The alternative** | the retry is treated as a duplicate and balance stays 15 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-028 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-028 --decision reject --expected "<what should happen>" --by <you>`

#### B-029 · Withdrawing exactly the 5000 limit is allowed; one more cent afterwards hits daily-limit

> Given account 'a' has 10000  
> When 5000 is withdrawn, then 0.01 is withdrawn  
> Then the 5000 withdrawal succeeds (balance 4975), the 0.01 withdrawal returns {ok:false, reason:'daily-limit'} and balance stays 4975

| | |
|---|---|
| **A. What the code does** | the 5000 withdrawal succeeds (balance 4975), the 0.01 withdrawal returns {ok:false, reason:'daily-limit'} and balance stays 4975 |
| **B. The alternative** | the 0.01 withdrawal goes through and balance becomes 4974.49 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-029 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-029 --decision reject --expected "<what should happen>" --by <you>`

#### B-030 · A single withdrawal of 5000.01 is refused as daily-limit and does not count toward the limit

> Given account 'a' has 10000  
> When 5000.01 is withdrawn, then 5000 is withdrawn  
> Then the first returns {ok:false, reason:'daily-limit'}; the second succeeds and balance is 4975

| | |
|---|---|
| **A. What the code does** | the first returns {ok:false, reason:'daily-limit'}; the second succeeds and balance is 4975 |
| **B. The alternative** | the 5000.01 withdrawal goes through |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-030 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-030 --decision reject --expected "<what should happen>" --by <you>`

#### B-031 · Daily limit counts withdrawn amounts only, not fees

> Given account 'a' has 10000  
> When 4990 is withdrawn (fee 25), then 10 is withdrawn (fee 0.50)  
> Then both succeed, making exactly 5000 withdrawn, and balance is 4974.5

| | |
|---|---|
| **A. What the code does** | both succeed, making exactly 5000 withdrawn, and balance is 4974.5 |
| **B. The alternative** | the 10 withdrawal is refused as daily-limit because fees count, and balance stays 4985 |

**The plan may require the opposite:** “Balances are kept in whole cents.” (P-010)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-031 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-031 --decision reject --expected "<what should happen>" --by <you>`

#### B-032 · Daily limit is cumulative per account across withdrawals

> Given account 'a' has 10000  
> When 3000 then 2000 then 0.01 are withdrawn  
> Then the first two succeed (balance 4955), the 0.01 returns {ok:false, reason:'daily-limit'}

| | |
|---|---|
| **A. What the code does** | the first two succeed (balance 4955), the 0.01 returns {ok:false, reason:'daily-limit'} |
| **B. The alternative** | the limit is per withdrawal so 0.01 succeeds |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-032 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-032 --decision reject --expected "<what should happen>" --by <you>`

#### B-033 · Insufficient funds is reported before the daily limit

> Given account 'a' has 10  
> When 6000 is withdrawn  
> Then result is {ok:false, reason:'insufficient-funds'}

| | |
|---|---|
| **A. What the code does** | result is {ok:false, reason:'insufficient-funds'} |
| **B. The alternative** | result is {ok:false, reason:'daily-limit'} |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-033 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-033 --decision reject --expected "<what should happen>" --by <you>`

#### B-034 · Daily limit is tracked per account

> Given accounts 'a' and 'b' each have 10000 and 5000 has been withdrawn from 'a'  
> When 5000 is withdrawn from 'b'  
> Then it succeeds and 'b' balance is 4975

| | |
|---|---|
| **A. What the code does** | it succeeds and 'b' balance is 4975 |
| **B. The alternative** | it is refused as daily-limit because the limit is shared |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-034 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-034 --decision reject --expected "<what should happen>" --by <you>`

#### B-035 · Transfer of the whole balance moves money without a fee

> Given account 'a' has 100  
> When 100 is transferred from 'a' to 'b' with txn 't1'  
> Then result is ok, 'a' is 0, 'b' is 100; 'a' gets a 'transfer-out' entry of 100 and 'b' a 'transfer-in' entry of 100

| | |
|---|---|
| **A. What the code does** | result is ok, 'a' is 0, 'b' is 100; 'a' gets a 'transfer-out' entry of 100 and 'b' a 'transfer-in' entry of 100 |
| **B. The alternative** | the transfer is refused as insufficient-funds because a fee applies |

**The plan may require the opposite:** “Each withdrawal is charged a fee of 1% of the amount, with a minimum fee of 0.50.” (P-012)

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-035 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-035 --decision reject --expected "<what should happen>" --by <you>`

#### B-036 · Transfer of more than the balance is refused

> Given account 'a' has 100  
> When 100.01 is transferred from 'a' to 'b'  
> Then result is {ok:false, reason:'insufficient-funds'}; 'a' stays 100 and 'b' stays 0

| | |
|---|---|
| **A. What the code does** | result is {ok:false, reason:'insufficient-funds'}; 'a' stays 100 and 'b' stays 0 |
| **B. The alternative** | the transfer goes through and 'a' becomes -0.01 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-036 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-036 --decision reject --expected "<what should happen>" --by <you>`

#### B-039 · Split of 100 among 3 gives the extra cent to the first recipient

> Given account 'a' has 100  
> When 100 is split from 'a' to ['b','c','d']  
> Then 'b' gets 33.34, 'c' 33.33, 'd' 33.33, 'a' is 0

| | |
|---|---|
| **A. What the code does** | 'b' gets 33.34, 'c' 33.33, 'd' 33.33, 'a' is 0 |
| **B. The alternative** | the extra cent goes to the last recipient: 'b' 33.33, 'c' 33.33, 'd' 33.34 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-039 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-039 --decision reject --expected "<what should happen>" --by <you>`

#### B-040 · Split of 0.05 among 3 gives 0.02, 0.02, 0.01

> Given account 'a' has 1  
> When 0.05 is split from 'a' to ['b','c','d']  
> Then 'b' 0.02, 'c' 0.02, 'd' 0.01; 'a' is 0.95

| | |
|---|---|
| **A. What the code does** | 'b' 0.02, 'c' 0.02, 'd' 0.01; 'a' is 0.95 |
| **B. The alternative** | remaining cents go to the last recipients: 'b' 0.01, 'c' 0.02, 'd' 0.02 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-040 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-040 --decision reject --expected "<what should happen>" --by <you>`

#### B-041 · Split with no recipients is refused

> Given account 'a' has 100  
> When 10 is split from 'a' to []  
> Then result is {ok:false, reason:'no-recipients'} and 'a' stays 100

| | |
|---|---|
| **A. What the code does** | result is {ok:false, reason:'no-recipients'} and 'a' stays 100 |
| **B. The alternative** | the split is accepted as a no-op with ok |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-041 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-041 --decision reject --expected "<what should happen>" --by <you>`

#### B-042 · Split checks amount first, then recipients, then duplicate txnId

> Given account 'a' has 100, deposited with txn 'd1'  
> When split('a', [], 0, 'x') and split('a', [], 10, 'd1') are called  
> Then the first returns reason 'invalid-amount'; the second returns reason 'no-recipients' even though 'd1' was already used

| | |
|---|---|
| **A. What the code does** | the first returns reason 'invalid-amount'; the second returns reason 'no-recipients' even though 'd1' was already used |
| **B. The alternative** | the second is treated as a duplicate and returns ok |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-042 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-042 --decision reject --expected "<what should happen>" --by <you>`

#### B-043 · Split of more than the balance is refused

> Given account 'a' has 10  
> When 10.01 is split from 'a' to ['b','c']  
> Then result is {ok:false, reason:'insufficient-funds'}; 'a' stays 10 and 'b' stays 0

| | |
|---|---|
| **A. What the code does** | result is {ok:false, reason:'insufficient-funds'}; 'a' stays 10 and 'b' stays 0 |
| **B. The alternative** | the split goes through and 'a' becomes -0.01 |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-043 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-043 --decision reject --expected "<what should happen>" --by <you>`

#### B-044 · Split of the exact balance is allowed; repeating its txnId is ignored

> Given account 'a' has 10 and 10 was split to ['b','c'] with txn 's1'  
> When the same split with txn 's1' is repeated  
> Then the first split left 'a' 0, 'b' 5, 'c' 5; the repeat returns ok and nothing changes

| | |
|---|---|
| **A. What the code does** | the first split left 'a' 0, 'b' 5, 'c' 5; the repeat returns ok and nothing changes |
| **B. The alternative** | the repeat is refused as insufficient-funds |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-044 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-044 --decision reject --expected "<what should happen>" --by <you>`

#### B-045 · Interest for a full 365-day year at 5% on 1000 is 50

> Given account 'a' has 1000  
> When applyInterest('a', 5, 365, 'i1')  
> Then result is ok, balance is 1050 with an 'interest' entry of 50

| | |
|---|---|
| **A. What the code does** | result is ok, balance is 1050 with an 'interest' entry of 50 |
| **B. The alternative** | a 360-day year is used and balance is 1050.69 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-045 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-045 --decision reject --expected "<what should happen>" --by <you>`

#### B-046 · Interest is rounded down to the cent: 30 days at 5% on 1000 gives 4.10

> Given account 'a' has 1000  
> When applyInterest('a', 5, 30, 'i1')  
> Then 4.10 is credited (exact 4.1096) and balance is 1004.1

| | |
|---|---|
| **A. What the code does** | 4.10 is credited (exact 4.1096) and balance is 1004.1 |
| **B. The alternative** | interest is rounded to nearest and balance is 1004.11 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-046 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-046 --decision reject --expected "<what should happen>" --by <you>`

#### B-047 · Interest below one cent credits nothing, reports ok, and leaves the txnId unused

> Given account 'a' has 1  
> When applyInterest('a', 1, 1, 'i1') and then deposit('a', 5, 'i1')  
> Then interest returns ok with no entry; the later deposit with 'i1' is applied and balance is 6

| | |
|---|---|
| **A. What the code does** | interest returns ok with no entry; the later deposit with 'i1' is applied and balance is 6 |
| **B. The alternative** | the interest call consumes 'i1' so the deposit is ignored and balance stays 1 |

Where: src/ledger.ts · observed at: readable state

- [ ] A is right: `sd ledger --behaviour B-047 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-047 --decision reject --expected "<what should happen>" --by <you>`

#### B-048 · Interest with zero rate or zero days is invalid-amount

> Given account 'a' has 1000  
> When applyInterest with rate 0 / 30 days, and with rate 5 / 0 days  
> Then both return {ok:false, reason:'invalid-amount'} and balance stays 1000

| | |
|---|---|
| **A. What the code does** | both return {ok:false, reason:'invalid-amount'} and balance stays 1000 |
| **B. The alternative** | they are accepted as no-ops returning ok |

Where: src/ledger.ts · observed at: return value

- [ ] A is right: `sd ledger --behaviour B-048 --decision approve --by <you>`
- [ ] B (or something else) is right: `sd ledger --behaviour B-048 --decision reject --expected "<what should happen>" --by <you>`

## Dropped requirements

#### P-007

> A transfer to the same account is rejected.

Plan line 13. Probe `PR-P-007` fails against the code: AssertionError: expected true to be false // Object.is equality

_The trace had marked this realised (by B-005, B-027, B-038); the probe overrules it._

#### P-013

> The fee is recorded in the account history as its own entry, separate from the withdrawal.

Plan line 22. Probe `PR-P-013` fails against the code: AssertionError: expected [ { txnId: 't1', …(2) }, …(1) ] to have a length of 3 but got 2

Contradicting behaviour(s): B-007, B-017.

#### P-014

> Customers can deposit an amount in a foreign currency together with an exchange rate; the amount is converted at that rate and rounded to the nearest cent, with halves rounded to even.

Plan line 23. Probe `PR-P-014` fails against the code: AssertionError: expected 0.13 to be 0.12 // Object.is equality

_The trace had marked this realised (by B-009, B-010, B-012, B-013); the probe overrules it._

## Leave-one-out: check these

The cited statement was hidden and the tracer still found a source. Either the plan says it twice, or the tracer is over-matching.

- B-005: now cites “A transfer to the same account is rejected.” (P-007)

## Extractor misses

The code does realise these statements, but blind extraction did not describe the behaviour. This is a measure of extraction recall, not a defect in the code.

- P-004: Customers can withdraw funds from an account.
- P-010: Balances are kept in whole cents.
- P-012: Each withdrawal is charged a fee of 1% of the amount, with a minimum fee of 0.50.
