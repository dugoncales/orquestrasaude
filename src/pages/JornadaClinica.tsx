import { useState } from 'react';
import { mockJourneys } from '@/data/mock-data';
import { mockPatients } from '@/data/mock-patients';
import { careLines } from '@/data/care-lines';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusChip } from '@/components/shared/StatusChip';
import { Check, Clock, AlertTriangle, Lock, Circle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusIcons = { nao_iniciado: Circle, em_andamento: Clock, concluido: Check, atrasado: AlertTriangle, bloqueado: Lock };
const statusBg = {
  nao_iniciado: 'bg-secondary',
  em_andamento: 'bg-[hsl(var(--status-scheduled-bg))] border-[hsl(var(--status-scheduled))]',
  concluido: 'bg-[hsl(var(--status-completed-bg))] border-[hsl(var(--success))]',
  atrasado: 'bg-[hsl(var(--status-critical-bg))] border-[hsl(var(--destructive))]',
  bloqueado: 'bg-[hsl(var(--status-waiting-bg))] border-[hsl(var(--status-waiting))]',
};

export default function JornadaClinica() {
  const [selectedJourney, setSelectedJourney] = useState(mockJourneys[0].id);
  const journey = mockJourneys.find(j => j.id === selectedJourney)!;
  const patient = mockPatients.find(p => p.id === journey.patientId);
  const line = careLines.find(l => l.id === journey.careLineId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Jornada Clínica</h1>
          <p className="text-xs text-muted-foreground">Visualização interativa das etapas assistenciais</p>
        </div>
        <Select value={selectedJourney} onValueChange={setSelectedJourney}>
          <SelectTrigger className="w-[300px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {mockJourneys.map(j => {
              const p = mockPatients.find(pt => pt.id === j.patientId);
              const l = careLines.find(cl => cl.id === j.careLineId);
              return <SelectItem key={j.id} value={j.id}>{p?.nome} — {l?.name}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Patient + Line header */}
      <Card className="border-l-4" style={{ borderLeftColor: line?.color }}>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">{patient?.nome}</p>
            <p className="text-xs text-muted-foreground">{line?.name} · Início: {journey.startDate}</p>
          </div>
          <StatusChip status={journey.status === 'ativa' ? 'em_andamento' : 'concluido'} />
        </CardContent>
      </Card>

      {/* Horizontal timeline */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-2 min-w-max">
          {journey.steps.map((step, i) => {
            const Icon = statusIcons[step.status];
            const isCurrent = i === journey.currentStepIndex;
            return (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  'rounded-xl border p-3 w-[160px] transition-all',
                  statusBg[step.status],
                  isCurrent && 'ring-2 ring-primary/40 scale-105'
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-[10px] font-mono text-muted-foreground">#{i + 1}</span>
                  </div>
                  <p className="text-xs font-semibold text-foreground leading-tight mb-1">{step.name}</p>
                  <p className="text-[10px] text-muted-foreground">{step.responsavel}</p>
                  {step.prazo && <p className="text-[10px] text-muted-foreground">Prazo: {step.prazo}</p>}
                  {step.pendencias.length > 0 && (
                    <p className="text-[10px] text-[hsl(var(--status-pending))] mt-1 truncate">⚠ {step.pendencias[0]}</p>
                  )}
                  <div className="mt-2">
                    <StatusChip status={step.status} className="text-[9px]" />
                  </div>
                </div>
                {i < journey.steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground mx-1 flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current step detail */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Etapa Atual — {journey.steps[journey.currentStepIndex]?.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-muted-foreground">Responsável</p>
              <p className="font-medium text-foreground">{journey.steps[journey.currentStepIndex]?.responsavel}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Prazo</p>
              <p className="font-medium text-foreground">{journey.steps[journey.currentStepIndex]?.prazo}</p>
            </div>
          </div>
          {journey.steps[journey.currentStepIndex]?.pendencias.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Pendências</p>
              {journey.steps[journey.currentStepIndex].pendencias.map((p, i) => (
                <p key={i} className="text-xs text-[hsl(var(--status-pending))]">• {p}</p>
              ))}
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Próximo Passo</p>
            <p className="text-xs text-foreground font-medium">{journey.steps[journey.currentStepIndex + 1]?.name || 'Última etapa'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
