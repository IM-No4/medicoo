/**
 * BluetoothService.ts
 *
 * Real BLE connectivity via react-native-ble-plx, reading the two
 * standardized GATT services almost every BLE fitness/heart-rate device
 * exposes: Battery Level and Heart Rate Measurement. There is no
 * Bluetooth SIG-standard characteristic for step count or calories - those
 * are vendor-proprietary (Mi Band, Fitbit, etc. each do it differently), so
 * this deliberately does not fabricate values for them. Steps for a device
 * with no standard way to read them stay undefined; the app's own on-device
 * pedometer (see services/health/stepsService.ts) covers steps when no
 * device is connected at all.
 */

import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

// Bluetooth SIG 16-bit UUIDs expanded to their full 128-bit form, as
// required by react-native-ble-plx.
const BATTERY_SERVICE_UUID = '0000180F-0000-1000-8000-00805F9B34FB';
const BATTERY_LEVEL_CHARACTERISTIC_UUID = '00002A19-0000-1000-8000-00805F9B34FB';
const HEART_RATE_SERVICE_UUID = '0000180D-0000-1000-8000-00805F9B34FB';
const HEART_RATE_MEASUREMENT_CHARACTERISTIC_UUID = '00002A37-0000-1000-8000-00805F9B34FB';
// Huami/Mi Band's proprietary main + auth GATT services - not a Bluetooth
// SIG standard UUID, but every Mi Band/Amazfit device advertises this in
// its scan response, so it's needed to include Mi Bands in the fitness-
// device filter below (their standard-services list alone wouldn't
// distinguish them from anything else).
const MIBAND_SERVICE_UUID = '0000FEE0-0000-1000-8000-00805F9B34FB';

// Service UUIDs a scan filters on - only devices advertising at least one
// of these show up as pairable. This is what keeps unrelated BLE
// accessories (speakers, earbuds, etc.) out of the "trackers" list; a
// generic audio device doesn't advertise any fitness-related service.
const FITNESS_DEVICE_SERVICE_UUIDS = [HEART_RATE_SERVICE_UUID, MIBAND_SERVICE_UUID];

// react-native-ble-plx returns characteristic values as base64 - decode to
// raw bytes without pulling in a separate base64 package.
function base64ToBytes(base64: string): Uint8Array {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
    const bytes: number[] = [];
    for (let i = 0; i < clean.length; i += 4) {
        const e1 = chars.indexOf(clean[i]);
        const e2 = chars.indexOf(clean[i + 1]);
        const e3 = clean[i + 2] !== undefined ? chars.indexOf(clean[i + 2]) : -1;
        const e4 = clean[i + 3] !== undefined ? chars.indexOf(clean[i + 3]) : -1;

        bytes.push((e1 << 2) | (e2 >> 4));
        if (e3 >= 0) bytes.push(((e2 & 15) << 4) | (e3 >> 2));
        if (e4 >= 0) bytes.push(((e3 & 3) << 6) | e4);
    }
    return new Uint8Array(bytes);
}

// Bluetooth SIG "Heart Rate Measurement" characteristic format: byte 0 is a
// flags field whose bit 0 says whether the HR value is UINT8 or UINT16.
function parseHeartRateMeasurement(bytes: Uint8Array): number | undefined {
    if (bytes.length < 2) return undefined;
    const is16Bit = (bytes[0] & 0x01) === 1;
    if (is16Bit) {
        if (bytes.length < 3) return undefined;
        return bytes[1] | (bytes[2] << 8);
    }
    return bytes[1];
}

class BluetoothService {
    private manager: BleManager;

    constructor() {
        this.manager = new BleManager();
    }

