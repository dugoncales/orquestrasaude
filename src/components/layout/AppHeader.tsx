import { useAuth } from '@/contexts/AuthContext';
import { Bell, ChevronDown, User } from 'lucide-react';
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

export function AppHeader() {
  const { currentUser, currentRole, setRole } = useAuth();
  const unreadAlerts = mockAlerts.filter(a => !a.lido).length;

  return (
    <header className="h-14 flex items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="text-muted-foreground" />
        <span className="text-xs text-muted-foreground hidden sm:inline">CareJourney One</span>
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
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[9px]">
              {unreadAlerts}
            </Badge>
          )}
        </Button>

        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="text-xs text-foreground hidden md:inline">{currentUser.name}</span>
        </div>
      </div>
    </header>
  );
}
