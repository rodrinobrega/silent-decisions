// Implementer's own tests. Must never reach the clean room.
import { test, expect } from 'vitest';
import { Ledger } from './ledger';
test('deposit works as the plan requires', () => { const l = new Ledger(); l.deposit('a', 10, 't1'); expect(l.balance('a')).toBe(10); });
