import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL as API } from '../config/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const storedUser  = await SecureStore.getItemAsync('user');
        const storedToken = await SecureStore.getItemAsync('token');
        if (storedUser && storedToken) {
          // Validate token is still valid before restoring session
          try {
            const parsed = JSON.parse(storedUser);
            // Quick verify: check token with backend
            await axios.get(`${API}/auth/me`, {
              headers: { Authorization: `Bearer ${storedToken}` },
              timeout: 5000,
            });
            setUser(parsed);
            setToken(storedToken);
          } catch (e) {
            // Token expired or invalid — clear stored session silently
            await SecureStore.deleteItemAsync('user');
            await SecureStore.deleteItemAsync('token');
          }
        }
      } catch (e) {
        // SecureStore error — clear everything
        try {
          await SecureStore.deleteItemAsync('user');
          await SecureStore.deleteItemAsync('token');
        } catch {}
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    await SecureStore.setItemAsync('user', JSON.stringify(userData));
    await SecureStore.setItemAsync('token', tokenData);
  };

  const logout = async () => {
    if (token) {
      axios.post(`${API}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    setUser(null);
    setToken(null);
    await SecureStore.deleteItemAsync('user');
    await SecureStore.deleteItemAsync('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
