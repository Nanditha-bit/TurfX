import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import {
  LayoutDashboard, MapPin, Calendar, Clock,
  IndianRupee, TrendingUp, Settings,
  LogOut, User as UserIcon, Wallet, Percent, HelpCircle,
  Trophy, Footprints
} from 'lucide-react';

import PartnerVenues from '../../components/partner/PartnerVenues';
import AddVenueForm from '../../components/partner/AddVenueForm';
import PartnerBookings from '../../components/partner/PartnerBookings';
import CreateBooking from '../../components/partner/CreateBooking';
import PartnerWallet from '../../components/partner/PartnerWallet';
import PartnerPayouts from '../../components/partner/PartnerPayouts';
import PartnerSupport from '../../components/partner/PartnerSupport';
import PartnerProfile from '../../components/partner/PartnerProfile';
import PartnerLogout from '../../components/partner/PartnerLogout';
import PartnerPricing from '../../components/partner/PartnerPricing';
import PartnerReviews from '../../components/partner/PartnerReviews';
import PartnerSettings from '../../components/partner/PartnerSettings';
import PartnerSlots from '../../components/partner/PartnerSlots';
import PartnerEarnings from '../../components/partner/PartnerEarnings';
import PartnerOffers from '../../components/partner/PartnerOffers';

import { API_URL as API } from '../../config/api';

const SIDEBAR_BG = '#084734'; // same as home page green
const SIDEBAR_ACTIVE = 'rgba(206,241,123,0.12)';
const ACCENT = '#CEF17B';
const ACCENT_DARK = '#084734';

const navGroups = [
  {
    label: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'venues',    label: 'Venues',    icon: MapPin,     badge: 'venues' },
      { id: 'bookings',  label: 'Bookings',  icon: Calendar,   badge: 'bookings' },
      { id: 'slots',     label: 'Slots',     icon: Clock },
    ],
  },
  {
    label: 'Finance',
    items: [
      { id: 'earnings', label: 'Earnings', icon: TrendingUp },
      { id: 'pricing',  label: 'Pricing',  icon: IndianRupee },
      { id: 'payouts',  label: 'Payouts',  icon: Wallet },
      { id: 'offers',   label: 'Offers',   icon: Percent },
    ],
  },
  {
    label: 'Account',
    items: [
      { id: 'profile',  label: 'Profile',  icon: UserIcon },
      { id: 'settings', label: 'Settings', icon: Settings },
      { id: 'support',  label: 'Support',  icon: HelpCircle },
    ],
  },
];

function formatDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function PartnerDashboard() {
  const { token, user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCreateBooking, setShowCreateBooking] = useState(false);
  const [settingsSection, setSettingsSection] = useState('general');

  const switchTab = (id, section) => {
    setTab(id);
    setShowAddForm(false);
    setShowCreateBooking(false);
    if (id === 'settings' && section) setSettingsSection(section);
  };

  const fetchDashboard = () => {
    if (!token) return Promise.resolve();
    setLoading(true);
    return axios.get(`${API}/owner/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { setData(res.data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  };

  useEffect(() => {
    // Wait for auth to load before checking
    if (isLoading) return;
    
    // Only redirect if user is definitely not authenticated
    if (!user || !token) { 
      console.log('No user or token found, redirecting to login');
      navigate('/partner/login'); 
      return; 
    }
    
    // Only redirect if user role is definitely wrong
    if (user.role !== 'owner' && user.role !== 'admin') { 
      console.log('Invalid user role, redirecting to login');
      navigate('/partner/login'); 
      return; 
    }
    
    fetchDashboard();
  }, [token, user, isLoading]); // Added isLoading to wait for auth initialization

  const getBadgeCount = (id) => {
    if (!data) return null;
    if (id === 'venues')    return data.turfs?.length || null;
    if (id === 'bookings')  return data.upcomingBookings?.length || null;
    return null;
  };

  const chartHeights = (() => {
    if (!data?.bookings) return [40, 60, 45, 80, 55, 90, 75, 100];
    const last8Days = Array(8).fill(0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    data.bookings.forEach(b => {
      if (b.status === 'cancelled') return;
      const bDate = new Date(b.date); bDate.setHours(0, 0, 0, 0);
      const diff = Math.floor((today - bDate) / 86400000);
      if (diff >= 0 && diff < 8) last8Days[7 - diff] += b.total_price || 0;
    });
    const maxVal = Math.max(...last8Days, 1);
    return last8Days.map(v => Math.max((v / maxVal) * 100, 5));
  })();

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'P';

  // Show loading screen while auth is initializing
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh', 
        background: '#F4F6F3',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ 
          width: '48px', 
          height: '48px', 
          border: '4px solid #E9EDE8', 
          borderTop: '4px solid #CEF17B', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite' 
        }} />
        <p style={{ color: '#6B7280', fontWeight: '600' }}>Loading partner dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F6F3', fontFamily: "'Inter', sans-serif" }}>

      {/* ══════════ SIDEBAR ══════════ */}
      <div style={{
        width: '240px', background: SIDEBAR_BG, height: '100vh', position: 'fixed',
        display: 'flex', flexDirection: 'column', zIndex: 100, overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '1.5rem 1.5rem 1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '10px', padding: '6px', display: 'flex', alignItems: 'center' }}>
            <img src={logo} alt="TurfX" style={{ height: '30px' }} />
          </div>
          <span style={{
            border: `1.5px solid ${ACCENT}`, color: ACCENT,
            fontWeight: '800', fontSize: '0.72rem', letterSpacing: '1.5px',
            padding: '3px 10px', borderRadius: '6px', background: 'transparent',
          }}>PARTNER</span>
        </div>

        {/* Nav groups */}
        <div style={{ flex: 1, padding: '0.5rem 0' }}>
          {navGroups.map(group => (
            <div key={group.label} style={{ marginBottom: '0.5rem' }}>
              <div style={{
                padding: '0.6rem 1.5rem 0.3rem',
                fontSize: '0.65rem', fontWeight: '700', letterSpacing: '1.5px',
                color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
              }}>{group.label}</div>
              {group.items.map(item => {
                const Icon = item.icon;
                const active = tab === item.id;
                const badge = item.badge ? getBadgeCount(item.badge) : null;
                return (
                  <div
                    key={item.id}
                    onClick={() => switchTab(item.id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 12px', margin: '1px 10px', cursor: 'pointer',
                      background: active ? SIDEBAR_ACTIVE : 'transparent',
                      borderRadius: '10px',
                      transition: '0.15s all',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Icon size={18} color={active ? ACCENT : 'rgba(255,255,255,0.45)'} />
                      <span style={{
                        fontSize: '0.9rem', fontWeight: active ? '700' : '500',
                        color: active ? ACCENT : 'rgba(255,255,255,0.65)',
                      }}>{item.label}</span>
                    </div>
                    {badge > 0 && (
                      <span style={{
                        background: '#3A5C3D',
                        color: ACCENT,
                        fontSize: '0.72rem', fontWeight: '800',
                        padding: '2px 8px', borderRadius: '20px', minWidth: '22px', textAlign: 'center',
                      }}>{badge}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Logout */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div
            onClick={() => switchTab('logout')}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              cursor: 'pointer', padding: '10px 0',
              color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', fontWeight: '600',
            }}
          >
            <LogOut size={18} />
            Logout
          </div>
        </div>
      </div>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <div style={{ flex: 1, marginLeft: '240px', display: 'flex', flexDirection: 'column' }}>

        {/* TOP BAR */}
        <div style={{
          background: '#fff', padding: '0.9rem 2.5rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid #E9EDE8', position: 'sticky', top: 0, zIndex: 90,
        }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#0D1F0F', textTransform: 'capitalize', margin: 0 }}>
              {showAddForm ? 'Add New Venue' : tab}
            </h2>
            {tab === 'dashboard' && (
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#9CA3AF', fontWeight: '500', marginTop: '2px' }}>
                {formatDate()}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            {/* User */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#111827' }}>{user?.name}</div>
                <div style={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: '500' }}>Partner Owner</div>
              </div>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: ACCENT_DARK, color: ACCENT,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '800', fontSize: '1rem',
              }}>{userInitial}</div>
            </div>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div style={{ padding: '2rem 2.5rem', flex: 1 }}>

          {/* ── DASHBOARD TAB ── */}
          {tab === 'dashboard' && data && (
            <div style={{ animation: 'fadeIn 0.4s ease-out' }}>

              {/* STAT CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.2rem', marginBottom: '2rem' }}>
                {[
            { label: 'Total Bookings',   value: data.totalBookings || 0,                        trend: 'Total all time',          up: true,  icon: Calendar, color: '#3B82F6' },
            { label: 'Total Earnings',   value: (data.totalEarnings||0) >= 100000 ? `₹${((data.totalEarnings||0)/100000).toFixed(1)}L` : `₹${(data.totalEarnings||0).toLocaleString()}`, trend: 'Confirmed bookings', up: true, icon: IndianRupee, color: '#10B981' },
            { label: 'Upcoming Bookings',value: data.upcomingBookingsCount || 0,                  trend: 'Confirmed & future',      up: true,  icon: Clock, color: '#F59E0B' },
            { label: 'Total Venues',     value: data.turfs?.length || 0,                         trend: 'Active venues',           up: null,  icon: MapPin, color: '#8B5CF6' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
            <div key={i} style={{
              background: '#fff', padding: '1.4rem', borderRadius: '16px',
              border: '1px solid #E9EDE8', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</span>
                <Icon size={24} color={s.color} />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: '900', color: '#0D1F0F', marginBottom: '6px' }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: s.up ? '#10B981' : '#9CA3AF' }}>
                {s.up && '▲ '}{s.trend}
              </div>
              <div style={{ height: '3px', background: '#F3F4F6', borderRadius: '2px', marginTop: '1rem' }}>
                <div style={{ height: '100%', width: s.up ? '60%' : '100%', background: s.color, borderRadius: '2px' }} />
              </div>
            </div>
          )})}
              </div>

              {/* UPCOMING BOOKINGS + EARNINGS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

                {/* Upcoming Bookings */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #E9EDE8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                    <h3 style={{ fontWeight: '800', fontSize: '1rem', color: '#0D1F0F', margin: 0 }}>Upcoming Bookings</h3>
                    <span onClick={() => switchTab('bookings')} style={{ color: ACCENT_DARK, fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline' }}>View All →</span>
                  </div>
                  {data.upcomingBookings?.length > 0 ? data.upcomingBookings.slice(0, 5).map((b, i) => {
                    const sportIcons = { football: Trophy, cricket: Trophy, badminton: Trophy, tennis: Trophy, basketball: Trophy };
                    const sport = (b.turf_id?.sport || '').toLowerCase();
                    const Icon = sportIcons[sport] || Footprints;
                    const statusColor = b.status === 'confirmed' ? { bg: '#D1FAE5', text: '#065F46' } : { bg: '#FEF3C7', text: '#92400E' };
                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '10px 0', borderBottom: i < 4 ? '1px solid #F3F4F6' : 'none',
                      }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={20} color="#10B981" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.user_id?.name || 'Player'}</div>
                          <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '2px' }}>{b.turf_id?.name} · {Array.isArray(b.time_slots) ? b.time_slots[0] : b.time_slot}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span style={{ background: statusColor.bg, color: statusColor.text, fontSize: '0.68rem', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>{b.status}</span>
                          <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0D1F0F', marginTop: '4px' }}>₹{b.total_price}</div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF', fontSize: '0.9rem' }}>No upcoming bookings</div>
                  )}
                </div>

                {/* Earnings Overview */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #E9EDE8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontWeight: '800', fontSize: '1rem', color: '#0D1F0F', margin: 0 }}>Earnings Overview</h3>
                    <select style={{ border: '1px solid #E5E7EB', background: '#F9FAFB', color: '#6B7280', fontWeight: '600', outline: 'none', cursor: 'pointer', borderRadius: '8px', padding: '4px 8px', fontSize: '0.78rem' }}>
                      <option>This Month</option>
                      <option>Last Month</option>
                      <option>Last 3 Months</option>
                    </select>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '900', color: '#0D1F0F' }}>₹{(data.totalEarnings || 0).toLocaleString()}</div>
                  <div style={{ fontSize: '0.78rem', color: '#10B981', fontWeight: '600', marginBottom: '1.5rem' }}>▲ +8.4% from last month</div>
                  <div style={{ height: '140px', display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
                    {chartHeights.map((h, i) => (
                      <div key={i} style={{ flex: 1, background: '#E8F5D0', borderRadius: '5px 5px 0 0', height: `${h}%`, position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', bottom: 0, width: '100%', background: ACCENT, height: '35%', borderRadius: '4px 4px 0 0' }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                    {['W1','W2','W3','W4','W5'].map(w => (
                      <span key={w} style={{ fontSize: '0.7rem', color: '#9CA3AF', fontWeight: '600' }}>{w}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* MY VENUES + RECENT ACTIVITY */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                {/* My Venues */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #E9EDE8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                    <h3 style={{ fontWeight: '800', fontSize: '1rem', color: '#0D1F0F', margin: 0 }}>My Venues</h3>
                    <span onClick={() => switchTab('venues')} style={{ color: ACCENT_DARK, fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline' }}>Manage →</span>
                  </div>
                  {data.turfs?.length > 0 ? data.turfs.map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < data.turfs.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <MapPin size={20} color="#10B981" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '0.88rem', color: '#111827' }}>{t.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{t.location} · {t.sport}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#0D1F0F' }}>₹{(t.earnings || 0).toLocaleString()}</div>
                        <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: '0.65rem', fontWeight: '700', padding: '2px 7px', borderRadius: '5px' }}>● Active</span>
                      </div>
                    </div>
                  )) : (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: '#9CA3AF', fontSize: '0.85rem' }}>No venues yet</div>
                  )}
                  <div
                    onClick={() => { setShowAddForm(true); setTab('venues'); }}
                    style={{ marginTop: '1rem', padding: '10px', borderRadius: '10px', border: '1.5px dashed #D1FAE5', textAlign: 'center', cursor: 'pointer', color: '#4A7C2F', fontWeight: '700', fontSize: '0.85rem', background: '#F0FDF4' }}
                  >+ Add New Venue</div>
                </div>

                {/* Recent Activity */}
                <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', border: '1px solid #E9EDE8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                    <h3 style={{ fontWeight: '800', fontSize: '1rem', color: '#0D1F0F', margin: 0 }}>Recent Activity</h3>
                    <span onClick={() => switchTab('bookings')} style={{ color: ACCENT_DARK, fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer', textDecoration: 'underline' }}>All activity →</span>
                  </div>
                  {data.recentActivity?.length > 0 ? data.recentActivity.slice(0, 5).map((a, i) => {
                    const dotColors = ['#10B981','#3B82F6','#F59E0B','#EF4444','#8B5CF6'];
                    return (
                      <div key={i} style={{ display: 'flex', gap: '10px', padding: '8px 0', borderBottom: i < 4 ? '1px solid #F3F4F6' : 'none' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColors[i % 5], marginTop: '5px', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: '0.8rem', color: '#374151', fontWeight: '500', lineHeight: 1.4 }}>{a.message}</div>
                          <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '2px' }}>{a.time}</div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: '#9CA3AF', fontSize: '0.85rem' }}>No recent activity</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── OTHER TABS ── */}
          {tab === 'venues' && !showAddForm && (
            <PartnerVenues data={data} onAddClick={() => setShowAddForm(true)} onTabChange={switchTab} onRefresh={fetchDashboard} />
          )}
          {showAddForm && (
            <AddVenueForm onCancel={() => setShowAddForm(false)} onComplete={() => { setShowAddForm(false); fetchDashboard(); }} />
          )}
          {tab === 'bookings' && !showCreateBooking && (
            <PartnerBookings data={data} onCreateClick={() => setShowCreateBooking(true)} token={token} />
          )}
          {showCreateBooking && (
            <CreateBooking turfs={data?.turfs} onCancel={() => setShowCreateBooking(false)} onComplete={() => { setShowCreateBooking(false); fetchDashboard(); }} />
          )}
          {tab === 'wallet'   && <PartnerWallet   data={data} />}
          {tab === 'pricing'  && <PartnerPricing  data={data} />}
          {tab === 'payouts'  && <PartnerPayouts  data={data} />}
          {tab === 'earnings' && <PartnerEarnings data={data} />}
          {tab === 'slots'    && <PartnerSlots    data={data} token={token} onChange={fetchDashboard} />}
          {tab === 'reviews'  && <PartnerReviews  data={data} />}
          {tab === 'settings' && <PartnerSettings user={user} data={data} initialSection={settingsSection} />}
          {tab === 'offers'   && <PartnerOffers   data={data} token={token} onChange={fetchDashboard} />}
          {tab === 'support'  && <PartnerSupport  data={data} />}
          {tab === 'profile'  && <PartnerProfile  user={user} data={data} onTabChange={switchTab} />}
          {tab === 'logout'   && (
            <PartnerLogout onCancel={() => setTab('dashboard')} onLogout={() => { logout(); navigate('/'); }} data={data} />
          )}

        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
      `}</style>
    </div>
  );
}
