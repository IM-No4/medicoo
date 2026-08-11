// Local (device-timezone) date as YYYY-MM-DD - deliberately NOT
// `date.toISOString().split('T')[0]`, which is UTC and can land on the
// wrong calendar day depending on timezone/time of day (e.g. after 6:30pm
// IST, UTC has already rolled over to tomorrow). Calendar data is keyed by
// this local date server-side, so every screen must compute "today" the
// same way or a mismatched fetch silently overwrites another day's data.
export const getLocalDateString = (date: Date = new Date()): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
