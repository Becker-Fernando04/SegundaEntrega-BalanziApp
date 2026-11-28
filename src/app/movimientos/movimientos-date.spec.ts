import { describe, expect, it } from 'vitest';
import { estaDentroDelUltimoAno } from './movimientos-date';

describe('estaDentroDelUltimoAno', () => {
  const referencia = new Date(2026, 10, 27, 18);

  it('classifies transactions older than one year as history', () => {
    expect(estaDentroDelUltimoAno('2025-11-26', referencia)).toBe(false);
  });

  it('keeps transactions within the last year among recent transactions', () => {
    expect(estaDentroDelUltimoAno('2025-11-27', referencia)).toBe(true);
    expect(estaDentroDelUltimoAno('2026-06-15', referencia)).toBe(true);
  });

  it('supports legacy relative and month-only dates', () => {
    expect(estaDentroDelUltimoAno('Ayer, 11:15', referencia)).toBe(true);
    expect(estaDentroDelUltimoAno('15 Nov', referencia)).toBe(true);
  });
});
