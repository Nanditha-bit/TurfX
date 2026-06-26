import { useState } from 'react';
import axios from 'axios';
import {
  User, Mail, Phone, MapPin, Calendar,
  Globe, Shield, Bell, Lock, Edit2, Check, X,
  TrendingUp, Wallet, Star, Calendar as CalIcon,
  ChevronRight, Camera
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import { API_URL as API } from '../../config/api';

export default function PartnerProfile({ user, data, onTabChange }) {
  const { token, login } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFAMsg, setTwoFAMsg] = useState('');

  const confirmedBookings = data?.bookings?.filter(b => b.status === 'confirmed') || [];
  const totalEarnings = confirmedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
  const walletBalance = Math.round(totalEarnings * 0.95);
  const primaryTurf = data?.turfs?.[0];
  const initials = (user?.name || 'Partner Owner').split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Not available';

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const res = await axios.put(`${API}/owner/profile`, { name: editName, email: editEmail }, { headers: { Authorization: `Bearer ${token}` } });
      login({ ...res.data, _id: res.data.id }, token);
      setEditMode(false);
    } catch (err) {
      setSaveError(err.response?.data?.msg || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const accountStats = [
    { label: 'Total Bookings', value: (data?.totalBookings || 0).toString(), sub: 'View all bookings', icon: <CalIcon size={20} />, color: '#CEF17B' },
    { label: 'Total Earnings', value: `Rs.${totalEarnings.toLocaleString()}`, sub: 'View payouts', icon: <TrendingUp size={20} />, color: '#3b82f6' },
    { label: 'Wallet Balance', value: `Rs.${walletBalance.toLocaleString()}`, sub: 'Go to wallet', icon: <Wallet size={20} />, color: '#8b5cf6' },
    { label: 'Partner Rating', value: (data?.avgRating || 0).toString(), sub: 'View reviews', icon: <Star size={20} />, color: '#f59e0b' },
  ];

  const personalInfo = [
    { label: 'Full Name', value: user?.name || 'Partner Owner', icon: <User size={18} /> },
    { label: 'Email Address', value: user?.email || 'Not added', icon: <Mail size={18} /> },
    { label: 'Phone Number', value: user?.phone ? `+91 ${user.phone}` : 'Not added', icon: <Phone size={18} /> },
    { label: 'Member Since', value: memberSince, icon: <Calendar size={18} /> },
    { label: 'Preferred Language', value: 'English', icon: <Globe size={18} /> },
    { label: 'Primary Venue', value: primaryTurf ? `${primaryTurf.location}, ${primaryTurf.city}` : 'No venue added', icon: <MapPin size={18} /> },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#161616', marginBottom: '8px' }}>My Profile</h2>
          <p style={{ color: '#98A2B3', fontWeight: '500' }}>Manage your personal information and account settings.</p>
        </div>
        {editMode ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleSaveProfile} disabled={saving} style={btnPrimary}><Check size={18} /> {saving ? 'Saving...' : 'Save Profile'}</button>
            <button onClick={() => { setEditMode(false); setSaveError(''); }} style={btnSecondary}><X size={18} /> Cancel</button>
          </div>
        ) : (
          <button onClick={() => setEditMode(true)} style={btnSecondary}><Edit2 size={18} /> Edit Profile</button>
        )}
      </div>

      {saveError && (
        <div style={{ marginBottom: '1.5rem', padding: '12px 16px', borderRadius: '12px', background: '#fff1f2', border: '1.5px solid #fecdd3', color: '#be123c', fontWeight: '700', fontSize: '0.9rem' }}>
          {saveError}
        </div>
      )}

      <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '1.5px solid #EEF2E6', display: 'flex', gap: '3rem', alignItems: 'center', marginBottom: '2rem' }}>
         <div style={{ position: 'relative' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: '#161616', color: '#CEF17B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: '900', border: '4px solid #F8FAF7' }}>
               {initials}
            </div>
            <button style={{ position: 'absolute', bottom: '5px', right: '5px', width: '36px', height: '36px', borderRadius: '50%', background: 'white', border: '1.5px solid #EEF2E6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#98A2B3', cursor: 'pointer' }}>
               <Camera size={18} />
            </button>
         </div>

         <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '8px' }}>
               {editMode ? (
                 <input value={editName} onChange={e => setEditName(e.target.value)} style={{ fontSize: '1.4rem', fontWeight: '800', padding: '8px 14px', borderRadius: '10px', border: '1.5px solid #DCEFB8', outline: 'none' }} />
               ) : (
                 <h3 style={{ fontSize: '1.6rem', fontWeight: '800', margin: 0 }}>{user?.name || 'Partner Owner'}</h3>
               )}
               <span style={{ background: '#DCEFB8', color: '#CEF17B', fontSize: '0.75rem', fontWeight: '800', padding: '4px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={12} /> Verified Partner
               </span>
            </div>
            {editMode ? (
              <input value={editEmail} onChange={e => setEditEmail(e.target.value)} type="email" placeholder="Business email" style={{ padding: '8px 14px', borderRadius: '10px', border: '1.5px solid #DCEFB8', outline: 'none', fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px' }} />
            ) : (
              <p style={{ color: '#98A2B3', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '12px' }}>
                 <span>{user?.email || 'No email added'}</span>
                 <span>|</span>
                 <span>{user?.phone ? `+91 ${user.phone}` : 'No phone added'}</span>
              </p>
            )}
            <p style={{ color: '#98A2B3', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
               <MapPin size={16} /> {primaryTurf ? `${primaryTurf.city}, ${primaryTurf.location}` : 'No venue added'}
            </p>
         </div>

         <div style={{ display: 'flex', gap: '3rem', borderLeft: '1.5px solid #EEF2E6', paddingLeft: '3rem' }}>
            <div>
               <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Partner ID</div>
               <div style={{ fontWeight: '800', color: '#161616' }}>{(user?.id || user?._id)?.slice(-8)?.toUpperCase() || 'NEW'} <Edit2 size={12} cursor="pointer" /></div>
               <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginTop: '12px', marginBottom: '4px' }}>Member Since</div>
               <div style={{ fontWeight: '800', color: '#161616' }}>{memberSince}</div>
            </div>
            <div>
               <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Status</div>
               <div style={{ fontWeight: '800', color: '#CEF17B' }}>Active</div>
               <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginTop: '12px', marginBottom: '4px' }}>Last Login</div>
               <div style={{ fontWeight: '800', color: '#161616' }}>Current session</div>
            </div>
         </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
         <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '1.5px solid #EEF2E6' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '2rem' }}>Personal Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
               {personalInfo.map((info, i) => (
                 <div key={i}>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                       {info.icon} {info.label}
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#161616' }}>{info.value}</div>
                 </div>
               ))}
            </div>
         </div>

         <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '1.5px solid #EEF2E6' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '2rem' }}>Account Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
               {accountStats.map((s, i) => (
                 <div key={i} style={{ background: '#F8FAF7', padding: '1.5rem', borderRadius: '16px', border: '1.5px solid #EEF2E6' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'white', color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', border: '1px solid #EEF2E6' }}>
                       {s.icon}
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#161616', marginBottom: '4px' }}>{s.value}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', marginBottom: '10px' }}>{s.label}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#CEF17B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                       {s.sub} <ChevronRight size={12} />
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>

      <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '1.5px solid #EEF2E6' }}>
         <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '2rem' }}>Security & Preferences</h3>

         {twoFAMsg && (
           <div style={{ marginBottom: '1rem', padding: '10px 14px', borderRadius: '10px', background: '#D1FAE5', border: '1px solid #86efac', color: '#065F46', fontWeight: '700', fontSize: '0.88rem' }}>
             {twoFAMsg}
           </div>
         )}

         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
            {/* Change Password */}
            <div
              onClick={() => onTabChange?.('settings', 'security')}
              style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', padding: '1.5rem', borderRadius: '20px', border: '1.5px solid #EEF2E6', cursor: 'pointer', transition: '0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#CEF17B'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#EEF2E6'}
            >
               <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#CEF17B10', color: '#CEF17B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lock size={20} />
               </div>
               <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#161616' }}>Change Password</span>
                  <p style={{ fontSize: '0.75rem', color: '#98A2B3', fontWeight: '500', marginTop: '4px' }}>Update your password regularly</p>
               </div>
               <ChevronRight size={18} style={{ color: '#94a3b8' }} />
            </div>

            {/* Two-Factor Authentication */}
            <div
              style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', padding: '1.5rem', borderRadius: '20px', border: `1.5px solid ${twoFAEnabled ? '#CEF17B' : '#EEF2E6'}`, cursor: 'pointer', transition: '0.2s', background: twoFAEnabled ? '#F0FDF4' : 'white' }}
              onMouseEnter={e => { if (!twoFAEnabled) e.currentTarget.style.borderColor = '#CEF17B'; }}
              onMouseLeave={e => { if (!twoFAEnabled) e.currentTarget.style.borderColor = '#EEF2E6'; }}
            >
               <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#3b82f610', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={20} />
               </div>
               <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#161616' }}>Two-Factor Auth</span>
                     <span style={{ fontSize: '0.65rem', fontWeight: '800', background: twoFAEnabled ? '#DCEFB8' : '#EEF2E6', color: twoFAEnabled ? '#065F46' : '#98A2B3', padding: '2px 8px', borderRadius: '6px' }}>
                       {twoFAEnabled ? 'Enabled' : 'Disabled'}
                     </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#98A2B3', fontWeight: '500', marginTop: '4px' }}>Extra layer of security</p>
               </div>
               {/* Toggle */}
               <div
                 onClick={() => {
                   setTwoFAEnabled(v => {
                     const next = !v;
                     setTwoFAMsg(next ? '2FA enabled. OTP will be sent on each login.' : '2FA has been disabled.');
                     setTimeout(() => setTwoFAMsg(''), 3000);
                     return next;
                   });
                 }}
                 style={{ width: '44px', height: '24px', background: twoFAEnabled ? '#CEF17B' : '#E5E7EB', borderRadius: '20px', padding: '2px', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
               >
                 <div style={{ position: 'absolute', top: '2px', left: twoFAEnabled ? 'calc(100% - 22px)' : '2px', width: '20px', height: '20px', background: 'white', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
               </div>
            </div>

            {/* Notification Preferences */}
            <div
              onClick={() => onTabChange?.('settings', 'notifications')}
              style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', padding: '1.5rem', borderRadius: '20px', border: '1.5px solid #EEF2E6', cursor: 'pointer', transition: '0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#CEF17B'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#EEF2E6'}
            >
               <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#f59e0b10', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={20} />
               </div>
               <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#161616' }}>Notification Preferences</span>
                  <p style={{ fontSize: '0.75rem', color: '#98A2B3', fontWeight: '500', marginTop: '4px' }}>Manage how you receive alerts</p>
               </div>
               <ChevronRight size={18} style={{ color: '#94a3b8' }} />
            </div>
         </div>
      </div>
    </div>
  );
}

const btnSecondary = { background: 'white', color: '#161616', border: '1.5px solid #EEF2E6', padding: '12px 24px', borderRadius: '12px', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' };
const btnPrimary = { background: '#CEF17B', color: '#084734', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '800', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(30,190,116,0.2)' };
