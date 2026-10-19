import type { UpiApp } from '../types';

export const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });

const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * The two SDKs each report their own list of installed UPI apps. The app the
 * customer tapped came from one of them; when the payment is routed to the
 * other gateway, find the same app in THAT gateway's list (Android package
 * names match across SDKs; iOS ids and names fall back to a fuzzy name match).
 */
export const findMatchingApp = (installed: UpiApp[], wanted: UpiApp): UpiApp | undefined => {
  const exact = installed.find((a) => a.packageOrScheme === wanted.packageOrScheme);
  if (exact) return exact;
  const wantedName = norm(wanted.name);
  const wantedPkg = norm(wanted.packageOrScheme);
  return installed.find((a) => {
    const name = norm(a.name);
    const pkg = norm(a.packageOrScheme);
    return name === wantedName || (wantedName.length > 3 && (name.includes(wantedName) || wantedName.includes(name))) || pkg.includes(wantedPkg) || wantedPkg.includes(pkg);
  });
};
