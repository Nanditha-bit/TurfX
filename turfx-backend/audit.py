from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app, raise_server_exceptions=False)

# Login all roles
r = client.post('/api/auth/password-login', json={'phone':'+917654321098','password':'User@123'})
user_token = r.json().get('token','') if r.status_code==200 else ''

r = client.post('/api/auth/password-login', json={'phone':'+919876543210','password':'Partner@123'})
partner_token = r.json().get('token','') if r.status_code==200 else ''

r = client.post('/api/auth/password-login', json={'phone':'+919999999999','password':'Admin@123'})
admin_token = r.json().get('token','') if r.status_code==200 else ''

def h(t): return {'Authorization': f'Bearer {t}'}

turfs = client.get('/api/turfs').json()
tid = turfs[0]['_id'] if turfs else 'missing'

# ── Booking flow ──────────────────────────────────────────────────────────────
order   = client.post('/api/bookings/razorpay-order', json={'amount': 1253}, headers=h(user_token))
booking = client.post('/api/bookings/direct', json={
    'turf_id': tid, 'date': '2026-09-01',
    'time_slots': ['8-9 AM'], 'total_price': 1253.0, 'payment_id': 'pay_audit',
}, headers=h(user_token))
bid = booking.json().get('_id', '')
cancel  = client.put(f'/api/bookings/cancel/{bid}', json={}, headers=h(user_token))
mine    = client.get('/api/bookings/mine', headers=h(user_token))

# ── Review ────────────────────────────────────────────────────────────────────
review  = client.post('/api/reviews', json={'turf_id': tid, 'rating': 5, 'comment': 'Great turf!'}, headers=h(user_token))

# ── Partner: slot + offer ─────────────────────────────────────────────────────
slot    = client.post('/api/slots', json={'turf_id': tid, 'date': '2026-09-15', 'time_slot': '10:00 AM'}, headers=h(partner_token))
offer   = client.post('/api/offers', json={'turf_id': tid, 'title': '20% Off Weekend', 'discount': '20% OFF', 'valid_until': '2026-12-31'}, headers=h(partner_token))
oid     = offer.json().get('id','')
del_off = client.delete(f'/api/offers/{oid}', headers=h(partner_token))

# ── Profile & support ─────────────────────────────────────────────────────────
profile = client.post('/api/auth/update-profile', json={'name': 'Audit User'}, headers=h(user_token))
ticket  = client.post('/api/support/tickets', json={'subject': 'Test', 'description': 'Help', 'category': 'Other', 'priority': 'Low'}, headers=h(user_token))

# ── Owner dashboard & admin ───────────────────────────────────────────────────
dashboard = client.get('/api/owner/dashboard', headers=h(partner_token))
revenue   = client.get('/api/admin/revenue', headers=h(admin_token))
users     = client.get('/api/admin/users', headers=h(admin_token))
all_venues = client.get('/api/admin/turfs', headers=h(admin_token))

# ── Exports ───────────────────────────────────────────────────────────────────
csv_b   = client.get('/api/exports/bookings/csv', headers=h(partner_token))
csv_e   = client.get('/api/exports/earnings/csv', headers=h(partner_token))

results = [
    ('Razorpay order',      order,     [200, 201]),
    ('Create booking',      booking,   [200, 201]),
    ('Cancel booking',      cancel,    [200]),
    ('My bookings',         mine,      [200]),
    ('Post review',         review,    [200, 201]),
    ('Create slot',         slot,      [200, 201, 409]),  # 409 if already exists
    ('Create offer',        offer,     [200, 201]),
    ('Delete offer',        del_off,   [200]),
    ('Update profile',      profile,   [200]),
    ('Create ticket',       ticket,    [200, 201]),
    ('Owner dashboard',     dashboard, [200]),
    ('Admin revenue',       revenue,   [200]),
    ('Admin users',         users,     [200]),
    ('Admin turfs',         all_venues,[200]),
    ('Export bookings CSV', csv_b,     [200]),
    ('Export earnings CSV', csv_e,     [200]),
]

passed = failed = 0
for label, resp, expected in results:
    ok = resp.status_code in expected
    mark = 'PASS' if ok else 'FAIL'
    if ok:
        passed += 1
    else:
        failed += 1
        print(f'  {mark}  {label:<25} -> {resp.status_code}  {resp.text[:80]}')

print(f'\n  Summary: {passed} passed  |  {failed} failed  |  {len(results)} total')
