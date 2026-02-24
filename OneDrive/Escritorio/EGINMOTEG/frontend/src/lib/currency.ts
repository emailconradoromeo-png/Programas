const RATES: Record<string, Record<string, number>> = {
  XAF: { EUR: 0.00152, USD: 0.00166, XAF: 1 },
  EUR: { XAF: 655.957, USD: 1.09, EUR: 1 },
  USD: { XAF: 601.80, EUR: 0.917, USD: 1 },
};

export function convertCurrency(amount: number, from: string, to: string): number {
  if (from === to) return amount;
  return amount * (RATES[from]?.[to] || 1);
}

export function formatCurrency(amount: number, currency: string): string {
  const formatters: Record<string, Intl.NumberFormat> = {
    XAF: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }),
    EUR: new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }),
    USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
  };
  return formatters[currency]?.format(amount) || `${amount} ${currency}`;
}
