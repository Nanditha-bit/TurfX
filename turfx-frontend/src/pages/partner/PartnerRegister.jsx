import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import logo from '../../assets/logo.png';
import BackButton from '../../components/BackButton';

import { API_URL as API } from '../../config/api';

const GREEN   = '#084734';
const LIME    = '#CEF17B';
const LIME_BG = '#DCEFB8';

export default function PartnerRegister() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    phone: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    const { name, phone, password, email } = formData;
    if (!name || !phone || !password) { setError('Please fill in required fields'); return; }
    if (phone.length < 10) { setError('Enter a valid phone number'); return; }

    setLoading(true); setError('');
    try {
      const res = await axios.post(`${API}/auth/register-password`, {
        name,
        phone: `+91${phone}`,
        email,
        password,
        role: 'owner'
      });
      login(res.data.user, res.data.token);
      navigate('/partner/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif" }}>

      {/* ── LEFT PANEL ── */}
      <div style={{
        width: '520px', minWidth: '520px', background: '#fff',
        display: 'flex', flexDirection: 'column',
        padding: '3rem 3.5rem', justifyContent: 'center',
      }}>
        {/* Logo */}
        <div style={{ marginBottom: '1.25rem' }}>
          <BackButton />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2.5rem' }}>
          <Link to="/"><img src={logo} alt="TurfX" style={{ height: '36px' }} /></Link>
          <span style={{
            background: LIME_BG, color: GREEN, fontWeight: '800',
            fontSize: '0.75rem', letterSpacing: '1.5px', padding: '4px 10px',
            borderRadius: '6px',
          }}>PARTNER</span>
        </div>

        <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#161616', marginBottom: '8px', lineHeight: 1.2 }}>
          Partner Registration
        </h2>
        <p style={{ color: '#98A2B3', fontWeight: '500', marginBottom: '2rem', fontSize: '0.95rem' }}>
          Join our network of premium venue partners and accelerate your business growth.
        </p>

        {error && (
          <div style={{
            background: '#fff1f2', color: '#be123c', padding: '14px 16px',
            borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.88rem',
            fontWeight: '600', border: '1px solid #fecdd3',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Name row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input
                type="text" placeholder="John Doe"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                style={inputStyle} required
              />
            </div>
            <div>
              <label style={labelStyle}>Turf Name</label>
              <input
                type="text" placeholder="Turf Empire"
                value={formData.businessName}
                onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Mobile */}
          <div>
            <label style={labelStyle}>Mobile Number *</label>
            <div style={{ display: 'flex', borderRadius: '12px', border: '1.5px solid #E5E7EB', overflow: 'hidden', background: '#fff' }}>
              <div style={{
                padding: '14px 16px', background: '#F9FAFB', borderRight: '1.5px solid #E5E7EB',
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '0.95rem', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap',
              }}>
                🇮🇳 +91
              </div>
              <input
                type="tel" placeholder="Mobile Number"
                value={formData.phone} maxLength={10}
                onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                style={{
                  flex: 1, padding: '14px 16px', border: 'none', outline: 'none',
                  fontSize: '0.95rem', fontWeight: '500', color: '#111827', background: '#fff',
                }}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email" placeholder="john@example.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              style={{ ...inputStyle, borderRadius: '12px', border: '1.5px solid #E5E7EB', padding: '14px 16px' }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>Create Password *</label>
            <div style={{ position: 'relative', borderRadius: '12px', border: '1.5px solid #E5E7EB', overflow: 'hidden' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                style={{
                  width: '100%', padding: '14px 48px 14px 16px', border: 'none', outline: 'none',
                  fontSize: '0.95rem', fontWeight: '500', color: '#111827', background: '#fff',
                  boxSizing: 'border-box',
                }}
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF',
                display: 'flex', alignItems: 'center', padding: 0,
              }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} style={{
            width: '100%', background: loading ? '#b5d96a' : LIME,
            color: GREEN, border: 'none', padding: '16px',
            borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '800', fontSize: '1rem', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'background 0.2s', marginTop: '0.5rem',
          }}>
            <UserPlus size={18} />
            {loading ? 'Creating Account...' : 'Register as Partner'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #F3F4F6' }}>
          <p style={{ color: '#9CA3AF', fontSize: '0.88rem', marginBottom: '6px' }}>already a partner?</p>
          <Link to="/partner/login" style={{ color: '#161616', fontWeight: '700', textDecoration: 'none', fontSize: '0.95rem' }}>
            Have an account? <span style={{ color: GREEN, fontWeight: '800', textDecoration: 'underline' }}>Sign in to your account</span>
          </Link>
        </div>

        <p style={{ color: '#D1D5DB', fontSize: '0.78rem', textAlign: 'center', marginTop: '2.5rem' }}>
          © 2024 MetaQode Technologies Pvt. Ltd.
        </p>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        flex: 1, background: GREEN,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '5rem', position: 'relative', overflow: 'hidden',
      }}>
        {/* Grid line pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 2 }}>
          <p style={{ color: LIME, fontWeight: '700', fontSize: '0.8rem', letterSpacing: '2px', marginBottom: '1.5rem' }}>
            — VENUE PARTNERS
          </p>
          <h1 style={{ fontSize: '3rem', fontWeight: '900', color: '#fff', lineHeight: 1.15, marginBottom: '1.5rem' }}>
            Transform Your<br />
            <span style={{ color: LIME }}>Venue Business.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1rem', lineHeight: 1.7, maxWidth: '480px', marginBottom: '3rem' }}>
            Join 500+ venue partners who have scaled their operations and maximized revenue with TurfX.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '4rem' }}>
            {[
              { n: '1', title: 'Rapid Onboarding', sub: 'Get your venue live and accepting bookings within 24 hours.' },
              { n: '2', title: 'Performance-Based Pricing', sub: 'Zero setup fees. Pay only when you receive confirmed bookings.' },
              { n: '3', title: 'Business Intelligence', sub: 'Access comprehensive analytics on revenue trends and customer behavior.' },
            ].map(f => (
              <div key={f.n} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: LIME, color: GREEN,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', fontWeight: '900', flexShrink: 0,
                }}>{f.n}</div>
                <div>
                  <div style={{ fontWeight: '700', color: '#fff', fontSize: '1rem' }}>{f.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.55)', marginTop: '4px', fontSize: '0.88rem', lineHeight: 1.5 }}>{f.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats badges */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {[
              { val: '500+', label: 'Partner venues' },
              { val: '10K+', label: 'Active players' },
              { val: '4.8★', label: 'Avg rating' },
            ].map(s => (
              <div key={s.val} style={{
                background: 'rgba(206,241,123,0.12)', border: '1px solid rgba(206,241,123,0.25)',
                borderRadius: '50px', padding: '10px 20px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ color: LIME, fontWeight: '800', fontSize: '1rem' }}>{s.val}</span>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: '0.75rem', fontWeight: '700',
  color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px',
};

const inputStyle = {
  width: '100%', padding: '14px 16px',
  border: '1.5px solid #E5E7EB', borderRadius: '12px',
  fontSize: '0.95rem', fontWeight: '500', color: '#111827',
  outline: 'none', background: '#fff', boxSizing: 'border-box',
};
