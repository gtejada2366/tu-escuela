import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Students } from "./pages/Students";
import { StudentProfile } from "./pages/StudentProfile";
import { Attendance } from "./pages/Attendance";
import { Payments } from "./pages/Payments";
import { Profesores } from "./pages/Profesores";
import { ProfesorProfile } from "./pages/ProfesorProfile";
import { ProfesorGestionAcademica } from "./pages/ProfesorGestionAcademica";
import { Grados } from "./pages/Grados";
import { Clases } from "./pages/Clases";
import { ClaseDetail } from "./pages/ClaseDetail";
import { Calificaciones } from "./pages/Calificaciones";
import { Mensajeria } from "./pages/Mensajeria";
import { Roles } from "./pages/Roles";
import { MiCuenta } from "./pages/MiCuenta";
import { Configuracion } from "./pages/Configuracion";
import { NotFound } from "./pages/NotFound";

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
      { path: "*", Component: NotFound },
    ],
  },
]);
