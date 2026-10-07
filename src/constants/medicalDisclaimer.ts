// Single source of truth for the medical disclaimer required by Google
// Play's Health Content and Services policy (app was rejected for not
// surfacing this in-app). Every screen that shows the disclaimer - the
// onboarding gate, the permanent Settings/About entry, and the short
// inline notes on health/medication screens - imports from here instead
// of hardcoding its own copy, so a future wording change (e.g. after
// further Play Store feedback) only has to happen once.
//
// TODO(i18n): this app has no localization/i18n framework yet (no en.json
// /strings.xml/Localizable.strings - checked, none exists). These are
// plain English string constants. If/when the app adds multi-language
// support, these three strings need to move into that system and be
// translated for every supported locale - flagging per the task's own
// request, not deferring silently.

export const MEDICAL_DISCLAIMER_TITLE = 'Medical Disclaimer';

// Full text - used verbatim on the onboarding acknowledgment screen and
// the permanent Settings > Medical Disclaimer screen.
export const MEDICAL_DISCLAIMER_FULL =
  'Medicoo is not a medical device and is not intended to diagnose, treat, cure, or prevent any disease or medical condition. Medicoo does not provide medical advice. The health tracking, medication reminders, and family health record features are for informational and organizational purposes only. Always consult a qualified healthcare professional for medical advice, diagnosis, or treatment, and before making any decisions related to your health or medications.';

// Short-form note for health/vitals screens (heart rate, steps, weight,
// health goals, etc.) - small/secondary caption text near the readings.
export const MEDICAL_DISCLAIMER_SHORT_HEALTH =
  'For informational purposes only — not a substitute for professional medical advice.';

// Short-form note for medication reminder / prescription screens -
// clarifies Medicoo doesn't verify medical accuracy.
export const MEDICAL_DISCLAIMER_SHORT_MEDICATION =
  "Medicoo doesn't verify the medical accuracy of medications or prescriptions — this is not a substitute for advice from your pharmacist or doctor.";

// AsyncStorage key for the onboarding acknowledgment flag - see
// MedicalDisclaimerOnboardingScreen.tsx.
export const MEDICAL_DISCLAIMER_ACK_KEY = '@medicoo_medical_disclaimer_acknowledged_v1';
