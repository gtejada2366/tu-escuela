import { useState, useRef, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  FileText,
  CreditCard,
  Search,
  Bell,
  ChevronDown,
  Building2,
  MessageCircle,
  Menu,
  X,
  Shield,
  LogOut,
  UserCircle,
  Settings,
  Layers,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useSchoolConfig } from "../contexts/SchoolConfigContext";
import { useNotifications } from "../hooks/useNotifications";
import { Heart } from "lucide-react";

const allMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", roles: ["director", "profesor"] },
  { icon: Users, label: "Estudiantes", path: "/estudiantes", roles: ["director"] },
  { icon: GraduationCap, label: "Profesores", path: "/profesores", roles: ["director"] },
  { icon: Layers, label: "Grados", path: "/grados", roles: ["director", "profesor"] },
  { icon: BookOpen, label: "Clases", path: "/clases", roles: ["director", "profesor"] },
  { icon: ClipboardCheck, label: "Asistencia", path: "/asistencia", roles: ["director", "profesor"] },
  { icon: FileText, label: "Calificaciones", path: "/calificaciones", roles: ["director", "profesor"] },
  { icon: CreditCard, label: "Pagos", path: "/pagos", roles: ["director"] },
  { icon: MessageCircle, label: "Mensajería", path: "/mensajeria", roles: ["director", "profesor"] },
  { icon: Shield, label: "Roles", path: "/roles", roles: ["director"] },
  { icon: Settings, label: "Configuración", path: "/configuracion", roles: ["director"] },
  { icon: Heart, label: "Mis Hijos", path: "/mis-hijos", roles: ["padre"] },
  { icon: UserCircle, label: "Mi Cuenta", path: "/mi-cuenta", roles: ["director", "profesor", "padre"] },
];

const sedeOptions = ["Sede Principal", "Sede Norte", "Sede Sur"];

