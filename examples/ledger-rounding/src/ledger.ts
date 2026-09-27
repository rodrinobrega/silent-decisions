export type Result = { ok: true } | { ok: false; reason: string };

export interface Entry {
  txnId: string;
  kind: 'deposit' | 'withdrawal' | 'transfer-in' | 'transfer-out' | 'split-in' | 'split-out' | 'interest';
  amount: number;
}

const DAILY_WITHDRAWAL_LIMIT = 5000;
const FEE_PERCENT = 1;
const MIN_FEE_CENTS = 50;
const MAX_FEE_CENTS = 2500;
const DAYS_PER_YEAR = 365;

function toCents(amount: number): number {
  return Math.sign(amount) * Math.round(Math.abs(amount) * 100 + 1e-7);
}

function fromCents(cents: number): number {
  return cents / 100;
}

function withdrawalFee(cents: number): number {
  const fee = Math.ceil((cents * FEE_PERCENT) / 100 - 1e-9);
  return Math.min(MAX_FEE_CENTS, Math.max(MIN_FEE_CENTS, fee));
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
    return fromCents(this.balances.get(account) ?? 0);
  }

  entries(account: string): Entry[] {
    return [...(this.history.get(account) ?? [])];
  }

  deposit(account: string, amount: number, txnId: string): Result {
    if (!(amount > 0)) return { ok: false, reason: 'invalid-amount' };
    if (this.seen.has(txnId)) return { ok: true };
    this.open(account);
    this.credit(account, toCents(amount), txnId, 'deposit');
    this.seen.add(txnId);
    return { ok: true };
  }

  depositForeign(account: string, amount: number, rate: number, txnId: string): Result {
    if (!(amount > 0) || !(rate > 0)) return { ok: false, reason: 'invalid-amount' };
    if (this.seen.has(txnId)) return { ok: true };
    const cents = toCents(amount * rate);
    if (cents <= 0) return { ok: false, reason: 'amount-too-small' };
    this.open(account);
    this.credit(account, cents, txnId, 'deposit');
    this.seen.add(txnId);
    return { ok: true };
  }

  withdraw(account: string, amount: number, txnId: string): Result {
    if (!(amount > 0)) return { ok: false, reason: 'invalid-amount' };
    if (this.seen.has(txnId)) return { ok: true };
    this.open(account);
    const cents = toCents(amount);
    const fee = withdrawalFee(cents);
    if (this.cents(account) - (cents + fee) < 0) return { ok: false, reason: 'insufficient-funds' };
    const used = this.withdrawnToday.get(account) ?? 0;
    if (used + cents > DAILY_WITHDRAWAL_LIMIT * 100) return { ok: false, reason: 'daily-limit' };
    this.withdrawnToday.set(account, used + cents);
    this.debit(account, cents + fee, txnId, 'withdrawal');
    this.seen.add(txnId);
    return { ok: true };
  }

  transfer(from: string, to: string, amount: number, txnId: string): Result {
    if (!(amount > 0)) return { ok: false, reason: 'invalid-amount' };
    if (this.seen.has(txnId)) return { ok: true };
    this.open(from);
    this.open(to);
    const cents = toCents(amount);
    if (this.cents(from) - cents < 0) return { ok: false, reason: 'insufficient-funds' };
    this.debit(from, cents, txnId, 'transfer-out');
    this.credit(to, cents, txnId, 'transfer-in');
    this.seen.add(txnId);
    return { ok: true };
  }

  split(from: string, recipients: string[], amount: number, txnId: string): Result {
    if (!(amount > 0)) return { ok: false, reason: 'invalid-amount' };
    if (recipients.length === 0) return { ok: false, reason: 'no-recipients' };
    if (this.seen.has(txnId)) return { ok: true };
    this.open(from);
    for (const r of recipients) this.open(r);
    const cents = toCents(amount);
    if (this.cents(from) - cents < 0) return { ok: false, reason: 'insufficient-funds' };
    const share = Math.floor(cents / recipients.length);
    const remainder = cents - share * recipients.length;
    this.debit(from, cents, txnId, 'split-out');
    recipients.forEach((r, i) => this.credit(r, share + (i < remainder ? 1 : 0), txnId, 'split-in'));
    this.seen.add(txnId);
    return { ok: true };
  }

  applyInterest(account: string, annualRatePercent: number, days: number, txnId: string): Result {
    if (!(annualRatePercent > 0) || !(days > 0)) return { ok: false, reason: 'invalid-amount' };
    if (this.seen.has(txnId)) return { ok: true };
    this.open(account);
    const exact = (this.cents(account) * annualRatePercent * days) / (100 * DAYS_PER_YEAR);
    const cents = Math.floor(exact + 1e-7);
    if (cents <= 0) return { ok: true };
    this.credit(account, cents, txnId, 'interest');
    this.seen.add(txnId);
    return { ok: true };
  }

  private cents(account: string): number {
    return this.balances.get(account) ?? 0;
  }

  private credit(account: string, cents: number, txnId: string, kind: Entry['kind']): void {
    this.balances.set(account, this.cents(account) + cents);
    this.history.get(account)!.push({ txnId, kind, amount: fromCents(cents) });
  }

  private debit(account: string, cents: number, txnId: string, kind: Entry['kind']): void {
    this.balances.set(account, this.cents(account) - cents);
    this.history.get(account)!.push({ txnId, kind, amount: fromCents(cents) });
  }
}
