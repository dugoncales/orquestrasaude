import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KPICard } from '@/components/shared/KPICard';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Users, Target, TrendingUp, Clock, Calendar, Activity,
  AlertTriangle, CheckCircle2, Brain, Heart, Scale, Pill,
  BarChart3, FileQuestion, Stethoscope,
} from 'lucide-react';
import { mockPatients } from '@/data/mock-patients';
import {
  mockJourneys, mockAppointments, mockExams, mockTasks,
  mockQuestionnaireResponses, mockParameterRecords,
} from '@/data/mock-data';
import { careLines } from '@/data/care-lines';

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

export default function BI() {
  // ─── OPERACIONAL ───
  const op = useMemo(() => {
    const stepCounts = defaultSteps.map((name, i) => ({
      name,
      pacientes: mockJourneys.filter(j => j.currentStepIndex === i).length,
    }));

    const pendConsultas = mockAppointments.filter(a => a.status === 'agendada').length;
    const pendExames = mockExams.filter(e => ['solicitado', 'atrasado'].includes(e.status)).length;
    const pendQuest = mockQuestionnaireResponses.filter(q => ['pendente', 'atrasado'].includes(q.status)).length;
    const faltosos = mockAppointments.filter(a => a.status === 'faltou').length;

    const avgSLA = Math.round(
      mockPatients.reduce((s, p) => s + (p.diasSemRetorno || 0), 0) / mockPatients.length
    );

    // produtividade por profissional
    const profMap: Record<string, { consultas: number; tarefas: number }> = {};
    mockAppointments.forEach(a => {
      if (!profMap[a.profissional]) profMap[a.profissional] = { consultas: 0, tarefas: 0 };
      profMap[a.profissional].consultas++;
    });
    mockTasks.forEach(t => {
      if (!profMap[t.responsavel]) profMap[t.responsavel] = { consultas: 0, tarefas: 0 };
      profMap[t.responsavel].tarefas++;
    });
    const prodData = Object.entries(profMap).map(([name, v]) => ({
      name: name.length > 14 ? name.slice(0, 14) + '…' : name,
      consultas: v.consultas,
      tarefas: v.tarefas,
    }));

    return { stepCounts, pendConsultas, pendExames, pendQuest, faltosos, avgSLA, prodData };
  }, []);

  // ─── CLÍNICO ───
  const clin = useMemo(() => {
    const goalsAll = mockPatients.flatMap(p => p.goals);
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

    // peso: média de perda
    const pesoGoals = goalsAll.filter(g => g.field === 'peso');
    const avgPerdaPeso = pesoGoals.length
      ? (pesoGoals.reduce((s, g) => s + (g.currentValue - g.target), 0) / pesoGoals.length).toFixed(1)
      : '0';

    // PHQ-9 médio
    const phq9Goals = goalsAll.filter(g => g.field === 'phq9');
    const avgPHQ9 = phq9Goals.length
      ? (phq9Goals.reduce((s, g) => s + g.currentValue, 0) / phq9Goals.length).toFixed(0)
      : '—';

    // ACT médio
    const actGoals = goalsAll.filter(g => g.field === 'act');
    const avgACT = actGoals.length
      ? (actGoals.reduce((s, g) => s + g.currentValue, 0) / actGoals.length).toFixed(0)
      : '—';

    const promsResp = mockQuestionnaireResponses.filter(q => q.status === 'respondido').length;
    const promsTotal = mockQuestionnaireResponses.length;

    // evolução HbA1c
    const hba1cRecords = mockParameterRecords.filter(r => r.field === 'hba1c');
    const dateMap = new Map<string, number[]>();
    hba1cRecords.forEach(r => {
      const q = r.date.slice(0, 7);
      if (!dateMap.has(q)) dateMap.set(q, []);
      dateMap.get(q)!.push(r.value);
    });
    const hba1cEvol = Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        name: date.replace(/^\d{4}-/, '').replace('01', 'Jan').replace('04', 'Abr').replace('07', 'Jul').replace('10', 'Out'),
        media: +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1),
      }));

    // evolução PHQ-9
    const phq9Records = mockParameterRecords.filter(r => r.field === 'phq9');
    const phq9Map = new Map<string, number[]>();
    phq9Records.forEach(r => {
      const q = r.date.slice(0, 7);
      if (!phq9Map.has(q)) phq9Map.set(q, []);
      phq9Map.get(q)!.push(r.value);
    });
    const phq9Evol = Array.from(phq9Map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        name: date.replace(/^\d{4}-/, '').replace('01', 'Jan').replace('04', 'Abr').replace('07', 'Jul').replace('10', 'Out'),
        media: +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1),
      }));

    // % na meta por parâmetro
    const metaParams = [
      { name: 'HbA1c', pct: pctHba1c },
      { name: 'PA', pct: pctPA },
      { name: 'LDL', pct: pctLDL },
      { name: 'Peso', pct: goalsByField('peso') },
      { name: 'PHQ-9', pct: goalsByField('phq9') },
      { name: 'ACT', pct: goalsByField('act') },
    ];

    return { pctHba1c, pctPA, pctLDL, avgPerdaPeso, avgPHQ9, avgACT, promsResp, promsTotal, hba1cEvol, phq9Evol, metaParams };
  }, []);

  // ─── EXECUTIVO ───
  const exec = useMemo(() => {
    const coortesAtivas = careLines.length;
    const linhasAtivas = careLines.map(cl => ({
      name: cl.name,
      pacientes: mockPatients.filter(p => p.linhasAtivas.includes(cl.id)).length,
    })).sort((a, b) => b.pacientes - a.pacientes);

    const totalJornadas = mockJourneys.length;
    const concluidas = mockJourneys.filter(j => j.status === 'concluida').length;
    const taxaConclusao = totalJornadas ? Math.round((concluidas / totalJornadas) * 100) : 0;

    // distribuição de risco
    const riskDist = [
      { name: 'Baixo', value: mockPatients.filter(p => p.riskLevel === 'baixo').length, fill: RISK_COLORS.baixo },
      { name: 'Moderado', value: mockPatients.filter(p => p.riskLevel === 'moderado').length, fill: RISK_COLORS.moderado },
      { name: 'Alto', value: mockPatients.filter(p => p.riskLevel === 'alto').length, fill: RISK_COLORS.alto },
      { name: 'Crítico', value: mockPatients.filter(p => p.riskLevel === 'critico').length, fill: RISK_COLORS.critico },
    ];

    // gargalos: etapa com mais pendências
    const stepPend: Record<string, number> = {};
    mockJourneys.forEach(j => {
      j.steps.forEach(s => {
        if (s.status === 'atrasado' || s.pendencias.length > 0) {
          stepPend[s.name] = (stepPend[s.name] || 0) + s.pendencias.length + (s.status === 'atrasado' ? 1 : 0);
        }
      });
    });
    const gargalo = Object.entries(stepPend).sort(([, a], [, b]) => b - a)[0];

    // desempenho por unidade
    const unidades = [...new Set(mockPatients.map(p => p.unidade))];
    const unidadeData = unidades.map(u => {
      const pts = mockPatients.filter(p => p.unidade === u);
      return {
        name: u.replace('Ambulatório ', 'Amb. '),
        pacientes: pts.length,
        riskMedio: Math.round(pts.reduce((s, p) => s + p.scoreRisco, 0) / pts.length),
      };
    });

    // top 5 prioridades
    const prioridades = [...mockPatients]
      .sort((a, b) => b.scoreRisco - a.scoreRisco)
      .slice(0, 5)
      .map(p => {
        const offTarget = p.goals.filter(g => {
          if (g.operator === '<') return g.currentValue >= g.target;
          if (g.operator === '>') return g.currentValue <= g.target;
          if (g.operator === '>=') return g.currentValue < g.target;
          if (g.operator === '<=') return g.currentValue > g.target;
          return g.currentValue !== g.target;
        });
        return {
          nome: p.nome,
          risco: p.riskLevel,
          score: p.scoreRisco,
          motivo: offTarget.length
            ? `${offTarget.length} meta(s) fora do alvo`
            : p.diasSemRetorno && p.diasSemRetorno > 15
              ? `${p.diasSemRetorno}d sem retorno`
              : 'Risco elevado',
        };
      });

    // conclusão vs risco ao longo do tempo (simulado por trimestre)
    const trendData = [
      { name: 'Q1', conclusao: concluidas || 0, riscoMedio: 68 },
      { name: 'Q2', conclusao: Math.round(totalJornadas * 0.15), riscoMedio: 72 },
      { name: 'Q3', conclusao: Math.round(totalJornadas * 0.25), riscoMedio: 65 },
      { name: 'Q4', conclusao: Math.round(totalJornadas * 0.35), riscoMedio: 60 },
    ];

    return { coortesAtivas, linhasAtivas, taxaConclusao, riskDist, gargalo, unidadeData, prioridades, trendData };
  }, []);

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
            <KPICard title="Jornadas Ativas" value={mockJourneys.filter(j => j.status === 'ativa').length} icon={TrendingUp} />
            <KPICard title="Total Pacientes" value={mockPatients.length} icon={Users} />
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
