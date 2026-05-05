import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar, FlaskConical, ClipboardList, Target, Heart,
  CheckCircle2, Clock, ChevronRight, Stethoscope, Lightbulb, UserX,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePatient } from '@/hooks/usePatients';
import { useJourneys, useAllJourneySteps } from '@/hooks/useJourneys';
import { useAppointments } from '@/hooks/useAppointments';
import { useExams } from '@/hooks/useExams';
import { useQuestionnaireResponses } from '@/hooks/useQuestionnaireResponses';
import { useOrientacoes } from '@/hooks/useOrientacoes';
import { useCareLines } from '@/hooks/useCareLines';
import { parseGoals, mapCareLine, mapStep } from '@/lib/db-helpers';
import { isOutOfTarget } from '@/components/shared/GoalProgress';
import { formatDateBR, getInitials } from '@/lib/format';
import { cn } from '@/lib/utils';
import { AnswerQuestionnaireDialog } from '@/components/dialogs/AnswerQuestionnaireDialog';
import { useNavigate } from 'react-router-dom';

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
  const { profile, loading: authLoading } = useAuth();
  const patientId = profile?.patient_id || undefined;

  const { data: patient, isLoading: loadingPatient } = usePatient(patientId);
  const { data: journeysData, isLoading: loadingJourneys } = useJourneys(patientId);
  const { data: allStepsData } = useAllJourneySteps();
  const { data: appointmentsData } = useAppointments(patientId);
  const { data: examsData } = useExams(patientId);
  const { data: qrData } = useQuestionnaireResponses(patientId);
  const { data: orientacoesData } = useOrientacoes(patientId);
  const { data: careLinesData } = useCareLines();

  const journeys = journeysData || [];
  const allSteps = allStepsData || [];
  const careLines = useMemo(() => (careLinesData || []).map(mapCareLine), [careLinesData]);
  const appointments = (appointmentsData || []).filter(a => a.status === 'agendada');
  const exams = (examsData || []).filter(e => e.status !== 'resultado_disponivel');
  const questionnaires = (qrData || []).filter(q => q.status === 'pendente');
  const orientacoes = orientacoesData || [];

  const [selectedJourneyId, setSelectedJourneyId] = useState<string>('');
  const [answeringQ, setAnsweringQ] = useState<{ responseId: string; questionnaireId: string; name?: string } | null>(null);
  const navigate = useNavigate();
  const activeJourney = journeys.find(j => j.id === selectedJourneyId) || journeys[0];
  const activeJourneySteps = useMemo(
    () => activeJourney
      ? allSteps.filter(s => s.journey_id === activeJourney.id).map(mapStep).sort((a, b) => a.order - b.order)
      : [],
    [allSteps, activeJourney]
  );

  // Loading global
  if (authLoading || (patientId && loadingPatient)) {
    return (
      <div className="space-y-5 max-w-lg mx-auto pb-12">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  // Estado vazio: usuário sem vínculo a paciente
  if (!patientId || !patient) {
    return (
      <div className="max-w-lg mx-auto pb-12">
        <Card className="rounded-2xl mt-12">
          <CardContent className="p-8 text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <UserX className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Acesso ainda não vinculado</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Seu acesso ainda não está vinculado a um prontuário.
                Procure sua equipe de saúde para vincular seu cadastro.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const firstName = patient.nome.split(' ')[0];
  const goals = parseGoals(patient.goals);
  const linhasAtivas = patient.linhas_ativas || [];
  const activeLines = careLines.filter(l => linhasAtivas.includes(l.slug));

  const totalPending = appointments.length + exams.length + questionnaires.length;

  // Mini journey: prev, current, next
  const currentStepIdx = activeJourney?.current_step_index ?? 0;
  const currentStep = activeJourneySteps[currentStepIdx];
  const prevStep = activeJourneySteps[currentStepIdx - 1];
  const nextStep = activeJourneySteps[currentStepIdx + 1];

  const activeLineMeta = activeJourney
    ? careLines.find(l => l.id === activeJourney.care_line_id)
    : undefined;

  return (
    <div className="space-y-5 max-w-lg mx-auto pb-12">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/12 via-primary/6 to-transparent border border-primary/15 p-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-primary">{getInitials(firstName, 1)}</span>
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
        <Card
          className="rounded-2xl border-l-4 overflow-hidden"
          style={{ borderLeftColor: activeLineMeta?.color || 'hsl(var(--primary))' }}
        >
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
                {currentStep.responsavel && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Responsável: <span className="text-foreground font-medium">{currentStep.responsavel}</span>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs por jornada (linha de cuidado) */}
      {journeys.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {journeys.map(j => {
            const isActive = j.id === (activeJourney?.id);
            const meta = careLines.find(l => l.id === j.care_line_id);
            return (
              <button
                key={j.id}
                onClick={() => setSelectedJourneyId(j.id)}
                className={cn(
                  'px-4 h-10 rounded-full text-sm font-medium whitespace-nowrap transition-all border',
                  isActive
                    ? 'text-foreground border-primary/40 bg-primary/10'
                    : 'text-muted-foreground border-border bg-card hover:bg-muted/50'
                )}
              >
                {meta?.name || 'Linha de cuidado'}
              </button>
            );
          })}
        </div>
      )}

      {/* Mini jornada simplificada */}
      {activeJourney && currentStep && (
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-4">Sua jornada</p>
            <div className="space-y-0">
              {prevStep && (
                <div className="flex items-center gap-3 pb-4 relative">
                  <div className="absolute left-[13px] top-7 bottom-0 w-0.5 bg-[hsl(var(--success))]/40" />
                  <CheckCircle2 className="h-7 w-7 text-[hsl(var(--success))] flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">{prevStep.name}</p>
                </div>
              )}
              <div className="flex items-start gap-3 py-3 px-3 -mx-3 rounded-xl bg-primary/5 border border-primary/15 relative">
                {nextStep && <div className="absolute left-[25px] top-[42px] bottom-0 w-0.5 bg-border" />}
                <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 animate-pulse">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{currentStep.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Etapa atual</p>
                  {currentStep.pendencias.length > 0 && (
                    <p className="text-xs text-[hsl(var(--status-pending))] mt-1">
                      ⚠ {currentStep.pendencias[0]}
                    </p>
                  )}
                </div>
              </div>
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
                      {formatDateBR(a.data)} às {a.hora}
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
                  <Button
                    size="sm"
                    className="h-10 px-5 rounded-xl text-sm font-medium"
                    onClick={() => setAnsweringQ({ responseId: q.id, questionnaireId: q.questionnaire_id, name: 'Questionário' })}
                  >
                    Responder
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Metas Clínicas */}
      {goals.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Target className="h-3.5 w-3.5" /> Suas metas
          </p>
          <Card className="rounded-2xl">
            <CardContent className="p-4 space-y-4">
              {goals.map(g => {
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
                    {out ? (
                      <p className="text-xs text-muted-foreground">
                        Atual: {g.currentValue}{g.unit} · Meta: {g.operator} {g.target}{g.unit}
                      </p>
                    ) : (
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
      )}

      {/* Orientações recentes */}
      {orientacoes.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Lightbulb className="h-3.5 w-3.5" /> Orientações da sua equipe
          </p>
          <Card className="rounded-2xl">
            <CardContent className="p-4 space-y-3">
              {orientacoes.map(o => (
                <div key={o.id} className="flex items-start gap-3">
                  <Heart className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-foreground">{o.texto}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {o.profissional} · {formatDateBR(o.data)}
                    </p>
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
        {activeLines.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mt-2">
            {activeLines.map(l => (
              <span
                key={l.id}
                className="text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: l.color + '22', color: l.color }}
              >
                {l.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {answeringQ && (
        <AnswerQuestionnaireDialog
          open={!!answeringQ}
          onOpenChange={(o) => !o && setAnsweringQ(null)}
          responseId={answeringQ.responseId}
          questionnaireId={answeringQ.questionnaireId}
          questionnaireName={answeringQ.name}
        />
      )}
    </div>
  );
}
