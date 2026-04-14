import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, FlaskConical, ClipboardList, Target, ArrowRight, Heart } from 'lucide-react';
import { mockAppointments, mockExams, mockQuestionnaireResponses, mockJourneys } from '@/data/mock-data';
import { careLines } from '@/data/care-lines';
import { StatusChip } from '@/components/shared/StatusChip';
import { TimelineStep } from '@/components/shared/TimelineStep';

export default function DashboardPaciente() {
  const patientId = 'p1';
  const appointments = mockAppointments.filter(a => a.patientId === patientId && a.status === 'agendada');
  const exams = mockExams.filter(e => e.patientId === patientId && e.status !== 'resultado_disponivel');
  const questionnaires = mockQuestionnaireResponses.filter(q => q.patientId === patientId && q.status === 'pendente');
  const journeys = mockJourneys.filter(j => j.patientId === patientId);
  const activeLines = careLines.filter(l => ['diabetes', 'hipertensao', 'obesidade'].includes(l.id));

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Welcome */}
      <div className="rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 p-6">
        <div className="flex items-center gap-3 mb-2">
          <Heart className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Olá, Maria!</h1>
        </div>
        <p className="text-sm text-muted-foreground">Você está acompanhada em {activeLines.length} linhas de cuidado. Veja abaixo seu resumo e próximos passos.</p>
      </div>

      {/* Active care lines */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        {activeLines.map(line => (
          <Card key={line.id} className="border-l-2" style={{ borderLeftColor: line.color }}>
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-foreground">{line.name}</p>
              <p className="text-xs text-muted-foreground mt-1">Etapa: Seguimento</p>
            </CardContent>
          </Card>
        ))}
      </div>

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

        {/* Questionnaires */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4 text-primary" /> Questionários</CardTitle>
          </CardHeader>
          <CardContent>
            {questionnaires.length === 0 ? (
              <p className="text-xs text-muted-foreground">Todos respondidos ✓</p>
            ) : (
              <div className="space-y-2">
                {questionnaires.map(q => (
                  <div key={q.id} className="flex items-center justify-between">
                    <StatusChip status={q.status} />
                    <Button size="sm" className="h-7 text-xs">Responder</Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goals */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> Metas Clínicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">HbA1c</span>
              <span className="font-medium text-foreground">7.9% → Meta: &lt; 7%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Peso</span>
              <span className="font-medium text-foreground">88kg → Meta: 82kg</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">PA</span>
              <span className="font-medium text-[hsl(var(--success))]">128/82 → Meta: &lt; 130/80 ✓</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Journey preview */}
      {journeys.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Jornada — Diabetes Mellitus</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs gap-1 h-7">Ver completa <ArrowRight className="h-3 w-3" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            {journeys[0].steps.slice(Math.max(0, journeys[0].currentStepIndex - 1), journeys[0].currentStepIndex + 3).map((step, i, arr) => (
              <TimelineStep key={step.id} step={step} isLast={i === arr.length - 1} isCurrent={step.status === 'em_andamento'} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
