import { useParams, useNavigate } from 'react-router-dom';
import { mockPatients } from '@/data/mock-patients';
import { mockJourneys, mockParameterRecords, mockAppointments, mockTasks } from '@/data/mock-data';
import { careLines } from '@/data/care-lines';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/shared/StatusChip';
import { RiskSemaphore } from '@/components/shared/RiskSemaphore';
import { TimelineStep } from '@/components/shared/TimelineStep';
import { ArrowLeft, User, Activity, Pill, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { parameterDictionary } from '@/data/parameters';

export default function PerfilPaciente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const patient = mockPatients.find(p => p.id === id);
  if (!patient) return <div className="p-8 text-muted-foreground">Paciente não encontrado</div>;

  const journeys = mockJourneys.filter(j => j.patientId === id);
  const records = mockParameterRecords.filter(r => r.patientId === id);
  const appointments = mockAppointments.filter(a => a.patientId === id);
  const tasks = mockTasks.filter(t => t.patientId === id);
  const activeLines = careLines.filter(l => patient.linhasAtivas.includes(l.id));

  const hba1cData = records.filter(r => r.field === 'hba1c').map(r => ({ date: r.date.substring(5), value: r.value }));

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/pacientes')} className="gap-1 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
          <User className="h-7 w-7 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">{patient.nome}</h1>
            <RiskSemaphore level={patient.riskLevel} score={patient.scoreRisco} />
          </div>
          <p className="text-xs text-muted-foreground">{patient.sexo === 'F' ? 'Feminino' : 'Masculino'} · {patient.dataNascimento} · {patient.convenio} · {patient.unidade}</p>
          <div className="flex gap-1 mt-2">
            {activeLines.map(l => (
              <span key={l.id} className="status-chip text-[10px]" style={{ background: l.color + '22', color: l.color }}>{l.name}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Clinical summary */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Resumo Clínico</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Diagnósticos Ativos</p>
              <div className="space-y-1">{patient.diagnosticosAtivos.map((d, i) => <p key={i} className="text-sm text-foreground">{d}</p>)}</div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Alergias</p>
              <div className="space-y-1">{patient.alergias.length ? patient.alergias.map((a, i) => <p key={i} className="text-sm text-[hsl(var(--destructive))]">{a}</p>) : <p className="text-sm text-muted-foreground">NKDA</p>}</div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Fatores de Risco</p>
              <div className="space-y-1">{patient.fatoresRisco.map((f, i) => <p key={i} className="text-sm text-foreground">{f}</p>)}</div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Histórico Familiar</p>
              <div className="space-y-1">{patient.historicoFamiliar.map((h, i) => <p key={i} className="text-sm text-foreground">{h}</p>)}</div>
            </div>
          </CardContent>
        </Card>

        {/* Medications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><Pill className="h-4 w-4 text-primary" /> Medicações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {patient.medicacoes.map((m, i) => <p key={i} className="text-sm text-foreground">{m}</p>)}
          </CardContent>
        </Card>
      </div>

      {/* Parameter evolution */}
      {hba1cData.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Evolução HbA1c</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={hba1cData}>
                <XAxis dataKey="date" tick={{ fill: 'hsl(215,15%,50%)', fontSize: 10 }} />
                <YAxis domain={[6, 10]} tick={{ fill: 'hsl(215,15%,50%)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'hsl(220,18%,12%)', border: '1px solid hsl(220,14%,16%)', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                <Line type="monotone" dataKey="value" stroke="hsl(355,86%,52%)" strokeWidth={2} dot={{ fill: 'hsl(355,86%,52%)' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Journeys */}
      {journeys.map(j => {
        const line = careLines.find(l => l.id === j.careLineId);
        return (
          <Card key={j.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Jornada — {line?.name}</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate('/jornadas')}>Ver completa</Button>
              </div>
            </CardHeader>
            <CardContent>
              {j.steps.map((step, i) => (
                <TimelineStep key={step.id} step={step} isLast={i === j.steps.length - 1} isCurrent={i === j.currentStepIndex} />
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
