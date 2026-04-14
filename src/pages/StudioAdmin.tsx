import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KPICard } from '@/components/shared/KPICard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield, Settings, FileText, Eye, Plus } from 'lucide-react';
import { StatusChip } from '@/components/shared/StatusChip';

const mockUsers = [
  { name: 'Dra. Ana Beatriz', email: 'ana@clinica.com', role: 'professional', status: 'ativo', lastAccess: '2025-04-14' },
  { name: 'Dr. Ricardo Mendes', email: 'ricardo@clinica.com', role: 'professional', status: 'ativo', lastAccess: '2025-04-14' },
  { name: 'Enf. Carla', email: 'carla@clinica.com', role: 'professional', status: 'ativo', lastAccess: '2025-04-13' },
  { name: 'Dr. Fernando Gestão', email: 'fernando@clinica.com', role: 'manager', status: 'ativo', lastAccess: '2025-04-12' },
  { name: 'Admin Sistema', email: 'admin@carejourney.com', role: 'admin', status: 'ativo', lastAccess: '2025-04-14' },
];

const mockAudit = [
  { date: '2025-04-14 10:32', user: 'Dra. Ana Beatriz', action: 'Atualizou parâmetros de Roberto Almeida Lima' },
  { date: '2025-04-14 09:15', user: 'Admin Sistema', action: 'Criou nova regra de automação: Diabetes fora da meta' },
  { date: '2025-04-13 16:45', user: 'Enf. Carla', action: 'Registrou busca ativa para Fernanda Costa Ribeiro' },
  { date: '2025-04-13 14:20', user: 'Dr. Fernando Gestão', action: 'Exportou relatório BI executivo' },
];

export default function StudioAdmin() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Studio Administrativo</h1>
        <p className="text-xs text-muted-foreground">Gestão de usuários, permissões e configurações</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard title="Usuários" value={5} icon={Users} />
        <KPICard title="Módulos Ativos" value={13} icon={Settings} />
        <KPICard title="Regras de Automação" value={5} icon={Shield} />
        <KPICard title="Registros Auditoria" value={248} icon={FileText} />
      </div>

      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
          <TabsTrigger value="config">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Novo Usuário</Button>
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead className="hidden md:table-cell">Último Acesso</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockUsers.map((u, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm font-medium">{u.name}</TableCell>
                    <TableCell className="text-sm hidden sm:table-cell">{u.email}</TableCell>
                    <TableCell><span className="status-chip status-scheduled text-[10px]">{u.role}</span></TableCell>
                    <TableCell className="text-sm hidden md:table-cell">{u.lastAccess}</TableCell>
                    <TableCell><StatusChip status="concluido" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAudit.map((a, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-sm font-mono">{a.date}</TableCell>
                    <TableCell className="text-sm font-medium">{a.user}</TableCell>
                    <TableCell className="text-sm">{a.action}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            {['Autenticação', 'Notificações', 'Integrações', 'Backup', 'LGPD', 'Aparência'].map(item => (
              <Card key={item} className="cursor-pointer hover:border-primary/30 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Settings className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{item}</span>
                  </div>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
