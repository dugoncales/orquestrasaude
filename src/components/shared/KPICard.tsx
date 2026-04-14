import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

type AccentColor = 'success' | 'warning' | 'destructive' | 'info' | 'primary';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  className?: string;
  accentColor?: AccentColor;
}

const accentBorderMap: Record<AccentColor, string> = {
  success: 'border-t-[hsl(var(--success))]',
  warning: 'border-t-[hsl(var(--warning))]',
  destructive: 'border-t-[hsl(var(--destructive))]',
  info: 'border-t-[hsl(var(--info))]',
  primary: 'border-t-primary',
};

const accentIconBgMap: Record<AccentColor, string> = {
  success: 'bg-[hsl(var(--success))]/10',
  warning: 'bg-[hsl(var(--warning))]/10',
  destructive: 'bg-[hsl(var(--destructive))]/10',
  info: 'bg-[hsl(var(--info))]/10',
  primary: 'bg-primary/10',
};

const accentIconColorMap: Record<AccentColor, string> = {
  success: 'text-[hsl(var(--success))]',
  warning: 'text-[hsl(var(--warning))]',
  destructive: 'text-[hsl(var(--destructive))]',
  info: 'text-[hsl(var(--info))]',
  primary: 'text-primary',
};

export function KPICard({ title, value, subtitle, icon: Icon, trend, className, accentColor = 'primary' }: KPICardProps) {
  return (
    <div className={cn(
      'rounded-xl border border-border bg-gradient-to-br from-card to-card/80 p-4 md:p-5 border-t-2 transition-all hover:scale-[1.01] hover:shadow-lg',
      accentBorderMap[accentColor],
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest">{title}</p>
          <p className="text-2xl md:text-3xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <p className={cn('text-xs font-medium', trend.positive ? 'text-[hsl(var(--success))]' : 'text-[hsl(var(--destructive))]')}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0', accentIconBgMap[accentColor])}>
          <Icon className={cn('h-5 w-5', accentIconColorMap[accentColor])} />
        </div>
      </div>
    </div>
  );
}
