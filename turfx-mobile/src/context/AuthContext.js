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
          // Restore session immediately from local storage — don't block on network
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          setToken(storedToken);

          // Validate token in the background (non-blocking)
          axios.get(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
            timeout: 8000,
          }).catch(async (e) => {
            // Only clear session on explicit 401 (invalid token), not on network errors
            if (e.response && e.response.status === 401) {
              setUser(null);
              setToken(null);
              await SecureStore.deleteItemAsync('user');
              await SecureStore.deleteItemAsync('token');
            }
            // Network errors (ECONNREFUSED, timeout) are ignored — keep user logged in
          });
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
