import axios from 'axios';

// En desarrollo, usamos el mismo host desde donde se cargó la app.
// Así funciona tanto desde localhost como desde tablets/celulares
// en la misma red local (ej: http://192.168.1.50:5173)
const getDevBaseURL = () => {
  const hostname = window.location.hostname;
  return `http://${hostname}:4000/api`;
};

const api = axios.create({
  baseURL: import.meta.env.DEV 
    ? getDevBaseURL()
    : 'https://gbasistente.onrender.com/api',
  withCredentials: true
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor global para manejar expiración de sesión (401)
import Swal from 'sweetalert2';

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Ignorar peticiones a rutas de login o verificación para evitar bucles
      const isAuthRoute = error.config.url.includes('/auth/login') || error.config.url.includes('/auth/verify');
      
      if (!isAuthRoute && !window.hasShownSessionAlert) {
        window.hasShownSessionAlert = true; // Prevenir múltiples alertas
        Swal.fire({
          title: "Sesión Expirada",
          text: "Tu sesión ha caducado por seguridad o inactividad. Por favor, vuelve a ingresar.",
          icon: "warning",
          background: '#0f172a',
          color: '#f8fafc',
          confirmButtonColor: '#3b82f6',
          confirmButtonText: 'Volver a ingresar',
          allowOutsideClick: false,
          allowEscapeKey: false,
          customClass: {
            popup: 'rounded-[2rem] border border-slate-800 shadow-2xl',
            title: 'font-black tracking-tight text-xl',
            htmlContainer: 'font-medium text-slate-400 text-sm mt-2',
            confirmButton: 'rounded-xl px-8 py-3.5 font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20 hover:scale-105 transition-all'
          }
        }).then(() => {
          localStorage.removeItem('token');
          sessionStorage.clear();
          window.location.href = '/login';
        });
      }
    }
    return Promise.reject(error);
  }
);

export const UPLOAD_URL = import.meta.env.DEV
  ? `http://${window.location.hostname}:4000/uploads`
  : 'https://gbasistente.onrender.com/uploads';

export default api;
