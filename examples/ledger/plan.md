# Plan: a small account ledger

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

## Out of scope

Persistence, currencies, authentication.
