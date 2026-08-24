import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ProfileHeaderProps {
    name: string | null;
    profileImage: string | null;
    onEditPress: () => void;
}

export default function ProfileHeader({ name, profileImage, onEditPress }: ProfileHeaderProps) {
    return (
        <TouchableOpacity
            style={styles.profileCard}
            activeOpacity={0.9}
            onPress={onEditPress}
        >
            <LinearGradient
                colors={['#0FBBA1', '#007C69']}
                start={Platform.select({ ios: { x: 0, y: 0 }, android: { x: 0.2, y: 0 } })}
                end={Platform.select({ ios: { x: 1, y: 0.9 }, android: { x: 0.8, y: 1 } })}
                style={StyleSheet.absoluteFill}
            />
            <Image
                source={require('../../../assets/images/noise.png')}
                resizeMode="repeat"
                blurRadius={1}
                style={[StyleSheet.absoluteFill, { opacity: 0.04 }]}
            />

            <View style={styles.profileCardContent}>
                <View style={styles.avatarContainer}>
                    {profileImage ? (
                        <Image source={{ uri: profileImage }} style={styles.avatar} />
                    ) : (
                        <View style={styles.placeholderAvatar}>
                            <Text style={styles.initials}>{name ? name.charAt(0).toUpperCase() : 'U'}</Text>
                        </View>
                    )}
                </View>
                <View style={styles.infoContainer}>
                    <Text style={styles.name}>{name || 'User'}</Text>
                    <Text style={styles.viewProfileText}>View / Edit Profile</Text>
                </View>
                <ChevronRight size={20} color="rgba(255,255,255,0.8)" />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    profileCard: {
        marginHorizontal: 20,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
        marginTop: 16,
        minHeight: 140,
        justifyContent: 'center',
    },
    profileCardContent: {
        paddingVertical: 20,
        paddingHorizontal: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16
    },
    avatarContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)'
    },
    avatar: { width: '100%', height: '100%' },
    placeholderAvatar: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
    initials: { fontSize: 24, fontWeight: '600', color: '#fff' },
    infoContainer: { flex: 1 },
    name: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
    viewProfileText: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },
});
