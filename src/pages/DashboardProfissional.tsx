import { useState } from 'react';
import { KPICard } from '@/components/shared/KPICard';
import { AlertBanner } from '@/components/shared/AlertBanner';
import { StatusChip } from '@/components/shared/StatusChip';
import { isOutOfTarget } from '@/components/shared/GoalProgress';
import { JourneyFunnel } from '@/components/shared/JourneyFunnel';
import { RiskSemaphore } from '@/components/shared/RiskSemaphore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Users, AlertTriangle, Activity, ArrowRight, FlaskConical, Clock,
  ClipboardList, Calendar, Stethoscope, Settings, ListChecks, Phone,
  Plus, FileText, HeartPulse, CheckCircle2
} from 'lucide-react';
import { mockPatients } from '@/data/mock-patients';
import { mockAppointments, mockTasks, mockAlerts, mockExams, mockQuestionnaireResponses, mockJourneys } from '@/data/mock-data';
import { careLines } from '@/data/care-lines';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function DashboardProfissional() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const criticalAlerts = mockAlerts.filter(a => !a.lido && a.severidade === 'critical');
  const clinicalAlerts = mockAlerts.filter(a => !a.lido && a.tipo === 'clinico');
  const operationalAlerts = mockAlerts.filter(a => !a.lido && a.tipo === 'operacional');

  const patientsNeedAction = mockPatients
    .filter(p => p.goals.some(g => isOutOfTarget(g)))
    .sort((a, b) => b.scoreRisco - a.scoreRisco)
    .slice(0, 6);

  const todayAppointments = mockAppointments.filter(a => a.status === 'agendada' || a.status === 'realizada');
  const dayTasks = mockTasks.filter(t => t.status === 'pendente' || t.status === 'atrasada' || t.status === 'em_andamento');
  const faltosos = mockAppointments.filter(a => a.status === 'faltou');

  const toggleTask = (id: string) => {
    setCompletedTasks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const quickAction = (label: string) => {
    toast({ title: label, description: 'Funcionalidade em desenvolvimento.' });
  };

  const prioColors: Record<string, string> = {
    urgente: 'bg-[hsl(var(--destructive))]/15 text-[hsl(var(--destructive))]',
    alta: 'bg-[hsl(var(--status-waiting))]/15 text-[hsl(var(--status-waiting))]',
    media: 'bg-[hsl(var(--status-pending))]/15 text-[hsl(var(--status-pending))]',
    baixa: 'bg-secondary text-secondary-foreground',
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">{getGreeting()}, Dra. Ana Beatriz</h1>
          <p className="text-xs text-muted-foreground">
            {patientsNeedAction.length} pacientes precisam de atenção · {todayAppointments.length} consultas hoje · {criticalAlerts.length} alertas críticos
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => quickAction('Registrar Consulta')}>
            <Plus className="h-3.5 w-3.5" /> Consulta
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => quickAction('Solicitar Exame')}>
            <FlaskConical className="h-3.5 w-3.5" /> Exame
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => quickAction('Criar Tarefa')}>
            <ListChecks className="h-3.5 w-3.5" /> Tarefa
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" onClick={() => quickAction('Aplicar PROM')}>
            <FileText className="h-3.5 w-3.5" /> PROM
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div>
        <p className="section-label">Visão Geral</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard title="Precisam de Ação" value={patientsNeedAction.length} icon={Activity} subtitle="fora da meta" accentColor="destructive" />
          <KPICard title="Consultas Hoje" value={todayAppointments.length} icon={Calendar} subtitle="agendadas" accentColor="info" />
          <KPICard title="Tarefas do Dia" value={dayTasks.length} icon={ListChecks} subtitle={`${mockTasks.filter(t => t.status === 'atrasada').length} atrasadas`} accentColor="warning" />
          <KPICard title="Faltosos" value={faltosos.length} icon={Clock} subtitle="busca ativa" accentColor="destructive" />
        </div>
      </div>

      {/* Alerts */}
      {(clinicalAlerts.length > 0 || operationalAlerts.length > 0) && (
        <div>
          <p className="section-label">Alertas</p>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
            {clinicalAlerts.length > 0 && (
              <Card className="border-[hsl(var(--destructive))]/20 card-elevated">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
                    <HeartPulse className="h-3.5 w-3.5 text-[hsl(var(--destructive))]" /> Alertas Clínicos
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  {clinicalAlerts.map(a => (
                    <div
                      key={a.id}
                      className="flex items-start gap-2 text-xs cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-1 transition-colors"
                      onClick={() => a.patientId && navigate(`/pacientes/${a.patientId}`)}
                    >
                      <Stethoscope className="h-3.5 w-3.5 text-[hsl(var(--destructive))] mt-0.5 flex-shrink-0" />
                      <div>
                        {a.patientName && <p className="font-semibold text-foreground">{a.patientName}</p>}
                        <p className="text-muted-foreground">{a.mensagem}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {operationalAlerts.length > 0 && (
              <Card className="border-[hsl(var(--warning))]/20 card-elevated">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
                    <Settings className="h-3.5 w-3.5 text-[hsl(var(--warning))]" /> Alertas Operacionais
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  {operationalAlerts.map(a => (
                    <div
                      key={a.id}
                      className="flex items-start gap-2 text-xs cursor-pointer hover:bg-muted/50 rounded-lg p-2 -mx-1 transition-colors"
                      onClick={() => a.patientId && navigate(`/pacientes/${a.patientId}`)}
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--warning))] mt-0.5 flex-shrink-0" />
                      <div>
                        {a.patientName && <p className="font-semibold text-foreground">{a.patientName}</p>}
                        <p className="text-muted-foreground">{a.mensagem}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Agenda do Dia */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Agenda do Dia
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/consultas')}>
                Ver todas <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {todayAppointments.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma consulta hoje</p>}
            {todayAppointments.map(a => {
              const cl = careLines.find(c => c.id === a.careLineId);
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 rounded-lg p-2.5 -mx-1 transition-colors"
                  onClick={() => navigate(`/pacientes/${a.patientId}`)}
                >
                  <div className="text-center flex-shrink-0 w-12">
                    <p className="text-sm font-bold text-foreground">{a.hora}</p>
                  </div>
                  <div className="h-8 w-0.5 rounded-full bg-primary/30 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{a.patientName}</p>
                    <p className="text-xs text-muted-foreground">{a.tipo} {cl ? `· ${cl.name}` : ''}</p>
                  </div>
                  <StatusChip status={a.status} className="text-[9px]" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Tarefas do Dia */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-primary" /> Tarefas do Dia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dayTasks.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma tarefa pendente</p>}
            {dayTasks.map(t => (
              <div
                key={t.id}
                className={`flex items-start gap-2.5 rounded-lg p-2.5 -mx-1 transition-all ${completedTasks.has(t.id) ? 'opacity-50' : ''}`}
              >
                <Checkbox
                  checked={completedTasks.has(t.id)}
                  onCheckedChange={() => toggleTask(t.id)}
                  className="mt-0.5"
                />
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/pacientes/${t.patientId}`)}>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className={`text-xs font-semibold text-foreground ${completedTasks.has(t.id) ? 'line-through' : ''}`}>
                      {t.patientName?.split(' ').slice(0, 2).join(' ')}
                    </p>
                    <span className={`text-[9px] font-medium rounded-full px-1.5 py-0.5 ${prioColors[t.prioridade]}`}>
                      {t.prioridade}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{t.descricao}</p>
                  <p className="text-[10px] text-muted-foreground">{t.responsavel} · {t.prazo}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div>
        <p className="section-label">Pacientes & Jornadas</p>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          {/* Pacientes Prioritários */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[hsl(var(--destructive))]" /> Pacientes Prioritários
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/pacientes')}>
                  Ver todos <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {patientsNeedAction.map(p => {
                const outGoals = p.goals.filter(g => isOutOfTarget(g));
                const pJourney = mockJourneys.find(j => j.patientId === p.id);
                const currentStepName = pJourney ? pJourney.steps[pJourney.currentStepIndex]?.name : '';

                return (
                  <div
                    key={p.id}
                    className="flex items-start gap-3 cursor-pointer hover:bg-muted/50 rounded-lg p-2.5 -mx-1 transition-colors"
                    onClick={() => navigate(`/jornada-clinica?paciente=${p.id}`)}
                  >
                    <RiskSemaphore level={p.riskLevel} score={p.scoreRisco} showLabel={false} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{p.nome}</p>
                        {p.diasSemRetorno && p.diasSemRetorno > 20 && (
                          <span className="text-[10px] bg-[hsl(var(--status-pending-bg))] text-[hsl(var(--status-pending))] rounded-full px-2 py-0.5">
                            {p.diasSemRetorno}d sem retorno
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Etapa: {currentStepName} · {p.linhasAtivas.map(l => careLines.find(cl => cl.id === l)?.name.split(' ')[0]).join(', ')}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {outGoals.map(g => (
                          <span key={g.field} className="text-[10px] font-medium bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))] rounded px-1.5 py-0.5">
                            {g.label}: {g.currentValue}{g.unit}
                          </span>
                        ))}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Sidebar: Funnel + Faltosos */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Funil de Jornadas</CardTitle>
              </CardHeader>
              <CardContent>
                <JourneyFunnel compact />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[hsl(var(--status-waiting))]" /> Faltosos — Busca Ativa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {faltosos.length === 0 && <p className="text-xs text-muted-foreground">Nenhum faltoso</p>}
                {faltosos.map(a => (
                  <div key={a.id} className="flex items-center gap-3 text-xs">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{a.patientName}</p>
                      <p className="text-muted-foreground">{a.tipo} · {a.data}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] gap-1"
                      onClick={() => {
                        toast({ title: 'Busca ativa iniciada', description: `Contato com ${a.patientName}` });
                      }}
                    >
                      <Phone className="h-3 w-3" /> Busca
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
