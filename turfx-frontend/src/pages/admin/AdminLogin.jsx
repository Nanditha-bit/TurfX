import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../../assets/logo.png';
import BackButton from '../../components/BackButton';
import { Globe, LogIn } from 'lucide-react';

import { API_URL as API } from '../../config/api';

const COUNTRY_CODES = [
  { code: '+91',  name: 'India' },
  { code: '+1',   name: 'United States' },
  { code: '+44',  name: 'United Kingdom' },
  { code: '+61',  name: 'Australia' },
  { code: '+971', name: 'United Arab Emirates' },
  { code: '+966', name: 'Saudi Arabia' },
  { code: '+974', name: 'Qatar' },
  { code: '+965', name: 'Kuwait' },
  { code: '+973', name: 'Bahrain' },
  { code: '+968', name: 'Oman' },
  { code: '+65',  name: 'Singapore' },
  { code: '+60',  name: 'Malaysia' },
  { code: '+92',  name: 'Pakistan' },
  { code: '+880', name: 'Bangladesh' },
  { code: '+94',  name: 'Sri Lanka' },
  { code: '+977', name: 'Nepal' },
  { code: '+95',  name: 'Myanmar' },
  { code: '+63',  name: 'Philippines' },
  { code: '+62',  name: 'Indonesia' },
  { code: '+66',  name: 'Thailand' },
  { code: '+84',  name: 'Vietnam' },
  { code: '+86',  name: 'China' },
  { code: '+81',  name: 'Japan' },
  { code: '+82',  name: 'South Korea' },
  { code: '+49',  name: 'Germany' },
  { code: '+33',  name: 'France' },
  { code: '+39',  name: 'Italy' },
  { code: '+34',  name: 'Spain' },
  { code: '+7',   name: 'Russia' },
  { code: '+55',  name: 'Brazil' },
  { code: '+27',  name: 'South Africa' },
  { code: '+234', name: 'Nigeria' },
  { code: '+254', name: 'Kenya' },
  { code: '+20',  name: 'Egypt' },
];

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    console.log('🔐 Admin handleLogin called');
    e.preventDefault();
    console.log('📱 Phone:', phone, 'Country code:', countryCode);
    console.log('🔑 Password:', password ? '***' : 'empty');
    if (!phone || phone.length < 5) { 
      setError('Enter a valid phone number'); 
      console.error('❌ Phone too short');
      return; 
    }
    if (!password) { 
      setError('Please enter your password'); 
      console.error('❌ Password empty');
      return; 
    }

    setLoading(true);
    setError('');
    const fullPhone = `${countryCode}${phone.replace(/^0+/, '')}`;
    console.log('📤 Full phone:', fullPhone);
    try {
      const res = await axios.post(`${API}/auth/password-login`, { phone: fullPhone, password });
      console.log('✅ Admin login response:', res.data);
      const { token, user } = res.data;

      if (user.role === 'owner') {
        setError('Partner accounts cannot access the Admin panel. Please use the Partner Portal.');
        setLoading(false);
        return;
      }
      if (user.role !== 'admin') {
        setError('Access denied. This portal is for admin accounts only.');
        setLoading(false);
        return;
      }

      login(user, token);
      console.log('🔓 Admin logged in successfully, navigating to dashboard');
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('❌ Admin login error:', err);
      console.error('❌ Error response:', err.response?.data);
      setError(err.response?.data?.msg || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', padding: '16px 20px', borderRadius: '12px',
    border: '1.5px solid #DCEFB8', fontSize: '1rem',
    outline: 'none', boxSizing: 'border-box',
    fontWeight: '600', background: 'white', color: '#161616',
    transition: 'border-color 0.2s',
  };

  const featureItemStyle = { display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'flex-start' };

  const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#F8FAF7', fontFamily: "'Inter', sans-serif" }}>

      {/* LEFT — Login Form */}
      <div style={{
        width: '550px', background: 'white', display: 'flex',
        flexDirection: 'column', padding: '4rem', justifyContent: 'center',
      }}>
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <BackButton to="/" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
            <Link to="/"><img src={logo} alt="TurfX" style={{ height: '36px' }} /></Link>
            <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#98A2B3', letterSpacing: '1px' }}>ADMIN</span>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', color: '#161616', marginBottom: '8px' }}>Admin Login</h2>
          <p style={{ color: '#98A2B3', fontWeight: '500' }}>Sign in to access the TurfX admin panel.</p>
        </div>

        {error && (
          <div style={{
            background: '#fff1f2', color: '#be123c', padding: '14px',
            borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem',
            fontWeight: '700', textAlign: 'center', border: '1px solid #fecdd3',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

          {/* PHONE WITH COUNTRY CODE */}
          <div>
            <label style={labelStyle}>Mobile Number</label>
            <div style={{ display: 'flex', gap: '10px' }}>

              {/* Country Code Dropdown */}
              <div style={{ position: 'relative', flex: 1 }}>
                <select
                  value={countryCode}
                  onChange={e => { setCountryCode(e.target.value); setError(''); }}
                  style={{
                    appearance: 'none', WebkitAppearance: 'none',
                    width: '100%',
                    padding: '16px 40px 16px 16px',
                    borderRadius: '12px', border: '1.5px solid #DCEFB8',
                    fontSize: '0.95rem', fontWeight: '700',
                    background: 'white', color: '#161616',
                    outline: 'none', cursor: 'pointer',
                    boxSizing: 'border-box',
                  }}
                >
                  {COUNTRY_CODES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.name}  ({c.code})
                    </option>
                  ))}
                </select>
                {/* Dropdown arrow */}
                <div style={{
                  position: 'absolute', right: '12px', top: '50%',
                  transform: 'translateY(-50%)', pointerEvents: 'none',
                  color: '#94a3b8', fontSize: '0.7rem'
                }}>▼</div>
              </div>

              {/* Phone Number */}
              <input
                type="tel"
                placeholder="XXXXXXXXXX"
                value={phone}
                maxLength={12}
                onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setError(''); }}
                style={{ ...inputStyle, flex: 1 }}
                autoFocus
              />
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Globe size={12} /> {selectedCountry?.name} &nbsp;·&nbsp; Enter number without country code
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', background: loading ? '#DCEFB8' : '#CEF17B',
              color: '#084734', border: 'none', padding: '18px',
              borderRadius: '12px', cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '800', fontSize: '1.1rem', transition: '0.3s',
              marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            }}
          >
            <LogIn size={18} />
            {loading ? 'Signing in...' : 'Sign In to Admin Panel'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid #EEF2E6' }}>
          <p style={{ color: '#98A2B3', fontSize: '0.9rem', fontWeight: '500' }}>
            Partner portal?{' '}
            <Link to="/partner/login" style={{ color: '#CEF17B', fontWeight: '800', textDecoration: 'none' }}>
              Login here
            </Link>
          </p>
        </div>
      </div>

      {/* RIGHT — Branding */}
      <div style={{
        flex: 1, background: '#F8FAF7', padding: '5rem',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#161616', marginBottom: '1.5rem', lineHeight: 1.2 }}>
            TurfX Admin Panel<br />Full platform control
          </h1>

          <div style={{ marginTop: '3rem' }}>
            {[
              { n: '1', title: 'Revenue Overview', sub: 'Track platform fees, GST and total earnings in real time' },
              { n: '2', title: 'Monthly Breakdown', sub: 'View month-wise revenue with pie charts and tables' },
              { n: '3', title: 'All Transactions', sub: 'Every booking, customer, and fee — exportable to CSV' },
            ].map(f => (
              <div key={f.n} style={featureItemStyle}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: '#DCEFB8', color: '#CEF17B',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.9rem', fontWeight: '800', flexShrink: 0,
                }}>{f.n}</div>
                <div>
                  <div style={{ fontWeight: '800', color: '#161616', fontSize: '1.1rem' }}>{f.title}</div>
                  <div style={{ color: '#98A2B3', fontWeight: '500', marginTop: '4px' }}>{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative gradient */}
        <div style={{
          position: 'absolute', bottom: 0, right: 0, left: 0, height: '40%',
          background: 'linear-gradient(to top, rgba(30,190,116,0.08), transparent)',
        }} />
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block', fontSize: '0.8rem', fontWeight: '800',
  color: '#98A2B3', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px',
};
