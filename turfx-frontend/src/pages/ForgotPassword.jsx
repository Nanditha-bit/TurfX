import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

import { API_URL as API } from '../config/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter OTP & new password
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  
  // Step 1 state
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step 2 state
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await axios.post(`${API}/auth/forgot-password`, {
        email: email,
      });
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setResetLoading(true);
    setError('');
    
    try {
      await axios.post(`${API}/auth/reset-password`, {
        email: email,
        otp,
        newPassword,
      });
      
      // Success - redirect to login
      navigate('/login', { 
        state: { message: 'Password reset successfully! Please login with your new password.' }
      });
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to reset password. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#F8FAF7', fontFamily: "'Inter', sans-serif" }}>
      {/* Left Panel */}
      {!isMobile && <div style={{
        flex: 1,
        background: '#084734',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: '3rem', position: 'relative', overflow: 'hidden',
      }}>
        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', marginBottom: '2rem', zIndex: 1 }}>
          <div style={{
            width: 120, height: 120, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            border: '2px solid rgba(206,241,123,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(206,241,123,0.15)',
          }}>
            <img src={logo} alt="TurfX" style={{ height: 80, objectFit: 'contain' }} />
          </div>
        </div>

        <h1 style={{
          fontSize: '3.5rem', fontWeight: 900, color: 'white',
          lineHeight: 1.1, textAlign: 'center', marginBottom: '1rem',
          position: 'relative', zIndex: 1,
        }}>
          Reset Your Password
        </h1>

        <p style={{
          color: 'rgba(255,255,255,0.75)', fontSize: '1rem',
          maxWidth: 350, textAlign: 'center', lineHeight: 1.6,
          position: 'relative', zIndex: 1,
        }}>
          Don't worry! Enter your email address and we'll send you an OTP to reset your password.
        </p>
      </div>}

      {/* Right Panel */}
      <div style={{
        width: isMobile ? '100%' : 500, background: 'white',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: isMobile ? '2rem 1.5rem' : '2rem 3.5rem',
        boxShadow: isMobile ? 'none' : '-4px 0 40px rgba(0,0,0,0.06)',
        minHeight: '100vh',
      }}>
        {/* Back to Login */}
        <div style={{ marginBottom: '2rem' }}>
          <Link to="/login" style={{
            color: '#084734', fontSize: '0.9rem', fontWeight: 600,
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            ← Back to Login
          </Link>
        </div>

        {step === 1 ? (
          // Step 1: Enter Email Address
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#161616', marginBottom: '0.5rem' }}>
              Forgot Password?
            </h2>
            <p style={{ color: '#98A2B3', fontWeight: 500, marginBottom: '2rem', fontSize: '0.95rem' }}>
              Enter your email address to receive an OTP
            </p>

            {error && <ErrorBox msg={error} />}

            <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <Label>Email Address</Label>
                <input
                  type="email" placeholder="Enter your email address"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  style={inputStyle} autoFocus
                />
              </div>

              <button type="submit" disabled={loading} style={submitBtn(loading)}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          </div>
        ) : (
          // Step 2: Enter OTP & New Password
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#161616', marginBottom: '0.5rem' }}>
              Enter OTP & New Password
            </h2>
            <p style={{ color: '#98A2B3', fontWeight: 500, marginBottom: '2rem', fontSize: '0.95rem' }}>
              We've sent an OTP to {email}
            </p>

            {error && <ErrorBox msg={error} />}

            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <Label>Enter OTP</Label>
                <input
                  type="text" placeholder="Enter 6-digit OTP"
                  value={otp} maxLength={6}
                  onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                  style={inputStyle} autoFocus
                />
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '8px', fontWeight: '500' }}>
                  Check your email inbox and spam folder for the OTP
                </p>
              </div>

              <div>
                <Label>New Password</Label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password (min 6 chars)"
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setError(''); }}
                    style={{ ...inputStyle, paddingRight: '48px' }}
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)} style={eyeBtn}>
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <div>
                <Label>Confirm New Password</Label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                  style={inputStyle}
                />
              </div>

              <button type="submit" disabled={resetLoading} style={submitBtn(resetLoading)}>
                {resetLoading ? 'Resetting Password...' : 'Reset Password'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    background: 'none', border: 'none', color: '#084734',
                    fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Change email address
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

/* Shared Components */
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

const inputStyle = {
  width: '100%', padding: '14px 16px', borderRadius: '12px',
  border: '1.5px solid #EEF2E6', fontSize: '0.95rem',
  outline: 'none', boxSizing: 'border-box',
  fontWeight: 600, background: '#F8FAF7', color: '#161616',
  transition: 'border-color 0.2s',
};

const eyeBtn = {
  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', padding: 0,
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