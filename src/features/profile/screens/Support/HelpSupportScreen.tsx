import { useNavigation } from '@react-navigation/native';
import {
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
import React, { useState } from 'react';
import {
    LayoutAnimation,
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
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

    const toggleFaq = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedFaq(expandedFaq === id ? null : id);
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
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* Contact Options */}
                <Text style={styles.sectionTitle}>Contact Us</Text>
                <View style={styles.contactGrid}>
                    <TouchableOpacity style={styles.contactCard}>
                        <View style={[styles.iconBox, { backgroundColor: '#F0FDF4' }]}>
                            <MessageCircle size={24} color="#2FA561" />
                        </View>
                        <Text style={styles.contactLabel}>Live Chat</Text>
                        <Text style={styles.contactSub}>24/7 Support</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.contactCard}>
                        <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                            <Mail size={24} color="#3B82F6" />
                        </View>
                        <Text style={styles.contactLabel}>Email Us</Text>
                        <Text style={styles.contactSub}>Reply in 2h</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.contactCard}>
                        <View style={[styles.iconBox, { backgroundColor: '#FFF7ED' }]}>
                            <Phone size={24} color="#F59E0B" />
                        </View>
                        <Text style={styles.contactLabel}>Call Us</Text>
                        <Text style={styles.contactSub}>9 AM - 6 PM</Text>
                    </TouchableOpacity>
                </View>

                {/* FAQs */}
                <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Frequently Asked Questions</Text>
                <View style={styles.faqList}>
                    {FAQS.map((faq) => (
                        <TouchableOpacity
                            key={faq.id}
                            style={styles.faqItem}
                            onPress={() => toggleFaq(faq.id)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.faqHeader}>
                                <Text style={styles.faqQuestion}>{faq.question}</Text>
                                <ChevronRight
                                    size={18}
                                    color="#9CA3AF"
                                    style={{ transform: [{ rotate: expandedFaq === faq.id ? '90deg' : '0deg' }] }}
                                />
                            </View>
                            {expandedFaq === faq.id && (
                                <Text style={styles.faqAnswer}>{faq.answer}</Text>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Quick Links */}
                <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Other Information</Text>
                <View style={styles.linkList}>
                    <TouchableOpacity style={styles.linkItem}>
                        <View style={styles.linkLeft}>
                            <Info size={20} color="#6B7280" />
                            <Text style={styles.linkText}>About Medicoo</Text>
                        </View>
                        <ChevronRight size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.linkItem}>
                        <View style={styles.linkLeft}>
                            <FileText size={20} color="#6B7280" />
                            <Text style={styles.linkText}>Community Guidelines</Text>
                        </View>
                        <ChevronRight size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.linkItem}>
                        <View style={styles.linkLeft}>
                            <Shield size={20} color="#6B7280" />
                            <Text style={styles.linkText}>Security Standards</Text>
                        </View>
                        <ChevronRight size={18} color="#9CA3AF" />
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
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 24,
        gap: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 16,
    },
    contactGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    contactCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 10,
        elevation: 2,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    contactLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 4,
    },
    contactSub: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    faqList: {
        gap: 12,
    },
    faqItem: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faqQuestion: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        flex: 1,
        paddingRight: 16,
    },
    faqAnswer: {
        marginTop: 12,
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    linkList: {
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    linkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    linkLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    linkText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#374151',
    },
    divider: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginHorizontal: 16,
    },
    footer: {
        marginTop: 40,
        alignItems: 'center',
        paddingBottom: 20,
    },
    versionText: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
    }
});
