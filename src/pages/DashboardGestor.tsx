import { KPICard } from '@/components/shared/KPICard';
import { JourneyFunnel } from '@/components/shared/JourneyFunnel';
import { RiskSemaphore } from '@/components/shared/RiskSemaphore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users, GitBranch, Target, AlertTriangle, BarChart3, TrendingUp,
  Clock, UserX, Sparkles, Activity, CheckCircle2, XCircle
} from 'lucide-react';
import { careLines } from '@/data/care-lines';
import { mockPatients } from '@/data/mock-patients';
import { mockAppointments, mockTasks, mockJourneys, mockAlerts, mockAIInsights } from '@/data/mock-data';
import { isOutOfTarget } from '@/components/shared/GoalProgress';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';

// ── Dados derivados ──

const totalPatients = careLines.reduce((s, l) => s + l.patientCount, 0);
const patientsOutOfGoal = mockPatients.filter(p => p.goals.some(g => isOutOfTarget(g))).length;
const avgAdherence = Math.round(careLines.reduce((s, l) => s + l.avgAdherence, 0) / careLines.length);
const faltosos30d = mockAppointments.filter(a => a.status === 'faltou').length;
const criticalAlerts = mockAlerts.filter(a => a.severidade === 'critical' && !a.lido).length;

// Tempo médio por etapa (mock realista em dias)
const stageTimingData = [
  { name: 'Elegibilidade', media: 2, sla: 3 },
  { name: 'Inclusão', media: 4, sla: 5 },
  { name: 'Avaliação Inicial', media: 8, sla: 7 },
  { name: 'Estratificação', media: 3, sla: 3 },
  { name: 'Plano Terapêutico', media: 12, sla: 10 },
  { name: 'Seguimento', media: 18, sla: 14 },
  { name: 'Coleta PROMs', media: 5, sla: 7 },
  { name: 'Reavaliação', media: 9, sla: 10 },
];

// Tempo médio geral
const avgStageTime = Math.round(stageTimingData.reduce((s, d) => s + d.media, 0) / stageTimingData.length);

// Produtividade por profissional
const professionals = ['Dra. Ana Beatriz', 'Dr. Ricardo Mendes', 'Enf. Carla', 'Nut. Juliana', 'Psic. Mariana', 'Dr. Marcos Vieira', 'Dra. Camila Lopes'];
const produtividade = professionals.map(prof => {
  const pacientesAtivos = mockJourneys.filter(j => j.steps.some(s => s.responsavel === prof && s.status === 'em_andamento')).length;
  const consultasRealizadas = mockAppointments.filter(a => a.profissional === prof && a.status === 'realizada').length;
  const tarefasConcluidas = mockTasks.filter(t => t.responsavel === prof && t.status === 'em_andamento').length;
  const tarefasPendentes = mockTasks.filter(t => t.responsavel === prof && (t.status === 'pendente' || t.status === 'atrasada')).length;
  const carga = pacientesAtivos + tarefasPendentes;
  return { nome: prof.split(' ').slice(0, 2).join(' '), pacientesAtivos, consultasRealizadas, tarefasConcluidas, tarefasPendentes, carga };
}).filter(p => p.pacientesAtivos > 0 || p.consultasRealizadas > 0 || p.tarefasPendentes > 0);

// Pacientes por linha + adesão
const lineData = careLines.map(l => ({
  name: l.name.split(' ')[0],
  pacientes: l.patientCount,
  adesao: l.avgAdherence,
}));

// % em meta por parâmetro
const goalMetrics = [
  { name: 'HbA1c < 7%', emMeta: 42, total: 68 },
  { name: 'PA < 130/80', emMeta: 55, total: 85 },
  { name: 'LDL < 100', emMeta: 38, total: 60 },
  { name: 'PHQ-9 < 10', emMeta: 12, total: 18 },
  { name: 'ACT ≥ 20', emMeta: 8, total: 15 },
];
const goalData = goalMetrics.map(g => ({ name: g.name, pct: Math.round((g.emMeta / g.total) * 100) }));

