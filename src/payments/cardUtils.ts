// Card form helpers - pure functions, no SDK needed, so they work whichever
// gateway ends up taking the payment.

export type CardNetwork = 'visa' | 'mastercard' | 'amex' | 'rupay' | 'diners' | 'discover' | 'unknown';

const digitsOnly = (v: string) => v.replace(/\D/g, '');

export const detectNetwork = (raw: string): CardNetwork => {
  const n = digitsOnly(raw);
  if (/^4/.test(n)) return 'visa';
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';
  // RuPay: 60, 65, 81, 82, 508 ranges
  if (/^(60|65|81|82|508)/.test(n)) return 'rupay';
  if (/^(30[0-5]|36|38|39)/.test(n)) return 'diners';
  if (/^(6011|64[4-9])/.test(n)) return 'discover';
  return 'unknown';
};

export const NETWORK_LABEL: Record<CardNetwork, string> = {
  visa: 'VISA',
  mastercard: 'Mastercard',
  amex: 'AMEX',
  rupay: 'RuPay',
  diners: 'Diners',
  discover: 'Discover',
  unknown: '',
};

export const maxLength = (network: CardNetwork): number => (network === 'amex' ? 15 : network === 'diners' ? 14 : 16);
export const cvvLength = (network: CardNetwork): number => (network === 'amex' ? 4 : 3);

/** Groups digits for display: 4-4-4-4, or 4-6-5 for AMEX. */
export const formatNumber = (raw: string): string => {
  const n = digitsOnly(raw);
  const network = detectNetwork(n);
  const limited = n.slice(0, maxLength(network));
  if (network === 'amex') {
    return [limited.slice(0, 4), limited.slice(4, 10), limited.slice(10, 15)].filter(Boolean).join(' ');
  }
  return limited.replace(/(.{4})/g, '$1 ').trim();
};

export const luhnValid = (raw: string): boolean => {
  const n = digitsOnly(raw);
  if (n.length < 12) return false;
  let sum = 0;
  let double = false;
  for (let i = n.length - 1; i >= 0; i -= 1) {
    let d = Number(n[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
};

export const formatExpiry = (raw: string): string => {
  const d = digitsOnly(raw).slice(0, 4);
  if (d.length === 0) return '';
  // a leading digit above 1 can only be a month with a leading zero
  if (d.length === 1 && Number(d) > 1) return `0${d}/`;
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export const expiryValid = (value: string, now = new Date()): boolean => {
  const m = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  // valid through the last day of the expiry month
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  return endOfMonth.getTime() >= now.getTime();
};

export interface CardForm {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
}

export type CardErrors = Partial<Record<keyof CardForm, string>>;

export const validateCard = (form: CardForm): CardErrors => {
  const errors: CardErrors = {};
  const network = detectNetwork(form.number);
  if (!luhnValid(form.number)) errors.number = 'Enter a valid card number';
  if (form.name.trim().length < 2) errors.name = 'Enter the name on the card';
  if (!expiryValid(form.expiry)) errors.expiry = 'Enter a valid expiry (MM/YY)';
  if (digitsOnly(form.cvv).length !== cvvLength(network)) errors.cvv = `Enter the ${cvvLength(network)}-digit CVV`;
  return errors;
};
