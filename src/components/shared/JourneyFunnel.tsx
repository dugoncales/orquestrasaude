import { mockJourneys } from '@/data/mock-data';
import { cn } from '@/lib/utils';

const defaultSteps = [
  'Elegibilidade', 'Inclusão', 'Avaliação', 'Estratificação',
  'Plano', 'Seguimento', 'PROMs/PREMs', 'Reavaliação', 'Manutenção', 'Alta'
];

const slaByStep: Record<number, number> = { 0: 3, 1: 5, 2: 7, 3: 5, 4: 10, 5: 30, 6: 7, 7: 14, 8: 30, 9: 60 };

export function JourneyFunnel({ compact = false }: { compact?: boolean }) {
  const stageCount = defaultSteps.map((_, i) => {
    const count = mockJourneys.reduce((sum, j) => sum + (j.currentStepIndex === i ? 1 : 0), 0);
    return count;
  });
  const maxCount = Math.max(...stageCount, 1);

  // simulated avg days
  const avgDays = [2, 4, 8, 5, 6, 15, 4, 10, 20, 0];

  return (
    <div className="space-y-1.5">
      {defaultSteps.map((name, i) => {
        const count = stageCount[i];
        const width = Math.max(20, (count / maxCount) * 100);
        const isBottleneck = avgDays[i] > (slaByStep[i] || 999);

        return (
          <div key={i} className="flex items-center gap-2">
            <span className={cn('text-[10px] w-20 text-right text-muted-foreground truncate', compact && 'w-16')}>
              {name}
            </span>
            <div className="flex-1 relative h-5">
              <div
                className={cn(
                  'h-full rounded-r transition-all flex items-center px-2',
                  isBottleneck ? 'bg-[hsl(var(--destructive))]/20 border border-[hsl(var(--destructive))]/40' : 'bg-primary/15'
                )}
                style={{ width: `${width}%` }}
              >
                <span className={cn('text-[10px] font-semibold', isBottleneck ? 'text-[hsl(var(--destructive))]' : 'text-primary')}>
                  {count}
                </span>
              </div>
            </div>
            {!compact && (
              <span className={cn('text-[10px] w-12 text-right font-mono', isBottleneck ? 'text-[hsl(var(--destructive))]' : 'text-muted-foreground')}>
                {avgDays[i]}d
                {isBottleneck && ' ⚠'}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
