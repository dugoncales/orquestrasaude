import { Patient, Journey } from '@/data/types';
import { careLines } from '@/data/care-lines';
import { isOutOfTarget } from './GoalProgress';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface MultiLineOverviewProps {
  patient: Patient;
  journeys: Journey[];
  activeJourneyId: string;
  onSelectJourney: (id: string) => void;
}

export function MultiLineOverview({ patient, journeys, activeJourneyId, onSelectJourney }: MultiLineOverviewProps) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Linhas Ativas</p>
      <div className="space-y-1.5">
        {journeys.map(j => {
          const line = careLines.find(l => l.id === j.careLineId);
          const currentStep = j.steps[j.currentStepIndex];
          const lineGoals = patient.goals.filter(g => g.careLineId === j.careLineId);
          const outOfTarget = lineGoals.filter(g => isOutOfTarget(g));
          const totalPendencias = j.steps.reduce((sum, s) => sum + s.pendencias.length, 0);
          const isActive = j.id === activeJourneyId;

          return (
            <button
              key={j.id}
              onClick={() => onSelectJourney(j.id)}
              className={cn(
                'w-full text-left rounded-lg border p-2.5 transition-all',
                isActive
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-border hover:border-primary/30 bg-card'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2 w-2 rounded-full" style={{ background: line?.color }} />
                <span className="text-xs font-semibold text-foreground">{line?.name}</span>
                {totalPendencias > 0 && (
                  <span className="ml-auto text-[9px] font-mono text-[hsl(var(--status-pending))]">
                    {totalPendencias} pend.
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mb-1">
                Etapa {j.currentStepIndex + 1}/{j.steps.length}: {currentStep.name}
              </p>
              {outOfTarget.length > 0 ? (
                <div className="flex items-center gap-1 text-[9px] text-[hsl(var(--destructive))]">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  {outOfTarget.map(g => `${g.label} ${g.currentValue}${g.unit}`).join(', ')}
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[9px] text-[hsl(var(--success))]">
                  <CheckCircle2 className="h-2.5 w-2.5" /> Todas as metas em dia
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
