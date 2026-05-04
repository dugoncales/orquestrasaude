import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KPICard } from '@/components/shared/KPICard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Users, Plus, Check, X, GripVertical,
  GitBranch, FlaskConical, ClipboardList, Zap, Activity,
  Heart, Scale, Droplets, Brain, Wind
} from 'lucide-react';
import { StatusChip } from '@/components/shared/StatusChip';
import { TeamManagement } from '@/components/admin/TeamManagement';
import { InviteUserDialog } from '@/components/dialogs/InviteUserDialog';
import { useCareLines } from '@/hooks/useCareLines';
import { useAutomationRules } from '@/hooks/useAutomationRules';
import { useTeamMembers, useSetUserRole } from '@/hooks/useTeamMembers';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { useAuth } from '@/contexts/AuthContext';
import { mapCareLine } from '@/lib/db-helpers';
import { parameterDictionary } from '@/data/parameters';
import { toast } from 'sonner';

const iconMap: Record<string, any> = { Activity, Heart, Scale, Droplets, Brain, Wind };

const mockPermissionsMatrix: Record<string, Record<string, boolean>> = {
  admin: { Dashboard: true, Pacientes: true, Jornadas: true, 'Linhas de Cuidado': true, Consultas: true, Exames: true, Questionários: true, BI: true, IA: true, Studio: true, Editor: true },
  manager: { Dashboard: true, Pacientes: true, Jornadas: true, 'Linhas de Cuidado': true, Consultas: true, Exames: true, Questionários: true, BI: true, IA: true, Studio: false, Editor: false },
  professional: { Dashboard: true, Pacientes: true, Jornadas: true, 'Linhas de Cuidado': true, Consultas: true, Exames: true, Questionários: true, BI: false, IA: false, Studio: false, Editor: false },
  patient: { Dashboard: true, Pacientes: false, Jornadas: false, 'Linhas de Cuidado': false, Consultas: false, Exames: false, Questionários: true, BI: false, IA: false, Studio: false, Editor: false },
};

const defaultSteps = [
  { name: 'Elegibilidade', sla: 2, responsavel: 'Enfermeiro' },
  { name: 'Inclusão na Linha', sla: 1, responsavel: 'Enfermeiro' },
  { name: 'Avaliação Inicial', sla: 5, responsavel: 'Médico' },
  { name: 'Estratificação de Risco', sla: 3, responsavel: 'Médico' },
  { name: 'Plano Terapêutico', sla: 5, responsavel: 'Equipe Multiprofissional' },
  { name: 'Seguimento Multiprofissional', sla: 30, responsavel: 'Equipe Multiprofissional' },
  { name: 'Coleta PROMs/PREMs', sla: 7, responsavel: 'Enfermeiro' },
  { name: 'Reavaliação', sla: 15, responsavel: 'Médico' },
  { name: 'Manutenção ou Intensificação', sla: 10, responsavel: 'Médico' },
  { name: 'Alta ou Monitoramento', sla: 5, responsavel: 'Médico' },
];

const roleBadgeColor: Record<string, string> = {
  admin: 'bg-destructive/20 text-destructive border-destructive/30',
  manager: 'bg-primary/20 text-primary border-primary/30',
  professional: 'bg-accent/40 text-accent-foreground border-accent/30',
  patient: 'bg-muted text-muted-foreground border-border',
};
const roleLabel: Record<string, string> = { admin: 'Admin', manager: 'Gestor', professional: 'Profissional', patient: 'Paciente' };

const groupColors: Record<string, string> = {
  laboratorial: 'bg-primary/20 text-primary',
  medidas: 'bg-accent/40 text-accent-foreground',
  sinais_vitais: 'bg-destructive/20 text-destructive',
  questionario: 'bg-muted text-muted-foreground',
  alerta: 'bg-destructive/20 text-destructive',
  uso_clinico: 'bg-accent/40 text-accent-foreground',
  eventos: 'bg-muted text-muted-foreground',
  avaliacao: 'bg-primary/20 text-primary',
};

