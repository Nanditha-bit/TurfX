import { useEffect, useState } from 'react';
import axios from 'axios';
import TurfCard from '../components/TurfCard';
import { useSearchParams } from 'react-router-dom';
import BackButton from '../components/BackButton';

import { API_URL as API } from '../config/api';
const CITIES = ['All Cities', 'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune'];
const ITEMS_PER_PAGE = 9;
const SPORT_FILTERS = [
  { label: '⚡ All', value: 'All' },
  { label: '⚽ Football', value: 'Football' },
  { label: '🏏 Cricket', value: 'Cricket' },
  { label: '🏸 Badminton', value: 'Badminton' },
  { label: '🎾 Tennis', value: 'Tennis' },
];
const SORT_OPTIONS = ['Top Rated', 'Price: Low to High', 'Price: High to Low'];

export default function Explore() {
  const [turfs, setTurfs] = useState([]);
  const [sport, setSport] = useState('All');
  const [search, setSearch] = useState('');
  const [maxPrice, setMaxPrice] = useState(5000);
  const [city, setCity] = useState('All Cities');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('Top Rated');
  const [viewMode, setViewMode] = useState('grid');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  useEffect(() => {
    const cityParam = searchParams.get('city');
    const sportParam = searchParams.get('sport');
    if (cityParam) setCity(cityParam);
    if (sportParam) setSport(sportParam);
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    axios.get(`${API}/turfs`)
      .then(res => {
        const turfData = Array.isArray(res.data) ? res.data : (res.data.turfs || []);
        setTurfs(turfData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { setCurrentPage(1); }, [sport, search, maxPrice, city, sortBy]);

  const turfsList = Array.isArray(turfs) ? turfs : [];

  let filtered = turfsList.filter(t => {
    const matchSport = sport === 'All' || (t.sport || '').toLowerCase() === sport.toLowerCase();
    const matchSearch = !search ||
      (t.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.location || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.city || '').toLowerCase().includes(search.toLowerCase());
    const matchPrice = (t.price_per_hour || 0) <= maxPrice;
    const matchCity = city === 'All Cities' ||
      (t.city || '').toLowerCase().includes(city.toLowerCase());
    return matchSport && matchSearch && matchPrice && matchCity;
  });

  if (sortBy === 'Top Rated') filtered = [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));
  else if (sortBy === 'Price: Low to High') filtered = [...filtered].sort((a, b) => a.price_per_hour - b.price_per_hour);
  else if (sortBy === 'Price: High to Low') filtered = [...filtered].sort((a, b) => b.price_per_hour - a.price_per_hour);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getPageNumbers = () => {
    const pages = [];
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const pageBtnStyle = (active) => ({
    width: '40px', height: '40px', borderRadius: '50%',
    border: active ? 'none' : '1.5px solid #e5e7eb',
    background: active ? '#084734' : 'white',
    color: active ? '#CEF17B' : '#161616',
    fontWeight: active ? '800' : '500',
    fontSize: '0.9rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s',
  });

  return (
    <div style={{ background: '#F8FAF7', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>

      {/* HERO HEADER - full width */}
      <div style={{
        background: '#084734',
        paddingBottom: '80px', // extra space for overlapping search bar
        position: 'relative',
        overflow: 'visible',
      }}>
        {/* Grid pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem 0', position: 'relative' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <BackButton variant="dark" />
          </div>
          {/* Label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ display: 'inline-block', width: '24px', height: '2px', background: '#CEF17B' }}></span>
            <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#CEF17B', textTransform: 'uppercase', letterSpacing: '2px', fontFamily: "'DM Sans', sans-serif" }}>
              Explore venues
            </span>
          </div>

          <h1 style={{
            fontSize: '3rem', fontWeight: '900', color: 'white',
            marginBottom: '10px', fontFamily: "'Sora', sans-serif",
            lineHeight: 1.1,
          }}>
            Find Your <span style={{ color: '#CEF17B' }}>Perfect</span> Arena
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '1rem', marginBottom: '0' }}>
            Book premium sports turfs near you — football, cricket, badminton & more
          </p>
        </div>

        {/* OVERLAPPING SEARCH BAR */}
        <div style={{
          maxWidth: '1200px', margin: '0 auto',
          padding: '0 2rem',
          position: 'relative',
          top: '40px',
          zIndex: 10,
        }}>
          <div style={{
            display: 'flex', background: 'white',
            borderRadius: '16px', overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
            border: '1px solid #e5e7eb',
            flexDirection: isMobile ? 'column' : 'row',
          }}>
            {/* City */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 20px', borderRight: '1px solid #e5e7eb', minWidth: '160px' }}>
              <span>📍</span>
              <select value={city} onChange={e => setCity(e.target.value)} style={{
                border: 'none', outline: 'none', fontSize: '0.9rem',
                fontWeight: '600', color: '#161616', background: 'transparent',
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}>
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Search input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 20px', flex: 1, borderRight: '1px solid #e5e7eb' }}>
              <span style={{ color: '#98A2B3' }}>🔍</span>
              <input
                placeholder="Search by name, location or city..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  border: 'none', outline: 'none', fontSize: '0.9rem',
                  width: '100%', color: '#161616', background: 'transparent',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />
            </div>

            {/* Price slider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', borderRight: '1px solid #e5e7eb' }}>
              <span style={{ fontSize: '0.82rem', color: '#98A2B3', fontWeight: '600', whiteSpace: 'nowrap' }}>Max price</span>
              <input
                type="range" min="500" max="10000" step="100"
                value={maxPrice}
                onChange={e => setMaxPrice(parseInt(e.target.value))}
                style={{ width: '100px', accentColor: '#084734' }}
              />
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#161616', whiteSpace: 'nowrap' }}>
                ₹{maxPrice}/hr
              </span>
            </div>

            {/* Search button */}
            <button
              onClick={() => setCurrentPage(1)}
              style={{
                background: '#084734', color: '#CEF17B',
                border: 'none', padding: '16px 32px',
                fontSize: '0.9rem', fontWeight: '700',
                cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: '8px',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'background 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#0a5c3e'}
              onMouseLeave={e => e.currentTarget.style.background = '#084734'}
            >
              🔍 Search
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT - with top padding to account for overlapping search bar */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '80px 2rem 3rem' }}>

        {/* Filters row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Sport filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {SPORT_FILTERS.map(s => (
              <button key={s.value} onClick={() => setSport(s.value)} style={{
                background: sport === s.value ? '#161616' : '#F0F0F0',
                color: sport === s.value ? 'white' : '#161616',
                border: `1.5px solid ${sport === s.value ? '#161616' : '#E5E5E5'}`,
                padding: '9px 20px', borderRadius: '50px',
                fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer',
                transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif",
              }}>
                {s.label}
              </button>
            ))}
          </div>

          {/* Right: count + sort + view */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.88rem', color: '#98A2B3', fontWeight: '500' }}>
              {filtered.length} venues found
            </span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
              padding: '8px 14px', borderRadius: '10px', border: '1.5px solid #e5e7eb',
              fontSize: '0.85rem', fontWeight: '600', color: '#161616',
              background: 'white', cursor: 'pointer', outline: 'none',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
            <div style={{ display: 'flex', border: '1.5px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
              <button onClick={() => setViewMode('grid')} style={{
                padding: '8px 12px', border: 'none', cursor: 'pointer',
                background: viewMode === 'grid' ? '#084734' : 'white',
                color: viewMode === 'grid' ? '#CEF17B' : '#98A2B3',
                fontSize: '1rem', transition: 'all 0.2s',
              }}>⊞</button>
              <button onClick={() => setViewMode('list')} style={{
                padding: '8px 12px', border: 'none', cursor: 'pointer',
                background: viewMode === 'list' ? '#084734' : 'white',
                color: viewMode === 'list' ? '#CEF17B' : '#98A2B3',
                fontSize: '1rem', transition: 'all 0.2s',
              }}>☰</button>
            </div>
          </div>
        </div>

        {/* Turf Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem' }}>
            <p style={{ color: '#98A2B3', fontSize: '1.1rem' }}>Fetching premium venues...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', color: '#98A2B3' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏟</div>
            <p style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px', fontFamily: "'Sora', sans-serif" }}>No venues match your criteria</p>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Try adjusting your filters or search term</p>
            <button onClick={() => { setSport('All'); setCity('All Cities'); setSearch(''); setMaxPrice(5000); }}
              style={{ background: '#084734', color: '#CEF17B', border: 'none', padding: '12px 28px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            <div style={{
              display: viewMode === 'grid' ? 'grid' : 'flex',
              gridTemplateColumns: viewMode === 'grid'
                ? (isMobile ? '1fr' : windowWidth < 1024 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)')
                : undefined,
              flexDirection: viewMode === 'list' ? 'column' : undefined,
              gap: '1.5rem',
            }}>
              {paginated.map(turf => <TurfCard key={turf._id} turf={turf} />)}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '3rem' }}>
                <button onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
                  disabled={currentPage === 1}
                  style={{ ...pageBtnStyle(false), opacity: currentPage === 1 ? 0.4 : 1 }}>←</button>
                {getPageNumbers().map(page => (
                  <button key={page} onClick={() => { setCurrentPage(page); window.scrollTo(0, 0); }}
                    style={pageBtnStyle(currentPage === page)}>{page}</button>
                ))}
                <button onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }}
                  disabled={currentPage === totalPages}
                  style={{ ...pageBtnStyle(false), opacity: currentPage === totalPages ? 0.4 : 1 }}>→</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
