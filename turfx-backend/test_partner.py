from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app, raise_server_exceptions=False)

r = client.post('/api/auth/password-login', json={'phone':'+919876543210','password':'Partner@123'})
token = r.json().get('token','')
h = {'Authorization': f'Bearer {token}'}

tests = [
    ('GET',  '/api/owner/dashboard',         None),
    ('PUT',  '/api/owner/profile',           {'name':'Test Partner','email':'partner@turfx.in'}),
    ('PUT',  '/api/owner/settings/password', {'currentPassword':'Partner@123','newPassword':'Partner@123'}),
]

for method, path, payload in tests:
    resp = client.request(method, path, json=payload, headers=h)
    ok = resp.status_code in (200, 201)
    label = 'OK  ' if ok else 'FAIL'
    detail = '' if ok else resp.text[:100]
    print(f'  {label} {method} {path} -> {resp.status_code} {detail}')

dash = client.get('/api/owner/dashboard', headers=h).json()
print(f'\n  Dashboard keys: {list(dash.keys())}')
print(f'  Reviews count : {len(dash.get("reviews", []))}')
print(f'  avgRating     : {dash.get("avgRating")}')
