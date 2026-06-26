import axios from 'axios';

// Your PC's current local IP on WiFi: 192.168.1.26
// Phone and PC must be on the SAME WiFi network.
// If IP changes, run `ipconfig` on Windows to find the new IPv4 Address.
export const API_URL = 'http://192.168.1.26:5000/api';

const API = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export default API;
