import { useNavigation, useRoute } from '@react-navigation/native';
import * as Contacts from 'expo-contacts';
import * as Location from 'expo-location';
import { Briefcase, Check, ChevronLeft, Contact, Crosshair, Home, MapPin, Search, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import StatusModal, { StatusType } from '../../../../components/modals/StatusModal';
import { apiClient } from '../../../../services/api/client';
import { addUserAddress, updateUserAddress } from '../../../../services/api/address.api';
import { getProfileDetails } from '../../../../services/api/user.api';
import { useTheme } from '../../../../theme/ThemeContext';
import type { ThemeColors } from '../../../../theme/colors';
import { useLanguage } from '../../../../i18n/LanguageContext';

type FloatingLabelInputProps = {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    rightIcon?: React.ReactNode;
} & React.ComponentProps<typeof TextInput>;

function FloatingLabelInput({
    label,
    value,
    onChangeText,
    rightIcon,
    ...props
}: FloatingLabelInputProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    const [isFocused, setIsFocused] = useState(false);
    const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: (isFocused || value) ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [animatedValue, isFocused, value]);

    const labelStyle = {
        position: 'absolute' as const,
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
            outputRange: ['#6B7280', '#10B981'],
        }),
        backgroundColor: theme.card,
        paddingHorizontal: 4,
        zIndex: 1,
    };

    const borderColor = isFocused ? '#10B981' : '#E5E7EB';

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
}

