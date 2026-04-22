import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { Bell, ChevronDown, ChevronRight, LogOut, User as UserIcon } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { UserRole } from '@/data/types';
import { useAlerts } from '@/hooks/useAlerts';
import { APP_NAME, ENABLE_ROLE_SWITCHER } from '@/config/app';
import { toast } from '@/hooks/use-toast';

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
  const { currentUser, currentRole, setRole, signOut } = useAuth();
  const location = useLocation();
  const { data: alerts } = useAlerts();
  const safeAlerts = alerts || [];
  const unreadAlerts = safeAlerts.filter(a => !a.lido).length;
  const hasCritical = safeAlerts.some(a => !a.lido && a.severidade === 'critical');

  const basePath = '/' + location.pathname.split('/').filter(Boolean)[0];
  const currentModule = routeLabels[location.pathname] || routeLabels[basePath] || '';

  const initials = currentUser.name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    toast({ title: 'Sessão encerrada' });
  };

  return (
    <header className="h-14 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-xl px-4">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground" />
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>{APP_NAME}</span>
          {currentModule && (
            <>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">{currentModule}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {ENABLE_ROLE_SWITCHER && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 text-xs h-8">
                <span className="status-chip status-scheduled">{roleLabels[currentRole]}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Trocar Perfil (dev)</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(roleLabels) as UserRole[]).map(role => (
                <DropdownMenuItem key={role} onClick={() => setRole(role)} className={role === currentRole ? 'bg-accent' : ''}>
                  {roleLabels[role]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {!ENABLE_ROLE_SWITCHER && (
          <Badge variant="secondary" className="text-[10px] h-6 hidden sm:inline-flex">
            {roleLabels[currentRole]}
          </Badge>
        )}

        <Button variant="ghost" size="icon" className="relative h-8 w-8" aria-label="Notificações">
          <Bell className="h-4 w-4" />
          {unreadAlerts > 0 && (
            <Badge className={`absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[9px] ${hasCritical ? 'animate-pulse bg-destructive' : ''}`}>
              {unreadAlerts}
            </Badge>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 hover:bg-accent/50 rounded-full pr-2 pl-0.5 py-0.5 transition-colors" aria-label="Menu do usuário">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                {initials}
              </div>
              <span className="text-xs text-foreground hidden md:inline">{currentUser.name}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground hidden md:inline" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">{currentUser.name}</span>
                <span className="text-[11px] text-muted-foreground font-normal">{currentUser.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <UserIcon className="h-3.5 w-3.5 mr-2" />
              Meu perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="h-3.5 w-3.5 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