    /**
     * Request necessary permissions for BLE scanning
     */
    async requestPermissions() {
        if (Platform.OS === 'android') {
            if (Platform.Version >= 31) {
                const result = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                ]);

                return (
                    result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
                    result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
                    result['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
                );
            } else {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            }
        }
        return true;
    }

    /**
     * Listen for state changes
     */
    onStateChange(callback: (state: string) => void) {
        return this.manager.onStateChange((state) => {
            callback(state);
        }, true);
    }

    /**
     * Check if Bluetooth is powered on
     */
    async checkState() {
        const state = await this.manager.state();
        return state === 'PoweredOn';
    }

    /**
     * Prompt user to turn on Bluetooth (Android only)
     * For iOS, this usually triggers a system dialog automatically on state check/scan if configured correctly.
     */
    async enableBluetooth() {
        try {
            await this.manager.enable();
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Request permissions and start scanning for trackers
     */
    async scanForDevices(onDeviceFound: (device: any) => void, onError: (error: any) => void) {
        const hasPermissions = await this.requestPermissions();
        if (!hasPermissions) {
            onError(new Error('Permission denied. Please allow Bluetooth and Location permissions.'));
            return;
        }

        const state = await this.manager.state();
        if (state !== 'PoweredOn') {
            onError(new Error('Bluetooth is not powered on'));
            return;
        }

        // Filtering by service UUID here (rather than null/"show everything")
        // is what keeps non-fitness BLE accessories like speakers out of
        // this list - the OS only reports devices whose advertisement
        // includes one of FITNESS_DEVICE_SERVICE_UUIDS.
        this.manager.startDeviceScan(FITNESS_DEVICE_SERVICE_UUIDS, null, (error, device) => {
            if (error) {
                onError(error);
                return;
            }
            // Check for name or localName
            const deviceName = device?.name || device?.localName;
            if (deviceName) {
                onDeviceFound({
                    id: device.id,
                    name: deviceName,
                });
            }
        });
    }

    /**
     * Stop scanning for devices
     */
    stopScan() {
        this.manager.stopDeviceScan();
    }

    /**
     * Tear down a GATT connection - used when a device connects at the
     * transport level but turns out to be unusable (e.g. it requires
     * vendor-specific authentication we don't implement, so every read
     * comes back empty), rather than leaving a connected-but-useless BLE
     * session open in the background.
     */
    async disconnectDevice(deviceId: string) {
        try {
            await this.manager.cancelDeviceConnection(deviceId);
        } catch {
            // Already disconnected - nothing to do.
        }
    }

    /**
     * Connect to a specific device and discover services
     */
    async connectToDevice(deviceId: string) {

        // Real implementation:
        const device = await this.manager.connectToDevice(deviceId);
        await device.discoverAllServicesAndCharacteristics();
        return device;
    }

    /**
     * Read battery level via the standard Battery Service (0x180F) /
     * Battery Level characteristic (0x2A19). Returns undefined if the
     * device doesn't expose this service rather than a fake number.
     *
     * Checks the already-discovered characteristic list first (local cache
     * lookup, no BLE I/O) and skips the read entirely if the device doesn't
     * actually expose it, same reasoning as getHeartRate's guard below: a
     * device whose firmware doesn't properly implement a service it
     * advertises can destabilize the native BLE stack on the read attempt
     * itself, not just fail cleanly - the try/catch here does catch *a*
     * rejection (the warning this logs), but that doesn't mean the native
     * module is still in a good state afterwards. Not attempting the read
     * at all when the characteristic isn't present avoids relying on the
     * native side to fail gracefully.
     */
    async getBatteryLevel(deviceId: string): Promise<number | undefined> {
        try {
            const characteristics = await this.manager.characteristicsForDevice(deviceId, BATTERY_SERVICE_UUID);
            const hasBatteryCharacteristic = characteristics.some(
                (c) => c.uuid.toUpperCase() === BATTERY_LEVEL_CHARACTERISTIC_UUID.toUpperCase()
            );
            if (!hasBatteryCharacteristic) return undefined;
        } catch (error) {
            // Device doesn't expose the Battery service at all.
            console.warn('[BluetoothService] Battery service unavailable for device', deviceId, error);
            return undefined;
        }

        try {
            const characteristic = await this.manager.readCharacteristicForDevice(
                deviceId,
                BATTERY_SERVICE_UUID,
                BATTERY_LEVEL_CHARACTERISTIC_UUID
            );
            if (!characteristic.value) return undefined;
            const bytes = base64ToBytes(characteristic.value);
            return bytes.length > 0 ? bytes[0] : undefined;
        } catch (error) {
            console.warn('[BluetoothService] Battery level unavailable for device', deviceId, error);
            return undefined;
        }
    }

    /**
     * Read heart rate via the standard Heart Rate Service (0x180D) /
     * Heart Rate Measurement characteristic (0x2A37). That characteristic
     * is notify-only per the BLE spec (not readable), so this subscribes
     * and takes the first notification, with a timeout in case the device
     * never sends one.
     *
     * Checks the already-discovered characteristic list first and skips
     * monitoring entirely if the device doesn't actually expose a
     * notifiable Heart Rate Measurement characteristic - some cheap/
     * unbranded trackers report the Heart Rate service but their firmware
     * doesn't implement notify correctly, and blindly calling
     * monitorCharacteristicForDevice on that has been observed to crash the
     * native BLE stack outright (a "BleError: Unknown error... this is
     * probably a bug!" native-side failure a JS try/catch can't contain,
     * rather than a normal rejected promise) instead of just erroring.
     * characteristicsForDevice reads from the connection's already-cached
     * discovery results, so this is a local check, not new BLE I/O.
     */
    private async getHeartRate(deviceId: string, timeoutMs = 6000): Promise<number | undefined> {
        try {
            const characteristics = await this.manager.characteristicsForDevice(deviceId, HEART_RATE_SERVICE_UUID);
            const hrCharacteristic = characteristics.find(
                (c) => c.uuid.toUpperCase() === HEART_RATE_MEASUREMENT_CHARACTERISTIC_UUID.toUpperCase()
            );
            if (!hrCharacteristic?.isNotifiable) {
                return undefined;
            }
        } catch (error) {
            // Device doesn't expose the Heart Rate service at all.
            console.warn('[BluetoothService] Heart rate service unavailable for device', deviceId, error);
            return undefined;
        }

        return new Promise((resolve) => {
            let settled = false;
            const subscription = this.manager.monitorCharacteristicForDevice(
                deviceId,
                HEART_RATE_SERVICE_UUID,
                HEART_RATE_MEASUREMENT_CHARACTERISTIC_UUID,
                (error, characteristic) => {
                    if (settled) return;
                    if (error || !characteristic?.value) return;
                    settled = true;
                    subscription.remove();
                    resolve(parseHeartRateMeasurement(base64ToBytes(characteristic.value)));
                }
            );

            setTimeout(() => {
                if (settled) return;
                settled = true;
                subscription.remove();
                resolve(undefined);
            }, timeoutMs);
        });
    }

    /**
     * Sync tracking data from a connected device. Steps/calories have no
     * Bluetooth SIG standard characteristic (vendor-proprietary), so they
     * are only ever included if a future device-specific integration adds
     * them - never fabricated here.
     */
    async syncDeviceData(deviceId: string): Promise<{ heartRate?: number; steps?: number; calories?: number }> {
        const heartRate = await this.getHeartRate(deviceId);
        return { heartRate };
    }
}

export const bluetoothService = new BluetoothService();
