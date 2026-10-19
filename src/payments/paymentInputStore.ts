import type { MethodInput } from './types';

// The method the customer picked on the options screen, handed to the processing
// screen in memory only. Navigation params can be persisted or logged; card
// details must never be, so nothing about the method travels that way.
let pending: MethodInput | null = null;

export const setPendingInput = (input: MethodInput) => {
  pending = input;
};

/** Takes the input (and forgets it) - a card number is held for as short a time as possible. */
export const takePendingInput = (): MethodInput | null => {
  const input = pending;
  pending = null;
  return input;
};
