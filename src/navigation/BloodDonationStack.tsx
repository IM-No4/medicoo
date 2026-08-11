import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import BloodDonationDashboardScreen from '../features/bloodDonation/screens/BloodDonationDashboardScreen';
import BloodDonationHistoryScreen from '../features/bloodDonation/screens/BloodDonationHistoryScreen';
import BloodDonorApplicationScreen from '../features/bloodDonation/screens/BloodDonorApplicationScreen';
import BloodEligibilityFormScreen from '../features/bloodDonation/screens/BloodEligibilityFormScreen';
import BloodRequestSubmitScreen from '../features/bloodDonation/screens/BloodRequestSubmitScreen';

export type BloodDonationStackParamList = {
    BloodDonationDashboard: undefined;
    BloodEligibilityForm: undefined;
    BloodDonorApplication: undefined;
    BloodDonationHistory: undefined;
    BloodRequestSubmit: undefined;
};

const Stack = createNativeStackNavigator<BloodDonationStackParamList>();

export default function BloodDonationStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="BloodDonationDashboard"
                component={BloodDonationDashboardScreen}
            />
            <Stack.Screen
                name="BloodEligibilityForm"
                component={BloodEligibilityFormScreen}
            />
            <Stack.Screen
                name="BloodDonorApplication"
                component={BloodDonorApplicationScreen}
            />
            <Stack.Screen
                name="BloodDonationHistory"
                component={BloodDonationHistoryScreen}
            />
            <Stack.Screen
                name="BloodRequestSubmit"
                component={BloodRequestSubmitScreen}
            />
        </Stack.Navigator>
    );
}
