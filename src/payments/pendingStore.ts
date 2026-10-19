import AsyncStorage from '@react-native-async-storage/async-storage';

// Remembers the payment that is in flight so that if the app is killed (or the
// phone dies) mid-payment, reopening can resume the "Confirming your payment"
// state instead of leaving the customer guessing. The server is the source of
// truth - this only remembers WHICH order to ask it about.

const KEY = '@payments/pending/v1';

export interface PendingPayment {
  orderId: string;
  attemptId: string;
  startedAt: number;
}

type Store = Record<string, PendingPayment>;

const readAll = async (): Promise<Store> => {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
};

const writeAll = async (store: Store) => {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // best effort - the server still settles the payment either way
  }
};

// Anything older than this is for the reconciliation job, not the UI.
const MAX_AGE_MS = 30 * 60 * 1000;

export const savePending = async (contextKey: string, pending: PendingPayment) => {
  const store = await readAll();
  store[contextKey] = pending;
  await writeAll(store);
};

export const loadPending = async (contextKey: string): Promise<PendingPayment | null> => {
  const store = await readAll();
  const found = store[contextKey];
  if (!found) return null;
  if (Date.now() - found.startedAt > MAX_AGE_MS) {
    delete store[contextKey];
    await writeAll(store);
    return null;
  }
  return found;
};

export const clearPending = async (contextKey: string) => {
  const store = await readAll();
  if (store[contextKey]) {
    delete store[contextKey];
    await writeAll(store);
  }
};

// The customer's chosen way to pay, remembered on this device so the cart can
// show it ("Pay using PhonePe") and next time they aren't asked to choose again.
const SAVED_CHOICE_KEY = '@payments/savedChoice/v2';

export interface SavedChoice {
  method: 'upi_intent' | 'upi_collect' | 'card' | 'netbanking' | 'wallet' | 'cod';
  /** UPI app id / UPI ID / bank id / wallet id. Never card details. */
  refId?: string;
  /** What to show in the cart, e.g. "PhonePe". */
  label: string;
  /** Second line, e.g. "UPI". */
  sub?: string;
}

// Kept under the old name so existing call sites read naturally.
export type LastMethod = SavedChoice;

export const saveLastMethod = async (choice: SavedChoice) => {
  try {
    await AsyncStorage.setItem(SAVED_CHOICE_KEY, JSON.stringify(choice));
  } catch {
    // ignore
  }
};

export const clearSavedChoice = async () => {
  try {
    await AsyncStorage.removeItem(SAVED_CHOICE_KEY);
  } catch {
    // ignore
  }
};

export const loadLastMethod = async (): Promise<SavedChoice | null> => {
  try {
    const raw = await AsyncStorage.getItem(SAVED_CHOICE_KEY);
    return raw ? (JSON.parse(raw) as SavedChoice) : null;
  } catch {
    return null;
  }
};
