import { JourneyStep, Appointment, Exam, Task, QuestionnaireResponse } from '@/data/types';
import { StatusChip } from './StatusChip';
import { Button } from '@/components/ui/button';
import { Calendar, FlaskConical, ListChecks, AlertTriangle, User, Clock, ChevronRight, FileQuestion, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionPanelProps {
  step: JourneyStep;
  nextStep?: JourneyStep;
  appointments: Appointment[];
  exams: Exam[];
  tasks: Task[];
  questionnaires?: QuestionnaireResponse[];
  onAdvanceStep?: () => void;
  daysInStep?: number;
}

export function ActionPanel({ step, nextStep, appointments, exams, tasks, questionnaires = [], onAdvanceStep, daysInStep }: ActionPanelProps) {
  const linkedAppointments = appointments.filter(a => step.consultasVinculadas?.includes(a.id));
  const linkedExams = exams.filter(e => step.examesVinculados?.includes(e.id));
  const linkedTasks = tasks.filter(t => step.tarefasVinculadas?.includes(t.id));
  const linkedQuestionnaires = questionnaires.filter(q => step.questionariosVinculados?.includes(q.id));

  return (
    <div className="space-y-5">
      {/* Responsável + Prazo + Dias na etapa */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-2.5 rounded-lg bg-secondary/50 p-3">
          <User className="h-4 w-4 text-primary" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Responsável</p>
            <p className="text-sm font-semibold text-foreground">{step.responsavel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-lg bg-secondary/50 p-3">
          <Clock className="h-4 w-4 text-[hsl(var(--info))]" />
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Prazo</p>
            <p className="text-sm font-semibold text-foreground">{step.prazo}</p>
          </div>
        </div>
        {daysInStep !== undefined && (
          <div className="flex items-center gap-2.5 rounded-lg bg-secondary/50 p-3">
            <Calendar className="h-4 w-4 text-[hsl(var(--status-pending))]" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Dias na Etapa</p>
              <p className={cn('text-sm font-semibold', daysInStep > 30 ? 'text-[hsl(var(--destructive))]' : 'text-foreground')}>{daysInStep}d</p>
            </div>
          </div>
        )}
      </div>

      {/* Pendências */}
      {step.pendencias.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--status-pending))]" /> Pendências ({step.pendencias.length})
          </p>
          <div className="space-y-1.5">
            {step.pendencias.map((p, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-[hsl(var(--status-pending))] bg-[hsl(var(--status-pending-bg))] rounded-lg px-3 py-2 border border-[hsl(var(--status-pending))]/10">
                <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Consultas vinculadas */}
      {linkedAppointments.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Consultas ({linkedAppointments.length})
          </p>
          <div className="space-y-1.5">
            {linkedAppointments.map(a => (
              <div key={a.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-secondary/30 border border-border">
                <div>
                  <p className="text-foreground font-medium">{a.tipo} — {a.profissional}</p>
                  <p className="text-muted-foreground text-[10px]">{a.data} às {a.hora}</p>
                </div>
                <StatusChip status={a.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exames vinculados */}
      {linkedExams.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FlaskConical className="h-3.5 w-3.5" /> Exames ({linkedExams.length})
          </p>
          <div className="space-y-1.5">
            {linkedExams.map(e => (
              <div key={e.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-secondary/30 border border-border">
                <div>
                  <p className="text-foreground font-medium">{e.tipo}</p>
                  <p className="text-muted-foreground text-[10px]">{e.resultado || `Solicitado: ${e.dataSolicitacao}`}</p>
                </div>
                <StatusChip status={e.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tarefas vinculadas */}
      {linkedTasks.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ListChecks className="h-3.5 w-3.5" /> Tarefas ({linkedTasks.length})
          </p>
          <div className="space-y-1.5">
            {linkedTasks.map(t => (
              <div key={t.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-secondary/30 border border-border">
                <div>
                  <p className="text-foreground font-medium">{t.descricao}</p>
                  <p className="text-muted-foreground text-[10px]">{t.responsavel} · {t.prazo}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-[9px] font-semibold px-1.5 py-0.5 rounded',
                    t.prioridade === 'urgente' && 'bg-[hsl(var(--destructive))]/15 text-[hsl(var(--destructive))]',
                    t.prioridade === 'alta' && 'bg-[hsl(var(--status-waiting))]/15 text-[hsl(var(--status-waiting))]',
                    t.prioridade === 'media' && 'bg-[hsl(var(--status-pending))]/15 text-[hsl(var(--status-pending))]',
                    t.prioridade === 'baixa' && 'bg-secondary text-muted-foreground',
                  )}>{t.prioridade}</span>
                  <StatusChip status={t.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Questionários vinculados */}
      {linkedQuestionnaires.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ClipboardList className="h-3.5 w-3.5" /> Questionários ({linkedQuestionnaires.length})
          </p>
          <div className="space-y-1.5">
            {linkedQuestionnaires.map(q => (
              <div key={q.id} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-secondary/30 border border-border">
                <div>
                  <p className="text-foreground font-medium">PROM/PREM — Score: {q.score}/{q.maxScore}</p>
                  <p className="text-muted-foreground text-[10px]">{q.data}</p>
                </div>
                <StatusChip status={q.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Próximo passo */}
      {nextStep && (
        <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
          <p className="text-[10px] font-semibold text-primary uppercase tracking-wider mb-1 flex items-center gap-1">
            <ChevronRight className="h-3 w-3" /> Próximo Passo
          </p>
          <p className="text-sm font-semibold text-foreground">{nextStep.name}</p>
          <p className="text-[10px] text-muted-foreground">{nextStep.responsavel} · Prazo: {nextStep.prazo}</p>
        </div>
      )}

      {/* Ações rápidas */}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button size="sm" className="text-xs h-9 gap-1.5" onClick={onAdvanceStep}>
          <ChevronRight className="h-4 w-4" /> Avançar Etapa
        </Button>
        <Button size="sm" variant="outline" className="text-xs h-9 gap-1.5">
          <FlaskConical className="h-3.5 w-3.5" /> Solicitar Exame
        </Button>
        <Button size="sm" variant="outline" className="text-xs h-9 gap-1.5">
          <Calendar className="h-3.5 w-3.5" /> Agendar Retorno
        </Button>
        <Button size="sm" variant="outline" className="text-xs h-9 gap-1.5">
          <FileQuestion className="h-3.5 w-3.5" /> Aplicar PROM
        </Button>
      </div>
    </div>
  );
}
