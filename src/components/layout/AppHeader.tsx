import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { Bell, ChevronDown, ChevronRight } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { UserRole } from '@/data/types';
import { mockAlerts } from '@/data/mock-data';

const roleLabels: Record<UserRole, string> = {
  patient: 'Paciente',
  professional: 'Profissional',
  manager: 'Gestor',
  admin: 'Administrador',
};

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/pacientes': 'Pacientes',
  '/jornadas': 'Jornadas',
  '/jornada-clinica': 'Jornada Clínica',
  '/linhas-de-cuidado': 'Linhas de Cuidado',
  '/consultas': 'Consultas',
  '/exames': 'Exames',
  '/questionarios': 'Questionários',
  '/bi': 'BI Assistencial',
  '/ia': 'IA de Planilhas',
  '/editor': 'Editor No-Code',
};

export function AppHeader() {
  const { currentUser, currentRole, setRole } = useAuth();
  const location = useLocation();
  const unreadAlerts = mockAlerts.filter(a => !a.lido).length;
  const hasCritical = mockAlerts.some(a => !a.lido && a.severidade === 'critical');

  const basePath = '/' + location.pathname.split('/').filter(Boolean)[0];
  const currentModule = routeLabels[location.pathname] || routeLabels[basePath] || '';

  const initials = currentUser.name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  return (
    <header className="h-14 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-xl px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground" />
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>HealthBit</span>
          {currentModule && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">{currentModule}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 text-xs h-8">
              <span className="status-chip status-scheduled">{roleLabels[currentRole]}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Trocar Perfil</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(Object.keys(roleLabels) as UserRole[]).map(role => (
              <DropdownMenuItem key={role} onClick={() => setRole(role)} className={role === currentRole ? 'bg-accent' : ''}>
                {roleLabels[role]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unreadAlerts > 0 && (
            <Badge className={`absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[9px] ${hasCritical ? 'animate-pulse bg-destructive' : ''}`}>
              {unreadAlerts}
            </Badge>
          )}
        </Button>

        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
            {initials}
          </div>
          <span className="text-xs text-foreground hidden md:inline">{currentUser.name}</span>
        </div>
      </div>
    </header>
  );
}
