import { cn } from '@/lib/utils';
import { RiskLevel } from '@/data/types';

const colors: Record<RiskLevel, string> = {
  baixo: 'bg-[hsl(var(--success))]',
  moderado: 'bg-[hsl(var(--warning))]',
  alto: 'bg-[hsl(var(--status-waiting))]',
  critico: 'bg-[hsl(var(--destructive))]',
};

export function RiskSemaphore({ level, score }: { level: RiskLevel; score?: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn('h-2.5 w-2.5 rounded-full', colors[level])} />
      {score !== undefined && <span className="text-xs text-muted-foreground font-mono">{score}</span>}
    </div>
  );
}
