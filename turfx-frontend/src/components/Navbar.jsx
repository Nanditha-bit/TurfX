import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import { useState, useEffect, useRef } from 'react';
import { COUNTRIES, INDIA_STATES, INDIA_STATE_NAMES } from '../data/indiaLocations';
import {
  MapPin, ChevronDown, ChevronLeft, User, BookOpen,
  LogOut, Menu, Globe, LogIn,
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [city, setCity] = useState('India');
  const [showCities, setShowCities] = useState(false);
  const [locationStep, setLocationStep] = useState('country');
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const cityRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  useEffect(() => {
    const handleClick = (e) => {
      if (cityRef.current && !cityRef.current.contains(e.target)) {
        setShowCities(false);
        setLocationStep('country');
        setSelectedCountry(null);
        setSelectedState(null);
      }
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const iconStyle = { flexShrink: 0 };

  return (
    <nav style={{
      background: '#084734',
      padding: '0 2.5rem',
      height: '68px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
    }}>

      {/* Left — Logo + City */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
          <img src={logo} alt="TurfX" style={{ height: '44px', objectFit: 'contain' }} />
        </Link>

        {/* City Selector */}
        <div style={{ position: 'relative' }} ref={cityRef}>
          <button
            onClick={() => setShowCities(!showCities)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '20px',
              padding: '6px 14px', cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.2)',
              transition: 'all 0.2s',
            }}
          >
            <MapPin size={14} color="white" style={iconStyle} />
            <span style={{ fontSize: '0.85rem', color: 'white', fontWeight: '600' }}>{city}</span>
            <ChevronDown
              size={13}
              color="rgba(255,255,255,0.7)"
              style={{ transform: showCities ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', ...iconStyle }}
            />
          </button>

          {showCities && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0,
              background: 'white', borderRadius: '16px',
              boxShadow: '0 12px 48px rgba(0,0,0,0.2)',
              padding: '1rem', width: '300px',
              maxHeight: '420px', overflowY: 'auto',
              zIndex: 999,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingLeft: '4px' }}>
                {locationStep !== 'country' && (
                  <button
                    onClick={() => {
                      if (locationStep === 'district') { setLocationStep('state'); setSelectedState(null); }
                      else if (locationStep === 'state') { setLocationStep('country'); setSelectedCountry(null); }
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '24px', height: '24px', borderRadius: '50%',
                      border: 'none', background: '#f0f0f0', cursor: 'pointer',
                      color: '#084734', flexShrink: 0,
                    }}
                    aria-label="Back"
                  >
                    <ChevronLeft size={14} />
                  </button>
                )}
                <div style={{ fontSize: '0.7rem', color: '#999', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                  {locationStep === 'country' && 'Select Country'}
                  {locationStep === 'state' && `Select State${selectedCountry ? ` · ${selectedCountry}` : ''}`}
                  {locationStep === 'district' && `Select District${selectedState ? ` · ${selectedState}` : ''}`}
                </div>
              </div>

              {locationStep === 'country' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {COUNTRIES.map(co => (
                    <button
                      key={co}
                      onClick={() => { setSelectedCountry(co); setLocationStep('state'); }}
                      style={{ padding: '10px 12px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.88rem', color: '#084734', background: '#DCEFB8', fontWeight: '700', transition: 'all 0.15s', border: 'none', textAlign: 'left', width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <Globe size={14} /> {co}
                    </button>
                  ))}
                </div>
              )}

              {locationStep === 'state' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  {INDIA_STATE_NAMES.map(s => (
                    <button key={s} onClick={() => { setSelectedState(s); setLocationStep('district'); }}
                      style={{ padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem', color: '#444', background: 'transparent', fontWeight: '500', transition: 'all 0.15s', border: 'none', textAlign: 'left', width: '100%' }}
                      onMouseEnter={e => { e.target.style.background = '#f5f5f5'; }}
                      onMouseLeave={e => { e.target.style.background = 'transparent'; }}
                    >{s}</button>
                  ))}
                </div>
              )}

              {locationStep === 'district' && selectedState && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  {INDIA_STATES[selectedState].map(d => (
                    <button key={d}
                      onClick={() => { setCity(d); setShowCities(false); setLocationStep('country'); setSelectedCountry(null); setSelectedState(null); navigate(`/explore?city=${encodeURIComponent(d)}`); }}
                      style={{ padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem', color: city === d ? '#084734' : '#444', background: city === d ? '#DCEFB8' : 'transparent', fontWeight: city === d ? '700' : '500', transition: 'all 0.15s', border: 'none', textAlign: 'left', width: '100%' }}
                      onMouseEnter={e => { if (city !== d) e.target.style.background = '#f5f5f5'; }}
                      onMouseLeave={e => { if (city !== d) e.target.style.background = 'transparent'; }}
                    >{d}</button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Center — Nav Links */}
      {!isMobile && (
        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
          {[{ label: 'Home', to: '/' }, { label: 'Book', to: '/explore' }, { label: 'Venues', to: '/explore' }].map(link => (
            <Link key={link.label} to={link.to} style={{
              color: 'rgba(255,255,255,0.85)', textDecoration: 'none',
              fontSize: '0.9rem', fontWeight: '500', padding: '8px 18px',
              borderRadius: '8px', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.target.style.color = '#CEF17B'; }}
              onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,0.85)'; }}
            >{link.label}</Link>
          ))}
        </div>
      )}

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {user ? (
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button onClick={() => setShowUserMenu(!showUserMenu)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '6px 14px 6px 6px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.3)', transition: 'all 0.2s', background: 'transparent' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#CEF17B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#084734', fontWeight: '800', fontSize: '0.85rem' }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              {!isMobile && <span style={{ color: 'white', fontWeight: '600', fontSize: '0.88rem' }}>{user.name.split(' ')[0]}</span>}
            </button>

            {showUserMenu && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'white', borderRadius: '14px', boxShadow: '0 12px 48px rgba(0,0,0,0.2)', padding: '8px', width: '210px', zIndex: 999 }}>
                <div style={{ padding: '12px 14px', borderBottom: '1px solid #f0f0f0', marginBottom: '4px' }}>
                  <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#161616' }}>{user.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '2px' }}>{user.email || user.phone}</div>
                </div>
                {isMobile && (
                  <>
                    <Link to="/" onClick={() => setShowUserMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', color: '#444', textDecoration: 'none', fontSize: '0.88rem', fontWeight: '600' }}>Home</Link>
                    <Link to="/explore" onClick={() => setShowUserMenu(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', color: '#444', textDecoration: 'none', fontSize: '0.88rem', fontWeight: '600' }}>Explore Venues</Link>
                    <div style={{ borderTop: '1px solid #f0f0f0', margin: '4px 0' }} />
                  </>
                )}
                <Link to="/profile" onClick={() => setShowUserMenu(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', color: '#444', textDecoration: 'none', fontSize: '0.88rem', fontWeight: '600' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <User size={15} color="#6b7280" /> My Profile
                </Link>
                <Link to="/my-bookings" onClick={() => setShowUserMenu(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', color: '#444', textDecoration: 'none', fontSize: '0.88rem', fontWeight: '600' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <BookOpen size={15} color="#6b7280" /> My Bookings
                </Link>
                <button onClick={() => { logout(); navigate('/'); setShowUserMenu(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', color: '#ef4444', fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer', background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={15} color="#ef4444" /> Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          isMobile ? (
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                aria-label="Menu"
              >
                <Menu size={18} color="white" />
              </button>
              {showUserMenu && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'white', borderRadius: '14px', boxShadow: '0 12px 48px rgba(0,0,0,0.2)', padding: '8px', width: '200px', zIndex: 999 }}>
                  <Link to="/" onClick={() => setShowUserMenu(false)} style={{ display: 'block', padding: '10px 14px', borderRadius: '8px', color: '#444', textDecoration: 'none', fontSize: '0.88rem', fontWeight: '600' }}>Home</Link>
                  <Link to="/explore" onClick={() => setShowUserMenu(false)} style={{ display: 'block', padding: '10px 14px', borderRadius: '8px', color: '#444', textDecoration: 'none', fontSize: '0.88rem', fontWeight: '600' }}>Explore Venues</Link>
                  <div style={{ borderTop: '1px solid #f0f0f0', margin: '4px 0' }} />
                  <button onClick={() => { navigate('/login'); setShowUserMenu(false); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', color: '#084734', fontSize: '0.88rem', fontWeight: '700', cursor: 'pointer', background: 'none', border: 'none', width: '100%', textAlign: 'left' }}>
                    <LogIn size={15} /> Login / Signup
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => navigate('/login')} style={{
              background: '#CEF17B', color: '#084734', border: 'none', padding: '10px 24px',
              borderRadius: '25px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: '800',
              display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <LogIn size={16} /> Login / Signup
            </button>
          )
        )}
      </div>
    </nav>
  );
}
