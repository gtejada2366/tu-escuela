import { lazy } from "react";
import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";

const Dashboard = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const Students = lazy(() => import("./pages/Students").then(m => ({ default: m.Students })));
const StudentProfile = lazy(() => import("./pages/StudentProfile").then(m => ({ default: m.StudentProfile })));
const Attendance = lazy(() => import("./pages/Attendance").then(m => ({ default: m.Attendance })));
const Payments = lazy(() => import("./pages/Payments").then(m => ({ default: m.Payments })));
const Profesores = lazy(() => import("./pages/Profesores").then(m => ({ default: m.Profesores })));
const ProfesorProfile = lazy(() => import("./pages/ProfesorProfile").then(m => ({ default: m.ProfesorProfile })));
const ProfesorGestionAcademica = lazy(() => import("./pages/ProfesorGestionAcademica").then(m => ({ default: m.ProfesorGestionAcademica })));
const Grados = lazy(() => import("./pages/Grados").then(m => ({ default: m.Grados })));
const Clases = lazy(() => import("./pages/Clases").then(m => ({ default: m.Clases })));
const ClaseDetail = lazy(() => import("./pages/ClaseDetail").then(m => ({ default: m.ClaseDetail })));
const Calificaciones = lazy(() => import("./pages/Calificaciones").then(m => ({ default: m.Calificaciones })));
const Mensajeria = lazy(() => import("./pages/Mensajeria").then(m => ({ default: m.Mensajeria })));
const Roles = lazy(() => import("./pages/Roles").then(m => ({ default: m.Roles })));
const MiCuenta = lazy(() => import("./pages/MiCuenta").then(m => ({ default: m.MiCuenta })));
const Configuracion = lazy(() => import("./pages/Configuracion").then(m => ({ default: m.Configuracion })));
const MisHijos = lazy(() => import("./pages/MisHijos").then(m => ({ default: m.MisHijos })));
const HijoDetalle = lazy(() => import("./pages/HijoDetalle").then(m => ({ default: m.HijoDetalle })));
const NotFound = lazy(() => import("./pages/NotFound").then(m => ({ default: m.NotFound })));

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "estudiantes", Component: Students },
      { path: "estudiantes/:id", Component: StudentProfile },
      { path: "profesores", Component: Profesores },
      { path: "profesores/:id", Component: ProfesorProfile },
      { path: "profesores/:id/gestion", Component: ProfesorGestionAcademica },
      { path: "grados", Component: Grados },
      { path: "clases", Component: Clases },
      { path: "clases/:id", Component: ClaseDetail },
      { path: "asistencia", Component: Attendance },
      { path: "calificaciones", Component: Calificaciones },
      { path: "pagos", Component: Payments },
      { path: "mensajeria", Component: Mensajeria },
      { path: "roles", Component: Roles },
      { path: "mi-cuenta", Component: MiCuenta },
      { path: "configuracion", Component: Configuracion },
      { path: "mis-hijos", Component: MisHijos },
      { path: "mis-hijos/:id", Component: HijoDetalle },
      { path: "*", Component: NotFound },
    ],
  },
]);
