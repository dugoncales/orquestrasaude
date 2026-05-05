import { useMemo } from 'react';
import { KPICard } from '@/components/shared/KPICard';
import { JourneyFunnel } from '@/components/shared/JourneyFunnel';
import { RiskSemaphore } from '@/components/shared/RiskSemaphore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users, GitBranch, Target, AlertTriangle, BarChart3, TrendingUp,
  Clock, UserX, Sparkles, Activity, CheckCircle2, XCircle
} from 'lucide-react';
import { usePatients } from '@/hooks/usePatients';
import { useAppointments } from '@/hooks/useAppointments';
import { useTasks } from '@/hooks/useTasks';
import { useJourneys, useAllJourneySteps } from '@/hooks/useJourneys';
import { useAlerts } from '@/hooks/useAlerts';
import { useCareLines } from '@/hooks/useCareLines';
import { parseGoals, riskLevel, mapCareLine } from '@/lib/db-helpers';
import { isOutOfTarget } from '@/components/shared/GoalProgress';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useClinicalExtractions } from '@/hooks/useClinicalExtractionsDb';

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

const goalMetrics = [
  { name: 'HbA1c < 7%', emMeta: 42, total: 68 },
  { name: 'PA < 130/80', emMeta: 55, total: 85 },
  { name: 'LDL < 100', emMeta: 38, total: 60 },
  { name: 'PHQ-9 < 10', emMeta: 12, total: 18 },
  { name: 'ACT ≥ 20', emMeta: 8, total: 15 },
];
const goalData = goalMetrics.map(g => ({ name: g.name, pct: Math.round((g.emMeta / g.total) * 100) }));

const tooltipStyle = { background: 'hsl(216,20%,11%)', border: '1px solid hsl(216,16%,14%)', borderRadius: 8, color: '#fff', fontSize: 11 };

