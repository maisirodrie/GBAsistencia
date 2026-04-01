import axios from 'axios';

const api = axios.create({
  baseURL: `https://gbasistente.onrender.com/api`,
  withCredentials: true
});

export default api;
