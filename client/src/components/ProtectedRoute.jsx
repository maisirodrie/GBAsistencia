import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
    const { isAuthenticated, loading, user } = useAuth();

    if (loading) return <h1>Cargando...</h1>;
    if (!loading && !isAuthenticated) return <Navigate to="/login" replace />;

    // Si el usuario DEBE cambiar su contraseña y no está en la página de cambio de contraseña
    if (user?.mustChangePassword && window.location.pathname !== '/perfil/cambiar-password') {
        return <Navigate to="/perfil/cambiar-password" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
