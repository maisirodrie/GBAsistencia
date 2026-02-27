import { Link } from "react-router-dom";

export default function Navbar() {
    return (
        <nav className="bg-slate-800 border-b border-slate-700 shadow-lg">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">

                {/* Logo */}
                <Link to="/" className="flex items-center gap-2">
                    <div className="flex items-center leading-none select-none">
                        <span className="text-3xl font-black italic text-slate-100 tracking-tight">GB</span>
                        <div className="bg-blue-800 text-white w-7 h-7 flex items-center justify-center rounded font-black text-lg italic ml-0.5">
                            1
                        </div>
                    </div>
                    <span className="text-slate-300 font-bold text-sm tracking-widest uppercase ml-2 hidden sm:block">
                        Asistencia
                    </span>
                </Link>

                {/* Botón nuevo */}
                <Link
                    to="/nuevo"
                    className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold px-4 py-2 rounded-lg text-sm transition-all shadow-md"
                >
                    + Nuevo Alumno
                </Link>
            </div>
        </nav>
    );
}
