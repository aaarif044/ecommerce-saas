import type { CurrencyCode, RegionalSettings } from '@/lib/types';

export interface MoneyFormatOptions {
  currency?: CurrencyCode;
  locale?: string;
  symbol?: string;
  symbolFirst?: boolean;
  decimals?: number;
  compact?: boolean;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
  SGD: 'S$',
};

export function currencySymbol(currency: string, fallback = '₹') {
  return CURRENCY_SYMBOLS[currency] ?? fallback;
}

/**
 * Formats an amount using Intl.NumberFormat, honouring the store's regional
 * preferences (symbol position and decimal places).
 */
export function formatMoney(amount: number, options: MoneyFormatOptions = {}) {
  const { currency = 'INR', locale = 'en-IN', symbol, symbolFirst = true, decimals = 0, compact = false } = options;

  const resolvedSymbol = symbol ?? currencySymbol(currency);
  const value = new Intl.NumberFormat(locale, {
    style: 'decimal',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    notation: compact && Math.abs(amount) >= 100000 ? 'compact' : 'standard',
  }).format(amount);

  return symbolFirst ? `${resolvedSymbol}${value}` : `${value} ${resolvedSymbol}`;
}

export function formatMoneyCompact(amount: number, options: MoneyFormatOptions = {}) {
  return formatMoney(amount, { ...options, compact: true });
}

export function formatPercent(value: number, digits = 1) {
  return `${value.toFixed(digits)}%`;
}

const DATE_STYLES: Record<RegionalSettings['dateFormat'], { locale: string; options: Intl.DateTimeFormatOptions }> = {
  'dd/MM/yyyy': { locale: 'en-GB', options: { day: '2-digit', month: '2-digit', year: 'numeric' } },
  'MM/dd/yyyy': { locale: 'en-US', options: { day: '2-digit', month: '2-digit', year: 'numeric' } },
  'yyyy-MM-dd': { locale: 'en-CA', options: { day: '2-digit', month: '2-digit', year: 'numeric' } },
  'dd MMM yyyy': { locale: 'en-GB', options: { day: '2-digit', month: 'short', year: 'numeric' } },
};

export interface DateFormatOptions {
  dateFormat?: RegionalSettings['dateFormat'];
  timeFormat?: RegionalSettings['timeFormat'];
  timeZone?: string;
  locale?: string;
  withTime?: boolean;
}


export function formatDate(iso: string | Date, options: DateFormatOptions = {}) {
  const { dateFormat = 'dd/MM/yyyy', timeFormat = '12h', timeZone = 'Asia/Kolkata', withTime = false } = options;
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) return '—';

  const style = DATE_STYLES[dateFormat] ?? DATE_STYLES['dd/MM/yyyy'];
  const datePart = new Intl.DateTimeFormat(style.locale, {
    ...style.options,
    timeZone,
  }).format(date);

  if (!withTime) return datePart;

  const timePart = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: timeFormat === '12h',
    timeZone,
  }).format(date);

  return `${datePart}, ${timePart}`;
}

export function formatTime(iso: string | Date, options: DateFormatOptions = {}) {
  const { timeFormat = '12h', timeZone = 'Asia/Kolkata' } = options;
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: timeFormat === '12h',
    timeZone,
  }).format(date);
}

export function formatDateTime(iso: string | Date, options: DateFormatOptions = {}) {
  return formatDate(iso, { ...options, withTime: true });
}

export function formatNumber(value: number, locale = 'en-IN', decimals = 0) {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatWeight(weight: number, unit: 'g' | 'kg' | 'lb' | 'oz') {
  if (unit === 'kg') {
    if (weight >= 1000) return `${(weight / 1000).toFixed(weight % 1000 === 0 ? 0 : 2)} kg`;
    return `${weight} g`;
  }
  if (unit === 'lb') return `${(weight * 0.00220462).toFixed(2)} lb`;
  if (unit === 'oz') return `${(weight * 0.035274).toFixed(2)} oz`;
  return `${weight} g`;
}

export function formatDayLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
}

export function formatMonthLabel(iso: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: '2-digit' }).format(new Date(iso));
}
