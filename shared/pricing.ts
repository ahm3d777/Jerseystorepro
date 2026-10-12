/**
 * Single source of truth for store pricing rules.
 * Imported by the storefront (to display totals) AND the Worker (to charge them),
 * so the number the customer sees is always the number the gateway is asked for.
 */

export const CUSTOMIZATION_FEE = 800;
export const SHIPPING_FEE = 100;
export const FREE_SHIPPING_THRESHOLD = 2000; // subtotal strictly above this ships free
export const COD_FEE = 50;
export const MAX_QTY_PER_LINE = 10;

export type PaymentMethod = 'bkash' | 'sslcommerz' | 'cod';
export const PAYMENT_METHODS: PaymentMethod[] = ['bkash', 'sslcommerz', 'cod'];

export const isCustomized = (c?: { name?: string | null; number?: string | null } | null) =>
  Boolean(c && (c.name?.trim() || c.number?.trim()));

export const unitPrice = (basePrice: number, customized: boolean) =>
  basePrice + (customized ? CUSTOMIZATION_FEE : 0);

export const shippingFor = (subtotal: number) => (subtotal > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE);

export function computeTotals(lines: { unitPrice: number; quantity: number }[], method: PaymentMethod) {
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const shippingFee = subtotal === 0 ? 0 : shippingFor(subtotal);
  const codFee = method === 'cod' ? COD_FEE : 0;
  return { subtotal, shippingFee, codFee, total: subtotal + shippingFee + codFee };
}

export const BD_DISTRICTS = [
  'Bagerhat', 'Bandarban', 'Barguna', 'Barishal', 'Bhola', 'Bogura', 'Brahmanbaria', 'Chandpur',
  'Chapai Nawabganj', 'Chattogram', 'Chuadanga', "Cox's Bazar", 'Cumilla', 'Dhaka', 'Dinajpur',
  'Faridpur', 'Feni', 'Gaibandha', 'Gazipur', 'Gopalganj', 'Habiganj', 'Jamalpur', 'Jashore',
  'Jhalokathi', 'Jhenaidah', 'Joypurhat', 'Khagrachhari', 'Khulna', 'Kishoreganj', 'Kurigram',
  'Kushtia', 'Lakshmipur', 'Lalmonirhat', 'Madaripur', 'Magura', 'Manikganj', 'Meherpur',
  'Moulvibazar', 'Munshiganj', 'Mymensingh', 'Naogaon', 'Narail', 'Narayanganj', 'Narsingdi',
  'Natore', 'Netrokona', 'Nilphamari', 'Noakhali', 'Pabna', 'Panchagarh', 'Patuakhali',
  'Pirojpur', 'Rajbari', 'Rajshahi', 'Rangamati', 'Rangpur', 'Satkhira', 'Shariatpur',
  'Sherpur', 'Sirajganj', 'Sunamganj', 'Sylhet', 'Tangail', 'Thakurgaon',
];

/** Bangladeshi mobile: 01[3-9]XXXXXXXX, optionally prefixed with +88 / 88. Returns normalised 11-digit form or null. */
export function normalizeBdPhone(input: string): string | null {
  const digits = input.replace(/[\s-]/g, '').replace(/^\+?88/, '');
  return /^01[3-9]\d{8}$/.test(digits) ? digits : null;
}

export const ORDER_STATUSES = ['pending_payment', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = 'unpaid' | 'paid' | 'failed' | 'cancelled' | 'refunded';
