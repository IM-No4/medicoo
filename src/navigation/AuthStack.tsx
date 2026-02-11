import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';

import LoginScreen from '../features/auth/LoginScreen';
import OtpVerificationScreen from '../features/auth/OtpVerificationScreen';
import IntroScreen from '../features/intro/IntroScreen';

import ContentPolicyScreen from '../features/legals/ContentPolicyScreen';
import PrivacyPolicyScreen from '../features/legals/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../features/legals/TermsOfServiceScreen';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  const [introSeen, setIntroSeen] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('intro_seen').then(v => {
      setIntroSeen(v === 'true');
    });
  }, []);

  if (introSeen === null) return null; // small loader if needed

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!introSeen && (
        <Stack.Screen name="Intro">
          {props => (
            <IntroScreen
              {...props}
              onFinish={async () => {
                await AsyncStorage.setItem('intro_seen', 'true');
                setIntroSeen(true);
              }}
            />
          )}
        </Stack.Screen>
      )}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
      <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="ContentPolicy" component={ContentPolicyScreen} />
    </Stack.Navigator>
  );
}
