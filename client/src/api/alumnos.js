import api from './axios';

export const getAlumnos      = ()           => api.get('/alumnos');
export const getAlumno       = (id)         => api.get(`/alumnos/${id}`);
export const createAlumno    = (data)       => api.post('/alumnos', data);
export const updateAlumno    = (id, data)   => api.put(`/alumnos/${id}`, data);
export const deleteAlumno    = (id)         => api.delete(`/alumnos/${id}`);
export const addAsistencia   = (id, fecha)  => api.post(`/alumnos/${id}/asistencia`, { fecha });
export const removeAsistencia = (id, fecha) => api.delete(`/alumnos/${id}/asistencia`, { data: { fecha } });
