import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Users, Route, GitBranch, Calendar, FlaskConical,
  ClipboardList, BarChart3, Brain, Blocks, Shield, ScrollText, Bell,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { APP_NAME, APP_VERSION, APP_TAGLINE } from '@/config/app';

interface NavItem {
  title: string;
  url: string;
  icon: any;
  group: 'core' | 'analysis' | 'admin';
}

const menuByRole: Record<string, NavItem[]> = {
  patient: [
    { title: 'Meu Painel', url: '/', icon: LayoutDashboard, group: 'core' },
    { title: 'Minhas Consultas', url: '/consultas', icon: Calendar, group: 'core' },
    { title: 'Meus Exames', url: '/exames', icon: FlaskConical, group: 'core' },
    { title: 'Questionários', url: '/questionarios', icon: ClipboardList, group: 'core' },
  ],
  professional: [
    { title: 'Dashboard', url: '/', icon: LayoutDashboard, group: 'core' },
    { title: 'Pacientes', url: '/pacientes', icon: Users, group: 'core' },
    { title: 'Jornadas', url: '/jornadas', icon: Route, group: 'core' },
    { title: 'Linhas de Cuidado', url: '/linhas-de-cuidado', icon: GitBranch, group: 'core' },
    { title: 'Consultas', url: '/consultas', icon: Calendar, group: 'core' },
    { title: 'Exames', url: '/exames', icon: FlaskConical, group: 'core' },
    { title: 'Questionários', url: '/questionarios', icon: ClipboardList, group: 'core' },
    { title: 'BI Assistencial', url: '/bi', icon: BarChart3, group: 'analysis' },
    { title: 'IA de Planilhas', url: '/ia', icon: Brain, group: 'analysis' },
  ],
  manager: [
    { title: 'Dashboard', url: '/', icon: LayoutDashboard, group: 'core' },
    { title: 'Pacientes', url: '/pacientes', icon: Users, group: 'core' },
    { title: 'Linhas de Cuidado', url: '/linhas-de-cuidado', icon: GitBranch, group: 'core' },
    { title: 'BI Assistencial', url: '/bi', icon: BarChart3, group: 'analysis' },
    { title: 'IA de Planilhas', url: '/ia', icon: Brain, group: 'analysis' },
    { title: 'Auditoria', url: '/auditoria', icon: ScrollText, group: 'admin' },
  ],
  admin: [
    { title: 'Studio', url: '/', icon: Shield, group: 'admin' },
    { title: 'Pacientes', url: '/pacientes', icon: Users, group: 'core' },
    { title: 'Linhas de Cuidado', url: '/linhas-de-cuidado', icon: GitBranch, group: 'core' },
    { title: 'Editor No-Code', url: '/editor', icon: Blocks, group: 'admin' },
    { title: 'Auditoria', url: '/auditoria', icon: ScrollText, group: 'admin' },
    { title: 'BI Assistencial', url: '/bi', icon: BarChart3, group: 'analysis' },
  ],
};

const groupLabels: Record<string, string> = {
  core: 'Clínico',
  analysis: 'Análise',
  admin: 'Administração',
};

export function AppSidebar() {
  const { currentRole } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const items = menuByRole[currentRole];

  const groups = ['core', 'analysis', 'admin'].filter(g => items.some(i => i.group === g));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Route className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground">{APP_NAME}</h1>
              <p className="text-[10px] text-muted-foreground">{APP_TAGLINE} · {APP_VERSION}</p>
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
        {groups.map((group, gi) => (
          <SidebarGroup key={group}>
            {gi > 0 && !collapsed && <Separator className="mb-2 bg-sidebar-border" />}
            <SidebarGroupLabel>{groupLabels[group]}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.filter(i => i.group === group).map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === '/'}
                        className="hover:bg-accent/50 border-l-2 border-transparent"
                        activeClassName="bg-accent text-accent-foreground font-medium !border-l-2 !border-primary"
                      >
                        <item.icon className="mr-2 h-[18px] w-[18px]" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      {!collapsed && (
        <SidebarFooter className="p-4 pt-0">
          <p className="text-[10px] text-muted-foreground text-center">{APP_NAME} · {APP_VERSION}</p>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
