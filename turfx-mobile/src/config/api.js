import axios from 'axios';

// Choose which API to use — FALSE for PRODUCTION!
const USE_LOCAL_BACKEND = false;

// Local backend URLs
const API_URL_ANDROID_EMULATOR = 'http://10.0.2.2:5000/api'; // For Android emulator
const API_URL_IOS_SIMULATOR = 'http://localhost:5000/api'; // For iOS simulator
const API_URL_LOCAL_NETWORK = 'http://192.168.1.100:5000/api'; // For physical devices on same Wi-Fi

// Production backend (Render)
const API_URL_PRODUCTION = 'https://turfx.metaqode.co.in/api';

// Select the appropriate local URL for your device
const API_URL_LOCAL = API_URL_ANDROID_EMULATOR; // Change this to match your setup!

// Export the active API URL
export const API_URL = USE_LOCAL_BACKEND ? API_URL_LOCAL : API_URL_PRODUCTION;

const API = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default API;
