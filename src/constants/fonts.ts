/**
 * SINGLE SOURCE OF TRUTH for the app's font family.
 *
 * To swap the app's font in the future, this is the only file that needs
 * to change:
 *   1. Drop the new font's .ttf files into src/assets/fonts/, one per
 *      weight + an Italic variant of each (18 files total), named
 *      "<Name>-<Suffix>.ttf" / "<Name>-<Suffix>Italic.ttf" using the exact
 *      suffixes in WEIGHT_TO_SUFFIX below (Thin, ExtraLight, Light,
 *      Regular, Medium, SemiBold, Bold, ExtraBold, Black).
 *   2. Update FONT_FAMILY_NAME and the requires in FONT_MAP to point at
 *      the new files.
 *
 * Nothing else in the app needs to change - globalFont.ts reads
 * FONT_FAMILY_NAME/WEIGHT_TO_SUFFIX to pick a family for every
 * <Text>/<TextInput> automatically (see that file for how), and App.tsx
 * just loads whatever FONT_MAP exports here.
 */

export const FONT_FAMILY_NAME = 'Inter';

// Custom fonts don't get RN's automatic bold/weight synthesis the way
// system fonts do, especially on Android - each visual weight has to be
// its own loaded font file, referenced by its own family name. This maps
// every fontWeight value already used across the app's styles (100-900,
// plus 'normal'/'bold') to the matching suffix on disk.
export const WEIGHT_TO_SUFFIX: Record<string, string> = {
  '100': 'Thin',
  '200': 'ExtraLight',
  '300': 'Light',
  '400': 'Regular',
  normal: 'Regular',
  '500': 'Medium',
  '600': 'SemiBold',
  '700': 'Bold',
  bold: 'Bold',
  '800': 'ExtraBold',
  '900': 'Black',
};

// For the rare spot that needs to reference the font family directly
// (rather than relying on globalFont.ts's automatic injection) - e.g. a
// non-Text component that takes its own fontFamily-shaped prop.
export function fontFamilyForWeight(weight?: string | number, italic = false): string {
  const suffix = WEIGHT_TO_SUFFIX[String(weight ?? '400')] || 'Regular';
  return `${FONT_FAMILY_NAME}-${suffix}${italic ? 'Italic' : ''}`;
}

// Metro needs a static string literal to resolve/bundle each asset - it
// can't statically analyze a template-literal/loop-built require() path -
// so every font file is required explicitly rather than generated. Keys
// match what fontFamilyForWeight/globalFont.ts's resolveFontFamily compute
// (family name + weight suffix + "Italic").
export const FONT_MAP = {
  'Inter-Thin': require('../assets/fonts/Inter-Thin.ttf'),
  'Inter-ThinItalic': require('../assets/fonts/Inter-ThinItalic.ttf'),
  'Inter-ExtraLight': require('../assets/fonts/Inter-ExtraLight.ttf'),
  'Inter-ExtraLightItalic': require('../assets/fonts/Inter-ExtraLightItalic.ttf'),
  'Inter-Light': require('../assets/fonts/Inter-Light.ttf'),
  'Inter-LightItalic': require('../assets/fonts/Inter-LightItalic.ttf'),
  'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
  'Inter-RegularItalic': require('../assets/fonts/Inter-RegularItalic.ttf'),
  'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
  'Inter-MediumItalic': require('../assets/fonts/Inter-MediumItalic.ttf'),
  'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
  'Inter-SemiBoldItalic': require('../assets/fonts/Inter-SemiBoldItalic.ttf'),
  'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
  'Inter-BoldItalic': require('../assets/fonts/Inter-BoldItalic.ttf'),
  'Inter-ExtraBold': require('../assets/fonts/Inter-ExtraBold.ttf'),
  'Inter-ExtraBoldItalic': require('../assets/fonts/Inter-ExtraBoldItalic.ttf'),
  'Inter-Black': require('../assets/fonts/Inter-Black.ttf'),
  'Inter-BlackItalic': require('../assets/fonts/Inter-BlackItalic.ttf'),
};
