import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, FlaskConical, ClipboardList, Target, ArrowRight, Heart, MapPin } from 'lucide-react';
import { mockAppointments, mockExams, mockQuestionnaireResponses, mockJourneys } from '@/data/mock-data';
import { mockPatients } from '@/data/mock-patients';
import { careLines } from '@/data/care-lines';
import { StatusChip } from '@/components/shared/StatusChip';
import { GoalProgress, isOutOfTarget } from '@/components/shared/GoalProgress';
import { cn } from '@/lib/utils';

export default function DashboardPaciente() {
  const patientId = 'p1';
  const patient = mockPatients.find(p => p.id === patientId)!;
  const appointments = mockAppointments.filter(a => a.patientId === patientId && a.status === 'agendada');
  const exams = mockExams.filter(e => e.patientId === patientId && e.status !== 'resultado_disponivel');
  const questionnaires = mockQuestionnaireResponses.filter(q => q.patientId === patientId && q.status === 'pendente');
  const journeys = mockJourneys.filter(j => j.patientId === patientId);
  const activeLines = careLines.filter(l => patient.linhasAtivas.includes(l.id));
  const outOfTargetGoals = patient.goals.filter(g => isOutOfTarget(g));

  // Primary next step
  const primaryJourney = journeys[0];
  const nextStepName = primaryJourney?.steps[primaryJourney.currentStepIndex]?.name;
  const nextStepPendencias = primaryJourney?.steps[primaryJourney.currentStepIndex]?.pendencias || [];

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Welcome + Next Step Hero */}
      <div className="rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 p-6">
        <div className="flex items-center gap-3 mb-3">
          <Heart className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Olá, Maria!</h1>
        </div>
        <div className="bg-card/60 rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold text-muted-foreground uppercase">Seu Próximo Passo</p>
          </div>
          <p className="text-lg font-bold text-foreground">{nextStepName}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Você está em acompanhamento em {activeLines.length} linhas de cuidado.
            {nextStepPendencias.length > 0 && ` ${nextStepPendencias[0]}.`}
          </p>
        </div>
      </div>

      {/* Out of target alerts */}
      {outOfTargetGoals.length > 0 && (
        <Card className="border-[hsl(var(--status-pending))]/30 bg-[hsl(var(--status-pending-bg))]">
          <CardContent className="p-4">
            <p className="text-xs font-semibold text-[hsl(var(--status-pending))] mb-2">⚠ Atenção: parâmetros fora da meta</p>
            <div className="space-y-1">
              {outOfTargetGoals.map(g => (
                <p key={g.field} className="text-sm text-foreground">
                  <strong>{g.label}</strong>: {g.currentValue}{g.unit} — meta {g.operator} {g.target}{g.unit}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mini timeline — 3 steps */}
      {primaryJourney && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                Sua Jornada — {careLines.find(l => l.id === primaryJourney.careLineId)?.name}
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">Ver completa <ArrowRight className="h-3 w-3" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {[primaryJourney.currentStepIndex - 1, primaryJourney.currentStepIndex, primaryJourney.currentStepIndex + 1]
                .filter(i => i >= 0 && i < primaryJourney.steps.length)
                .map(i => {
                  const step = primaryJourney.steps[i];
                  const isCurrent = i === primaryJourney.currentStepIndex;
                  return (
                    <div key={step.id} className={cn(
                      'flex items-start gap-3 py-3 border-l-2 pl-4 relative',
                      isCurrent ? 'border-l-primary bg-primary/5 rounded-r-lg -ml-[2px] pl-[18px]' : 'border-l-border'
                    )}>
                      <div className={cn(
                        'absolute -left-[7px] top-4 h-3 w-3 rounded-full border-2',
                        step.status === 'concluido' ? 'bg-[hsl(var(--success))] border-[hsl(var(--success))]' :
                        isCurrent ? 'bg-primary border-primary' : 'bg-secondary border-border'
                      )} />
                      <div className="flex-1">
                        <p className={cn('text-sm font-medium', isCurrent ? 'text-foreground font-semibold' : 'text-muted-foreground')}>
                          {isCurrent && '→ '}{step.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{step.responsavel}</p>
                        {isCurrent && step.pendencias.length > 0 && (
                          <p className="text-xs text-[hsl(var(--status-pending))] mt-1">⚠ {step.pendencias[0]}</p>
                        )}
                      </div>
                      <StatusChip status={step.status} className="text-[9px]" />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goals with progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Metas Clínicas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {patient.goals.map(g => <GoalProgress key={g.field} goal={g} />)}
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Next appointments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Próximas Consultas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointments.length === 0 ? <p className="text-xs text-muted-foreground">Nenhuma consulta agendada</p> : appointments.slice(0, 3).map(a => (
              <div key={a.id} className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-medium text-foreground">{a.tipo}</p>
                  <p className="text-muted-foreground">{a.profissional} · {a.data} às {a.hora}</p>
                </div>
                <StatusChip status={a.status} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pending exams */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><FlaskConical className="h-4 w-4 text-primary" /> Exames Pendentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {exams.length === 0 ? <p className="text-xs text-muted-foreground">Nenhum exame pendente</p> : exams.map(e => (
              <div key={e.id} className="flex items-center justify-between text-xs">
                <p className="font-medium text-foreground">{e.tipo}</p>
                <StatusChip status={e.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Questionnaires */}
      {questionnaires.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" /> Questionários Pendentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {questionnaires.map(q => (
              <div key={q.id} className="flex items-center justify-between">
                <StatusChip status={q.status} />
                <Button size="sm" className="h-7 text-xs">Responder</Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
