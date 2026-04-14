import { cn } from '@/lib/utils';
import { Alert } from '@/data/types';
import { AlertTriangle, Info, XCircle } from 'lucide-react';

const icons = { info: Info, warning: AlertTriangle, critical: XCircle };
const styles = {
  info: 'border-[hsl(var(--info))]/30 bg-[hsl(var(--info))]/5 text-[hsl(var(--info))]',
  warning: 'border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5 text-[hsl(var(--warning))]',
  critical: 'border-[hsl(var(--destructive))]/30 bg-[hsl(var(--destructive))]/5 text-[hsl(var(--destructive))]',
};

export function AlertBanner({ alert }: { alert: Alert }) {
  const Icon = icons[alert.severidade];
  return (
    <div className={cn('flex items-start gap-3 rounded-lg border p-3', styles[alert.severidade])}>
      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        {alert.patientName && <p className="text-xs font-semibold">{alert.patientName}</p>}
        <p className="text-xs opacity-90">{alert.mensagem}</p>
      </div>
    </div>
  );
}
