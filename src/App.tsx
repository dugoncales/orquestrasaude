import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { RequirePermission } from "@/components/auth/RequirePermission";
import DashboardRouter from "./pages/DashboardRouter";
import Pacientes from "./pages/Pacientes";
import PerfilPaciente from "./pages/PerfilPaciente";
import JornadaClinica from "./pages/JornadaClinica";
import LinhasDeCuidado from "./pages/LinhasDeCuidado";
import Consultas from "./pages/Consultas";
import Exames from "./pages/Exames";
import Questionarios from "./pages/Questionarios";
import BI from "./pages/BI";
import IAplanilhas from "./pages/IAplanilhas";
import EditorNoCode from "./pages/EditorNoCode";
import StudioAdmin from "./pages/StudioAdmin";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Forbidden from "./pages/Forbidden";
import { ROUTE_PERMISSIONS } from "@/config/permissions";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/forbidden" element={<Forbidden />} />

            {/* Private routes */}
            <Route
              path="/*"
              element={
                <RequireAuth>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<DashboardRouter />} />
                      <Route
                        path="/pacientes"
                        element={
                          <RequirePermission {...ROUTE_PERMISSIONS["/pacientes"]}>
                            <Pacientes />
                          </RequirePermission>
                        }
                      />
                      <Route
                        path="/pacientes/:id"
                        element={
                          <RequirePermission {...ROUTE_PERMISSIONS["/pacientes/:id"]}>
                            <PerfilPaciente />
                          </RequirePermission>
                        }
                      />
                      <Route
                        path="/jornadas"
                        element={
                          <RequirePermission {...ROUTE_PERMISSIONS["/jornadas"]}>
                            <JornadaClinica />
                          </RequirePermission>
                        }
                      />
                      <Route
                        path="/linhas-de-cuidado"
                        element={
                          <RequirePermission {...ROUTE_PERMISSIONS["/linhas-de-cuidado"]}>
                            <LinhasDeCuidado />
                          </RequirePermission>
                        }
                      />
                      <Route
                        path="/consultas"
                        element={
                          <RequirePermission {...ROUTE_PERMISSIONS["/consultas"]}>
                            <Consultas />
                          </RequirePermission>
                        }
                      />
                      <Route
                        path="/exames"
                        element={
                          <RequirePermission {...ROUTE_PERMISSIONS["/exames"]}>
                            <Exames />
                          </RequirePermission>
                        }
                      />
                      <Route
                        path="/questionarios"
                        element={
                          <RequirePermission {...ROUTE_PERMISSIONS["/questionarios"]}>
                            <Questionarios />
                          </RequirePermission>
                        }
                      />
                      <Route
                        path="/bi"
                        element={
                          <RequirePermission {...ROUTE_PERMISSIONS["/bi"]}>
                            <BI />
                          </RequirePermission>
                        }
                      />
                      <Route
                        path="/ia"
                        element={
                          <RequirePermission {...ROUTE_PERMISSIONS["/ia"]}>
                            <IAplanilhas />
                          </RequirePermission>
                        }
                      />
                      <Route
                        path="/editor"
                        element={
                          <RequirePermission {...ROUTE_PERMISSIONS["/editor"]}>
                            <EditorNoCode />
                          </RequirePermission>
                        }
                      />
                      <Route
                        path="/configuracoes"
                        element={
                          <RequirePermission {...ROUTE_PERMISSIONS["/configuracoes"]}>
                            <StudioAdmin />
                          </RequirePermission>
                        }
                      />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                </RequireAuth>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
