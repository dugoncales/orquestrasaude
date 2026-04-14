import { cn } from '@/lib/utils';
import { JourneyStepStatus, TaskStatus, AppointmentStatus, RiskLevel } from '@/data/types';

type ChipType = JourneyStepStatus | TaskStatus | AppointmentStatus | RiskLevel | string;

const chipStyles: Record<string, string> = {
  nao_iniciado: 'bg-secondary text-secondary-foreground',
  em_andamento: 'status-scheduled',
  concluido: 'status-completed',
  atrasado: 'status-critical',
  bloqueado: 'status-waiting',
  pendente: 'status-pending',
  concluida: 'status-completed',
  cancelada: 'bg-secondary text-secondary-foreground',
  atrasada: 'status-critical',
  agendada: 'status-scheduled',
  realizada: 'status-completed',
  faltou: 'status-critical',
  reagendada: 'status-pending',
  baixo: 'status-completed',
  moderado: 'status-pending',
  alto: 'status-waiting',
  critico: 'status-critical',
  solicitado: 'status-scheduled',
  coletado: 'status-pending',
  resultado_disponivel: 'status-completed',
  respondido: 'status-completed',
};

const dotColors: Record<string, string> = {
  nao_iniciado: 'bg-secondary-foreground/50',
  em_andamento: 'bg-[hsl(var(--status-scheduled))]',
  concluido: 'bg-[hsl(var(--status-completed))]',
  atrasado: 'bg-[hsl(var(--status-critical))]',
  bloqueado: 'bg-[hsl(var(--status-waiting))]',
  pendente: 'bg-[hsl(var(--status-pending))]',
  concluida: 'bg-[hsl(var(--status-completed))]',
  cancelada: 'bg-secondary-foreground/50',
  atrasada: 'bg-[hsl(var(--status-critical))]',
  agendada: 'bg-[hsl(var(--status-scheduled))]',
  realizada: 'bg-[hsl(var(--status-completed))]',
  faltou: 'bg-[hsl(var(--status-critical))]',
  reagendada: 'bg-[hsl(var(--status-pending))]',
  baixo: 'bg-[hsl(var(--status-completed))]',
  moderado: 'bg-[hsl(var(--status-pending))]',
  alto: 'bg-[hsl(var(--status-waiting))]',
  critico: 'bg-[hsl(var(--status-critical))]',
  solicitado: 'bg-[hsl(var(--status-scheduled))]',
  coletado: 'bg-[hsl(var(--status-pending))]',
  resultado_disponivel: 'bg-[hsl(var(--status-completed))]',
  respondido: 'bg-[hsl(var(--status-completed))]',
};

const chipLabels: Record<string, string> = {
  nao_iniciado: 'Não Iniciado', em_andamento: 'Em Andamento', concluido: 'Concluído',
  atrasado: 'Atrasado', bloqueado: 'Bloqueado', pendente: 'Pendente',
  concluida: 'Concluída', cancelada: 'Cancelada', atrasada: 'Atrasada',
  agendada: 'Agendada', realizada: 'Realizada', faltou: 'Faltou', reagendada: 'Reagendada',
  baixo: 'Baixo', moderado: 'Moderado', alto: 'Alto', critico: 'Crítico',
  solicitado: 'Solicitado', coletado: 'Coletado', resultado_disponivel: 'Resultado',
  respondido: 'Respondido',
};

export function StatusChip({ status, className }: { status: ChipType; className?: string }) {
  return (
    <span className={cn('status-chip', chipStyles[status] || 'bg-secondary text-secondary-foreground', className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', dotColors[status] || 'bg-secondary-foreground/50')} />
      {chipLabels[status] || status}
    </span>
  );
}
