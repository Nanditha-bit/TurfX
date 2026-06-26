// Admin login is handled through the partner login tab in LoginScreen.js
// Admin users (role='admin') are redirected to AdminDashboard after login.
// This screen is just a redirect to Login.
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '../../theme/colors';

export default function AdminLoginScreen({ navigation }) {
  useEffect(() => {
    navigation.replace('Login');
  }, []);
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary }}>
      <ActivityIndicator color={COLORS.accent} size="large" />
    </View>
  );
}