const modules = ['Dashboard', 'Pacientes', 'Jornadas', 'Linhas de Cuidado', 'Consultas', 'Exames', 'Questionários', 'BI', 'IA', 'Studio', 'Editor'];
const roles = ['admin', 'manager', 'professional', 'patient'];

export default function StudioAdmin() {
  const { roles: myRoles } = useAuth();
  const isAdmin = myRoles.includes('admin');
  const { data: careLinesData, isLoading: loadingCL } = useCareLines();
  const { data: automationRulesData, isLoading: loadingAR } = useAutomationRules();
  const { data: teamMembers, isLoading: loadingTM } = useTeamMembers();
  const { data: auditLogs, isLoading: loadingAudit } = useAuditLogs({ limit: 200 });
  const setRoleMut = useSetUserRole();
  const [paramGroupFilter, setParamGroupFilter] = useState<string>('todos');
  const [expandedLine, setExpandedLine] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const careLines = (careLinesData || []).map(mapCareLine);
  const automationRules = (automationRulesData || []).map(r => ({
    id: r.id,
    name: r.name,
    condition: r.condition,
    actions: r.actions || [],
    active: r.active ?? true,
    careLineId: r.care_line_id,
  }));

  const paramGroups = ['todos', ...Array.from(new Set(parameterDictionary.map(p => p.group)))];
  const filteredParams = paramGroupFilter === 'todos' ? parameterDictionary : parameterDictionary.filter(p => p.group === paramGroupFilter);

  const toggleRole = async (userId: string, role: 'admin' | 'manager' | 'professional' | 'patient', has: boolean) => {
    try {
      await setRoleMut.mutateAsync({ userId, role, enabled: !has });
      toast.success('Papel atualizado');
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao alterar papel');
    }
  };

  if (loadingCL || loadingAR) return <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-60 w-full" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">HealthBit Studio</h1>
        <p className="text-xs text-muted-foreground">Configuração e administração da plataforma</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard title="Usuários Ativos" value={(teamMembers || []).length} icon={Users} accentColor="primary" />
        <KPICard title="Linhas de Cuidado" value={careLines.length} icon={GitBranch} accentColor="info" />
        <KPICard title="Regras de Automação" value={automationRules.length} icon={Zap} accentColor="warning" />
        <KPICard title="Parâmetros Clínicos" value={parameterDictionary.length} icon={FlaskConical} accentColor="success" />
      </div>

      <Tabs defaultValue="users">
        <ScrollArea className="w-full">
          <TabsList className="w-max">
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="team">Equipe</TabsTrigger>
            <TabsTrigger value="permissions">Permissões</TabsTrigger>
            <TabsTrigger value="carelines">Linhas de Cuidado</TabsTrigger>
            <TabsTrigger value="steps">Etapas</TabsTrigger>
            <TabsTrigger value="params">Parâmetros</TabsTrigger>
            <TabsTrigger value="questionnaires">Questionários</TabsTrigger>
            <TabsTrigger value="automations">Automações</TabsTrigger>
            <TabsTrigger value="audit">Auditoria</TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="users" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button size="sm" className="gap-1" disabled={!isAdmin} onClick={() => setInviteOpen(true)}>
              <Plus className="h-4 w-4" /> Convidar Usuário
            </Button>
          </div>
          {!isAdmin && (
            <p className="text-xs text-muted-foreground mb-3">
              Você está vendo apenas seu próprio perfil. Apenas administradores listam todos os usuários.
            </p>
          )}
          {loadingTM ? <Skeleton className="h-40 w-full" /> : (
            <div className="rounded-xl border border-border overflow-hidden">
              <Table className="table-premium">
                <TableHeader><TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Papéis</TableHead>
                  <TableHead className="hidden md:table-cell">Criado em</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(teamMembers || []).length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-6">Nenhum usuário encontrado</TableCell></TableRow>
                  ) : (teamMembers || []).map((u) => {
                    const name = u.full_name || u.email || u.id.slice(0, 8);
                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                              {name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                            </div>
                            <span className="text-sm font-medium">{name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm hidden sm:table-cell text-muted-foreground">{u.email || '—'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {u.roles.length === 0 && <span className="text-[10px] text-muted-foreground">Sem papel</span>}
                            {u.roles.map(r => (
                              <span key={r} className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${roleBadgeColor[r]}`}>
                                {roleLabel[r]}
                              </span>
                            ))}
                          </div>
                          {isAdmin && (
                            <div className="flex flex-wrap gap-2 mt-1.5">
                              {(['admin','manager','professional','patient'] as const).map(r => (
                                <label key={r} className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-pointer">
                                  <Checkbox
                                    checked={u.roles.includes(r)}
                                    onCheckedChange={() => toggleRole(u.id, r, u.roles.includes(r))}
                                    className="h-3 w-3"
                                  /> {roleLabel[r]}
                                </label>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm hidden md:table-cell text-muted-foreground">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '—'}
                        </TableCell>
                        <TableCell><StatusChip status="concluido" /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <TeamManagement />
        </TabsContent>

        <TabsContent value="permissions" className="mt-4">
          <p className="text-xs text-muted-foreground mb-3">Matriz de acesso por perfil</p>
          <ScrollArea className="w-full">
            <div className="rounded-xl border border-border overflow-hidden min-w-[600px]">
              <Table className="table-premium">
                <TableHeader><TableRow>
                  <TableHead className="w-28">Módulo</TableHead>
                  {roles.map(r => <TableHead key={r} className="text-center text-xs">{roleLabel[r]}</TableHead>)}
                </TableRow></TableHeader>
                <TableBody>
                  {modules.map(mod => (
                    <TableRow key={mod}>
                      <TableCell className="text-sm font-medium">{mod}</TableCell>
                      {roles.map(r => (
                        <TableCell key={r} className="text-center">
                          {mockPermissionsMatrix[r]?.[mod]
                            ? <Check className="h-4 w-4 text-primary mx-auto" />
                            : <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="carelines" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button size="sm" className="gap-1" onClick={() => toast.success('Nova linha de cuidado criada')}><Plus className="h-4 w-4" /> Nova Linha</Button>
          </div>
          <div className="grid gap-3">
            {careLines.map(line => {
              const Icon = iconMap[line.icon] || Activity;
              const isExpanded = expandedLine === line.id;
              return (
                <Card key={line.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setExpandedLine(isExpanded ? null : line.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${line.color}20` }}>
                          <Icon className="h-4 w-4" style={{ color: line.color }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{line.name}</p>
                          <p className="text-[10px] text-muted-foreground">{line.patientCount} pacientes · {line.clinicalParameters.length} parâmetros · Adesão {line.avgAdherence}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={line.avgAdherence} className="w-16 h-1.5" />
                        <span className="text-xs text-muted-foreground">{line.avgAdherence}%</span>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="mt-4 pt-3 border-t border-border space-y-3">
                        <div>
                          <p className="section-label">Parâmetros Clínicos</p>
                          <div className="flex flex-wrap gap-1">
                            {line.clinicalParameters.map(p => {
                              const param = parameterDictionary.find(pd => pd.field === p);
                              return <Badge key={p} variant="secondary" className="text-[10px]">{param?.label || p}</Badge>;
                            })}
                          </div>
                        </div>
                        <div>
                          <p className="section-label">PROMs</p>
                          <div className="flex flex-wrap gap-1">{line.proms.map(p => <Badge key={p} variant="outline" className="text-[10px]">{p.split('_').join(' ')}</Badge>)}</div>
                        </div>
                        <div>
                          <p className="section-label">PREMs</p>
                          <div className="flex flex-wrap gap-1">{line.prems.map(p => <Badge key={p} variant="outline" className="text-[10px]">{p.split('_').join(' ')}</Badge>)}</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="steps" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button size="sm" className="gap-1" onClick={() => toast.success('Nova etapa adicionada')}><Plus className="h-4 w-4" /> Nova Etapa</Button>
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            <Table className="table-premium">
              <TableHeader><TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>SLA (dias)</TableHead>
                <TableHead className="hidden sm:table-cell">Responsável Padrão</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {defaultSteps.map((step, i) => (
                  <TableRow key={i}>
                    <TableCell><GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 cursor-grab" /></TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{i + 1}</TableCell>
                    <TableCell className="text-sm font-medium">{step.name}</TableCell>
                    <TableCell><span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">{step.sla}d</span></TableCell>
                    <TableCell className="text-sm hidden sm:table-cell text-muted-foreground">{step.responsavel}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="params" className="mt-4">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {paramGroups.map(g => (
              <button key={g} onClick={() => setParamGroupFilter(g)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors border ${
                  paramGroupFilter === g ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-muted-foreground border-border hover:border-primary/30'
                }`}>
                {g === 'todos' ? 'Todos' : g.split('_').join(' ')}
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            <Table className="table-premium">
              <TableHeader><TableRow>
                <TableHead>Campo</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="hidden sm:table-cell">Unidade</TableHead>
                <TableHead>Grupo</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filteredParams.map(p => (
                  <TableRow key={p.field}>
                    <TableCell className="text-xs font-mono text-muted-foreground">{p.field}</TableCell>
                    <TableCell className="text-sm font-medium">{p.label}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{p.type}</Badge></TableCell>
                    <TableCell className="text-sm hidden sm:table-cell text-muted-foreground">{p.unit || '—'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${groupColors[p.group] || 'bg-muted text-muted-foreground'}`}>
                        {p.group.split('_').join(' ')}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="questionnaires" className="mt-4">
          <div className="grid gap-3">
            {careLines.map(line => {
              const Icon = iconMap[line.icon] || Activity;
              return (
                <Card key={line.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="h-4 w-4" style={{ color: line.color }} />
                      <span className="text-sm font-semibold text-foreground">{line.name}</span>
                    </div>
                    <div className="space-y-2">
                      {line.proms.length > 0 && (
                        <div>
                          <p className="section-label">PROMs</p>
                          <div className="flex flex-wrap gap-1.5">
                            {line.proms.map(p => (
                              <div key={p} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted border border-border">
                                <ClipboardList className="h-3 w-3 text-primary" />
                                <span className="text-[11px] font-medium text-foreground">{p.split('_').join(' ')}</span>
                                <Badge variant="secondary" className="text-[9px] ml-1">PROM</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {line.prems.length > 0 && (
                        <div>
                          <p className="section-label">PREMs</p>
                          <div className="flex flex-wrap gap-1.5">
                            {line.prems.map(p => (
                              <div key={p} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted border border-border">
                                <ClipboardList className="h-3 w-3 text-muted-foreground" />
                                <span className="text-[11px] font-medium text-foreground">{p.split('_').join(' ')}</span>
                                <Badge variant="outline" className="text-[9px] ml-1">PREM</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="automations" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button size="sm" className="gap-1" onClick={() => toast.success('Nova regra de automação criada')}><Plus className="h-4 w-4" /> Nova Regra</Button>
          </div>
          <div className="space-y-2">
            {automationRules.map(rule => (
              <Card key={rule.id} className={`transition-colors ${rule.active ? '' : 'opacity-50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5 text-primary" />
                        <span className="text-sm font-semibold text-foreground">{rule.name}</span>
                        {rule.careLineId && (
                          <Badge variant="secondary" className="text-[9px]">
                            {careLines.find(c => c.id === rule.careLineId || c.slug === rule.careLineId)?.name || rule.careLineId}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground/80">Se:</span> {rule.condition}</p>
                      <div className="flex flex-wrap gap-1">
                        {rule.actions.map((a, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-accent/50 text-accent-foreground">→ {a}</span>
                        ))}
                      </div>
                    </div>
                    <Switch checked={rule.active} onCheckedChange={() => toast.info(`Regra "${rule.name}" ${rule.active ? 'desativada' : 'ativada'}`)} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <div className="rounded-xl border border-border overflow-hidden">
            <Table className="table-premium">
              <TableHeader><TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {mockAudit.map((a, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">{a.date}</TableCell>
                    <TableCell className="text-sm font-medium">{a.user}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.action}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
