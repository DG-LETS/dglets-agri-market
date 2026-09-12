import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SplashScreen }     from '@screens/auth/SplashScreen';
import { OnboardingScreen } from '@screens/auth/OnboardingScreen';
import { LoginScreen }      from '@screens/auth/LoginScreen';
import { RegisterScreen }   from '@screens/auth/RegisterScreen';
import { OtpScreen }        from '@screens/auth/OtpScreen';
import { ForgotPasswordScreen } from '@screens/auth/ForgotPasswordScreen';

export type AuthStackParamList = {
  Splash:         undefined;
  Onboarding:     undefined;
  Login:          undefined;
  Register:       undefined;
  Otp:            { userId: string; purpose: string; phone: string };
  ForgotPassword: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false, animationEnabled: true }}
    >
      <Stack.Screen name="Splash"         component={SplashScreen} />
      <Stack.Screen name="Onboarding"     component={OnboardingScreen} />
      <Stack.Screen name="Login"          component={LoginScreen} />
      <Stack.Screen name="Register"       component={RegisterScreen} />
      <Stack.Screen name="Otp"            component={OtpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
