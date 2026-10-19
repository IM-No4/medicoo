import type { Bank, Wallet } from './types';

// Neutral catalogue: the app picks by `id`, and each gateway adapter uses its
// own code. Cashfree codes: Cashfree docs ("Netbanking code and names").
// Razorpay codes: Razorpay netbanking bank codes. Banks whose code on either
// gateway is unconfirmed are simply left out rather than guessed.
export const POPULAR_BANK_IDS = ['sbi', 'hdfc', 'icici', 'axis', 'kotak', 'yes', 'pnb', 'bob'];

export const BANKS: Bank[] = [
  { id: 'sbi', name: 'State Bank of India', cashfree: '3044', razorpay: 'SBIN' },
  { id: 'hdfc', name: 'HDFC Bank', cashfree: '3021', razorpay: 'HDFC' },
  { id: 'icici', name: 'ICICI Bank', cashfree: '3022', razorpay: 'ICIC' },
  { id: 'axis', name: 'Axis Bank', cashfree: '3003', razorpay: 'UTIB' },
  { id: 'kotak', name: 'Kotak Mahindra Bank', cashfree: '3032', razorpay: 'KKBK' },
  { id: 'yes', name: 'Yes Bank', cashfree: '3058', razorpay: 'YESB' },
  { id: 'pnb', name: 'Punjab National Bank', cashfree: '3038', razorpay: 'PUNB_R' },
  { id: 'bob', name: 'Bank of Baroda', cashfree: '3005', razorpay: 'BARB_R' },
  { id: 'canara', name: 'Canara Bank', cashfree: '3009', razorpay: 'CNRB' },
  { id: 'idfc', name: 'IDFC First Bank', cashfree: '3024', razorpay: 'IDFB' },
  { id: 'indusind', name: 'IndusInd Bank', cashfree: '3028', razorpay: 'INDB' },
  { id: 'union', name: 'Union Bank of India', cashfree: '3055', razorpay: 'UBIN' },
  { id: 'federal', name: 'Federal Bank', cashfree: '3020', razorpay: 'FDRL' },
  { id: 'boi', name: 'Bank of India', cashfree: '3006', razorpay: 'BKID' },
  { id: 'idbi', name: 'IDBI Bank', cashfree: '3023', razorpay: 'IBKL' },
  { id: 'indian', name: 'Indian Bank', cashfree: '3026', razorpay: 'IDIB' },
];

// Wallets are Razorpay-only (Cashfree's SDK has no consumer wallets).
export const WALLETS: Wallet[] = [
  { id: 'phonepe', name: 'PhonePe', razorpay: 'phonepe' },
  { id: 'paytm', name: 'Paytm', razorpay: 'paytm' },
  { id: 'amazon', name: 'Amazon Pay', razorpay: 'amazonpay' },
  { id: 'freecharge', name: 'Freecharge', razorpay: 'freecharge' },
  { id: 'mobikwik', name: 'MobiKwik', razorpay: 'mobikwik' },
  { id: 'airtel', name: 'Airtel Money', razorpay: 'airtelmoney' },
  { id: 'jio', name: 'JioMoney', razorpay: 'jiomoney' },
  { id: 'ola', name: 'Ola Money', razorpay: 'olamoney' },
  { id: 'payzapp', name: 'PayZapp', razorpay: 'payzapp' },
];
