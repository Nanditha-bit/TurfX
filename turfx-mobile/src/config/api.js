import axios from 'axios';

// Local backend - works on your WiFi network
export const API_URL = 'http://10.157.66.150:5000/api';

const API = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export default API;
