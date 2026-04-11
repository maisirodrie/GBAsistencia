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

export const UPLOAD_URL = import.meta.env.DEV
  ? `http://${window.location.hostname}:4000/uploads`
  : 'https://gbasistente.onrender.com/uploads';

export default api;
