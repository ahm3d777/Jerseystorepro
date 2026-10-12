import { describe, expect, it } from 'vitest';
import { computeTotals, isCustomized, normalizeBdPhone, unitPrice, CUSTOMIZATION_FEE, COD_FEE, SHIPPING_FEE } from '../shared/pricing';

describe('pricing', () => {
  it('adds the customisation fee only when a name or number is printed', () => {
    expect(unitPrice(2000, false)).toBe(2000);
    expect(unitPrice(2000, true)).toBe(2000 + CUSTOMIZATION_FEE);
    expect(isCustomized({ name: '  ', number: '' })).toBe(false);
    expect(isCustomized({ name: 'MESSI', number: '' })).toBe(true);
    expect(isCustomized({ name: '', number: '10' })).toBe(true);
    expect(isCustomized(undefined)).toBe(false);
  });

  it('charges shipping up to and including ৳2000, free above', () => {
    expect(computeTotals([{ unitPrice: 2000, quantity: 1 }], 'bkash')).toMatchObject({ shippingFee: SHIPPING_FEE, total: 2100 });
    expect(computeTotals([{ unitPrice: 2001, quantity: 1 }], 'bkash')).toMatchObject({ shippingFee: 0, total: 2001 });
  });

  it('adds the COD handling fee only for cash on delivery', () => {
    const lines = [{ unitPrice: 1280, quantity: 1 }];
    expect(computeTotals(lines, 'cod')).toEqual({ subtotal: 1280, shippingFee: SHIPPING_FEE, codFee: COD_FEE, total: 1430 });
    expect(computeTotals(lines, 'sslcommerz').codFee).toBe(0);
  });

  it('normalises Bangladeshi mobile numbers', () => {
    expect(normalizeBdPhone('+880 1712-345678')).toBe('01712345678');
    expect(normalizeBdPhone('8801912345678')).toBe('01912345678');
    expect(normalizeBdPhone('01212345678')).toBeNull(); // 012 is not a mobile prefix
    expect(normalizeBdPhone('0171234567')).toBeNull();
  });
});
