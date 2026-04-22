import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardPaciente from './DashboardPaciente';
import DashboardProfissional from './DashboardProfissional';
import DashboardGestor from './DashboardGestor';
import StudioAdmin from './StudioAdmin';

export default function DashboardRouter() {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!role) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Aguardando atribuição de perfil</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Sua conta foi criada, mas ainda não tem um perfil clínico atribuído.
            Um administrador precisa liberar seu acesso. Tente novamente em instantes.
          </CardContent>
        </Card>
      </div>
    );
  }

  switch (role) {
    case 'patient': return <DashboardPaciente />;
    case 'professional': return <DashboardProfissional />;
    case 'manager': return <DashboardGestor />;
    case 'admin': return <StudioAdmin />;
  }
}
