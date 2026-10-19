import { Platform, StyleSheet } from 'react-native';

import type { ThemeColors } from '../../../theme/colors';

// A soft shadow on every single option card, input, and list group in an
// 8-step wizard added up to a lot of visual noise at once - a plain 1px
// border reads as the same "defined white surface on a light grey screen"
// without the piled-up shadow weight, same idea as the offline home
// screen's cards (also borders, no shadow).


export const createStyles = (c: ThemeColors) => {
  const CARD_BORDER = {
    borderWidth: 1,
    borderColor: c.border,
  };

  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.background,
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
    backgroundColor: c.infoBg,
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
    color: c.text,
    marginBottom: 8,
    textAlign: 'center',
  },

  stepSubtitle: {
    fontSize: 16,
    color: c.textSecondary,
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
    backgroundColor: c.card,
    marginBottom: 12,
    ...CARD_BORDER,
  },

  optionCardSelected: {
    backgroundColor: c.successBg,
    borderWidth: 1.5,
    borderColor: '#10B981',
  },

  optionText: {
    fontSize: 15,
    color: c.text,
    flex: 1,
  },

  optionTextSelected: {
    color: c.success,
    fontWeight: '600',
  },

  optionHint: {
    fontSize: 12,
    color: c.textMuted,
  },

  /* ---------- Inputs ---------- */
  inputGroup: {
    marginBottom: 16,
  },

  inputLabel: {
    fontSize: 12,
    color: c.textSecondary,
    marginBottom: 6,
  },

  input: {
    backgroundColor: c.card,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    fontSize: 15,
    color: c.text,
    borderWidth: 1,
    // Slate, not the same flat gray as the cards/list groups - a slightly
    // cooler, more deliberate tone for the one element people actually type
    // into. Lighter shade (slate-200) than the first pass (slate-300) -
    // still visibly slate, just not as heavy an outline.
    borderColor: c.border,
  },

  /* ---------- Header - same recipe as the rest of the app: white bar +
     shadow, plain icon back button, fontSize 20/600/#111827 title. ---------- */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: c.card,
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
    color: c.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: c.textSecondary,
    marginTop: 2,
  },
  progressTrack: {
    height: 3,
    backgroundColor: c.cardSecondary,
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 16,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#10B981',
  },
  content: {
    flex: 1,
  },

  /* ---------- List Groups ---------- */
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: c.text,
    marginLeft: 4,
    marginBottom: 12,
    marginTop: 24,
  },
  listGroup: {
    backgroundColor: c.card,
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
    backgroundColor: c.cardSecondary,
  },
  listItemText: {
    fontSize: 15,
    color: c.text,
  },
  listItemTextSelected: {
    color: '#10B981',
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: c.cardSecondary,
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
    color: c.text,
  },
  linkText: {
    fontSize: 15,
    color: '#10B981',
    fontWeight: '500',
  },

  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: c.cardSecondary,
  },
  timePill: {
    backgroundColor: c.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 'auto',
    borderWidth: 1,
    borderColor: c.border,
  },
  timePillText: {
    color: c.text,
    fontSize: 15,
    fontWeight: '600',
  },
  dosageText: {
    color: c.textSecondary,
    fontSize: 15,
    marginLeft: 'auto',
  },

  helperText: {
    fontSize: 13,
    color: c.textSecondary,
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
    color: c.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  durationValue: {
    fontSize: 15,
    color: c.text,
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
    borderColor: c.border,
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
    color: c.text,
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
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  primaryButtonActive: {
    backgroundColor: '#10B981',
  },
  primaryButtonDisabled: {
    backgroundColor: c.cardSecondary,
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
    color: c.textSecondary,
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
    backgroundColor: c.cardSecondary,
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
    backgroundColor: c.successBg,
  },
  shapeSelectedRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#10B981',
  },
});
};
