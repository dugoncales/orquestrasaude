import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePatients } from '@/hooks/usePatients';
import { useJourneys } from '@/hooks/useJourneys';
import { useAllJourneySteps } from '@/hooks/useJourneys';
import { useAppointments } from '@/hooks/useAppointments';
import { useExams } from '@/hooks/useExams';
import { useTasks } from '@/hooks/useTasks';
import { useAlerts } from '@/hooks/useAlerts';
import { useQuestionnaireResponses } from '@/hooks/useQuestionnaireResponses';
import { useParameterRecords } from '@/hooks/useParameterRecords';
import { useCareLines } from '@/hooks/useCareLines';
import { parseGoals, riskLevel, mapCareLine, mapStep } from '@/lib/db-helpers';
import { formatSexo } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusChip } from '@/components/shared/StatusChip';
import { RiskSemaphore } from '@/components/shared/RiskSemaphore';
import { GoalProgress, isOutOfTarget } from '@/components/shared/GoalProgress';
import { ActionPanel } from '@/components/shared/ActionPanel';
import { JourneyProgressBar } from '@/components/shared/JourneyProgressBar';
import { MultiLineOverview } from '@/components/shared/MultiLineOverview';
import { AlertBanner } from '@/components/shared/AlertBanner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Check, Clock, AlertTriangle, Lock, Circle, MapPin, TrendingUp, TrendingDown,
  Activity, CalendarDays, ShieldAlert, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

const statusIcons: Record<string, any> = { nao_iniciado: Circle, em_andamento: Clock, concluido: Check, atrasado: AlertTriangle, bloqueado: Lock };

