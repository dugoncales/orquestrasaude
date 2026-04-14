import { cn } from '@/lib/utils';
import { JourneyStepStatus, TaskStatus, AppointmentStatus, RiskLevel } from '@/data/types';

type ChipType = JourneyStepStatus | TaskStatus | AppointmentStatus | RiskLevel | string;

const chipStyles: Record<string, string> = {
  // Journey
  nao_iniciado: 'bg-secondary text-secondary-foreground',
  em_andamento: 'status-scheduled',
  concluido: 'status-completed',
  atrasado: 'status-critical',
  bloqueado: 'status-waiting',
  // Task
  pendente: 'status-pending',
  concluida: 'status-completed',
  cancelada: 'bg-secondary text-secondary-foreground',
  atrasada: 'status-critical',
  // Appointment
  agendada: 'status-scheduled',
  realizada: 'status-completed',
  faltou: 'status-critical',
  reagendada: 'status-pending',
  // Risk
  baixo: 'status-completed',
  moderado: 'status-pending',
  alto: 'status-waiting',
  critico: 'status-critical',
  // Exam
  solicitado: 'status-scheduled',
  coletado: 'status-pending',
  resultado_disponivel: 'status-completed',
  // Questionnaire
  respondido: 'status-completed',
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
      {chipLabels[status] || status}
    </span>
  );
}
