import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePatient } from '@/hooks/usePatients';
import { useJourneys } from '@/hooks/useJourneys';
import { useAppointments } from '@/hooks/useAppointments';
import { useExams } from '@/hooks/useExams';
import { useTasks } from '@/hooks/useTasks';
import { useAlerts } from '@/hooks/useAlerts';
import { useParameterRecords } from '@/hooks/useParameterRecords';
import { useCareLines } from '@/hooks/useCareLines';
import { parseGoals, riskLevel, mapCareLine, findCareLineByRef } from '@/lib/db-helpers';
import { formatSexo, formatDateBR, formatMonthYearBR, monthKey, getInitials } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusChip } from '@/components/shared/StatusChip';
import { RiskSemaphore } from '@/components/shared/RiskSemaphore';
import { GoalProgress, isOutOfTarget } from '@/components/shared/GoalProgress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, Activity, Pill, ArrowRight,
  Calendar, FlaskConical, CheckSquare, AlertTriangle, Paperclip,
} from 'lucide-react';
import { AttachmentList } from '@/components/shared/AttachmentList';
import { PatientExtractionsList } from '@/components/shared/PatientExtractionsList';
import { PatientFormDialog } from '@/components/dialogs/PatientFormDialog';
import { RegisterParameterDialog } from '@/components/dialogs/RegisterParameterDialog';
import { AddOrientacaoDialog } from '@/components/dialogs/AddOrientacaoDialog';
import { useOrientacoes } from '@/hooks/useOrientacoes';
import { Pencil, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { cn } from '@/lib/utils';

type TimelineFilter = 'todos' | 'consultas' | 'exames' | 'tarefas' | 'alertas';
type TimelineEventType = 'consulta' | 'exame' | 'tarefa' | 'alerta';
type TimelineEvent = {
  id: string;
  date: string;
  type: TimelineEventType;
  label: string;
  status: string;
  meta?: string;
};

const typeIcon: Record<TimelineEventType, typeof Calendar> = {
  consulta: Calendar,
  exame: FlaskConical,
  tarefa: CheckSquare,
  alerta: AlertTriangle,
};

const typeAccent: Record<TimelineEventType, string> = {
  consulta: 'bg-[hsl(var(--info))]/15 text-[hsl(var(--info))]',
  exame: 'bg-[hsl(var(--status-pending))]/15 text-[hsl(var(--status-pending))]',
  tarefa: 'bg-primary/15 text-primary',
  alerta: 'bg-[hsl(var(--destructive))]/15 text-[hsl(var(--destructive))]',
};

const typeLabel: Record<TimelineEventType, string> = {
  consulta: 'Consulta',
  exame: 'Exame',
  tarefa: 'Tarefa',
  alerta: 'Alerta',
};

export default function PerfilPaciente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: patient, isLoading: loadingPatient } = usePatient(id);
  const { data: journeysData } = useJourneys(id);
  const { data: appointmentsData } = useAppointments(id);
  const { data: examsData } = useExams(id);
  const { data: tasksData } = useTasks(id);
  const { data: alertsData } = useAlerts();
  const { data: paramRecords } = useParameterRecords(id);
  const { data: careLinesData } = useCareLines();

  const [filter, setFilter] = useState<TimelineFilter>('todos');
  const [openEdit, setOpenEdit] = useState(false);
  const [openParam, setOpenParam] = useState(false);
  const [openOrient, setOpenOrient] = useState(false);
  const { data: orientacoesData } = useOrientacoes(id);
  const orientacoes = orientacoesData || [];

  const journeys = journeysData || [];
  const appointments = appointmentsData || [];
  const exams = examsData || [];
  const tasks = tasksData || [];
  const alerts = (alertsData || []).filter(a => a.patient_id === id);
  const records = (paramRecords || []).filter(r => r.patient_id === id);
  const careLines = useMemo(() => (careLinesData || []).map(mapCareLine), [careLinesData]);

  const timelineEvents: TimelineEvent[] = useMemo(() => {
    const evts: TimelineEvent[] = [
      ...appointments.map(a => ({
        id: `c-${a.id}`,
        date: a.data,
        type: 'consulta' as const,
        label: a.tipo,
        status: a.status,
        meta: a.profissional,
      })),
      ...exams.map(e => ({
        id: `e-${e.id}`,
        date: e.data_solicitacao,
        type: 'exame' as const,
        label: e.tipo,
        status: e.status,
      })),
      ...tasks.map(t => ({
        id: `t-${t.id}`,
        date: t.prazo,
        type: 'tarefa' as const,
        label: t.descricao,
        status: t.status,
        meta: t.responsavel,
      })),
      ...alerts.map(a => ({
        id: `a-${a.id}`,
        date: a.data,
        type: 'alerta' as const,
        label: a.mensagem,
        status: a.severidade,
      })),
    ];
    return evts.sort((a, b) => b.date.localeCompare(a.date));
  }, [appointments, exams, tasks, alerts]);

  const filteredEvents = useMemo(() => {
    if (filter === 'todos') return timelineEvents;
    const map: Record<TimelineFilter, TimelineEventType | null> = {
      todos: null,
      consultas: 'consulta',
      exames: 'exame',
      tarefas: 'tarefa',
      alertas: 'alerta',
    };
    const t = map[filter];
    return t ? timelineEvents.filter(e => e.type === t) : timelineEvents;
  }, [timelineEvents, filter]);

  const groupedEvents = useMemo(() => {
    const groups = new Map<string, { label: string; items: TimelineEvent[] }>();
    filteredEvents.forEach(e => {
      const key = monthKey(e.date);
      if (!groups.has(key)) groups.set(key, { label: formatMonthYearBR(e.date), items: [] });
      groups.get(key)!.items.push(e);
    });
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filteredEvents]);

  if (loadingPatient) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (!patient) return <div className="p-8 text-muted-foreground">Paciente não encontrado</div>;

  const goals = parseGoals(patient.goals);
  const risk = riskLevel(patient);
  const activeLines = careLines.filter(l => (patient.linhas_ativas || []).includes(l.slug));

  const hba1cData = records.filter(r => r.field === 'hba1c').map(r => ({ date: r.date.substring(5), value: Number(r.value) }));
  const hba1cGoal = goals.find(g => g.field === 'hba1c');

  const initials = getInitials(patient.nome);

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={() => navigate('/pacientes')} className="gap-1 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      {/* Header */}
      <div className="flex items-start gap-4 card-elevated rounded-xl p-5 bg-card">
        <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-lg font-bold text-primary">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">{patient.nome}</h1>
            <RiskSemaphore level={risk} score={Number(patient.score_risco) || 0} />
          </div>
          <p className="text-xs text-muted-foreground">
            {formatSexo(patient.sexo)} · {formatDateBR(patient.data_nascimento)}
            {patient.convenio ? ` · ${patient.convenio}` : ''}
            {patient.unidade ? ` · ${patient.unidade}` : ''}
          </p>
          <div className="flex gap-1 mt-2">
            {activeLines.map(l => (
              <span key={l.id} className="status-chip text-[10px]" style={{ background: l.color + '22', color: l.color }}>{l.name}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Situação Atual */}
      <div>
        <p className="section-label">Situação por Linha de Cuidado</p>
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {journeys.map(j => {
            const line = findCareLineByRef(careLines, j.care_line_id);
            const lineGoals = goals.filter(g => g.careLineId === (line?.slug || j.care_line_id));
            const outGoals = lineGoals.filter(g => isOutOfTarget(g));

            return (
              <Card key={j.id} className="border-l-2 cursor-pointer hover:bg-muted/30 transition-colors" style={{ borderLeftColor: line?.color }} onClick={() => navigate('/jornadas')}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold" style={{ color: line?.color }}>{line?.name}</p>
                    <StatusChip status={j.status === 'ativa' ? 'em_andamento' : 'concluido'} className="text-[9px]" />
                  </div>
                  {outGoals.length > 0 && (
                    <div className="space-y-0.5">
                      {outGoals.map(g => (
                        <p key={g.field} className="text-[10px] text-[hsl(var(--destructive))]">
                          ✗ {g.label}: {g.currentValue}{g.unit} (meta {g.operator} {g.target})
                        </p>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-[10px] text-primary">
                    Ver jornada <ArrowRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Resumo Clínico</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="section-label">Diagnósticos Ativos</p>
              <div className="space-y-1">{(patient.diagnosticos_ativos || []).map((d, i) => <p key={i} className="text-sm text-foreground">{d}</p>)}</div>
            </div>
            <div>
              <p className="section-label">Alergias</p>
              <div className="space-y-1">{(patient.alergias || []).length ? (patient.alergias || []).map((a, i) => <p key={i} className="text-sm text-[hsl(var(--destructive))]">{a}</p>) : <p className="text-sm text-muted-foreground">NKDA</p>}</div>
            </div>
            <div>
              <p className="section-label">Fatores de Risco</p>
              <div className="space-y-1">{(patient.fatores_risco || []).map((f, i) => <p key={i} className="text-sm text-foreground">{f}</p>)}</div>
            </div>
            <div>
              <p className="section-label">Histórico Familiar</p>
              <div className="space-y-1">{(patient.historico_familiar || []).map((h, i) => <p key={i} className="text-sm text-foreground">{h}</p>)}</div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Pill className="h-4 w-4 text-primary" /> Medicações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {(patient.medicacoes || []).map((m, i) => <p key={i} className="text-xs text-foreground">{m}</p>)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Metas Clínicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {goals.map(g => <GoalProgress key={g.field} goal={g} compact />)}
            </CardContent>
          </Card>
        </div>
      </div>

      {hba1cData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Evolução HbA1c</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={hba1cData}>
                <XAxis dataKey="date" tick={{ fill: 'hsl(215,15%,50%)', fontSize: 10 }} />
                <YAxis domain={[6, 10]} tick={{ fill: 'hsl(215,15%,50%)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'hsl(216,20%,11%)', border: '1px solid hsl(216,16%,14%)', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                {hba1cGoal && (
                  <ReferenceLine y={hba1cGoal.target} stroke="hsl(152,69%,40%)" strokeDasharray="4 4" label={{ value: `Meta: ${hba1cGoal.target}%`, fill: 'hsl(152,69%,40%)', fontSize: 10, position: 'right' }} />
                )}
                <Line type="monotone" dataKey="value" stroke="hsl(207,100%,31%)" strokeWidth={2} dot={{ fill: 'hsl(207,100%,31%)' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Timeline melhorada */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-sm">Timeline de Eventos</CardTitle>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as TimelineFilter)}>
              <TabsList className="h-8">
                <TabsTrigger value="todos" className="text-xs h-6 px-2">Todos</TabsTrigger>
                <TabsTrigger value="consultas" className="text-xs h-6 px-2">Consultas</TabsTrigger>
                <TabsTrigger value="exames" className="text-xs h-6 px-2">Exames</TabsTrigger>
                <TabsTrigger value="tarefas" className="text-xs h-6 px-2">Tarefas</TabsTrigger>
                <TabsTrigger value="alertas" className="text-xs h-6 px-2">Alertas</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhum evento neste filtro</p>
          ) : (
            <div className="max-h-[480px] overflow-y-auto pr-2 space-y-5">
              {groupedEvents.map(([key, group]) => (
                <div key={key}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sticky top-0 bg-card/95 backdrop-blur-sm py-1.5 mb-2 z-10">
                    {group.label}
                  </p>
                  <div className="space-y-0">
                    {group.items.map(evt => {
                      const Icon = typeIcon[evt.type];
                      return (
                        <div key={evt.id} className="flex items-start gap-3 py-2.5 border-l-2 border-border pl-4 relative">
                          <div className={cn(
                            'absolute -left-[14px] top-2 h-7 w-7 rounded-full border-2 border-background flex items-center justify-center',
                            typeAccent[evt.type]
                          )}>
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="flex-1 ml-2 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                                {typeLabel[evt.type]}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-foreground">{evt.label}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatDateBR(evt.date)}
                              {evt.meta ? ` · ${evt.meta}` : ''}
                            </p>
                          </div>
                          <StatusChip status={evt.status} className="text-[9px] flex-shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Extrações IA */}
      <PatientExtractionsList patientId={patient.id} />

      {/* Anexos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-primary" /> Anexos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AttachmentList patientId={patient.id} compact />
        </CardContent>
      </Card>
    </div>
  );
}
