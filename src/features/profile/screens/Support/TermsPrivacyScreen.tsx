import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Eye, FileText, Lock, ShieldCheck } from 'lucide-react-native';
import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TermsPrivacyScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const sections = [
        {
            title: 'Terms of Service',
            icon: <FileText size={20} color="#2FA561" />,
            content: 'By using Medicoo, you agree to comply with our terms of use. Our platform acts as a facilitator between healthcare providers and patients. While we strive for accuracy, the medical advice provided by doctors is their sole responsibility. Users must provide accurate information and maintain confidentiality of their account credentials.'
        },
        {
            title: 'Privacy Policy',
            icon: <Eye size={20} color="#3B82F6" />,
            content: 'Your privacy is paramount. We collect only necessary data such as your name, contact details, and medical history to provide personalized health services. We never share your sensitive medical records with third-party advertisers. All data transfers are encrypted using industry-standard SSL certificates.'
        },
        {
            title: 'Data Collection',
            icon: <Lock size={20} color="#F59E0B" />,
            content: 'We use cookies and analytical tools to improve app performance. You can manage your consent settings in the app preferences. Your medical documents are stored securely in cloud infrastructure that complies with major healthcare data protection regulations.'
        },
        {
            title: 'NABL & Compliance',
            icon: <ShieldCheck size={20} color="#10B981" />,
            content: 'Our partner labs are NABL certified and strictly follow standard operating procedures. Doctor profiles are verified through official medical council registration numbers before they are allowed to provide consultations on our platform.'
        }
    ];

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Terms & Privacy</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.heroSection}>
                    <View style={styles.shieldCircle}>
                        <ShieldCheck size={40} color="#fff" />
                    </View>
                    <Text style={styles.heroTitle}>Legal & Security</Text>
                    <Text style={styles.heroSubtitle}>Last Updated: January 20, 2026</Text>
                </View>

                {sections.map((section, index) => (
                    <View key={index} style={styles.section}>
                        <View style={styles.sectionHeader}>
                            {section.icon}
                            <Text style={styles.sectionTitleText}>{section.title}</Text>
                        </View>
                        <View style={styles.card}>
                            <Text style={styles.sectionContent}>{section.content}</Text>
                        </View>
                    </View>
                ))}

                <View style={styles.footerNote}>
                    <Text style={styles.noteTitle}>Questions?</Text>
                    <Text style={styles.noteText}>If you have any questions regarding our terms, please contact our legal team at legal@medicoo.com</Text>
                </View>

                <TouchableOpacity style={styles.acceptButton}>
                    <Text style={styles.acceptButtonText}>I Understand</Text>
                </TouchableOpacity>
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
        paddingBottom: 40,
    },
    heroSection: {
        backgroundColor: '#2FA561',
        paddingVertical: 40,
        alignItems: 'center',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        marginBottom: 30,
    },
    shieldCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    heroTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 4,
    },
    heroSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '600',
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
        paddingLeft: 4,
    },
    sectionTitleText: {
        fontSize: 17,
        fontWeight: '800',
        color: '#111827',
    },
    card: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOpacity: 0.02,
        shadowRadius: 10,
        elevation: 2,
    },
    sectionContent: {
        fontSize: 15,
        color: '#4B5563',
        lineHeight: 24,
    },
    footerNote: {
        paddingHorizontal: 30,
        marginTop: 10,
        alignItems: 'center',
    },
    noteTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    noteText: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 20,
    },
    acceptButton: {
        backgroundColor: '#2FA561',
        marginHorizontal: 30,
        marginTop: 40,
        paddingVertical: 18,
        borderRadius: 18,
        alignItems: 'center',
    },
    acceptButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    }
});
