import api from './axios';

export const getProductos     = ()         => api.get('/productos');
export const getTodosProductos = ()        => api.get('/productos/todos');
export const getVentasProductos = ()       => api.get('/productos/ventas');
export const crearProducto    = (data)     => api.post('/productos', data);
export const updateProducto   = (id, data) => api.put(`/productos/${id}`, data);
export const deleteProducto   = (id)       => api.delete(`/productos/${id}`);
export const ajustarStock     = (id, stock)=> api.put(`/productos/${id}/stock`, { stock });
export const venderProducto   = (data)     => api.post('/productos/vender', data);
