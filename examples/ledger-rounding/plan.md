# Plan: account ledger with fees, interest and currency

## Scope

Build an in-memory ledger for customer accounts. Use TypeScript with no runtime dependencies.

## Requirements

- Customers can deposit funds into an account.
- Customers can withdraw funds from an account.
- An amount must be a positive number, otherwise the operation is rejected.
- Customers can transfer funds between two accounts.
- A transfer to the same account is rejected.
- Every accepted operation is recorded in the account history.
- Each operation carries a client-supplied transaction id so that retries are safe.

## Money

- Balances are kept in whole cents.
- An amount with more than two decimals is rounded to the nearest cent, with halves rounded away from zero.
- Each withdrawal is charged a fee of 1% of the amount, with a minimum fee of 0.50.
- The fee is recorded in the account history as its own entry, separate from the withdrawal.
- Customers can deposit an amount in a foreign currency together with an exchange rate; the amount is converted at that rate and rounded to the nearest cent, with halves rounded to even.
- Interest can be credited to an account for a number of days at an annual rate, computed on the current balance with a 365-day year.
- A split payment divides an amount evenly between several recipient accounts.

## Out of scope

Persistence, authentication, exchange-rate lookup.
