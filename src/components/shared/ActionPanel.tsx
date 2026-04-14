import { JourneyStep, Appointment, Exam, Task } from '@/data/types';
import { StatusChip } from './StatusChip';
import { Button } from '@/components/ui/button';
import { Calendar, FlaskConical, ListChecks, AlertTriangle, User, Clock } from 'lucide-react';

interface ActionPanelProps {
  step: JourneyStep;
  nextStep?: JourneyStep;
  appointments: Appointment[];
  exams: Exam[];
  tasks: Task[];
}

export function ActionPanel({ step, nextStep, appointments, exams, tasks }: ActionPanelProps) {
  const linkedAppointments = appointments.filter(a => step.consultasVinculadas?.includes(a.id));
  const linkedExams = exams.filter(e => step.examesVinculados?.includes(e.id));
  const linkedTasks = tasks.filter(t => step.tarefasVinculadas?.includes(t.id));

  return (
    <div className="space-y-4">
      {/* Responsável + Prazo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-xs">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <p className="text-muted-foreground">Responsável</p>
            <p className="font-semibold text-foreground">{step.responsavel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <div>
            <p className="text-muted-foreground">Prazo</p>
            <p className="font-semibold text-foreground">{step.prazo}</p>
          </div>
        </div>
      </div>

      {/* Pendências */}
      {step.pendencias.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-[hsl(var(--status-pending))]" /> Pendências
          </p>
          <div className="space-y-1">
            {step.pendencias.map((p, i) => (
              <p key={i} className="text-xs text-[hsl(var(--status-pending))] bg-[hsl(var(--status-pending-bg))] rounded px-2 py-1">⚠ {p}</p>
            ))}
          </div>
        </div>
      )}

      {/* Consultas vinculadas */}
      {linkedAppointments.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Consultas
          </p>
          {linkedAppointments.map(a => (
            <div key={a.id} className="flex items-center justify-between text-xs py-1">
              <div>
                <p className="text-foreground font-medium">{a.tipo} — {a.profissional}</p>
                <p className="text-muted-foreground">{a.data} às {a.hora}</p>
              </div>
              <StatusChip status={a.status} />
            </div>
          ))}
        </div>
      )}

      {/* Exames vinculados */}
      {linkedExams.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 flex items-center gap-1">
            <FlaskConical className="h-3 w-3" /> Exames
          </p>
          {linkedExams.map(e => (
            <div key={e.id} className="flex items-center justify-between text-xs py-1">
              <div>
                <p className="text-foreground font-medium">{e.tipo}</p>
                <p className="text-muted-foreground">{e.resultado || `Solicitado: ${e.dataSolicitacao}`}</p>
              </div>
              <StatusChip status={e.status} />
            </div>
          ))}
        </div>
      )}

      {/* Tarefas vinculadas */}
      {linkedTasks.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5 flex items-center gap-1">
            <ListChecks className="h-3 w-3" /> Tarefas
          </p>
          {linkedTasks.map(t => (
            <div key={t.id} className="flex items-center justify-between text-xs py-1">
              <div>
                <p className="text-foreground font-medium">{t.descricao}</p>
                <p className="text-muted-foreground">{t.responsavel} · {t.prazo}</p>
              </div>
              <StatusChip status={t.status} />
            </div>
          ))}
        </div>
      )}

      {/* Próximo passo */}
      {nextStep && (
        <div className="border-t border-border pt-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Próximo Passo</p>
          <p className="text-sm font-semibold text-foreground">{nextStep.name}</p>
          <p className="text-xs text-muted-foreground">{nextStep.responsavel}</p>
        </div>
      )}

      {/* Ações rápidas */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button size="sm" className="text-xs h-8">Marcar Concluído</Button>
        <Button size="sm" variant="outline" className="text-xs h-8">Solicitar Exame</Button>
        <Button size="sm" variant="outline" className="text-xs h-8">Agendar Retorno</Button>
      </div>
    </div>
  );
}
