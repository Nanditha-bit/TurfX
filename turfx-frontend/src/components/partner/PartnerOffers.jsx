import { useState } from 'react';
import axios from 'axios';
import { Percent, Plus, Tag, Trash2, Edit2, X, Check } from 'lucide-react';

import { API_URL as API } from '../../config/api';

export default function PartnerOffers({ data, token, onChange }) {
  const offers = data?.offers || [];
  const turfs = data?.turfs || [];
  const now = new Date();
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [form, setForm] = useState({
    title: '',
    discount: '',
    description: '',
    valid_until: '',
    turf_id: turfs[0]?._id || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const openCreate = () => {
    setEditingOffer(null);
    setForm({ title: '', discount: '', description: '', valid_until: '', turf_id: turfs[0]?._id || '' });
    setShowForm(true);
    setError('');
  };

  const openEdit = (offer) => {
    setEditingOffer(offer);
    setForm({
      title: offer.title || '',
      discount: offer.discount || '',
      description: offer.description || '',
      valid_until: offer.valid_until ? offer.valid_until.split('T')[0] : '',
      turf_id: offer.turf_id?._id || offer.turf_id || turfs[0]?._id || '',
    });
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.turf_id) { setError('Please select a venue'); return; }
    setSaving(true);
    setError('');
    try {
      if (editingOffer) {
        await axios.put(`${API}/offers/${editingOffer._id}`, form, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${API}/offers`, form, { headers: { Authorization: `Bearer ${token}` } });
      }
      setForm({ title: '', discount: '', description: '', valid_until: '', turf_id: turfs[0]?._id || '' });
      setShowForm(false);
      setEditingOffer(null);
      onChange?.();
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to save offer');
    } finally {
      setSaving(false);
    }
  };

  const deleteOffer = async (id) => {
    if (!window.confirm('Delete this offer?')) return;
    try {
      await axios.delete(`${API}/offers/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      onChange?.();
    } catch (err) {
      alert(err.response?.data?.msg || 'Failed to delete offer');
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#161616', marginBottom: '8px' }}>Offers & Promotions</h2>
          <p style={{ color: '#98A2B3', fontWeight: '500' }}>Offers attached to your venues</p>
        </div>
        <button onClick={openCreate} style={btnPrimary}><Plus size={18} /> Create New Offer</button>
      </div>

      {/* CREATE / EDIT FORM */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: 'white', padding: '1.5rem', borderRadius: '20px', border: '1.5px solid #EEF2E6', marginBottom: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: '800', fontSize: '1rem', color: '#161616', margin: 0 }}>
              {editingOffer ? 'Edit Offer' : 'New Offer'}
            </h3>
            <button type="button" onClick={() => { setShowForm(false); setEditingOffer(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
              <X size={20} />
            </button>
          </div>
          <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Offer title *" style={inputStyle} />
          <input required value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} placeholder="Discount, e.g. 20% OFF *" style={inputStyle} />
          <select required value={form.turf_id} onChange={e => setForm({ ...form, turf_id: e.target.value })} style={inputStyle}>
            <option value="">Select venue *</option>
            {turfs.map(turf => <option key={turf._id} value={turf._id}>{turf.name}</option>)}
          </select>
          <input type="date" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} style={inputStyle} min={new Date().toISOString().split('T')[0]} />
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" style={{ ...inputStyle, gridColumn: '1 / -1', minHeight: '80px', resize: 'vertical' }} />
          {error && <div style={{ gridColumn: '1 / -1', color: '#DC2626', fontWeight: '700', fontSize: '0.85rem', background: '#FEE2E2', padding: '10px 14px', borderRadius: '10px' }}>{error}</div>}
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px' }}>
            <button type="submit" disabled={saving || turfs.length === 0} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
              <Check size={16} /> {saving ? 'Saving...' : editingOffer ? 'Update Offer' : 'Save Offer'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingOffer(null); }} style={btnSecondary}>Cancel</button>
          </div>
        </form>
      )}

      {offers.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
           {offers.map(o => {
             const expired = o.valid_until && new Date(o.valid_until) < now;
             const status = expired ? 'Expired' : 'Active';
             return (
               <div key={o._id} style={{ background: 'white', padding: '1.5rem', borderRadius: '24px', border: '1.5px solid #EEF2E6', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, padding: '8px 15px', background: status === 'Active' ? '#DCEFB8' : '#EEF2E6', color: status === 'Active' ? '#084734' : '#98A2B3', fontSize: '0.7rem', fontWeight: '800', borderRadius: '0 0 0 16px' }}>
                     {status.toUpperCase()}
                  </div>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#DCEFB8', color: '#084734', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                     <Percent size={24} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#161616', marginBottom: '4px' }}>{o.title}</h3>
                  <p style={{ fontSize: '1rem', fontWeight: '800', color: '#084734', marginBottom: '10px' }}>{o.discount || 'Offer'}</p>
                  <p style={{ fontSize: '0.8rem', color: '#98A2B3', fontWeight: '500', marginBottom: '1.5rem' }}>{o.description || 'No description added'}</p>

                  <div style={{ borderTop: '1.5px solid #EEF2E6', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>
                       {o.turf_id?.name || 'All venues'}{o.valid_until ? ` | Until ${new Date(o.valid_until).toLocaleDateString('en-IN')}` : ''}
                     </div>
                     <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => openEdit(o)} style={iconBtn} title="Edit offer"><Edit2 size={16} /></button>
                        <button onClick={() => deleteOffer(o._id)} style={{ ...iconBtn, color: '#ef4444' }} title="Delete offer"><Trash2 size={16} /></button>
                     </div>
                  </div>
               </div>
             );
           })}
        </div>
      ) : (
        <div style={{ background: 'white', padding: '4rem', borderRadius: '24px', border: '1.5px solid #EEF2E6', textAlign: 'center', color: '#94a3b8', fontWeight: '700', marginBottom: '2.5rem' }}>
          No offers yet. Click "Create New Offer" to add your first promotion.
        </div>
      )}

      <div style={{ background: 'white', padding: '2rem', borderRadius: '24px', border: '1.5px solid #EEF2E6', display: 'flex', gap: '2rem', alignItems: 'center' }}>
         <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#DCEFB8', color: '#084734', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Tag size={28} />
         </div>
         <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '4px' }}>Grow your business with smart offers</h4>
            <p style={{ fontSize: '0.85rem', color: '#98A2B3', fontWeight: '500', lineHeight: 1.5 }}>
               Venues with active offers get up to 30% more bookings. Create time-limited discounts to fill off-peak slots.
            </p>
         </div>
         <button onClick={openCreate} style={btnPrimary}><Plus size={16} /> Add Offer</button>
      </div>
    </div>
  );
}

const btnPrimary = { background: '#084734', color: '#CEF17B', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '800', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(8,71,52,0.2)' };
const btnSecondary = { background: 'white', color: '#374151', border: '1.5px solid #E9EDE8', padding: '12px 24px', borderRadius: '12px', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' };
const iconBtn = { background: 'none', border: '1.5px solid #E9EDE8', padding: '6px 8px', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center' };
const inputStyle = { padding: '12px 14px', borderRadius: '12px', border: '1.5px solid #EEF2E6', fontSize: '0.9rem', fontWeight: '600', outline: 'none', width: '100%', boxSizing: 'border-box' };
