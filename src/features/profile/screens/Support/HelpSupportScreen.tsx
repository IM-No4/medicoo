import { WEB_APP_URL } from '@/src/config/env';
import { useNavigation } from '@react-navigation/native';
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    FileText,
    Info,
    Mail,
    MessageCircle,
    Phone,
    Search,
    Shield
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
    Alert,
    LayoutAnimation,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    UIManager,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SUPPORT_EMAIL = 'support@medicoo.in';

const isNewArch = (global as any).nativeFabric != null;
if (Platform.OS === 'android' && !isNewArch && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS = [
    {
        id: '1',
        question: 'How do I book a consultation?',
        answer: 'You can book a consultation by selecting a doctor from the home screen or search, choosing a convenient time slot, and completing the payment.'
    },
    {
        id: '2',
        question: 'Can I cancel my medicine order?',
        answer: 'Yes, you can cancel your order from the "Medicine Orders" section in your profile as long as the order hasn\'t been shipped yet.'
    },
    {
        id: '3',
        question: 'How do I access my lab reports?',
        answer: 'Once your lab test is completed and the report is generated, it will appear under the "Lab Tests" section in your profile. You can view and download it from there.'
    },
    {
        id: '4',
        question: 'Is my data secure?',
        answer: 'Absolutely. We use industry-standard encryption to ensure all your personal and medical data is kept private and secure.'
    }
];

export default function HelpSupportScreen() {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

    const toggleFaq = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedFaq(expandedFaq === id ? null : id);
    };

    const filteredFaqs = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return FAQS;
        return FAQS.filter(f => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
    }, [searchQuery]);

    const handleEmailPress = () => {
        Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {
            Alert.alert('Unable to open email', `Please reach us at ${SUPPORT_EMAIL}`);
        });
    };

    // No general phone line exists yet - this stays honest about that
    // instead of pretending the channel is live.
    const handleUnavailableChannel = (title: string) => {
        Alert.alert(title, `This isn't available yet - please email us at ${SUPPORT_EMAIL} in the meantime.`);
    };

    const handleAboutPress = () => {
        Linking.openURL(WEB_APP_URL).catch(() => {
            Alert.alert('Unable to open link', WEB_APP_URL);
        });
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help & Support</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Search size={20} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search for help..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Contact Options */}
                <Text style={styles.sectionLabel}>Contact Us</Text>
                <View style={styles.contactGrid}>
                    <TouchableOpacity style={styles.contactCard} activeOpacity={0.8} onPress={() => navigation.navigate('LiveChat')}>
                        <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                            <MessageCircle size={22} color="#0FBBA1" />
                        </View>
                        <Text style={styles.contactLabel}>Chat</Text>
                        <Text style={styles.contactSub}>Chat with us</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.contactCard} activeOpacity={0.8} onPress={handleEmailPress}>
                        <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                            <Mail size={22} color="#3B82F6" />
                        </View>
                        <Text style={styles.contactLabel}>Email Us</Text>
                        <Text style={styles.contactSub} numberOfLines={1}>Get in touch</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.contactCard} activeOpacity={0.8} onPress={() => handleUnavailableChannel('Call Us')}>
                        <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
                            <Phone size={22} color="#F59E0B" />
                        </View>
                        <Text style={styles.contactLabel}>Call Us</Text>
                        <Text style={styles.contactSub}>Coming Soon</Text>
                    </TouchableOpacity>
                </View>

                {/* FAQs */}
                <Text style={[styles.sectionLabel, { marginTop: 28 }]}>Frequently Asked Questions</Text>
                <View style={styles.faqList}>
                    {filteredFaqs.length === 0 && (
                        <View style={styles.noResultsBox}>
                            <Text style={styles.noResultsText}>No results for "{searchQuery}"</Text>
                        </View>
                    )}
                    {filteredFaqs.map((faq) => {
                        const isExpanded = expandedFaq === faq.id;
                        return (
                            <TouchableOpacity
                                key={faq.id}
                                style={[styles.faqItem, isExpanded && styles.faqItemExpanded]}
                                onPress={() => toggleFaq(faq.id)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.faqHeader}>
                                    <Text style={[styles.faqQuestion, isExpanded && styles.faqQuestionExpanded]}>{faq.question}</Text>
                                    {isExpanded ? (
                                        <ChevronDown size={18} color="#9CA3AF" />
                                    ) : (
                                        <ChevronRight size={18} color="#9CA3AF" />
                                    )}
                                </View>
                                {isExpanded && (
                                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Quick Links */}
                <Text style={[styles.sectionLabel, { marginTop: 28 }]}>Other Information</Text>
                <View style={styles.linkList}>
                    <TouchableOpacity style={styles.linkItem} activeOpacity={0.7} onPress={handleAboutPress}>
                        <View style={styles.linkLeft}>
                            <View style={[styles.linkIconBox, { backgroundColor: '#F0FDF4' }]}>
                                <Info size={18} color="#0FBBA1" />
                            </View>
                            <Text style={styles.linkText}>About Medicoo</Text>
                        </View>
                        <ChevronRight size={18} color="#D1D5DB" />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.linkItem} activeOpacity={0.7} onPress={() => navigation.navigate('CommunityGuidelines')}>
                        <View style={styles.linkLeft}>
                            <View style={[styles.linkIconBox, { backgroundColor: '#EFF6FF' }]}>
                                <FileText size={18} color="#3B82F6" />
                            </View>
                            <Text style={styles.linkText}>Community Guidelines</Text>
                        </View>
                        <ChevronRight size={18} color="#D1D5DB" />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.linkItem} activeOpacity={0.7} onPress={() => navigation.navigate('SecurityStandards')}>
                        <View style={styles.linkLeft}>
                            <View style={[styles.linkIconBox, { backgroundColor: '#FFF7ED' }]}>
                                <Shield size={18} color="#F59E0B" />
                            </View>
                            <Text style={styles.linkText}>Security Standards</Text>
                        </View>
                        <ChevronRight size={18} color="#D1D5DB" />
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.versionText}>Medicoo App v1.0.0</Text>
                </View>
            </ScrollView>
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
        paddingBottom: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        padding: 8,
        marginLeft: -12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    content: {
        padding: 20,
        paddingTop: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        height: 52,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        marginBottom: 24,
        gap: 12,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
        elevation: 1,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#111827',
    },
    // Small-caps section label, matching the style used across the home
    // feed's section headers (HEALTH SUMMARY / ACTIVE GOALS) for a
    // consistent visual language app-wide.
    sectionLabel: {
        fontSize: 13,
        color: '#494949',
        letterSpacing: 2,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 14,
    },
    contactGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    contactCard: {
        flex: 1,
        backgroundColor: '#fff',
        paddingVertical: 18,
        paddingHorizontal: 10,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 1,
    },
    iconBox: {
        width: 46,
        height: 46,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    contactLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 3,
    },
    contactSub: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    noResultsBox: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    noResultsText: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        paddingVertical: 20,
    },
    faqList: {
        gap: 10,
    },
    faqItem: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
        elevation: 1,
    },
    faqItemExpanded: {
        borderColor: '#DCFCE7',
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faqQuestion: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        flex: 1,
        paddingRight: 16,
    },
    faqQuestionExpanded: {
        color: '#111827',
        fontWeight: '700',
    },
    faqAnswer: {
        marginTop: 12,
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 20,
    },
    linkList: {
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
        elevation: 1,
    },
    linkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
    },
    linkLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    linkIconBox: {
        width: 36,
        height: 36,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    linkText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginHorizontal: 16,
    },
    footer: {
        marginTop: 36,
        alignItems: 'center',
        paddingBottom: 20,
    },
    versionText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
    },
});
