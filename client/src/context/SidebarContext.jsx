import { createContext, useContext, useState, useEffect } from "react";

const SidebarContext = createContext();

export const useSidebar = () => {
    const context = useContext(SidebarContext);
    if (!context) {
        throw new Error("useSidebar must be used within a SidebarProvider");
    }
    return context;
};

export const SidebarProvider = ({ children }) => {
    // Desktop: isExpanded (true = w-72 completo, false = w-20 colapsado con iconos)
    const [isExpanded, setIsExpanded] = useState(() => {
        try {
            const saved = localStorage.getItem("gb-sidebar-expanded");
            return saved !== null ? JSON.parse(saved) : true;
        } catch {
            return true;
        }
    });

    // Mobile: isMobileOpen (cajón abierto o cerrado)
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        try {
            localStorage.setItem("gb-sidebar-expanded", JSON.stringify(isExpanded));
        } catch (e) {
            console.error(e);
        }
    }, [isExpanded]);

    // Cerrar el cajón móvil automáticamente si la ventana se agranda a PC
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsMobileOpen(false);
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const toggleSidebar = () => {
        if (window.innerWidth >= 1024) {
            setIsExpanded(prev => !prev);
        } else {
            setIsMobileOpen(prev => !prev);
        }
    };

    const closeMobileSidebar = () => {
        setIsMobileOpen(false);
    };

    return (
        <SidebarContext.Provider
            value={{
                isExpanded,
                isMobileOpen,
                toggleSidebar,
                closeMobileSidebar,
                setIsExpanded,
                setIsMobileOpen
            }}
        >
            {children}
        </SidebarContext.Provider>
    );
};
