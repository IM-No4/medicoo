import { useNavigation } from '@react-navigation/native';
import { Briefcase, ChevronLeft, Home, MapPin, Plus } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { executeAction } from '../../../../actions/ActionExecutor';
import StatusModal, { StatusType } from '../../../../components/modals/StatusModal';

type AddressType = 'Home' | 'Work' | 'Other';

interface Address {
    id: string;
    type: AddressType;
    label: string;
    address: string;
    isDefault: boolean;
}

export default function AddressBookScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    // Status Modal State
    const [status, setStatus] = useState<{
        visible: boolean;
        type: StatusType;
        title: string;
        message: string;
        primaryAction?: () => void;
        primaryActionText?: string;
    }>({
        visible: false,
        type: 'idle',
        title: '',
        message: ''
    });

    const showStatus = (type: StatusType, title: string, message: string, primaryAction?: () => void, primaryActionText?: string) => {
        setStatus({ visible: true, type, title, message, primaryAction, primaryActionText });
    };

    const hideStatus = () => setStatus(prev => ({ ...prev, visible: false }));

    // Mock Data
    const [addresses, setAddresses] = useState<Address[]>([
        {
            id: '1',
            type: 'Home',
            label: 'Home',
            address: 'Flat 402, Green Valley Apts, Indiranagar, Bangalore - 560038',
            isDefault: true,
        },
        {
            id: '2',
            type: 'Work',
            label: 'Office',
            address: 'WeWork Galaxy, Residency Road, Bangalore - 560025',
            isDefault: false,
        },
    ]);

    const handleDelete = (id: string) => {
        showStatus(
            'warning',
            'Remove Address?',
            'Are you sure you want to delete this address from your book?',
            () => {
                setAddresses(prev => prev.filter(a => a.id !== id));
                hideStatus();
            },
            'Delete'
        );
    };

    const getIcon = (type: AddressType) => {
        switch (type) {
            case 'Home': return <Home size={20} color="#2FA561" />;
            case 'Work': return <Briefcase size={20} color="#6366F1" />;
            default: return <MapPin size={20} color="#6B7280" />;
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Address Book</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {addresses.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconCircle}>
                            <MapPin size={40} color="#9CA3AF" />
                        </View>
                        <Text style={styles.emptyTitle}>No Addresses Found</Text>
                        <Text style={styles.emptyText}>Add an address to make checking out faster.</Text>
                    </View>
                ) : (
                    <View style={styles.list}>
                        {addresses.map((item) => (
                            <View key={item.id} style={styles.card}>
                                <View style={styles.cardHeader}>
                                    <View style={styles.typeBadge}>
                                        {getIcon(item.type)}
                                        <Text style={styles.typeText}>{item.label}</Text>
                                    </View>
                                    {item.isDefault && (
                                        <View style={styles.defaultBadge}>
                                            <Text style={styles.defaultText}>Default</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.addressText}>{item.address}</Text>
                                <View style={styles.cardFooter}>
                                    <TouchableOpacity style={styles.actionButton}>
                                        <Text style={styles.actionText}>Edit</Text>
                                    </TouchableOpacity>
                                    <View style={styles.divider} />
                                    <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => handleDelete(item.id)}
                                    >
                                        <Text style={[styles.actionText, { color: '#EF4444' }]}>Remove</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: insets.bottom - 24 }]}>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => executeAction('OPEN_ADD_ADDRESS')}
                >
                    <Plus size={20} color="#fff" />
                    <Text style={styles.addButtonText}>Add New Address</Text>
                </TouchableOpacity>
            </View>

            {/* Status Modal */}
            <StatusModal
                visible={status.visible}
                status={status.type}
                title={status.title}
                message={status.message}
                onClose={hideStatus}
                primaryAction={status.primaryAction}
                primaryActionText={status.primaryActionText}
                autoCloseDelay={status.type === 'success' ? 2500 : undefined}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FE',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    content: {
        padding: 20,
        paddingBottom: 100,
    },
    list: {
        gap: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    typeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    typeText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    defaultBadge: {
        backgroundColor: '#DCFCE7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    defaultText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#166534',
    },
    addressText: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 22,
        marginBottom: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
    },
    actionButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 4,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
    },
    divider: {
        width: 1,
        height: 16,
        backgroundColor: '#E5E7EB',
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2FA561',
        paddingVertical: 16,
        borderRadius: 14,
        gap: 8,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
