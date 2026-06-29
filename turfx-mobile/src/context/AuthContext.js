import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL as API } from '../config/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // Track the token that was active when background validation started
  // so we don't overwrite a newer login with stale data
  const validatingToken = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const storedUser  = await SecureStore.getItemAsync('user');
        const storedToken = await SecureStore.getItemAsync('token');
        if (storedUser && storedToken) {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          setToken(storedToken);
          validatingToken.current = storedToken;

          // Validate token in background — only update user if token hasn't changed
          axios.get(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
            timeout: 8000,
          }).then(res => {
            // Only update if this is still the active token (no new login happened)
            if (validatingToken.current === storedToken) {
              setUser(res.data);
              SecureStore.setItemAsync('user', JSON.stringify(res.data));
            }
          }).catch(async (e) => {
            if (e.response && e.response.status === 401) {
              // Only clear if this token is still the active one
              if (validatingToken.current === storedToken) {
                setUser(null);
                setToken(null);
                await SecureStore.deleteItemAsync('user');
                await SecureStore.deleteItemAsync('token');
              }
            }
          });
        }
      } catch (e) {
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
    // Mark this as the new active token — cancels any in-flight background validation
    validatingToken.current = tokenData;
    setUser(userData);
    setToken(tokenData);
    await SecureStore.setItemAsync('user', JSON.stringify(userData));
    await SecureStore.setItemAsync('token', tokenData);
  };

  const logout = async () => {
    validatingToken.current = null;
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
