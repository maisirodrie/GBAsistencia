import axios from './axios';

export const loginRequest = (user) => axios.post(`/auth/login`, user);
export const registerRequest = (user) => axios.post(`/auth/register`, user);
export const verifyTokenRequest = () => axios.get(`/auth/verify`);
export const logoutRequest = () => axios.post(`/auth/logout`);
export const changePasswordRequest = (data) => axios.post(`/auth/change-password`, data);
export const forgotPasswordRequest = (dni) => axios.post(`/auth/forgot-password`, { dni });
export const resetPasswordRequest = (data) => axios.post(`/auth/reset-password`, data);

export const getUsersRequest = () => axios.get(`/auth/users`);
export const updateUserRequest = (id, data) => axios.put(`/auth/users/${id}`, data);
export const deleteUserRequest = (id) => axios.delete(`/auth/users/${id}`);
