import { JourneyStep } from '@/data/types';
import { cn } from '@/lib/utils';

interface JourneyProgressBarProps {
  steps: JourneyStep[];
  currentIndex: number;
}

const segmentColors: Record<string, string> = {
  concluido: 'bg-[hsl(var(--success))]',
  em_andamento: 'bg-[hsl(var(--info))]',
  atrasado: 'bg-[hsl(var(--destructive))]',
  bloqueado: 'bg-[hsl(var(--status-waiting))]',
  nao_iniciado: 'bg-secondary',
};

export function JourneyProgressBar({ steps, currentIndex }: JourneyProgressBarProps) {
  const completed = steps.filter(s => s.status === 'concluido').length;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground font-medium">Progresso da Jornada</span>
        <span className="font-mono font-semibold text-foreground">{completed}/{steps.length} etapas</span>
      </div>
      <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
        {steps.map((step, i) => (
          <div
            key={step.id}
            className={cn(
              'flex-1 transition-all relative',
              segmentColors[step.status],
              i === currentIndex && 'ring-1 ring-primary ring-offset-1 ring-offset-background rounded-sm'
            )}
          />
        ))}
      </div>
    </div>
  );
}
