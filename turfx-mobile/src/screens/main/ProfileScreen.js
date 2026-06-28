import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { API_URL as API } from '../../config/api';
import { COLORS } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Calendar, MapPin, User, Lock, LogOut, Palette, Edit3 } from 'lucide-react-native';

export default function ProfileScreen({ navigation }) {
  const { user, token, login, logout } = useAuth();
  const { colors, theme, toggleTheme, isDark } = useTheme();
  const [editing, setEditing]   = useState(false);
  const [name, setName]         = useState(user?.name || '');
  const [saving, setSaving]     = useState(false);

  if (!user) {
    return (
      <View style={s.root}>
        <View style={s.header}><Text style={s.title}>Profile</Text></View>
        <View style={{flex:1,alignItems:'center',justifyContent:'center',padding:24}}>
          <Text style={{color:COLORS.textMuted,fontSize:15,marginBottom:20,fontWeight:'600'}}>Sign in to view your profile</Text>
          <TouchableOpacity style={s.btn} onPress={()=>navigation.navigate('Login')}>
            <Text style={s.btnText}>Login / Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const save = async () => {
    if (!name.trim()) { Alert.alert('Error','Name cannot be empty'); return; }
    setSaving(true);
    try {
      const res = await axios.post(`${API}/auth/update-profile`,{name:name.trim()},{headers:{Authorization:`Bearer ${token}`}});
      login({...user,name:res.data.name||name.trim()},token);
      setEditing(false);
      Alert.alert('Success','Profile updated!');
    } catch(e){ Alert.alert('Error',e.response?.data?.msg||'Failed'); }
    finally { setSaving(false); }
  };

  const handleLogout = () => {
    Alert.alert('Logout','Are you sure you want to logout?',[
      {text:'Cancel'},{text:'Logout',style:'destructive',onPress:async()=>{
        await logout();
        navigation.replace('Login');
      }}
    ]);
  };

  const initials = (user.name||'U').charAt(0).toUpperCase();
  const joinedDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}) : '';

  return (
    <View style={[s.root, { backgroundColor: colors.bgLight }]}>
      <View style={[s.header, { backgroundColor: colors.primary }]}>
        <Text style={[s.title, { color: colors.accent }]}>My Profile</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 80 }}>
        {/* Avatar */}
        <View style={[s.avatarSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[s.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[s.avatarText, { color: colors.accent }]}>{initials}</Text>
          </View>
          <Text style={[s.userName, { color: colors.text }]}>{user.name}</Text>
          <Text style={[s.userPhone, { color: colors.textMuted }]}>{user.phone}</Text>
          {joinedDate && <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>Member since {joinedDate}</Text>}
        </View>

        {/* Theme Selector */}
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Palette size={18} color={colors.text} />
            <Text style={[s.cardTitle, { color: colors.text, marginBottom: 0 }]}>Theme</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['system', 'light', 'dark'].map(t => (
              <TouchableOpacity
                key={t}
                style={[
                  s.themeChip,
                  theme === t && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => toggleTheme(t)}
              >
                <Text
                  style={[
                    s.themeChipText,
                    theme === t && { color: colors.accent },
                    theme !== t && { color: colors.text },
                  ]}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Edit form */}
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={[s.cardTitle, { color: colors.text }]}>Personal Details</Text>
            {!editing && (
              <TouchableOpacity onPress={() => setEditing(true)} style={[s.editBtn, { borderColor: colors.border }]}>
                <Edit3 size={16} color={colors.primary} />
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13, marginLeft: 4 }}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          <InfoRow label="Full Name" colors={colors}>
            {editing
              ? <TextInput style={[s.input, { borderColor: colors.primary, color: colors.text, backgroundColor: colors.surfaceAlt }]} value={name} onChangeText={setName} autoFocus />
              : <Text style={[s.infoVal, { color: colors.text }]}>{user.name || '—'}</Text>}
          </InfoRow>
          <InfoRow label="Phone" colors={colors}>
            <Text style={[s.infoVal, { color: colors.textMuted }]}>{user.phone || '—'}</Text>
          </InfoRow>
          <InfoRow label="Email" colors={colors}>
            <Text style={[s.infoVal, { color: colors.textMuted }]}>{user.email || '—'}</Text>
          </InfoRow>
          <InfoRow label="Role" colors={colors}>
            <Text style={[s.infoVal, { color: colors.textMuted }]}>Customer</Text>
          </InfoRow>

          {editing && (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity style={[s.btn, { flex: 1, backgroundColor: colors.primary }]} onPress={save} disabled={saving}>
                {saving ? <ActivityIndicator color={colors.accent} /> : <Text style={[s.btnText, { color: colors.accent }]}>Save</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[s.outlineBtn, { flex: 1, borderColor: colors.border }]} onPress={() => { setEditing(false); setName(user.name || ''); }}>
                <Text style={[s.outlineBtnText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick links */}
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.cardTitle, { color: colors.text }]}>Quick Links</Text>
          {[
            { label: 'My Bookings', icon: Calendar, onPress: () => navigation.navigate('MyBookings') },
            { label: 'Explore Venues', icon: MapPin, onPress: () => navigation.navigate('Explore') },
            { label: 'Reset Password', icon: Lock, onPress: () => navigation.navigate('ForgotPassword') },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={[s.linkRow, { borderBottomColor: colors.border }]} onPress={item.onPress}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <item.icon size={18} color={colors.textMuted} />
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>{item.label}</Text>
              </View>
              <Text style={{ color: colors.textMuted }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[s.logoutBtn, { backgroundColor: isDark ? 'rgba(220,38,38,0.2)' : '#FEF2F2', borderColor: isDark ? 'rgba(220,38,38,0.4)' : '#FECDD3' }]} onPress={handleLogout}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <LogOut size={18} color="#DC2626" />
            <Text style={s.logoutText}>Logout</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, children, colors }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{label}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { padding: 20, paddingTop: 56 },
  title: { fontSize: 26, fontWeight: '900' },
  avatarSection: { alignItems: 'center', padding: 20, borderRadius: 20, borderWidth: 1.5, marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarText: { fontSize: 32, fontWeight: '900' },
  userName: { fontSize: 20, fontWeight: '800' },
  userPhone: { fontSize: 14, fontWeight: '500', marginTop: 2 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1.5, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  editBtn: { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' },
  themeChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  themeChipText: { fontWeight: '700', fontSize: 14 },
  input: { borderWidth: 1.5, borderRadius: 10, padding: 10, fontSize: 14, fontWeight: '600' },
  infoVal: { fontSize: 14, fontWeight: '600' },
  btn: { borderRadius: 12, padding: 14, alignItems: 'center' },
  btnText: { fontWeight: '800', fontSize: 14 },
  outlineBtn: { borderWidth: 1.5, borderRadius: 12, padding: 14, alignItems: 'center' },
  outlineBtnText: { fontWeight: '700', fontSize: 14 },
  linkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  logoutBtn: { borderWidth: 1.5, borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 8 },
  logoutText: { color: '#DC2626', fontWeight: '800', fontSize: 15 },
});
