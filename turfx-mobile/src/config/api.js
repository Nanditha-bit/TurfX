import axios from 'axios';

// Local backend — phone and PC must be on the same WiFi
// Updated IP: 192.168.1.26
export const API_URL = 'http://192.168.1.26:5000/api';

const API = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export default API;
