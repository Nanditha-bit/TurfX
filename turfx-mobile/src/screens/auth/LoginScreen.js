import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator, StatusBar, Image,
} from 'react-native';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_URL as API } from '../../config/api';
import { COLORS } from '../../theme/colors';
import { Eye, EyeOff, Settings, User, Trophy, Globe } from 'lucide-react-native';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();

  // Mode: 'user' or 'partner'
  const [mode, setMode]         = useState('user');
  const [tab, setTab]           = useState('login');
  const [isAdminMode, setIsAdminMode] = useState(false);

  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr]           = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [regName, setRegName]         = useState('');
  const [regPhone, setRegPhone]       = useState('');
  const [regEmail, setRegEmail]       = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm]   = useState('');
  const [regBusiness, setRegBusiness] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const reset = () => { setPhone(''); setPassword(''); setErr(''); setRegName(''); setRegPhone(''); setRegEmail(''); setRegPassword(''); setRegConfirm(''); setRegBusiness(''); };

  const handleLogin = async () => {
    if (phone.length < 10) { setErr('Enter a valid 10-digit mobile number'); return; }
    if (!password)          { setErr('Please enter your password'); return; }
    setLoading(true); setErr('');
    try {
      const res = await axios.post(`${API}/auth/password-login`, { phone: `+91${phone}`, password });
      const { role } = res.data.user;

      if (mode === 'partner') {
        if (role !== 'owner' && role !== 'admin') {
          setErr('This account is not a partner/owner account.'); return;
        }
        await login(res.data.user, res.data.token);
        navigation.replace(role === 'admin' ? 'AdminDashboard' : 'PartnerApp');
      } else {
        if (role === 'owner' || role === 'admin') {
          setErr('This is a partner account. Switch to Partner Login below.'); return;
        }
        await login(res.data.user, res.data.token);
        navigation.replace('MainApp');
      }
    } catch (e) {
      if (!e.response) {
        // No response = network error (backend not reachable)
        setErr('Cannot connect to server. Please check your internet connection.');
      } else {
        setErr(e.response?.data?.msg || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    console.log('📝 handleRegister STARTED');
    console.log('📱 Mode:', mode);
    console.log('👤 Name:', regName);
    console.log('📞 Phone:', regPhone);
    console.log('📧 Email:', regEmail || 'none');
    console.log('🔒 Password:', regPassword ? '***' : 'empty');
    console.log('🏢 Business:', regBusiness || 'none');
    console.log('⏳ Loading:', loading);

    if (!regName.trim()) { 
      const errorMsg = 'Enter your name';
      console.error('❌', errorMsg);
      setErr(errorMsg); 
      return; 
    }
    if (regPhone.length < 10) { 
      const errorMsg = 'Enter a valid 10-digit mobile number';
      console.error('❌', errorMsg);
      setErr(errorMsg); 
      return; 
    }
    if (regPassword.length < 6) { 
      const errorMsg = 'Password must be at least 6 characters';
      console.error('❌', errorMsg);
      setErr(errorMsg); 
      return; 
    }

    setLoading(true); 
    setErr('');
    const role = mode === 'partner' ? 'owner' : 'user';
    console.log('✅ Validation passed, role:', role);

    try {
      console.log('🌐 Sending register request to:', `${API}/auth/register-password`);
      const res = await axios.post(`${API}/auth/register-password`, {
        name: regName.trim(),
        phone: `+91${regPhone}`,
        email: regEmail || undefined,
        password: regPassword,
        role,
        business_name: regBusiness || undefined,
      });

      console.log('✅ Register response:', res.status, res.data);
      console.log('🔐 Calling login()');
      await login(res.data.user, res.data.token);
      console.log('🚀 Navigating to', role === 'owner' ? 'PartnerApp' : 'MainApp');
      navigation.replace(role === 'owner' ? 'PartnerApp' : 'MainApp');
    } catch (e) {
      console.error('❌ Register ERROR:', e.message);
      if (e.response) {
        console.error('❌ Error response status:', e.response.status);
        console.error('❌ Error response data:', e.response.data);
        setErr(e.response.data?.msg || 'Registration failed. Please try again.');
      } else {
        // Network error
        console.error('❌ Network error - no response');
        setErr('Cannot connect to server. Please check your internet connection.');
      }
    } finally {
      console.log('⏳ Setting loading to false');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        {/* TurfX Logo — same as web */}
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.tagline}>India's #1 Sports Booking Platform</Text>

        {/* User / Partner switcher */}
        <View style={styles.modeSwitcher}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'user' && styles.modeBtnActive]}
            onPress={() => { 
              setMode('user'); 
              setIsAdminMode(false);
              setTab('login'); 
              reset(); 
            }}
          >
            <View style={styles.modeBtnContent}>
              <User size={18} color={mode === 'user' ? COLORS.primary : 'rgba(255,255,255,0.7)'} />
              <Text style={[styles.modeBtnText, mode === 'user' && styles.modeBtnTextActive]}>User</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'partner' && styles.modeBtnActive]}
            onPress={() => { 
              setMode('partner'); 
              setIsAdminMode(false);
              setTab('login'); 
              reset(); 
            }}
          >
            <View style={styles.modeBtnContent}>
              <Trophy size={18} color={mode === 'partner' ? COLORS.primary : 'rgba(255,255,255,0.7)'} />
              <Text style={[styles.modeBtnText, mode === 'partner' && styles.modeBtnTextActive]}>Partner</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Admin Login button */}
        <TouchableOpacity 
          style={[styles.adminBtn, isAdminMode && styles.adminBtnActive]}
          onPress={() => { 
            console.log('Admin Login button pressed');
            setMode('partner'); 
            setIsAdminMode(true);
            setTab('login'); 
            reset(); 
          }}
          activeOpacity={0.7}
        >
          <Settings size={18} color="white" />
          <Text style={styles.adminBtnText}>Admin Login</Text>
        </TouchableOpacity>
      </View>

      {/* Tab row — both user and partner */}
      <View style={styles.tabRow}>
        {(isAdminMode ? ['login'] : ['login', 'register']).map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => { setTab(t); reset(); }}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'login' ? 'Login' : 'Create Account'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">

        {/* ── PARTNER / ADMIN LOGIN ──────────────────────────────── */}
        {mode === 'partner' && tab === 'login' && (
          <>
            <Text style={styles.formTitle}>{isAdminMode ? 'Admin Login' : 'Partner Login'}</Text>
            <Text style={styles.formSub}>{isAdminMode ? 'Sign in to access the TurfX admin panel' : 'Sign in with your venue owner account'}</Text>
            {err ? <Text style={styles.error}>{err}</Text> : null}

            <View style={styles.phoneRow}>
              <View style={styles.countryCode}>
                <Globe size={18} color={COLORS.dark} />
                <Text style={styles.countryCodeText}> +91</Text>
              </View>
              <TextInput style={styles.phoneInput} placeholder="Mobile Number" value={phone}
                onChangeText={t => { setPhone(t.replace(/\D/g, '')); setErr(''); }}
                keyboardType="phone-pad" maxLength={10} placeholderTextColor={COLORS.textMuted} />
            </View>
            <View style={styles.passwordRow}>
              <TextInput style={styles.passwordInput} placeholder="Password" value={password}
                onChangeText={t => { setPassword(t); setErr(''); }}
                secureTextEntry={!showPass} placeholderTextColor={COLORS.textMuted} />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(p => !p)}>
                {showPass ? <EyeOff size={20} color={COLORS.textMuted} /> : <Eye size={20} color={COLORS.textMuted} />}
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={{ alignSelf: 'flex-end', marginBottom: 16 }}>
              <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 13 }}>Forgot password?</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { backgroundColor: isAdminMode ? COLORS.primary : COLORS.dark }]} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color={COLORS.accent} /> : <Text style={styles.btnText}>{isAdminMode ? 'Login as Admin' : 'Login as Partner'}</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* ── PARTNER REGISTER ───────────────────────────── */}
        {mode === 'partner' && tab === 'register' && (
          <>
            <Text style={styles.formTitle}>Create Partner Account</Text>
            <Text style={styles.formSub}>Register your venue on TurfX</Text>
            {err ? <Text style={styles.error}>{err}</Text> : null}

            <TextInput style={styles.input} placeholder="Your Full Name *" value={regName}
              onChangeText={t => { setRegName(t); setErr(''); }} placeholderTextColor={COLORS.textMuted} />
            <TextInput style={styles.input} placeholder="Business / Venue Name (optional)" value={regBusiness}
              onChangeText={t => { setRegBusiness(t); setErr(''); }} placeholderTextColor={COLORS.textMuted} />
            <View style={styles.phoneRow}>
              <View style={styles.countryCode}>
                <Globe size={18} color={COLORS.dark} />
                <Text style={styles.countryCodeText}> +91</Text>
              </View>
              <TextInput style={styles.phoneInput} placeholder="Mobile Number *" value={regPhone}
                onChangeText={t => { setRegPhone(t.replace(/\D/g, '')); setErr(''); }}
                keyboardType="phone-pad" maxLength={10} placeholderTextColor={COLORS.textMuted} />
            </View>
            <TextInput style={styles.input} placeholder="Email Address *" value={regEmail}
              onChangeText={t => { setRegEmail(t); setErr(''); }}
              keyboardType="email-address" autoCapitalize="none" placeholderTextColor={COLORS.textMuted} />
            <View style={styles.passwordRow}>
              <TextInput style={styles.passwordInput} placeholder="Password (min 6 chars) *" value={regPassword}
                onChangeText={t => { setRegPassword(t); setErr(''); }}
                secureTextEntry={!showRegPass} placeholderTextColor={COLORS.textMuted} />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowRegPass(p => !p)}>
                {showRegPass ? <EyeOff size={20} color={COLORS.textMuted} /> : <Eye size={20} color={COLORS.textMuted} />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.btn, { backgroundColor: COLORS.dark }]} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color={COLORS.accent} /> : <Text style={styles.btnText}>Create Partner Account</Text>}
            </TouchableOpacity>

            <View style={styles.hint}>
              <Text style={styles.hintText}>
                <Trophy size={14} color="#166534" /> After registering, add your venues from the Dashboard
              </Text>
            </View>
          </>
        )}

        {/* ── USER LOGIN ─────────────────────────────────── */}
        {mode === 'user' && tab === 'login' && (
          <>
            <Text style={styles.formTitle}>Welcome Back</Text>
            {err ? <Text style={styles.error}>{err}</Text> : null}
            <View style={styles.phoneRow}>
              <View style={styles.countryCode}>
                <Globe size={18} color={COLORS.dark} />
                <Text style={styles.countryCodeText}> +91</Text>
              </View>
              <TextInput style={styles.phoneInput} placeholder="Mobile Number" value={phone}
                onChangeText={t => { setPhone(t.replace(/\D/g, '')); setErr(''); }}
                keyboardType="phone-pad" maxLength={10} placeholderTextColor={COLORS.textMuted} />
            </View>
            <View style={styles.passwordRow}>
              <TextInput style={styles.passwordInput} placeholder="Password" value={password}
                onChangeText={t => { setPassword(t); setErr(''); }}
                secureTextEntry={!showPass} placeholderTextColor={COLORS.textMuted} />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(p => !p)}>
                {showPass ? <EyeOff size={20} color={COLORS.textMuted} /> : <Eye size={20} color={COLORS.textMuted} />}
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={{ alignSelf: 'flex-end', marginBottom: 16 }}>
              <Text style={{ color: COLORS.primary, fontWeight: '700', fontSize: 13 }}>Forgot password?</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color={COLORS.primary} /> : <Text style={styles.btnText}>Login</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* ── USER REGISTER ──────────────────────────────── */}
        {mode === 'user' && tab === 'register' && (
          <>
            <Text style={styles.formTitle}>Create Account</Text>
            {err ? <Text style={styles.error}>{err}</Text> : null}
            <TextInput style={styles.input} placeholder="Full Name" value={regName}
              onChangeText={t => { setRegName(t); setErr(''); }} placeholderTextColor={COLORS.textMuted} />
            <View style={styles.phoneRow}>
              <View style={styles.countryCode}>
                <Globe size={18} color={COLORS.dark} />
                <Text style={styles.countryCodeText}> +91</Text>
              </View>
              <TextInput style={styles.phoneInput} placeholder="Mobile Number" value={regPhone}
                onChangeText={t => { setRegPhone(t.replace(/\D/g, '')); setErr(''); }}
                keyboardType="phone-pad" maxLength={10} placeholderTextColor={COLORS.textMuted} />
            </View>
            <TextInput style={styles.input} placeholder="Email (optional)" value={regEmail}
              onChangeText={t => { setRegEmail(t); setErr(''); }}
              keyboardType="email-address" autoCapitalize="none" placeholderTextColor={COLORS.textMuted} />
            <View style={styles.passwordRow}>
              <TextInput style={styles.passwordInput} placeholder="Password (min 6 chars)" value={regPassword}
                onChangeText={t => { setRegPassword(t); setErr(''); }}
                secureTextEntry={!showRegPass} placeholderTextColor={COLORS.textMuted} />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowRegPass(p => !p)}>
                {showRegPass ? <EyeOff size={20} color={COLORS.textMuted} /> : <Eye size={20} color={COLORS.textMuted} />}
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color={COLORS.primary} /> : <Text style={styles.btnText}>Create Account</Text>}
            </TouchableOpacity>
          </>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: COLORS.bgLight },
  header:  { backgroundColor: COLORS.primary, paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24, alignItems: 'center' },
  logo:    { height: 48, width: 160, marginBottom: 6 },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontWeight: '500', marginBottom: 20 },
  modeSwitcher: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 4, gap: 4 },
  modeBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  modeBtnActive: { backgroundColor: COLORS.white },
  modeBtnContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modeBtnText: { color: 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: 14 },
  modeBtnTextActive: { color: COLORS.primary },
  adminBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center' },
  adminBtnActive: { backgroundColor: 'rgba(255,255,255,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' },
  adminBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  tabRow:  { flexDirection: 'row', backgroundColor: COLORS.white, borderBottomWidth: 2, borderBottomColor: COLORS.border },
  tab:     { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText:   { fontSize: 15, fontWeight: '700', color: COLORS.textMuted },
  tabTextActive: { color: COLORS.primary },
  form:    { padding: 24, paddingBottom: 48 },
  formTitle: { fontSize: 24, fontWeight: '900', color: COLORS.dark, marginBottom: 6 },
  formSub:   { fontSize: 13, color: COLORS.textMuted, fontWeight: '500', marginBottom: 20 },
  error:   { backgroundColor: '#fff1f2', color: '#be123c', padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 13, fontWeight: '700', borderWidth: 1, borderColor: '#fecdd3' },
  input:   { backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 14, fontSize: 15, color: COLORS.dark, marginBottom: 14, fontWeight: '500' },
  phoneRow: { flexDirection: 'row', marginBottom: 14, gap: 8 },
  countryCode: { backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center', flexDirection: 'row', alignItems: 'center', gap: 4 },
  countryCodeText: { fontSize: 14, fontWeight: '700', color: COLORS.dark },
  phoneInput: { flex: 1, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 14, fontSize: 15, color: COLORS.dark, fontWeight: '500' },
  // Password with eye toggle
  passwordRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, marginBottom: 14 },
  passwordInput: { flex: 1, padding: 14, fontSize: 15, color: COLORS.dark, fontWeight: '500' },
  eyeBtn:  { paddingHorizontal: 14, paddingVertical: 14 },
  btn:     { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: COLORS.accent, fontSize: 16, fontWeight: '800' },
  hint:    { marginTop: 20, backgroundColor: '#F0FDF4', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#BBF7D0' },
  hintText: { color: '#166534', fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