export default function AddAddressScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    const navigation = useNavigation();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
    const authMobile = useSelector((state: any) => state.auth.mobile);

    // Fetched once so "I am the receiver" can actually show/save the
    // logged-in user's own name and number instead of leaving them blank.
    const [myProfile, setMyProfile] = useState<{ name?: string; mobile?: string } | null>(null);
    useEffect(() => {
        getProfileDetails().then((p: any) => {
            setMyProfile({ name: p?.name, mobile: p?.mobile || p?.phone });
        }).catch(() => {});
    }, []);
    const myMobile = myProfile?.mobile || authMobile;

    const [loadingLocation, setLoadingLocation] = useState(false);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(route.params?.fullAddress ? 2 : 1); // 1: Location, 2: Details & Receiver

    // The "Confirm Location" footer sits absolutely over the map on step 1,
    // same as addressPreviewCard - a hardcoded bottom offset on the card
    // drifts out of sync with the footer's real height (which itself grows
    // by insets.bottom on Android), so the card ends up covered by the
    // footer instead of sitting above it. Measuring the actual footer keeps
    // the two in sync regardless of device/inset size.
    const [footerHeight, setFooterHeight] = useState(0);

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

    const showStatus = useCallback((type: StatusType, title: string, message: string) => {
        setStatus({ visible: true, type, title, message });
    }, []);

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

    // Custom autocomplete state - previously used react-native-google-places-
    // autocomplete's own XMLHttpRequest + a manually-fetched auth token
    // passed in as a header. Going through apiClient instead (same client
    // every other screen uses) means the auth header is attached fresh on
    // every request straight from storage, not a token snapshot captured
    // once on mount that could still be null the first time the user types.
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<{ place_id: string; description: string }[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const runPlacesSearch = useCallback((text: string) => {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

        if (text.trim().length < 3) {
            setSuggestions([]);
            setSearchLoading(false);
            return;
        }

        setSearchLoading(true);
        searchDebounceRef.current = setTimeout(async () => {
            try {
                const res = await apiClient.get('/api/maps/place/autocomplete/json', {
                    params: { input: text, language: 'en' },
                });
                setSuggestions(res.data?.predictions || []);
            } catch {
                setSuggestions([]);
            } finally {
                setSearchLoading(false);
            }
        }, 350);
    }, []);

    const handleSearchChange = (text: string) => {
        setSearchQuery(text);
        setShowSuggestions(true);
        runPlacesSearch(text);
    };

    const handleSuggestionPress = async (item: { place_id: string; description: string }) => {
        setShowSuggestions(false);
        setSearchQuery(item.description);
        setSuggestions([]);

        try {
            const res = await apiClient.get('/api/maps/place/details/json', {
                params: { place_id: item.place_id, language: 'en' },
            });
            const location = res.data?.result?.geometry?.location;
            if (location) {
                const newRegion = {
                    latitude: location.lat,
                    longitude: location.lng,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                };
                setRegion(newRegion);
                mapRef.current?.animateToRegion(newRegion, 1000);
            }
            setFormData(p => ({ ...p, fullAddress: res.data?.result?.formatted_address || item.description }));
        } catch {
            // Details lookup failed - still usable with just the picked
            // description and whatever pin position was already showing.
            setFormData(p => ({ ...p, fullAddress: item.description }));
        }
    };

    // Keeps the search box showing the current address when it changes from
    // something other than picking a suggestion (map tap, "use current
    // location") - but never fights the user while they're actively typing/
    // browsing the dropdown.
    useEffect(() => {
        if (!showSuggestions) {
            setSearchQuery(formData.fullAddress);
        }
    }, [formData.fullAddress, showSuggestions]);
    const [region, setRegion] = useState({
        latitude: 12.9716,
        longitude: 77.5946,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
    });

    useEffect(() => {
        if (route.params) {
            const {
                fullAddress,
                houseNo,
                landmark,
                tag,
                receiverName,
                receiverPhone,
                latitude,
                longitude,
            } = route.params;

            setFormData(prev => ({
                ...prev,
                fullAddress: fullAddress || prev.fullAddress,
                houseNo: houseNo || prev.houseNo,
                landmark: landmark || prev.landmark,
                tag: tag || prev.tag,
                receiverName: receiverName || prev.receiverName,
                receiverPhone: receiverPhone || prev.receiverPhone,
                isMyAddress: !receiverName && !receiverPhone,
            }));

            if (latitude && longitude) {
                const newRegion = {
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude),
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                };
                setRegion(newRegion);
            }

            if (fullAddress) {
                setStep(2);
            }
        }
    }, [route.params]);

    const handleUseCurrentLocation = useCallback(async () => {
        setLoadingLocation(true);
        try {
            const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
            if (locStatus !== 'granted') {
                showStatus('warning', t('permission_denied'), t('please_allow_location_access_to_automa'));
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
        } catch {
            showStatus('error', t('location_error'), t('we_couldn_t_fetch_your_current_locatio'));
        } finally {
            setLoadingLocation(false);
        }
    }, [showStatus]);

    useEffect(() => {
        if (!route.params?.fullAddress && !route.params?.latitude) {
            void handleUseCurrentLocation();
        }
    }, [handleUseCurrentLocation, route.params]);

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
                    showStatus('info', t('no_contacts_2'), t('we_couldn_t_find_any_contacts_on_your'));
                }
            } else {
                showStatus('warning', t('permission_denied'), t('contacts_permission_is_required_to_pic'));
            }
        } catch {
            // console.log(e);
        }
    };

    const handleNext = () => {
        if (!formData.fullAddress) {
            showStatus('warning', t('address_required'), t('please_select_a_location_on_the_map_or'));
            return;
        }
        setStep(2);
    };

    const handleSave = async () => {
        if (!formData.houseNo) {
            showStatus('warning', t('missing_details'), t('please_enter_your_house_or_flat_number'));
            return;
        }
        if (!formData.isMyAddress && (!formData.receiverName || !formData.receiverPhone)) {
            showStatus('warning', t('receiver_info'), t('please_provide_the_name_and_phone_numb'));
            return;
        }

        setSaving(true);
        try {
            const payload = {
                label: formData.tag === 'Other' ? formData.customLabel : formData.tag,
                customLabelName: formData.customLabel,
                flatHouseNumber: formData.houseNo,
                nearBy: formData.landmark,
                fullAddress: formData.fullAddress,
                // "I am the receiver" means the logged-in user's own name/
                // number, not blank fields - previously this saved nothing
                // at all for that case.
                receiverName: formData.isMyAddress ? (myProfile?.name || '') : formData.receiverName,
                // Backend's CustomerAddress schema field is receiverNumber -
                // sending receiverPhone here was a silent no-op (Mongoose
                // strict mode drops unknown fields), so the number never
                // actually persisted no matter what was typed.
                receiverNumber: formData.isMyAddress ? (myMobile || '') : formData.receiverPhone,
                isDefault: false,
                location: { 
                    type: "Point", 
                    coordinates: [region.longitude, region.latitude] 
                }
            };
            if (route.params?.id || route.params?._id) {
                await updateUserAddress(route.params.id || route.params._id, payload);
                showStatus('success', t('address_saved'), t('your_delivery_address_has_been_updated'));
            } else {
                await addUserAddress(payload);
                showStatus('success', t('address_saved'), t('your_new_delivery_address_has_been_add'));
            }
        } catch {
            showStatus('error', t('error'), t('failed_to_save_address_please_try_agai'));
        } finally {
            setSaving(false);
        }
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
                        setShowSuggestions(false);
                        setSuggestions([]);

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
                        } catch {
                            // Reverse geocode error
                        }
                    }}
                >
                    <Marker coordinate={region} />
                </MapView>

                {/* Search Bar Overlay - own debounced search against apiClient
                    (same client + auth handling every other screen uses)
                    instead of react-native-google-places-autocomplete's own
                    XHR + manually-snapshotted auth header. */}
                <View style={styles.searchContainerOverlay}>
                    <View style={styles.searchInputBox}>
                        <Search size={18} color={theme.textSecondary} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={t('search_for_area_street_name')}
                            placeholderTextColor={theme.textMuted}
                            value={searchQuery}
                            onChangeText={handleSearchChange}
                            onFocus={() => setShowSuggestions(true)}
                        />
                        {searchLoading ? (
                            <ActivityIndicator size="small" color="#10B981" />
                        ) : searchQuery.length > 0 ? (
                            <TouchableOpacity
                                onPress={() => {
                                    setSearchQuery('');
                                    setSuggestions([]);
                                }}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <X size={18} color={theme.textMuted} />
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    {showSuggestions && suggestions.length > 0 && (
                        <View style={styles.suggestionsBox}>
                            <FlatList
                                data={suggestions}
                                keyExtractor={(item) => item.place_id}
                                keyboardShouldPersistTaps="handled"
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.suggestionRow}
                                        onPress={() => handleSuggestionPress(item)}
                                    >
                                        <MapPin size={16} color="#10B981" />
                                        <Text style={styles.suggestionText} numberOfLines={2}>
                                            {item.description}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                ItemSeparatorComponent={() => <View style={styles.suggestionSeparator} />}
                            />
                        </View>
                    )}
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
                <View style={[styles.addressPreviewCard, { bottom: footerHeight + 12 }]}>
                    <View style={styles.addressPreviewHeader}>
                        <MapPin size={20} color="#10B981" />
                        <Text style={styles.addressPreviewTitle}>{t('selected_location')}</Text>
                    </View>
                    <Text style={styles.addressPreviewText} numberOfLines={2}>
                        {formData.fullAddress || 'Search or pick a location on map'}
                    </Text>
                </View>
            </View>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.form}>
            {/* Address Details */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('selected_address')}</Text>
                <View style={styles.selectedAddressBox}>
                    <MapPin size={18} color="#10B981" />
                    <Text style={styles.selectedAddress}>{formData.fullAddress}</Text>
                </View>
                <TouchableOpacity onPress={() => setStep(1)}>
                    <Text style={styles.changeLink}>Change</Text>
                </TouchableOpacity>

                <View style={{ height: 20 }} />

                <FloatingLabelInput
                    label={t('house_flat_no')}
                    value={formData.houseNo}
                    onChangeText={(t: string) => setFormData({ ...formData, houseNo: t })}
                />

                <FloatingLabelInput
                    label={t('landmark_optional')}
                    value={formData.landmark}
                    onChangeText={(t: string) => setFormData({ ...formData, landmark: t })}
                />

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{t('save_as')}</Text>
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
                                    <Icon size={16} color={isActive ? '#10B981' : '#6B7280'} />
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
                        label={t('label_name')}
                        value={formData.customLabel}
                        onChangeText={(t: string) => setFormData({ ...formData, customLabel: t })}
                    />
                )}
            </View>

            {/* Receiver Info */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('receiver_details')}</Text>

                <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setFormData(p => ({ ...p, isMyAddress: !p.isMyAddress }))}
                >
                    <View style={[styles.checkbox, formData.isMyAddress && styles.checkboxActive]}>
                        {formData.isMyAddress && <Check size={14} color="#fff" />}
                    </View>
                    <Text style={styles.checkboxLabel}>{t('i_am_the_receiver')}</Text>
                </TouchableOpacity>

                {formData.isMyAddress ? (
                    <View style={styles.myReceiverBox}>
                        <Text style={styles.myReceiverText}>
                            {myProfile?.name || 'Loading…'}{myMobile ? `, ${myMobile}` : ''}
                        </Text>
                    </View>
                ) : (
                    <View style={{ marginTop: 16 }}>
                        <FloatingLabelInput
                            label={t('receiver_name')}
                            value={formData.receiverName}
                            onChangeText={(t: string) => setFormData({ ...formData, receiverName: t })}
                            rightIcon={
                                <TouchableOpacity onPress={handleContactPick} style={styles.inputIconBox}>
                                    <Contact size={20} color="#10B981" />
                                </TouchableOpacity>
                            }
                        />

                        <FloatingLabelInput
                            label={t('phone_number')}
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
            // Android's "height" behavior shrinks the view when the keyboard
            // opens but doesn't reliably grow it back once the keyboard
            // closes, leaving the screen stuck with extra bottom padding -
            // same bug already fixed this way elsewhere (AddMedicationScreen,
            // LoginScreen). windowSoftInputMode="adjustResize" (set globally)
            // already resizes the window correctly on its own, so Android
            // needs no behavior here at all.
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
        >
            <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
                <TouchableOpacity onPress={() => step === 1 ? navigation.goBack() : setStep(1)} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{step === 1 ? 'Select Location' : 'Address Details'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.contentContainer}>
                {step === 1 ? renderStep1() : (
                    <ScrollView
                        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + footerHeight }]}
                        keyboardShouldPersistTaps="handled"
                        keyboardDismissMode="on-drag"
                    >
                        {renderStep2()}
                    </ScrollView>
                )}
            </View>

            <View
                style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}
                onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
            >
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

