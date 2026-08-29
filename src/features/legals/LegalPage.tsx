import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import {
    Platform,
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
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            {/* Header - same recipe as the rest of the Profile screens: white
                bar + shadow, plain icon back button, fontSize 20/600/#111827
                title. */}
            <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                    activeOpacity={0.7}
                >
                    <ChevronLeft size={22} color="#111827" />
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
        backgroundColor: '#fff',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 16,
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
        color: '#111827',
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
