import { useCallback, useEffect, useRef, useState } from 'react';
import { getPaymentConfig } from './api';
import { getGateway } from './gateways/registry';
import { loadLastMethod, LastMethod } from './pendingStore';
import { ClientConfig, GatewayName, UpiApp } from './types';
import { knownKeyOf, probeInstalledKnownApps } from './upiProbe';

// Everything the "choose how to pay" list needs to draw itself: which methods the
// backend currently offers, which UPI apps are really installed, and what the
// customer used last. Shared by the options screen and the payment flow itself.

const POPULAR_UPI = [/google|gpay|tez/i, /phonepe/i, /paytm/i, /cred/i, /bhim/i, /amazon/i];

/** Combines the apps each SDK reported, de-duplicated, popular ones first. */
const mergeUpiApps = (apps: UpiApp[]): UpiApp[] => {
  const byKey = new Map<string, UpiApp>();
  for (const app of apps) {
    const key = app.packageOrScheme.toLowerCase() || app.name.toLowerCase();
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { ...app });
    } else {
      existing.gateways = Array.from(new Set([...(existing.gateways || []), ...(app.gateways || [])]));
      if (!existing.icon && app.icon) existing.icon = app.icon;
    }
  }
  const rank = (a: UpiApp) => {
    const i = POPULAR_UPI.findIndex((re) => re.test(`${a.name} ${a.packageOrScheme}`));
    return i === -1 ? POPULAR_UPI.length : i;
  };
  return Array.from(byKey.values()).sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
};

export function usePaymentConfig() {
  const [config, setConfig] = useState<ClientConfig | null>(null);
  const [configError, setConfigError] = useState(false);
  const [upiApps, setUpiApps] = useState<UpiApp[]>([]);
  const [lastMethod, setLastMethod] = useState<LastMethod | null>(null);
  const [appsLoaded, setAppsLoaded] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadConfig = useCallback(async () => {
    setConfigError(false);
    try {
      const cfg = await getPaymentConfig();
      if (!mounted.current) return;
      setConfig(cfg);
      setLastMethod(await loadLastMethod());

      // Installed UPI apps: ask BOTH gateways' SDKs and merge. Each SDK only reports the apps it knows,
      // and an app is only payable through a gateway that listed it - so every app remembers which did.
      const names: GatewayName[] = ['razorpay', 'cashfree'];
      const lists = await Promise.all(
        names.map(async (name) => {
          try {
            const gateway = getGateway(name);
            if (name === 'razorpay' && cfg.razorpayKeyId) await gateway.init(cfg).catch(() => {});
            const apps = await gateway.getUpiApps();
            return apps.map((a) => ({ ...a, gateways: [name] as GatewayName[] }));
          } catch {
            return [] as UpiApp[];
          }
        }),
      );
      const all = lists.flat();

      // Both SDKs have been seen reporting apps that are NOT installed, so a listed app is only shown when
      // confirmed: Cashfree's list is a direct OS package query, and the OS scheme check vetoes phantoms.
      const probed = await probeInstalledKnownApps();
      const probeWorks = probed.size > 0;
      const confirmed = mergeUpiApps(all).filter((app) => {
        const key = knownKeyOf(app);
        if (key && probeWorks) return probed.has(key);
        if (app.gateways?.includes('cashfree')) return true;
        return key ? probed.has(key) : false;
      });
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log('[payments] UPI apps', {
          razorpayReported: all.filter((a) => a.gateways?.includes('razorpay')).map((a) => a.packageOrScheme),
          cashfreeReported: all.filter((a) => a.gateways?.includes('cashfree')).map((a) => a.packageOrScheme),
          osConfirmedSchemes: Array.from(probed),
          shown: confirmed.map((a) => a.name),
        });
      }
      if (mounted.current) {
        setUpiApps(confirmed);
        setAppsLoaded(true);
      }
    } catch {
      if (mounted.current) setConfigError(true);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return { config, configError, reloadConfig: loadConfig, upiApps, appsLoaded, lastMethod };
}

export type PaymentConfigState = ReturnType<typeof usePaymentConfig>;
