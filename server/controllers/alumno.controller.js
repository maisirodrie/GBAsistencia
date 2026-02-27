import Alumno from '../models/Alumno.js';

export const getAlumnos = async (req, res) => {
    try {
        const alumnos = await Alumno.find();
        res.json(alumnos);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const createAlumno = async (req, res) => {
    try {
        const { nombre, faja, grado, ultimaGraduacion } = req.body;
        const newAlumno = new Alumno({
            nombre,
            faja,
            grado,
            ultimaGraduacion
        });
        const savedAlumno = await newAlumno.save();
        res.json(savedAlumno);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getAlumno = async (req, res) => {
    try {
        const alumno = await Alumno.findById(req.params.id);
        if (!alumno) return res.status(404).json({ message: 'Alumno no encontrado' });
        res.json(alumno);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const deleteAlumno = async (req, res) => {
    try {
        const deletedAlumno = await Alumno.findByIdAndDelete(req.params.id);
        if (!deletedAlumno) return res.status(404).json({ message: 'Alumno no encontrado' });
        return res.sendStatus(204);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const updateAlumno = async (req, res) => {
    try {
        const alumnoUpdated = await Alumno.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });
        if (!alumnoUpdated) return res.status(404).json({ message: 'Alumno no encontrado' });
        res.json(alumnoUpdated);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const addAsistencia = async (req, res) => {
    try {
        const { fecha } = req.body;
        const alumno = await Alumno.findById(req.params.id);
        if (!alumno) return res.status(404).json({ message: 'Alumno no encontrado' });
        
        // Evitar duplicados en el mismo día
        const fechaSinHora = new Date(fecha).setHours(0, 0, 0, 0);
        const yaAsistio = alumno.asistencias.some(a => new Date(a).setHours(0, 0, 0, 0) === fechaSinHora);
        
        if (yaAsistio) return res.status(400).json({ message: 'Asistencia ya registrada para hoy' });

        alumno.asistencias.push(fecha);
        await alumno.save();
        res.json(alumno);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const removeAsistencia = async (req, res) => {
    try {
        const { fecha } = req.body;
        const alumno = await Alumno.findById(req.params.id);
        if (!alumno) return res.status(404).json({ message: 'Alumno no encontrado' });
        
        const fechaParaRemover = new Date(fecha).setHours(0, 0, 0, 0);
        alumno.asistencias = alumno.asistencias.filter(a => new Date(a).setHours(0, 0, 0, 0) !== fechaParaRemover);
        
        await alumno.save();
        res.json(alumno);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};
