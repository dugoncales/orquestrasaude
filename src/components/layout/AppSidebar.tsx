import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Users, Route, GitBranch, Calendar, FlaskConical,
  ClipboardList, BarChart3, Brain, Blocks, Settings, Shield
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar,
} from '@/components/ui/sidebar';

const menuByRole = {
  patient: [
    { title: 'Meu Painel', url: '/', icon: LayoutDashboard },
    { title: 'Minhas Consultas', url: '/consultas', icon: Calendar },
    { title: 'Meus Exames', url: '/exames', icon: FlaskConical },
    { title: 'Questionários', url: '/questionarios', icon: ClipboardList },
  ],
  professional: [
    { title: 'Dashboard', url: '/', icon: LayoutDashboard },
    { title: 'Pacientes', url: '/pacientes', icon: Users },
    { title: 'Jornadas', url: '/jornadas', icon: Route },
    { title: 'Linhas de Cuidado', url: '/linhas-de-cuidado', icon: GitBranch },
    { title: 'Consultas', url: '/consultas', icon: Calendar },
    { title: 'Exames', url: '/exames', icon: FlaskConical },
    { title: 'Questionários', url: '/questionarios', icon: ClipboardList },
    { title: 'BI Assistencial', url: '/bi', icon: BarChart3 },
    { title: 'IA de Planilhas', url: '/ia', icon: Brain },
  ],
  manager: [
    { title: 'Dashboard', url: '/', icon: LayoutDashboard },
    { title: 'Pacientes', url: '/pacientes', icon: Users },
    { title: 'Linhas de Cuidado', url: '/linhas-de-cuidado', icon: GitBranch },
    { title: 'BI Assistencial', url: '/bi', icon: BarChart3 },
    { title: 'IA de Planilhas', url: '/ia', icon: Brain },
  ],
  admin: [
    { title: 'Studio', url: '/', icon: Shield },
    { title: 'Pacientes', url: '/pacientes', icon: Users },
    { title: 'Linhas de Cuidado', url: '/linhas-de-cuidado', icon: GitBranch },
    { title: 'Editor No-Code', url: '/editor', icon: Blocks },
    { title: 'BI Assistencial', url: '/bi', icon: BarChart3 },
    { title: 'Configurações', url: '/configuracoes', icon: Settings },
  ],
};

export function AppSidebar() {
  const { currentRole } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const items = menuByRole[currentRole];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Route className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground">CareJourney</h1>
              <p className="text-[10px] text-muted-foreground">One 3.0</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Route className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === '/'} className="hover:bg-accent/50" activeClassName="bg-accent text-accent-foreground font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
