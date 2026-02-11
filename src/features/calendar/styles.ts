import { Platform, StatusBar, StyleSheet } from 'react-native';

export const COLORS = {
  primary: '#2FA561',
  background: '#F8F9FE',
  card: '#FFFFFF',
  text: '#1D1D21',
  textSecondary: '#8F9BB3',
  success: '#2FA561',
  danger: '#FF4D4D',
  lightTeal: '#F0FDF4',
};

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    // Dynamically set padding for Android Status Bar
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Buttons
  addButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },

  // Helper for small text headers like "Morning"
  subSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 12,
    marginTop: 8,
  },
  subSectionTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
  }
});