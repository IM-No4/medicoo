import { addAvailableDevice, connectDevice, setAvailableDevices, setScanning } from '@/src/redux/slices/deviceSlice';
import { AppDispatch, RootState } from '@/src/redux/store';
import { Bluetooth, Info, RefreshCw, Smartphone, Watch, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
    visible: boolean;
    onClose: () => void;
}

import { bluetoothService } from '@/src/services/health/BluetoothService';
import StatusModal, { StatusType } from '@/src/components/modals/StatusModal';

export default function BluetoothDeviceModal({ visible, onClose }: Props) {
    const insets = useSafeAreaInsets();
    const dispatch = useDispatch<AppDispatch>();
    const { isScanning, availableDevices } = useSelector((state: RootState) => state.device);
    const [connectingId, setConnectingId] = useState<string | null>(null);
    const [bluetoothOff, setBluetoothOff] = useState(false);
    const [connectError, setConnectError] = useState<{ visible: boolean; title: string; message: string }>({
        visible: false,
        title: '',
        message: '',
    });

    // Mock scanning logic replaced with actual service call
    // Monitor Bluetooth state changes
    useEffect(() => {
        const subscription = bluetoothService.onStateChange((state) => {
            if (state === 'PoweredOn') {
                setBluetoothOff(false);
                if (visible) startScan();
            } else {
                setBluetoothOff(true);
                dispatch(setScanning(false));
            }
        });
        return () => subscription.remove();
    }, [visible]);

    useEffect(() => {
        if (visible) {
            checkAndStartScan();
        } else {
            stopScan();
        }
    }, [visible]);

    const checkAndStartScan = async () => {
        const isOn = await bluetoothService.checkState();
        if (!isOn) {
            setBluetoothOff(true);
            dispatch(setScanning(false));
            return;
        }
        setBluetoothOff(false);
        startScan();
    };

    const handleEnableBluetooth = async () => {
        const success = await bluetoothService.enableBluetooth();
        if (success) {
            setBluetoothOff(false);
            startScan();
        }
    };

    const startScan = async () => {
        dispatch(setScanning(true));
        dispatch(setAvailableDevices([]));

        try {
            await bluetoothService.scanForDevices(
                (device) => {
                    // Use addAvailableDevice to safely append finding without closure issues
                    dispatch(addAvailableDevice(device));
                },
                (error) => {
                    console.error('Scan error:', error);
                    if (error.message?.includes('powered off') || error.message?.includes('not powered on')) {
                        setBluetoothOff(true);
                    }
                    dispatch(setScanning(false));
                }
            );
        } catch (error: any) {
            console.error('Scan failed to initiate', error);
            dispatch(setScanning(false));
        }
    };

    const stopScan = () => {
        // Implementation for stopping BLE scan
        bluetoothService.stopScan();
        dispatch(setScanning(false));
    };

    const handleConnect = async (device: { id: string, name: string }) => {
        setConnectingId(device.id);

        try {
            await bluetoothService.connectToDevice(device.id);
            const battery = await bluetoothService.getBatteryLevel(device.id);
            const data = await bluetoothService.syncDeviceData(device.id);

            // A raw BLE connection can succeed at the transport level even
            // for a device we can't actually read anything useful from -
            // e.g. one that requires vendor-specific authentication we
            // don't implement (like Mi Band). Every read then just
            // gracefully resolves to undefined instead of throwing, so
            // without this check the device would show up "Connected"
            // with a card full of blank stats. Treat that the same as a
            // failed connection instead.
            const hasUsableData =
                battery !== undefined ||
                data.heartRate !== undefined ||
                data.steps !== undefined ||
                data.calories !== undefined;
            if (!hasUsableData) {
                await bluetoothService.disconnectDevice(device.id);
                throw new Error('Connected, but no usable health data was available from this device.');
            }

            dispatch(connectDevice({
                id: device.id,
                name: device.name,
                type: device.name.includes('Watch') ? 'apple_watch' : 'fitness_band',
                status: 'connected',
                batteryLevel: battery,
                lastSynced: new Date().toISOString(),
                data: data
            }));

            setConnectingId(null);
            onClose();
        } catch (error: any) {
            console.error('Connection failed', error);
            setConnectingId(null);
            // A raw BLE error (e.g. "Device was disconnected") isn't
            // meaningful to a non-technical user - most devices that fail
            // here simply aren't supported for health tracking (they
            // disconnect because they require a vendor-specific pairing
            // protocol we don't implement), so say that plainly instead.
            setConnectError({
                visible: true,
                title: 'Device Not Supported',
                message: `${device.name} couldn't be connected for health tracking. It may require its own companion app to pair, or isn't a supported device yet.`,
            });
        }
    };

    const renderItem = ({ item }: { item: { id: string, name: string } }) => (
        <TouchableOpacity
            style={styles.deviceItem}
            activeOpacity={0.7}
            onPress={() => handleConnect(item)}
            disabled={connectingId !== null}
        >
            <View style={styles.deviceIconBox}>
                {item.name.includes('Watch') ? <Watch size={20} color="#64748B" /> : <Smartphone size={20} color="#64748B" />}
            </View>
            <View style={styles.deviceInfo}>
                <Text style={styles.deviceName}>{item.name}</Text>
                <Text style={styles.deviceStatus}>Ready to pair</Text>
            </View>
            {connectingId === item.id ? (
                <ActivityIndicator size="small" color="#0FBBA1" />
            ) : (
                <Text style={styles.connectText}>Connect</Text>
            )}
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                    <View style={styles.header}>
                        <View style={styles.headerTitleRow}>
                            <View style={styles.bluetoothIcon}>
                                <Bluetooth size={20} color="#fff" />
                            </View>
                            <View>
                                <Text style={styles.title}>Pair New Device</Text>
                                <Text style={styles.subtitle}>Searching for nearby trackers</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={20} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.scanSection}>
                        <View style={styles.scanHeader}>
                            <Text style={styles.sectionLabel}>Available Devices</Text>
                            <TouchableOpacity onPress={checkAndStartScan} disabled={isScanning || bluetoothOff}>
                                {isScanning ? (
                                    <ActivityIndicator size="small" color="#0FBBA1" />
                                ) : (
                                    <RefreshCw size={16} color={bluetoothOff ? "#94A3B8" : "#0FBBA1"} />
                                )}
                            </TouchableOpacity>
                        </View>

                        {bluetoothOff ? (
                            <View style={styles.emptyState}>
                                <Bluetooth size={40} color="#94A3B8" style={{ marginBottom: 16 }} />
                                <Text style={styles.emptyText}>Bluetooth is turned off. Please enable it to scan for devices.</Text>
                                <TouchableOpacity
                                    style={styles.enableBtn}
                                    onPress={handleEnableBluetooth}
                                >
                                    <Text style={styles.enableBtnText}>Enable Bluetooth</Text>
                                </TouchableOpacity>
                            </View>
                        ) : availableDevices.length === 0 && !isScanning ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No devices found. Make sure your tracker is in pairing mode.</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={availableDevices}
                                keyExtractor={(item) => item.id}
                                renderItem={renderItem}
                                contentContainerStyle={styles.listContent}
                            />
                        )}
                    </View>

                    <View style={styles.footer}>
                        <Info size={14} color="#94A3B8" />
                        <Text style={styles.footerText}>Only Bluetooth 4.0+ devices are supported</Text>
                    </View>
                </View>
            </View>

            <StatusModal
                visible={connectError.visible}
                status={'error' as StatusType}
                title={connectError.title}
                message={connectError.message}
                onClose={() => setConnectError((prev) => ({ ...prev, visible: false }))}
            />
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        height: SCREEN_HEIGHT * 0.65,
        backgroundColor: '#fff',
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        paddingTop: 32,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    bluetoothIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#0FBBA1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    subtitle: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 2,
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanSection: {
        flex: 1,
    },
    scanHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    listContent: {
        paddingHorizontal: 24,
    },
    deviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    deviceIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    deviceInfo: {
        flex: 1,
        marginLeft: 16,
    },
    deviceName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1E293B',
    },
    deviceStatus: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 2,
    },
    connectText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0FBBA1',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 60,
    },
    emptyText: {
        textAlign: 'center',
        color: '#94A3B8',
        fontSize: 14,
        lineHeight: 20,
    },
    enableBtn: {
        marginTop: 20,
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    enableBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0FBBA1',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingTop: 20,
    },
    footerText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    }
});
