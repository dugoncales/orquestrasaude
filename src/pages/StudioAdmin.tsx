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
import {
  Users, Shield, Settings, FileText, Plus, Check, X, GripVertical,
  GitBranch, Route, FlaskConical, ClipboardList, Zap, Activity,
  Heart, Scale, Droplets, Brain, Wind
} from 'lucide-react';
import { StatusChip } from '@/components/shared/StatusChip';
import { careLines } from '@/data/care-lines';
import { parameterDictionary } from '@/data/parameters';
import { mockAutomationRules, mockPermissionsMatrix } from '@/data/mock-data';
import { toast } from 'sonner';

const iconMap: Record<string, any> = {
  Activity, Heart, Scale, Droplets, Brain, Wind,
};

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
  { date: '2025-04-12 11:30', user: 'Admin Sistema', action: 'Alterou permissões do perfil Gestor' },
  { date: '2025-04-12 09:00', user: 'Dra. Ana Beatriz', action: 'Incluiu paciente Carlos Eduardo na linha de Obesidade' },
];

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

const roleLabel: Record<string, string> = {
  admin: 'Admin', manager: 'Gestor', professional: 'Profissional', patient: 'Paciente',
};

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
  const [paramGroupFilter, setParamGroupFilter] = useState<string>('todos');
  const [expandedLine, setExpandedLine] = useState<string | null>(null);

  const paramGroups = ['todos', ...Array.from(new Set(parameterDictionary.map(p => p.group)))];
  const filteredParams = paramGroupFilter === 'todos' ? parameterDictionary : parameterDictionary.filter(p => p.group === paramGroupFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">CareJourney Studio</h1>
        <p className="text-xs text-muted-foreground">Configuração e administração da plataforma</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard title="Usuários Ativos" value={mockUsers.length} icon={Users} />
        <KPICard title="Linhas de Cuidado" value={careLines.length} icon={GitBranch} />
        <KPICard title="Regras de Automação" value={mockAutomationRules.length} icon={Zap} />
        <KPICard title="Parâmetros Clínicos" value={parameterDictionary.length} icon={FlaskConical} />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users">
        <ScrollArea className="w-full">
          <TabsList className="w-max">
            <TabsTrigger value="users">Usuários</TabsTrigger>
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

        {/* TAB 1: Usuários */}
        <TabsContent value="users" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button size="sm" className="gap-1" onClick={() => toast.success('Formulário de novo usuário aberto')}><Plus className="h-4 w-4" /> Novo Usuário</Button>
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
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                          {u.name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                        </div>
                        <span className="text-sm font-medium">{u.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm hidden sm:table-cell text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${roleBadgeColor[u.role]}`}>
                        {roleLabel[u.role]}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm hidden md:table-cell text-muted-foreground">{u.lastAccess}</TableCell>
                    <TableCell><StatusChip status="concluido" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* TAB 2: Permissões */}
        <TabsContent value="permissions" className="mt-4">
          <p className="text-xs text-muted-foreground mb-3">Matriz de acesso por perfil — controle quais módulos cada role pode acessar.</p>
          <ScrollArea className="w-full">
            <div className="rounded-xl border border-border overflow-hidden min-w-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-28">Módulo</TableHead>
                    {roles.map(r => <TableHead key={r} className="text-center text-xs">{roleLabel[r]}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map(mod => (
                    <TableRow key={mod}>
                      <TableCell className="text-sm font-medium">{mod}</TableCell>
                      {roles.map(r => (
                        <TableCell key={r} className="text-center">
                          {mockPermissionsMatrix[r]?.[mod]
                            ? <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                            : <X className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                          }
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

        {/* TAB 3: Linhas de Cuidado */}
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
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Parâmetros Clínicos</p>
                          <div className="flex flex-wrap gap-1">
                            {line.clinicalParameters.map(p => {
                              const param = parameterDictionary.find(pd => pd.field === p);
                              return <Badge key={p} variant="secondary" className="text-[10px]">{param?.label || p}</Badge>;
                            })}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">PROMs</p>
                          <div className="flex flex-wrap gap-1">
                            {line.proms.map(p => <Badge key={p} variant="outline" className="text-[10px]">{p.replaceAll('_', ' ')}</Badge>)}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">PREMs</p>
                          <div className="flex flex-wrap gap-1">
                            {line.prems.map(p => <Badge key={p} variant="outline" className="text-[10px]">{p.replaceAll('_', ' ')}</Badge>)}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* TAB 4: Etapas da Jornada */}
        <TabsContent value="steps" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button size="sm" className="gap-1" onClick={() => toast.success('Nova etapa adicionada')}><Plus className="h-4 w-4" /> Nova Etapa</Button>
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>SLA (dias)</TableHead>
                  <TableHead className="hidden sm:table-cell">Responsável Padrão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {defaultSteps.map((step, i) => (
                  <TableRow key={i}>
                    <TableCell><GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 cursor-grab" /></TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{i + 1}</TableCell>
                    <TableCell className="text-sm font-medium">{step.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                        {step.sla}d
                      </span>
                    </TableCell>
                    <TableCell className="text-sm hidden sm:table-cell text-muted-foreground">{step.responsavel}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* TAB 5: Parâmetros Clínicos */}
        <TabsContent value="params" className="mt-4">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {paramGroups.map(g => (
              <button
                key={g}
                onClick={() => setParamGroupFilter(g)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors border ${
                  paramGroupFilter === g
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-muted-foreground border-border hover:border-primary/30'
                }`}
              >
                {g === 'todos' ? 'Todos' : g.replaceAll('_', ' ')}
              </button>
            ))}
          </div>
          <div className="rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campo</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="hidden sm:table-cell">Unidade</TableHead>
                  <TableHead>Grupo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParams.map(p => (
                  <TableRow key={p.field}>
                    <TableCell className="text-xs font-mono text-muted-foreground">{p.field}</TableCell>
                    <TableCell className="text-sm font-medium">{p.label}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">{p.type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm hidden sm:table-cell text-muted-foreground">{p.unit || '—'}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${groupColors[p.group] || 'bg-muted text-muted-foreground'}`}>
                        {p.group.replaceAll('_', ' ')}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* TAB 6: Questionários */}
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
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">PROMs</p>
                          <div className="flex flex-wrap gap-1.5">
                            {line.proms.map(p => (
                              <div key={p} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted border border-border">
                                <ClipboardList className="h-3 w-3 text-primary" />
                                <span className="text-[11px] font-medium text-foreground">{p.replaceAll('_', ' ')}</span>
                                <Badge variant="secondary" className="text-[9px] ml-1">PROM</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {line.prems.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">PREMs</p>
                          <div className="flex flex-wrap gap-1.5">
                            {line.prems.map(p => (
                              <div key={p} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted border border-border">
                                <ClipboardList className="h-3 w-3 text-muted-foreground" />
                                <span className="text-[11px] font-medium text-foreground">{p.replaceAll('_', ' ')}</span>
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

        {/* TAB 7: Alertas e Automações */}
        <TabsContent value="automations" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button size="sm" className="gap-1" onClick={() => toast.success('Nova regra de automação criada')}><Plus className="h-4 w-4" /> Nova Regra</Button>
          </div>
          <div className="space-y-2">
            {mockAutomationRules.map(rule => (
              <Card key={rule.id} className={`transition-colors ${rule.active ? '' : 'opacity-50'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Zap className="h-3.5 w-3.5 text-primary" />
                        <span className="text-sm font-semibold text-foreground">{rule.name}</span>
                        {rule.careLineId && (
                          <Badge variant="secondary" className="text-[9px]">
                            {careLines.find(c => c.id === rule.careLineId)?.name || rule.careLineId}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground/80">Se:</span> {rule.condition}
                      </p>
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

        {/* TAB 8: Auditoria */}
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
