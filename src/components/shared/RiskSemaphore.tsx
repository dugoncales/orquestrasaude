import { cn } from '@/lib/utils';
import { RiskLevel } from '@/data/types';

const colors: Record<RiskLevel, string> = {
  baixo: 'bg-[hsl(var(--success))]',
  moderado: 'bg-[hsl(var(--warning))]',
  alto: 'bg-[hsl(var(--status-waiting))]',
  critico: 'bg-[hsl(var(--destructive))]',
};

const labels: Record<RiskLevel, string> = {
  baixo: 'Baixo',
  moderado: 'Moderado',
  alto: 'Alto',
  critico: 'Crítico',
};

const textColors: Record<RiskLevel, string> = {
  baixo: 'text-[hsl(var(--success))]',
  moderado: 'text-[hsl(var(--warning))]',
  alto: 'text-[hsl(var(--status-waiting))]',
  critico: 'text-[hsl(var(--destructive))]',
};

export function RiskSemaphore({ level, score, showLabel = true }: { level: RiskLevel; score?: number; showLabel?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn('h-3 w-3 rounded-full', colors[level], level === 'critico' && 'animate-pulse ring-2 ring-[hsl(var(--destructive))]/30 ring-offset-1 ring-offset-background')} />
      {showLabel && <span className={cn('text-xs font-medium', textColors[level])}>{labels[level]}</span>}
      {score !== undefined && <span className="text-xs text-muted-foreground font-mono">{score}</span>}
    </div>
  );
}
