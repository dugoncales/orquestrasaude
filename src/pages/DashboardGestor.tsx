import { KPICard } from '@/components/shared/KPICard';
import { JourneyFunnel } from '@/components/shared/JourneyFunnel';
import { RiskSemaphore } from '@/components/shared/RiskSemaphore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GitBranch, Target, AlertTriangle, BarChart3, TrendingUp } from 'lucide-react';
import { careLines } from '@/data/care-lines';
import { mockPatients } from '@/data/mock-patients';
import { isOutOfTarget } from '@/components/shared/GoalProgress';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const patientsByLine = careLines.map(l => ({ name: l.name.split(' ')[0], pacientes: l.patientCount, adesao: l.avgAdherence }));

// % em meta por parâmetro principal
const goalMetrics = [
  { name: 'HbA1c < 7%', emMeta: 42, total: 68 },
  { name: 'PA < 130/80', emMeta: 55, total: 85 },
  { name: 'LDL < 100', emMeta: 38, total: 60 },
  { name: 'PHQ-9 < 10', emMeta: 12, total: 18 },
  { name: 'ACT ≥ 20', emMeta: 8, total: 15 },
];
const goalData = goalMetrics.map(g => ({ name: g.name, pct: Math.round((g.emMeta / g.total) * 100) }));

// Coortes prioritárias
const priorityCohorts = mockPatients
  .filter(p => p.riskLevel === 'critico' || p.riskLevel === 'alto')
  .sort((a, b) => b.scoreRisco - a.scoreRisco);

export default function DashboardGestor() {
  const totalPatients = careLines.reduce((s, l) => s + l.patientCount, 0);
  const patientsOutOfGoal = mockPatients.filter(p => p.goals.some(g => isOutOfTarget(g))).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Painel Executivo</h1>
        <p className="text-xs text-muted-foreground">Gargalos, coortes prioritárias e indicadores de meta</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard title="Total Pacientes" value={totalPatients} icon={Users} trend={{ value: 8, positive: true }} />
        <KPICard title="Linhas Ativas" value={careLines.length} icon={GitBranch} />
        <KPICard title="Fora da Meta" value={patientsOutOfGoal} icon={AlertTriangle} subtitle="precisam de ação" />
        <KPICard title="Taxa Adesão" value="74%" icon={Target} trend={{ value: 3, positive: true }} />
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Funil de jornadas com gargalos */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Funil de Jornadas
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">Vermelho = tempo acima do SLA</p>
          </CardHeader>
          <CardContent>
            <JourneyFunnel />
          </CardContent>
        </Card>

        {/* % em meta */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> % Pacientes em Meta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={goalData} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tick={{ fill: 'hsl(215,15%,50%)', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fill: 'hsl(215,15%,50%)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'hsl(220,18%,12%)', border: '1px solid hsl(220,14%,16%)', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                <ReferenceLine x={70} stroke="hsl(152,69%,40%)" strokeDasharray="3 3" label={{ value: '70%', fill: 'hsl(152,69%,40%)', fontSize: 10 }} />
                <Bar dataKey="pct" fill="hsl(355,86%,52%)" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pacientes por linha */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Pacientes por Linha</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={patientsByLine}>
                <XAxis dataKey="name" tick={{ fill: 'hsl(215,15%,50%)', fontSize: 10 }} />
                <YAxis tick={{ fill: 'hsl(215,15%,50%)', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: 'hsl(220,18%,12%)', border: '1px solid hsl(220,14%,16%)', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                <Bar dataKey="pacientes" fill="hsl(213,94%,56%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Coortes prioritárias */}
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
                <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <RiskSemaphore level={p.riskLevel} score={p.scoreRisco} />
                    <div>
                      <p className="text-xs font-medium text-foreground">{p.nome}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {outGoals.length > 0 ? outGoals.map(g => `${g.label}: ${g.currentValue}${g.unit}`).join(' · ') : 'Em meta'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
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
      </div>
    </div>
  );
}
