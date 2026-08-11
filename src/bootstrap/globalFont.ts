import { StyleSheet, Text, TextInput } from 'react-native';

/**
 * Forces every <Text>/<TextInput> in the app onto Montserrat, without
 * touching each of the hundreds of call sites individually.
 *
 * Why this can't just be Text.defaultProps: React 19 removed defaultProps
 * support for function components, and RN's Text/TextInput are now plain
 * function components (no forwardRef, no class), not the old class-based
 * implementation that trick used to rely on - so that approach is silently
 * a no-op on this RN/React version.
 *
 * Instead this patches the React JSX runtime itself (react/jsx-runtime's
 * `jsx`/`jsxs`, and react/jsx-dev-runtime's `jsxDEV` for the dev bundle).
 * Every <Text>/<TextInput> anywhere in the app - present or future,
 * regardless of file - compiles down to a call through these exact shared
 * module exports, so patching them once here (before the app's first
 * render) intercepts every single one, forever, without a build-tool
 * change. Worst case if this patch ever fails to apply for some reason,
 * text just falls back to the system font rather than breaking anything.
 */

// Custom fonts don't get RN's automatic bold/weight synthesis the way
// system fonts do, especially on Android - each visual weight has to be
// its own loaded font file, referenced by its own family name. This maps
// every fontWeight value already used across the app's styles (300-900,
// plus 'normal'/'bold') to the matching Montserrat file loaded in App.tsx.
const WEIGHT_TO_SUFFIX: Record<string, string> = {
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

function resolveFontFamily(style: unknown): string {
  const flat: any = StyleSheet.flatten(style as any) || {};

  // An explicit fontFamily already set on this Text wins outright - lets
  // any future one-off override keep working exactly as authored.
  if (flat.fontFamily) return flat.fontFamily;

  const suffix = WEIGHT_TO_SUFFIX[String(flat.fontWeight ?? '400')] || 'Regular';
  const isItalic = flat.fontStyle === 'italic';
  return `Montserrat-${suffix}${isItalic ? 'Italic' : ''}`;
}

function injectFont(type: unknown, props: any) {
  if ((type !== Text && type !== TextInput) || !props) return props;
  return { ...props, style: [props.style, { fontFamily: resolveFontFamily(props.style) }] };
}

function patchExport(mod: any, name: string) {
  const original = mod?.[name];
  if (typeof original !== 'function') return;
  mod[name] = (type: unknown, props: any, ...rest: any[]) =>
    original(type, injectFont(type, props), ...rest);
}

let installed = false;

export function installGlobalMontserratFont() {
  if (installed) return;
  installed = true;

  // Metro's bundler requires a literal string argument to require() - it
  // can't statically resolve a variable/parameterized module id - so each
  // of these is called directly rather than through a shared helper.

  // Production/release bundles use jsx-runtime.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const jsxRuntime = require('react/jsx-runtime');
    patchExport(jsxRuntime, 'jsx');
    patchExport(jsxRuntime, 'jsxs');
  } catch {
    // Not present in this bundle - nothing to patch.
  }

  // The dev/Fast Refresh bundle uses jsx-dev-runtime instead.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const jsxDevRuntime = require('react/jsx-dev-runtime');
    patchExport(jsxDevRuntime, 'jsxDEV');
  } catch {
    // Not present in this bundle - nothing to patch.
  }
}
