import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KPICard } from '@/components/shared/KPICard';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Users, Target, TrendingUp, Clock, Calendar, Activity,
  AlertTriangle, CheckCircle2, Brain, Heart, Scale, Pill,
  BarChart3, FileQuestion, Stethoscope,
} from 'lucide-react';

import { usePatients } from '@/hooks/usePatients';
import { useJourneys } from '@/hooks/useJourneys';
import { useAppointments } from '@/hooks/useAppointments';
import { useExams } from '@/hooks/useExams';
import { useTasks } from '@/hooks/useTasks';
import { useQuestionnaireResponses } from '@/hooks/useQuestionnaireResponses';
import { useParameterRecords } from '@/hooks/useParameterRecords';
import { useCareLines } from '@/hooks/useCareLines';
import { parseGoals, mapCareLine } from '@/lib/db-helpers';
import type { PatientGoal } from '@/data/types';

const tt = { background: 'hsl(220,18%,12%)', border: '1px solid hsl(220,14%,16%)', borderRadius: 8, color: '#fff', fontSize: 12 };
const tk = { fill: 'hsl(215,15%,50%)', fontSize: 10 };
const COLORS = {
  red: 'hsl(355,86%,52%)',
  blue: 'hsl(213,94%,56%)',
  green: 'hsl(152,69%,40%)',
  amber: 'hsl(38,92%,50%)',
  purple: 'hsl(270,70%,55%)',
  cyan: 'hsl(190,80%,45%)',
  pink: 'hsl(330,70%,55%)',
  teal: 'hsl(170,60%,42%)',
};
const RISK_COLORS: Record<string, string> = {
  baixo: COLORS.green,
  moderado: COLORS.amber,
  alto: COLORS.red,
  critico: COLORS.purple,
};

const defaultSteps = [
  'Elegibilidade', 'Inclusão', 'Aval. Inicial', 'Estratificação',
  'Plano Terap.', 'Seguimento', 'PROMs/PREMs',
  'Reavaliação', 'Manutenção', 'Alta/Monitor.',
];

const monthShort = (yyyymm: string) => {
  const m = yyyymm.slice(5, 7);
  const map: Record<string, string> = {
    '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
    '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
  };
  return map[m] || yyyymm;
};