function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function JornadaClinica() {
  const { data: patientsData, isLoading: loadingP } = usePatients();
  const { data: journeysData } = useJourneys();
  const { data: allStepsData } = useAllJourneySteps();
  const { data: appointmentsData } = useAppointments();
  const { data: examsData } = useExams();
  const { data: tasksData } = useTasks();
  const { data: alertsData } = useAlerts();
  const { data: qrData } = useQuestionnaireResponses();
  const { data: paramRecordsData } = useParameterRecords();
  const { data: careLinesData } = useCareLines();

  const patients = patientsData || [];
  const journeys = journeysData || [];
  const allSteps = allStepsData || [];
  const appointments = appointmentsData || [];
  const exams = examsData || [];
  const tasks = tasksData || [];
  const alerts = alertsData || [];
  const questionnaireResponses = qrData || [];
  const paramRecords = paramRecordsData || [];
  const careLines = (careLinesData || []).map(mapCareLine);

  const [searchParams] = useSearchParams();
  const queryPatientId = searchParams.get('paciente') || '';
  const [selectedPatientId, setSelectedPatientId] = useState(queryPatientId);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);

  useEffect(() => {
    if (queryPatientId) setSelectedPatientId(queryPatientId);
  }, [queryPatientId]);

  // Auto-select first patient
  const effectivePatientId = selectedPatientId || patients[0]?.id || '';
  const patient = patients.find(p => p.id === effectivePatientId);
  const patientJourneys = useMemo(() => journeys.filter(j => j.patient_id === effectivePatientId), [journeys, effectivePatientId]);
  const [selectedJourneyId, setSelectedJourneyId] = useState('');
  const effectiveJourneyId = selectedJourneyId || patientJourneys[0]?.id || '';

  const journey = journeys.find(j => j.id === effectiveJourneyId) || patientJourneys[0];
  const journeySteps = useMemo(() =>
    allSteps.filter(s => s.journey_id === journey?.id).sort((a, b) => a.step_order - b.step_order),
    [allSteps, journey?.id]
  );
  const mappedSteps = journeySteps.map(mapStep);

  if (loadingP) return <div className="space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-40 w-full" /></div>;
  if (!patient || !journey) return <div className="text-muted-foreground p-8">Nenhuma jornada encontrada</div>;

  const goals = parseGoals(patient.goals);
  const risk = riskLevel(patient);
  const clRow = (careLinesData || []).find(c => c.id === journey.care_line_id);
  const line = clRow ? mapCareLine(clRow) : null;
  const patientAlerts = alerts.filter(a => a.patient_id === effectivePatientId && !a.lido);
  const clinicalAlerts = patientAlerts.filter(a => a.tipo === 'clinico');
  const operationalAlerts = patientAlerts.filter(a => a.tipo === 'operacional');
  const goalsOutOfTarget = goals.filter(g => isOutOfTarget(g));
  const lineGoals = goals.filter(g => g.careLineId === (clRow?.slug || journey.care_line_id));

  const handlePatientChange = (pid: string) => {
    setSelectedPatientId(pid);
    const pJourneys = journeys.filter(j => j.patient_id === pid);
    setSelectedJourneyId(pJourneys[0]?.id || '');
    setSelectedStepIndex(null);
  };

  const handleSelectJourney = (jid: string) => {
    setSelectedJourneyId(jid);
    setSelectedStepIndex(null);
  };

  const currentStepIndex = journey.current_step_index ?? 0;
  const activeStepIndex = selectedStepIndex ?? currentStepIndex;
  const activeStep = mappedSteps[activeStepIndex];
  const nextStep = mappedSteps[activeStepIndex + 1];

  if (!activeStep) return <div className="text-muted-foreground p-8">Nenhuma etapa encontrada</div>;

  const daysInStep = activeStep.prazo
    ? Math.max(0, Math.floor((Date.now() - new Date(activeStep.prazo).getTime()) / 86400000) + 15)
    : undefined;

  const stepQuestionnaires = questionnaireResponses.filter(
    q => activeStep.questionariosVinculados?.includes(q.id)
  );

  function getTrend(patientId: string, field: string): 'up' | 'down' | 'stable' {
    const records = paramRecords
      .filter(r => r.patient_id === patientId && r.field === field)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (records.length < 2) return 'stable';
    const last = Number(records[records.length - 1].value);
    const prev = Number(records[records.length - 2].value);
    if (last > prev) return 'up';
    if (last < prev) return 'down';
    return 'stable';
  }

  const getPendencyCount = (jId: string) => {
    const jSteps = allSteps.filter(s => s.journey_id === jId);
    return jSteps.reduce((sum, s) => sum + (s.pendencias || []).length, 0);
  };

  const initials = patient.nome.split(' ').filter((_: string, i: number, a: string[]) => i === 0 || i === a.length - 1).map((n: string) => n[0]).join('');

  // Map DB rows to typed objects for ActionPanel
  const typedAppointments = appointments.map(a => ({
    id: a.id, patientId: a.patient_id, patientName: a.patient_name, tipo: a.tipo,
    data: a.data, hora: a.hora, profissional: a.profissional, status: a.status as any,
    careLineId: a.care_line_id || undefined, observacoes: a.observacoes || undefined,
  }));
  const typedExams = exams.map(e => ({
    id: e.id, patientId: e.patient_id, patientName: e.patient_name, tipo: e.tipo,
    dataSolicitacao: e.data_solicitacao, status: e.status as any,
    dataResultado: e.data_resultado || undefined, resultado: e.resultado || undefined,
    careLineId: e.care_line_id || undefined,
  }));
  const typedTasks = tasks.map(t => ({
    id: t.id, patientId: t.patient_id, patientName: t.patient_name, tipo: t.tipo,
    descricao: t.descricao, prazo: t.prazo, responsavel: t.responsavel,
    prioridade: t.prioridade as any, status: t.status as any,
    careLineId: t.care_line_id || undefined,
  }));
  const typedQR = questionnaireResponses.map(q => ({
    id: q.id, patientId: q.patient_id, patientName: q.patient_name,
    questionnaireId: q.questionnaire_id, data: q.data, status: q.status as any,
    score: q.score ? Number(q.score) : undefined, maxScore: q.max_score ? Number(q.max_score) : undefined,
    careLineId: q.care_line_id || undefined,
  }));

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Jornada Clínica
          </h1>
          <p className="text-xs text-muted-foreground">Painel de comando assistencial integrado</p>
        </div>
        <Select value={effectivePatientId} onValueChange={handlePatientChange}>
          <SelectTrigger className="w-[300px] h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            {patients.map(p => (
              <SelectItem key={p.id} value={p.id}>
                <span className="flex items-center gap-2">
                  <RiskSemaphore level={riskLevel(p)} />
                  <span>{p.nome}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ZONA A */}
      <Card className="border-l-4 border-l-primary overflow-hidden">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-primary/30">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-bold text-foreground">{patient.nome}</h2>
                <p className="text-xs text-muted-foreground">
                  {calculateAge(patient.data_nascimento)} anos · {formatSexo(patient.sexo)} · {patient.convenio}
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {(patient.diagnosticos_ativos || []).map((d: string) => (
                    <Badge key={d} variant="secondary" className="text-[10px] px-2 py-0">{d}</Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1 bg-secondary/50 rounded-lg p-3">
                <RiskSemaphore level={risk} score={patient.score_risco || 0} />
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">Risco</span>
              </div>
              {patient.dias_sem_retorno && patient.dias_sem_retorno > 14 && (
                <div className="flex flex-col items-center gap-1 bg-[hsl(var(--status-pending-bg))] rounded-lg p-3">
                  <span className="text-lg font-bold text-[hsl(var(--status-pending))]">{patient.dias_sem_retorno}</span>
                  <span className="text-[9px] text-[hsl(var(--status-pending))] uppercase tracking-wider font-semibold">Dias s/ retorno</span>
                </div>
              )}
            </div>
          </div>

          {goalsOutOfTarget.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                <ShieldAlert className="h-3 w-3 text-[hsl(var(--destructive))]" /> Parâmetros fora da meta
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {goalsOutOfTarget.map(g => {
                  const trend = getTrend(patient.id, g.field);
                  return (
                    <div key={g.field} className="rounded-lg border border-[hsl(var(--destructive))]/20 bg-[hsl(var(--destructive))]/5 p-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground font-medium">{g.label}</span>
                        {trend === 'up' && <TrendingUp className="h-3 w-3 text-[hsl(var(--destructive))]" />}
                        {trend === 'down' && <TrendingDown className="h-3 w-3 text-[hsl(var(--success))]" />}
                      </div>
                      <p className="text-base font-bold text-[hsl(var(--destructive))] font-mono">{g.currentValue}{g.unit}</p>
                      <p className="text-[9px] text-muted-foreground">Meta: {g.operator} {g.target}{g.unit}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(clinicalAlerts.length > 0 || operationalAlerts.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {clinicalAlerts.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-[hsl(var(--destructive))] uppercase tracking-wider flex items-center gap-1">
                    <Zap className="h-3 w-3" /> Alertas Clínicos
                  </p>
                  {clinicalAlerts.map(a => <AlertBanner key={a.id} alert={{ id: a.id, tipo: a.tipo as any, severidade: a.severidade as any, mensagem: a.mensagem, data: a.data, lido: a.lido ?? false, patientId: a.patient_id || undefined, patientName: a.patient_name || undefined }} />)}
                </div>
              )}
              {operationalAlerts.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-[hsl(var(--status-pending))] uppercase tracking-wider flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" /> Alertas Operacionais
                  </p>
                  {operationalAlerts.map(a => <AlertBanner key={a.id} alert={{ id: a.id, tipo: a.tipo as any, severidade: a.severidade as any, mensagem: a.mensagem, data: a.data, lido: a.lido ?? false, patientId: a.patient_id || undefined, patientName: a.patient_name || undefined }} />)}
                </div>
              )}
            </div>
          )}

          {patientJourneys.length > 1 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {patientJourneys.map(j => {
                const clr = (careLinesData || []).find(c => c.id === j.care_line_id);
                const l = clr ? mapCareLine(clr) : null;
                const pCount = getPendencyCount(j.id);
                const isActive = j.id === effectiveJourneyId;
                return (
                  <button key={j.id} onClick={() => handleSelectJourney(j.id)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all border',
                      isActive ? 'border-transparent shadow-md' : 'border-border bg-secondary hover:bg-secondary/80'
                    )}
                    style={isActive ? { background: (l?.color || '') + '22', color: l?.color, borderColor: (l?.color || '') + '44' } : {}}>
                    <span className="h-2 w-2 rounded-full" style={{ background: l?.color }} />
                    {l?.name}
                    {pCount > 0 && (
                      <span className={cn('ml-0.5 text-[9px] font-mono rounded-full px-1.5 py-0.5',
                        isActive ? 'bg-white/20' : 'bg-[hsl(var(--status-pending-bg))] text-[hsl(var(--status-pending))]'
                      )}>{pCount}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ZONA B */}
      <div className="space-y-3">
        <JourneyProgressBar steps={mappedSteps} currentIndex={currentStepIndex} />
        <div className="overflow-x-auto overflow-y-visible pt-6 pb-3 -mx-1 px-1">
          <div className="flex items-start gap-0 min-w-max relative pt-1 pb-2">
            <div className="absolute top-7 left-6 right-6 h-0.5 bg-border z-0" />
            {mappedSteps.map((step, i) => {
              const SIcon = statusIcons[step.status] || Circle;
              const isCurrent = i === currentStepIndex;
              const isSelected = i === activeStepIndex;
              const isCompleted = step.status === 'concluido';
              const isOverdue = step.status === 'atrasado';
              const linkedCount = (step.consultasVinculadas?.length || 0) + (step.examesVinculados?.length || 0)
                + (step.tarefasVinculadas?.length || 0) + (step.questionariosVinculados?.length || 0);
              return (
                <button key={step.id} onClick={() => setSelectedStepIndex(i)}
                  className="flex flex-col items-center relative z-10 group" style={{ minWidth: isSelected ? 180 : 120 }}>
                  <div className={cn(
                    'h-12 w-12 rounded-full flex items-center justify-center border-2 transition-all mb-2',
                    isCompleted && 'bg-[hsl(var(--success))]/15 border-[hsl(var(--success))] text-[hsl(var(--success))]',
                    isCurrent && !isOverdue && 'bg-primary/15 border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.3)]',
                    isOverdue && 'bg-[hsl(var(--destructive))]/15 border-[hsl(var(--destructive))] text-[hsl(var(--destructive))] animate-pulse',
                    !isCompleted && !isCurrent && !isOverdue && 'bg-secondary border-border text-muted-foreground',
                    isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                  )}>
                    <SIcon className="h-5 w-5" />
                  </div>
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-[8px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                        <MapPin className="h-2.5 w-2.5" /> ETAPA ATUAL
                      </span>
                    </div>
                  )}
                  <div className={cn(
                    'rounded-xl border p-2.5 text-center transition-all w-full',
                    isSelected ? 'bg-card border-primary/40 shadow-lg' : 'bg-card/50 border-border group-hover:border-primary/20'
                  )}>
                    <p className="text-[9px] font-mono text-muted-foreground mb-0.5">#{i + 1}</p>
                    <p className={cn('text-[11px] font-semibold text-foreground leading-tight', isSelected && 'text-xs')}>{step.name}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{step.responsavel}</p>
                    {(step.pendencias || []).length > 0 && (
                      <p className="text-[9px] text-[hsl(var(--status-pending))] mt-1 truncate px-1">⚠ {(step.pendencias || []).length} pend.</p>
                    )}
                    {linkedCount > 0 && (
                      <div className="flex justify-center gap-1 mt-1.5">
                        {(step.consultasVinculadas?.length || 0) > 0 && <span className="text-[8px] bg-secondary rounded px-1 py-0.5">📅{step.consultasVinculadas!.length}</span>}
                        {(step.examesVinculados?.length || 0) > 0 && <span className="text-[8px] bg-secondary rounded px-1 py-0.5">🔬{step.examesVinculados!.length}</span>}
                        {(step.tarefasVinculadas?.length || 0) > 0 && <span className="text-[8px] bg-secondary rounded px-1 py-0.5">✓{step.tarefasVinculadas!.length}</span>}
                        {(step.questionariosVinculados?.length || 0) > 0 && <span className="text-[8px] bg-secondary rounded px-1 py-0.5">📋{step.questionariosVinculados!.length}</span>}
                      </div>
                    )}
                    <div className="mt-1.5"><StatusChip status={step.status} className="text-[8px]" /></div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ZONA C */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className={cn('h-2.5 w-2.5 rounded-full', activeStepIndex === currentStepIndex ? 'bg-primary animate-pulse' : 'bg-muted-foreground')} />
              {activeStepIndex === currentStepIndex ? 'Etapa Atual' : `Etapa #${activeStepIndex + 1}`} — {activeStep.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActionPanel
              step={activeStep}
              nextStep={nextStep}
              appointments={typedAppointments}
              exams={typedExams}
              tasks={typedTasks}
              questionnaires={typedQR}
              daysInStep={daysInStep}
            />
          </CardContent>
        </Card>

        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: line?.color }} />
                Metas — {line?.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lineGoals.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma meta definida</p>
              ) : (
                lineGoals.map(g => <GoalProgress key={g.field} goal={g} />)
              )}
            </CardContent>
          </Card>

          {patientJourneys.length > 1 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">Visão Multi-Linha</CardTitle>
              </CardHeader>
              <CardContent>
                <MultiLineOverview
                  patient={patient}
                  journeys={patientJourneys.map(j => ({ id: j.id, care_line_id: j.care_line_id, current_step_index: j.current_step_index ?? 0 }))}
                  steps={journeySteps}
                  activeJourneyId={effectiveJourneyId}
                  onSelectJourney={handleSelectJourney}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Resumo Rápido</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-secondary/50 p-2.5 text-center">
                  <p className="text-lg font-bold text-foreground">{mappedSteps.filter(s => (s.pendencias || []).length > 0).length}</p>
                  <p className="text-[9px] text-muted-foreground">Etapas c/ pendência</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-2.5 text-center">
                  <p className="text-lg font-bold text-foreground">{mappedSteps.reduce((s, st) => s + (st.pendencias || []).length, 0)}</p>
                  <p className="text-[9px] text-muted-foreground">Total pendências</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-2.5 text-center">
                  <p className="text-lg font-bold text-foreground">{goalsOutOfTarget.length}</p>
                  <p className="text-[9px] text-muted-foreground">Fora da meta</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-2.5 text-center">
                  <p className="text-lg font-bold text-foreground">{mappedSteps.filter(s => s.status === 'concluido').length}/{mappedSteps.length}</p>
                  <p className="text-[9px] text-muted-foreground">Etapas concluídas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
