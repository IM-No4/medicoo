import { StyleSheet } from 'react-native';

export const COLORS = {
  primary: '#0FBBA1',
  background: '#F8F9FE',
  card: '#FFFFFF',
  text: '#1D1D21',
  textSecondary: '#8F9BB3',
  success: '#0FBBA1',
  danger: '#FF4D4D',
  lightTeal: '#F0FDF4',
};

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    // No top padding here - CalendarHeader carries its own safe-area top
    // inset as part of its white header bar, same as the Records/Health
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
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Small inline "Manage" button used next to a section title (e.g.
  // Medications, matching the Active Goals section's own manage button).
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: COLORS.lightTeal,
  },
  manageBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
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
    color: COLORS.textSecondary,
    marginLeft: 8,
  }
});