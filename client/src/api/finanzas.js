import api from './axios';

export const getConfiguracion  = ()       => api.get('/finanzas/configuracion');
export const updateConfiguracion = (data) => api.put('/finanzas/configuracion', data);

export const getResumen         = (mes)   => api.get('/finanzas/resumen', { params: { mes } });
export const getTransacciones   = ()      => api.get('/finanzas/transacciones');
export const crearTransaccion   = (data)  => api.post('/finanzas/transaccion', data);
export const eliminarTransaccion = (id)   => api.delete(`/finanzas/transaccion/${id}`);

export const pagarMembresia     = (data)  => api.post('/finanzas/pagar-membresia', data);
export const getEstadoMembresias = (periodo) => api.get('/finanzas/estado-membresias', { params: { periodo } });
