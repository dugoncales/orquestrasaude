import { useParams, useNavigate } from 'react-router-dom';
import { usePatient } from '@/hooks/usePatients';
import { useJourneys } from '@/hooks/useJourneys';
import { useAppointments } from '@/hooks/useAppointments';
import { useExams } from '@/hooks/useExams';
import { useTasks } from '@/hooks/useTasks';
import { useAlerts } from '@/hooks/useAlerts';
import { useParameterRecords } from '@/hooks/useParameterRecords';
import { useCareLines } from '@/hooks/useCareLines';
import { parseGoals, riskLevel, mapCareLine } from '@/lib/db-helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/shared/StatusChip';
import { RiskSemaphore } from '@/components/shared/RiskSemaphore';
import { GoalProgress, isOutOfTarget } from '@/components/shared/GoalProgress';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Activity, Pill, AlertTriangle, ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { cn } from '@/lib/utils';

export default function PerfilPaciente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: patient, isLoading: loadingPatient } = usePatient(id);
  const { data: journeysData } = useJourneys(id);
  const { data: appointmentsData } = useAppointments();
  const { data: examsData } = useExams();
  const { data: tasksData } = useTasks();
  const { data: alertsData } = useAlerts();
  const { data: paramRecords } = useParameterRecords();
  const { data: careLinesData } = useCareLines();

  if (loadingPatient) return <div className="space-y-4 p-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-40 w-full" /></div>;
  if (!patient) return <div className="p-8 text-muted-foreground">Paciente não encontrado</div>;

  const goals = parseGoals(patient.goals);
  const risk = riskLevel(patient);
  const careLines = (careLinesData || []).map(mapCareLine);
  const journeys = (journeysData || []);
  const appointments = (appointmentsData || []).filter(a => a.patient_id === id);
  const exams = (examsData || []).filter(e => e.patient_id === id);
  const alerts = (alertsData || []).filter(a => a.patient_id === id && !a.lido);
  const records = (paramRecords || []).filter(r => r.patient_id === id);
  const activeLines = careLines.filter(l => (patient.linhas_ativas || []).includes(l.id));

  const timelineEvents = [
    ...appointments.map(a => ({ date: a.data, type: 'consulta' as const, label: `${a.tipo} — ${a.profissional}`, status: a.status })),
    ...exams.map(e => ({ date: e.data_solicitacao, type: 'exame' as const, label: e.tipo, status: e.status })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const hba1cData = records.filter(r => r.field === 'hba1c').map(r => ({ date: r.date.substring(5), value: Number(r.value) }));
  const hba1cGoal = goals.find(g => g.field === 'hba1c');

  const initials = patient.nome.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

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
            <RiskSemaphore level={risk} score={patient.score_risco || 0} />
          </div>
          <p className="text-xs text-muted-foreground">{patient.sexo === 'F' ? 'Feminino' : 'Masculino'} · {patient.data_nascimento} · {patient.convenio} · {patient.unidade}</p>
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
            const clRow = (careLinesData || []).find(c => c.id === j.care_line_id);
            const line = clRow ? mapCareLine(clRow) : null;
            const lineGoals = goals.filter(g => g.careLineId === (clRow?.slug || j.care_line_id));
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

      {/* Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Timeline de Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {timelineEvents.slice(0, 8).map((evt, i) => (
              <div key={i} className="flex items-start gap-3 py-2.5 border-l-2 border-border pl-4 relative">
                <div className={cn(
                  'absolute -left-[6px] top-3.5 h-3 w-3 rounded-full border-2 border-background',
                  evt.type === 'consulta' ? 'bg-[hsl(var(--info))]' : 'bg-[hsl(var(--status-pending))]'
                )} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {evt.type === 'consulta' ? 'Consulta' : 'Exame'}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-foreground">{evt.label}</p>
                  <p className="text-[10px] text-muted-foreground">{evt.date}</p>
                </div>
                <StatusChip status={evt.status} className="text-[9px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
