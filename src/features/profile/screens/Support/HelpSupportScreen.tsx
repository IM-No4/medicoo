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
import React, { useEffect, useMemo, useState } from 'react';
import { getReturnPolicy, ReturnPolicy } from '../../../../services/api/returns.api';
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
import { useTheme } from '../../../../theme/ThemeContext';
import type { ThemeColors } from '../../../../theme/colors';
import { useLanguage } from '../../../../i18n/LanguageContext';

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
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
    // Who to write to if you are not satisfied (the e-commerce rules ask for this to be published). Shown once it is set up.
    const [policy, setPolicy] = useState<ReturnPolicy | null>(null);
    useEffect(() => {
        getReturnPolicy().then(setPolicy).catch(() => undefined);
    }, []);

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
            Alert.alert(t('unable_to_open_email'), `Please reach us at ${SUPPORT_EMAIL}`);
        });
    };

    // The helpline number is a setting (Admin > System Settings). Until one is set, this stays honest about it
    // instead of pretending the channel is live.
    const helpline = policy?.grievanceTeam || null;
    const handleCallPress = () => {
        if (!helpline) {
            Alert.alert('Call Us', `This isn't available yet - please email us at ${SUPPORT_EMAIL} in the meantime.`);
            return;
        }
        Linking.openURL(`tel:${helpline.ivrNumber.replace(/\s/g, '')}`).catch(() => {
            Alert.alert('Call Us', `Please dial ${helpline.ivrNumber}`);
        });
    };

    const handleAboutPress = () => {
        Linking.openURL(WEB_APP_URL).catch(() => {
            Alert.alert(t('unable_to_open_link'), WEB_APP_URL);
        });
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                    <ChevronLeft size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('help_support')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Search size={20} color={theme.textMuted} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={t('search_for_help')}
                        placeholderTextColor={theme.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Contact Options */}
                <Text style={styles.sectionLabel}>{t('contact_us')}</Text>
                <View style={styles.contactGrid}>
                    <TouchableOpacity style={styles.contactCard} activeOpacity={0.8} onPress={() => navigation.navigate('LiveChat')}>
                        <View style={[styles.iconBox, { backgroundColor: theme.successBg }]}>
                            <MessageCircle size={22} color="#10B981" />
                        </View>
                        <Text style={styles.contactLabel}>{t('chat')}</Text>
                        <Text style={styles.contactSub}>{t('chat_with_us')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.contactCard} activeOpacity={0.8} onPress={handleEmailPress}>
                        <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                            <Mail size={22} color="#3B82F6" />
                        </View>
                        <Text style={styles.contactLabel}>{t('email_us')}</Text>
                        <Text style={styles.contactSub} numberOfLines={1}>{t('get_in_touch')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.contactCard} activeOpacity={0.8} onPress={handleCallPress}>
                        <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
                            <Phone size={22} color="#F59E0B" />
                        </View>
                        <Text style={styles.contactLabel}>{t('call_us')}</Text>
                        <Text style={styles.contactSub} numberOfLines={1}>{helpline ? helpline.availability : t('coming_soon')}</Text>
                    </TouchableOpacity>
                </View>
                {helpline ? (
                    <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 10, lineHeight: 17 }}>
                        Call {helpline.ivrNumber} for any complaint - whoever on our team is free takes your call. We acknowledge every complaint within {helpline.acknowledgeWithinHours} hours and resolve it within {helpline.resolveWithinDays} days.
                    </Text>
                ) : null}

                {/* FAQs */}
                <Text style={[styles.sectionLabel, { marginTop: 28 }]}>{t('frequently_asked_questions')}</Text>
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
                                        <ChevronDown size={18} color={theme.textMuted} />
                                    ) : (
                                        <ChevronRight size={18} color={theme.textMuted} />
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
                <Text style={[styles.sectionLabel, { marginTop: 28 }]}>{t('other_information')}</Text>
                <View style={styles.linkList}>
                    <TouchableOpacity style={styles.linkItem} activeOpacity={0.7} onPress={handleAboutPress}>
                        <View style={styles.linkLeft}>
                            <View style={[styles.linkIconBox, { backgroundColor: theme.successBg }]}>
                                <Info size={18} color="#10B981" />
                            </View>
                            <Text style={styles.linkText}>{t('about_medicoo')}</Text>
                        </View>
                        <ChevronRight size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.linkItem} activeOpacity={0.7} onPress={() => navigation.navigate('CommunityGuidelines')}>
                        <View style={styles.linkLeft}>
                            <View style={[styles.linkIconBox, { backgroundColor: '#EFF6FF' }]}>
                                <FileText size={18} color="#3B82F6" />
                            </View>
                            <Text style={styles.linkText}>{t('community_guidelines')}</Text>
                        </View>
                        <ChevronRight size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.linkItem} activeOpacity={0.7} onPress={() => navigation.navigate('SecurityStandards')}>
                        <View style={styles.linkLeft}>
                            <View style={[styles.linkIconBox, { backgroundColor: '#FFF7ED' }]}>
                                <Shield size={18} color="#F59E0B" />
                            </View>
                            <Text style={styles.linkText}>{t('security_standards')}</Text>
                        </View>
                        <ChevronRight size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                </View>

                <View style={styles.footer} />
            </ScrollView>
        </View>
    );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: c.background,
    },
    // Same header recipe as the Family Members / Address Book / Medicine
    // Orders screens - white bar + shadow, plain icon back button,
    // fontSize 20/600/#111827 title.
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
    content: {
        padding: 20,
        paddingTop: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: c.card,
        paddingHorizontal: 16,
        height: 52,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: c.borderLight,
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
        color: c.text,
    },
    // Small-caps section label, matching the style used across the home
    // feed's section headers (HEALTH SUMMARY / ACTIVE GOALS) for a
    // consistent visual language app-wide.
    sectionLabel: {
        fontSize: 13,
        color: c.text,
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
        backgroundColor: c.card,
        paddingVertical: 18,
        paddingHorizontal: 10,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: c.borderLight,
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
        color: c.text,
        marginBottom: 3,
    },
    contactSub: {
        fontSize: 10,
        color: c.textMuted,
        fontWeight: '600',
    },
    noResultsBox: {
        backgroundColor: c.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: c.borderLight,
    },
    noResultsText: {
        fontSize: 14,
        color: c.textMuted,
        textAlign: 'center',
        paddingVertical: 20,
    },
    faqList: {
        gap: 10,
    },
    faqItem: {
        backgroundColor: c.card,
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: c.borderLight,
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
        color: c.text,
        flex: 1,
        paddingRight: 16,
    },
    faqQuestionExpanded: {
        color: c.text,
        fontWeight: '700',
    },
    faqAnswer: {
        marginTop: 12,
        fontSize: 13,
        color: c.textSecondary,
        lineHeight: 20,
    },
    linkList: {
        backgroundColor: c.card,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: c.borderLight,
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
        color: c.text,
    },
    divider: {
        height: 1,
        backgroundColor: c.cardSecondary,
        marginHorizontal: 16,
    },
    footer: {
        height: 36,
    },
});
