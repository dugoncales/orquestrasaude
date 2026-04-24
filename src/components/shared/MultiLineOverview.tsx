import { PatientGoal, JourneyStep } from '@/data/types';
import { isOutOfTarget } from './GoalProgress';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useCareLines } from '@/hooks/useCareLines';
import { mapCareLine, parseGoals, findCareLineByRef } from '@/lib/db-helpers';

interface MultiLineOverviewProps {
  patient: { goals: unknown; };
  journeys: Array<{ id: string; care_line_id: string; current_step_index: number | null; }>;
  steps: Array<{ journey_id: string; step_order: number; name: string; pendencias: string[] | null; status: string; responsavel: string | null; prazo: string | null; data_conclusao: string | null; consultas_vinculadas: string[] | null; exames_vinculados: string[] | null; tarefas_vinculadas: string[] | null; questionarios_vinculados: string[] | null; id: string; }>;
  activeJourneyId: string;
  onSelectJourney: (id: string) => void;
}

export function MultiLineOverview({ patient, journeys, steps, activeJourneyId, onSelectJourney }: MultiLineOverviewProps) {
  const { data: careLinesData } = useCareLines();
  const careLines = (careLinesData || []).map(mapCareLine);
  const goals = parseGoals(patient.goals);

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Linhas Ativas</p>
      <div className="space-y-1.5">
        {journeys.map(j => {
          const line = findCareLineByRef(careLines, j.care_line_id);
          const lineName = line?.name || '';
          const lineColor = line?.color || '';
          const lineSlug = line?.slug || j.care_line_id;

          const journeySteps = steps.filter(s => s.journey_id === j.id).sort((a, b) => a.step_order - b.step_order);
          const currentIdx = j.current_step_index ?? 0;
          const currentStep = journeySteps[currentIdx];
          const lineGoals = goals.filter(g => g.careLineId === lineSlug || g.careLineId === j.care_line_id);
          const outOfTarget = lineGoals.filter(g => isOutOfTarget(g));
          const totalPendencias = journeySteps.reduce((sum, s) => sum + (s.pendencias?.length || 0), 0);
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
                <div className="h-2 w-2 rounded-full" style={{ background: lineColor }} />
                <span className="text-xs font-semibold text-foreground">{lineName}</span>
                {totalPendencias > 0 && (
                  <span className="ml-auto text-[9px] font-mono text-[hsl(var(--status-pending))]">
                    {totalPendencias} pend.
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mb-1">
                Etapa {currentIdx + 1}/{journeySteps.length}: {currentStep?.name || '—'}
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
