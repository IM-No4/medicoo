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
            <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
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
                style={styles.scroll}
                contentContainerStyle={styles.contentContainer}
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

            {/* Fixed (non-scrolling) safe-area footer - guarantees the strip
                behind the nav bar is always solid white and never has text
                scrolled into it, regardless of scroll position. Reserving
                this as its own sibling (not just ScrollView content padding)
                means it can't be scrolled past - a plain content padding
                only leaves a gap at the very end of the list, but content
                still passes behind the transparent nav bar while scrolling. */}
            <View style={{ height: Math.max(insets.bottom, 16), backgroundColor: '#FFFFFF' }} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        // Absolute + StyleSheet.absoluteFillObject instead of flex: 1 -
        // with the nav bar forced fully transparent (see colors.xml's
        // navigationBarColor + withTransparentNavigationBar.js), that strip
        // shows literally whatever the app draws there, and nothing else.
        // On this screen specifically (reached from AuthStack, nested one
        // level deeper than most routes) a flex: 1 root was coming up short
        // of the true screen bottom, leaving that strip see-through to
        // whatever's behind the app entirely - not tinted, not off-white,
        // genuinely unpainted. Sizing against the root instead of flexing
        // against its immediate parent closes that gap.
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#FFFFFF',
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
    scroll: {
        flex: 1,
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
