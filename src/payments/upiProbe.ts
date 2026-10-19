import { Linking } from 'react-native';
import type { UpiApp } from './types';

// An independent "is this app really installed?" check that does not depend on
// either payment SDK's list (those have been seen to report apps that are not
// on the phone). Each well-known UPI app registers a URL scheme; asking the OS
// whether anything can open it is accurate on both platforms - provided the
// scheme is declared (Android <queries> / iOS LSApplicationQueriesSchemes,
// both set up in app.json and plugins/withUpiAppQueries.js).

const KNOWN: { key: string; scheme: string; match: RegExp }[] = [
  { key: 'gpay', scheme: 'tez', match: /google|gpay|tez|nbu\.paisa/i },
  { key: 'phonepe', scheme: 'phonepe', match: /phonepe/i },
  { key: 'paytm', scheme: 'paytmmp', match: /paytm/i },
  { key: 'cred', scheme: 'credpay', match: /cred|dreamplug/i },
  { key: 'bhim', scheme: 'bhim', match: /bhim|npci/i },
  { key: 'amazon', scheme: 'amazonpay', match: /amazon/i },
];

/** The well-known app (if any) this UPI app is. */
export const knownKeyOf = (app: Pick<UpiApp, 'name' | 'packageOrScheme'>): string | null =>
  KNOWN.find((k) => k.match.test(`${app.name} ${app.packageOrScheme}`))?.key ?? null;

/** Keys of the well-known UPI apps the OS says are installed. */
export const probeInstalledKnownApps = async (): Promise<Set<string>> => {
  const found = new Set<string>();
  await Promise.all(
    KNOWN.map(async ({ key, scheme }) => {
      try {
        if (await Linking.canOpenURL(`${scheme}://`)) found.add(key);
      } catch {
        // scheme not declared / not resolvable - treat as not installed
      }
    }),
  );
  return found;
};
