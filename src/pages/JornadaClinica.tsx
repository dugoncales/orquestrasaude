import { useState } from 'react';
import { mockJourneys, mockAppointments, mockExams, mockTasks, mockAlerts } from '@/data/mock-data';
import { mockPatients } from '@/data/mock-patients';
import { careLines } from '@/data/care-lines';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusChip } from '@/components/shared/StatusChip';
import { RiskSemaphore } from '@/components/shared/RiskSemaphore';
import { GoalProgress, isOutOfTarget } from '@/components/shared/GoalProgress';
import { ActionPanel } from '@/components/shared/ActionPanel';
import { AlertBanner } from '@/components/shared/AlertBanner';
import { Check, Clock, AlertTriangle, Lock, Circle, ChevronRight, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusIcons = { nao_iniciado: Circle, em_andamento: Clock, concluido: Check, atrasado: AlertTriangle, bloqueado: Lock };
const statusBg: Record<string, string> = {
  nao_iniciado: 'bg-secondary border-border',
  em_andamento: 'bg-[hsl(var(--status-scheduled-bg))] border-[hsl(var(--status-scheduled))]',
  concluido: 'bg-[hsl(var(--status-completed-bg))] border-[hsl(var(--success))]',
  atrasado: 'bg-[hsl(var(--status-critical-bg))] border-[hsl(var(--destructive))]',
  bloqueado: 'bg-[hsl(var(--status-waiting-bg))] border-[hsl(var(--status-waiting))]',
};

export default function JornadaClinica() {
  const [selectedPatientId, setSelectedPatientId] = useState('p1');
  const patientJourneys = mockJourneys.filter(j => j.patientId === selectedPatientId);
  const [selectedJourneyId, setSelectedJourneyId] = useState(patientJourneys[0]?.id || '');

  const patient = mockPatients.find(p => p.id === selectedPatientId)!;
  const journey = mockJourneys.find(j => j.id === selectedJourneyId) || patientJourneys[0];
  const line = careLines.find(l => l.id === journey?.careLineId);
  const patientAlerts = mockAlerts.filter(a => a.patientId === selectedPatientId && !a.lido);
  const goalsOutOfTarget = patient.goals.filter(g => isOutOfTarget(g));
  const lineGoals = patient.goals.filter(g => g.careLineId === journey?.careLineId);

  // Update journeys when patient changes
  const handlePatientChange = (pid: string) => {
    setSelectedPatientId(pid);
    const pJourneys = mockJourneys.filter(j => j.patientId === pid);
    setSelectedJourneyId(pJourneys[0]?.id || '');
  };

  if (!journey) return <div className="text-muted-foreground p-8">Nenhuma jornada encontrada</div>;

  const currentStep = journey.steps[journey.currentStepIndex];
  const nextStep = journey.steps[journey.currentStepIndex + 1];

  return (
    <div className="space-y-4">
      {/* Patient selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Jornada Clínica</h1>
          <p className="text-xs text-muted-foreground">Painel de comando assistencial</p>
        </div>
        <Select value={selectedPatientId} onValueChange={handlePatientChange}>
          <SelectTrigger className="w-[280px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {mockPatients.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ZONA A — Contexto do paciente */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RiskSemaphore level={patient.riskLevel} score={patient.scoreRisco} />
              <div>
                <p className="font-bold text-foreground">{patient.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {patient.diagnosticosAtivos.join(' · ')}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              {careLines.filter(l => patient.linhasAtivas.includes(l.id)).map(l => (
                <span key={l.id} className="status-chip text-[10px]" style={{ background: l.color + '22', color: l.color }}>{l.name.split(' ')[0]}</span>
              ))}
            </div>
          </div>

          {/* Out-of-target parameters */}
          {goalsOutOfTarget.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {goalsOutOfTarget.map(g => (
                <span key={g.field} className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))] rounded-full px-2.5 py-1 border border-[hsl(var(--destructive))]/20">
                  ✗ {g.label}: {g.currentValue}{g.unit} (meta {g.operator} {g.target})
                </span>
              ))}
            </div>
          )}

          {/* Alerts inline */}
          {patientAlerts.length > 0 && (
            <div className="space-y-1.5">
              {patientAlerts.map(a => <AlertBanner key={a.id} alert={a} />)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Journey tabs for multi-line patients */}
      {patientJourneys.length > 1 && (
        <Tabs value={selectedJourneyId} onValueChange={setSelectedJourneyId}>
          <TabsList className="bg-secondary">
            {patientJourneys.map(j => {
              const l = careLines.find(cl => cl.id === j.careLineId);
              return <TabsTrigger key={j.id} value={j.id} className="text-xs">{l?.name}</TabsTrigger>;
            })}
          </TabsList>
        </Tabs>
      )}

      {/* ZONA B — Timeline interativa */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-1.5 min-w-max">
          {journey.steps.map((step, i) => {
            const Icon = statusIcons[step.status];
            const isCurrent = i === journey.currentStepIndex;
            const hasPendencias = step.pendencias.length > 0;
            const linkedTaskCount = (step.tarefasVinculadas?.length || 0) + (step.examesVinculados?.length || 0) + (step.consultasVinculadas?.length || 0);

            return (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  'rounded-xl border p-3 transition-all relative',
                  isCurrent ? 'w-[200px]' : 'w-[140px]',
                  statusBg[step.status],
                  isCurrent && 'ring-2 ring-primary/50 scale-105 shadow-lg shadow-primary/10'
                )}>
                  {isCurrent && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full">
                      <MapPin className="h-2.5 w-2.5" /> VOCÊ ESTÁ AQUI
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 mb-1.5 mt-1">
                    <Icon className={cn('h-3.5 w-3.5 flex-shrink-0', isCurrent && 'text-primary')} />
                    <span className="text-[9px] font-mono text-muted-foreground">#{i + 1}</span>
                  </div>
                  <p className={cn('text-xs font-semibold text-foreground leading-tight mb-0.5', isCurrent && 'text-sm')}>{step.name}</p>
                  <p className="text-[10px] text-muted-foreground">{step.responsavel}</p>
                  {hasPendencias && (
                    <p className="text-[10px] text-[hsl(var(--status-pending))] mt-1 truncate">⚠ {step.pendencias[0]}</p>
                  )}
                  {linkedTaskCount > 0 && (
                    <div className="flex gap-1 mt-1.5">
                      {(step.consultasVinculadas?.length || 0) > 0 && <span className="text-[9px] bg-secondary rounded px-1.5 py-0.5 text-muted-foreground">📅 {step.consultasVinculadas!.length}</span>}
                      {(step.examesVinculados?.length || 0) > 0 && <span className="text-[9px] bg-secondary rounded px-1.5 py-0.5 text-muted-foreground">🔬 {step.examesVinculados!.length}</span>}
                      {(step.tarefasVinculadas?.length || 0) > 0 && <span className="text-[9px] bg-secondary rounded px-1.5 py-0.5 text-muted-foreground">✓ {step.tarefasVinculadas!.length}</span>}
                    </div>
                  )}
                  <div className="mt-2">
                    <StatusChip status={step.status} className="text-[9px]" />
                  </div>
                </div>
                {i < journey.steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-0.5 flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* ZONA C — Painel de ação da etapa atual */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Etapa Atual — {currentStep.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActionPanel
              step={currentStep}
              nextStep={nextStep}
              appointments={mockAppointments}
              exams={mockExams}
              tasks={mockTasks}
            />
          </CardContent>
        </Card>

        {/* Metas da linha ativa */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Metas — {line?.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lineGoals.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma meta definida</p>
            ) : (
              lineGoals.map(g => <GoalProgress key={g.field} goal={g} />)
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
