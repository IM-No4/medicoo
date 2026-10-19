// Booking started from a family member's page ("Book a doctor") should already be "for" that member when the request sheet opens, even
// though it opens several screens later (doctor list -> doctor -> sheet). This remembers the choice until the sheet takes it.

export interface PreferredBookingMember {
  memberId: string;
  name: string;
  hasAccount: boolean;
}

let preferred: (PreferredBookingMember & { at: number }) | null = null;
// Forgotten after this long, so an abandoned booking cannot pre-select someone for a booking made much later.
const REMEMBER_MS = 15 * 60 * 1000;

export const setPreferredBookingMember = (member: PreferredBookingMember | null) => {
  preferred = member ? { ...member, at: Date.now() } : null;
};

/** Read and clear the remembered member (the sheet takes it once). */
export const takePreferredBookingMember = (): PreferredBookingMember | null => {
  const member = preferred;
  preferred = null;
  if (!member || Date.now() - member.at > REMEMBER_MS) return null;
  return { memberId: member.memberId, name: member.name, hasAccount: member.hasAccount };
};
