import { PatientGoal } from '@/data/types';
import { cn } from '@/lib/utils';

function isOutOfTarget(goal: PatientGoal): boolean {
  switch (goal.operator) {
    case '<': return goal.currentValue >= goal.target;
    case '>': return goal.currentValue <= goal.target;
    case '<=': return goal.currentValue > goal.target;
    case '>=': return goal.currentValue < goal.target;
    case '=': return goal.currentValue !== goal.target;
    default: return false;
  }
}

function getProgress(goal: PatientGoal): number {
  if (goal.operator === '<' || goal.operator === '<=') {
    if (goal.currentValue <= goal.target) return 100;
    const overshoot = goal.currentValue / goal.target;
    return Math.max(10, Math.round((1 / overshoot) * 100));
  }
  if (goal.operator === '>' || goal.operator === '>=') {
    if (goal.currentValue >= goal.target) return 100;
    return Math.max(10, Math.round((goal.currentValue / goal.target) * 100));
  }
  return goal.currentValue === goal.target ? 100 : 50;
}

export function GoalProgress({ goal, compact = false }: { goal: PatientGoal; compact?: boolean }) {
  const outOfTarget = isOutOfTarget(goal);
  const progress = getProgress(goal);

  return (
    <div className={cn('space-y-1', compact ? 'text-[10px]' : 'text-xs')}>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground font-medium">{goal.label}</span>
        <span className={cn('font-mono font-semibold', outOfTarget ? 'text-[hsl(var(--destructive))]' : 'text-[hsl(var(--success))]')}>
          {goal.currentValue}{goal.unit} {outOfTarget ? '✗' : '✓'}
        </span>
      </div>
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn('h-full rounded-full transition-all', outOfTarget ? 'bg-[hsl(var(--destructive))]' : 'bg-[hsl(var(--success))]')}
          style={{ width: `${progress}%` }}
        />
      </div>
      {!compact && (
        <p className="text-[10px] text-muted-foreground">
          Meta: {goal.operator} {goal.target}{goal.unit}
        </p>
      )}
    </div>
  );
}

export { isOutOfTarget };
