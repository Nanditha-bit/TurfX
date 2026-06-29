import { useEffect, useState } from 'react';
import axios from 'axios';
import TurfCard from '../components/TurfCard';
import HowItWorks from '../components/HowItWorks';
import OffersSection from '../components/OffersSection';
import { useNavigate } from 'react-router-dom';
import { Search, Navigation, Trophy, MapPin } from 'lucide-react';
import { API_URL as API } from '../config/api';
import { useTheme } from '../context/ThemeContext';

const POPULAR_CITIES = ['Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad'];

const SPORTS = [
  { name: 'Football' },
  { name: 'Cricket' },
  { name: 'Badminton' },
  { name: 'Tennis' },
  { name: 'Basketball' },
];

const FILTER_SPORTS = ['All', 'Football', 'Cricket', 'Badminton'];

export default function Home() {
  const [turfs, setTurfs] = useState([]);
  const [sport, setSport] = useState('All');
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Bengaluru');
  const navigate = useNavigate();
  const { colors, theme } = useTheme();

  useEffect(() => {
    axios.get(`${API}/turfs`)
      .then(res => {
        const turfData = Array.isArray(res.data) ? res.data : (res.data.turfs || []);
        setTurfs(turfData);
      })
      .catch(err => console.error('Failed to fetch turfs:', err));
  }, []);

  const fetchNearby = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await axios.get(`${API}/turfs/nearby?lat=${latitude}&lng=${longitude}&radius=10000`);
        const turfData = Array.isArray(res.data) ? res.data : (res.data.turfs || []);
        setTurfs(turfData);
      } catch (err) { console.error(err); }
      setLoading(false);
    }, () => { alert('Location access denied'); setLoading(false); });
  };

  const turfsList = Array.isArray(turfs) ? turfs : [];
  const filtered = sport === 'All'
    ? turfsList
    : turfsList.filter(t => (t.sport || '').toLowerCase() === sport.toLowerCase());

  return (
    <div style={{ background: colors.background, fontFamily: "'DM Sans', sans-serif" }}>

      {/* HERO */}
      <div style={{
        background: '#084734',
        padding: '5rem 2rem 4rem',
        textAlign: 'center',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '520px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Grid pattern - ONLY in hero */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }} />

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(206,241,123,0.15)', border: '1px solid rgba(206,241,123,0.3)',
          borderRadius: '50px', padding: '8px 20px', marginBottom: '2rem',
          fontSize: '0.8rem', fontWeight: '700', color: '#CEF17B',
          letterSpacing: '1px', textTransform: 'uppercase',
        }}>
          <Trophy size={14} color="#CEF17B" /> India's #1 Sports Booking Platform
        </div>

        <h1 style={{
          fontSize: '4.5rem', fontWeight: '900',
          marginBottom: '0.5rem', lineHeight: 1.05,
          letterSpacing: '-2px', color: 'white',
          fontFamily: "'Sora', sans-serif",
        }}>
          Book. Play.
        </h1>
        <h1 style={{
          fontSize: '4.5rem', fontWeight: '900',
          marginBottom: '1.5rem', lineHeight: 1.05,
          letterSpacing: '-2px', color: '#CEF17B',
          fontFamily: "'Sora', sans-serif",
        }}>
          Enjoy.
        </h1>

        <p style={{
          fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)',
          marginBottom: '2.5rem', maxWidth: '480px',
          fontWeight: '400', lineHeight: 1.6,
        }}>
          Find and reserve premium sports turfs near you — football, cricket, badminton & more.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}>
          <button onClick={() => navigate('/explore')} style={{
            background: '#CEF17B', color: '#084734',
            border: 'none', padding: '16px 36px',
            borderRadius: '50px', fontSize: '1rem',
            fontWeight: '800', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'all 0.3s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(206,241,123,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <Search size={18} /> Book a Turf
          </button>
          <button onClick={fetchNearby} style={{
            background: 'transparent', color: 'white',
            border: '1.5px solid rgba(255,255,255,0.4)',
            padding: '16px 36px', borderRadius: '50px',
            fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'all 0.3s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; }}
          >
            <Navigation size={18} /> {loading ? 'Locating...' : 'Venues Near Me'}
          </button>
        </div>

        {/* Sport Quick Select */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {SPORTS.map(s => (
            <button key={s.name} onClick={() => { navigate(`/explore?sport=${s.name}`); }}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.85)', padding: '10px 20px',
                borderRadius: '50px', cursor: 'pointer',
                fontSize: '0.9rem', fontWeight: '600',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(206,241,123,0.15)'; e.currentTarget.style.borderColor = '#CEF17B'; e.currentTarget.style.color = '#CEF17B'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* STATS BAR */}
      <div style={{ background: '#161616', padding: '2rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', textAlign: 'center' }}>
          {[
            { value: '10K+', label: 'Active Players' },
            { value: '500+', label: 'Turfs Listed' },
            { value: '50K+', label: 'Bookings Made' },
            { value: '4.8', label: 'Average Rating' },
          ].map(stat => (
            <div key={stat.label}>
              <div style={{ fontSize: '2rem', fontWeight: '900', color: '#CEF17B', marginBottom: '4px' }}>{stat.value}</div>
              <div style={{ fontSize: '0.8rem', color: '#98A2B3', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* POPULAR CITIES */}
      <div style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', background: colors.background }}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#084734', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '20px', height: '2px', background: '#CEF17B' }}></span>
            Find your field
          </div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '800', color: colors.text, marginBottom: '8px', fontFamily: "'Sora', sans-serif" }}>Popular <span style={{ color: '#084734' }}>Cities</span></h2>
          <p style={{ color: colors.textSecondary, fontSize: '1rem', fontFamily: "'DM Sans', sans-serif" }}>Book turfs across India's top sports cities</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {POPULAR_CITIES.map(c => (
            <div key={c} onClick={() => { setSelectedCity(c); navigate(`/explore?city=${c}`); }}
              style={{
                background: selectedCity === c ? '#084734' : colors.cardBg,
                border: `1.5px solid ${selectedCity === c ? '#084734' : colors.border}`,
                borderRadius: '50px', padding: '10px 24px',
                cursor: 'pointer', fontSize: '0.9rem',
                fontWeight: selectedCity === c ? '700' : '500',
                color: selectedCity === c ? 'white' : colors.text,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { if (selectedCity !== c) { e.currentTarget.style.borderColor = '#084734'; e.currentTarget.style.color = '#084734'; e.currentTarget.style.background = colors.cardBg; } }}
              onMouseLeave={e => { if (selectedCity !== c) { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.color = colors.text; e.currentTarget.style.background = colors.cardBg; } }}
            >
              {c}
            </div>
          ))}
        </div>
      </div>

      {/* FEATURED TURFS */}
      <div style={{ padding: '0 2rem 5rem', maxWidth: '1200px', margin: '0 auto', background: colors.background }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#084734', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '20px', height: '2px', background: '#CEF17B' }}></span>
              Top rated near you
            </div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: '800', color: colors.text }}>
              Featured <span style={{ color: '#084734' }}>Turfs</span>
            </h2>
          </div>
          <button onClick={() => navigate('/explore')} style={{
            background: 'none', border: 'none', color: '#084734',
            fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#CEF17B'}
            onMouseLeave={e => e.currentTarget.style.color = '#084734'}
          >
            View All Venues →
          </button>
        </div>

        {/* Sport Filter */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {FILTER_SPORTS.map(s => (
            <button key={s} onClick={() => setSport(s)} style={{
              background: sport === s ? '#161616' : colors.hover,
              color: sport === s ? 'white' : colors.text,
              border: `1.5px solid ${sport === s ? '#161616' : colors.border}`,
              padding: '8px 20px', borderRadius: '50px',
              fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
              {s}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: colors.textSecondary }}>
            <MapPin size={48} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.3 }} />
            <p style={{ fontSize: '1.1rem', fontWeight: '500' }}>No venues match your current selection.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {filtered.slice(0, 6).map(turf => <TurfCard key={turf._id} turf={turf} />)}
          </div>
        )}
      </div>

      {/* HOW IT WORKS */}
      <HowItWorks />

      {/* OFFERS */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
        <OffersSection />
      </div>

    </div>
  );
}
