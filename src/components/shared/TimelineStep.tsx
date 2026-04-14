import { cn } from '@/lib/utils';
import { JourneyStep } from '@/data/types';
import { Check, Clock, AlertTriangle, Lock, Circle } from 'lucide-react';

const statusIcons = {
  nao_iniciado: Circle,
  em_andamento: Clock,
  concluido: Check,
  atrasado: AlertTriangle,
  bloqueado: Lock,
};

const statusColors = {
  nao_iniciado: 'border-secondary text-muted-foreground',
  em_andamento: 'border-[hsl(var(--status-scheduled))] text-[hsl(var(--status-scheduled))] bg-[hsl(var(--status-scheduled-bg))]',
  concluido: 'border-[hsl(var(--success))] text-[hsl(var(--success))] bg-[hsl(var(--status-completed-bg))]',
  atrasado: 'border-[hsl(var(--destructive))] text-[hsl(var(--destructive))] bg-[hsl(var(--status-critical-bg))]',
  bloqueado: 'border-[hsl(var(--status-waiting))] text-[hsl(var(--status-waiting))] bg-[hsl(var(--status-waiting-bg))]',
};

interface TimelineStepProps {
  step: JourneyStep;
  isLast: boolean;
  isCurrent: boolean;
}

export function TimelineStep({ step, isLast, isCurrent }: TimelineStepProps) {
  const Icon = statusIcons[step.status];
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div className={cn('h-8 w-8 rounded-full border-2 flex items-center justify-center flex-shrink-0', statusColors[step.status], isCurrent && 'ring-2 ring-primary/30')}>
          <Icon className="h-4 w-4" />
        </div>
        {!isLast && <div className="w-0.5 h-8 bg-border mt-1" />}
      </div>
      <div className="pb-6 min-w-0">
        <p className={cn('text-sm font-medium', isCurrent ? 'text-foreground' : 'text-muted-foreground')}>{step.name}</p>
        {step.responsavel && <p className="text-xs text-muted-foreground">{step.responsavel}</p>}
        {step.pendencias.length > 0 && (
          <p className="text-xs text-[hsl(var(--status-pending))] mt-1">⚠ {step.pendencias[0]}</p>
        )}
      </div>
    </div>
  );
}
