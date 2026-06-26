import {
  Download, Filter,
  ChevronLeft, ChevronRight, Wallet, Clock,
  TrendingUp, Calendar, Building2
} from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_URL as API } from '../../config/api';

export default function PartnerPayouts({ data }) {
  const { token } = useAuth();
  const [dateFilter, setDateFilter]     = useState('All Dates');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [methodFilter, setMethodFilter] = useState('All Payout Methods');
  const [page, setPage]                 = useState(1);
  const PER_PAGE = 8;

  const confirmedBookings = data?.bookings?.filter(b => b.status === 'confirmed') || [];
  const totalEarnings = confirmedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
  const today = new Date();
  const monthLabel = today.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const weeklyGroups = confirmedBookings.reduce((groups, booking) => {
    const bookingDate = new Date(booking.date);
    const weekStart = new Date(bookingDate);
    weekStart.setDate(bookingDate.getDate() - bookingDate.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const key = weekStart.toISOString().split('T')[0];
    groups[key] = groups[key] || { date: weekStart, amount: 0, count: 0 };
    groups[key].amount += Math.round((booking.total_price || 0) * 0.95);
    groups[key].count += 1;
    return groups;
  }, {});

  const payouts = Object.values(weeklyGroups)
    .sort((a, b) => b.date - a.date)
    .map((group, index) => {
      const payoutDate = new Date(group.date);
      payoutDate.setDate(payoutDate.getDate() + 5);
      const status = payoutDate <= today ? 'Completed' : 'Processing';
      return {
        id: `PAYOUT-${group.date.toISOString().slice(0, 10).replace(/-/g, '')}`,
        date: payoutDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: '10:00 AM',
        amount: group.amount,
        method: 'Bank Transfer',
        bank: 'Settlement account',
        status,
        ref: status === 'Completed' ? `SETTLED-${index + 1}-${group.count}` : 'Awaiting settlement',
      };
    });

  // Apply filters to payouts
  const filteredPayouts = payouts.filter(p => {
    const matchStatus = statusFilter === 'All Status' || p.status === statusFilter;
    const matchMethod = methodFilter === 'All Payout Methods' || p.method === methodFilter;
    let matchDate = true;
    if (dateFilter === 'This Week') {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      matchDate = new Date(p.date) >= weekAgo;
    } else if (dateFilter === 'This Month') {
      const d = new Date(p.date);
      matchDate = d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    } else if (dateFilter === 'Last Month') {
      const d = new Date(p.date);
      const lastMonth = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
      matchDate = d.getMonth() === lastMonth;
    }
    return matchStatus && matchMethod && matchDate;
  });

  const totalPages = Math.max(1, Math.ceil(filteredPayouts.length / PER_PAGE));
  const pagedPayouts = filteredPayouts.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const totalPayouts = payouts.filter(p => p.status === 'Completed').reduce((sum, p) => sum + p.amount, 0);
  const pendingPayouts = payouts.filter(p => p.status !== 'Completed').reduce((sum, p) => sum + p.amount, 0);
  const thisMonth = confirmedBookings
    .filter(b => {
      const d = new Date(b.date);
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    })
    .reduce((sum, b) => sum + Math.round((b.total_price || 0) * 0.95), 0);

  const stats = [
    { label: 'Total Earnings', value: `Rs.${totalEarnings.toLocaleString()}`, icon: <TrendingUp size={22} />, color: '#CEF17B', sub: 'All Time' },
    { label: 'Total Payouts', value: `Rs.${totalPayouts.toLocaleString()}`, icon: <Wallet size={22} />, color: '#3b82f6', sub: 'Settled' },
    { label: 'Pending Payouts', value: `Rs.${pendingPayouts.toLocaleString()}`, icon: <Clock size={22} />, color: '#f59e0b', sub: 'Will be paid soon' },
    { label: 'This Month', value: `Rs.${thisMonth.toLocaleString()}`, icon: <Calendar size={22} />, color: '#8b5cf6', sub: monthLabel },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#161616', marginBottom: '8px' }}>Payouts</h2>
          <p style={{ color: '#98A2B3', fontWeight: '500' }}>Estimated weekly settlements from confirmed bookings</p>
        </div>
        <button
          onClick={async () => {
            try {
              const res = await axios.get(`${API}/exports/payouts/csv`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
              });
              const url = window.URL.createObjectURL(new Blob([res.data]));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `payouts-${Date.now()}.csv`);
              document.body.appendChild(link);
              link.click();
              link.remove();
              window.URL.revokeObjectURL(url);
            } catch { alert('Download failed. Please try again.'); }
          }}
          style={btnPrimary}
        >
          <Download size={18} /> Download Statement
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {stats.map((s, i) => (
          <div key={i} style={statCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${s.color}10`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#98A2B3', marginBottom: '4px' }}>{s.label}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#161616' }}>{s.value}</div>
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: '24px', border: '1.5px solid #EEF2E6', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1.5px solid #EEF2E6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <div style={{ display: 'flex', gap: '1rem' }}>
              <select value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1); }} style={filterSelect}>
                <option>All Dates</option>
                <option>This Week</option>
                <option>This Month</option>
                <option>Last Month</option>
              </select>
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={filterSelect}>
                <option>All Status</option>
                <option>Completed</option>
                <option>Processing</option>
              </select>
              <select value={methodFilter} onChange={e => { setMethodFilter(e.target.value); setPage(1); }} style={filterSelect}>
                <option>All Payout Methods</option>
                <option>Bank Transfer</option>
              </select>
           </div>
           <button
             onClick={() => { setDateFilter('All Dates'); setStatusFilter('All Status'); setMethodFilter('All Payout Methods'); setPage(1); }}
             style={filterBtn}
           >
             <Filter size={18} /> Clear Filters
           </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#F8FAF7', borderBottom: '1.5px solid #EEF2E6' }}>
            <tr>
              <th style={thStyle}>Payout ID</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>Payout Method</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Reference ID</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pagedPayouts.length > 0 ? pagedPayouts.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #EEF2E6' }}>
                <td style={tdStyle}><div style={{ fontWeight: '800', fontSize: '0.85rem' }}>{p.id}</div></td>
                <td style={tdStyle}>
                  <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{p.date}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{p.time}</div>
                </td>
                <td style={tdStyle}><div style={{ fontWeight: '800', fontSize: '0.9rem' }}>Rs.{p.amount.toLocaleString()}</div></td>
                <td style={tdStyle}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Building2 size={18} color="#98A2B3" />
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{p.method}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{p.bank}</div>
                      </div>
                   </div>
                </td>
                <td style={tdStyle}>
                  <span style={{
                    padding: '4px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '800',
                    background: p.status === 'Completed' ? '#DCEFB8' : '#fff7ed',
                    color: p.status === 'Completed' ? '#CEF17B' : '#f59e0b'
                  }}>{p.status.toUpperCase()}</span>
                </td>
                <td style={tdStyle}><div style={{ fontWeight: '600', fontSize: '0.8rem', color: '#98A2B3' }}>{p.ref}</div></td>
                <td style={tdStyle}><Download size={18} style={{ cursor: 'pointer', color: '#94a3b8' }} /></td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', fontWeight: '700' }}>No payouts yet</td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={{ padding: '1.2rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAF7' }}>
           <div style={{ fontSize: '0.8rem', color: '#98A2B3', fontWeight: '600' }}>
             Showing {filteredPayouts.length} payout{filteredPayouts.length === 1 ? '' : 's'}
           </div>
           <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ ...pageBtn, opacity: page === 1 ? 0.4 : 1 }}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{ ...pageBtn, background: page === p ? '#CEF17B' : 'white', color: page === p ? '#084734' : '#374151', border: page === p ? 'none' : '1.5px solid #EEF2E6', fontWeight: page === p ? '900' : '700' }}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ ...pageBtn, opacity: page === totalPages ? 0.4 : 1 }}
              >
                <ChevronRight size={16} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

const statCard = { background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1.5px solid #EEF2E6' };
const btnPrimary = { background: '#CEF17B', color: '#084734', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '800', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(30,190,116,0.2)' };
const filterSelect = { padding: '10px 15px', borderRadius: '12px', border: '1.5px solid #EEF2E6', fontSize: '0.85rem', fontWeight: '600', color: '#161616', outline: 'none', background: 'white' };
const filterBtn = { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', borderRadius: '12px', border: '1.5px solid #EEF2E6', fontSize: '0.85rem', fontWeight: '600', color: '#98A2B3', cursor: 'pointer', background: 'white' };
const thStyle = { textAlign: 'left', padding: '1.2rem', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' };
const tdStyle = { padding: '1.2rem', verticalAlign: 'middle' };
const pageBtn = { width: '32px', height: '32px', borderRadius: '8px', border: '1.5px solid #EEF2E6', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' };
