import { StyleSheet, Text, TextInput } from 'react-native';
import { fontFamilyForWeight } from '../constants/fonts';

/**
 * Forces every <Text>/<TextInput> in the app onto the single font defined
 * in constants/fonts.ts, without touching each of the hundreds of call
 * sites individually.
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

function resolveFontFamily(style: unknown): string {
  const flat: any = StyleSheet.flatten(style as any) || {};

  // An explicit fontFamily already set on this Text wins outright - lets
  // any future one-off override keep working exactly as authored.
  if (flat.fontFamily) return flat.fontFamily;

  return fontFamilyForWeight(flat.fontWeight, flat.fontStyle === 'italic');
}

function injectFont(type: unknown, props: any) {
  if ((type !== Text && type !== TextInput) || !props) return props;
  // includeFontPadding:false is a DEFAULT (first in the array, so any style that
  // sets it explicitly still wins). Poppins has tall built-in line metrics, and
  // Android adds that as blank space above and below every line of text - which
  // is what inflated buttons, chips and headers across the app.
  return { ...props, style: [{ includeFontPadding: false }, props.style, { fontFamily: resolveFontFamily(props.style) }] };
}

function patchExport(mod: any, name: string) {
  const original = mod?.[name];
  if (typeof original !== 'function') return;
  mod[name] = (type: unknown, props: any, ...rest: any[]) =>
    original(type, injectFont(type, props), ...rest);
}

let installed = false;

export function installGlobalAppFont() {
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
