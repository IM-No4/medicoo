import { useNavigation } from '@react-navigation/native';
import * as Contacts from 'expo-contacts';
import * as Location from 'expo-location';
import { Briefcase, Check, ChevronLeft, Contact, Crosshair, Home, MapPin } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import StatusModal, { StatusType } from '../../../../components/modals/StatusModal';

export default function AddAddressScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const [loadingLocation, setLoadingLocation] = useState(false);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(1); // 1: Location, 2: Details & Receiver

    // Status Modal State
    const [status, setStatus] = useState<{
        visible: boolean;
        type: StatusType;
        title: string;
        message: string;
    }>({
        visible: false,
        type: 'idle',
        title: '',
        message: ''
    });

    const showStatus = (type: StatusType, title: string, message: string) => {
        setStatus({ visible: true, type, title, message });
    };

    const hideStatus = () => setStatus(prev => ({ ...prev, visible: false }));

    const [formData, setFormData] = useState({
        fullAddress: '',
        houseNo: '',
        landmark: '',
        tag: 'Home', // Home, Work, Other
        customLabel: '',
        receiverName: '',
        receiverPhone: '',
        isMyAddress: true,
    });

    const ADDRESS_TAGS = ['Home', 'Work', 'Other'];
    const mapRef = useRef<MapView>(null);
    const [region, setRegion] = useState({
        latitude: 12.9716,
        longitude: 77.5946,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
    });

    useEffect(() => {
        handleUseCurrentLocation();
    }, []);

    const handleUseCurrentLocation = async () => {
        setLoadingLocation(true);
        try {
            const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
            if (locStatus !== 'granted') {
                showStatus('warning', 'Permission Denied', 'Please allow location access to automatically detect your address for faster checkout.');
                setLoadingLocation(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const place = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            if (place && place.length > 0) {
                const p = place[0];
                const parts = [
                    p.name !== p.street ? p.name : null, // Include building/business name if distinct
                    p.street,
                    p.district,
                    p.city,
                    p.region,
                    p.postalCode,
                    p.country
                ].filter(Boolean);

                const address = parts.join(', ');
                setFormData(prev => ({
                    ...prev,
                    fullAddress: address
                }));

                const newRegion = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                };
                setRegion(newRegion);
                mapRef.current?.animateToRegion(newRegion, 1000);
            }
        } catch (error) {
            showStatus('error', 'Location Error', 'We couldn\'t fetch your current location. Please search for your address manually.');
        } finally {
            setLoadingLocation(false);
        }
    };

    const handleContactPick = async () => {
        try {
            const { status: contactsStatus } = await Contacts.requestPermissionsAsync();
            if (contactsStatus === 'granted') {
                const { data } = await Contacts.getContactsAsync({
                    fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
                });

                if (data.length > 0) {
                    // Start simplified pick flow (in real app, use modal list)
                    const contact = data[0]; // Just picking first for demo
                    setFormData(prev => ({
                        ...prev,
                        receiverName: contact.name || '',
                        receiverPhone: contact.phoneNumbers?.[0]?.number || ''
                    }));
                } else {
                    showStatus('info', 'No Contacts', 'We couldn\'t find any contacts on your device.');
                }
            } else {
                showStatus('warning', 'Permission Denied', 'Contacts permission is required to pick a receiver from your address book.');
            }
        } catch (e) {
            // console.log(e);
        }
    };

    const handleNext = () => {
        if (!formData.fullAddress) {
            showStatus('warning', 'Address Required', 'Please select a location on the map or search for an address before proceeding.');
            return;
        }
        setStep(2);
    };

    const handleSave = () => {
        if (!formData.houseNo) {
            showStatus('warning', 'Missing Details', 'Please enter your house or flat number to complete the address.');
            return;
        }
        if (!formData.isMyAddress && (!formData.receiverName || !formData.receiverPhone)) {
            showStatus('warning', 'Receiver Info', 'Please provide the name and phone number of the person receiving this order.');
            return;
        }

        setSaving(true);
        // Mock API call
        setTimeout(() => {
            setSaving(false);
            showStatus('success', 'Address Saved', 'Your new delivery address has been added successfully.');
        }, 1000);
    };

    const renderStep1 = () => (
        <View style={{ flex: 1 }}>

            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    style={{ width: '100%', height: '100%' }}
                    initialRegion={region}
                    showsUserLocation
                    showsMyLocationButton={false}
                    onPress={async (e) => {
                        const { latitude, longitude } = e.nativeEvent.coordinate;
                        setRegion(prev => ({ ...prev, latitude, longitude }));

                        try {
                            const place = await Location.reverseGeocodeAsync({ latitude, longitude });
                            if (place && place.length > 0) {
                                const p = place[0];
                                const parts = [
                                    p.name !== p.street ? p.name : null,
                                    p.street,
                                    p.district,
                                    p.city,
                                    p.region,
                                    p.postalCode
                                ].filter(Boolean);
                                setFormData(prev => ({ ...prev, fullAddress: parts.join(', ') }));
                            }
                        } catch (err) {
                            // Reverse geocode error
                        }
                    }}
                >
                    <Marker coordinate={region} />
                </MapView>

                {/* Search Bar Overlay */}
                <View style={styles.searchContainerOverlay}>
                    <GooglePlacesAutocomplete
                        placeholder='Search for area, street name...'
                        onPress={(data, details = null) => {
                            if (details) {
                                const lat = details.geometry.location.lat;
                                const lng = details.geometry.location.lng;
                                const newRegion = {
                                    latitude: lat,
                                    longitude: lng,
                                    latitudeDelta: 0.005,
                                    longitudeDelta: 0.005,
                                };
                                setRegion(newRegion);
                                mapRef.current?.animateToRegion(newRegion, 1000);
                                setFormData(p => ({ ...p, fullAddress: data.description }));
                            }
                        }}
                        query={{
                            key: 'AIzaSyA4Vzs1VRiOO0Sc4MPFDwgRVcVdmfeJSqQ', // Replace with config/env
                            language: 'en',
                        }}
                        fetchDetails={true}
                        styles={{
                            container: { flex: 0 },
                            textInputContainer: {
                                backgroundColor: '#fff',
                                borderRadius: 12,
                                paddingHorizontal: 4,
                                height: 50,
                                shadowColor: "#000",
                                shadowOpacity: 0.1,
                                shadowRadius: 5,
                                elevation: 4,
                            },
                            textInput: {
                                height: 50,
                                color: '#1F2937',
                                fontSize: 16,
                            },
                            listView: {
                                marginTop: 8,
                                borderRadius: 12,
                                backgroundColor: '#fff',
                                elevation: 3,
                            }
                        }}
                    />
                </View>

                {/* Current Location Button */}
                <TouchableOpacity
                    style={styles.fabLocation}
                    onPress={handleUseCurrentLocation}
                    disabled={loadingLocation}
                >
                    {loadingLocation ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Crosshair size={24} color="#fff" />
                    )}
                </TouchableOpacity>

                {/* Bottom Address Preview */}
                <View style={styles.addressPreviewCard}>
                    <View style={styles.addressPreviewHeader}>
                        <MapPin size={20} color="#2FA561" />
                        <Text style={styles.addressPreviewTitle}>Selected Location</Text>
                    </View>
                    <Text style={styles.addressPreviewText} numberOfLines={2}>
                        {formData.fullAddress || 'Search or pick a location on map'}
                    </Text>
                </View>
            </View>
        </View>
    );

    const FloatingLabelInput = ({ label, value, onChangeText, rightIcon, ...props }: any) => {
        const [isFocused, setIsFocused] = useState(false);
        const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

        useEffect(() => {
            Animated.timing(animatedValue, {
                toValue: (isFocused || value) ? 1 : 0,
                duration: 200,
                useNativeDriver: false,
            }).start();
        }, [isFocused, value]);

        const labelStyle = {
            position: 'absolute' as 'absolute',
            left: 16,
            top: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [14, -10],
            }),
            fontSize: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 12],
            }),
            color: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: ['#6B7280', '#2FA561'],
            }),
            backgroundColor: '#fff',
            paddingHorizontal: 4,
            zIndex: 1,
        };

        const borderColor = isFocused ? '#2FA561' : '#E5E7EB';

        return (
            <View style={{ paddingTop: 0, marginBottom: 20 }}>
                <Animated.Text style={labelStyle}>
                    {label}
                </Animated.Text>
                <View style={[styles.floatingInputContainer, { borderColor }]}>
                    <TextInput
                        {...props}
                        value={value}
                        onChangeText={onChangeText}
                        style={styles.floatingInput}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                    />
                    {rightIcon}
                </View>
            </View>
        );
    };

    const renderStep2 = () => (
        <View style={styles.form}>
            {/* Address Details */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Selected Address</Text>
                <Text style={styles.selectedAddress}>{formData.fullAddress}</Text>
                <TouchableOpacity onPress={() => setStep(1)}>
                    <Text style={styles.changeLink}>Change</Text>
                </TouchableOpacity>

                <View style={{ height: 20 }} />

                <FloatingLabelInput
                    label="House / Flat No."
                    value={formData.houseNo}
                    onChangeText={(t: string) => setFormData({ ...formData, houseNo: t })}
                />

                <FloatingLabelInput
                    label="Landmark (Optional)"
                    value={formData.landmark}
                    onChangeText={(t: string) => setFormData({ ...formData, landmark: t })}
                />

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Save As</Text>
                    <View style={styles.tagContainer}>
                        {ADDRESS_TAGS.map(tag => {
                            const isActive = formData.tag === tag;
                            const Icon = tag === 'Home' ? Home : tag === 'Work' ? Briefcase : MapPin;
                            return (
                                <TouchableOpacity
                                    key={tag}
                                    style={[
                                        styles.tagChip,
                                        isActive && styles.tagChipActive
                                    ]}
                                    onPress={() => setFormData({ ...formData, tag })}
                                >
                                    <Icon size={16} color={isActive ? '#2FA561' : '#6B7280'} />
                                    <Text style={[
                                        styles.tagText,
                                        isActive && styles.tagTextActive
                                    ]}>{tag}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {formData.tag === 'Other' && (
                    <FloatingLabelInput
                        label="Label Name"
                        value={formData.customLabel}
                        onChangeText={(t: string) => setFormData({ ...formData, customLabel: t })}
                    />
                )}
            </View>

            {/* Receiver Info */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Receiver Details</Text>

                <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setFormData(p => ({ ...p, isMyAddress: !p.isMyAddress }))}
                >
                    <View style={[styles.checkbox, formData.isMyAddress && styles.checkboxActive]}>
                        {formData.isMyAddress && <Check size={14} color="#fff" />}
                    </View>
                    <Text style={styles.checkboxLabel}>I am the receiver</Text>
                </TouchableOpacity>

                {!formData.isMyAddress && (
                    <View style={{ marginTop: 16 }}>
                        <FloatingLabelInput
                            label="Receiver Name"
                            value={formData.receiverName}
                            onChangeText={(t: string) => setFormData({ ...formData, receiverName: t })}
                            rightIcon={
                                <TouchableOpacity onPress={handleContactPick} style={styles.inputIconBox}>
                                    <Contact size={20} color="#2FA561" />
                                </TouchableOpacity>
                            }
                        />

                        <FloatingLabelInput
                            label="Phone Number"
                            value={formData.receiverPhone}
                            onChangeText={(t: string) => setFormData({ ...formData, receiverPhone: t })}
                            keyboardType="phone-pad"
                        />
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => step === 1 ? navigation.goBack() : setStep(1)} style={styles.backButton}>
                    <ChevronLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{step === 1 ? 'Select Location' : 'Address Details'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.contentContainer}>
                {step === 1 ? renderStep1() : (
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        {renderStep2()}
                    </ScrollView>
                )}
            </View>

            <View style={[styles.footer, { paddingBottom: insets.bottom - 24 }]}>
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={step === 1 ? handleNext : handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveButtonText}>
                            {step === 1 ? 'Confirm Location' : 'Save Address'}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Status Modal */}
            <StatusModal
                visible={status.visible}
                status={status.type}
                title={status.title}
                message={status.message}
                onClose={() => {
                    hideStatus();
                    if (status.type === 'success') navigation.goBack();
                }}
                autoCloseDelay={status.type === 'success' ? 2500 : undefined}
            />
        </KeyboardAvoidingView>
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
        paddingTop: Platform.OS === 'android' ? 40 : 16, // Adjust for status bar if not handled globally
        backgroundColor: '#F8F9FE',
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
    contentContainer: {
        flex: 1,
        marginBottom: 80, // Increased space for footer
    },
    scrollContent: {
        paddingBottom: 40,
    },

    // Step 1 Styles
    mapContainer: {
        flex: 1,
        position: 'relative',
        backgroundColor: '#F3F4F6',
    },
    searchContainerOverlay: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        zIndex: 10,
    },
    fabLocation: {
        position: 'absolute',
        right: 20,
        bottom: 160, // Moved up
        backgroundColor: '#2FA561',
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
    },
    addressPreviewCard: {
        position: 'absolute',
        bottom: 40, // Increased from 20 to avoid overlap
        left: 20,
        right: 20,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    addressPreviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    addressPreviewTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2FA561',
    },
    addressPreviewText: {
        fontSize: 15,
        color: '#1F2937',
        lineHeight: 20,
    },

    // Step 2 Styles
    form: {
        padding: 20,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
    },
    selectedAddress: {
        fontSize: 15,
        lineHeight: 22,
        color: '#4B5563',
        marginBottom: 8,
    },
    changeLink: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2FA561',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1F2937',
    },
    tagContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    tagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: 'transparent',
        gap: 6,
    },
    tagChipActive: {
        backgroundColor: '#F0FDF4',
        borderColor: '#2FA561',
    },
    tagText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6B7280',
    },
    tagTextActive: {
        color: '#2FA561',
        fontWeight: '600',
    },
    checkboxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    checkboxActive: {
        backgroundColor: '#2FA561',
        borderColor: '#2FA561',
    },
    checkboxLabel: {
        fontSize: 15,
        color: '#374151',
    },
    inputWithIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        paddingRight: 12,
    },
    inputIconBox: {
        padding: 8,
    },
    floatingInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingRight: 12,
        backgroundColor: '#fff',
    },
    floatingInput: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#1F2937',
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
    saveButton: {
        backgroundColor: '#2FA561',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
