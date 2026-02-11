import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  /* ---------- Layout ---------- */
  stepContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  iconHeader: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },

  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F2FE', // Light Blue background for anchor? Or keep consistent color?
    // User requested "same color". Home uses colorful icons. 
    // Let's keep the dynamic background color but maybe lighter/pastel if suitable?
    // Actually, stick to the `data.color` logic but ensuring icons contrast.
    // If we use LIGHT theme, maybe we need dark icons on light circles?
    // Or keep bold colors.
    // Let's keep bold colors but ensure surrounding is white.
    justifyContent: 'center',
    alignItems: 'center',
    // Shadow for depth on white bg
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  iconCircleSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  /* ---------- Text ---------- */
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827', // Dark text
    marginBottom: 8,
    textAlign: 'center',
  },

  stepSubtitle: {
    fontSize: 16,
    color: '#6B7280', // Grey text
    marginBottom: 32,
    textAlign: 'center',
    display: 'none',
  },

  /* ---------- Option Cards (Medication Type) ---------- */
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F3F4F6', // Light Grey
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  optionCardSelected: {
    backgroundColor: '#ECFDF5', // Light Green
    borderColor: '#2FA561',
  },

  optionText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },

  optionTextSelected: {
    color: '#065F46', // Dark Green
    fontWeight: '600',
  },

  optionHint: {
    fontSize: 13,
    color: '#9CA3AF',
  },

  /* ---------- Inputs ---------- */
  inputGroup: {
    marginBottom: 16,
  },

  inputLabel: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 6,
  },

  input: {
    backgroundColor: '#F9FAFB',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    fontSize: 17,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  /* ---------- Modal Structure ---------- */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF', // White Background
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '95%',
    overflow: 'hidden', // For header gradient
  },
  modalHeader: {
    paddingTop: 16,
    paddingBottom: 24, // More space for Gradient Header
    paddingHorizontal: 20,
    borderBottomWidth: 0,
    backgroundColor: 'transparent', // Handled by LinearGradient in component
    zIndex: 10,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: '#E5E7EB', // Light Grey
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827', // Dark
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280', // Grey
    marginTop: 2,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6', // Light Grey
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonPlaceholder: {
    width: 36,
    height: 36,
  },
  content: {
    flex: 1,
  },

  /* ---------- List Groups ---------- */
  sectionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 4,
    marginBottom: 12,
    marginTop: 24,
  },
  listGroup: {
    backgroundColor: '#F3F4F6', // Light Grey card
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  listItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listItemPressed: {
    backgroundColor: '#E5E7EB',
  },
  listItemText: {
    fontSize: 17,
    color: '#1F2937',
  },
  listItemTextSelected: {
    color: '#2FA561',
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginLeft: 16,
  },

  /* ---------- Rows & Details ---------- */
  simpleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  simpleRowText: {
    fontSize: 17,
    color: '#1F2937',
  },
  linkText: {
    fontSize: 17,
    color: '#2FA561', // Green Link
    fontWeight: '500',
  },

  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F3F4F6',
  },
  timePill: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 'auto',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  timePillText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  dosageText: {
    color: '#6B7280',
    fontSize: 16,
    marginLeft: 'auto',
  },

  helperText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 24,
    marginLeft: 4,
    lineHeight: 20,
  },

  durationRow: {
    flexDirection: 'row',
    padding: 16,
  },
  durationCol: {
    flex: 1,
  },
  durationLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  durationValue: {
    fontSize: 17,
    color: '#1F2937',
    fontWeight: '500',
  },

  /* ---------- Colors ---------- */
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: '#2FA561', // Green ring for selection? 
    // Or Keep white ring if dot is dark? 
    // If dot is white, ring should be dark.
    // Let's use subtle grey ring or sticking to old style if possible.
    // borderColor: '#111827',
  },
  colorLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    marginTop: 8,
  },

  /* ---------- Footer ---------- */
  fixedFooter: {
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    // ensure it's above the keyboard
    justifyContent: 'flex-end',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  primaryButton: {
    backgroundColor: '#2FA561', // Green
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 2
  },
  primaryButtonActive: {
    backgroundColor: '#0E7439',
  },
  primaryButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 10,
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 17,
    fontWeight: '500',
  },

  /* ---------- Shapes Grid ---------- */
  shapeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'center',
    marginBottom: 24,
  },
  shapeItem: {
    alignItems: 'center',
    gap: 8,
  },
  shapeCircleBlue: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6', // Light grey for unselected
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  shapeCircleSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: '#2FA561',
    borderWidth: 2,
  },
});
