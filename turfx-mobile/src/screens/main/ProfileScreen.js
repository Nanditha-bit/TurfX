import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { API_URL as API } from '../../config/api';
import { COLORS } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen({ navigation }) {
  const { user, token, login, logout } = useAuth();
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
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>My Profile</Text>
      </View>
      <ScrollView contentContainerStyle={{padding:20,paddingBottom:80}}>
        {/* Avatar */}
        <View style={s.avatarSection}>
          <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>
          <Text style={s.userName}>{user.name}</Text>
          <Text style={s.userPhone}>{user.phone}</Text>
          {joinedDate && <Text style={{color:COLORS.textMuted,fontSize:12,marginTop:2}}>Member since {joinedDate}</Text>}
        </View>

        {/* Edit form */}
        <View style={s.card}>
          <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <Text style={s.cardTitle}>Personal Details</Text>
            {!editing && (
              <TouchableOpacity onPress={()=>setEditing(true)} style={s.editBtn}>
                <Text style={{color:COLORS.primary,fontWeight:'700',fontSize:13}}>✏️ Edit</Text>
              </TouchableOpacity>
            )}
          </View>

          <InfoRow label="Full Name">
            {editing
              ? <TextInput style={s.input} value={name} onChangeText={setName} autoFocus />
              : <Text style={s.infoVal}>{user.name||'—'}</Text>}
          </InfoRow>
          <InfoRow label="Phone"><Text style={[s.infoVal,{color:COLORS.textMuted}]}>{user.phone||'—'}</Text></InfoRow>
          <InfoRow label="Email"><Text style={[s.infoVal,{color:COLORS.textMuted}]}>{user.email||'—'}</Text></InfoRow>
          <InfoRow label="Role"><Text style={[s.infoVal,{color:COLORS.textMuted}]}>Customer</Text></InfoRow>

          {editing && (
            <View style={{flexDirection:'row',gap:8,marginTop:12}}>
              <TouchableOpacity style={[s.btn,{flex:1}]} onPress={save} disabled={saving}>
                {saving?<ActivityIndicator color={COLORS.primary}/>:<Text style={s.btnText}>Save</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={[s.outlineBtn,{flex:1}]} onPress={()=>{setEditing(false);setName(user.name||'');}}>
                <Text style={s.outlineBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick links */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Quick Links</Text>
          {[
            {label:'📋 My Bookings', onPress:()=>navigation.navigate('MyBookings')},
            {label:'🏟 Explore Venues', onPress:()=>navigation.navigate('Explore')},
            {label:'🔐 Reset Password', onPress:()=>navigation.navigate('ForgotPassword')},
          ].map((item,i)=>(
            <TouchableOpacity key={i} style={s.linkRow} onPress={item.onPress}>
              <Text style={{color:COLORS.dark,fontWeight:'600',fontSize:14}}>{item.label}</Text>
              <Text style={{color:COLORS.textMuted}}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function InfoRow({label,children}) {
  return (
    <View style={{marginBottom:14}}>
      <Text style={{fontSize:11,fontWeight:'800',color:COLORS.textMuted,textTransform:'uppercase',letterSpacing:0.5,marginBottom:4}}>{label}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  root:{flex:1,backgroundColor:COLORS.bgLight},
  header:{backgroundColor:COLORS.primary,padding:20,paddingTop:56},
  title:{fontSize:26,fontWeight:'900',color:COLORS.white},
  avatarSection:{alignItems:'center',padding:20,backgroundColor:COLORS.white,borderRadius:20,borderWidth:1.5,borderColor:COLORS.border,marginBottom:16},
  avatar:{width:80,height:80,borderRadius:40,backgroundColor:COLORS.primary,alignItems:'center',justifyContent:'center',marginBottom:10},
  avatarText:{fontSize:32,fontWeight:'900',color:COLORS.accent},
  userName:{fontSize:20,fontWeight:'800',color:COLORS.dark},
  userPhone:{color:COLORS.textMuted,fontSize:14,fontWeight:'500',marginTop:2},
  card:{backgroundColor:COLORS.white,borderRadius:16,padding:16,borderWidth:1.5,borderColor:COLORS.border,marginBottom:16},
  cardTitle:{fontSize:16,fontWeight:'800',color:COLORS.dark,marginBottom:12},
  editBtn:{borderWidth:1.5,borderColor:COLORS.border,borderRadius:8,paddingHorizontal:12,paddingVertical:6},
  input:{borderWidth:1.5,borderColor:COLORS.primary,borderRadius:10,padding:10,fontSize:14,color:COLORS.dark,fontWeight:'600'},
  infoVal:{fontSize:14,fontWeight:'600',color:COLORS.dark},
  btn:{backgroundColor:COLORS.primary,borderRadius:12,padding:14,alignItems:'center'},
  btnText:{color:COLORS.accent,fontWeight:'800',fontSize:14},
  outlineBtn:{borderWidth:1.5,borderColor:COLORS.border,borderRadius:12,padding:14,alignItems:'center'},
  outlineBtnText:{color:COLORS.dark,fontWeight:'700',fontSize:14},
  linkRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:12,borderBottomWidth:1,borderBottomColor:COLORS.border},
  logoutBtn:{backgroundColor:'#FEF2F2',borderWidth:1.5,borderColor:'#FECDD3',borderRadius:14,padding:16,alignItems:'center',marginBottom:8},
  logoutText:{color:'#DC2626',fontWeight:'800',fontSize:15},
});
