import axios from './axios';

export const loginRequest = (user) => axios.post(`/login`, user);
export const registerRequest = (user) => axios.post(`/register`, user);
export const verifyTokenRequest = () => axios.get(`/verify`);
export const logoutRequest = () => axios.post(`/logout`);
export const changePasswordRequest = (data) => axios.post(`/change-password`, data);
export const forgotPasswordRequest = (dni) => axios.post(`/forgot-password`, { dni });
export const resetPasswordRequest = (data) => axios.post(`/reset-password`, data);
