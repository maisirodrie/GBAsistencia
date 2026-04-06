import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.DEV 
    ? 'http://localhost:4000/api' 
    : 'https://gbasistente.onrender.com/api',
  withCredentials: true
});

export const UPLOAD_URL = import.meta.env.DEV
  ? 'http://localhost:4000/uploads'
  : 'https://gbasistente.onrender.com/uploads';

export default api;
