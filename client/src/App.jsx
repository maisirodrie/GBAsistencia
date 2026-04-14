import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Header from "./components/Header";
import AlumnosPage from "./pages/AlumnosPage";
import AlumnoFormPage from "./pages/AlumnoFormPage";
import FinanzasPage from "./pages/FinanzasPage";
import ProductosPage from "./pages/ProductosPage";
import CheckInPage from "./pages/CheckInPage";
import PublicQRPage from "./pages/PublicQRPage";
import LoginPage from "./pages/LoginPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import UsersPage from "./pages/UsersPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

function AppContent() {
    const location = useLocation();
    const isPublic = location.pathname === "/checkin" || 
                     location.pathname.startsWith("/mi-pase/") || 
                     location.pathname === "/login";

    return (
        <div className="flex min-h-screen bg-slate-900 text-white flex-col lg:flex-row font-sans">
            {!isPublic && <Header />}
            {!isPublic && <Navbar />}
            <main className={`flex-1 ${!isPublic ? "pt-44 sm:pt-48 lg:pt-20 pb-28 sm:pb-32 lg:pb-0" : "w-full h-screen overflow-hidden"}`}>
                <div className={`${!isPublic ? "container mx-auto px-4 py-8" : "w-full h-full"}`}>
                    <Routes>
                        {/* Rutas Públicas */}
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/checkin" element={<CheckInPage />} />
                        <Route path="/mi-pase/:id" element={<PublicQRPage />} />

                        {/* Rutas Protegidas */}
                        <Route element={<ProtectedRoute />}>
                            <Route path="/" element={<AlumnosPage />} />
                            <Route path="/nuevo" element={<AlumnoFormPage />} />
                            <Route path="/editar/:id" element={<AlumnoFormPage />} />
                            <Route path="/finanzas" element={<FinanzasPage />} />
                            <Route path="/stock" element={<ProductosPage />} />
                            <Route path="/usuarios" element={<UsersPage />} />
                            <Route path="/perfil/cambiar-password" element={<ChangePasswordPage />} />
                        </Route>
                    </Routes>
                </div>
            </main>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
