import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import AlumnosPage from "./pages/AlumnosPage";
import AlumnoFormPage from "./pages/AlumnoFormPage";

function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-slate-900 text-white">
                <Navbar />
                <main className="container mx-auto px-4 py-8">
                    <Routes>
                        <Route path="/" element={<AlumnosPage />} />
                        <Route path="/nuevo" element={<AlumnoFormPage />} />
                        <Route path="/editar/:id" element={<AlumnoFormPage />} />
                    </Routes>
                </main>
            </div>
        </BrowserRouter>
    );
}

export default App;