export default function DashboardGestor() {
  const navigate = useNavigate();
  const { data: patientsData, isLoading } = usePatients();
  const { data: appointmentsData } = useAppointments();
  const { data: tasksData } = useTasks();
  const { data: journeysData } = useJourneys();
  const { data: allStepsData } = useAllJourneySteps();
  const { data: alertsData } = useAlerts();
  const { data: careLinesData } = useCareLines();
  const { data: extractionsData } = useClinicalExtractions({ applied: false, limit: 50 });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-60 w-full" /></div>;

  const patients = patientsData || [];
  const allAppointments = appointmentsData || [];
  const allTasks = tasksData || [];
  const journeys = journeysData || [];
  const allSteps = allStepsData || [];
  const allAlerts = alertsData || [];
  const careLines = (careLinesData || []).map(mapCareLine);

  const totalPatients = careLines.reduce((s, l) => s + l.patientCount, 0);
  const patientsOutOfGoal = patients.filter(p => parseGoals(p.goals).some(g => isOutOfTarget(g))).length;
  const avgAdherence = careLines.length ? Math.round(careLines.reduce((s, l) => s + l.avgAdherence, 0) / careLines.length) : 0;
  const faltosos30d = allAppointments.filter(a => a.status === 'faltou').length;
  const criticalAlerts = allAlerts.filter(a => a.severidade === 'critical' && !a.lido).length;
  const avgStageTime = Math.round(stageTimingData.reduce((s, d) => s + d.media, 0) / stageTimingData.length);

  const bottlenecks = stageTimingData.filter(s => s.media > s.sla).sort((a, b) => (b.media - b.sla) - (a.media - a.sla)).slice(0, 3);

  const professionals = ['Dra. Ana Beatriz', 'Dr. Ricardo Mendes', 'Enf. Carla', 'Nut. Juliana', 'Psic. Mariana', 'Dr. Marcos Vieira', 'Dra. Camila Lopes'];
  const produtividade = useMemo(() => {
    return professionals.map(prof => {
      const pacientesAtivos = allSteps.filter(s => s.responsavel === prof && s.status === 'em_andamento').length;
      const consultasRealizadas = allAppointments.filter(a => a.profissional === prof && a.status === 'realizada').length;
      const tarefasConcluidas = allTasks.filter(t => t.responsavel === prof && t.status === 'em_andamento').length;
      const tarefasPendentes = allTasks.filter(t => t.responsavel === prof && (t.status === 'pendente' || t.status === 'atrasada')).length;
      const carga = pacientesAtivos + tarefasPendentes;
      return { nome: prof.split(' ').slice(0, 2).join(' '), pacientesAtivos, consultasRealizadas, tarefasConcluidas, tarefasPendentes, carga };
    }).filter(p => p.pacientesAtivos > 0 || p.consultasRealizadas > 0 || p.tarefasPendentes > 0);
  }, [allSteps, allAppointments, allTasks]);

  const lineData = careLines.map(l => ({ name: l.name.split(' ')[0], pacientes: l.patientCount, adesao: l.avgAdherence }));

  const priorityCohorts = [...patients]
    .filter(p => riskLevel(p) === 'critico' || riskLevel(p) === 'alto')
    .sort((a, b) => (b.score_risco || 0) - (a.score_risco || 0))
    .slice(0, 5);

  // Insights derivados de dados reais
  const aiInsights = useMemo(() => {
    const out: { id: string; severidade: 'critical' | 'warning'; mensagem: string }[] = [];
    // 1. Linhas com pior adesão
    const worstLine = [...careLines].filter(l => l.patientCount > 0).sort((a, b) => a.avgAdherence - b.avgAdherence)[0];
    if (worstLine && worstLine.avgAdherence < 70) {
      out.push({ id: 'l1', severidade: worstLine.avgAdherence < 50 ? 'critical' : 'warning',
        mensagem: `Linha "${worstLine.name}" com adesão de ${worstLine.avgAdherence}% (${worstLine.patientCount} pacientes). Avaliar plano de retomada.` });
    }
    // 2. Pacientes em atraso (>60d sem retorno)
    const atrasados = patients.filter(p => (p.dias_sem_retorno || 0) > 60);
    if (atrasados.length > 0) {
      out.push({ id: 'l2', severidade: atrasados.length > 5 ? 'critical' : 'warning',
        mensagem: `${atrasados.length} paciente(s) sem retorno há mais de 60 dias. Considere busca ativa.` });
    }
    // 3. Extrações IA pendentes de revisão
    const pendingExtractions = (extractionsData || []).length;
    if (pendingExtractions > 0) {
      out.push({ id: 'l3', severidade: 'warning',
        mensagem: `${pendingExtractions} extração(ões) IA aguardando revisão na IA de Planilhas.` });
    }
    // 4. Pacientes críticos sem agendamento
    const criticos = patients.filter(p => riskLevel(p) === 'critico');
    const criticosSemAgenda = criticos.filter(p => !allAppointments.some(a => a.patient_id === p.id && a.status === 'agendada'));
    if (criticosSemAgenda.length > 0) {
      out.push({ id: 'l4', severidade: 'critical',
        mensagem: `${criticosSemAgenda.length} paciente(s) críticos sem consulta agendada. Recomenda-se priorização.` });
    }
    // 5. Alertas críticos não lidos
    if (criticalAlerts > 0) {
      out.push({ id: 'l5', severidade: 'critical',
        mensagem: `${criticalAlerts} alerta(s) crítico(s) não lidos no painel de alertas.` });
    }
    return out.slice(0, 4);
  }, [careLines, patients, extractionsData, allAppointments, criticalAlerts]);

  const today = new Date();
  const dateStr = today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Centro de Comando</h1>
        <p className="text-xs text-muted-foreground capitalize">{dateStr}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant="secondary" className="text-[10px]">{totalPatients} pacientes</Badge>
          <Badge variant="destructive" className="text-[10px]">{patientsOutOfGoal} fora da meta</Badge>
          {criticalAlerts > 0 && <Badge className="text-[10px] bg-[hsl(var(--destructive))]/20 text-[hsl(var(--destructive))] border-[hsl(var(--destructive))]/30">{criticalAlerts} alertas críticos</Badge>}
          <Badge variant="secondary" className="text-[10px]">{faltosos30d} faltosos</Badge>
        </div>
      </div>

      <div>
        <p className="section-label">Indicadores Executivos</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KPICard title="Total Pacientes" value={totalPatients} icon={Users} trend={{ value: 8, positive: true }} accentColor="primary" />
          <KPICard title="Fora da Meta" value={`${patientsOutOfGoal} (${patients.length ? Math.round(patientsOutOfGoal / patients.length * 100) : 0}%)`} icon={AlertTriangle} accentColor="destructive" />
          <KPICard title="Adesão Média" value={`${avgAdherence}%`} icon={Target} trend={{ value: 3, positive: true }} accentColor="success" />
          <KPICard title="Faltosos" value={faltosos30d} icon={UserX} subtitle="últimos 30 dias" accentColor="warning" />
          <KPICard title="Tempo Médio/Etapa" value={`${avgStageTime}d`} icon={Clock} accentColor="info" />
        </div>
      </div>

      <div>
        <p className="section-label">Análise Operacional</p>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Produtividade por Profissional</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {produtividade.map(p => {
                  const maxCarga = Math.max(...produtividade.map(x => x.carga), 1);
                  return (
                    <div key={p.nome} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">{p.nome}</span>
                        <div className="flex gap-3 text-muted-foreground text-[10px]">
                          <span>{p.pacientesAtivos} pac.</span>
                          <span>{p.consultasRealizadas} cons.</span>
                          <span className="flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3 text-[hsl(var(--success))]" />{p.tarefasConcluidas}</span>
                          <span className="flex items-center gap-0.5"><XCircle className="h-3 w-3 text-[hsl(var(--destructive))]" />{p.tarefasPendentes}</span>
                        </div>
                      </div>
                      <Progress value={Math.round((p.carga / maxCarga) * 100)} className="h-1.5" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Funil & Gargalos</CardTitle>
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

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Tempo Médio por Etapa</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stageTimingData} layout="vertical">
                  <XAxis type="number" tick={{ fill: 'hsl(215,15%,50%)', fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={85} tick={{ fill: 'hsl(215,15%,50%)', fontSize: 9 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="media" radius={[0, 4, 4, 0]} barSize={14}>
                    {stageTimingData.map((entry, i) => <Cell key={i} fill={entry.media > entry.sla ? 'hsl(0,72%,50%)' : 'hsl(152,69%,40%)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Pacientes por Linha & Adesão</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lineData.map(l => (
                  <div key={l.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{l.name}</span>
                      <div className="flex gap-3 text-[10px] text-muted-foreground">
                        <span>{l.pacientes} pac.</span>
                        <span className={l.adesao < 70 ? 'text-[hsl(var(--destructive))] font-semibold' : 'text-[hsl(var(--success))]'}>{l.adesao}% adesão</span>
                      </div>
                    </div>
                    <div className="flex gap-1 items-center">
                      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${(l.pacientes / 220) * 100}%` }} />
                      </div>
                      <div className="w-12 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className={`h-full rounded-full ${l.adesao >= 70 ? 'bg-[hsl(var(--success))]' : 'bg-[hsl(var(--destructive))]'}`} style={{ width: `${l.adesao}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <p className="section-label">Resultados Clínicos & Prioridades</p>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-primary" /> % Pacientes em Meta</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={goalData} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(215,15%,50%)', fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fill: 'hsl(215,15%,50%)', fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <ReferenceLine x={70} stroke="hsl(152,69%,40%)" strokeDasharray="3 3" label={{ value: '70%', fill: 'hsl(152,69%,40%)', fontSize: 10 }} />
                  <Bar dataKey="pct" radius={[0, 4, 4, 0]} barSize={16}>
                    {goalData.map((entry, i) => <Cell key={i} fill={entry.pct >= 70 ? 'hsl(152,69%,40%)' : 'hsl(207,100%,31%)'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-[hsl(var(--destructive))]" /> Coortes Prioritárias</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {priorityCohorts.map(p => {
                const pGoals = parseGoals(p.goals);
                const outGoals = pGoals.filter(g => isOutOfTarget(g));
                return (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/30 rounded px-1 transition-colors"
                    onClick={() => navigate(`/jornada-clinica?paciente=${p.id}`)}>
                    <div className="flex items-center gap-2">
                      <RiskSemaphore level={riskLevel(p)} score={p.score_risco || 0} showLabel={false} />
                      <div>
                        <p className="text-xs font-medium text-foreground">{p.nome}</p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {outGoals.slice(0, 3).map(g => (
                            <Badge key={g.field} variant="destructive" className="text-[9px] px-1.5 py-0 font-mono">{g.label}: {g.currentValue}{g.unit}</Badge>
                          ))}
                          {outGoals.length === 0 && <span className="text-[10px] text-[hsl(var(--success))]">Em meta ✓</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] text-muted-foreground">{p.dias_sem_retorno}d sem retorno</p>
                      <div className="flex gap-1 justify-end mt-0.5">
                        {(p.linhas_ativas || []).slice(0, 2).map((l: string) => (
                          <span key={l} className="text-[9px] bg-secondary text-muted-foreground rounded px-1.5 py-0.5">
                            {careLines.find(cl => cl.slug === l)?.name?.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-primary/20 bg-gradient-to-br from-card to-primary/[0.03]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Insights HealthBit AI
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 ml-1">beta</Badge>
              </CardTitle>
              <p className="text-[10px] text-muted-foreground">Análises agregadas geradas automaticamente</p>
            </CardHeader>
            <CardContent>
              {aiInsights.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhum insight relevante no momento. Tudo dentro dos parâmetros esperados.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {aiInsights.map(insight => (
                    <div key={insight.id} className={`rounded-xl p-3 border text-xs leading-relaxed ${
                      insight.severidade === 'critical'
                        ? 'border-[hsl(var(--destructive))]/30 bg-[hsl(var(--destructive))]/5 text-foreground'
                        : 'border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5 text-foreground'
                    }`}>
                      <div className="flex items-start gap-2">
                        <Sparkles className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${
                          insight.severidade === 'critical' ? 'text-[hsl(var(--destructive))]' : 'text-[hsl(var(--warning))]'
                        }`} />
                        <span>{insight.mensagem}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
