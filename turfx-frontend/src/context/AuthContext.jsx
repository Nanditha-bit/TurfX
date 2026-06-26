import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL as API } from '../config/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage on app start
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    } catch (error) {
      console.error('Error loading auth from localStorage:', error);
      localStorage.clear();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', tokenData);
  };

  const logout = async () => {
    // Show confirmation before logging out
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (!confirmLogout) return;

    // Notify backend (best-effort — don't block on failure)
    const currentToken = localStorage.getItem('token');
    if (currentToken) {
      axios.post(`${API}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${currentToken}` },
      }).catch(() => {});
    }
    setUser(null);
    setToken(null);
    localStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
