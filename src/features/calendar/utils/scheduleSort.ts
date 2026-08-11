// Appointments store time as 24h "HH:MM" (e.g. "13:45") while medicine
// schedules store 12h "HH:MM AM/PM" (e.g. "08:00 AM") - this normalizes
// either into minutes-since-midnight so each list can be sorted by
// time-of-day.
export const timeToMinutes = (time?: string): number => {
  if (!time) return 0;
  const ampm = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    let hours = parseInt(ampm[1], 10);
    const minutes = parseInt(ampm[2], 10);
    const period = ampm[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};
