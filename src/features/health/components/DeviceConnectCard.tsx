import { disconnectDevice, updateDeviceData } from '@/src/redux/slices/deviceSlice';
import { RootState } from '@/src/redux/store';
import { bluetoothService } from '@/src/services/health/BluetoothService';
import { Battery, Link as LinkIcon, RefreshCw, Smartphone, Watch, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import BluetoothDeviceModal from './BluetoothDeviceModal';

export function DeviceConnectCard() {
    const dispatch = useDispatch();
    const { connectedDevice } = useSelector((state: RootState) => state.device);
    const [modalVisible, setModalVisible] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const handleSync = async () => {
        if (!connectedDevice) return;
        setIsSyncing(true);
        try {
            const [data, batteryLevel] = await Promise.all([
                bluetoothService.syncDeviceData(connectedDevice.id),
                bluetoothService.getBatteryLevel(connectedDevice.id),
            ]);
            dispatch(updateDeviceData({
                lastSynced: new Date().toISOString(),
                data,
                batteryLevel: batteryLevel ?? connectedDevice.batteryLevel,
            }));
        } catch (error) {
            console.warn('[DeviceConnectCard] Sync failed', error);
        } finally {
            setIsSyncing(false);
        }
    };

    if (connectedDevice) {
        const isLowBattery = connectedDevice.batteryLevel !== undefined && connectedDevice.batteryLevel < 20;

        return (
            <View style={styles.deviceCardConnected}>
                <View style={styles.cardHeader}>
                    <View style={styles.connectedBadge}>
                        <View style={styles.pulseDot} />
                        <Text style={styles.badgeText}>Connected</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => dispatch(disconnectDevice())}
                        style={styles.disconnectBtn}
                    >
                        <X size={14} color="rgba(255,255,255,0.4)" />
                    </TouchableOpacity>
                </View>

                <View style={styles.mainInfo}>
                    <View style={styles.deviceIconConnected}>
                        {connectedDevice.type === 'apple_watch' ? (
                            <Watch size={24} color="#fff" />
                        ) : (
                            <Smartphone size={24} color="#fff" />
                        )}
                    </View>

                    <View style={styles.deviceDetails}>
                        <Text style={styles.connectedName}>{connectedDevice.name}</Text>
                        <View style={styles.statusRow}>
                            <View style={styles.batteryRow}>
                                <Battery
                                    size={12}
                                    color={isLowBattery ? '#EF4444' : '#2FA561'}
                                    style={{ transform: [{ rotate: '-90deg' }] }}
                                />
                                <Text style={[styles.statusText, isLowBattery && { color: '#EF4444' }]}>
                                    {connectedDevice.batteryLevel !== undefined ? `${connectedDevice.batteryLevel}%` : '--'}
                                </Text>
                            </View>
                            <View style={styles.dotSeparator} />
                            <Text style={styles.statusText}>
                                {isSyncing ? 'Syncing...' : `Last sync: ${new Date(connectedDevice.lastSynced || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.syncBtn}
                        onPress={handleSync}
                        disabled={isSyncing}
                    >
                        {isSyncing ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <RefreshCw size={18} color="#fff" />
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.statsPreview}>
                    <StatItem value={connectedDevice.data?.steps?.toLocaleString()} label="Steps" />
                    <StatItem value={connectedDevice.data?.heartRate?.toString()} label="BPM" />
                    <StatItem value={connectedDevice.data?.calories?.toString()} label="kcal" />
                </View>

                <BluetoothDeviceModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                />
            </View>
        );
    }

    return (
        <>
            <View style={styles.deviceCard}>
                <View style={styles.deviceIcon}>
                    <Smartphone size={20} color="#fff" />
                </View>

                <View style={{ flex: 1 }}>
                    <Text style={styles.deviceTitle}>External Devices</Text>
                    <Text style={styles.deviceSubtitle}>
                        Track heart rate, steps and sleep automatically
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.pairBtn}
                    activeOpacity={0.8}
                    onPress={() => setModalVisible(true)}
                >
                    <LinkIcon size={14} color="#111827" style={{ marginRight: 4 }} />
                    <Text style={styles.pairText}>Pair</Text>
                </TouchableOpacity>
            </View>

            <BluetoothDeviceModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
            />
        </>
    );
}

function StatItem({ value, label }: { value: string | undefined, label: string }) {
    return (
        <View style={styles.statItem}>
            <Text style={styles.statValue}>{value || '--'}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    deviceCard: {
        marginHorizontal: 20,
        backgroundColor: '#111827',
        borderRadius: 24,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    deviceCardConnected: {
        marginHorizontal: 20,
        backgroundColor: '#111827',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    connectedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(47, 165, 97, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 6,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#2FA561',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#2FA561',
        textTransform: 'uppercase',
    },
    disconnectBtn: {
        padding: 4,
    },
    mainInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    deviceIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    deviceIconConnected: {
        width: 54,
        height: 54,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    deviceDetails: {
        flex: 1,
    },
    connectedName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    batteryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dotSeparator: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginHorizontal: 8,
    },
    statusText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '500',
    },
    syncBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsPreview: {
        flexDirection: 'row',
        marginTop: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    statLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
        marginTop: 2,
    },
    deviceTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
    deviceSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2, lineHeight: 18 },
    pairBtn: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center'
    },
    pairText: { fontSize: 13, fontWeight: '700', color: '#111827' }
});
