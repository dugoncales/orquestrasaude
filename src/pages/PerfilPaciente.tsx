import { useParams, useNavigate } from 'react-router-dom';
import { mockPatients } from '@/data/mock-patients';
import { mockJourneys, mockParameterRecords, mockAppointments, mockExams, mockTasks, mockAlerts } from '@/data/mock-data';
import { careLines } from '@/data/care-lines';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/shared/StatusChip';
import { RiskSemaphore } from '@/components/shared/RiskSemaphore';
import { GoalProgress, isOutOfTarget } from '@/components/shared/GoalProgress';
import { ArrowLeft, User, Activity, Pill, AlertTriangle, ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { cn } from '@/lib/utils';

export default function PerfilPaciente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = mockPatients.find(p => p.id === id);
  if (!patient) return <div className="p-8 text-muted-foreground">Paciente não encontrado</div>;

  const journeys = mockJourneys.filter(j => j.patientId === id);
  const records = mockParameterRecords.filter(r => r.patientId === id);
  const appointments = mockAppointments.filter(a => a.patientId === id);
  const tasks = mockTasks.filter(t => t.patientId === id);
  const alerts = mockAlerts.filter(a => a.patientId === id && !a.lido);
  const activeLines = careLines.filter(l => patient.linhasAtivas.includes(l.id));

  // Build timeline events
  const timelineEvents = [
    ...appointments.map(a => ({ date: a.data, type: 'consulta' as const, label: `${a.tipo} — ${a.profissional}`, status: a.status })),
    ...mockExams.filter(e => e.patientId === id).map(e => ({ date: e.dataSolicitacao, type: 'exame' as const, label: e.tipo, status: e.status })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const hba1cData = records.filter(r => r.field === 'hba1c').map(r => ({ date: r.date.substring(5), value: r.value }));
  const hba1cGoal = patient.goals.find(g => g.field === 'hba1c');

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" onClick={() => navigate('/pacientes')} className="gap-1 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
          <User className="h-7 w-7 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">{patient.nome}</h1>
            <RiskSemaphore level={patient.riskLevel} score={patient.scoreRisco} />
          </div>
          <p className="text-xs text-muted-foreground">{patient.sexo === 'F' ? 'Feminino' : 'Masculino'} · {patient.dataNascimento} · {patient.convenio} · {patient.unidade}</p>
          <div className="flex gap-1 mt-2">
            {activeLines.map(l => (
              <span key={l.id} className="status-chip text-[10px]" style={{ background: l.color + '22', color: l.color }}>{l.name}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Situação Atual — por linha ativa */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {journeys.map(j => {
          const line = careLines.find(l => l.id === j.careLineId);
          const currentStep = j.steps[j.currentStepIndex];
          const lineGoals = patient.goals.filter(g => g.careLineId === j.careLineId);
          const outGoals = lineGoals.filter(g => isOutOfTarget(g));
          const topPendencia = currentStep?.pendencias[0];

          return (
            <Card key={j.id} className="border-l-2 cursor-pointer hover:bg-muted/30 transition-colors" style={{ borderLeftColor: line?.color }} onClick={() => navigate('/jornadas')}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold" style={{ color: line?.color }}>{line?.name}</p>
                  <StatusChip status={j.status === 'ativa' ? 'em_andamento' : 'concluido'} className="text-[9px]" />
                </div>
                <p className="text-sm font-semibold text-foreground">Etapa: {currentStep?.name}</p>
                {outGoals.length > 0 && (
                  <div className="space-y-0.5">
                    {outGoals.map(g => (
                      <p key={g.field} className="text-[10px] text-[hsl(var(--destructive))]">
                        ✗ {g.label}: {g.currentValue}{g.unit} (meta {g.operator} {g.target})
                      </p>
                    ))}
                  </div>
                )}
                {topPendencia && <p className="text-[10px] text-[hsl(var(--status-pending))]">⚠ {topPendencia}</p>}
                <div className="flex items-center gap-1 text-[10px] text-primary">
                  Ver jornada <ArrowRight className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Clinical summary */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Resumo Clínico</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Diagnósticos Ativos</p>
              <div className="space-y-1">{patient.diagnosticosAtivos.map((d, i) => <p key={i} className="text-sm text-foreground">{d}</p>)}</div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Alergias</p>
              <div className="space-y-1">{patient.alergias.length ? patient.alergias.map((a, i) => <p key={i} className="text-sm text-[hsl(var(--destructive))]">{a}</p>) : <p className="text-sm text-muted-foreground">NKDA</p>}</div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Fatores de Risco</p>
              <div className="space-y-1">{patient.fatoresRisco.map((f, i) => <p key={i} className="text-sm text-foreground">{f}</p>)}</div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Histórico Familiar</p>
              <div className="space-y-1">{patient.historicoFamiliar.map((h, i) => <p key={i} className="text-sm text-foreground">{h}</p>)}</div>
            </div>
          </CardContent>
        </Card>

        {/* Medications + Goals */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Pill className="h-4 w-4 text-primary" /> Medicações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {patient.medicacoes.map((m, i) => <p key={i} className="text-xs text-foreground">{m}</p>)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Metas Clínicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {patient.goals.map(g => <GoalProgress key={g.field} goal={g} compact />)}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Parameter evolution with goal reference line */}
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
                <Tooltip contentStyle={{ background: 'hsl(220,18%,12%)', border: '1px solid hsl(220,14%,16%)', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                {hba1cGoal && (
                  <ReferenceLine y={hba1cGoal.target} stroke="hsl(152,69%,40%)" strokeDasharray="4 4" label={{ value: `Meta: ${hba1cGoal.target}%`, fill: 'hsl(152,69%,40%)', fontSize: 10, position: 'right' }} />
                )}
                <Line type="monotone" dataKey="value" stroke="hsl(355,86%,52%)" strokeWidth={2} dot={{ fill: 'hsl(355,86%,52%)' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Unified timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Timeline de Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {timelineEvents.slice(0, 8).map((evt, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-l-2 border-border pl-4 relative">
                <div className={cn(
                  'absolute -left-[5px] top-3 h-2.5 w-2.5 rounded-full',
                  evt.type === 'consulta' ? 'bg-[hsl(var(--info))]' : 'bg-[hsl(var(--status-pending))]'
                )} />
                <div className="flex-1">
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