// Notifications are now loaded from useNotifications hook

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { schoolName, logoUrl } = useSchoolConfig();
  const { notifications, unreadCount, markAsRead, markAllAsRead, getTimeAgo } = useNotifications(user?.uid);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Sede dropdown state
  const [sedeOpen, setSedeOpen] = useState(false);
  const [selectedSede, setSelectedSede] = useState("Sede Principal");

  // Notifications state
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const role = user?.role ?? "director";
  const menuItems = allMenuItems.filter((item) => item.roles.includes(role));

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  // Redirect if accessing a page not allowed by role
  useEffect(() => {
    // Parents should go to /mis-hijos instead of /
    if (role === "padre" && location.pathname === "/") {
      navigate("/mis-hijos", { replace: true });
      return;
    }
    const currentItem = allMenuItems.find((item) =>
      item.path === "/" ? location.pathname === "/" : location.pathname.startsWith(item.path)
    );
    if (currentItem && !currentItem.roles.includes(role)) {
      navigate(role === "padre" ? "/mis-hijos" : "/", { replace: true });
    }
  }, [location.pathname, role, navigate]);

  const filteredMenuItems = searchQuery.trim()
    ? menuItems.filter((item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filteredMenuItems.length > 0) {
      navigate(filteredMenuItems[0].path);
      setSearchQuery("");
      setShowSearchResults(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSearchResults(value.trim().length > 0);
  };

  const handleSearchResultClick = (path: string) => {
    navigate(path);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const handleNotificationsToggle = () => {
    setNotificationsOpen((prev) => !prev);
  };

  const roleLabelMap: Record<string, string> = { director: "Director", profesor: "Profesor", padre: "Padre/Apoderado" };

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo del colegio" className="w-8 h-8 rounded-lg object-cover shrink-0" />
          ) : null}
          <h1 className="text-xl text-[#2563eb] font-semibold truncate">{schoolName}</h1>
        </div>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        {menuItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                active
                  ? "bg-[#eff6ff] text-[#2563eb]"
                  : "text-[#64748b] hover:bg-[#f8fafc]"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2">
          <Link
            to="/mi-cuenta"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-full bg-[#eff6ff] flex items-center justify-center shrink-0">
              <span className="text-sm text-[#2563eb]">{user?.avatar ?? "?"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#1e293b] truncate">{user?.name ?? "Usuario"}</p>
              <p className="text-xs text-[#64748b]">{roleLabelMap[role]}</p>
            </div>
          </Link>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg hover:bg-[#fee2e2] transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4 text-[#64748b] hover:text-[#dc2626]" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#f8f9fb]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-[#2563eb] focus:text-white focus:rounded-lg focus:text-sm"
      >
        Ir al contenido principal
      </a>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-border flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú de navegación">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 h-full w-64 bg-white flex flex-col z-50">
            <div className="absolute top-4 right-4">
              <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-[#f8fafc] rounded-lg" aria-label="Cerrar menú">
                <X className="w-5 h-5 text-[#64748b]" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-border px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 lg:gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-[#f8fafc] transition-colors"
                aria-label="Abrir menú"
              >
                <Menu className="w-5 h-5 text-[#64748b]" />
              </button>

              {/* Sede Dropdown */}
              <div className="relative hidden md:block">
                <button
                  onClick={() => setSedeOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-white hover:bg-[#f8fafc] transition-colors"
                >
                  <Building2 className="w-4 h-4 text-[#64748b]" />
                  <span className="text-sm text-[#1e293b]">{selectedSede}</span>
                  <ChevronDown className="w-4 h-4 text-[#64748b]" />
                </button>

                {sedeOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setSedeOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-border rounded-lg shadow-lg z-20 py-1">
                      {sedeOptions.map((sede) => (
                        <button
                          key={sede}
                          onClick={() => {
                            setSelectedSede(sede);
                            setSedeOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            selectedSede === sede
                              ? "bg-[#eff6ff] text-[#2563eb]"
                              : "text-[#1e293b] hover:bg-[#f8fafc]"
                          }`}
                        >
                          {sede}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Search Input with Dropdown */}
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar módulos..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => {
                    if (searchQuery.trim().length > 0) setShowSearchResults(true);
                  }}
                  className="w-48 md:w-72 lg:w-96 pl-10 pr-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
                />

                {showSearchResults && filteredMenuItems.length > 0 && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowSearchResults(false)}
                    />
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-border rounded-lg shadow-lg z-20 py-1">
                      {filteredMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.path}
                            onClick={() => handleSearchResultClick(item.path)}
                            className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-[#1e293b] hover:bg-[#f8fafc] transition-colors"
                          >
                            <Icon className="w-4 h-4 text-[#64748b]" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 lg:gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-[#eff6ff] text-sm text-[#2563eb]">
                  Año {new Date().getFullYear()}
                </span>
                <span className={`px-3 py-1.5 rounded-lg text-sm ${role === "director" ? "bg-[#eff6ff] text-[#2563eb]" : "bg-[#ecfdf5] text-[#10b981]"}`}>
                  {roleLabelMap[role]}
                </span>
              </div>

              {/* Notification Bell with Dropdown */}
              <div className="relative">
                <button
                  onClick={handleNotificationsToggle}
                  className="relative p-2 rounded-lg hover:bg-[#f8fafc] transition-colors"
                  aria-label="Notificaciones"
                >
                  <Bell className="w-5 h-5 text-[#64748b]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-[#dc2626] text-white text-[10px] font-bold rounded-full px-1">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setNotificationsOpen(false)}
                    />
                    <div className="absolute top-full right-0 mt-1 w-80 bg-white border border-border rounded-lg shadow-lg z-20">
                      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-[#1e293b]">Notificaciones</h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllAsRead()}
                            className="text-xs text-[#2563eb] hover:underline"
                          >
                            Marcar todas leídas
                          </button>
                        )}
                      </div>
                      <div className="py-1 max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-6 text-center">
                            <p className="text-sm text-[#94a3b8]">Sin notificaciones</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              onClick={() => {
                                if (!notification.isRead) markAsRead(notification.id);
                                if (notification.link) {
                                  navigate(notification.link);
                                  setNotificationsOpen(false);
                                }
                              }}
                              className={`px-4 py-3 hover:bg-[#f8fafc] transition-colors cursor-pointer border-b border-border last:border-b-0 ${
                                notification.isRead ? "opacity-60" : ""
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {!notification.isRead && (
                                  <span className="mt-1.5 w-2 h-2 bg-[#2563eb] rounded-full shrink-0"></span>
                                )}
                                <div className={!notification.isRead ? "" : "pl-4"}>
                                  <p className="text-sm text-[#1e293b]">{notification.title}</p>
                                  <p className="text-xs text-[#64748b] mt-0.5">{notification.description}</p>
                                  <p className="text-xs text-[#94a3b8] mt-1">{getTimeAgo(notification.createdAt)}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="w-9 h-9 rounded-full bg-[#eff6ff] flex items-center justify-center">
                <span className="text-sm text-[#2563eb]">{user?.avatar ?? "?"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main id="main-content" className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
