// Ledger implementation, per the plan: deposits, withdrawals, transfers.
export type Result = { ok: true } | { ok: false; reason: string };

export interface Entry {
  txnId: string;
  kind: 'deposit' | 'withdrawal' | 'transfer-in' | 'transfer-out';
  amount: number;
}

const DAILY_WITHDRAWAL_LIMIT = 5000;

/** Rounds to cents. The plan does not say how; half-up seemed sensible. */
function toCents(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export class Ledger {
  private balances = new Map<string, number>();
  private history = new Map<string, Entry[]>();
  private seen = new Set<string>();
  private withdrawnToday = new Map<string, number>();

  open(account: string): void {
    if (!this.balances.has(account)) {
      this.balances.set(account, 0);
      this.history.set(account, []);
    }
  }

  balance(account: string): number {
    return this.balances.get(account) ?? 0;
  }

  entries(account: string): Entry[] {
    return [...(this.history.get(account) ?? [])];
  }

  deposit(account: string, amount: number, txnId: string): Result {
    if (!(amount > 0)) return { ok: false, reason: 'invalid-amount' };
    // Retries are safe: a repeated id is acknowledged and ignored.
    if (this.seen.has(txnId)) return { ok: true };
    this.open(account);
    const value = toCents(amount);
    this.balances.set(account, this.balance(account) + value);
    this.history.get(account)!.push({ txnId, kind: 'deposit', amount: value });
    this.seen.add(txnId);
    return { ok: true };
  }

  withdraw(account: string, amount: number, txnId: string): Result {
    if (!(amount > 0)) return { ok: false, reason: 'invalid-amount' };
    if (this.seen.has(txnId)) return { ok: true };
    this.open(account);
    const value = toCents(amount);
    /* No overdrafts: the plan is silent, so we do not allow them. */
    if (this.balance(account) - value < 0) return { ok: false, reason: 'insufficient-funds' };
    const used = this.withdrawnToday.get(account) ?? 0;
    if (used + value > DAILY_WITHDRAWAL_LIMIT) return { ok: false, reason: 'daily-limit' };
    this.withdrawnToday.set(account, used + value);
    this.balances.set(account, this.balance(account) - value);
    this.history.get(account)!.push({ txnId, kind: 'withdrawal', amount: value });
    this.seen.add(txnId);
    return { ok: true };
  }

  transfer(from: string, to: string, amount: number, txnId: string): Result {
    if (!(amount > 0)) return { ok: false, reason: 'invalid-amount' };
    if (this.seen.has(txnId)) return { ok: true };
    this.open(from);
    this.open(to);
    const value = toCents(amount);
    if (this.balance(from) - value < 0) return { ok: false, reason: 'insufficient-funds' };
    this.balances.set(from, this.balance(from) - value);
    this.balances.set(to, this.balance(to) + value);
    this.history.get(from)!.push({ txnId, kind: 'transfer-out', amount: value });
    this.history.get(to)!.push({ txnId, kind: 'transfer-in', amount: value });
    this.seen.add(txnId);
    return { ok: true };
  }
}
