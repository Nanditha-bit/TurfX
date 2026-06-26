import { useState } from 'react';
import axios from 'axios';
import { Bell, Lock, Shield, User, CreditCard, Save, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import { API_URL as API } from '../../config/api';

export default function PartnerSettings({ user, data, initialSection }) {
  const { token, login } = useAuth();
  const primaryTurf = data?.turfs?.[0];
  const lastCheck = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const [activeSection, setActiveSection] = useState(initialSection || 'general');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // General settings form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Password change form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Notification toggles
  const [notifBooking, setNotifBooking] = useState(true);
  const [notifCancel, setNotifCancel]   = useState(true);
  const [notifReview, setNotifReview]   = useState(true);
  const [notifPayout, setNotifPayout]   = useState(true);

  const sections = [
    { id: 'general', label: 'General Settings', icon: <User size={20} />, sub: 'Manage your basic profile and preferences' },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} />, sub: 'Configure how you receive alerts' },
    { id: 'security', label: 'Security & Login', icon: <Lock size={20} />, sub: 'Update password and security settings' },
    { id: 'business', label: 'Business Details', icon: <Shield size={20} />, sub: 'Manage tax and legal information' },
    { id: 'payments', label: 'Payment Methods', icon: <CreditCard size={20} />, sub: 'Manage bank accounts and UPI IDs' },
  ];

  const handleSaveGeneral = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await axios.put(`${API}/owner/profile`, { name, email, phone }, { headers: { Authorization: `Bearer ${token}` } });
      // Update local auth context
      login(res.data, token);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) { setError('Please fill all password fields'); return; }
    if (newPassword !== confirmPassword) { setError('New passwords do not match'); return; }
    if (newPassword.length < 6) { setError('New password must be at least 6 characters'); return; }
    setSaving(true);
    setError('');
    try {
      await axios.put(`${API}/owner/settings/password`, { currentPassword, newPassword }, { headers: { Authorization: `Bearer ${token}` } });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#161616', marginBottom: '8px' }}>Settings</h2>
          <p style={{ color: '#98A2B3', fontWeight: '500' }}>Manage your account settings and preferences</p>
        </div>
        <button onClick={activeSection === 'security' ? handleChangePassword : handleSaveGeneral} disabled={saving} style={btnPrimary}>
          {saved ? <><Check size={18} /> Saved!</> : saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: '1.5rem', padding: '12px 16px', borderRadius: '12px', background: '#fff1f2', border: '1.5px solid #fecdd3', color: '#be123c', fontWeight: '700', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '3rem' }}>
        {/* SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           {sections.map(s => (
             <div key={s.id} onClick={() => { setActiveSection(s.id); setError(''); }} style={{ 
               padding: '1.2rem', borderRadius: '16px', border: '1.5px solid #EEF2E6',
               background: s.id === activeSection ? '#DCEFB8' : 'white',
               borderColor: s.id === activeSection ? '#CEF17B' : '#EEF2E6',
               cursor: 'pointer', transition: '0.2s'
             }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                   <div style={{ color: s.id === activeSection ? '#CEF17B' : '#98A2B3' }}>{s.icon}</div>
                   <div style={{ fontWeight: '800', color: s.id === activeSection ? '#161616' : '#98A2B3', fontSize: '0.95rem' }}>{s.label}</div>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '500' }}>{s.sub}</div>
             </div>
           ))}
        </div>

        {/* CONTENT AREA */}
        <div style={{ background: 'white', padding: '2.5rem', borderRadius: '24px', border: '1.5px solid #EEF2E6' }}>
           {activeSection === 'general' && (
             <>
               <h3 style={{ fontSize: '1.2rem', fontWeight: '900', marginBottom: '2rem' }}>General Settings</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div style={inputGroup}>
                     <label style={labelStyle}>Partner Name</label>
                     <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
                  </div>
                  <div style={inputGroup}>
                     <label style={labelStyle}>Business Email</label>
                     <input style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="Add business email" type="email" />
                  </div>
                  <div style={inputGroup}>
                     <label style={labelStyle}>Contact Number</label>
                     <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="Add contact number" />
                  </div>
                  <div style={inputGroup}>
                     <label style={labelStyle}>Preferred Language</label>
                     <select style={inputStyle}>
                        <option>English</option>
                        <option>Hindi</option>
                        <option>Marathi</option>
                     </select>
                  </div>

                  <div style={{ borderTop: '1.5px solid #EEF2E6', paddingTop: '2rem', marginTop: '1rem' }}>
                     <h4 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1.5rem' }}>Account Status</h4>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderRadius: '16px', background: '#F8FAF7', border: '1.5px solid #EEF2E6' }}>
                        <div>
                           <div style={{ fontWeight: '800', fontSize: '0.95rem' }}>Your account is verified</div>
                           <div style={{ fontSize: '0.8rem', color: '#98A2B3', fontWeight: '500' }}>Last check: {lastCheck}{primaryTurf ? ` for ${primaryTurf.name}` : ''}</div>
                        </div>
                        <div style={{ background: '#DCEFB8', color: '#CEF17B', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800' }}>VERIFIED</div>
                     </div>
                  </div>
               </div>
             </>
           )}

           {activeSection === 'security' && (
             <>
               <h3 style={{ fontSize: '1.2rem', fontWeight: '900', marginBottom: '2rem' }}>Security & Login</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div style={inputGroup}>
                     <label style={labelStyle}>Current Password</label>
                     <input type="password" style={inputStyle} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
                  </div>
                  <div style={inputGroup}>
                     <label style={labelStyle}>New Password</label>
                     <input type="password" style={inputStyle} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password (min 6 chars)" />
                  </div>
                  <div style={inputGroup}>
                     <label style={labelStyle}>Confirm New Password</label>
                     <input type="password" style={inputStyle} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
                  </div>
                  <div style={{ background: '#F8FAF7', padding: '1.5rem', borderRadius: '16px', border: '1.5px solid #EEF2E6' }}>
                     <div style={{ fontWeight: '800', fontSize: '0.9rem', marginBottom: '8px' }}>Password Requirements</div>
                     <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#98A2B3', fontSize: '0.85rem', fontWeight: '500', lineHeight: 2 }}>
                        <li>Minimum 6 characters</li>
                        <li>Use a mix of letters and numbers for better security</li>
                     </ul>
                  </div>
               </div>
             </>
           )}

           {activeSection === 'notifications' && (
             <>
               <h3 style={{ fontSize: '1.2rem', fontWeight: '900', marginBottom: '2rem' }}>Notification Preferences</h3>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                 {[
                   { label: 'New Booking Alerts',    sub: 'Get notified when a new booking is made',      val: notifBooking, set: setNotifBooking },
                   { label: 'Cancellation Alerts',   sub: 'Get notified when a booking is cancelled',     val: notifCancel,  set: setNotifCancel },
                   { label: 'Review Notifications',  sub: 'Get notified when a player leaves a review',   val: notifReview,  set: setNotifReview },
                   { label: 'Payout Notifications',  sub: 'Get notified when a payout is processed',      val: notifPayout,  set: setNotifPayout },
                 ].map((n, i) => (
                   <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem', borderRadius: '14px', border: '1.5px solid #EEF2E6' }}>
                     <div>
                       <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{n.label}</div>
                       <div style={{ fontSize: '0.8rem', color: '#98A2B3', fontWeight: '500', marginTop: '4px' }}>{n.sub}</div>
                     </div>
                     <div
                       onClick={() => n.set(v => !v)}
                       style={{
                         width: '44px', height: '24px',
                         background: n.val ? '#CEF17B' : '#E5E7EB',
                         borderRadius: '20px', padding: '2px',
                         cursor: 'pointer', position: 'relative',
                         transition: 'background 0.2s',
                       }}
                     >
                       <div style={{
                         position: 'absolute', top: '2px',
                         left: n.val ? 'calc(100% - 22px)' : '2px',
                         width: '20px', height: '20px',
                         background: 'white', borderRadius: '50%',
                         boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                         transition: 'left 0.2s',
                       }} />
                     </div>
                   </div>
                 ))}
               </div>
             </>
           )}

           {(activeSection === 'business' || activeSection === 'payments') && (
             <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
               <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔧</div>
               <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '8px' }}>Coming Soon</div>
               <div style={{ fontSize: '0.85rem', fontWeight: '500' }}>This section will be available in the next update.</div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}

const btnPrimary = { background: '#CEF17B', color: '#084734', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '800', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(30,190,116,0.2)' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '10px' };
const labelStyle = { fontSize: '0.85rem', fontWeight: '700', color: '#98A2B3', textTransform: 'uppercase' };
const inputStyle = { padding: '14px 18px', borderRadius: '12px', border: '1.5px solid #EEF2E6', fontSize: '0.95rem', fontWeight: '600', outline: 'none', background: 'white' };
