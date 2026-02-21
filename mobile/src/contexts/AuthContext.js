/**
 * Contexte d'authentification — gère l'état utilisateur global.
 *
 * Fournit : user, loading, login, register, logout
 * Stockage sécurisé des tokens via expo-secure-store.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API, { saveTokens, getAccessToken, clearTokens } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Au montage : vérifier si un token existe ──
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getAccessToken();
        if (token) {
          const { data } = await API.get('/auth/profil/');
          setUser(data);
        }
      } catch {
        await clearTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // ── Connexion ──
  const login = useCallback(async (username, password) => {
    const { data } = await API.post('/auth/token/', { username, password });
    await saveTokens(data.access, data.refresh);
    const profil = await API.get('/auth/profil/');
    setUser(profil.data);
    return profil.data;
  }, []);

  // ── Inscription ──
  const register = useCallback(async (formData) => {
    const { data } = await API.post('/auth/inscription/', formData);
    await saveTokens(data.tokens.access, data.tokens.refresh);
    setUser(data.user);
    return data.user;
  }, []);

  // ── Déconnexion ──
  const logout = useCallback(async () => {
    await clearTokens();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};
