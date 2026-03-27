import api from './axios';

export const getPlanesAlumno = (alumnoId)    => api.get(`/planes/${alumnoId}`);
export const getTodosPlanes  = ()            => api.get('/planes/todos');
export const crearPlan       = (data)        => api.post('/planes', data);
export const pagarCuota      = (id, data)    => api.post(`/planes/${id}/pagar`, data);
export const cancelarPlan    = (id)          => api.delete(`/planes/${id}`);
