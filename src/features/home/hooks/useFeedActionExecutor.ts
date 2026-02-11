import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { FeedAction } from '../feed/feed.actions';

export function useFeedActionExecutor() {
    const navigation = useNavigation<any>();

    const executeAction = useCallback((action?: FeedAction) => {
        if (!action) return;

        switch (action.type) {
            case 'NAVIGATE':
                if (action.stack) {
                    // If stack is provided, navigate to stack then screen, or just stack
                    // Limitations of React Navigation types here often require hacks or specific structures
                    // Assuming simple navigation for now
                    navigation.navigate(action.stack, {
                        screen: action.screen,
                        params: action.params
                    });
                } else {
                    navigation.navigate(action.screen, action.params);
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
                    // If it's a screen in a modal stack:
                    // navigation.navigate('AppointmentModal', action.data);
                    console.warn('Modal opening not yet fully implemented for:', action.modalId);
                } else {
                    console.warn('Unknown Modal ID:', action.modalId);
                }
                break;

            default:
                console.warn('Unknown action type');
        }
    }, [navigation]);

    return { executeAction };
}