// Gargalos operacionais (top 3 etapas acima do SLA)
const bottlenecks = stageTimingData
  .filter(s => s.media > s.sla)
  .sort((a, b) => (b.media - b.sla) - (a.media - a.sla))
  .slice(0, 3);

// Coortes prioritárias
const priorityCohorts = mockPatients
  .filter(p => p.riskLevel === 'critico' || p.riskLevel === 'alto')
  .sort((a, b) => b.scoreRisco - a.scoreRisco)
  .slice(0, 5);

const tooltipStyle = {
  background: 'hsl(220,18%,12%)',
  border: '1px solid hsl(220,14%,16%)',
  borderRadius: 8,
  color: '#fff',
  fontSize: 11,
};

export default function DashboardGestor() {
  const navigate = useNavigate();
  const today = new Date();
  const dateStr = today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-5">
      {/* Header Executivo */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Centro de Comando</h1>
        <p className="text-xs text-muted-foreground capitalize">{dateStr}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary" className="text-[10px]">{totalPatients} pacientes</Badge>
          <Badge variant="destructive" className="text-[10px]">{patientsOutOfGoal} fora da meta</Badge>
          {criticalAlerts > 0 && (
            <Badge className="text-[10px] bg-[hsl(var(--destructive))]/20 text-[hsl(var(--destructive))] border-[hsl(var(--destructive))]/30">{criticalAlerts} alertas críticos</Badge>
          )}
          <Badge variant="secondary" className="text-[10px]">{faltosos30d} faltosos</Badge>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPICard title="Total Pacientes" value={totalPatients} icon={Users} trend={{ value: 8, positive: true }} />
        <KPICard title="Fora da Meta" value={`${patientsOutOfGoal} (${Math.round(patientsOutOfGoal / mockPatients.length * 100)}%)`} icon={AlertTriangle} />
        <KPICard title="Adesão Média" value={`${avgAdherence}%`} icon={Target} trend={{ value: 3, positive: true }} />
        <KPICard title="Faltosos" value={faltosos30d} icon={UserX} subtitle="últimos 30 dias" />
        <KPICard title="Tempo Médio/Etapa" value={`${avgStageTime}d`} icon={Clock} />
      </div>

      {/* Grid principal */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">

        {/* ── Coluna Esquerda ── */}

        {/* Produtividade por Profissional */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Produtividade por Profissional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {produtividade.map(p => {
                const maxCarga = Math.max(...produtividade.map(x => x.carga), 1);
                const pct = Math.round((p.carga / maxCarga) * 100);
                return (
                  <div key={p.nome} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{p.nome}</span>
                      <div className="flex gap-3 text-muted-foreground text-[10px]">
                        <span>{p.pacientesAtivos} pac.</span>
                        <span>{p.consultasRealizadas} cons.</span>
                        <span className="flex items-center gap-0.5">
                          <CheckCircle2 className="h-3 w-3 text-[hsl(var(--success))]" />{p.tarefasConcluidas}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <XCircle className="h-3 w-3 text-[hsl(var(--destructive))]" />{p.tarefasPendentes}
                        </span>
                      </div>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Gargalos Operacionais */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Funil & Gargalos
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">Vermelho = acima do SLA</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <JourneyFunnel />
            {bottlenecks.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Maiores Gargalos</p>
                {bottlenecks.map(b => (
                  <div key={b.name} className="flex items-center justify-between py-1">
                    <span className="text-xs text-foreground">{b.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{b.media}d / SLA {b.sla}d</span>
                      <Badge variant="destructive" className="text-[9px] px-1.5 py-0">+{b.media - b.sla}d</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tempo Médio entre Etapas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Tempo Médio por Etapa
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">Dias médios vs SLA (linha tracejada)</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stageTimingData} layout="vertical">
                <XAxis type="number" tick={{ fill: 'hsl(215,15%,50%)', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={85} tick={{ fill: 'hsl(215,15%,50%)', fontSize: 9 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="media" radius={[0, 4, 4, 0]} barSize={14}>
                  {stageTimingData.map((entry, i) => (
                    <Cell key={i} fill={entry.media > entry.sla ? 'hsl(355,86%,52%)' : 'hsl(152,69%,40%)'} />
                  ))}
                </Bar>
                <Bar dataKey="sla" fill="none" barSize={0}>
                  {stageTimingData.map((_, i) => (
                    <Cell key={i} fill="transparent" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pacientes por Linha + Adesão */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Pacientes por Linha & Adesão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lineData.map(l => (
                <div key={l.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{l.name}</span>
                    <div className="flex gap-3 text-[10px] text-muted-foreground">
                      <span>{l.pacientes} pac.</span>
                      <span className={l.adesao < 70 ? 'text-[hsl(var(--destructive))] font-semibold' : 'text-[hsl(var(--success))]'}>
                        {l.adesao}% adesão
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 items-center">
                    <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(l.pacientes / 220) * 100}%` }} />
                    </div>
                    <div className="w-12 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full ${l.adesao >= 70 ? 'bg-[hsl(var(--success))]' : 'bg-[hsl(var(--destructive))]'}`}
                        style={{ width: `${l.adesao}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* % em Meta */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> % Pacientes em Meta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={goalData} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(215,15%,50%)', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fill: 'hsl(215,15%,50%)', fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <ReferenceLine x={70} stroke="hsl(152,69%,40%)" strokeDasharray="3 3" label={{ value: '70%', fill: 'hsl(152,69%,40%)', fontSize: 10 }} />
                <Bar dataKey="pct" radius={[0, 4, 4, 0]} barSize={16}>
                  {goalData.map((entry, i) => (
                    <Cell key={i} fill={entry.pct >= 70 ? 'hsl(152,69%,40%)' : 'hsl(355,86%,52%)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Coortes Prioritárias */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[hsl(var(--destructive))]" /> Coortes Prioritárias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {priorityCohorts.map(p => {
              const outGoals = p.goals.filter(g => isOutOfTarget(g));
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/30 rounded px-1 transition-colors"
                  onClick={() => navigate(`/jornada-clinica?paciente=${p.id}`)}
                >
                  <div className="flex items-center gap-2">
                    <RiskSemaphore level={p.riskLevel} score={p.scoreRisco} />
                    <div>
                      <p className="text-xs font-medium text-foreground">{p.nome}</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {outGoals.slice(0, 3).map(g => (
                          <Badge key={g.field} variant="destructive" className="text-[9px] px-1.5 py-0 font-mono">
                            {g.label}: {g.currentValue}{g.unit}
                          </Badge>
                        ))}
                        {outGoals.length === 0 && (
                          <span className="text-[10px] text-[hsl(var(--success))]">Em meta ✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-muted-foreground">{p.diasSemRetorno}d sem retorno</p>
                    <div className="flex gap-1 justify-end mt-0.5">
                      {p.linhasAtivas.slice(0, 2).map(l => (
                        <span key={l} className="text-[9px] bg-secondary text-muted-foreground rounded px-1.5 py-0.5">
                          {careLines.find(cl => cl.id === l)?.name.split(' ')[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Insights CareJourney AI */}
        <Card className="lg:col-span-2 border-primary/20 bg-gradient-to-br from-card to-primary/[0.03]">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Insights CareJourney AI
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 ml-1">beta</Badge>
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">Análises agregadas geradas automaticamente</p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {mockAIInsights.map(insight => (
                <div
                  key={insight.id}
                  className={`rounded-xl p-3 border text-xs leading-relaxed ${
                    insight.severidade === 'critical'
                      ? 'border-[hsl(var(--destructive))]/30 bg-[hsl(var(--destructive))]/5 text-foreground'
                      : 'border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5 text-foreground'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Sparkles className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${
                      insight.severidade === 'critical' ? 'text-[hsl(var(--destructive))]' : 'text-[hsl(var(--warning))]'
                    }`} />
                    <span>{insight.mensagem}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
