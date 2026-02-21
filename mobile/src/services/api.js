/**
 * Service API — Axios configuré pour le backend Django L1tello.
 *
 * Fonctionnalités :
 *  - Base URL automatique selon la plateforme
 *  - Injection automatique du token JWT via intercepteur
 *  - Refresh automatique du token en cas de 401
 *  - Stockage sécurisé via expo-secure-store
 */

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_CONFIG } from '../constants/config';

// ── Clés de stockage sécurisé ──
export const TOKEN_KEYS = {
  ACCESS: 'l1tello_access_token',
  REFRESH: 'l1tello_refresh_token',
};

// ── Instance Axios ──
const API = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Helpers pour le stockage sécurisé des tokens ──
export async function saveTokens(access, refresh) {
  await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS, access);
  if (refresh) {
    await SecureStore.setItemAsync(TOKEN_KEYS.REFRESH, refresh);
  }
}

export async function getAccessToken() {
  return await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS);
}

export async function getRefreshToken() {
  return await SecureStore.getItemAsync(TOKEN_KEYS.REFRESH);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS);
  await SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH);
}

// ── Intercepteur REQUEST : injecte le token JWT ──
API.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Intercepteur RESPONSE : refresh auto du token ──
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Si un refresh est déjà en cours, mettre en file d'attente
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return API(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refresh = await getRefreshToken();
        if (!refresh) {
          throw new Error('No refresh token');
        }

        const { data } = await axios.post(
          `${API_CONFIG.BASE_URL}/auth/token/refresh/`,
          { refresh },
        );

        await saveTokens(data.access, data.refresh || refresh);
        processQueue(null, data.access);

        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return API(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await clearTokens();
        // Le contexte Auth gérera la déconnexion
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default API;
