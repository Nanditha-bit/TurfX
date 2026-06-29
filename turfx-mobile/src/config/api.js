import axios from 'axios';

// Public ngrok tunnel — works anywhere, no WiFi restriction
export const API_URL = 'https://attest-curve-femur.ngrok-free.dev/api';

const API = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  },
});

export default API;
