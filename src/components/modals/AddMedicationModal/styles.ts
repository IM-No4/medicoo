import { Platform, StyleSheet } from 'react-native';

// A soft shadow on every single option card, input, and list group in an
// 8-step wizard added up to a lot of visual noise at once - a plain 1px
// border reads as the same "defined white surface on a light grey screen"
// without the piled-up shadow weight, same idea as the offline home
// screen's cards (also borders, no shadow).
const CARD_BORDER = {
  borderWidth: 1,
  borderColor: '#E5E7EB',
};

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
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

  // Solid-colored circle + centered icon, white shadow-lifted off the
  // background - same recipe as the Medo avatar (AIAssistantChatScreen)
  // and the field icons on LogVitalsScreen, used here for both the
  // decorative per-step icon and the live medication color/shape preview.
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },

  stepSubtitle: {
    fontSize: 16,
    color: '#6B7280',
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
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    ...CARD_BORDER,
  },

  optionCardSelected: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#0FBBA1',
  },

  optionText: {
    fontSize: 15,
    color: '#1F2937',
    flex: 1,
  },

  optionTextSelected: {
    color: '#065F46',
    fontWeight: '600',
  },

  optionHint: {
    fontSize: 12,
    color: '#9CA3AF',
  },

  /* ---------- Inputs ---------- */
  inputGroup: {
    marginBottom: 16,
  },

  inputLabel: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 6,
  },

  input: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    fontSize: 15,
    color: '#111827',
    borderWidth: 1,
    // Slate, not the same flat gray as the cards/list groups - a slightly
    // cooler, more deliberate tone for the one element people actually type
    // into. Lighter shade (slate-200) than the first pass (slate-300) -
    // still visibly slate, just not as heavy an outline.
    borderColor: '#E2E8F0',
  },

  /* ---------- Header - same recipe as the rest of the app: white bar +
     shadow, plain icon back button, fontSize 20/600/#111827 title. ---------- */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: '#fff',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#0FBBA1',
  },
  content: {
    flex: 1,
  },

  /* ---------- List Groups ---------- */
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 4,
    marginBottom: 12,
    marginTop: 24,
  },
  listGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
    ...CARD_BORDER,
  },
  listItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listItemPressed: {
    backgroundColor: '#F3F4F6',
  },
  listItemText: {
    fontSize: 15,
    color: '#1F2937',
  },
  listItemTextSelected: {
    color: '#0FBBA1',
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
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
    fontSize: 15,
    color: '#1F2937',
  },
  linkText: {
    fontSize: 15,
    color: '#0FBBA1',
    fontWeight: '500',
  },

  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
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
    fontSize: 15,
    fontWeight: '600',
  },
  dosageText: {
    color: '#6B7280',
    fontSize: 15,
    marginLeft: 'auto',
  },

  helperText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 24,
    marginLeft: 4,
    lineHeight: 19,
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
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },

  /* ---------- Colors ---------- */
  // Explicit fixed-count rows (see ColorStep.tsx's chunking), not
  // flexWrap - wrapping 12 same-size dots left them unevenly spaced,
  // however many happened to fit per line on a given screen width, with
  // whatever was left over sitting as a ragged gap at the end of the row
  // instead of being distributed. justifyContent: 'space-between' on a
  // row of a KNOWN, fixed dot count spreads the real leftover space evenly
  // between them instead, and looks the same on every device.
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  // Intentionally no border here - ColorStep.tsx already renders its own
  // inner ring overlay to mark the selected swatch. Adding one here too
  // stacked two dark rings on top of each other (3px here + the inner
  // ring's own 2px), reading as one thick, dirty-looking border instead of
  // a clean selection indicator.
  colorDotSelected: {},
  colorLabel: {
    fontSize: 16,
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
  // Flat, borderless teal CTA - same recipe as every other primary button
  // in the app (LoginScreen, PaymentScreen, AIAssistantChatScreen's send
  // button), not the bevel-like outlined pill this used to be.
  primaryButton: {
    backgroundColor: '#0FBBA1',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  primaryButtonActive: {
    backgroundColor: '#0FBBA1',
  },
  primaryButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 10,
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 15,
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
    // Not white - RenderMedicationIcon draws each shape as a solid white
    // silhouette with its own drop shadow (config/shapes.tsx's
    // PILL_SHADOW), so it needs a contrasting backdrop to actually be
    // visible; on white it disappeared, leaving only its shadow showing.
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    ...CARD_BORDER,
  },
  // Only the background changes here - toggling borderWidth on/off on this
  // same view (as this used to do) is a known RN-Android bug: adding a
  // border switches the view to a different background drawable, whose
  // rounded-corner outline the elevation shadow doesn't always recompute
  // correctly on removal, leaving a stale rectangular shadow behind after
  // deselecting. The selection ring is a separate, shadow-less overlay
  // instead (shapeSelectedRing below).
  shapeCircleSelected: {
    backgroundColor: '#ECFDF5',
  },
  shapeSelectedRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#0FBBA1',
  },
});
