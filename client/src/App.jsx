import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import TopMobileHeader from "./components/TopMobileHeader";
import AlumnosPage from "./pages/AlumnosPage";
import AlumnoFormPage from "./pages/AlumnoFormPage";
import FinanzasPage from "./pages/FinanzasPage";
import ProductosPage from "./pages/ProductosPage";
import CheckInPage from "./pages/CheckInPage";
import PublicQRPage from "./pages/PublicQRPage";
import { useLocation } from "react-router-dom";

function AppContent() {
    const location = useLocation();
    const isPublic = location.pathname === "/checkin" || location.pathname.startsWith("/mi-pase/");

    return (
        <div className="flex min-h-screen bg-slate-900 text-white flex-col lg:flex-row">
            {!isPublic && <TopMobileHeader />}
            {!isPublic && <Navbar />}
            <main className={`flex-1 ${!isPublic ? "pb-24 lg:pb-0 font-sans" : "w-full h-screen overflow-hidden"}`}>
                <div className={`${!isPublic ? "container mx-auto px-4 py-8" : "w-full h-full"}`}>
                    <Routes>
                        <Route path="/" element={<AlumnosPage />} />
                        <Route path="/nuevo" element={<AlumnoFormPage />} />
                        <Route path="/editar/:id" element={<AlumnoFormPage />} />
                        <Route path="/finanzas" element={<FinanzasPage />} />
                        <Route path="/stock" element={<ProductosPage />} />
                        <Route path="/checkin" element={<CheckInPage />} />
                        <Route path="/mi-pase/:id" element={<PublicQRPage />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}

export default App;
