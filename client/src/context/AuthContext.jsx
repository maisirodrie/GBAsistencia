import { createContext, useState, useContext, useEffect } from "react";
import { 
    loginRequest, 
    verifyTokenRequest, 
    logoutRequest, 
    registerRequest,
    changePasswordRequest 
} from "../api/auth";
import Cookies from "js-cookie";

export const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(true);

    const signup = async (user) => {
        try {
            const res = await registerRequest(user);
            console.log(res.data);
            return res.data;
        } catch (error) {
            setErrors(error.response.data);
            throw error;
        }
    };

    const signin = async (user) => {
        try {
            const res = await loginRequest(user);
            if (res.data.token) {
                localStorage.setItem('token', res.data.token);
            }
            setUser(res.data);
            setIsAuthenticated(true);
        } catch (error) {
            console.log(error);
            if (error.response?.data) {
                if (Array.isArray(error.response.data)) {
                    return setErrors(error.response.data);
                }
                if (error.response.data.message) {
                    return setErrors([error.response.data.message]);
                }
            }
            setErrors(["Error al conectar con el servidor locally. Verifica que el backend esté corriendo."]);
        }
    };

    const logout = async () => {
        await logoutRequest();
        Cookies.remove("token");
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        setUser(null);
    };

    const changePassword = async (data) => {
        try {
            const res = await changePasswordRequest(data);
            return res.data;
        } catch (error) {
            setErrors([error.response.data.message]);
            throw error;
        }
    }

    useEffect(() => {
        if (errors.length > 0) {
            const timer = setTimeout(() => {
                setErrors([]);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [errors]);

    useEffect(() => {
        async function checkLogin() {
            try {
                // No revisamos cookies.token aquí porque es HttpOnly y no es visible para JS.
                // Simplemente le preguntamos al servidor si hay una sesión válida.
                const res = await verifyTokenRequest();
                
                if (!res.data) {
                    setIsAuthenticated(false);
                    setLoading(false);
                    setUser(null);
                    return;
                }

                if (res.data.token) {
                    localStorage.setItem('token', res.data.token);
                }

                setIsAuthenticated(true);
                setUser(res.data);
                setLoading(false);
            } catch (error) {
                console.log("Sesión no encontrada o expirada");
                setIsAuthenticated(false);
                setUser(null);
                setLoading(false);
            }
        }
        checkLogin();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                signup,
                signin,
                logout,
                changePassword,
                loading,
                user,
                isAuthenticated,
                errors,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
