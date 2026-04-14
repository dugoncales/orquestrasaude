import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, FlaskConical, ClipboardList, Target, Heart, CheckCircle2, Clock, ChevronRight, Stethoscope, Lightbulb } from 'lucide-react';
import { mockAppointments, mockExams, mockQuestionnaireResponses, mockJourneys, mockOrientacoes } from '@/data/mock-data';
import { mockPatients } from '@/data/mock-patients';
import { careLines } from '@/data/care-lines';
import { isOutOfTarget } from '@/components/shared/GoalProgress';
import { cn } from '@/lib/utils';
import { useState } from 'react';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

const friendlyLabels: Record<string, string> = {
  hba1c: 'Controle do açúcar',
  pas: 'Pressão arterial',
  peso: 'Peso',
  ldl: 'Colesterol',
  phq9: 'Bem-estar emocional',
  imc: 'Índice de massa corporal',
};

const friendlyExamStatus: Record<string, string> = {
  solicitado: 'Precisa realizar',
  coletado: 'Aguardando resultado',
  resultado_disponivel: 'Resultado disponível',
  atrasado: 'Atrasado — procure realizá-lo',
};

export default function DashboardPaciente() {
  const patientId = 'p1';
  const patient = mockPatients.find(p => p.id === patientId)!;
  const firstName = patient.nome.split(' ')[0];

  const journeys = mockJourneys.filter(j => j.patientId === patientId);
  const appointments = mockAppointments.filter(a => a.patientId === patientId && a.status === 'agendada');
  const exams = mockExams.filter(e => e.patientId === patientId && e.status !== 'resultado_disponivel');
  const questionnaires = mockQuestionnaireResponses.filter(q => q.patientId === patientId && q.status === 'pendente');
  const orientacoes = mockOrientacoes.filter(o => o.patientId === patientId);
  const activeLines = careLines.filter(l => patient.linhasAtivas.includes(l.id));

  const [selectedLineId, setSelectedLineId] = useState(journeys[0]?.careLineId || '');
  const activeJourney = journeys.find(j => j.careLineId === selectedLineId) || journeys[0];

  const totalPending = appointments.length + exams.length + questionnaires.length;
  const outOfTargetGoals = patient.goals.filter(g => isOutOfTarget(g));

  // Mini journey: prev, current, next
  const currentStep = activeJourney?.steps[activeJourney.currentStepIndex];
  const prevStep = activeJourney?.steps[activeJourney.currentStepIndex - 1];
  const nextStep = activeJourney?.steps[activeJourney.currentStepIndex + 1];

  return (
    <div className="space-y-5 max-w-lg mx-auto pb-12">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/12 via-primary/6 to-transparent border border-primary/15 p-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-primary">{firstName[0]}</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{getGreeting()}, {firstName}!</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {totalPending > 0
                ? `Você tem ${totalPending} ${totalPending === 1 ? 'item que precisa' : 'itens que precisam'} da sua atenção`
                : 'Tudo em dia! Continue assim 💪'}
            </p>
          </div>
        </div>
      </div>

      {/* Próximo Passo — destaque principal */}
      {currentStep && (
        <Card className="rounded-2xl border-l-4 overflow-hidden" style={{ borderLeftColor: careLines.find(l => l.id === activeJourney.careLineId)?.color }}>
          <CardContent className="p-5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Seu próximo passo</p>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Stethoscope className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-foreground">{currentStep.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentStep.pendencias.length > 0
                    ? currentStep.pendencias[0]
                    : 'Acompanhamento em andamento'}
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Responsável: <span className="text-foreground font-medium">{currentStep.responsavel}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs por linha de cuidado */}
      {activeLines.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {activeLines.map(l => {
            const isActive = l.id === selectedLineId;
            return (
              <button
                key={l.id}
                onClick={() => setSelectedLineId(l.id)}
                className={cn(
                  'px-4 h-10 rounded-full text-sm font-medium whitespace-nowrap transition-all border',
                  isActive
                    ? 'text-foreground border-primary/40 bg-primary/10'
                    : 'text-muted-foreground border-border bg-card hover:bg-muted/50'
                )}
              >
                {l.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Mini jornada simplificada */}
      {activeJourney && (
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-4">Sua jornada</p>
            <div className="space-y-0">
              {/* Previous step */}
              {prevStep && (
                <div className="flex items-center gap-3 pb-4 relative">
                  <div className="absolute left-[13px] top-7 bottom-0 w-0.5 bg-[hsl(var(--success))]/40" />
                  <CheckCircle2 className="h-7 w-7 text-[hsl(var(--success))] flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{prevStep.name}</p>
                </div>
              )}
              {/* Current step */}
              <div className="flex items-start gap-3 py-3 px-3 -mx-3 rounded-xl bg-primary/5 border border-primary/15 relative">
                {nextStep && <div className="absolute left-[25px] top-[42px] bottom-0 w-0.5 bg-border" />}
                <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 animate-pulse">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{currentStep?.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Etapa atual</p>
                  {currentStep && currentStep.pendencias.length > 0 && (
                    <p className="text-xs text-[hsl(var(--status-pending))] mt-1">
                      ⚠ {currentStep.pendencias[0]}
                    </p>
                  )}
                </div>
              </div>
              {/* Next step */}
              {nextStep && (
                <div className="flex items-center gap-3 pt-4">
                  <div className="h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">{nextStep.name}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Próximas Consultas */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" /> Próximas consultas
        </p>
        {appointments.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="p-5 text-center text-sm text-muted-foreground">
              Nenhuma consulta agendada
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {appointments.slice(0, 3).map(a => (
              <Card key={a.id} className="rounded-2xl">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-[hsl(var(--info))]/10 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-5 w-5 text-[hsl(var(--info))]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{a.tipo}</p>
                    <p className="text-xs text-muted-foreground">{a.profissional}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      {a.data} às {a.hora}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Exames Pendentes */}
      {exams.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <FlaskConical className="h-3.5 w-3.5" /> Exames
          </p>
          <div className="space-y-2">
            {exams.map(e => (
              <Card key={e.id} className="rounded-2xl">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={cn(
                    'h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0',
                    e.status === 'atrasado' ? 'bg-[hsl(var(--destructive))]/10' : 'bg-[hsl(var(--status-pending))]/10'
                  )}>
                    <FlaskConical className={cn(
                      'h-5 w-5',
                      e.status === 'atrasado' ? 'text-[hsl(var(--destructive))]' : 'text-[hsl(var(--status-pending))]'
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{e.tipo}</p>
                    <p className="text-xs text-muted-foreground">{friendlyExamStatus[e.status] || e.status}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Questionários Pendentes */}
      {questionnaires.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <ClipboardList className="h-3.5 w-3.5" /> Questionários
          </p>
          <div className="space-y-2">
            {questionnaires.map(q => (
              <Card key={q.id} className="rounded-2xl">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Nos conte como você está</p>
                    <p className="text-xs text-muted-foreground">~3 min para responder</p>
                  </div>
                  <Button size="sm" className="h-10 px-5 rounded-xl text-sm font-medium">
                    Responder
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Metas Clínicas */}
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Target className="h-3.5 w-3.5" /> Suas metas
        </p>
        <Card className="rounded-2xl">
          <CardContent className="p-4 space-y-4">
            {patient.goals.map(g => {
              const out = isOutOfTarget(g);
              const label = friendlyLabels[g.field] || g.label;
              return (
                <div key={g.field} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground font-medium">{label}</span>
                    <span className={cn(
                      'text-sm font-semibold',
                      out ? 'text-[hsl(var(--status-pending))]' : 'text-[hsl(var(--success))]'
                    )}>
                      {out ? '⚠️ Precisa atenção' : '🎯 No alvo'}
                    </span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        out
                          ? 'bg-gradient-to-r from-[hsl(var(--status-pending))] to-[hsl(var(--status-pending))]/70'
                          : 'bg-gradient-to-r from-[hsl(var(--success))] to-[hsl(var(--success))]/70'
                      )}
                      style={{ width: out ? '60%' : '100%' }}
                    />
                  </div>
                  {out && (
                    <p className="text-xs text-muted-foreground">
                      Atual: {g.currentValue}{g.unit} · Meta: {g.operator} {g.target}{g.unit}
                    </p>
                  )}
                  {!out && (
                    <p className="text-xs text-[hsl(var(--success))]">
                      Parabéns! Seu controle está dentro da meta ✓
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Orientações recentes */}
      {orientacoes.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Lightbulb className="h-3.5 w-3.5" /> Orientações da sua equipe
          </p>
          <Card className="rounded-2xl">
            <CardContent className="p-4 space-y-3">
              {orientacoes.map((o, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Heart className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-foreground">{o.texto}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{o.profissional}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer acolhedor */}
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground">
          💙 Sua equipe está acompanhando sua jornada
        </p>
        <div className="flex justify-center gap-1 mt-2">
          {['AB', 'CL', 'JN', 'MM'].map(initials => (
            <div key={initials} className="h-7 w-7 rounded-full bg-secondary border border-border flex items-center justify-center">
              <span className="text-[9px] font-semibold text-muted-foreground">{initials}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
