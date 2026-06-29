import axios from 'axios';

// Production backend (Render) — works anywhere, no local PC needed
export const API_URL = 'https://turfx.metaqode.co.in/api';

const API = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default API;
