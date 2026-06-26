import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Search, Download, ChevronLeft, ChevronRight,
  Clock, IndianRupee,
  Calendar as CalIcon, Filter, X,
} from 'lucide-react';

import { API_URL as API } from '../../config/api';
const GREEN = '#084734';
const LIME  = '#CEF17B';

export default function PartnerBookings({ data, token }) {
  const [activeTab, setActiveTab]   = useState('All Bookings');
  const [search, setSearch]         = useState('');
  const [venueFilter, setVenue]     = useState('All Venues');
  const [sportFilter, setSport]     = useState('All Sports');
  const [dateFilter, setDate]       = useState('All Dates');
  const [cancellingId, setCancelling] = useState(null);
  const [notice, setNotice]         = useState(null);
  const [page, setPage]             = useState(1);
  const [exporting, setExporting]   = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const stripRef = useRef(null);

  // Calendar month picker dropdown
  const [calYear, setCalYear]     = useState(new Date().getFullYear());
  const [calMonth, setCalMonth]   = useState(new Date().getMonth());
  const [showCalDropdown, setShowCalDropdown] = useState(false);

  // Filters panel
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo]   = useState('');

  const calDropRef = useRef(null);
  const filterRef  = useRef(null);
  const PER_PAGE = 8;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (calDropRef.current && !calDropRef.current.contains(e.target)) setShowCalDropdown(false);
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilters(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await axios.get(`${API}/exports/bookings/csv`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bookings-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setNotice({ type: 'error', text: 'Failed to export CSV. Please try again.' });
    } finally {
      setExporting(false);
    }
  };

  const bookings = data?.bookings || [];
  const today    = new Date().toISOString().split('T')[0];

  const tabs = [
    { label: 'All Bookings', count: bookings.length },
    { label: 'Upcoming',     count: bookings.filter(b => b.date >= today && b.status === 'confirmed').length },
    { label: 'Today',        count: bookings.filter(b => b.date === today).length },
    { label: 'Completed',    count: bookings.filter(b => b.status === 'completed').length },
    { label: 'Cancelled',    count: bookings.filter(b => b.status === 'cancelled').length },
  ];

  const stats = [
    { label: 'Total · Lifetime',    value: bookings.length,  icon: '📅', color: '#3B82F6' },
    { label: 'Upcoming · Active',   value: tabs[1].count,    icon: '🕐', color: '#F59E0B' },
    { label: 'Today · Scheduled',   value: tabs[2].count,    icon: '📆', color: GREEN },
    { label: 'Completed · History', value: tabs[3].count,    icon: '✓',  color: '#10B981' },
    { label: 'Cancelled · Lost',    value: tabs[4].count,    icon: '✕',  color: '#EF4444' },
  ];

  /* count active extra-filters */
  const activeFilterCount = [
    filterStatus !== 'All',
    !!filterDateFrom,
    !!filterDateTo,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterStatus('All');
    setFilterDateFrom('');
    setFilterDateTo('');
    setPage(1);
  };

  /* ── filter ── */
  const filtered = bookings.filter(b => {
    if (activeTab === 'Upcoming')  return b.date >= today && b.status === 'confirmed';
    if (activeTab === 'Today')     return b.date === today;
    if (activeTab === 'Completed') return b.status === 'completed';
    if (activeTab === 'Cancelled') return b.status === 'cancelled';
    return true;
  }).filter(b => {
    const q = search.toLowerCase();
    if (q && !(
      (b.user_id?.name || '').toLowerCase().includes(q) ||
      (b.user_id?.phone || '').includes(q) ||
      b._id.toLowerCase().includes(q)
    )) return false;
    if (venueFilter !== 'All Venues' && (b.turf_id?.name || '') !== venueFilter) return false;
    if (sportFilter !== 'All Sports' && (b.turf_id?.sport || '').toLowerCase() !== sportFilter.toLowerCase()) return false;

    /* Quick date-select filter */
    if (dateFilter === 'Today' && b.date !== today) return false;
    if (dateFilter === 'This Week') {
      const d  = new Date();
      const sun = new Date(d.setDate(d.getDate() - d.getDay()));
      const sat = new Date(sun); sat.setDate(sat.getDate() + 6);
      const bDate = new Date(b.date);
      if (bDate < sun || bDate > sat) return false;
    }
    if (dateFilter === 'This Month') {
      const now = new Date();
      const bd  = new Date(b.date);
      if (bd.getMonth() !== now.getMonth() || bd.getFullYear() !== now.getFullYear()) return false;
    }

    /* Horizontal strip date selection */
    if (selectedDate && b.date !== selectedDate) return false;

    /* Extra filters panel */
    if (filterStatus !== 'All' && (b.status || '').toLowerCase() !== filterStatus.toLowerCase()) return false;
    if (filterDateFrom && b.date < filterDateFrom) return false;
    if (filterDateTo   && b.date > filterDateTo)   return false;

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged      = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    setCancelling(id);
    try {
      await axios.put(`${API}/owner/bookings/cancel/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotice({ type: 'success', text: 'Booking cancelled.' });
    } catch (err) {
      setNotice({ type: 'error', text: err.response?.data?.msg || 'Failed to cancel.' });
    } finally {
      setCancelling(null);
    }
  };

  const handleCheckin = async (id) => {
    if (!window.confirm('Mark this booking as checked-in? This will release the payment to your wallet.')) return;
    try {
      await axios.post(`${API}/bookings/checkin/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotice({ type: 'success', text: 'Check-in successful. Wallet updated.' });
    } catch (err) {
      setNotice({ type: 'error', text: err.response?.data?.msg || 'Failed to check in.' });
    }
  };

  /* ── upcoming summary (right panel) ── */
  const upcoming      = bookings.filter(b => b.date >= today && b.status === 'confirmed');
  const upcomingRev   = upcoming.reduce((s, b) => s + (b.total_price || 0), 0);
  const upcomingHours = upcoming.length;

  /* ── date strip helpers ── */
  const toKey = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const keyToDate = (key) => {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const STRIP_BEFORE = 7;
  const STRIP_AFTER  = 53;
  const dateList = Array.from({ length: STRIP_BEFORE + STRIP_AFTER + 1 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - STRIP_BEFORE + i);
    return d;
  });

  const bookedDateSet = new Set(
    bookings.filter(b => b.status !== 'cancelled' && b.date).map(b => b.date)
  );

  const scrollStrip = (dir) => {
    stripRef.current?.scrollBy({ left: dir * 168, behavior: 'smooth' });
  };

  const jumpToToday = () => {
    setSelectedDate(today);
    setPage(1);
    requestAnimationFrame(() => {
      stripRef.current
        ?.querySelector('[data-today="true"]')
        ?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
  };

  /* ── calendar month-picker helpers ── */
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const calLabel = `${MONTHS[calMonth]} ${calYear}`;

  const prevCalMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextCalMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  /* days in selected month for mini-grid */
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDOW    = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
  const calCells    = Array.from({ length: firstDOW + daysInMonth }, (_, i) => {
    if (i < firstDOW) return null;
    return i - firstDOW + 1;
  });
  const makeCalKey = (day) => `${calYear}-${String(calMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;

  /* ── venue / sport names for filters ── */
  const venueNames = [...new Set(bookings.map(b => b.turf_id?.name).filter(Boolean))];
  const sportNames = [...new Set(bookings.map(b => b.turf_id?.sport).filter(Boolean))];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem', animation: 'fadeIn 0.4s ease-out' }}>

      {/* ══════════ LEFT ══════════ */}
      <div>

        {/* TABS + EXPORT */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid #E9EDE8' }}>
            {tabs.map(t => (
              <button
                key={t.label}
                onClick={() => { setActiveTab(t.label); setPage(1); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '10px 16px', fontWeight: '700', fontSize: '0.85rem',
                  color: activeTab === t.label ? GREEN : '#9CA3AF',
                  borderBottom: activeTab === t.label ? `3px solid ${GREEN}` : '3px solid transparent',
                  marginBottom: '-2px', display: 'flex', alignItems: 'center', gap: '6px',
                  whiteSpace: 'nowrap',
                }}
              >
                {t.label}
                <span style={{
                  background: activeTab === t.label ? GREEN : '#F3F4F6',
                  color: activeTab === t.label ? LIME : '#9CA3AF',
                  fontSize: '0.7rem', fontWeight: '800',
                  padding: '1px 7px', borderRadius: '20px',
                }}>{t.count}</span>
              </button>
            ))}
          </div>
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            style={{ ...btnOutline, gap: '6px', opacity: exporting ? 0.7 : 1 }}
          >
            <Download size={15} /> {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>

        {/* STATS ROW */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              background: '#fff', borderRadius: '14px',
              border: '1.5px solid #E9EDE8', padding: '1rem',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: `${s.color}15`, color: s.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', flexShrink: 0,
              }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#0D1F0F', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.65rem', color: '#9CA3AF', fontWeight: '600', marginTop: '3px' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* NOTICE */}
        {notice && (
          <div style={{
            marginBottom: '1rem', padding: '12px 16px', borderRadius: '10px',
            background: notice.type === 'success' ? '#D1FAE5' : '#FEE2E2',
            color: notice.type === 'success' ? '#065F46' : '#991B1B',
            fontWeight: '700', fontSize: '0.88rem',
          }}>
            {notice.text}
          </div>
        )}

        {/* SEARCH + FILTERS */}
        <div style={{
          background: '#fff', borderRadius: '14px', border: '1.5px solid #E9EDE8',
          padding: '1rem', display: 'flex', gap: '10px', marginBottom: '1.2rem', flexWrap: 'wrap',
          position: 'relative',
        }}>
          <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
            <input
              type="text"
              placeholder="Search by booking ID, customer name..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{
                width: '100%', padding: '9px 12px 9px 36px', borderRadius: '10px',
                border: '1.5px solid #E9EDE8', fontSize: '0.85rem', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <select value={venueFilter} onChange={e => { setVenue(e.target.value); setPage(1); }} style={filterSelect}>
            <option>All Venues</option>
            {venueNames.map(v => <option key={v}>{v}</option>)}
          </select>
          <select value={sportFilter} onChange={e => { setSport(e.target.value); setPage(1); }} style={filterSelect}>
            <option>All Sports</option>
            {sportNames.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={dateFilter} onChange={e => { setDate(e.target.value); setPage(1); }} style={filterSelect}>
            <option>All Dates</option>
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>

          {/* MORE FILTERS button */}
          <div ref={filterRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowFilters(v => !v)}
              style={{
                ...btnOutline,
                padding: '9px 14px', fontSize: '0.82rem', gap: '6px',
                background: showFilters || activeFilterCount > 0 ? GREEN : '#fff',
                color: showFilters || activeFilterCount > 0 ? LIME : '#374151',
                border: `1.5px solid ${showFilters || activeFilterCount > 0 ? GREEN : '#E9EDE8'}`,
              }}
            >
              <Filter size={14} />
              Filters
              {activeFilterCount > 0 && (
                <span style={{
                  background: LIME, color: GREEN,
                  fontSize: '0.65rem', fontWeight: '900',
                  padding: '1px 6px', borderRadius: '20px', marginLeft: '2px',
                }}>{activeFilterCount}</span>
              )}
            </button>

            {/* FILTERS PANEL DROPDOWN */}
            {showFilters && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: '#fff', border: '1.5px solid #E9EDE8',
                borderRadius: '14px', boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                padding: '1.2rem', zIndex: 200, width: '300px',
                animation: 'fadeIn 0.15s ease-out',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0D1F0F', margin: 0 }}>More Filters</h4>
                  <button onClick={() => setShowFilters(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: '2px' }}>
                    <X size={16} />
                  </button>
                </div>

                {/* Status filter */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                    Booking Status
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {['All', 'confirmed', 'pending', 'completed', 'cancelled', 'checked-in'].map(s => (
                      <button
                        key={s}
                        onClick={() => { setFilterStatus(s); setPage(1); }}
                        style={{
                          padding: '5px 12px', borderRadius: '20px', border: '1.5px solid',
                          borderColor: filterStatus === s ? GREEN : '#E9EDE8',
                          background: filterStatus === s ? GREEN : '#fff',
                          color: filterStatus === s ? LIME : '#374151',
                          fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer',
                          textTransform: 'capitalize',
                        }}
                      >
                        {s === 'All' ? 'All Statuses' : s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date range */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
                    Date Range
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="date"
                      value={filterDateFrom}
                      onChange={e => { setFilterDateFrom(e.target.value); setPage(1); }}
                      style={{ ...filterSelect, flex: 1, fontSize: '0.78rem', padding: '7px 10px' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: '600', flexShrink: 0 }}>to</span>
                    <input
                      type="date"
                      value={filterDateTo}
                      onChange={e => { setFilterDateTo(e.target.value); setPage(1); }}
                      style={{ ...filterSelect, flex: 1, fontSize: '0.78rem', padding: '7px 10px' }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', paddingTop: '0.5rem', borderTop: '1px solid #F3F4F6' }}>
                  <button
                    onClick={clearFilters}
                    style={{ ...btnOutline, flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '8px' }}
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    style={{
                      flex: 1, background: GREEN, color: LIME,
                      border: 'none', borderRadius: '10px',
                      fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', padding: '8px',
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TABLE */}
        <div style={{ background: '#fff', borderRadius: '14px', border: '1.5px solid #E9EDE8', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1.5px solid #E9EDE8' }}>
                {['Booking ID','Customer','Mobile','Venue','Date','Time','Price','Status','Actions'].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length > 0 ? paged.map((b, i) => (
                <BookingRow
                  key={b._id}
                  b={b}
                  today={today}
                  onCancel={handleCancel}
                  onCheckin={handleCheckin}
                  cancelling={cancellingId === b._id}
                  isLast={i === paged.length - 1}
                />
              )) : (
                <tr>
                  <td colSpan="9" style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF', fontWeight: '600' }}>
                    No bookings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* PAGINATION */}
          <div style={{
            padding: '1rem 1.2rem', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', background: '#F9FAFB', borderTop: '1px solid #E9EDE8',
          }}>
            <span style={{ fontSize: '0.8rem', color: '#9CA3AF', fontWeight: '600' }}>
              Showing {filtered.length} of {bookings.length} bookings
            </span>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} style={pageBtn} disabled={page === 1}>
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{ ...pageBtn, background: page === p ? GREEN : '#fff', color: page === p ? LIME : '#374151', borderColor: page === p ? GREEN : '#E9EDE8' }}
                >
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} style={pageBtn} disabled={page === totalPages}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════ RIGHT SIDEBAR ══════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

        {/* BOOKING CALENDAR */}
        <div style={sideCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem' }}>
            <h3 style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0D1F0F', margin: 0 }}>Booking Calendar</h3>
            <button
              onClick={jumpToToday}
              style={{ background: 'none', border: 'none', color: GREEN, fontWeight: '800', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}
            >
              Today
            </button>
          </div>

          {/* Selected date readout */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
            <span style={{ fontWeight: '800', fontSize: '0.85rem', color: '#0D1F0F' }}>
              {selectedDate
                ? keyToDate(selectedDate).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
                : 'All Dates'}
            </span>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                style={{ background: 'none', border: 'none', color: '#9CA3AF', fontWeight: '700', fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}
              >
                Clear ✕
              </button>
            )}
          </div>

          {/* ── Month/Year Dropdown Header ── */}
          <div ref={calDropRef} style={{ position: 'relative', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={prevCalMonth}
                style={{ ...calNavBtn, width: '26px', height: '26px' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
              >
                <ChevronLeft size={13} />
              </button>

              <button
                onClick={() => setShowCalDropdown(v => !v)}
                style={{
                  background: showCalDropdown ? GREEN : '#F9FAFB',
                  color: showCalDropdown ? LIME : '#0D1F0F',
                  border: `1.5px solid ${showCalDropdown ? GREEN : '#E9EDE8'}`,
                  borderRadius: '8px', padding: '4px 12px',
                  fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '5px',
                }}
              >
                <CalIcon size={12} />
                {calLabel}
              </button>

              <button
                onClick={nextCalMonth}
                style={{ ...calNavBtn, width: '26px', height: '26px' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
              >
                <ChevronRight size={13} />
              </button>
            </div>

            {/* Month/Year dropdown panel */}
            {showCalDropdown && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: '50%',
                transform: 'translateX(-50%)',
                background: '#fff', border: '1.5px solid #E9EDE8',
                borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                padding: '12px', zIndex: 300, width: '240px',
                animation: 'fadeIn 0.15s ease-out',
              }}>
                {/* Year selector */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <button
                    onClick={() => setCalYear(y => y - 1)}
                    style={{ ...calNavBtn, width: '26px', height: '26px' }}
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#0D1F0F' }}>{calYear}</span>
                  <button
                    onClick={() => setCalYear(y => y + 1)}
                    style={{ ...calNavBtn, width: '26px', height: '26px' }}
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>

                {/* Month grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '4px' }}>
                  {MONTHS.map((m, i) => (
                    <button
                      key={m}
                      onClick={() => { setCalMonth(i); setShowCalDropdown(false); }}
                      style={{
                        padding: '6px 4px', borderRadius: '8px',
                        border: '1.5px solid',
                        borderColor: calMonth === i ? GREEN : '#E9EDE8',
                        background: calMonth === i ? GREEN : '#fff',
                        color: calMonth === i ? LIME : '#374151',
                        fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer',
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {/* Mini calendar grid for selected month */}
                <div style={{ marginTop: '10px', borderTop: '1px solid #F3F4F6', paddingTop: '10px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px', marginBottom: '4px' }}>
                    {['S','M','T','W','T','F','S'].map((d, i) => (
                      <div key={i} style={{ textAlign: 'center', fontSize: '0.6rem', fontWeight: '700', color: '#9CA3AF' }}>{d}</div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px' }}>
                    {calCells.map((day, i) => {
                      if (!day) return <div key={i} />;
                      const key = makeCalKey(day);
                      const isSel = key === selectedDate;
                      const hasB  = bookedDateSet.has(key);
                      const isTod = key === today;
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            setSelectedDate(isSel ? null : key);
                            setPage(1);
                            setShowCalDropdown(false);
                          }}
                          style={{
                            padding: '3px 0', borderRadius: '6px',
                            border: `1.5px solid ${isSel ? GREEN : isTod ? LIME : 'transparent'}`,
                            background: isSel ? GREEN : 'transparent',
                            color: isSel ? LIME : isTod ? GREEN : '#374151',
                            fontSize: '0.68rem', fontWeight: isTod || isSel ? '800' : '600',
                            cursor: 'pointer', position: 'relative',
                            textAlign: 'center',
                          }}
                        >
                          {day}
                          {hasB && (
                            <div style={{
                              width: '3px', height: '3px', borderRadius: '50%',
                              background: isSel ? LIME : GREEN,
                              margin: '0 auto',
                            }} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Horizontal scrollable date strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              style={calNavBtn}
              onClick={() => scrollStrip(-1)}
              onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = '#E9EDE8'; }}
            >
              <ChevronLeft size={14} />
            </button>

            <div
              ref={stripRef}
              style={{
                display: 'flex', gap: '6px', overflowX: 'auto', scrollBehavior: 'smooth',
                padding: '2px 2px 6px', flex: 1, scrollSnapType: 'x mandatory',
                scrollbarWidth: 'none',
              }}
            >
              {dateList.map((d) => {
                const key        = toKey(d);
                const isToday    = key === today;
                const isSel      = key === selectedDate;
                const hasBooking = bookedDateSet.has(key);
                return (
                  <button
                    key={key}
                    data-today={isToday}
                    onClick={() => { setSelectedDate(isSel ? null : key); setPage(1); }}
                    style={{
                      flexShrink: 0, scrollSnapAlign: 'start',
                      width: '42px', padding: '7px 0 6px', borderRadius: '10px',
                      border: isSel ? `1.5px solid ${GREEN}` : isToday ? '1.5px solid #CEF17B' : '1.5px solid #E9EDE8',
                      background: isSel ? GREEN : '#fff',
                      cursor: 'pointer', textAlign: 'center', position: 'relative',
                    }}
                  >
                    <div style={{
                      fontSize: '0.6rem', fontWeight: '700',
                      color: isSel ? 'rgba(255,255,255,0.7)' : '#9CA3AF',
                    }}>
                      {d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}
                    </div>
                    <div style={{
                      fontSize: '0.95rem', fontWeight: '900', marginTop: '2px',
                      color: isSel ? LIME : isToday ? GREEN : '#111827',
                    }}>
                      {d.getDate()}
                    </div>
                    {hasBooking && (
                      <div style={{
                        width: '4px', height: '4px', borderRadius: '50%', margin: '3px auto 0',
                        background: isSel ? LIME : '#084734',
                      }} />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              style={calNavBtn}
              onClick={() => scrollStrip(1)}
              onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.borderColor = '#D1D5DB'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = '#E9EDE8'; }}
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '10px', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: '#9CA3AF' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '3px', border: '1.5px solid #CEF17B' }} />
              Today
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: '#9CA3AF' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#084734' }} />
              Has bookings
            </div>
          </div>
        </div>

        {/* UPCOMING SUMMARY */}
        <div style={sideCard}>
          <h3 style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0D1F0F', marginBottom: '1.2rem' }}>Upcoming Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <SummaryRow icon={<CalIcon size={15} />}      label="Total Bookings"     value={upcoming.length.toString()} />
            <SummaryRow icon={<IndianRupee size={15} />}  label="Total Revenue"      value={`₹${upcomingRev.toLocaleString()}`} highlight />
            <SummaryRow icon={<Clock size={15} />}        label="Total Hours Booked" value={`${upcomingHours}h`} />
          </div>
          <button
            onClick={() => {
              setActiveTab('All Bookings');
              setPage(1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            style={{ width: '100%', marginTop: '1.2rem', padding: '10px', borderRadius: '10px', border: '1.5px solid #E9EDE8', background: '#fff', color: GREEN, fontWeight: '800', fontSize: '0.82rem', cursor: 'pointer' }}
          >
            View All Bookings →
          </button>
        </div>

        {/* DID YOU KNOW */}
        <div style={{ ...sideCard, background: GREEN, border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <span>💡</span>
            <h4 style={{ fontWeight: '800', fontSize: '0.85rem', color: LIME, margin: 0 }}>Did you know?</h4>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, margin: 0 }}>
            You have <strong style={{ color: LIME }}>{tabs[2].count} booking{tabs[2].count !== 1 ? 's' : ''}</strong> scheduled for today.
          </p>
          <button
            onClick={() => setActiveTab('Today')}
            style={{ background: 'none', border: 'none', color: LIME, fontWeight: '700', fontSize: '0.78rem', cursor: 'pointer', padding: 0, marginTop: '8px', textDecoration: 'underline' }}
          >
            View today's schedule →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   BOOKING ROW
───────────────────────────────────────────── */
function BookingRow({ b, today, onCancel, onCheckin, cancelling, isLast }) {
  const statusMap = {
    confirmed:    { bg: '#D1FAE5', color: '#065F46', label: 'TODAY' },
    pending:      { bg: '#FEF3C7', color: '#92400E', label: 'PENDING' },
    completed:    { bg: '#F3F4F6', color: '#6B7280', label: 'COMPLETED' },
    cancelled:    { bg: '#FEE2E2', color: '#DC2626', label: 'CANCELLED' },
    'checked-in': { bg: '#DBEAFE', color: '#1D4ED8', label: 'CHECKED IN' },
  };

  const s       = b.status?.toLowerCase();
  const isToday = b.date === today && s === 'confirmed';
  const badge   = isToday
    ? { bg: '#D1FAE5', color: '#065F46', label: 'TODAY' }
    : statusMap[s] || statusMap['pending'];

  const dateStr = b.date
    ? new Date(b.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  const timeStr = Array.isArray(b.time_slots) ? b.time_slots[0] : (b.time_slot || '—');

  const initials = (b.user_id?.name || 'U')
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const avatarColors = ['#DBEAFE:#1D4ED8', '#D1FAE5:#065F46', '#FEF3C7:#92400E', '#EDE9FE:#5B21B6', '#FCE7F3:#9D174D'];
  const [abg, afg] = avatarColors[initials.charCodeAt(0) % avatarColors.length].split(':');

  return (
    <tr style={{ borderBottom: isLast ? 'none' : '1px solid #F3F4F6' }}>
      <td style={tdStyle}>
        <span style={{
          fontFamily: 'monospace', fontWeight: '800', fontSize: '0.82rem',
          color: '#084734', background: '#F0FDF4',
          padding: '3px 8px', borderRadius: '6px',
        }}>
          #TFX-{b._id.slice(-4).toUpperCase()}
        </span>
      </td>

      <td style={tdStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: abg, color: afg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.72rem', fontWeight: '800', flexShrink: 0,
          }}>{initials}</div>
          <span style={{ fontWeight: '700', fontSize: '0.85rem', color: '#111827' }}>
            {b.user_id?.name || 'Unknown'}
          </span>
        </div>
      </td>

      <td style={tdStyle}>
        <span style={{ fontWeight: '600', fontSize: '0.82rem', color: '#374151' }}>
          {b.user_id?.phone
            ? b.user_id.phone.replace('+91', '').replace(/(\d{5})(\d{5})/, '$1 $2')
            : '—'}
        </span>
      </td>

      <td style={tdStyle}>
        <div style={{ fontWeight: '700', fontSize: '0.82rem', color: '#111827' }}>
          {b.turf_id?.name || '—'}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '2px', textTransform: 'capitalize' }}>
          {b.turf_id?.sport || ''}
        </div>
      </td>

      <td style={tdStyle}>
        <span style={{ fontWeight: '700', fontSize: '0.82rem', color: '#111827' }}>{dateStr}</span>
      </td>

      <td style={tdStyle}>
        <span style={{ fontWeight: '600', fontSize: '0.82rem', color: '#374151' }}>{timeStr}</span>
      </td>

      <td style={tdStyle}>
        <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#111827' }}>
          ₹{(b.total_price || 0).toLocaleString()}
        </span>
      </td>

      <td style={tdStyle}>
        <span style={{
          background: badge.bg, color: badge.color,
          fontSize: '0.68rem', fontWeight: '800',
          padding: '4px 10px', borderRadius: '6px',
          letterSpacing: '0.5px',
        }}>
          {badge.label}
        </span>
      </td>

      <td style={tdStyle}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {s === 'confirmed' && (
            <>
              <button
                onClick={() => onCheckin(b._id)}
                style={{
                  background: '#D1FAE5', color: '#065F46',
                  border: 'none', padding: '5px 10px', borderRadius: '7px',
                  fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer',
                }}
              >
                ✓ Check-in
              </button>
              <button
                onClick={() => onCancel(b._id)}
                disabled={cancelling}
                style={{
                  background: '#FEE2E2', color: '#DC2626',
                  border: 'none', padding: '5px 10px', borderRadius: '7px',
                  fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer',
                }}
              >
                {cancelling ? '...' : 'Cancel'}
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ─────────────────────────────────────────────
   SUMMARY ROW (right panel)
───────────────────────────────────────────── */
function SummaryRow({ icon, label, value, highlight }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{
        width: '34px', height: '34px', borderRadius: '8px',
        background: '#F3F4F6', color: '#6B7280',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.68rem', fontWeight: '600', color: '#9CA3AF' }}>{label}</div>
        <div style={{ fontSize: '0.95rem', fontWeight: '800', color: highlight ? '#084734' : '#0D1F0F' }}>{value}</div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SHARED STYLES
───────────────────────────────────────────── */
const thStyle = {
  textAlign: 'left', padding: '12px 14px',
  fontSize: '0.72rem', fontWeight: '700',
  color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px',
};

const tdStyle = {
  padding: '12px 14px', verticalAlign: 'middle',
};

const btnOutline = {
  background: '#fff', color: '#374151',
  border: '1.5px solid #E9EDE8',
  padding: '9px 16px', borderRadius: '10px',
  fontWeight: '700', fontSize: '0.85rem',
  display: 'flex', alignItems: 'center',
  cursor: 'pointer',
};

const filterSelect = {
  padding: '9px 12px', borderRadius: '10px',
  border: '1.5px solid #E9EDE8', fontSize: '0.85rem',
  fontWeight: '600', color: '#374151', outline: 'none',
  background: '#fff', cursor: 'pointer',
};

const pageBtn = {
  width: '30px', height: '30px', borderRadius: '8px',
  border: '1.5px solid #E9EDE8', background: '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', color: '#374151',
};

const sideCard = {
  background: '#fff', padding: '1.2rem',
  borderRadius: '14px', border: '1.5px solid #E9EDE8',
};

const calNavBtn = {
  background: 'none', border: '1.5px solid #E9EDE8',
  borderRadius: '8px', width: '28px', height: '28px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: '#374151', transition: 'all 0.15s',
};