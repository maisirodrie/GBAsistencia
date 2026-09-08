import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import AlumnosPage from "./pages/AlumnosPage";
import AlumnoFormPage from "./pages/AlumnoFormPage";
import DashboardPage from "./pages/DashboardPage";
import FinanzasPage from "./pages/FinanzasPage";
import CheckInPage from "./pages/CheckInPage";
import AutoCheckInPage from "./pages/AutoCheckInPage";
import QRCartelPage from "./pages/QRCartelPage";
import PublicQRPage from "./pages/PublicQRPage";
import LoginPage from "./pages/LoginPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import UsersPage from "./pages/UsersPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { SidebarProvider } from "./context/SidebarContext";

function AppContent() {
    const location = useLocation();
    
    const isPublic = location.pathname === "/checkin" || 
                     location.pathname === "/asistencia" ||
                     location.pathname === "/cartel-qr" ||
                     location.pathname.startsWith("/mi-pase/") || 
                     location.pathname === "/login";

    if (isPublic) {
        return (
            <div className="min-h-screen bg-[#070b14] text-white font-sans">
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/checkin" element={<CheckInPage />} />
                    <Route path="/asistencia" element={<AutoCheckInPage />} />
                    <Route path="/cartel-qr" element={<QRCartelPage />} />
                    <Route path="/mi-pase/:id" element={<PublicQRPage />} />
                </Routes>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-[#070b14] text-white font-sans">
            {/* Sidebar (TailAdmin colapsable en PC y cajón deslizante en móvil) */}
            <Sidebar />

            {/* Content Area */}
            <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden">
                {/* Header (TailAdmin sticky top header con botón hamburguesa tanto en PC como en móvil) */}
                <Header />

                {/* Main Content */}
                <main className="flex-1">
                    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
                        <Routes>
                            <Route element={<ProtectedRoute />}>
                                <Route path="/" element={<DashboardPage />} />
                                <Route path="/alumnos" element={<AlumnosPage />} />
                                <Route path="/nuevo" element={<AlumnoFormPage />} />
                                <Route path="/editar/:id" element={<AlumnoFormPage />} />
                                <Route path="/finanzas" element={<FinanzasPage />} />
                                <Route path="/usuarios" element={<UsersPage />} />
                                <Route path="/perfil/cambiar-password" element={<ChangePasswordPage />} />
                            </Route>
                        </Routes>
                    </div>
                </main>
            </div>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
                <SidebarProvider>
                    <AppContent />
                </SidebarProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