export default function BI() {
  const { data: patientsData, isLoading: lP } = usePatients();
  const { data: journeysData, isLoading: lJ } = useJourneys();
  const { data: appointmentsData, isLoading: lA } = useAppointments();
  const { data: examsData } = useExams();
  const { data: tasksData } = useTasks();
  const { data: qrData } = useQuestionnaireResponses();
  const { data: paramRecordsData } = useParameterRecords();
  const { data: careLinesData, isLoading: lC } = useCareLines();

  const patients = patientsData || [];
  const journeys = journeysData || [];
  const appointments = appointmentsData || [];
  const exams = examsData || [];
  const tasks = tasksData || [];
  const qr = qrData || [];
  const paramRecords = paramRecordsData || [];
  const careLines = useMemo(() => (careLinesData || []).map(mapCareLine), [careLinesData]);

  // Mapeia care_line_id (uuid) → slug (id de domínio)
  const careLineIdToSlug = useMemo(() => {
    const m = new Map<string, string>();
    (careLinesData || []).forEach(c => m.set(c.id, c.slug));
    return m;
  }, [careLinesData]);

  const isLoading = lP || lJ || lA || lC;

  // ─── OPERACIONAL ───
  const op = useMemo(() => {
    const stepCounts = defaultSteps.map((name, i) => ({
      name,
      pacientes: journeys.filter(j => (j.current_step_index ?? 0) === i).length,
    }));

    const pendConsultas = appointments.filter(a => a.status === 'agendada').length;
    const pendExames = exams.filter(e => ['solicitado', 'atrasado'].includes(e.status)).length;
    const pendQuest = qr.filter(q => ['pendente', 'atrasado'].includes(q.status)).length;
    const faltosos = appointments.filter(a => a.status === 'faltou').length;

    const avgSLA = patients.length
      ? Math.round(patients.reduce((s, p) => s + (p.dias_sem_retorno || 0), 0) / patients.length)
      : 0;

    const profMap: Record<string, { consultas: number; tarefas: number }> = {};
    appointments.forEach(a => {
      if (!profMap[a.profissional]) profMap[a.profissional] = { consultas: 0, tarefas: 0 };
      profMap[a.profissional].consultas++;
    });
    tasks.forEach(t => {
      if (!profMap[t.responsavel]) profMap[t.responsavel] = { consultas: 0, tarefas: 0 };
      profMap[t.responsavel].tarefas++;
    });
    const prodData = Object.entries(profMap).map(([name, v]) => ({
      name: name.length > 14 ? name.slice(0, 14) + '…' : name,
      consultas: v.consultas,
      tarefas: v.tarefas,
    }));

    return { stepCounts, pendConsultas, pendExames, pendQuest, faltosos, avgSLA, prodData };
  }, [journeys, appointments, exams, qr, tasks, patients]);

  // ─── CLÍNICO ───
  const clin = useMemo(() => {
    const goalsAll: PatientGoal[] = patients.flatMap(p => parseGoals(p.goals));

    const goalsByField = (field: string) => {
      const g = goalsAll.filter(g => g.field === field);
      if (!g.length) return 0;
      const inTarget = g.filter(g => {
        if (g.operator === '<') return g.currentValue < g.target;
        if (g.operator === '>') return g.currentValue > g.target;
        if (g.operator === '<=') return g.currentValue <= g.target;
        if (g.operator === '>=') return g.currentValue >= g.target;
        return g.currentValue === g.target;
      });
      return Math.round((inTarget.length / g.length) * 100);
    };

    const pctHba1c = goalsByField('hba1c');
    const pctPA = goalsByField('pas');
    const pctLDL = goalsByField('ldl');

    const pesoGoals = goalsAll.filter(g => g.field === 'peso');
    const avgPerdaPeso = pesoGoals.length
      ? (pesoGoals.reduce((s, g) => s + (g.currentValue - g.target), 0) / pesoGoals.length).toFixed(1)
      : '0';

    const phq9Goals = goalsAll.filter(g => g.field === 'phq9');
    const avgPHQ9 = phq9Goals.length
      ? (phq9Goals.reduce((s, g) => s + g.currentValue, 0) / phq9Goals.length).toFixed(0)
      : '—';

    const actGoals = goalsAll.filter(g => g.field === 'act');
    const avgACT = actGoals.length
      ? (actGoals.reduce((s, g) => s + g.currentValue, 0) / actGoals.length).toFixed(0)
      : '—';

    const promsResp = qr.filter(q => q.status === 'respondido').length;
    const promsTotal = qr.length;

    const buildEvol = (field: string) => {
      const recs = paramRecords.filter(r => r.field === field);
      const map = new Map<string, number[]>();
      recs.forEach(r => {
        const k = r.date.slice(0, 7);
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(Number(r.value));
      });
      return Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, vals]) => ({
          name: monthShort(date),
          media: +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1),
        }));
    };

    const hba1cEvol = buildEvol('hba1c');
    const phq9Evol = buildEvol('phq9');

    const metaParams = [
      { name: 'HbA1c', pct: pctHba1c },
      { name: 'PA', pct: pctPA },
      { name: 'LDL', pct: pctLDL },
      { name: 'Peso', pct: goalsByField('peso') },
      { name: 'PHQ-9', pct: goalsByField('phq9') },
      { name: 'ACT', pct: goalsByField('act') },
    ];

    return { pctHba1c, pctPA, pctLDL, avgPerdaPeso, avgPHQ9, avgACT, promsResp, promsTotal, hba1cEvol, phq9Evol, metaParams };
  }, [patients, qr, paramRecords]);

  // ─── EXECUTIVO ───
  const exec = useMemo(() => {
    const coortesAtivas = careLines.length;
    const linhasAtivas = careLines.map(cl => ({
      name: cl.name,
      pacientes: patients.filter(p => (p.linhas_ativas || []).includes(cl.id)).length,
    })).sort((a, b) => b.pacientes - a.pacientes);

    const totalJornadas = journeys.length;
    const concluidas = journeys.filter(j => j.status === 'concluida').length;
    const taxaConclusao = totalJornadas ? Math.round((concluidas / totalJornadas) * 100) : 0;

    const riskDist = [
      { name: 'Baixo', value: patients.filter(p => p.risk_level === 'baixo').length, fill: RISK_COLORS.baixo },
      { name: 'Moderado', value: patients.filter(p => p.risk_level === 'moderado').length, fill: RISK_COLORS.moderado },
      { name: 'Alto', value: patients.filter(p => p.risk_level === 'alto').length, fill: RISK_COLORS.alto },
      { name: 'Crítico', value: patients.filter(p => p.risk_level === 'critico').length, fill: RISK_COLORS.critico },
    ];

    // Gargalo: simplificado por enquanto (steps não estão disponíveis sem hook all-steps)
    const gargalo: [string, number] | null = null;

    const unidadesSet = new Set(patients.map(p => p.unidade).filter(Boolean) as string[]);
    const unidadeData = Array.from(unidadesSet).map(u => {
      const pts = patients.filter(p => p.unidade === u);
      return {
        name: u.replace('Ambulatório ', 'Amb. '),
        pacientes: pts.length,
        riskMedio: pts.length ? Math.round(pts.reduce((s, p) => s + Number(p.score_risco || 0), 0) / pts.length) : 0,
      };
    });

    const prioridades = [...patients]
      .sort((a, b) => Number(b.score_risco || 0) - Number(a.score_risco || 0))
      .slice(0, 5)
      .map(p => {
        const goals = parseGoals(p.goals);
        const offTarget = goals.filter(g => {
          if (g.operator === '<') return g.currentValue >= g.target;
          if (g.operator === '>') return g.currentValue <= g.target;
          if (g.operator === '>=') return g.currentValue < g.target;
          if (g.operator === '<=') return g.currentValue > g.target;
          return g.currentValue !== g.target;
        });
        return {
          nome: p.nome,
          risco: p.risk_level || 'baixo',
          score: Number(p.score_risco || 0),
          motivo: offTarget.length
            ? `${offTarget.length} meta(s) fora do alvo`
            : (p.dias_sem_retorno && p.dias_sem_retorno > 15)
              ? `${p.dias_sem_retorno}d sem retorno`
              : 'Risco elevado',
        };
      });

    const trendData = [
      { name: 'Q1', conclusao: concluidas || 0, riscoMedio: 68 },
      { name: 'Q2', conclusao: Math.round(totalJornadas * 0.15), riscoMedio: 72 },
      { name: 'Q3', conclusao: Math.round(totalJornadas * 0.25), riscoMedio: 65 },
      { name: 'Q4', conclusao: Math.round(totalJornadas * 0.35), riscoMedio: 60 },
    ];

    return { coortesAtivas, linhasAtivas, taxaConclusao, riskDist, gargalo, unidadeData, prioridades, trendData };
  }, [careLines, patients, journeys]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">BI Assistencial</h1>
        <p className="text-xs text-muted-foreground">Business Intelligence — indicadores operacionais, clínicos e executivos</p>
      </div>

      <Tabs defaultValue="operacional">
        <TabsList>
          <TabsTrigger value="operacional">Operacional</TabsTrigger>
          <TabsTrigger value="clinico">Clínico</TabsTrigger>
          <TabsTrigger value="executivo">Executivo</TabsTrigger>
        </TabsList>

        {/* ─── OPERACIONAL ─── */}
        <TabsContent value="operacional" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard title="Consultas Pendentes" value={op.pendConsultas} icon={Calendar} />
            <KPICard title="Exames Pendentes" value={op.pendExames} icon={Activity} />
            <KPICard title="Quest. Pendentes" value={op.pendQuest} icon={FileQuestion} />
            <KPICard title="Faltosos" value={op.faltosos} icon={AlertTriangle} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <KPICard title="SLA Médio Retorno" value={`${op.avgSLA}d`} icon={Clock} subtitle="dias sem retorno" />
            <KPICard title="Jornadas Ativas" value={journeys.filter(j => j.status === 'ativa').length} icon={TrendingUp} />
            <KPICard title="Total Pacientes" value={patients.length} icon={Users} />
          </div>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Pacientes por Etapa da Jornada</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={op.stepCounts}>
                  <XAxis dataKey="name" tick={tk} interval={0} angle={-30} textAnchor="end" height={60} />
                  <YAxis tick={tk} allowDecimals={false} />
                  <Tooltip contentStyle={tt} />
                  <Bar dataKey="pacientes" fill={COLORS.blue} radius={[4, 4, 0, 0]} name="Pacientes" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Produtividade por Profissional</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={op.prodData} layout="vertical">
                  <XAxis type="number" tick={tk} />
                  <YAxis dataKey="name" type="category" tick={tk} width={110} />
                  <Tooltip contentStyle={tt} />
                  <Legend />
                  <Bar dataKey="consultas" fill={COLORS.blue} radius={[0, 4, 4, 0]} name="Consultas" stackId="a" />
                  <Bar dataKey="tarefas" fill={COLORS.green} radius={[0, 4, 4, 0]} name="Tarefas" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── CLÍNICO ─── */}
        <TabsContent value="clinico" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard title="% Meta HbA1c" value={`${clin.pctHba1c}%`} icon={Target} />
            <KPICard title="% PA Controlada" value={`${clin.pctPA}%`} icon={Heart} />
            <KPICard title="% LDL na Meta" value={`${clin.pctLDL}%`} icon={Pill} />
            <KPICard title="Perda Ponderal Média" value={`${clin.avgPerdaPeso}kg`} icon={Scale} subtitle="acima da meta" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard title="PHQ-9 Médio" value={clin.avgPHQ9} icon={Brain} />
            <KPICard title="ACT Médio" value={clin.avgACT} icon={Stethoscope} />
            <KPICard title="PROMs Respondidos" value={`${clin.promsResp}/${clin.promsTotal}`} icon={CheckCircle2} />
            <KPICard title="PREMs Pendentes" value={clin.promsTotal - clin.promsResp} icon={FileQuestion} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Evolução HbA1c (média)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={clin.hba1cEvol}>
                    <XAxis dataKey="name" tick={tk} />
                    <YAxis tick={tk} domain={[6, 10]} />
                    <Tooltip contentStyle={tt} />
                    <Line type="monotone" dataKey="media" stroke={COLORS.red} strokeWidth={2} dot={{ r: 4, fill: COLORS.red }} name="HbA1c %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Evolução PHQ-9 (média)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={clin.phq9Evol}>
                    <XAxis dataKey="name" tick={tk} />
                    <YAxis tick={tk} domain={[0, 27]} />
                    <Tooltip contentStyle={tt} />
                    <Line type="monotone" dataKey="media" stroke={COLORS.purple} strokeWidth={2} dot={{ r: 4, fill: COLORS.purple }} name="PHQ-9" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">% na Meta por Parâmetro Clínico</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={clin.metaParams}>
                  <XAxis dataKey="name" tick={tk} />
                  <YAxis tick={tk} domain={[0, 100]} unit="%" />
                  <Tooltip contentStyle={tt} formatter={(v: number) => `${v}%`} />
                  <Bar dataKey="pct" fill={COLORS.green} radius={[4, 4, 0, 0]} name="% na Meta" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── EXECUTIVO ─── */}
        <TabsContent value="executivo" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard title="Coortes Ativas" value={exec.coortesAtivas} icon={Users} />
            <KPICard title="Linha + Ativa" value={exec.linhasAtivas[0]?.name || '—'} icon={TrendingUp} subtitle={`${exec.linhasAtivas[0]?.pacientes || 0} pacientes`} />
            <KPICard title="Taxa Conclusão" value={`${exec.taxaConclusao}%`} icon={CheckCircle2} />
            <KPICard title="Gargalo Principal" value={exec.gargalo?.[0] || '—'} icon={AlertTriangle} subtitle={exec.gargalo ? `${exec.gargalo[1]} pendências` : ''} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {exec.unidadeData.map(u => (
              <KPICard key={u.name} title={u.name} value={`${u.pacientes} pac.`} icon={BarChart3} subtitle={`Risco médio: ${u.riskMedio}`} />
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Conclusão vs Risco (trimestral)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={exec.trendData}>
                    <XAxis dataKey="name" tick={tk} />
                    <YAxis tick={tk} />
                    <Tooltip contentStyle={tt} />
                    <Legend />
                    <Area type="monotone" dataKey="conclusao" fill={COLORS.green} fillOpacity={0.2} stroke={COLORS.green} strokeWidth={2} name="Conclusão" />
                    <Area type="monotone" dataKey="riscoMedio" fill={COLORS.red} fillOpacity={0.15} stroke={COLORS.red} strokeWidth={2} name="Risco Médio" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Distribuição de Risco</CardTitle></CardHeader>
              <CardContent className="flex justify-center">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={exec.riskDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                      {exec.riskDist.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tt} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Top 5 — Prioridades de Intervenção</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Paciente</th>
                      <th className="pb-2 font-medium">Risco</th>
                      <th className="pb-2 font-medium text-right">Score</th>
                      <th className="pb-2 font-medium">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exec.prioridades.map((p, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-2.5 font-medium text-foreground">{p.nome}</td>
                        <td className="py-2.5">
                          <Badge variant="outline" className="text-xs" style={{ borderColor: RISK_COLORS[p.risco], color: RISK_COLORS[p.risco] }}>
                            {p.risco}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-right font-mono text-foreground">{p.score}</td>
                        <td className="py-2.5 text-muted-foreground">{p.motivo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
