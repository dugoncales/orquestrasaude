import { useAuth } from '@/contexts/AuthContext';
import DashboardPaciente from './DashboardPaciente';
import DashboardProfissional from './DashboardProfissional';
import DashboardGestor from './DashboardGestor';
import StudioAdmin from './StudioAdmin';

export default function DashboardRouter() {
  const { currentRole } = useAuth();
  switch (currentRole) {
    case 'patient': return <DashboardPaciente />;
    case 'professional': return <DashboardProfissional />;
    case 'manager': return <DashboardGestor />;
    case 'admin': return <StudioAdmin />;
  }
}
