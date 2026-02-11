import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    container: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginTop: 24,
        marginBottom: 12,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuText: {
        fontSize: 16,
        color: '#1F2937',
        fontWeight: '500',
    },
    logoutButton: {
        marginTop: 32,
        marginBottom: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#FEF2F2',
    },
    logoutText: {
        color: '#DC2626',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});
