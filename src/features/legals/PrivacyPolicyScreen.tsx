import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ErrorState from '../../components/layout/ErrorState';
import { getLegalDocument } from '../../services/api/legal.api';
import LegalPage, { LegalSection } from './LegalPage';

const DOCUMENT_TYPE = 'privacy';
const FALLBACK_TITLE = 'Privacy Policy';

// Content is backend-managed (admin-editable) rather than hardcoded, so it
// can change without a new app build - see LegalAcceptanceModal for the
// re-acceptance gate that reacts to those changes.
export default function PrivacyPolicyScreen() {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [title, setTitle] = useState(FALLBACK_TITLE);
    const [sections, setSections] = useState<LegalSection[]>([]);
    const [lastUpdated, setLastUpdated] = useState<string | undefined>(undefined);

    const load = async () => {
        setLoading(true);
        setError(false);
        try {
            const doc = await getLegalDocument(DOCUMENT_TYPE);
            setTitle(doc.title);
            setSections(doc.sections);
            setLastUpdated(doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString() : undefined);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    if (loading || error) {
        return (
            <View style={styles.container}>
                <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                        <ChevronLeft size={22} color="#111827" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{FALLBACK_TITLE}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.center}>
                    {loading ? (
                        <ActivityIndicator size="large" color="#0FBBA1" />
                    ) : (
                        <ErrorState message="Couldn't load Privacy Policy." onRetry={load} />
                    )}
                </View>
            </View>
        );
    }

    return <LegalPage title={title} lastUpdated={lastUpdated} sections={sections} />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