const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: c.background,
    },
    // Same header recipe as the Family Members / Address Book screens -
    // white bar + shadow, plain icon back button, fontSize 20/600/#111827
    // title. paddingTop is applied inline via insets.top (see JSX).
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 16,
        backgroundColor: c.card,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
            android: { elevation: 2 },
        }),
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: c.text,
    },
    contentContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },

    // Step 1 Styles
    mapContainer: {
        flex: 1,
        position: 'relative',
        backgroundColor: c.cardSecondary,
    },
    searchContainerOverlay: {
        position: 'absolute',
        top: 20,
        left: 20,
        right: 20,
        zIndex: 10,
    },
    searchInputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: c.card,
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 4,
    },
    searchInput: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: c.text,
    },
    suggestionsBox: {
        marginTop: 8,
        maxHeight: 260,
        borderRadius: 12,
        backgroundColor: c.card,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 4,
        overflow: 'hidden',
    },
    suggestionRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    suggestionText: {
        flex: 1,
        fontSize: 14,
        color: c.text,
        lineHeight: 19,
    },
    suggestionSeparator: {
        height: 1,
        backgroundColor: c.cardSecondary,
        marginLeft: 40,
    },
    fabLocation: {
        position: 'absolute',
        right: 20,
        bottom: 160, // Moved up
        backgroundColor: '#10B981',
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
        backgroundColor: c.card,
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
        color: '#10B981',
    },
    addressPreviewText: {
        fontSize: 15,
        color: c.text,
        lineHeight: 20,
    },

    // Step 2 Styles - white cards on the screen's off-white background,
    // same recipe used everywhere else in the app (ProfileDetailsScreen,
    // AddMedicationModal) rather than the form fields floating directly on
    // the bare background with no card boundary.
    form: {
        padding: 20,
    },
    section: {
        backgroundColor: c.card,
        borderRadius: 18,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: c.text,
        marginBottom: 16,
    },
    selectedAddressBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        backgroundColor: c.successBg,
        borderRadius: 14,
        padding: 14,
        marginBottom: 4,
    },
    selectedAddress: {
        flex: 1,
        fontSize: 14,
        lineHeight: 21,
        color: c.text,
    },
    changeLink: {
        fontSize: 13,
        fontWeight: '700',
        color: '#10B981',
        marginTop: 10,
        alignSelf: 'flex-start',
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: c.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: c.cardSecondary,
        borderWidth: 1,
        borderColor: c.border,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: c.text,
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
        backgroundColor: c.cardSecondary,
        borderWidth: 1,
        borderColor: 'transparent',
        gap: 6,
    },
    tagChipActive: {
        backgroundColor: c.successBg,
        borderColor: '#10B981',
    },
    tagText: {
        fontSize: 14,
        fontWeight: '500',
        color: c.textSecondary,
    },
    tagTextActive: {
        color: '#10B981',
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
        borderColor: c.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    checkboxActive: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    checkboxLabel: {
        fontSize: 15,
        color: c.text,
    },
    myReceiverBox: {
        backgroundColor: c.cardSecondary,
        borderWidth: 1,
        borderColor: c.borderLight,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    myReceiverText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
    },
    inputWithIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: c.cardSecondary,
        borderWidth: 1,
        borderColor: c.border,
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
        backgroundColor: c.card,
    },
    floatingInput: {
        flex: 1,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: c.text,
    },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: c.card,
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: c.borderLight,
    },
    saveButton: {
        backgroundColor: '#10B981',
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
