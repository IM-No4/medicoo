import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface LegalSection {
    heading?: string;
    body: string;
}

interface LegalPageProps {
    title: string;
    lastUpdated?: string;
    sections: LegalSection[];
}

export default function LegalPage({ title, lastUpdated, sections }: LegalPageProps) {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0FBBA1" />
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <ArrowLeft size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{title}</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Content */}
            <ScrollView
                contentContainerStyle={[
                    styles.contentContainer,
                    { paddingBottom: insets.bottom + 24 },
                ]}
                showsVerticalScrollIndicator={false}
            >
                {lastUpdated && (
                    <Text style={styles.lastUpdated}>Last Updated: {lastUpdated}</Text>
                )}

                {sections.map((section, index) => (
                    <View key={index} style={styles.section}>
                        {section.heading && (
                            <Text style={styles.sectionHeading}>{section.heading}</Text>
                        )}
                        <Text style={styles.sectionBody}>{section.body}</Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB', // Slightly off-white background
    },
    header: {
        backgroundColor: '#0FBBA1',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        minHeight: 60,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    contentContainer: {
        padding: 24,
    },
    lastUpdated: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 24,
        fontStyle: 'italic',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeading: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    sectionBody: {
        fontSize: 14,
        lineHeight: 24,
        color: '#4B5563',
        textAlign: 'justify',
    },
});
