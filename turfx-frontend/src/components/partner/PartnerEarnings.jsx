import { TrendingUp, ArrowUpRight, Calendar, Filter, Download, ArrowDownRight, Users, CreditCard } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { API_URL as API } from '../../config/api';

export default function PartnerEarnings({ data }) {
  const { token } = useAuth();
  const bookings = data?.bookings || [];
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
  const avgBookingValue = confirmedBookings.length ? Math.round(totalRevenue / confirmedBookings.length) : 0;
  const totalPlayers = new Set(confirmedBookings.map(b => b.user_id?._id || b.user_id).filter(Boolean)).size;
  const platformFees = Math.round(totalRevenue * 0.05);
  const netPayout = Math.max(totalRevenue - platformFees, 0);

  const weekBuckets = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    date.setHours(0, 0, 0, 0);
    return {
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dateKey: date.toISOString().split('T')[0],
      revenue: 0,
    };
  });

  confirmedBookings.forEach(booking => {
    const bucket = weekBuckets.find(day => day.dateKey === booking.date);
    if (bucket) bucket.revenue += booking.total_price || 0;
  });

  const maxRevenue = Math.max(...weekBuckets.map(day => day.revenue), 1);
  const chartHeights = weekBuckets.map(day => Math.max((day.revenue / maxRevenue) * 100, 6));
  const cancelledValue = cancelledBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
  const breakdown = [
    { label: 'Booking Payments', value: totalRevenue, color: '#CEF17B' },
    { label: 'Platform Fees', value: platformFees, color: '#3b82f6' },
    { label: 'Cancelled Bookings', value: cancelledValue, color: '#8b5cf6' },
  ];
  const totalBreakdown = Math.max(...breakdown.map(item => item.value), 1);
  const nextPayoutDate = new Date();
  nextPayoutDate.setDate(nextPayoutDate.getDate() + ((5 - nextPayoutDate.getDay() + 7) % 7 || 7));

  const stats = [
    { label: 'Total Revenue', value: `Rs.${totalRevenue.toLocaleString()}`, change: `${confirmedBookings.length} paid`, isUp: true, icon: <TrendingUp size={22} />, color: '#CEF17B' },
    { label: 'Avg Booking Value', value: `Rs.${avgBookingValue.toLocaleString()}`, change: `${confirmedBookings.length} bookings`, isUp: true, icon: <CreditCard size={22} />, color: '#3b82f6' },
    { label: 'Total Players', value: totalPlayers.toLocaleString(), change: `${bookings.length} total`, isUp: true, icon: <Users size={22} />, color: '#8b5cf6' },
    { label: 'Platform Fees', value: `Rs.${platformFees.toLocaleString()}`, change: '5% estimate', isUp: false, icon: <ArrowDownRight size={22} />, color: '#ef4444' },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#161616', marginBottom: '8px' }}>Earnings & Analytics</h2>
          <p style={{ color: '#98A2B3', fontWeight: '500' }}>Revenue and performance from your confirmed bookings</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
           <div style={dateRange}><Calendar size={18} /> Last 7 Days</div>
           <button onClick={async () => {
             try {
               const res = await axios.get(`${API}/exports/earnings/csv`, {
                 headers: { Authorization: `Bearer ${token}` },
                 responseType: 'blob',
               });
               const url = window.URL.createObjectURL(new Blob([res.data]));
               const link = document.createElement('a');
               link.href = url;
               link.setAttribute('download', `earnings-${Date.now()}.csv`);
               document.body.appendChild(link);
               link.click();
               link.remove();
               window.URL.revokeObjectURL(url);
             } catch { alert('Export failed. Please try again.'); }
           }} style={btnPrimary}><Download size={18} /> Export Data</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {stats.map((s, i) => (
          <div key={i} style={statCard}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${s.color}10`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   {s.icon}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: s.isUp ? '#CEF17B' : '#ef4444', fontSize: '0.75rem', fontWeight: '800', background: s.isUp ? '#DCEFB8' : '#fff1f2', padding: '4px 8px', borderRadius: '6px' }}>
                   {s.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {s.change}
                </div>
             </div>
             <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#98A2B3', marginBottom: '6px' }}>{s.label}</div>
             <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#161616' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
         <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '1.5px solid #EEF2E6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
               <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Weekly Revenue Trend</h3>
               <button style={filterBtn}><Filter size={16} /> Weekly <ChevronDown size={16} /></button>
            </div>
            <div style={{ height: '250px', display: 'flex', alignItems: 'flex-end', gap: '2rem', padding: '0 1rem' }}>
               {chartHeights.map((h, i) => (
                 <div key={weekBuckets[i].dateKey} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '100%', background: '#DCEFB8', borderRadius: '10px', height: `${h}%`, position: 'relative', overflow: 'hidden' }}>
                       <div style={{ position: 'absolute', bottom: 0, width: '100%', background: '#CEF17B', height: '40%', borderRadius: '10px 10px 0 0' }}></div>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#94a3b8' }}>{weekBuckets[i].label}</span>
                 </div>
               ))}
            </div>
         </div>

         <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '1.5px solid #EEF2E6' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '2rem' }}>Revenue Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               {breakdown.map((b, i) => (
                 <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                       <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#98A2B3' }}>{b.label}</span>
                       <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#161616' }}>Rs.{b.value.toLocaleString()}</span>
                    </div>
                    <div style={{ height: '8px', background: '#EEF2E6', borderRadius: '10px', overflow: 'hidden' }}>
                       <div style={{ height: '100%', background: b.color, width: `${Math.round((b.value / totalBreakdown) * 100)}%` }}></div>
                    </div>
                 </div>
               ))}
            </div>

            <div style={{ marginTop: '2.5rem', padding: '1.5rem', borderRadius: '16px', border: '1.5px solid #EEF2E6', background: '#F8FAF7' }}>
               <h4 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '10px' }}>Payout Cycle</h4>
               <p style={{ fontSize: '0.8rem', color: '#98A2B3', fontWeight: '500', lineHeight: 1.5 }}>
                  Next estimated payout of <strong style={{ color: '#161616' }}>Rs.{netPayout.toLocaleString()}</strong> is scheduled for <strong style={{ color: '#161616' }}>{nextPayoutDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}

function ChevronDown(props) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg> }

const statCard = { background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1.5px solid #EEF2E6' };
const btnPrimary = { background: '#CEF17B', color: '#084734', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '800', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(30,190,116,0.2)' };
const filterBtn = { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', border: '1.5px solid #EEF2E6', fontSize: '0.85rem', fontWeight: '600', color: '#98A2B3', cursor: 'pointer', background: 'white' };
const dateRange = { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 18px', borderRadius: '12px', background: 'white', border: '1.5px solid #EEF2E6', fontSize: '0.9rem', fontWeight: '700', color: '#161616' };
