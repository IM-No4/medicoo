import { StyleSheet } from 'react-native';

import type { ThemeColors } from '../../theme/colors';

// Shared by the Calendar screens/sections. Built from the active theme so the
// screen background, text and cards follow Light/Dark.
export const createStyles = (c: ThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.background,
    // No top padding here - CalendarHeader carries its own safe-area top
    // inset as part of its header bar, same as the Records/Health
    // screen headers, so the bar itself extends flush under the status bar.
    paddingBottom: 60,
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 18,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: c.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: c.text,
  },

  // Small inline "Manage" button used next to a section title (e.g.
  // Medications, matching the Active Goals section's own manage button).
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: c.primaryBg,
  },
  manageBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: c.primary,
  },

  // Helper for small text headers like "Morning"
  subSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    marginBottom: 12,
    marginTop: 8,
  },
  subSectionTitle: {
    fontSize: 14,
    color: c.textSecondary,
    marginLeft: 8,
  }
});
