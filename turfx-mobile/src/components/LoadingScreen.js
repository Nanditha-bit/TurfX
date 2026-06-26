import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

export default function LoadingScreen({ message = 'Loading...' }) {
  return (
    <View style={s.root}>
      <Text style={s.logo}>TurfX</Text>
      <ActivityIndicator color={COLORS.accent} size="large" style={{ marginTop: 24 }} />
      <Text style={s.msg}>{message}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  logo: { fontSize: 40, fontWeight: '900', color: COLORS.accent, letterSpacing: -1 },
  msg:  { color: 'rgba(255,255,255,0.6)', marginTop: 12, fontSize: 14, fontWeight: '500' },
});
