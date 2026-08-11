import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { useDispatch } from 'react-redux';
import { setPrescriptionModalVisible } from '../../../redux/slices/appSlice';
import { FeedAction } from '../feed/feed.actions';

export function useFeedActionExecutor() {
    const navigation = useNavigation<any>();
    const dispatch = useDispatch();

    const executeAction = useCallback((action?: FeedAction) => {
        if (!action) return;

        switch (action.type) {
            case 'NAVIGATE':
                let stack = action.stack;
                let screen = action.screen;
                let params = action.params;

                // Patch legacy/incorrect routes
                if (stack === 'ProfileStack' || stack === 'Profile') {
                    if (screen === 'Eligibility' || screen === 'BloodDonation') {
                        stack = 'BloodDonationStack';
                        screen = 'BloodDonationDashboard';
                    } else {
                        // Profile is a tab name, not a stack name in top-level navigator
                        navigation.navigate('Tabs', {
                            screen: 'Profile',
                            params: { screen, params }
                        });
                        return;
                    }
                }

                // Intercept Coming Soon features (Path Labs & Hospitals)
                if (stack === 'LabStack' || screen === 'LabList' || screen === 'LabTests') {
                    navigation.navigate('ComingSoon', { featureName: 'Path Labs' });
                    return;
                }
                if (stack === 'HospitalStack' || screen === 'HospitalFeed' || screen === 'HospitalDetail') {
                    navigation.navigate('ComingSoon', { featureName: 'Hospitals' });
                    return;
                }

                if (stack === 'HomeStack' || stack === 'Home') {
                    navigation.navigate('Tabs', {
                        screen: 'Home',
                        params: { screen, params }
                    });
                    return;
                }

                if (stack) {
                    navigation.navigate(stack, {
                        screen: screen,
                        params: params
                    });
                } else {
                    navigation.navigate(screen, params);
                }
                break;

            case 'OPEN_URL':
                Linking.openURL(action.url).catch(err =>
                    console.error("Couldn't load page", err)
                );
                break;

            case 'SHOW_TOAST':
                // Replace with actual Toast component if available, fallback to Alert
                Alert.alert(action.variant?.toUpperCase() || 'INFO', action.message);
                break;

            case 'OPEN_MODAL':
                // Requires a global modal manager or handling specific modals via navigation
                // For now, mapping some known modals to navigation routes if they are screens
                if (action.modalId === 'REQUEST_APPOINTMENT') {
                    // Logic to open request appointment modal
                    console.warn('Modal opening not yet fully implemented for:', action.modalId);
                } else if (action.modalId === 'UPLOAD_RX') {
                    dispatch(setPrescriptionModalVisible(true));
                } else {
                    console.warn('Unknown Modal ID:', action.modalId);
                }
                break;

            default:
                console.warn('Unknown action type');
        }
    }, [navigation, dispatch]);

    return { executeAction };
}
