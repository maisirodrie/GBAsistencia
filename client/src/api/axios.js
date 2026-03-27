import axios from 'axios';

const api = axios.create({
  baseURL: `http://${window.location.hostname}:4000/api`,
  withCredentials: true
});

export default api;
