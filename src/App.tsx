import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<DashboardRouter />} />
              <Route path="/pacientes" element={<Pacientes />} />
              <Route path="/pacientes/:id" element={<PerfilPaciente />} />
              <Route path="/jornadas" element={<JornadaClinica />} />
              <Route path="/linhas-de-cuidado" element={<LinhasDeCuidado />} />
              <Route path="/consultas" element={<Consultas />} />
              <Route path="/exames" element={<Exames />} />
              <Route path="/questionarios" element={<Questionarios />} />
              <Route path="/bi" element={<BI />} />
              <Route path="/ia" element={<IAplanilhas />} />
              <Route path="/editor" element={<EditorNoCode />} />
              <Route path="/configuracoes" element={<StudioAdmin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
