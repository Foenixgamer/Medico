import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || window.location.origin,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Leer token del almacenamiento persistente en cada request
api.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem('medsecure_auth')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed.accessToken) {
        config.headers.Authorization = `Bearer ${parsed.accessToken}`
      }
    }
  } catch {}
  return config
})

export default api;
