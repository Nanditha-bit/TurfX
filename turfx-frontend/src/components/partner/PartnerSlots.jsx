import { useEffect, useState } from 'react';
import axios from 'axios';
import { Clock, Filter, Plus, Trash2, Edit2, AlertCircle, MapPin } from 'lucide-react';

import { API_URL as API } from '../../config/api';

export default function PartnerSlots({ data, token, onChange }) {
  const [selectedTurf, setSelectedTurf] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('6:00 AM');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [editingSlot, setEditingSlot] = useState(null);

  const hasVenues = (data?.turfs?.length || 0) > 0;
  const selectedVenueId = selectedTurf || data?.turfs?.[0]?._id || null;

  const slots = (data?.slots || []).filter(slot => {
    const turfId = slot.turf_id?._id || slot.turf_id;
    return !selectedVenueId || turfId === selectedVenueId;
  });

  // Sync selectedTurf whenever data.turfs changes
  useEffect(() => {
    if (!data?.turfs?.length) {
      setSelectedTurf(null);
      return;
    }
    setSelectedTurf(prev => {
      const stillExists = data.turfs.some(t => t._id === prev);
      return stillExists ? prev : data.turfs[0]._id;
    });
  }, [data?.turfs]);

  const resetEditor = () => {
    setEditingSlot(null);
    setDate(new Date().toISOString().split('T')[0]);
    setTimeSlot('6:00 AM');
  };

  const saveSlot = async () => {
    setNotice(null);

    if (!token) {
      setNotice({ type: 'error', text: 'You are not logged in. Please log in again.' });
      return;
    }
    if (!hasVenues || !selectedVenueId) {
      setNotice({ type: 'error', text: 'You have no venues yet. Go to the Venues tab and add a venue first.' });
      return;
    }
    if (!date) {
      setNotice({ type: 'error', text: 'Please select a date.' });
      return;
    }
    if (!timeSlot) {
      setNotice({ type: 'error', text: 'Please select a time slot.' });
      return;
    }

    setSaving(true);
    try {
      if (editingSlot) {
        await axios.put(`${API}/slots/${editingSlot._id}`, { date, time_slot: timeSlot }, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API}/slots`, { turf_id: selectedVenueId, date, time_slot: timeSlot }, { headers: { Authorization: `Bearer ${token}` } });
      }
      await onChange?.();
      setNotice({ type: 'success', text: editingSlot ? 'Slot updated successfully.' : `Slot ${timeSlot} added for ${date}.` });
      setEditingSlot(null);
    } catch (err) {
      console.error(err);
      setNotice({ type: 'error', text: err.response?.data?.msg || 'Could not save slot. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (slot) => {
    if (!slot.created_by_owner || slot.is_booked) return;
    setEditingSlot(slot);
    setDate(slot.date);
    setTimeSlot(slot.time_slot);
    setNotice({ type: 'success', text: 'Edit the date or time, then save the slot.' });
  };

  const deleteSlot = async (slot) => {
    if (slot.is_booked) return;
    try {
      await axios.delete(`${API}/slots/${slot._id}`, { headers: { Authorization: `Bearer ${token}` } });
      await onChange?.();
      setNotice({ type: 'success', text: 'Slot deleted.' });
      if (editingSlot?._id === slot._id) resetEditor();
    } catch (err) {
      console.error(err);
      setNotice({ type: 'error', text: err.response?.data?.msg || 'Could not delete this slot.' });
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#161616', marginBottom: '8px' }}>Slot Management</h2>
          <p style={{ color: '#98A2B3', fontWeight: '500' }}>Create and manage time slots for your venues</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {editingSlot && (
            <button onClick={resetEditor} style={{ ...filterBtn, padding: '12px 18px' }}>Cancel Edit</button>
          )}
          <button
            onClick={saveSlot}
            disabled={saving}
            style={{ ...btnPrimary, opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            <Plus size={18} /> {saving ? 'Saving...' : editingSlot ? 'Update Slot' : 'Add New Slot'}
          </button>
        </div>
      </div>

      {notice && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '12px 16px',
          borderRadius: '12px',
          border: `1.5px solid ${notice.type === 'success' ? '#DCEFB8' : '#fecaca'}`,
          background: notice.type === 'success' ? '#DCEFB8' : '#fff1f2',
          color: notice.type === 'success' ? '#084734' : '#991b1b',
          fontWeight: '700',
          fontSize: '0.9rem'
        }}>
          {notice.text}
        </div>
      )}

      {/* NO VENUES STATE */}
      {!hasVenues && (
        <div style={{ background: 'white', borderRadius: '24px', border: '1.5px solid #EEF2E6', padding: '4rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏟️</div>
          <h3 style={{ fontWeight: '800', fontSize: '1.2rem', color: '#161616', marginBottom: '8px' }}>No venues yet</h3>
          <p style={{ color: '#98A2B3', fontWeight: '500', marginBottom: '2rem' }}>
            You need to add a venue before you can create slots.<br />Go to the <strong>Venues</strong> tab and click <strong>Add New Venue</strong>.
          </p>
        </div>
      )}

      {/* MAIN GRID — only shown when venues exist */}
      {hasVenues && (
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
        {/* TURF SELECTION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#161616', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Your Venues</h3>
           {data?.turfs?.length > 0 ? data.turfs.map(t => (
             <div 
               key={t._id} 
               onClick={() => setSelectedTurf(t._id)}
               style={{ 
                 padding: '1.2rem', borderRadius: '16px', border: '1.5px solid #EEF2E6',
                 background: selectedTurf === t._id ? '#DCEFB8' : 'white',
                 borderColor: selectedTurf === t._id ? '#CEF17B' : '#EEF2E6',
                 cursor: 'pointer', transition: '0.2s'
               }}
             >
                <div style={{ fontWeight: '800', color: selectedTurf === t._id ? '#161616' : '#98A2B3', fontSize: '0.95rem' }}>{t.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                   <MapPin size={12} /> {t.location}
                </div>
             </div>
           )) : (
             <div style={{ background: 'white', border: '1.5px solid #EEF2E6', borderRadius: '16px', padding: '1.2rem', color: '#94a3b8', fontWeight: '700' }}>
               No venues found
             </div>
           )}
        </div>

        {/* SLOTS LIST */}
        <div style={{ background: 'white', borderRadius: '24px', border: '1.5px solid #EEF2E6', overflow: 'hidden' }}>
           <div style={{ padding: '1.5rem', borderBottom: '1.5px solid #EEF2E6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                 <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding: '10px', borderRadius: '12px', border: '1.5px solid #EEF2E6', fontSize: '0.85rem', fontWeight: '600', outline: 'none' }} />
                 <select value={timeSlot} onChange={e => setTimeSlot(e.target.value)} style={{ padding: '10px', borderRadius: '12px', border: '1.5px solid #EEF2E6', fontSize: '0.85rem', fontWeight: '600', outline: 'none' }}>
                   {['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'].map(slot => <option key={slot}>{slot}</option>)}
                 </select>
              </div>
              <button style={filterBtn}><Filter size={18} /> Filters</button>
           </div>

           <div style={{ padding: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                 <thead>
                    <tr style={{ textAlign: 'left' }}>
                       <th style={thStyle}>Slot Name</th>
                       <th style={thStyle}>Time Duration</th>
                       <th style={thStyle}>Repeat</th>
                       <th style={thStyle}>Status</th>
                       <th style={thStyle}>Actions</th>
                    </tr>
                 </thead>
                 <tbody>
                    {slots.length > 0 ? slots.map(s => (
                      <tr key={s._id} style={{ borderBottom: '1px solid #EEF2E6' }}>
                         <td style={tdStyle}><div style={{ fontWeight: '800', fontSize: '0.9rem' }}>{s.turf_id?.name || 'Venue Slot'}</div></td>
                         <td style={tdStyle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#161616', fontWeight: '700', fontSize: '0.85rem' }}>
                               <Clock size={16} color="#CEF17B" /> {s.time_slot}
                            </div>
                         </td>
                         <td style={tdStyle}>
                            <span style={{ padding: '4px 10px', borderRadius: '6px', background: '#EEF2E6', fontSize: '0.75rem', fontWeight: '700', color: '#98A2B3' }}>{s.date}</span>
                         </td>
                         <td style={tdStyle}>
                            <span style={{ padding: '4px 10px', borderRadius: '6px', background: s.is_booked ? '#fff1f2' : '#DCEFB8', color: s.is_booked ? '#ef4444' : '#CEF17B', fontSize: '0.7rem', fontWeight: '900' }}>{s.is_booked ? 'BOOKED' : s.is_locked ? 'LOCKED' : 'AVAILABLE'}</span>
                         </td>
                         <td style={tdStyle}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                               <button disabled={!s.created_by_owner || s.is_booked} onClick={() => startEdit(s)} style={{ ...iconBtn, opacity: !s.created_by_owner || s.is_booked ? 0.4 : 1 }}><Edit2 size={16} /></button>
                               <button disabled={!s.created_by_owner || s.is_booked} onClick={() => deleteSlot(s)} style={{ ...iconBtn, opacity: !s.created_by_owner || s.is_booked ? 0.4 : 1 }}><Trash2 size={16} /></button>
                            </div>
                         </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" style={{ ...tdStyle, textAlign: 'center', color: '#94a3b8', fontWeight: '700' }}>No saved slot activity for this venue yet</td>
                      </tr>
                    )}
                 </tbody>
              </table>
           </div>
           
           <div style={{ padding: '1.5rem', background: '#F8FAF7', borderTop: '1.5px solid #EEF2E6', display: 'flex', gap: '12px' }}>
              <AlertCircle size={20} color="#3b82f6" />
              <p style={{ fontSize: '0.85rem', color: '#98A2B3', fontWeight: '500', lineHeight: 1.5 }}>
                 New slots will be visible on the customer app immediately. Existing bookings in a deleted slot will not be affected.
              </p>
           </div>
        </div>
      </div>
      )} {/* end hasVenues */}
    </div>
  );
}

const btnPrimary = { background: '#CEF17B', color: '#084734', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '800', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(30,190,116,0.2)' };
const filterBtn = { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', borderRadius: '12px', border: '1.5px solid #EEF2E6', fontSize: '0.85rem', fontWeight: '600', color: '#98A2B3', cursor: 'pointer', background: 'white' };
const thStyle = { textAlign: 'left', padding: '1.2rem', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' };
const tdStyle = { padding: '1.2rem', verticalAlign: 'middle' };
const iconBtn = { background: 'none', border: '1.5px solid #EEF2E6', padding: '8px', borderRadius: '10px', color: '#98A2B3', cursor: 'pointer' };
