import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { API_URL as API } from '../../config/api';
import { COLORS } from '../../theme/colors';

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep]               = useState(1);
  const [email, setEmail]             = useState('');
  const [otp, setOtp]                 = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPw, setConfirmPw]     = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const sendOTP = async () => {
    if (!email.includes('@')) { setError('Enter a valid email'); return; }
    setLoading(true); setError('');
    try {
      await axios.post(`${API}/auth/forgot-password`, { email });
      setStep(2);
    } catch (e) { setError(e.response?.data?.msg || 'Failed to send OTP'); }
    finally { setLoading(false); }
  };

  const resetPassword = async () => {
    if (otp.length !== 6) { setError('Enter the 6-digit OTP'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPw) { setError('Passwords do not match'); return; }
    setLoading(true); setError('');
    try {
      await axios.post(`${API}/auth/reset-password`, { email, otp, newPassword });
      navigation.navigate('Login', { message: 'Password reset! Please login.' });
    } catch (e) { setError(e.response?.data?.msg || 'Failed to reset password'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 12 }}>
          <Text style={{ color: COLORS.accent, fontWeight: '700' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.sub}>
          {step === 1 ? 'Enter your email to receive an OTP' : `OTP sent to ${email}`}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {step === 1 ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={email}
              onChangeText={t => { setEmail(t); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={COLORS.textMuted}
            />
            <TouchableOpacity style={styles.btn} onPress={sendOTP} disabled={loading}>
              {loading ? <ActivityIndicator color={COLORS.primary} /> : <Text style={styles.btnText}>Send OTP</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              placeholder="6-digit OTP"
              value={otp}
              onChangeText={t => { setOtp(t.replace(/\D/g,'')); setError(''); }}
              keyboardType="number-pad"
              maxLength={6}
              placeholderTextColor={COLORS.textMuted}
            />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              value={newPassword}
              onChangeText={t => { setNewPassword(t); setError(''); }}
              secureTextEntry
              placeholderTextColor={COLORS.textMuted}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              value={confirmPw}
              onChangeText={t => { setConfirmPw(t); setError(''); }}
              secureTextEntry
              placeholderTextColor={COLORS.textMuted}
            />
            <TouchableOpacity style={styles.btn} onPress={resetPassword} disabled={loading}>
              {loading ? <ActivityIndicator color={COLORS.primary} /> : <Text style={styles.btnText}>Reset Password</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep(1)} style={{ marginTop: 12, alignSelf: 'center' }}>
              <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Change email</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.bgLight },
  header: { backgroundColor: COLORS.primary, paddingTop: 56, paddingBottom: 28, paddingHorizontal: 24 },
  title:  { fontSize: 26, fontWeight: '900', color: COLORS.white, marginBottom: 4 },
  sub:    { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500' },
  form:   { padding: 24 },
  error:  { backgroundColor: '#fff1f2', color: '#be123c', padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: '700', borderWidth: 1, borderColor: '#fecdd3' },
  input:  { backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 14, fontSize: 15, color: COLORS.dark, marginBottom: 14, fontWeight: '500' },
  btn:    { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
  btnText:{ color: COLORS.accent, fontSize: 16, fontWeight: '800' },
});
