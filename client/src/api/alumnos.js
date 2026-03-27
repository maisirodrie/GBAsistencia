import api from './axios';

export const getAlumnos      = ()           => api.get('/alumnos');
export const getAlumno       = (id)         => api.get(`/alumnos/${id}`);
export const createAlumno    = (data)       => api.post('/alumnos', data);
export const updateAlumno    = (id, data)   => api.put(`/alumnos/${id}`, data);
export const deleteAlumno    = (id)         => api.delete(`/alumnos/${id}`);
export const addAsistencia   = (id, fecha)  => api.post(`/alumnos/${id}/asistencia`, { fecha });
export const removeAsistencia = (id, fecha) => api.delete(`/alumnos/${id}/asistencia`, { data: { fecha } });
export const uploadFoto      = (id, formData) => api.post(`/alumnos/${id}/foto`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const checkIn         = (id)         => api.post(`/alumnos/${id}/checkin`);

export const descargarPDF = async (id, nombreAlumno = 'alumno') => {
    const response = await api.get(`/alumnos/${id}/pdf`, { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Carton_${nombreAlumno.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
};
