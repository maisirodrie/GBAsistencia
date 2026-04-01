import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.DEV 
    ? 'http://localhost:4000/api' 
    : 'https://gbasistente.onrender.com/api',
  withCredentials: true
});

export default api;
