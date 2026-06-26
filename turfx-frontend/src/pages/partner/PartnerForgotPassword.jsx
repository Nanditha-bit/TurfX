import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import logo from '../../assets/logo.png';

import { API_URL as API } from '../../config/api';

// Brand colors
const GREEN = '#084734';
const LIME = '#CEF17B';
const LIME_BG = '#DCEFB8';

export default function PartnerForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Enter phone, 2: Enter OTP & new password
  
  // Step 1 state
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step 2 state
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await axios.post(`${API}/auth/forgot-password`, {
        phone: `+91${phone}`,
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
        phone: `+91${phone}`,
        otp,
        newPassword,
      });
      
      // Success - redirect to partner login
      navigate('/partner/login', { 
        state: { message: 'Password reset successfully! Please login with your new password.' }
      });
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to reset password. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Left Panel */}
      <div style={{
        width: '480px', minWidth: '480px', background: '#fff',
        display: 'flex', flexDirection: 'column',
        padding: '3rem 3.5rem', justifyContent: 'center',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3rem' }}>
          <Link to="/partner/login">
            <img src={logo} alt="TurfX" style={{ height: '36px' }} />
          </Link>
          <span style={{
            background: LIME_BG, color: GREEN, fontWeight: '800',
            fontSize: '0.75rem', letterSpacing: '1.5px', padding: '4px 10px',
            borderRadius: '6px',
          }}>PARTNER</span>
        </div>

        {/* Back Link */}
        <Link to="/partner/login" style={{
          color: GREEN, fontSize: '0.9rem', fontWeight: '600',
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px',
          marginBottom: '2rem',
        }}>
          <ArrowLeft size={16} /> Back to Login
        </Link>

        {step === 1 ? (
          // Step 1: Enter Phone Number
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#161616', marginBottom: '0.5rem' }}>
              Reset Partner Password
            </h2>
            <p style={{ color: '#98A2B3', fontWeight: '500', marginBottom: '2rem', fontSize: '0.95rem' }}>
              Enter your registered phone number to receive an OTP
            </p>

            {error && <ErrorBox msg={error} />}

            <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <Label>Mobile Number</Label>
                <div style={{ display: 'flex', borderRadius: '12px', border: '1.5px solid #E5E7EB', overflow: 'hidden' }}>
                  <div style={{
                    padding: '14px 16px', background: '#F9FAFB', borderRight: '1.5px solid #E5E7EB',
                    display: 'flex', alignItems: 'center', gap: '6px',
                    fontSize: '0.95rem', fontWeight: '600', color: '#374151', whiteSpace: 'nowrap',
                  }}>
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel" placeholder="Enter your mobile number"
                    value={phone} maxLength={10}
                    onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setError(''); }}
                    style={{
                      flex: 1, padding: '14px 16px', border: 'none', outline: 'none',
                      fontSize: '0.95rem', fontWeight: '500', color: '#111827', background: '#fff',
                    }}
                    autoFocus
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} style={submitBtn(loading)}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          </div>
        ) : (
          // Step 2: Enter OTP & New Password
          <div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#161616', marginBottom: '0.5rem' }}>
              Enter OTP & New Password
            </h2>
            <p style={{ color: '#98A2B3', fontWeight: '500', marginBottom: '2rem', fontSize: '0.95rem' }}>
              We've sent an OTP to +91{phone}
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
              </div>

              <div>
                <Label>New Password</Label>
                <input
                  type="password"
                  placeholder="Enter new password (min 6 chars)"
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setError(''); }}
                  style={inputStyle}
                />
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
                    background: 'none', border: 'none', color: GREEN,
                    fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Change phone number
                </button>
              </div>
            </form>
          </div>
        )}

        <p style={{ color: '#D1D5DB', fontSize: '0.78rem', textAlign: 'center', marginTop: '3rem' }}>
          © 2024 MetaQode Technologies Pvt. Ltd.
        </p>
      </div>

      {/* Right Panel */}
      <div style={{
        flex: 1, background: GREEN,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '5rem', position: 'relative', overflow: 'hidden',
      }}>
        {/* Grid pattern */}
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
            — SECURE ACCESS
          </p>
          <h1 style={{ fontSize: '3rem', fontWeight: '900', color: '#fff', lineHeight: 1.15, marginBottom: '1.5rem' }}>
            Secure Your<br />
            <span style={{ color: LIME }}>Partner Account.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1rem', lineHeight: 1.7, maxWidth: '480px' }}>
            Reset your password securely with OTP verification. Your venue data and customer information remain protected.
          </p>
        </div>
      </div>
    </div>
  );
}

/* Shared Components */
function Label({ children }) {
  return (
    <label style={{
      display: 'block', fontSize: '0.75rem', fontWeight: '700',
      color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.8px',
    }}>
      {children}
    </label>
  );
}

function ErrorBox({ msg }) {
  return (
    <div style={{
      background: '#fff1f2', color: '#be123c', padding: '14px 16px',
      borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.88rem',
      fontWeight: '600', border: '1px solid #fecdd3',
    }}>
      {msg}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '14px 16px', borderRadius: '12px',
  border: '1.5px solid #E5E7EB', fontSize: '0.95rem',
  outline: 'none', boxSizing: 'border-box',
  fontWeight: '500', background: '#fff', color: '#111827',
  transition: 'border-color 0.2s',
};

const submitBtn = (loading) => ({
  width: '100%',
  background: loading ? '#b5d96a' : LIME,
  color: GREEN,
  border: 'none',
  padding: '16px',
  borderRadius: '12px',
  cursor: loading ? 'not-allowed' : 'pointer',
  fontWeight: '800',
  fontSize: '1rem',
  transition: 'background 0.2s',
  marginTop: '0.5rem',
  opacity: loading ? 0.7 : 1,
});