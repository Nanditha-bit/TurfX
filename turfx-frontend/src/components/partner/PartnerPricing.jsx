import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { 
  Save, Plus, Trash2, 
  Clock, Zap, AlertCircle,
  MapPin, Check, X
} from 'lucide-react';

import { API_URL as API } from '../../config/api';

export default function PartnerPricing({ data }) {
  const { token } = useAuth();
  const [selectedTurf, setSelectedTurf] = useState(data?.turfs?.[0]?._id || null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const currentTurf = data?.turfs?.find(t => t._id === selectedTurf) || data?.turfs?.[0];

  // Editable prices — sync when turf changes
  const [basePrice, setBasePrice] = useState(currentTurf?.price_per_hour || 0);
  const [rules, setRules] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newRule, setNewRule] = useState({
    category: '',
    type: 'Weekday',
    startTime: '06:00',
    endTime: '12:00',
    price: ''
  });

  const handleTurfSelect = (id) => {
    setSelectedTurf(id);
    const turf = data?.turfs?.find(t => t._id === id);
    if (turf) setBasePrice(turf.price_per_hour || 0);
  };

  // Load rules when selectedTurf or basePrice changes
  useEffect(() => {
    if (currentTurf) {
      // Prefer backend-saved rules
      if (currentTurf.pricingRules && currentTurf.pricingRules.length > 0) {
        // Sync base price in the base rule
        const updated = currentTurf.pricingRules.map(r =>
          r.id === `${currentTurf._id}-base` ? { ...r, price: basePrice } : r
        );
        setRules(updated);
        return;
      }

      // Fall back to localStorage cache
      const savedRules = localStorage.getItem(`turf_pricing_rules_${currentTurf._id}`);
      if (savedRules) {
        try {
          const parsed = JSON.parse(savedRules);
          const updated = parsed.map(r => {
            if (r.id === `${currentTurf._id}-base`) {
              return { ...r, price: basePrice };
            }
            return r;
          });
          setRules(updated);
          return;
        } catch (e) {
          console.error(e);
        }
      }
      
      // Default fallback rules
      setRules([
        { id: `${currentTurf._id}-base`, type: 'Weekday', startTime: '06:00', endTime: '16:00', price: basePrice, category: 'Base Rate', active: true },
        { id: `${currentTurf._id}-prime`, type: 'Weekday', startTime: '16:00', endTime: '23:00', price: Math.round(basePrice * 1.25), category: 'Prime Time', active: true },
        { id: `${currentTurf._id}-weekend`, type: 'Weekend', startTime: '06:00', endTime: '23:00', price: Math.round(basePrice * 1.5), category: 'Weekend', active: true },
      ]);
    }
  }, [selectedTurf, basePrice]);

  const toggleRuleActive = (id) => {
    const updatedRules = rules.map(r => r.id === id ? { ...r, active: !r.active } : r);
    setRules(updatedRules);
    if (currentTurf) {
      localStorage.setItem(`turf_pricing_rules_${currentTurf._id}`, JSON.stringify(updatedRules));
    }
  };

  const deleteRule = (id) => {
    const updatedRules = rules.filter(r => r.id !== id);
    setRules(updatedRules);
    if (currentTurf) {
      localStorage.setItem(`turf_pricing_rules_${currentTurf._id}`, JSON.stringify(updatedRules));
    }
  };

  const handlePriceChange = (id, newPrice) => {
    const updatedRules = rules.map(r => r.id === id ? { ...r, price: parseFloat(newPrice) || 0 } : r);
    setRules(updatedRules);
    if (currentTurf) {
      localStorage.setItem(`turf_pricing_rules_${currentTurf._id}`, JSON.stringify(updatedRules));
    }
  };

  const handleAddRule = (e) => {
    e.preventDefault();
    if (!newRule.category || !newRule.price) {
      setError('Please fill in all fields for the new rule');
      return;
    }
    const rule = {
      id: `${currentTurf?._id || 'custom'}-${Date.now()}`,
      category: newRule.category,
      type: newRule.type,
      startTime: newRule.startTime,
      endTime: newRule.endTime,
      price: parseFloat(newRule.price) || 0,
      active: true
    };
    const updatedRules = [...rules, rule];
    setRules(updatedRules);
    if (currentTurf) {
      localStorage.setItem(`turf_pricing_rules_${currentTurf._id}`, JSON.stringify(updatedRules));
    }
    setShowModal(false);
    setNewRule({
      category: '',
      type: 'Weekday',
      startTime: '06:00',
      endTime: '12:00',
      price: ''
    });
  };

  const handleSave = async () => {
    if (!currentTurf) return;
    setSaving(true);
    setError('');
    try {
      await axios.put(`${API}/turfs/${currentTurf._id}`, {
        price_per_hour: parseFloat(basePrice),
        pricingRules: rules,
      }, { headers: { Authorization: `Bearer ${token}` } });
      // Also persist locally as a cache
      localStorage.setItem(`turf_pricing_rules_${currentTurf._id}`, JSON.stringify(rules));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to save pricing');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#161616', marginBottom: '8px' }}>Pricing Management</h2>
          <p style={{ color: '#98A2B3', fontWeight: '500' }}>Set dynamic pricing based on time slots and days</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <button onClick={handleSave} disabled={saving} style={btnPrimary}>
            {saved ? <><Check size={18} /> Saved!</> : saving ? 'Saving...' : <><Save size={18} /> Save Changes</>}
          </button>
          {error && <div style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: '700' }}>{error}</div>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
        {/* LEFT: TURF SELECTION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#161616', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Your Venues</h3>
           {data?.turfs?.map(t => (
             <div 
               key={t._id} 
               onClick={() => handleTurfSelect(t._id)}
               style={{ 
                 padding: '1.2rem', borderRadius: '16px', border: '1.5px solid #EEF2E6',
                 background: selectedTurf === t._id ? '#DCEFB8' : 'white',
                 borderColor: selectedTurf === t._id ? '#CEF17B' : '#EEF2E6',
                 cursor: 'pointer', transition: '0.2s'
               }}
             >
                <div style={{ fontWeight: '800', color: selectedTurf === t._id ? '#161616' : '#98A2B3', fontSize: '0.95rem', marginBottom: '4px' }}>{t.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#94a3b8' }}>
                   <MapPin size={12} /> {t.location}
                </div>
             </div>
           ))}
        </div>

        {/* RIGHT: PRICING RULES */}
        <div>
           {/* QUICK STATS */}
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={priceStatCard}>
                 <div style={{ fontSize: '0.8rem', color: '#98A2B3', fontWeight: '700', marginBottom: '8px' }}>Base Hourly Rate</div>
                 <input 
                   type="number" 
                   value={basePrice} 
                   onChange={e => setBasePrice(parseFloat(e.target.value) || 0)}
                   style={{ fontSize: '1.5rem', fontWeight: '900', color: '#161616', border: 'none', outline: 'none', width: '100%', background: 'transparent' }}
                 />
              </div>
              <div style={priceStatCard}>
                 <div style={{ fontSize: '0.8rem', color: '#98A2B3', fontWeight: '700', marginBottom: '8px' }}>Prime Time Price</div>
                 <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#CEF17B' }}>
                   Rs.{rules.find(r => r.id.endsWith('-prime'))?.price || Math.round(basePrice * 1.25)}
                 </div>
              </div>
              <div style={priceStatCard}>
                 <div style={{ fontSize: '0.8rem', color: '#98A2B3', fontWeight: '700', marginBottom: '8px' }}>Active Rules</div>
                 <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#3b82f6' }}>
                   {rules.filter(r => r.active).length}
                 </div>
              </div>
           </div>

           {/* RULES LIST */}
           <div style={{ background: 'white', borderRadius: '24px', border: '1.5px solid #EEF2E6', overflow: 'hidden' }}>
              <div style={{ padding: '1.5rem', borderBottom: '1.5px solid #EEF2E6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Pricing Rules</h3>
                 <button onClick={() => setShowModal(true)} style={btnSmall}><Plus size={16} /> Add New Rule</button>
              </div>

               <div style={{ padding: '1.5rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                     <thead>
                        <tr style={{ textAlign: 'left' }}>
                           <th style={thStyle}>Rule Category</th>
                           <th style={thStyle}>Day Type</th>
                           <th style={thStyle}>Time Slot</th>
                           <th style={thStyle}>Price /Hr</th>
                           <th style={thStyle}>Status</th>
                           <th style={thStyle}></th>
                        </tr>
                     </thead>
                     <tbody>
                        {rules.map((rule) => (
                          <tr key={rule.id} style={{ borderBottom: '1px solid #EEF2E6', opacity: rule.active ? 1 : 0.6 }}>
                             <td style={tdStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                   <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F8FAF7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <Zap size={16} color={rule.active ? "#f59e0b" : "#94a3b8"} />
                                   </div>
                                   <div style={{ fontWeight: '700', fontSize: '0.9rem', color: rule.active ? '#161616' : '#94a3b8' }}>{rule.category}</div>
                                </div>
                             </td>
                             <td style={tdStyle}>
                                <span style={{ padding: '4px 10px', borderRadius: '6px', background: '#EEF2E6', fontSize: '0.75rem', fontWeight: '700', color: '#98A2B3' }}>{rule.type}</span>
                             </td>
                             <td style={tdStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#98A2B3', fontSize: '0.85rem', fontWeight: '600' }}>
                                   <Clock size={14} /> {rule.startTime} - {rule.endTime}
                                </div>
                             </td>
                             <td style={tdStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                   <input 
                                     type="number" 
                                     value={rule.price} 
                                     onChange={e => handlePriceChange(rule.id, e.target.value)}
                                     style={{ width: '80px', padding: '6px 10px', borderRadius: '8px', border: '1.5px solid #EEF2E6', fontWeight: '800', outline: 'none', textAlign: 'center' }}
                                   />
                                </div>
                             </td>
                             <td style={tdStyle}>
                                <div 
                                  onClick={() => toggleRuleActive(rule.id)}
                                  style={{ 
                                    width: '40px', height: '22px', 
                                    background: rule.active ? '#CEF17B' : '#cbd5e1', 
                                    borderRadius: '20px', position: 'relative', cursor: 'pointer',
                                    transition: '0.3s'
                                  }}
                                >
                                   <div style={{ 
                                     position: 'absolute', 
                                     left: rule.active ? '20px' : '2px', 
                                     top: '2px', width: '18px', height: '18px', 
                                     borderRadius: '50%', background: 'white',
                                     transition: '0.3s'
                                   }}></div>
                                </div>
                             </td>
                             <td style={tdStyle}>
                                <button 
                                  onClick={() => deleteRule(rule.id)}
                                  style={{ border: 'none', background: 'none', color: '#94a3b8', cursor: 'pointer', transition: '0.2s' }}
                                  onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                  onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                                >
                                  <Trash2 size={18} />
                                </button>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
               
               <div style={{ padding: '1.5rem', background: '#F8FAF7', display: 'flex', alignItems: 'center', gap: '12px', borderTop: '1.5px solid #EEF2E6' }}>
                  <AlertCircle size={18} color="#3b82f6" />
                  <p style={{ fontSize: '0.85rem', color: '#98A2B3', fontWeight: '500' }}>
                     Tip: Prime time pricing usually starts from 5 PM on weekdays.
                  </p>
               </div>
            </div>
         </div>
      </div>

      {/* ADD NEW RULE MODAL */}
      {showModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#161616', margin: 0 }}>Add Pricing Rule</h3>
              <button onClick={() => setShowModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddRule} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={labelStyle}>Rule Category / Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Night Owl, Early Bird"
                  value={newRule.category}
                  onChange={e => setNewRule({...newRule, category: e.target.value})}
                  style={inputStyle}
                  required
                />
              </div>
              
              <div>
                <label style={labelStyle}>Day Type</label>
                <select 
                  value={newRule.type}
                  onChange={e => setNewRule({...newRule, type: e.target.value})}
                  style={selectStyle}
                >
                  <option value="Weekday">Weekday (Mon-Fri)</option>
                  <option value="Weekend">Weekend (Sat-Sun)</option>
                  <option value="All Days">All Days</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={labelStyle}>Start Time</label>
                  <input 
                    type="time" 
                    value={newRule.startTime}
                    onChange={e => setNewRule({...newRule, startTime: e.target.value})}
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>End Time</label>
                  <input 
                    type="time" 
                    value={newRule.endTime}
                    onChange={e => setNewRule({...newRule, endTime: e.target.value})}
                    style={inputStyle}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Price / Hour (Rs.)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 1200"
                  value={newRule.price}
                  onChange={e => setNewRule({...newRule, price: e.target.value})}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.2rem' }}>
                <button type="button" onClick={() => setShowModal(false)} style={btnSecondary}>Cancel</button>
                <button type="submit" style={btnSubmitRule}>Add Rule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const priceStatCard = {
  background: 'white', padding: '1.5rem', borderRadius: '20px', border: '1.5px solid #EEF2E6'
};

const btnPrimary = {
  background: '#CEF17B', color: '#084734', border: 'none', padding: '12px 24px',
  borderRadius: '12px', fontWeight: '800', fontSize: '0.9rem', display: 'flex',
  alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(30,190,116,0.2)'
};

const btnSmall = {
  background: '#DCEFB8', color: '#CEF17B', border: 'none', padding: '8px 16px',
  borderRadius: '10px', fontWeight: '800', fontSize: '0.8rem', display: 'flex',
  alignItems: 'center', gap: '6px', cursor: 'pointer'
};

const thStyle = { textAlign: 'left', padding: '1rem', fontSize: '0.75rem', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' };
const tdStyle = { padding: '1.2rem', verticalAlign: 'middle' };

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(15, 23, 42, 0.4)',
  backdropFilter: 'blur(8px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalContentStyle = {
  background: 'white',
  padding: '2rem',
  borderRadius: '24px',
  width: '100%',
  maxWidth: '440px',
  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: '800',
  color: '#98A2B3',
  textTransform: 'uppercase',
  marginBottom: '6px'
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1.5px solid #DCEFB8',
  outline: 'none',
  fontSize: '0.9rem',
  fontWeight: '700',
  boxSizing: 'border-box'
};

const selectStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1.5px solid #DCEFB8',
  outline: 'none',
  fontSize: '0.9rem',
  fontWeight: '700',
  background: 'white',
  boxSizing: 'border-box'
};

const btnSecondary = {
  flex: 1,
  background: '#EEF2E6',
  color: '#98A2B3',
  border: 'none',
  padding: '12px',
  borderRadius: '12px',
  fontWeight: '800',
  cursor: 'pointer',
  textAlign: 'center'
};

const btnSubmitRule = {
  flex: 1,
  background: '#CEF17B',
  color: 'white',
  border: 'none',
  padding: '12px',
  borderRadius: '12px',
  fontWeight: '800',
  cursor: 'pointer',
  textAlign: 'center',
  boxShadow: '0 4px 12px rgba(30,190,116,0.2)'
};
