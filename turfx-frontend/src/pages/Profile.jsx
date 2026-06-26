import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import BackButton from '../components/BackButton';
import { API_URL as API } from '../config/api';

export default function Profile() {
  const { user, token, login } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    setName(user.name || '');
  }, [user]);

  const handleSave = async () => {
    if (!name.trim()) { setError('Name cannot be empty'); return; }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await axios.post(`${API}/auth/update-profile`, { name: name.trim() }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Refresh auth context with updated user
      login({ ...user, name: res.data.name || name.trim() }, token);
      setSuccess('Profile updated successfully!');
      setEditing(false);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const initials = (user.name || user.email || 'U').charAt(0).toUpperCase();
  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div style={{ minHeight: 'calc(100vh - 72px)', background: '#F8FAF7', padding: '3rem 1.5rem', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        <div style={{ marginBottom: '1.5rem' }}>
          <BackButton />
        </div>

        {/* Page header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#161616', margin: 0 }}>My Profile</h1>
          <p style={{ color: '#98A2B3', fontWeight: 500, marginTop: '6px', fontSize: '0.95rem' }}>Manage your account details</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,2fr)', gap: '1.5rem', alignItems: 'start' }}>

          {/* Left: Avatar card */}
          <div style={{ background: 'white', borderRadius: '20px', border: '1.5px solid #EEF2E6', padding: '2rem', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            {/* Avatar */}
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              background: 'linear-gradient(135deg, #084734, #0a5e44)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.5rem', fontWeight: 900, color: '#CEF17B',
              margin: '0 auto 1rem',
            }}>
              {initials}
            </div>

            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#161616', marginBottom: '4px' }}>{user.name || '—'}</div>
            <div style={{ fontSize: '0.85rem', color: '#98A2B3', fontWeight: 500, marginBottom: '1.5rem' }}>{user.email || user.phone}</div>

            {/* Account info */}
            <div style={{ background: '#F8FAF7', borderRadius: '12px', padding: '1rem', textAlign: 'left' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#98A2B3', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Account Info</div>
              <InfoRow label="Role" value={user.role === 'user' ? 'Customer' : user.role} />
              <InfoRow label="Status" value="Active" valueColor="#065F46" />
              {joinedDate && <InfoRow label="Joined" value={joinedDate} />}
            </div>
          </div>

          {/* Right: Edit form */}
          <div>
            {/* Personal details card */}
            <div style={{ background: 'white', borderRadius: '20px', border: '1.5px solid #EEF2E6', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#161616', margin: 0 }}>Personal Details</h2>
                {!editing && (
                  <button onClick={() => setEditing(true)} style={{ background: 'none', border: '1.5px solid #EEF2E6', borderRadius: '8px', padding: '6px 14px', fontWeight: 700, fontSize: '0.82rem', color: '#084734', cursor: 'pointer' }}>
                    ✏️ Edit
                  </button>
                )}
              </div>

              {success && (
                <div style={{ background: '#D1FAE5', color: '#065F46', padding: '10px 14px', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.88rem', fontWeight: 700 }}>
                  ✓ {success}
                </div>
              )}
              {error && (
                <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.88rem', fontWeight: 700 }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Field label="Full Name" editing={editing}>
                  {editing ? (
                    <input
                      value={name}
                      onChange={e => { setName(e.target.value); setError(''); }}
                      style={inputStyle}
                      autoFocus
                    />
                  ) : (
                    <div style={staticField}>{user.name || '—'}</div>
                  )}
                </Field>

                <Field label="Phone Number">
                  <div style={{ ...staticField, background: '#F8FAF7', color: '#98A2B3' }}>{user.phone || '—'}</div>
                </Field>

                <Field label="Email Address">
                  <div style={{ ...staticField, background: '#F8FAF7', color: '#98A2B3' }}>{user.email || '—'}</div>
                </Field>

                <Field label="Account Type">
                  <div style={{ ...staticField, background: '#F8FAF7', color: '#98A2B3' }}>Customer</div>
                </Field>
              </div>

              {editing && (
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{ background: '#084734', color: '#CEF17B', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 800, fontSize: '0.9rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.65 : 1 }}
                  >
                    {saving ? 'Saving...' : '💾 Save Changes'}
                  </button>
                  <button
                    onClick={() => { setEditing(false); setName(user.name || ''); setError(''); }}
                    style={{ background: 'none', border: '1.5px solid #EEF2E6', borderRadius: '10px', padding: '12px 24px', fontWeight: 700, fontSize: '0.9rem', color: '#666', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Change password card */}
            <div style={{ background: 'white', borderRadius: '20px', border: '1.5px solid #EEF2E6', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#161616', margin: '0 0 0.75rem' }}>🔐 Change Password</h2>
              <p style={{ color: '#98A2B3', fontSize: '0.88rem', fontWeight: 500, margin: '0 0 1rem' }}>
                To change your password, use the forgot password flow — we'll send an OTP to your email.
              </p>
              <button
                onClick={() => navigate('/forgot-password')}
                style={{ background: 'none', border: '1.5px solid #084734', borderRadius: '10px', padding: '10px 20px', fontWeight: 700, fontSize: '0.88rem', color: '#084734', cursor: 'pointer' }}
              >
                Reset Password via Email OTP →
              </button>
            </div>

            {/* Quick links */}
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/my-bookings')} style={{ background: '#F8FAF7', border: '1.5px solid #EEF2E6', borderRadius: '10px', padding: '10px 18px', fontWeight: 700, fontSize: '0.85rem', color: '#161616', cursor: 'pointer' }}>
                📋 My Bookings
              </button>
              <button onClick={() => navigate('/explore')} style={{ background: '#F8FAF7', border: '1.5px solid #EEF2E6', borderRadius: '10px', padding: '10px 18px', fontWeight: 700, fontSize: '0.85rem', color: '#161616', cursor: 'pointer' }}>
                🏟 Explore Venues
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, valueColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
      <span style={{ fontSize: '0.8rem', color: '#98A2B3', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: valueColor || '#374151' }}>{value}</span>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#98A2B3', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: '10px',
  border: '1.5px solid #084734', fontSize: '0.95rem',
  fontWeight: 600, color: '#161616', background: 'white',
  outline: 'none', boxSizing: 'border-box',
};

const staticField = {
  padding: '12px 14px', borderRadius: '10px',
  border: '1.5px solid #EEF2E6', fontSize: '0.95rem',
  fontWeight: 600, color: '#161616', background: '#FAFAF9',
};
