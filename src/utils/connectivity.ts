import { API_BASE_URL } from '../services/api/client';

// No @react-native-community/netinfo in this project (couldn't be installed
// - see offlineSync.ts's comment), so connectivity is checked the way
// NetInfo itself does under a custom `reachabilityUrl`: actually try to
// reach the backend, on a short timeout, rather than just asking the OS
// whether a radio is on. Any response at all - even a 404 - proves the
// network path works; only a real network-level failure (DNS, timeout,
// connection refused) throws here.
async function probeOnce(timeoutMs: number): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            await fetch(API_BASE_URL, { method: 'GET', signal: controller.signal });
            return true;
        } finally {
            clearTimeout(timer);
        }
    } catch {
        return false;
    }
}

// A single failed probe used to be trusted outright - fine for the 45s
// background recheck (offlineSync.ts), where a false negative just gets
// corrected on the next pass, but not for the one-shot check BootCoordinator
// runs at cold launch: a WiFi radio that's still finishing its DHCP/DNS
// handshake at the exact moment the app's JS thread fires this fetch (a real,
// reproducible race right after the app icon is tapped) was enough to send a
// perfectly-connected session straight to the "no internet" offline gate,
// with nothing to correct it until the user backgrounded/foregrounded the
// app or waited out the next interval. One short retry after a brief pause
// costs at most ~1s in the rare case that's actually needed, and nothing at
// all when the first attempt already succeeds.
export async function checkInternetConnectivity(timeoutMs = 4000, retries = 1): Promise<boolean> {
    if (await probeOnce(timeoutMs)) return true;

    for (let attempt = 0; attempt < retries; attempt++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        if (await probeOnce(timeoutMs)) return true;
    }

    return false;
}
