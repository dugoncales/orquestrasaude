import { KPICard } from '@/components/shared/KPICard';
import { AlertBanner } from '@/components/shared/AlertBanner';
import { StatusChip } from '@/components/shared/StatusChip';
import { GoalProgress, isOutOfTarget } from '@/components/shared/GoalProgress';
import { JourneyFunnel } from '@/components/shared/JourneyFunnel';
import { RiskSemaphore } from '@/components/shared/RiskSemaphore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, AlertTriangle, ListChecks, Activity, ArrowRight, FlaskConical, Clock, ClipboardList } from 'lucide-react';
import { mockPatients } from '@/data/mock-patients';
import { mockAppointments, mockTasks, mockAlerts, mockExams, mockQuestionnaireResponses, mockJourneys } from '@/data/mock-data';
import { careLines } from '@/data/care-lines';
import { useNavigate } from 'react-router-dom';

export default function DashboardProfissional() {
  const navigate = useNavigate();
  const criticalAlerts = mockAlerts.filter(a => !a.lido && a.severidade === 'critical');

  // Patients who need action: out-of-target goals, ordered by risk
  const patientsNeedAction = mockPatients
    .filter(p => p.goals.some(g => isOutOfTarget(g)))
    .sort((a, b) => b.scoreRisco - a.scoreRisco)
    .slice(0, 6);

  // Bottleneck items: overdue exams, overdue tasks, pending questionnaires
  const overdueExams = mockExams.filter(e => e.status === 'atrasado');
  const overdueTasks = mockTasks.filter(t => t.status === 'atrasada');
  const pendingQuestionnaires = mockQuestionnaireResponses.filter(q => q.status === 'pendente' || q.status === 'atrasado');
  const pendingTasks = mockTasks.filter(t => t.status === 'pendente' || t.status === 'atrasada');
  const faltosos = mockAppointments.filter(a => a.status === 'faltou');

  const totalBottlenecks = overdueExams.length + overdueTasks.length + pendingQuestionnaires.length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Cockpit Assistencial</h1>
          <p className="text-xs text-muted-foreground">Decisões clínicas orientadas por dados</p>
        </div>
        <Button size="sm" onClick={() => navigate('/pacientes')} className="gap-1">
          <Users className="h-4 w-4" /> Ver Pacientes
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard title="Precisam de Ação" value={patientsNeedAction.length} icon={Activity} subtitle="fora da meta" />
        <KPICard title="Pendências" value={totalBottlenecks} icon={AlertTriangle} subtitle="travam jornadas" />
        <KPICard title="Tarefas Abertas" value={pendingTasks.length} icon={ListChecks} trend={{ value: 12, positive: false }} />
        <KPICard title="Faltosos" value={faltosos.length} icon={Clock} subtitle="busca ativa" />
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="space-y-2">
          {criticalAlerts.map(a => <AlertBanner key={a.id} alert={a} />)}
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Quem precisa de mim agora */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4 text-[hsl(var(--destructive))]" />
                Quem precisa de mim agora
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate('/pacientes')}>
                Ver todos <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {patientsNeedAction.map(p => {
              const outGoals = p.goals.filter(g => isOutOfTarget(g));
              const pJourney = mockJourneys.find(j => j.patientId === p.id);
              const currentStepName = pJourney ? pJourney.steps[pJourney.currentStepIndex]?.name : '';

              return (
                <div
                  key={p.id}
                  className="flex items-start gap-3 cursor-pointer hover:bg-muted/50 rounded-lg p-2.5 -mx-2 transition-colors"
                  onClick={() => navigate(`/pacientes/${p.id}`)}
                >
                  <RiskSemaphore level={p.riskLevel} score={p.scoreRisco} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{p.nome}</p>
                      {p.diasSemRetorno && p.diasSemRetorno > 20 && (
                        <span className="text-[10px] bg-[hsl(var(--status-pending-bg))] text-[hsl(var(--status-pending))] rounded-full px-2 py-0.5">
                          {p.diasSemRetorno}d sem retorno
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1.5">
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

        {/* Mini funil */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Funil de Jornadas</CardTitle>
          </CardHeader>
          <CardContent>
            <JourneyFunnel compact />
          </CardContent>
        </Card>
      </div>

      {/* Pendências que travam jornadas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[hsl(var(--status-pending))]" />
            Pendências que Travam Jornadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {/* Exames atrasados */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                <FlaskConical className="h-3 w-3" /> Exames Atrasados ({overdueExams.length})
              </p>
              {overdueExams.map(e => (
                <div key={e.id} className="text-xs py-1.5 border-b border-border last:border-0 cursor-pointer hover:text-foreground" onClick={() => navigate(`/pacientes/${e.patientId}`)}>
                  <p className="font-medium text-foreground">{e.patientName}</p>
                  <p className="text-muted-foreground">{e.tipo} · Solicitado: {e.dataSolicitacao}</p>
                </div>
              ))}
              {overdueExams.length === 0 && <p className="text-xs text-muted-foreground">Nenhum</p>}
            </div>

            {/* Tarefas atrasadas */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                <ListChecks className="h-3 w-3" /> Tarefas Atrasadas ({overdueTasks.length})
              </p>
              {overdueTasks.map(t => (
                <div key={t.id} className="text-xs py-1.5 border-b border-border last:border-0 cursor-pointer hover:text-foreground" onClick={() => navigate(`/pacientes/${t.patientId}`)}>
                  <p className="font-medium text-foreground">{t.patientName}</p>
                  <p className="text-muted-foreground">{t.descricao}</p>
                </div>
              ))}
              {overdueTasks.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma</p>}
            </div>

            {/* Questionários pendentes */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                <ClipboardList className="h-3 w-3" /> Questionários Pendentes ({pendingQuestionnaires.length})
              </p>
              {pendingQuestionnaires.map(q => (
                <div key={q.id} className="text-xs py-1.5 border-b border-border last:border-0">
                  <p className="font-medium text-foreground">{q.patientName}</p>
                  <div className="flex items-center gap-2">
                    <StatusChip status={q.status} className="text-[9px]" />
                    <span className="text-muted-foreground">{q.data}</span>
                  </div>
                </div>
              ))}
              {pendingQuestionnaires.length === 0 && <p className="text-xs text-muted-foreground">Nenhum</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
