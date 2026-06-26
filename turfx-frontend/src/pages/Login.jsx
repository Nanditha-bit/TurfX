import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';
import BackButton from '../components/BackButton';
import { Eye, EyeOff, Trophy, MapPin, Globe, LogIn } from 'lucide-react';

import { API_URL as API } from '../config/api';

// ── Brand colors ──
const GREEN  = '#084734';   // primary dark green
const LIME   = '#CEF17B';   // accent lime

const isMobileMedia = () => window.innerWidth < 768;

const SPORT_ICONS = [Trophy, Trophy, Trophy, Trophy, Trophy];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [loginMethod] = useState('password'); // fixed to password
  const [isMobile, setIsMobile] = useState(isMobileMedia);

  useEffect(() => {
    const handler = () => setIsMobile(isMobileMedia());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Success message from forgot password
  const [successMessage, setSuccessMessage] = useState('');

  // OTP Login state
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Password Login state
  const [passPhone, setPassPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [regError, setRegError] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      setTimeout(() => setSuccessMessage(''), 5000);
    }
    if (location.state?.tab) {
      setTab(location.state.tab);
    }
  }, [location.state]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setOtpError('Please enter a valid email address');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    try {
      await axios.post(`${API}/auth/send-otp`, {
        email: email,
      });
      setOtpSent(true);
    } catch (err) {
      setOtpError(err.response?.data?.msg || 'Failed to send OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setOtpError('Please enter the 6-digit OTP');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await axios.post(`${API}/auth/verify-otp`, {
        email: email,
        otp,
      });
      login(res.data.user, res.data.token);
      navigate('/');
    } catch (err) {
      setOtpError(err.response?.data?.msg || 'Invalid OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleLogin = async (e) => {
    console.log('🔐 handleLogin called');
    e.preventDefault();
    console.log('📱 Phone:', passPhone, 'Length:', passPhone.length);
    console.log('🔑 Password:', password ? '***' : 'empty');
    if (passPhone.length < 10) { 
      setLoginError('Enter a valid 10-digit mobile number'); 
      console.error('❌ Phone too short');
      return; 
    }
    if (!password) { 
      setLoginError('Please enter your password'); 
      console.error('❌ Password empty');
      return; 
    }
    setLoginLoading(true);
    setLoginError('');
    try {
      console.log('📤 Sending login request to:', `${API}/auth/password-login`);
      const res = await axios.post(`${API}/auth/password-login`, {
        phone: `+91${passPhone}`,
        password,
      });
      console.log('✅ Login response:', res.data);
      const { role } = res.data.user;
      if (role === 'admin') {
        setLoginError('Admin accounts cannot access the player portal. Please use the Admin panel at /admin/login.');
        setLoginLoading(false);
        return;
      }
      if (role === 'owner') {
        setLoginError('Partner accounts cannot login here. Please use the Partner Portal.');
        setLoginLoading(false);
        return;
      }
      login(res.data.user, res.data.token);
      console.log('🔓 Logged in successfully, navigating to home');
      navigate('/');
    } catch (err) {
      console.error('❌ Login error:', err);
      console.error('❌ Error response:', err.response?.data);
      setLoginError(err.response?.data?.msg || 'Login failed. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    console.log('📝 handleRegister called');
    e.preventDefault();
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    console.log('👤 Name:', fullName);
    console.log('📱 Phone:', regPhone, 'Length:', regPhone.length);
    console.log('📧 Email:', regEmail || 'none');
    console.log('🔑 Password:', regPassword ? '***' : 'empty');
    if (!firstName.trim()) { 
      setRegError('Please enter your first name'); 
      console.error('❌ First name empty');
      return; 
    }
    if (regPhone.length < 10) { 
      setRegError('Enter a valid 10-digit mobile number'); 
      console.error('❌ Phone too short');
      return; 
    }
    if (regPassword.length < 6) { 
      setRegError('Password must be at least 6 characters'); 
      console.error('❌ Password too short');
      return; 
    }
    setRegLoading(true);
    setRegError('');
    try {
      console.log('📤 Sending register request to:', `${API}/auth/register-password`);
      const res = await axios.post(`${API}/auth/register-password`, {
        name: fullName,
        phone: `+91${regPhone}`,
        password: regPassword,
        email: regEmail || undefined,
        role: 'user',
      });
      console.log('✅ Register response:', res.data);
      login(res.data.user, res.data.token);
      console.log('🔓 Registered and logged in successfully, navigating to home');
      navigate('/');
    } catch (err) {
      console.error('❌ Register error:', err);
      console.error('❌ Error response:', err.response?.data);
      setRegError(err.response?.data?.msg || 'Registration failed. Please try again.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#F8FAF7', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      {/* ── LEFT PANEL ── */}
      {!isMobile && <div style={{
        flex: 1,
        background: '#084734',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '3rem', position: 'relative', overflow: 'hidden',
        minHeight: '100vh',
      }}>
        {/* grid overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }} />

        {/* Logo with concentric circle effect */}
        <div style={{ position: 'relative', marginBottom: '2.5rem', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {/* Outer rings */}
          {[280, 220, 170].map((size, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: size, height: size,
              borderRadius: '50%',
              border: `1px solid rgba(206,241,123,${0.08 - i * 0.02})`,
              background: `rgba(206,241,123,${0.02 - i * 0.005})`,
            }} />
          ))}
          {/* Logo circle */}
          <div style={{
            width: 140, height: 140, borderRadius: '50%',
            background: '#ffffff',
            border: '3px solid rgba(206,241,123,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', zIndex: 2,
            boxShadow: '0 0 40px rgba(206,241,123,0.2), 0 0 80px rgba(206,241,123,0.1)',
          }}>
            <img src={logo} alt="TurfX" style={{ height: 90, objectFit: 'contain' }} />
          </div>
        </div>

        {/* Badge */}
        <div style={{
          background: 'rgba(206,241,123,0.15)', border: '1px solid rgba(206,241,123,0.35)',
          borderRadius: 999, padding: '6px 18px', marginBottom: '1.5rem',
          fontSize: '0.75rem', fontWeight: 700, color: '#CEF17B',
          letterSpacing: '1px', textTransform: 'uppercase', position: 'relative', zIndex: 1,
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
          <Trophy size={16} color="#CEF17B" />
          India's #1 Booking Platform
        </div>

        <h1 style={{
          fontSize: '4.8rem', fontWeight: 900, color: 'white',
          lineHeight: 1.05, textAlign: 'center', marginBottom: '0.2rem',
          position: 'relative', zIndex: 1, letterSpacing: '-1px',
        }}>
          Elevate
        </h1>
        <h1 style={{
          fontSize: '4.8rem', fontWeight: 900, color: '#CEF17B',
          lineHeight: 1.05, textAlign: 'center', marginBottom: '1.5rem',
          position: 'relative', zIndex: 1, letterSpacing: '-1px',
        }}>
          Your Game.
        </h1>

        <p style={{
          color: 'rgba(255,255,255,0.75)', fontSize: '1rem', fontWeight: 500,
          maxWidth: 380, textAlign: 'center', lineHeight: 1.7,
          position: 'relative', zIndex: 1, marginBottom: '2.5rem',
        }}>
          Book premium sports venues instantly and experience world-class facilities at your fingertips.
        </p>

        {/* Sport icons */}
        <div style={{ display: 'flex', gap: '12px', position: 'relative', zIndex: 1 }}>
          {SPORT_ICONS.map((Icon, i) => (
            <div key={i} style={{
              width: 52, height: 52, borderRadius: '14px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={28} color="#CEF17B" />
            </div>
          ))}
        </div>
      </div>}

      {/* ── RIGHT PANEL ── */}
      <div style={{
        width: isMobile ? '100%' : 500, background: 'white',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: isMobile ? '2rem 1.5rem' : '2rem 3.5rem',
        boxShadow: isMobile ? 'none' : '-4px 0 40px rgba(0,0,0,0.06)',
        overflowY: 'auto',
        minHeight: '100vh',
      }}>
        {/* Tabs */}
        <div style={{ marginBottom: '1.25rem' }}>
          <BackButton to="/" />
        </div>
        <div style={{
          display: 'flex', borderBottom: '2px solid #EEF2E6',
          marginBottom: '2rem',
        }}>
          {['login', 'register'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '14px 0', border: 'none', background: 'none',
                cursor: 'pointer', fontSize: '1rem', fontWeight: 700,
                color: tab === t ? '#084734' : '#98A2B3',
                borderBottom: tab === t ? '2.5px solid #084734' : '2.5px solid transparent',
                marginBottom: '-2px', transition: 'all 0.2s',
              }}
            >
              {t === 'login' ? 'Login' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* ── LOGIN FORM ── */}
        {tab === 'login' && (
          <div>
            <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#161616', marginBottom: '0.3rem' }}>
              Welcome Back
            </h2>
            <p style={{ color: '#98A2B3', fontWeight: 500, marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Access your TurfX account to continue
            </p>

            {loginError && <ErrorBox msg={loginError} />}
            {successMessage && <SuccessBox msg={successMessage} />}

            {/* Password Login Form */}
            {(
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <Label>Mobile Number</Label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <PhonePrefix />
                    <input
                      type="tel" placeholder="Enter your mobile number"
                      value={passPhone} maxLength={10}
                      onChange={e => { setPassPhone(e.target.value.replace(/\D/g, '')); setLoginError(''); }}
                      style={inputStyle} autoFocus
                    />
                  </div>
                </div>

                <div>
                  <Label>Password</Label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setLoginError(''); }}
                      style={{ ...inputStyle, paddingRight: '48px' }}
                    />
                    <button type="button" onClick={() => setShowPass(p => !p)} style={eyeBtn}>
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div style={{ textAlign: 'right', marginTop: '-8px' }}>
                  <Link to="/forgot-password" style={{ color: '#084734', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none' }}>
                    Forgot password?
                  </Link>
                </div>

                <button type="submit" disabled={loginLoading} style={submitBtn(loginLoading)}>
                  {loginLoading ? 'Logging in...' : (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <LogIn size={18} color={GREEN} />
                      <span>Login</span>
                    </span>
                  )}
                </button>
              </form>
            )}

            <p style={{ textAlign: 'center', marginTop: '1.2rem', color: '#98A2B3', fontSize: '0.9rem', fontWeight: 500 }}>
              New to TurfX?{' '}
              <span onClick={() => setTab('register')} style={linkStyle}>Create an account</span>
            </p>
            <p style={{ textAlign: 'center', marginTop: '0.6rem', color: '#98A2B3', fontSize: '0.9rem', fontWeight: 500 }}>
              Venue owner?{' '}
              <Link to="/partner/login" style={linkStyle}>Partner Portal</Link>
            </p>
          </div>
        )}

        {/* ── REGISTER FORM ── */}
        {tab === 'register' && (
          <div>
            <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#161616', marginBottom: '0.3rem' }}>
              Create Account
            </h2>
            <p style={{ color: '#98A2B3', fontWeight: 500, marginBottom: '2rem', fontSize: '0.95rem' }}>
              Join TurfX and start booking in seconds
            </p>

            {regError && <ErrorBox msg={regError} />}

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* First + Last name row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <Label>First Name</Label>
                  <input
                    type="text" placeholder="First name"
                    value={firstName}
                    onChange={e => { setFirstName(e.target.value); setRegError(''); }}
                    style={inputStyle} autoFocus
                  />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <input
                    type="text" placeholder="Last name"
                    value={lastName}
                    onChange={e => { setLastName(e.target.value); setRegError(''); }}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <Label>Mobile Number</Label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <PhonePrefix />
                  <input
                    type="tel" placeholder="Enter your mobile number"
                    value={regPhone} maxLength={10}
                    onChange={e => { setRegPhone(e.target.value.replace(/\D/g, '')); setRegError(''); }}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <Label>Email Address</Label>
                <input
                  type="email" placeholder="Enter your email"
                  value={regEmail}
                  onChange={e => { setRegEmail(e.target.value); setRegError(''); }}
                  style={inputStyle}
                />
              </div>

              <div>
                <Label>Password</Label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showRegPass ? 'text' : 'password'}
                    placeholder="Create a password (min 6 chars)"
                    value={regPassword}
                    onChange={e => { setRegPassword(e.target.value); setRegError(''); }}
                    style={{ ...inputStyle, paddingRight: '48px' }}
                  />
                  <button type="button" onClick={() => setShowRegPass(p => !p)} style={eyeBtn}>
                    {showRegPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={regLoading} style={submitBtn(regLoading)}>
                {regLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '1.2rem', color: '#98A2B3', fontSize: '0.9rem', fontWeight: 500 }}>
              Already have an account?{' '}
              <span onClick={() => setTab('login')} style={linkStyle}>Login</span>
            </p>

            <div style={{
              marginTop: '1.2rem', padding: '14px 18px', borderRadius: '12px',
              background: '#F0FDF4', border: '1.5px solid #DCEFB8',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <Trophy size={24} color="#084734" />
              <span style={{ fontSize: '0.85rem', color: '#084734', fontWeight: 600 }}>
                Venue owner?{' '}
                <Link to="/partner/login" style={{ color: '#084734', fontWeight: 800, textDecoration: 'underline' }}>
                  List your venue on TurfX →
                </Link>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Shared sub-components ── */
function Label({ children }) {
  return (
    <label style={{
      display: 'block', fontSize: '0.75rem', fontWeight: 800,
      color: '#98A2B3', marginBottom: '7px',
      textTransform: 'uppercase', letterSpacing: '0.6px',
    }}>
      {children}
    </label>
  );
}

function PhonePrefix() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '0 14px', borderRadius: '12px',
      border: '1.5px solid #EEF2E6', background: '#F8FAF7',
      fontSize: '0.95rem', fontWeight: 700, color: '#161616',
      whiteSpace: 'nowrap',
    }}>
      <Globe size={16} /> +91
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div style={{
      background: '#fff1f2', color: '#be123c', padding: '12px 16px',
      borderRadius: '10px', marginBottom: '1.2rem', fontSize: '0.88rem',
      border: '1.5px solid #fecdd3', fontWeight: 700,
    }}>
      {msg}
    </div>
  );
}

function SuccessBox({ msg }) {
  return (
    <div style={{
      background: '#f0fdf4', color: '#15803d', padding: '12px 16px',
      borderRadius: '10px', marginBottom: '1.2rem', fontSize: '0.88rem',
      border: '1.5px solid #bbf7d0', fontWeight: 700,
    }}>
      {msg}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '14px 16px', borderRadius: '12px',
  border: '1.5px solid #EEF2E6', fontSize: '0.95rem',
  outline: 'none', boxSizing: 'border-box',
  fontWeight: 600, background: '#F8FAF7', color: '#161616',
  transition: 'border-color 0.2s',
};

const eyeBtn = {
  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
};

const submitBtn = (loading) => ({
  width: '100%',
  background: '#0a3d26',
  color: '#CEF17B',
  border: 'none',
  padding: '17px',
  borderRadius: '12px',
  cursor: loading ? 'not-allowed' : 'pointer',
  fontWeight: 800,
  fontSize: '1.1rem',
  letterSpacing: '0.3px',
  boxShadow: loading ? 'none' : '0 6px 24px rgba(8,71,52,0.35)',
  marginTop: '0.3rem',
  transition: 'all 0.2s',
  opacity: loading ? 0.65 : 1,
});

const linkStyle = {
  color: '#084734', fontWeight: 800, cursor: 'pointer', textDecoration: 'none',
};
